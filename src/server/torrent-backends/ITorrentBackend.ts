import * as os from "node:os";

export type SwarmSummary = {
    downloaded: number,
    downloadSpeed: number,
    peers: number,
    ready: boolean,
    paused: boolean,
};

export interface ITorrentFile {
    name: string,
    path: string,
    length: number,
    createReadStream(opts?: { start?: number, end?: number }): NodeJS.ReadableStream,
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
