window.OnlyDysStyles = (function () {
    // Store the previous document state for proper restoration
    var previousState = null;
    var currentFont = "OpenDyslexic";

    // Available dyslexia-friendly fonts
    var AVAILABLE_FONTS = ["OpenDyslexic", "Luciole", "AccessibleDfA"];

    function saveCurrentState() {
        // Save the current state before applying formatting
        window.Asc.plugin.callCommand(function () {
            try {
                if (typeof Api === 'undefined') {
                    return "ERROR: Api is not defined";
                }

                var oDocument = Api.GetDocument();
                if (!oDocument) {
                    return "ERROR: Could not get document";
                }

                // Save state by cloning paragraph formatting info
                previousState = [];
                var nParas = oDocument.GetElementsCount();
                
                for (var i = 0; i < nParas; i++) {
                    var oPara = oDocument.GetElement(i);
                    if (oPara && oPara.GetClassType() === "paragraph") {
                        previousState.push({
                            fontFamily: oPara.GetFontFamily ? oPara.GetFontFamily() : null,
                            fontSize: oPara.GetFontSize ? oPara.GetFontSize() : null,
                            spacingLine: oPara.GetSpacingLine ? oPara.GetSpacingLine() : null,
                            spacing: oPara.GetSpacing ? oPara.GetSpacing() : null,
                            jc: oPara.GetJc ? oPara.GetJc() : null,
                            bold: oPara.GetBold ? oPara.GetBold() : null,
                            runs: []
                        });

                        // Save run-level formatting
                        var runsCount = oPara.GetElementsCount();
                        for (var j = 0; j < runsCount; j++) {
                            var oRun = oPara.GetElement(j);
                            if (oRun && oRun.GetClassType() === "run") {
                                previousState[i].runs.push({
                                    fontFamily: oRun.GetFontFamily ? oRun.GetFontFamily() : null
                                });
                            }
                        }
                    }
                }

                return "SUCCESS";
            } catch (err) {
                return "ERROR: " + err.toString();
            }
        }, false, true, function (result) {
            if (result && typeof result === 'string' && result.indexOf("ERROR") === 0) {
                console.error("Failed to save state:", result);
            }
        });
    }

    function applyStyleToDocument(fontName) {
        // Use provided font or default to current selection
        var fontToApply = fontName || currentFont;
        
        // Save current state before applying
        saveCurrentState();

        window.Asc.plugin.callCommand(function () {
            try {
                if (typeof Api === 'undefined') {
                    return "ERROR: Api is not defined";
                }

                var oDocument = Api.GetDocument();
                if (!oDocument) {
                    return "ERROR: Could not get document";
                }

                var nParas = oDocument.GetElementsCount();
                if (nParas === 0) {
                    return "ERROR: No paragraphs found in document";
                }

                // Apply selected font formatting to all paragraphs
                for (var i = 0; i < nParas; i++) {
                    var oPara = oDocument.GetElement(i);
                    if (!oPara) continue;

                    if (oPara.GetClassType() === "paragraph") {
                        // Apply formatting directly to paragraph
                        if (typeof oPara.SetFontFamily === "function") {
                            oPara.SetFontFamily(fontToApply);
                        }
                        oPara.SetFontSize(24); // 12pt in half-points
                        oPara.SetBold(false);
                        oPara.SetSpacingLine(480, "auto"); // 2.0em line height
                        oPara.SetJc("left");
                        oPara.SetSpacing(36); // Letter spacing

                        // Apply to runs as well for comprehensive coverage
                        var runsCount = oPara.GetElementsCount();
                        for (var j = 0; j < runsCount; j++) {
                            var oRun = oPara.GetElement(j);
                            if (oRun && oRun.GetClassType() === "run") {
                                oRun.SetFontFamily(fontToApply);
                            }
                        }
                    }
                }

                // Update current font
                currentFont = fontToApply;

                return "SUCCESS";
            } catch (err) {
                return "ERROR: " + err.toString();
            }
        }, false, true, function (result) {
            if (result && typeof result === 'string' && result.indexOf("ERROR") === 0) {
                console.error("Style application failed:", result);
                if (window.logger) window.logger.error(result);
                alert("Failed to apply formatting: " + result);
            } else {
                console.log("Style applied successfully with font:", fontToApply);
                if (window.logger) window.logger.info("Style applied to document with font: " + fontToApply);
            }
        });
    }

    function revertStyleInDocument() {
        // Restore the previous state that was saved before formatting
        if (previousState === null) {
            // Fallback to native Undo if no saved state
            window.Asc.plugin.executeMethod("Undo");
            if (window.logger) window.logger.info("Style reverted using native Undo (no saved state)");
            return;
        }

        window.Asc.plugin.callCommand(function () {
            try {
                if (typeof Api === 'undefined') {
                    return "ERROR: Api is not defined";
                }

                var oDocument = Api.GetDocument();
                if (!oDocument) {
                    return "ERROR: Could not get document";
                }

                // Restore each paragraph's previous state
                for (var i = 0; i < previousState.length; i++) {
                    var oPara = oDocument.GetElement(i);
                    if (!oPara || oPara.GetClassType() !== "paragraph") continue;

                    var state = previousState[i];
                    
                    if (state.fontFamily && typeof oPara.SetFontFamily === "function") {
                        oPara.SetFontFamily(state.fontFamily);
                    }
                    if (state.fontSize !== null) {
                        oPara.SetFontSize(state.fontSize);
                    }
                    if (state.spacingLine !== null) {
                        oPara.SetSpacingLine(state.spacingLine.value, state.spacingLine.type);
                    }
                    if (state.spacing !== null) {
                        oPara.SetSpacing(state.spacing);
                    }
                    if (state.jc !== null) {
                        oPara.SetJc(state.jc);
                    }
                    if (state.bold !== null) {
                        oPara.SetBold(state.bold);
                    }

                    // Restore run-level formatting
                    var runsCount = oPara.GetElementsCount();
                    for (var j = 0; j < Math.min(runsCount, state.runs.length); j++) {
                        var oRun = oPara.GetElement(j);
                        if (oRun && oRun.GetClassType() === "run" && state.runs[j]) {
                            if (state.runs[j].fontFamily) {
                                oRun.SetFontFamily(state.runs[j].fontFamily);
                            }
                        }
                    }
                }

                return "SUCCESS";
            } catch (err) {
                return "ERROR: " + err.toString();
            }
        }, false, true, function (result) {
            if (result && typeof result === 'string' && result.indexOf("ERROR") === 0) {
                console.error("Style reversion failed:", result);
                if (window.logger) window.logger.error(result);
                // Fallback to Undo
                window.Asc.plugin.executeMethod("Undo");
            } else {
                console.log("Style reverted successfully");
                if (window.logger) window.logger.info("Style reverted to previous state");
            }
        });
    }

    function getCurrentFont() {
        return currentFont;
    }

    function setCurrentFont(fontName) {
        if (AVAILABLE_FONTS.indexOf(fontName) !== -1) {
            currentFont = fontName;
        }
    }

    function getAvailableFonts() {
        return AVAILABLE_FONTS;
    }

    return {
        applyStyleToDocument,
        revertStyleInDocument,
        getCurrentFont,
        setCurrentFont,
        getAvailableFonts
    };
})();
