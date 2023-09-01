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
    const canvas = document.getElementById('test');

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

    const color1 = "red";
    const color2 = "orange";
    const text_color = "white";
    const line_color = "yellow";

    Object.keys(sys_map).forEach(function(key, index) {
        const sys = this[key];
        const coords = flip_y(new Point(
            (sys.x - translation.x) * scale.x,
            (sys.y - translation.y) * scale.y
        ), canvas_max);
        const circle = new Circle(coords.x, coords.y, 10);
        drawcircle(canvas, circle, color1);
        label_circle(canvas, circle, sys.name, text_color);
        sys.jumps.forEach(function(target) {
            const target_sys = sys_map[target];
            const target_coords = flip_y(new Point(
                (target_sys.x - translation.x) * scale.x,
                (target_sys.y - translation.y) * scale.y
            ), canvas_max);
            const target_circle = new Circle(
                target_coords.x,
                target_coords.y,
                10
            );
            draw_connection(canvas, circle, target_circle, line_color);
        });
    }, sys_map);
    console.log("Done drawing");
}

// Set up the canvas
const canvas = document.getElementById('test');
const width = canvas.clientWidth;
const height = canvas.clientHeight;
canvas.width = width;
canvas.height = height;

window.addEventListener('DOMContentLoaded', (event) => {
    //window.ipc_bridge.load_from_github(system_data_ready);
    window.ipc_bridge.load_from_path('', system_data_ready);
});