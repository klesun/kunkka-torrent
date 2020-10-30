const torrentStream = require('torrent-stream');
const {timeout} = require('klesun-node-tools/src/Lang.js');

type BaseItemStatus = {
    infoHash: string,
    status: string,
    msWaited: number,
};

type ItemStatus = BaseItemStatus & ({
    status: 'ERROR',
    message: string,
} | {
    status: 'META_AVAILABLE',
    metaInfo: TorrentInfo,
} | {
    status: 'SWARM_UPDATE',
    swarmInfo: {
        seederWires: number,
        otherWires: number,
        peers: number,
    },
} | {
    status: 'TIMEOUT',
});

export const shortenTorrentInfo = (torrent: any) => ({
    name: torrent.name,
    length: torrent.length,
    files: torrent.files.map(f => ({
        path: f.path, length: f.length,
    })),
});

export type TorrentInfo = ReturnType<typeof shortenTorrentInfo>;

const MAX_META_WAIT_SECONDS = 30;

const ScanInfoHashStatus = (infoHashes: string[], itemCallback: (status: ItemStatus) => void) => {
    for (const infoHash of infoHashes) {
        if (!infoHash.match(/^[a-fA-F0-9]{40}$/)) {
            throw new Error('Invalid info hash format - ' + infoHash);
        }
    }

    // TODO: chunk, network starts queueing them when
    //  you schedule real big amount, like 600 at once
    for (const infoHash of infoHashes) {
        const startedMs = Date.now();
        const engine = torrentStream('magnet:?xt=urn:btih:' + infoHash);
        const whenMeta = new Promise<TorrentInfo>(resolve => {
            engine.on('torrent', async (torrent) => {
                resolve(shortenTorrentInfo(torrent));
            });
        });
        timeout(MAX_META_WAIT_SECONDS, whenMeta)
            .then(metaInfo => {
                itemCallback({
                    infoHash: infoHash,
                    status: 'META_AVAILABLE',
                    msWaited: (Date.now() - startedMs),
                    metaInfo: metaInfo,
                });
            })
            .catch(exc => {
                if (exc.httpStatusCode === 408) {
                    itemCallback({
                        infoHash: infoHash,
                        status: 'TIMEOUT',
                        msWaited: (Date.now() - startedMs),
                    });
                } else {
                    itemCallback({
                        infoHash: infoHash,
                        status: 'ERROR',
                        msWaited: (Date.now() - startedMs),
                        message: exc + '',
                    });
                }
            })
            .finally(() => engine.destroy());
    }
};

export default ScanInfoHashStatus;