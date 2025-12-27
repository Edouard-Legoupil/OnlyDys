// tests/code.test.js

describe('OnlyDysLogic', function () {

    it('should be an object', function () {
        expect(window.OnlyDysLogic).to.be.an('object');
    });

    describe('getPhoneticCode', function () {
        it('should return a phonetic code for a word', function () {
            expect(window.OnlyDysLogic.getPhoneticCode('hello')).to.equal('H400');
        });

        it('should return an empty string for an empty word', function () {
            expect(window.OnlyDysLogic.getPhoneticCode('')).to.equal('');
        });
    });

    describe('levenshteinDistance', function () {
        it('should be 0 for identical words', function () {
            expect(window.OnlyDysLogic.levenshteinDistance('maison', 'maison')).to.equal(0);
        });
        it('should be 1 for a single substitution', function () {
            expect(window.OnlyDysLogic.levenshteinDistance('pain', 'bain')).to.equal(1);
        });
        it('should be 1 for a single insertion', function () {
            expect(window.OnlyDysLogic.levenshteinDistance('chat', 'chats')).to.equal(1);
        });
        it('should be 1 for a single deletion', function () {
            expect(window.OnlyDysLogic.levenshteinDistance('pomme', 'omme')).to.equal(1);
        });
        it('should handle longer words with multiple differences', function () {
            expect(window.OnlyDysLogic.levenshteinDistance('bonjour', 'bonsoir')).to.equal(2);
        });
    });

    describe('calculerScoreOrthographique', function () {
        it('should be 1 for identical words', function () {
            expect(window.OnlyDysLogic.calculerScoreOrthographique('maison', 'maison')).to.equal(1);
        });
        it('should be high for similar words', function () {
            expect(window.OnlyDysLogic.calculerScoreOrthographique('poisson', 'poilon')).to.be.closeTo(0.71, 0.01);
        });
        it('should be low for different words', function () {
            expect(window.OnlyDysLogic.calculerScoreOrthographique('chat', 'chien')).to.be.closeTo(0.4, 0.01);
        });
        it('should handle words of different lengths', function () {
            expect(window.OnlyDysLogic.calculerScoreOrthographique('pomme', 'pommes')).to.be.closeTo(0.83, 0.01);
        });
        it('should be 0 for an empty word', function () {
            expect(window.OnlyDysLogic.calculerScoreOrthographique('', 'maison')).to.equal(0);
        });
    });

    describe('classifyConfusion', function () {
        it('should identify homophones', function () {
            expect(window.OnlyDysLogic.classifyConfusion('comte', { w: 'conte' })).to.deep.equal({ type: 'Homophone', color: '#CC79A7', icon: '🔀' }); // Reddish Purple
        });
        it('should identify visual confusions (b/d)', function () {
            expect(window.OnlyDysLogic.classifyConfusion('bain', { w: 'dain' })).to.deep.equal({ type: 'Visual', color: '#D55E00', icon: '⚠️' }); // Vermilion
        });
        it('should identify visual confusions (p/q)', function () {
            expect(window.OnlyDysLogic.classifyConfusion('pont', { w: 'qont' })).to.deep.equal({ type: 'Visual', color: '#D55E00', icon: '⚠️' }); // Vermilion
        });
        it('should identify phonetic substitutions (f/v)', function () {
            expect(window.OnlyDysLogic.classifyConfusion('vin', { w: 'fin' })).to.deep.equal({ type: 'Phonetic', color: '#E69F00', icon: '🔊' }); // Orange
        });
        it('should identify morphological confusions (plural)', function () {
            expect(window.OnlyDysLogic.classifyConfusion('maison', { w: 'maisons' })).to.deep.equal({ type: 'Morphological', color: '#0072B2', icon: '📝' }); // Blue
        });
    });

    describe('classerSuggestions', function () {
        it('should return suggestions for a simple typo', function () {
            const suggestions = window.OnlyDysLogic._classerSuggestions('maiso', null, window.mockDictionary);
            expect(suggestions.map(s => s.w)).to.include('maison');
        });
        it('should return suggestions based on phonetic similarity', function () {
            const suggestions = window.OnlyDysLogic._classerSuggestions('pain', null, window.mockDictionary);
            expect(suggestions.map(s => s.w)).to.include('bain');
        });
        it('should return homophones', function () {
            const suggestions = window.OnlyDysLogic._classerSuggestions('et', null, window.mockDictionary);
            expect(suggestions.map(s => s.w)).to.include('est');
        });
        it('should handle visual confusions', function () {
            const suggestions = window.OnlyDysLogic._classerSuggestions('chanp', null, window.mockDictionary);
            expect(suggestions.map(s => s.w)).to.include('chant');
            expect(suggestions.map(s => s.w)).to.include('champ');
        });
        it('should return an empty array if no suggestions are found', function () {
            const suggestions = window.OnlyDysLogic._classerSuggestions('xyz', null, window.mockDictionary);
            expect(suggestions).to.be.an('array').that.is.empty;
        });
    });
});
