//
// The main UI logic
// Runs in sandbox, uses the API defined in js for drawing to
//

/**
 *
 * @param sys_list  An object which maps system names to system objects
 *
 * Look in naev.js for the definition of the System and Spob objects. Tragically
 * these objects lose their magic when crossing a JSON serialization boundary,
 * but they are basically just data containers and the data they contain are
 * unaffected by the serialization / deserialization process.
 */
function system_data_ready(sys_json) {
	const sys_map = JSON.parse(sys_json);
  var lowest = new Point(0, 0);
  var highest = new Point(0, 0);

  Object.keys(sys_map).forEach(function (key, index) {
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
  const scale = new Point(
    1000.0 / (highest.x - translation.x),
    1000.0 / (highest.y - translation.y)
  );

  console.log("Scale: ", scale);

  const color1 = "red";
  const color2 = "orange";
  const text_color = "white";
  const line_color = "yellow";

  Object.keys(sys_map).forEach(function (key, index) {
    const sys = this[key];
    const coords = new Point(
      (sys.x - translation.x) * scale.x,
      (sys.y - translation.y) * scale.y
    );
    const circle = new Circle(coords.x, coords.y, 10);
    drawcircle(circle, color1);
    label_circle(circle, sys.name, text_color);
    sys.jumps.forEach(function (target) {
      const target_sys = sys_map[target];
      const target_coords = new Point(
        (target_sys.x - translation.x) * scale.x,
        (target_sys.y - translation.y) * scale.y
      );
      const target_circle = new Circle(
        target_coords.x,
        target_coords.y,
        10
      );
      draw_connection(circle, target_circle, line_color);
    });
  }, sys_map);
}

window.addEventListener('DOMContentLoaded', (event) => {
	window.ipc_bridge.load_from_github(system_data_ready);
});