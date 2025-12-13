
describe('ConfigManager', function () {
    // Mock localStorage
    const originalLocalStorage = window.localStorage;
    const store = {};
    const mockLocalStorage = {
        getItem: (key) => store[key],
        setItem: (key, val) => store[key] = val
    };

    before(function () {
        Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

        // Mock DOM elements required by ConfigManager
        const ids = ['ling-mode', 'opt-arcs', 'opt-silent', 'btn-apply-ling', 'btn-reset-ling', 'ling-preview', 'ling-status'];
        ids.forEach(id => {
            let el;
            if (id === 'ling-mode') {
                el = document.createElement('select');
                el.id = id;
                // Add options
                ['none', 'phonemes', 'syllables', 'words', 'lines', 'silent'].forEach(val => {
                    const opt = document.createElement('option');
                    opt.value = val;
                    el.appendChild(opt);
                });
                el.value = 'phonemes'; // Pre-set for test logic? Default is syllables in code.
            } else if (id.startsWith('opt-')) {
                el = document.createElement('input');
                el.type = 'checkbox';
                el.id = id;
                el.checked = false;
            } else if (id.startsWith('btn-')) {
                el = document.createElement('button');
                el.id = id;
            } else {
                el = document.createElement('div');
                el.id = id;
            }
            // Spy on addEventListener
            el._originalAddEventListener = el.addEventListener;
            el.addEventListener = function (evt, cb) {
                this.events = this.events || {};
                this.events[evt] = cb;
                if (this._originalAddEventListener) this._originalAddEventListener.call(this, evt, cb);
            };
            document.body.appendChild(el);
        });
    });

    after(function () {
        Object.defineProperty(window, 'localStorage', { value: originalLocalStorage });
        // Cleanup DOM
        const ids = ['ling-mode', 'opt-arcs', 'opt-silent', 'btn-apply-ling', 'btn-reset-ling', 'ling-preview', 'ling-status'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    });

    it('should initialize with default config', function () {
        const manager = window.ConfigManager;
        // Reset config defaults
        manager.config = { mode: 'syllables', showArcs: false, highlightSilent: false };

        manager.init();
        expect(manager).to.exist;
        expect(manager.config.mode).to.equal('syllables');
    });

    it('should update preview when initialized', function () {
        const manager = window.ConfigManager;
        manager.config = { mode: 'syllables', showArcs: false, highlightSilent: false };
        manager.init();
        const preview = document.getElementById('ling-preview');
        expect(preview.innerHTML).to.contain('<span');
        expect(preview.innerHTML).to.contain('style="color:');
    });

    it('should save config to localStorage', function () {
        const manager = window.ConfigManager;
        manager.config = { mode: 'syllables', showArcs: false, highlightSilent: false };

        manager.config.mode = 'phonemes';
        manager.save();
        expect(store['onlydys_ling_config']).to.include('"mode":"phonemes"');
    });
});
