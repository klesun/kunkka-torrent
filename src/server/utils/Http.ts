type ReadableRq = {
    method?: string;
    on(event: "data", listener: (chunk: Buffer | string) => void): unknown;
    on(event: "end" | "close", listener: () => void): unknown;
    on(event: "error", listener: (err: Error) => void): unknown;
    on(event: string, listener: (...args: unknown[]) => void): unknown;
};

export const readPost = (rq: ReadableRq) => new Promise<string>((ok, err) => {
    if (rq.method === "POST") {
        let body = "";
        rq.on("data", (data: Buffer | string) => { body += data.toString(); });
        rq.on("error", (exc: unknown) => err(exc));
        rq.on("end", () => ok(body));
    } else {
        ok("");
    }
});
