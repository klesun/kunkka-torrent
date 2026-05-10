
// @ts-ignore
import Tracker = require("torrent-tracker");
import { JSDOM } from "jsdom";
import { stringifyError } from "../../common/typedUtils.ts";

type TrackerRecordBase = {
    url: string,
    maxHashesPerRequest: number,
};

type TrackerRecord = TrackerRecordBase & {
    instance: Tracker,
};

export const trackerRecords: TrackerRecord[] = ([
    { url: "udp://tracker.opentrackr.org:1337/announce", maxHashesPerRequest: 75 },
    { url: "udp://open.stealth.si:80/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.qu.ax:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://9.rarbg.to:2920/announce", maxHashesPerRequest: 101 },

    { url: "udp://opentor.org:2710/announce", maxHashesPerRequest: 75 },
    { url: "udp://valakas.rollo.dnsabr.com:2710/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.zerobytes.xyz:1337/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker2.dler.org:80/announce", maxHashesPerRequest: 75 },
    { url: "udp://vibe.community:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://wassermann.online:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://retracker.lanta-net.ru:2710/announce", maxHashesPerRequest: 75 },
    // {url: 'udp://tracker.openbittorrent.com:80/announce', maxHashesPerRequest: 75},
    // {url: 'udp://tracker.openbittorrent.com:6969/announce', maxHashesPerRequest: 75},
    { url: "udp://www.torrent.eu.org:451/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.torrent.eu.org:451/announce", maxHashesPerRequest: 75 },
    { url: "udp://udp-tracker.shittyurl.org:6969/announce", maxHashesPerRequest: 75 },

    { url: "udp://u.wwwww.wtf:1/announce", maxHashesPerRequest: 50 },
    { url: "http://nyaa.tracker.wf:7777/announce", maxHashesPerRequest: 50 },
    { url: "http://p4p.arenabg.com:1337/announce", maxHashesPerRequest: 50 },

    { url: "http://p4p.arenabg.com:1337/announce", maxHashesPerRequest: 50 },

    { url: "udp://tracker.internetwarriors.net:1337/announce", maxHashesPerRequest: 50 },
    { url: "udp://tracker1.bt.moack.co.kr:80/announce", maxHashesPerRequest: 50 },
    { url: "udp://explodie.org:6969/announce", maxHashesPerRequest: 50 },
    { url: "udp://u.wwwww.wtf:1/announce", maxHashesPerRequest: 50 },
    { url: "udp://tracker.coppersurfer.tk:6969/announce", maxHashesPerRequest: 50 },
    { url: "udp://tracker.leechers-paradise.org:6969/announce", maxHashesPerRequest: 50 },
    { url: "udp://exodus.desync.com:6969/announce", maxHashesPerRequest: 50 },
    { url: "udp://9.rarbg.me:2710/announce", maxHashesPerRequest: 50 },
    { url: "udp://9.rarbg.to:2710/announce", maxHashesPerRequest: 50 },
    { url: "udp://tracker.tiny-vps.com:6969/announce", maxHashesPerRequest: 50 },
    { url: "udp://open.demonii.si:1337/announce", maxHashesPerRequest: 50 },

    { url: "udp://tracker1.bt.moack.co.kr:80/announce", maxHashesPerRequest: 50 },

    { url: "udp://tracker.openbittorrent.com:80/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.openbittorrent.com:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://open.demonii.com:1337/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.dler.org:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.altrosky.cc:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.bitsearch.to:1337/announce", maxHashesPerRequest: 75 },

    { url: "udp://bt1.archive.org:6969/announce", maxHashesPerRequest: 50 },
    { url: "udp://bt2.archive.org:6969/announce", maxHashesPerRequest: 50 },
    { url: "udp://ipv4.tracker.harry.lu:80/announce", maxHashesPerRequest: 50 },

    // timeouts often
    //{url: 'udp://tracker0.ufibox.com:6969/announce', maxHashesPerRequest: 75},

    // added from ngosang/trackerslist trackers_best.txt
    { url: "udp://open.tracker.cl:1337/announce", maxHashesPerRequest: 75 }, // Chilean open tracker, long-running
    { url: "udp://open.demonii.com:1337/announce", maxHashesPerRequest: 75 }, // one of the oldest high-traffic trackers
    { url: "udp://tracker.openbittorrent.com:80/announce", maxHashesPerRequest: 75 }, // OpenBittorrent project, one of the largest public trackers
    { url: "udp://tracker.openbittorrent.com:6969/announce", maxHashesPerRequest: 75 }, // same, alternate port
    { url: "udp://tracker.dler.org:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.altrosky.cc:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.bitsearch.to:1337/announce", maxHashesPerRequest: 75 }, // run by bitsearch.to search engine
    { url: "udp://tracker.theoks.net:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.gmi.gd:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.fnix.net:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker-udp.gbitt.info:80/announce", maxHashesPerRequest: 75 }, // gbitt.info UDP endpoint
    { url: "udp://vito-tracker.space:6969/announce", maxHashesPerRequest: 75 }, // vito-tracker (same tracker on two domains)
    { url: "udp://vito-tracker.duckdns.org:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://tracker.004430.xyz:1337/announce", maxHashesPerRequest: 75 },
    { url: "udp://tr4ck3r.duckdns.org:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://ipv4announce.sktorrent.eu:6969/announce", maxHashesPerRequest: 75 }, // European tracker
    { url: "udp://torrents.tmtime.dev:6969/announce", maxHashesPerRequest: 75 },
    { url: "udp://martin-gebhardt.eu:25/announce", maxHashesPerRequest: 75 }, // personally hosted, unusually on port 25
    { url: "udp://udp.tracker.projectk.org:23333/announce", maxHashesPerRequest: 75 },

    { url: "udp://tracker.plx.im:6969/announce", maxHashesPerRequest: 50 },
    { url: "udp://tracker.t-1.org:6969/announce", maxHashesPerRequest: 50 },
    { url: "udp://ipv4.tracker.harry.lu:80/announce", maxHashesPerRequest: 50 }, // IPv4-only
    { url: "udp://bt1.archive.org:6969/announce", maxHashesPerRequest: 50 }, // Internet Archive tracker
    { url: "udp://bt2.archive.org:6969/announce", maxHashesPerRequest: 50 }, // Internet Archive tracker (secondary)
    { url: "http://tracker.dler.org:6969/announce", maxHashesPerRequest: 50 },
    { url: "http://tracker.qu.ax:6969/announce", maxHashesPerRequest: 50 },
    { url: "http://tracker.opentrackr.org:1337/announce", maxHashesPerRequest: 50 }, // HTTP endpoint of the top tracker
    { url: "https://tracker.bt4g.com:443/announce", maxHashesPerRequest: 50 }, // run by bt4g.com search engine
    { url: "https://tracker.zhuqiy.com:443/announce", maxHashesPerRequest: 50 }, // Chinese tracker
    { url: "https://tracker.yemekyedim.com:443/announce", maxHashesPerRequest: 50 }, // Turkish tracker
    // they blocked me ;c
    // { url: "https://tracker.pmman.tech:443/announce", maxHashesPerRequest: 50 },
    { url: "https://tracker.nekomi.cn:443/announce", maxHashesPerRequest: 50 }, // Chinese, anime-focused
    // they blocked me ;c
    // { url: "https://tracker.7471.top:443/announce", maxHashesPerRequest: 50 }, // Chinese tracker
    { url: "https://torrents.tmtime.dev:443/announce", maxHashesPerRequest: 50 },
    // always getting 502, probably dead
    // { url: "https://open.ftorrent.com:443/announce", maxHashesPerRequest: 50 },
] satisfies TrackerRecordBase[]).map(r => ({ ...r, instance: new Tracker(r.url) }));

type ScrapeResponseData = {
    seeders: number,
    completed: number,
    leechers: number,
};

type ScrapeResult = ScrapeResponseData & {
    type: "result",
    infohash: string,
    trackerUrl: string,
};

type Scrape = ScrapeResult | {
    type: "error",
    error: string,
    chunk: string[],
    trackerUrl: string,
};

function makeScrapeError(errorMaybe: null | undefined | {}, tr: TrackerRecord) {
    let suffix = " - failed to scrape tracker " + tr.url;
    let error: null | undefined | { message?: unknown, response?: { headers?: Record<string, string> }, body?: Buffer } = errorMaybe;
    if (error && error.body instanceof Buffer && error.body.length > 0) {
        const contentType = error.response?.headers?.["content-type"];
        suffix += " - " + (contentType || "(no content-type)");
        if (contentType?.startsWith("text/html")) {
            const dom = new JSDOM(error.body);
            suffix += " - " + dom.window.document.body.textContent.replace(/\s+/g, " ");
        } else if (!contentType || contentType.startsWith("text/")) {
            suffix += " - "  + new TextDecoder().decode(error.body);
        } else {
            suffix += " - "  + error.body.toString("hex");
        }
        delete error.response;
        delete error.body;
    }
    if (error instanceof Error) {
        error.message += suffix;
    } else {
        error = new Error(String(error) + suffix);
    }
    return error;
}

/**
 * Doing requests sequentially for a given tracker. Could
 * parallelize them, but I do not want to get my ip banned
 */
const scrapeTracker = async function*(tr: TrackerRecord, infohashes: string[]): AsyncGenerator<Scrape> {
    const tracker: Tracker = tr.instance;
    for (let i = 0; i < infohashes.length; i += tr.maxHashesPerRequest) {
        const chunk = infohashes.slice(i, i + tr.maxHashesPerRequest);
        let msg;
        try {
            msg = await new Promise<Record<string, ScrapeResponseData>>((resolve, reject) => {
                tracker.scrape(chunk, { timeout: 45000 }, (err: unknown, msg: Record<string, ScrapeResponseData>) => {
                    err ? reject(err) : resolve(msg);
                });
            });
        } catch (error: unknown) {
            error = makeScrapeError(error, tr);
            yield { type: "error", error: stringifyError(error), chunk, trackerUrl: tr.url };
            return;
        }
        for (const [infohash, data] of Object.entries(msg)) {
            yield { type: "result", ...data, infohash, trackerUrl: tr.url };
        }
    }
};

/** @kudos to https://stackoverflow.com/a/50586391/2750743 */
const combine = async function*<T>(
    asyncIterators: AsyncGenerator<T, void, undefined>[]
): AsyncGenerator<T> {
    const results = [];
    let count = asyncIterators.length;
    const never = new Promise<never>(() => {});
    function getNext(
        asyncIterator: AsyncGenerator<T, void, undefined>,
        index: number
    ): Promise<{ index: number, result: IteratorResult<T, void> }> {
        return asyncIterator.next()
            .then(result => ({ index, result }));
    }
    const nextPromises = asyncIterators.map(getNext);
    try {
        while (count) {
            const { index, result } = await Promise.race(nextPromises);
            if (result.done) {
                nextPromises[index] = never;
                results[index] = result.value;
                count--;
            } else {
                nextPromises[index] = getNext(asyncIterators[index], index);
                yield result.value;
            }
        }
    } finally {
        for (const [index, iterator] of asyncIterators.entries()) {
            if (nextPromises[index] != never && iterator.return != null) {
                iterator.return(undefined);
            }
        }
        // no await here - see https://github.com/tc39/proposal-async-iteration/issues/126
    }
};

/** @return - incrementally only better options for a given infohash */
const ScrapeTrackersSeedInfo = async function*(infohashes: string[]) {
    const generators = trackerRecords.map(tr => scrapeTracker(tr, infohashes));
    const hashToBestScrape = new Map<string, ScrapeResult>();
    for await (const scrape of combine(generators)) {
        if (scrape.type === "error") {
            yield scrape;
            continue;
        }
        //console.log(JSON.stringify(scrape));
        const old = hashToBestScrape.get(scrape.infohash);
        if (!old ||
            scrape.seeders > old.seeders ||
            scrape.seeders === old.seeders && (
                scrape.completed > old.completed ||
                scrape.completed === old.completed &&
                scrape.leechers > old.leechers
            )
        ) {
            yield scrape;
            hashToBestScrape.set(scrape.infohash, scrape);
        }
    }
};

export default ScrapeTrackersSeedInfo;
