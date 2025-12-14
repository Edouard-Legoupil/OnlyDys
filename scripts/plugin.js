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

    // --- INLINED ENGINES START ---
    // We inline these to avoid fetch/CORS issues in some environments

    const LINGUISTIC_ENGINE_SOURCE = `
    (function (window) {
        'use strict';
        const VOWELS = ["a", "à", "â", "e", "é", "è", "ê", "ë", "i", "î", "ï", "o", "ô", "u", "ù", "û", "ü", "y", "œ", "æ"];
        const VOWEL_REGEX = new RegExp(VOWELS.join("|"), "i");
        const MULTI_PHONEMES = ["eau", "eaux", "ain", "aim", "ein", "eim", "ien", "oin", "on", "om", "an", "am", "en", "em", "in", "im", "yn", "ym", "ou", "oi", "ai", "ei", "au", "ch", "ph", "th", "gn", "qu", "gu", "ill"];
        const SILENT_ENDINGS = ["ent", "es", "e", "s", "t", "d", "p", "x"];
        
        const LinguisticEngine = {
            normalizeFrench: function (text) { if (!text) return ""; return text.toLowerCase().normalize("NFC"); },
            isVowel: function (char) { return VOWELS.includes(char.toLowerCase()); },
            isConsonant: function (char) { return !this.isVowel(char) && /[a-zàâçéèêëîïôùûüœæ]/i.test(char); },
            isPunctuation: function (char) { return /\\p{P}/u.test(char); },
            tokenizeWords: function (text) { return text.match(/\\p{L}+['’-]?\\p{L}*/gu) || []; },
            segmentPhonemes: function (word) {
                const normalizedWord = this.normalizeFrench(word);
                const phonemes = [];
                let i = 0;
                while (i < normalizedWord.length) {
                    let matched = false;
                    for (const p of MULTI_PHONEMES) {
                        if (normalizedWord.startsWith(p, i)) {
                            const isNasalCandidate = (p.endsWith("n") || p.endsWith("m")) && p.length <= 4 && !["gn"].includes(p);
                            if (isNasalCandidate) {
                                const nextChar = normalizedWord[i + p.length];
                                if (nextChar) {
                                    if (this.isVowel(nextChar)) continue;
                                    if (nextChar === 'n' || nextChar === 'm') continue;
                                }
                            }
                            phonemes.push(p); i += p.length; matched = true; break;
                        }
                    }
                    if (!matched) { phonemes.push(normalizedWord[i]); i++; }
                }
                return phonemes;
            },
            segmentSyllables: function (word) {
                const phonemes = this.segmentPhonemes(word);
                const syllables = [];
                let current = [];
                for (let i = 0; i < phonemes.length; i++) {
                    current.push(phonemes[i]);
                    if (VOWEL_REGEX.test(phonemes[i])) {
                        const next = phonemes[i + 1];
                        const nextNext = phonemes[i + 2];
                        if (next && !VOWEL_REGEX.test(next)) {
                            if (nextNext && !VOWEL_REGEX.test(nextNext)) { current.push(next); i++; syllables.push(current); current = []; }
                            else { syllables.push(current); current = []; }
                        } else { syllables.push(current); current = []; }
                    }
                }
                if (current.length) {
                    if (syllables.length > 0) {
                        const currentHasVowel = current.some(p => VOWEL_REGEX.test(p));
                        if (!currentHasVowel) syllables[syllables.length - 1] = syllables[syllables.length - 1].concat(current);
                        else syllables.push(current);
                    } else syllables.push(current);
                }
                return syllables.map(s => s.join(""));
            },
            detectSilentLetters: function (word) {
                if (!word) return [];
                const silentIndexes = [];
                const lower = word.toLowerCase();
                for (const end of SILENT_ENDINGS) {
                    if (lower.endsWith(end) && lower.length > end.length) {
                        const startIndex = lower.length - end.length;
                        for (let i = startIndex; i < lower.length; i++) {
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
        window.LinguisticEngine = LinguisticEngine;
    })(window);
    `;

    const COLORIZATION_ENGINE_SOURCE = `
    (function (window) {
        'use strict';
        const ColorizationEngine = {
            palettes: {
                phonemes: ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#000000"],
                syllables: ["#D55E00", "#0072B2"],
                words: ["#000000", "#555555"],
                lines: ["#000000", "#0072B2"],
                vowels: "#D55E00", consonants: "#0072B2", silent: "#999999", punctuation: "#CC79A7",
                grammar: { 'NOM': '#D55E00', 'VER': '#0072B2', 'ADJ': '#56B4E9', 'ADV': '#009E73', 'PRO': '#E69F00', 'DET': '#CC79A7', 'PRE': '#000000', 'CON': '#999999', 'INT': '#F0E442' }
            },
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
                    newRuns.push({ text: text, formatting: { ...run.formatting, color: color || run.formatting.color, ...extraFormatting } });
                };
                if (config.mode === 'grammar') {
                    const words = originalText.split(/(\\P{L}+)/u);
                    words.forEach(token => {
                        if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                        const lowerWord = token.toLowerCase();
                        const grammar = wordMap ? wordMap.get(lowerWord) : null;
                        let color = null;
                        if (grammar && this.palettes.grammar[grammar]) color = this.palettes.grammar[grammar];
                        addSegment(token, color);
                    });
                } else if (config.mode === 'phonemes') {
                    const words = originalText.split(/(\\P{L}+)/u);
                    words.forEach(token => {
                        if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                        const analysis = engine.analyzeWord(token);
                        analysis.phonemes.forEach((p, idx) => {
                            const colorIndex = Math.abs(this.hashCode(p.toLowerCase())) % this.palettes.phonemes.length;
                            const color = this.palettes.phonemes[colorIndex];
                            addSegment(p, color);
                        });
                    });
                } else if (config.mode === 'syllables') {
                    const words = originalText.split(/(\\P{L}+)/u);
                    words.forEach(token => {
                        if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                        const syllables = engine.segmentSyllables(token);
                        syllables.forEach((s, idx) => {
                            const color = this.palettes.syllables[idx % 2];
                            addSegment(s, color);
                        });
                    });
                } else if (config.mode === 'silent') {
                    const words = originalText.split(/(\\P{L}+)/u);
                    words.forEach(token => {
                        if (engine.isPunctuation(token) || /^\\s+$/.test(token) || token === "") { addSegment(token, null); return; }
                        const silentIndices = engine.detectSilentLetters(token);
                        if (silentIndices.length === 0) { addSegment(token, null); }
                        else {
                            let lastIdx = 0;
                            for (let i = 0; i < token.length; i++) {
                                if (silentIndices.includes(i)) {
                                    if (i > lastIdx) addSegment(token.substring(lastIdx, i), null);
                                    addSegment(token[i], this.palettes.silent);
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
                let hash = 0;
                for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
                return hash;
            }
        };
        window.ColorizationEngine = ColorizationEngine;
    })(window);
    `;
    // --- INLINED ENGINES END ---

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

        // We need the engine available locally for the preview (it's inlined in the Window too by the eval string)
        // But since we are in plugin.js scope (window), we need to eval or use if available.
        // Actually, logic is in Window scope from earlier/other contexts? No.
        // We defined LINGUISTIC_ENGINE_SOURCE as a string. We need to eval it locally if not present.

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
                eval(Asc.scope.linguisticScript);
                eval(Asc.scope.colorizationScript);

                var oDocument = Api.GetDocument();

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
                                    fontSize: oRun.GetFontSize()
                                }
                            });
                        }
                    }

                    var processedModel = ColorizationEngine.processModel({ paragraphs: [paraModel] }, Asc.scope.config);

                    oElement.RemoveAllElements();

                    var pData = processedModel.paragraphs[0];
                    for (var rIdx = 0; rIdx < pData.textRuns.length; rIdx++) {
                        var runData = pData.textRuns[rIdx];
                        var oRun = Api.CreateRun();
                        oRun.AddText(runData.text);

                        if (runData.formatting) {
                            var f = runData.formatting;
                            if (f.color) {
                                oRun.SetColor(
                                    parseInt(f.color.slice(1, 3), 16),
                                    parseInt(f.color.slice(3, 5), 16),
                                    parseInt(f.color.slice(5, 7), 16)
                                );
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
                    // In a real "current word" scenario we might want a different method, 
                    // but GetSelectedText is often used if the user selects nothing it might return current word or empty.
                    // If return is empty, we might not want to clear everything immediately if we want to be persistent,
                    // but for "on the go" usually implies acting on selection or cursor context. 
                    // For now we rely on GetSelectedText.
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

                // FIX: Automatically fetch selection when entering Selection mode
                window.Asc.plugin.executeMethod("GetSelectedText", [], function (text) {
                    if (text) {
                        document.getElementById('textarea').innerText = text;
                        processSuggestions(text);
                    }
                });
            }
        }

        // Event Listeners for Mode Switch
        modeRadios.forEach(radio => {
            radio.addEventListener('change', updateMode);
        });

        // Initialize default state
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
        // Logic for the font tab will be added in the next step
        const checkFontButton = document.getElementById('check-font-button');
        if (checkFontButton) {
            checkFontButton.addEventListener('click', function () {
                // Re-run the font check
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
                if (e.target.checked) {
                    // Activate Simulation - Full Document In-Place
                    window.Asc.plugin.callCommand(function () {
                        try {
                            var oDocument = Api.GetDocument();

                            // Recursive Helper
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
                                                // Recurse Cell as container
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

                            // Inner function for scrambling
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

                            // Apply scrambling
                            for (var i = 0; i < allParagraphs.length; i++) {
                                var oParagraph = allParagraphs[i];
                                var runsCount = oParagraph.GetElementsCount();
                                for (var j = 0; j < runsCount; j++) {
                                    var oElement = oParagraph.GetElement(j);
                                    if (oElement.GetClassType() === "run") {
                                        var originalText = oElement.GetText();
                                        oElement.SetText(scrambleText(originalText));
                                    }
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
                    // Deactivate / Revert - Using Undo() which is safer for in-place edits than replacing all text
                    // Assuming the user hasn't done massive edits in between.
                    window.Asc.plugin.callCommand(function () {
                        Api.asc_Undo();
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
            // Safer check: Push to end, check, remove from end.
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
                // Always clean up
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


    // The main entry point for the plugin
    window.Asc.plugin.init = function () {
        window.OnlyDysLogic.loadDictionary().then(() => {
            // Dictionary loaded, you can now enable UI elements that depend on it.
            logger.info('Dictionary loaded, initializing tabs.');
        });

        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                loadTab(button.dataset.tab);
            });
        });

        // Load the suggestions tab by default
        loadTab('suggestions');
    };

    // Handle plugin button click to close the plugin
    window.Asc.plugin.button = function (id) {
        this.executeCommand("close", "");
    };

})(window, undefined);
