import { logger, LogCategory } from '../utils/logger.js';
/**
 * Schema Versioning System
 * Handles data migrations and schema version tracking
 */

// Current schema versions by collection/store
const SCHEMA_VERSIONS = {
    userProfile: 2,
    tournaments: 2,
    gameStats: 1,
    achievements: 1,
    settings: 1
};

// Migration registry
const MIGRATIONS = {
    userProfile: {
        1: (data) => {
            // v1 -> v2: Add avatar icons, remove emoji avatars
            if (!data) return data;
            const emojiToIcon = {
                '🎮': 'gamepad',
                '🐍': 'snake',
                '👻': 'ghost',
                '🎵': 'music',
                '⚔️': 'sword',
                '🏰': 'castle'
            };
            if (data.avatar && emojiToIcon[data.avatar]) {
                data.avatar = emojiToIcon[data.avatar];
            }
            data._schemaVersion = 2;
            return data;
        }
    },
    tournaments: {
        1: (data) => {
            // v1 -> v2: Add Firestore compatibility fields
            if (!data) return data;
            data.updatedAt = data.updatedAt || data.createdAt || Date.now();
            data.creatorId = data.hostId; // Rename hostId to creatorId for consistency
            data._schemaVersion = 2;
            return data;
        }
    }
};

class SchemaVersionService {
    constructor() {
        this.currentVersions = SCHEMA_VERSIONS;
        this.localVersionsKey = 'arcadeHub_schemaVersions';
    }

    /**
     * Get stored schema versions
     */
    getStoredVersions() {
        try {
            const stored = localStorage.getItem(this.localVersionsKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            logger.warn(LogCategory.STORAGE, 'Failed to get schema versions:', e);
            return {};
        }
    }

    /**
     * Save schema versions
     */
    saveVersions(versions) {
        try {
            localStorage.setItem(this.localVersionsKey, JSON.stringify(versions));
        } catch (e) {
            logger.warn(LogCategory.STORAGE, 'Failed to save schema versions:', e);
        }
    }

    /**
     * Check if migration is needed for a collection
     * @param {string} collection - Collection name
     * @returns {boolean}
     */
    needsMigration(collection) {
        const stored = this.getStoredVersions();
        const storedVersion = stored[collection] || 0;
        const currentVersion = this.currentVersions[collection] || 1;
        return storedVersion < currentVersion;
    }

    /**
     * Migrate data to current schema version
     * @param {string} collection - Collection name
     * @param {Object|Array} data - Data to migrate
     * @returns {Object|Array} Migrated data
     */
    migrateData(collection, data) {
        const stored = this.getStoredVersions();
        const storedVersion = stored[collection] || 0;
        const currentVersion = this.currentVersions[collection] || 1;
        const migrations = MIGRATIONS[collection] || {};

        if (storedVersion >= currentVersion) {
            return data; // Already up to date
        }

        logger.info(LogCategory.STORAGE, `[Schema] Migrating ${collection} from v${storedVersion} to v${currentVersion}`);

        let migratedData = data;

        // Apply migrations sequentially
        for (let v = storedVersion; v < currentVersion; v++) {
            const migration = migrations[v];
            if (migration) {
                if (Array.isArray(migratedData)) {
                    migratedData = migratedData.map(item => migration(item));
                } else {
                    migratedData = migration(migratedData);
                }
                logger.info(LogCategory.STORAGE, `[Schema] Applied migration v${v} -> v${v + 1}`);
            }
        }

        // Update stored version
        stored[collection] = currentVersion;
        this.saveVersions(stored);

        return migratedData;
    }

    /**
     * Get current version for a collection
     * @param {string} collection 
     * @returns {number}
     */
    getCurrentVersion(collection) {
        return this.currentVersions[collection] || 1;
    }

    /**
     * Mark collection as migrated
     * @param {string} collection 
     */
    markMigrated(collection) {
        const stored = this.getStoredVersions();
        stored[collection] = this.currentVersions[collection];
        this.saveVersions(stored);
    }

    /**
     * Get migration status
     * @returns {Object}
     */
    getMigrationStatus() {
        const stored = this.getStoredVersions();
        const status = {};

        for (const [collection, currentVersion] of Object.entries(this.currentVersions)) {
            const storedVersion = stored[collection] || 0;
            status[collection] = {
                current: currentVersion,
                stored: storedVersion,
                needsMigration: storedVersion < currentVersion
            };
        }

        return status;
    }

    /**
     * Run all pending migrations
     */
    runAllMigrations() {
        logger.info(LogCategory.STORAGE, '[Schema] Running all pending migrations...');
        const status = this.getMigrationStatus();
        
        for (const [collection, info] of Object.entries(status)) {
            if (info.needsMigration) {
                logger.info(LogCategory.STORAGE, `[Schema] ${collection} needs migration: v${info.stored} -> v${info.current}`);
                this.markMigrated(collection);
            }
        }

        logger.info(LogCategory.STORAGE, '[Schema] All collections updated');
    }
}

export const schemaVersionService = new SchemaVersionService();
export { SCHEMA_VERSIONS, MIGRATIONS };
export default SchemaVersionService;
