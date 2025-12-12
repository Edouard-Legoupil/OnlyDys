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

    function getCategorieAttendue(motPrecedent) {
        if (!motPrecedent) return null;
        const mot = dictionary.find(entry => entry.w.toLowerCase() === motPrecedent.toLowerCase());
        if (!mot) return null;

        const categorie = mot.g;
        if (['DET', 'ART'].includes(categorie)) {
            return 'NOM';
        }
        if (categorie === 'PRP') {
            return 'VER';
        }
        if (categorie === 'ADJ') {
            return 'NOM';
        }
        return null;
    }

    logic.calculerScoreSemantique = function(suggestion, motPrecedent) {
        const poidsFrequence = 0.7;
        const poidsContexte = 0.3;

        let scoreFrequence = suggestion.frequence_norm || 0.0;
        
        let scoreContexte = 0.0;
        const categorieAttendue = getCategorieAttendue(motPrecedent);
        if (categorieAttendue && suggestion.g === categorieAttendue) {
            scoreContexte = 1.0;
        }

        return (scoreFrequence * poidsFrequence) + (scoreContexte * poidsContexte);
    }

    function calculerScoreOrthographique(motSaisi, candidatW) {
        const distance = levenshteinDistance(motSaisi.toLowerCase(), candidatW.toLowerCase());
        const maxLength = Math.max(motSaisi.length, candidatW.length);
        return maxLength > 0 ? 1 - (distance / maxLength) : 0;
    }

    logic.classerSuggestions = function(motSaisi, motPrécédent) {
        if (!motSaisi || typeof motSaisi !== 'string' || !dictionary.length) return [];
        
        const phoneticCodeSaisi = getPhoneticCode(motSaisi);

        // Filter candidates for performance. Keep only those with a close phonetic match.
        const candidatsPotentiels = dictionary.filter(entry => {
            return levenshteinDistance(phoneticCodeSaisi, entry.p) <= 1;
        });

        const candidatsScores = candidatsPotentiels.map(candidat => {
            const distancePhonetique = levenshteinDistance(phoneticCodeSaisi, candidat.p);
            // The phonetic code is always 4 characters long, so the max distance is 4.
            const scorePhonetique = 1 - (distancePhonetique / 4);
            
            const scoreOrtho = calculerScoreOrthographique(motSaisi, candidat.w);
            const scoreSemantique = logic.calculerScoreSemantique(candidat, motPrécédent);

            const scoreFinal = (0.40 * scorePhonetique) + (0.30 * scoreOrtho) + (0.30 * scoreSemantique);

            return {
                ...candidat,
                score: scoreFinal
            };
        });

        return candidatsScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    };

    function classifyConfusion(motSaisi, suggestion) {
        const phoneticSaisi = getPhoneticCode(motSaisi);
        const phoneticSuggestion = getPhoneticCode(suggestion.w);

        // Homophone confusion
        if (phoneticSaisi === phoneticSuggestion && motSaisi.toLowerCase() !== suggestion.w.toLowerCase()) {
            return { type: 'Homophone', color: 'Purple', icon: '🔀' };
        }

        // Visual confusion (b/d, p/q, n/u check)
        const visualConfusions = { 'b': 'd', 'd': 'b', 'p': 'q', 'q': 'p', 'n': 'u', 'u': 'n' };
        for (let i = 0; i < motSaisi.length; i++) {
            if (visualConfusions[motSaisi[i]] && suggestion.w.includes(visualConfusions[motSaisi[i]])) {
                const regex = new RegExp(visualConfusions[motSaisi[i]], 'g');
                if (motSaisi.replace(motSaisi[i], visualConfusions[motSaisi[i]]) === suggestion.w || (suggestion.w.match(regex) || []).length === 1) {
                    return { type: 'Visual', color: 'Red', icon: '⚠️' };
                }
            }
        }

        // Phonetic substitution (f/v, s/z check)
        const phoneticSubstitutions = { 'f': 'v', 'v': 'f', 's': 'z', 'z': 's' };
        for (let i = 0; i < motSaisi.length; i++) {
            if (phoneticSubstitutions[motSaisi[i]] && suggestion.w.includes(phoneticSubstitutions[motSaisi[i]])) {
                 const regex = new RegExp(phoneticSubstitutions[motSaisi[i]], 'g');
                if (motSaisi.replace(motSaisi[i], phoneticSubstitutions[motSaisi[i]]) === suggestion.w || (suggestion.w.match(regex) || []).length === 1) {
                    return { type: 'Phonetic', color: 'Orange', icon: '🔊' };
                }
            }
        }
        
        // Morphological confusion (simple pluralization/conjugation check)
        if ((motSaisi.endsWith('s') && !suggestion.w.endsWith('s')) || (!motSaisi.endsWith('s') && suggestion.w.endsWith('s')) ||
            (motSaisi.endsWith('ent') && !suggestion.w.endsWith('ent')) || (!motSaisi.endsWith('ent') && suggestion.w.endsWith('ent'))) {
            return { type: 'Morphological', color: 'Blue', icon: '📝' };
        }
        
        return { type: 'Unknown', color: 'Gray', icon: '❓' };
    }

    logic.displaySuggestions = function(suggestions, motSaisi, append = false) {
        const container = document.getElementById('suggestions-container');
        if (!container) return;
        if (!append) {
            container.innerHTML = '';
        }
        suggestions.forEach(suggestion => {
            const confusion = classifyConfusion(motSaisi, suggestion);
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.style.borderLeft = `5px solid ${confusion.color}`;
            card.onclick = () => window.replaceCurrentWord(suggestion.w); // Uses the global function
            
            const confusionIcon = document.createElement('span');
            confusionIcon.className = 'confusion-icon';
            confusionIcon.textContent = confusion.icon;
            
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

            card.appendChild(confusionIcon);
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
