(function (window) {
    'use strict';

    const ConfigManager = {
        config: {
            mode: 'syllables',
            showArcs: false,
            highlightSilent: false,
            useHighlighting: false,      // Use background highlighting instead of text color
            suggestionDebounceMs: 150,  // Default debounce delay in milliseconds
            colorPalette: 'default'     // Color palette: 'default', 'okabeIto', 'tolsQualitative', 'viridis', 'highContrast'
        },

        init: function () {
            // Load from localStorage if available
            const saved = localStorage.getItem('onlydys_ling_config');
            if (saved) {
                try {
                    this.config = JSON.parse(saved);
                    // Ensure colorPalette exists in loaded config
                    if (!this.config.colorPalette) {
                        this.config.colorPalette = 'default';
                        this.save();
                    }
                } catch (e) { console.error(e); }
            }

            // Initialize color palette in ColorizationEngine if available
            if (window.ColorizationEngine && window.ColorizationEngine.initPaletteFromConfig) {
                window.ColorizationEngine.initPaletteFromConfig();
            }

            this.bindUI();
        },

        bindUI: function () {
            // Radio Buttons Name: ling-mode
            const radios = document.getElementsByName('ling-mode');
            const arcsCheck = document.getElementById('opt-arcs');
            const silentCheck = document.getElementById('opt-silent');
            const highlightingCheck = document.getElementById('opt-highlighting');
            const applyBtn = document.getElementById('btn-apply-ling');
            const resetBtn = document.getElementById('btn-reset-ling');
            const paletteSelector = document.getElementById('palette-selector');

            if (radios.length === 0) return; // UI not loaded

            // Set current values
            // Select the radio matching config.mode
            for (let r of radios) {
                if (r.value === this.config.mode) {
                    r.checked = true;
                    break;
                }
            }
            if (arcsCheck) arcsCheck.checked = this.config.showArcs;
            if (silentCheck) silentCheck.checked = this.config.highlightSilent;
            if (highlightingCheck) highlightingCheck.checked = this.config.useHighlighting;
            
            // Set palette selector value
            if (paletteSelector) {
                paletteSelector.value = this.config.colorPalette || 'default';
            }

            // Listeners
            radios.forEach(r => {
                r.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.config.mode = e.target.value;
                        this.save();
                        this.updatePreview();
                        this.updateOptionsVisibility();
                        this.renderPaletteCarousel();
                    }
                });
            });

            if (arcsCheck) {
                arcsCheck.addEventListener('change', (e) => {
                    this.config.showArcs = e.target.checked;
                    this.save();
                    this.updatePreview();
                });
            }

            if (silentCheck) {
                silentCheck.addEventListener('change', (e) => {
                    this.config.highlightSilent = e.target.checked;
                    this.save();
                    this.updatePreview();
                });
            }

            if (highlightingCheck) {
                highlightingCheck.addEventListener('change', (e) => {
                    this.config.useHighlighting = e.target.checked;
                    this.save();
                    this.updatePreview();
                    this.renderPaletteCarousel();
                    
                    // Auto-apply to document when highlighting option changes
                    if (window.logger) {
                        window.logger.info("Highlighting option changed to: " + this.config.useHighlighting);
                    }
                    
                    // Trigger a re-application of the colorization to the document
                    if (typeof window.applyLinguisticsToDocument === 'function') {
                        window.applyLinguisticsToDocument();
                    }
                });
            }

            // Palette selector binding (for backward compatibility)
            if (paletteSelector) {
                paletteSelector.addEventListener('change', (e) => {
                    const paletteName = e.target.value;
                    this.selectPalette(paletteName);
                });
            }

            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    this.applyToDocument();
                });
            }

            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    // Call generic remove formatting/revert? 
                    // For now, implementing basic reset if supported or just log
                    // Actually, we can implement basic revert for selection if using engine?
                    // Or just set color to auto?
                    // For now, prompt not fully defined for "reset", keeping placeholder or simple logic
                    console.log("Resetting selection formatting...");
                    window.Asc.plugin.callCommand(function () {
                        var oDocument = Api.GetDocument();
                        var oRange = oDocument.GetRangeBySelect();
                        oRange.SetColor(0, 0, 0); // Reset to black? Or Auto?
                        // Resetting is hard without storing state. Black is safe assumption for text.
                    }, false, true);
                });
            }

            this.updateOptionsVisibility();
            this.updatePreview();
            this.renderPaletteCarousel();
        },

        updateOptionsVisibility: function () {
            // Hide all first
            document.querySelectorAll('.conditional-opt').forEach(el => el.style.display = 'none');

            // Show based on mode
            const mode = this.config.mode;

            if (mode === 'syllables') {
                const opt = document.getElementById('opt-container-syllables');
                if (opt) opt.style.display = 'block';
            } else if (mode === 'phonemes' || mode === 'silent') {
                // Should silent option be visible for phonemes? Maybe.
                // Assuming yes for now if we want "highlight silent" to work within phoneme view?
                // Or just silent mode.
                // Based on previous UI, it was global.
                // Let's show it for silent/phonemes to be safe.
                const opt = document.getElementById('opt-container-silent');
                if (opt) opt.style.display = 'block';
            } else if (mode === 'grammar') {
                const opt = document.getElementById('opt-container-grammar');
                if (opt) opt.style.display = 'block';
                // Populate legend
                this.updateColorLegend();
            }
        },

        /**
         * Update the color legend to show current palette
         */
        updateColorLegend: function () {
            // Trigger legend update for grammar mode
            if (window.ColorizationEngine && window.ColorizationEngine.displayColorLegend) {
                window.ColorizationEngine.displayColorLegend();
            }
            // Also update if OnlyDysStyles has its own legend
            if (window.OnlyDysStyles && window.OnlyDysStyles.displayColorLegend) {
                window.OnlyDysStyles.displayColorLegend();
            }
        },

        save: function () {
            localStorage.setItem('onlydys_ling_config', JSON.stringify(this.config));
        },

        updatePreview: function () {
            const previewEl = document.getElementById('ling-preview');
            if (!previewEl) return;

            const text = "L'oiseau chante sur la branche.";

            // Build config with options for preview
            const previewConfig = {
                ...this.config,
                options: {
                    ...(this.config.options || {}),
                    showArcs: this.config.showArcs,
                    useHighlighting: false // Text color mode for preview
                }
            };

            // Run logic on sample text.
            const dummyModel = {
                paragraphs: [{
                    textRuns: [{ text: text, formatting: { color: "#000000" } }]
                }]
            };

            const processed = window.ColorizationEngine.processModel(dummyModel, previewConfig);

            // Render HTML from model
            let html = "";
            processed.paragraphs[0].textRuns.forEach(run => {
                const color = run.formatting.color || "#000000";
                const background = run.formatting.backgroundColor || "transparent";
                const underline = run.formatting.underline;
                
                let style = `color: ${color}; background-color: ${background}`;
                
                // Add underline style for arcs (simulate with border-bottom in preview)
                if (underline) {
                    // Map underline style to border for visualization
                    style += `; border-bottom: 2px solid ${color}; padding-bottom: 2px;`;
                }
                
                html += `<span style="${style}">${this.escapeHtml(run.text)}</span>`;
            });

            previewEl.innerHTML = html;
        },

        /**
         * Escape HTML special characters for safe rendering
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
        },

        applyToDocument: function () {
            const statusEl = document.getElementById('ling-status');
            if (statusEl) statusEl.textContent = "Processing...";

            // Build config with options for colorization engine
            const colorizationConfig = {
                ...this.config,
                options: {
                    ...(this.config.options || {}),
                    // Pass showArcs to options for syllables mode
                    showArcs: this.config.showArcs,
                    // Pass highlighting mode
                    useHighlighting: this.config.useHighlighting
                }
            };

            window.SelectionManager.getCurrentSelectionModel()
                .then(model => {
                    const processed = window.ColorizationEngine.processModel(model, colorizationConfig);
                    return window.SelectionManager.applyChanges(processed);
                })
                .then(() => {
                    if (statusEl) statusEl.textContent = "Done!";
                })
                .catch(err => {
                    console.error(err);
                    if (statusEl) statusEl.textContent = "Error: " + err;
                });
        },

        // Palette definitions for carousel display
        paletteDefinitions: {
            'default': {
                name: 'Default',
                description: 'Originale'
            },
            'okabeIto': {
                name: 'Okabe-Ito',
                description: 'Universelle'
            },
            'tolsQualitative': {
                name: "Tol's Qualitative",
                description: 'Qualitative'
            },
            'viridis': {
                name: 'Viridis',
                description: 'Uniforme'
            },
            'highContrast': {
                name: 'Haute Contraste',
                description: 'Contraste'
            }
        },

        // Render palette carousel
        renderPaletteCarousel: function () {
            const carousel = document.getElementById('palette-carousel');
            if (!carousel) return;

            const currentMode = this.config.mode;
            const currentPalette = this.config.colorPalette || 'default';
            const useHighlighting = this.config.useHighlighting || false;

            // Clear existing cards
            carousel.innerHTML = '';

            // Get actual palette data from ColorizationEngine if available
            const palettes = window.ColorizationEngine ? window.ColorizationEngine.PALETES : null;

            // Create a card for each palette
            Object.keys(this.paletteDefinitions).forEach(paletteKey => {
                const paletteDef = this.paletteDefinitions[paletteKey];
                const card = document.createElement('div');
                card.className = 'palette-card';
                if (paletteKey === currentPalette) {
                    card.classList.add('selected');
                }

                // Get colors to display based on mode
                const colorsToShow = this.getPaletteColorsForMode(paletteKey, currentMode, useHighlighting, palettes);

                // Create preview swatches
                const preview = document.createElement('div');
                preview.className = 'palette-preview';
                colorsToShow.forEach(color => {
                    const swatch = document.createElement('div');
                    swatch.className = 'palette-color-swatch';
                    swatch.style.backgroundColor = color;
                    preview.appendChild(swatch);
                });
                card.appendChild(preview);

                // Add name
                const name = document.createElement('div');
                name.className = 'palette-name';
                name.textContent = paletteDef.name;
                card.appendChild(name);

                // Add description
                const desc = document.createElement('div');
                desc.className = 'palette-description';
                desc.textContent = paletteDef.description;
                card.appendChild(desc);

                // Add click handler
                card.addEventListener('click', () => {
                    this.selectPalette(paletteKey);
                });

                carousel.appendChild(card);
            });

            // Update the hidden select for backward compatibility
            const select = document.getElementById('palette-selector');
            if (select) {
                select.value = currentPalette;
            }

            if (window.logger) {
                window.logger.info("Palette carousel rendered with mode: " + currentMode + ", palette: " + currentPalette);
            }
        },

        // Get colors to display based on mode
        getPaletteColorsForMode: function (paletteKey, mode, useHighlighting, palettes) {
            if (palettes && palettes[paletteKey]) {
                const palette = palettes[paletteKey];
                const paletteToUse = useHighlighting && palette.highlight ? palette.highlight : palette;
                
                // Return colors based on the current mode
                switch (mode) {
                    case 'grammar':
                        if (paletteToUse.grammar) {
                            return Object.values(paletteToUse.grammar).slice(0, 8);
                        }
                        return paletteToUse.phonemes || paletteToUse.syllables || [];
                    case 'phonemes':
                    case 'alternphonemes':
                        return paletteToUse.phonemes || [];
                    case 'syllables':
                        return paletteToUse.syllables || [];
                    case 'letters':
                        return paletteToUse.letters || [];
                    case 'words':
                    case 'alternmots':
                        return paletteToUse.words || [];
                    case 'silent':
                    case 'alternlettres':
                        return [paletteToUse.silent || '#808080'];
                    case 'vowels':
                        return [paletteToUse.vowels || '#E377C2'];
                    case 'consonants':
                        return [paletteToUse.consonants || '#2B83BA'];
                    case 'alternlines':
                        if (window.ColorizationEngine && window.ColorizationEngine.lineColors) {
                            return window.ColorizationEngine.lineColors.slice(0, 5);
                        }
                        return paletteToUse.phonemes || [];
                    default:
                        return paletteToUse.phonemes || paletteToUse.syllables || [];
                }
            }
            // Fallback: return generic colors
            return ['#D62728', '#2B83BA', '#2CA02C', '#FF7F0E', '#98DF8A'];
        },

        // Select a palette
        selectPalette: function (paletteName) {
            this.config.colorPalette = paletteName;
            this.save();

            // Update ColorizationEngine
            if (window.ColorizationEngine && window.ColorizationEngine.setCurrentPalette) {
                window.ColorizationEngine.setCurrentPalette(paletteName);
            }

            // Update UI
            this.renderPaletteCarousel();
            this.updateColorLegend();
            this.updatePreview();

            // Auto-apply to document
            if (window.logger) {
                window.logger.info("Palette changed to: " + paletteName);
            }
            if (typeof window.applyLinguisticsToDocument === 'function') {
                window.applyLinguisticsToDocument();
            }
        }
    };

    window.ConfigManager = ConfigManager;

    // Initialize palette carousel when DOM is ready
    function initPaletteCarousel() {
        if (window.ConfigManager) {
            window.ConfigManager.renderPaletteCarousel();
            
            // Re-render when mode changes
            const modeRadios = document.getElementsByName('ling-mode');
            if (modeRadios) {
                modeRadios.forEach(radio => {
                    radio.addEventListener('change', function() {
                        if (this.checked && window.ConfigManager) {
                            window.ConfigManager.renderPaletteCarousel();
                        }
                    });
                });
            }
            
            // Re-render when highlighting changes
            const highlightingCheck = document.getElementById('opt-highlighting');
            if (highlightingCheck) {
                highlightingCheck.addEventListener('change', function() {
                    if (window.ConfigManager) {
                        window.ConfigManager.renderPaletteCarousel();
                    }
                });
            }
        }
    }

    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            ConfigManager.init();
            initPaletteCarousel();
        });
    } else {
        ConfigManager.init();
        setTimeout(initPaletteCarousel, 100);
    }

})(window);
