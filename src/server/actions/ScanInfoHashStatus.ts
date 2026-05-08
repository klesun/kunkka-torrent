import type { TorrentInfo } from "../torrent-backends/ITorrentBackend";

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

