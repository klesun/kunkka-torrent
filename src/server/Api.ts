import * as url from "url";
import { shortenFileInfo } from "./torrent-backends/ITorrentBackend";
import type * as http from "http";
import { HTTP_PORT } from "./Constants";
import Qbtv2 from "./Qbtv2";
import { parseMagnetUrl } from "../common/Utils.js";
const util = require("util");
const execFile = util.promisify(require("child_process").execFile);
import * as fs from "fs";
import parseTorrent from "parse-torrent";
import { BadGateway, BadRequest, NotFound, NotImplemented, ServiceUnavailable } from "@curveball/http-errors";
import TorrentNamesFts from "./repositories/TorrentNamesFts";
import Infohashes from "./repositories/Infohashes";
import * as console from "node:console";
import { backend } from "./torrent-backends/ActiveBackend";
import { Infohash } from "../common/types.ts";
import { fail } from "node:assert";
import type { Http2ServerRequest } from "node:http2";

function assertValidInfoHash(infoHash: string | null | undefined | string[]): asserts infoHash is Infohash {
    if (Array.isArray(infoHash)) {
        throw new BadRequest("Only one infohash is expected in parameters");
    }
    if (!infoHash || infoHash.length !== 40 && !infoHash.match(/^[a-zA-Z2-7]{32}$/)) {
        throw new BadRequest("Invalid infoHash, must be a 40 characters long hex string or a 32 characters long base32 string");
    }
}

const getFfmpegInfo = async (rq: http.IncomingMessage | Http2ServerRequest) => {
    const { infoHash, filePath } = <Record<string, string>>url.parse(<string>rq.url, true).query;
    assertValidInfoHash(infoHash);
    if (!filePath) {
        throw new BadRequest("filePath parameter is mandatory");
    }
    await backend.prepareTorrentStream(infoHash);
    const streamUrl = "http://localhost:" + HTTP_PORT + "/torrent-stream?infoHash=" +
        infoHash + "&filePath=" + encodeURIComponent(filePath);
    const ffprobeArgs = ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", streamUrl];
    let execResult;
    try {
        execResult = await execFile("ffprobe", ffprobeArgs);
    } catch (error) {
        console.error("Ffprobe failed for params:", ffprobeArgs);
        throw error;
    }
    const { stdout, stderr } = execResult;
    return JSON.parse(stdout);
};

const connectToSwarm = async (rq: http.IncomingMessage | Http2ServerRequest) => {
    const query = url.parse(<string>rq.url, true).query;

    const { infoHash } = query;

    assertValidInfoHash(infoHash);
    const engine = await backend.prepareTorrentStream(infoHash);
    return {
        torrent: {
            name: engine.torrent.name,
        },
        files: engine.files.map(shortenFileInfo),
    };
};

const getSwarmInfo = async (rq: http.IncomingMessage | Http2ServerRequest) => {
    const { infoHash } = url.parse(<string>rq.url, true).query;
    assertValidInfoHash(infoHash);
    return backend.swarmSummary(infoHash);
};

const tryInterpretAsMagnet = async (fileUrl: string) => {
    const response = await fetch(fileUrl, {
        redirect: "manual",
    });
    if (response.status === 302) {
        const location = response.headers.get("location");
        if (!location) {
            throw new Error("Missing redirect location");
        }
        if (!location.startsWith("magnet:?")) {
            throw new Error("Redirect link is not magnet: " + location);
        }
        const searchParams = new URLSearchParams(location.slice("magnet:?".length));
        const infoHash = searchParams.get("xt")?.replace(/^urn:btih:/, "");
        if (!infoHash) {
            throw new Error("Missing infohash in magnet link");
        }
        return { infoHash, announce: searchParams.getAll("tr") };
    } else if (response.status === 200) {
        if (response.headers.get("content-type") === "application/x-bittorrent") {
            const arrayBuffer = await response.arrayBuffer();
            const torrentFileData = parseTorrent(Buffer.from(arrayBuffer));
            const announce = torrentFileData.announce || [];
            const infoHash = torrentFileData.infoHash;
            return { infoHash, announce };
        } else {
            throw new Error("Not implemented for response content type " + response.headers.get("content-type"));
        }
    } else if (response.status === 404) {
        throw new NotFound("Tracker returned 404 Not Found status for " + fileUrl);
    }
    throw new Error("Not implemented for response status " + response.status);
};

const noAuthNeeded = (fileUrl: string) => {
    // 9117 = Jackett
    return fileUrl.startsWith("http://127.0.0.1:9117/dl/");
};

/**
 * sites like rutracker, bakabt, kinozal, etc... require login and password
 * to download torrents, so need to integrate with qbt python plugins
 */
const downloadTorrentFile = async (rq: http.IncomingMessage | Http2ServerRequest) => {
    const { searchParams } = new URL(rq.url ?? fail("url"), "http://localhost");
    const fileUrl = searchParams.get("fileUrl") ?? fail("fileUrl");

    if (noAuthNeeded(fileUrl)) {
        return tryInterpretAsMagnet(fileUrl);
    } else {
        return downloadQbtPluginTorrentFile(fileUrl);
    }
};

const downloadQbtPluginTorrentFile = async (fileUrl: string) => {
    // language=file-reference
    const scriptPath = __dirname + "/" + "../../scripts/download_torrent_file.sh";
    const args = [fileUrl];
    let result: { stdout: string, stderr: string };
    try {
        result = await execFile(scriptPath, args);
    } catch (exc) {
        const msg = (exc && typeof exc === "object" && ("stderr" in exc) && exc.stderr ? "STDERR: " + String(exc.stderr) + "\n" : String(exc) + "\n") +
            "Python script failed to retrieve torrent";
        if (msg.includes("UNSUPPORTED_TRACKER")) {
            return await tryInterpretAsMagnet(fileUrl);
        } else {
            throw new BadGateway(msg);
        }
    }
    const { stdout, stderr } = result;
    const [path, effectiveUrl] = stdout.trim().split(/\s+/);
    if (!effectiveUrl.match(/^https?:\/\//)) {
        const msg = "Unexpected response from python script," +
            "\nSTDOUT:\n" + stdout + (stderr.trim() ? "STDERR:\n" + stderr : "") + "\nno match:\n" +
            fileUrl + "\n" +
            effectiveUrl;
        throw new BadGateway(msg);
    }
    let infoHash: Infohash | undefined;
    let announce: string[] = [];
    // TODO: return announce (tr) from magnet link
    const asMagnet = parseMagnetUrl(path);
    if (asMagnet) {
        infoHash = asMagnet.infoHash;
    } else if (path.match(/^[A-Fa-f0-9]{40}$/) // hnx
            || path.match(/^[a-zA-Z2-7]{32}$/) // base32
    ) {
        infoHash = Infohash(path);
    } else if (path.startsWith("/tmp/")) {
        const torrentFileBuf = await fs.promises.readFile(path);
        const torrentFileData = parseTorrent(torrentFileBuf);
        announce = torrentFileData.announce || [];
        infoHash = !torrentFileData.infoHash ? undefined : Infohash(torrentFileData.infoHash);
    } else {
        const msg = "Unexpected downloaded torrent file path format - " + path;
        throw new NotImplemented(msg);
    }

    return { infoHash, announce };
};

const Api = () => {
    const torrentNamesFts = TorrentNamesFts();
    const infohashes = Infohashes();

    const findTorrentsInLocalDb = async (req: http.IncomingMessage | Http2ServerRequest) => {
        const { userInput } = <Record<string, string>>url.parse(<string>req.url, true).query;
        const ftsRows = await torrentNamesFts.select(userInput)
            .catch((error: null | undefined | { code?: "SQLITE_CANTOPEN" | unknown }) => {
                if (error?.code === "SQLITE_CANTOPEN") {
                    throw new ServiceUnavailable("Local Infohashes DB file is missing on the server");
                } else {
                    throw error;
                }
            });
        return infohashes.selectIn(ftsRows.map(r => r.infohash));
    };

    return {
        getFfmpegInfo: getFfmpegInfo,
        connectToSwarm: connectToSwarm,
        getSwarmInfo: getSwarmInfo,
        downloadTorrentFile: downloadTorrentFile,
        findTorrentsInLocalDb: findTorrentsInLocalDb,

        qbtv2: Qbtv2(),

        // following not serializable - for internal use only
        prepareTorrentStream: backend.prepareTorrentStream,
    };
};

export default Api;

export type IApi = ReturnType<typeof Api>;

export type IApi_getSwarmInfo_rs = Awaited<ReturnType<ReturnType<typeof Api>["getSwarmInfo"]>>;
export type IApi_connectToSwarm_rs = Awaited<ReturnType<ReturnType<typeof Api>["connectToSwarm"]>>;
