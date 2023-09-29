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

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
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
        let p1, p2;

        // We want p1 to be the leftmost circle
        if (this.x < other.x) {
            p1 = {
                ...this
            };
            p2 = {
                ...other
            };
        } else {
            p1 = {
                ...other
            };
            p2 = {
                ...this
            };
        }

        // Calculate the x and y distances between the center points of the circles
        let dx = Math.abs(p1.x - p2.x);
        let dy = Math.abs(p1.y - p2.y);

        // In a right triangle, the arctan of the ratio (perpendicular / base) provides
        // the value of the corresponding angle between the base and the hypotenuse.
        let alpha = Math.degrees(Math.atan(dy / dx));
        let beta = 90 - alpha;

        // Need to scale the resulting line by the radius
        return [
            rotate({
                    ...p1,
                    x: p1.x + p1.r
                },
                p1,
                (p2.y < p1.y ? 360 : alpha * 2) - alpha
            ),
            rotate({
                    ...p2,
                    x: p2.x + p2.r
                },
                p2,
                (p2.y > p1.y ? 270 - 2 * beta : 90) + beta
            )
        ];
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
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);

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