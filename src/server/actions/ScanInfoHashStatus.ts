import { backend } from "../torrent-backends/ActiveBackend";
import {shortenTorrentInfo, TorrentInfo} from "../torrent-backends/ITorrentBackend";

const { timeout } = require("klesun-node-tools/src/Utils/Lang.js");

type BaseItemStatus = {
    infoHash: string,
    status: string,
    msWaited: number,
};

export type ItemStatus = BaseItemStatus & ({
    status: "ERROR",
    message: string,
} | {
    status: "META_AVAILABLE",
    metaInfo: TorrentInfo,
} | {
    status: "SWARM_UPDATE",
    swarmInfo: {
        seederWires: number,
        otherWires: number,
        peers: number,
    },
} | {
    status: "TIMEOUT",
});

const MAX_META_WAIT_SECONDS = 45;

const ScanInfoHashStatus = ({ infoHashes, itemCallback }: {
    infoHashes: string[],
    itemCallback: (status: ItemStatus) => void,
}) => {
    for (const infoHash of infoHashes) {
        if (!infoHash.match(/^[a-fA-F0-9]{40}$/)) {
            throw new Error("Invalid info hash format - " + infoHash);
        }
    }

    // TODO: chunk, network starts queueing them when
    //  you schedule real big amount, like 600 at once
    for (const infoHash of infoHashes) {
        const startedMs = Date.now();
        const { whenMeta, cancel } = backend.startMeta(infoHash);
        timeout(MAX_META_WAIT_SECONDS, whenMeta)
            .then((metaInfo: TorrentInfo) => {
                itemCallback({
                    infoHash: infoHash,
                    status: "META_AVAILABLE",
                    msWaited: (Date.now() - startedMs),
                    metaInfo: shortenTorrentInfo(metaInfo),
                });
            })
            .catch((exc: { httpStatusCode: number }|object|string|number|undefined|boolean|null) => {
                if (exc && typeof exc === "object" && "httpStatusCode" in exc && exc.httpStatusCode === 408) {
                    itemCallback({
                        infoHash: infoHash,
                        status: "TIMEOUT",
                        msWaited: (Date.now() - startedMs),
                    });
                } else {
                    itemCallback({
                        infoHash: infoHash,
                        status: "ERROR",
                        msWaited: (Date.now() - startedMs),
                        message: exc + "",
                    });
                }
            })
            .finally(cancel);
    }
};

export default ScanInfoHashStatus;
