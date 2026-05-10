import type * as http from "http";
import type { CompatHttpRq, CompatHttpRs } from "./TypeDefs";
import { BadGateway } from "@curveball/http-errors";
import { readPost } from "./utils/Http";
import { fail } from "node:assert";
import type { JsonObject } from "@mhc/utils/types/utility.ts";
import { stringifyError } from "../common/typedUtils.ts";

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
            start: async (rq: CompatHttpRq, rs: CompatHttpRs) => {
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
            results: async (rq: CompatHttpRq, rs: CompatHttpRs) => {
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
