
## Development


### Background 

The primary user and tester for this plugin is my daughter, Lisa, and the school she is attending in Normandy. Though, this tool might support  as well other kids with similar challenges. 

I have reviewed a set of existing tools (unfortunately none being both open source and working on a Linux desktop...) and combined them to build this plugin:

 - [PhonoWriter](https://www.jeanclaudegabus.ch/produits/phonowriter/)
 - [Colorization](https://colorization.ch/)
 - [LireCouleur](https://forge.apps.education.fr/lirecouleur/lirecouleur.forge.apps.education.fr)
 - [Studys](https://studys.fusofrance.org/)
 - [Cartable Fantastique](https://www.cartablefantastique.fr/outils-pour-compenser/le-plug-in-libre-office/)
 - [Lexibar](https://www.lexibar.ca/ca/en/)

The plugins integrates fonts with specific focus on dyslexia and dysgraphia:

- [OpenDyslexic](https://opendyslexic.org/)
- [Accessible-DfA](https://github.com/Orange-OpenSource/font-accessible-dfa)
- [Luciole](https://www.luciole-vision.com/#download)

### Environment

This tool was mostly coded using vibe coding in [Antigravity](https://antigravity.google/) and [jules](https://jules.google.com). You can clone the repository to contribute. **To build the plugin**:
 - Run the build script: `python3 package_plugin.py`
 - This will create the `OnlyDys.plugin` file in the `deploy` folder.

If you spot any issue or have any ideas of additional features or capabilities, please [create an issue here](https://github.com/Edouard-Legoupil/OnlyDys/issues/new).


### Viewing Logs

The plugin uses a custom logger to output debugging information to the browser's console. To view the logs, you'll need to open the developer tools in your browser.

1.  **Open the developer tools.** In most browsers, you can do this by pressing `F12` or by right-clicking on the page and selecting "Inspect".
2.  **Navigate to the console.** The console is where the plugin will output its logs.
3.  **Set the log level.** By default, the logger is set to the `INFO` level. You can change the log level by opening the console and typing `logger.setLevel(logger.LogLevel.DEBUG)`. This will enable all logging levels.

### Running Unit Tests

The plugin includes a suite of unit tests to ensure that the core logic is working correctly. To run the tests, you'll need to open the `tests/test.html` file in your browser.

1.  **Navigate to the `tests/` directory.**
2.  **Open the `test.html` file in your browser.** This will run the tests and display the results in the browser.

### Architecture & Class Interactions

The OnlyDys plugin follows a modular architecture where different components handle specific linguistic and UI tasks.



| Component | File Reference | Responsibility |
| :--- | :--- | :--- |
| **plugin.js** | [scripts/plugin.js](scripts/plugin.js) | The core orchestrator. Handles tab switching, initialization, and high-level command execution. |
| **ConfigManager** | [scripts/configManager.js](scripts/configManager.js) | Manages user settings (mode, arcs, silent letters). Handles UI bindings for the settings tab and persistence. |
| **SelectionManager** | [scripts/selectionManager.js](scripts/selectionManager.js) | Abstracts ONLYOFFICE document access. Converts selections into a structured JSON model and back. |
| **LinguisticEngine** | [scripts/linguisticEngine.js](scripts/linguisticEngine.js) | The "brain" for French processing. Handles vowel/consonant detection, syllable splitting, and silent letter rules. |
| **ColorizationEngine** | [scripts/colorizationEngine.js](scripts/colorizationEngine.js) | Bridge between linguistic analysis and visual formatting. Applies colors to the text model based on config. |
| **OnlyDysStyles** | [scripts/styleManager.js](scripts/styleManager.js) | Specifically handles global document-wide formatting like the OpenDyslexic font, line height, and spacing. |
| **OnlyDysDyslexia** | [scripts/dyslexia.js](scripts/dyslexia.js) | Implements the dyslexia simulation (scrambling letters) to help users empathize with dyslexic readers. |
| **OnlyDysLogic** | [scripts/suggestionLogic.js](scripts/suggestionLogic.js) | Contains the algorithmic core for suggestions: phonetic coding, Levenshtein distance, and confusion classification. |
| **OnlyDysUI** | [scripts/suggestionUI.js](scripts/suggestionUI.js) | Manages the dynamic creation of HTML elements for suggestions, including visual icons and read-aloud buttons. |
| **Logger** | [scripts/logger.js](scripts/logger.js) | Provides centralized logging for debugging, with the ability to download logs via the "About" tab. |
| **Pictogram Service** | [scripts/pictogramService.js](scripts/pictogramService.js) | Helper to fetch ARASAAC pictograms for words to provide visual aids. |



```mermaid
classDiagram
    class AscPlugin {
        <<Global: window.Asc.plugin>>
        +init()
        +button(id)
        +callCommand(func)
        +executeMethod(method, args)
    }

    class plugin_js {
        <<File: scripts/plugin.js>>
        +loadTab(tabName)
        +initLinguisticsTab()
        +applyLinguisticsToDocument()
        +initSuggestionsTab()
        +checkFont()
    }

    class ConfigManager {
        <<File: scripts/configManager.js>>
        +config
        +init()
        +bindUI()
        +save()
        +updatePreview()
        +applyToDocument()
    }

    class SelectionManager {
        <<File: scripts/selectionManager.js>>
        +getCurrentSelectionModel()
        +applyChanges(model)
    }

    class LinguisticEngine {
        <<File: scripts/linguisticEngine.js>>
        +analyzeWord(word)
        +segmentPhonemes(word)
        +segmentSyllables(word)
        +detectSilentLetters(word)
    }

    class ColorizationEngine {
        <<File: scripts/colorizationEngine.js>>
        +palettes
        +processModel(model, config)
        +processRun(run, config, wordMap)
    }

    class OnlyDysStyles {
        <<File: scripts/styleManager.js>>
        +applyStyleToDocument()
        +revertStyleInDocument()
    }

    class OnlyDysDyslexia {
        <<File: scripts/dyslexia.js>>
        +applyDyslexiaToDocument(options)
        +processText(str, options)
        +storeOriginal(text)
    }

    class OnlyDysLogic {
        <<File: scripts/suggestionLogic.js>>
        +loadDictionary()
        +classerSuggestions(motSaisi, motPrecedent)
        +classifyConfusion(motSaisi, suggestion)
        +getPhoneticCode(word)
    }

    class OnlyDysUI {
        <<File: scripts/suggestionUI.js>>
        +displaySuggestions(suggestions, motSaisi)
        +replaceCurrentWord(wordToInsert)
    }

    class Logger {
        <<File: scripts/logger.js>>
        +info(msg, data)
        +error(msg, err)
        +getLogs()
    }

    %% Interactions
    plugin_js --> AscPlugin : Uses
    plugin_js --> ConfigManager : Orchestrates
    plugin_js --> OnlyDysStyles : Controls font/style
    plugin_js --> OnlyDysDyslexia : Triggers simulation
    plugin_js --> OnlyDysLogic : Calls suggestion logic
    plugin_js --> OnlyDysUI : Updates suggestion UI
    
    ConfigManager --> SelectionManager : Fetches current text
    ConfigManager --> ColorizationEngine : Colorizes preview
    
    SelectionManager --> AscPlugin : Executes commands in doc

    ColorizationEngine --> LinguisticEngine : analyzed word tokens

    OnlyDysUI --> OnlyDysLogic : Classifies confusions
    OnlyDysUI --> AscPlugin : Pastes content

    OnlyDysLogic --> Logger : Logs events
    OnlyDysLogic --> getPictogramUrl : (scripts/pictogramService.js) Fetches icons

    OnlyDysDyslexia --> AscPlugin : Replaces doc content
```