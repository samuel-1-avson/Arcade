/**
 * User Profile Migration Script
 * Moves public profile data from users collection to publicProfiles
 * 
 * Usage:
 *   firebase deploy --only functions
 *   Then call from frontend or Firebase Console
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * HTTP Callable: Migrate current user's profile to publicProfiles
 */
exports.migrateCurrentUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in');
  }

  const userId = context.auth.uid;

  try {
    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    // Extract public fields
    const publicProfile = {
      displayName: userData.displayName || 'Player',
      avatar: userData.avatar || 'gamepad',
      level: userData.level || 1,
      title: userData.title || 'Newcomer',
      titleColor: userData.titleColor || '#808080',
      totalAchievements: userData.totalAchievements || 0,
      favoriteGame: userData.favoriteGame || null,
      lastSeen: userData.lastSeen || admin.firestore.FieldValue.serverTimestamp(),
      createdAt: userData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      migratedFrom: 'users_collection'
    };

    // Write to publicProfiles
    await db.collection('publicProfiles').doc(userId).set(publicProfile, { merge: true });

    console.log(`✅ Migrated profile for user: ${userId}`);

    return {
      success: true,
      message: 'Profile migrated successfully',
      profile: publicProfile
    };

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw new functions.https.HttpsError('internal', 'Migration failed: ' + error.message);
  }
});

/**
 * HTTP Callable: Batch migrate all users (admin only)
 */
exports.migrateAllProfiles = functions.https.onCall(async (data, context) => {
  // Verify admin status
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Admin authentication required');
  }

  // Check if user is admin (you should implement proper admin check)
  const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
  if (!adminDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Admin privileges required');
  }

  const batchSize = data.batchSize || 100;
  let migratedCount = 0;
  let errorCount = 0;

  try {
    const usersSnapshot = await db.collection('users').limit(batchSize).get();

    const batch = db.batch();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      try {
        const publicProfile = {
          displayName: userData.displayName || 'Player',
          avatar: userData.avatar || 'gamepad',
          level: userData.level || 1,
          title: userData.title || 'Newcomer',
          titleColor: userData.titleColor || '#808080',
          totalAchievements: userData.totalAchievements || 0,
          favoriteGame: userData.favoriteGame || null,
          lastSeen: userData.lastSeen || admin.firestore.FieldValue.serverTimestamp(),
          createdAt: userData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          migratedFrom: 'users_collection_batch'
        };

        const publicProfileRef = db.collection('publicProfiles').doc(userId);
        batch.set(publicProfileRef, publicProfile, { merge: true });

        migratedCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate user ${userId}:`, error);
        errorCount++;
      }
    }

    await batch.commit();

    console.log(`✅ Batch migration complete: ${migratedCount} migrated, ${errorCount} errors`);

    return {
      success: true,
      migratedCount,
      errorCount,
      message: `Migration complete: ${migratedCount} profiles migrated`
    };

  } catch (error) {
    console.error('❌ Batch migration error:', error);
    throw new functions.https.HttpsError('internal', 'Batch migration failed: ' + error.message);
  }
});

/**
 * Trigger: Auto-migrate on user creation
 */
exports.onUserCreateMigrate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const userData = snap.data();

    try {
      const publicProfile = {
        displayName: userData.displayName || 'Player',
        avatar: userData.avatar || 'gamepad',
        level: userData.level || 1,
        title: userData.title || 'Newcomer',
        titleColor: userData.titleColor || '#808080',
        totalAchievements: 0,
        favoriteGame: null,
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        autoMigrated: true
      };

      await db.collection('publicProfiles').doc(userId).set(publicProfile);

      console.log(`✅ Auto-migrated new user: ${userId}`);
    } catch (error) {
      console.error(`❌ Auto-migration failed for ${userId}:`, error);
    }
  });

/**
 * Trigger: Sync public profile on user update
 */
exports.onUserUpdateSync = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data();

    // Only sync if relevant fields changed
    const publicFields = ['displayName', 'avatar', 'level', 'title', 'titleColor', 
                          'totalAchievements', 'favoriteGame', 'lastSeen'];
    
    const changedFields = publicFields.filter(field => 
      change.before.data()[field] !== newData[field]
    );

    if (changedFields.length === 0) {
      return null;
    }

    try {
      const updates = {};
      changedFields.forEach(field => {
        updates[field] = newData[field];
      });
      updates.lastSync = admin.firestore.FieldValue.serverTimestamp();

      await db.collection('publicProfiles').doc(userId).update(updates);

      console.log(`✅ Synced public profile for ${userId}: ${changedFields.join(', ')}`);
    } catch (error) {
      console.error(`❌ Profile sync failed for ${userId}:`, error);
    }
  });
