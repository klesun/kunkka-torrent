import * as http from "http";
import * as http2 from "http2";
import * as fs from "fs";
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
        params.rs.setHeader("content-type", "application/json");
        params.rs.end(JSON.stringify({ error: exc + "", stack: exc?.stack }));
        const msg = "kunkka-torrent HTTP request " + params.rq.url + " " + " failed";
        console.error(msg);
        console.error(exc);
        console.error(exc?.stack);
    });
};

const CERT_DIR = "/etc/letsencrypt/live/kunkka.klesun.net";

/** @param rootPath - file system path matching the root of the website hosting this request */
const Server = async (rootPath: string) => {
    const api = Api();
    const certExists = fs.existsSync(CERT_DIR + "/fullchain.pem");

    if (certExists) {
        const tlsOptions = {
            cert: fs.readFileSync(CERT_DIR + "/fullchain.pem"),
            key:  fs.readFileSync(CERT_DIR + "/privkey.pem"),
            allowHTTP1: true,
        };
        const certifiedServer = http2
            .createSecureServer(tlsOptions, (rq, rs) => handleRq({ rq, rs, rootPath, api }))
            .on("error", (err: NodeJS.ErrnoException) => {
                if (err.code !== "EPIPE") {
                    console.error("http2 server error", err);
                }
            })
            .on("sessionError", (err: NodeJS.ErrnoException) => {
                if (err.code !== "EPIPE") {
                    console.error("http2 session error", err);
                }
            })
            .listen(443, "0.0.0.0", () => {
                console.log("listening ssl kunkka-torrent requests on https://kunkka.klesun.net " + process.env.WEBSITE_SITE_NAME);
            });
    }
    const server = http
        .createServer((rq, rs) => handleRq({ rq, rs, rootPath, api }))
        .listen(HTTP_PORT, "0.0.0.0", () => {
            console.log("listening kunkka-torrent requests on http://localhost:" + HTTP_PORT + " " + process.env.WEBSITE_SITE_NAME);
        });
};

export default Server;
