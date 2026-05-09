import type * as http from "http";
import { BadGateway } from "@curveball/http-errors";
import { readPost } from "./utils/Http";
import { fail } from "node:assert";
import type { JsonObject } from "@mhc/utils/types/utility.ts";

type ErrorLike = Error | { message?: unknown, cause?: ErrorLike };

/**
 * SQL errors in particular have several levels of nesting with the
 * actual error message being in the very bottom of cause chain
 */
export function getDeepestCause(error: ErrorLike) {
    const occurrences = new Set<ErrorLike>([error]);
    while (error.cause) {
        if (occurrences.has(error.cause)) {
            // circular reference
            break;
        }
        occurrences.add(error.cause);
        error = error.cause;
    }
    return error;
}

function stringifyErrorShallow(error: unknown) {
    if (!error) {
        return "(empty error)";
    } else if (
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message !== ""
    ) {
        const realCause = getDeepestCause(error);
        let prefix = "";
        if (realCause !== error) {
            prefix = stringifyErrorShallow(realCause) + "; which caused: ";
        }
        return prefix + String(error.message);
    } else if (typeof error === "string") {
        return error;
    } else if (error + "" !== "[object Object]") {
        return error + "";
    } else {
        return "Unknown format error: " + JSON.stringify(error);
    }
}

/**
 * many libraries throw objects that do not extend Error, this function attempts
 * to extract the message from any kind of error object using popular conventions
 * like having `toString()` implementation or `message` property
 * @return {string}
 */
function stringifyError(error: unknown) {
    if (error instanceof AggregateError) {
        return error.errors.map(stringifyErrorShallow).join("\n");
    } else {
        return stringifyErrorShallow(error);
    }
}

/**
 * a mapping to the Web API of qbittorrent
 * needed to proxy requests to the plugin search from trackers
 * aggregation, as this feature is ridiculously useful and convenient
 *
 * @see https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-4.1)#get-torrent-list
 */
const Qbtv2 = ({ port = 44011 } = {}) => {
    return {
        search: {
            /** @see https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-4.1)#start-search */
            start: async (rq: http.IncomingMessage, rs: http.ServerResponse) => {
                const url = "http://127.0.0.1:" + port + "/api/v2/search/start";

                const params: RequestInit = {
                    // needed for cookie, too lazy to parse it on node's side
                    headers: {
                        "content-type": rq.headers["content-type"] ?? fail(),
                    },
                    method: "POST",
                    body: await readPost(rq),
                    credentials: "include",
                };
                let fetchRs: Response;
                try {
                    fetchRs = await fetch(url, params);
                } catch (error) {
                    throw new BadGateway("Transport error while connecting to qbt: " + stringifyError(error));
                }
                const body = await fetchRs.text();
                let bodyParsed: JsonObject;
                try {
                    bodyParsed = JSON.parse(body) as JsonObject;
                } catch (exc) {
                    throw new BadGateway("Failed to parse qbt json response - " + body);
                }
                return { ...bodyParsed, cookie: fetchRs.headers.get("set-cookie") };
            },
            /** @see https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-4.1)#get-search-results */
            results: async (rq: http.IncomingMessage, rs: http.ServerResponse) => {
                const rqBody = await readPost(rq);
                const bodyData = new URLSearchParams(rqBody);
                const url = "http://127.0.0.1:" + port + "/api/v2/search/results";
                const fetchRs = await fetch(url, {
                    headers: {
                        cookie: (bodyData.get("cookie") || rq.headers.cookie) ?? fail(),
                    },
                    method: "POST",
                    body: bodyData,
                    credentials: "include",
                });
                const body = await fetchRs.text();
                try {
                    return JSON.parse(body);
                } catch (exc) {
                    throw new BadGateway("Failed to parse qbt json response - " + body);
                }
            },
        },
    };
};

export default Qbtv2;
