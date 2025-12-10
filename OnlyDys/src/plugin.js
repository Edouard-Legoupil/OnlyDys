(function() {
    let dictionary = [];

    async function loadDictionary() {
        try {
            const response = await fetch('data/dictionary.json');
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            dictionary = await response.json();
            console.log('Dictionary loaded successfully:', dictionary.length, 'words');
            // TODO: Enable prediction features now that the dictionary is available
        } catch (error) {
            console.error('Error loading dictionary:', error);
        }
    }

    window.Asc.plugin.onIntegrationReady = function() {
        loadDictionary();
    };
})();
