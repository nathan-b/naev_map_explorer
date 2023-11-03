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

// Set up the canvas
const renderer = new CanvasRenderer(new Canvas('map'));

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

renderer.on_click = function (event) {
    const renderer = this;
    if (this.context.hitbox_cache !== null) {
        this.context.hitbox_cache.forEach(function (element) {
            const circle2d = element.circle;
            if (renderer.canvas.ctx.isPointInPath(circle2d, event.offsetX, event.offsetY)) {
                console.log("User clicked", element.system.name);
                return;
            }
        });
    }
}

/**
 * Render the model to the canvas.
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
    //window.ipc_bridge.load_from_github(system_data_ready);
    window.ipc_bridge.load_from_path('', (model) => {
        renderer.update_model(model);
        window.addEventListener('resize', () => {
            renderer.draw_model(renderer.scroll_offset, renderer.scale);
        });
    });
});