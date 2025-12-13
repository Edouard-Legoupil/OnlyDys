# OnlyDys Plugin for ONLYOFFICE

## Overview

OnlyDys is a powerful ONLYOFFICE plugin designed to assist users with dyslexia, particularly those writing in French. It provides a suite of tools to make reading and writing more accessible, including real-time word suggestions, dyslexia-friendly document styling, and grammatical color-coding.

The plugin is compatible with both self-hosted and desktop versions of ONLYOFFICE editors and can be added manually to any instance.

## Features

- **Real-time Word Suggestions**: As you type, OnlyDys analyzes the current word and provides a list of suggestions in a side panel. The suggestion algorithm is tailored for common dyslexic errors and considers:
    - **Phonetic Similarity**: Suggests words that sound similar (e.g., "au" vs. "eau").
    - **Orthographic Similarity**: Corrects common spelling mistakes based on Levenshtein distance.
    - **Contextual Analysis**: Prioritizes suggestions based on the preceding word's grammatical category (e.g., suggesting a noun after a determiner).

- **Suggestion Classification**: Each suggestion is categorized and color-coded to help the user understand the nature of the potential error:
    - ırmızı **Visual Confusion**: Highlights possible mix-ups between visually similar letters (e.g., b/d, p/q).
    - 🟧 **Phonetic Confusion**: Indicates words that are spelled differently but sound similar.
    - 🟪 **Homophones**: Flags words that sound the same but have different meanings and spellings.
    - 🟦 **Morphological Errors**: Catches common mistakes in word endings, like pluralization or conjugation.

- **Interactive Suggestion Cards**: Each suggestion is displayed on an interactive card:
    - **Click to Replace**: Simply click the card to replace the word in the document with the suggestion.
    - **Text-to-Speech**: Click the speaker icon (🔊) to hear the suggested word read aloud.
    - **Illustrations**: Displays an image for the word when available, providing a visual aid for comprehension.

- **Dyslexia-Friendly Document Styling**: With a single click, you can apply a set of dyslexia-friendly styles to the entire document:
    - **OpenDyslexic Font**: The entire document's font is changed to [OpenDyslexic](https://opendyslexic.org/), a typeface designed to increase readability for people with dyslexia.
    - **Enhanced Spacing**: Increased line and letter spacing is applied to reduce visual stress and improve readability.

- **Grammatical Color-Coding**: This feature applies a distinct color to words based on their grammatical category (noun, verb, adjective, etc.), helping users to better understand sentence structure. A legend is displayed in the plugin panel.

## How to Use

1.  **Open the Plugin**: Click the "Plugins" tab in the ONLYOFFICE editor and select the "OnlyDys" plugin.
2.  **Real-time Suggestions**:
    - As you type, a side panel will automatically appear with suggestions for the word at your cursor.
    - To replace a word in your document, click on the desired suggestion card.
    - To hear a word, click the 🔊 icon on its card.
3.  **Apply Document Styles**:
    - Click the **"Appliquer le style au document"** button at the top of the plugin panel.
    - This will apply the OpenDyslexic font and adjust spacing throughout the document.
    - It will also color-code the words according to their grammatical function.

## Installation

To install the OnlyDys plugin:

1.  **Download the Plugin**: Download this repository as a ZIP file and rename the extension as .plugin.
2.  **Add the Plugin**: In `OnlyDys` open the plugin manager, click to "available plugin", then "install the plugin manually".
3.  **Use in ONLYOFFICE**: the OnlyDys plugin will be available in the "Plugins" tab.

## Debugging

The OnlyDys plugin includes a logging framework and a suite of unit tests to aid in debugging and development.

### Viewing Logs

The plugin uses a custom logger to output debugging information to the browser's console. To view the logs, you'll need to open the developer tools in your browser.

1.  **Open the developer tools.** In most browsers, you can do this by pressing `F12` or by right-clicking on the page and selecting "Inspect".
2.  **Navigate to the console.** The console is where the plugin will output its logs.
3.  **Set the log level.** By default, the logger is set to the `INFO` level. You can change the log level by opening the console and typing `logger.setLevel(logger.LogLevel.DEBUG)`. This will enable all logging levels.

### Running Unit Tests

The plugin includes a suite of unit tests to ensure that the core logic is working correctly. To run the tests, you'll need to open the `tests/test.html` file in your browser.

1.  **Navigate to the `tests/` directory.**
2.  **Open the `test.html` file in your browser.** This will run the tests and display the results in the browser.

## Dev

The primary user is my daughter, Lisa, and its school in Normandy. Thought, it might support as well other kids with same challenges. 

If you spot any issue or have any ideas of additional features or capabilities, please [create an issue here](https://github.com/Edouard-Legoupil/OnlyDys/issues/new).