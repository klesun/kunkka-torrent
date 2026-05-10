import type * as http from "http";
import type { Http2ServerRequest } from "node:http2";

export const readPost = (rq: http.IncomingMessage | Http2ServerRequest) => new Promise<string>((ok, err) => {
    if (rq.method === "POST") {
        let body = "";
        rq.on("data", (data: Buffer | string) => { body += data.toString(); });
        rq.on("error", (exc: unknown) => err(exc));
        rq.on("end", () => ok(body));
    } else {
        ok("");
    }
});
