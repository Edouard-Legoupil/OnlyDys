(function() {
    // Make sure to load the logic file first
    if (!window.OnlyDysLogic) {
        console.error("OnlyDysLogic is not loaded. Make sure code.js is included before this file.");
        return;
    }

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    const handleInput = debounce(() => {
        window.Asc.plugin.executeMethod("GetWordFromPosition", [], function(word) {
            if (word && word.trim().length > 2) {
                window.Asc.plugin.executeMethod("GetSelection", [], function(selection) {
                    const motSaisi = word.trim();
                    let motPrecedent = null;
                    if (selection && selection.end > 0) {
                        const range = Api.GetDocument().GetRange(0, selection.end - motSaisi.length);
                        const text = range.GetText();
                        const words = text.split(/\s+/);
                        motPrecedent = words.length > 1 ? words[words.length - 2] : null;
                    }
                    
                    const suggestions = window.OnlyDysLogic.classerSuggestions(motSaisi, motPrecedent);
                    window.OnlyDysLogic.displaySuggestions(suggestions, motSaisi);
                });
            } else {
                // Clear suggestions if the word is too short
                window.OnlyDysLogic.displaySuggestions([], null);
            }
        });
    }, 300);

    window.Asc.plugin.onIntegrationReady = async function() {
        await window.OnlyDysLogic.loadDictionary();
        window.OnlyDysStyles.displayColorLegend();

        document.getElementById('apply-style-button').addEventListener('click', function() {
            window.OnlyDysStyles.applyStyleToDocument();
            window.OnlyDysStyles.colorCodeDocument();
        });

        window.Asc.plugin.executeMethod("Asc.Api.events.onDocumentContentChange.Add", [handleInput]);
    };

})();
