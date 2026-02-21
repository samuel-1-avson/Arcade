/**
 * EconomyService - Hub-Wide Currency and Cosmetics System
 * Manages coins, shop, and cosmetic unlocks
 */
import { eventBus } from '../engine/EventBus.js';
import { globalStateManager } from './GlobalStateManager.js';
import { notificationService } from './NotificationService.js';
import { logger, LogCategory } from '../utils/logger.js';

// Currency types
export const CURRENCY = {
    COINS: 'coins',
    GEMS: 'gems'
};

// Cosmetic categories
export const COSMETIC_TYPES = {
    TITLE: 'title',
    BADGE: 'badge',
    CARD_SKIN: 'card_skin',
    AVATAR_FRAME: 'avatar_frame'
};

// Shop items
export const SHOP_ITEMS = {
    // Titles
    title_arcade_king: {
        id: 'title_arcade_king',
        name: 'Arcade King',
        type: COSMETIC_TYPES.TITLE,
        description: 'A title for the true royalty of the arcade',
        price: 500,
        currency: CURRENCY.COINS,
        preview: '👑 Arcade King',
        color: '#ffd700'
    },
    title_pixel_warrior: {
        id: 'title_pixel_warrior',
        name: 'Pixel Warrior',
        type: COSMETIC_TYPES.TITLE,
        description: 'Battle-hardened and pixel-perfect',
        price: 300,
        currency: CURRENCY.COINS,
        preview: '⚔️ Pixel Warrior',
        color: '#ff4444'
    },
    title_speed_demon: {
        id: 'title_speed_demon',
        name: 'Speed Demon',
        type: COSMETIC_TYPES.TITLE,
        description: 'For those who play at lightning speed',
        price: 400,
        currency: CURRENCY.COINS,
        preview: '⚡ Speed Demon',
        color: '#ffff00'
    },
    title_night_owl: {
        id: 'title_night_owl',
        name: 'Night Owl',
        type: COSMETIC_TYPES.TITLE,
        description: 'The late-night gaming specialist',
        price: 250,
        currency: CURRENCY.COINS,
        preview: '🦉 Night Owl',
        color: '#6644ff'
    },
    title_retro_master: {
        id: 'title_retro_master',
        name: 'Retro Master',
        type: COSMETIC_TYPES.TITLE,
        description: 'A true connoisseur of classic games',
        price: 350,
        currency: CURRENCY.COINS,
        preview: '🕹️ Retro Master',
        color: '#00ff88'
    },

    // Badges
    badge_early_bird: {
        id: 'badge_early_bird',
        name: 'Early Bird',
        type: COSMETIC_TYPES.BADGE,
        description: 'First to join the arcade hub',
        price: 200,
        currency: CURRENCY.COINS,
        icon: '🌅'
    },
    badge_fire: {
        id: 'badge_fire',
        name: 'On Fire',
        type: COSMETIC_TYPES.BADGE,
        description: 'Hot streak indicator',
        price: 250,
        currency: CURRENCY.COINS,
        icon: '🔥'
    },
    badge_diamond: {
        id: 'badge_diamond',
        name: 'Diamond',
        type: COSMETIC_TYPES.BADGE,
        description: 'Premium player badge',
        price: 1000,
        currency: CURRENCY.COINS,
        icon: '💎'
    },
    badge_star: {
        id: 'badge_star',
        name: 'All-Star',
        type: COSMETIC_TYPES.BADGE,
        description: 'Multi-game excellence',
        price: 500,
        currency: CURRENCY.COINS,
        icon: '⭐'
    },
    badge_crown: {
        id: 'badge_crown',
        name: 'Royal',
        type: COSMETIC_TYPES.BADGE,
        description: 'Tournament champion badge',
        price: 750,
        currency: CURRENCY.COINS,
        icon: '👑'
    },

    // Card Skins
    skin_neon: {
        id: 'skin_neon',
        name: 'Neon Glow',
        type: COSMETIC_TYPES.CARD_SKIN,
        description: 'Vibrant neon glow effect for game cards',
        price: 300,
        currency: CURRENCY.COINS,
        cssClass: 'card-skin-neon'
    },
    skin_retro: {
        id: 'skin_retro',
        name: 'Retro Pixel',
        type: COSMETIC_TYPES.CARD_SKIN,
        description: 'Classic pixelated border style',
        price: 350,
        currency: CURRENCY.COINS,
        cssClass: 'card-skin-retro'
    },
    skin_gold: {
        id: 'skin_gold',
        name: 'Golden Luxury',
        type: COSMETIC_TYPES.CARD_SKIN,
        description: 'Premium gold-trimmed cards',
        price: 800,
        currency: CURRENCY.COINS,
        cssClass: 'card-skin-gold'
    },
    skin_holographic: {
        id: 'skin_holographic',
        name: 'Holographic',
        type: COSMETIC_TYPES.CARD_SKIN,
        description: 'Shimmering holographic effect',
        price: 600,
        currency: CURRENCY.COINS,
        cssClass: 'card-skin-holo'
    },

    // Avatar Frames
    frame_basic: {
        id: 'frame_basic',
        name: 'Basic Frame',
        type: COSMETIC_TYPES.AVATAR_FRAME,
        description: 'Simple colored border',
        price: 100,
        currency: CURRENCY.COINS,
        cssClass: 'avatar-frame-basic'
    },
    frame_animated: {
        id: 'frame_animated',
        name: 'Animated Pulse',
        type: COSMETIC_TYPES.AVATAR_FRAME,
        description: 'Pulsing animated border',
        price: 400,
        currency: CURRENCY.COINS,
        cssClass: 'avatar-frame-animated'
    },
    frame_champion: {
        id: 'frame_champion',
        name: 'Champion Frame',
        type: COSMETIC_TYPES.AVATAR_FRAME,
        description: 'Golden laurel wreath frame',
        price: 1000,
        currency: CURRENCY.COINS,
        cssClass: 'avatar-frame-champion'
    }
};

// Coin rewards for activities
const COIN_REWARDS = {
    gameComplete: 5,
    achievementUnlock: 10,
    dailyChallengeComplete: 25,
    weeklyChallengeComplete: 100,
    tournamentWin: 100,
    tournamentParticipate: 25,
    dailyLogin: 10
};

class EconomyService {
    constructor() {
        this.wallet = this._loadWallet();
        this.ownedItems = this._loadOwnedItems();
        this.equipped = this._loadEquipped();
        this._setupEventListeners();
    }

    /**
     * Initialize the economy service
     */
    init() {
        this._checkDailyLogin();
        logger.info(LogCategory.ECONOMY, 'EconomyService initialized');
    }

    // ============ WALLET MANAGEMENT ============

    /**
     * Get current balance
     * @param {string} currency
     * @returns {number}
     */
    getBalance(currency = CURRENCY.COINS) {
        return this.wallet[currency] || 0;
    }

    /**
     * Get all balances
     * @returns {Object}
     */
    getWallet() {
        return { ...this.wallet };
    }

    /**
     * Add currency
     * @param {string} currency
     * @param {number} amount
     * @param {string} source - Reason for earning
     */
    addCurrency(currency, amount, source = '') {
        if (amount <= 0) return;

        this.wallet[currency] = (this.wallet[currency] || 0) + amount;
        this._saveWallet();

        eventBus.emit('currencyEarned', { currency, amount, source, newBalance: this.wallet[currency] });

        if (amount >= 50) {
            notificationService.success(`+${amount} ${currency === CURRENCY.COINS ? '🪙' : '💎'}`);
        }
    }

    /**
     * Spend currency
     * @param {string} currency
     * @param {number} amount
     * @returns {boolean} Success
     */
    spendCurrency(currency, amount) {
        if (amount <= 0) return false;
        if (this.wallet[currency] < amount) return false;

        this.wallet[currency] -= amount;
        this._saveWallet();

        eventBus.emit('currencySpent', { currency, amount, newBalance: this.wallet[currency] });
        return true;
    }

    /**
     * Check if can afford
     * @param {string} currency
     * @param {number} amount
     * @returns {boolean}
     */
    canAfford(currency, amount) {
        return this.wallet[currency] >= amount;
    }

    // ============ SHOP ============

    /**
     * Get all shop items
     * @param {string} category - Optional filter
     * @returns {Object[]}
     */
    getShopItems(category = null) {
        let items = Object.values(SHOP_ITEMS);

        if (category) {
            items = items.filter(item => item.type === category);
        }

        return items.map(item => ({
            ...item,
            owned: this.ownedItems.includes(item.id),
            canAfford: this.canAfford(item.currency, item.price),
            equipped: this.isEquipped(item.id)
        }));
    }

    /**
     * Purchase an item
     * @param {string} itemId
     * @returns {boolean} Success
     */
    purchaseItem(itemId) {
        const item = SHOP_ITEMS[itemId];
        if (!item) {
            notificationService.error('Item not found');
            return false;
        }

        if (this.ownedItems.includes(itemId)) {
            notificationService.error('Already owned');
            return false;
        }

        if (!this.canAfford(item.currency, item.price)) {
            notificationService.error('Not enough coins');
            return false;
        }

        this.spendCurrency(item.currency, item.price);
        this.ownedItems.push(itemId);
        this._saveOwnedItems();

        notificationService.showAchievement({
            name: 'Item Purchased!',
            desc: item.name,
            icon: '🛒',
            xp: 0
        });

        eventBus.emit('itemPurchased', item);
        return true;
    }

    /**
     * Check if item is owned
     * @param {string} itemId
     * @returns {boolean}
     */
    ownsItem(itemId) {
        return this.ownedItems.includes(itemId);
    }

    // ============ EQUIPMENT ============

    /**
     * Equip an item
     * @param {string} itemId
     * @returns {boolean} Success
     */
    equipItem(itemId) {
        const item = SHOP_ITEMS[itemId];
        if (!item || !this.ownsItem(itemId)) {
            return false;
        }

        this.equipped[item.type] = itemId;
        this._saveEquipped();

        notificationService.success(`Equipped ${item.name}`);
        eventBus.emit('itemEquipped', item);

        return true;
    }

    /**
     * Unequip an item type
     * @param {string} type
     */
    unequipType(type) {
        delete this.equipped[type];
        this._saveEquipped();
    }

    /**
     * Get equipped item for type
     * @param {string} type
     * @returns {Object|null}
     */
    getEquipped(type) {
        const itemId = this.equipped[type];
        if (!itemId) return null;
        return SHOP_ITEMS[itemId] || null;
    }

    /**
     * Get all equipped items
     * @returns {Object}
     */
    getAllEquipped() {
        const equipped = {};
        for (const [type, itemId] of Object.entries(this.equipped)) {
            equipped[type] = SHOP_ITEMS[itemId] || null;
        }
        return equipped;
    }

    /**
     * Check if item is equipped
     * @param {string} itemId
     * @returns {boolean}
     */
    isEquipped(itemId) {
        return Object.values(this.equipped).includes(itemId);
    }

    /**
     * Get equipped title
     * @returns {Object|null}
     */
    getEquippedTitle() {
        return this.getEquipped(COSMETIC_TYPES.TITLE);
    }

    /**
     * Get equipped badge
     * @returns {Object|null}
     */
    getEquippedBadge() {
        return this.getEquipped(COSMETIC_TYPES.BADGE);
    }

    /**
     * Get equipped card skin
     * @returns {Object|null}
     */
    getEquippedCardSkin() {
        return this.getEquipped(COSMETIC_TYPES.CARD_SKIN);
    }

    // ============ REWARDS ============

    /**
     * Award coins for activity
     * @param {string} activity - Key from COIN_REWARDS
     */
    awardCoins(activity) {
        const amount = COIN_REWARDS[activity];
        if (amount) {
            this.addCurrency(CURRENCY.COINS, amount, activity);
        }
    }

    /**
     * Check and award daily login bonus
     * @private
     */
    _checkDailyLogin() {
        const today = new Date().toDateString();
        const lastLogin = localStorage.getItem('arcadeHub_lastLogin');

        if (lastLogin !== today) {
            localStorage.setItem('arcadeHub_lastLogin', today);
            this.awardCoins('dailyLogin');
        }
    }

    // ============ EVENT HANDLERS ============

    /**
     * Set up event listeners for automatic rewards
     * @private
     */
    _setupEventListeners() {
        // Game completion
        eventBus.on('globalStateChange', ({ type }) => {
            if (type === 'session') {
                this.awardCoins('gameComplete');
            } else if (type === 'achievement') {
                this.awardCoins('achievementUnlock');
            }
        });

        // Challenge completion
        eventBus.on('dailyChallengeComplete', () => {
            this.awardCoins('dailyChallengeComplete');
        });

        eventBus.on('weeklyChallengeComplete', () => {
            this.awardCoins('weeklyChallengeComplete');
        });

        eventBus.on('weeklyChallengeComplete', () => {
            this.awardCoins('weeklyChallengeComplete');
        });
    }

    // ============ PERSISTENCE ============

    /**
     * Load wallet from storage
     * @private
     */
    _loadWallet() {
        try {
            const saved = localStorage.getItem('arcadeHub_wallet');
            return saved ? JSON.parse(saved) : { coins: 0, gems: 0 };
        } catch (e) {
            logger.warn(LogCategory.ECONOMY, 'Failed to load wallet:', e);
            return { coins: 0, gems: 0 };
        }
    }

    /**
     * Save wallet to storage
     * @private
     */
    _saveWallet() {
        try {
            localStorage.setItem('arcadeHub_wallet', JSON.stringify(this.wallet));
        } catch (e) {
            logger.warn(LogCategory.ECONOMY, 'Failed to save wallet:', e);
        }
    }

    /**
     * Load owned items
     * @private
     */
    _loadOwnedItems() {
        try {
            const saved = localStorage.getItem('arcadeHub_ownedItems');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            logger.warn(LogCategory.ECONOMY, 'Failed to load owned items:', e);
            return [];
        }
    }

    /**
     * Save owned items
     * @private
     */
    _saveOwnedItems() {
        try {
            localStorage.setItem('arcadeHub_ownedItems', JSON.stringify(this.ownedItems));
        } catch (e) {
            logger.warn(LogCategory.ECONOMY, 'Failed to save owned items:', e);
        }
    }

    /**
     * Load equipped items
     * @private
     */
    _loadEquipped() {
        try {
            const saved = localStorage.getItem('arcadeHub_equipped');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            logger.warn(LogCategory.ECONOMY, 'Failed to load equipped items:', e);
            return {};
        }
    }

    /**
     * Save equipped items
     * @private
     */
    _saveEquipped() {
        try {
            localStorage.setItem('arcadeHub_equipped', JSON.stringify(this.equipped));
        } catch (e) {
            logger.warn(LogCategory.ECONOMY, 'Failed to save equipped items:', e);
        }
    }

    /**
     * Clear all data (for testing)
     */
    clearAll() {
        this.wallet = { coins: 0, gems: 0 };
        this.ownedItems = [];
        this.equipped = {};
        localStorage.removeItem('arcadeHub_wallet');
        localStorage.removeItem('arcadeHub_ownedItems');
        localStorage.removeItem('arcadeHub_equipped');
    }

    /**
     * Add test coins (for development)
     * @param {number} amount
     */
    addTestCoins(amount = 1000) {
        this.addCurrency(CURRENCY.COINS, amount, 'test');
    }
}

// Singleton instance
export const economyService = new EconomyService();
export default EconomyService;
