import * as http from "http";
import type { HandleHttpParams } from "./HandleHttpRequest";
import HandleHttpRequest from "./HandleHttpRequest";
import Api from "./Api";
import { HTTP_PORT } from "./Constants";
import { HttpErrorBase } from "@curveball/http-errors";

const handleRq = (params: HandleHttpParams) => {
    HandleHttpRequest(params).catch((exc: null | undefined | { message?: unknown, stack?: unknown }) => {
        if (exc instanceof HttpErrorBase) {
            params.rs.statusCode = exc.httpStatus;
        } else {
            params.rs.statusCode = 500;
        }
        params.rs.statusMessage = (String((exc || {}).message || exc) || "(empty error)")
            // sanitize, as statusMessage seems to not allow special characters
            .slice(0, 300).replace(/[^ -~]/g, "?");
        params.rs.setHeader("content-type", "application/json");
        params.rs.end(JSON.stringify({ error: exc + "", stack: exc?.stack }));
        const msg = "kunkka-torrent HTTP request " + params.rq.url + " " + " failed";
        console.error(msg);
        console.error(exc);
        console.error(exc?.stack);
    });
};

/** @param rootPath - file system path matching the root of the website hosting this request */
const Server = async (rootPath: string) => {
    const api = Api();
    const server = http
        .createServer((rq, rs) => handleRq({ rq, rs, rootPath, api }))
        .listen(HTTP_PORT, "0.0.0.0", () => {
            console.log("listening kunkka-torrent requests on http://localhost:" + HTTP_PORT + " " + process.env.WEBSITE_SITE_NAME);
        });
};

export default Server;
