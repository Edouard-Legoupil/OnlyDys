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
        }
    }

    function initLinguisticsTab() {
        if (window.ConfigManager) {
            window.ConfigManager.init();
        }

        // Initialize Style logic which is now part of Linguistics tab
        if (window.OnlyDysStyles && window.OnlyDysStyles.displayColorLegend) {
            // Initialize Global Style Toggle
            const styleToggle = document.getElementById('toggle-global-style');
            const styleStatus = document.getElementById('global-style-status');

            if (styleToggle) {
                styleToggle.addEventListener('change', function (e) {
                    if (e.target.checked) {
                        if (window.OnlyDysStyles && window.OnlyDysStyles.applyStyleToDocument) {
                            window.OnlyDysStyles.applyStyleToDocument();
                            if (styleStatus) {
                                styleStatus.textContent = "Enabled";
                                styleStatus.style.color = "green";
                            }
                        }
                    } else {
                        if (window.OnlyDysStyles && window.OnlyDysStyles.revertStyleInDocument) {
                            window.OnlyDysStyles.revertStyleInDocument();
                            if (styleStatus) {
                                styleStatus.textContent = "Disabled";
                                styleStatus.style.color = "inherit";
                            }
                        }
                    }
                });
            }
            window.OnlyDysStyles.displayColorLegend();
        }
        const applyStyleButton = document.getElementById('apply-style-button');
        if (applyStyleButton) {
            applyStyleButton.addEventListener('click', function () {
                if (window.OnlyDysStyles && window.OnlyDysStyles.applyStyleToDocument) {
                    window.OnlyDysStyles.applyStyleToDocument();
                    // Grammar coloring is now handled via the Grammar mode in Linguistics
                }
            });
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
    function initDyslexiaTab() {
        const dyslexiaToggle = document.getElementById('toggle-dyslexia-sim');
        const dyslexiaStatus = document.getElementById('dyslexia-sim-status');

        if (dyslexiaToggle) {
            dyslexiaToggle.addEventListener('change', function (e) {
                if (e.target.checked) {
                    // Activate Simulation - Select All First
                    window.Asc.plugin.callCommand(function () {
                        var oDocument = Api.GetDocument();
                        var oRange = oDocument.GetRange(0, -1); // Get range of entire document
                        oRange.Select();
                    }, false, true, function () {
                        // After selection is complete
                        window.Asc.plugin.executeMethod("GetSelectedText", [], function (text) {
                            if (text && text.length > 0) {
                                // Store original for revert
                                if (window.OnlyDysDyslexia && window.OnlyDysDyslexia.storeOriginal) {
                                    window.OnlyDysDyslexia.storeOriginal(text);
                                }

                                // Process and Paste
                                const processedText = window.OnlyDysDyslexia.processText(text);
                                window.Asc.plugin.executeMethod("PasteContent", [processedText]);

                                if (dyslexiaStatus) {
                                    dyslexiaStatus.textContent = "Active";
                                    dyslexiaStatus.style.color = "green";
                                }
                            } else {
                                // No text found even after Select All?
                                e.target.checked = false;
                                alert("Document appears empty. Please add text to simulate dyslexia.");
                            }
                        });
                    });
                } else {
                    // Deactivate / Revert - Select All First to ensure we replace everything
                    window.Asc.plugin.callCommand(function () {
                        var oDocument = Api.GetDocument();
                        var oRange = oDocument.GetRange(0, -1);
                        oRange.Select();
                    }, false, true, function () {
                        if (window.OnlyDysDyslexia && window.OnlyDysDyslexia.getOriginal) {
                            const original = window.OnlyDysDyslexia.getOriginal();
                            if (original) {
                                window.Asc.plugin.executeMethod("PasteContent", [original]);
                            }
                        }
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
            oDocument.InsertContent([oPara], true);
            var oRange = oPara.GetRange(0, -1);
            oRange.SetHidden(true);
            oRange.SetFontFamily("OpenDyslexic");
            var sFontFamily = oRange.GetFontFamily();
            oPara.Delete();

            return sFontFamily === "OpenDyslexic";
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
                if (fontTabBtn) fontTabBtn.style.display = 'block'; // Show tab if font missing
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
