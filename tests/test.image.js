describe('getPictogramUrl', function() {
    it('should return a valid URL for a known word', async function() {
        this.timeout(10000); // Augmenter le timeout pour l'appel API
        const word = 'chien';
        const url = await getPictogramUrl(word);
        expect(url).to.be.a('string');
        expect(url).to.include('https://static.arasaac.org/pictograms/');
        expect(url).to.include('_500.png');
    });

    it('should return null for an unknown word', async function() {
        this.timeout(10000); // Augmenter le timeout pour l'appel API
        const word = 'unmotquiexistepas';
        const url = await getPictogramUrl(word);
        expect(url).to.be.null;
    });

    it('should handle words with leading/trailing spaces', async function() {
        this.timeout(10000); // Augmenter le timeout pour l'appel API
        const word = '  maison  ';
        const url = await getPictogramUrl(word);
        expect(url).to.be.a('string');
        expect(url).to.include('https://static.arasaac.org/pictograms/');
    });

    it('should handle uppercase words', async function() {
        this.timeout(10000); // Augmenter le timeout pour l'appel API
        const word = 'VOITURE';
        const url = await getPictogramUrl(word);
        expect(url).to.be.a('string');
        expect(url).to.include('https://static.arasaac.org/pictograms/');
    });

    it('should return null for an empty string', async function() {
        this.timeout(10000); // Augmenter le timeout pour l'appel API
        const word = '';
        const url = await getPictogramUrl(word);
        expect(url).to.be.null;
    });
});
