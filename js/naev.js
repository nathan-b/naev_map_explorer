const gx = require("./github.js");
const fs = require("fs");
const jsdom = require("jsdom");

function get_repo_dir_fake(path, callback) {
    fs.readFile(`data/${path}`, {
        encoding: "utf8"
    }, (err, data) => {
        callback(JSON.parse(data));
    });
    //return JSON.parse(fs.readFileSync(`data/${path}`, { encoding: "utf8" }));
}

function read_systems(callback) {
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
            let spobs = {};
            for (const spob_result of spob_results) {
                if (spob_result.ok) {
                    const spob_xml = await spob_result.text();
                    const spob = read_spob_file(spob_xml);
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
    const xmlDoc = (new jsdom.JSDOM(xml)).window.document;

    const spobElement = xmlDoc.querySelector("spob");
    const name = spobElement.getAttribute("name");

    const posElement = xmlDoc.querySelector("pos");
    const x = posElement.getAttribute("x");
    const y = posElement.getAttribute("y");

    // Extract tags of the services element as an array
    const svcArray = Array.from(xmlDoc.querySelectorAll("services > *")).map(
        (svcElement) => svcElement.tagName
    );

    const tagsArray = Array.from(xmlDoc.querySelectorAll("tags > tag")).map(
        (tagElement) => tagElement.textContent
    );
    return new Spob(name, x, y, svcArray, tagsArray);
}

function read_ssys_file(xml, spobs) {
    const xmlDoc = (new jsdom.JSDOM(xml)).window.document;

    const ssysElement = xmlDoc.querySelector("ssys");
    const name = ssysElement.getAttribute("name");

    const posElement = xmlDoc.querySelector("pos");
    const x = posElement.getAttribute("x");
    const y = posElement.getAttribute("y");

    let sys = new System(name, x, y);

    // Get the spobs
    const spobList = xmlDoc.querySelectorAll("spobs > spob");
    spobList.forEach(function(spobElem) {
        sys.addSpob(spobs[spobElem.textContent]);
    });

    // Get the jumps
    const jumpList = xmlDoc.querySelectorAll("jumps > jump");
    jumpList.forEach(function(jumpElem) {
        sys.addJump(jumpElem.getAttribute("target"));
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

    addSpob = function(spob) {
        this.spobs.push(spob);
    };

    addJump = function(target) {
        this.jumps.push(target);
    };
}

module.exports = {
    read_systems,
    Spob,
    System
};