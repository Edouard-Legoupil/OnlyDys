(function(window, undefined){

    // Function to debounce calls to the suggestion logic
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // The function that handles input changes in the document
    const handleInput = debounce(() => {
        // Get the word at the current cursor position
        window.Asc.plugin.executeMethod("GetWordFromPosition", [], function(word) {
            if (word && word.trim().length > 2) {
                const motSaisi = word.trim();
                // Getting the preceding word is complex.
                // For now, we'll proceed without it to ensure the plugin loads.
                let motPrecedent = null;

                const suggestions = window.OnlyDysLogic.classerSuggestions(motSaisi, motPrecedent);
                window.OnlyDysLogic.displaySuggestions(suggestions, motSaisi);
            } else {
                // Clear suggestions if the word is too short or empty
                window.OnlyDysLogic.displaySuggestions([], null);
            }
        });
    }, 300); // 300ms debounce delay

    // Function to handle text selection changes
    const handleSelectionChange = debounce(() => {
        window.Asc.plugin.executeMethod("GetSelectedText", [], function(text) {
            if (text && text.trim().length > 2) {
                const motSaisi = text.trim();
                let motPrecedent = null; // Précédent word logic might be complex here as well

                const suggestions = window.OnlyDysLogic.classerSuggestions(motSaisi, motPrecedent);
                window.OnlyDysLogic.displaySuggestions(suggestions, motSaisi);
            }
        });
    }, 300);

    // Function to load tab content
    async function loadTab(tabName) {
        const tabContent = document.getElementById('tab-content');
        if (!tabContent) return;

        // Remove the suggestions listener before switching tabs
        window.Asc.plugin.executeMethod("Asc.Api.events.onDocumentContentChange.Remove", [handleInput]);
        // Also remove the selection change listener
        window.Asc.plugin.executeMethod("Asc.Api.events.onDocumentSelectionChange.Remove", [handleSelectionChange]);

        try {
            const response = await fetch(`${tabName}.html`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            tabContent.innerHTML = await response.text();

            // Initialize the specific tab's functionality
            if (tabName === 'suggestions') {
                initSuggestionsTab();
            } else if (tabName === 'style') {
                initStyleTab();
            } else if (tabName === 'font') {
                initFontTab();
            } else if (tabName === 'dyslexia') {
                initDyslexiaTab();
            }

        } catch (error) {
            console.error('Error loading tab:', error);
            tabContent.innerHTML = '<p>Error loading content.</p>';
        }
    }

    function initSuggestionsTab() {
        // Add the event listener for document content changes for the suggestions tab
        window.Asc.plugin.executeMethod("Asc.Api.events.onDocumentContentChange.Add", [handleInput]);
        // Add the event listener for document selection changes
        window.Asc.plugin.executeMethod("Asc.Api.events.onDocumentSelectionChange.Add", [handleSelectionChange]);
    }

    function initStyleTab() {
        // Display the color legend and add event listener for the style button
        if (window.OnlyDysStyles && window.OnlyDysStyles.displayColorLegend) {
            window.OnlyDysStyles.displayColorLegend();
        }
        const applyStyleButton = document.getElementById('apply-style-button');
        if (applyStyleButton) {
            applyStyleButton.addEventListener('click', function() {
                if (window.OnlyDysStyles && window.OnlyDysStyles.applyStyleToDocument && window.OnlyDysStyles.colorCodeDocument) {
                    window.OnlyDysStyles.applyStyleToDocument();
                    window.OnlyDysStyles.colorCodeDocument();
                }
            });
        }
    }

    function initFontTab() {
        // Logic for the font tab will be added in the next step
        const checkFontButton = document.getElementById('check-font-button');
        if (checkFontButton) {
            checkFontButton.addEventListener('click', function() {
                // Re-run the font check
                checkFont();
            });
        }
        checkFont();
    }
    function initDyslexiaTab() {
        const dyslexiaButton = document.getElementById('dyslexia-button');
        if (dyslexiaButton) {
            dyslexiaButton.addEventListener('click', function() {
                window.Asc.plugin.executeMethod("GetSelectedText", [], function(text) {
                    if (text) {
                        const processedText = window.OnlyDysDyslexia.processText(text);
                        window.Asc.plugin.executeMethod("PasteContent", [processedText]);
                    }
                });
            });
        }
    }

    function checkFont() {
        window.Asc.plugin.callCommand(function() {
            var oDocument = Api.GetDocument();
            var oPara = Api.CreateParagraph();
            oPara.AddText("font check");
            oDocument.InsertContent([oPara], true);
            var oRange = oPara.GetRange(0, -1);
            oRange.SetHidden(true);
            oRange.SetFontFamily("OpenDyslexic");
            var sFontFamily = oRange.GetFontFamily();
            oPara.Delete();

            var fontStatus = document.getElementById('font-status');
            if (sFontFamily === "OpenDyslexic") {
                fontStatus.innerHTML = '<p style="color: green;">The "OpenDyslexic" font is correctly installed and active.</p>';
                document.getElementById('font-instructions').style.display = 'none';
            } else {
                fontStatus.innerHTML = '<p style="color: red;">The "OpenDyslexic" font is not installed. Please follow the instructions below.</p>';
                document.getElementById('font-instructions').style.display = 'block';
            }
        }, false, true);
    }


    // The main entry point for the plugin
    window.Asc.plugin.init = async function() {
        await window.OnlyDysLogic.loadDictionary();

        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                loadTab(button.dataset.tab);
            });
        });

        // Load the suggestions tab by default
        loadTab('suggestions');
    };

    // Handle plugin button click to close the plugin
    window.Asc.plugin.button = function(id) {
        this.executeCommand("close", "");
    };

})(window, undefined);
