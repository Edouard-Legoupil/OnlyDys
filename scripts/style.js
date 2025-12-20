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

                    // Apply formatting directly to paragraph
                    oPara.SetFontFamily("OpenDyslexic");
                    oPara.SetFontSize(24); // 12pt in half-points
                    oPara.SetBold(false);
                    oPara.SetSpacingLine(480, "auto"); // 2.0em line height
                    oPara.SetJc("left");
                    oPara.SetSpacing(36); // Letter spacing
                }

                return "SUCCESS";
            } catch (err) {
                return "ERROR: " + err.toString();
            }
        }, false, false, function (result) {
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

                // Revert to default formatting
                for (var i = 0; i < nParas; i++) {
                    var oPara = oDocument.GetElement(i);
                    if (!oPara) continue;

                    // Reset to standard formatting
                    oPara.SetFontFamily("Arial");
                    oPara.SetFontSize(22); // 11pt in half-points
                    oPara.SetBold(false);
                    oPara.SetSpacingLine(240, "auto"); // Default single spacing
                    oPara.SetJc("left");
                    oPara.SetSpacing(0); // Reset letter spacing
                }

                return "SUCCESS";
            } catch (err) {
                return "ERROR: " + err.toString();
            }
        }, false, false, function (result) {
            if (result && typeof result === 'string' && result.indexOf("ERROR") === 0) {
                console.error("Style reversion failed:", result);
                if (window.logger) window.logger.error(result);
                alert("Failed to revert formatting: " + result);
            } else {
                console.log("Style reverted successfully");
                if (window.logger) window.logger.info("Style reverted in document");
            }
        });
    }



    return {
        applyStyleToDocument,
        revertStyleInDocument
    };
})();
