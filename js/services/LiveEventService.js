/**
 * LiveEventService - Real-time Flash Challenges
 * Generates temporary high-stakes objectives for players.
 */
import { eventBus } from '../engine/EventBus.js';
import { globalStateManager } from './GlobalStateManager.js';
import { economyService, CURRENCY } from './EconomyService.js';
import { notificationService } from './NotificationService.js';

class LiveEventService {
    constructor() {
        this.activeEvent = null;
        this.eventTimer = null;
    }

    init() {
        // Occasionally trigger a flash challenge (every 5-10 minutes)
        setInterval(() => {
            if (!this.activeEvent && Math.random() > 0.7) {
                this.generateFlashChallenge();
            }
        }, 60000); // Check every minute

        console.log('LiveEventService initialized');
    }

    generateFlashChallenge() {
        const games = ['snake', 'tetris', 'breakout', 'minesweeper'];
        const gameId = games[Math.floor(Math.random() * games.length)];
        
        const event = {
            id: `flash_${Date.now()}`,
            gameId,
            title: 'FLASH CHALLENGE!',
            description: `Score high in ${gameId}!`,
            target: 0,
            reward: { xp: 200, coins: 50 },
            duration: 300000, // 5 minutes
            startTime: Date.now(),
            expiresAt: Date.now() + 300000,
            completed: false
        };

        // Specific targets based on game
        if (gameId === 'snake') event.target = 100;
        if (gameId === 'tetris') event.target = 5000;
        if (gameId === 'breakout') event.target = 500;
        if (gameId === 'minesweeper') event.target = 1; // 1 game win

        this.activeEvent = event;
        
        notificationService.showToast(`🔥 FLASH CHALLENGE: ${event.description}`, 'challenge');
        eventBus.emit('liveEventStarted', event);

        // Auto-expire
        this.eventTimer = setTimeout(() => {
            if (this.activeEvent && !this.activeEvent.completed) {
                this.activeEvent = null;
                eventBus.emit('liveEventExpired');
            }
        }, event.duration);
    }

    checkProgress(gameId, score) {
        if (!this.activeEvent || this.activeEvent.gameId !== gameId) return;

        if (score >= this.activeEvent.target && !this.activeEvent.completed) {
            this.completeEvent();
        }
    }

    completeEvent() {
        const event = this.activeEvent;
        event.completed = true;

        globalStateManager.addXP(event.reward.xp);
        economyService.addCurrency(CURRENCY.COINS, event.reward.coins, 'Flash Challenge Complete');

        notificationService.success(`Challenge Complete! +${event.reward.coins} Coins`);
        
        eventBus.emit('liveEventCompleted', event);
        this.activeEvent = null;
        if (this.eventTimer) clearTimeout(this.eventTimer);
    }

    getActiveEvent() {
        return this.activeEvent;
    }
}

export const liveEventService = new LiveEventService();
export default LiveEventService;
