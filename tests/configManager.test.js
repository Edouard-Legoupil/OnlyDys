
describe('ConfigManager', function () {
    // Mock localStorage
    const originalLocalStorage = window.localStorage;
    const store = {};
    const mockLocalStorage = {
        getItem: (key) => store[key],
        setItem: (key, val) => store[key] = val
    };

    beforeEach(function () {
        for (const key in store) delete store[key];
        window.ConfigManager.config = {
            mode: 'syllables',
            showArcs: false,
            highlightSilent: false
        };
    });

    before(function () {
        Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

        // Mock DOM elements required by ConfigManager
        const ids = ['opt-arcs', 'opt-silent', 'btn-apply-ling', 'btn-reset-ling', 'ling-preview', 'ling-status'];

        // Create radio buttons for ling-mode
        ['none', 'phonemes', 'syllables', 'words', 'lines', 'silent'].forEach(val => {
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'ling-mode';
            input.value = val;
            input.id = 'ling-mode-' + val;
            document.body.appendChild(input);
        });

        ids.forEach(id => {
            let el;
            if (id.startsWith('opt-')) {
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
        const ids = ['opt-arcs', 'opt-silent', 'btn-apply-ling', 'btn-reset-ling', 'ling-preview', 'ling-status'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        document.querySelectorAll('input[name="ling-mode"]').forEach(el => el.remove());
    });

    it('should initialize with default config', function () {
        const manager = window.ConfigManager;
        // Reset config defaults
        manager.config = { mode: 'syllables', showArcs: false, highlightSilent: false };

        manager.init();
        expect(manager).to.exist;
        expect(manager.config.mode).to.equal('syllables');

        const radio = document.getElementById('ling-mode-syllables');
        expect(radio.checked).to.be.true;
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
