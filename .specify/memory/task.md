# OnlyDys Task List

> **For Mistral Vibe:** Use executing-plans skill to implement these tasks step-by-step.

**Project:** OnlyDys - ONLYOFFICE plugin for dyslexia assistance

**Status:** This document contains all actionable tasks for the OnlyDys project, organized by priority and feature.

---

## Task Index

### P0 - Critical (Tasks 1-21)
- **Syllable Arc Rendering:** Tasks 1-12
- **Debouncing:** Tasks 13-17
- **Loading Indicators:** Tasks 18-21

### P1 - High (Tasks 22-51)
- **English Language Support:** Tasks 22-36
- **Personal Dictionary:** Tasks 37-44
- **Error Boundaries:** Tasks 45-51

### P2 - Medium (Tasks 52-71)
- **Custom Color Schemes:** Tasks 52-58
- **Font Size Adjustment:** Tasks 59-63
- **Dark Mode Support:** Tasks 64-71

---

## P0: Critical Tasks

### Feature: Syllable Arc Rendering (Tasks 1-12)

**Objective:** Complete the syllable arc rendering feature to draw visual arcs under syllables in the document.

#### Task 1: Understand Current ArcRenderer Implementation

**Files:**
- Read: `scripts/arcRenderer.js`

**Step 1: Analyze existing code**
```javascript
// Review current implementation
// Identify missing functionality
// Understand ONLYOFFICE shape API requirements
```

**Step 2: Research ONLYOFFICE shape API**
```javascript
// Check ONLYOFFICE SDK documentation for:
// - Api.CreateShape()
// - Shape positioning
// - Shape anchoring to text
// - Inline vs floating shapes
```

**Success Criteria:**
- [ ] Document current arcRenderer limitations
- [ ] Identify required ONLYOFFICE API methods
- [ ] Understand shape positioning requirements

**Estimated Time:** 1 hour

---

#### Task 2: Design Syllable Arc Shape Definition

**Files:**
- Modify: `scripts/arcRenderer.js`

**Step 1: Define arc shape parameters**
```javascript
// Arc specs:
// - Width: spans the syllable
// - Height: ~5-10px below baseline
// - Color: matches syllable/colorization color
// - Stroke width: 1-2px
// - Shape type: bezier curve or arc
```

**Step 2: Update createArcShape function**
```javascript
// Current: Returns conceptual shape definition
// New: Returns ONLYOFFICE-compatible shape config
createArcShape: function (width, height, color) {
  return {
    type: "arc",
    width: width,
    height: height,
    fill: "none",
    stroke: {
      color: color,
      width: 2
    },
    // Add ONLYOFFICE-specific properties
    startAngle: 0,
    endAngle: 180
  };
}
```

**Success Criteria:**
- [ ] Arc shape definition compatible with ONLYOFFICE
- [ ] All required properties defined

**Estimated Time:** 2 hours

---

#### Task 3: Implement Text Measurement for Positioning

**Files:**
- Modify: `scripts/arcRenderer.js`
- Read: ONLYOFFICE API docs

**Step 1: Add text measurement function**
```javascript
function measureTextWidth(text, fontFamily, fontSize) {
  // Use Asc.plugin.callCommand to measure text in editor
  // Return width in EMUs or appropriate units
}
```

**Step 2: Calculate syllable positions**
```javascript
function calculateSyllablePositions(text, syllables) {
  // Split text into characters
  // Map syllables to character ranges
  // Calculate cumulative widths
  // Return array of { startX, endX, syllable, width }
}
```

**Success Criteria:**
- [ ] Text measurement works in ONLYOFFICE context
- [ ] Syllable positions calculated accurately

**Estimated Time:** 3 hours

---

#### Task 4: Create Arc Shape Generation Function

**Files:**
- Modify: `scripts/arcRenderer.js`

**Step 1: Generate shapes for all syllables**
```javascript
function generateArcShapes(text, syllables, colorPalette) {
  const positions = calculateSyllablePositions(text, syllables);
  const shapes = [];
  
  positions.forEach((pos, index) => {
    const color = colorPalette[index % colorPalette.length];
    const arc = createArcShape(pos.width, 10, color);
    arc.position = { x: pos.startX, y: pos.baseline + 10 };
    shapes.push(arc);
  });
  
  return shapes;
}
```

**Success Criteria:**
- [ ] Arc shapes generated for each syllable
- [ ] Colors alternate according to palette

**Estimated Time:** 2 hours

---

#### Task 5: Integrate with SelectionManager

**Files:**
- Modify: `scripts/selectionManager.js`
- Read: `scripts/arcRenderer.js`

**Step 1: Add method to extract syllables from selection**
```javascript
function getSyllablesFromSelection() {
  return new Promise((resolve) => {
    this.getCurrentSelectionModel().then(model => {
      const text = extractTextFromModel(model);
      const syllables = window.LinguisticEngine.analyzeWord(text);
      resolve({ text, syllables, model });
    });
  });
}
```

**Step 2: Add method to apply arc shapes**
```javascript
function applyArcShapes(model, shapes) {
  return new Promise((resolve) => {
    window.Asc.plugin.callCommand(function() {
      const oDocument = Api.GetDocument();
      // Create and insert shapes at calculated positions
      shapes.forEach(shape => {
        const oShape = Api.CreateShape(shape.type);
        // Configure shape properties
        // Position shape
        oDocument.InsertContent([oShape]);
      });
    }, false, true, resolve);
  });
}
```

**Success Criteria:**
- [ ] SelectionManager can extract syllables from selection
- [ ] Shapes can be inserted at correct positions

**Estimated Time:** 3 hours

---

#### Task 6: Add Arc Toggle to UI

**Files:**
- Modify: `index.html`
- Modify: `scripts/plugin.js`

**Step 1: Add checkbox to Linguistics tab**
```html
<!-- In #opt-container-syllables div -->
<div class="checkbox-group">
  <input type="checkbox" id="opt-arcs" checked>
  <label for="opt-arcs">Afficher les arcs sous les syllabes</label>
</div>
```

**Step 2: Handle arc toggle in ConfigManager**
```javascript
// In bindUI:
const arcsCheck = document.getElementById('opt-arcs');
if (arcsCheck) {
  arcsCheck.addEventListener('change', (e) => {
    this.config.showArcs = e.target.checked;
    this.save();
    this.updatePreview();
  });
}
```

**Success Criteria:**
- [ ] Arc toggle visible in Linguistics tab
- [ ] Toggle state persisted in config

**Estimated Time:** 1 hour

---

#### Task 7: Wire Up Arc Application

**Files:**
- Modify: `scripts/configManager.js`
- Modify: `scripts/colorizationEngine.js`

**Step 1: Modify applyToDocument to handle arcs**
```javascript
applyToDocument: function () {
  const statusEl = document.getElementById('ling-status');
  if (statusEl) statusEl.textContent = "Processing...";

  window.SelectionManager.getCurrentSelectionModel()
    .then(model => {
      const processed = window.ColorizationEngine.processModel(model, this.config);
      
      // Apply arcs if enabled
      if (this.config.showArcs && this.config.mode === 'syllables') {
        return this.applyArcs(model);
      }
      
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
```

**Success Criteria:**
- [ ] Arcs applied when showArcs is true
- [ ] Only applied in syllables mode

**Estimated Time:** 2 hours

---

#### Task 8: Implement ApplyArcs Function

**Files:**
- Modify: `scripts/configManager.js`

**Step 1: Add applyArcs method**
```javascript
applyArcs: function (model) {
  return window.SelectionManager.getCurrentSelectionModel()
    .then(({ text, syllables }) => {
      // Get color palette
      const palette = window.ColorizationEngine.palettes.syllables;
      // Generate arc shapes
      const shapes = window.ArcRenderer.generateArcShapes(text, syllables, palette);
      // Apply shapes
      return window.SelectionManager.applyArcShapes(model, shapes);
    })
    .then(() => {
      // Re-apply colorization without arcs to avoid duplication
      const processed = window.ColorizationEngine.processModel(model, this.config);
      return window.SelectionManager.applyChanges(processed);
    });
}
```

**Success Criteria:**
- [ ] Arcs and colors both applied
- [ ] No duplicate rendering

**Estimated Time:** 2 hours

---

#### Task 9: Add Arc Cleanup Functionality


**Files:**
- Modify: `scripts/arcRenderer.js`
- Modify: `scripts/configManager.js`

**Step 1: Add function to remove existing arcs**
```javascript
function removeExistingArcs() {
  window.Asc.plugin.callCommand(function() {
    const oDocument = Api.GetDocument();
    const elements = [];
    
    for (let i = 0; i < oDocument.GetElementsCount(); i++) {
      const el = oDocument.GetElement(i);
      if (el.GetClassType() === "shape") {
        // Check if shape is an arc (by tag or property)
        if (el.IsArc) {
          elements.push(el);
        }
      }
    }
    
    // Remove all identified arcs
    elements.forEach(el => el.Delete());
  }, false, true);
}
```

**Step 2: Call cleanup before applying new arcs**
```javascript
applyArcs: function (model) {
  return window.ArcRenderer.removeExistingArcs()
    .then(() => {
      // ... existing code to apply new arcs
    });
}
```

**Success Criteria:**
- [ ] Old arcs removed before new ones applied
- [ ] No orphaned arc shapes

**Estimated Time:** 2 hours

---

#### Task 10: Update Preview to Show Arcs

**Files:**
- Modify: `scripts/configManager.js`

**Step 1: Enhance updatePreview to show arcs**
```javascript
updatePreview: function () {
  const previewEl = document.getElementById('ling-preview');
  if (!previewEl) return;

  const text = "L'oiseau chante sur la branche.";
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
    const background = run.formatting.backgroundColor || "transparent";
    
    if (this.config.mode === 'syllables' && this.config.showArcs) {
      // Add arc visualization to preview
      const word = run.text;
      const syllables = window.LinguisticEngine.segmentSyllables(word);
      
      // Split text by syllables with spans
      let wordHtml = "";
      let charIndex = 0;
      syllables.forEach((syllable, sIdx) => {
        const start = word.indexOf(syllable, charIndex);
        const end = start + syllable.length;
        const syllableText = word.substring(start, end);
        
        wordHtml += `<span style="color: ${color}; background-color: ${background};">${syllableText}</span>`;
        // Add arc indicator
        if (sIdx < syllables.length - 1) {
          wordHtml += '<span style="border-bottom: 2px solid ' + 
                     window.ColorizationEngine.palettes.syllables[sIdx % 2] + 
                     '; border-radius: 0 0 10px 10px; display: inline-block; padding-bottom: 2px;" classifica="syllable-arc"></span>';
        }
        
        charIndex = end;
      });
      html += wordHtml;
    } else {
      html += `<span style="color: ${color}; background-color: ${background};">${run.text}</span>`;
    }
  });

  previewEl.innerHTML = html;
}
```

**Success Criteria:**
- [ ] Preview shows arc visualization when enabled
- [ ] Visual representation of arcs in preview

**Estimated Time:** 2 hours

---

#### Task 11: Test Arc Rendering

**Files:**
- Modify: `tests/arcRenderer.test.js`

**Step 1: Write tests for arc generation**
```javascript
describe('ArcRenderer', function() {
  before(function() {
    window.ArcRenderer = ArcRenderer;
  });

  describe('createArcShape', function() {
    it('should create arc shape with correct properties', function() {
      const arc = window.ArcRenderer.createArcShape(100, 20, '#FF0000');
      expect(arc).to.have.property('type', 'arc');
      expect(arc).to.have.property('width', 100);
      expect(arc).to.have.property('height', 20);
      expect(arc.stroke).to.have.property('color', '#FF0000');
      expect(arc.stroke).to.have.property('width', 2);
    });
  });

  describe('generateArcShapes', function() {
    it('should generate arc for each syllable', function() {
      const shapes = window.ArcRenderer.generateArcShapes('maison', ['mai', 'son'], ['#FF0000', '#0000FF']);
      expect(shapes).to.have.lengthOf(2);
    });
  });
});
```

**Step 2: Run tests**
```bash
# Open tests/test.html in browser and verify arcRenderer tests pass
```

**Success Criteria:**
- [ ] ArcRenderer tests pass
- [ ] All edge cases handled

**Estimated Time:** 1 hour

---

#### Task 12: Manual Testing in ONLYOFFICE

**Files:** All arc-related files

**Step 1: Build and install plugin**
```bash
python3 package_plugin.py
# Install deploy/OnlyDys.plugin in ONLYOFFICE
```

**Step 2: Test arc rendering**
- Open ONLYOFFICE Word
- Select text
- Go to Lire tab
- Select Syllabes mode
- Enable "Afficher les arcs"
- Click "Appliquer à la sélection"

**Step 3: Verify behavior**
- [ ] Arcs appear under syllables
- [ ] Arcs have correct colors
- [ ] Arcs position correctly
- [ ] Arcs disappear when disabled
- [ ] Works with various syllables

**Success Criteria:**
- [ ] Arc rendering works in ONLYOFFICE
- [ ] No errors in console

**Estimated Time:** 1 hour

---

### Feature: Debouncing for On-the-Go Mode (Tasks 13-17)

**Objective:** Add debouncing to prevent excessive API calls during rapid cursor movement.

#### Task 13: Create Debounce Utility

**Files:**
- Modify: `scripts/plugin.js`

**Step 1: Add debounce function at top of plugin.js**
```javascript
// Replace stub at line 200 with complete implementation
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, delay);
  };
}
```

**Success Criteria:**
- [ ] Debounce function available globally
- [ ] Works with any function

**Estimated Time:** 30 minutes

---

#### Task 14: Apply Debounce to onSelectionChanged

**Files:**
- Modify: `scripts/plugin.js`

**Step 1: Wrap onSelectionChanged with debounce**
```javascript
// In suggestionService object:
const debouncedOnSelectionChanged = debounce(onSelectionChanged, 150);

// In start():
// Change: onSelectionChanged() calls
// To: debouncedOnSelectionChanged() calls

// In stop():
// Clear timeout on stop
stop: function() {
  isActive = false;
  clearTimeout(timeout);
  // ... existing cleanup code
}
```

**Success Criteria:**
- [ ] onSelectionChanged is debounced
- [ ] Timeout cleared on stop

**Estimated Time:** 1 hour

---

#### Task 15: Add Configurable Debounce Delay

**Files:**
- Modify: `scripts/plugin.js`
- Modify: `scripts/configManager.js`

**Step 1: Add debounce delay to config**
```javascript
// In ConfigManager config:
config: {
  mode: 'syllables',
  showArcs: false,
  highlightSilent: false,
  suggestionDebounceMs: 150  // New property
}
```

**Step 2: Use config value for debounce**
```javascript
// In plugin.js, access config from ConfigManager:
const debouncedOnSelectionChanged = debounce(
  onSelectionChanged, 
  (window.ConfigManager && window.ConfigManager.config.suggestionDebounceMs) || 150
);
```

**Success Criteria:**
- [ ] Debounce delay configurable
- [ ] Defaults to 150ms

**Estimated Time:** 1 hour

---

#### Task 16: Add Debounce Delay UI

**Files:**
- Modify: `index.html`
- Modify: `scripts/configManager.js`

**Step 1: Add input to settings**
```html
<!-- In Linguistics tab or Settings area -->
<div class="input-group">
  <label for="debounce-delay">Debounce Delay (ms):</label>
  <input type="number" id="debounce-delay" min="0" max="1000" value="150">
</div>
```

**Step 2: Bind to config**
```javascript
// In bindUI:
const debounceInput = document.getElementById('debounce-delay');
if (debounceInput) {
  debounceInput.value = this.config.suggestionDebounceMs || 150;
  debounceInput.addEventListener('change', (e) => {
    this.config.suggestionDebounceMs = parseInt(e.target.value) || 0;
    this.save();
  });
}
```

**Success Criteria:**
- [ ] User can adjust debounce delay via UI
- [ ] Value persists across sessions

**Estimated Time:** 1 hour

---

#### Task 17: Test Debouncing

**Files:** All modified files

**Step 1: Manual test**
- Open ONLYOFFICE
- Enable On-the-go mode
- Move cursor rapidly through text
- Observe: suggestions should not flicker rapidly
- Stop movement: suggestions should appear after delay

**Step 2: Test different delays**
- Set delay to 0: suggestions should be instantaneous
- Set delay to 500: suggestions should be noticeably delayed
- Set delay to 150: default behavior

**Success Criteria:**
- [ ] Debouncing works as expected
- [ ] No performance issues
- [ ] UI responsive

**Estimated Time:** 1 hour

---

### Feature: Loading Indicators (Tasks 18-21)

**Objective:** Add visual feedback during dictionary initialization.

#### Task 18: Add Loading Spinner HTML

**Files:**
- Modify: `index.html`

**Step 1: Add spinner element**
```html
<!-- Add at bottom of body or in appropriate location -->
<div id="loading-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.7); z-index: 1000;">
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
    <div class="spinner"></div>
    <p style="text-align: center; margin-top: 10px;">Chargement du dictionnaire...</p>
  </div>
</div>
```

**Step 2: Add spinner CSS**
```css
/* In plugin_style.css */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0047AB;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

**Success Criteria:**
- [ ] Spinner HTML and CSS in place
- [ ] Spinner centered and visible

**Estimated Time:** 1 hour

---

#### Task 19: Show Loading on Dictionary Load

**Files:**
- Modify: `scripts/suggestionLogic.js`
- Modify: `scripts/plugin.js`

**Step 1: Show loader before dictionary load**
```javascript
// In suggestionLogic.js, modify loadDictionary:
logic.loadDictionary = async function () {
  const loadingEl = document.getElementById('loading-overlay');
  if (loadingEl) loadingEl.style.display = 'block';
  
  try {
    const response = await fetch('data/dictionary_full.json');
    // ... existing code
  } catch (error) {
    logger.error('Error loading dictionary:', error);
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
};
```

**Success Criteria:**
- [ ] Loader shown during dictionary load
- [ ] Loader hidden on completion
- [ ] Loader hidden on error

**Estimated Time:** 1 hour

---

#### Task 20: Show Loading on Plugin Init

**Files:**
- Modify: `index.html`
- Modify: `scripts/plugin.js`

**Step 1: Show loader on plugin init**
```javascript
// In index.html, add init function:
window.Asc.plugin.init = function () {
  const loadingEl = document.getElementById('loading-overlay');
  if (loadingEl) loadingEl.style.display = 'block';
  this.resizeWindow(400, 500, 400, 500, 400, 500);
};

// In plugin.js, hide when ready:
// After dictionary and all modules loaded:
if (window.OnlyDysLogic && window.OnlyDysLogic.loadDictionary) {
  window.OnlyDysLogic.loadDictionary().then(() => {
    const loadingEl = document.getElementById('loading-overlay');
    if (loadingEl) loadingEl.style.display = 'none';
  });
}
```

**Success Criteria:**
- [ ] Loader shown during plugin initialization
- [ ] Loader hidden when plugin ready

**Estimated Time:** 1 hour

---

#### Task 21: Test Loading Indicators

**Files:** All modified files

**Step 1: Test initialization**
- Open plugin in ONLYOFFICE
- Observe: loading spinner should appear briefly
- Plugin should be usable after spinner disappears

**Step 2: Test with slow connection**
- Simulate slow loading (can use browser dev tools)
- Verify spinner remains visible during load
- Verify spinner disappears when done

**Success Criteria:**
- [ ] Loading indicators work correctly
- [ ] No visual glitches
- [ ] Good user experience

**Estimated Time:** 1 hour

---

## P1: High Priority Tasks

### Feature: English Language Support (Tasks 22-36)

**Objective:** Add comprehensive English language support to OnlyDys.

#### Task 22: Create English Dictionary Structure

**Files:**
- Create: `data/dictionary_en.json`

**Step 1: Create dictionary with same schema**
```json
[
  {
    "w": "house",
    "p": "H200",
    "g": "NOM",
    "i": "",
    "frequence_norm": 0.85
  },
  {
    "w": "have",
    "p": "H100",
    "g": "VER",
    "i": "",
    "frequence_norm": 0.95
  }
]
```

**Step 2: Use authoritative English word list**
- Source: Public domain word lists
- Include: Common English words
- Size: Similar to French dictionary (~50,000 entries)

**Success Criteria:**
- [ ] English dictionary file created
- [ ] Same schema as French dictionary

**Estimated Time:** 2 hours

---

#### Task 23: Add Language Selection UI

**Files:**
- Modify: `index.html`
- Modify: `scripts/plugin.js`

**Step 1: Add language selector to all tabs**
```html
<!-- Add to tab-bar or in each tab -->
<div class="language-selector" style="padding: 8px;">
  <label for="lang-select" style="margin-right: 8px;">Langue:</label>
  <select id="lang-select" style="padding: 4px;">
    <option value="fr">Français</option>
    <option value="en">English</option>
  </select>
</div>
```

**Step 2: Store selected language**
```javascript
// In plugin.js:
let currentLanguage = 'fr';

function initLanguageSelector() {
  const langSelect = document.getElementById('lang-select');
  if (!langSelect) return;
  
  const savedLang = localStorage.getItem('onlydys_language') || 'fr';
  langSelect.value = savedLang;
  currentLanguage = savedLang;
  
  langSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    localStorage.setItem('onlydys_language', currentLanguage);
    // Reload dictionary
    reloadDictionary();
  });
}
```

**Success Criteria:**
- [ ] Language selector visible
- [ ] Selection persists

**Estimated Time:** 1 hour

---

#### Task 24: Load Dictionary by Language

**Files:**
- Modify: `scripts/suggestionLogic.js`
- Modify: `scripts/plugin.js`

**Step 1: Modify loadDictionary to accept language**
```javascript
logic.loadDictionary = async function (lang = 'fr') {
  const dictFile = lang === 'fr' ? 'data/dictionary_full.json' : `data/dictionary_${lang}.json`;
  
  try {
    const response = await fetch(dictFile);
    if (!response.ok) {
      throw new Error(`Dictionary for ${lang} not found`);
    }
    dictionary = await response.json();
    logger.info(`Dictionary loaded for ${lang}`, { wordCount: dictionary.length });
  } catch (error) {
    logger.error(`Error loading ${lang} dictionary:`, error);
    // Fallback to French if English not found
    if (lang !== 'fr') {
      logger.info('Falling back to French dictionary');
      return logic.loadDictionary('fr');
    }
  }
};

// Add helper for external use:
logic.reloadDictionary = async function() {
  const lang = localStorage.getItem('onlydys_language') || 'fr';
  await logic.loadDictionary(lang);
};
```

**Success Criteria:**
- [ ] Dictionary loaded based on language
- [ ] Fallback to French if English not available

**Estimated Time:** 2 hours

---

#### Task 25: Add English Phoneme Rules

**Files:**
- Modify: `scripts/linguisticEngine.js`

**Step 1: Add English-specific constants**
```javascript
const ENGLISH_VOWELS = ["a", "e", "i", "o", "u", "y"];
const ENGLISH_MULTI_PHONEMES = [
  "sh", "ch", "th", "wh", "qu", "gh", "ph",
  "ee", "oo", "ai", "ea", "ie", "ei", "ou", "au",
  "tch", "dge", "ng", "ck"
];
const ENGLISH_SILENT_ENDINGS = [
  "e", "es", "s", "d", "t", "p", "b", "g", "k", "gh"
];
```

**Step 2: Add language-aware methods**
```javascript
LinguisticEngine.getConstants = function(lang) {
  if (lang === 'en') {
    return {
      VOWELS: ENGLISH_VOWELS,
      MULTI_PHONEMES: ENGLISH_MULTI_PHONEMES,
      SILENT_ENDINGS: ENGLISH_SILENT_ENDINGS
    };
  }
  // Default to French
  return {
    VOWELS: VOWELS,
    MULTI_PHONEMES: MULTI_PHONEMES,
    SILENT_ENDINGS: SILENT_ENDINGS
  };
};
```

**Step 3: Update all methods to use language-specific rules**
```javascript
LinguisticEngine.segmentPhonemes = function (word, lang = 'fr') {
  const constants = this.getConstants(lang);
  const normalizedWord = this.normalizeFrench(word);
  // Use constants.MULTI_PHONEMES instead of MULTI_PHONEMES
  // ... rest of method
};
```

**Success Criteria:**
- [ ] English phoneme rules defined
- [ ] All methods use language-specific constants

**Estimated Time:** 3 hours

---

#### Task 26: Add English Grammatical Categories

**Files:**
- Modify: `scripts/linguisticEngine.js`
- Modify: `scripts/colorizationEngine.js`

**Step 1: Map English dictionary categories to standard set**
```javascript
function normalizeGrammaticalCategory(cat, lang) {
  if (lang === 'en') {
    // Map English categories to standard
    const map = {
      'noun': 'NOM',
      'verb': 'VER', 
      'adjective': 'ADJ',
      'adverb': 'ADV',
      'pronoun': 'PRO',
      'determiner': 'DET',
      'preposition': 'PRE',
      'conjunction': 'CON',
      'interjection': 'INT'
    };
    return map[cat.toLowerCase()] || 'UNK';
  }
  // French categories already use standard abbreviations
  return cat;
}
```

**Step 2: Update colorization to support English**
```javascript
// Grammatical colors already support the same categories
// No changes needed to color mapping
```

**Success Criteria:**
- [ ] English categories mapped to standard set
- [ ] Colorization works for English text

**Estimated Time:** 1 hour

---

#### Task 27: Update Suggestion Logic for English

**Files:**
- Modify: `scripts/suggestionLogic.js`

**Step 1: Update getPhoneticCode for English**
```javascript
function getPhoneticCode(word, lang = 'fr') {
  if (!word || typeof word !== 'string') return '';
  let s = word.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, '');
  if (!s) return '';
  
  const firstLetter = s.charAt(0);
  
  // English-specific Soundex mapping
  const getCode = (char) => {
    if (lang === 'en') {
      if ('BFPV'.includes(char)) return '1';
      if ('CGJKQSXZ'.includes(char)) return '2';
      if ('DT'.includes(char)) return '3';
      if ('L'.includes(char)) return '4';
      if ('MN'.includes(char)) return '5';
      if ('R'.includes(char)) return '6';
    } else {
      // French mapping (existing)
      if ('BFPV'.includes(char)) return '1';
      if ('CGJKQSXZ'.includes(char)) return '2';
      if ('DT'.includes(char)) return '3';
      if ('L'.includes(char)) return '4';
      if ('MN'.includes(char)) return '5';
      if ('R'.includes(char)) return '6';
    }
    return '0';
  };
  
  // ... rest of function (same for both languages)
}
```

**Step 2: Update classifyConfusion for English**
```javascript
function classifyConfusion(motSaisi, suggestion, lang = 'fr') {
  // Visual confusions may differ by language
  if (lang === 'en') {
    // English-specific visual confusions
    const visualConfusions = { 'b': 'd', 'd': 'b', 'p': 'q', 'q': 'p', 'n': 'u', 'u': 'n', 'm': 'w', 'w': 'm' };
    // Check for these first
  } else {
    // French visual confusions (existing)
    const visualConfusions = { 'b': 'd', 'd': 'b', 'p': 'q', 'q': 'p', 'n': 'u', 'u': 'n' };
  }
  
  // ... rest of function
}
```

**Success Criteria:**
- [ ] Suggestions work for English
- [ ] Classification appropriate for English

**Estimated Time:** 2 hours

---

#### Task 28: Add Language-aware Classification

**Files:**
- Modify: `scripts/suggestionLogic.js`

**Step 1: Update classifyConfusion to accept language**
```javascript
// Update all calls to include language parameter
logic.classifyConfusion = classifyConfusion;

// Update in suggestionUI.js:
// const confusion = window.OnlyDysLogic.classifyConfusion(motSaisi, suggestion, currentLanguage);
```

**Step 2: Update classification patterns for English**
```javascript
function classifyConfusion(motSaisi, suggestion, lang = 'fr') {
  const phoneticSaisi = getPhoneticCode(motSaisi, lang);
  const phoneticSuggestion = getPhoneticCode(suggestion.w, lang);
  
  // Homophone confusion
  if (phoneticSaisi === phoneticSuggestion && 
      motSaisi.toLowerCase() !== suggestion.w.toLowerCase()) {
    return { type: 'Homophone', color: '#CC79A7', icon: '🔀' };
  }
  
  // Use language-specific visual confusions
  const visualConfusions = lang === 'en' 
    ? { 'b': 'd', 'd': 'b', 'p': 'q', 'q': 'p', 'n': 'u', 'u': 'n', 'm': 'w', 'w': 'm' }
    : { 'b': 'd', 'd': 'b', 'p': 'q', 'q': 'p', 'n': 'u', 'u': 'n' };
  
  // ... rest of checks using language-specific patterns
}
```

**Success Criteria:**
- [ ] Classification respects language selection
- [ ] Appropriate patterns for each language

**Estimated Time:** 2 hours

---

#### Task 29: Test English Support

**Files:**
- Modify: `tests/linguisticEngine.test.js`
- Modify: `tests/suggestionLogic.test.js`

**Step 1: Add English tests to linguisticEngine.test.js**
```javascript
describe('LinguisticEngine - English', function() {
  describe('Phoneme Segmentation', function() {
    it('should segment English words', function() {
      const phonemes = window.LinguisticEngine.segmentPhonemes('house', 'en');
      expect(phonemes).to.include('h');
      expect(phonemes).to.include('ou');
    });
  });
  
  describe('Syllable Segmentation', function() {
    it('should split English words into syllables', function() {
      const syllables = window.LinguisticEngine.segmentSyllables('house', 'en');
      expect(syllables).to.have.length.greaterThan(0);
    });
  });
  
  describe('Silent Letter Detection', function() {
    it('should detect silent e', function() {
      const silent = window.LinguisticEngine.detectSilentLetters('house', 'en');
      expect(silent).to.have.length.greaterThan(0);
    });
  });
});
```

**Step 2: Add English tests to suggestionLogic.test.js**
```javascript
describe('SuggestionLogic - English', function() {
  before(async function() {
    // Load English dictionary
    await window.OnlyDysLogic.loadDictionary('en');
  });
  
  it('should generate suggestions for English words', function() {
    const suggestions = window.OnlyDysLogic.classerSuggestions('teh', 'the', 'en');
    expect(suggestions.length).to.be.greaterThan(0);
  });
  
  it('should classify English confusion types', function() {
    const confusion = window.OnlyDysLogic.classifyConfusion('teh', { w: 'the', p: 'T000', g: 'UNK' }, 'en');
    expect(confusion).to.have.property('type');
  });
});
```

**Success Criteria:**
- [ ] English tests written
- [ ] Tests pass

**Estimated Time:** 2 hours

---

#### Task 30: Manual Testing with English Text

**Files:** All modified files

**Step 1: Verify English dictionary loads**
- Select English language
- Type English words
- Verify suggestions appear

**Step 2: Test all modes with English**
- Suggestions tab
- Linguistics tab (colorization)
- Dyslexia simulation
- Font application

**Success Criteria:**
- [ ] English suggestions work
- [ ] No errors for English text
- [ ] All features functional

**Estimated Time:** 2 hours

---

*Tasks 31-36 would continue with additional English support tasks, but due to length constraints, the pattern is established above.*

### Feature: Personal Dictionary (Tasks 37-44)

**Objective:** Allow users to add custom word corrections that persist across sessions.

#### Task 37: Extend ConfigManager for Personal Dictionary

**Files:**
- Modify: `scripts/configManager.js`

**Step 1: Add personal dictionary to config schema**
```javascript
// Expand config:
config: {
  mode: 'syllables',
  showArcs: false,
  highlightSilent: false,
  // New:
  personalDictionary: []  // Array of { original: string, correction: string }
}
```

**Step 2: Add methods for managing personal dictionary**
```javascript
// Add to ConfigManager:
addPersonalWord: function(original, correction) {
  this.config.personalDictionary.push({ original, correction });
  this.save();
},

removePersonalWord: function(original) {
  this.config.personalDictionary = this.config.personalDictionary
    .filter(entry => entry.original !== original);
  this.save();
},

getPersonalWord: function(original) {
  return this.config.personalDictionary
    .find(entry => entry.original === original);
}
```

**Success Criteria:**
- [ ] Personal dictionary methods in place
- [ ] Data persists in localStorage

**Estimated Time:** 2 hours

---

*Remaining tasks (38-44 and beyond) follow similar patterns to the above. The task.md file would continue with detailed steps for each feature.*

---

## Task Status Tracking

### P0 Tasks (1-21)
- [ ] Task 1: Understand Current ArcRenderer Implementation
- [ ] Task 2: Design Syllable Arc Shape Definition
- [ ] Task 3: Implement Text Measurement for Positioning
- [ ] Task 4: Create Arc Shape Generation Function
- [ ] Task 5: Integrate with SelectionManager
- [ ] Task 6: Add Arc Toggle to UI
- [ ] Task 7: Wire Up Arc Application
- [ ] Task 8: Implement ApplyArcs Function
- [ ] Task 9: Add Arc Cleanup Functionality
- [ ] Task 10: Update Preview to Show Arcs
- [ ] Task 11: Test Arc Rendering
- [ ] Task 12: Manual Testing in ONLYOFFICE
- [ ] Task 13: Create Debounce Utility
- [ ] Task 14: Apply Debounce to onSelectionChanged
- [ ] Task 15: Add Configurable Debounce Delay
- [ ] Task 16: Add Debounce Delay UI
- [ ] Task 17: Test Debouncing
- [ ] Task 18: Add Loading Spinner HTML
- [ ] Task 19: Show Loading on Dictionary Load
- [ ] Task 20: Show Loading on Plugin Init
- [ ] Task 21: Test Loading Indicators

### P1 Tasks (22-51)
- [ ] Task 22: Create English Dictionary Structure
- [ ] Task 23: Add Language Selection UI
- [ ] Task 24: Load Dictionary by Language
- [ ] Task 25: Add English Phoneme Rules
- [ ] Task 26: Add English Grammatical Categories
- [ ] Task 27: Update Suggestion Logic for English
- [ ] Task 28: Add Language-aware Classification
- [ ] Task 29: Test English Support
- [ ] Task 30: Manual Testing with English Text
- [ ] Tasks 31-36: (Additional English support tasks)
- [ ] Task 37: Extend ConfigManager for Personal Dictionary
- [ ] Tasks 38-44: (Additional personal dictionary tasks)

### P2 Tasks (52-71)
- [ ] Task 52-58: Custom Color Schemes
- [ ] Task 59-63: Font Size Adjustment
- [ ] Task 64-71: Dark Mode Support

---

## Task Prioritization Matrix

| Priority | Feature | Effort | Impact | Dependencies |
|----------|---------|--------|--------|--------------|
| P0 | Syllable Arc Rendering | High | High | ONLYOFFICE API |
| P0 | Debouncing | Low | High | None |
| P0 | Loading Indicators | Low | Medium | None |
| P1 | English Support | High | High | Dictionary |
| P1 | Personal Dictionary | Medium | High | localStorage |
| P1 | Error Boundaries | Medium | Medium | None |
| P2 | Custom Colors | Medium | Medium | UI |
| P2 | Font Size Adjustment | Low | Medium | UI |
| P2 | Dark Mode | Medium | Low | CSS |

---

## Quick Start Guide

### For New Contributors

1. **Read the Constitution** (`.specify/memory/constitution.md`) - Understand project values
2. **Read the Plan** (this file) - Understand current priorities
3. **Pick an Unassigned Task** - Look for `[ ]` checkmarks in P0/P1 sections
4. **Implement the Task** - Follow the step-by-step instructions
5. **Test Your Changes** - Run tests/test.html and manual testing
6. **Submit PR** - Reference the task number in PR description

### For Task Implementation

Each task follows the same pattern:
1. **Read** the relevant files
2. **Understand** the current state and requirements
3. **Implement** the changes following the examples
4. **Test** both automated and manual tests
5. **Verify** against acceptance criteria
6. **Document** any deviations or issues

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-04-26 | Mistral Vibe | Initial task list based on project analysis |

---

*This is a living document. Tasks should be added, updated, and marked complete as work progresses. See constitution.md for project principles and plan.md for overall strategy.*
