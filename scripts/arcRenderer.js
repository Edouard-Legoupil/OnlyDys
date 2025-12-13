(function (window) {
    'use strict';

    /**
     * Arc Renderer
     * Generates ONLYOFFICE Drawing Objects (Shapes) for syllable arcs.
     */

    const ArcRenderer = {

        /**
         * Creates an arc shape definition.
         * Note: This function would typically run inside the plugin's context
         * where Api is available, or return a config object to be used by the plugin command.
         * 
         * @param {number} width - Width of the arc in English Metric Units (EMU) or points.
         * @param {number} height - Height of the arc.
         * @param {string} color - Hex color.
         * @returns {object} Shape definition (conceptual)
         */
        createArcShape: function (width, height, color) {
            // In ONLYOFFICE, shapes are created via Api.CreateShape.
            // This function returns the parameters needed.
            return {
                type: "arc",
                width: width,
                height: height,
                fill: "none", // Arcs are just strokes usually? prompt: "Render arcs... one arc per syllable"
                stroke: {
                    color: color,
                    width: 1 * 12700 // 1pt in EMU roughly? 36000EMU = 1mm. 1pt = 1/72 inch = 12700 EMU.
                }
            };
        },

        /**
         * Generates a script snippet to insert arcs for a given text run model.
         * Since we can't easily calculate text width here without the font engine,
         * this logic will likely need to be injected into the editor to run 'live'.
         * 
         * However, the SelectionManager will execute this.
         * 
         * The prompt asks to "Position arcs beneath baseline using text metrics".
         * Text metrics are only available inside `Asc.plugin.callCommand`.
         */
        generateArcDrawingScript: function (text, syllables) {
            // This returns a function body string to be executed in callCommand.
            // It assumes 'oParagraph' or similar is in context or passed.
            // 
            // We need a way to measure each syllable.
            // Api calls: oParagraph.GetRange(start, end).GetTextPr(). ..? 
            // Only way to measure is often creating a temporary text object or guessing.
            // OR using `Asc.plugin.executeMethod("GetTextBounds", ...)`? (Not standard).

            // Standard ONLYOFFICE approach for precise positioning is hard from plugin.
            // We might approximate based on char count * avg width if font is known?
            // "Position arcs beneath baseline" -> Anchor to character?
            // ONLYOFFICE doesn't easily support anchoring shapes to specific text ranges *inline* with flow 
            // such that they move with text edit, EXCEPT inline shapes.
            // Inline shapes act like characters.
            // We can Insert info?

            // If we insert an inline picture/shape of an arc *after* the syllable? No, it must be *under*.
            // Drawing over text is possible with anchored shapes (floating).
            // But we need coordinate of the text.

            // OPTION: We assume the user creates the arcs as "Drawing" objects anchored to the paragraph.
            // We iterate syllables, measure them?

            return `
                // Script to run inside callCommand
                // Context: oParagraph is the current paragraph.
                // We need to iterate runs/syllables.
                
                // Note: complexity of measuring text in JS macro is high. 
                // We will use a simplified approach:
                // Create an inline shape (image of arc) ? No.
                // Create a Shape anchored to the paragraph.
                
                // TODO: Implement actual shape generation in SelectionManager using Api.
            `;
        }
    };

    window.ArcRenderer = ArcRenderer;

})(window);
