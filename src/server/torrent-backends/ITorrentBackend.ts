import * as os from "node:os";
import type { Wire } from "bittorrent-protocol";
import type { Readable } from "stream";

export type SwarmSummary = {
    downloaded: number,
    downloadSpeed: number,
    peers: number,
    ready: boolean,
    paused: boolean,
    wires: Record<string, Wire>,
    debugLogs: string[],
};

export interface ITorrentFile {
    name: string,
    path: string,
    length: number,
    createReadStream(opts?: { start?: number, end?: number }): Readable,
}

export interface TorrentEngineLike {
    torrent: { name: string },
    files: readonly ITorrentFile[],
}

export type ShortTorrentFileInfo = {
    path: string,
    length: number,
};

export const shortenFileInfo = (f: { path: string, length: number }): ShortTorrentFileInfo => ({
    path: f.path, length: f.length,
});

const computerName = os.hostname();

export const IS_P2P_FORBIDDEN = computerName === "Arturs-MacBook-Pro.local";
