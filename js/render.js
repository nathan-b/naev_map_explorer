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
 * Contains all the context for rendering the model (scene) to canvas.
 *
 * The model is just a list of System objects.
 */
class CanvasRenderer {
    canvas;
    systems;
    scroll_offset;
    scale;
    hitbox_cache;

    constructor(canvas) {
        this.canvas = canvas;
        this.scroll_offset = new Point(0, 0);
        this.scale = 1.0;
        this.hitbox_cache = [];
    }

    /**
     * Render the model to the canvas.
     */
    draw_model(origin, scale) {
        this.canvas.clear();
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
        const systems = this.systems;
        var hitbox_cache = [];

        Object.keys(this.systems).forEach(function (key) {
            // Draw the system circle
            const sys = this[key];
            const coords = flip_y(new Point(sys.x, sys.y), canvas_max);
            const circle = new Circle(coords.x, coords.y, base_radius);
            const circle2d = canvas.draw_circle(circle, color_sys);
            canvas.label_circle(circle, sys.name, text_color);
            hitbox_cache.push({
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
                const target_sys = systems[jump.target];
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
        }, this.systems);
        this.hitbox_cache = hitbox_cache;
    }

    /**
     * Update the stored systems model from the latest json.
     * @param {*} sys_json A JSON representation of a list of systems.
     */
    update_model(sys_json) {
        this.systems = JSON.parse(sys_json);
        console.log("Updating", Object.keys(this.systems).length, "systems");
        this.draw_model(this.scroll_offset, this.scale);
        console.log("Finished updating");
    }

    /**
     * Handle the mouse interaction stuff.
     */
    canvas_mouse_handler() {
        // Scroll and zoom -- context for callbacks
        var start = null;
        var last = new Point(0, 0);
        var canvas = this.canvas.canvas;
        var down = false;
        var drag = false;
        var renderer = this;

        /**
         * Detect clicks on a planet, but drags don't count as clicks.
         */
        canvas.addEventListener("click", function (event) {
            // Figure out which system (if any) the user clicked on
            if (drag) {
                drag = false;
                event.preventDefault();
                event.stopPropagation();
            } else {
                renderer.hitbox_cache.forEach(function (element) {
                    const circle2d = element.circle;
                    if (renderer.canvas.ctx.isPointInPath(circle2d, event.offsetX, event.offsetY)) {
                        console.log("User clicked", element.system.name);
                        return;
                    }
                });
            }
        });

        /**
         * When the user clicks down on the canvas, record the coordinates of the click.
         */
        canvas.addEventListener("mousedown", function (event) {
            start = new Point(event.clientX, event.clientY);
            down = true;
        });

        /**
         * When the user moves the mouse, scroll the canvas by the offset between
         * the current mouse position and the original click position.
         */
        canvas.addEventListener("mousemove", function (event) {
            if (down) {
                drag = true;
            }
            if (drag && canvas.contains(event.target)) {
                let origin = renderer.scroll_offset;
                let dx = event.clientX - start.x;
                let dy = event.clientY - start.y;
                var p = new Point(origin.x + dx, origin.y + dy);
                last.x = event.clientX;
                last.y = event.clientY;
                renderer.draw_model(p, renderer.scale);
            }
        });

        /**
         * When the user lets go of the mouse, reset the tracking and set the offset to
         * the new origin point.
         */
        canvas.addEventListener("mouseup", function (event) {
            last = new Point(0, 0);
            if (drag) {
                if (canvas.contains(event.target)) {
                    renderer.scroll_offset.x += (event.clientX - start.x);
                    renderer.scroll_offset.y += (event.clientY - start.y);
                } else {
                    renderer.scroll_offset.x += (last.x - start.x);
                    renderer.scroll_offset.y += (last.y - start.y);
                }
            }
            down = false;
            start = null;
        });

        /**
         * Listen to scroll events and change the zoom factor.
         *
         * The scale factor goes from 0.5 to 3, with 1 being 1:1.
         */
        canvas.addEventListener("wheel", function (event) {
            event.preventDefault();
            let scale = renderer.scale;
            scale += event.deltaY * -0.001; // Determined through experimentation
            // Restrict scale
            scale = Math.min(Math.max(0.35, scale), 2);
            renderer.scale = scale;
            renderer.draw_model(renderer.scroll_offset, scale);
        }, {
            passive: false
        });
    }
}



// Set up the canvas
const canvas = document.getElementById('map');
/*const width = canvas.clientWidth;
const height = canvas.clientHeight;
canvas.width = width;
canvas.height = height;*/
/*const ccon = document.getElementById("canvas_container");
canvas.width = ccon.offsetWidth;
canvas.height = ccon.offsetHeight;*/
const renderer = new CanvasRenderer(new Canvas('map'));
renderer.canvas_mouse_handler();

window.addEventListener('DOMContentLoaded', (event) => {
    //window.ipc_bridge.load_from_github(system_data_ready);
    window.ipc_bridge.load_from_path('', (model) => {
        renderer.update_model(model);
    });
});