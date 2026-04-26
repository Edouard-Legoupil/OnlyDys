window.OnlyDysStyles = (function () {
    // Store the previous document state for proper restoration
    var previousState = null;
    var currentFont = "OpenDyslexic";
    var isFormatted = false;

    // Available dyslexia-friendly fonts
    var AVAILABLE_FONTS = ["OpenDyslexic", "Luciole", "AccessibleDfA"];

    // Formatting settings with defaults
    var formattingSettings = {
        font: "OpenDyslexic",
        lineHeight: 480, // 2.0em in twips
        lineHeightType: "auto",
        letterSpacing: 36 // in half-points
    };

    function saveOriginalState() {
        // Only save state if we haven't already saved the original
        if (previousState !== null) {
            if (window.logger) window.logger.info("Original state already saved, skipping");
            return;
        }
        
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
                // We'll store in Asc.scope temporarily, then copy to previousState after
                Asc.scope.savedState = [];
                var nParas = oDocument.GetElementsCount();
                
                for (var i = 0; i < nParas; i++) {
                    var oPara = oDocument.GetElement(i);
                    if (oPara && oPara.GetClassType() === "paragraph") {
                        // Get spacingLine which returns {value, type}
                        var spacingLine = oPara.GetSpacingLine ? oPara.GetSpacingLine() : null;
                        
                        Asc.scope.savedState.push({
                            fontFamily: oPara.GetFontFamily ? oPara.GetFontFamily() : null,
                            fontSize: oPara.GetFontSize ? oPara.GetFontSize() : null,
                            spacingLine: spacingLine ? { value: spacingLine.GetValue ? spacingLine.GetValue() : spacingLine.value, type: spacingLine.GetType ? spacingLine.GetType() : spacingLine.type } : null,
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
                                Asc.scope.savedState[i].runs.push({
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
            // Copy saved state from Asc.scope to module variable
            if (Asc.scope.savedState && Array.isArray(Asc.scope.savedState)) {
                previousState = Asc.scope.savedState;
                if (window.logger) window.logger.info("Original state saved: " + previousState.length + " paragraphs");
            }
        });
    }

    function clearSavedState() {
        previousState = null;
        isFormatted = false;
        if (window.logger) window.logger.info("Saved state cleared");
    }

    function applyStyleToDocument(fontName, lineHeight, letterSpacing) {
        // Use provided font or default to current selection
        var fontToApply = fontName || formattingSettings.font;
        
        // Use provided settings or defaults
        var lh = lineHeight !== undefined ? lineHeight : formattingSettings.lineHeight;
        var ls = letterSpacing !== undefined ? letterSpacing : formattingSettings.letterSpacing;
        
        // Update formatting settings
        formattingSettings.font = fontToApply;
        formattingSettings.lineHeight = lh;
        formattingSettings.letterSpacing = ls;
        
        // Save the original state only once (first time formatting is applied)
        if (!isFormatted) {
            saveOriginalState();
            isFormatted = true;
        }
        
        // Pass fontToApply via Asc.scope so it's accessible in the callback
        Asc.scope.fontToApply = fontToApply;
        Asc.scope.lineHeight = lh;
        Asc.scope.letterSpacing = ls;

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

                // Get values from scope
                var fontToApply = Asc.scope.fontToApply || "OpenDyslexic";
                var lineHeight = Asc.scope.lineHeight !== undefined ? Asc.scope.lineHeight : 480;
                var letterSpacing = Asc.scope.letterSpacing !== undefined ? Asc.scope.letterSpacing : 36;

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
                        oPara.SetSpacingLine(lineHeight, "auto"); // Line height
                        oPara.SetJc("left");
                        oPara.SetSpacing(letterSpacing); // Letter spacing

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
                if (window.OnlyDysStyles) {
                    window.OnlyDysStyles.currentFont = fontToApply;
                }

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
                console.log("Style applied successfully with font:", Asc.scope.fontToApply, "lineHeight:", Asc.scope.lineHeight, "letterSpacing:", Asc.scope.letterSpacing);
                if (window.logger) window.logger.info("Style applied to document with font: " + Asc.scope.fontToApply + ", line height: " + Asc.scope.lineHeight + ", letter spacing: " + Asc.scope.letterSpacing);
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
        
        // Pass previousState via Asc.scope so it's accessible in the callback
        Asc.scope.previousState = previousState;

        window.Asc.plugin.callCommand(function () {
            try {
                if (typeof Api === 'undefined') {
                    return "ERROR: Api is not defined";
                }

                var oDocument = Api.GetDocument();
                if (!oDocument) {
                    return "ERROR: Could not get document";
                }

                // Get state from scope
                var states = Asc.scope.previousState || [];
                
                // Restore each paragraph's previous state
                for (var i = 0; i < states.length; i++) {
                    var oPara = oDocument.GetElement(i);
                    if (!oPara || oPara.GetClassType() !== "paragraph") continue;

                    var state = states[i];
                    
                    if (state.fontFamily && typeof oPara.SetFontFamily === "function") {
                        oPara.SetFontFamily(state.fontFamily);
                    }
                    if (state.fontSize !== null) {
                        oPara.SetFontSize(state.fontSize);
                    }
                    if (state.spacingLine !== null && state.spacingLine.value !== undefined) {
                        oPara.SetSpacingLine(state.spacingLine.value, state.spacingLine.type || "auto");
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
                if (window.logger) window.logger.info("Style reverted to original state");
                // Mark as not formatted so next enable will save state again
                isFormatted = false;
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

    function setLineHeight(value, type) {
        formattingSettings.lineHeight = value !== undefined ? value : 480;
        formattingSettings.lineHeightType = type || "auto";
    }

    function setLetterSpacing(value) {
        formattingSettings.letterSpacing = value !== undefined ? value : 36;
    }

    function getFormattingSettings() {
        return {
            font: formattingSettings.font,
            lineHeight: formattingSettings.lineHeight,
            lineHeightType: formattingSettings.lineHeightType,
            letterSpacing: formattingSettings.letterSpacing
        };
    }

    return {
        applyStyleToDocument,
        revertStyleInDocument,
        getCurrentFont,
        setCurrentFont,
        getAvailableFonts,
        setLineHeight,
        setLetterSpacing,
        getFormattingSettings,
        clearSavedState
    };
})();
