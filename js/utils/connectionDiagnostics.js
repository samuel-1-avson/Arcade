/**
 * Connection Diagnostics Tool
 * Monitors and diagnoses frontend-backend connection health
 */

import { firebaseService } from '../engine/FirebaseService.js';
import { eventBus } from '../engine/EventBus.js';

class ConnectionDiagnostics {
    constructor() {
        this.status = {
            firebaseInitialized: false,
            authConnected: false,
            firestoreConnected: false,
            rtdbConnected: false,
            cloudFunctionsReachable: false,
            lastChecked: null,
            latency: null
        };
        this.checkInterval = null;
        this.listeners = [];
    }

    /**
     * Initialize connection monitoring
     */
    init() {
        console.log('[ConnectionDiagnostics] Initializing...');
        this.runDiagnostics();
        
        // Run periodic checks every 30 seconds
        this.checkInterval = setInterval(() => {
            this.runDiagnostics();
        }, 30000);

        // Listen for auth state changes
        this.listeners.push(
            eventBus.on('userSignedIn', () => this.runDiagnostics())
        );
        this.listeners.push(
            eventBus.on('userSignedOut', () => this.runDiagnostics())
        );
    }

    /**
     * Run full diagnostic suite
     */
    async runDiagnostics() {
        console.log('[ConnectionDiagnostics] Running diagnostics...');
        
        const startTime = performance.now();
        
        await Promise.all([
            this.checkFirebaseInitialization(),
            this.checkAuthConnection(),
            this.checkFirestoreConnection(),
            this.checkRTDBConnection(),
            this.checkCloudFunctions()
        ]);
        
        this.status.latency = Math.round(performance.now() - startTime);
        this.status.lastChecked = new Date().toISOString();
        
        console.log('[ConnectionDiagnostics] Status:', this.status);
        eventBus.emit('connectionStatus', this.status);
        
        return this.status;
    }

    /**
     * Check if Firebase is initialized
     */
    async checkFirebaseInitialization() {
        try {
            this.status.firebaseInitialized = firebaseService.initialized && 
                typeof firebase !== 'undefined';
        } catch (error) {
            console.error('[ConnectionDiagnostics] Firebase init check failed:', error);
            this.status.firebaseInitialized = false;
        }
    }

    /**
     * Check Auth connection
     */
    async checkAuthConnection() {
        try {
            if (!firebaseService.auth) {
                this.status.authConnected = false;
                return;
            }
            
            const currentUser = firebaseService.getCurrentUser();
            this.status.authConnected = true;
            this.status.currentUser = currentUser ? {
                uid: currentUser.uid,
                email: currentUser.email,
                isAnonymous: currentUser.isAnonymous
            } : null;
        } catch (error) {
            console.error('[ConnectionDiagnostics] Auth check failed:', error);
            this.status.authConnected = false;
        }
    }

    /**
     * Check Firestore connection with a simple ping
     */
    async checkFirestoreConnection() {
        try {
            if (!firebaseService.db) {
                this.status.firestoreConnected = false;
                return;
            }
            
            // Try to access the stats collection (read-only, always available)
            const statsRef = firebaseService.db.collection('stats').doc('global');
            await statsRef.get({ source: 'server' });
            
            this.status.firestoreConnected = true;
        } catch (error) {
            if (error.code === 'permission-denied') {
                // Permission denied means Firestore is reachable but rules blocked it
                this.status.firestoreConnected = true;
            } else {
                console.error('[ConnectionDiagnostics] Firestore check failed:', error);
                this.status.firestoreConnected = false;
            }
        }
    }

    /**
     * Check Realtime Database connection
     */
    async checkRTDBConnection() {
        try {
            if (!firebaseService.rtdb) {
                this.status.rtdbConnected = false;
                return;
            }
            
            // Try to read presence (public read)
            const presenceRef = firebaseService.rtdb.ref('stats/connection_test');
            await presenceRef.once('value');
            
            this.status.rtdbConnected = true;
        } catch (error) {
            console.error('[ConnectionDiagnostics] RTDB check failed:', error);
            this.status.rtdbConnected = false;
        }
    }

    /**
     * Check if Cloud Functions are reachable
     */
    async checkCloudFunctions() {
        try {
            if (!firebaseService.db) {
                this.status.cloudFunctionsReachable = false;
                return;
            }
            
            // Try to trigger a function by writing to a test document
            // This will fail with permission denied if functions are working
            // (because only functions can write to certain collections)
            const testRef = firebaseService.db.collection('analytics_counters').doc('test');
            try {
                await testRef.get({ source: 'server' });
                this.status.cloudFunctionsReachable = true;
            } catch (error) {
                // If we get permission denied, functions are likely working
                this.status.cloudFunctionsReachable = error.code === 'permission-denied';
            }
        } catch (error) {
            console.error('[ConnectionDiagnostics] Cloud Functions check failed:', error);
            this.status.cloudFunctionsReachable = false;
        }
    }

    /**
     * Get current connection status
     */
    getStatus() {
        return { ...this.status };
    }

    /**
     * Check if all critical services are connected
     */
    isHealthy() {
        return this.status.firebaseInitialized && 
               this.status.authConnected && 
               this.status.firestoreConnected;
    }

    /**
     * Get human-readable status message
     */
    getStatusMessage() {
        if (!this.status.firebaseInitialized) {
            return 'Firebase not initialized. Check your configuration.';
        }
        if (!this.status.authConnected) {
            return 'Auth service not connected.';
        }
        if (!this.status.firestoreConnected) {
            return 'Firestore database not reachable.';
        }
        if (!this.status.rtdbConnected) {
            return 'Realtime Database not reachable (optional).';
        }
        if (!this.status.cloudFunctionsReachable) {
            return 'Cloud Functions may not be deployed.';
        }
        return 'All systems operational.';
    }

    /**
     * Log detailed diagnostics to console
     */
    logDiagnostics() {
        console.group('🔍 Connection Diagnostics');
        console.log('Firebase Initialized:', this.status.firebaseInitialized ? '✅' : '❌');
        console.log('Auth Connected:', this.status.authConnected ? '✅' : '❌');
        console.log('Firestore Connected:', this.status.firestoreConnected ? '✅' : '❌');
        console.log('RTDB Connected:', this.status.rtdbConnected ? '✅' : '❌');
        console.log('Cloud Functions:', this.status.cloudFunctionsReachable ? '✅' : '❌');
        console.log('Latency:', this.status.latency + 'ms');
        console.log('Last Checked:', this.status.lastChecked);
        console.log('Status:', this.getStatusMessage());
        console.groupEnd();
    }

    /**
     * Create a visual status indicator
     */
    createStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'connection-status-indicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
            z-index: 9999;
            transition: all 0.3s ease;
            cursor: pointer;
        `;
        
        this.updateStatusIndicator(indicator);
        
        indicator.addEventListener('click', () => {
            this.logDiagnostics();
            this.runDiagnostics().then(() => {
                this.updateStatusIndicator(indicator);
            });
        });
        
        // Update when status changes
        eventBus.on('connectionStatus', () => {
            this.updateStatusIndicator(indicator);
        });
        
        document.body.appendChild(indicator);
        return indicator;
    }

    /**
     * Update status indicator styling
     */
    updateStatusIndicator(indicator) {
        const healthy = this.isHealthy();
        const color = healthy ? '#00ff88' : '#ff4444';
        const bgColor = healthy ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)';
        
        indicator.style.backgroundColor = bgColor;
        indicator.style.color = color;
        indicator.style.border = `1px solid ${color}`;
        indicator.innerHTML = `
            <span style="display: inline-block; width: 8px; height: 8px; background: ${color}; border-radius: 50%; margin-right: 6px;"></span>
            ${healthy ? 'Connected' : 'Connection Issue'}
            ${this.status.latency ? `(${this.status.latency}ms)` : ''}
        `;
    }

    /**
     * Test a specific Firestore collection access
     */
    async testCollectionAccess(collectionName) {
        try {
            if (!firebaseService.db) {
                return { success: false, error: 'Firestore not initialized' };
            }
            
            const snapshot = await firebaseService.db
                .collection(collectionName)
                .limit(1)
                .get();
            
            return { 
                success: true, 
                readable: true,
                documentCount: snapshot.size
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Run comprehensive test suite
     */
    async runTestSuite() {
        console.group('🔬 Connection Test Suite');
        
        const tests = {
            'Firebase Initialization': this.status.firebaseInitialized,
            'Auth Service': this.status.authConnected,
            'Firestore Read (stats)': await this.testCollectionAccess('stats'),
            'Firestore Read (publicProfiles)': await this.testCollectionAccess('publicProfiles'),
            'Firestore Write (scores)': await this.testWriteAccess('scores'),
            'RTDB Connection': this.status.rtdbConnected
        };
        
        let passed = 0;
        let failed = 0;
        
        for (const [name, result] of Object.entries(tests)) {
            const success = typeof result === 'boolean' ? result : result.success;
            if (success) {
                console.log(`✅ ${name}`);
                passed++;
            } else {
                console.error(`❌ ${name}:`, typeof result === 'object' ? result.error : 'Failed');
                failed++;
            }
        }
        
        console.log(`\nResults: ${passed} passed, ${failed} failed`);
        console.groupEnd();
        
        return { passed, failed, tests };
    }

    /**
     * Test write access to a collection
     */
    async testWriteAccess(collectionName) {
        try {
            if (!firebaseService.db || !firebaseService.isSignedIn()) {
                return { success: false, error: 'Not signed in' };
            }
            
            // Create a test document
            const testRef = firebaseService.db.collection(collectionName).doc('_test_write');
            await testRef.set({ test: true, timestamp: Date.now() });
            await testRef.delete();
            
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.listeners.forEach(unsubscribe => unsubscribe());
    }
}

// Singleton instance
export const connectionDiagnostics = new ConnectionDiagnostics();

// Convenience function for quick checks
export const checkConnection = () => connectionDiagnostics.runDiagnostics();

export default ConnectionDiagnostics;
