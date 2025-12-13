
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
            // famille -> f, a, m, ill, e
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
            // arbre -> ar-bre 
            // phonetic: a, r, b, r, e.
            // a (vowel) -> next r (consonant) -> next b (consonant). Split after vowel?
            // The simplified logic splits VCC as VC-C? No, prompt said "Split cluster: V C | C"
            // Let's trace 'arbre': [a, r, b, r, e]
            // i=0(a): next=r(!V), nextNext=b(!V) -> split cluster logic.
            // Actually implementation says:
            /*
            if (next && !VOWEL_REGEX.test(next)) {
                if (nextNext && !VOWEL_REGEX.test(nextNext)) {
                     syllables.push(current);
                     current = [];
            */
            // wait, if I push current (['a']), it becomes 'a' | 'r', 'b', 'r', 'e'.
            // The prompt logic: "Consonant clusters split before the last consonant".
            // My implementation might need tuning.
            expect(engine.segmentSyllables("arbre")).to.deep.equal(["ar", "bre"]);
        });
    });

    describe('detectSilentLetters', function () {
        it('should detect silent "e" at end', function () {
            const result = engine.detectSilentLetters("pomme");
            expect(result).to.include(4); // index of 'e'
        });
        it('should detect silent "s" (plural)', function () {
            const result = engine.detectSilentLetters("pommes"); // p o m m e s (012345)
            // 'es' is in SILENT_ENDINGS. length 2.
            // startIndex = 6-2 = 4. Checks 4('e') and 5('s').
            expect(result).to.include(4);
            expect(result).to.include(5);
        });
        it('should detect silent "ent" (verb ending heuristic)', function () {
            const result = engine.detectSilentLetters("mangent"); // m a n g e n t (0123456)
            // 'ent' length 3. start 4. 4,5,6.
            expect(result).to.include(4);
            expect(result).to.include(5);
            expect(result).to.include(6);
        });
    });
});
