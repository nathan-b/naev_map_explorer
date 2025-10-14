//
// The main UI logic
// Runs in sandbox, uses the API defined in js for drawing to the canvas.
//

/**
 * Naev uses traditional Cartesian coordinates with the origin at the center,
 * while an HTML5 canvas has the origin at the upper left.
 *
 * Rather than try to completely re-center, this function keeps x coordinates
 * entirely untranslated (so half the map is off the screen to the left) and then
 * flips the y coordinate (so half the map is off the screen to the bottom).
 *
 * This places the origin at the lower-left corner.
 *
 * As a result, the default view will be more-or-less the upper-right quadrant of the
 * map, with the negative portions going off the screen to the left and bottom.
 *
 * @param {*} coords  x, y coordinates for the point to flip
 * @param {*} max     x, y coordinates for the max
 * @returns
 */
function flip_y(coords, max) {
    return new Point(coords.x, max.y - coords.y);
}

/**
 * Resize the canvas to its correct area within the window
 */
function set_canvas_size() {
    const canvas = window.document.getElementById('map');
    const celem = window.document.getElementById('controls');
    const width = window.innerWidth - 50;
    const height = window.innerHeight - celem.clientHeight;
    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
    }
}

/**
 * Show the system map
 */
function show_minimap() {
    const mm = window.document.getElementById('minimap');
    mm.style.visibility = 'visible';
}

/**
 * Hide the system map
 */
function hide_minimap() {
    const mm = window.document.getElementById('minimap');
    mm.style.visibility = 'hidden';
    // Remove the close button if it exists
    if (minimapCloseButton) {
        minimapCloseButton.remove();
        minimapCloseButton = null;
    }
}

// Set up the canvas
const renderer = new CanvasRenderer(new Canvas('map'));
const minimap = new CanvasRenderer(new Canvas('minimap'));

// Store reference to minimap close button
let minimapCloseButton = null;

///////////////////////////////////////////////////////////////////////////
// System map / minimap
//

/**
 * Update the minimap with the given system.
 * @param {*} system  A system object
 */
minimap.update_model = function (system) {
    this.context = {
        'system': system
    }
    this.draw_model(this.scroll_offset, this.scale);

    // Create the close button if it doesn't exist
    if (!minimapCloseButton) {
        minimapCloseButton = document.createElement("button");
        minimapCloseButton.innerHTML = "X";
        minimapCloseButton.style.position = "absolute";
        minimapCloseButton.style.top = "10px";
        minimapCloseButton.style.right = "10px";
        minimapCloseButton.style.zIndex = "1000";
        minimapCloseButton.style.backgroundColor = "black";
        minimapCloseButton.style.color = "white";
        minimapCloseButton.style.border = "none";
        minimapCloseButton.style.padding = "10px";
        minimapCloseButton.style.cursor = "pointer";
        minimapCloseButton.style.fontSize = "16px";
        minimapCloseButton.style.borderRadius = "5px";
        minimapCloseButton.addEventListener("click", function () {
            hide_minimap();
        });
        document.body.appendChild(minimapCloseButton);
    }
}

minimap.draw_model = function (origin, scale) {
    this.canvas.clear();
    const canvas_max = new Point(this.canvas.canvas.width, this.canvas.canvas.height);
    this.canvas.set_origin_and_scale(origin, scale);

    const system = this.context.system;
    const canvas = this.canvas;

    const color_text = "white";
    const color_refuel = "yellow";
    const color_outfitter = "orange";
    const color_shipyard = "green";
    const color_restricted = "red";
    const normal_jump = "blue";
    const hidden_jump = "red";
    const base_radius = 6;

    // Iterate once through the spobs to get a bounding box
    const padding = 5000;
    let pmin = new Point(0, 0);
    let pmax = new Point(0, 0);
    for (const spob of system.spobs) {
        const coords = flip_y(new Point(spob.x, spob.y), canvas_max);
        if (coords.x < pmin.x) {
            pmin.x = coords.x;
        }
        if (coords.y < pmin.y) {
            pmin.y = coords.y;
        }
        if (coords.x > pmax.x) {
            pmax.x = coords.x;
        }
        if (coords.y > pmax.y) {
            pmax.y = coords.y;
        }
    }
    pmin.x -= padding;
    pmin.y -= padding;
    pmax.x += padding;
    pmax.y += padding;

    let translate = function (point) {
        // Scale coordinates from pmin - pmax into <0, 0> - canvas_max
        const coords = flip_y(point, canvas_max);
        const xscale = canvas_max.x / (pmax.x - pmin.x);
        const yscale = canvas_max.y / (pmax.y - pmin.y);
        return new Point((coords.x - pmin.x) * xscale, (coords.y - pmin.y) * yscale);
    }

    // Draw the spobs
    for (const spob of system.spobs) {
        let color = "white";
        if (spob.restricted) {
            color = color_restricted;
        } else if (spob.refuel) {
            color = color_refuel;
        } else if (spob.outfitter) {
            color = color_outfitter;
        } else if (spob.shipyard) {
            color = color_shipyard;
        }

        // Draw the spob
        const coords = translate(new Point(spob.x, spob.y));
        console.log("Drawing spob", spob.name, "at", spob.x, spob.y, coords.x, coords.y);
        const circle = new Circle(coords.x, coords.y, base_radius);
        const circle2d = canvas.draw_circle(circle, color);
        canvas.label_circle(circle, spob.name, color_text);
    }

    // Draw the jumps
    for (const jump of system.jumps) {
        let color = normal_jump;
        if (jump.hidden) {
            color = hidden_jump;
        }

        // Draw the jump
        const coords = translate(new Point(jump.x, jump.y));
        const circle = new Circle(coords.x, coords.y, base_radius);
        const circle2d = canvas.draw_circle(circle, color);
        canvas.label_circle(circle, jump.target, color_text);
        console.log("Drawing jump", jump.target, "at", jump.x, jump.y);
    }

    // Draw the system name in screen coordinates (not affected by pan/zoom)
    this.canvas.ctx.save();
    this.canvas.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.canvas.ctx.font = '24px sans';
    this.canvas.ctx.fillStyle = color_text;
    this.canvas.ctx.fillText(system.name, 5, 29);
    this.canvas.ctx.restore();
}

// Set up mouse interactivity
minimap.canvas_mouse_handler();

///////////////////////////////////////////////////////////////////////////
// Main map
//

/**
 * Update the stored systems model from the latest json.
 * @param {*} sys_json A JSON representation of a list of systems.
 */
renderer.update_model = function (sys_json) {
    this.context = {
        systems: JSON.parse(sys_json),
        hitbox_cache: []
    };
    console.log("Updating", Object.keys(this.context.systems).length, "systems");
    this.draw_model(this.scroll_offset, this.scale);
    console.log("Finished updating");
};

/**
 * When the user clicks on a system, display the minimap showing that system.
 * @param {*} event  The click event
 */
renderer.on_click = function (event) {
    const renderer = this;
    // Look through each of the stored hitboxes to see if we clicked on one
    if (this.context.hitbox_cache !== null) {
        this.context.hitbox_cache.forEach(function (element) {
            const circle2d = element.circle;
            if (renderer.canvas.ctx.isPointInPath(circle2d, event.offsetX, event.offsetY)) {
                minimap.update_model(element.system);
                show_minimap();
                console.log("User clicked", element.system.name);
                return;
            }
        });
    }
}

/**
 * Draw the stored system map (saved in update_model)
 */
renderer.draw_model = function (origin, scale) {
    this.canvas.clear();
    set_canvas_size();
    this.canvas.set_origin_and_scale(origin, scale);

    const canvas_max = new Point(this.canvas.canvas.width, this.canvas.canvas.height);

    const color_sys = "yellow";
    const color_refuel = "yellow";
    const color_outfitter = "orange";
    const color_shipyard = "green";
    const text_color = "white";
    const normal_jump = "blue";
    const hidden_jump = "red";
    const base_radius = 6;
    const canvas = this.canvas;
    const context = this.context;
    context.hitbox_cache = [];

    Object.keys(context.systems).forEach(function (key) {
        // Draw the system circle
        const sys = this[key];
        const coords = flip_y(new Point(sys.x, sys.y), canvas_max);
        const circle = new Circle(coords.x, coords.y, base_radius);
        const circle2d = canvas.draw_circle(circle, color_sys);
        canvas.label_circle(circle, sys.name, text_color);
        context.hitbox_cache.push({
            'circle': circle2d,
            'system': sys
        });

        // Draw the inner circle based on available services
        const services = {
            'refuel': false,
            'outfitter': false,
            'shipyard': false
        };
        for (const spob of sys.spobs) {
            if (spob.restricted) continue;
            if (spob.refuel) {
                services.refuel = true;
            }
            if (spob.outfitter) {
                services.outfitter = true;
            }
            if (spob.shipyard) {
                services.shipyard = true;
            }
        }
        let inner_color = null;
        if (services.shipyard) {
            inner_color = color_shipyard;
        } else if (services.outfitter) {
            inner_color = color_outfitter;
        } else if (services.refuel) {
            inner_color = color_refuel;
        }
        if (inner_color !== null) {
            const inner = new Circle(coords.x, coords.y, base_radius - 1);
            canvas.draw_circle(inner, inner_color, true);
        }

        // Draw connections for each jump point
        sys.jumps.forEach(function (jump) {
            const target_sys = context.systems[jump.target];
            const target_coords = flip_y(new Point(
                target_sys.x,
                target_sys.y
            ), canvas_max);
            const target_circle = new Circle(
                target_coords.x,
                target_coords.y,
                base_radius
            );
            const line_color = jump.hidden ? hidden_jump : normal_jump;
            canvas.draw_connection(circle, target_circle, line_color);
        });
    }, context.systems);
};

// Set up mouse interactivity
renderer.canvas_mouse_handler();

window.addEventListener('DOMContentLoaded', (event) => {
    //window.ipc_bridge.load_from_github((model) => {
    window.ipc_bridge.load_from_path('', (model) => {
        renderer.update_model(model);

        // Add a resize listener so the canvas can correctly size to the window
        window.addEventListener('resize', () => {
            renderer.draw_model(renderer.scroll_offset, renderer.scale);
        });
    });
});