/**
 * System Maintenance
 * Cleanup tasks, health checks, and scheduled maintenance
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { rtdb, logger, LogCategory } from './utils';
import { cleanupRateLimits } from './rateLimiter';

/**
 * Clean up stale presence data every 10 minutes
 */
export const cleanupPresence = onSchedule(
  {
    schedule: 'every 10 minutes',
    region: 'us-central1',
    memory: '256MiB',
  },
  async () => {
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
  }
);

/**
 * Clean up stale rate limit documents hourly
 */
export const cleanupRateLimitsScheduled = onSchedule(
  {
    schedule: 'every 1 hours',
    region: 'us-central1',
    memory: '256MiB',
  },
  async () => {
    logger.info(LogCategory.SYSTEM, 'Cleaning up stale rate limit documents');
    await cleanupRateLimits();
  }
);

/**
 * Health check endpoint
 */
export const healthCheck = onRequest(
  {
    region: 'us-central1',
    memory: '256MiB',
  },
  (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      region: 'us-central1',
    });
  }
);

// Re-export cleanupRateLimits for direct use
export { cleanupRateLimits };
