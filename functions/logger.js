/**
 * Structured Logger - Cloud Logging Integration
 * Provides consistent logging format with severity levels and structured data
 */

const admin = require('firebase-admin');

// Log severity levels
const LogLevel = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL'
};

// Log categories
const LogCategory = {
    AUTH: 'auth',
    SCORE: 'score',
    TOURNAMENT: 'tournament',
    ANALYTICS: 'analytics',
    SECURITY: 'security',
    PERFORMANCE: 'performance',
    SYSTEM: 'system'
};

/**
 * StructuredLogger class
 * Provides structured logging with Cloud Logging integration
 */
class StructuredLogger {
    constructor(options = {}) {
        this.projectId = options.projectId || process.env.GCLOUD_PROJECT;
        this.functionName = options.functionName || 'unknown';
        this.version = options.version || '1.0.0';
        this.enableFirestore = options.enableFirestore !== false;
        this.minLogLevel = options.minLogLevel || LogLevel.DEBUG;
    }

    /**
     * Create a structured log entry
     * @param {string} level - Log level
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {Object} data - Additional structured data
     */
    log(level, category, message, data = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            severity: level,
            category,
            message,
            functionName: this.functionName,
            version: this.version,
            data,
            // Cloud Logging specific fields
            'logging.googleapis.com/labels': {
                function_name: this.functionName,
                category
            }
        };

        // Add trace ID if available
        if (data.traceId) {
            entry['logging.googleapis.com/trace'] = 
                `projects/${this.projectId}/traces/${data.traceId}`;
        }

        // Write to appropriate output based on severity
        switch (level) {
            case LogLevel.ERROR:
            case LogLevel.CRITICAL:
                console.error(JSON.stringify(entry));
                break;
            case LogLevel.WARNING:
                console.warn(JSON.stringify(entry));
                break;
            default:
                console.log(JSON.stringify(entry));
        }

        // Persist critical/error logs to Firestore for monitoring
        if (this.enableFirestore && 
            (level === LogLevel.ERROR || level === LogLevel.CRITICAL)) {
            this.persistLog(entry).catch(e => 
                console.error('Failed to persist log:', e)
            );
        }

        return entry;
    }

    /**
     * Persist log to Firestore for monitoring/alerting
     */
    async persistLog(entry) {
        const db = admin.firestore();
        await db.collection('system_logs').add({
            ...entry,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    // Convenience methods
    debug(category, message, data = {}) {
        return this.log(LogLevel.DEBUG, category, message, data);
    }

    info(category, message, data = {}) {
        return this.log(LogLevel.INFO, category, message, data);
    }

    warn(category, message, data = {}) {
        return this.log(LogLevel.WARNING, category, message, data);
    }

    error(category, message, data = {}) {
        return this.log(LogLevel.ERROR, category, message, data);
    }

    critical(category, message, data = {}) {
        return this.log(LogLevel.CRITICAL, category, message, data);
    }

    // Domain-specific logging methods
    logScoreSubmission(userId, gameId, score, status, details = {}) {
        return this.info(LogCategory.SCORE, 'Score submitted', {
            userId,
            gameId,
            score,
            status,
            ...details
        });
    }

    logScoreRejected(userId, gameId, score, reason, details = {}) {
        return this.warn(LogCategory.SECURITY, 'Score rejected', {
            userId,
            gameId,
            score,
            reason,
            ...details
        });
    }

    logSuspiciousActivity(userId, activityType, details = {}) {
        return this.warn(LogCategory.SECURITY, 'Suspicious activity detected', {
            userId,
            activityType,
            ...details
        });
    }

    logTournamentAction(action, tournamentId, userId, details = {}) {
        return this.info(LogCategory.TOURNAMENT, `Tournament ${action}`, {
            action,
            tournamentId,
            userId,
            ...details
        });
    }

    logAuthEvent(event, userId, details = {}) {
        return this.info(LogCategory.AUTH, `Auth event: ${event}`, {
            event,
            userId,
            ...details
        });
    }

    logPerformance(operation, durationMs, details = {}) {
        const level = durationMs > 5000 ? LogLevel.WARNING : LogLevel.DEBUG;
        return this.log(level, LogCategory.PERFORMANCE, `Operation: ${operation}`, {
            operation,
            durationMs,
            slowOperation: durationMs > 5000,
            ...details
        });
    }

    logSystemEvent(event, details = {}) {
        return this.info(LogCategory.SYSTEM, event, details);
    }

    // Performance timing helper
    startTimer() {
        return Date.now();
    }

    endTimer(startTime, operation, details = {}) {
        const durationMs = Date.now() - startTime;
        return this.logPerformance(operation, durationMs, details);
    }
}

// Create default logger instance
const logger = new StructuredLogger({
    functionName: 'arcade-hub-functions',
    version: '1.0.0'
});

module.exports = {
    StructuredLogger,
    logger,
    LogLevel,
    LogCategory
};
