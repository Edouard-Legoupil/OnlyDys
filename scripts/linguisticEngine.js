(function (window) {
    'use strict';

    /**
     * Linguistic Engine for OnlyDys
     * Handles text normalization, phoneme segmentation, syllable segmentation,
     * and silent letter detection for French.
     * 
     * Credits: Inspired and informed by the work of Marie-Pierre Brungard 
     * and the LireCouleur project (http://lirecouleur.arkaline.fr).
     */

    const VOWELS = [
        "a", "à", "â", "ä",
        "e", "é", "è", "ê", "ë",
        "i", "î", "ï",
        "o", "ô", "ö",
        "u", "ù", "û", "ü",
        "y", "ÿ",
        "œ", "æ"
    ];

    const VOWEL_REGEX = new RegExp(VOWELS.join("|"), "i");

    // Order matters — longest first
    const MULTI_PHONEMES = [
        // Nasal vowels / complex vowels
        "eaux", "eau",
        "aient", "oient", // verb endings
        "ain", "aim", "ein", "eim",
        "ien", "ian",
        "oin",
        "on", "om",
        "an", "am",
        "en", "em",
        "in", "im", "yn", "ym",

        // Vowel combinations
        "ou", "oi", "ai", "ei", "au", "eu", "œu",

        // Consonant digraphs
        "ch", "ph", "th", "gn", "qu", "gu",

        // Special cases
        "ill", "ail", "eil", "ouil", "euil"
    ];

    const SILENT_ENDINGS = [
        "ent", "es", "e", "s", "t", "d", "p", "x", "g", "z"
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
            return !this.isVowel(char) && /[a-zàâäçéèêëîïôöùûüÿœæ]/i.test(char);
        },

        /**
         * Determines the type of phoneme.
         * @param {string} phoneme 
         * @returns {'vowel' | 'consonant' | 'semi-consonant' | 'other'}
         */
        getPhonemeType: function (phoneme) {
            if (!phoneme) return 'other';
            const lower = phoneme.toLowerCase();

            // If it's in the MULTI_PHONEMES list, we check its nature
            if (["eau", "eaux", "aient", "oient", "ain", "aim", "ein", "eim", "ien", "ian", "oin", "on", "om", "an", "am", "en", "em", "in", "im", "yn", "ym", "ou", "oi", "ai", "ei", "au", "eu", "œu"].includes(lower)) {
                return 'vowel';
            }
            if (["ch", "ph", "th", "gn", "qu", "gu"].includes(lower)) {
                return 'consonant';
            }
            if (["ill", "ail", "eil", "ouil", "euil"].includes(lower)) {
                return 'semi-consonant';
            }

            if (this.isVowel(phoneme)) return 'vowel';
            if (this.isConsonant(phoneme)) return 'consonant';

            return 'other';
        },

        /**
         * Checks if a character is a punctuation (Unicode aware).
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
                const type = this.getPhonemeType(phonemes[i]);

                // If current phoneme is a vowel (nucleus)
                if (type === 'vowel') {
                    const next = phonemes[i + 1];
                    const nextType = next ? this.getPhonemeType(next) : null;
                    const nextNext = phonemes[i + 2];
                    const nextNextType = nextNext ? this.getPhonemeType(nextNext) : null;

                    if (next && nextType !== 'vowel') {
                        // V + C
                        if (nextNext && nextNextType !== 'vowel') {
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
                    const currentHasVowel = current.some(p => this.getPhonemeType(p) === 'vowel');
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
            if (!word) return [];
            const silentIndexes = [];

            // Basic normalization mainly for casing. 
            // We assume 1:1 mapping for indices for now (standard French chars).
            const lower = word.toLowerCase();

            for (const end of SILENT_ENDINGS) {
                if (lower.endsWith(end) && lower.length > end.length) {
                    const startIndex = lower.length - end.length;

                    if (startIndex < 0) continue;

                    for (let i = startIndex; i < lower.length; i++) {
                        if (silentIndexes.indexOf(i) === -1) {
                            silentIndexes.push(i);
                        }
                    }
                    break;
                }
            }
            return silentIndexes.sort(function (a, b) { return a - b; });
        },

        /**
         * Attempts to lemmatize a French word by removing common inflectional endings.
         * @param {string} word - The inflected word
         * @param {Map|null} wordMap - Optional dictionary map for validation
         * @returns {string} The lemmatized form (or original if no match found)
         */
        lemmatize: function (word, wordMap) {
            if (!word) return word;

            const lower = word.toLowerCase();

            // If exact match exists, return it
            if (wordMap && wordMap.has(lower)) {
                return lower;
            }

            // Common verb endings to try removing (ordered by specificity)
            const verbEndings = [
                // Present tense
                'ons', 'ez', 'ent', 'es', 'e',
                // Imperfect
                'aient', 'ions', 'iez', 'ais', 'ait',
                // Future
                'eront', 'erez', 'erons', 'eras', 'era', 'erai',
                'ront', 'rez', 'rons', 'ras', 'ra', 'rai',
                // Conditional
                'eraient', 'erions', 'eriez', 'erais', 'erait',
                'raient', 'rions', 'riez', 'rais', 'rait',
                // Past participle
                'és', 'ées', 'ée', 'é',
                'is', 'it', 'ies', 'ie',
                'us', 'ue', 'ues', 'u',
                // Infinitive variations
                'ir', 'er', 're'
            ];

            // Adjective/noun agreement endings
            const agreementEndings = [
                'aux', 'eaux', 'eux',  // Plural special cases
                'es', 's', 'x'          // Standard plural/feminine
            ];

            // Try verb lemmatization
            for (const ending of verbEndings) {
                if (lower.endsWith(ending) && lower.length > ending.length + 2) {
                    const stem = lower.slice(0, -ending.length);

                    // For -er verbs, try adding 'er' back
                    if (['e', 'es', 'ent', 'ons', 'ez', 'ais', 'ait', 'ions', 'iez', 'aient'].includes(ending)) {
                        const candidate = stem + 'er';
                        if (!wordMap || wordMap.has(candidate)) {
                            return candidate;
                        }
                    }

                    // For -ir verbs, try adding 'ir' back
                    if (['is', 'it', 'issons', 'issez', 'issent', 'issais', 'issait'].includes(ending)) {
                        const candidate = stem + 'ir';
                        if (!wordMap || wordMap.has(candidate)) {
                            return candidate;
                        }
                    }

                    // For -re verbs, try adding 're' back
                    if (['s', 't', 'ons', 'ez', 'ent'].includes(ending) && !stem.endsWith('e')) {
                        const candidate = stem + 're';
                        if (!wordMap || wordMap.has(candidate)) {
                            return candidate;
                        }
                    }

                    // Try the stem itself
                    if (!wordMap || wordMap.has(stem)) {
                        return stem;
                    }
                }
            }

            // Try agreement lemmatization
            for (const ending of agreementEndings) {
                if (lower.endsWith(ending) && lower.length > ending.length + 2) {
                    const stem = lower.slice(0, -ending.length);

                    // Try stem directly
                    if (!wordMap || wordMap.has(stem)) {
                        return stem;
                    }

                    // For feminine forms ending in 'e', try removing it
                    if (ending === 'es' || ending === 'e') {
                        if (!wordMap || wordMap.has(stem)) {
                            return stem;
                        }
                    }
                }
            }

            // No lemmatization found, return original
            return lower;
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
