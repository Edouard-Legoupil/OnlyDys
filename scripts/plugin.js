(function (window, undefined) {

    // Function to debounce calls to the suggestion logic
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Function to switch tabs
    function loadTab(tabName) {
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
            initSuggestionsTab();
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
        if (btnDownload) {
            // Remove old listener to prevent duplicates (simple cloning trick or check attribute)
            const newBtn = btnDownload.cloneNode(true);
            btnDownload.parentNode.replaceChild(newBtn, btnDownload);

            newBtn.addEventListener('click', function () {
                if (window.logger && window.logger.getLogs) {
                    const logs = window.logger.getLogs();
                    const blob = new Blob([logs], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'onlydys_debug_logs.txt';
                    document.body.appendChild(a);
                    a.click();

                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    logger.info("Logs downloaded by user.");
                } else {
                    alert("Logger not available.");
                }
            });
        }
    }

    const LINGUISTIC_ENGINE_SOURCE = `
    var VOWELS = [
        "a", "à", "â",
        "e", "é", "è", "ê", "ë",
        "i", "î", "ï",
        "o", "ô",
        "u", "ù", "û", "ü",
        "y",
        "œ", "æ"
    ];

    var VOWEL_REGEX = new RegExp(VOWELS.join("|"), "i");

    var MULTI_PHONEMES = [
        "eau", "eaux",
        "ain", "aim", "ein", "eim",
        "ien",
        "oin",
        "on", "om",
        "an", "am",
        "en", "em",
        "in", "im", "yn", "ym",
        "ou", "oi", "ai", "ei", "au",
        "ch", "ph", "th", "gn", "qu", "gu",
        "ill"
    ];

    var SILENT_ENDINGS = [
        "ent", "es", "e", "s", "t", "d", "p", "x"
    ];

    var LinguisticEngine = {
        normalizeFrench: function (text) { if (!text) return ""; return text.toLowerCase().normalize("NFC"); },
        isVowel: function (char) { return VOWELS.indexOf(char.toLowerCase()) !== -1; },
        isConsonant: function (char) { return !this.isVowel(char) && /[a-zàâçéèêëîïôùûüœæ]/i.test(char); },
        isPunctuation: function (char) { return /\\p{P}/u.test(char); },
        tokenizeWords: function (text) { return text.match(/\\p{L}+[''-]?\\p{L}*/gu) || []; },
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
                if (VOWEL_REGEX.test(phonemes[i])) {
                    var next = phonemes[i + 1];
                    var nextNext = phonemes[i + 2];
                    if (next && !VOWEL_REGEX.test(next)) {
                        if (nextNext && !VOWEL_REGEX.test(nextNext)) { current.push(next); i++; syllables.push(current); current = []; }
                        else { syllables.push(current); current = []; }
                    } else { syllables.push(current); current = []; }
                }
            }
            if (current.length) {
                if (syllables.length > 0) {
                    var currentHasVowel = false;
                    for (var j = 0; j < current.length; j++) {
                        if (VOWEL_REGEX.test(current[j])) { currentHasVowel = true; break; }
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
    var ColorizationEngine = {
        palettes: {
            phonemes: ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#000000"],
            syllables: ["#D55E00", "#0072B2"],
            words: ["#000000", "#555555"],
            lines: ["#000000", "#0072B2"],
            vowels: "#D55E00", consonants: "#0072B2", silent: "#999999", punctuation: "#CC79A7",
            grammar: { 'NOM': '#D55E00', 'VER': '#0072B2', 'ADJ': '#56B4E9', 'ADV': '#009E73', 'PRO': '#E69F00', 'DET': '#CC79A7', 'PRE': '#000000', 'CON': '#999999', 'INT': '#F0E442' }
        },
        processModel: function (model, config) {
            var processedModel = JSON.parse(JSON.stringify(model));
            var wordMap = null;
            processedModel.paragraphs.forEach(function(para) {
                var newRuns = [];
                para.textRuns.forEach(function(run) {
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
            var addSegment = function(text, color, extraFormatting) {
                extraFormatting = extraFormatting || {};
                var formatting = {};
                for (var key in run.formatting) {
                    formatting[key] = run.formatting[key];
                }
                formatting.color = color || run.formatting.color;
                for (var key in extraFormatting) {
                    formatting[key] = extraFormatting[key];
                }
                newRuns.push({ text: text, formatting: formatting });
            };
            if (config.mode === 'grammar') {
                var words = originalText.split(/(\\P{L}+)/u);
                words.forEach(function(token) {
                    if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                    var lowerWord = token.toLowerCase();
                    var grammar = wordMap ? wordMap.get(lowerWord) : null;
                    var color = null;
                    if (grammar && ColorizationEngine.palettes.grammar[grammar]) color = ColorizationEngine.palettes.grammar[grammar];
                    addSegment(token, color);
                });
            } else if (config.mode === 'phonemes') {
                var words = originalText.split(/(\\P{L}+)/u);
                words.forEach(function(token) {
                    if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                    var analysis = engine.analyzeWord(token);
                    analysis.phonemes.forEach(function(p, idx) {
                        var colorIndex = Math.abs(ColorizationEngine.hashCode(p.toLowerCase())) % ColorizationEngine.palettes.phonemes.length;
                        var color = ColorizationEngine.palettes.phonemes[colorIndex];
                        addSegment(p, color);
                    });
                });
            } else if (config.mode === 'syllables') {
                var words = originalText.split(/(\\P{L}+)/u);
                words.forEach(function(token) {
                    if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                    var syllables = engine.segmentSyllables(token);
                    syllables.forEach(function(s, idx) {
                        var color = ColorizationEngine.palettes.syllables[idx % 2];
                        addSegment(s, color);
                    });
                });
            } else if (config.mode === 'silent') {
                var words = originalText.split(/(\\P{L}+)/u);
                words.forEach(function(token) {
                    if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") { addSegment(token, null); return; }
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
    };`;

    function initLinguisticsTab() {
        const styleToggle = document.getElementById('toggle-global-style');
        const styleStatus = document.getElementById('global-style-status');

        if (styleToggle) {
            styleToggle.addEventListener('change', function (e) {
                const isEnabled = e.target.checked;
                if (styleStatus) {
                    styleStatus.textContent = isEnabled ? "Activé" : "Désactivé";
                    styleStatus.style.color = isEnabled ? "green" : "inherit";
                }
                if (window.OnlyDysStyles) {
                    if (isEnabled) window.OnlyDysStyles.applyStyleToDocument();
                    else window.OnlyDysStyles.revertStyleInDocument();
                }
            });
        }

        if (window.OnlyDysStyles && window.OnlyDysStyles.displayColorLegend) {
            window.OnlyDysStyles.displayColorLegend();
        }

        const modeRadios = document.getElementsByName('ling-mode');
        modeRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                applyLinguisticsToDocument();
                updateInterfaceVisibility();
                updateLingPreview(); // Trigger preview update
            });
        });

        document.getElementById('opt-arcs')?.addEventListener('change', function () {
            applyLinguisticsToDocument();
            updateLingPreview();
        });
        document.getElementById('opt-silent')?.addEventListener('change', function () {
            applyLinguisticsToDocument();
            updateLingPreview();
        });

        function updateInterfaceVisibility() {
            const mode = Array.from(modeRadios).find(r => r.checked)?.value;
            document.querySelectorAll('.conditional-opt').forEach(el => el.style.display = 'none');

            if (mode === 'syllables') document.getElementById('opt-container-syllables').style.display = 'block';
            if (mode === 'silent') document.getElementById('opt-container-silent').style.display = 'block';
            if (mode === 'grammar') document.getElementById('opt-container-grammar').style.display = 'block';
        }
        updateInterfaceVisibility();
        updateLingPreview(); // Initial preview
    }

    // New Function: Update the visual preview in the tab
    function updateLingPreview() {
        const previewDiv = document.getElementById('ling-preview');
        if (!previewDiv) return;

        const mode = document.querySelector('input[name="ling-mode"]:checked')?.value || 'none';
        const options = {
            showArcs: document.getElementById('opt-arcs')?.checked || false,
            highlightSilent: document.getElementById('opt-silent')?.checked || false
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

    function applyLinguisticsToDocument() {
        if (isApplying) return;
        isApplying = true;
        const statusDiv = document.getElementById('ling-status');
        if (statusDiv) statusDiv.textContent = "Application en cours...";

        const mode = document.querySelector('input[name="ling-mode"]:checked')?.value || 'none';
        const options = {
            showArcs: document.getElementById('opt-arcs')?.checked || false,
            highlightSilent: document.getElementById('opt-silent')?.checked || false
        };

        const config = { mode: mode, options: options };

        Asc.scope.linguisticScript = LINGUISTIC_ENGINE_SOURCE;
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
                    isConsonant: function (char) { return !this.isVowel(char) && /[a-zàâçéèêëîïôùûüœæ]/i.test(char); },
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
                            if (VOWEL_REGEX.test(phonemes[i])) {
                                var next = phonemes[i + 1];
                                var nextNext = phonemes[i + 2];
                                if (next && !VOWEL_REGEX.test(next)) {
                                    if (nextNext && !VOWEL_REGEX.test(nextNext)) { current.push(next); i++; syllables.push(current); current = []; }
                                    else { syllables.push(current); current = []; }
                                } else { syllables.push(current); current = []; }
                            }
                        }
                        if (current.length) {
                            if (syllables.length > 0) {
                                var currentHasVowel = false;
                                for (var j = 0; j < current.length; j++) {
                                    if (VOWEL_REGEX.test(current[j])) { currentHasVowel = true; break; }
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
                    analyzeWord: function (word) {
                        return { original: word, phonemes: this.segmentPhonemes(word), syllables: this.segmentSyllables(word), silentLetters: this.detectSilentLetters(word) };
                    }
                };

                // Inline ColorizationEngine (no eval needed)
                var ColorizationEngine = {
                    palettes: {
                        phonemes: ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#000000"],
                        syllables: ["#D55E00", "#0072B2"],
                        silent: "#999999",
                        grammar: { 'NOM': '#D55E00', 'VER': '#0072B2', 'ADJ': '#56B4E9', 'ADV': '#009E73', 'PRO': '#E69F00', 'DET': '#CC79A7', 'PRE': '#000000', 'CON': '#999999', 'INT': '#F0E442' }
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
                            for (var key in run.formatting) {
                                formatting[key] = run.formatting[key];
                            }
                            formatting.color = color || run.formatting.color;
                            for (var key in extraFormatting) {
                                formatting[key] = extraFormatting[key];
                            }
                            newRuns.push({ text: text, formatting: formatting });
                        };
                        if (config.mode === 'grammar') {
                            var words = originalText.split(/(\P{L}+)/u);
                            words.forEach(function (token) {
                                if (!token) return; // Skip undefined
                                if (engine.isPunctuation(token) || /^\s+$/.test(token)) { addSegment(token, null); return; }
                                if (token === "") { addSegment(token, null); return; }
                                var lowerWord = token.toLowerCase();
                                var grammar = wordMap ? wordMap.get(lowerWord) : null;
                                var color = null;
                                if (grammar && ColorizationEngine.palettes.grammar[grammar]) color = ColorizationEngine.palettes.grammar[grammar];
                                addSegment(token, color);
                            });
                        } else if (config.mode === 'phonemes') {
                            var words = originalText.split(/(\P{L}+)/u);
                            words.forEach(function (token) {
                                if (!token) return; // Skip undefined
                                if (engine.isPunctuation(token) || /^\s+$/.test(token)) { addSegment(token, null); return; }
                                if (token === "") { addSegment(token, null); return; }
                                try {
                                    var analysis = engine.analyzeWord(token);
                                    if (!analysis || !analysis.phonemes || analysis.phonemes.length === 0) {
                                        addSegment(token, null);
                                        return;
                                    }
                                    analysis.phonemes.forEach(function (p, idx) {
                                        var colorIndex = Math.abs(ColorizationEngine.hashCode(p.toLowerCase())) % ColorizationEngine.palettes.phonemes.length;
                                        var color = ColorizationEngine.palettes.phonemes[colorIndex];
                                        addSegment(p, color);
                                    });
                                } catch (e) {
                                    addSegment(token, null);
                                }
                            });
                        } else if (config.mode === 'syllables') {
                            var words = originalText.split(/(\P{L}+)/u);
                            words.forEach(function (token) {
                                if (!token) return; // Skip undefined
                                if (engine.isPunctuation(token) || /^\s+$/.test(token)) { addSegment(token, null); return; }
                                if (token === "") { addSegment(token, null); return; }
                                try {
                                    var syllables = engine.segmentSyllables(token);
                                    if (!syllables || syllables.length === 0) {
                                        addSegment(token, null);
                                        return;
                                    }
                                    syllables.forEach(function (s, idx) {
                                        var color = ColorizationEngine.palettes.syllables[idx % 2];
                                        addSegment(s, color);
                                    });
                                } catch (e) {
                                    addSegment(token, null);
                                }
                            });
                        } else if (config.mode === 'silent') {
                            var words = originalText.split(/(\P{L}+)/u);
                            words.forEach(function (token) {
                                if (!token) return; // Skip undefined
                                if (engine.isPunctuation(token) || /^\s+$/.test(token)) { addSegment(token, null); return; }
                                if (token === "") { addSegment(token, null); return; }
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
                if (!oDocument) {
                    return "ERROR: Could not get document";
                }

                // RECURSIVE HELPER (Robust)
                function collectAllParagraphs(container) {
                    var paragraphs = [];
                    // Check if container is valid path
                    if (!container) return [];

                    var count = 0;
                    // Safety check for GetElementsCount
                    try {
                        if (typeof container.GetElementsCount === "function") {
                            count = container.GetElementsCount();
                        }
                    } catch (e) { return []; }

                    for (var i = 0; i < count; i++) {
                        var el = container.GetElement(i);
                        if (!el) continue;
                        var type = el.GetClassType();

                        if (type === "paragraph") {
                            paragraphs.push(el);
                        } else if (type === "table") {
                            var rowCount = el.GetRowsCount();
                            for (var r = 0; r < rowCount; r++) {
                                var row = el.GetRow(r);
                                var cellCount = row.GetCellsCount();
                                for (var c = 0; c < cellCount; c++) {
                                    var cell = row.GetCell(c);
                                    paragraphs = paragraphs.concat(collectAllParagraphs(cell));
                                }
                            }
                        } else if (type === "contentControl") {
                            if (typeof el.GetContent === "function") {
                                paragraphs = paragraphs.concat(collectAllParagraphs(el.GetContent()));
                            }
                        } else if (type === "group") {
                            if (typeof el.GetContent === "function") {
                                paragraphs = paragraphs.concat(collectAllParagraphs(el.GetContent()));
                            }
                        }
                    }
                    return paragraphs;
                }

                var allParagraphs = collectAllParagraphs(oDocument);

                for (var i = 0; i < allParagraphs.length; i++) {
                    var oElement = allParagraphs[i];

                    // Revert logic
                    if (Asc.scope.config.mode === 'none') {
                        var rCount = oElement.GetElementsCount();
                        for (var k = 0; k < rCount; k++) {
                            var r = oElement.GetElement(k);
                            if (r.GetClassType() === "run") r.SetColor(0, 0, 0, false);
                        }
                        continue;
                    }

                    var runsCount = oElement.GetElementsCount();
                    var paraModel = { textRuns: [] };

                    for (var k = 0; k < runsCount; k++) {
                        var oRun = oElement.GetElement(k);
                        if (oRun.GetClassType() === "run") {
                            paraModel.textRuns.push({
                                text: oRun.GetText(),
                                formatting: {
                                    bold: oRun.GetBold(),
                                    italic: oRun.GetItalic(),
                                    underline: oRun.GetUnderline(),
                                    strikeout: oRun.GetStrikeout(),
                                    fontFamily: oRun.GetFontFamily(),
                                    fontSize: oRun.GetFontSize(),
                                    color: oRun.GetColor()
                                }
                            });
                        }
                    }

                    var processedModel = ColorizationEngine.processModel({ paragraphs: [paraModel] }, Asc.scope.config);

                    // Verify text is preserved
                    var originalText = paraModel.textRuns.map(function (r) { return r.text || ''; }).join('');
                    var processedText = processedModel.paragraphs[0].textRuns.map(function (r) { return r.text || ''; }).join('');

                    if (originalText.toLowerCase().normalize("NFC") !== processedText.toLowerCase().normalize("NFC")) {
                        // Text mismatch - skip this paragraph to preserve content
                        continue;
                    }

                    oElement.RemoveAllElements();

                    var pData = processedModel.paragraphs[0];
                    for (var rIdx = 0; rIdx < pData.textRuns.length; rIdx++) {
                        var runData = pData.textRuns[rIdx];

                        // Skip empty runs
                        if (!runData.text) continue;

                        var oRun = Api.CreateRun();
                        oRun.AddText(runData.text);

                        if (runData.formatting) {
                            var f = runData.formatting;
                            if (f.color) {
                                // Handle both hex string and RGB array
                                if (typeof f.color === 'string' && f.color.charAt(0) === '#') {
                                    // Hex string like "#FF0000"
                                    oRun.SetColor(
                                        parseInt(f.color.slice(1, 3), 16),
                                        parseInt(f.color.slice(3, 5), 16),
                                        parseInt(f.color.slice(5, 7), 16)
                                    );
                                } else if (Array.isArray(f.color) && f.color.length >= 3) {
                                    // RGB array like [255, 0, 0]
                                    oRun.SetColor(f.color[0], f.color[1], f.color[2]);
                                }
                            }
                            if (f.bold) oRun.SetBold(true);
                            if (f.italic) oRun.SetItalic(true);
                            if (f.underline) oRun.SetUnderline(f.underline);
                            if (f.strikeout) oRun.SetStrikeout(true);
                            if (f.fontFamily) oRun.SetFontFamily(f.fontFamily);
                            if (f.fontSize) oRun.SetFontSize(f.fontSize);
                        }
                        oElement.AddElement(oRun);
                    }
                }
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
                    statusDiv.textContent = "Mise à jour terminée (" + (new Date()).toLocaleTimeString() + ")";
                    statusDiv.style.color = "#666";
                }
            }
        });
    }

    function initSuggestionsTab() {
        const pasteSelectionButton = document.getElementById('paste-selection');
        const checkTextButton = document.getElementById('check-text-button');
        const modeRadios = document.getElementsByName('suggestion-mode');
        let pollingInterval = null;
        let lastCheckedText = "";

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

        function stopPolling() {
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
        }

        function startPolling() {
            stopPolling();
            // Poll every 1 second
            pollingInterval = setInterval(() => {
                window.Asc.plugin.executeMethod("GetSelectedText", [], function (text) {
                    if (text !== lastCheckedText) {
                        document.getElementById('textarea').innerText = text;
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
                // Disable manual buttons
                if (pasteSelectionButton) pasteSelectionButton.style.display = 'none';
                if (checkTextButton) checkTextButton.style.display = 'none';
                startPolling();
            } else {
                // Enable manual buttons
                if (pasteSelectionButton) pasteSelectionButton.style.display = 'block';
                if (checkTextButton) checkTextButton.style.display = 'block';
                stopPolling();

                window.Asc.plugin.executeMethod("GetSelectedText", [], function (text) {
                    if (text) {
                        document.getElementById('textarea').innerText = text;
                        processSuggestions(text);
                    }
                });
            }
        }

        modeRadios.forEach(radio => {
            radio.addEventListener('change', updateMode);
        });

        updateMode();


        if (pasteSelectionButton) {
            pasteSelectionButton.addEventListener('click', function () {
                window.Asc.plugin.executeMethod("GetSelectedText", [], function (text) {
                    if (text) {
                        document.getElementById('textarea').innerText = text;
                    }
                });
            });
        }

        if (checkTextButton) {
            checkTextButton.addEventListener('click', function () {
                const text = document.getElementById('textarea').innerText;
                processSuggestions(text);
            });
        }
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
        let originalDocumentModel = null;

        if (dyslexiaToggle) {
            dyslexiaToggle.addEventListener('change', function (e) {
                if (e.target.checked) {
                    window.Asc.plugin.callCommand(function () {
                        try {
                            var oDocument = Api.GetDocument();

                            function collectAllParagraphs(container) {
                                var paragraphs = [];
                                if (!container) return [];
                                var count = 0;
                                try {
                                    if (typeof container.GetElementsCount === "function") count = container.GetElementsCount();
                                } catch (e) { return []; }

                                for (var i = 0; i < count; i++) {
                                    var el = container.GetElement(i);
                                    if (!el) continue;
                                    var type = el.GetClassType();

                                    if (type === "paragraph") {
                                        paragraphs.push(el);
                                    } else if (type === "table") {
                                        var rowCount = el.GetRowsCount();
                                        for (var r = 0; r < rowCount; r++) {
                                            var row = el.GetRow(r);
                                            var cellCount = row.GetCellsCount();
                                            for (var c = 0; c < cellCount; c++) {
                                                var cell = row.GetCell(c);
                                                paragraphs = paragraphs.concat(collectAllParagraphs(cell));
                                            }
                                        }
                                    } else if (type === "contentControl") {
                                        if (typeof el.GetContent === "function") {
                                            paragraphs = paragraphs.concat(collectAllParagraphs(el.GetContent()));
                                        }
                                    } else if (type === "group") {
                                        if (typeof el.GetContent === "function") {
                                            paragraphs = paragraphs.concat(collectAllParagraphs(el.GetContent()));
                                        }
                                    }
                                }
                                return paragraphs;
                            }

                            var allParagraphs = collectAllParagraphs(oDocument);
                            Asc.scope.originalDocumentModel = [];

                            function scrambleText(text) {
                                var words = text.split(" ");
                                for (var i = 0; i < words.length; i++) {
                                    if (words[i].length > 4) {
                                        var middle = words[i].slice(1, -1);
                                        var scrambledMiddle = middle.split('').sort(function () { return 0.5 - Math.random() }).join('');
                                        words[i] = words[i][0] + scrambledMiddle + words[i][words[i].length - 1];
                                    }
                                }
                                return words.join(" ");
                            }

                            for (var i = 0; i < allParagraphs.length; i++) {
                                var oParagraph = allParagraphs[i];
                                var runsCount = oParagraph.GetElementsCount();
                                var paraModel = { textRuns: [] };
                                var originalParaModel = { textRuns: [] };

                                for (var j = 0; j < runsCount; j++) {
                                    var oRun = oParagraph.GetElement(j);
                                    if (oRun.GetClassType() === "run") {
                                        var originalText = oRun.GetText();
                                        var runFormatting = {
                                            bold: oRun.GetBold(),
                                            italic: oRun.GetItalic(),
                                            underline: oRun.GetUnderline(),
                                            strikeout: oRun.GetStrikeout(),
                                            fontFamily: oRun.GetFontFamily(),
                                            fontSize: oRun.GetFontSize(),
                                            color: oRun.GetColor()
                                        };
                                        paraModel.textRuns.push({
                                            text: scrambleText(originalText),
                                            formatting: runFormatting
                                        });
                                        originalParaModel.textRuns.push({
                                            text: originalText,
                                            formatting: runFormatting
                                        });
                                    }
                                }
                                Asc.scope.originalDocumentModel.push(originalParaModel);

                                oParagraph.RemoveAllElements();
                                for (var k = 0; k < paraModel.textRuns.length; k++) {
                                    var runData = paraModel.textRuns[k];
                                    var oNewRun = Api.CreateRun();
                                    oNewRun.AddText(runData.text);

                                    if (runData.formatting) {
                                        var f = runData.formatting;
                                        if (f.color) {
                                            oNewRun.SetColor(f.color[0], f.color[1], f.color[2]);
                                        }
                                        if (f.bold) oNewRun.SetBold(true);
                                        if (f.italic) oNewRun.SetItalic(true);
                                        if (f.underline) oNewRun.SetUnderline(f.underline);
                                        if (f.strikeout) oNewRun.SetStrikeout(true);
                                        if (f.fontFamily) oNewRun.SetFontFamily(f.fontFamily);
                                        if (f.fontSize) oNewRun.SetFontSize(f.fontSize);
                                    }
                                    oParagraph.AddElement(oNewRun);
                                }
                            }
                        } catch (err) {
                            return "ERROR: " + err.toString();
                        }
                    }, false, true, function (result) {
                        if (dyslexiaStatus) {
                            if (result && result.startsWith && result.startsWith("ERROR")) {
                                dyslexiaStatus.textContent = "Erreur: " + result;
                                dyslexiaStatus.style.color = "red";
                            } else {
                                dyslexiaStatus.textContent = "Actif";
                                dyslexiaStatus.style.color = "green";
                            }
                        }
                    });
                } else {
                    window.Asc.plugin.callCommand(function () {
                        try {
                            var oDocument = Api.GetDocument();

                            function collectAllParagraphs(container) {
                                var paragraphs = [];
                                if (!container) return [];
                                var count = 0;
                                try {
                                    if (typeof container.GetElementsCount === "function") count = container.GetElementsCount();
                                } catch (e) { return []; }

                                for (var i = 0; i < count; i++) {
                                    var el = container.GetElement(i);
                                    if (!el) continue;
                                    var type = el.GetClassType();

                                    if (type === "paragraph") {
                                        paragraphs.push(el);
                                    } else if (type === "table") {
                                        var rowCount = el.GetRowsCount();
                                        for (var r = 0; r < rowCount; r++) {
                                            var row = el.GetRow(r);
                                            var cellCount = row.GetCellsCount();
                                            for (var c = 0; c < cellCount; c++) {
                                                var cell = row.GetCell(c);
                                                paragraphs = paragraphs.concat(collectAllParagraphs(cell));
                                            }
                                        }
                                    } else if (type === "contentControl") {
                                        if (typeof el.GetContent === "function") {
                                            paragraphs = paragraphs.concat(collectAllParagraphs(el.GetContent()));
                                        }
                                    } else if (type === "group") {
                                        if (typeof el.GetContent === "function") {
                                            paragraphs = paragraphs.concat(collectAllParagraphs(el.GetContent()));
                                        }
                                    }
                                }
                                return paragraphs;
                            }

                            var allParagraphs = collectAllParagraphs(oDocument);

                            for (var i = 0; i < allParagraphs.length; i++) {
                                var oParagraph = allParagraphs[i];
                                oParagraph.RemoveAllElements();
                                var paraModel = Asc.scope.originalDocumentModel[i];
                                for (var k = 0; k < paraModel.textRuns.length; k++) {
                                    var runData = paraModel.textRuns[k];
                                    var oNewRun = Api.CreateRun();
                                    oNewRun.AddText(runData.text);

                                    if (runData.formatting) {
                                        var f = runData.formatting;
                                        if (f.color) {
                                            oNewRun.SetColor(f.color[0], f.color[1], f.color[2]);
                                        }
                                        if (f.bold) oNewRun.SetBold(true);
                                        if (f.italic) oNewRun.SetItalic(true);
                                        if (f.underline) oNewRun.SetUnderline(f.underline);
                                        if (f.strikeout) oNewRun.SetStrikeout(true);
                                        if (f.fontFamily) oNewRun.SetFontFamily(f.fontFamily);
                                        if (f.fontSize) oNewRun.SetFontSize(f.fontSize);
                                    }
                                    oParagraph.AddElement(oNewRun);
                                }
                            }
                        } catch (err) {
                            return "ERROR: " + err.toString();
                        }
                    }, false, true, function () {
                        if (dyslexiaStatus) {
                            dyslexiaStatus.textContent = "Inactive";
                            dyslexiaStatus.style.color = "inherit";
                        }
                    });
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


    window.Asc.plugin.init = function () {
        window.OnlyDysLogic.loadDictionary().then(() => {
            logger.info('Dictionary loaded, initializing tabs.');
        });

        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                loadTab(button.dataset.tab);
            });
        });

        loadTab('suggestions');
    };

    window.Asc.plugin.button = function (id) {
        this.executeCommand("close", "");
    };

})(window, undefined);
