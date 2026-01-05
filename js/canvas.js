//
// Drawing / canvas stuff
// Runs in sandbox
//
function rotate(p, o, deg) {
    let dx = p.x - o.x;
    let dy = p.y - o.y;

    let x = dx * Math.cos(Math.radians(deg)) - dy * Math.sin(Math.radians(deg));
    let y = dx * Math.sin(Math.radians(deg)) + dy * Math.cos(Math.radians(deg));

    return new Point(x + o.x, y + o.y);
}

/**
 * Convert radians to degrees
 *
 * @param {*} radians  Angle in radians
 * @returns Angle in degrees
 */
Math.degrees = function (radians) {
    return (radians * 180) / Math.PI;
};

/**
 * Convert degrees to radians
 *
 * @param {*} degrees  Angle in degrees
 * @returns Angle in radians
 */
Math.radians = function (degrees) {
    return (degrees * Math.PI) / 180;
};

/**********************************************************
 * Represents a simple x, y point on a 2d coordinate plane.
 */
class Point {
    x = 0;
    y = 0;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

/**
 * Flip y-coordinates from Naev's Cartesian system to canvas coordinates.
 *
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
 * @param {Point} coords  x, y coordinates for the point to flip
 * @param {Point} max     x, y coordinates for the max (typically canvas dimensions)
 * @returns {Point} Transformed coordinates
 */
function flip_y(coords, max) {
    return new Point(coords.x, max.y - coords.y);
}

/**********************************************************
 * Describes a circle with origin (x, y) and radius.
 */
class Circle {
    x = 0;
    y = 0;
    r = 0;

    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }

    get radius() {
        return this.r;
    }

    get origin() {
        return new Point(this.x, this.y);
    }

    /**
     * Get a set of points for connecting this circle with another.
     * @param {*} other  The other circle to connect with
     * @returns  Two-element array of Point objects representing the start and
     *           end points of the connecting line
     */
    connecting_pts(other) {
        // Calculate the vector from this circle to the other
        const dx = other.x - this.x;
        const dy = other.y - this.y;

        // Calculate the distance between circle centers
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If circles are at the same position, return the centers
        if (distance === 0) {
            return [new Point(this.x, this.y), new Point(other.x, other.y)];
        }

        // Normalize the direction vector
        const norm_dx = dx / distance;
        const norm_dy = dy / distance;

        // Account for the stroke width (lineWidth = 2, so half is 1 pixel)
        // The visual edge is at radius + 1
        const stroke_offset = 1;

        // Calculate the points on the visual edge of each circle
        const start_point = new Point(
            this.x + (this.r + stroke_offset) * norm_dx,
            this.y + (this.r + stroke_offset) * norm_dy
        );

        const end_point = new Point(
            other.x - (other.r + stroke_offset) * norm_dx,
            other.y - (other.r + stroke_offset) * norm_dy
        );

        return [start_point, end_point];
    }
}

/**********************************************************
 * A wrapper class for an HTML5 canvas object.
 */
class Canvas {
    canvas;
    ctx;

    constructor(celem_id) {
        this.canvas = document.getElementById(celem_id);
        this.ctx = this.canvas.getContext("2d");
    }

    get_dimensions() {
        return [this.canvas.width, this.canvas.height];
    }

    /**
     * Set the coordinates of the canvas origin and the scale factor.
     * @param {*} point   Point representing the new (0, 0)
     * @param {*} scale   The new scale factor for the canvas
     */
    set_origin_and_scale(point, scale) {
        // First reset the translation
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        // Then set the new translation
        this.ctx.translate(point.x, point.y);
        this.ctx.scale(scale, scale);
    }

    /**
     * Clear the canvas.
     */
    clear() {
        // Store the current transformation matrix
        this.ctx.save();

        // Use the identity matrix while clearing the canvas
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Restore the transform
        this.ctx.restore();
    }

    /**
     * Draw a circle on the canvas.
     *
     * @param {*} circ    Circle object (has fields .x, .y, and .r for x,y coords and radius)
     * @param {*} color   Color of the circle to draw
     * @param {*} fill    Should the circle be filled in?
     *
     * @returns  Hitbox for the circle (Path2D object)
     */
    draw_circle(circ, color, fill = false) {
        const circle = new Path2D();

        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 2;
        circle.arc(circ.x, circ.y, circ.r, 0, Math.PI * 2, true); // Circle
        if (fill) {
            this.ctx.fill(circle);
        } else {
            this.ctx.stroke(circle);
        }

        // Draw a hitbox
        const hitbox = new Path2D();
        const d = 2 * circ.r;
        hitbox.rect(circ.x - circ.r, circ.y - circ.r, d, d);
        return hitbox;
    }

    /**
     * Draw a triangle on the canvas pointing in a specific direction.
     *
     * @param {*} position  Point object with x, y coordinates for the triangle center
     * @param {*} size      Size of the triangle (distance from center to vertex)
     * @param {*} angle     Angle in radians the triangle should point (0 = right, PI/2 = up)
     * @param {*} color     Color of the triangle to draw
     * @param {*} fill      Should the triangle be filled in?
     *
     * @returns  Hitbox for the triangle (Path2D object)
     */
    draw_triangle(position, size, angle, color, fill = false) {
        const triangle = new Path2D();

        // Calculate the three vertices of the triangle
        // Vertex 1 (point): straight ahead in the direction of angle
        const v1_x = position.x + size * Math.cos(angle);
        const v1_y = position.y + size * Math.sin(angle);

        // Vertex 2: 120 degrees counter-clockwise from point
        const v2_x = position.x + size * Math.cos(angle + Math.PI * 2 / 3);
        const v2_y = position.y + size * Math.sin(angle + Math.PI * 2 / 3);

        // Vertex 3: 120 degrees clockwise from point
        const v3_x = position.x + size * Math.cos(angle - Math.PI * 2 / 3);
        const v3_y = position.y + size * Math.sin(angle - Math.PI * 2 / 3);

        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 2;

        triangle.moveTo(v1_x, v1_y);
        triangle.lineTo(v2_x, v2_y);
        triangle.lineTo(v3_x, v3_y);
        triangle.closePath();

        if (fill) {
            this.ctx.fill(triangle);
        } else {
            this.ctx.stroke(triangle);
        }

        // Create a circular hitbox for simplicity
        const hitbox = new Path2D();
        hitbox.arc(position.x, position.y, size, 0, Math.PI * 2);
        return hitbox;
    }

    /**
     * Draw a line on the canvas.
     *
     * @param {*} start   Starting coordinates (.x and .y fields)
     * @param {*} end     Ending coordinates (.x and .y fields)
     * @param {*} color   Line color
     */
    draw_line(start, end, color) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
    }

    /**
     * Draw a line connecting the two given circles.
     *
     * The line will be drawn from the perimeter of one circle to the perimeter of
     * the other.
     * @param {*} circle1  The first circle to connect
     * @param {*} circle2  The second circle to connect
     * @param {*} color    The color of the line
     */
    draw_connection(circle1, circle2, color) {
        const [p1, p2] = circle1.connecting_pts(circle2);
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
    }

    /**
     * Label the given circle with the given text label.
     * @param {*} circle   The circle to label
     * @param {*} text     The text of the label
     * @param {*} color    The color of the label
     */
    label_circle(circle, text, color) {
        this.ctx.font = "18px sans";
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, circle.x + circle.r, circle.y - circle.r);
    }
}

/**********************************************************
 * Contains all the context for rendering a model to canvas.
 */
class CanvasRenderer {
    canvas;
    scroll_offset;
    scale;

    context; ///< Canvas-specific context stored for this renderer object

    // Callbacks
    update_model = function (model_data) {}; ///< Update the model
    draw_model = function (origin, scale) {}; ///< Render the model to the canvas
    on_click = function (event) {}; ///< Fires when the user clicks on the canvas

    constructor(canvas) {
        this.canvas = canvas;
        this.scroll_offset = new Point(0, 0);
        this.scale = 1.0;
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
         * Detect clicks on the canvas, but drags don't count as clicks.
         */
        canvas.addEventListener("click", function (event) {
            // Figure out which system (if any) the user clicked on
            if (drag) {
                drag = false;
                event.preventDefault();
                event.stopPropagation();
            } else {
                renderer.on_click(event);
            }
        });

        /**
         * When the user presses the mouse button while on the canvas, record the coordinates.
         */
        canvas.addEventListener("mousedown", function (event) {
            start = new Point(event.clientX, event.clientY);
            down = true;
        });

        /**
         * When the user moves the mouse while pressed, scroll the canvas by the offset between
         * the current mouse position and the original click position.
         */
        canvas.addEventListener("mousemove", function (event) {
            if (down) {
                drag = true;
            }
            if (renderer.draw_model !== null && drag && canvas.contains(event.target)) {
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

// Export for Node.js testing (module.exports is undefined in browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Point,
        Circle,
        flip_y,
        degrees: Math.degrees,
        radians: Math.radians,
        rotate
    };
}