window.OnlyDysStyles = (function () {

    function applyStyleToDocument() {
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

                // Apply OpenDyslexic formatting to all paragraphs
                // Using direct ApiParagraph methods for OnlyOffice 9.2
                for (var i = 0; i < nParas; i++) {
                    var oPara = oDocument.GetElement(i);
                    if (!oPara) continue;

                    // Fix: Check if element is actually a paragraph before applying styles
                    if (oPara.GetClassType() === "paragraph") {
                        // Apply formatting directly to paragraph
                        // Robust check for SetFontFamily (some versions might need run-level)
                        if (typeof oPara.SetFontFamily === "function") {
                            oPara.SetFontFamily("OpenDyslexic");
                        }
                        oPara.SetFontSize(24); // 12pt in half-points
                        oPara.SetBold(false);
                        oPara.SetSpacingLine(480, "auto"); // 2.0em line height
                        oPara.SetJc("left");
                        oPara.SetSpacing(36); // Letter spacing

                        // Fallback: If paragraph-level font family didn't apply, try runs
                        var runsCount = oPara.GetElementsCount();
                        for (var j = 0; j < runsCount; j++) {
                            var oRun = oPara.GetElement(j);
                            if (oRun && oRun.GetClassType() === "run") {
                                oRun.SetFontFamily("OpenDyslexic");
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
                console.error("Style application failed:", result);
                if (window.logger) window.logger.error(result);
                alert("Failed to apply formatting: " + result);
            } else {
                console.log("Style applied successfully");
                if (window.logger) window.logger.info("Style applied to document");
            }
        });
    }

    function revertStyleInDocument() {
        // Use the native Undo method to precisely restore the previous document state
        // This acts like a "Ctrl+Z" for the formatting changes applied by applyStyleToDocument
        window.Asc.plugin.executeMethod("Undo");

        if (window.logger) window.logger.info("Style reverted using native Undo");
    }



    return {
        applyStyleToDocument,
        revertStyleInDocument
    };
})();
