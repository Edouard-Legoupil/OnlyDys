// scripts/ui.js

(function(window) {
    'use strict';

    const ui = {};

    function showPictogramModal(word) {
        const modal = document.getElementById('pictogram-modal');
        const pictogramContainer = document.getElementById('pictogram-container');
        const closeButton = modal.querySelector('.close-button');

        if (!modal || !pictogramContainer || !closeButton) return;

        pictogramContainer.innerHTML = '<span>Chargement du pictogramme...</span>';
        modal.style.display = 'block';

        closeButton.onclick = function() {
            modal.style.display = 'none';
        }
        window.onclick = function(event) {
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

            const replaceBtn = document.createElement('button');
            replaceBtn.className = 'replace-btn';
            replaceBtn.innerHTML = '🔄'; // Replace icon
            replaceBtn.onclick = (e) => {
                e.stopPropagation();
                window.replaceWordInDocument(motSaisi, suggestion.w);
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
            card.appendChild(readBtn);
            card.appendChild(replaceBtn);
            card.appendChild(pictogramBtn);
            card.appendChild(illustration);
            container.appendChild(card);
        });
    };

    window.replaceWordInDocument = function(wordToReplace, wordToInsert) {
        window.Asc.plugin.executeMethod("Search", [{searchString: wordToReplace, matchCase: false}], function(ranges) {
            if (ranges.length > 1) {
                window.Asc.plugin.showQuestionWindow(
                    "replace-all-question",
                    `"${wordToReplace}" was found ${ranges.length} times. Do you want to replace all occurrences?`,
                    ["Replace All", "Replace First", "Cancel"],
                    function(answer) {
                        if (answer === "Replace All") {
                            window.Asc.plugin.executeMethod("SearchAndReplace", [{
                                searchString: wordToReplace,
                                replaceString: wordToInsert,
                                matchCase: false,
                                replaceAll: true
                            }]);
                        } else if (answer === "Replace First") {
                             window.Asc.plugin.executeMethod("SearchAndReplace", [{
                                searchString: wordToReplace,
                                replaceString: wordToInsert,
                                matchCase: false,
                                replaceAll: false
                            }]);
                        }
                    }
                );
            } else {
                window.Asc.plugin.executeMethod("SearchAndReplace", [{
                    searchString: wordToReplace,
                    replaceString: wordToInsert,
                    matchCase: false,
                    replaceAll: false
                }]);
            }
        });
    };

    window.OnlyDysUI = ui;

})(window);
