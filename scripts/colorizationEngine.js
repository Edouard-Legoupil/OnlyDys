(function (window) {
    'use strict';

    /**
     * Colorization Engine
     * Applies formatting to a text model based on config and linguistic analysis.
     * 
     * Model structure:
     * {
     *   paragraphs: [
     *     {
     *       textRuns: [
     *         { text: "string", formatting: { ... } }
     *       ]
     *     }
     *   ]
     * }
     */

    const ColorizationEngine = {
        /**
         * DEFAULT PALETTES
         */
        palettes: {
            phonemes: [
                "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2",
                "#D55E00", "#CC79A7", "#000000"
            ],
            syllables: ["#D55E00", "#0072B2"], // Vermilion, Blue (Okabe-Ito)
            words: ["#000000", "#555555"],     // Black, Dark Grey
            lines: ["#000000", "#0072B2"],     // Black, Blue
            vowels: "#D55E00",                 // Vermilion
            consonants: "#0072B2",             // Blue
            silent: "#999999",                 // Grey
            punctuation: "#CC79A7",            // Reddish Purple
            grammar: {
                'NOM': '#D55E00', // Vermilion
                'VER': '#0072B2', // Blue
                'ADJ': '#56B4E9', // Sky Blue
                'ADV': '#009E73', // Bluish Green
                'PRO': '#E69F00', // Orange
                'DET': '#CC79A7', // Reddish Purple
                'PRE': '#000000', // Black
                'CON': '#999999', // Grey
                'INT': '#F0E442', // Yellow
            }
        },

        processModel: function (model, config) {
            // Config: { mode: 'phonemes' | 'syllables' | 'words' | 'lines' | 'grammar', options: {...} }
            const processedModel = JSON.parse(JSON.stringify(model)); // Deep copy

            // Build dictionary map if in grammar mode for performance
            let wordMap = null;
            if (config.mode === 'grammar' && window.OnlyDysLogic && window.OnlyDysLogic.dictionary) {
                wordMap = new Map(window.OnlyDysLogic.dictionary.map(entry => [entry.w.toLowerCase(), entry.g]));
            }

            processedModel.paragraphs.forEach(para => {
                const newRuns = [];
                para.textRuns.forEach(run => {
                    if (!run.text) return;
                    // Pass wordMap if available
                    const transformedRuns = this.processRun(run, config, wordMap);
                    newRuns.push(...transformedRuns);
                });
                para.textRuns = newRuns;
            });

            return processedModel;
        },

        processRun: function (run, config, wordMap) {
            const originalText = run.text;
            const engine = window.LinguisticEngine;
            const newRuns = [];

            // Helper to add a segment
            const addSegment = (text, color, extraFormatting = {}) => {
                newRuns.push({
                    text: text,
                    formatting: {
                        ...run.formatting,
                        color: color || run.formatting.color,
                        ...extraFormatting
                    }
                });
            };

            if (config.mode === 'grammar') {
                // Grammar mode logic
                // We need to split into words to check dictionary
                const words = originalText.split(/(\P{L}+)/u);

                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") {
                        addSegment(token, null);
                        return;
                    }

                    const lowerWord = token.toLowerCase();
                    const grammar = wordMap ? wordMap.get(lowerWord) : null;

                    let color = null;
                    if (grammar && this.palettes.grammar[grammar]) {
                        color = this.palettes.grammar[grammar];
                    }
                    addSegment(token, color);
                });

            } else if (config.mode === 'phonemes') {
                const words = originalText.split(/(\P{L}+)/u); // Split keeping separators

                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") {
                        addSegment(token, null);
                        return;
                    }

                    const analysis = engine.analyzeWord(token);
                    analysis.phonemes.forEach((p, idx) => {
                        const colorIndex = Math.abs(this.hashCode(p.toLowerCase())) % this.palettes.phonemes.length;
                        const color = this.palettes.phonemes[colorIndex];
                        addSegment(p, color);
                    });
                });

            } else if (config.mode === 'syllables') {
                const words = originalText.split(/(\P{L}+)/u);
                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") {
                        addSegment(token, null);
                        return;
                    }

                    const syllables = engine.segmentSyllables(token);
                    syllables.forEach((s, idx) => {
                        const color = this.palettes.syllables[idx % 2];
                        addSegment(s, color);
                    });
                });

            } else if (config.mode === 'silent') {
                const words = originalText.split(/(\P{L}+)/u);

                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") {
                        addSegment(token, null);
                        return;
                    }

                    const silentIndices = engine.detectSilentLetters(token);
                    if (silentIndices.length === 0) {
                        addSegment(token, null);
                    } else {
                        // We must slice the token up.
                        let lastIdx = 0;
                        for (let i = 0; i < token.length; i++) {
                            if (silentIndices.includes(i)) {
                                if (i > lastIdx) {
                                    addSegment(token.substring(lastIdx, i), null);
                                }
                                addSegment(token[i], this.palettes.silent);
                                lastIdx = i + 1;
                            }
                        }
                        if (lastIdx < token.length) {
                            addSegment(token.substring(lastIdx), null);
                        }
                    }
                });

            } else {
                // Default: preserve
                addSegment(originalText, null);
            }

            return newRuns;
        },

        /**
         * Simple string hash for color stability.
         */
        hashCode: function (str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        }
    };

    window.ColorizationEngine = ColorizationEngine;

})(window);
