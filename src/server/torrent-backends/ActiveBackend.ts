import { WebTorrentBackend } from "./WebTorrentBackend";
import { TorrentStreamBackend } from "./TorrentStreamBackend";

export const ACTIVE_ENGINE: "webtorrent" | "torrent-stream" = "webtorrent";

const backendInstance = ACTIVE_ENGINE === "webtorrent"
    ? new WebTorrentBackend()
    : new TorrentStreamBackend();

export const backend = backendInstance;
