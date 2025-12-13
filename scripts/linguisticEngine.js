(function (window) {
    'use strict';

    /**
     * Linguistic Engine for OnlyDys
     * Handles text normalization, phoneme segmentation, syllable segmentation,
     * and silent letter detection for French.
     */

    const VOWELS = [
        "a", "à", "â",
        "e", "é", "è", "ê", "ë",
        "i", "î", "ï",
        "o", "ô",
        "u", "ù", "û", "ü",
        "y",
        "œ", "æ"
    ];

    const VOWEL_REGEX = new RegExp(VOWELS.join("|"), "i");

    // Order matters — longest first
    const MULTI_PHONEMES = [
        // Nasal vowels
        "eau", "eaux",
        "ain", "aim", "ein", "eim",
        "ien",
        "oin",
        "on", "om",
        "an", "am",
        "en", "em",
        "in", "im", "yn", "ym",

        // Vowel combinations
        "ou", "oi", "ai", "ei", "au",

        // Consonant digraphs
        "ch", "ph", "th", "gn", "qu", "gu",

        // Special cases
        "ill"
    ];

    const SILENT_ENDINGS = [
        "e", "es", "ent", "s", "t", "d", "p", "x"
    ];

    const LinguisticEngine = {

        /**
         * Normalizes text for processing (NFC, lowercase).
         * @param {string} text 
         * @returns {string} Normalized text
         */
        normalizeFrench: function (text) {
            if (!text) return "";
            return text.toLowerCase().normalize("NFC");
        },

        /**
         * Checks if a character is a vowel.
         * @param {string} char 
         * @returns {boolean}
         */
        isVowel: function (char) {
            return VOWELS.includes(char.toLowerCase());
        },

        /**
         * Checks if a character is a consonant.
         * @param {string} char 
         * @returns {boolean}
         */
        isConsonant: function (char) {
            return !this.isVowel(char) && /[a-zàâçéèêëîïôùûüœæ]/i.test(char);
        },

        /**
         * Checks if a character is punctuation (Unicode aware).
         * @param {string} char 
         * @returns {boolean}
         */
        isPunctuation: function (char) {
            return /\p{P}/u.test(char);
        },

        /**
         * Tokenizes text into words, preserving punctuation as separate tokens if needed, 
         * or just extracting words.
         * @param {string} text 
         * @returns {string[]} Array of words
         */
        tokenizeWords: function (text) {
            return text.match(/\p{L}+['’-]?\p{L}*/gu) || [];
        },

        /**
         * Segments a word into phonemes based on rules.
         * @param {string} word 
         * @returns {string[]} Array of phoneme strings
         */
        segmentPhonemes: function (word) {
            const normalizedWord = this.normalizeFrench(word);
            const phonemes = [];
            let i = 0;

            const NASAL_ENDINGS = ["n", "m"];

            while (i < normalizedWord.length) {
                let matched = false;

                for (const p of MULTI_PHONEMES) {
                    if (normalizedWord.startsWith(p, i)) {
                        // Special check for nasals (ending in n or m)
                        // If it ends in n/m, and is followed by a vowel, it's likely NOT a nasal phoneme.
                        // Exception: 'ien' at end of word is nasal /jɛ̃/ (chien).
                        // checking if p is in the list of nasals is safer than ending check? 
                        // The list has "on", "om", "an", "am", etc. 

                        const isNasalCandidate = (p.endsWith("n") || p.endsWith("m")) && p.length <= 4 && !["gn"].includes(p); // gn is a digraph consonant

                        if (isNasalCandidate) {
                            const nextChar = normalizedWord[i + p.length];
                            // If it's the end of word, it's nasal.
                            if (nextChar) {
                                // If followed by vowel, usually denasalized (e.g. 'ami', 'image', 'inutile')
                                if (this.isVowel(nextChar)) {
                                    continue; // skip this multi-phoneme match, try next or single letter
                                }
                                // Double consonant check: 'pomme' (om followed by m). 
                                // 'om' is [ɔ̃] ? No, 'pomme' is [pɔm]. 'om' shouldn't match.
                                // So if followed by 'n' or 'm', usually not nasal (cousine, bonne).
                                if (nextChar === 'n' || nextChar === 'm') {
                                    continue;
                                }
                            }
                        }

                        phonemes.push(p);
                        i += p.length;
                        matched = true;
                        break;
                    }
                }

                if (!matched) {
                    phonemes.push(normalizedWord[i]);
                    i++;
                }
            }

            return phonemes;
        },

        /**
         * Segments a word into syllables using valid CV patterns.
         * @param {string} word 
         * @returns {string[]} Array of syllable strings
         */
        segmentSyllables: function (word) {
            const phonemes = this.segmentPhonemes(word);
            const syllables = [];
            let current = [];

            for (let i = 0; i < phonemes.length; i++) {
                current.push(phonemes[i]);

                // If current phoneme contains a vowel (nucleus)
                if (VOWEL_REGEX.test(phonemes[i])) {
                    const next = phonemes[i + 1];
                    const nextNext = phonemes[i + 2];

                    if (next && !VOWEL_REGEX.test(next)) {
                        // V + C
                        if (nextNext && !VOWEL_REGEX.test(nextNext)) {
                            // V + C + C -> V C | C
                            // Consume the first consonant into current syllable
                            current.push(next);
                            i++;
                            syllables.push(current);
                            current = [];
                        } else {
                            // V + C + V (or V + C + #) -> V | C V
                            // Standard open syllable split
                            syllables.push(current);
                            current = [];
                        }
                    } else {
                        // V + V or V + # -> V | V
                        syllables.push(current);
                        current = [];
                    }
                }
            }

            if (current.length) {
                // Append remaining consonants to the last syllable if possible, or new if it was a mess
                if (syllables.length > 0) {
                    // Check if 'current' has a vowel. If not, append to last syllable.
                    const currentHasVowel = current.some(p => VOWEL_REGEX.test(p));
                    if (!currentHasVowel) {
                        // syllables elements are arrays of phonemes
                        syllables[syllables.length - 1] = syllables[syllables.length - 1].concat(current);
                    } else {
                        syllables.push(current);
                    }
                } else {
                    syllables.push(current);
                }
            }

            return syllables.map(s => s.join(""));
        },

        /**
         * Detects silent letters at the end of the word.
         * @param {string} word 
         * @returns {number[]} Array of indices of silent letters
         */
        detectSilentLetters: function (word) {
            const silentIndexes = [];
            const normalized = this.normalizeFrench(word);

            // Check endings
            for (const end of SILENT_ENDINGS) {
                if (normalized.endsWith(end) && normalized.length > end.length) {
                    const startIndex = word.length - end.length;

                    // Specific check for 'ent' which is only silent for verbs (3rd person plural)
                    // This is a naive heuristic since we don't have POS tagging. 
                    // We might assume 'ent' at end is silent for now or skip it if too risky.
                    // For safety in this "plugin" context without full dictionary, we might apply it.

                    for (let i = startIndex; i < word.length; i++) {
                        // Avoid duplicates if multiple endings match (e.g. 's' and 'es')
                        // We take the longest match implicitly if we iterate all? 
                        // Actually, just pushing them might duplicate.
                        if (!silentIndexes.includes(i)) {
                            silentIndexes.push(i);
                        }
                    }
                    // Break after finding one valid ending to avoid overlapping weirdness? 
                    // 'es' matches 's' too.
                    break;
                }
            }
            return silentIndexes.sort((a, b) => a - b);
        },

        /**
         * Full analysis of a word.
         * @param {string} word 
         * @returns {object} Analysis result
         */
        analyzeWord: function (word) {
            return {
                original: word,
                phonemes: this.segmentPhonemes(word),
                syllables: this.segmentSyllables(word),
                silentLetters: this.detectSilentLetters(word)
            };
        }
    };

    window.LinguisticEngine = LinguisticEngine;

})(window);
