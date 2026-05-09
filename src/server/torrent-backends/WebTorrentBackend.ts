import WebTorrent from "webtorrent";
import { trackerRecords } from "../actions/ScrapeTrackersSeedInfo";
import type { TorrentEngineLike, SwarmSummary } from "./ITorrentBackend";
import  { IS_P2P_FORBIDDEN } from "./ITorrentBackend";
import { IS_AZURE_ENV } from "../Constants.ts";
import { Forbidden } from "@curveball/http-errors";

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

export class WebTorrentBackend {
    private readonly client: WebTorrent.Instance;
    private readonly infoHashToTorrent: Record<string, WebTorrent.Torrent> = {};
    private readonly infoHashToWhenReady: Record<string, Promise<TorrentEngineLike>> = {};

    constructor() {
        this.client = new WebTorrent();
    }

    prepareTorrentStream(infoHash: string): Promise<TorrentEngineLike> {
        if (IS_P2P_FORBIDDEN) {
            throw new Forbidden("P2P operations are not allowed on this environment");
        }
        const trackers = trackerRecords.map(t => t.url);
        if (!this.infoHashToWhenReady[infoHash]) {
            const magnetLink = "magnet:?xt=urn:btih:" + infoHash +
                trackers.map(tr => "&tr=" + encodeURIComponent(tr)).join("");
            this.infoHashToWhenReady[infoHash] = new Promise<TorrentEngineLike>(resolve => {
                this.infoHashToTorrent[infoHash] = this.client.add(magnetLink, {
                    announce: trackers.length !== 0 ? trackers : trackerRecords.map(t => t.url),
                    path: DOWNLOADS_PATH,
                    deselect: true,
                }, torrent => {
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
        this.prepareTorrentStream(infoHash).catch(() => {});
        const torrent = this.infoHashToTorrent[infoHash];
        return {
            downloaded: torrent.downloaded,
            downloadSpeed: torrent.downloadSpeed,
            peers: torrent.numPeers,
            ready: torrent.ready,
            paused: torrent.paused,
        };
    }
}
