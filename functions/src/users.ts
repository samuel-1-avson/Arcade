/**
 * User Lifecycle Management
 * User creation, updates, and notifications
 */

import { functions, admin, db, sendNotification, recordAnalyticsEvent, logger, LogCategory } from './utils';

/**
 * Handle user profile updates
 */
export const onUserUpdate = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

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

    return null;
  });

/**
 * Handle new user creation
 */
export const onUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
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

    return null;
  });

/**
 * HTTP endpoint for sending notifications (for testing)
 */
export const sendTestNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const userId = context.auth.uid;

  await sendNotification(userId, {
    type: 'test',
    title: data.title || 'Test Notification',
    message: data.message || 'This is a test notification',
    icon: '🔔',
  });

  return { success: true };
});
