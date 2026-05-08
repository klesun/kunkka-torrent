import type { Torrent } from "webtorrent";
import WebTorrent from "webtorrent";
import type { TorrentInfo } from "./ITorrentBackend";
import { trackerRecords } from "../actions/ScrapeTrackersSeedInfo";
import type { ITorrentBackend, TorrentEngineLike, SwarmSummary } from "./ITorrentBackend";
import { IS_AZURE_ENV } from "../Constants.ts";

declare module "webtorrent" {
    interface TorrentOptions {
        deselect?: boolean,
    }
    interface Torrent {
        wires: {
            peerId: string,
            type: "webrtc" | "tcpIncoming" | "tcpOutgoing" | "webSeed",
            amChoking: boolean,
            peerChoking: boolean,
            peerInterested: boolean,
            amInterested: boolean,
        }[],
    }
}

const DOWNLOADS_PATH = IS_AZURE_ENV
    ? "/mnt/kunkka-db-files/webtorrent-downloads"
    // language=file-reference
    : __dirname + "/" + "../../../data/webtorrent-downloads";

export class WebTorrentBackend implements ITorrentBackend {
    private readonly client: WebTorrent.Instance;
    private readonly infoHashToTorrent: Record<string, WebTorrent.Torrent> = {};
    private readonly infoHashToWhenReady: Record<string, Promise<TorrentEngineLike>> = {};

    constructor() {
        this.client = new WebTorrent();
    }

    prepareTorrentStream(infoHash: string, trackers: string[]): Promise<TorrentEngineLike> {
        if (!this.infoHashToWhenReady[infoHash]) {
            const magnetLink = "magnet:?xt=urn:btih:" + infoHash +
                trackers.map(tr => "&tr=" + encodeURIComponent(tr)).join("");
            this.infoHashToWhenReady[infoHash] = new Promise<TorrentEngineLike>(resolve => {
                this.client.add(magnetLink, {
                    announce: trackers.length !== 0 ? trackers : trackerRecords.map(t => t.url),
                    path: "/mnt/kunkka-db-files/webtorrent-downloads",
                    deselect: true,
                }, torrent => {
                    this.infoHashToTorrent[infoHash] = torrent;
                    resolve({
                        torrent: { name: torrent.name },
                        files: torrent.files,
                    });
                });
            });
        }
        return this.infoHashToWhenReady[infoHash];
    }

    swarmSummary(infoHash: string): SwarmSummary {
        const torrent = this.infoHashToTorrent[infoHash];
        if (!torrent) { throw new Error("torrent not found for infoHash"); }
        return {
            downloaded: torrent.downloaded,
            downloadSpeed: torrent.downloadSpeed,
            peers: torrent.numPeers,
        };
    }

    startMeta(infoHash: string): { whenMeta: Promise<TorrentInfo>, cancel(): void } {
        const whenMeta = new Promise<Torrent>(resolve => {
            this.client.add("magnet:?xt=urn:btih:" + infoHash, { deselect: true }, torrent => {
                resolve(torrent);
                if (!this.infoHashToWhenReady[infoHash]) {
                    this.client.remove(torrent, { destroyStore: true })
                        .catch((error) => console.warn("Failed to remove meta info torrent", torrent, error));
                }
            });
        });
        return {
            whenMeta,
            cancel: () => whenMeta.then(torrent => {
                if (!this.infoHashToWhenReady[infoHash]) {
                    return this.client.remove(torrent, { destroyStore: true });
                }
            }),
        };
    }
}
