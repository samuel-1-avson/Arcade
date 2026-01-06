/**
 * UserAccountService - Cloud-synced User Account Management
 * Handles profile sync, authentication state, and cross-device data
 */

import { firebaseService } from '../engine/FirebaseService.js';
import { globalStateManager } from './GlobalStateManager.js';
import { eventBus } from '../engine/EventBus.js';

// User data version for schema migrations
const DATA_VERSION = 1;

class UserAccountService {
    constructor() {
        this.currentUser = null;
        this.userDoc = null;
        this.unsubscribeProfile = null;
        this.syncStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
        this.pendingSync = null;
        this.initialized = false;
        
        // Prevent infinite sync loops
        this._isSyncing = false;
        this._lastSyncTime = 0;
        this._lastCloudSaveTime = 0; // Track when WE last saved to cloud
        this._syncDebounceMs = 5000; // Minimum 5 seconds between syncs
        this._ignoreNextSnapshot = false; // Ignore snapshot triggered by our own write
    }

    /**
     * Initialize the user account service
     */
    async init() {
        if (this.initialized) return;

        // Listen for auth state changes
        firebaseService.onAuthStateChanged = (user) => this.handleAuthChange(user);

        // Check if already signed in
        const currentUser = firebaseService.getCurrentUser();
        if (currentUser) {
            await this.handleAuthChange(currentUser);
        }

        this.initialized = true;
        console.log('[UserAccountService] Initialized');
    }

    /**
     * Handle authentication state changes
     * @param {Object|null} user - Firebase user object
     */
    async handleAuthChange(user) {
        if (user) {
            this.currentUser = user;
            
            // Load or create user profile in Firestore
            await this.loadOrCreateProfile(user);
            
            // Start real-time sync
            this.startProfileSync();
            
            // Emit signed in event
            eventBus.emit('userSignedIn', { 
                uid: user.uid, 
                displayName: user.displayName || 'Player',
                isAnonymous: user.isAnonymous
            });
        } else {
            this.currentUser = null;
            this.stopProfileSync();
            
            // Emit signed out event
            eventBus.emit('userSignedOut');
        }
    }

    /**
     * Load existing profile or create new one
     * @param {Object} user - Firebase user
     */
    async loadOrCreateProfile(user) {
        const db = firebaseService.db;
        if (!db) return;

        try {
            this.syncStatus = 'syncing';
            this.emitSyncStatus();

            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                // Existing user - merge cloud data with local
                const cloudData = userDoc.data();
                await this.mergeCloudWithLocal(cloudData);
                console.log('[UserAccountService] Loaded profile from cloud');
            } else {
                // New user - create cloud profile from local data
                await this.createCloudProfile(user, userRef);
                console.log('[UserAccountService] Created new cloud profile');
            }

            this.syncStatus = 'synced';
            this.emitSyncStatus();
        } catch (error) {
            console.error('[UserAccountService] Profile load error:', error);
            this.syncStatus = 'error';
            this.emitSyncStatus();
        }
    }

    /**
     * Merge cloud data with local state
     * @param {Object} cloudData - Data from Firestore
     */
    async mergeCloudWithLocal(cloudData) {
        const localProfile = globalStateManager.getProfile();
        const localStats = globalStateManager.getStatistics();

        // Cloud wins for core profile fields
        const mergedProfile = {
            displayName: cloudData.displayName || localProfile.displayName,
            avatar: cloudData.avatar || localProfile.avatar,
            level: Math.max(cloudData.level || 0, localProfile.level),
            xp: Math.max(cloudData.xp || 0, localProfile.xp),
            totalCoins: Math.max(cloudData.totalCoins || 0, localProfile.totalCoins || 0),
            preferences: { ...localProfile.preferences, ...cloudData.preferences }
        };

        // Merge statistics (take highest values)
        const mergedStats = {
            totalGamesPlayed: Math.max(cloudData.totalGamesPlayed || 0, localStats.totalGamesPlayed),
            totalPlayTime: Math.max(cloudData.totalPlayTime || 0, localStats.totalPlayTime),
            totalScore: Math.max(cloudData.totalScore || 0, localStats.totalScore),
            longestStreak: Math.max(cloudData.longestStreak || 0, localStats.longestStreak)
        };

        // Update local state
        globalStateManager.updateProfile(mergedProfile);
        
        // Load game-specific stats
        if (cloudData.gameStats) {
            for (const [gameId, stats] of Object.entries(cloudData.gameStats)) {
                const localGameStats = globalStateManager.getGameStats(gameId);
                globalStateManager.updateGameStats(gameId, {
                    highScore: Math.max(stats.highScore || 0, localGameStats.highScore),
                    totalScore: Math.max(stats.totalScore || 0, localGameStats.totalScore),
                    played: Math.max(stats.played || 0, localGameStats.played),
                    playTime: Math.max(stats.playTime || 0, localGameStats.playTime)
                });
            }
        }

        // Load achievements
        if (cloudData.achievements) {
            for (const achievement of cloudData.achievements) {
                globalStateManager.recordAchievement(
                    achievement.gameId, 
                    achievement.id, 
                    0 // Don't re-award XP
                );
            }
        }
    }

    /**
     * Create new cloud profile from local data
     * @param {Object} user - Firebase user
     * @param {Object} userRef - Firestore reference
     */
    async createCloudProfile(user, userRef) {
        const localProfile = globalStateManager.getProfile();
        const localStats = globalStateManager.getStatistics();

        const cloudProfile = {
            // Core profile
            uid: user.uid,
            displayName: user.displayName || localProfile.displayName || 'Player',
            avatar: localProfile.avatar || '🎮',
            email: user.email || null,
            photoURL: user.photoURL || null,
            isAnonymous: user.isAnonymous || false,
            
            // Progression
            level: localProfile.level || 1,
            xp: localProfile.xp || 0,
            totalCoins: localProfile.totalCoins || 0,
            
            // Preferences
            preferences: localProfile.preferences || {
                soundEnabled: true,
                musicEnabled: true,
                notificationsEnabled: true
            },
            
            // Statistics
            totalGamesPlayed: localStats.totalGamesPlayed || 0,
            totalPlayTime: localStats.totalPlayTime || 0,
            totalScore: localStats.totalScore || 0,
            longestStreak: localStats.longestStreak || 0,
            
            // Game-specific stats
            gameStats: localStats.gameStats || {},
            
            // Metadata
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            dataVersion: DATA_VERSION
        };

        await userRef.set(cloudProfile);
        
        // Store achievements separately
        const achievements = globalStateManager.gameAchievements || {};
        for (const [gameId, achievementIds] of Object.entries(achievements)) {
            for (const achievementId of achievementIds) {
                await userRef.collection('achievements').doc(`${gameId}_${achievementId}`).set({
                    gameId,
                    id: achievementId,
                    unlockedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
    }

    /**
     * Start real-time profile synchronization
     */
    startProfileSync() {
        if (!this.currentUser || !firebaseService.db) return;

        // Unsubscribe from previous listener
        this.stopProfileSync();

        const userRef = firebaseService.db.collection('users').doc(this.currentUser.uid);
        
        this.unsubscribeProfile = userRef.onSnapshot(
            (doc) => {
                if (doc.exists) {
                    const cloudData = doc.data();
                    this.handleCloudUpdate(cloudData);
                }
            },
            (error) => {
                console.error('[UserAccountService] Sync error:', error);
                this.syncStatus = 'error';
                this.emitSyncStatus();
            }
        );

        console.log('[UserAccountService] Started real-time sync');
    }

    /**
     * Stop profile synchronization
     */
    stopProfileSync() {
        if (this.unsubscribeProfile) {
            this.unsubscribeProfile();
            this.unsubscribeProfile = null;
        }
    }

    /**
     * Handle updates from cloud (from other devices)
     * Uses timestamp-based conflict resolution
     * @param {Object} cloudData
     */
    handleCloudUpdate(cloudData) {
        // Skip if we're currently syncing or just wrote to cloud
        if (this._isSyncing) {
            console.log('[UserAccountService] Ignoring snapshot - currently syncing');
            return;
        }
        
        // Ignore snapshots triggered by our own writes (within 10 seconds of our cloud save)
        const timeSinceOurSave = Date.now() - this._lastCloudSaveTime;
        if (this._ignoreNextSnapshot || timeSinceOurSave < 10000) {
            console.log('[UserAccountService] Ignoring snapshot triggered by our own write');
            this._ignoreNextSnapshot = false;
            this.syncStatus = 'synced';
            this.emitSyncStatus();
            return;
        }

        // Only update if data version matches or is newer
        if (cloudData.dataVersion && cloudData.dataVersion > DATA_VERSION) {
            console.warn('[UserAccountService] Cloud data version newer than client');
        }

        const localProfile = globalStateManager.getProfile();
        const localLastModified = localProfile.lastModified || 0;
        const cloudLastModified = cloudData.lastSeen?.toMillis?.() || 
                                   cloudData.lastModified?.toMillis?.() || 0;

        // Timestamp-based conflict resolution - only merge if cloud is significantly newer (5+ seconds)
        if (cloudLastModified > localLastModified + 5000) {
            // Cloud is newer - merge cloud data into local
            console.log('[UserAccountService] Cloud data is newer, merging...');
            
            // Set syncing flag to prevent recursive updates
            this._isSyncing = true;
            
            globalStateManager.updateProfile({
                displayName: cloudData.displayName,
                avatar: cloudData.avatar,
                level: Math.max(cloudData.level || 1, localProfile.level || 1),
                xp: Math.max(cloudData.xp || 0, localProfile.xp || 0),
                lastModified: cloudLastModified
            }, true); // silent update to prevent event triggering

            // Merge game stats (take higher values for each game)
            if (cloudData.gameStats) {
                this._mergeGameStats(cloudData.gameStats);
            }

            this._isSyncing = false;
            this.syncStatus = 'synced';
            this.emitSyncStatus();
            eventBus.emit('profileSyncedFromCloud', cloudData);
        } else {
            // Local is same or newer - just mark as synced, don't push back
            // (Pushing back would create an infinite loop)
            this.syncStatus = 'synced';
            this.emitSyncStatus();
        }
    }

    /**
     * Merge game stats taking higher values
     * @private
     */
    _mergeGameStats(cloudGameStats) {
        const localStats = globalStateManager.getStatistics();
        const mergedStats = { ...localStats.gameStats };

        for (const [gameId, cloudStats] of Object.entries(cloudGameStats)) {
            if (!mergedStats[gameId]) {
                mergedStats[gameId] = cloudStats;
            } else {
                // Merge individual stats, taking higher values
                mergedStats[gameId] = {
                    ...mergedStats[gameId],
                    highScore: Math.max(mergedStats[gameId].highScore || 0, cloudStats.highScore || 0),
                    played: Math.max(mergedStats[gameId].played || 0, cloudStats.played || 0),
                    totalScore: Math.max(mergedStats[gameId].totalScore || 0, cloudStats.totalScore || 0),
                    achievements: Math.max(mergedStats[gameId].achievements || 0, cloudStats.achievements || 0),
                    perfectRuns: Math.max(mergedStats[gameId].perfectRuns || 0, cloudStats.perfectRuns || 0)
                };
            }
        }

        // Update local state with merged stats
        globalStateManager._updateGameStats(mergedStats);
    }

    /**
     * Save local changes to cloud
     * Debounced to prevent excessive writes
     */
    async saveToCloud() {
        if (!this.currentUser || !firebaseService.db) {
            console.warn('[UserAccountService] Cannot save: not signed in');
            return;
        }

        // Debounce
        if (this.pendingSync) {
            clearTimeout(this.pendingSync);
        }

        this.pendingSync = setTimeout(async () => {
            await this.performCloudSave();
        }, 2000); // 2 second debounce
    }

    /**
     * Perform the actual cloud save
     * @param {number} retryCount - Current retry attempt (for exponential backoff)
     */
    async performCloudSave(retryCount = 0) {
        if (!this.currentUser || !firebaseService.db) return;
        
        // Prevent re-entrant calls
        if (this._isSyncing) {
            console.log('[UserAccountService] Sync already in progress, skipping');
            return;
        }

        const MAX_RETRIES = 3;
        const BASE_DELAY = 1000; // 1 second

        try {
            this._isSyncing = true;
            this.syncStatus = 'syncing';
            this.emitSyncStatus();

            const localProfile = globalStateManager.getProfile();
            const localStats = globalStateManager.getStatistics();
            const userRef = firebaseService.db.collection('users').doc(this.currentUser.uid);

            const now = Date.now();
            
            await userRef.update({
                displayName: localProfile.displayName,
                avatar: localProfile.avatar,
                level: localProfile.level,
                xp: localProfile.xp,
                totalCoins: localProfile.totalCoins || 0,
                preferences: localProfile.preferences,
                totalGamesPlayed: localStats.totalGamesPlayed,
                totalPlayTime: localStats.totalPlayTime,
                totalScore: localStats.totalScore,
                longestStreak: localStats.longestStreak,
                gameStats: localStats.gameStats,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                lastModified: firebase.firestore.FieldValue.serverTimestamp(),
                localModifiedAt: now // Client timestamp for conflict resolution
            });

            // Update local lastModified WITHOUT triggering another sync
            globalStateManager.updateProfile({ lastModified: now }, true); // silent update
            
            // Mark that we just saved - ignore incoming snapshots from our own write
            this._lastCloudSaveTime = now;
            this._ignoreNextSnapshot = true;

            this.syncStatus = 'synced';
            this.emitSyncStatus();
            console.log('[UserAccountService] Saved to cloud');
        } catch (error) {
            console.error('[UserAccountService] Cloud save error:', error);
            
            // Exponential backoff retry
            if (retryCount < MAX_RETRIES) {
                const delay = BASE_DELAY * Math.pow(2, retryCount);
                console.log(`[UserAccountService] Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                
                this._isSyncing = false; // Reset flag before retry
                setTimeout(() => {
                    this.performCloudSave(retryCount + 1);
                }, delay);
                
                this.syncStatus = 'retrying';
                this.emitSyncStatus();
            } else {
                this.syncStatus = 'error';
                this.emitSyncStatus();
                
                // Queue for offline save after all retries exhausted
                this.queueOfflineSave();
            }
        } finally {
            // Always reset sync flag after operation completes
            this._isSyncing = false;
        }
    }

    /**
     * Queue save for when back online
     */
    queueOfflineSave() {
        // Store in localStorage for later sync
        try {
            const pending = JSON.parse(localStorage.getItem('pendingCloudSync') || '[]');
            pending.push({
                timestamp: Date.now(),
                profile: globalStateManager.getProfile(),
                stats: globalStateManager.getStatistics()
            });
            localStorage.setItem('pendingCloudSync', JSON.stringify(pending));
            this.syncStatus = 'offline';
            this.emitSyncStatus();
        } catch (e) {
            console.warn('[UserAccountService] Failed to queue offline save:', e);
        }
    }

    /**
     * Process any pending offline saves
     */
    async processPendingSaves() {
        try {
            const pending = JSON.parse(localStorage.getItem('pendingCloudSync') || '[]');
            if (pending.length === 0) return;

            console.log(`[UserAccountService] Processing ${pending.length} pending saves`);

            for (const item of pending) {
                await this.performCloudSave();
            }

            localStorage.removeItem('pendingCloudSync');
        } catch (e) {
            console.warn('[UserAccountService] Failed to process pending saves:', e);
        }
    }

    /**
     * Link anonymous account to Google
     */
    async linkToGoogle() {
        if (!this.currentUser || !this.currentUser.isAnonymous) {
            console.warn('[UserAccountService] Cannot link: not anonymous');
            return null;
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await this.currentUser.linkWithPopup(provider);
            
            // Update cloud profile with Google info
            if (result.user && firebaseService.db) {
                await firebaseService.db.collection('users').doc(result.user.uid).update({
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL,
                    isAnonymous: false,
                    linkedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            eventBus.emit('accountLinked', { provider: 'google' });
            return result.user;
        } catch (error) {
            console.error('[UserAccountService] Link error:', error);
            throw error;
        }
    }

    /**
     * Get current sync status
     */
    getSyncStatus() {
        return this.syncStatus;
    }

    /**
     * Emit sync status event
     */
    emitSyncStatus() {
        eventBus.emit('syncStatusChanged', { status: this.syncStatus });
    }

    /**
     * Check if user is signed in
     */
    isSignedIn() {
        return !!this.currentUser;
    }

    /**
     * Check if current user is anonymous
     */
    isAnonymous() {
        return this.currentUser?.isAnonymous || false;
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        if (!this.currentUser) return null;
        
        return {
            uid: this.currentUser.uid,
            displayName: this.currentUser.displayName,
            email: this.currentUser.email,
            photoURL: this.currentUser.photoURL,
            isAnonymous: this.currentUser.isAnonymous
        };
    }

    /**
     * Delete user account and all data
     */
    async deleteAccount() {
        if (!this.currentUser) return;

        try {
            // Delete Firestore data
            if (firebaseService.db) {
                const userRef = firebaseService.db.collection('users').doc(this.currentUser.uid);
                
                // Delete subcollections
                const achievements = await userRef.collection('achievements').get();
                for (const doc of achievements.docs) {
                    await doc.ref.delete();
                }
                
                // Delete user document
                await userRef.delete();
            }

            // Delete auth account
            await this.currentUser.delete();
            
            // Clear local data
            globalStateManager.clearAllData();
            localStorage.removeItem('pendingCloudSync');

            console.log('[UserAccountService] Account deleted');
        } catch (error) {
            console.error('[UserAccountService] Delete account error:', error);
            throw error;
        }
    }
}

export const userAccountService = new UserAccountService();
