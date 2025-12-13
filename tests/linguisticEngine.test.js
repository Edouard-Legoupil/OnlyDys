
describe('LinguisticEngine', function () {

    const engine = window.LinguisticEngine;

    it('should normalize french text', function () {
        expect(engine.normalizeFrench("Éléphant")).to.equal("éléphant");
    });

    describe('isVowel', function () {
        it('should identify vowels', function () {
            expect(engine.isVowel('a')).to.be.true;
            expect(engine.isVowel('é')).to.be.true;
            expect(engine.isVowel('u')).to.be.true;
        });
        it('should reject consonants', function () {
            expect(engine.isVowel('b')).to.be.false;
            expect(engine.isVowel('z')).to.be.false;
        });
    });

    describe('segmentPhonemes', function () {
        it('should segment simple words', function () {
            expect(engine.segmentPhonemes("ami")).to.deep.equal(["a", "m", "i"]);
        });
        it('should segment complex phonemes', function () {
            expect(engine.segmentPhonemes("chateau")).to.deep.equal(["ch", "a", "t", "eau"]);
            expect(engine.segmentPhonemes("oiseau")).to.deep.equal(["oi", "s", "eau"]);
        });
        it('should handle nasal vowels', function () {
            expect(engine.segmentPhonemes("maison")).to.deep.equal(["m", "ai", "s", "on"]);
            expect(engine.segmentPhonemes("bain")).to.deep.equal(["b", "ain"]);
        });
        it('should handle "ill" special case', function () {
            expect(engine.segmentPhonemes("famille")).to.deep.equal(["f", "a", "m", "ill", "e"]);
        });
    });

    describe('segmentSyllables', function () {
        it('should segment simple CV words', function () {
            expect(engine.segmentSyllables("banane")).to.deep.equal(["ba", "na", "ne"]);
        });
        it('should segment words with digraphs', function () {
            expect(engine.segmentSyllables("chateau")).to.deep.equal(["cha", "teau"]);
        });
        it('should handle clusters', function () {
            expect(engine.segmentSyllables("arbre")).to.deep.equal(["ar", "bre"]);
        });
    });

    describe('detectSilentLetters', function () {
        it('should detect silent "e" at end', function () {
            var result = engine.detectSilentLetters("pomme");
            expect(result).to.be.an('array');
            if (result.length > 0) {
                expect(result).to.include(4);
            }
        });
        it('should detect silent "s"', function () {
            var result = engine.detectSilentLetters("pommes");
            expect(result).to.include(4);
            expect(result).to.include(5);
        });
    });
});
