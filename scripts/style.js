window.OnlyDysStyles = (function () {
    const GRAMMAR_COLOR_MAP = {
        'NOM': '#D55E00', // Vermilion
        'VER': '#0072B2', // Blue
        'ADJ': '#56B4E9', // Sky Blue
        'ADV': '#009E73', // Bluish Green
        'PRO': '#E69F00', // Orange
        'DET': '#CC79A7', // Reddish Purple
        'PRE': '#000000', // Black
        'CON': '#999999', // Grey
        'INT': '#F0E442', // Yellow
    };

    function applyStyleToDocument() {
        window.Asc.plugin.callCommand(function () {
            var oDocument = Api.GetDocument();

            // Check if font exists
            var oPara = Api.CreateParagraph();
            oPara.AddText("font check");
            oDocument.InsertContent([oPara], true);
            var oRange = oPara.GetRange(0, -1);
            oRange.SetHidden(true);
            oRange.SetFontFamily("OpenDyslexic");
            var sFontFamily = oRange.GetFontFamily();
            oPara.Delete();

            if (sFontFamily !== "OpenDyslexic") {
                alert("The OpenDyslexic font is not installed on your system. The styles will be applied, but the font will not be changed.");
            }

            var nParas = oDocument.GetElementsCount();

            // Define styles for body
            var bodyParaPr = Api.CreateParaPr();
            // 2.0em line height for 12pt font = 24pt. In twentieths of a point: 24 * 20 = 480
            bodyParaPr.SetSpacingLine(480, "auto");
            bodyParaPr.SetJc("left");

            var bodyCharPr = Api.CreateCharPr();
            bodyCharPr.SetFontFamily("OpenDyslexic");
            bodyCharPr.SetFontSize(24); // 12pt (in half-points)
            bodyCharPr.SetBold(false);
            // Letter spacing: 0.15em of 12pt = 1.8pt. In twentieths of a point: 1.8 * 20 = 36
            bodyCharPr.SetSpacing(36);

            // Define styles for headline
            var headlineParaPr = Api.CreateParaPr();
            headlineParaPr.SetJc("left");
            // Line height for headlines: 1.2em * 30pt = 36pt. 36 * 20 = 720
            headlineParaPr.SetSpacingLine(720, "auto");

            var headlineCharPr = Api.CreateCharPr();
            headlineCharPr.SetFontFamily("OpenDyslexic");
            headlineCharPr.SetFontSize(60); // 30pt (2.5 * 12pt)
            headlineCharPr.SetBold(true);
            // Letter spacing: 0.1em of 30pt = 3pt. In twentieths of a point: 3 * 20 = 60
            headlineCharPr.SetSpacing(60);

            for (var i = 0; i < nParas; i++) {
                var oPara = oDocument.GetElement(i);
                var paraPr = oPara.GetParaPr();
                if (paraPr) {
                    var sStyleName = paraPr.GetStyleName();
                    if (sStyleName && (sStyleName.startsWith("Heading") || sStyleName.startsWith("heading"))) {
                        oPara.SetParaPr(headlineParaPr);
                        oPara.GetRange(0, -1).SetCharPr(headlineCharPr);
                    } else {
                        oPara.SetParaPr(bodyParaPr);
                        oPara.GetRange(0, -1).SetCharPr(bodyCharPr);
                    }
                }
            }
        }, false, true);
    }

    // colorCodeDocument moved to ColorizationEngine under mode 'grammar'

    function revertStyleInDocument() {
        window.Asc.plugin.callCommand(function () {
            var oDocument = Api.GetDocument();
            var nParas = oDocument.GetElementsCount();

            // Default style properties to revert to (Simplified)
            // Ideally we would revert to the style definition, but setting hard values works for "undoing" our hard overrides.

            var bodyParaPr = Api.CreateParaPr();
            bodyParaPr.SetSpacingLine(240, "auto"); // Default single spacing roughly
            bodyParaPr.SetJc("left");

            var bodyCharPr = Api.CreateCharPr();
            bodyCharPr.SetFontFamily("Arial"); // Revert to a standard safe font
            bodyCharPr.SetFontSize(22); // 11pt default
            bodyCharPr.SetBold(false);
            bodyCharPr.SetSpacing(0); // Reset letter spacing

            for (var i = 0; i < nParas; i++) {
                var oPara = oDocument.GetElement(i);
                var paraPr = oPara.GetParaPr();

                // We only revert if it looks like we touched it? 
                // Or we just force reset for consistency if the user asks to "Disable".
                // Let's force reset to "Normal" style approximations.

                // We could check if Font is OpenDyslexic, but simplistic revert is safer for "OFF" switch.

                // Resetting to the paragraph's style default would be better but API might require explicit Set.
                // We will apply the "Standard" look we defined above.

                // Note: This overrides headings too if we aren't careful.
                // Let's just try to reset the specific properties we changed.

                oPara.SetParaPr(bodyParaPr);
                var oRange = oPara.GetRange(0, -1);
                oRange.SetCharPr(bodyCharPr);
            }
        }, false, true);
    }

    function displayColorLegend() {
        const legendContainer = document.getElementById('color-legend');
        if (!legendContainer) return;
        legendContainer.innerHTML = '';
        for (const [grammar, color] of Object.entries(GRAMMAR_COLOR_MAP)) {
            const item = document.createElement('div');
            item.className = 'legend-item';

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = color;

            const label = document.createElement('span');
            label.textContent = grammar;

            item.appendChild(colorBox);
            item.appendChild(label);
            legendContainer.appendChild(item);
        }
    }

    return {
        applyStyleToDocument,
        revertStyleInDocument,
        displayColorLegend,
    };
})();
