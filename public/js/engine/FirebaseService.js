/**
 * Firebase Configuration and Services
 * Handles authentication and Firestore for leaderboards
 */

// Import Firebase configuration from centralized config module
import { firebaseConfig } from '../config/firebase-config.js';
import { logger, LogCategory } from '../utils/logger.js';


class FirebaseService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.rtdb = null;
        this.user = null;
        this.initialized = false;
    }

    /**
     * Initialize Firebase
     * Call this after loading Firebase SDK
     */
    async init() {
        if (this.initialized) {
            // Lazy load RTDB if SDK loaded late
            if (!this.rtdb && typeof firebase !== 'undefined' && typeof firebase.database === 'function') {
                logger.info(LogCategory.FIREBASE, 'Late initialization of RTDB');
                this.rtdb = firebase.database();
            }
            return true;
        }

        try {
            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                logger.warn(LogCategory.FIREBASE, 'Firebase SDK not loaded. Leaderboards disabled.');
                return false;
            }

            this.app = firebase.initializeApp(firebaseConfig);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // Safe initialize RTDB (check if loaded)
            if (typeof firebase.database === 'function') {
                this.rtdb = firebase.database();
            } else {
                logger.warn(LogCategory.FIREBASE, 'Firebase RTDB SDK not loaded initially.');
            }

            // Set persistence to LOCAL (survives browser restart)
            await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            logger.info(LogCategory.FIREBASE, 'Auth persistence set to LOCAL');

            this.initialized = true;

            // Check for redirect result (after Google sign-in redirect)
            try {
                logger.info(LogCategory.FIREBASE, 'Checking for redirect result...');
                const result = await this.auth.getRedirectResult();
                if (result && result.user) {
                    logger.info(LogCategory.FIREBASE, '✅ Signed in via redirect:', result.user.displayName || result.user.email);
                    this.user = result.user;
                    this.onAuthStateChanged(result.user);
                } else {
                    logger.info(LogCategory.FIREBASE, 'No redirect result found');
                }
            } catch (redirectError) {
                logger.error(LogCategory.FIREBASE, 'Redirect result error:', redirectError.code, redirectError.message);
            }

            // Listen for auth state changes
            this.auth.onAuthStateChanged((user) => {
                logger.info(LogCategory.FIREBASE, 'Firebase onAuthStateChanged:', user?.email || 'null');
                this.user = user;
                this.onAuthStateChanged(user);
            });

            return true;
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Firebase initialization error:', error);
            return false;
        }
    }

    /**
     * Get Realtime Database instance
     */
    getRTDB() {
        return this.rtdb;
    }

    /**
     * Check if Firebase is ready for operations
     * @returns {Object} { ready: boolean, reason: string }
     */
    isReady() {
        if (!this.initialized) {
            return { ready: false, reason: 'Firebase not initialized' };
        }
        if (!this.db) {
            return { ready: false, reason: 'Firestore not available' };
        }
        if (!this.user) {
            return { ready: false, reason: 'User not signed in' };
        }
        return { ready: true, reason: 'Ready' };
    }

    /**
     * Log connection status for debugging
     */
    logStatus() {
        const status = this.isReady();
        logger.info(LogCategory.FIREBASE, '[FirebaseService] Status:', status.reason);
        logger.info(LogCategory.FIREBASE, '[FirebaseService] Initialized:', this.initialized);
        logger.info(LogCategory.FIREBASE, '[FirebaseService] User:', this.user?.email || 'None');
        logger.info(LogCategory.FIREBASE, '[FirebaseService] Firestore:', !!this.db);
        logger.info(LogCategory.FIREBASE, '[FirebaseService] RTDB:', !!this.rtdb);
        return status;
    }

    /**
     * Auth state change handler (override in app)
     */
    onAuthStateChanged(user) {
        // Override this in your app
        logger.info(LogCategory.FIREBASE, 'Auth state changed:', user?.email || 'Not signed in');
    }

    // === AUTHENTICATION ===

    /**
     * Sign in with Google (uses popup for reliable local dev, with redirect fallback)
     */
    async signInWithGoogle() {
        if (!this.auth) return null;

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            // Try popup first (more reliable for local development)
            try {
                const result = await this.auth.signInWithPopup(provider);
                logger.info(LogCategory.FIREBASE, '✅ Signed in via popup:', result.user.displayName);
                return result.user;
            } catch (popupError) {
                // If popup blocked or fails, fall back to redirect
                if (popupError.code === 'auth/popup-blocked' || 
                    popupError.code === 'auth/popup-closed-by-user') {
                    logger.info(LogCategory.FIREBASE, 'Popup blocked, using redirect...');
                    await this.auth.signInWithRedirect(provider);
                    return null;
                }
                throw popupError;
            }
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Google sign-in error:', error);
            throw error;
        }
    }

    /**
     * Sign in anonymously (guest)
     */
    async signInAnonymously() {
        if (!this.auth) return null;

        try {
            const result = await this.auth.signInAnonymously();
            return result.user;
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Anonymous sign-in error:', error);
            throw error;
        }
    }

    /**
     * Sign in with email and password
     */
    async signInWithEmail(email, password) {
        if (!this.auth) return null;

        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Email sign-in error:', error);
            throw error;
        }
    }

    /**
     * Sign up with email and password
     */
    async signUpWithEmail(email, password, displayName) {
        if (!this.auth) return null;

        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            
            // Update profile with display name
            if (displayName && result.user) {
                await result.user.updateProfile({
                    displayName: displayName
                });
                
                // Also create user document in Firestore
                await this.createUserDocument(result.user.uid, {
                    displayName: displayName,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            return result.user;
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Email sign-up error:', error);
            throw error;
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email) {
        if (!this.auth) return null;

        try {
            await this.auth.sendPasswordResetEmail(email);
            return true;
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Password reset error:', error);
            throw error;
        }
    }

    /**
     * Set auth persistence
     */
    async setPersistence(type) {
        if (!this.auth) return;

        const persistence = type === 'local' 
            ? firebase.auth.Auth.Persistence.LOCAL
            : firebase.auth.Auth.Persistence.SESSION;
        
        try {
            await this.auth.setPersistence(persistence);
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Set persistence error:', error);
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        if (!this.auth) return;

        try {
            await this.auth.signOut();
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Sign-out error:', error);
            throw error;
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Check if user is signed in
     */
    isSignedIn() {
        return !!this.user;
    }

    // === LEADERBOARDS ===

    /**
     * Submit score to leaderboard
     */
    async submitScore(gameId, score, metadata = {}) {
        if (!this.db || !this.user) {
            logger.warn(LogCategory.FIREBASE, 'Cannot submit score: not signed in or DB not initialized');
            return null;
        }

        try {
            const scoreDoc = {
                gameId,
                score,
                userId: this.user.uid,
                userName: this.user.displayName || 'Anonymous',
                userPhoto: this.user.photoURL || null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ...metadata
            };

            // Add to scores collection
            const docRef = await this.db.collection('scores').add(scoreDoc);

            // Update user's personal best
            await this.updatePersonalBest(gameId, score);

            return docRef.id;
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Submit score error:', error);
            throw error;
        }
    }

    /**
     * Update user's personal best for a game (legacy - non-transactional)
     */
    async updatePersonalBest(gameId, score) {
        if (!this.db || !this.user) return;

        const userRef = this.db.collection('users').doc(this.user.uid);

        try {
            const userDoc = await userRef.get();
            const currentBests = userDoc.exists ? (userDoc.data().highScores || {}) : {};

            if (!currentBests[gameId] || score > currentBests[gameId]) {
                await userRef.set({
                    highScores: {
                        ...currentBests,
                        [gameId]: score
                    },
                    displayName: this.user.displayName || 'Anonymous',
                    photoURL: this.user.photoURL || null,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Update personal best error:', error);
        }
    }

    /**
     * Update user's personal best using a transaction (atomic operation)
     * Prevents race conditions when multiple score submissions happen simultaneously
     * @param {string} gameId - The game identifier
     * @param {number} score - The new score to potentially save
     * @returns {Promise<{updated: boolean, previousBest: number|null, newBest: number}>}
     */
    async updatePersonalBestWithTransaction(gameId, score) {
        if (!this.db || !this.user) {
            return { updated: false, previousBest: null, newBest: score };
        }

        const userRef = this.db.collection('users').doc(this.user.uid);

        try {
            const result = await this.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                const userData = userDoc.exists ? userDoc.data() : {};
                const currentBests = userData.highScores || {};
                const currentBest = currentBests[gameId] || 0;

                if (score > currentBest) {
                    // Score is higher, update it atomically
                    const updateData = {
                        [`highScores.${gameId}`]: score,
                        displayName: this.user.displayName || 'Anonymous',
                        photoURL: this.user.photoURL || null,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    if (userDoc.exists) {
                        transaction.update(userRef, updateData);
                    } else {
                        transaction.set(userRef, {
                            highScores: { [gameId]: score },
                            displayName: this.user.displayName || 'Anonymous',
                            photoURL: this.user.photoURL || null,
                            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }

                    return { updated: true, previousBest: currentBest, newBest: score };
                }

                // Score is not higher, no update needed
                return { updated: false, previousBest: currentBest, newBest: currentBest };
            });

            if (result.updated) {
                logger.info(LogCategory.FIREBASE, `New personal best for ${gameId}: ${result.newBest} (was ${result.previousBest})`);
            }

            return result;
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Transaction update personal best error:', error);
            return { updated: false, previousBest: null, newBest: score, error: error.message };
        }
    }

    /**
     * Submit score with transaction-based personal best update
     * This is the recommended method for score submission
     * @param {string} gameId - The game identifier
     * @param {number} score - The score to submit
     * @param {Object} metadata - Additional score metadata
     * @returns {Promise<{scoreId: string|null, isNewBest: boolean}>}
     */
    async submitScoreWithTransaction(gameId, score, metadata = {}) {
        if (!this.db || !this.user) {
            logger.warn(LogCategory.FIREBASE, 'Cannot submit score: not signed in or DB not initialized');
            return { scoreId: null, isNewBest: false };
        }

        try {
            // First, add the score document
            const scoreDoc = {
                gameId,
                score,
                userId: this.user.uid,
                userName: this.user.displayName || 'Anonymous',
                userPhoto: this.user.photoURL || null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ...metadata
            };

            const docRef = await this.db.collection('scores').add(scoreDoc);

            // Then update personal best with transaction
            const bestResult = await this.updatePersonalBestWithTransaction(gameId, score);

            return {
                scoreId: docRef.id,
                isNewBest: bestResult.updated,
                previousBest: bestResult.previousBest,
                newBest: bestResult.newBest
            };
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Submit score with transaction error:', error);
            return { scoreId: null, isNewBest: false, error: error.message };
        }
    }

    /**
     * Get top scores for a game
     */
    async getLeaderboard(gameId, limit = 10) {
        if (!this.db) return [];

        try {
            const snapshot = await this.db.collection('scores')
                .where('gameId', '==', gameId)
                .orderBy('score', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Get leaderboard error:', error);
            return [];
        }
    }

    /**
     * Get user's rank for a game
     */
    async getUserRank(gameId) {
        if (!this.db || !this.user) return null;

        try {
            // Get user's best score
            const userDoc = await this.db.collection('users').doc(this.user.uid).get();
            if (!userDoc.exists) return null;

            const userBest = userDoc.data().highScores?.[gameId];
            if (!userBest) return null;

            // Count scores higher than user's
            const higherScores = await this.db.collection('scores')
                .where('gameId', '==', gameId)
                .where('score', '>', userBest)
                .get();

            return higherScores.size + 1;
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Get user rank error:', error);
            return null;
        }
    }

    /**
     * Get user's stats
     */
    async getUserStats() {
        if (!this.db || !this.user) return null;

        try {
            const userDoc = await this.db.collection('users').doc(this.user.uid).get();
            return userDoc.exists ? userDoc.data() : null;
        } catch (error) {
            logger.error(LogCategory.FIREBASE, 'Get user stats error:', error);
            return null;
        }
    }

    /**
     * Get Firestore server timestamp
     * Use this instead of firebase.firestore.FieldValue.serverTimestamp()
     * @returns {Object} Firestore server timestamp
     */
    serverTimestamp() {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            return firebase.firestore.FieldValue.serverTimestamp();
        }
        // Fallback to client timestamp if Firebase not available
        return new Date();
    }

    /**
     * Get Firestore array union
     * @param {...any} elements Elements to add
     * @returns {Object} Firestore array union
     */
    arrayUnion(...elements) {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            return firebase.firestore.FieldValue.arrayUnion(...elements);
        }
        return elements;
    }

    /**
     * Get Firestore array remove
     * @param {...any} elements Elements to remove
     * @returns {Object} Firestore array remove
     */
    arrayRemove(...elements) {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            return firebase.firestore.FieldValue.arrayRemove(...elements);
        }
        return [];
    }
}

// Singleton instance
export const firebaseService = new FirebaseService();

// Export class for testing
export { FirebaseService };
