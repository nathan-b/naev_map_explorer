//
// The main UI logic
// Runs in sandbox, uses the API defined in js for drawing to the canvas.
//
// Note: flip_y() is defined in canvas.js

/**
 * Resize the canvas to its correct area within the window
 */
function set_canvas_size() {
    const canvas = window.document.getElementById('map');
    const controls = window.document.getElementById('controls');
    const status = window.document.getElementById('status');
    const hr_elements = window.document.querySelectorAll('hr');

    const width = window.innerWidth - 50;

    // Force layout calculation to ensure accurate measurements
    controls.getBoundingClientRect();
    status.getBoundingClientRect();

    let reserved_height = controls.offsetHeight + status.offsetHeight;

    // Add height of all hr elements
    hr_elements.forEach(hr => {
        reserved_height += hr.offsetHeight;
    });

    const height = window.innerHeight - reserved_height - 40; // Extra margin for spacing and safety
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
    // Reset zoom and scroll to defaults
    minimap.scroll_offset = new Point(0, 0);
    minimap.scale = 1.0;
}

/**
 * Show the search UI and hide the loading UI
 */
function show_search_ui() {
    const loading_ui = window.document.getElementById('loading_ui');
    const search_ui = window.document.getElementById('search_ui');
    loading_ui.style.display = 'none';
    search_ui.classList.add('visible');
}

/**
 * Show the loading UI and hide the search UI
 */
function show_loading_ui() {
    const loading_ui = window.document.getElementById('loading_ui');
    const search_ui = window.document.getElementById('search_ui');
    loading_ui.style.display = 'flex';
    search_ui.classList.remove('visible');
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
 * @param {*} all_systems  All systems data (for looking up jump targets)
 */
minimap.update_model = function (system, all_systems) {
    this.context = {
        'system': system,
        'all_systems': all_systems
    }
    this.draw_model(this.scroll_offset, this.scale);

    // Create the close button if it doesn't exist
    if (!minimapCloseButton) {
        minimapCloseButton = document.createElement("button");
        minimapCloseButton.textContent = "X";
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
    // Don't render if no data have been loaded yet
    if (!this.context || !this.context.system) {
        return;
    }

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

    // Iterate once through the spobs and jumps to get a bounding box
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
    for (const jump of system.jumps) {
        const coords = flip_y(new Point(jump.x, jump.y), canvas_max);
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
        const coords = translate(new Point(spob.x, spob.y));
        console.log("Drawing spob", spob.name, "at", spob.x, spob.y, coords.x, coords.y);

        // Draw outer circle (red if restricted, white otherwise)
        const circle = new Circle(coords.x, coords.y, base_radius);
        const outer_color = spob.restricted ? color_restricted : "white";
        const circle2d = canvas.draw_circle(circle, outer_color);

        // Draw inner filled circle based on services (if not restricted)
        if (!spob.restricted) {
            let inner_color = null;
            if (spob.shipyard) {
                inner_color = color_shipyard;
            } else if (spob.outfits) {
                inner_color = color_outfitter;
            } else if (spob.refuel) {
                inner_color = color_refuel;
            }
            if (inner_color !== null) {
                const inner = new Circle(coords.x, coords.y, base_radius - 1);
                canvas.draw_circle(inner, inner_color, true);
            }
        }

        canvas.label_circle(circle, spob.name, color_text);
    }

    // Draw the jumps
    const all_systems = this.context.all_systems;
    for (const jump of system.jumps) {
        let color = normal_jump;
        if (jump.hidden) {
            color = hidden_jump;
        }

        // Draw the jump gate as a triangle pointing toward the target system
        const coords = translate(new Point(jump.x, jump.y));

        // Calculate angle from current system to target system
        // Note: We need to account for the y-axis flip in canvas coordinates
        let angle = 0;
        if (all_systems && all_systems[jump.target]) {
            const target_sys = all_systems[jump.target];
            const dx = target_sys.x - system.x;
            const dy = target_sys.y - system.y;
            // Negate dy to account for flip_y transformation
            angle = Math.atan2(-dy, dx);
        }

        canvas.draw_triangle(coords, base_radius, angle, color);
        canvas.label_circle(new Circle(coords.x, coords.y, base_radius), jump.target, color_text);
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
        hitbox_cache: [],
        search_text: ""
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
                minimap.update_model(element.system, renderer.context.systems);
                show_minimap();
                console.log("User clicked", element.system.name);
                return;
            }
        });
    }
}

/**
 * Get the color palette for drawing a system and its jumps.
 * @param {*} system The system object
 * @param {boolean} matches_search Whether the system matches the current search
 * @returns {object} Color palette with properties: color_sys, color_refuel, color_outfitter, color_shipyard, text_color, normal_jump, hidden_jump
 */
function get_colors(system, matches_search) {
    if (matches_search) {
        // Normal bright colors for matching systems
        return {
            color_sys: "yellow",
            color_refuel: "yellow",
            color_outfitter: "orange",
            color_shipyard: "green",
            text_color: "white",
            normal_jump: "blue",
            hidden_jump: "red"
        };
    } else {
        // Dimmed colors for non-matching systems
        return {
            color_sys: "#333333",
            color_refuel: "#333333",
            color_outfitter: "#333333",
            color_shipyard: "#333333",
            text_color: "#555555",
            normal_jump: "#222222",
            hidden_jump: "#222222"
        };
    }
}

/**
 * Draw the stored system map (saved in update_model)
 */
renderer.draw_model = function (origin, scale) {
    // Don't render if no data have been loaded yet
    if (!this.context || !this.context.systems) {
        return;
    }

    this.canvas.clear();
    set_canvas_size();
    this.canvas.set_origin_and_scale(origin, scale);

    const canvas_max = new Point(this.canvas.canvas.width, this.canvas.canvas.height);

    const base_radius = 6;
    const canvas = this.canvas;
    const context = this.context;
    context.hitbox_cache = [];

    Object.keys(context.systems).forEach(function (key) {
        // Draw the system circle
        const sys = this[key];

        // Determine if this system matches the search text
        // Check both system name and spob names within the system
        const matches_search = !context.search_text ||
                              sys.name.toLowerCase().includes(context.search_text.toLowerCase()) ||
                              sys.spobs.some(spob => spob.name.toLowerCase().includes(context.search_text.toLowerCase()));

        // Get the appropriate color palette for this system
        const colors = get_colors(sys, matches_search);

        const coords = flip_y(new Point(sys.x, sys.y), canvas_max);
        const circle = new Circle(coords.x, coords.y, base_radius);
        const circle2d = canvas.draw_circle(circle, colors.color_sys);
        canvas.label_circle(circle, sys.name, colors.text_color);
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
            inner_color = colors.color_shipyard;
        } else if (services.outfitter) {
            inner_color = colors.color_outfitter;
        } else if (services.refuel) {
            inner_color = colors.color_refuel;
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
            const line_color = jump.hidden ? colors.hidden_jump : colors.normal_jump;
            canvas.draw_connection(circle, target_circle, line_color);
        });
    }, context.systems);
};

// Set up mouse interactivity
renderer.canvas_mouse_handler();

window.addEventListener('DOMContentLoaded', async (event) => {
    // Set up button event listeners
    const controls = document.getElementById('controls');
    const buttons = controls.querySelectorAll('button');
    const path_input = document.getElementById('naev_path');

    // Populate the path input with auto-detected path
    const autodetected_path = await window.ipc_bridge.get_autodetected_path();
    if (autodetected_path) {
        path_input.value = autodetected_path;
    }

    // "Load from local path" button
    buttons[0].addEventListener('click', () => {
        const path = path_input.value || '';
        const status_elem = document.getElementById('statustext');
        console.log('Loading from path:', path);
        status_elem.textContent = 'Loading from local path...';
        window.ipc_bridge.load_from_path(path, (model) => {
            if (model) {
                renderer.update_model(model);
                status_elem.textContent = 'Successfully loaded from local path';
                show_search_ui();
            } else {
                status_elem.textContent = 'Failed to load from local path. Check the console for errors.';
                console.error('Failed to load from path:', path);
            }
        });
    });

    // "Load data from GitHub" button
    buttons[1].addEventListener('click', () => {
        const status_elem = document.getElementById('statustext');
        console.log('Loading from GitHub');
        status_elem.textContent = 'Loading from GitHub...';
        window.ipc_bridge.load_from_github((model) => {
            if (model) {
                renderer.update_model(model);
                status_elem.textContent = 'Successfully loaded from GitHub';
                show_search_ui();
            } else {
                status_elem.textContent = 'Failed to load from GitHub. Check your internet connection and console for errors.';
                console.error('Failed to load from GitHub');
            }
        });
    });

    // "Load new data" button
    const load_new_data_btn = document.getElementById('load_new_data_btn');
    load_new_data_btn.addEventListener('click', () => {
        show_loading_ui();
    });

    // "Search" button
    const search_btn = document.getElementById('search_btn');
    const search_box = document.getElementById('search_box');

    const perform_search = () => {
        if (renderer.context) {
            renderer.context.search_text = search_box.value;
            renderer.draw_model(renderer.scroll_offset, renderer.scale);
        }
    };

    search_btn.addEventListener('click', perform_search);

    // "Clear" button
    const clear_btn = document.getElementById('clear_btn');
    clear_btn.addEventListener('click', () => {
        if (renderer.context) {
            search_box.value = '';
            renderer.context.search_text = '';
            renderer.draw_model(renderer.scroll_offset, renderer.scale);
        }
    });

    // Enter key in search box performs search
    search_box.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            perform_search();
        }
    });

    // Add a resize listener so the canvas can correctly size to the window
    window.addEventListener('resize', () => {
        renderer.draw_model(renderer.scroll_offset, renderer.scale);
    });
});