
describe('ColorizationEngine', function () {
    const engine = window.ColorizationEngine;

    it('should split text into runs based on syllables', function () {
        // Run with text "banane", mode syllables
        // Expect 3 runs: ba (Red), na (Blue), ne (Red)
        const inputRun = { text: "banane", formatting: { color: "black" } };
        const result = engine.processRun(inputRun, { mode: 'syllables' });

        expect(result).to.have.length(3);
        expect(result[0].text).to.equal("ba");
        expect(result[0].formatting.color).to.equal(engine.palettes.syllables[0]);
        expect(result[1].text).to.equal("na");
        expect(result[1].formatting.color).to.equal(engine.palettes.syllables[1]);
        expect(result[2].text).to.equal("ne");
        expect(result[2].formatting.color).to.equal(engine.palettes.syllables[0]);
    });

    it('should handle silent letters', function () {
        // "pomme", silent 'e' at end
        // Run mode silent
        const inputRun = { text: "pomme", formatting: { color: "black" } };
        const result = engine.processRun(inputRun, { mode: 'silent' });

        // p o m m e
        // 0 1 2 3 4
        // Silent index: 4 ('e')
        // Should yield: "pomm" (formatted null/orig), "e" (formatted silent)

        expect(result[result.length - 1].text).to.equal("e");
        expect(result[result.length - 1].formatting.color).to.equal(engine.palettes.silent);
    });
});
