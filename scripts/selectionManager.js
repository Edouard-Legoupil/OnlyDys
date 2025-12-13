(function (window) {
    'use strict';

    /**
     * Selection Manager
     * Handles extraction and application of text models from ONLYOFFICE.
     */
    const SelectionManager = {

        /**
         * Extracts the current selection as a structured model.
         * returns Promise resolving to model object.
         */
        getCurrentSelectionModel: function () {
            return new Promise((resolve, reject) => {
                window.Asc.plugin.callCommand(function () {
                    var oDocument = Api.GetDocument();
                    var oRange = oDocument.GetSelection();

                    // Simple model Builder
                    var model = { paragraphs: [] };

                    // Iterate paragraphs in selection
                    // Note: This is a simplification. Selection might be partial paragraph.
                    // Accurate run traversal is complex.
                    // We will use Range.ForEach to iterate.

                    oRange.ForEach(function (obj) {
                        if (obj.GetClassType() === "paragraph") {
                            var paraModel = { textRuns: [] };
                            var count = obj.GetElementsCount();
                            for (var i = 0; i < count; i++) {
                                var el = obj.GetElement(i);
                                if (el.GetClassType() === "run") {
                                    var txt = el.GetText();
                                    // Get formatting... el.GetFontName(), etc.
                                    // For now we just get basics or null?
                                    // We need to preserve current formatting!

                                    var format = {
                                        // We can't easily Serialize all format.
                                        // But we can just create new runs with new color and rely on 'Apply' to merge?
                                        // If we delete and re-insert, we lose other formatting unless we read it.
                                        // Strategy: Read Color, Bold, Italic, Size, Font.
                                        bold: el.GetBold(),
                                        italic: el.GetItalic(),
                                        strike: el.GetStrikeout(),
                                        color: el.GetColor(), // R,G,B object or null
                                        fontName: el.GetFontName(),
                                        fontSize: el.GetFontSize()
                                    };

                                    paraModel.textRuns.push({
                                        text: txt,
                                        formatting: format
                                    });
                                }
                            }
                            model.paragraphs.push(paraModel);
                        }
                    });

                    return model;
                }, false, true, function (model) {
                    if (model) {
                        resolve(model);
                    } else {
                        reject("Failed to extract model");
                    }
                });
            });
        },

        /**
         * Applies the processed model back to the document.
         * This replaces the current selection with the new runs.
         */
        applyChanges: function (model) {
            return new Promise((resolve, reject) => {
                // Pass the model as argument
                window.Asc.plugin.callCommand(function () {
                    var model = Asc.scope.model;
                    var oDocument = Api.GetDocument();
                    var oSelection = oDocument.GetSelection(); // Current selection

                    // Safety: Delete content then insert?
                    // Or iterate and replace?
                    // Deleting selection and inserting formatted paragraphs is easiest way to ensure structure matches.
                    // However, this might break if selection was partial paragraph.

                    // Assuming full paragraph processing for MVP stability.
                    oSelection.Delete();

                    // Insert new content
                    // We need to create Paragraphs and Runs.

                    var oParagraphs = [];

                    for (var i = 0; i < model.paragraphs.length; i++) {
                        var pModel = model.paragraphs[i];
                        var oPara = Api.CreateParagraph();

                        for (var j = 0; j < pModel.textRuns.length; j++) {
                            var rModel = pModel.textRuns[j];
                            var oRun = oPara.AddText(rModel.text);

                            // Apply formatting
                            if (rModel.formatting) {
                                if (rModel.formatting.bold) oRun.SetBold(true);
                                if (rModel.formatting.italic) oRun.SetItalic(true);
                                if (rModel.formatting.strike) oRun.SetStrikeout(true);
                                if (rModel.formatting.color) {
                                    // OnlyDys logic provides hex string e.g. "#FF0000"
                                    // Api.CreateColorFromHex(hex)
                                    var hex = rModel.formatting.color;
                                    if (hex && hex.startsWith('#')) hex = hex.substring(1); // remove #
                                    if (hex) {
                                        oRun.SetColor(Api.CreateColorFromHex(hex));
                                    }
                                }
                                if (rModel.formatting.fontSize) oRun.SetFontSize(rModel.formatting.fontSize);
                                if (rModel.formatting.fontName) oRun.SetFontFamily(rModel.formatting.fontName);
                            }
                        }
                        oParagraphs.push(oPara);
                    }

                    // Insert oParagraphs at cursor
                    oDocument.InsertContent(oParagraphs, true); // true = keep selection? or match dest?

                }, false, true, function () {
                    resolve();
                }, { model: model }); // Pass model to scope
            });
        }
    };

    window.SelectionManager = SelectionManager;

})(window);
