//
// The main UI logic
// Runs in sandbox, uses the API defined in js for drawing to the canvas.
//

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

    constructor(canvas) {
        this.canvas = canvas;
    }

    /**
     * Render the model to the canvas.
     */
    draw_model() {
        var lowest = new Point(0, 0);
        var highest = new Point(0, 0);

        Object.keys(this.systems).forEach(function (key, index) {
            const sys = this[key];
            if (sys.x < lowest.x) {
                lowest.x = sys.x;
            }
            if (sys.y < lowest.y) {
                lowest.y = sys.y;
            }
            if (sys.x > highest.x) {
                highest.x = sys.x;
            }
            if (sys.y > highest.y) {
                highest.y = sys.y;
            }
        }, this.systems);

        console.log("Found points:", Object.keys(this.systems).length);
        console.log("Dimensions:", lowest.x, lowest.y, highest.x, highest.y);

        const translation = lowest;
        const dims = this.canvas.get_dimensions();
        console.log("Screen dimensions:", dims[0], dims[1]);
        // Use the same dimension for both x and y to keep an even aspect ratio
        const dim = Math.min(...dims);
        const scale = new Point(
            dim / (highest.x - lowest.x),
            dim / (highest.y - lowest.y)
        );
        const canvas_max = new Point(this.canvas.canvas.width, this.canvas.canvas.height);

        console.log("Scale: ", scale);

        const color_sys = "yellow";
        const color_refuel = "yellow";
        const color_outfitter = "orange";
        const color_shipyard = "green";
        const text_color = "white";
        const normal_jump = "blue";
        const hidden_jump = "red";
        const base_radius = 5;
        const canvas = this.canvas;
        const systems = this.systems;

        Object.keys(this.systems).forEach(function (key) {
            // Draw the system circle
            const sys = this[key];
            const coords = flip_y(new Point(
                (sys.x - translation.x) * scale.x,
                (sys.y - translation.y) * scale.y
            ), canvas_max);
            const circle = new Circle(coords.x, coords.y, base_radius);
            canvas.draw_circle(circle, color_sys);
            canvas.label_circle(circle, sys.name, text_color);

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
                canvas.draw_circle(canvas, inner, inner_color, true);
            }

            // Draw connections for each jump point
            sys.jumps.forEach(function (jump) {
                const target_sys = systems[jump.target];
                const target_coords = flip_y(new Point(
                    (target_sys.x - translation.x) * scale.x,
                    (target_sys.y - translation.y) * scale.y
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
        console.log("Done drawing");
    }

    /**
     * Update the stored systems model from the latest json.
     * @param {*} sys_json A JSON representation of a list of systems.
     */
    update_model(sys_json) {
        this.systems = JSON.parse(sys_json);
        this.draw_model();
    }
}


// Set up the canvas
const canvas = document.getElementById('map');
const width = canvas.clientWidth;
const height = canvas.clientHeight;
canvas.width = width;
canvas.height = height;
const renderer = new CanvasRenderer(new Canvas('map'));

window.addEventListener('DOMContentLoaded', (event) => {
    //window.ipc_bridge.load_from_github(system_data_ready);
    window.ipc_bridge.load_from_path('', (model) => {
        renderer.update_model(model);
    });
});