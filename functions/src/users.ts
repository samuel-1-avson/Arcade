/**
 * User Lifecycle Management
 * User creation, updates, and notifications
 */

import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, sendNotification, recordAnalyticsEvent, logger, LogCategory } from './utils';
import * as admin from 'firebase-admin';

/**
 * Handle user profile updates
 */
export const onUserUpdate = onDocumentUpdated(
  {
    document: 'users/{userId}',
    region: 'us-central1',
    memory: '256MiB',
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const userId = event.params.userId;

    if (!before || !after) return;

    // Check for level up
    if (after.level > before.level) {
      await sendNotification(userId, {
        type: 'level_up',
        title: 'Level Up!',
        message: `Congratulations! You reached level ${after.level}!`,
        icon: '⬆️',
      });

      await recordAnalyticsEvent('level_up', {
        userId,
        newLevel: after.level,
        previousLevel: before.level,
      });
    }
  }
);

/**
 * Handle new user creation
 */
export const onUserCreate = onDocumentCreated(
  {
    document: 'users/{userId}',
    region: 'us-central1',
    memory: '256MiB',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const userId = event.params.userId;
    const userData = snap.data();

    logger.info(LogCategory.USER, `New user created: ${userId}`);

    // Initialize user stats document
    await db
      .collection('stats')
      .doc('global')
      .set(
        {
          totalUsers: admin.firestore.FieldValue.increment(1),
        },
        { merge: true }
      );

    // Send welcome notification
    await sendNotification(userId, {
      type: 'welcome',
      title: 'Welcome to Arcade Hub!',
      message: 'Start playing games to earn achievements and climb the leaderboards!',
      icon: '🎮',
    });

    await recordAnalyticsEvent('user_signup', {
      userId,
      isAnonymous: userData.isAnonymous || false,
    });
  }
);

/**
 * HTTP endpoint for sending notifications (for testing)
 */
export const sendTestNotification = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in');
    }

    const userId = request.auth.uid;
    const data = request.data;

    await sendNotification(userId, {
      type: 'test',
      title: data.title || 'Test Notification',
      message: data.message || 'This is a test notification',
      icon: '🔔',
    });

    return { success: true };
  }
);
