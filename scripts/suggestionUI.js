// scripts/ui.js

(function (window) {
    'use strict';

    const ui = {};

    function showPictogramModal(word) {
        const modal = document.getElementById('pictogram-modal');
        const pictogramContainer = document.getElementById('pictogram-container');
        const closeButton = modal.querySelector('.close-button');

        if (!modal || !pictogramContainer || !closeButton) return;

        pictogramContainer.innerHTML = '<span>Chargement du pictogramme...</span>';
        modal.style.display = 'block';

        closeButton.onclick = function () {
            modal.style.display = 'none';
        }
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }

        getPictogramUrl(word).then(url => {
            if (url) {
                pictogramContainer.innerHTML = `<img src="${url}" alt="Pictogramme pour ${word}">`;
            } else {
                pictogramContainer.innerHTML = '<span>Aucun pictogramme trouvé.</span>';
            }
        });
    }

    ui.displaySuggestions = function (suggestions, motSaisi, append = false) {
        if (window.logger) window.logger.info("UI: displaySuggestions called for '" + motSaisi + "' with " + suggestions.length + " items.");

        const container = document.getElementById('suggestions-container');
        if (!container) {
            if (window.logger) window.logger.error("UI: suggestions-container NOT FOUND");
            return;
        }
        if (!append) {
            container.innerHTML = '';
        }
        suggestions.forEach(suggestion => {
            const confusion = window.OnlyDysLogic.classifyConfusion(motSaisi, suggestion);
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.style.borderLeft = `5px solid ${confusion.color}`;

            const confusionIcon = document.createElement('span');
            confusionIcon.className = 'confusion-icon';
            confusionIcon.textContent = confusion.icon;

            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.textContent = suggestion.w;

            const replaceBtn = document.createElement('button');
            replaceBtn.className = 'replace-btn';
            replaceBtn.innerHTML = '🔄'; // Replace icon
            replaceBtn.onclick = (e) => {
                e.stopPropagation();
                window.replaceWordInDocument(motSaisi, suggestion.w);
            };

            const readBtn = document.createElement('button');
            readBtn.className = 'read-btn';
            readBtn.innerHTML = '🔊';
            readBtn.onclick = (e) => {
                e.stopPropagation();
                window.lireMot(suggestion.w);
            };

            const pictogramBtn = document.createElement('button');
            pictogramBtn.className = 'pictogram-btn';
            pictogramBtn.innerHTML = '🖼️'; // Pictogram icon
            pictogramBtn.onclick = (e) => {
                e.stopPropagation();
                showPictogramModal(suggestion.w);
            };

            const illustration = document.createElement('img');
            illustration.className = 'illustration';
            illustration.alt = 'Illustration';
            if (suggestion.i) {
                illustration.src = suggestion.i;
                illustration.style.display = 'block';
            }

            card.appendChild(confusionIcon);
            card.appendChild(wordSpan);
            card.appendChild(replaceBtn);
            card.appendChild(pictogramBtn);
            card.appendChild(readBtn);
            card.appendChild(illustration);
            container.appendChild(card);
        });
    };

    window.replaceWordInDocument = function (wordToReplace, wordToInsert) {
        if (window.logger) window.logger.info("UI: Requesting replacement of '" + wordToReplace + "' with '" + wordToInsert + "'");

        // Delegate to main plugin script which has reliable API access
        if (window.OnlyDys && window.OnlyDys.performReplacement) {
            window.OnlyDys.performReplacement(wordToReplace, wordToInsert);
        } else {
            console.error("OnlyDys.performReplacement not found");
            // Fallback to old search method if API bridge missing?
            // For now, let's stick to the consolidation strategy.
        }
    };

    window.OnlyDysUI = ui;

})(window);
