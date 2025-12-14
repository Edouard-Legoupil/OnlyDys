window.OnlyDysDyslexia = (function () {
    'use strict';

    /**
     * Generates a random integer between min (inclusive) and max (inclusive).
     * @param {number} min - The minimum value.
     * @param {number} max - The maximum value.
     * @returns {number} A random integer within the range.
     */
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Scrambles a single word, keeping the first and last letters intact.
     * This helps maintain readability while simulating dyslexia.
     * @param {string} word - The word to scramble.
     * @param {object} options - Configuration options.
     * @returns {string} The scrambled word or the original word.
     */
    function scrambleWord(word, options) {
        const defaultOptions = {
            minWordLength: 5,
            scrambleChance: 100
        };
        // Use Object.assign to merge user options over defaults
        options = Object.assign({}, defaultOptions, options);

        if (options.scrambleChance > 100) {
            options.scrambleChance = 100;
        }

        // Don't scramble small words or based on random chance
        if (word.length < options.minWordLength || randomInt(1, 100) > options.scrambleChance) {
            return word;
        }

        const a = randomInt(1, word.length - 2);
        const b = randomInt(a, word.length - 2);

        const middle = word.substring(a, b + 1);
        const scrambledMiddle = middle.split('').reverse().join('');

        const scrambledWord = word.slice(0, a) + scrambledMiddle + word.slice(b + 1);

        // To avoid getting the same word, we can add a simple retry, but for now, this is fine.
        if (scrambledWord === word && word.length > 3) {
            // simple shuffle for the middle part
            let middleChars = word.substring(1, word.length - 1).split('');
            for (let i = middleChars.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [middleChars[i], middleChars[j]] = [middleChars[j], middleChars[i]];
            }
            return word[0] + middleChars.join('') + word[word.length - 1];
        }

        return scrambledWord;
    }

    /**
     * Parses words from a string and applies the scrambling effect.
     * @param {string} str - The input string.
     * @param {object} options - Configuration options for scrambling.
     * @returns {string} The text with words scrambled.
     */
    function dyslexia(str, options) {
        let messedUpText = '';
        const re = /\w+/g;
        let lastIndex = 0;

        // Use String.prototype.replace with a function to handle matches and non-matches
        messedUpText = str.replace(/\w+/g, function (word) {
            return scrambleWord(word, options);
        });

        return messedUpText;
    }

    // State for Revert
    let lastOriginalText = null;

    function storeOriginal(text) {
        lastOriginalText = text;
    }

    function getOriginal() {
        return lastOriginalText;
    }

    // Expose the main function
    return {
        processText: dyslexia,
        storeOriginal: storeOriginal,
        getOriginal: getOriginal
    };

})();
