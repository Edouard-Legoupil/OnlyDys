(function(window, undefined){

    // Function to debounce calls to the suggestion logic
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // The main entry point for the plugin
    window.Asc.plugin.init = async function() {
        // Load the dictionary as soon as the plugin is initialized
        await window.OnlyDysLogic.loadDictionary();

        // Display the color legend from the styles script
        if (window.OnlyDysStyles && window.OnlyDysStyles.displayColorLegend) {
            window.OnlyDysStyles.displayColorLegend();
        }

        // Add event listener for the style application button
        const applyStyleButton = document.getElementById('apply-style-button');
        if (applyStyleButton) {
            applyStyleButton.addEventListener('click', function() {
                if (window.OnlyDysStyles && window.OnlyDysStyles.applyStyleToDocument && window.OnlyDysStyles.colorCodeDocument) {
                    window.OnlyDysStyles.applyStyleToDocument();
                    window.OnlyDysStyles.colorCodeDocument();
                }
            });
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

        // Add the event listener for document content changes
        window.Asc.plugin.executeMethod("Asc.Api.events.onDocumentContentChange.Add", [handleInput]);
    };

    // Handle plugin button click to close the plugin
    window.Asc.plugin.button = function(id) {
        this.executeCommand("close", "");
    };

})(window, undefined);
