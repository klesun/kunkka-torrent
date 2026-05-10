import type * as http from "http";

export interface CompatHttpRs extends NodeJS.WritableStream {
    setHeader(name: string, value: string | number | string[]): unknown;
    statusCode: number;
    statusMessage?: string;
    headersSent: boolean;
    writeHead(statusCode: number, headers?: http.OutgoingHttpHeaders): unknown;
}

export interface CompatHttpRq {
    url?: string;
    headers: http.IncomingHttpHeaders;
    method?: string;
    socket?: { setTimeout(timeout: number): unknown } | null;
    on(event: "data", listener: (chunk: Buffer | string) => void): unknown;
    on(event: "end" | "close", listener: () => void): unknown;
    on(event: "error", listener: (err: Error) => void): unknown;
    on(event: string, listener: (...args: unknown[]) => void): unknown;
}

export type Primitive = number | string | boolean | null;
export type SerialData = Primitive | { [k: string]: SerialData } | { [k: number]: SerialData } | SerialData[];
