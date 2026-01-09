/**
 * Anti-Cheat Service - Enhanced Score Validation
 * Server-side validation with session tracking, timing analysis, and pattern detection
 */

const admin = require('firebase-admin');

// Session cache - stores active game sessions
const sessionCache = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes max session

// Validation thresholds per game
const GAME_CONFIGS = {
    'snake': {
        maxScore: 1_000_000,
        minDuration: 10_000,      // 10 seconds minimum
        maxScorePerSecond: 100,   // Max score rate
        suspiciousPatterns: ['perfect_score', 'impossible_time']
    },
    '2048': {
        maxScore: 10_000_000,
        minDuration: 30_000,
        maxScorePerSecond: 5000,
        suspiciousPatterns: ['instant_win']
    },
    'breakout': {
        maxScore: 500_000,
        minDuration: 60_000,
        maxScorePerSecond: 2000,
        suspiciousPatterns: ['all_bricks_instant']
    },
    'tetris': {
        maxScore: 5_000_000,
        minDuration: 60_000,
        maxScorePerSecond: 1000,
        suspiciousPatterns: ['impossible_tetris']
    },
    'minesweeper': {
        maxScore: 100_000,
        minDuration: 5_000,
        maxScorePerSecond: 500,
        suspiciousPatterns: ['instant_solve']
    },
    'pacman': {
        maxScore: 2_000_000,
        minDuration: 60_000,
        maxScorePerSecond: 3000,
        suspiciousPatterns: ['ghost_collision_none']
    },
    'asteroids': {
        maxScore: 1_000_000,
        minDuration: 30_000,
        maxScorePerSecond: 500,
        suspiciousPatterns: ['impossible_dodge']
    },
    'tower-defense': {
        maxScore: 10_000_000,
        minDuration: 120_000,
        maxScorePerSecond: 5000,
        suspiciousPatterns: ['instant_wave_clear']
    },
    'rhythm': {
        maxScore: 1_000_000,
        minDuration: 60_000,
        maxScorePerSecond: 1000,
        suspiciousPatterns: ['perfect_timing_all']
    },
    'roguelike': {
        maxScore: 500_000,
        minDuration: 120_000,
        maxScorePerSecond: 200,
        suspiciousPatterns: ['invincible']
    },
    'toonshooter': {
        maxScore: 1_000_000,
        minDuration: 30_000,
        maxScorePerSecond: 1000,
        suspiciousPatterns: ['aimbot']
    }
};

/**
 * Start a game session
 * @param {string} userId - User ID
 * @param {string} gameId - Game ID
 * @returns {string} Session ID
 */
function startSession(userId, gameId) {
    const sessionId = `${userId}_${gameId}_${Date.now()}`;
    const session = {
        userId,
        gameId,
        startTime: Date.now(),
        actions: [], // Track game actions
        scoreHistory: [], // Track score progression
        checksumSeed: Math.random().toString(36).substring(7)
    };
    
    sessionCache.set(sessionId, session);
    
    // Clean up old sessions
    cleanupOldSessions();
    
    return sessionId;
}

/**
 * Record game action for validation
 * @param {string} sessionId - Session ID
 * @param {string} action - Action type
 * @param {Object} data - Action data
 */
function recordAction(sessionId, action, data) {
    const session = sessionCache.get(sessionId);
    if (!session) return false;
    
    session.actions.push({
        type: action,
        data,
        timestamp: Date.now()
    });
    
    return true;
}

/**
 * Validate score submission with enhanced checks
 * @param {Object} scoreData - Score submission data
 * @returns {Object} Validation result
 */
function validateScore(scoreData) {
    const { userId, gameId, score, sessionId, duration, checksum } = scoreData;
    
    // Basic validation
    if (!userId || !gameId || score === undefined) {
        return { valid: false, reason: 'missing_required_fields', severity: 'error' };
    }
    
    // Score must be a positive number
    if (typeof score !== 'number' || score < 0 || !Number.isFinite(score)) {
        return { valid: false, reason: 'invalid_score_type', severity: 'error' };
    }
    
    // Get game config
    const config = GAME_CONFIGS[gameId];
    if (!config) {
        return { valid: false, reason: 'unknown_game', severity: 'warning' };
    }
    
    // Max score check
    if (score > config.maxScore) {
        return { 
            valid: false, 
            reason: 'score_exceeds_maximum', 
            severity: 'critical',
            details: { score, maxScore: config.maxScore }
        };
    }
    
    // Session validation
    if (sessionId) {
        const sessionResult = validateSession(sessionId, score, duration);
        if (!sessionResult.valid) {
            return sessionResult;
        }
    }
    
    // Duration check
    if (duration && duration < config.minDuration) {
        return { 
            valid: false, 
            reason: 'impossible_duration', 
            severity: 'warning',
            details: { duration, minDuration: config.minDuration }
        };
    }
    
    // Score rate check
    if (duration && duration > 0) {
        const scorePerSecond = score / (duration / 1000);
        if (scorePerSecond > config.maxScorePerSecond) {
            return { 
                valid: false, 
                reason: 'suspicious_score_rate', 
                severity: 'warning',
                details: { scorePerSecond, maxScorePerSecond: config.maxScorePerSecond }
            };
        }
    }
    
    // Checksum validation (if provided)
    if (checksum && sessionId) {
        const session = sessionCache.get(sessionId);
        if (session) {
            const expectedChecksum = generateChecksum(session, score);
            if (checksum !== expectedChecksum) {
                return { 
                    valid: false, 
                    reason: 'invalid_checksum', 
                    severity: 'critical' 
                };
            }
        }
    }
    
    return { valid: true, verified: true };
}

/**
 * Validate session state
 * @param {string} sessionId - Session ID
 * @param {number} score - Final score
 * @param {number} duration - Game duration
 * @returns {Object} Validation result
 */
function validateSession(sessionId, score, duration) {
    const session = sessionCache.get(sessionId);
    
    if (!session) {
        return { 
            valid: false, 
            reason: 'session_not_found', 
            severity: 'warning' 
        };
    }
    
    const sessionDuration = Date.now() - session.startTime;
    
    // Session timeout check
    if (sessionDuration > SESSION_TIMEOUT) {
        return { 
            valid: false, 
            reason: 'session_expired', 
            severity: 'warning' 
        };
    }
    
    // Action count check - too few actions is suspicious
    const minActions = Math.floor(score / 1000); // Rough heuristic
    if (session.actions.length < minActions && minActions > 5) {
        return { 
            valid: false, 
            reason: 'insufficient_actions', 
            severity: 'warning',
            details: { actionCount: session.actions.length, expectedMin: minActions }
        };
    }
    
    // Score progression check - should be gradual, not instant
    if (session.scoreHistory.length > 0) {
        const lastScore = session.scoreHistory[session.scoreHistory.length - 1];
        const scoreJump = score - lastScore.score;
        const timeDelta = Date.now() - lastScore.timestamp;
        
        // Massive instant score jump is suspicious
        if (scoreJump > 10000 && timeDelta < 1000) {
            return { 
                valid: false, 
                reason: 'suspicious_score_jump', 
                severity: 'warning',
                details: { scoreJump, timeDelta }
            };
        }
    }
    
    return { valid: true };
}

/**
 * Generate checksum for score validation
 * @param {Object} session - Game session
 * @param {number} score - Final score
 * @returns {string} Checksum
 */
function generateChecksum(session, score) {
    const data = `${session.checksumSeed}_${session.userId}_${score}`;
    // Simple hash - in production use crypto
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Clean up old sessions
 */
function cleanupOldSessions() {
    const now = Date.now();
    for (const [sessionId, session] of sessionCache.entries()) {
        if (now - session.startTime > SESSION_TIMEOUT) {
            sessionCache.delete(sessionId);
        }
    }
}

/**
 * Log suspicious activity for monitoring
 * @param {Object} data - Suspicious activity data
 */
async function logSuspiciousActivity(data) {
    const db = admin.firestore();
    
    try {
        await db.collection('security_logs').add({
            type: 'suspicious_score',
            ...data,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.warn('[AntiCheat] Suspicious activity logged:', data.reason);
    } catch (error) {
        console.error('[AntiCheat] Failed to log suspicious activity:', error);
    }
}

/**
 * Check for ban status
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Is user banned
 */
async function isUserBanned(userId) {
    const db = admin.firestore();
    
    try {
        const banDoc = await db.collection('bans').doc(userId).get();
        if (banDoc.exists) {
            const banData = banDoc.data();
            // Check if ban is still active
            if (banData.expiresAt && banData.expiresAt.toDate() < new Date()) {
                // Ban expired, remove it
                await banDoc.ref.delete();
                return false;
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('[AntiCheat] Ban check failed:', error);
        return false; // Fail open - don't block on error
    }
}

module.exports = {
    startSession,
    recordAction,
    validateScore,
    validateSession,
    logSuspiciousActivity,
    isUserBanned,
    cleanupOldSessions,
    GAME_CONFIGS
};
