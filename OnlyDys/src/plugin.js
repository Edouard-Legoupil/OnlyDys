(function() {
    let dictionary = [];

    async function loadDictionary() {
        try {
            const response = await fetch('data/dictionary.json');
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            dictionary = await response.json();
            console.log('Dictionary loaded successfully:', dictionary.length, 'words');
            // TODO: Enable prediction features now that the dictionary is available
        } catch (error) {
            console.error('Error loading dictionary:', error);
        }
    }

    function getPhoneticCode(word) {
        if (!word || typeof word !== 'string') {
            return '';
        }

        let s = word.toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^A-Z]/g, '');

        if (!s) {
            return '';
        }

        const firstLetter = s.charAt(0);

        const getCode = (char) => {
            if ('BFPV'.includes(char)) return '1';
            if ('CGJKQSXZ'.includes(char)) return '2';
            if ('DT'.includes(char)) return '3';
            if ('L'.includes(char)) return '4';
            if ('MN'.includes(char)) return '5';
            if ('R'.includes(char)) return '6';
            return '0'; // Vowels, H, W, Y are separators
        };

        let soundex = firstLetter;
        let lastCode = getCode(firstLetter);

        for (let i = 1; i < s.length && soundex.length < 4; i++) {
            let code = getCode(s.charAt(i));
            if (code !== '0' && code !== lastCode) {
                soundex += code;
            }
            lastCode = code;
        }

        soundex = soundex.padEnd(4, '0');
        return soundex;
    }

    window.Asc.plugin.onIntegrationReady = function() {
        loadDictionary();
    };
})();
