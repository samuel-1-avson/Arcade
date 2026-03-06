/**
 * System Maintenance
 * Cleanup tasks, health checks, and scheduled maintenance
 */

import { functions, rtdb, logger, LogCategory } from './utils';
import { cleanupRateLimits } from './rateLimiter';

/**
 * Clean up stale presence data every 10 minutes
 */
export const cleanupPresence = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async (context) => {
    logger.info(LogCategory.SYSTEM, 'Cleaning up stale presence');

    const staleThreshold = Date.now() - 60 * 60 * 1000; // 1 hour

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
    } catch (error: any) {
      logger.error(LogCategory.SYSTEM, 'Presence cleanup error', { error: error.message });
    }

    return null;
  });

/**
 * Clean up stale rate limit documents hourly
 */
export const cleanupRateLimitsFn = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    logger.info(LogCategory.SYSTEM, 'Cleaning up stale rate limit documents');
    await cleanupRateLimits();
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
