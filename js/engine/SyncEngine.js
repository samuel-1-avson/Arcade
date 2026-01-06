/**
 * SyncEngine - Offline-first Data Synchronization
 * Handles reliable bidirectional sync between local storage and cloud
 */

import { firebaseService } from './FirebaseService.js';
import { eventBus } from './EventBus.js';

// Sync operation types
const OP_TYPES = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete'
};

// Queue storage key
const QUEUE_KEY = 'syncEngine_offlineQueue';
const LAST_SYNC_KEY = 'syncEngine_lastSync';

class SyncEngine {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.watchers = new Map(); // collection -> callback[]
        this.syncInProgress = false;
        this.retryTimeout = null;
        this.initialized = false;
    }

    /**
     * Initialize the sync engine
     */
    init() {
        if (this.initialized) return;

        // Load pending operations from storage
        this.loadQueue();

        // Listen for online/offline status
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Process queue on init if online
        if (this.isOnline) {
            this.processQueue();
        }

        this.initialized = true;
        console.log('[SyncEngine] Initialized, queue size:', this.syncQueue.length);
    }

    /**
     * Handle coming online
     */
    handleOnline() {
        console.log('[SyncEngine] Back online');
        this.isOnline = true;
        eventBus.emit('networkStatusChanged', { online: true });
        
        // Process pending queue
        this.processQueue();
    }

    /**
     * Handle going offline
     */
    handleOffline() {
        console.log('[SyncEngine] Gone offline');
        this.isOnline = false;
        eventBus.emit('networkStatusChanged', { online: false });
    }

    // ==================== WRITE OPERATIONS ====================

    /**
     * Create a document in a collection
     * @param {string} collection - Firestore collection path
     * @param {Object} data - Document data
     * @param {string} docId - Optional document ID
     * @returns {Promise<string>} Document ID
     */
    async create(collection, data, docId = null) {
        const operation = {
            id: this.generateOpId(),
            type: OP_TYPES.CREATE,
            collection,
            docId,
            data,
            timestamp: Date.now(),
            retries: 0
        };

        return this.executeOrQueue(operation);
    }

    /**
     * Update a document
     * @param {string} collection - Firestore collection path
     * @param {string} docId - Document ID
     * @param {Object} data - Fields to update
     * @param {boolean} merge - Whether to merge with existing (default: true)
     */
    async update(collection, docId, data, merge = true) {
        const operation = {
            id: this.generateOpId(),
            type: OP_TYPES.UPDATE,
            collection,
            docId,
            data,
            merge,
            timestamp: Date.now(),
            retries: 0
        };

        return this.executeOrQueue(operation);
    }

    /**
     * Delete a document
     * @param {string} collection - Firestore collection path  
     * @param {string} docId - Document ID
     */
    async delete(collection, docId) {
        const operation = {
            id: this.generateOpId(),
            type: OP_TYPES.DELETE,
            collection,
            docId,
            timestamp: Date.now(),
            retries: 0
        };

        return this.executeOrQueue(operation);
    }

    /**
     * Execute operation immediately or queue for later
     * @param {Object} operation
     */
    async executeOrQueue(operation) {
        if (this.isOnline && firebaseService.db) {
            try {
                const result = await this.executeOperation(operation);
                return result;
            } catch (error) {
                console.warn('[SyncEngine] Operation failed, queuing:', error.message);
                this.queueOperation(operation);
                throw error;
            }
        } else {
            // Offline - queue for later
            this.queueOperation(operation);
            return operation.docId || operation.id;
        }
    }

    /**
     * Execute a single operation against Firestore
     * @param {Object} op
     */
    async executeOperation(op) {
        const db = firebaseService.db;
        if (!db) throw new Error('Firestore not initialized');

        const collectionRef = db.collection(op.collection);

        switch (op.type) {
            case OP_TYPES.CREATE: {
                if (op.docId) {
                    await collectionRef.doc(op.docId).set({
                        ...op.data,
                        _syncedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    return op.docId;
                } else {
                    const docRef = await collectionRef.add({
                        ...op.data,
                        _syncedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    return docRef.id;
                }
            }

            case OP_TYPES.UPDATE: {
                const updateData = {
                    ...op.data,
                    _syncedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                if (op.merge) {
                    await collectionRef.doc(op.docId).set(updateData, { merge: true });
                } else {
                    await collectionRef.doc(op.docId).update(updateData);
                }
                return op.docId;
            }

            case OP_TYPES.DELETE: {
                await collectionRef.doc(op.docId).delete();
                return op.docId;
            }

            default:
                throw new Error(`Unknown operation type: ${op.type}`);
        }
    }

    // ==================== QUEUE MANAGEMENT ====================

    /**
     * Add operation to queue
     * @param {Object} operation
     */
    queueOperation(operation) {
        // Check for duplicate or superseding operation
        const existingIndex = this.syncQueue.findIndex(
            op => op.collection === operation.collection && op.docId === operation.docId
        );

        if (existingIndex !== -1) {
            // Replace with newer operation (last-write-wins)
            this.syncQueue[existingIndex] = operation;
        } else {
            this.syncQueue.push(operation);
        }

        this.saveQueue();
        eventBus.emit('syncQueueUpdated', { size: this.syncQueue.length });
        
        console.log('[SyncEngine] Queued operation:', operation.type, operation.collection);
    }

    /**
     * Process all queued operations
     */
    async processQueue() {
        if (this.syncInProgress || this.syncQueue.length === 0 || !this.isOnline) {
            return;
        }

        this.syncInProgress = true;
        eventBus.emit('syncStarted');

        console.log(`[SyncEngine] Processing ${this.syncQueue.length} queued operations`);

        const failedOps = [];

        for (const operation of [...this.syncQueue]) {
            try {
                await this.executeOperation(operation);
                // Remove from queue on success
                const index = this.syncQueue.indexOf(operation);
                if (index !== -1) {
                    this.syncQueue.splice(index, 1);
                }
            } catch (error) {
                console.error('[SyncEngine] Operation failed:', error);
                operation.retries++;
                
                if (operation.retries < 3) {
                    failedOps.push(operation);
                } else {
                    console.error('[SyncEngine] Max retries reached, dropping operation');
                    eventBus.emit('syncOperationFailed', { operation, error });
                }
            }
        }

        // Re-queue failed operations
        this.syncQueue = failedOps;
        this.saveQueue();

        this.syncInProgress = false;
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        
        eventBus.emit('syncCompleted', { 
            success: failedOps.length === 0,
            remaining: failedOps.length 
        });

        // Retry failed operations after delay
        if (failedOps.length > 0) {
            this.scheduleRetry();
        }
    }

    /**
     * Schedule retry for failed operations
     */
    scheduleRetry() {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }

        this.retryTimeout = setTimeout(() => {
            this.processQueue();
        }, 30000); // Retry in 30 seconds
    }

    /**
     * Save queue to localStorage
     */
    saveQueue() {
        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(this.syncQueue));
        } catch (e) {
            console.warn('[SyncEngine] Failed to save queue:', e);
        }
    }

    /**
     * Load queue from localStorage
     */
    loadQueue() {
        try {
            const saved = localStorage.getItem(QUEUE_KEY);
            if (saved) {
                this.syncQueue = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('[SyncEngine] Failed to load queue:', e);
            this.syncQueue = [];
        }
    }

    // ==================== READ OPERATIONS ====================

    /**
     * Get a single document
     * @param {string} collection
     * @param {string} docId
     */
    async get(collection, docId) {
        if (!firebaseService.db) return null;

        try {
            const doc = await firebaseService.db.collection(collection).doc(docId).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            console.error('[SyncEngine] Get error:', error);
            return null;
        }
    }

    /**
     * Query documents
     * @param {string} collection
     * @param {Array} queries - Array of [field, operator, value]
     * @param {Object} options - { orderBy, limit }
     */
    async query(collection, queries = [], options = {}) {
        if (!firebaseService.db) return [];

        try {
            let ref = firebaseService.db.collection(collection);

            // Apply where clauses
            for (const [field, operator, value] of queries) {
                ref = ref.where(field, operator, value);
            }

            // Apply ordering
            if (options.orderBy) {
                const [field, direction] = options.orderBy;
                ref = ref.orderBy(field, direction || 'asc');
            }

            // Apply limit
            if (options.limit) {
                ref = ref.limit(options.limit);
            }

            const snapshot = await ref.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('[SyncEngine] Query error:', error);
            return [];
        }
    }

    // ==================== REAL-TIME WATCHERS ====================

    /**
     * Watch a document for changes
     * @param {string} collection
     * @param {string} docId
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    watchDocument(collection, docId, callback) {
        if (!firebaseService.db) {
            console.warn('[SyncEngine] Cannot watch: Firestore not initialized');
            return () => {};
        }

        const unsubscribe = firebaseService.db
            .collection(collection)
            .doc(docId)
            .onSnapshot(
                (doc) => {
                    if (doc.exists) {
                        callback({ id: doc.id, ...doc.data() });
                    } else {
                        callback(null);
                    }
                },
                (error) => {
                    console.error('[SyncEngine] Watch error:', error);
                }
            );

        return unsubscribe;
    }

    /**
     * Watch a collection for changes
     * @param {string} collection
     * @param {Array} queries
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    watchCollection(collection, queries, callback) {
        if (!firebaseService.db) {
            console.warn('[SyncEngine] Cannot watch: Firestore not initialized');
            return () => {};
        }

        let ref = firebaseService.db.collection(collection);

        // Apply where clauses
        for (const [field, operator, value] of queries) {
            ref = ref.where(field, operator, value);
        }

        const unsubscribe = ref.onSnapshot(
            (snapshot) => {
                const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const changes = snapshot.docChanges().map(change => ({
                    type: change.type,
                    doc: { id: change.doc.id, ...change.doc.data() }
                }));
                callback(docs, changes);
            },
            (error) => {
                console.error('[SyncEngine] Collection watch error:', error);
            }
        );

        return unsubscribe;
    }

    // ==================== UTILITIES ====================

    /**
     * Generate unique operation ID
     */
    generateOpId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            online: this.isOnline,
            queueSize: this.syncQueue.length,
            syncing: this.syncInProgress,
            lastSync: parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0')
        };
    }

    /**
     * Clear the sync queue
     */
    clearQueue() {
        this.syncQueue = [];
        this.saveQueue();
    }

    /**
     * Force sync now
     */
    async forceSync() {
        if (this.isOnline) {
            await this.processQueue();
        }
    }
}

export const syncEngine = new SyncEngine();
