/**
 * NotificationService - Unified Notification System for Arcade Hub
 * Toast notifications for achievements, level-ups, challenges, and general messages
 * Includes sound effects support
 */
import { eventBus } from '../engine/EventBus.js';
import { globalStateManager } from './GlobalStateManager.js';

// Notification types and their styles
const NOTIFICATION_TYPES = {
    achievement: {
        icon: '🏆',
        color: '#ffd700',
        sound: 'achievement',
        duration: 4000
    },
    levelUp: {
        icon: '⭐',
        color: '#00ffff',
        sound: 'levelUp',
        duration: 5000
    },
    challenge: {
        icon: '🎯',
        color: '#ff00ff',
        sound: 'challenge',
        duration: 4000
    },
    streak: {
        icon: '🔥',
        color: '#ff6600',
        sound: 'streak',
        duration: 3000
    },
    error: {
        icon: '⚠️',
        color: '#ff4444',
        sound: 'error',
        duration: 3000
    },
    success: {
        icon: '✅',
        color: '#00ff88',
        sound: 'success',
        duration: 2500
    },
    info: {
        icon: 'ℹ️',
        color: '#00aaff',
        sound: null,
        duration: 2500
    }
};

// Sound effects using Web Audio API
const SOUNDS = {
    achievement: {
        notes: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
        durations: [0.1, 0.1, 0.1, 0.3],
        type: 'sine'
    },
    levelUp: {
        notes: [261.63, 329.63, 392.00, 523.25, 659.25, 783.99],
        durations: [0.08, 0.08, 0.08, 0.1, 0.1, 0.4],
        type: 'triangle'
    },
    challenge: {
        notes: [440, 554.37, 659.25],
        durations: [0.1, 0.1, 0.3],
        type: 'sine'
    },
    streak: {
        notes: [392, 523.25, 659.25],
        durations: [0.08, 0.08, 0.2],
        type: 'triangle'
    },
    success: {
        notes: [523.25, 659.25],
        durations: [0.1, 0.2],
        type: 'sine'
    },
    error: {
        notes: [200, 150],
        durations: [0.1, 0.2],
        type: 'square'
    }
};

class NotificationService {
    constructor() {
        this.queue = [];
        this.isShowing = false;
        this.container = null;
        this.audioContext = null;
        
        // Create container when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._createContainer());
        } else {
            this._createContainer();
        }

        // Set up event listeners
        this._setupEventListeners();
    }

    /**
     * Initialize the notification service
     */
    init() {
        // Lazy init audio context (needs user interaction)
        this._initAudio();
        console.log('NotificationService initialized');
    }

    // ============ PUBLIC METHODS ============

    /**
     * Show an achievement notification
     * @param {Object} achievement - { name, desc, icon, xp }
     */
    showAchievement(achievement) {
        this._queueNotification({
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: achievement.name,
            subtitle: achievement.desc,
            icon: achievement.icon || NOTIFICATION_TYPES.achievement.icon,
            xp: achievement.xp
        });
    }

    /**
     * Show a level up notification
     * @param {number} level - New level
     * @param {string} title - New title if applicable
     */
    showLevelUp(level, title = null) {
        let message = `Level ${level}`;
        let subtitle = 'Keep playing to level up!';

        if (title) {
            subtitle = `New Title: ${title}`;
        }

        this._queueNotification({
            type: 'levelUp',
            title: 'Level Up!',
            message,
            subtitle,
            icon: '⭐'
        });
    }

    /**
     * Show a challenge complete notification
     * @param {Object} challenge - { name, reward }
     */
    showChallengeComplete(challenge) {
        this._queueNotification({
            type: 'challenge',
            title: 'Challenge Complete!',
            message: challenge.name,
            subtitle: `+${challenge.reward} XP`,
            icon: '🎯'
        });
    }

    /**
     * Show a streak notification
     * @param {number} streak - Current streak count
     */
    showStreak(streak) {
        this._queueNotification({
            type: 'streak',
            title: 'Daily Streak!',
            message: `${streak} Day${streak > 1 ? 's' : ''} in a row!`,
            subtitle: 'Keep it up!',
            icon: '🔥'
        });
    }

    /**
     * Show a generic toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type (success, error, info)
     * @param {number} duration - Optional custom duration
     */
    showToast(message, type = 'info', duration = null) {
        this._queueNotification({
            type,
            title: null,
            message,
            subtitle: null,
            icon: NOTIFICATION_TYPES[type]?.icon || 'ℹ️',
            customDuration: duration
        });
    }

    /**
     * Show success toast
     * @param {string} message
     */
    success(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show error toast
     * @param {string} message
     */
    error(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show info toast
     * @param {string} message
     */
    info(message) {
        this.showToast(message, 'info');
    }

    // ============ PRIVATE METHODS ============

    /**
     * Create the notification container
     * @private
     */
    _createContainer() {
        // Check if already exists
        if (document.getElementById('notification-container')) {
            this.container = document.getElementById('notification-container');
            return;
        }

        // Create container
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        document.body.appendChild(this.container);

        // Add styles
        this._injectStyles();
    }

    /**
     * Inject notification styles
     * @private
     */
    _injectStyles() {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            #notification-container {
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
                max-width: 380px;
            }

            .notification-toast {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                padding: 16px 20px;
                background: linear-gradient(135deg, rgba(20, 20, 35, 0.95), rgba(30, 30, 50, 0.95));
                backdrop-filter: blur(10px);
                border-radius: 12px;
                border: 1px solid var(--notification-color, #00ffff);
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.4),
                    0 0 20px var(--notification-glow, rgba(0, 255, 255, 0.3));
                pointer-events: auto;
                transform: translateX(120%);
                opacity: 0;
                animation: notificationSlideIn 0.4s ease forwards;
            }

            .notification-toast.hiding {
                animation: notificationSlideOut 0.3s ease forwards;
            }

            @keyframes notificationSlideIn {
                from {
                    transform: translateX(120%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes notificationSlideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(120%);
                    opacity: 0;
                }
            }

            .notification-icon {
                font-size: 2rem;
                line-height: 1;
                flex-shrink: 0;
                animation: iconPulse 0.5s ease;
            }

            @keyframes iconPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
            }

            .notification-content {
                flex: 1;
                min-width: 0;
            }

            .notification-title {
                font-family: 'Orbitron', sans-serif;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--notification-color, #00ffff);
                margin-bottom: 4px;
            }

            .notification-message {
                font-family: 'Inter', sans-serif;
                font-size: 1rem;
                font-weight: 600;
                color: #fff;
                margin-bottom: 4px;
            }

            .notification-subtitle {
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.7);
            }

            .notification-xp {
                position: absolute;
                top: 12px;
                right: 16px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.75rem;
                font-weight: bold;
                color: #ffd700;
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: var(--notification-color, #00ffff);
                border-radius: 0 0 12px 12px;
                animation: notificationProgress var(--notification-duration, 4s) linear forwards;
            }

            @keyframes notificationProgress {
                from { width: 100%; }
                to { width: 0%; }
            }

            /* Responsive */
            @media (max-width: 480px) {
                #notification-container {
                    left: 10px;
                    right: 10px;
                    top: 60px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Queue a notification
     * @private
     */
    _queueNotification(notification) {
        this.queue.push(notification);
        this._processQueue();
    }

    /**
     * Process the notification queue
     * @private
     */
    _processQueue() {
        if (this.isShowing || this.queue.length === 0) return;

        this.isShowing = true;
        const notification = this.queue.shift();
        this._showNotification(notification);
    }

    /**
     * Show a notification
     * @private
     */
    _showNotification(notification) {
        const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
        const duration = notification.customDuration || typeConfig.duration;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.style.setProperty('--notification-color', typeConfig.color);
        toast.style.setProperty('--notification-glow', `${typeConfig.color}40`);
        toast.style.setProperty('--notification-duration', `${duration}ms`);

        toast.innerHTML = `
            <div class="notification-icon">${notification.icon}</div>
            <div class="notification-content">
                ${notification.title ? `<div class="notification-title">${notification.title}</div>` : ''}
                <div class="notification-message">${notification.message}</div>
                ${notification.subtitle ? `<div class="notification-subtitle">${notification.subtitle}</div>` : ''}
            </div>
            ${notification.xp ? `<div class="notification-xp">+${notification.xp} XP</div>` : ''}
            <div class="notification-progress"></div>
        `;

        // Add to container
        this.container.appendChild(toast);

        // Play sound
        if (typeConfig.sound && this._canPlaySound()) {
            this._playSound(typeConfig.sound);
        }

        // Remove after duration
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => {
                toast.remove();
                this.isShowing = false;
                this._processQueue();
            }, 300);
        }, duration);
    }

    /**
     * Initialize audio context
     * @private
     */
    _initAudio() {
        if (this.audioContext) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    /**
     * Check if we can play sound
     * @private
     */
    _canPlaySound() {
        const prefs = globalStateManager.getProfile().preferences;
        return prefs.soundEnabled && this.audioContext;
    }

    /**
     * Play a notification sound
     * @private
     */
    _playSound(soundName) {
        if (!this.audioContext) return;

        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const sound = SOUNDS[soundName];
        if (!sound) return;

        try {
            let time = this.audioContext.currentTime;

            for (let i = 0; i < sound.notes.length; i++) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.type = sound.type;
                oscillator.frequency.setValueAtTime(sound.notes[i], time);

                // Envelope
                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(0.2, time + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, time + sound.durations[i]);

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.start(time);
                oscillator.stop(time + sound.durations[i]);

                time += sound.durations[i];
            }
        } catch (e) {
            console.warn('Failed to play notification sound:', e);
        }
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for global events
        eventBus.on('globalLevelUp', ({ level }) => {
            const profile = globalStateManager.getProfile();
            this.showLevelUp(level, profile.title);
        });

        eventBus.on('streakContinued', ({ streak }) => {
            this.showStreak(streak);
        });

        eventBus.on('metaAchievementUnlock', (achievement) => {
            this.showAchievement({
                ...achievement,
                name: `🌟 ${achievement.name}`,
                desc: `Meta: ${achievement.desc}`
            });
        });

        eventBus.on('challengeComplete', (challenge) => {
            this.showChallengeComplete(challenge);
        });

        // Initialize audio on first user interaction
        document.addEventListener('click', () => this._initAudio(), { once: true });
        document.addEventListener('keydown', () => this._initAudio(), { once: true });
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.queue = [];
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.isShowing = false;
    }
}

// Singleton instance
export const notificationService = new NotificationService();
export default NotificationService;
