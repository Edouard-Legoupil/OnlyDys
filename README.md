
# OnlyDys - Plugin pour ONLYOFFICE

(English version below at the end of the document)

## Aperçu

**OnlyDys** est un plugin respectueux de la vie privée pour ONLYOFFICE, conçu pour aider les utilisateurs souffrant de dyslexie, en particulier ceux qui écrivent en français. Il propose une suite complète d'outils pour rendre la lecture et l'écriture plus accessibles, incluant des suggestions de mots en temps réel, une mise en forme adaptée aux personnes dyslexiques et un codage couleur grammatical.

Le plugin est compatible avec les versions self-hosted et de bureau des éditeurs ONLYOFFICE et peut être ajouté manuellement à n'importe quelle instance.

## Fonctionnalités

### 📝 **Système Intelligent de Suggestions**

- **Deux Modes de Suggestion** :
  - **Mode Sélection (Manuel)** : Sélectionnez du texte et cliquez sur "Coller la Sélection" pour obtenir des suggestions, ou tapez simplement dans la boîte.
  - **Mode en Temps Réel (Automatique)** : Le plugin détecte automatiquement le mot sous votre curseur ou votre sélection et met à jour les suggestions en temps réel lorsque vous naviguez dans le document.

- **Classification des Suggestions** : Chaque suggestion est catégorisée et codée par couleur pour vous aider à comprendre la nature de l'erreur potentielle :
  - ⚠️🔴 **Confusion Visuelle** : Met en évidence les confusions possibles entre des lettres visuellement similaires (ex. b/d, p/q).
  - 🔊🟧 **Confusion Phonétique** : Indique les mots qui s'écrivent différemment mais qui se prononcent de manière similaire.
  - 🔀🟪 **Homophones** : Signale les mots qui se prononcent de la même manière mais qui ont des significations et des orthographes différents.
  - 📝🟦 **Erreurs Morphologiques** : Détecte les erreurs courantes dans les terminaisons de mots, comme les pluriels ou les conjugaisons.

- **Cartes de Suggestions Interactives** : Chaque suggestion est affichée sur une carte interactive :
  - **Cliquez pour Remplacer** : Cliquez simplement sur la carte pour remplacer le mot dans le document par la suggestion.
  - **Synthèse Vocale** : Cliquez sur l'icône du haut-parleur (🗣️) pour entendre le mot suggéré.
  - **Affichage de Pictogrammes** : Affiche un pictogramme visuel pour le mot lorsqu'il est disponible, offrant une aide visuelle pour la compréhension.

### 🎨 **Onglet Linguistique & Mise en Forme**

- **Formatage** : Appliquez des polices adaptées aux personnes dyslexiques à l'ensemble du document avec un espacement amélioré pour une meilleure lisibilité :
  - **Plusieurs Options de Polices** : Choisissez parmi OpenDyslexic, Luciole ou AccessibleDfA via des boutons radio
  - **Espacement Cohérent** : Applique une hauteur de ligne optimisée (2.0em) et un espacement de lettres (36) pour une lisibilité améliorée
  - **Préservation de l'État** : Sauvegarde et restaure automatiquement votre mise en forme précédente lors de l'activation/désactivation de la fonction

- **Coloration Grammaticale** : Codez les mots par couleur selon leur catégorie grammaticale :
  - Palette à fort contraste, adaptée aux daltoniens, avec des couleurs distinctes pour chaque catégorie
  - Noms, Verbes, Adjectifs, Adverbes, Pronoms, Déterminants, Prépositions, Conjonctions, Interjections
  - Légende de couleurs interactive indiquant quelle couleur représente chaque catégorie

- **Analyse Phonétique** :
  - **Coloration des Phonèmes** : Met en évidence les phonèmes distincts (sons) avec différentes couleurs
  - **Segmentation des Syllabes** : Colorie les syllabes en utilisant des nuances alternées pour une meilleure reconnaissance visuelle
  - **Arcs de Syllabes** : Dessine des arcs vectoriels sous les syllabes pour aider à identifier la structure des mots
  - **Détection des Lettres Muettes** : Détecte et grise automatiquement les lettres muettes

- **Motifs Alternés** : Appliquez des motifs de couleurs alternées à :
  - Les phonèmes, lettres, mots ou lignes pour un suivi visuel amélioré

### 🎭 **Simulation de la Dyslexie**

- **Simulation de Texte** : Activez la simulation de dyslexie pour expérimenter comment une personne dyslexique pourrait percevoir le texte, promouvant la sensibilisation et la compréhension

### 🔧 **Fonctionnalités Système**

- **Détection Intelligente des Polices** : Le plugin vérifie automatiquement si des polices adaptées aux personnes dyslexiques sont installées sur votre système. Si elles manquent, un onglet "Police" fournit des instructions d'installation claires.
- **Non Invasif** : Toutes les mises en forme et styles peuvent être activées/désactivées, avec une restauration propre de l'état original du document.
- **Respect de la Vie Privée** : Tout le traitement du texte se fait localement dans votre navigateur - aucune donnée n'est envoyée à des serveurs externes.

## Comment Utiliser

1. **Ouvrir le Plugin** : Cliquez sur l'onglet "Plugins" dans l'éditeur ONLYOFFICE et sélectionnez le plugin "OnlyDys".
2. **Obtenir des Suggestions** :
   - **Par défaut** : Utilisez le bouton bascule pour passer entre les modes "Sélection" (Manuel) ou "En Temps Réel" (Auto).
   - **En Temps Réel** : Déplacez simplement votre curseur ou sélectionnez du texte ; les suggestions apparaissent automatiquement.
   - **Manuel** : Sélectionnez du texte, cliquez sur "Coller la Sélection", puis "Vérifier".
   - Pour remplacer un mot, cliquez sur la carte de suggestion souhaitée.
3. **Linguistique & Mise en Forme** :
   - Passez à l'**onglet "Linguistique"**.
   - **Appliquer la Police & l'Espacement** : Cliquez sur le bouton en bas pour appliquer la police OpenDyslexic et l'espacement globalement (sans couleurs).
   - **Appliquer l'Analyse/Coloration** :
     - Sélectionnez un **Mode** (Catégories Grammaticales, Phonèmes, Syllabes, etc.).
     - Cliquez sur **Appliquer à la Sélection** pour colorier le texte sélectionné.
4. **Simulation de la Dyslexie** :
   - Passez à l'**onglet "Dyslexie"** pour simuler comment une personne dyslexique pourrait percevoir le texte.

## Installation

Pour installer le plugin OnlyDys :

 - Dans `ONLYOFFICE Desktop Editors`, ouvrez l'onglet **Plugins**.
 - Cliquez sur **Paramètres** -> **Ajouter un Plugin**.
 - Sélectionnez le fichier [OnlyDys.plugin](https://github.com/Edouard-Legoupil/OnlyDys/raw/refs/heads/main/deploy/OnlyDys.plugin).

Le plugin OnlyDys sera alors disponible dans l'onglet "Plugins".


-----


# OnlyDys Plugin for ONLYOFFICE

## Overview

OnlyDys is a privacy-first ONLYOFFICE plugin designed to assist users with dyslexia, particularly those writing in French. It provides a comprehensive suite of tools to make reading and writing more accessible, including real-time word suggestions, dyslexia-friendly document styling, and grammatical color-coding.

The plugin is compatible with both self-hosted and desktop versions of ONLYOFFICE editors and can be added manually to any instance.

## Features

### 📝 **Intelligent Suggestion System**

- **Two Suggestion Modes**:
  - **Selection Mode (Manual)**: Select text and click "Paste Selection" to get suggestions, or simply type in the box.
  - **On-the-go Mode (Automatic)**: The plugin automatically detects the word under your cursor or selection and updates suggestions in real-time as you navigate through the document.

- **Suggestion Classification**: Each suggestion is categorized and color-coded to help you understand the nature of the potential error:
  - ⚠️🔴 **Visual Confusion**: Highlights possible mix-ups between visually similar letters (e.g., b/d, p/q).
  - 🔊🟧 **Phonetic Confusion**: Indicates words that are spelled differently but sound similar.
  - 🔀🟪 **Homophones**: Flags words that sound the same but have different meanings and spellings.
  - 📝🟦 **Morphological Errors**: Catches common mistakes in word endings, like pluralization or conjugation.

- **Interactive Suggestion Cards**: Each suggestion is displayed on an interactive card:
  - **Click to Replace**: Simply click the card to replace the word in the document with the suggestion.
  - **Text-to-Speech**: Click the speaker icon (🗣️) to hear the suggested word read aloud.
  - **Pictogram Display**: Shows a visual pictogram for the word when available, providing a visual aid for comprehension.

### 🎨 **Linguistics & Styling Tab**

- **Formatting (Formatage)**: Apply dyslexia-friendly fonts to the entire document with enhanced spacing for better readability:
  - **Multiple Font Options**: Choose from OpenDyslexic, Luciole, or AccessibleDfA fonts via radio buttons
  - **Consistent Spacing**: Applies optimized line height (2.0em) and letter spacing (36) for improved legibility
  - **State Preservation**: Automatically saves and restores your previous formatting when toggling the feature on/off

- **Grammatical Color-Coding**: Color-code words based on their grammatical category:
  - High-contrast, color-blind friendly palette with distinct colors for each category
  - Nouns, Verbs, Adjectives, Adverbs, Pronouns, Determiners, Prepositions, Conjunctions, Interjections
  - Interactive color legend showing which color represents each category

- **Phonetic Analysis**:
  - **Phoneme Colorization**: Highlights distinct phonemes (sounds) with different colors
  - **Syllable Segmentation**: Color syllables using alternating shades for better visual recognition
  - **Syllable Arcs**: Draws vector arcs underneath syllables to help identify word structure
  - **Silent Letter Detection**: Automatically detects and greys out silent letters

- **Alternating Patterns**: Apply alternating color patterns to:
  - Phonemes, Letters, Words, or Lines for enhanced visual tracking

### 🎭 **Dyslexia Simulation**

- **Text Simulation**: Activate the dyslexia simulation to experience how a dyslexic person might perceive text, promoting awareness and sensitivity

### 🔧 **System Features**

- **Smart Font Detection**: The plugin automatically checks if dyslexia-friendly fonts are installed on your system. If missing, a "Font" tab provides clear installation instructions.
- **Non-Invasive**: All formatting and styling can be toggled on/off, with clean restoration to the original document state.
- **Privacy-First**: All text processing happens locally within your browser - no data is sent to external servers.

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
