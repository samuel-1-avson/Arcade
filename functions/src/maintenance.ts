/**
 * Maintenance & System Health
 * Scheduled cleanup tasks and health monitoring
 */

import { functions, admin, rtdb } from './utils';
const { cleanupRateLimits: doCleanupRateLimits } = require('../rateLimiter');
const { logger, LogCategory } = require('../logger');

/**
 * Clean up stale presence data every 10 minutes
 */
export const cleanupPresence = functions.pubsub
    .schedule('every 10 minutes')
    .onRun(async () => {
        logger.info(LogCategory.SYSTEM, 'Cleaning up stale presence');

        // Stale threshold: 1 hour
        const staleThreshold = Date.now() - 60 * 60 * 1000;

        try {
            const staleUsers = await rtdb
                .ref('presence')
                .orderByChild('lastChanged')
                .endAt(staleThreshold)
                .once('value');

            const updates: Record<string, null> = {};
            staleUsers.forEach((child) => {
                if (child.val().online === false) {
                    updates[child.key!] = null;
                }
                return false;
            });

            if (Object.keys(updates).length > 0) {
                await rtdb.ref('presence').update(updates);
                logger.info(LogCategory.SYSTEM, `Cleaned up ${Object.keys(updates).length} stale presence entries`);
            }

            return null;
        } catch (error: any) {
            logger.error(LogCategory.SYSTEM, 'Presence cleanup error', {
                error: error.message,
            });
            return null;
        }
    });

/**
 * Clean up stale rate limit documents hourly
 */
export const cleanupRateLimits = functions.pubsub
    .schedule('every 1 hours')
    .onRun(async () => {
        logger.info(LogCategory.SYSTEM, 'Cleaning up stale rate limit documents');
        await doCleanupRateLimits();
        return null;
    });

/**
 * Health check endpoint
 */
export const healthCheck = functions.https.onRequest((req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
    });
});
