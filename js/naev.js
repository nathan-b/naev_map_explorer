const gx = require("./github.js");
const fss = require("fs");
const fs = require("fs").promises;
const jsdom = require("jsdom");
const os = require("os");
const path = require("path");
const {
    performance
} = require("perf_hooks");
const {
    XMLParser
} = require("fast-xml-parser");

function get_game_data_dir() {
    // These are some locations to try by default to find the Naev data
    let test_basedirs = [
        "/usr/share/naev/",
        path.join(os.homedir(), ".var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/common/Naev/"),
        "/Applications/Naev.app/Contents/Resources",
        "%ProgramFiles%\\Naev"
    ];

    let basedir = "";
    for (const dir of test_basedirs) {
        if (fss.existsSync(dir)) {
            basedir = dir;
            break;
        }
    }

    if (basedir === "") {
        return basedir;
    }

    // Now find the data dir
    let datdir = "";
    if (fss.existsSync(path.join(basedir, "dat"))) {
        datdir = path.join(basedir, "dat");
    } else if (fss.existsSync(path.join(basedir, "ndata", "dat"))) {
        datdir = path.join(basedir, "ndata", "dat");
    }
    return datdir;
}

function read_systems_from_disk(naev_path, callback) {
    (async () => {
        if (naev_path === "") {
            naev_path = get_game_data_dir();
        }

        const spob_dir = path.join(naev_path, "spob");
        const ssys_dir = path.join(naev_path, "ssys");

        console.log(performance.now(), "Using path", spob_dir);

        // Build a list of all XML files to load
        const [spob_files, sys_files] = await Promise.all([
            fs.readdir(spob_dir),
            fs.readdir(ssys_dir),
        ]);
        const spob_xml = spob_files.filter(f => f.endsWith(".xml"));
        const sys_xml = sys_files.filter(f => f.endsWith(".xml"));

        console.log(performance.now(), "Reading XML files");

        // Load all the XML files
        const spob_read_promises = spob_xml.map(f => fs.readFile(path.join(spob_dir, f), "utf8"));
        const sys_read_promises = sys_xml.map(f => fs.readFile(path.join(ssys_dir, f), "utf8"));

        // Now wait for the spob reads to complete
        const spob_buffers = await Promise.all(spob_read_promises);

        // We have to parse all the spobs first, as systems refer to them
        console.log(performance.now(), "Parsing spob files");
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            allowBooleanAttributes: true,
        });
        const spobs = {};

        for (const xml of spob_buffers) {
            const xdoc = parser.parse(xml);
            const spob = process_spob(xdoc);
            spobs[spob.name] = spob;
        }

        // Now we can parse the system files
        const sys_buffers = await Promise.all(sys_read_promises);
        console.log(performance.now(), "Parsing system files");
        const system_map = {};
        for (const xml of sys_buffers) {
            const xdoc = parser.parse(xml);
            const ssys = process_ssys(xdoc, spobs);
            system_map[ssys.name] = ssys;
        }

        console.log(performance.now(), "Complete");
        callback(system_map);
    })().catch(err => {
        console.error("Error in read_systems_from_disk:", err);
    });
}

async function read_systems_from_github(callback) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        allowBooleanAttributes: true,
    });

    // Limit concurrency of fetch requests to avoid blasting github with API requests
    const pLimit = (concurrency) => {
        const queue = [];
        let activeCount = 0;

        const next = () => {
            if (queue.length === 0 || activeCount >= concurrency) return;
            activeCount++;
            const {
                fn,
                resolve,
                reject
            } = queue.shift();
            fn()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    activeCount--;
                    next();
                });
        };

        return (fn) =>
            new Promise((resolve, reject) => {
                queue.push({
                    fn,
                    resolve,
                    reject
                });
                process.nextTick(next);
            });
    };

    const limit = pLimit(32);

    console.log(performance.now(), "Fetching Naev data from GitHub...");

    try {
        // Kick off directory listings concurrently
        const [spob_dir, ssys_dir] = await Promise.all([
            new Promise((resolve) => gx.get_repo_dir("naev/naev", "dat/spob", resolve)),
            new Promise((resolve) => gx.get_repo_dir("naev/naev", "dat/ssys", resolve)),
        ]);

        const spobURLs = spob_dir
            .filter(f => f.type === "file" && f.name.endsWith(".xml"))
            .map(f => f.download_url);
        const ssysURLs = ssys_dir
            .filter(f => f.type === "file" && f.name.endsWith(".xml"))
            .map(f => f.download_url);

        console.log(performance.now(), `Preparing ${spobURLs.length} spob + ${ssysURLs.length} system downloads`);

        const fetchText = async (url) => {
            try {
                const res = await fetch(url);
                if (!res.ok) return null;
                return await res.text();
            } catch {
                return null;
            }
        };

        // Start both download groups
        console.log(performance.now(), "Starting concurrent downloads (limited concurrency)");
        const spobDownloadPromise = Promise.all(spobURLs.map((url) => limit(() => fetchText(url))));
        const ssysDownloadPromise = Promise.all(ssysURLs.map((url) => limit(() => fetchText(url))));

        // We have to parse all the spobs first, as systems refer to them
        const spobTexts = await spobDownloadPromise;
        console.log(performance.now(), "Parsing spob files");
        const spobs = {};
        for (const xml of spobTexts.filter(Boolean)) {
            const xdoc = parser.parse(xml);
            const spob = process_spob(xdoc);
            if (spob && spob.name) spobs[spob.name] = spob;
        }

        // Now get system files (most likely already downloaded)
        console.log(performance.now(), "Collecting system downloads");
        const ssysTexts = await ssysDownloadPromise;

        console.log(performance.now(), "Parsing system files");
        const system_map = {};
        for (const xml of ssysTexts.filter(Boolean)) {
            const xdoc = parser.parse(xml);
            const ssys = process_ssys(xdoc, spobs);
            if (ssys && ssys.name) system_map[ssys.name] = ssys;
        }

        console.log(performance.now(), "GitHub read complete");
        callback(system_map);

    } catch (err) {
        console.error("Error in read_systems_from_github:", err);
    }
}

function process_spob(xdoc) {
    const spobEl = xdoc.spob;
    if (!spobEl) return null;

    const name = spobEl["@_name"];
    const pos = spobEl.pos || {};
    const x = pos["@_x"];
    const y = pos["@_y"];

    // Collect services (could be object or array)
    const services = [];
    if (spobEl.services) {
        const serviceNodes = spobEl.services;
        for (const key of Object.keys(serviceNodes)) {
            if (key !== "@_") services.push(key);
        }
    }

    // Tags
    let tags = [];
    if (spobEl.tags?.tag) {
        const t = spobEl.tags.tag;
        tags = Array.isArray(t) ? t.map(v => v["#text"] || v) : [t["#text"] || t];
    }

    return new Spob(name, x, y, services, tags);
}

function process_ssys(xdoc, spobs) {
    const ssysEl = xdoc.ssys;
    if (!ssysEl) return null;

    const name = ssysEl["@_name"];
    const pos = ssysEl.pos || {};
    const x = pos["@_x"];
    const y = pos["@_y"];

    const sys = new System(name, x, y);

    // Spobs
    const spobNodes = ssysEl.spobs?.spob;
    if (spobNodes) {
        const list = Array.isArray(spobNodes) ? spobNodes : [spobNodes];
        for (const node of list) {
            const nameText = typeof node === "string" ? node : node["#text"] || node;
            if (spobs[nameText]) sys.addSpob(spobs[nameText]);
        }
    }

    // Jumps
    const jumpNodes = ssysEl.jumps?.jump;
    if (jumpNodes) {
        const list = Array.isArray(jumpNodes) ? jumpNodes : [jumpNodes];
        for (const jump of list) {
            const target = jump["@_target"];
            const hidden = !!jump.hidden;
            sys.addJump(new Jump(target, null, null, hidden));
        }
    }

    return sys;
}

/**
 * Naev describes anything in space that you can interact with (other than ships) as
 * a space object, or "spob". A spob is always inside a system and has x, y
 * coordinates and a name.
 */
class Spob {
    name;
    x;
    y;
    restricted = false;
    shipyard = false;
    land = false;
    refuel = false;
    outfits = false;

    constructor(name, x, y, services, tags) {
        this.name = name;
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.outfits = services.includes("outfits");
        this.refuel = services.includes("refuel");
        this.land = services.includes("land");
        this.shipyard = services.includes("shipyard");
        this.restricted = tags.includes("restricted");
    }
}

class Jump {
    target;
    x;
    y;
    hidden = false;

    constructor(target, x, y, hidden) {
        this.target = target;
        this.x = x;
        this.y = y;
        if (hidden) {
            this.hidden = hidden;
        } else {
            this.hidden = false;
        }
    }
}

class System {
    name;
    x;
    y;
    spobs = [];
    jumps = [];

    constructor(name, x, y) {
        this.name = name;
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }

    addSpob(spob) {
        this.spobs.push(spob);
    }

    addJump(target) {
        this.jumps.push(target);
    }
}

module.exports = {
    read_systems_from_disk,
    read_systems_from_github,
    Spob,
    System
};