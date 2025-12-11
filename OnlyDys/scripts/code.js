// Ensure the global object is created
window.OnlyDysLogic = window.OnlyDysLogic || {};

(function(logic) {
    let dictionary = [];

    logic.loadDictionary = async function() {
        try {
            const response = await fetch('data/dictionary_full.json');
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            dictionary = await response.json();
            console.log('Dictionary loaded successfully:', dictionary.length, 'words');
        } catch (error) {
            console.error('Error loading dictionary:', error);
        }
    };

    function getPhoneticCode(word) {
        if (!word || typeof word !== 'string') return '';
        let s = word.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, '');
        if (!s) return '';
        const firstLetter = s.charAt(0);
        const getCode = (char) => {
            if ('BFPV'.includes(char)) return '1';
            if ('CGJKQSXZ'.includes(char)) return '2';
            if ('DT'.includes(char)) return '3';
            if ('L'.includes(char)) return '4';
            if ('MN'.includes(char)) return '5';
            if ('R'.includes(char)) return '6';
            return '0';
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
        return soundex.padEnd(4, '0');
    }

    function levenshteinDistance(a, b) {
        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
        for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
        for (let j = 1; j <= b.length; j += 1) {
            for (let i = 1; i <= a.length; i += 1) {
                const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator,
                );
            }
        }
        return matrix[b.length][a.length];
    }

    logic.trouverSuggestions = function(motSaisi) {
        if (!motSaisi || typeof motSaisi !== 'string' || !dictionary.length) return [];
        const phoneticCode = getPhoneticCode(motSaisi);
        return dictionary
            .filter(entry => entry.p === phoneticCode)
            .map(entry => ({
                ...entry,
                distance: levenshteinDistance(motSaisi.toLowerCase(), entry.w.toLowerCase())
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);
    };

    logic.displaySuggestions = function(suggestions) {
        const container = document.getElementById('suggestions-container');
        if (!container) return;
        container.innerHTML = '';
        suggestions.forEach(suggestion => {
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.onclick = () => window.replaceCurrentWord(suggestion.w); // Uses the global function
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.textContent = suggestion.w;
            const readBtn = document.createElement('button');
            readBtn.className = 'read-btn';
            readBtn.innerHTML = '🔊';
            readBtn.onclick = (e) => {
                e.stopPropagation();
                window.lireMot(suggestion.w);
            };
            const illustration = document.createElement('img');
            illustration.className = 'illustration';
            illustration.alt = 'Illustration';
            if (suggestion.i) {
                illustration.src = suggestion.i;
                illustration.style.display = 'block';
            }
            card.appendChild(wordSpan);
            card.appendChild(readBtn);
            card.appendChild(illustration);
            container.appendChild(card);
        });
    };

})(window.OnlyDysLogic);

// Expose the function to the global scope so it can be called from index.html
window.replaceCurrentWord = function(wordToInsert) {
    const contentToPaste = wordToInsert + ' ';
    window.Asc.plugin.executeMethod("PasteContent", [contentToPaste]);
};
