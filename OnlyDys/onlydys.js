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
                const suggestions = window.OnlyDysLogic.trouverSuggestions(word.trim());
                window.OnlyDysLogic.displaySuggestions(suggestions);
            } else {
                // Clear suggestions if the word is too short
                window.OnlyDysLogic.displaySuggestions([]);
            }
        });
    }, 300);

    window.Asc.plugin.onIntegrationReady = async function() {
        await window.OnlyDysLogic.loadDictionary();
        window.Asc.plugin.executeMethod("Asc.Api.events.onDocumentContentChange.Add", [handleInput]);
    };

})();
