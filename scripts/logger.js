// scripts/logger.js

(function (window) {
    'use strict';

    // Define the logger object
    const logger = {
        LogLevel: {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            OFF: 4
        },

        // Set the default log level
        currentLevel: 1, // INFO

        // Internal storage for logs
        logStorage: [],
        maxLogSize: 1000,

        /**
         * Set the current log level for the logger.
         * @param {number} level - The log level to set.
         */
        setLevel: function (level) {
            if (typeof level === 'number' && level >= this.LogLevel.DEBUG && level <= this.LogLevel.OFF) {
                this.currentLevel = level;
            } else {
                this.warn(`Invalid log level specified: ${level}. Keeping current level: ${this.currentLevel}.`);
            }
        },

        _store: function (levelStr, message, data) {
            const timestamp = new Date().toISOString();
            let logLine = `[${levelStr}] ${timestamp}: ${message}`;
            if (data) {
                try {
                    logLine += " " + JSON.stringify(data);
                } catch (e) {
                    logLine += " [Circular/Unserializable Data]";
                }
            }
            this.logStorage.push(logLine);
            if (this.logStorage.length > this.maxLogSize) {
                this.logStorage.shift(); // Keep size manageable
            }
        },

        /**
         * Log a message at the DEBUG level.
         * @param {string} message - The message to log.
         * @param {*} [data] - Optional data to include in the log.
         */
        debug: function (message, data) {
            if (this.currentLevel <= this.LogLevel.DEBUG) {
                console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data || '');
                this._store("DEBUG", message, data);
            }
        },

        /**
         * Log a message at the INFO level.
         * @param {string} message - The message to log.
         * @param {*} [data] - Optional data to include in the log.
         */
        info: function (message, data) {
            if (this.currentLevel <= this.LogLevel.INFO) {
                console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data || '');
                this._store("INFO", message, data);
            }
        },

        /**
         * Log a message at the WARN level.
         * @param {string} message - The message to log.
         * @param {*} [data] - Optional data to include in the log.
         */
        warn: function (message, data) {
            if (this.currentLevel <= this.LogLevel.WARN) {
                console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data || '');
                this._store("WARN", message, data);
            }
        },

        /**
         * Log a message at the ERROR level.
         * @param {string} message - The message to log.
         * @param {*} [error] - Optional error object to include in the log.
         */
        error: function (message, error) {
            if (this.currentLevel <= this.LogLevel.ERROR) {
                console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || '');
                this._store("ERROR", message, error);
            }
        },

        /**
         * Retrieve all stored logs as a single string.
         * @returns {string}
         */
        getLogs: function () {
            return this.logStorage.join('\n');
        }
    };

    // Expose the logger to the global window object
    window.logger = logger;

})(window);
