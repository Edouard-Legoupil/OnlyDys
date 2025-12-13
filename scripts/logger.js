// scripts/logger.js

(function(window) {
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

        /**
         * Set the current log level for the logger.
         * @param {number} level - The log level to set.
         */
        setLevel: function(level) {
            if (typeof level === 'number' && level >= this.LogLevel.DEBUG && level <= this.LogLevel.OFF) {
                this.currentLevel = level;
            } else {
                this.warn(`Invalid log level specified: ${level}. Keeping current level: ${this.currentLevel}.`);
            }
        },

        /**
         * Log a message at the DEBUG level.
         * @param {string} message - The message to log.
         * @param {*} [data] - Optional data to include in the log.
         */
        debug: function(message, data) {
            if (this.currentLevel <= this.LogLevel.DEBUG) {
                console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data || '');
            }
        },

        /**
         * Log a message at the INFO level.
         * @param {string} message - The message to log.
         * @param {*} [data] - Optional data to include in the log.
         */
        info: function(message, data) {
            if (this.currentLevel <= this.LogLevel.INFO) {
                console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data || '');
            }
        },

        /**
         * Log a message at the WARN level.
         * @param {string} message - The message to log.
         * @param {*} [data] - Optional data to include in the log.
         */
        warn: function(message, data) {
            if (this.currentLevel <= this.LogLevel.WARN) {
                console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data || '');
            }
        },

        /**
         * Log a message at the ERROR level.
         * @param {string} message - The message to log.
         * @param {*} [error] - Optional error object to include in the log.
         */
        error: function(message, error) {
            if (this.currentLevel <= this.LogLevel.ERROR) {
                console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || '');
            }
        }
    };

    // Expose the logger to the global window object
    window.logger = logger;

})(window);
