(function (window, undefined) {

    const suggestionService = (function () {
        let pollingInterval = null;
        let lastCheckedText = "";
        let mode = 'selection'; // Default mode
        let hasWarnedRestrictedMode = false;

        let modeToggle;
        let modeStatus;

        function processSuggestions(text) {
            const container = document.getElementById('suggestions-container');
            if (!container) return;

            if (text === lastCheckedText && text.trim().length === 0) return;

            container.innerHTML = '';

            if (text && text.trim().length > 0) {
                const words = text.trim().split(/\s+/);
                let motPrecedent = null;

                words.forEach((motSaisi) => {
                    if (motSaisi.length > 2) {
                        const suggestions = window.OnlyDysLogic.classerSuggestions(motSaisi, motPrecedent);
                        if (window.logger) window.logger.info("Suggestions for '" + motSaisi + "': " + suggestions.length);

                        if (suggestions.length > 0) {
                            const header = document.createElement('h4');
                            header.textContent = `Suggestions for "${motSaisi}"`;
                            header.style.marginLeft = '12px';
                            container.appendChild(header);
                            window.OnlyDysUI.displaySuggestions(suggestions, motSaisi, true);
                        }
                        motPrecedent = motSaisi;
                    }
                });
            }
            lastCheckedText = text;
        }

        let isActive = false;

        function onSelectionChanged() {
            if (window.logger) window.logger.info("onSelectionChanged called. Mode: " + mode + ", isActive: " + isActive);
            if (!isActive) return;

            if (mode === 'onthego' || mode === 'selection') {
                // First try GetSelectedText (works when user has selected text)
                window.Asc.plugin.executeMethod("GetSelectedText", [], function (text) {
                    if (window.logger) {
                        window.logger.info((mode === 'onthego' ? "Onthego" : "Selection") + " Mode - GetSelectedText: '" + (text || '') + "'");
                    }
                    
                    if (text && text.trim().length > 0) {
                        // We have selected text
                        if (mode === 'selection') {
                            // In selection mode, process all selected words
                            const words = text.trim().split(/\s+/).slice(0, 9).join(' ');
                            if (window.logger) window.logger.info("Selection mode processing: '" + words + "'");
                            processSuggestions(words);
                        } else {
                            // In on-the-go mode, use first word
                            const words = text.trim().split(/\s+/);
                            if (words.length > 0) {
                                if (window.logger) window.logger.info("Onthego mode processing first word: '" + words[0] + "'");
                                processSuggestions(words[0]);
                            }
                        }
                    } else {
                        // No selection - cursor only
                        if (mode === 'onthego') {
                            if (window.logger) window.logger.info("No selection, trying ExpandToWord");
                            
                            // Use callCommand to access document and expand selection to word
                            window.Asc.plugin.callCommand(function () {
                                try {
                                    if (typeof Api === 'undefined') return "";
                                    
                                    var oDocument = Api.GetDocument();
                                    if (!oDocument) return "";
                                    
                                    // Get selection/range
                                    var oRange = null;
                                    if (typeof oDocument.GetRangeBySelect === 'function') {
                                        oRange = oDocument.GetRangeBySelect();
                                    } else if (typeof oDocument.GetSelection === 'function') {
                                        oRange = oDocument.GetSelection();
                                    } else if (typeof oDocument.GetRange === 'function') {
                                        oRange = oDocument.GetRange();
                                    }
                                    
                                    if (!oRange) return "";
                                    
                                    // Expand to word and get text
                                    if (typeof oRange.ExpandToWord === 'function') {
                                        oRange.ExpandToWord();
                                        var word = oRange.GetText();
                                        if (window.logger) window.logger.info("ExpandToWord result: '" + (word || '') + "'");
                                        return word || "";
                                    }
                                    
                                    return "";
                                } catch (err) {
                                    if (window.logger) window.logger.error("ExpandToWord error: " + err.toString());
                                    return "";
                                }
                            }, false, true, function (result) {
                                if (window.logger) window.logger.info("Word detection result: '" + (result || '') + "'");
                                
                                if (result && typeof result === 'string' && result.trim().length > 0) {
                                    // Got a word
                                    if (window.logger) window.logger.info("Processing word: '" + result + "'");
                                    processSuggestions(result);
                                } else {
                                    // Failed to get word, clear suggestions
                                    if (window.logger) window.logger.info("No word found at cursor");
                                    const container = document.getElementById('suggestions-container');
                                    if (container) {
                                        container.innerHTML = '';
                                    }
                                }
                            });
                        } else {
                            // Selection mode with no selection - just clear
                            if (window.logger) window.logger.info("Selection mode with no selection");
                            processSuggestions("");
                        }
                    }
                });
            }
        }

        function updateMode() {
            // Clear the last checked text when switching modes to force a refresh
            lastCheckedText = "";
            
            // Clear suggestions container
            const container = document.getElementById('suggestions-container');
            if (container) {
                container.innerHTML = '';
            }
            
            if (modeToggle.checked) {
                mode = 'onthego';
                modeStatus.textContent = 'Au fur et à mesure';
                // Create debounced version for on-the-go mode using global delay
                createDebouncedOnSelectionChanged();
                // Trigger immediate check (but subsequent calls will be debounced)
                if (debouncedOnSelectionChanged) {
                    debouncedOnSelectionChanged();
                } else {
                    onSelectionChanged();
                }
            } else {
                mode = 'selection';
                modeStatus.textContent = 'Pour la sélection';
                // For selection mode, call directly (no debouncing needed)
                onSelectionChanged();
            }
            
            if (window.logger) {
                window.logger.info("Mode switched to: " + mode);
            }
        }

        function onVisibilityChange() {
            if (document.visibilityState === 'hidden') {
                // potentially pause or clear suggestions
            } else {
                updateMode();
            }
        }

        // Current debounce delay in ms (can be configured)
        let debounceDelay = 150;

        function start() {
            if (window.logger) window.logger.info("Starting suggestionService.");
            isActive = true;
            modeToggle = document.getElementById('toggle-suggestion-mode');
            modeStatus = document.getElementById('suggestion-mode-status');
            modeToggle.addEventListener('change', updateMode);
            document.addEventListener('visibilitychange', onVisibilityChange);
            updateMode();
        }

        function stop() {
            if (window.logger) window.logger.info("Stopping suggestionService.");
            isActive = false;
            // Clear any pending debounced calls
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
            // Clear the debounced function reference
            debouncedOnSelectionChanged = null;
            
            if (modeToggle) {
                modeToggle.removeEventListener('change', updateMode);
            }
            document.removeEventListener('visibilitychange', onVisibilityChange);
        }

        // Method to update debounce delay
        function setDebounceDelay(delay) {
            debounceDelay = delay || 0;
            // Recreate debounced function with new delay
            debouncedOnSelectionChanged = null;
            if (window.logger) window.logger.info("Debounce delay updated to: " + delay + "ms");
        }

        // Method to get current debounce delay
        function getDebounceDelay() {
            return debounceDelay;
        }

        return {
            start: start,
            stop: stop,
            handleSelectionChange: onSelectionChanged,
            get hasWarnedRestrictedMode() { return hasWarnedRestrictedMode; },
            set hasWarnedRestrictedMode(v) { hasWarnedRestrictedMode = v; }
        };
    })();

    // Global debounce timeout reference for cleanup
    let debounceTimeout = null;
    let globalDebounceDelay = 150; // Default delay

    // Function to debounce calls to the suggestion logic
    // Prevents rapid-fire API calls during cursor movement in on-the-go mode
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                debounceTimeout = null;
                func.apply(this, args);
            }, delay);
            // Store reference for global cleanup
            debounceTimeout = timeout;
        };
    }

    // Global debounced onSelectionChanged function
    let debouncedOnSelectionChanged = null;

    // Function to create debounced onSelectionChanged with current delay
    function createDebouncedOnSelectionChanged() {
        // Ensure we have the latest debounce delay from config
        initDebounceFromConfig();
        
        if (suggestionService && suggestionService.handleSelectionChange) {
            debouncedOnSelectionChanged = debounce(
                suggestionService.handleSelectionChange, 
                globalDebounceDelay
            );
        }
        return debouncedOnSelectionChanged;
    }

    // Function to update global debounce delay
    function setGlobalDebounceDelay(delay) {
        globalDebounceDelay = delay || 150;
        // Recreate debounced function with new delay
        debouncedOnSelectionChanged = null;
        if (window.logger) window.logger.info("Global debounce delay updated to: " + globalDebounceDelay + "ms");
        
        // Also update ConfigManager if available
        if (window.ConfigManager && window.ConfigManager.config) {
            window.ConfigManager.config.suggestionDebounceMs = globalDebounceDelay;
            window.ConfigManager.save();
        }
    }

    // Function to initialize debounce delay from ConfigManager
    function initDebounceFromConfig() {
        if (window.ConfigManager && window.ConfigManager.config) {
            if (typeof window.ConfigManager.config.suggestionDebounceMs !== 'undefined') {
                globalDebounceDelay = window.ConfigManager.config.suggestionDebounceMs;
                if (window.logger) window.logger.info("Initialized debounce delay from config: " + globalDebounceDelay + "ms");
            } else {
                // Set default if not present
                window.ConfigManager.config.suggestionDebounceMs = globalDebounceDelay;
                window.ConfigManager.save();
            }
        }
    }

    // Initialize debounce delay when ConfigManager is loaded
    if (window.ConfigManager) {
        initDebounceFromConfig();
    } else {
        // ConfigManager may not be loaded yet, try again later
        const initInterval = setInterval(() => {
            if (window.ConfigManager) {
                initDebounceFromConfig();
                clearInterval(initInterval);
            }
        }, 100);
        
        // Clear interval after a timeout
        setTimeout(() => clearInterval(initInterval), 5000);
    }

    // Function to switch tabs
    function loadTab(tabName) {
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab && activeTab.dataset.tab === 'suggestions' && tabName !== 'suggestions') {
            suggestionService.stop();
        }

        // Toggle Active Class on Buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Toggle Visibility of Tab Panes
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => {
            if (pane.id === `tab-${tabName}`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Initialize specific tab logic if needed (idempotent init is best)
        if (tabName === 'suggestions') {
            suggestionService.start();
        } else if (tabName === 'font') {
            initFontTab();
        } else if (tabName === 'dyslexia') {
            initDyslexiaTab();
        } else if (tabName === 'linguistics') {
            initLinguisticsTab();
        } else if (tabName === 'about') {
            initAboutTab();
        }
    }

    function initAboutTab() {
        const btnDownload = document.getElementById('btn-download-logs');
        const logsModal = document.getElementById('logs-modal');
        const logsContainer = document.getElementById('logs-container');
        const btnConfirmDownload = document.getElementById('btn-confirm-download-logs');
        const btnCloseLogsModal = document.getElementById('btn-close-logs-modal');

        if (btnDownload) {
            // Remove old listener to prevent duplicates
            const newBtn = btnDownload.cloneNode(true);
            btnDownload.parentNode.replaceChild(newBtn, btnDownload);

            newBtn.addEventListener('click', function () {
                if (window.logger && window.logger.getLogs) {
                    const logs = window.logger.getLogs();
                    
                    // Display logs in modal
                    if (logsModal && logsContainer) {
                        logsContainer.textContent = logs;
                        logsModal.style.display = 'block';
                        logger.info("Logs modal displayed.");
                    } else {
                        // Fallback if modal not found
                        alert("Cannot display logs modal. Falling back to direct download.");
                        downloadLogsDirectly(logs);
                    }
                } else {
                    alert("Logger not available.");
                }
            });
        }

        // Handle download confirmation from modal
        if (btnConfirmDownload) {
            btnConfirmDownload.addEventListener('click', function () {
                if (window.logger && window.logger.getLogs) {
                    const logs = window.logger.getLogs();
                    downloadLogsDirectly(logs);
                    if (logsModal) logsModal.style.display = 'none';
                }
            });
        }

        // Handle close modal
        if (btnCloseLogsModal) {
            btnCloseLogsModal.addEventListener('click', function () {
                if (logsModal) logsModal.style.display = 'none';
            });
        }

        // Close modal when clicking X button
        if (logsModal) {
            const closeButton = logsModal.querySelector('.close-button');
            if (closeButton) {
                closeButton.addEventListener('click', function () {
                    logsModal.style.display = 'none';
                });
            }
            
            // Close modal when clicking outside
            logsModal.addEventListener('click', function (e) {
                if (e.target === logsModal) {
                    logsModal.style.display = 'none';
                }
            });
        }

        // Helper function for direct download
        function downloadLogsDirectly(logs) {
            const blob = new Blob([logs], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'onlydys_debug.log';
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            logger.info("Logs downloaded by user.");
        }
    }

    const LINGUISTIC_ENGINE_SOURCE = `
    var VOWELS = ["a", "à", "â", "ä", "e", "é", "è", "ê", "ë", "i", "î", "ï", "o", "ô", "ö", "u", "ù", "û", "ü", "y", "ÿ", "œ", "æ"];
    var VOWEL_REGEX = new RegExp(VOWELS.join("|"), "i");
    var MULTI_PHONEMES = ["eaux", "eau", "aient", "oient", "ain", "aim", "ein", "eim", "ien", "ian", "oin", "on", "om", "an", "am", "en", "em", "in", "im", "yn", "ym", "ou", "oi", "ai", "ei", "au", "eu", "œu", "ch", "ph", "th", "gn", "qu", "gu", "ill", "ail", "eil", "ouil", "euil"];
    var SILENT_ENDINGS = ["ent", "es", "e", "s", "t", "d", "p", "x", "g", "z"];

    var LinguisticEngine = {
        normalizeFrench: function (text) { if (!text) return ""; return text.toLowerCase().normalize("NFC"); },
        isVowel: function (char) { return VOWELS.indexOf(char.toLowerCase()) !== -1; },
        isConsonant: function (char) { return !this.isVowel(char) && /[a-zàâäçéèêëîïôöùûüÿœæ]/i.test(char); },
        isPunctuation: function (char) { return /\\p{P}/u.test(char); },
        tokenizeWords: function (text) { return text.match(/\\p{L}+[''-]?\\p{L}*/gu) || []; },
        getPhonemeType: function (phoneme) {
            if (!phoneme) return 'other';
            var lower = phoneme.toLowerCase();
            if (["eau", "eaux", "aient", "oient", "ain", "aim", "ein", "eim", "ien", "ian", "oin", "on", "om", "an", "am", "en", "em", "in", "im", "yn", "ym", "ou", "oi", "ai", "ei", "au", "eu", "œu"].indexOf(lower) !== -1) return 'vowel';
            if (["ch", "ph", "th", "gn", "qu", "gu"].indexOf(lower) !== -1) return 'consonant';
            if (["ill", "ail", "eil", "ouil", "euil"].indexOf(lower) !== -1) return 'semi-consonant';
            if (this.isVowel(phoneme)) return 'vowel';
            if (this.isConsonant(phoneme)) return 'consonant';
            return 'other';
        },
        segmentPhonemes: function (word) {
            var normalizedWord = this.normalizeFrench(word);
            var phonemes = [];
            var i = 0;
            while (i < normalizedWord.length) {
                var matched = false;
                for (var pIdx = 0; pIdx < MULTI_PHONEMES.length; pIdx++) {
                    var p = MULTI_PHONEMES[pIdx];
                    if (normalizedWord.indexOf(p, i) === i) {
                        var isNasalCandidate = (p.charAt(p.length - 1) === "n" || p.charAt(p.length - 1) === "m") && p.length <= 4 && p !== "gn";
                        if (isNasalCandidate) {
                            var nextChar = normalizedWord.charAt(i + p.length);
                            if (nextChar) {
                                if (this.isVowel(nextChar)) continue;
                                if (nextChar === 'n' || nextChar === 'm') continue;
                            }
                        }
                        phonemes.push(p); i += p.length; matched = true; break;
                    }
                }
                if (!matched) { phonemes.push(normalizedWord.charAt(i)); i++; }
            }
            return phonemes;
        },
        segmentSyllables: function (word) {
            var phonemes = this.segmentPhonemes(word);
            var syllables = [];
            var current = [];
            for (var i = 0; i < phonemes.length; i++) {
                current.push(phonemes[i]);
                var type = this.getPhonemeType(phonemes[i]);
                if (type === 'vowel') {
                    var next = phonemes[i + 1];
                    var nextType = next ? this.getPhonemeType(next) : null;
                    var nextNext = phonemes[i + 2];
                    var nextNextType = nextNext ? this.getPhonemeType(nextNext) : null;
                    if (next && nextType !== 'vowel') {
                        if (nextNext && nextNextType !== 'vowel') { current.push(next); i++; syllables.push(current); current = []; }
                        else { syllables.push(current); current = []; }
                    } else { syllables.push(current); current = []; }
                }
            }
            if (current.length) {
                if (syllables.length > 0) {
                    var currentHasVowel = false;
                    for (var j = 0; j < current.length; j++) {
                        if (this.getPhonemeType(current[j]) === 'vowel') { currentHasVowel = true; break; }
                    }
                    if (!currentHasVowel) syllables[syllables.length - 1] = syllables[syllables.length - 1].concat(current);
                    else syllables.push(current);
                } else syllables.push(current);
            }
            return syllables.map(function(s) { return s.join(""); });
        },
        detectSilentLetters: function (word) {
            if (!word) return [];
            var silentIndexes = [];
            var lower = word.toLowerCase();
            for (var eIdx = 0; eIdx < SILENT_ENDINGS.length; eIdx++) {
                var end = SILENT_ENDINGS[eIdx];
                if (lower.length > end.length && lower.indexOf(end, lower.length - end.length) !== -1) {
                    var startIndex = lower.length - end.length;
                    for (var i = startIndex; i < lower.length; i++) {
                        if (silentIndexes.indexOf(i) === -1) silentIndexes.push(i);
                    }
                    break;
                }
            }
            return silentIndexes.sort(function (a, b) { return a - b; });
        },
        analyzeWord: function (word) {
            return { original: word, phonemes: this.segmentPhonemes(word), syllables: this.segmentSyllables(word), silentLetters: this.detectSilentLetters(word) };
        }
    };`;

    const COLORIZATION_ENGINE_SOURCE = `
(function (window) {
    'use strict';

    const GRAMMAR_COLOR_MAP = {
        'NOM': '#D62728',
        'VER': '#2B83BA',
        'ADJ': '#2CA02C',
        'ADV': '#98DF8A',
        'PRO': '#FF7F0E',
        'DET': '#BCBD22',
        'PRE': '#4B0082',
        'CON': '#8B4513',
        'INT': '#E377C2',
    };

    function displayColorLegend() {
        // Delegate to ColorizationEngine if available
        if (window.ColorizationEngine && window.ColorizationEngine.displayColorLegend) {
            window.ColorizationEngine.displayColorLegend();
            return;
        }
        
        // Fallback to hardcoded version
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
        palettes: {
            phonemes: [
                "#D62728", "#2B83BA", "#2CA02C", "#FF7F0E", "#98DF8A",
                "#BCBD22", "#E377C2", "#4B0082"
            ],
            syllables: ["#D62728", "#2B83BA"],
            words: ["#4B0082", "#2B83BA"],
            lines: ["#4B0082", "#2B83BA"],
            letters: ["#D62728", "#2B83BA", "#2CA02C", "#FF7F0E"],
            vowels: "#E377C2",
            consonants: "#2B83BA",
            silent: "#606060",
            punctuation: "#E377C2",
            grammar: {
                'NOM': '#D62728', 'VER': '#2B83BA', 'ADJ': '#2CA02C', 'ADV': '#98DF8A',
                'PRO': '#FF7F0E', 'DET': '#BCBD22', 'PRE': '#4B0082', 'CON': '#8B4513', 'INT': '#E377C2'
            }
        },

        highlightPalettes: {
            phonemes: [
                "#FFEEEE", "#E6F5FF", "#E6FFEE", "#FFECE6", "#E6FFE6",
                "#FFFFE6", "#FFE6F5", "#E6E6FF"
            ],
            syllables: ["#FFEEEE", "#E6F5FF"],
            words: ["#E6E6FF", "#E6F5FF"],
            lines: ["#E6E6FF", "#E6F5FF"],
            letters: ["#FFEEEE", "#E6F5FF", "#E6FFEE", "#FFECE6"],
            vowels: "#FFE6F5",
            consonants: "#E6F5FF",
            silent: "#F0F0F0",
            punctuation: "#FFE6F5",
            grammar: {
                'NOM': '#FFEEEE', 'VER': '#E6F5FF', 'ADJ': '#E6FFEE', 'ADV': '#E6FFE6',
                'PRO': '#FFECE6', 'DET': '#FFFFE6', 'PRE': '#E6E6FF', 'CON': '#FFE6D3', 'INT': '#FFE6F5'
            }
        },

        lineColors: ["#FFFACD", "#E0F0FF"],

        processModel: function (model, config) {
            const processedModel = JSON.parse(JSON.stringify(model));
            let wordMap = null;
            if (config.mode === 'grammar' && window.OnlyDysLogic && window.OnlyDysLogic.dictionary) {
                wordMap = new Map(window.OnlyDysLogic.dictionary.map(entry => [entry.w.toLowerCase(), entry.g]));
            }

            processedModel.paragraphs.forEach(para => {
                const newRuns = [];
                para.textRuns.forEach(run => {
                    if (!run.text) return;
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

            const addSegment = (text, color, extraFormatting = {}) => {
                const useHighlighting = config.options && config.options.useHighlighting;
                const formatting = { ...run.formatting, ...extraFormatting };

                if (color !== null && color !== undefined) {
                    if (useHighlighting) {
                        formatting.backgroundColor = color;
                        formatting.color = '#000000';
                    } else {
                        formatting.color = color;
                    }
                } else {
                    formatting.color = null;
                }

                newRuns.push({ text: text, formatting: formatting });
            };

            const getPalette = (paletteKey) => {
                const useHighlighting = config.options && config.options.useHighlighting;
                if (useHighlighting && ColorizationEngine.highlightPalettes[paletteKey]) {
                    return ColorizationEngine.highlightPalettes[paletteKey];
                }
                return ColorizationEngine.palettes[paletteKey];
            };

            if (config.mode === 'alternlines') {
                const lineIndex = config.lineIndex || 0;
                const bgColor = this.lineColors[lineIndex % this.lineColors.length];
                addSegment(originalText, null, { backgroundColor: bgColor });

            } else if (config.mode === 'grammar') {
                const words = originalText.split(/(\\P{L}+)/u).filter(t => t !== "");
                const grammarPalette = getPalette('grammar');

                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") {
                        addSegment(token, null);
                        return;
                    }

                    const lowerWord = token.toLowerCase();
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
                const words = originalText.split(/(\\P{L}+)/u).filter(t => t !== "");
                const phonemesPalette = getPalette('phonemes');
                let phonemeCount = 0;

                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") {
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
                const words = originalText.split(/(\\P{L}+)/u).filter(t => t !== "");
                const syllablesPalette = getPalette('syllables');
                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") {
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
                    if (engine.isPunctuation(char) || /\\s/.test(char)) {
                        addSegment(char, null);
                    } else {
                        const color = lettersPalette[letterCount % lettersPalette.length];
                        addSegment(char, color);
                        letterCount++;
                    }
                }

            } else if (config.mode === 'alternmots') {
                const wordsPalette = getPalette('words');
                const words = originalText.split(/(\\s+)/u).filter(t => t !== "");
                let wordIdx = 0;
                words.forEach(token => {
                    if (/\\s+/.test(token) || token === "") {
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
                const words = originalText.split(/(\\P{L}+)/u).filter(t => t !== "");
                const silentColor = getPalette('silent');

                words.forEach(token => {
                    if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") {
                        addSegment(token, null);
                        return;
                    }

                    const silentIndices = engine.detectSilentLetters(token);
                    if (silentIndices.length === 0) {
                        addSegment(token, null);
                    } else {
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
                addSegment(originalText, null);
            }

            return newRuns;
        },

        hashCode: function (str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        }
    };

    // Note: ColorizationEngine is now maintained in scripts/colorizationEngine.js
    // which is loaded before this script. Do not override it here.
    // If ColorizationEngine is not yet defined, define it now for backward compatibility
    if (!window.ColorizationEngine) {
        window.ColorizationEngine = ColorizationEngine;
    }

})(window);
`;

    let lastActionWasColorization = false;

    function initLinguisticsTab() {
        initDyslexiaTab();
        const styleToggle = document.getElementById('toggle-global-style');
        const styleStatus = document.getElementById('global-style-status');
        const fontSelectionContainer = document.getElementById('font-selection-container');

        if (styleToggle) {
            styleToggle.addEventListener('change', function (e) {
                const isEnabled = e.target.checked;
                if (styleStatus) {
                    styleStatus.textContent = isEnabled ? "Activé" : "Désactivé";
                    styleStatus.style.color = isEnabled ? "green" : "inherit";
                }
                
                // Show/hide font selection based on toggle state
                if (fontSelectionContainer) {
                    fontSelectionContainer.style.display = isEnabled ? "block" : "none";
                }
                
                if (window.OnlyDysStyles) {
                    if (isEnabled) {
                        // Get selected font from radio buttons
                        const fontRadios = document.getElementsByName('dys-font');
                        let selectedFont = "OpenDyslexic";
                        for (let i = 0; i < fontRadios.length; i++) {
                            if (fontRadios[i].checked) {
                                selectedFont = fontRadios[i].value;
                                break;
                            }
                        }
                        
                        // Get line height and letter spacing values
                        const lineHeightSelect = document.getElementById('line-height-select');
                        const letterSpacingSelect = document.getElementById('letter-spacing-select');
                        
                        let lineHeight = 480; // default
                        if (lineHeightSelect) {
                            lineHeight = parseInt(lineHeightSelect.value) || 480;
                        }
                        
                        let letterSpacing = 36; // default
                        if (letterSpacingSelect) {
                            letterSpacing = parseInt(letterSpacingSelect.value) || 36;
                        }
                        
                        window.OnlyDysStyles.setCurrentFont(selectedFont);
                        window.OnlyDysStyles.setLineHeight(lineHeight);
                        window.OnlyDysStyles.setLetterSpacing(letterSpacing);
                        window.OnlyDysStyles.applyStyleToDocument(selectedFont, lineHeight, letterSpacing);
                    } else {
                        window.OnlyDysStyles.revertStyleInDocument();
                    }
                }
            });
        }

        // Handle font selection changes
        const fontRadios = document.getElementsByName('dys-font');
        if (fontRadios && fontRadios.length > 0) {
            fontRadios.forEach(function(radio) {
                radio.addEventListener('change', function() {
                    if (this.checked && window.OnlyDysStyles && styleToggle && styleToggle.checked) {
                        const lineHeightSelect = document.getElementById('line-height-select');
                        const letterSpacingSelect = document.getElementById('letter-spacing-select');
                        
                        let lineHeight = 480;
                        if (lineHeightSelect) {
                            lineHeight = parseInt(lineHeightSelect.value) || 480;
                        }
                        
                        let letterSpacing = 36;
                        if (letterSpacingSelect) {
                            letterSpacing = parseInt(letterSpacingSelect.value) || 36;
                        }
                        
                        window.OnlyDysStyles.setCurrentFont(this.value);
                        window.OnlyDysStyles.applyStyleToDocument(this.value, lineHeight, letterSpacing);
                    }
                });
            });
        }

        // Handle line height selection changes
        const lineHeightSelect = document.getElementById('line-height-select');
        if (lineHeightSelect) {
            lineHeightSelect.addEventListener('change', function() {
                if (window.OnlyDysStyles && styleToggle && styleToggle.checked) {
                    const letterSpacingSelect = document.getElementById('letter-spacing-select');
                    const fontRadios = document.getElementsByName('dys-font');
                    
                    let selectedFont = "OpenDyslexic";
                    for (let i = 0; i < fontRadios.length; i++) {
                        if (fontRadios[i].checked) {
                            selectedFont = fontRadios[i].value;
                            break;
                        }
                    }
                    
                    let lineHeight = parseInt(this.value) || 480;
                    let letterSpacing = 36;
                    if (letterSpacingSelect) {
                        letterSpacing = parseInt(letterSpacingSelect.value) || 36;
                    }
                    
                    window.OnlyDysStyles.setLineHeight(lineHeight);
                    window.OnlyDysStyles.applyStyleToDocument(selectedFont, lineHeight, letterSpacing);
                }
            });
        }

        // Handle letter spacing selection changes
        const letterSpacingSelect = document.getElementById('letter-spacing-select');
        if (letterSpacingSelect) {
            letterSpacingSelect.addEventListener('change', function() {
                if (window.OnlyDysStyles && styleToggle && styleToggle.checked) {
                    const lineHeightSelect = document.getElementById('line-height-select');
                    const fontRadios = document.getElementsByName('dys-font');
                    
                    let selectedFont = "OpenDyslexic";
                    for (let i = 0; i < fontRadios.length; i++) {
                        if (fontRadios[i].checked) {
                            selectedFont = fontRadios[i].value;
                            break;
                        }
                    }
                    
                    let letterSpacing = parseInt(this.value) || 36;
                    let lineHeight = 480;
                    if (lineHeightSelect) {
                        lineHeight = parseInt(lineHeightSelect.value) || 480;
                    }
                    
                    window.OnlyDysStyles.setLetterSpacing(letterSpacing);
                    window.OnlyDysStyles.applyStyleToDocument(selectedFont, lineHeight, letterSpacing);
                }
            });
        }

        const categoryRadios = document.getElementsByName('ling-category');
        const modeRadiosContainer = document.getElementById('ling-mode-radios');
        const modeContainer = document.getElementById('ling-mode-container');

        const modesByCategory = {
            'standard': [
                { val: 'grammar', label: 'Grammaire' }
            ],
            'linguistic': [
                { val: 'phonemes', label: 'Phonèmes (Nature)' },
                { val: 'syllables', label: 'Syllabes' },
                { val: 'silent', label: 'Lettres silencieuses' }
            ],
            'alternance': [
                { val: 'alternphonemes', label: 'Phonèmes (Alternés)' },
                { val: 'alternlettres', label: 'Lettres (Alternées)' },
                { val: 'alternmots', label: 'Mots (Alternés)' },
                { val: 'alternlines', label: 'Lignes (Alternées)' }
            ],
            'highlight': [
                { val: 'vowels', label: 'Voyelles' },
                { val: 'consonants', label: 'Consonnes' },
                { val: 'letters', label: 'Lettres spécifiques' }
            ]
        };

        categoryRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                const category = this.value;
                populateModes(category);
                if (category === 'none') {
                    window.applyLinguisticsToDocument(); // Will trigger Undo
                }
            });
        });

        function populateModes(category) {
            if (!modeRadiosContainer) return;
            modeRadiosContainer.innerHTML = '';

            if (category === 'none' || !modesByCategory[category]) {
                if (modeContainer) modeContainer.style.display = 'none';
                updateInterfaceVisibility();
                updateLingPreview();
                return;
            }

            if (modeContainer) modeContainer.style.display = 'block';
            modesByCategory[category].forEach((m, idx) => {
                const label = document.createElement('label');
                label.className = 'radio-label';
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'ling-mode';
                input.value = m.val;
                if (idx === 0) input.checked = true;

                input.addEventListener('change', function () {
                    window.applyLinguisticsToDocument();
                    updateInterfaceVisibility();
                    updateLingPreview();
                });

                label.appendChild(input);
                label.appendChild(document.createTextNode(' ' + m.label));
                modeRadiosContainer.appendChild(label);
            });

            window.applyLinguisticsToDocument();
            updateInterfaceVisibility();
            updateLingPreview();
        }

        document.getElementById('opt-arcs')?.addEventListener('change', function () {
            window.applyLinguisticsToDocument();
            updateLingPreview();
        });
        document.getElementById('opt-silent')?.addEventListener('change', function () {
            window.applyLinguisticsToDocument();
            updateLingPreview();
        });
        document.getElementById('ling-target-letters')?.addEventListener('input', function () {
            window.applyLinguisticsToDocument();
            updateLingPreview();
        });
        
        // Bind debounce delay input
        const debounceInput = document.getElementById('debounce-delay');
        if (debounceInput) {
            // Initialize from global setting
            debounceInput.value = globalDebounceDelay;
            
            // Update global setting when changed
            debounceInput.addEventListener('change', function () {
                const delay = parseInt(this.value) || 0;
                setGlobalDebounceDelay(delay);
            });
            
            // Update config if changed elsewhere
            debounceInput.addEventListener('input', function () {
                const delay = parseInt(this.value) || 0;
                setGlobalDebounceDelay(delay);
            });
        }

        function updateInterfaceVisibility() {
            const mode = document.querySelector('input[name="ling-mode"]:checked')?.value;
            document.querySelectorAll('.conditional-opt').forEach(el => el.style.display = 'none');

            if (mode === 'syllables') document.getElementById('opt-container-syllables').style.display = 'block';
            if (mode === 'silent') document.getElementById('opt-container-silent').style.display = 'block';
            if (mode === 'grammar') document.getElementById('opt-container-grammar').style.display = 'block';
            if (mode === 'letters') document.getElementById('opt-container-letters').style.display = 'block';
        }

        // Final init
        const initialCategory = Array.from(categoryRadios).find(r => r.checked)?.value || 'none';
        if (initialCategory !== 'none') {
            populateModes(initialCategory);
        } else {
            updateInterfaceVisibility();
            updateLingPreview();
        }
    }

    // New Function: Update the visual preview in the tab
    function updateLingPreview() {
        const previewDiv = document.getElementById('ling-preview');
        if (!previewDiv) return;

        const mode = document.querySelector('input[name="ling-mode"]:checked')?.value || 'none';
        const options = {
            showArcs: document.getElementById('opt-arcs')?.checked || false,
            highlightSilent: document.getElementById('opt-silent')?.checked || false,
            useHighlighting: document.getElementById('opt-highlighting')?.checked || false
        };
        const config = { mode: mode, options: options };

        // Mock a run model
        const textToPreview = "L'oiseau chante sur la branche.";
        const mockModel = {
            paragraphs: [{
                textRuns: [{ text: textToPreview, formatting: { color: "#000000" } }]
            }]
        };

        if (!window.LinguisticEngine || !window.ColorizationEngine) {
            // Basic eval for UI context
            try {
                eval(LINGUISTIC_ENGINE_SOURCE);
                eval(COLORIZATION_ENGINE_SOURCE);
            } catch (e) {
                console.error("Failed to init engines for preview", e);
                return;
            }
        }

        if (window.ColorizationEngine) {
            const result = window.ColorizationEngine.processModel(mockModel, config);

            // Render HTML
            previewDiv.innerHTML = "";
            const runs = result.paragraphs[0].textRuns;
            runs.forEach(run => {
                const span = document.createElement('span');
                span.textContent = run.text;
                if (run.formatting && run.formatting.color) {
                    span.style.color = run.formatting.color;
                }
                previewDiv.appendChild(span);
            });

            // Arc rendering for preview is tricky (CSS/Canvas), skipping arcs for simple preview
        }
    }

    let isApplying = false;

    // Expose function globally so configManager can call it
    window.applyLinguisticsToDocument = function () {
        if (isApplying) return;

        const categoryRadios = document.getElementsByName('ling-category');
        const category = Array.from(categoryRadios).find(r => r.checked)?.value || 'none';
        const mode = (category === 'none') ? 'none' : (document.querySelector('input[name="ling-mode"]:checked')?.value || 'none');

        if (mode === 'none') {
            const finishRevert = () => {
                isApplying = false;
                const statusDiv = document.getElementById('ling-status');
                if (statusDiv) statusDiv.textContent = "Colorisation retirée.";
                updateLingPreview();
            };
            if (lastActionWasColorization) {
                if (window.logger) window.logger.info("Removing colorization via Undo...");
                window.Asc.plugin.executeMethod("Undo", [], function () {
                    lastActionWasColorization = false;
                    finishRevert();
                });
            } else {
                finishRevert();
            }
            return;
        }

        isApplying = true;
        const statusDiv = document.getElementById('ling-status');
        if (statusDiv) statusDiv.textContent = "Application en cours...";

        const applyAction = () => {
            const options = {
                showArcs: document.getElementById('opt-arcs')?.checked || false,
                highlightSilent: document.getElementById('opt-silent')?.checked || false,
                targetLetters: document.getElementById('ling-target-letters')?.value || 'bdpq',
                useHighlighting: document.getElementById('opt-highlighting')?.checked || false,
                colorPalette: document.getElementById('palette-selector')?.value || 'default'
            };

            if (window.logger) {
                window.logger.info("Applying colorization with mode: " + mode + ", useHighlighting: " + options.useHighlighting + ", palette: " + options.colorPalette);
            }

            const config = { mode: mode, options: options };
            Asc.scope.colorizationScript = COLORIZATION_ENGINE_SOURCE;
            Asc.scope.config = config;

            window.Asc.plugin.callCommand(function () {
                try {
                    if (typeof Api === 'undefined') {
                        return "ERROR: Api is not defined";
                    }

                    // Inline LinguisticEngine (no eval needed)
                    var VOWELS = ["a", "à", "â", "e", "é", "è", "ê", "ë", "i", "î", "ï", "o", "ô", "u", "ù", "û", "ü", "y", "œ", "æ"];
                    var VOWEL_REGEX = new RegExp(VOWELS.join("|"), "i");
                    var MULTI_PHONEMES = ["eau", "eaux", "ain", "aim", "ein", "eim", "ien", "oin", "on", "om", "an", "am", "en", "em", "in", "im", "yn", "ym", "ou", "oi", "ai", "ei", "au", "ch", "ph", "th", "gn", "qu", "gu", "ill"];
                    var SILENT_ENDINGS = ["ent", "es", "e", "s", "t", "d", "p", "x"];

                    var LinguisticEngine = {
                        normalizeFrench: function (text) { if (!text) return ""; return text.toLowerCase().normalize("NFC"); },
                        isVowel: function (char) { return VOWELS.indexOf(char.toLowerCase()) !== -1; },
                        isConsonant: function (char) { return !this.isVowel(char) && /[a-zàâäçéèêëîïôöùûüÿœæ]/i.test(char); },
                        getPhonemeType: function (phoneme) {
                            if (!phoneme) return 'other';
                            var lower = phoneme.toLowerCase();
                            if (["eau", "eaux", "aient", "oient", "ain", "aim", "ein", "eim", "ien", "ian", "oin", "on", "om", "an", "am", "en", "em", "in", "im", "yn", "ym", "ou", "oi", "ai", "ei", "au", "eu", "œu"].indexOf(lower) !== -1) return 'vowel';
                            if (["ch", "ph", "th", "gn", "qu", "gu"].indexOf(lower) !== -1) return 'consonant';
                            if (["ill", "ail", "eil", "ouil", "euil"].indexOf(lower) !== -1) return 'semi-consonant';
                            if (this.isVowel(phoneme)) return 'vowel';
                            if (this.isConsonant(phoneme)) return 'consonant';
                            return 'other';
                        },
                        isPunctuation: function (char) { return /\p{P}/u.test(char); },
                        segmentPhonemes: function (word) {
                            var normalizedWord = this.normalizeFrench(word);
                            var phonemes = [];
                            var i = 0;
                            while (i < normalizedWord.length) {
                                var matched = false;
                                for (var pIdx = 0; pIdx < MULTI_PHONEMES.length; pIdx++) {
                                    var p = MULTI_PHONEMES[pIdx];
                                    if (normalizedWord.indexOf(p, i) === i) {
                                        var isNasalCandidate = (p.charAt(p.length - 1) === "n" || p.charAt(p.length - 1) === "m") && p.length <= 4 && p !== "gn";
                                        if (isNasalCandidate) {
                                            var nextChar = normalizedWord.charAt(i + p.length);
                                            if (nextChar) {
                                                if (this.isVowel(nextChar)) continue;
                                                if (nextChar === 'n' || nextChar === 'm') continue;
                                            }
                                        }
                                        phonemes.push(p); i += p.length; matched = true; break;
                                    }
                                }
                                if (!matched) { phonemes.push(normalizedWord.charAt(i)); i++; }
                            }
                            return phonemes;
                        },
                        segmentSyllables: function (word) {
                            var phonemes = this.segmentPhonemes(word);
                            var syllables = [];
                            var current = [];
                            for (var i = 0; i < phonemes.length; i++) {
                                current.push(phonemes[i]);
                                var type = this.getPhonemeType(phonemes[i]);
                                if (type === 'vowel') {
                                    var next = phonemes[i + 1];
                                    var nextType = next ? this.getPhonemeType(next) : null;
                                    var nextNext = phonemes[i + 2];
                                    var nextNextType = nextNext ? this.getPhonemeType(nextNext) : null;
                                    if (next && nextType !== 'vowel') {
                                        if (nextNext && nextNextType !== 'vowel') { current.push(next); i++; syllables.push(current); current = []; }
                                        else { syllables.push(current); current = []; }
                                    } else { syllables.push(current); current = []; }
                                }
                            }
                            if (current.length) {
                                if (syllables.length > 0) {
                                    var currentHasVowel = false;
                                    for (var j = 0; j < current.length; j++) {
                                        if (this.getPhonemeType(current[j]) === 'vowel') { currentHasVowel = true; break; }
                                    }
                                    if (!currentHasVowel) syllables[syllables.length - 1] = syllables[syllables.length - 1].concat(current);
                                    else syllables.push(current);
                                } else syllables.push(current);
                            }
                            return syllables.map(function (s) { return s.join(""); });
                        },
                        detectSilentLetters: function (word) {
                            if (!word) return [];
                            var silentIndexes = [];
                            var lower = word.toLowerCase();
                            for (var eIdx = 0; eIdx < SILENT_ENDINGS.length; eIdx++) {
                                var end = SILENT_ENDINGS[eIdx];
                                if (lower.length > end.length && lower.indexOf(end, lower.length - end.length) !== -1) {
                                    var startIndex = lower.length - end.length;
                                    for (var i = startIndex; i < lower.length; i++) {
                                        if (silentIndexes.indexOf(i) === -1) silentIndexes.push(i);
                                    }
                                    break;
                                }
                            }
                            return silentIndexes.sort(function (a, b) { return a - b; });
                        },
                        lemmatize: function (word, wordMap) {
                            if (!word) return word;
                            var lower = word.toLowerCase();
                            if (wordMap && wordMap.has(lower)) return lower;
                            var verbEndings = ['ons', 'ez', 'ent', 'es', 'e', 'aient', 'ions', 'iez', 'ais', 'ait', 'eront', 'erez', 'erons', 'eras', 'era', 'erai', 'ront', 'rez', 'rons', 'ras', 'ra', 'rai', 'eraient', 'erions', 'eriez', 'erais', 'erait', 'raient', 'rions', 'riez', 'rais', 'rait', 'és', 'ées', 'ée', 'é', 'is', 'it', 'ies', 'ie', 'us', 'ue', 'ues', 'u', 'ir', 'er', 're'];
                            var agreementEndings = ['aux', 'eaux', 'eux', 'es', 's', 'x'];
                            for (var i = 0; i < verbEndings.length; i++) {
                                var ending = verbEndings[i];
                                if (lower.endsWith(ending) && lower.length > ending.length + 2) {
                                    var stem = lower.slice(0, -ending.length);
                                    if (['e', 'es', 'ent', 'ons', 'ez', 'ais', 'ait', 'ions', 'iez', 'aient'].indexOf(ending) !== -1) {
                                        var candidate = stem + 'er';
                                        if (!wordMap || wordMap.has(candidate)) return candidate;
                                    }
                                    if (['is', 'it', 'issons', 'issez', 'issent', 'issais', 'issait'].indexOf(ending) !== -1) {
                                        var candidate = stem + 'ir';
                                        if (!wordMap || wordMap.has(candidate)) return candidate;
                                    }
                                    if (['s', 't', 'ons', 'ez', 'ent'].indexOf(ending) !== -1 && !stem.endsWith('e')) {
                                        var candidate = stem + 're';
                                        if (!wordMap || wordMap.has(candidate)) return candidate;
                                    }
                                    if (!wordMap || wordMap.has(stem)) return stem;
                                }
                            }
                            for (var i = 0; i < agreementEndings.length; i++) {
                                var ending = agreementEndings[i];
                                if (lower.endsWith(ending) && lower.length > ending.length + 2) {
                                    var stem = lower.slice(0, -ending.length);
                                    if (!wordMap || wordMap.has(stem)) return stem;
                                }
                            }
                            return lower;
                        },
                        analyzeWord: function (word) {
                            return { original: word, phonemes: this.segmentPhonemes(word), syllables: this.segmentSyllables(word), silentLetters: this.detectSilentLetters(word) };
                        }
                    };

                    // Inline ColorizationEngine (no eval needed)
                    var ColorizationEngine = {
                        palettes: {
                            phonemes: ["#D62728", "#2B83BA", "#2CA02C", "#FF7F0E", "#98DF8A", "#BCBD22", "#E377C2", "#4B0082"],
                            syllables: ["#D62728", "#2B83BA"],
                            words: ["#4B0082", "#2B83BA"],
                            lines: ["#4B0082", "#2B83BA"],
                            vowels: "#E377C2", consonants: "#2B83BA", silent: "#606060", punctuation: "#E377C2",
                            letters: ["#D62728", "#2B83BA", "#2CA02C", "#FF7F0E"],
                            grammar: {
                                'NOM': '#D62728', 'VER': '#2B83BA', 'ADJ': '#2CA02C', 'ADV': '#98DF8A',
                                'PRO': '#FF7F0E', 'DET': '#BCBD22', 'PRE': '#4B0082', 'CON': '#8B4513', 'INT': '#E377C2'
                            }
                        },
                        processModel: function (model, config) {
                            var processedModel = JSON.parse(JSON.stringify(model));
                            var wordMap = null;
                            processedModel.paragraphs.forEach(function (para) {
                                var newRuns = [];
                                para.textRuns.forEach(function (run) {
                                    if (!run.text) return;
                                    var transformedRuns = ColorizationEngine.processRun(run, config, wordMap);
                                    newRuns.push.apply(newRuns, transformedRuns);
                                });
                                para.textRuns = newRuns;
                            });
                            return processedModel;
                        },
                        processRun: function (run, config, wordMap) {
                            var originalText = run.text;
                            var engine = LinguisticEngine;
                            var newRuns = [];
                            var addSegment = function (text, color, extraFormatting) {
                                extraFormatting = extraFormatting || {};
                                var formatting = {};
                                for (var key in run.formatting) { formatting[key] = run.formatting[key]; }
                                formatting.color = (color === undefined) ? run.formatting.color : color;
                                for (var key in extraFormatting) { formatting[key] = extraFormatting[key]; }
                                newRuns.push({ text: text, formatting: formatting });
                            };
                            if (config.mode === 'grammar') {
                                var words = originalText.split(/(\P{L}+)/u);
                                words.forEach(function (token) {
                                    if (!token) return;
                                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                                    var lowerWord = token.toLowerCase();
                                    var grammar = wordMap ? wordMap.get(lowerWord) : null;
                                    if (!grammar && wordMap && engine.lemmatize) {
                                        var lemma = engine.lemmatize(lowerWord, wordMap);
                                        grammar = wordMap.get(lemma);
                                    }
                                    var color = null;
                                    if (grammar && ColorizationEngine.palettes.grammar[grammar]) color = ColorizationEngine.palettes.grammar[grammar];
                                    addSegment(token, color);
                                });
                            } else if (config.mode === 'phonemes' || config.mode === 'alternphonemes') {
                                var words = originalText.split(/(\P{L}+)/u);
                                var phonemeCount = 0;
                                words.forEach(function (token) {
                                    if (!token) return;
                                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                                    try {
                                        var analysis = engine.analyzeWord(token);
                                        if (!analysis || !analysis.phonemes) { addSegment(token, null); return; }
                                        analysis.phonemes.forEach(function (p, idx) {
                                            var color;
                                            if (config.mode === 'alternphonemes') {
                                                color = ColorizationEngine.palettes.phonemes[phonemeCount % ColorizationEngine.palettes.phonemes.length];
                                                phonemeCount++;
                                            } else {
                                                var colorIndex = Math.abs(ColorizationEngine.hashCode(p.toLowerCase())) % ColorizationEngine.palettes.phonemes.length;
                                                color = ColorizationEngine.palettes.phonemes[colorIndex];
                                            }
                                            addSegment(p, color);
                                        });
                                    } catch (e) { addSegment(token, null); }
                                });
                            } else if (config.mode === 'syllables') {
                                var words = originalText.split(/(\P{L}+)/u);
                                words.forEach(function (token) {
                                    if (!token) return;
                                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                                    try {
                                        var syllables = engine.segmentSyllables(token);
                                        if (!syllables) { addSegment(token, null); return; }
                                        syllables.forEach(function (s, idx) {
                                            var color = ColorizationEngine.palettes.syllables[idx % ColorizationEngine.palettes.syllables.length];
                                            var extra = (config.options && config.options.showArcs) ? { showArc: true } : {};
                                            addSegment(s, color, extra);
                                        });
                                    } catch (e) { addSegment(token, null); }
                                });
                            } else if (config.mode === 'alternlettres') {
                                var letterCount = 0;
                                for (var i = 0; i < originalText.length; i++) {
                                    var char = originalText.charAt(i);
                                    if (engine.isPunctuation(char) || /^\s$/.test(char)) { addSegment(char, null); }
                                    else {
                                        var color = ColorizationEngine.palettes.letters[letterCount % ColorizationEngine.palettes.letters.length];
                                        addSegment(char, color);
                                        letterCount++;
                                    }
                                }
                            } else if (config.mode === 'alternmots') {
                                var words = originalText.split(/(\s+)/u);
                                var wordIdx = 0;
                                words.forEach(function (token) {
                                    if (/^\s+$/.test(token) || token === "") { addSegment(token, null); }
                                    else {
                                        var color = ColorizationEngine.palettes.words[wordIdx % ColorizationEngine.palettes.words.length];
                                        addSegment(token, color);
                                        wordIdx++;
                                    }
                                });
                            } else if (config.mode === 'vowels' || config.mode === 'consonants') {
                                for (var i = 0; i < originalText.length; i++) {
                                    var char = originalText.charAt(i);
                                    var color = null;
                                    if (config.mode === 'vowels' && engine.isVowel(char)) color = ColorizationEngine.palettes.vowels;
                                    else if (config.mode === 'consonants' && engine.isConsonant(char)) color = ColorizationEngine.palettes.consonants;
                                    addSegment(char, color);
                                }
                            } else if (config.mode === 'letters' && config.options && config.options.targetLetters) {
                                var targets = config.options.targetLetters.toLowerCase();
                                for (var i = 0; i < originalText.length; i++) {
                                    var char = originalText.charAt(i);
                                    var color = null;
                                    if (targets.indexOf(char.toLowerCase()) !== -1) {
                                        var tIdx = targets.indexOf(char.toLowerCase());
                                        color = ColorizationEngine.palettes.phonemes[tIdx % ColorizationEngine.palettes.phonemes.length];
                                    }
                                    addSegment(char, color);
                                }
                            } else if (config.mode === 'silent') {
                                var words = originalText.split(/(\P{L}+)/u);
                                words.forEach(function (token) {
                                    if (!token) return;
                                    if (engine.isPunctuation(token) || /^\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                                    var silentIndices = engine.detectSilentLetters(token);
                                    if (silentIndices.length === 0) { addSegment(token, null); }
                                    else {
                                        var lastIdx = 0;
                                        for (var i = 0; i < token.length; i++) {
                                            if (silentIndices.indexOf(i) !== -1) {
                                                if (i > lastIdx) addSegment(token.substring(lastIdx, i), null);
                                                addSegment(token.charAt(i), ColorizationEngine.palettes.silent);
                                                lastIdx = i + 1;
                                            }
                                        }
                                        if (lastIdx < token.length) addSegment(token.substring(lastIdx), null);
                                    }
                                });
                            } else { addSegment(originalText, null); }
                            return newRuns;
                        },
                        hashCode: function (str) {
                            var hash = 0;
                            for (var i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
                            return hash;
                        }
                    };

                    var oDocument = Api.GetDocument();
                    if (!oDocument) return "ERROR: No document";

                    var tStart = Date.now();
                    var allParagraphs = oDocument.GetAllParagraphs();
                    var totalParas = allParagraphs.length;
                    var changedParas = 0;
                    var skippedLinks = 0;

                    // UNDO LOGIC: Clear all previous colorization
                    for (var i = 0; i < allParagraphs.length; i++) {
                        var oPara = allParagraphs[i];

                        // Clear paragraph shading (for line alternation)
                        oPara.SetShd("clear", 255, 255, 255);

                        var elementsCount = oPara.GetElementsCount();
                        for (var k = 0; k < elementsCount; k++) {
                            var oEl = oPara.GetElement(k);
                            if (!oEl) continue;
                            var type = oEl.GetClassType();

                            if (type === "run") {
                                // Reset text color to black
                                oEl.SetColor(0, 0, 0);
                                // Clear run shading (for highlighting mode)
                                oEl.SetShd("clear", 255, 255, 255);
                            }
                        }
                    }

                    // Check if mode is alternlines
                    var isAlternLines = Asc.scope.config.mode === 'alternlines';
                    var lineColors = ["#FFFACD", "#E0F0FF"]; // Light Yellow, Light Blue

                    for (var i = 0; i < allParagraphs.length; i++) {
                        var oPara = allParagraphs[i];
                        var elementsCount = oPara.GetElementsCount();
                        var newElements = [];
                        var hasChange = false;

                        // Apply line alternation background if in alternlines mode
                        if (isAlternLines) {
                            var lineIndex = i % lineColors.length;
                            var bgColor = lineColors[lineIndex];
                            var rgb = [
                                parseInt(bgColor.slice(1, 3), 16),
                                parseInt(bgColor.slice(3, 5), 16),
                                parseInt(bgColor.slice(5, 7), 16)
                            ];
                            oPara.SetShd("clear", rgb[0], rgb[1], rgb[2]);
                            hasChange = true;
                            continue; // Skip run processing for alternlines mode
                        }

                        for (var k = 0; k < elementsCount; k++) {
                            var oEl = oPara.GetElement(k);
                            if (!oEl) continue;
                            var type = oEl.GetClassType();

                            if (type === "run") {
                                var runModel = {
                                    text: oEl.GetText(),
                                    formatting: {
                                        bold: oEl.GetBold(),
                                        italic: oEl.GetItalic(),
                                        underline: oEl.GetUnderline(),
                                        strikeout: oEl.GetStrikeout(),
                                        fontFamily: oEl.GetFontFamily(),
                                        fontSize: oEl.GetFontSize(),
                                        color: oEl.GetColor()
                                    }
                                };

                                var processedRuns = ColorizationEngine.processRun(runModel, Asc.scope.config);
                                if (processedRuns.length > 1 || (processedRuns.length === 1 && processedRuns[0].formatting.color !== runModel.formatting.color)) {
                                    hasChange = true;
                                    processedRuns.forEach(function (rData) {
                                        if (!rData.text) return;
                                        var oNewRun = Api.CreateRun();
                                        oNewRun.AddText(rData.text);
                                        var f = rData.formatting;

                                        // Handle text color
                                        if (f.color) {
                                            if (typeof f.color === 'string' && f.color.charAt(0) === '#') {
                                                oNewRun.SetColor(parseInt(f.color.slice(1, 3), 16), parseInt(f.color.slice(3, 5), 16), parseInt(f.color.slice(5, 7), 16));
                                            } else if (Array.isArray(f.color)) {
                                                oNewRun.SetColor(f.color[0], f.color[1], f.color[2]);
                                            }
                                        }

                                        // Handle background color (highlighting mode)
                                        if (f.backgroundColor) {
                                            if (typeof f.backgroundColor === 'string' && f.backgroundColor.charAt(0) === '#') {
                                                var bgR = parseInt(f.backgroundColor.slice(1, 3), 16);
                                                var bgG = parseInt(f.backgroundColor.slice(3, 5), 16);
                                                var bgB = parseInt(f.backgroundColor.slice(5, 7), 16);
                                                oNewRun.SetShd("clear", bgR, bgG, bgB);
                                            }
                                        }

                                        if (f.bold) oNewRun.SetBold(true);
                                        if (f.italic) oNewRun.SetItalic(true);
                                        if (f.underline) oNewRun.SetUnderline(f.underline);
                                        if (f.strikeout) oNewRun.SetStrikeout(true);
                                        if (f.fontFamily) oNewRun.SetFontFamily(f.fontFamily);
                                        if (f.fontSize) oNewRun.SetFontSize(f.fontSize);
                                        newElements.push(oNewRun);
                                    });
                                } else {
                                    newElements.push(oEl);
                                }
                            } else {
                                if (type === "hyperlink") skippedLinks++;
                                newElements.push(oEl);
                            }
                        }

                        if (hasChange) {
                            oPara.RemoveAllElements();
                            for (var n = 0; n < newElements.length; n++) {
                                oPara.AddElement(newElements[n]);
                            }
                            changedParas++;
                        }
                    }
                    var tEnd = Date.now();
                    return "SUCCESS: Processed " + totalParas + " paras, changed " + changedParas + ", skipped " + skippedLinks + " links in " + (tEnd - tStart) + "ms";
                } catch (err) {
                    return "ERROR: " + err.toString();
                }

            }, false, true, function (result) {
                isApplying = false;
                var statusDiv = document.getElementById('ling-status');
                if (statusDiv) {
                    if (result && result.startsWith && result.startsWith("ERROR")) {
                        statusDiv.textContent = "Erreur: " + result;
                        statusDiv.style.color = "red";
                        if (window.logger) window.logger.error(result);
                    } else {
                        lastActionWasColorization = true;
                        statusDiv.textContent = "Mise à jour terminée (" + (new Date()).toLocaleTimeString() + ")";
                    }
                }
            });
        };

        if (lastActionWasColorization) {
            if (window.logger) window.logger.info("Reverting previous colorization via Undo before new apply...");
            window.Asc.plugin.executeMethod("Undo", [], function () {
                lastActionWasColorization = false;
                applyAction();
            });
        } else {
            applyAction();
        }
    }

    function initSuggestionsTab() {
        const modeRadios = document.getElementsByName('suggestion-mode');
        let lastCheckedText = "";

        // Set "onthego" as the default mode
        const onTheGoRadio = document.querySelector('input[name="suggestion-mode"][value="onthego"]');
        if (onTheGoRadio) {
            onTheGoRadio.checked = true;
        }

        // Common function to process text and display suggestions
        function processSuggestions(text) {
            const container = document.getElementById('suggestions-container');
            if (!container) return;

            // Avoid reprocessing the exact same text to reduce flickering/load
            if (text === lastCheckedText && text.trim().length === 0) return;

            container.innerHTML = ''; // Clear previous results

            if (text && text.trim().length > 0) {
                const words = text.trim().split(/\s+/);
                let motPrecedent = null;

                words.forEach((motSaisi, index) => {
                    if (motSaisi.length > 2) { // Only check words with more than 2 characters
                        const suggestions = window.OnlyDysLogic.classerSuggestions(motSaisi, motPrecedent);
                        if (suggestions.length > 0) {
                            const header = document.createElement('h4');
                            header.textContent = `Suggestions for "${motSaisi}"`;
                            header.style.marginLeft = '12px';
                            container.appendChild(header);
                            window.OnlyDysUI.displaySuggestions(suggestions, motSaisi, true);
                        }
                        motPrecedent = motSaisi;
                    }
                });
            }
            lastCheckedText = text;
        }

        function startPolling() {
            stopPolling();
            // Poll every 1 second
            pollingInterval = setInterval(() => {
                window.Asc.plugin.executeMethod("GetSelectedText", [], function (text) {
                    if (text !== lastCheckedText) {
                        processSuggestions(text);
                    }
                });
            }, 1000);
        }

        function updateMode() {
            let mode = 'selection';
            for (const radio of modeRadios) {
                if (radio.checked) {
                    mode = radio.value;
                    break;
                }
            }

            if (mode === 'onthego') {
                startPolling();
            } else {
                stopPolling();
                window.Asc.plugin.executeMethod("GetSelectedText", [], function (text) {
                    if (text) {
                        const words = text.trim().split(/\s+/).slice(0, 9).join(' ');
                        processSuggestions(words);
                    }
                });
            }
        }

        modeRadios.forEach(radio => {
            radio.addEventListener('change', updateMode);
        });

        // Add visibility change event listener
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                stopPolling();
            } else {
                updateMode();
            }
        });

        updateMode();
    }

    function initFontTab() {
        const checkFontButton = document.getElementById('check-font-button');
        if (checkFontButton) {
            checkFontButton.addEventListener('click', function () {
                checkFont();
            });
        }
        checkFont();
    }
    let dyslexiaTabInitialized = false;

    function initDyslexiaTab() {
        if (dyslexiaTabInitialized) return;
        dyslexiaTabInitialized = true;

        const dyslexiaToggle = document.getElementById('toggle-dyslexia-sim');
        const dyslexiaStatus = document.getElementById('dyslexia-sim-status');

        if (dyslexiaToggle) {
            dyslexiaToggle.addEventListener('change', function (e) {
                try {
                    if (e.target.checked) {
                        if (window.logger) window.logger.info("Activating dyslexia simulation...");
                        // Apply the dyslexia effect (atomic command supporting Undo)
                        if (window.OnlyDysDyslexia && window.OnlyDysDyslexia.applyDyslexiaToDocument) {
                            window.OnlyDysDyslexia.applyDyslexiaToDocument({
                                minWordLength: 5,
                                scrambleChance: 100
                            });
                        } else {
                            throw new Error("window.OnlyDysDyslexia or applyDyslexiaToDocument is not defined");
                        }

                        if (dyslexiaStatus) {
                            dyslexiaStatus.textContent = "Actif";
                            dyslexiaStatus.style.color = "green";
                        }
                    } else {
                        if (window.logger) window.logger.info("Deactivating dyslexia simulation (Undo)...");
                        // Revert using native Undo for precise restoration
                        window.Asc.plugin.executeMethod("Undo");

                        if (dyslexiaStatus) {
                            dyslexiaStatus.textContent = "Inactif";
                            dyslexiaStatus.style.color = "inherit";
                        }
                    }
                } catch (err) {
                    console.error("Error in dyslexia toggle:", err);
                    if (window.logger) window.logger.error("Dyslexia Toggle Error: " + err.message);
                }
            });
        }
    }


    function checkFont() {
        window.Asc.plugin.callCommand(function () {
            var oDocument = Api.GetDocument();
            var oPara = Api.CreateParagraph();
            oPara.AddText("font check");
            oDocument.Push(oPara);

            try {
                var oRange = oPara.GetRange(0, -1);
                oRange.SetHidden(true);
                oRange.SetFontFamily("OpenDyslexic");
                var sFontFamily = oRange.GetFontFamily();
                return sFontFamily === "OpenDyslexic";
            } catch (e) {
                return false;
            } finally {
                try {
                    var count = oDocument.GetElementsCount();
                    oDocument.RemoveElement(count - 1);
                } catch (e) { }
            }
        }, false, true, function (isFontInstalled) {
            var fontStatus = document.getElementById('font-status');
            var fontTabBtn = document.getElementById('font-tab-btn');
            const instructions = document.getElementById('font-instructions');

            if (isFontInstalled) {
                if (fontStatus) fontStatus.innerHTML = '<p style="color: green;">The "OpenDyslexic" font is correctly installed and active.</p>';
                if (instructions) instructions.style.display = 'none';
                if (fontTabBtn) fontTabBtn.style.display = 'none';
            } else {
                if (fontStatus) fontStatus.innerHTML = '<p style="color: red;">The "OpenDyslexic" font is not installed. Please follow the instructions below.</p>';
                if (instructions) instructions.style.display = 'block';
                if (fontTabBtn) fontTabBtn.style.display = 'block';
            }
        });
    }


    let isInitialized = false;
    window.Asc.plugin.init = function (text) {
        if (window.logger) window.logger.info("Init called. Text len: " + (text ? text.length : 0) + ", isInit: " + isInitialized);

        if (!isInitialized) {
            isInitialized = true;

            window.OnlyDysLogic.loadDictionary().then(() => {
                logger.info('Dictionary loaded, initializing tabs.');
            }).catch(error => {
                logger.error('Failed to load dictionary:', error);
                // Ensure loading overlay is hidden on error
                const loadingEl = document.getElementById('loading-overlay');
                if (loadingEl) {
                    loadingEl.style.display = 'none';
                }
            });

            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    loadTab(button.dataset.tab);
                });
            });

            loadTab('suggestions');

            // Explicitly attach events as a fallback/primary method
            if (window.Asc.plugin.attachEvent) {
                window.Asc.plugin.attachEvent("onTranslateSelection", window.Asc.plugin.event_onTranslateSelection);
                window.Asc.plugin.attachEvent("onTargetPositionChanged", window.Asc.plugin.event_onTranslateSelection);
                if (window.logger) window.logger.info("Events attached via attachEvent.");
            } else {
                if (window.logger) window.logger.warn("window.Asc.plugin.attachEvent is not available.");
            }
        }

        // Always handle selection change on init (re-entry)
        // If text is provided by init, we can use it, or just trigger the handler to fetch fresh connection
        if (suggestionService && suggestionService.handleSelectionChange) {
            suggestionService.handleSelectionChange();
        }
    };

    // Public API for UI to call
    window.OnlyDys = window.OnlyDys || {};
    window.OnlyDys.performReplacement = function (wordToReplace, wordToInsert) {
        if (window.logger) window.logger.info("Plugin.js: performing replacement of " + wordToReplace + " -> " + wordToInsert);
        Asc.scope.wordToReplace = wordToReplace;
        Asc.scope.wordToInsert = wordToInsert;

        window.Asc.plugin.callCommand(function () {
            try {
                var oDocument = Api.GetDocument();
                // Check valid object - use GetRangeBySelect as fallback
                var oRange = null;
                if (typeof oDocument.GetSelection === 'function') {
                    oRange = oDocument.GetSelection();
                } else if (typeof oDocument.GetRangeBySelect === 'function') {
                    oRange = oDocument.GetRangeBySelect();
                } else if (typeof oDocument.GetRange === 'function') {
                    oRange = oDocument.GetRange();
                }
                
                if (!oRange) {
                    return JSON.stringify({ status: "crash", error: "GetSelection missing" });
                }

                var currentText = oRange.GetText();

                // 1. Direct match
                if (currentText && currentText.trim().toLowerCase() === Asc.scope.wordToReplace.trim().toLowerCase()) {
                    oRange.SetText(Asc.scope.wordToInsert);
                    return JSON.stringify({ status: "replaced_selection" });
                }

                // 2. Expand
                oRange.ExpandToWord();
                currentText = oRange.GetText();

                if (currentText && currentText.trim().toLowerCase() === Asc.scope.wordToReplace.trim().toLowerCase()) {
                    oRange.SetText(Asc.scope.wordToInsert);
                    return JSON.stringify({ status: "replaced_expansion" });
                }

                return JSON.stringify({ status: "no_match", found: currentText });
            } catch (e) {
                return JSON.stringify({ status: "crash", error: e.message });
            }
        }, false, false, function (result) {
            if (window.logger) window.logger.info("Plugin.js: Replacement result: " + result);

            var status = "unknown";
            try {
                var json = JSON.parse(result);
                status = json.status;
            } catch (e) { /* ignore parse error for crash strings */ }

            if (status === "crash" || status === "error" || (typeof result === 'string' && result.indexOf("CRASH:") !== -1)) {
                if (window.logger) window.logger.warn("Context replacement failed/crashed. Falling back to PasteText.");
                // Fallback: Just paste (assumes selection is active foundation from capture fallback)
                window.Asc.plugin.executeMethod("PasteText", [wordToInsert]);
            }
        });
    };

    window.Asc.plugin.onCommandCallback = function (result) {
        if (window.logger) window.logger.info("onCommandCallback fired. Result: " + JSON.stringify(result));
    };

    window.Asc.plugin.button = function (id) {
        this.executeCommand("close", "");
    };

    var selectionEvent = debounce(function () {
        if (window.logger) window.logger.info("Selection Event fired.");
        // This event is triggered when the cursor moves or selection changes
        if (suggestionService && suggestionService.handleSelectionChange) {
            suggestionService.handleSelectionChange();
        } else {
            if (window.logger) window.logger.error("suggestionService or handleSelectionChange missing within event.");
        }
    }, 500);

    window.Asc.plugin.event_onTranslateSelection = selectionEvent;
    window.Asc.plugin.event_onTargetPositionChanged = selectionEvent;

})(window, undefined);

