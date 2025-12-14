# OnlyDys Plugin for ONLYOFFICE

## Overview

OnlyDys is a powerful ONLYOFFICE plugin designed to assist users with dyslexia, particularly those writing in French. It provides a suite of tools to make reading and writing more accessible, including real-time word suggestions, dyslexia-friendly document styling, and grammatical color-coding.

The plugin is compatible with both self-hosted and desktop versions of ONLYOFFICE editors and can be added manually to any instance.

## Features

- **Two Suggestion Modes**:
    - **Selection Mode (Manual)**: Select text and click "Paste Selection" to get suggestions, or simply type in the box.
    - **On-the-go Mode (Automatic)**: The plugin automatically detects the word under your cursor or selection and updates suggestions in real-time as you navigate.

- **Suggestion Classification**: Each suggestion is categorized and color-coded to help the user understand the nature of the potential error:
    - 🔴 **Visual Confusion**: Highlights possible mix-ups between visually similar letters (e.g., b/d, p/q).
    - 🟧 **Phonetic Confusion**: Indicates words that are spelled differently but sound similar.
    - 🟪 **Homophones**: Flags words that sound the same but have different meanings and spellings.
    - 🟦 **Morphological Errors**: Catches common mistakes in word endings, like pluralization or conjugation.

- **Interactive Suggestion Cards**: Each suggestion is displayed on an interactive card:
    - **Click to Replace**: Simply click the card to replace the word in the document with the suggestion.
    - **Text-to-Speech**: Click the speaker icon (🔊) to hear the suggested word read aloud.
    - **Illustrations**: Displays an image for the word when available, providing a visual aid for comprehension.

- **Advanced Linguistic Formatting & Styling**: A dedicated "Linguistics" tab provides deep linguistic analysis and styling for French text:
    - **Global Formatting**: With a single click, apply **OpenDyslexic Font** and enhanced spacing to the entire document (without changing colors).
    - **Grammatical Coloring**: Select "Grammatical Categories" mode to color-code words (Noun, Verb, etc.) based on their function.
    - **Phoneme Colorization**: Highlights distinct phonemes (sounds) with different colors.
    - **Syllable Segmentation**:
        - **Alternating Colors**: colors syllables in alternating shades.
        - **Syllable Arcs**: Draws vector arcs underneath syllables.
    - **Silent Letter Detection**: Automatically detects and greys out silent letters.

- **Smart Font Detection**: The plugin automatically checks if the **OpenDyslexic** font is installed on your system. If missing, a "Font" tab will appear with installation instructions.

## How to Use

1.  **Open the Plugin**: Click the "Plugins" tab in the ONLYOFFICE editor and select the "OnlyDys" plugin.
2.  **Get Suggestions**:
    - **Default**: Use the toggle to switch between "Selection" (Manual) or "On-the-go" (Auto) modes.
    - **On-the-go**: Simply move your cursor or select text; suggestions appear automatically.
    - **Manual**: Select text, click "Paste Selection", then "Check".
    - To replace a word, click the desired suggestion card.
3.  **Linguistics & Styling**:
    - Switch to the **"Linguistics"** tab.
    - **Apply Font & Spacing**: Click the button at the bottom to apply OpenDyslexic font and spacing globally (no colors).
    - **Apply Analysis/Coloring**:
        - Select a **Mode** (Grammatical Categories, Phonemes, Syllables, etc.).
        - Click **Apply to Selection** to color-code the selected text.
4.  **Dyslexia Simulation**:
    - Switch to the **"Dyslexia"** tab to simulate how a dyslexic person might perceive the text.

## Installation

To install the OnlyDys plugin: 

 - In `OnlyOffice Desktop Editors`, open the **Plugins** tab.

 - Click **Settings** -> **Add Plugin**.

 - Select the [OnlyDys.plugin](https://github.com/Edouard-Legoupil/OnlyDys/raw/refs/heads/main/deploy/OnlyDys.plugin) file.
    
The OnlyDys plugin will be then available in the "Plugins" tab.


## Dev

The primary user and tester for this plugin is my daughter, Lisa, and the school she is attending in Normandy. Though, this tool might support  as well other kids with similar challenges. 

I have reviewed a set of existing tools (nonne being open source and working on Linux...) to build this plugin:

 - [PhonoWriter](https://www.jeanclaudegabus.ch/produits/phonowriter/)
 - [Colorization](https://colorization.ch/)
 - [Studys](https://studys.fusofrance.org/)
 - [Cartable Fantastique](https://www.cartablefantastique.fr/outils-pour-compenser/le-plug-in-libre-office/)
 - [Lexibar](https://www.lexibar.ca/ca/en/)

This tool was mostly coded using vibe coding in [Antigravity](https://antigravity.google/). You can clone the repository to contribute. **To build the plugin**:
 - Run the build script: `python3 package_plugin.py`
 - This will create the `OnlyDys.plugin` file in the `deploy` folder.

If you spot any issue or have any ideas of additional features or capabilities, please [create an issue here](https://github.com/Edouard-Legoupil/OnlyDys/issues/new).

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
