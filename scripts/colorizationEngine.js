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

    // CURRENT PALETTE SETTING (default: 'default')
    let currentPaletteName = 'default';

    /**
     * FIVE COLOR-BLIND FRIENDLY PALETTES
     * 
     * Each palette is designed to be:
     * - Distinguishable by people with color vision deficiency (CVD)
     * - Protanopia (red-green), Deuteranopia (red-green), Tritanopia (blue-yellow) safe
     * - Perceptually uniform where possible
     * - Sufficient contrast for readability
     * 
     * Sources:
     * - Okabe-Ito: https://jfly.uni-koeln.de/color/
     * - Tol: https://personal.sron.nl/~pault/
     * - Viridis: https://cran.r-project.org/web/packages/viridis/vignettes/intro-to-viridis.html
     */
    const PALETTES = {
        // PALETTE 1: Default (OnlyDys high-contrast color scheme)
        'default': {
            name: 'Default',
            description: 'High-contrast OnlyDys color scheme - color-blind friendly',
            phonemes: ["#D62728", "#2B83BA", "#2CA02C", "#FF7F0E", "#98DF8A", "#BCBD22", "#E377C2", "#4B0082"],
            syllables: ["#D62728", "#2B83BA"],
            words: ["#4B0082", "#2B83BA"],
            letters: ["#D62728", "#2B83BA", "#2CA02C", "#FF7F0E"],
            vowels: "#E377C2",
            consonants: "#2B83BA",
            silent: "#606060",
            punctuation: "#E377C2",
            grammar: {
                'NOM': '#D62728', 'VER': '#2B83BA', 'ADJ': '#2CA02C', 'ADV': '#98DF8A',
                'PRO': '#FF7F0E', 'DET': '#BCBD22', 'PRE': '#4B0082', 'CON': '#8B4513', 'INT': '#E377C2'
            },
            // Highlighting variants (lighter versions)
            highlight: {
                phonemes: ["#FFEEEE", "#E6F5FF", "#E6FFEE", "#FFECE6", "#E6FFE6", "#FFFFE6", "#FFE6F5", "#E6E6FF"],
                syllables: ["#FFEEEE", "#E6F5FF"],
                words: ["#E6E6FF", "#E6F5FF"],
                letters: ["#FFEEEE", "#E6F5FF", "#E6FFEE", "#FFECE6"],
                vowels: "#FFE6F5",
                consonants: "#E6F5FF",
                silent: "#F0F0F0",
                punctuation: "#FFE6F5",
                grammar: {
                    'NOM': '#FFEEEE', 'VER': '#E6F5FF', 'ADJ': '#E6FFEE', 'ADV': '#E6FFE6',
                    'PRO': '#FFECE6', 'DET': '#FFFFE6', 'PRE': '#E6E6FF', 'CON': '#FFE6D3', 'INT': '#FFE6F5'
                }
            }
        },

        // PALETTE 2: Okabe-Ito (Color Universal Design)
        // Optimized for all types of color blindness
        // Source: https://jfly.uni-koeln.de/color/
        'okabeIto': {
            name: 'Okabe-Ito',
            description: 'Color Universal Design - scientifically optimized for CVD',
            phonemes: ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#000000"],
            syllables: ["#E69F00", "#56B4E9"],
            words: ["#000000", "#56B4E9"],
            letters: ["#E69F00", "#56B4E9", "#009E73", "#F0E442"],
            vowels: "#009E73",
            consonants: "#56B4E9",
            silent: "#808080",
            punctuation: "#CC79A7",
            grammar: {
                'NOM': '#E69F00', 'VER': '#56B4E9', 'ADJ': '#009E73', 'ADV': '#F0E442',
                'PRO': '#F0E442', 'DET': '#0072B2', 'PRE': '#000000', 'CON': '#D55E00', 'INT': '#CC79A7'
            },
            highlight: {
                phonemes: ["#FFF5EB", "#E7F5FF", "#E7FFEF", "#FFFFE7", "#E7F0FA", "#FFECE7", "#FFEBF5", "#F8F8F8"],
                syllables: ["#FFF5EB", "#E7F5FF"],
                words: ["#F8F8F8", "#E7F5FF"],
                letters: ["#FFF5EB", "#E7F5FF", "#E7FFEF", "#FFFFE7"],
                vowels: "#E7FFEF",
                consonants: "#E7F5FF",
                silent: "#D3D3D3",
                punctuation: "#FFEBF5",
                grammar: {
                    'NOM': '#FFF5EB', 'VER': '#E7F5FF', 'ADJ': '#E7FFEF', 'ADV': '#FFFFE7',
                    'PRO': '#FFFFE7', 'DET': '#E7F0FA', 'PRE': '#F8F8F8', 'CON': '#FFECE7', 'INT': '#FFEBF5'
                }
            }
        },

        // PALETTE 3: Tol's Qualitative
        // Paul Tol's qualitative color scheme
        // Source: https://personal.sron.nl/~pault/
        'tolsQualitative': {
            name: "Tol's Qualitative",
            description: 'Paul Tol qualitative scheme - color-blind safe',
            phonemes: ["#332288", "#117733", "#44AA99", "#88CCEE", "#DDCC77", "#CC6677", "#AA4499", "#000000"],
            syllables: ["#117733", "#44AA99"],
            words: ["#000000", "#44AA99"],
            letters: ["#332288", "#117733", "#44AA99", "#88CCEE"],
            vowels: "#AA4499",
            consonants: "#44AA99",
            silent: "#808080",
            punctuation: "#CC6677",
            grammar: {
                'NOM': '#332288', 'VER': '#117733', 'ADJ': '#44AA99', 'ADV': '#88CCEE',
                'PRO': '#DDCC77', 'DET': '#CC6677', 'PRE': '#000000', 'CON': '#AA4499', 'INT': '#CC6677'
            },
            highlight: {
                phonemes: ["#E6D6FF", "#D6F5D6", "#D6F5F5", "#E6F5FF", "#FFF5D6", "#FFD6E6", "#F5D6FF", "#F8F8F8"],
                syllables: ["#D6F5D6", "#D6F5F5"],
                words: ["#F8F8F8", "#D6F5F5"],
                letters: ["#E6D6FF", "#D6F5D6", "#D6F5F5", "#E6F5FF"],
                vowels: "#F5D6FF",
                consonants: "#D6F5F5",
                silent: "#D3D3D3",
                punctuation: "#FFD6E6",
                grammar: {
                    'NOM': '#E6D6FF', 'VER': '#D6F5D6', 'ADJ': '#D6F5F5', 'ADV': '#E6F5FF',
                    'PRO': '#FFF5D6', 'DET': '#FFD6E6', 'PRE': '#F8F8F8', 'CON': '#F5D6FF', 'INT': '#FFD6E6'
                }
            }
        },

        // PALETTE 4: Viridis (Perceptually Uniform)
        // Viridis color map - perceptually uniform, color-blind friendly
        // Source: https://cran.r-project.org/web/packages/viridis/
        'viridis': {
            name: 'Viridis',
            description: 'Perceptually uniform - excellent for color blindness',
            phonemes: ["#440154", "#482878", "#3E4989", "#31688E", "#26828E", "#1F9E89", "#35B779", "#000000"],
            syllables: ["#440154", "#1F9E89"],
            words: ["#000000", "#1F9E89"],
            letters: ["#440154", "#482878", "#3E4989", "#31688E"],
            vowels: "#26828E",
            consonants: "#1F9E89",
            silent: "#505050",
            punctuation: "#35B779",
            grammar: {
                'NOM': '#440154', 'VER': '#482878', 'ADJ': '#3E4989', 'ADV': '#31688E',
                'PRO': '#26828E', 'DET': '#1F9E89', 'PRE': '#000000', 'CON': '#35B779', 'INT': '#1F9E89'
            },
            highlight: {
                phonemes: ["#F0E6FF", "#E6E6FF", "#D6E6FF", "#C6E6FF", "#B6E6FF", "#A6FFE6", "#A6FFA6", "#F8F8F8"],
                syllables: ["#F0E6FF", "#A6FFE6"],
                words: ["#F8F8F8", "#A6FFE6"],
                letters: ["#F0E6FF", "#E6E6FF", "#D6E6FF", "#C6E6FF"],
                vowels: "#B6E6FF",
                consonants: "#A6FFE6",
                silent: "#D3D3D3",
                punctuation: "#A6FFA6",
                grammar: {
                    'NOM': '#F0E6FF', 'VER': '#E6E6FF', 'ADJ': '#D6E6FF', 'ADV': '#C6E6FF',
                    'PRO': '#B6E6FF', 'DET': '#A6FFE6', 'PRE': '#F8F8F8', 'CON': '#A6FFA6', 'INT': '#A6FFE6'
                }
            }
        },

        // PALETTE 5: High Contrast
        // Custom high-contrast palette for maximum accessibility
        'highContrast': {
            name: 'High Contrast',
            description: 'Maximum contrast - ideal for low vision',
            phonemes: ["#0000FF", "#FF0000", "#00FF00", "#FF8000", "#8000FF", "#FFFF00", "#FF00FF", "#000000"],
            syllables: ["#0000FF", "#FF0000"],
            words: ["#000000", "#FF0000"],
            letters: ["#0000FF", "#FF0000", "#00FF00", "#FF8000"],
            vowels: "#8000FF",
            consonants: "#0000FF",
            silent: "#808080",
            punctuation: "#FF00FF",
            grammar: {
                'NOM': '#0000FF', 'VER': '#FF0000', 'ADJ': '#00FF00', 'ADV': '#FF8000',
                'PRO': '#8000FF', 'DET': '#FFFF00', 'PRE': '#000000', 'CON': '#FF00FF', 'INT': '#FF00FF'
            },
            highlight: {
                phonemes: ["#E6E6FF", "#FFE6E6", "#E6FFE6", "#FFE6D6", "#F0E6FF", "#FFFFE6", "#FFE6FF", "#F8F8F8"],
                syllables: ["#E6E6FF", "#FFE6E6"],
                words: ["#F8F8F8", "#FFE6E6"],
                letters: ["#E6E6FF", "#FFE6E6", "#E6FFE6", "#FFE6D6"],
                vowels: "#F0E6FF",
                consonants: "#E6E6FF",
                silent: "#D3D3D3",
                punctuation: "#FFE6FF",
                grammar: {
                    'NOM': '#E6E6FF', 'VER': '#FFE6E6', 'ADJ': '#E6FFE6', 'ADV': '#FFE6D6',
                    'PRO': '#F0E6FF', 'DET': '#FFFFE6', 'PRE': '#F8F8F8', 'CON': '#FFE6FF', 'INT': '#FFE6FF'
                }
            }
        }
    };

    const GRAMMAR_COLOR_MAP = {
        'NOM': '#D62728', // Bright Red
        'VER': '#2B83BA', // Vibrant Blue
        'ADJ': '#2CA02C', // Bright Green
        'ADV': '#98DF8A', // Light Green
        'PRO': '#FF7F0E', // Orange
        'DET': '#BCBD22', // Olive/Chartreuse
        'PRE': '#4B0082', // Indigo
        'CON': '#8B4513', // Saddlebrown
        'INT': '#E377C2', // Pink
    };

    function displayColorLegend() {
        const legendContainer = document.getElementById('color-legend');
        if (!legendContainer) return;
        legendContainer.innerHTML = '';
        
        // Get current palette
        const palette = getCurrentPalette();
        const grammarPalette = palette.grammar;
        
        // Create title
        const title = document.createElement('div');
        title.className = 'legend-title';
        title.textContent = `Palette: ${getCurrentPaletteInfo().name}`;
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '10px';
        title.style.textAlign = 'center';
        legendContainer.appendChild(title);
        
        // Display grammar colors
        for (const [grammar, color] of Object.entries(grammarPalette)) {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.margin = '5px 0';

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = color;
            colorBox.style.width = '24px';
            colorBox.style.height = '24px';
            colorBox.style.border = '1px solid #ccc';
            colorBox.style.marginRight = '10px';
            colorBox.style.borderRadius = '4px';

            const label = document.createElement('span');
            label.textContent = grammar;
            label.style.flex = '1';

            item.appendChild(colorBox);
            item.appendChild(label);
            legendContainer.appendChild(item);
        }
    }

    /**
     * Get current palette info
     */
    function getCurrentPaletteInfo() {
        return PALETTES[currentPaletteName];
    }

    /**
     * Get the current palette's colors
     */
    function getCurrentPalette() {
        return getCurrentPaletteInfo();
    }

    /**
     * Get current highlight palette
     */
    function getCurrentHighlightPalette() {
        return getCurrentPaletteInfo().highlight || getCurrentPaletteInfo();
    }

    /**
     * Set the current palette by name
     * @param {string} paletteName - Name of palette to activate
     */
    function setCurrentPalette(paletteName) {
        if (PALETTES[paletteName]) {
            currentPaletteName = paletteName;
            if (window.ConfigManager && window.ConfigManager.config) {
                window.ConfigManager.config.colorPalette = paletteName;
                window.ConfigManager.save();
            }
            if (window.logger) {
                window.logger.info(`Color palette changed to: ${paletteName}`);
            }
            return true;
        }
        if (window.logger) {
            window.logger.warn(`Unknown palette: ${paletteName}`);
        }
        return false;
    }

    /**
     * Get the current palette name
     */
    function getCurrentPaletteName() {
        return currentPaletteName;
    }

    /**
     * Initialize palette from config
     */
    function initPaletteFromConfig() {
        if (window.ConfigManager && window.ConfigManager.config && 
            window.ConfigManager.config.colorPalette && 
            PALETTES[window.ConfigManager.config.colorPalette]) {
            currentPaletteName = window.ConfigManager.config.colorPalette;
            if (window.logger) {
                window.logger.info(`Initialized palette from config: ${currentPaletteName}`);
            }
        }
    }

    /**
     * Get list of all available palette names with metadata
     */
    function getAvailablePalettes() {
        const list = [];
        for (const [name, palette] of Object.entries(PALETTES)) {
            list.push({
                name: name,
                displayName: palette.name,
                description: palette.description
            });
        }
        return list;
    }

    const ColorizationEngine = {
        /**
         * DEFAULT PALETTES - Now using palette system
         */
        PALETTES: PALETTES,
        palettes: PALETTES.default,
        highlightPalettes: PALETTES.default.highlight,

        // Legacy compatibility - point to current palette
        get palettes() {
            return getCurrentPalette();
        },
        
        get highlightPalettes() {
            return getCurrentHighlightPalette();
        },

        // Expose palette management functions
        getCurrentPaletteName: getCurrentPaletteName,
        setCurrentPalette: setCurrentPalette,
        getCurrentPalette: getCurrentPalette,
        getAvailablePalettes: getAvailablePalettes,
        initPaletteFromConfig: initPaletteFromConfig,
        displayColorLegend: displayColorLegend,

        // Legacy properties for backward compatibility
        lineColors: ["#FFFACD", "#E0F0FF"],

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
                const paletteName = config.options && config.options.colorPalette || currentPaletteName;
                
                if (window.logger) {
                    window.logger.info("getPalette: paletteKey=" + paletteKey + ", useHighlighting=" + useHighlighting + ", paletteName=" + paletteName);
                }
                
                // Check if we have the palette in PALETTES
                const paletteSet = PALETTES[paletteName];
                if (paletteSet) {
                    if (useHighlighting && paletteSet.highlight && paletteSet.highlight[paletteKey]) {
                        if (window.logger) window.logger.info("Using highlight palette for " + paletteKey);
                        return paletteSet.highlight[paletteKey];
                    }
                    if (paletteSet[paletteKey]) {
                        if (window.logger) window.logger.info("Using text palette for " + paletteKey);
                        return paletteSet[paletteKey];
                    }
                }
                
                if (window.logger) window.logger.warn("Palette not found: " + paletteName + "[" + paletteKey + "], falling back");
                
                // Fallback to current palette
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
                const showArcs = config.options && config.options.showArcs;
                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") {
                        addSegment(token, null);
                        return;
                    }

                    const syllables = engine.segmentSyllables(token);
                    syllables.forEach((s, idx) => {
                        const color = syllablesPalette[idx % syllablesPalette.length];
                        // Add underline to simulate arc when showArcs is enabled
                        const extra = {};
                        if (showArcs) {
                            // Use different underline styles for visual distinction
                            // ONLYOFFICE supports: 0=none, 1=single, 2=double, 3=thick, 4=dotted, 5=dashed
                            extra.underline = 2; // Double underline for arcs
                        }
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
