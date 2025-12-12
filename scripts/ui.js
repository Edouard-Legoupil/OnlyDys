// scripts/ui.js

(function(window) {
    'use strict';

    const ui = {};

    ui.displaySuggestions = function(suggestions, motSaisi, append = false) {
        const container = document.getElementById('suggestions-container');
        if (!container) return;
        if (!append) {
            container.innerHTML = '';
        }
        suggestions.forEach(suggestion => {
            const confusion = window.OnlyDysLogic.classifyConfusion(motSaisi, suggestion);
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.style.borderLeft = `5px solid ${confusion.color}`;
            card.onclick = () => window.replaceCurrentWord(suggestion.w); // Uses the global function

            const confusionIcon = document.createElement('span');
            confusionIcon.className = 'confusion-icon';
            confusionIcon.textContent = confusion.icon;

            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.textContent = suggestion.w;

            const readBtn = document.createElement('button');
            readBtn.className = 'read-btn';
            readBtn.innerHTML = '🔊';
            readBtn.onclick = (e) => {
                e.stopPropagation();
                window.lireMot(suggestion.w);
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
            card.appendChild(readBtn);
            card.appendChild(illustration);
            container.appendChild(card);
        });
    };

    window.replaceCurrentWord = function(wordToInsert) {
        const contentToPaste = wordToInsert + ' ';
        window.Asc.plugin.executeMethod("PasteContent", [contentToPaste]);
    };

    window.OnlyDysUI = ui;

})(window);
