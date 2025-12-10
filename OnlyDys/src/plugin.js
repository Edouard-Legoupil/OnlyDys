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

    function levenshteinDistance(a, b) {
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    function replaceCurrentWord(wordToInsert) {
        window.Asc.plugin.executeMethod("GetWordFromPosition", [], function(word) {
            if (word && word.trim().length > 0) {
                // Ensure there's a space after the inserted word
                const contentToPaste = wordToInsert + ' ';
                window.Asc.plugin.executeMethod("PasteContent", [contentToPaste]);
            }
        });
    }

    function trouverSuggestions(motSaisi) {
        if (!motSaisi || typeof motSaisi !== 'string' || !dictionary.length) {
            return [];
        }

        const phoneticCode = getPhoneticCode(motSaisi);

        const suggestions = dictionary
            .filter(entry => entry.p === phoneticCode)
            .map(entry => {
                return {
                    ...entry,
                    distance: levenshteinDistance(motSaisi.toLowerCase(), entry.w.toLowerCase())
                };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);

        return suggestions;
    }

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    const handleInput = debounce(() => {
        window.Asc.plugin.executeMethod("GetWordFromPosition", [], function(word) {
            if (word && word.trim().length > 2) {
                const suggestions = trouverSuggestions(word.trim());
                if (suggestions.length > 0) {
                    // Automatically insert the best suggestion for demonstration purposes
                    replaceCurrentWord(suggestions[0].w);
                }
            }
        });
    }, 500);

    window.Asc.plugin.onIntegrationReady = async function() {
        await loadDictionary();
        window.Asc.plugin.executeMethod("Asc.Api.events.onDocumentContentChange.Add", [handleInput]);
    };
})();
