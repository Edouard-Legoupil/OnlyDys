# OnlyDys Project Plan

> **For Mistral Vibe:** Use subagent-driven-development or executing-plans to implement this plan task-by-task.

**Goal:** Maintain and enhance the OnlyDys plugin, a privacy-first ONLYOFFICE plugin designed to assist French-speaking users with dyslexia through real-time word suggestions, linguistic colorization, and dyslexia-friendly formatting.

**Architecture:** 
The plugin follows a modular JavaScript architecture with 12 core modules: plugin.js (orchestrator), linguisticEngine.js (French NLP), colorizationEngine.js (visual formatting), suggestionLogic.js (suggestion algorithms), suggestionUI.js (interactive cards), styleManager.js (global styling), dyslexia.js (simulation), configManager.js (settings), selectionManager.js (document access), logger.js (diagnostics), pictogramService.js (ARASAAC integration), and arcRenderer.js (syllable arcs).

**Tech Stack:** 
- JavaScript (ES5+ for ONLYOFFICE compatibility)
- ONLYOFFICE SDK v1
- Web Speech API (text-to-speech)
- ARASAAC API (pictograms)
- Mocha + Chai (testing)
- No external dependencies for core functionality

---

## Project State Summary

### ✅ Completed
- [x] Core plugin structure and architecture
- [x] Real-time suggestions (on-the-go and selection modes)
- [x] Suggestion classification (Visual, Phonetic, Homophone, Morphological)
- [x] Linguistic analysis (phonemes, syllables, silent letters)
- [x] Grammatical coloring (9 categories)
- [x] Multiple colorization modes
- [x] Dyslexia simulation
- [x] OpenDyslexic font support
- [x] Text-to-speech integration
- [x] Pictogram support (ARASAAC API)
- [x] Smart font detection
- [x] Comprehensive test suite
- [x] User preference persistence

### 🟡 Current Status
- Plugin is functional and deployed
- Version 1.0.0
- 11 JavaScript modules (~170KB)
- 50,000-word French dictionary
- 6 test files with Mocha/Chai
- Full documentation in README.md
- Specification document created (specs/001-onlydys/spec.md)
- project constitution ratified (.specify/memory/constitution.md)

### 🎯 Next Priorities

#### P0 - Critical
1. **Syllable Arc Rendering** - Currently partial implementation in arcRenderer.js, needs integration with selectionManager
2. **Debouncing for On-the-Go Mode** - Prevent rapid API calls during cursor movement
3. **Loading Indicators** - Visual feedback during dictionary load

#### P1 - High
4. **English Language Support** - Add English dictionary and linguistic rules
5. **Personal Dictionary** - User-defined word corrections
6. **Multi-word Suggestions** - Contextual suggestions based on surrounding words
7. **Font Tab Localization** - Add French translations for font installation instructions
8. **Error Boundaries** - Prevent plugin crashes from affecting ONLYOFFICE

#### P2 - Medium
9. **Spanish/German Language Support** - Expand to other languages
10. **Custom Color Schemes** - UI for color customization
11. **Font Size Adjustment** - Slider for dynamic font sizing
12. **Dark Mode Support** - CSS theme for dark ONLYOFFICE interface
13. **Settings Export/Import** - Backup and restore user preferences
14. **Keyboard Shortcuts** - Quick access to features
15. **Word Blacklist** - Ignore repeated/known suggestions

#### P3 - Low
16. **Advanced Statistics** - Word frequency, common errors tracking
17. **Voice Input** - Speech-to-text integration
18. **Collaboration Features** - Real-time shared highlighting
19. **Mobile Support** - Touch-optimized UI
20. **Plugin Update Notifications** - Alert users to new versions

---

## Implementation Plans by Priority

### P0: Syllable Arc Rendering Completion

**Objective:** Implement functional syllable arc rendering that draws visual arcs under syllables in the document.

**Architecture:**
- arcRenderer.js: Generate ONLYOFFICE shape definitions
- selectionManager.js: Apply shapes to document at syllable positions
- ColorizationEngine integration: Coordinate with text colorization

**Tasks:** 12 tasks (see task.md: Tasks 1-12)

**Dependencies:**
- ONLYOFFICE shape API
- Text measurement API for positioning

**Testing Strategy:**
- Test arc generation for various syllable patterns
- Test positioning accuracy
- Test interaction with colorization

---

### P0: Debouncing for On-the-Go Mode

**Objective:** Prevent excessive API calls during rapid cursor movement, improving performance and reducing UI flicker.

**Architecture:**
- Add debounce utility function (already stubbed in plugin.js line 200)
- Apply to onSelectionChanged handler
- Configurable debounce delay (default: 150ms)

**Tasks:** 5 tasks (see task.md: Tasks 13-17)

**Dependencies:**
- Lodash debounce or custom implementation

**Testing Strategy:**
- Test that suggestions don't fire during rapid cursor movement
- Test that final position triggers suggestion

---

### P0: Loading Indicators

**Objective:** Provide visual feedback during dictionary initialization to improve user experience.

**Architecture:**
- Add loading spinner element to HTML
- Show during async dictionary load
- Hide on completion or error

**Tasks:** 4 tasks (see task.md: Tasks 18-21)

**Dependencies:**
- CSS animations for spinner

**Testing Strategy:**
- Visual verification of loading state
- Test error state handling

---

### P1: English Language Support

**Objective:** Add English language support with equivalent linguistic analysis quality.

**Architecture:**
- Add English dictionary (similar structure to dictionary_full.json)
- Extend linguisticEngine.js with English phoneme rules
- Extend silent letter detection for English patterns
- Add English grammatical categories
- Add language selection UI

**Tasks:** 15 tasks (see task.md: Tasks 22-36)

**Dependencies:**
- Recognizable English dictionary source
- English phoneme segmentation rules

**Testing Strategy:**
- Test all linguistic features with English text
- Verify classification accuracy

---

### P1: Personal Dictionary

**Objective:** Allow users to add custom word corrections that persist across sessions.

**Architecture:**
- Extend localStorage schema for user additions
- Add UI for word addition/editing
- Integrate with suggestion logic
- Allow export/import of personal dictionary

**Tasks:** 8 tasks (see task.md: Tasks 37-44)

**Dependencies:**
- localStorage API
- JSON serialization

**Testing Strategy:**
- Test CRUD operations on personal dictionary
- Test persistence across page reloads
- Test integration with suggestions

---

### P2: Custom Color Schemes

**Objective:** Allow users to customize the color palettes used for various colorization modes.

**Architecture:**
- Extend configManager.js with color preferences
- Add color picker UI components
- Update colorizationEngine.js to use custom colors
- Store color schemes in localStorage

**Tasks:** 7 tasks (see task.md: Tasks 45-51)

**Dependencies:**
- Color picker library or custom implementation

**Testing Strategy:**
- Test color selection and application
- Test persistence

---

## File Modification Map

| Feature | Files to Create | Files to Modify | Tests to Add |
|---------|----------------|-----------------|-------------|
| Syllable Arcs | - | arcRenderer.js, selectionManager.js, plugin.js | arcRenderer.test.js |
| Debouncing | - | plugin.js | plugin.test.js (new) |
| Loading Indicators | - | index.html, plugin.js, plugin_style.css | - |
| English Support | data/dictionary_en.json | linguisticEngine.js, suggestionLogic.js, plugin.js | linguisticEngine.test.js, suggestionLogic.test.js |
| Personal Dictionary | - | configManager.js, suggestionLogic.js, index.html, plugin_style.css | configManager.test.js, suggestionLogic.test.js |
| Custom Colors | - | configManager.js, colorizationEngine.js, index.html, plugin_style.css | colorizationEngine.test.js |

---

## Testing Strategy

### Unit Tests
- Each module has dedicated test file
- Tests run in browser via test.html
- Mocha + Chai framework
- Target: >80% coverage of core algorithms

### Integration Tests
- Test interaction between modules
- Test full workflows (suggestion → display → replace)
- Test with real ONLYOFFICE API

### Manual Tests
- Required before merging
- Test in ONLYOFFICE Desktop Editors
- Test in Word, Cell, and Slide editors
- Test with French text containing diacritics
- Test edge cases (empty documents, large documents)

### Performance Tests
- Measure dictionary load time
- Measure suggestion generation time
- Measure colorization time
- Identify and optimize bottlenecks

---

## Performance Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| Dictionary Load | < 200ms | ✅ Measured ~50-200ms |
| Suggestion Generation | < 50ms | ✅ Measured ~10-50ms |
| Paragraph Colorization | < 20ms | ⚠️ Needs measurement |
| Syllable Segmentation | < 1ms | ✅ Confirmed |
| Initial Plugin Load | < 500ms | ⚠️ Needs measurement |
| Memory Usage | < 50MB | ⚠️ Needs measurement |

---

## Risk Assessment

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ONLYOFFICE API changes | Medium | High | Version detection, fallbacks |
| Dictionary too large | Low | Medium | Lazy loading, compression |
| Performance issues | Medium | Medium | Profiling, optimization |
| Browser compatibility | Low | Medium | Feature detection, polyfills |

### Project Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Maintainer burnout | Medium | High | Community building, documentation |
| Low adoption | Medium | Medium | User testing, outreach to schools |
| Feature creep | Medium | Low | Strict adherence to constitution |

---

## Decision Log

| Date | Decision | Rationale | Trade-offs |
|------|----------|-----------|------------|
| 2024-04-26 | Prioritize syllable arcs over new languages | Core feature incomplete | Delays multilingual support |
| 2024-04-26 | Client-side only processing | Privacy requirement | Limits some advanced features |
| 2024-04-26 | Offline-first design | School environment requirement | Larger plugin size |
| 2024-04-26 | Single-word suggestion limit (9) | Performance consideration | Limits batch processing |

---

## Success Metrics

### Technical Metrics
- Test coverage > 80%
- No critical bugs in production
- All P0 features functional
- Plugin size < 10MB
- Load time < 500ms

### User Metrics
- Active users (if tracking were enabled)
- User feedback and testimonials
- Adoption in schools
- Suggestions accepted/rejected rate

### Quality Metrics
- GitHub stars (community interest)
- Issues opened/closed ratio
- Pull request review time
- Documentation completeness

---

## Maintenance Schedule

### Regular
- **Daily:** Monitor issues and PRs
- **Weekly:** Run full test suite
- **Monthly:** Review and prioritize backlog

### Periodic
- **Quarterly:** Performance review and optimization
- **Bi-annually:** ONLYOFFICE version compatibility check
- **Annually:** Major version release with new features

### Continuous
- Documentation updates
- Dependency updates (if any)
- Security reviews

---

## Resources

### Documentation
- [README.md](../README.md) - User documentation
- [specs/001-onlydys/spec.md](../../specs/001-onlydys/spec.md) - Technical specification
- [.specify/memory/constitution.md](./constitution.md) - Project constitution
- [ONLYOFFICE SDK](https://onlyoffice.github.io/sdkjs-plugins/) - Plugin development
- [ARASAAC API](https://api.arasaac.org/) - Pictogram service

### Tools
- Build: `python3 package_plugin.py`
- Test: Open `tests/test.html` in browser
- Debug: Browser console with `logger.setLevel(logger.LogLevel.DEBUG)`

### Community
- GitHub Issues: https://github.com/Edouard-Legoupil/OnlyDys/issues
- Primary tester: Lisa (Edouard's daughter)
- School: Normandy school using the plugin

---

*This plan is a living document and should be updated as priorities shift and new information becomes available.*
