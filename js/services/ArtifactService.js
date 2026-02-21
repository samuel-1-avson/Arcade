/**
 * ArtifactService - Cross-Game Buff System
 * Manages unique permanent items that grant gameplay bonuses.
 */
import { eventBus } from '../engine/EventBus.js';
import { globalStateManager } from './GlobalStateManager.js';
import { notificationService } from './NotificationService.js';
import { logger, LogCategory } from '../utils/logger.js';

export const ARTIFACT_LIBRARY = {
    'gilded_scale': {
        id: 'gilded_scale',
        name: 'Gilded Scale',
        description: 'Increases score multiplier by 5% in all games.',
        icon: '🐍',
        rarity: 'rare',
        buff: { scoreMult: 1.05 }
    },
    'neon_prism': {
        id: 'neon_prism',
        name: 'Neon Prism',
        description: 'Grants 10% more XP for every action.',
        icon: '💎',
        rarity: 'epic',
        buff: { xpMult: 1.10 }
    },
    'clockwork_heart': {
        id: 'clockwork_heart',
        name: 'Clockwork Heart',
        description: 'Slows down game speed slightly in high-difficulty modes.',
        icon: '⚙️',
        rarity: 'legendary',
        buff: { speedAdjustment: 0.95 }
    },
    'coin_magnet': {
        id: 'coin_magnet',
        name: 'Coin Magnet',
        description: 'Earn 10% more coins from all sources.',
        icon: '🧲',
        rarity: 'rare',
        buff: { coinMult: 1.10 }
    }
};

class ArtifactService {
    constructor() {
        this.artifacts = ARTIFACT_LIBRARY;
    }

    init() {
        // Listen for achievement unlocks to potentially trigger artifact discovery
        eventBus.on('globalStateChange', ({ type, data }) => {
            if (type === 'achievement') {
                this._checkArtifactUnlockConditions(data);
            }
        });
        
        logger.info(LogCategory.SERVICE, 'ArtifactService initialized');
    }

    getArtifact(id) {
        return this.artifacts[id];
    }

    getOwnedArtifacts() {
        return globalStateManager.getArtifacts()
            .map(id => this.artifacts[id])
            .filter(Boolean);
    }

    _checkArtifactUnlockConditions({ gameId, achievementId }) {
        // Logic for unlocking artifacts based on specific achievements
        if (gameId === 'snake' && achievementId === 'snake_master') {
            this.unlock('gilded_scale');
        }
    }

    unlock(artifactId) {
        if (globalStateManager.ownsArtifact(artifactId)) return;

        const artifact = this.artifacts[artifactId];
        if (!artifact) return;

        globalStateManager.unlockArtifact(artifactId);
        
        notificationService.showAchievement({
            name: 'Artifact Discovered!',
            desc: artifact.name,
            icon: artifact.icon,
            xp: 500
        });

        eventBus.emit('artifactUnlocked', artifact);
    }

    /**
     * Get active buffs for a specific game
     * @returns {Object}
     */
    getActiveBuffs() {
        const owned = this.getOwnedArtifacts();
        const buffs = {
            scoreMult: 1.0,
            xpMult: 1.0,
            coinMult: 1.0,
            speedAdjustment: 1.0
        };

        owned.forEach(art => {
            if (art.buff.scoreMult) buffs.scoreMult *= art.buff.scoreMult;
            if (art.buff.xpMult) buffs.xpMult *= art.buff.xpMult;
            if (art.buff.coinMult) buffs.coinMult *= art.buff.coinMult;
            if (art.buff.speedAdjustment) buffs.speedAdjustment *= art.buff.speedAdjustment;
        });

        return buffs;
    }
}

export const artifactService = new ArtifactService();
export default ArtifactService;
