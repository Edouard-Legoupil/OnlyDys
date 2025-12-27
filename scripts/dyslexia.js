window.OnlyDysDyslexia = (function () {
	'use strict';

	/**
	 * Generates a random integer between min (inclusive) and max (inclusive).
	 * @param {number} min - The minimum value.
	 * @param {number} max - The maximum value.
	 * @returns {number} A random integer within the range.
	 */
	function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	/**
	 * Scrambles a single word, keeping the first and last letters intact.
	 * This helps maintain readability while simulating dyslexia.
	 * @param {string} word - The word to scramble.
	 * @param {object} options - Configuration options.
	 * @returns {string} The scrambled word or the original word.
	 */
	function scrambleWord(word, options) {
		const defaultOptions = {
			minWordLength: 5,
			scrambleChance: 100
		};
		// Use Object.assign to merge user options over defaults
		options = Object.assign({}, defaultOptions, options);

		if (options.scrambleChance > 100) {
			options.scrambleChance = 100;
		}

		// Don't scramble small words or based on random chance
		if (word.length < options.minWordLength || randomInt(1, 100) > options.scrambleChance) {
			return word;
		}

		const a = randomInt(1, word.length - 2);
		const b = randomInt(a, word.length - 2);

		const middle = word.substring(a, b + 1);
		const scrambledMiddle = middle.split('').reverse().join('');

		const scrambledWord = word.slice(0, a) + scrambledMiddle + word.slice(b + 1);

		// To avoid getting the same word, we can add a simple retry, but for now, this is fine.
		if (scrambledWord === word && word.length > 3) {
			// simple shuffle for the middle part
			let middleChars = word.substring(1, word.length - 1).split('');
			for (let i = middleChars.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[middleChars[i], middleChars[j]] = [middleChars[j], middleChars[i]];
			}
			return word[0] + middleChars.join('') + word[word.length - 1];
		}

		return scrambledWord;
	}

	/**
	 * Parses words from a string and applies the scrambling effect.
	 * @param {string} str - The input string.
	 * @param {object} options - Configuration options for scrambling.
	 * @returns {string} The text with words scrambled.
	 */
	function dyslexia(str, options) {
		let messedUpText = '';
		const re = /\w+/g;
		let lastIndex = 0;

		// Use String.prototype.replace with a function to handle matches and non-matches
		messedUpText = str.replace(/\w+/g, function (word) {
			return scrambleWord(word, options);
		});

		return messedUpText;
	}

	// State for Revert
	let lastOriginalText = null;

	function storeOriginal(text) {
		lastOriginalText = text;
	}

	function getOriginal() {
		return lastOriginalText;
	}

	function applyDyslexiaToDocument(options) {
		window.Asc.plugin.callCommand(function () {
			try {
				var logs = [];
				logs.push("Starting dyslexia application");
				var oDocument = Api.GetDocument();
				if (!oDocument) return { status: "ERROR", message: "Could not get document" };

				var nElements = oDocument.GetElementsCount();
				logs.push("Found " + nElements + " elements in document");
				if (nElements === 0) return { status: "ERROR", message: "No elements found", logs: logs };

				// Helper for scramble (improved French version)
				function scrambleWord(word, opt) {
					if (!opt) opt = { minWordLength: 5 };
					if (word.length < opt.minWordLength) return word;

					// Preserve first and last characters
					var first = word.charAt(0);
					var last = word.charAt(word.length - 1);
					var middleChars = word.substring(1, word.length - 1).split('');

					// Fisher-Yates shuffle for the middle
					for (var i = middleChars.length - 1; i > 0; i--) {
						var j = Math.floor(Math.random() * (i + 1));
						var temp = middleChars[i];
						middleChars[i] = middleChars[j];
						middleChars[j] = temp;
					}

					var scrambled = first + middleChars.join('') + last;

					// Simple fallback if shuffle results in same word (only for longer words)
					if (scrambled === word && word.length > 5) {
						return first + middleChars.reverse().join('') + last;
					}
					return scrambled;
				}
				var processedCount = 0;

				for (var i = 0; i < nElements; i++) {
					var oPara = oDocument.GetElement(i);
					if (!oPara) {
						logs.push("Element " + i + " is null");
						continue;
					}
					var type = oPara.GetClassType();
					if (type !== "paragraph") {
						// logs.push("Element " + i + " is not a paragraph (" + type + ")");
						continue;
					}
					processedCount++;

					var runsCount = oPara.GetElementsCount();
					var paraModel = { textRuns: [] };

					for (var j = 0; j < runsCount; j++) {
						var oRun = oPara.GetElement(j);
						if (oRun && oRun.GetClassType() === "run") {
							var originalText = oRun.GetText();
							var opt = Asc.scope.options || { minWordLength: 5 };
							// Improved regex: include apostrophes and hyphens for French
							var scrambledText = originalText.replace(/[a-zA-ZÀ-ÿ'’-]+/g, function (word) {
								return scrambleWord(word, opt);
							});

							paraModel.textRuns.push({
								text: scrambledText,
								formatting: {
									bold: oRun.GetBold(),
									italic: oRun.GetItalic(),
									underline: oRun.GetUnderline(),
									strikeout: oRun.GetStrikeout(),
									fontFamily: oRun.GetFontFamily(),
									fontSize: oRun.GetFontSize(),
									color: oRun.GetColor()
								}
							});
						}
					}

					oPara.RemoveAllElements();
					for (var k = 0; k < paraModel.textRuns.length; k++) {
						var runData = paraModel.textRuns[k];
						var oNewRun = Api.CreateRun();
						oNewRun.AddText(runData.text);

						if (runData.formatting) {
							var f = runData.formatting;
							if (f.color) {
								if (f.color.R !== undefined) {
									oNewRun.SetColor(f.color.R, f.color.G, f.color.B);
								} else if (Array.isArray(f.color) && f.color.length >= 3) {
									oNewRun.SetColor(f.color[0], f.color[1], f.color[2]);
								}
							}
							if (f.bold) oNewRun.SetBold(true);
							if (f.italic) oNewRun.SetItalic(true);
							if (f.underline) oNewRun.SetUnderline(f.underline);
							if (f.strikeout) oNewRun.SetStrikeout(true);
							if (f.fontFamily) oNewRun.SetFontFamily(f.fontFamily);
							if (f.fontSize) oNewRun.SetFontSize(f.fontSize);
						}
						oPara.AddElement(oNewRun);
					}
				}
				logs.push("Processed " + processedCount + " paragraphs");
				return { status: "SUCCESS", logs: logs };
			} catch (err) {
				return { status: "ERROR", message: err.toString(), logs: logs };
			}
		}, false, true, function (result) {
			if (result && result.logs) {
				result.logs.forEach(function (l) {
					console.log("[Dyslexia Command]", l);
					if (window.logger) window.logger.info("[Dyslexia Command] " + l);
				});
			}
			if (result && result.status === "ERROR") {
				console.error("Dyslexia application failed:", result.message);
				if (window.logger) window.logger.error("Simulation Error: " + result.message);
			} else if (result && result.status === "SUCCESS") {
				console.log("Dyslexia applied successfully");
			} else if (result && typeof result === "string" && result.indexOf("ERROR") === 0) {
				console.error("Dyslexia command returned string error:", result);
				if (window.logger) window.logger.error("Simulation Command Error: " + result);
			}
		}, { options: options });
	}


	// Expose the main function
	return {
		processText: dyslexia,
		storeOriginal: storeOriginal,
		getOriginal: getOriginal,
		applyDyslexiaToDocument: applyDyslexiaToDocument
	};

})();
