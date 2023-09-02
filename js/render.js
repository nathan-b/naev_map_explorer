//
// The main UI logic
// Runs in sandbox, uses the API defined in js for drawing to the canvas.
//

function flip_y(coords, max) {
    return new Point(coords.x, max.y - coords.y);
}

/**
 * The main render method. Give it a JSON object that's a hash mapping system
 * names to System objects.
 *
 * @param sys_list  An object which maps system names to system objects
 *
 * Look in naev.js for the definition of the System and Spob objects. Tragically
 * these objects lose their magic when crossing a JSON serialization boundary,
 * but they are basically just data containers and the data they contain are
 * unaffected by the serialization / deserialization process.
 *
 * One problem is that the x, y coordinates given by the system map assume that
 * 0, 0 is the center with y increasing toward the top, while the canvas object
 * uses the upper left corner as 0, 0 with y increasing toward the bottom. This
 * function corrects for that.
 */
function system_data_ready(sys_json) {
    const sys_map = JSON.parse(sys_json);
    var lowest = new Point(0, 0);
    var highest = new Point(0, 0);
    const canvas = document.getElementById('map');

    Object.keys(sys_map).forEach(function(key, index) {
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
    }, sys_map);

    console.log("Found points:", Object.keys(sys_map).length);
    console.log("Dimensions:", lowest.x, lowest.y, highest.x, highest.y);

    const translation = lowest;
    const dims = get_canvas_dimensions(canvas);
    console.log("Screen dimensions:", dims[0], dims[1]);
    // Use the same dimension for both x and y to keep an even aspect ratio
    const dim = Math.min(...dims);
    const scale = new Point(
        dim / (highest.x - lowest.x),
        dim / (highest.y - lowest.y)
    );
    const canvas_max = new Point(canvas.width, canvas.height);

    console.log("Scale: ", scale);

    const color_sys = "yellow";
    const color_refuel = "yellow";
    const color_outfitter = "orange";
    const color_shipyard = "green";
    const text_color = "white";
    const normal_jump = "blue";
    const hidden_jump = "red";
    const base_radius = 5;

    Object.keys(sys_map).forEach(function(key) {
        // Draw the system circle
        const sys = this[key];
        const coords = flip_y(new Point(
            (sys.x - translation.x) * scale.x,
            (sys.y - translation.y) * scale.y
        ), canvas_max);
        const circle = new Circle(coords.x, coords.y, base_radius);
        drawcircle(canvas, circle, color_sys);
        label_circle(canvas, circle, sys.name, text_color);

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
            drawcircle(canvas, inner, inner_color, true);
        }

        // Draw connections for each jump point
        sys.jumps.forEach(function(jump) {
            const target_sys = sys_map[jump.target];
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
            draw_connection(canvas, circle, target_circle, line_color);
        });
    }, sys_map);
    console.log("Done drawing");
}

// Set up the canvas
const canvas = document.getElementById('map');
const width = canvas.clientWidth;
const height = canvas.clientHeight;
canvas.width = width;
canvas.height = height;

window.addEventListener('DOMContentLoaded', (event) => {
    //window.ipc_bridge.load_from_github(system_data_ready);
    window.ipc_bridge.load_from_path('', system_data_ready);
});