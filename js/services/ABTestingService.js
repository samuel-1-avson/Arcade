/**
 * A/B Testing Infrastructure
 * Feature flags and experiment management
 */

import { globalStateManager } from './GlobalStateManager.js';
import { analyticsService, ANALYTICS_EVENTS } from './AnalyticsService.js';

// Experiment definitions
const EXPERIMENTS = {
    // UI experiments
    'new_game_cards': {
        id: 'new_game_cards',
        name: 'New Game Card Design',
        description: 'Testing new card layout with hover effects',
        variants: ['control', 'variant_a', 'variant_b'],
        weights: [0.33, 0.34, 0.33], // Equal split
        enabled: true
    },
    'leaderboard_preview': {
        id: 'leaderboard_preview',
        name: 'Leaderboard Preview Size',
        description: 'Testing different leaderboard preview sizes',
        variants: ['5_entries', '10_entries', '3_entries'],
        weights: [0.5, 0.25, 0.25],
        enabled: true
    },
    // Performance experiments
    'cache_duration': {
        id: 'cache_duration',
        name: 'Cache Duration Test',
        description: 'Testing longer cache durations',
        variants: ['5min', '10min', '15min'],
        weights: [0.34, 0.33, 0.33],
        enabled: true
    },
    // Feature flags (on/off)
    'show_daily_rewards': {
        id: 'show_daily_rewards',
        name: 'Daily Rewards Feature',
        description: 'Show daily login rewards',
        variants: ['enabled', 'disabled'],
        weights: [0.5, 0.5],
        enabled: false // Not yet launched
    },
    'zen_mode_v2': {
        id: 'zen_mode_v2',
        name: 'Zen Mode V2',
        description: 'New zen mode interface',
        variants: ['v1', 'v2'],
        weights: [0.5, 0.5],
        enabled: true
    }
};

// Feature flags (simpler on/off)
const FEATURE_FLAGS = {
    'enhanced_anticheat': true,
    'structured_logging': true,
    'tournament_firestore': true,
    'rate_limiting': true,
    'analytics_batching': true,
    'social_features': true,
    'party_system': true,
    'achievements_v2': false,
    'custom_themes': false
};

class ABTestingService {
    constructor() {
        this.userId = null;
        this.assignments = {};
        this.localStorageKey = 'arcadeHub_abTests';
    }

    /**
     * Initialize A/B testing service
     */
    init(userId = null) {
        this.userId = userId || this._getOrCreateUserId();
        this._loadAssignments();
        console.log('[A/B] Service initialized for user:', this.userId);
    }

    /**
     * Get or create anonymous user ID for consistent bucketing
     */
    _getOrCreateUserId() {
        let id = localStorage.getItem('arcadeHub_abUserId');
        if (!id) {
            id = `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('arcadeHub_abUserId', id);
        }
        return id;
    }

    /**
     * Load existing assignments from storage
     */
    _loadAssignments() {
        try {
            const stored = localStorage.getItem(this.localStorageKey);
            this.assignments = stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.warn('Failed to load A/B assignments:', e);
            this.assignments = {};
        }
    }

    /**
     * Save assignments to storage
     */
    _saveAssignments() {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(this.assignments));
        } catch (e) {
            console.warn('Failed to save A/B assignments:', e);
        }
    }

    /**
     * Get variant for an experiment
     * Assigns user to a variant if not already assigned
     * @param {string} experimentId 
     * @returns {string|null} variant name or null if experiment disabled
     */
    getVariant(experimentId) {
        const experiment = EXPERIMENTS[experimentId];
        
        if (!experiment || !experiment.enabled) {
            return null;
        }

        // Return existing assignment
        if (this.assignments[experimentId]) {
            return this.assignments[experimentId];
        }

        // Assign to a variant
        const variant = this._assignVariant(experiment);
        this.assignments[experimentId] = variant;
        this._saveAssignments();

        // Track assignment
        analyticsService.track('experiment_assigned', {
            experimentId,
            variant,
            userId: this.userId
        });

        console.log(`[A/B] Assigned ${experimentId}: ${variant}`);
        return variant;
    }

    /**
     * Assign user to a variant based on weights
     * @private
     */
    _assignVariant(experiment) {
        // Use consistent hashing based on userId + experimentId
        const hash = this._hashString(`${this.userId}_${experiment.id}`);
        const bucket = hash % 100; // 0-99

        // Find variant based on weights
        let cumulative = 0;
        for (let i = 0; i < experiment.variants.length; i++) {
            cumulative += experiment.weights[i] * 100;
            if (bucket < cumulative) {
                return experiment.variants[i];
            }
        }

        // Fallback to first variant
        return experiment.variants[0];
    }

    /**
     * Simple string hash function
     * @private
     */
    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Check if a feature flag is enabled
     * @param {string} flagName 
     * @returns {boolean}
     */
    isFeatureEnabled(flagName) {
        return FEATURE_FLAGS[flagName] === true;
    }

    /**
     * Track conversion for an experiment
     * @param {string} experimentId 
     * @param {string} conversionType 
     * @param {Object} data 
     */
    trackConversion(experimentId, conversionType, data = {}) {
        const variant = this.assignments[experimentId];
        if (!variant) return;

        analyticsService.track('experiment_conversion', {
            experimentId,
            variant,
            conversionType,
            userId: this.userId,
            ...data
        });
    }

    /**
     * Get all current assignments
     * @returns {Object}
     */
    getAllAssignments() {
        return { ...this.assignments };
    }

    /**
     * Get experiment info
     * @param {string} experimentId 
     * @returns {Object|null}
     */
    getExperimentInfo(experimentId) {
        return EXPERIMENTS[experimentId] || null;
    }

    /**
     * Get all enabled experiments
     * @returns {Object[]}
     */
    getEnabledExperiments() {
        return Object.values(EXPERIMENTS).filter(e => e.enabled);
    }

    /**
     * Get all feature flags
     * @returns {Object}
     */
    getFeatureFlags() {
        return { ...FEATURE_FLAGS };
    }

    /**
     * Force a specific variant (for testing)
     * @param {string} experimentId 
     * @param {string} variant 
     */
    forceVariant(experimentId, variant) {
        const experiment = EXPERIMENTS[experimentId];
        if (!experiment) return;

        if (!experiment.variants.includes(variant)) {
            console.warn(`Invalid variant ${variant} for ${experimentId}`);
            return;
        }

        this.assignments[experimentId] = variant;
        this._saveAssignments();
        console.log(`[A/B] Forced ${experimentId}: ${variant}`);
    }

    /**
     * Reset all assignments (for testing)
     */
    resetAssignments() {
        this.assignments = {};
        localStorage.removeItem(this.localStorageKey);
        console.log('[A/B] All assignments reset');
    }

    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            userId: this.userId,
            assignments: this.assignments,
            experiments: Object.keys(EXPERIMENTS).map(id => ({
                id,
                enabled: EXPERIMENTS[id].enabled,
                assigned: this.assignments[id] || null
            })),
            featureFlags: FEATURE_FLAGS
        };
    }
}

export const abTestingService = new ABTestingService();
export { EXPERIMENTS, FEATURE_FLAGS };
export default ABTestingService;
