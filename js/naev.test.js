const { reconstruct_jump_positions, System, Jump, Spob } = require('./naev.js');

describe('Spob class', () => {
    test('constructor creates spob with correct properties', () => {
        const spob = new Spob('TestSpob', 100.5, 200.5, ['land', 'refuel'], []);

        expect(spob.name).toBe('TestSpob');
        expect(spob.x).toBe(100.5);
        expect(spob.y).toBe(200.5);
        expect(spob.land).toBe(true);
        expect(spob.refuel).toBe(true);
        expect(spob.restricted).toBe(false);
    });

    test('constructor parses string coordinates to floats', () => {
        const spob = new Spob('TestSpob', '123.456', '789.012', [], []);

        expect(spob.x).toBe(123.456);
        expect(spob.y).toBe(789.012);
    });

    test('constructor sets service flags correctly', () => {
        const spob = new Spob('FullService', 0, 0, ['land', 'refuel', 'outfits', 'shipyard'], []);

        expect(spob.land).toBe(true);
        expect(spob.refuel).toBe(true);
        expect(spob.outfits).toBe(true);
        expect(spob.shipyard).toBe(true);
    });

    test('constructor defaults missing services to false', () => {
        const spob = new Spob('MinimalSpob', 0, 0, [], []);

        expect(spob.land).toBe(false);
        expect(spob.refuel).toBe(false);
        expect(spob.outfits).toBe(false);
        expect(spob.shipyard).toBe(false);
    });

    test('constructor handles restricted tag', () => {
        const restricted = new Spob('RestrictedSpob', 0, 0, ['land'], ['restricted']);
        const normal = new Spob('NormalSpob', 0, 0, ['land'], []);

        expect(restricted.restricted).toBe(true);
        expect(normal.restricted).toBe(false);
    });

    test('constructor handles multiple tags', () => {
        const spob = new Spob('TaggedSpob', 0, 0, [], ['tag1', 'restricted', 'tag2']);

        expect(spob.restricted).toBe(true);
    });
});

describe('Jump class', () => {
    test('constructor creates jump with correct properties', () => {
        const jump = new Jump('TargetSystem', 100, 200, false, false);

        expect(jump.target).toBe('TargetSystem');
        expect(jump.x).toBe(100);
        expect(jump.y).toBe(200);
        expect(jump.hidden).toBe(false);
        expect(jump.autopos).toBe(false);
    });

    test('constructor handles null coordinates for autopos jumps', () => {
        const jump = new Jump('TargetSystem', null, null, false, true);

        expect(jump.target).toBe('TargetSystem');
        expect(jump.x).toBeNull();
        expect(jump.y).toBeNull();
        expect(jump.autopos).toBe(true);
    });

    test('constructor sets hidden flag correctly', () => {
        const hidden = new Jump('Target1', 0, 0, true, false);
        const normal = new Jump('Target2', 0, 0, false, false);

        expect(hidden.hidden).toBe(true);
        expect(normal.hidden).toBe(false);
    });

    test('constructor defaults hidden to false when not provided', () => {
        const jump = new Jump('Target', 100, 200, null, false);

        expect(jump.hidden).toBe(false);
    });

    test('constructor defaults autopos to false when not provided', () => {
        const jump = new Jump('Target', 100, 200, false);

        expect(jump.autopos).toBe(false);
    });
});

describe('System class', () => {
    test('constructor creates system with correct properties', () => {
        const system = new System('TestSystem', 100, 200, 5000);

        expect(system.name).toBe('TestSystem');
        expect(system.x).toBe(100);
        expect(system.y).toBe(200);
        expect(system.radius).toBe(5000);
        expect(system.spobs).toEqual([]);
        expect(system.jumps).toEqual([]);
    });

    test('constructor parses string coordinates to floats', () => {
        const system = new System('TestSystem', '123.456', '789.012');

        expect(system.x).toBe(123.456);
        expect(system.y).toBe(789.012);
    });

    test('constructor uses default radius when not provided', () => {
        const system = new System('TestSystem', 0, 0);

        expect(system.radius).toBe(10000);
    });

    test('addSpob adds spob to system', () => {
        const system = new System('TestSystem', 0, 0);
        const spob = new Spob('TestSpob', 100, 200, ['land'], []);

        system.addSpob(spob);

        expect(system.spobs).toHaveLength(1);
        expect(system.spobs[0]).toBe(spob);
        expect(system.spobs[0].name).toBe('TestSpob');
    });

    test('addSpob can add multiple spobs', () => {
        const system = new System('TestSystem', 0, 0);
        const spob1 = new Spob('Spob1', 100, 200, ['land'], []);
        const spob2 = new Spob('Spob2', 300, 400, ['refuel'], []);
        const spob3 = new Spob('Spob3', 500, 600, ['outfits'], []);

        system.addSpob(spob1);
        system.addSpob(spob2);
        system.addSpob(spob3);

        expect(system.spobs).toHaveLength(3);
        expect(system.spobs[0].name).toBe('Spob1');
        expect(system.spobs[1].name).toBe('Spob2');
        expect(system.spobs[2].name).toBe('Spob3');
    });

    test('addJump adds jump to system', () => {
        const system = new System('TestSystem', 0, 0);
        const jump = new Jump('TargetSystem', 1000, 2000, false, false);

        system.addJump(jump);

        expect(system.jumps).toHaveLength(1);
        expect(system.jumps[0]).toBe(jump);
        expect(system.jumps[0].target).toBe('TargetSystem');
    });

    test('addJump can add multiple jumps', () => {
        const system = new System('TestSystem', 0, 0);
        const jump1 = new Jump('Target1', 100, 200, false, false);
        const jump2 = new Jump('Target2', 300, 400, true, false);
        const jump3 = new Jump('Target3', null, null, false, true);

        system.addJump(jump1);
        system.addJump(jump2);
        system.addJump(jump3);

        expect(system.jumps).toHaveLength(3);
        expect(system.jumps[0].target).toBe('Target1');
        expect(system.jumps[1].target).toBe('Target2');
        expect(system.jumps[2].target).toBe('Target3');
    });

    test('system can have both spobs and jumps', () => {
        const system = new System('CompleteSystem', 0, 0);
        const spob = new Spob('Planet', 100, 200, ['land'], []);
        const jump = new Jump('OtherSystem', 1000, 2000, false, false);

        system.addSpob(spob);
        system.addJump(jump);

        expect(system.spobs).toHaveLength(1);
        expect(system.jumps).toHaveLength(1);
    });
});

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
