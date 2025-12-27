(function (window) {
    'use strict';

    /**
     * Colorization Engine
     * Applies formatting to a text model based on config and linguistic analysis.
     * 
     * Credits: Inspired and informed by the work of Marie-Pierre Brungard 
     * and the LireCouleur project (http://lirecouleur.arkaline.fr).
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

    const GRAMMAR_COLOR_MAP = {
        'NOM': '#A60628', // Dark Red
        'VER': '#0047AB', // Dark Blue
        'ADJ': '#006994', // Dark Cyan
        'ADV': '#006B3C', // Dark Green
        'PRO': '#AA3300', // Dark Orange
        'DET': '#6D214F', // Dark Purple
        'PRE': '#000000', // Black
        'CON': '#663300', // Dark Brown
        'INT': '#8B008B', // Dark Magenta
    };

    function displayColorLegend() {
        const legendContainer = document.getElementById('color-legend');
        if (!legendContainer) return;
        legendContainer.innerHTML = '';
        for (const [grammar, color] of Object.entries(GRAMMAR_COLOR_MAP)) {
            const item = document.createElement('div');
            item.className = 'legend-item';

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = color;

            const label = document.createElement('span');
            label.textContent = grammar;

            item.appendChild(colorBox);
            item.appendChild(label);
            legendContainer.appendChild(item);
        }
    }

    const ColorizationEngine = {
        /**
         * DEFAULT PALETTES
         */
        palettes: {
            phonemes: [
                "#A60628", "#0047AB", "#006B3C", "#AA3300", "#006994",
                "#663300", "#8B008B", "#000000"
            ],
            syllables: ["#A60628", "#0047AB"], // Dark Red, Dark Blue
            words: ["#000000", "#0047AB"],     // Black, Dark Blue
            lines: ["#000000", "#0047AB"],     // Black, Dark Blue
            letters: ["#A60628", "#0047AB", "#006B3C", "#AA3300"], // Consistent set
            vowels: "#6D214F",                 // Dark Purple
            consonants: "#0047AB",             // Dark Blue
            silent: "#606060",                 // Dark Grey
            punctuation: "#6D214F",            // Dark Purple (consistent with vowels/other marking)
            grammar: {
                'NOM': '#A60628', // Dark Red
                'VER': '#0047AB', // Dark Blue
                'ADJ': '#006994', // Dark Cyan
                'ADV': '#006B3C', // Dark Green
                'PRO': '#AA3300', // Dark Orange
                'DET': '#6D214F', // Dark Purple
                'PRE': '#000000', // Black
                'CON': '#663300', // Dark Brown
                'INT': '#8B008B', // Dark Magenta
            }
        },

        // Pastel versions for highlighting mode (background colors)
        highlightPalettes: {
            phonemes: [
                "#FFE6E6", "#E6F2FF", "#E6F9E6", "#FFE6CC", "#E6F9FF",
                "#F5E6D3", "#F2E6FF", "#F0F0F0"
            ],
            syllables: ["#FFE6E6", "#E6F2FF"], // Light Red, Light Blue
            words: ["#F0F0F0", "#E6F2FF"],     // Light Grey, Light Blue
            lines: ["#F0F0F0", "#E6F2FF"],     // Light Grey, Light Blue
            letters: ["#FFE6E6", "#E6F2FF", "#E6F9E6", "#FFE6CC"],
            vowels: "#F2E6FF",                 // Light Purple
            consonants: "#E6F2FF",             // Light Blue
            silent: "#F0F0F0",                 // Light Grey
            punctuation: "#F2E6FF",            // Light Purple
            grammar: {
                'NOM': '#FFE6E6', // Light Red
                'VER': '#E6F2FF', // Light Blue
                'ADJ': '#E6F9FF', // Light Cyan
                'ADV': '#E6F9E6', // Light Green
                'PRO': '#FFE6CC', // Light Orange
                'DET': '#F2E6FF', // Light Purple
                'PRE': '#F0F0F0', // Light Grey
                'CON': '#F5E6D3', // Light Brown
                'INT': '#F2E6FF', // Light Magenta
            }
        },

        // Alternating line colors
        lineColors: ["#FFFACD", "#E0F0FF"], // Light Yellow, Light Blue

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
                const useHighlighting = config.options && config.options.useHighlighting;
                const formatting = { ...run.formatting, ...extraFormatting };

                if (color !== null && color !== undefined) {
                    if (useHighlighting) {
                        // Use background color for highlighting mode
                        formatting.backgroundColor = color;
                        formatting.color = '#000000'; // Keep text black for readability
                    } else {
                        // Standard text color mode
                        formatting.color = color;
                    }
                } else {
                    // No color specified, set to null
                    formatting.color = null;
                }

                newRuns.push({ text: text, formatting: formatting });
            };

            // Helper to get the appropriate palette based on highlighting mode
            const getPalette = (paletteKey) => {
                const useHighlighting = config.options && config.options.useHighlighting;
                if (useHighlighting && ColorizationEngine.highlightPalettes[paletteKey]) {
                    return ColorizationEngine.highlightPalettes[paletteKey];
                }
                return ColorizationEngine.palettes[paletteKey];
            };

            if (config.mode === 'alternlines') {
                // Alternating lines mode - apply background to entire run
                const lineIndex = config.lineIndex || 0;
                const bgColor = this.lineColors[lineIndex % this.lineColors.length];
                addSegment(originalText, null, { backgroundColor: bgColor });

            } else if (config.mode === 'grammar') {
                // Grammar mode logic
                // We need to split into words to check dictionary
                const words = originalText.split(/(\P{L}+)/u).filter(t => t !== "");
                const grammarPalette = getPalette('grammar');

                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") {
                        addSegment(token, null);
                        return;
                    }

                    const lowerWord = token.toLowerCase();

                    // Try exact match first, then lemmatization
                    let grammar = wordMap ? wordMap.get(lowerWord) : null;
                    if (!grammar && wordMap && engine.lemmatize) {
                        const lemma = engine.lemmatize(lowerWord, wordMap);
                        grammar = wordMap.get(lemma);
                    }

                    let color = null;
                    if (grammar && grammarPalette[grammar]) {
                        color = grammarPalette[grammar];
                    }
                    addSegment(token, color);
                });

            } else if (config.mode === 'phonemes' || config.mode === 'alternphonemes') {
                const words = originalText.split(/(\P{L}+)/u).filter(t => t !== "");
                const phonemesPalette = getPalette('phonemes');
                let phonemeCount = 0;

                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") {
                        addSegment(token, null);
                        return;
                    }

                    const analysis = engine.analyzeWord(token);
                    analysis.phonemes.forEach((p, idx) => {
                        let color;
                        if (config.mode === 'alternphonemes') {
                            color = phonemesPalette[phonemeCount % phonemesPalette.length];
                            phonemeCount++;
                        } else {
                            const colorIndex = Math.abs(this.hashCode(p.toLowerCase())) % phonemesPalette.length;
                            color = phonemesPalette[colorIndex];
                        }
                        addSegment(p, color);
                    });
                });

            } else if (config.mode === 'syllables') {
                const words = originalText.split(/(\P{L}+)/u).filter(t => t !== "");
                const syllablesPalette = getPalette('syllables');
                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") {
                        addSegment(token, null);
                        return;
                    }

                    const syllables = engine.segmentSyllables(token);
                    syllables.forEach((s, idx) => {
                        const color = syllablesPalette[idx % syllablesPalette.length];
                        const extra = (config.options && config.options.showArcs) ? { showArc: true } : {};
                        addSegment(s, color, extra);
                    });
                });

            } else if (config.mode === 'alternlettres') {
                const lettersPalette = getPalette('letters');
                let letterCount = 0;
                for (let i = 0; i < originalText.length; i++) {
                    const char = originalText[i];
                    if (engine.isPunctuation(char) || /\s/.test(char)) {
                        addSegment(char, null);
                    } else {
                        const color = lettersPalette[letterCount % lettersPalette.length];
                        addSegment(char, color);
                        letterCount++;
                    }
                }

            } else if (config.mode === 'alternmots') {
                const wordsPalette = getPalette('words');
                const words = originalText.split(/(\s+)/u).filter(t => t !== "");
                let wordIdx = 0;
                words.forEach(token => {
                    if (/\s+/.test(token) || token === "") {
                        addSegment(token, null);
                    } else {
                        const color = wordsPalette[wordIdx % wordsPalette.length];
                        addSegment(token, color);
                        wordIdx++;
                    }
                });

            } else if (config.mode === 'vowels' || config.mode === 'consonants') {
                const vowelColor = getPalette('vowels');
                const consonantColor = getPalette('consonants');
                for (let i = 0; i < originalText.length; i++) {
                    const char = originalText[i];
                    let color = null;
                    if (config.mode === 'vowels' && engine.isVowel(char)) {
                        color = vowelColor;
                    } else if (config.mode === 'consonants' && engine.isConsonant(char)) {
                        color = consonantColor;
                    }
                    addSegment(char, color);
                }

            } else if (config.mode === 'letters' && config.options && config.options.targetLetters) {
                // Highlight specific letters (e.g. b/d/p/q)
                const phonemesPalette = getPalette('phonemes');
                const targets = config.options.targetLetters.toLowerCase();
                for (let i = 0; i < originalText.length; i++) {
                    const char = originalText[i];
                    let color = null;
                    if (targets.includes(char.toLowerCase())) {
                        const idx = targets.indexOf(char.toLowerCase());
                        color = phonemesPalette[idx % phonemesPalette.length];
                    }
                    addSegment(char, color);
                }

            } else if (config.mode === 'silent') {
                const words = originalText.split(/(\P{L}+)/u).filter(t => t !== "");
                const silentColor = getPalette('silent');

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
                                addSegment(token[i], silentColor);
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
