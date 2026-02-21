/**
 * Public Profile Service
 * Handles migration from users collection to publicProfiles
 * Manages public-facing user data
 */

import { firebaseService } from '../engine/FirebaseService.js';
import { eventBus } from '../engine/EventBus.js';
import { logger, LogCategory } from '../utils/logger.js';

class PublicProfileService {
  constructor() {
    this.db = null;
    this.migrationChecked = false;
  }

  /**
   * Initialize the service
   */
  async init() {
    if (!firebaseService.db) {
      logger.warn(LogCategory.SOCIAL, '[PublicProfileService] Firestore not initialized');
      return;
    }

    this.db = firebaseService.db;
    
    // Check if current user needs migration
    await this.checkAndMigrateCurrentUser();
  }

  /**
   * Check if current user needs migration and migrate if needed
   */
  async checkAndMigrateCurrentUser() {
    if (this.migrationChecked) return;
    
    const user = firebaseService.getCurrentUser();
    if (!user) {
      this.migrationChecked = true;
      return;
    }

    try {
      // Check if public profile exists
      const publicProfileDoc = await this.db
        .collection('publicProfiles')
        .doc(user.uid)
        .get();

      if (!publicProfileDoc.exists) {
        logger.info(LogCategory.SOCIAL, '[PublicProfileService] Migrating user profile...');
        await this.migrateUserProfile(user.uid);
      }

      this.migrationChecked = true;
    } catch (error) {
      logger.error(LogCategory.SOCIAL, '[PublicProfileService] Migration check failed:', error);
    }
  }

  /**
   * Migrate user profile to publicProfiles
   */
  async migrateUserProfile(userId) {
    try {
      // Get private user data
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        logger.warn(LogCategory.SOCIAL, '[PublicProfileService] User document not found');
        return;
      }

      const userData = userDoc.data();

      // Create public profile
      const publicProfile = {
        displayName: userData.displayName || 'Player',
        avatar: userData.avatar || 'gamepad',
        level: userData.level || 1,
        title: userData.title || 'Newcomer',
        titleColor: userData.titleColor || '#808080',
        totalAchievements: userData.totalAchievements || 0,
        favoriteGame: userData.favoriteGame || null,
        lastSeen: firebaseService.serverTimestamp(),
        createdAt: userData.createdAt || firebaseService.serverTimestamp(),
        migratedAt: firebaseService.serverTimestamp()
      };

      await this.db.collection('publicProfiles').doc(userId).set(publicProfile);

      logger.info(LogCategory.SOCIAL, '[PublicProfileService] Profile migrated successfully');
      eventBus.emit('profileMigrated', { userId });
    } catch (error) {
      logger.error(LogCategory.SOCIAL, '[PublicProfileService] Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get a user's public profile
   * @param {string} userId 
   * @returns {Promise<Object|null>}
   */
  async getPublicProfile(userId) {
    if (!this.db) return null;

    try {
      const doc = await this.db.collection('publicProfiles').doc(userId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      logger.error(LogCategory.SOCIAL, '[PublicProfileService] Failed to get public profile:', error);
      return null;
    }
  }

  /**
   * Get multiple public profiles
   * @param {string[]} userIds 
   * @returns {Promise<Object[]>}
   */
  async getPublicProfiles(userIds) {
    if (!this.db || !userIds.length) return [];

    try {
      // Firestore 'in' query supports up to 10 values
      const chunks = this.chunkArray(userIds, 10);
      const profiles = [];

      for (const chunk of chunks) {
        const snapshot = await this.db
          .collection('publicProfiles')
          .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
          .get();

        snapshot.forEach(doc => {
          profiles.push({ id: doc.id, ...doc.data() });
        });
      }

      return profiles;
    } catch (error) {
      logger.error(LogCategory.SOCIAL, '[PublicProfileService] Failed to get public profiles:', error);
      return [];
    }
  }

  /**
   * Update current user's public profile
   * @param {Object} updates 
   */
  async updatePublicProfile(updates) {
    const user = firebaseService.getCurrentUser();
    if (!user || !this.db) {
      throw new Error('User not authenticated');
    }

    // Only allow specific public fields
    const allowedFields = [
      'displayName', 'avatar', 'level', 'title', 
      'titleColor', 'favoriteGame', 'lastSeen'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return;
    }

    try {
      await this.db
        .collection('publicProfiles')
        .doc(user.uid)
        .update(filteredUpdates);

      logger.info(LogCategory.SOCIAL, '[PublicProfileService] Public profile updated');
    } catch (error) {
      logger.error(LogCategory.SOCIAL, '[PublicProfileService] Update failed:', error);
      throw error;
    }
  }

  /**
   * Watch a user's public profile for changes
   * @param {string} userId 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  watchPublicProfile(userId, callback) {
    if (!this.db) return () => {};

    return this.db
      .collection('publicProfiles')
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            callback({ id: doc.id, ...doc.data() });
          } else {
            callback(null);
          }
        },
        (error) => {
          logger.error(LogCategory.SOCIAL, '[PublicProfileService] Watch error:', error);
        }
      );
  }

  /**
   * Helper: Chunk array into smaller arrays
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Singleton instance
export const publicProfileService = new PublicProfileService();
export default PublicProfileService;
