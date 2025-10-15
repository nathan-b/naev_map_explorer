const { reconstruct_jump_positions, System, Jump } = require('./naev.js');

describe('reconstruct_jump_positions', () => {
    test('calculates autopos jump positions correctly', () => {
        // Create two systems with known positions
        const system_a = new System('SystemA', 0, 0, 5000);
        const system_b = new System('SystemB', 10000, 0, 5000);

        // Add an autopos jump from SystemA to SystemB
        system_a.addJump(new Jump('SystemB', null, null, false, true));

        const system_map = {
            'SystemA': system_a,
            'SystemB': system_b
        };

        // Run the reconstruction
        reconstruct_jump_positions(system_map);

        // The jump should be positioned at the system radius along the angle to SystemB
        // SystemB is directly to the right (angle = 0), so jump should be at (5000, 0)
        const jump = system_a.jumps[0];
        expect(jump.x).toBeCloseTo(5000, 1);
        expect(jump.y).toBeCloseTo(0, 1);
    });

    test('calculates autopos jump at 45 degree angle', () => {
        // Create two systems at 45 degree angle
        const system_a = new System('SystemA', 0, 0, 5000);
        const system_b = new System('SystemB', 10000, 10000, 5000);

        // Add an autopos jump from SystemA to SystemB
        system_a.addJump(new Jump('SystemB', null, null, false, true));

        const system_map = {
            'SystemA': system_a,
            'SystemB': system_b
        };

        reconstruct_jump_positions(system_map);

        // At 45 degrees, both x and y should be equal and form a 45-degree angle
        // x = radius * cos(45°), y = radius * sin(45°)
        const jump = system_a.jumps[0];
        const expected = 5000 * Math.cos(Math.PI / 4);
        expect(jump.x).toBeCloseTo(expected, 1);
        expect(jump.y).toBeCloseTo(expected, 1);
    });

    test('does not modify non-autopos jumps', () => {
        const system_a = new System('SystemA', 0, 0, 5000);
        const system_b = new System('SystemB', 10000, 0, 5000);

        // Add a non-autopos jump with explicit coordinates
        system_a.addJump(new Jump('SystemB', 1000, 2000, false, false));

        const system_map = {
            'SystemA': system_a,
            'SystemB': system_b
        };

        reconstruct_jump_positions(system_map);

        // Coordinates should remain unchanged
        const jump = system_a.jumps[0];
        expect(jump.x).toBe(1000);
        expect(jump.y).toBe(2000);
    });

    test('handles missing target system gracefully', () => {
        const system_a = new System('SystemA', 0, 0, 5000);

        // Add an autopos jump to a non-existent system
        system_a.addJump(new Jump('NonExistent', null, null, false, true));

        const system_map = {
            'SystemA': system_a
        };

        // Should not throw
        expect(() => reconstruct_jump_positions(system_map)).not.toThrow();

        // Jump coordinates should remain null
        const jump = system_a.jumps[0];
        expect(jump.x).toBeNull();
        expect(jump.y).toBeNull();
    });

    test('normalizes negative angles correctly', () => {
        // Create system B to the left and below A (third quadrant)
        const system_a = new System('SystemA', 0, 0, 5000);
        const system_b = new System('SystemB', -10000, -10000, 5000);

        system_a.addJump(new Jump('SystemB', null, null, false, true));

        const system_map = {
            'SystemA': system_a,
            'SystemB': system_b
        };

        reconstruct_jump_positions(system_map);

        // At 225 degrees (or -135 degrees), both x and y should be negative
        const jump = system_a.jumps[0];
        const expected = 5000 * Math.cos(Math.PI * 5 / 4); // 225 degrees in radians
        expect(jump.x).toBeCloseTo(expected, 1);
        expect(jump.y).toBeCloseTo(5000 * Math.sin(Math.PI * 5 / 4), 1);
    });
});
