const { Circle, Point, degrees, radians, rotate } = require('./canvas.js');

// =============================================================================
// Math Utilities (degrees and radians conversion)
// =============================================================================

describe('Math.degrees', () => {
    test('converts 0 radians to 0 degrees', () => {
        expect(degrees(0)).toBe(0);
    });

    test('converts π radians to 180 degrees', () => {
        expect(degrees(Math.PI)).toBeCloseTo(180, 10);
    });

    test('converts 2π radians to 360 degrees', () => {
        expect(degrees(2 * Math.PI)).toBeCloseTo(360, 10);
    });

    test('converts π/2 radians to 90 degrees', () => {
        expect(degrees(Math.PI / 2)).toBeCloseTo(90, 10);
    });

    test('converts π/4 radians to 45 degrees', () => {
        expect(degrees(Math.PI / 4)).toBeCloseTo(45, 10);
    });

    test('converts π/6 radians to 30 degrees', () => {
        expect(degrees(Math.PI / 6)).toBeCloseTo(30, 10);
    });

    test('converts negative radians to negative degrees', () => {
        expect(degrees(-Math.PI)).toBeCloseTo(-180, 10);
        expect(degrees(-Math.PI / 2)).toBeCloseTo(-90, 10);
    });

    test('converts 3π/2 radians to 270 degrees', () => {
        expect(degrees(3 * Math.PI / 2)).toBeCloseTo(270, 10);
    });
});

describe('Math.radians', () => {
    test('converts 0 degrees to 0 radians', () => {
        expect(radians(0)).toBe(0);
    });

    test('converts 180 degrees to π radians', () => {
        expect(radians(180)).toBeCloseTo(Math.PI, 10);
    });

    test('converts 360 degrees to 2π radians', () => {
        expect(radians(360)).toBeCloseTo(2 * Math.PI, 10);
    });

    test('converts 90 degrees to π/2 radians', () => {
        expect(radians(90)).toBeCloseTo(Math.PI / 2, 10);
    });

    test('converts 45 degrees to π/4 radians', () => {
        expect(radians(45)).toBeCloseTo(Math.PI / 4, 10);
    });

    test('converts 30 degrees to π/6 radians', () => {
        expect(radians(30)).toBeCloseTo(Math.PI / 6, 10);
    });

    test('converts negative degrees to negative radians', () => {
        expect(radians(-180)).toBeCloseTo(-Math.PI, 10);
        expect(radians(-90)).toBeCloseTo(-Math.PI / 2, 10);
    });

    test('converts 270 degrees to 3π/2 radians', () => {
        expect(radians(270)).toBeCloseTo(3 * Math.PI / 2, 10);
    });
});

describe('Math utilities round-trip conversions', () => {
    test('degrees -> radians -> degrees preserves value', () => {
        const original_deg = 123.456;
        const rad = radians(original_deg);
        const back_to_deg = degrees(rad);
        expect(back_to_deg).toBeCloseTo(original_deg, 10);
    });

    test('radians -> degrees -> radians preserves value', () => {
        const original_rad = 2.5;
        const deg = degrees(original_rad);
        const back_to_rad = radians(deg);
        expect(back_to_rad).toBeCloseTo(original_rad, 10);
    });

    test('round-trip with common angles', () => {
        const test_angles_deg = [0, 30, 45, 60, 90, 120, 135, 150, 180, 270, 360];

        test_angles_deg.forEach(angle => {
            const rad = radians(angle);
            const back = degrees(rad);
            expect(back).toBeCloseTo(angle, 10);
        });
    });

    test('round-trip with common radians', () => {
        const test_angles_rad = [0, Math.PI/6, Math.PI/4, Math.PI/3, Math.PI/2, Math.PI, 2*Math.PI];

        test_angles_rad.forEach(angle => {
            const deg = degrees(angle);
            const back = radians(deg);
            expect(back).toBeCloseTo(angle, 10);
        });
    });
});

// =============================================================================
// rotate function
// =============================================================================

describe('rotate', () => {
    test('rotating by 0 degrees returns original point', () => {
        const p = new Point(100, 50);
        const origin = new Point(0, 0);

        const result = rotate(p, origin, 0);

        expect(result.x).toBeCloseTo(100, 10);
        expect(result.y).toBeCloseTo(50, 10);
    });

    test('rotating by 360 degrees returns original point', () => {
        const p = new Point(100, 50);
        const origin = new Point(0, 0);

        const result = rotate(p, origin, 360);

        expect(result.x).toBeCloseTo(100, 10);
        expect(result.y).toBeCloseTo(50, 10);
    });

    test('rotating point on x-axis by 90 degrees around origin', () => {
        const p = new Point(100, 0);
        const origin = new Point(0, 0);

        const result = rotate(p, origin, 90);

        // (100, 0) rotated 90° CCW around origin becomes (0, 100)
        expect(result.x).toBeCloseTo(0, 10);
        expect(result.y).toBeCloseTo(100, 10);
    });

    test('rotating point on x-axis by 180 degrees around origin', () => {
        const p = new Point(100, 0);
        const origin = new Point(0, 0);

        const result = rotate(p, origin, 180);

        // (100, 0) rotated 180° becomes (-100, 0)
        expect(result.x).toBeCloseTo(-100, 10);
        expect(result.y).toBeCloseTo(0, 10);
    });

    test('rotating point on x-axis by 270 degrees around origin', () => {
        const p = new Point(100, 0);
        const origin = new Point(0, 0);

        const result = rotate(p, origin, 270);

        // (100, 0) rotated 270° CCW (or 90° CW) becomes (0, -100)
        expect(result.x).toBeCloseTo(0, 10);
        expect(result.y).toBeCloseTo(-100, 10);
    });

    test('rotating point by 45 degrees around origin', () => {
        const p = new Point(100, 0);
        const origin = new Point(0, 0);

        const result = rotate(p, origin, 45);

        // (100, 0) rotated 45° CCW
        // x = 100 * cos(45°) = 100 * sqrt(2)/2 ≈ 70.71
        // y = 100 * sin(45°) = 100 * sqrt(2)/2 ≈ 70.71
        const expected = 100 * Math.sqrt(2) / 2;
        expect(result.x).toBeCloseTo(expected, 10);
        expect(result.y).toBeCloseTo(expected, 10);
    });

    test('rotating around non-origin point', () => {
        const p = new Point(150, 100);
        const origin = new Point(100, 100);

        const result = rotate(p, origin, 90);

        // Point is 50 units to the right of origin
        // After 90° rotation, it should be 50 units above origin
        expect(result.x).toBeCloseTo(100, 10);
        expect(result.y).toBeCloseTo(150, 10);
    });

    test('rotating point that is already at origin', () => {
        const p = new Point(50, 50);
        const origin = new Point(50, 50);

        const result = rotate(p, origin, 123);

        // Point at origin stays at origin regardless of rotation
        expect(result.x).toBeCloseTo(50, 10);
        expect(result.y).toBeCloseTo(50, 10);
    });

    test('rotating with negative angle (clockwise rotation)', () => {
        const p = new Point(100, 0);
        const origin = new Point(0, 0);

        const result = rotate(p, origin, -90);

        // -90° (clockwise) should give same result as 270° (CCW)
        expect(result.x).toBeCloseTo(0, 10);
        expect(result.y).toBeCloseTo(-100, 10);
    });

    test('rotating point in all four quadrants', () => {
        const origin = new Point(0, 0);

        // Quadrant I (positive x, positive y)
        const q1 = rotate(new Point(10, 10), origin, 90);
        expect(q1.x).toBeCloseTo(-10, 10);
        expect(q1.y).toBeCloseTo(10, 10);

        // Quadrant II (negative x, positive y)
        const q2 = rotate(new Point(-10, 10), origin, 90);
        expect(q2.x).toBeCloseTo(-10, 10);
        expect(q2.y).toBeCloseTo(-10, 10);

        // Quadrant III (negative x, negative y)
        const q3 = rotate(new Point(-10, -10), origin, 90);
        expect(q3.x).toBeCloseTo(10, 10);
        expect(q3.y).toBeCloseTo(-10, 10);

        // Quadrant IV (positive x, negative y)
        const q4 = rotate(new Point(10, -10), origin, 90);
        expect(q4.x).toBeCloseTo(10, 10);
        expect(q4.y).toBeCloseTo(10, 10);
    });

    test('multiple rotations are cumulative', () => {
        const p = new Point(100, 0);
        const origin = new Point(0, 0);

        // Two 45° rotations should equal one 90° rotation
        const step1 = rotate(p, origin, 45);
        const step2 = rotate(step1, origin, 45);

        const direct = rotate(p, origin, 90);

        expect(step2.x).toBeCloseTo(direct.x, 10);
        expect(step2.y).toBeCloseTo(direct.y, 10);
    });

    test('rotating maintains distance from origin', () => {
        const p = new Point(30, 40); // Distance from origin: sqrt(30^2 + 40^2) = 50
        const origin = new Point(0, 0);
        const initial_distance = Math.sqrt(30 * 30 + 40 * 40);

        const rotated = rotate(p, origin, 73); // Arbitrary angle

        const final_distance = Math.sqrt(
            Math.pow(rotated.x - origin.x, 2) +
            Math.pow(rotated.y - origin.y, 2)
        );

        // Distance should be preserved
        expect(final_distance).toBeCloseTo(initial_distance, 10);
    });

    test('rotation around arbitrary point maintains distance from that point', () => {
        const p = new Point(150, 200);
        const origin = new Point(100, 150);

        // Distance from point to origin
        const initial_distance = Math.sqrt(
            Math.pow(p.x - origin.x, 2) +
            Math.pow(p.y - origin.y, 2)
        );

        const rotated = rotate(p, origin, 127); // Arbitrary angle

        const final_distance = Math.sqrt(
            Math.pow(rotated.x - origin.x, 2) +
            Math.pow(rotated.y - origin.y, 2)
        );

        expect(final_distance).toBeCloseTo(initial_distance, 10);
    });

    test('rotating by small angle produces small change', () => {
        const p = new Point(100, 0);
        const origin = new Point(0, 0);

        const result = rotate(p, origin, 1); // 1 degree

        // 1 degree rotation at radius 100:
        // x ≈ 100 * cos(1°) ≈ 99.985
        // y ≈ 100 * sin(1°) ≈ 1.745
        expect(result.x).toBeCloseTo(99.985, 2);
        expect(result.y).toBeCloseTo(1.745, 2);

        // Verify it's close to but not exactly the original
        expect(result.y).toBeGreaterThan(0);
        expect(result.x).toBeLessThan(100);
    });
});

// =============================================================================
// Circle class
// =============================================================================

describe('Circle constructor', () => {
    test('creates circle with correct properties', () => {
        const circle = new Circle(100, 200, 50);

        expect(circle.x).toBe(100);
        expect(circle.y).toBe(200);
        expect(circle.r).toBe(50);
    });

    test('stores coordinates and radius', () => {
        const circle = new Circle(0, 0, 10);

        expect(circle.x).toBe(0);
        expect(circle.y).toBe(0);
        expect(circle.r).toBe(10);
    });

    test('handles negative coordinates', () => {
        const circle = new Circle(-50, -100, 25);

        expect(circle.x).toBe(-50);
        expect(circle.y).toBe(-100);
        expect(circle.r).toBe(25);
    });

    test('handles floating point values', () => {
        const circle = new Circle(123.456, 789.012, 34.567);

        expect(circle.x).toBeCloseTo(123.456, 3);
        expect(circle.y).toBeCloseTo(789.012, 3);
        expect(circle.r).toBeCloseTo(34.567, 3);
    });
});

describe('Circle.radius getter', () => {
    test('returns the radius value', () => {
        const circle = new Circle(0, 0, 50);

        expect(circle.radius).toBe(50);
    });

    test('radius getter equals r property', () => {
        const circle = new Circle(100, 200, 75);

        expect(circle.radius).toBe(circle.r);
    });
});

describe('Circle.origin getter', () => {
    test('returns Point with circle center coordinates', () => {
        const circle = new Circle(100, 200, 50);
        const origin = circle.origin;

        expect(origin).toBeInstanceOf(Point);
        expect(origin.x).toBe(100);
        expect(origin.y).toBe(200);
    });

    test('origin reflects current circle position', () => {
        const circle = new Circle(-25, 75, 10);
        const origin = circle.origin;

        expect(origin.x).toBe(circle.x);
        expect(origin.y).toBe(circle.y);
    });

    test('returns new Point instance each time', () => {
        const circle = new Circle(50, 50, 10);
        const origin1 = circle.origin;
        const origin2 = circle.origin;

        // Should be different instances
        expect(origin1).not.toBe(origin2);
        // But with same values
        expect(origin1.x).toBe(origin2.x);
        expect(origin1.y).toBe(origin2.y);
    });
});

describe('Circle.connecting_pts', () => {
    test('returns array of two points', () => {
        const c1 = new Circle(0, 0, 10);
        const c2 = new Circle(100, 0, 10);

        const points = c1.connecting_pts(c2);

        expect(Array.isArray(points)).toBe(true);
        expect(points).toHaveLength(2);
        expect(points[0]).toBeInstanceOf(Point);
        expect(points[1]).toBeInstanceOf(Point);
    });

    test('connects two horizontally aligned circles', () => {
        const c1 = new Circle(0, 0, 10);
        const c2 = new Circle(100, 0, 10);

        const [p1, p2] = c1.connecting_pts(c2);

        // Points should be on perimeters, not centers
        // For horizontal alignment, y should be same as circle centers
        expect(p1.y).toBeCloseTo(0, 1);
        expect(p2.y).toBeCloseTo(0, 1);

        // x coordinates should be at circle edges (radius + stroke_offset away from center)
        // p1 should be on right edge of left circle (at radius + 1 for stroke)
        expect(p1.x).toBeCloseTo(11, 1);
        // p2 should be on left edge of right circle (100 - radius - 1 for stroke)
        expect(p2.x).toBeCloseTo(89, 1);
    });

    test('works when circles are vertically stacked', () => {
        const c1 = new Circle(50, 0, 10);
        const c2 = new Circle(50, 100, 10);

        const [p1, p2] = c1.connecting_pts(c2);

        // For vertical alignment, x coordinates should be close to circle centers
        expect(p1.x).toBeCloseTo(50, 1);
        expect(p2.x).toBeCloseTo(50, 1);

        // Connection points should be on perimeters
        // p1 on bottom of top circle, p2 on top of bottom circle
        expect(Math.abs(p1.y - p2.y)).toBeGreaterThan(0);
    });

    test('handles circles at 45-degree angle', () => {
        const c1 = new Circle(0, 0, 10);
        const c2 = new Circle(100, 100, 10);

        const [p1, p2] = c1.connecting_pts(c2);

        // Points should be on the line connecting the centers
        // Distance from p1 to c1 center should be approximately radius + stroke_offset
        const dist1 = Math.sqrt(Math.pow(p1.x - 0, 2) + Math.pow(p1.y - 0, 2));
        expect(dist1).toBeCloseTo(11, 1);

        // Distance from p2 to c2 center should be approximately radius + stroke_offset
        const dist2 = Math.sqrt(Math.pow(p2.x - 100, 2) + Math.pow(p2.y - 100, 2));
        expect(dist2).toBeCloseTo(11, 1);
    });

    test('connecting_pts returns points from caller to other circle', () => {
        const c1 = new Circle(0, 0, 10);
        const c2 = new Circle(100, 50, 15);

        const [p1, p2] = c1.connecting_pts(c2);
        const [p1_rev, p2_rev] = c2.connecting_pts(c1);

        // When calling c1.connecting_pts(c2), p1 should be near c1 and p2 near c2
        // When calling c2.connecting_pts(c1), p1_rev should be near c2 and p2_rev near c1
        // So p1 should match p2_rev, and p2 should match p1_rev
        expect(p1.x).toBeCloseTo(p2_rev.x, 1);
        expect(p1.y).toBeCloseTo(p2_rev.y, 1);
        expect(p2.x).toBeCloseTo(p1_rev.x, 1);
        expect(p2.y).toBeCloseTo(p1_rev.y, 1);
    });

    test('handles same-sized circles', () => {
        const c1 = new Circle(0, 0, 20);
        const c2 = new Circle(80, 60, 20);

        const [p1, p2] = c1.connecting_pts(c2);

        // Both points should be at radius + stroke_offset distance from their respective centers
        const dist1 = Math.sqrt(Math.pow(p1.x, 2) + Math.pow(p1.y, 2));
        const dist2 = Math.sqrt(Math.pow(p2.x - 80, 2) + Math.pow(p2.y - 60, 2));

        expect(dist1).toBeCloseTo(21, 1);
        expect(dist2).toBeCloseTo(21, 1);
    });

    test('handles circles with different radii', () => {
        const c1 = new Circle(0, 0, 5);
        const c2 = new Circle(100, 0, 30);

        const [p1, p2] = c1.connecting_pts(c2);

        // Point 1 should be radius + stroke_offset from origin (5 + 1)
        const dist1 = Math.sqrt(Math.pow(p1.x, 2) + Math.pow(p1.y, 2));
        expect(dist1).toBeCloseTo(6, 1);

        // Point 2 should be radius + stroke_offset from (100, 0) (30 + 1)
        const dist2 = Math.sqrt(Math.pow(p2.x - 100, 2) + Math.pow(p2.y, 2));
        expect(dist2).toBeCloseTo(31, 1);
    });
});
