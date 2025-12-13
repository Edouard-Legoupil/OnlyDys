(function (window) {
    'use strict';

    const ConfigManager = {
        config: {
            mode: 'syllables',
            showArcs: false,
            highlightSilent: false
        },

        init: function () {
            // Load from localStorage if available
            const saved = localStorage.getItem('onlydys_ling_config');
            if (saved) {
                try {
                    this.config = JSON.parse(saved);
                } catch (e) { console.error(e); }
            }

            this.bindUI();
        },

        bindUI: function () {
            // Radio Buttons Name: ling-mode
            const radios = document.getElementsByName('ling-mode');
            const arcsCheck = document.getElementById('opt-arcs');
            const silentCheck = document.getElementById('opt-silent');
            const applyBtn = document.getElementById('btn-apply-ling');
            const resetBtn = document.getElementById('btn-reset-ling');

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

            // Listeners
            radios.forEach(r => {
                r.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.config.mode = e.target.value;
                        this.save();
                        this.updatePreview();
                        this.updateOptionsVisibility();
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
                if (window.OnlyDysStyles && window.OnlyDysStyles.displayColorLegend) {
                    window.OnlyDysStyles.displayColorLegend();
                }
            }
        },

        save: function () {
            localStorage.setItem('onlydys_ling_config', JSON.stringify(this.config));
        },

        updatePreview: function () {
            const previewEl = document.getElementById('ling-preview');
            if (!previewEl) return;

            const text = "L'oiseau chante sur la branche.";
            // Run logic on sample text.
            // We need a dummy model run.
            const dummyModel = {
                paragraphs: [{
                    textRuns: [{ text: text, formatting: { color: "#000000" } }]
                }]
            };

            const processed = window.ColorizationEngine.processModel(dummyModel, this.config);

            // Render HTML from model
            let html = "";
            processed.paragraphs[0].textRuns.forEach(run => {
                const color = run.formatting.color || "#000000";
                html += `<span style="color: ${color}">${run.text}</span>`;
            });

            previewEl.innerHTML = html;
        },

        applyToDocument: function () {
            const statusEl = document.getElementById('ling-status');
            if (statusEl) statusEl.textContent = "Processing...";

            window.SelectionManager.getCurrentSelectionModel()
                .then(model => {
                    const processed = window.ColorizationEngine.processModel(model, this.config);
                    return window.SelectionManager.applyChanges(processed);
                })
                .then(() => {
                    if (statusEl) statusEl.textContent = "Done!";
                })
                .catch(err => {
                    console.error(err);
                    if (statusEl) statusEl.textContent = "Error: " + err;
                });
        }
    };

    window.ConfigManager = ConfigManager;

})(window);
