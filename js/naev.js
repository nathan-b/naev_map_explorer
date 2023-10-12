const gx = require("./github.js");
const fs = require("fs");
const jsdom = require("jsdom");
const os = require("os");
const path = require("path");

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
        if (fs.existsSync(dir)) {
            basedir = dir;
            break;
        }
    }

    if (basedir === "") {
        return basedir;
    }

    // Now find the data dir
    let datdir = "";
    if (fs.existsSync(path.join(basedir, "dat"))) {
        datdir = path.join(basedir, "dat");
    } else if (fs.existsSync(path.join(basedir, "ndata", "dat"))) {
        datdir = path.join(basedir, "ndata", "dat");
    }
    return datdir;
}

function read_systems_from_disk(naev_path, callback) {
    if (naev_path === "") {
        // Try to divine the path
        naev_path = get_game_data_dir();
    }
    const spob_dir = path.join(naev_path, 'spob');
    const ssys_dir = path.join(naev_path, 'ssys');
    if (!fs.existsSync(spob_dir) || !fs.existsSync(ssys_dir)) {
        return;
    }

    console.log(performance.now(), "Using path", spob_dir);

    // Step 1: Read all the spob files in the spob dir
    //    1.1: Iterate all the dir's files
    let spobs = {};
    fs.readdir(spob_dir, (err, spob_files) => {
        // XXX Handle err
        new Promise((resolve, reject) => {
            let num_spobs = 0;
            let read_spobs = 0;
            let read_times = [];
            let proc_times = [];
            console.log(performance.now(), "Reading spob files in path");
            for (const spob_file of spob_files) {
                if (path.extname(spob_file) != '.xml') continue;
                // 1.2: Read the file from disk
                ++num_spobs;
                const spob_path = path.join(spob_dir, spob_file);
                let read_time = performance.now();
                fs.readFile(spob_path, (err, spob_data) => {
                    if (err) {
                        console.error(err.message);
                        reject();
                    } else {
                        const proc_time = performance.now();
                        read_times.push(proc_time - read_time);
                        const spob = read_spob_file(spob_data);
                        spobs[spob.name] = spob;
                        proc_times.push(performance.now() - proc_time);
                        if (++read_spobs == num_spobs) {
                            const average = array => array.reduce((a, b) => a + b) / array.length;
                            console.log(performance.now(), "Read", read_spobs, "spobs");
                            console.log("Average read time:", average(read_times), "Average load time:", average(proc_times));
                            resolve();
                        }
                    }
                });
            }
        }).then(() => {
            console.log(performance.now(), "Reading system data");
            // Step 2: Read the systems in the ssys dir
            //    2.1: Iterate all the dir's files
            let system_map = {};
            fs.readdir(ssys_dir, (err, ssys_files) => {
                // XXX handle error
                let num_ssys = 0;
                let read_ssys = 0;
                console.log(performance.now(), "Reading system files in path");
                for (const ssys_file of ssys_files) {
                    if (path.extname(ssys_file) != '.xml') continue;
                    // 2.2: Read the file from disk
                    ++num_ssys;
                    const ssys_path = path.join(ssys_dir, ssys_file);
                    fs.readFile(ssys_path, (err, sys_data) => {
                        // XXX Handle err
                        const ssys = read_ssys_file(sys_data, spobs);
                        system_map[ssys.name] = ssys;
                        if (++read_ssys == num_ssys) {
                            console.log(performance.now(), "Done reading system files");
                            callback(system_map);
                        }
                    });
                }
            }); // End read ssys files
        }); // End read ssys directory
    }); // End read spob dir
}

function read_systems_from_github(callback) {
    // Step 1: Read all the spob files in the spob dir
    //    1.1: Read the directory contents of the spob dir
    gx.get_repo_dir("naev/naev", "dat/spob", (spob_dir) => {
        //  1.2: Download each file in the spob dir
        let spob_promises = [];
        var num = 0;
        for (const spob_file of spob_dir) {
            num++;
            if (spob_file.type === "file" && spob_file.name.endsWith(".xml")) {
                const xml_url = spob_file.download_url;
                spob_promises.push(fetch(xml_url));
            }
        }
        //  1.3: Read the downloaded files
        Promise.all(spob_promises).then(async (spob_results) => {
            let times = [];
            let spobs = {};
            for (const spob_result of spob_results) {
                if (spob_result.ok) {
                    const spob_xml = await spob_result.text();
                    const before = performance.now();
                    const spob = read_spob_file(spob_xml);
                    times.push(performance.now() - before);
                    spobs[spob.name] = spob;
                } else {
                    // XXX TODO Handle error
                }
            }

            // Step 2: Read the systems
            //    2.1: Read the directory contents of the ssys dir
            gx.get_repo_dir("naev/naev", "dat/ssys", (ssys_dir) => {
                //  2.2: Download each file in the ssys dir
                let ssys_promises = [];
                var num = 0;
                for (const ssys_file of ssys_dir) {
                    num++;
                    if (ssys_file.type === "file" && ssys_file.name.endsWith(".xml")) {
                        const xml_url = ssys_file.download_url;
                        ssys_promises.push(fetch(xml_url));
                    }
                }
                //  2.3: Read the downloaded files
                Promise.all(ssys_promises).then(async (ssys_results) => {
                    let system_map = {};
                    for (const ssys_result of ssys_results) {
                        if (ssys_result.ok) {
                            const ssys_xml = await ssys_result.text();
                            const ssys = read_ssys_file(ssys_xml, spobs);
                            system_map[ssys.name] = ssys;
                        } else {
                            // XXX TODO Handle error
                        }
                    }
                    callback(system_map);
                }); // End read ssys files
            }); // End read ssys directory
        }); // End read spob files
    }); // End read spob directory
}

function read_spob_file(xml) {
    const xdoc = (new jsdom.JSDOM(xml, {
        contentType: "text/xml"
    })).window.document;

    const spob_element = xdoc.querySelector("spob");
    const name = spob_element.getAttribute("name");

    const pos = xdoc.querySelector("pos");
    const x = pos.getAttribute("x");
    const y = pos.getAttribute("y");

    // Extract children of the services element as an array
    const services = Array.from(xdoc.querySelectorAll("services > *")).map(
        (elem) => elem.tagName
    );

    // And the tags
    const tagsArray = Array.from(xdoc.querySelectorAll("tags > tag")).map(
        (elem) => elem.textContent
    );
    return new Spob(name, x, y, services, tagsArray);
}

function read_ssys_file(xml, spobs) {
    const xdoc = (new jsdom.JSDOM(xml, {
        contentType: "text/xml"
    })).window.document;

    const ssys_element = xdoc.querySelector("ssys");
    const name = ssys_element.getAttribute("name");

    const pos = xdoc.querySelector("pos");
    const x = pos.getAttribute("x");
    const y = pos.getAttribute("y");

    let sys = new System(name, x, y);

    // Get the spobs
    const spobList = xdoc.querySelectorAll("spobs > spob");
    spobList.forEach(function (spob_elem) {
        sys.addSpob(spobs[spob_elem.textContent]);
    });

    // Get the jumps
    const jumpList = xdoc.querySelectorAll("jumps > jump");
    jumpList.forEach(function (jump_elem) {
        const hidden = (jump_elem.querySelector("hidden") !== null);
        let x = null,
            y = null;
        if (jump_elem.querySelector("autopos") === null) {
            // XXX Read x, y coords
        }
        sys.addJump(new Jump(jump_elem.getAttribute("target"), x, y, hidden));
    });

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