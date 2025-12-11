window.OnlyDysStyles = (function() {
    const GRAMMAR_COLOR_MAP = {
        'NOM': '#E63946', // Red
        'VER': '#457B9D', // Blue
        'ADJ': '#A8DADC', // Cyan
        'ADV': '#98FB98', // PaleGreen
        'PRO': '#1D3557', // Dark Blue
        'DET': '#F4A261', // Orange
        'PRE': '#E76F51', // Dark Orange
        'CON': '#2A9D8F', // Teal
        'INT': '#E9C46A', // Yellow
    };

    function applyStyleToDocument() {
        window.Asc.plugin.callCommand(function() {
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

    function colorCodeDocument() {
        window.Asc.plugin.callCommand(function() {
            var oDocument = Api.GetDocument();
            var dictionary = window.OnlyDysLogic.dictionary || [];
            var wordMap = new Map(dictionary.map(entry => [entry.w.toLowerCase(), entry.g]));

            var nParas = oDocument.GetElementsCount();
            for (var i = 0; i < nParas; i++) {
                var oPara = oDocument.GetElement(i);
                var sParaText = oPara.GetText();
                // Regex to split text into words and punctuation
                var words = sParaText.match(/[\w']+|[.,!?;:"()\s]/g) || [];
                var currentPos = 0;

                words.forEach(function(word) {
                    var lowerWord = word.toLowerCase();
                    var grammar = wordMap.get(lowerWord);
                    if (grammar && GRAMMAR_COLOR_MAP[grammar]) {
                        var color = GRAMMAR_COLOR_MAP[grammar];
                        var r = parseInt(color.slice(1, 3), 16);
                        var g = parseInt(color.slice(3, 5), 16);
                        var b = parseInt(color.slice(5, 7), 16);

                        var oRange = oPara.GetRange(currentPos, currentPos + word.length - 1);
                        oRange.SetColor(r, g, b);
                    }
                    currentPos += word.length;
                });
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
        colorCodeDocument,
        displayColorLegend,
    };
})();
