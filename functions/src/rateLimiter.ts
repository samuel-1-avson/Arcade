/**
 * Rate Limiting Service
 * Prevents abuse by limiting request frequency per user
 */

import { db } from './utils';
import * as admin from 'firebase-admin';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime?: Date;
}

// Rate limit configurations by action type
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  score: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 scores per minute
  default: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 requests per minute
};

/**
 * Check if a user has exceeded their rate limit
 */
export async function checkRateLimit(
  userId: string,
  actionType: string = 'default'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[actionType] || RATE_LIMITS.default;
  const now = admin.firestore.Timestamp.now();
  const windowStart = new Date(Date.now() - config.windowMs);

  const rateLimitRef = db.collection('rateLimits').doc(`${userId}_${actionType}`);

  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);

      if (!doc.exists) {
        transaction.set(rateLimitRef, {
          userId,
          actionType,
          count: 1,
          windowStart: now,
          lastRequest: now,
        });
        return { allowed: true, remaining: config.maxRequests - 1 };
      }

      const data = doc.data()!;
      const windowStartTime = data.windowStart.toDate();

      // Reset if window has passed
      if (windowStartTime < windowStart) {
        transaction.update(rateLimitRef, {
          count: 1,
          windowStart: now,
          lastRequest: now,
        });
        return { allowed: true, remaining: config.maxRequests - 1 };
      }

      // Check if limit exceeded
      if (data.count >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(windowStartTime.getTime() + config.windowMs),
        };
      }

      // Increment count
      transaction.update(rateLimitRef, {
        count: admin.firestore.FieldValue.increment(1),
        lastRequest: now,
      });

      return { allowed: true, remaining: config.maxRequests - data.count - 1 };
    });

    // Get fresh data after transaction
    const freshDoc = await rateLimitRef.get();
    const freshData = freshDoc.data();

    if (!freshData) {
      return { allowed: true, remaining: config.maxRequests };
    }

    const remaining = Math.max(0, config.maxRequests - freshData.count);
    const windowStartTime = freshData.windowStart.toDate();

    return {
      allowed: remaining > 0,
      remaining,
      resetTime: new Date(windowStartTime.getTime() + config.windowMs),
    };
  } catch (error) {
    console.error('[RateLimiter] Error checking rate limit:', error);
    // Fail open - allow request on error
    return { allowed: true, remaining: 1 };
  }
}

/**
 * Clean up stale rate limit documents
 */
export async function cleanupRateLimits(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  try {
    const staleDocs = await db
      .collection('rateLimits')
      .where('lastRequest', '<', cutoff)
      .limit(500)
      .get();

    const batch = db.batch();
    staleDocs.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    console.log(`[RateLimiter] Cleaned up ${staleDocs.size} stale rate limit documents`);
  } catch (error) {
    console.error('[RateLimiter] Error cleaning up rate limits:', error);
  }
}
