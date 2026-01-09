const fs = require('fs').promises;
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const { process_spob, process_ssys, Spob, System } = require('./naev.js');

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
});

describe('process_spob', () => {
    test('parses Minerva Station correctly', async () => {
        const xml = await fs.readFile(path.join(__dirname, '../test/fixtures/spob/minerva_station.xml'), 'utf8');
        const xdoc = parser.parse(xml);
        const spob = process_spob(xdoc);

        expect(spob).toBeInstanceOf(Spob);
        expect(spob.name).toBe('Minerva Station');
        expect(spob.x).toBeCloseTo(-3354.178874, 5);
        expect(spob.y).toBeCloseTo(-10499.199403, 5);
        expect(spob.land).toBe(true);
        expect(spob.refuel).toBe(true);
        expect(spob.outfits).toBe(true);
        expect(spob.shipyard).toBe(true);
        expect(spob.restricted).toBe(false);
    });

    test('parses New Haven correctly', async () => {
        const xml = await fs.readFile(path.join(__dirname, '../test/fixtures/spob/new_haven.xml'), 'utf8');
        const xdoc = parser.parse(xml);
        const spob = process_spob(xdoc);

        expect(spob).toBeInstanceOf(Spob);
        expect(spob.name).toBe('New Haven');
        expect(spob.x).toBeCloseTo(-29845.859288, 5);
        expect(spob.y).toBeCloseTo(4223.363841, 5);
        expect(spob.land).toBe(true);
        expect(spob.refuel).toBe(true);
        expect(spob.outfits).toBe(true);
        expect(spob.shipyard).toBe(true);
        expect(spob.restricted).toBe(false);
    });

    test('parses restricted Akios Terminal correctly', async () => {
        const xml = await fs.readFile(path.join(__dirname, '../test/fixtures/spob/akios_terminal.xml'), 'utf8');
        const xdoc = parser.parse(xml);
        const spob = process_spob(xdoc);

        expect(spob).toBeInstanceOf(Spob);
        expect(spob.name).toBe('Akios Terminal');
        expect(spob.x).toBeCloseTo(-7481.403716, 5);
        expect(spob.y).toBeCloseTo(12773.423776, 5);
        expect(spob.land).toBe(true);
        expect(spob.refuel).toBe(true);
        expect(spob.outfits).toBe(true);
        expect(spob.shipyard).toBe(true);
        expect(spob.restricted).toBe(true); // This one has the restricted tag
    });

    test('handles spob without services', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spob name="Test Spob">
    <pos x="100.5" y="200.5"/>
    <tags>
        <tag>test</tag>
    </tags>
</spob>`;
        const xdoc = parser.parse(xml);
        const spob = process_spob(xdoc);

        expect(spob.name).toBe('Test Spob');
        expect(spob.land).toBe(false);
        expect(spob.refuel).toBe(false);
        expect(spob.outfits).toBe(false);
        expect(spob.shipyard).toBe(false);
        expect(spob.restricted).toBe(false);
    });

    test('handles spob without tags', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spob name="No Tags Spob">
    <pos x="50.0" y="75.0"/>
    <general>
        <services land=""/>
    </general>
</spob>`;
        const xdoc = parser.parse(xml);
        const spob = process_spob(xdoc);

        expect(spob.name).toBe('No Tags Spob');
        expect(spob.restricted).toBe(false);
    });

    test('filters out spob without position', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spob name="Virtual Spob">
    <general>
        <services land=""/>
    </general>
</spob>`;
        const xdoc = parser.parse(xml);
        const spob = process_spob(xdoc);

        // Spobs without valid coordinates should be filtered out
        expect(spob).toBeNull();
    });

    test('handles spob with single service', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spob name="Refuel Only">
    <pos x="100.0" y="200.0"/>
    <general>
        <services>
            <refuel/>
        </services>
    </general>
</spob>`;
        const xdoc = parser.parse(xml);
        const spob = process_spob(xdoc);

        expect(spob.refuel).toBe(true);
        expect(spob.land).toBe(false);
        expect(spob.outfits).toBe(false);
        expect(spob.shipyard).toBe(false);
    });

    test('handles spob with negative coordinates', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spob name="Negative Coords">
    <pos x="-1500.0" y="-2500.0"/>
</spob>`;
        const xdoc = parser.parse(xml);
        const spob = process_spob(xdoc);

        expect(spob.x).toBe(-1500);
        expect(spob.y).toBe(-2500);
    });

    test('handles missing spob element', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<invalid>
    <pos x="100.0" y="200.0"/>
</invalid>`;
        const xdoc = parser.parse(xml);
        const spob = process_spob(xdoc);

        expect(spob).toBeNull();
    });

    test('filters out spob with only x coordinate', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spob name="Half Position">
    <pos x="100.0"/>
</spob>`;
        const xdoc = parser.parse(xml);
        const spob = process_spob(xdoc);

        expect(spob).toBeNull();
    });

    test('filters out spob with only y coordinate', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spob name="Half Position">
    <pos y="200.0"/>
</spob>`;
        const xdoc = parser.parse(xml);
        const spob = process_spob(xdoc);

        expect(spob).toBeNull();
    });
});

describe('process_ssys', () => {
    test('parses Sol system correctly', async () => {
        const xml = await fs.readFile(path.join(__dirname, '../test/fixtures/ssys/sol.xml'), 'utf8');
        const xdoc = parser.parse(xml);
        const spobs = {}; // Sol has virtual spobs, we'll pass empty map
        const sys = process_ssys(xdoc, spobs);

        expect(sys).toBeInstanceOf(System);
        expect(sys.name).toBe('Sol');
        expect(sys.x).toBeCloseTo(639.683808, 5);
        expect(sys.y).toBeCloseTo(-63.683082, 5);
        expect(sys.radius).toBeCloseTo(35000, 1);
        expect(sys.jumps).toHaveLength(3);

        // Check jump targets
        const jump_targets = sys.jumps.map(j => j.target).sort();
        expect(jump_targets).toEqual(['Midoros', 'Polaris', 'Tide']);

        // All jumps should be autopos
        // Note: these jumps have <hide> tags but NOT <hidden/> tags
        sys.jumps.forEach(jump => {
            expect(jump.autopos).toBe(true);
            expect(jump.hidden).toBe(false);
        });
    });

    test('parses Limbo system with spobs and mixed jumps', async () => {
        const xml = await fs.readFile(path.join(__dirname, '../test/fixtures/ssys/limbo.xml'), 'utf8');
        const xdoc = parser.parse(xml);

        // Create mock spobs that exist in Limbo
        const mock_spob = new Spob('Minerva Station', -3354.178874, -10499.199403, ['land', 'refuel'], []);
        const spobs = {
            'Jugreny': mock_spob,
            'Limbo I': mock_spob,
            'Limbo II': mock_spob,
            'Malebolge': mock_spob,
            'Minerva Station': mock_spob
        };

        const sys = process_ssys(xdoc, spobs);

        expect(sys).toBeInstanceOf(System);
        expect(sys.name).toBe('Limbo');
        expect(sys.x).toBeCloseTo(-205.320077, 5);
        expect(sys.y).toBeCloseTo(-524.249736, 5);
        expect(sys.radius).toBeCloseTo(17500, 1);

        // Should have 5 spobs (not including virtual ones)
        expect(sys.spobs).toHaveLength(5);

        // Should have 5 jumps
        expect(sys.jumps).toHaveLength(5);

        // Check that one jump (Fried) has explicit position
        const fried_jump = sys.jumps.find(j => j.target === 'Fried');
        expect(fried_jump).toBeDefined();
        expect(fried_jump.autopos).toBe(false);
        expect(fried_jump.x).toBeCloseTo(-5870.072165, 5);
        expect(fried_jump.y).toBeCloseTo(-25177.969685, 5);

        // Check that other jumps are autopos
        const autopos_jumps = sys.jumps.filter(j => j.autopos);
        expect(autopos_jumps).toHaveLength(4);
    });

    test('handles system with default radius', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Test System">
    <pos x="100.0" y="200.0"/>
</ssys>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        expect(sys.name).toBe('Test System');
        expect(sys.radius).toBe(10000); // Default radius
    });

    test('handles system without jumps or spobs', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Empty System">
    <general>
        <radius>5000.0</radius>
    </general>
    <pos x="0.0" y="0.0"/>
</ssys>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        expect(sys.name).toBe('Empty System');
        expect(sys.spobs).toHaveLength(0);
        expect(sys.jumps).toHaveLength(0);
        expect(sys.radius).toBe(5000);
    });

    test('handles single jump (not array)', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Single Jump System">
    <pos x="0.0" y="0.0"/>
    <jumps>
        <jump target="OtherSystem">
            <pos x="100.0" y="200.0"/>
        </jump>
    </jumps>
</ssys>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        expect(sys.jumps).toHaveLength(1);
        expect(sys.jumps[0].target).toBe('OtherSystem');
        expect(sys.jumps[0].x).toBe(100);
        expect(sys.jumps[0].y).toBe(200);
    });

    test('correctly distinguishes between hidden and hide tags', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Test System">
    <pos x="0.0" y="0.0"/>
    <jumps>
        <jump target="VisibleJump">
            <autopos/>
            <hide>1.0</hide>
        </jump>
        <jump target="HiddenJump">
            <autopos/>
            <hidden/>
        </jump>
        <jump target="BothJump">
            <autopos/>
            <hidden/>
            <hide>2.0</hide>
        </jump>
    </jumps>
</ssys>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        expect(sys.jumps).toHaveLength(3);

        // Jump with only <hide> should NOT be hidden
        const visible = sys.jumps.find(j => j.target === 'VisibleJump');
        expect(visible.hidden).toBe(false);

        // Jump with <hidden/> should be hidden
        const hidden = sys.jumps.find(j => j.target === 'HiddenJump');
        expect(hidden.hidden).toBe(true);

        // Jump with both should be hidden
        const both = sys.jumps.find(j => j.target === 'BothJump');
        expect(both.hidden).toBe(true);
    });

    test('handles system with negative coordinates', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Negative System">
    <pos x="-5000.0" y="-7500.0"/>
</ssys>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        expect(sys.x).toBe(-5000);
        expect(sys.y).toBe(-7500);
    });

    test('handles system with single spob (not array)', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Single Spob System">
    <pos x="0.0" y="0.0"/>
    <spobs>
        <spob>TestSpob</spob>
    </spobs>
</ssys>`;
        const xdoc = parser.parse(xml);
        const mock_spob = new Spob('TestSpob', 100, 200, ['land'], []);
        const spobs = { 'TestSpob': mock_spob };
        const sys = process_ssys(xdoc, spobs);

        expect(sys.spobs).toHaveLength(1);
        expect(sys.spobs[0].name).toBe('TestSpob');
    });

    test('ignores spobs not in the spobs map', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Test System">
    <pos x="0.0" y="0.0"/>
    <spobs>
        <spob>ExistingSpob</spob>
        <spob>NonExistentSpob</spob>
        <spob>AnotherSpob</spob>
    </spobs>
</ssys>`;
        const xdoc = parser.parse(xml);
        const existing = new Spob('ExistingSpob', 100, 200, ['land'], []);
        const another = new Spob('AnotherSpob', 300, 400, ['land'], []);
        const spobs = { 'ExistingSpob': existing, 'AnotherSpob': another };
        const sys = process_ssys(xdoc, spobs);

        // Should only include the spobs that exist in the map
        expect(sys.spobs).toHaveLength(2);
        expect(sys.spobs[0].name).toBe('ExistingSpob');
        expect(sys.spobs[1].name).toBe('AnotherSpob');
    });

    test('filters out system without position', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="No Position System">
</ssys>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        // Systems without valid coordinates should be filtered out
        expect(sys).toBeNull();
    });

    test('handles missing ssys element', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<invalid>
    <pos x="0.0" y="0.0"/>
</invalid>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        expect(sys).toBeNull();
    });

    test('handles jump with both autopos and explicit position', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Test System">
    <pos x="0.0" y="0.0"/>
    <jumps>
        <jump target="Target">
            <autopos/>
            <pos x="1000.0" y="2000.0"/>
        </jump>
    </jumps>
</ssys>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        expect(sys.jumps).toHaveLength(1);
        // When both are present, explicit position should be used
        expect(sys.jumps[0].x).toBe(1000);
        expect(sys.jumps[0].y).toBe(2000);
        expect(sys.jumps[0].autopos).toBe(true);
    });

    test('handles system with very large radius', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Huge System">
    <general>
        <radius>999999.9</radius>
    </general>
    <pos x="0.0" y="0.0"/>
</ssys>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        expect(sys.radius).toBe(999999.9);
    });

    test('handles system with zero radius (defaults to 10000)', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Tiny System">
    <general>
        <radius>0.0</radius>
    </general>
    <pos x="0.0" y="0.0"/>
</ssys>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        // Note: Due to falsy check in code, 0 radius defaults to 10000
        expect(sys.radius).toBe(10000);
    });

    test('filters out system with only x coordinate', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Half Position">
    <pos x="100.0"/>
</ssys>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        expect(sys).toBeNull();
    });

    test('filters out system with only y coordinate', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ssys name="Half Position">
    <pos y="200.0"/>
</ssys>`;
        const xdoc = parser.parse(xml);
        const sys = process_ssys(xdoc, {});

        expect(sys).toBeNull();
    });
});
