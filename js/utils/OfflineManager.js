/**
 * Offline Manager
 * Enhanced offline support for free tier without relying on Cloud Functions
 * Handles queueing actions and syncing when back online
 */

import { eventBus } from '../engine/EventBus.js';
import { logger, LogCategory } from '../utils/logger.js';

class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.actionQueue = [];
        this.syncInProgress = false;
        this.pendingChanges = new Map();
        this.offlineCache = new Map();
        this.maxQueueSize = 100;
    }

    /**
     * Initialize offline manager
     */
    init() {
        logger.info(LogCategory.NETWORK, '[OfflineManager] Initialized');

        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Load queued actions from storage
        this.loadQueue();

        // Initial sync if online
        if (this.isOnline) {
            this.syncWhenReady();
        }

        // Set up periodic sync attempts
        setInterval(() => this.attemptSync(), 30000);

        // Notify system of initial state
        eventBus.emit('offlineStatusChanged', { isOnline: this.isOnline });
    }

    /**
     * Handle going online
     */
    handleOnline() {
        logger.info(LogCategory.NETWORK, '[OfflineManager] Connection restored');
        this.isOnline = true;
        eventBus.emit('offlineStatusChanged', { isOnline: true });
        eventBus.emit('connectionRestored');
        
        // Attempt to sync queued actions
        this.syncWhenReady();
    }

    /**
     * Handle going offline
     */
    handleOffline() {
        logger.info(LogCategory.NETWORK, '[OfflineManager] Connection lost');
        this.isOnline = false;
        eventBus.emit('offlineStatusChanged', { isOnline: false });
        eventBus.emit('connectionLost');
    }

    /**
     * Queue an action for when back online
     */
    queueAction(type, data, priority = 'normal') {
        const action = {
            id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            priority,
            timestamp: Date.now(),
            attempts: 0,
            maxAttempts: 3
        };

        this.actionQueue.push(action);
        
        // Limit queue size
        if (this.actionQueue.length > this.maxQueueSize) {
            // Remove oldest non-critical actions
            const nonCritical = this.actionQueue.filter(a => a.priority !== 'critical');
            if (nonCritical.length > 0) {
                const toRemove = nonCritical[0];
                this.actionQueue = this.actionQueue.filter(a => a.id !== toRemove.id);
            }
        }

        this.saveQueue();
        
        logger.info(LogCategory.NETWORK, '[OfflineManager] Action queued:', type);
        eventBus.emit('actionQueued', { action });

        // Try to sync immediately if online
        if (this.isOnline) {
            this.syncWhenReady();
        }

        return action.id;
    }

    /**
     * Queue a score submission
     */
    queueScoreSubmission(gameId, score, metadata) {
        return this.queueAction('scoreSubmit', {
            gameId,
            score,
            metadata,
            timestamp: Date.now()
        }, 'critical'); // Scores are critical
    }

    /**
     * Queue a profile update
     */
    queueProfileUpdate(updates) {
        return this.queueAction('profileUpdate', updates, 'high');
    }

    /**
     * Queue a friend request
     */
    queueFriendRequest(userId) {
        return this.queueAction('friendRequest', { userId }, 'normal');
    }

    /**
     * Save queue to localStorage
     */
    saveQueue() {
        try {
            localStorage.setItem('arcadeHub_offlineQueue', 
                JSON.stringify(this.actionQueue));
        } catch (e) {
            logger.warn(LogCategory.NETWORK, '[OfflineManager] Failed to save queue:', e);
        }
    }

    /**
     * Load queue from localStorage
     */
    loadQueue() {
        try {
            const saved = localStorage.getItem('arcadeHub_offlineQueue');
            if (saved) {
                this.actionQueue = JSON.parse(saved);
            }
        } catch (e) {
            logger.warn(LogCategory.NETWORK, '[OfflineManager] Failed to load queue:', e);
        }
    }

    /**
     * Sync when ready (debounced)
     */
    syncWhenReady() {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }
        this.syncTimeout = setTimeout(() => this.attemptSync(), 1000);
    }

    /**
     * Attempt to sync all queued actions
     */
    async attemptSync() {
        if (!this.isOnline || this.syncInProgress || this.actionQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        eventBus.emit('syncStarted', { pendingCount: this.actionQueue.length });

        const successful = [];
        const failed = [];

        // Sort by priority and timestamp
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        const sortedQueue = [...this.actionQueue].sort((a, b) => {
            const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (pDiff !== 0) return pDiff;
            return a.timestamp - b.timestamp;
        });

        for (const action of sortedQueue) {
            try {
                await this.executeAction(action);
                successful.push(action.id);
            } catch (error) {
                action.attempts++;
                if (action.attempts >= action.maxAttempts) {
                    logger.warn(LogCategory.NETWORK, '[OfflineManager] Action max attempts reached:', action);
                    failed.push(action.id);
                }
            }
        }

        // Remove successful and max-attempts failed from queue
        this.actionQueue = this.actionQueue.filter(
            a => !successful.includes(a.id) && !failed.includes(a.id)
        );

        this.saveQueue();
        this.syncInProgress = false;

        eventBus.emit('syncComplete', {
            successful: successful.length,
            failed: failed.length,
            remaining: this.actionQueue.length
        });

        logger.info(LogCategory.NETWORK, '[OfflineManager] Sync complete:', {
            successful: successful.length,
            failed: failed.length
        });
    }

    /**
     * Execute a queued action
     */
    async executeAction(action) {
        const { firebaseService } = await import('../engine/FirebaseService.js');

        switch (action.type) {
            case 'scoreSubmit':
                await firebaseService.submitScoreWithTransaction(
                    action.data.gameId,
                    action.data.score,
                    action.data.metadata
                );
                break;

            case 'profileUpdate':
                await firebaseService.updateUserProfile(
                    firebaseService.getCurrentUserId(),
                    action.data
                );
                break;

            case 'friendRequest':
                await firebaseService.sendFriendRequest(action.data.userId);
                break;

            default:
                logger.warn(LogCategory.NETWORK, '[OfflineManager] Unknown action type:', action.type);
        }
    }

    /**
     * Cache data for offline use
     */
    cacheData(key, data, ttl = 3600000) {
        try {
            const cacheEntry = {
                data,
                timestamp: Date.now(),
                ttl
            };
            this.offlineCache.set(key, cacheEntry);
            localStorage.setItem(`arcadeHub_cache_${key}`, 
                JSON.stringify(cacheEntry));
        } catch (e) {
            logger.warn(LogCategory.NETWORK, '[OfflineManager] Cache error:', e);
        }
    }

    /**
     * Get cached data
     */
    getCachedData(key) {
        try {
            // Check memory first
            const memEntry = this.offlineCache.get(key);
            if (memEntry && Date.now() - memEntry.timestamp < memEntry.ttl) {
                return memEntry.data;
            }

            // Check localStorage
            const saved = localStorage.getItem(`arcadeHub_cache_${key}`);
            if (saved) {
                const entry = JSON.parse(saved);
                if (Date.now() - entry.timestamp < entry.ttl) {
                    this.offlineCache.set(key, entry);
                    return entry.data;
                }
            }
        } catch (e) {
            logger.warn(LogCategory.NETWORK, '[OfflineManager] Cache read error:', e);
        }
        return null;
    }

    /**
     * Store pending change
     */
    storePendingChange(key, value) {
        this.pendingChanges.set(key, {
            value,
            timestamp: Date.now()
        });
        
        try {
            localStorage.setItem('arcadeHub_pendingChanges', 
                JSON.stringify(Array.from(this.pendingChanges.entries())));
        } catch (e) {
            logger.warn(LogCategory.NETWORK, '[OfflineManager] Pending changes save error:', e);
        }
    }

    /**
     * Get pending change
     */
    getPendingChange(key) {
        return this.pendingChanges.get(key)?.value || null;
    }

    /**
     * Clear pending change
     */
    clearPendingChange(key) {
        this.pendingChanges.delete(key);
        try {
            localStorage.setItem('arcadeHub_pendingChanges', 
                JSON.stringify(Array.from(this.pendingChanges.entries())));
        } catch (e) {
            // ignore
        }
    }

    /**
     * Get offline status
     */
    getStatus() {
        return {
            isOnline: this.isOnline,
            pendingActions: this.actionQueue.length,
            syncInProgress: this.syncInProgress,
            cachedKeys: Array.from(this.offlineCache.keys()),
            pendingChanges: Array.from(this.pendingChanges.keys())
        };
    }

    /**
     * Clear all offline data
     */
    clearAll() {
        this.actionQueue = [];
        this.offlineCache.clear();
        this.pendingChanges.clear();
        
        // Clear localStorage items
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith('arcadeHub_')) {
                localStorage.removeItem(key);
            }
        }

        logger.info(LogCategory.NETWORK, '[OfflineManager] All offline data cleared');
    }
}

// Singleton
export const offlineManager = new OfflineManager();
export default OfflineManager;
