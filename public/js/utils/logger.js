/**
 * Client-Side Logger — Arcade Gaming Hub
 * 
 * Lightweight logger that:
 * - Silences all output in production by default
 * - Preserves full output in development (localhost / 127.0.0.1)
 * - Supports log levels: debug, info, warn, error
 * - Prefixes messages with category tags for easy filtering
 */

const IS_DEV = (() => {
    try {
        const host = window.location.hostname;
        return host === 'localhost' || host === '127.0.0.1';
    } catch {
        return false;
    }
})();

const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    SILENT: 4
};

class ClientLogger {
    constructor() {
        // In dev: show everything. In prod: only warnings and errors.
        this.level = IS_DEV ? LogLevel.DEBUG : LogLevel.WARN;
    }

    /**
     * Set the minimum log level
     * @param {number} level - One of LogLevel values
     */
    setLevel(level) {
        this.level = level;
    }

    debug(category, message, ...args) {
        if (this.level <= LogLevel.DEBUG) {
            console.log(`[${category}]`, message, ...args);
        }
    }

    info(category, message, ...args) {
        if (this.level <= LogLevel.INFO) {
            console.log(`[${category}]`, message, ...args);
        }
    }

    warn(category, message, ...args) {
        if (this.level <= LogLevel.WARN) {
            console.warn(`[${category}]`, message, ...args);
        }
    }

    error(category, message, ...args) {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[${category}]`, message, ...args);
        }
    }

    /**
     * Log a group of related messages (dev only)
     */
    group(category, label, fn) {
        if (this.level <= LogLevel.DEBUG) {
            console.group(`[${category}] ${label}`);
            fn();
            console.groupEnd();
        }
    }
}

export const logger = new ClientLogger();
export { LogLevel, IS_DEV };

// Log categories used across the app
export const LogCategory = {
    APP:       'App',
    AUTH:      'Auth',
    FIREBASE:  'Firebase',
    SYNC:      'Sync',
    GAME:      'Game',
    PARTY:     'Party',
    SOCIAL:    'Social',
    AUDIO:     'Audio',
    ECONOMY:   'Economy',
    ANALYTICS: 'Analytics',
    STORAGE:   'Storage',
    PRESENCE:  'Presence',
    STREAM:    'Stream',
    NETWORK:   'Network',
    SERVICE:   'Service',
    UI:        'UI',
    PERF:      'Perf'
};
