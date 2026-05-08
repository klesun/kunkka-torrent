import type { TorrentMainInfo } from "./ITorrentBackend";
import { trackerRecords } from "../actions/ScrapeTrackersSeedInfo";
import type { ITorrentBackend, ITorrentFile, TorrentEngineLike, SwarmSummary } from "./ITorrentBackend";

const torrentStream = require("torrent-stream");

type SwarmWire = {
    downloaded: number,
    /** I take it false means it's an actual seed that seeds, while true means that he is too busy or a douchebag */
    peerChoking: boolean,
    /**
     * I would consider that true means he is a leach and otherwise a seed... at least if it's true, he is
     * definitely a leach, though not sure it will ever be so, considering that we always start with 0 data
     */
    peerInterested: false,
};

interface NowadaysSwarm {
    downloaded: number,
    /** I take it, this list holds wires of peers that we managed to start exchanging data with */
    wires: SwarmWire[],
    /** Includes everything from wires + "choking" peers, that refuse to send us data */
    _peers: Record<string, { wire: SwarmWire }>,
    downloadSpeed: () => number,
    connections: unknown,
}

type NowadaysEngine = {
    infoHash: string,
    files: readonly ITorrentFile[],
    swarm: NowadaysSwarm,
    torrent: { name: string },
    listen(port?: number, callback?: () => void): void,
    destroy(callback?: () => void): void,
    on(event: "ready" | "idle", callback: () => void): void,
    on(event: "torrent", callback: (torrent: TorrentMainInfo) => void): void,
    on(event: string, callback: (...args: unknown[]) => void): void,
};

const makeSwarmSummary = (swarm: NowadaysSwarm) => {
    const seeders: { address: string, downloaded: number }[] = [];
    const chokers: { address: string, downloaded: number }[] = [];
    for (const [address, peer] of Object.entries(swarm._peers)) {
        const { wire } = peer;
        if (!wire) {
            chokers.push({ address, downloaded: 0 });
            continue;
        }
        const { downloaded, peerChoking, peerInterested } = wire;
        const record = { downloaded, address, peerInterested: peerInterested || undefined };
        if (peerChoking) {
            chokers.push(record);
        } else {
            seeders.push(record);
        }
    }
    return {
        downloaded: swarm.downloaded,
        downloadSpeed: swarm.downloadSpeed(),
        seeders: seeders.sort((a, b) => b.downloaded - a.downloaded),
        chokers: chokers.sort((a, b) => b.downloaded - a.downloaded),
        peers: Object.keys(swarm._peers).length,
    };
};

export class TorrentStreamBackend implements ITorrentBackend {
    private readonly infoHashToEngine: Record<string, NowadaysEngine> = {};
    private readonly infoHashToWhenReadyEngine: Record<string, Promise<NowadaysEngine>> = {};

    prepareTorrentStream(infoHash: string, trackers: string[]): Promise<TorrentEngineLike> {
        if (!this.infoHashToWhenReadyEngine[infoHash]) {
            const magnetLink = "magnet:?xt=urn:btih:" + infoHash +
                trackers.map(tr => "&tr=" + encodeURIComponent(tr)).join("");
            const engine: NowadaysEngine = torrentStream(magnetLink, {
                verify: false,
                tracker: true,
                trackers: trackers.length !== 0 ? trackers : trackerRecords.map(t => t.url),
            });
            engine.infoHash = infoHash;
            this.infoHashToWhenReadyEngine[infoHash] = new Promise<NowadaysEngine>(resolve => {
                engine.on("ready", () => {
                    this.infoHashToEngine[infoHash] = engine;
                    resolve(engine);
                });
            });
        }
        return this.infoHashToWhenReadyEngine[infoHash];
    }

    swarmSummary(infoHash: string): SwarmSummary {
        const engine = this.infoHashToEngine[infoHash];
        if (!engine) { throw new Error("engine not found for infoHash"); }
        return makeSwarmSummary(engine.swarm);
    }
}
