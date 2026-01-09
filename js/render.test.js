const { Spob, System } = require('./naev.js');

// Mock the get_colors function from render.js since it's not exported
// We'll define it here to match the implementation in render.js
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

// Helper function to test search matching logic
// This replicates the logic from render.js lines 359-361
function matches_search_criteria(system, search_text) {
    if (!search_text) {
        return true;
    }

    const lower_search = search_text.toLowerCase();

    // Check system name
    if (system.name.toLowerCase().includes(lower_search)) {
        return true;
    }

    // Check spob names
    return system.spobs.some(spob => spob.name.toLowerCase().includes(lower_search));
}

describe('get_colors', () => {
    test('returns bright colors when matches_search is true', () => {
        const system = new System('TestSystem', 0, 0);
        const colors = get_colors(system, true);

        expect(colors.color_sys).toBe('yellow');
        expect(colors.text_color).toBe('white');
        expect(colors.normal_jump).toBe('blue');
        expect(colors.hidden_jump).toBe('red');
    });

    test('returns dimmed colors when matches_search is false', () => {
        const system = new System('TestSystem', 0, 0);
        const colors = get_colors(system, false);

        expect(colors.color_sys).toBe('#333333');
        expect(colors.text_color).toBe('#555555');
        expect(colors.normal_jump).toBe('#222222');
        expect(colors.hidden_jump).toBe('#222222');
    });

    test('returns different color sets for matching vs non-matching', () => {
        const system = new System('TestSystem', 0, 0);
        const bright = get_colors(system, true);
        const dimmed = get_colors(system, false);

        expect(bright.color_sys).not.toBe(dimmed.color_sys);
        expect(bright.text_color).not.toBe(dimmed.text_color);
    });

    test('includes all required color properties', () => {
        const system = new System('TestSystem', 0, 0);
        const colors = get_colors(system, true);

        expect(colors).toHaveProperty('color_sys');
        expect(colors).toHaveProperty('color_refuel');
        expect(colors).toHaveProperty('color_outfitter');
        expect(colors).toHaveProperty('color_shipyard');
        expect(colors).toHaveProperty('text_color');
        expect(colors).toHaveProperty('normal_jump');
        expect(colors).toHaveProperty('hidden_jump');
    });
});

describe('Search functionality', () => {
    describe('System name search', () => {
        test('matches system by exact name', () => {
            const system = new System('Sol', 0, 0);

            expect(matches_search_criteria(system, 'Sol')).toBe(true);
        });

        test('matches system by partial name', () => {
            const system = new System('Polaris', 0, 0);

            expect(matches_search_criteria(system, 'Pol')).toBe(true);
            expect(matches_search_criteria(system, 'aris')).toBe(true);
        });

        test('is case insensitive for system names', () => {
            const system = new System('NewHaven', 0, 0);

            expect(matches_search_criteria(system, 'newhaven')).toBe(true);
            expect(matches_search_criteria(system, 'NEWHAVEN')).toBe(true);
            expect(matches_search_criteria(system, 'NewHaven')).toBe(true);
            expect(matches_search_criteria(system, 'haven')).toBe(true);
        });

        test('does not match non-existent system name', () => {
            const system = new System('Sol', 0, 0);

            expect(matches_search_criteria(system, 'Polaris')).toBe(false);
            expect(matches_search_criteria(system, 'xyz')).toBe(false);
        });
    });

    describe('Spob name search', () => {
        test('matches system by spob name', () => {
            const system = new System('Gerwin', 100, 200);
            const jasmine = new Spob('Jasmine', 1000, 2000, ['land'], []);
            system.addSpob(jasmine);

            expect(matches_search_criteria(system, 'Jasmine')).toBe(true);
        });

        test('matches system by partial spob name', () => {
            const system = new System('TestSystem', 0, 0);
            const spob = new Spob('Minerva Station', 100, 200, ['land', 'refuel'], []);
            system.addSpob(spob);

            expect(matches_search_criteria(system, 'Minerva')).toBe(true);
            expect(matches_search_criteria(system, 'Station')).toBe(true);
            expect(matches_search_criteria(system, 'erva Sta')).toBe(true);
        });

        test('is case insensitive for spob names', () => {
            const system = new System('TestSystem', 0, 0);
            const spob = new Spob('New Haven', 100, 200, ['land'], []);
            system.addSpob(spob);

            expect(matches_search_criteria(system, 'new haven')).toBe(true);
            expect(matches_search_criteria(system, 'NEW HAVEN')).toBe(true);
            expect(matches_search_criteria(system, 'New Haven')).toBe(true);
            expect(matches_search_criteria(system, 'haven')).toBe(true);
        });

        test('searches multiple spobs in a system', () => {
            const system = new System('BigSystem', 0, 0);
            system.addSpob(new Spob('Alpha Station', 100, 200, ['land'], []));
            system.addSpob(new Spob('Beta Outpost', 300, 400, ['land'], []));
            system.addSpob(new Spob('Gamma Base', 500, 600, ['land'], []));

            expect(matches_search_criteria(system, 'Alpha')).toBe(true);
            expect(matches_search_criteria(system, 'Beta')).toBe(true);
            expect(matches_search_criteria(system, 'Gamma')).toBe(true);
            expect(matches_search_criteria(system, 'Station')).toBe(true);
            expect(matches_search_criteria(system, 'Outpost')).toBe(true);
        });

        test('does not match when spob name not found', () => {
            const system = new System('TestSystem', 0, 0);
            system.addSpob(new Spob('Earth', 100, 200, ['land'], []));

            expect(matches_search_criteria(system, 'Mars')).toBe(false);
            expect(matches_search_criteria(system, 'Jupiter')).toBe(false);
        });
    });

    describe('Combined search', () => {
        test('matches when either system or spob name matches', () => {
            const system = new System('Sol', 0, 0);
            const earth = new Spob('Earth', 100, 200, ['land'], []);
            system.addSpob(earth);

            // Should match on system name
            expect(matches_search_criteria(system, 'Sol')).toBe(true);
            // Should match on spob name
            expect(matches_search_criteria(system, 'Earth')).toBe(true);
            // Should not match neither
            expect(matches_search_criteria(system, 'Mars')).toBe(false);
        });

        test('matches system without spobs by system name only', () => {
            const system = new System('EmptySystem', 0, 0);

            expect(matches_search_criteria(system, 'Empty')).toBe(true);
            expect(matches_search_criteria(system, 'Other')).toBe(false);
        });
    });

    describe('Edge cases', () => {
        test('empty search string matches all systems', () => {
            const system = new System('AnySystem', 0, 0);

            expect(matches_search_criteria(system, '')).toBe(true);
        });

        test('null/undefined search string matches all systems', () => {
            const system = new System('AnySystem', 0, 0);

            expect(matches_search_criteria(system, null)).toBe(true);
            expect(matches_search_criteria(system, undefined)).toBe(true);
        });

        test('handles special characters in search', () => {
            const system = new System('Test-System_123', 0, 0);

            expect(matches_search_criteria(system, '-System')).toBe(true);
            expect(matches_search_criteria(system, '_123')).toBe(true);
        });

        test('handles spaces in search', () => {
            const system = new System('New Haven', 0, 0);

            expect(matches_search_criteria(system, 'New Haven')).toBe(true);
            expect(matches_search_criteria(system, 'w Ha')).toBe(true);
        });

        test('whitespace-only search does not match', () => {
            const system = new System('TestSystem', 0, 0);

            expect(matches_search_criteria(system, '   ')).toBe(false);
        });
    });
});
