import WebTorrent from "webtorrent";
import type { TorrentInfo } from "./ITorrentBackend";
import { shortenTorrentInfo } from "./ITorrentBackend";
import { trackerRecords } from "../actions/ScrapeTrackersSeedInfo";
import type { ITorrentBackend, TorrentEngineLike, SwarmSummary } from "./ITorrentBackend";

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
        const tempClient = new WebTorrent();
        const whenMeta = new Promise<TorrentInfo>(resolve => {
            tempClient.add("magnet:?xt=urn:btih:" + infoHash, { deselect: true }, torrent => {
                resolve(shortenTorrentInfo({ name: torrent.name, length: torrent.length, files: torrent.files }));
            });
        });
        return { whenMeta, cancel: () => tempClient.destroy() };
    }

}
