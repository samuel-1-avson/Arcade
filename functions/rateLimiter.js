/**
 * Rate Limiter for Cloud Functions
 * Token bucket algorithm with Firestore-backed distributed limiting
 */

const admin = require('firebase-admin');

// Rate limit configurations
const RATE_LIMITS = {
    score: { maxRequests: 10, windowSeconds: 60 },       // 10 scores per minute
    analytics: { maxRequests: 30, windowSeconds: 60 },   // 30 analytics events per minute
    tournament: { maxRequests: 5, windowSeconds: 60 },   // 5 tournament actions per minute
    notification: { maxRequests: 20, windowSeconds: 60 } // 20 notifications per minute
};

/**
 * Check if a request is within rate limits
 * @param {string} userId - User making the request
 * @param {string} actionType - Type of action (score, analytics, tournament, notification)
 * @param {number} maxRequests - Maximum requests allowed (optional, uses default from RATE_LIMITS)
 * @param {number} windowSeconds - Time window in seconds (optional, uses default from RATE_LIMITS)
 * @returns {Promise<{allowed: boolean, remaining: number, resetTime: number}>}
 */
async function checkRateLimit(userId, actionType, maxRequests = null, windowSeconds = null) {
    const config = RATE_LIMITS[actionType] || { maxRequests: 10, windowSeconds: 60 };
    maxRequests = maxRequests || config.maxRequests;
    windowSeconds = windowSeconds || config.windowSeconds;
    
    const db = admin.firestore();
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);
    const rateLimitKey = `${userId}_${actionType}`;
    
    try {
        const rateLimitRef = db.collection('rate_limits').doc(rateLimitKey);
        
        const result = await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(rateLimitRef);
            
            let requests = [];
            if (doc.exists) {
                // Filter out requests outside the current window
                requests = (doc.data().requests || []).filter(ts => ts > windowStart);
            }
            
            // Check if within limit
            if (requests.length >= maxRequests) {
                // Find when the oldest request expires
                const oldestRequest = Math.min(...requests);
                const resetTime = oldestRequest + (windowSeconds * 1000);
                
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: resetTime
                };
            }
            
            // Add current request
            requests.push(now);
            
            // Update the rate limit document
            transaction.set(rateLimitRef, {
                userId,
                actionType,
                requests,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return {
                allowed: true,
                remaining: maxRequests - requests.length,
                resetTime: now + (windowSeconds * 1000)
            };
        });
        
        return result;
        
    } catch (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the request but log the issue
        return { allowed: true, remaining: 0, resetTime: now };
    }
}

/**
 * Middleware-style rate limit decorator for Cloud Functions
 * @param {string} actionType - Type of action to rate limit
 * @param {Function} fn - The function to wrap
 * @returns {Function} Wrapped function with rate limiting
 */
function withRateLimit(actionType, fn) {
    return async (snap, context) => {
        const data = snap.data();
        const userId = data.userId;
        
        if (!userId) {
            console.warn('No userId found for rate limiting');
            return fn(snap, context);
        }
        
        const { allowed, remaining, resetTime } = await checkRateLimit(userId, actionType);
        
        if (!allowed) {
            console.warn(`Rate limit exceeded for user ${userId} on action ${actionType}`);
            
            // For Firestore triggers, we can mark the document
            if (snap.ref && snap.ref.update) {
                await snap.ref.update({
                    rateLimited: true,
                    rateLimitResetTime: resetTime
                });
            }
            
            return null;
        }
        
        // Add rate limit info to context for the function to use
        context.rateLimit = { remaining, resetTime };
        
        return fn(snap, context);
    };
}

/**
 * Clean up old rate limit documents (run periodically)
 */
async function cleanupRateLimits() {
    const db = admin.firestore();
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    try {
        const staleDocsQuery = await db.collection('rate_limits')
            .where('lastUpdated', '<', oneHourAgo)
            .limit(100)
            .get();
        
        const batch = db.batch();
        staleDocsQuery.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`Cleaned up ${staleDocsQuery.size} stale rate limit documents`);
        
    } catch (error) {
        console.error('Rate limit cleanup error:', error);
    }
}

module.exports = {
    checkRateLimit,
    withRateLimit,
    cleanupRateLimits,
    RATE_LIMITS
};
