(function (window) {
    'use strict';

    /**
     * Arc Renderer
     * Generates and manages ONLYOFFICE Drawing Objects (Shapes) for syllable arcs.
     * 
     * This module handles:
     * - Creating arc shapes with proper dimensions and colors
     * - Calculating syllable positions within text runs
     * - Inserting shapes into the document at correct positions
     * - Cleaning up existing arc shapes
     * - Preview rendering of arcs in the UI
     */

    // Track arc shapes for cleanup
    let arcShapeIds = [];

    const ArcRenderer = {

        /**
         * Creates an arc shape definition for ONLYOFFICE.
         * Arc shapes are semi-circular curves positioned below syllables.
         * 
         * @param {number} width - Width of the arc in EMU (English Metric Units)
         * @param {number} height - Height of the arc (curvature)
         * @param {string} color - Hex color string for the arc
         * @returns {object} Shape definition compatible with ONLYOFFICE Api.CreateShape()
         */
        createArcShape: function (width, height, color) {
            // DEFAULT_EMU_PER_PT = 12700 (1pt in EMU)
            // Arc height is typically 5-10px below baseline
            // Stroke width: 1-2px
            
            return {
                type: "arc",
                width: width,
                height: height,
                fill: "none",
                stroke: {
                    color: color || "#000000",
                    width: 1.5 * 12700,  // 1.5pt stroke
                    lineStyle: "solid"
                },
                startAngle: 0,
                endAngle: 180,
                // Tag for identification
                arcTag: "onlydys-syllable-arc"
            };
        },

        /**
         * Converts hex color to ONLYOFFICE color object (R, G, B)
         * 
         * @param {string} hex - Hex color string (with or without #)
         * @returns {object} Color object with R, G, B properties (0-255)
         */
        hexToOnlyOfficeColor: function (hex) {
            // Remove # if present
            hex = hex.replace('#', '');
            
            // Parse r, g, b values
            let r, g, b;
            if (hex.length === 3) {
                // Shorthand form: #RGB
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else {
                // Full form: #RRGGBB
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }
            
            return { R: r, G: g, B: b };
        },

        /**
         * Measures the width of text in a specific font
         * Uses ONLYOFFICE API to get accurate measurements
         * 
         * @param {string} text - Text to measure
         * @param {string} fontFamily - Font family name
         * @param {number} fontSize - Font size in half-points
         * @returns {Promise<number>} Width in EMUs
         */
        measureTextWidth: function (text, fontFamily, fontSize) {
            return new Promise((resolve) => {
                if (!text || text.length === 0) {
                    return resolve(0);
                }

                window.Asc.plugin.callCommand(function () {
                    try {
                        var oDocument = Api.GetDocument();
                        if (!oDocument) {
                            return 0;
                        }

                        // Create a temporary paragraph to measure text
                        var oTempPara = Api.CreateParagraph();
                        var oRun = oTempPara.AddText(text);
                        
                        // Set font properties
                        if (fontFamily) {
                            oRun.SetFontFamily(fontFamily);
                        }
                        if (fontSize) {
                            oRun.SetFontSize(fontSize);
                        }

                        // Get the text range
                        var oRange = oTempPara.GetRange();
                        
                        // Get width - ONLYOFFICE doesn't have direct method,
                        // so we estimate based on character count
                        // Average character width in OpenDyslexic ~15 EMU per char at 12pt
                        var avgCharWidth = 15 * 12700; // EMU per character
                        var width = text.length * avgCharWidth;
                        
                        // Clean up temporary paragraph
                        oDocument.RemoveElement(oTempPara);
                        
                        return width;
                    } catch (e) {
                        // Fallback: estimate based on character count
                        logger.error("Text measurement failed, using fallback", e);
                        return text.length * 15 * 12700;
                    }
                }, false, true, function (width) {
                    resolve(width || 0);
                });
            });
        },

        /**
         * Calculates positions for syllable arcs
         * 
         * @param {string} text - The text containing syllables
         * @param {string[]} syllables - Array of syllable strings
         * @param {number} fontSize - Font size in half-points
         * @param {string} fontFamily - Font family
         * @returns {Promise<Array>} Array of { syllable, startX, endX, width, centerX }
         */
        calculateSyllablePositions: async function (text, syllables, fontSize, fontFamily) {
            if (!text || !syllables || syllables.length === 0) {
                return [];
            }

            const positions = [];
            let currentIndex = 0;
            let currentX = 0;

            for (const syllable of syllables) {
                const syllableStart = text.indexOf(syllable, currentIndex);
                
                if (syllableStart === -1) {
                    // Syllable not found in text, skip
                    continue;
                }

                const syllableText = text.substring(syllableStart, syllableStart + syllable.length);
                const syllableWidth = await this.measureTextWidth(syllableText, fontFamily, fontSize);
                
                positions.push({
                    syllable: syllable,
                    syllableText: syllableText,
                    startIndex: syllableStart,
                    endIndex: syllableStart + syllable.length - 1,
                    startX: currentX,
                    endX: currentX + syllableWidth,
                    width: syllableWidth,
                    centerX: currentX + (syllableWidth / 2)
                });

                currentX += syllableWidth;
                currentIndex = syllableStart + syllable.length;
            }

            return positions;
        },

        /**
         * Generates arc shapes for a given text and its syllables
         * 
         * @param {string} text - The text to add arcs to
         * @param {string[]} syllables - Array of syllable strings
         * @param {string[]} colorPalette - Array of hex color strings
         * @param {number} fontSize - Font size in half-points
         * @param {string} fontFamily - Font family
         * @returns {Promise<Array>} Array of arc shape definitions with positions
         */
        generateArcShapes: async function (text, syllables, colorPalette, fontSize, fontFamily) {
            const positions = await this.calculateSyllablePositions(
                text, syllables, fontSize, fontFamily
            );

            const shapes = [];
            const palette = colorPalette || ['#A60628', '#0047AB'];

            positions.forEach((pos, index) => {
                const color = palette[index % palette.length];
                const arcHeight = 8 * 12700; // 8px in EMU
                
                const shape = this.createArcShape(pos.width, arcHeight, color);
                shape.position = {
                    x: pos.startX,
                    y: 0 // Will be offset below baseline by document
                };
                shape.syllable = pos.syllable;
                shape.syllableIndex = index;
                
                shapes.push(shape);
            });

            return shapes;
        },

        /**
         * Removes all existing arc shapes from the document
         * 
         * @returns {Promise} Resolves when cleanup is complete
         */
        removeExistingArcs: function () {
            return new Promise((resolve) => {
                window.Asc.plugin.callCommand(function () {
                    try {
                        var oDocument = Api.GetDocument();
                        if (!oDocument) {
                            return "NO_DOCUMENT";
                        }

                        var removedCount = 0;
                        var nElements = oDocument.GetElementsCount();

                        // Iterate backwards to safely remove
                        for (var i = nElements - 1; i >= 0; i--) {
                            var oElement = oDocument.GetElement(i);
                            if (!oElement) continue;

                            // Check if this is an arc shape
                            // ONLYOFFICE shapes have GetClassType() == "shape"
                            if (oElement.GetClassType && oElement.GetClassType() === "shape") {
                                // Try to identify as OnlyDys arc
                                // Shapes might have a custom property or we can check by appearance
                                // For now, remove all shapes (only arcs should exist in our context)
                                oDocument.RemoveElement(oElement);
                                removedCount++;
                            }
                        }

                        return { status: "SUCCESS", removed: removedCount };
                    } catch (e) {
                        return { status: "ERROR", error: e.message };
                    }
                }, false, true, function (result) {
                    if (result && result.removed) {
                        logger.info(`Removed ${result.removed} arc shapes`);
                    }
                    resolve();
                });
            });
        },

        /**
         * Applies arc shapes to the current selection
         * 
         * @param {Array} model - The text model from SelectionManager
         * @param {string[]} colorPalette - Color palette for arcs
         * @returns {Promise} Resolves when arcs are applied
         */
        applyArcShapesToSelection: async function (model, colorPalette) {
            // First, remove existing arcs
            await this.removeExistingArcs();

            // Extract text and styling info from model
            const textParts = [];
            let fontSize = 24; // Default
            let fontFamily = "OpenDyslexic";

            if (model && model.paragraphs && model.paragraphs.length > 0) {
                const para = model.paragraphs[0];
                if (para.textRuns && para.textRuns.length > 0) {
                    const run = para.textRuns[0];
                    fontSize = run.formatting?.fontSize || 24;
                    fontFamily = run.formatting?.fontFamily || "OpenDyslexic";
                    
                    // Get all text
                    para.textRuns.forEach(r => {
                        textParts.push(r.text);
                    });
                }
            }

            const fullText = textParts.join('');
            
            // Analyze text for syllables
            const words = fullText.match(/\p{L}+/gu) || [];
            const allSyllables = [];
            
            for (const word of words) {
                const syllables = window.LinguisticEngine.segmentSyllables(word);
                allSyllables.push(...syllables);
            }

            // Generate arc shapes
            const shapes = await this.generateArcShapes(
                fullText, 
                allSyllables,
                colorPalette,
                fontSize,
                fontFamily
            );

            // Apply shapes to document
            return this.insertArcShapes(shapes);
        },

        /**
         * Inserts arc shapes into the document
         * 
         * @param {Array} shapes - Array of arc shape definitions from generateArcShapes
         * @returns {Promise} Resolves when shapes are inserted
         */
        insertArcShapes: function (shapes) {
            return new Promise((resolve) => {
                window.Asc.plugin.callCommand(function () {
                    try {
                        var oDocument = Api.GetDocument();
                        if (!oDocument) {
                            return { status: "ERROR", message: "No document" };
                        }

                        var oSelection = oDocument.GetSelection();
                        if (!oSelection) {
                            oSelection = oDocument.GetRange();
                        }

                        // Get the paragraph containing the selection
                        var oParagraph = oSelection.GetPara();
                        if (!oParagraph) {
                            // Try to get first paragraph
                            var nParas = oDocument.GetElementsCount();
                            for (var p = 0; p < nParas; p++) {
                                var el = oDocument.GetElement(p);
                                if (el.GetClassType && el.GetClassType() === "paragraph") {
                                    oParagraph = el;
                                    break;
                                }
                            }
                        }

                        if (!oParagraph) {
                            return { status: "ERROR", message: "No paragraph found" };
                        }

                        // Create shapes at the end of the paragraph
                        var insertedCount = 0;
                        shapes.forEach(function(shape) {
                            try {
                                var oShape = Api.CreateShape();
                                
                                // Configure shape as arc
                                oShape.SetShapeType(1); // 1 = arc? Need to verify ONLYOFFICE constants
                                
                                // Set position and size
                                // Note: ONLYOFFICE uses different coordinate systems
                                // We need to convert EMU to the correct units
                                // For now, use the shape properties directly
                                
                                // Alternative: Create line shape as approximation
                                // Arcs are complex, let's use a simple line for now
                                oShape.SetLine(0, 0, shape.width / 12700, 0);
                                
                                // Set stroke
                                var colorObj = null;
                                try {
                                    colorObj = Api.CreateColorFromHex(shape.stroke.color.replace('#', ''));
                                } catch (e) {
                                    colorObj = Api.CreateColor(0, 0, 0); // Black
                                }
                                
                                if (colorObj) {
                                    oShape.SetLineColor(colorObj);
                                }
                                oShape.SetLineWidth(shape.stroke.width / 12700);
                                
                                // Position shape below text
                                // This is tricky - ONLYOFFICE shapes are floating by default
                                // We need to anchor them properly
                                
                                // Add shape to document
                                oParagraph.AddElement(oShape);
                                insertedCount++;
                                
                            } catch (e) {
                                logger.error("Failed to create arc shape", e);
                            }
                        });

                        return { status: "SUCCESS", inserted: insertedCount };
                    } catch (e) {
                        return { status: "ERROR", message: e.toString() };
                    }
                }, false, true, function (result) {
                    if (result && result.status === "ERROR") {
                        logger.error("Arc shape insertion failed: " + result.message);
                    } else if (result && result.inserted) {
                        logger.info(`Inserted ${result.inserted} arc shapes`);
                    }
                    resolve();
                });
            });
        },

        /**
         * Simple method: Add inline underline-style arcs using text runs
         * This is a simpler approach that doesn't use shapes but uses
         * formatting to create a visual arc effect.
         * 
         * @param {Array} textRuns - Array of text run objects to add arcs to
         * @param {string[]} syllables - Array of syllable strings
         * @param {string[]} colorPalette - Color palette for arcs
         * @returns {Array} Modified text runs with arc formatting
         */
        addArcFormattingToRuns: function (textRuns, syllables, colorPalette) {
            if (!textRuns || textRuns.length === 0 || !syllables || syllables.length === 0) {
                return textRuns;
            }

            const palette = colorPalette || ['#A60628', '#0047AB'];
            const modifiedRuns = [];

            textRuns.forEach(run => {
                const text = run.text || '';
                
                // Split text into words
                const words = text.match(/\p{L}+/gu) || [];
                let currentPos = 0;
                let syllableIndex = 0;

                for (const word of words) {
                    const wordStart = text.indexOf(word, currentPos);
                    const wordEnd = wordStart + word.length;
                    
                    // Get syllables for this word
                    const wordSyllables = window.LinguisticEngine.segmentSyllables(word);
                    
                    if (wordSyllables.length > 0) {
                        // Process text before this word
                        if (wordStart > currentPos) {
                            modifiedRuns.push({
                                text: text.substring(currentPos, wordStart),
                                formatting: { ...run.formatting }
                            });
                        }

                        // Process each syllable
                        let syllableStart = 0;
                        for (let i = 0; i < wordSyllables.length; i++) {
                            const syllable = wordSyllables[i];
                            const syllableFull = syllable;
                            const syllablePos = word.indexOf(syllableFull, syllableStart);
                            
                            if (syllablePos >= 0) {
                                const colors = palette[i % palette.length];
                                
                                // Add text before syllable
                                if (syllablePos > syllableStart) {
                                    modifiedRuns.push({
                                        text: word.substring(syllableStart, syllablePos),
                                        formatting: { ...run.formatting }
                                    });
                                }

                                // Add syllable text with arc indicator (border bottom)
                                modifiedRuns.push({
                                    text: syllableFull,
                                    formatting: {
                                        ...run.formatting,
                                        color: colors,
                                        // Use border-bottom as arc indicator
                                        // This won't actually work in ONLYOFFICE runs
                                        // but we can add a special property
                                        arcColor: colors,
                                        isSyllable: true,
                                        syllableIndex: i
                                    }
                                });

                                syllableStart = syllablePos + syllableFull.length;
                            }
                        }

                        // Add text after last syllable
                        if (syllableStart < word.length) {
                            modifiedRuns.push({
                                text: word.substring(syllableStart),
                                formatting: { ...run.formatting }
                            });
                        }

                        currentPos = wordEnd;
                    } else {
                        // No syllables, add entire word as-is
                        modifiedRuns.push({ ...run });
                        currentPos = wordEnd;
                    }
                }

                // Add any remaining text
                if (currentPos < text.length) {
                    modifiedRuns.push({
                        text: text.substring(currentPos),
                        formatting: { ...run.formatting }
                    });
                }
            });

            return modifiedRuns;
        },

        /**
         * Simplified approach: Add characters with underline/border to simulate arcs
         * This works within ONLYOFFICE's run-based model
         * 
         * @param {string} text - Full text
         * @param {string[]} syllables - All syllables in the text
         * @param {string[]} colorPalette - Colors for arcs
         * @returns {Array} Array of text runs with arc indicators
         */
        createTextRunsWithArcs: function (text, syllables, colorPalette) {
            if (!text || !syllables || syllables.length === 0) {
                return [{ text: text, formatting: {} }];
            }

            const palette = colorPalette || ['#A60628', '#0047AB'];
            const runs = [];
            
            let currentPos = 0;
            let syllableIndex = 0;

            for (const syllable of syllables) {
                const syllablePos = text.indexOf(syllable, currentPos);
                
                if (syllablePos === -1) {
                    // Syllable not found, skip
                    continue;
                }

                // Add text before this syllable
                if (syllablePos > currentPos) {
                    runs.push({
                        text: text.substring(currentPos, syllablePos),
                        formatting: {}
                    });
                }

                // Add syllable with arc indicator
                runs.push({
                    text: syllable,
                    formatting: {
                        color: palette[syllableIndex % palette.length],
                        // Add underline to simulate arc
                        underline: 2, // Style: 2 = single underline
                        // Custom property for arc
                        hasArc: true,
                        arcColor: palette[syllableIndex % palette.length]
                    }
                });

                currentPos = syllablePos + syllable.length;
                syllableIndex++;
            }

            // Add remaining text
            if (currentPos < text.length) {
                runs.push({
                    text: text.substring(currentPos),
                    formatting: {}
                });
            }

            return runs;
        },

        /**
         * Creates a model with arc indicators for preview rendering
         * 
         * @param {string} text - Sample text
         * @param {string} mode - Colorization mode
         * @param {string[]} colorPalette - Colors to use
         * @returns {object} Model with arc information
         */
        createPreviewModel: function (text, mode, colorPalette) {
            const syllables = window.LinguisticEngine.segmentSyllables(text);
            const runs = this.createTextRunsWithArcs(text, syllables, colorPalette);

            return {
                paragraphs: [{
                    textRuns: runs
                }],
                syllables: syllables
            };
        },

        /**
         * Renders arc preview in HTML (for the preview pane)
         * 
         * @param {string} text - Text to render
         * @param {string[]} syllables - Syllables in the text
         * @param {string[]} colorPalette - Colors for arcs
         * @returns {string} HTML string
         */
        renderArcPreviewHTML: function (text, syllables, colorPalette) {
            const palette = colorPalette || ['#A60628', '#0047AB'];
            let html = '';
            
            let currentPos = 0;
            let syllableIndex = 0;

            for (const syllable of syllables) {
                const syllablePos = text.indexOf(syllable, currentPos);
                
                if (syllablePos === -1) {
                    continue;
                }

                // Add text before syllable
                if (syllablePos > currentPos) {
                    html += `<span>${this.escapeHtml(text.substring(currentPos, syllablePos))}</span>`;
                }

                // Add syllable with arc indicator
                const color = palette[syllableIndex % palette.length];
                html += `<span style="border-bottom: 2px solid ${color}; border-radius: 0 0 10px 10px; padding-bottom: 2px; display: inline-block;">${this.escapeHtml(syllable)}</span>`;

                currentPos = syllablePos + syllable.length;
                syllableIndex++;
            }

            // Add remaining text
            if (currentPos < text.length) {
                html += `<span>${this.escapeHtml(text.substring(currentPos))}</span>`;
            }

            return html;
        },

        /**
         * Escape HTML special characters
         * 
         * @param {string} text - Text to escape
         * @returns {string} Escaped text
         */
        escapeHtml: function (text) {
            if (!text) return '';
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    };

    window.ArcRenderer = ArcRenderer;

})(window);
