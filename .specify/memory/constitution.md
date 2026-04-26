# OnlyDys Constitution

## Core Principles

### I. Accessibility First
Every feature, design decision, and implementation must prioritize the needs of users with dyslexia. Accessibility is not a secondary consideration but the primary driver of all development. The plugin exists to make reading and writing more accessible, particularly for French-speaking individuals with dyslexia. All features must be evaluated against: Does this genuinely help a dyslexic user? If the answer is unclear, the feature should not be implemented.

### II. Privacy by Design
User privacy is paramount. All text processing must occur client-side without transmitting user data to external servers. The plugin shall never send document content, user keystrokes, or personal information to any external service except when explicitly initiated by the user (e.g., fetching a pictogram for a single word). No telemetry, tracking, analytics, or usage statistics may be collected. User data belongs to the user and stays on their device.

### III. Offline-First
The plugin must function without an internet connection. The full dictionary and all core functionality must be bundled with the plugin. Optional features that require network access (such as pictogram fetching) must gracefully degrade when offline. Users in schools, rural areas, or restrictive network environments must have full access to the plugin's primary features.

### IV. Open Source & Transparency
All source code must remain open source and freely available. The plugin shall not include any proprietary code, obfuscation, or licensing restrictions beyond those that ensure it remains open. Users and contributors must be able to understand, modify, and redistribute the code. Decision-making about features and direction should be transparent and community-involved when possible.

### V. User-Centric Design
The primary user and tester is Lisa (Edouard's daughter) and the school she attends. Design decisions must be validated with actual dyslexic users, not assumed. The interface must be intuitive for children and adults alike. Complexity should be hidden behind simple, discoverable interfaces. Every feature must serve a clear, user-identifiable need. If a feature cannot be explained simply to a child, it should be reconsidered.

### VI. Performance for All Devices
The plugin must perform well on low-end devices, including older computers used in schools. Dictionary loading must be asynchronous and non-blocking. Suggestions must appear in real-time without noticeable lag. Algorithms must be optimized for the constraints of web-based document editors. Large datasets (like the 50,000-entry French dictionary) must be handled with memory efficiency in mind.

### VII. Progressive Enhancement
Core functionality must work in all supported ONLYOFFICE environments. Features may be enhanced in modern versions but must never break in older supported versions. The plugin should detect API limitations and adapt gracefully, providing the best possible experience given the constraints of the environment. Fallback strategies must be in place for restricted modes.

### VIII. French Language Excellence
As the plugin's primary audience is French-speaking, all linguistic analysis must be accurate and culturally appropriate for French. Phoneme rules, syllable patterns, silent letter detection, and grammatical classification must reflect actual French language usage. The dictionary must be comprehensive and based on authoritative sources (Brulex). Support for other languages, if added, must meet the same high standard.

### IX. Maintainability & Clarity
Code must be well-documented, modular, and testable. Each module should have a single, clear responsibility. Complex logic must be isolated and thoroughly tested. The architecture must allow new contributors to understand and modify the codebase without excessive onboarding. Code style should be consistent, and comments should explain why, not what (the code itself should be self-documenting where possible).

### X. Test-Driven Quality
All core functionality must have unit tests. The test suite must be runnable in a browser environment. Tests should cover:
- Linguistic algorithms (phoneme segmentation, syllable detection)
- Suggestion logic (classification, scoring)
- Colorization engine (mode handling, color mapping)
- Configuration management (save, load, apply)
- Error handling and edge cases

New features must include tests. Bug fixes must include regression tests. The codebase should strive for >80% test coverage of core algorithms.

## Development Standards

### Code Quality
- Follow existing code patterns and style in the codebase
- Use descriptive variable and function names
- Prefer pure functions where possible
- Keep functions small and single-purpose
- Add JSDoc comments for all public functions and complex logic
- Include inline comments for non-obvious implementation details

### Modular Architecture
The plugin follows a modular design where each component has a specific, well-defined role:
- `plugin.js`: Orchestrator - handles UI, tab switching, ONLYOFFICE API
- `linguisticEngine.js`: French language analysis - phonemes, syllables, silent letters
- `colorizationEngine.js`: Visual formatting - applies colors based on analysis
- `suggestionLogic.js`: Suggestion algorithms - scoring, classification
- `suggestionUI.js`: User interface for suggestions - cards, interactions
- `styleManager.js`: Global document styling - fonts, spacing
- `dyslexia.js`: Dyslexia simulation - letter scrambling
- `configManager.js`: User preferences - persistence, UI binding
- `selectionManager.js`: Document access - model extraction and application
- `logger.js`: Debugging and diagnostics - centralized logging
- `pictogramService.js`: External integration - ARASAAC API
- `arcRenderer.js`: Visual aids - syllable arc generation

New features should follow this pattern: create a new module for significant functionality, or extend an existing module if the functionality is closely related.

### Documentation Requirements
- All public functions must have JSDoc comments
- All modules must have a header comment describing their purpose
- Complex algorithms must have inline documentation
- All user-facing text should be in French (primary) and English (secondary)
- Configuration options must be documented
- Dependencies between modules must be explicit

### Browser Compatibility
- Must work in modern browsers: Chrome, Firefox, Edge, Safari
- Must work in ONLYOFFICE Desktop Editors (which use a Node.js-like environment)
- Must handle API variations between ONLYOFFICE versions gracefully
- Feature detection preferred over browser detection

### Security Requirements
- NO user data may be transmitted without explicit user action
- All external API calls must be over HTTPS
- No tracking pixels, web beacons, or analytics scripts
- No third-party libraries with tracking capabilities
- All dependencies must be reviewed for privacy implications
- Error messages must not expose sensitive information

### Performance Requirements
- Dictionary must load in < 200ms on modern hardware
- Suggestions must appear within 50ms of text detection
- Colorization of a typical paragraph must complete in < 20ms
- Memory usage must not exceed reasonable limits for browser plugins
- No memory leaks in long-running sessions

## Development Workflow

### Contribution Process
1. **Fork the repository** and create a feature branch
2. **Write tests first** for new functionality (TDD approach)
3. **Implement the feature** with clear, modular code
4. **Run all tests** to ensure nothing is broken
5. **Test manually** in ONLYOFFICE Desktop Editors
6. **Document** new features and configuration options
7. **Submit a pull request** with a clear description of changes

### Testing Gates
- All existing tests must pass before merging
- New features must have corresponding tests
- Manual testing in ONLYOFFICE is required
- Test in both Word and Cell editors (minimum)
- Test with French text containing diacritics

### Review Process
Every PR must be reviewed by at least one maintainer. Review criteria:
- Does this align with the Core Principles?
- Is the code clear and maintainable?
- Are tests comprehensive?
- Is documentation complete?
- Does this work in the target environment (ONLYOFFICE)?
- Are there privacy or security concerns?

### Release Process
1. Update version number in `config.json`
2. Update `CHANGELOG.md` with new features and fixes
3. Run all tests and verify in ONLYOFFICE
4. Build the plugin using `python3 package_plugin.py`
5. Test the packaged `.plugin` file
6. Create a GitHub release with the built plugin
7. Update README if there are significant changes

## Quality Gates

### Before Merging
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Manual testing in ONLYOFFICE successful
- [ ] Code follows existing patterns
- [ ] Documentation updated
- [ ] No privacy/security violations
- [ ] Performance impact acceptable

### Before Release
- [ ] Version numbers updated
- [ ] CHANGELOG updated
- [ ] Plugin builds successfully
- [ ] Built plugin tested in desktop editors
- [ ] No console errors in normal usage
- [ ] All modes tested (suggestions, linguistics, dyslexia, etc.)

## Governance

This Constitution supersedes all other development practices and guidelines for the OnlyDys project. In cases of conflict between this Constitution and other documentation, this Constitution takes precedence.

### Amendments
Amendments to this Constitution require:
1. A documented need or issue that the amendment addresses
2. Discussion and approval by the project maintainer(s)
3. A clear migration plan if existing code or practices are affected
4. Documentation of the change and its rationale

### Exceptions
Exceptions to these principles require explicit justification and documentation. Temporary exceptions for experiments or prototypes must be clearly marked and removed or formalized within a reasonable timeframe.

### Enforcement
- All PR reviews must verify compliance with these principles
- Automated checks (linting, tests) should enforce where possible
- Non-compliant code must be flagged and addressed
- Repeated violations may result in removal of commit access

## Specific Constraints

### Technology Stack
- Primary language: JavaScript (ES5+ for ONLYOFFICE compatibility)
- No external dependencies for core functionality
- ONLYOFFICE SDK v1 for plugin interface
- Web Speech API for text-to-speech (optional)
- ARASAAC API for pictograms (optional, user-initiated)

### Prohibited
- Any form of user tracking or analytics
- Transmission of document content to external servers
- Obfuscated or minified source code in the repository
- Proprietary or closed-source dependencies
- Features that require internet access for core functionality
- Non-French language support without equivalent quality

### Required
- Comprehensive error handling with graceful degradation
- Fallback mechanisms for API limitations
- Loading states and user feedback
- Accessible UI (keyboard navigation, screen reader support)
- Responsive design for plugin panel

## Inspiration & Credits

OnlyDys builds upon the work of many accessibility pioneers. We stand on the shoulders of:
- PhonoWriter - Phonetic analysis concepts
- Colorization.ch - Text colorization techniques
- LireCouleur - French linguistic rules and patterns
- Studys - Dyslexia support approaches
- Cartable Fantastique - LibreOffice plugin inspiration
- Lexibar - Writing assistance concepts
- OpenDyslexic, Accessible-DfA, Luciole - Dyslexia-friendly fonts

We honor their contributions by maintaining the same spirit of open, accessible, privacy-respecting software development.

**Version**: 1.0.0 | **Ratified**: 2024-04-26 | **Last Amended**: 2024-04-26
