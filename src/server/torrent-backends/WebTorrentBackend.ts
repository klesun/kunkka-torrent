import WebTorrent from "webtorrent";
import { readdirSync } from "node:fs";
import { trackerRecords } from "../actions/ScrapeTrackersSeedInfo";
import type { TorrentEngineLike, SwarmSummary } from "./ITorrentBackend";
import  { IS_P2P_FORBIDDEN } from "./ITorrentBackend";
import { IS_AZURE_ENV } from "../Constants.ts";
import { Forbidden } from "@curveball/http-errors";
import type { Infohash } from "../../common/types.ts";
import type { Wire } from "bittorrent-protocol";
import { fail } from "node:assert";
import type { Readable } from "stream";

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
    interface TorrentFile {
        createReadStream(opts?: { start?: number, end?: number }): Readable,
    }
}

type WireExample = Wire & {
     "_events": {
         "finish": [null,null,null,null],
         "close": [null,null,null,null],
         "error": [null,null,null],
         "have": [null,null],
         "bitfield": [null,null],
     },
     "_eventsCount": 12,
     "_duplexState": 85918272,
     "_debugId": "36542b8f",
     "peerId": "2d7142353130302d756d502d39317668354d4a45",
     "peerIdBuffer": { "type":"Buffer","data":[45,113,66,53,49,48,48,45,117,109,80,45,57,49,118,104,53,77,74,69] },
     "type": "utpOutgoing" | string,
     "amChoking": true,
     "amInterested": false,
     "peerChoking": true,
     "peerInterested": false,
     "peerPieces": { "grow":50000,"buffer":{} },
     "extensions": { "extended":true,"dht":true,"fast":true },
     "peerExtensions": { "dht":true,"fast":true,"extended":true },
     "requests": [],
     "peerRequests": [],
     "extendedMapping": { "1":"ut_metadata","2":"ut_pex","3":"lt_donthave" },
     "peerExtendedMapping": { "lt_donthave":7,"share_mode":8,"upload_only":3,"ut_holepunch":4,"ut_metadata":2,"ut_pex":1 },
     "extendedHandshake": { "metadata_size":4657 },
     "peerExtendedHandshake": {},
     "hasFast": true,
     "allowedFastSet": [],
     "peerAllowedFastSet": [128,11,202,113,159],
     "_nextExt": 4,
     "uploaded": 0,
     "downloaded": 0,
     "_timeout": null,
     "_timeoutMs": 30000,
     "_timeoutExpiresAt": null,
     "_finished": false,
     "_parserSize": 67,
     "_bufferSize": 233,
     "_peEnabled": false,
     "_myPubKey": null,
     "_peerPubKey": null,
     "_sharedSecret": null,
     "_peerCryptoProvide": [],
     "_cryptoHandshakeDone": false,
     "_cryptoSyncPattern": null,
     "_waitMaxBytes": null,
     "_encryptionMethod": null,
     "_encryptGenerator": null,
     "_decryptGenerator": null,
     "_setGenerators": false,
     "_infoHash": {
         "0": 208, "1": 138, "2": 99, "3": 36, "4": 55, "5": 72, "6": 33, "7": 230, "8": 198, "9": 127, "10": 210,
         "11": 103, "12": 113, "13": 200, "14": 121, "15": 62, "16": 165, "17": 203, "18": 222, "19": 73,
     },
     "_handshakeSent": true,
     "remoteAddress": "94.224.92.197",
     "remotePort": 43154,
     "_timeoutUnref": true,
};

const DOWNLOADS_PATH = IS_AZURE_ENV
    ? "/mnt/kunkka-db-files/webtorrent-downloads"
    // language=file-reference
    : __dirname + "/" + "../../../data/webtorrent-downloads";

const DEBUG_LOG_RETENTION = 200;

export class WebTorrentBackend {
    private readonly client: WebTorrent.Instance;
    private readonly infoHashToTorrent: Record<Infohash, WebTorrent.Torrent> = {};
    private readonly infoHashToWhenReady: Record<Infohash, Promise<TorrentEngineLike>> = {};
    private readonly infoHashToAddrToWire: Map<Infohash, Map<string, Wire>> = new Map();
    private readonly debugLogs: string[] = [];

    constructor() {
        // DEBUG env var is set at docker run time so webtorrent's debug instances are
        // enabled from process start. Intercept stderr to capture their output.
        const origWrite = process.stderr.write.bind(process.stderr);
        const captureLog = (chunk: string | Uint8Array) => {
            const line = (typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"))
                .replace(/\x1B\[[0-9;]*m/g, "").trimEnd();
            if (line) {
                this.debugLogs.push(line);
                if (this.debugLogs.length > DEBUG_LOG_RETENTION * 2) {
                    this.debugLogs.splice(0, DEBUG_LOG_RETENTION);
                }
            }
        };
        (process.stderr.write as unknown as (chunk: string | Uint8Array, cb?: () => void) => boolean) =
            (chunk: string | Uint8Array, cb?: () => void) => {
                captureLog(chunk);
                return origWrite(chunk as string, cb as () => void);
            };
        this.client = new WebTorrent();
    }

    prepareTorrentStream(infoHash: Infohash): Promise<TorrentEngineLike> {
        if (IS_P2P_FORBIDDEN) {
            throw new Forbidden("P2P operations are not allowed on this environment");
        }
        const trackers = trackerRecords.map(t => t.url);
        if (!this.infoHashToWhenReady[infoHash]) {
            const magnetLink = "magnet:?xt=urn:btih:" + infoHash +
                trackers.map(tr => "&tr=" + encodeURIComponent(tr)).join("");
            this.infoHashToWhenReady[infoHash] = new Promise<TorrentEngineLike>(resolve => {
                const instance = this.client.add(magnetLink, {
                    announce: trackers.length !== 0 ? trackers : trackerRecords.map(t => t.url),
                    path: DOWNLOADS_PATH,
                    deselect: true,
                    skipVerify: true,
                }, torrent => {
                    resolve({
                        torrent: { name: torrent.name },
                        files: torrent.files,
                    });
                });
                this.infoHashToTorrent[infoHash] = instance;
                const addrToWire = new Map();
                this.infoHashToAddrToWire.set(infoHash, addrToWire);
                instance.on("wire", (wire, addr) => {
                    const typedWire = wire as WireExample;
                    const {
                        // I'm doing something really stupid here... these fields are endless
                        // if you don't remove them, JSON is so large that server dies
                        _readableState, _writableState, _ext, _buffer, ut_metadata, ut_pex, _utp, _keepAliveInterval, lt_donthave,
                        // these are not large, just useless
                        _infoHash, peerIdBuffer, _debugId, _duplexState, _timeoutUnref, _setGenerators, _decryptGenerator, _encryptGenerator, _nextExt,
                        // following may possibly be bad
                        peerPieces,
                        ...rest
                    } = typedWire;
                    addrToWire.set(addr ?? wire.peerId, rest);
                });
            });
        }
        return this.infoHashToWhenReady[infoHash];
    }

    swarmSummary(infoHash: Infohash): SwarmSummary {
        this.prepareTorrentStream(infoHash).catch(() => {});
        const torrent = this.infoHashToTorrent[infoHash];
        const allTorrents = Object.values(this.infoHashToTorrent);
        const totalPeers = allTorrents.reduce((sum, t) => sum + t.numPeers, 0);
        let openFds: number | string;
        try {
            openFds = readdirSync("/proc/self/fd").length;
        } catch {
            openFds = "n/a";
        }
        return {
            downloaded: torrent.downloaded,
            downloadSpeed: torrent.downloadSpeed,
            peers: torrent.numPeers,
            ready: torrent.ready,
            paused: torrent.paused,
            wires: Object.fromEntries((this.infoHashToAddrToWire.get(infoHash) ?? fail()).entries()),
            debugLogs: this.debugLogs,
            totalTorrents: allTorrents.length,
            totalPeers,
            openFds,
        };
    }
}
