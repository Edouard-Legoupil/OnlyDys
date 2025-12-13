// tests/code.test.js

describe('OnlyDysLogic', function() {

    it('should be an object', function() {
        expect(window.OnlyDysLogic).to.be.an('object');
    });

    describe('getPhoneticCode', function() {
        it('should return a phonetic code for a word', function() {
            expect(window.OnlyDysLogic.getPhoneticCode('hello')).to.equal('H400');
        });

        it('should return an empty string for an empty word', function() {
            expect(window.OnlyDysLogic.getPhoneticCode('')).to.equal('');
        });
    });

    describe('levenshteinDistance', function() {
        it('should return the correct distance between two words', function() {
            expect(window.OnlyDysLogic.levenshteinDistance('hello', 'jello')).to.equal(1);
        });
    });

    describe('calculerScoreOrthographique', function() {
        it('should return the correct score between two words', function() {
            expect(window.OnlyDysLogic.calculerScoreOrthographique('hello', 'jello')).to.equal(0.8);
        });
    });

    describe('classifyConfusion', function() {
        it('should return the correct confusion type', function() {
            expect(window.OnlyDysLogic.classifyConfusion('hello', { w: 'jello' })).to.deep.equal({ type: 'Phonetic', color: 'Orange', icon: '🔊' });
        });
    });
});
