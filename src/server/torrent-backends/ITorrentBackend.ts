export type SwarmSummary = {
    downloaded: number,
    downloadSpeed: number,
    peers: number,
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

export type TorrentMainInfo = {
    name: string,
    length: number,
    files: readonly { path: string, length: number }[],
};

export const shortenFileInfo = (f: { path: string, length: number }): ShortTorrentFileInfo => ({
    path: f.path, length: f.length,
});

export const shortenTorrentInfo = (torrent: TorrentMainInfo) => ({
    name: torrent.name,
    length: torrent.length,
    files: torrent.files.map(shortenFileInfo),
});

export type TorrentInfo = ReturnType<typeof shortenTorrentInfo>;

export interface ITorrentBackend {
    /** add to the persistent streaming client, resolve when metadata + files are ready */
    prepareTorrentStream(infoHash: string, trackers: string[]): Promise<TorrentEngineLike>,
    swarmSummary(infoHash: string): SwarmSummary,
    startMeta(infoHash: string): { whenMeta: Promise<TorrentInfo>, cancel(): void },
}
