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
    var ColorizationEngine = {
        palettes: {
            phonemes: ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#000000"],
            syllables: ["#D55E00", "#0072B2"],
            words: ["#000000", "#0072B2"],
            lines: ["#000000", "#0072B2"],
            vowels: "#CC79A7", consonants: "#0072B2", silent: "#999999", punctuation: "#CC79A7",
            letters: ["#E69F00", "#56B4E9", "#009E73", "#F0E442"],
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
                for (var key in run.formatting) { formatting[key] = run.formatting[key]; }
                formatting.color = (color === undefined) ? run.formatting.color : color;
                for (var key in extraFormatting) { formatting[key] = extraFormatting[key]; }
                newRuns.push({ text: text, formatting: formatting });
            };
            if (config.mode === 'grammar') {
                var words = originalText.split(/(\\P{L}+)/u);
                words.forEach(function(token) {
                    if (!token) return;
                    if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                    var lowerWord = token.toLowerCase();
                    var grammar = wordMap ? wordMap.get(lowerWord) : null;
                    var color = null;
                    if (grammar && ColorizationEngine.palettes.grammar[grammar]) color = ColorizationEngine.palettes.grammar[grammar];
                    addSegment(token, color);
                });
            } else if (config.mode === 'phonemes' || config.mode === 'alternphonemes') {
                var words = originalText.split(/(\\P{L}+)/u);
                var phonemeCount = 0;
                words.forEach(function(token) {
                    if (!token) return;
                    if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                    try {
                        var analysis = engine.analyzeWord(token);
                        if (!analysis || !analysis.phonemes) { addSegment(token, null); return; }
                        analysis.phonemes.forEach(function(p, idx) {
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
                var words = originalText.split(/(\\P{L}+)/u);
                words.forEach(function(token) {
                    if (!token) return;
                    if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                    try {
                        var syllables = engine.segmentSyllables(token);
                        if (!syllables) { addSegment(token, null); return; }
                        syllables.forEach(function(s, idx) {
                            var color = ColorizationEngine.palettes.syllables[idx % ColorizationEngine.palettes.syllables.length];
                            addSegment(s, color);
                        });
                    } catch (e) { addSegment(token, null); }
                });
            } else if (config.mode === 'alternlettres') {
                var letterCount = 0;
                for (var i = 0; i < originalText.length; i++) {
                    var char = originalText.charAt(i);
                    if (engine.isPunctuation(char) || /^\\s$/.test(char)) { addSegment(char, null); }
                    else {
                        var color = ColorizationEngine.palettes.letters[letterCount % ColorizationEngine.palettes.letters.length];
                        addSegment(char, color);
                        letterCount++;
                    }
                }
            } else if (config.mode === 'alternmots') {
                var words = originalText.split(/(\\s+)/u);
                var wordIdx = 0;
                words.forEach(function(token) {
                    if (/^\\s+$/.test(token) || token === "") { addSegment(token, null); }
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
                var words = originalText.split(/(\\P{L}+)/u);
                words.forEach(function(token) {
                    if (!token) return;
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

    let lastActionWasColorization = false;

    function initLinguisticsTab() {
        initDyslexiaTab();
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
                    applyLinguisticsToDocument(); // Will trigger Undo
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
                    applyLinguisticsToDocument();
                    updateInterfaceVisibility();
                    updateLingPreview();
                });

                label.appendChild(input);
                label.appendChild(document.createTextNode(' ' + m.label));
                modeRadiosContainer.appendChild(label);
            });

            applyLinguisticsToDocument();
            updateInterfaceVisibility();
            updateLingPreview();
        }

        document.getElementById('opt-arcs')?.addEventListener('change', function () {
            applyLinguisticsToDocument();
            updateLingPreview();
        });
        document.getElementById('opt-silent')?.addEventListener('change', function () {
            applyLinguisticsToDocument();
            updateLingPreview();
        });
        document.getElementById('ling-target-letters')?.addEventListener('input', function () {
            applyLinguisticsToDocument();
            updateLingPreview();
        });

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

    function applyLinguisticsToDocument() {
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
                useHighlighting: document.getElementById('opt-highlighting')?.checked || false
            };

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
                            phonemes: ["#A60628", "#0047AB", "#006B3C", "#AA3300", "#006994", "#663300", "#8B008B", "#000000"],
                            syllables: ["#A60628", "#0047AB"],
                            words: ["#000000", "#0047AB"],
                            lines: ["#000000", "#0047AB"],
                            vowels: "#6D214F", consonants: "#0047AB", silent: "#606060", punctuation: "#6D214F",
                            letters: ["#A60628", "#0047AB", "#006B3C", "#AA3300"],
                            grammar: {
                                'NOM': '#A60628', 'VER': '#0047AB', 'ADJ': '#006994', 'ADV': '#006B3C',
                                'PRO': '#AA3300', 'DET': '#6D214F', 'PRE': '#000000', 'CON': '#663300', 'INT': '#8B008B'
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
