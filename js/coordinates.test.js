const { Point, flip_y } = require('./canvas.js');

describe('flip_y', () => {
    test('flips y coordinate while keeping x unchanged', () => {
        const coords = new Point(100, 50);
        const max = new Point(800, 600);

        const result = flip_y(coords, max);

        expect(result.x).toBe(100);  // x unchanged
        expect(result.y).toBe(550);  // max.y - coords.y = 600 - 50 = 550
    });

    test('handles origin point (0, 0)', () => {
        const coords = new Point(0, 0);
        const max = new Point(800, 600);

        const result = flip_y(coords, max);

        expect(result.x).toBe(0);
        expect(result.y).toBe(600);  // Origin moves to bottom-left
    });

    test('handles point at max coordinates', () => {
        const coords = new Point(800, 600);
        const max = new Point(800, 600);

        const result = flip_y(coords, max);

        expect(result.x).toBe(800);
        expect(result.y).toBe(0);  // Top-right becomes top-right
    });

    test('handles negative coordinates', () => {
        const coords = new Point(-100, -50);
        const max = new Point(800, 600);

        const result = flip_y(coords, max);

        expect(result.x).toBe(-100);  // Negative x unchanged
        expect(result.y).toBe(650);   // max.y - (-50) = 600 + 50 = 650
    });

    test('handles point at vertical center', () => {
        const coords = new Point(400, 300);
        const max = new Point(800, 600);

        const result = flip_y(coords, max);

        expect(result.x).toBe(400);
        expect(result.y).toBe(300);  // Center point stays at center
    });

    test('transforms upper-right quadrant correctly', () => {
        // In Naev coords: positive x, positive y (upper-right quadrant)
        const coords = new Point(200, 400);
        const max = new Point(1000, 1000);

        const result = flip_y(coords, max);

        expect(result.x).toBe(200);
        expect(result.y).toBe(600);  // Flipped: becomes lower-right in canvas coords
    });

    test('transforms lower-left quadrant correctly', () => {
        // In Naev coords: negative x, negative y (lower-left quadrant)
        const coords = new Point(-200, -400);
        const max = new Point(1000, 1000);

        const result = flip_y(coords, max);

        expect(result.x).toBe(-200);  // Still negative x (off-screen to left)
        expect(result.y).toBe(1400);  // Becomes large y (off-screen below)
    });

    test('preserves x coordinate independence', () => {
        // The function should not use max.x at all
        const coords = new Point(500, 300);
        const max1 = new Point(800, 600);
        const max2 = new Point(1200, 600);  // Different max.x

        const result1 = flip_y(coords, max1);
        const result2 = flip_y(coords, max2);

        expect(result1.x).toBe(result2.x);  // x should be the same
        expect(result1.y).toBe(result2.y);  // y should also be the same (only depends on max.y)
    });

    test('works with floating point coordinates', () => {
        const coords = new Point(123.456, 789.012);
        const max = new Point(1920.5, 1080.75);

        const result = flip_y(coords, max);

        expect(result.x).toBeCloseTo(123.456, 3);
        expect(result.y).toBeCloseTo(291.738, 3);  // 1080.75 - 789.012
    });
});

describe('Point', () => {
    test('creates point with correct coordinates', () => {
        const p = new Point(100, 200);

        expect(p.x).toBe(100);
        expect(p.y).toBe(200);
    });

    test('defaults to (0, 0) if no arguments', () => {
        const p = new Point();

        expect(p.x).toBe(0);
        expect(p.y).toBe(0);
    });

    test('handles negative coordinates', () => {
        const p = new Point(-50, -100);

        expect(p.x).toBe(-50);
        expect(p.y).toBe(-100);
    });
});
