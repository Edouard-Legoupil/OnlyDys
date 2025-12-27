
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
        it('should handle new MULTI_PHONEMES', function () {
            expect(engine.segmentPhonemes("eau")).to.deep.equal(["eau"]);
            expect(engine.segmentPhonemes("eaux")).to.deep.equal(["eaux"]);
            expect(engine.segmentPhonemes("aient")).to.deep.equal(["aient"]);
            expect(engine.segmentPhonemes("oient")).to.deep.equal(["oient"]);
        });
    });

    describe('segmentSyllables', function () {
        it('should segment simple CV words', function () {
            expect(engine.segmentSyllables("banane")).to.deep.equal(["ba", "na", "ne"]);
        });
        it('should segment words with digraphs', function () {
            expect(engine.segmentSyllables("chateau")).to.deep.equal(["cha", "teau"]);
        });
        it('should handle clusters (VCCV -> VC|CV)', function () {
            expect(engine.segmentSyllables("arbre")).to.deep.equal(["ar", "bre"]);
            expect(engine.segmentSyllables("partir")).to.deep.equal(["par", "tir"]);
        });
        it('should handle VCV -> V|CV', function () {
            expect(engine.segmentSyllables("velo")).to.deep.equal(["ve", "lo"]);
        });
        it('should handle complex nuclei', function () {
            expect(engine.segmentSyllables("oiseau")).to.deep.equal(["oi", "seau"]);
        });
    });

    describe('detectSilentLetters', function () {
        it('should detect silent "e" at end', function () {
            var result = engine.detectSilentLetters("pomme");
            expect(result).to.include(4);
        });
        it('should detect silent "s"', function () {
            var result = engine.detectSilentLetters("pommes");
            expect(result).to.include(4);
            expect(result).to.include(5);
        });
        it('should detect other silent endings (t, d, p, x, g, z)', function () {
            expect(engine.detectSilentLetters("chat")).to.include(3);
            expect(engine.detectSilentLetters("froid")).to.include(4);
            expect(engine.detectSilentLetters("trop")).to.include(3);
            expect(engine.detectSilentLetters("heureux")).to.include(6);
            expect(engine.detectSilentLetters("sang")).to.include(3);
            expect(engine.detectSilentLetters("nez")).to.include(2);
        });
    });

    describe('lemmatize', function () {
        it('should lemmatize present tense -er verbs', function () {
            const wordMap = new Map([['chanter', 'VER'], ['parler', 'VER']]);

            expect(engine.lemmatize('chante', wordMap)).to.equal('chanter');
            expect(engine.lemmatize('chantes', wordMap)).to.equal('chanter');
            expect(engine.lemmatize('chantent', wordMap)).to.equal('chanter');
            expect(engine.lemmatize('parle', wordMap)).to.equal('parler');
        });

        it('should lemmatize present tense -ir verbs', function () {
            const wordMap = new Map([['finir', 'VER']]);

            expect(engine.lemmatize('finit', wordMap)).to.equal('finir');
            expect(engine.lemmatize('finis', wordMap)).to.equal('finir');
        });

        it('should lemmatize plural nouns', function () {
            const wordMap = new Map([['maison', 'NOM'], ['oiseau', 'NOM']]);

            expect(engine.lemmatize('maisons', wordMap)).to.equal('maison');
            expect(engine.lemmatize('oiseaux', wordMap)).to.equal('oiseau');
        });

        it('should return exact match if word exists in dictionary', function () {
            const wordMap = new Map([['chante', 'NOM'], ['chanter', 'VER']]);

            // Should return exact match, not lemmatize
            expect(engine.lemmatize('chante', wordMap)).to.equal('chante');
        });

        it('should return lowercase original if no lemmatization found', function () {
            const wordMap = new Map([['test', 'NOM']]);

            expect(engine.lemmatize('xyz', wordMap)).to.equal('xyz');
            expect(engine.lemmatize('XYZ', wordMap)).to.equal('xyz');
        });
    });
});
