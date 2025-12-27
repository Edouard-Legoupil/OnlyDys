
describe('ColorizationEngine', function () {
    const engine = window.ColorizationEngine;

    it('should split text into runs based on syllables', function () {
        const inputRun = { text: "banane", formatting: { color: "black" } };
        const result = engine.processRun(inputRun, { mode: 'syllables' });

        expect(result).to.have.length(3);
        expect(result[0].text).to.equal("ba");
        expect(result[1].text).to.equal("na");
        expect(result[2].text).to.equal("ne");
    });

    it('should handle silent letters', function () {
        const inputRun = { text: "pomme", formatting: { color: "black" } };
        const result = engine.processRun(inputRun, { mode: 'silent' });
        expect(result[result.length - 1].text).to.equal("e");
        expect(result[result.length - 1].formatting.color).to.equal(engine.palettes.silent);
    });

    it('should handle alternlettres mode', function () {
        const inputRun = { text: "abc", formatting: { color: "black" } };
        const result = engine.processRun(inputRun, { mode: 'alternlettres' });
        expect(result).to.have.length(3);
        expect(result[0].formatting.color).to.equal(engine.palettes.letters[0]);
        expect(result[1].formatting.color).to.equal(engine.palettes.letters[1]);
        expect(result[2].formatting.color).to.equal(engine.palettes.letters[2]);
    });

    it('should handle alternmots mode', function () {
        const inputRun = { text: "un deux trois", formatting: { color: "black" } };
        const result = engine.processRun(inputRun, { mode: 'alternmots' });
        // un (color0), space (null), deux (color1), space (null), trois (color0)
        expect(result.filter(r => r.formatting.color !== null)).to.have.length(3);
        expect(result[0].formatting.color).to.equal(engine.palettes.words[0]);
        expect(result[2].formatting.color).to.equal(engine.palettes.words[1]);
        expect(result[4].formatting.color).to.equal(engine.palettes.words[0]);
    });

    it('should handle vowels and consonants modes', function () {
        const inputRun = { text: "ali", formatting: { color: "black" } };
        const resultV = engine.processRun(inputRun, { mode: 'vowels' });
        expect(resultV[0].formatting.color).to.equal(engine.palettes.vowels); // a
        expect(resultV[1].formatting.color).to.equal(null); // l
        expect(resultV[2].formatting.color).to.equal(engine.palettes.vowels); // i

        const resultC = engine.processRun(inputRun, { mode: 'consonants' });
        expect(resultC[0].formatting.color).to.equal(null); // a
        expect(resultC[1].formatting.color).to.equal(engine.palettes.consonants); // l
    });

    it('should handle target letters highlight', function () {
        const inputRun = { text: "bdpq", formatting: { color: "black" } };
        const result = engine.processRun(inputRun, {
            mode: 'letters',
            options: { targetLetters: "bd" }
        });
        expect(result[0].formatting.color).to.not.equal(null); // b
        expect(result[1].formatting.color).to.not.equal(null); // d
        expect(result[2].formatting.color).to.equal(null); // p
        expect(result[3].formatting.color).to.equal(null); // q
    });

    it('should handle grammatical colorization based on syntax (wordMap)', function () {
        const wordMap = new Map();
        wordMap.set('maison', 'NOM');
        wordMap.set('vrai', 'ADJ');
        wordMap.set('est', 'VER');

        const inputRun = { text: "La maison est vraie.", formatting: { color: "#000" } };
        const result = engine.processRun(inputRun, { mode: 'grammar' }, wordMap);

        // Word "maison" should be NOM color
        const maisonRun = result.find(r => r.text === 'maison');
        expect(maisonRun.formatting.color).to.equal(engine.palettes.grammar['NOM']);

        // Word "est" should be VER color
        const estRun = result.find(r => r.text === 'est');
        expect(estRun.formatting.color).to.equal(engine.palettes.grammar['VER']);

        // Punctuation "." should have null color
        const dotRun = result.find(r => r.text === '.');
        expect(dotRun.formatting.color).to.be.null;
    });

    describe('Edge Cases', function () {
        it('should handle nasal vowels as single phonemes', function () {
            const inputRun = { text: "enfant", formatting: { color: "#000" } };
            // en - f - an - t
            const result = engine.processRun(inputRun, { mode: 'phonemes' });
            // Expected phonemes: "en", "f", "an", "t"
            expect(result.map(r => r.text)).to.include("en");
            expect(result.map(r => r.text)).to.include("an");
            const enIdx = result.findIndex(r => r.text === "en");
            const anIdx = result.findIndex(r => r.text === "an");
            expect(result[enIdx].formatting.color).to.not.be.null;
            expect(result[anIdx].formatting.color).to.not.be.null;
        });

        it('should protect punctuation and symbols', function () {
            const inputRun = { text: "Cool! (123) $#%", formatting: { color: "#000" } };
            const result = engine.processRun(inputRun, { mode: 'phonemes' });

            // Text should be preserved (though normalized to lower by the engine)
            const fullText = result.map(r => r.text).join("");
            expect(fullText).to.equal("cool! (123) $#%");

            // Find any run containing punctuation
            const punctRun = result.find(r => r.text.includes("!"));
            expect(punctRun).to.not.be.undefined;
            expect(punctRun.formatting.color).to.be.null;
        });

        it('should be case insensitive', function () {
            const result1 = engine.processRun({ text: "SYLLABE" }, { mode: 'syllables' });
            const result2 = engine.processRun({ text: "syllabe" }, { mode: 'syllables' });
            expect(result1.map(r => r.text.toLowerCase())).to.deep.equal(result2.map(r => r.text.toLowerCase()));
        });

        it('should handle empty or whitespace strings', function () {
            const result = engine.processRun({ text: "   ", formatting: { color: "#000" } }, { mode: 'phonemes' });
            // After filtering empty splits, we should only have the whitespace run
            const validRuns = result.filter(r => r.text.length > 0);
            expect(validRuns).to.have.length(1);
            expect(validRuns[0].text).to.equal("   ");
            expect(validRuns[0].formatting.color).to.be.null;
        });
    });

    describe('Highlighting Mode', function () {
        it('should use background colors when useHighlighting is enabled', function () {
            const inputRun = { text: "test", formatting: { color: "#000" } };
            const result = engine.processRun(inputRun, {
                mode: 'syllables',
                options: { useHighlighting: true }
            });

            // Should have backgroundColor instead of color
            expect(result[0].formatting.backgroundColor).to.not.be.undefined;
            expect(result[0].formatting.color).to.equal('#000000'); // Black text
        });

        it('should use text colors when useHighlighting is disabled', function () {
            const inputRun = { text: "test", formatting: { color: "#000" } };
            const result = engine.processRun(inputRun, {
                mode: 'syllables',
                options: { useHighlighting: false }
            });

            // Should have color, not backgroundColor
            expect(result[0].formatting.color).to.not.equal('#000000');
            expect(result[0].formatting.backgroundColor).to.be.undefined;
        });

        it('should work with grammar mode and highlighting', function () {
            const wordMap = new Map([['test', 'NOM']]);
            const inputRun = { text: "test", formatting: { color: "#000" } };
            const result = engine.processRun(inputRun, {
                mode: 'grammar',
                options: { useHighlighting: true }
            }, wordMap);

            expect(result[0].formatting.backgroundColor).to.equal('#FFE6E6'); // Light Red for NOM
            expect(result[0].formatting.color).to.equal('#000000'); // Black text
        });
    });

    describe('Line Alternation', function () {
        it('should apply alternating line colors in alternlines mode', function () {
            const inputRun = { text: "Line of text", formatting: { color: "#000" } };
            const result1 = engine.processRun(inputRun, {
                mode: 'alternlines',
                lineIndex: 0
            });
            const result2 = engine.processRun(inputRun, {
                mode: 'alternlines',
                lineIndex: 1
            });

            // Different lines should have different background colors
            expect(result1[0].formatting.backgroundColor).to.equal("#FFFACD");
            expect(result2[0].formatting.backgroundColor).to.equal("#E0F0FF");
        });
    });
});
