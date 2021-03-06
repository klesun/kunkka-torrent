
import * as Papaparse from 'papaparse';
import * as fsSync from 'fs';
import {HandleHttpParams} from "../HandleHttpRequest";
import {InternalServerError} from "@curveball/http-errors";

const fs = fsSync.promises;
const Xml = require('klesun-node-tools/src/Utils/Xml.js');

type TorrentsCsvRecord = {
    name: string;
    size_bytes: string;
    created_unix: string;
    seeders: string;
    leechers: string;
    completed: string;
    scraped_date: string;
}

type TorrentsCsvRecordFull = TorrentsCsvRecord & {
    infohash: string;
};

// I have 28 GiB of RAM, so I don't mind keeping whole CSV here... for now at least
const torrentsCsvPath = __dirname + '/../../../node_modules/torrents-csv-data/torrents.csv';
const whenInfoHashToRecord = fs.readFile(torrentsCsvPath, 'utf-8').then(csvText => {
    const parsed = Papaparse.parse(csvText.trim(), {delimiter: ';'});
    const rows = <string[][]>parsed.data;
    const columns = rows.shift();
    if (!columns) {
        throw new InternalServerError('torrents.csv is empty');
    }
    const infohashToRecord: Map<string, TorrentsCsvRecord> = new Map();
    for (const row of rows) {
        const record: TorrentsCsvRecordFull = Object.fromEntries(
            columns.map((col, i: keyof typeof columns) => {
                return [columns[i], row[i]];
            }),
        );
        const {infohash, ...rest} = record;
        infohashToRecord.set(infohash, rest);
    }
    return infohashToRecord;
});
const getInfohashRecord = (infoHash: string) => whenInfoHashToRecord.then(infoHashToRecord => {
    if (infoHashToRecord.has(infoHash)) {
        return infoHashToRecord.get(infoHash);
    } else {
        return undefined;
    }
});

const formatSize = (bytes: number) => {
    const sizeMib = bytes / 1024 / 1024;
    if (sizeMib >= 1024) {
        return (sizeMib / 1024).toFixed(1) + 'GiB';
    } else {
        return sizeMib.toFixed(1) + 'MiB';
    }
};

const ServeInfoPage = async (params: HandleHttpParams, infoHash: string) => {
    const csvRecord = await getInfohashRecord(infoHash);
    const description = !csvRecord ? null : `${formatSize(+csvRecord.size_bytes)} | ${csvRecord.seeders} seeds | ${csvRecord.leechers} leechers`;
    const htmlRoot = Xml('html', {}, [
        Xml('head', {}, [
            Xml('title', {}, csvRecord ? csvRecord.name + ' - torrent download' : '🧲 ' + infoHash),
            Xml('meta', {'charset': 'utf-8'}),
            ...!description ? [] : [
                Xml('meta', {name: 'description', content: description}),
                Xml('meta', {property: 'og:description', content: description}),
            ],
        ]),
        Xml('body', {}, [
            Xml('h2', {}, csvRecord ? csvRecord.name : '🧲 ' + infoHash),
            ...!csvRecord ? [] : [
                Xml('div', {}, 'Created At: ' + new Date(+csvRecord.created_unix * 1000).toISOString()),
                Xml('div', {}, 'Scraped At: ' + new Date(+csvRecord.scraped_date * 1000).toISOString()),
            ],
        ]),
    ]);
    params.rs.setHeader('content-type', 'text/html');
    params.rs.write(htmlRoot.toString());
    params.rs.end();
};

export default ServeInfoPage;
