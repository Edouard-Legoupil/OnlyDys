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

        Asc.scope.config = config;

        window.Asc.plugin.callCommand(function () {
            try {
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

                            // Apply scrambling using a robust model-based approach
                            for (var i = 0; i < allParagraphs.length; i++) {
                                var oParagraph = allParagraphs[i];
                                var runsCount = oParagraph.GetElementsCount();
                                var paraModel = { textRuns: [] };

                                // 1. Build a model of the paragraph and scramble text
                                for (var j = 0; j < runsCount; j++) {
                                    var oRun = oParagraph.GetElement(j);
                                    if (oRun.GetClassType() === "run") {
                                        var originalText = oRun.GetText();
                                        paraModel.textRuns.push({
                                            text: scrambleText(originalText),
                                            formatting: {
                                                bold: oRun.GetBold(),
                                                italic: oRun.GetItalic(),
                                                underline: oRun.GetUnderline(),
                                                strikeout: oRun.GetStrikeout(),
                                                fontFamily: oRun.GetFontFamily(),
                                                fontSize: oRun.GetFontSize(),
                                                color: oRun.GetColor() // Returns [r,g,b]
                                            }
                                        });
                                    }
                                }

                                // 2. Rebuild the paragraph from the model
                                oParagraph.RemoveAllElements();
                                for (var k = 0; k < paraModel.textRuns.length; k++) {
                                    var runData = paraModel.textRuns[k];
                                    var oNewRun = Api.CreateRun();
                                    oNewRun.AddText(runData.text);

                                    if (runData.formatting) {
                                        var f = runData.formatting;
                                        if (f.color) {
                                            // GetColor returns an array [r, g, b], SetColor takes r, g, b
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
