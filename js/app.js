/**
 * Arcade Gaming Hub - Main Application
 * Handles hub UI, game cards, filters, and user stats
 */
import { storageManager } from './engine/StorageManager.js';
import { eventBus, GameEvents } from './engine/EventBus.js';
import { firebaseService } from './engine/FirebaseService.js';

// Import AAA Services
import { globalStateManager, AVATAR_OPTIONS, AVATAR_ICONS } from './services/GlobalStateManager.js';
import { notificationService } from './services/NotificationService.js';
import { achievementService } from './services/AchievementService.js';
import { dailyChallengeService } from './services/DailyChallengeService.js';
import { leaderboardService } from './services/LeaderboardService.js';
import { tournamentService, TOURNAMENT_TYPES } from './services/TournamentService.js';
import { economyService, SHOP_ITEMS } from './services/EconomyService.js';
import { audioService } from './services/AudioService.js';
import { backgroundService } from './services/BackgroundService.js';
import { partyService } from './services/PartyService.js';
import { gameLoaderService } from './services/GameLoaderService.js';

// Import Navigation Enhancements
import { commandPaletteService } from './services/CommandPalette.js';
import { navigationService } from './services/NavigationService.js';

// Import Backend Infrastructure
import { userAccountService } from './services/UserAccountService.js';
import { syncEngine } from './engine/SyncEngine.js';
import { streamService } from './services/StreamService.js';
import { presenceService } from './services/PresenceService.js';
import { analyticsService } from './services/AnalyticsService.js';

// Game catalog
// Minimal SVG Icons for games
const GAME_ICONS = {
    snake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c0-4 3-7 7-7s7 3 7 7-3 7-7 7"/><path d="M9 9.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" fill="currentColor"/><path d="M18 12l3-3m0 6l-3-3"/></svg>',
    '2048': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    breakout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><line x1="12" y1="4" x2="12" y2="2"/></svg>',
    minesweeper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>',
    tetris: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="10" y="4" width="6" height="6" rx="1"/><rect x="10" y="10" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/></svg>',
    pacman: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><circle cx="14" cy="10" r="1.5" fill="currentColor"/></svg>',
    asteroids: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>',
    'tower-defense': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><rect x="10" y="10" width="4" height="3"/></svg>',
    rhythm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    roguelike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2L22 9.5 14.5 17 7 9.5 14.5 2z"/><path d="M9.5 7L2 14.5 9.5 22 17 14.5"/></svg>'
};

const GAMES = [
    {
        id: 'snake',
        title: 'Snake',
        description: 'Eat food, grow longer, don\'t hit yourself!',
        difficulty: 'easy',
        path: 'games/snake/',
        icon: '🐍',
        rating: 5,
        hudMode: 'GAME_MINIMAL'
    },
    {
        id: '2048',
        title: '2048',
        description: 'Slide tiles and merge them to reach 2048!',
        difficulty: 'easy',
        path: 'games/2048/',
        icon: '🔢',
        rating: 5
    },
    {
        id: 'breakout',
        title: 'Breakout',
        description: 'Break all the bricks with the ball!',
        difficulty: 'easy',
        path: 'games/breakout/',
        icon: '🎯',
        rating: 5
    },
    {
        id: 'minesweeper',
        title: 'Minesweeper',
        description: 'Find all the mines without exploding!',
        difficulty: 'easy',
        path: 'games/minesweeper/',
        icon: '💣',
        rating: 5
    },
    {
        id: 'tetris',
        title: 'Tetris',
        description: 'Stack blocks and clear lines!',
        difficulty: 'medium',
        path: 'games/tetris/',
        icon: '🧱',
        rating: 5
    },
    {
        id: 'pacman',
        title: 'Pac-Man',
        description: 'Eat dots and avoid ghosts!',
        difficulty: 'medium',
        path: 'games/pacman/',
        icon: '👻',
        rating: 5
    },
    {
        id: 'asteroids',
        title: 'Asteroids',
        description: 'Shoot asteroids in deep space!',
        difficulty: 'medium',
        path: 'games/asteroids/',
        icon: '☄️',
        rating: 5
    },
    {
        id: 'tower-defense',
        title: 'Tower Defense',
        description: 'Build towers and stop the enemies!',
        difficulty: 'hard',
        path: 'games/tower-defense/',
        icon: '🏰',
        rating: 5
    },
    {
        id: 'rhythm',
        title: 'Rhythm',
        description: 'Hit notes to the beat!',
        difficulty: 'hard',
        path: 'games/rhythm/',
        icon: '🎵',
        rating: 5
    },
    {
        id: 'roguelike',
        title: 'Roguelike',
        description: 'Explore procedural dungeons!',
        difficulty: 'hard',
        path: 'games/roguelike/',
        icon: '⚔️',
        rating: 5
    }
];


class ArcadeHub {
    constructor() {
        this.games = GAMES;
        this.currentFilter = 'all';
        this.highScores = storageManager.getAllHighScores();

        this.init();
    }

    init() {
        this.renderGames();
        this.setupNavigation(); // New Navigation System
        this.setupFilters();
        this.updateStats();
        this.setupAuth();
        this.setupEventListeners();
        
        // Initialize AAA Services
        this.initServices();
        this.setupAchievementGallery();
        this.setupDailyChallenges();
        this.setupDashboard();
        this.setupProfileEditor();
        this.setupLeaderboards();
        this.setupLeaderboards();
        this.setupSettings();
        this.setupShop();
        this.setupTournaments();

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW Registered'))
                .catch(err => console.log('SW Failed', err));
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('hub-sidebar');

        // Main Navigation Logic
        const handleNavClick = (target) => {
            const section = target.dataset.section;
            const id = target.id;

            // Highlight Active
            navItems.forEach(n => n.classList.remove('active'));
            // Activate both desktop and mobile counterparts if possible
            if (section) {
                document.querySelectorAll(`[data-section="${section}"]`).forEach(n => n.classList.add('active'));
            } else {
                target.classList.add('active');
            }

            // Scroll to Section
            if (section) {
                if (section === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
                else {
                    const el = document.getElementById(`${section}-section`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
                    // Fallback for non-section grids
                    else if (document.querySelector(`.${section}-section`)) {
                        document.querySelector(`.${section}-section`).scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }

            // Handle Specific Buttons
            if (id === 'nav-leaderboard' || id === 'nav-achievements' || id === 'nav-shop' || id === 'nav-settings') {
                const modalId = id.replace('nav-', '') + (id.includes('gallery') ? '' : (id === 'nav-achievements' ? '-gallery' : '-modal'));
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.remove('hidden');
                    // Trigger specific loads if needed
                    if (id === 'nav-leaderboard') this.loadLeaderboard('global');
                    if (id === 'nav-achievements') this.renderAchievementGallery();
                }
            }
            
            // Mobile Specifics
            if (id === 'mobile-nav-shop') document.getElementById('shop-modal')?.classList.remove('hidden');
            if (id === 'mobile-play-btn') {
                // Scroll to games
                document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth' });
            }
        };

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget;
                handleNavClick(target);
            });
        });

        // Mobile Menu Toggle (Simple implementation for now)
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                // For now, toggle settings as a "menu" or show a sheet
                // Reusing settings modal for simplicity in this iteration
                document.getElementById('settings-modal')?.classList.remove('hidden');
            });
        }
    }

    async initServices() {
        // Initialize GlobalStateManager
        await globalStateManager.init();
        
        // Initialize Notification Service
        notificationService.init();
        
        // Initialize Achievement Service
        achievementService.init();
        
        // Initialize Daily Challenge Service
        dailyChallengeService.init();
        
        // Initialize Leaderboard Service
        leaderboardService.init();

        // Initialize Tournament Service
        tournamentService.init();

        // Initialize Economy Service
        economyService.init();

        // Initialize Audio Service
        audioService.init();

        // Initialize Background Service (AAA Visuals)
        backgroundService.init();

        // Initialize Party Service
        partyService.init();
        this.setupPartyUI();

        // Initialize Game Loader (SPA)
        gameLoaderService.init();
        window.gameLoaderService = gameLoaderService; // For command palette

        // Initialize Navigation Enhancements
        navigationService.init();
        commandPaletteService.init();

        // Initialize Backend Infrastructure
        syncEngine.init();
        await userAccountService.init();
        streamService.init();
        await presenceService.init();

        // Listen for sync status changes
        eventBus.on('syncStatusChanged', ({ status }) => {
            this.updateSyncIndicator(status);
        });

        // Listen for user sign in/out
        eventBus.on('userSignedIn', (user) => {
            console.log('User signed in:', user.displayName);
            presenceService.setOnline();
        });

        eventBus.on('userSignedOut', () => {
            console.log('User signed out');
        });

        // Bind Close Button for SPA
        document.getElementById('close-game-btn')?.addEventListener('click', () => {
            gameLoaderService.closeGame();
        });
        
        // Update stats from global state
        this.updateStatsFromGlobal();
        
        // Initialize Analytics Pipeline
        analyticsService.init();
        analyticsService.trackPageView('hub_home');

        console.log('AAA Services + Backend Infrastructure + Analytics initialized');
    }

    updateSyncIndicator(status) {
        // Update UI to show sync status (online/offline/syncing)
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.className = `sync-indicator sync-${status}`;
            indicator.title = `Sync: ${status}`;
        }
    }

    setupDashboard() {
        // Update dashboard on load
        this.updateDashboard();
        
        // Listen for state changes
        eventBus.on('globalStateChange', () => this.updateDashboard());
    }

    async updateDashboard() {
        const profile = globalStateManager.getProfile();
        const stats = globalStateManager.getStatistics();
        const levelProgress = globalStateManager.getLevelProgress();
        
        // Update profile card
        const avatarEl = document.getElementById('profile-avatar');
        const nameEl = document.getElementById('profile-name');
        const titleEl = document.getElementById('profile-title');
        const levelBadge = document.getElementById('level-badge');
        const xpText = document.getElementById('xp-text');
        const xpFill = document.getElementById('xp-fill');
        const gamesPlayed = document.getElementById('games-played');
        const achievementsCount = document.getElementById('achievements-count');
        const totalPlaytime = document.getElementById('total-playtime');
        const streakCount = document.getElementById('streak-count');
        
        if (avatarEl) {
            const iconSvg = AVATAR_ICONS[profile.avatar] || '';
            avatarEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>`;
        }
        if (nameEl) nameEl.textContent = profile.displayName;
        if (titleEl) {
            titleEl.textContent = profile.title;
            titleEl.style.color = profile.titleColor;
        }
        if (levelBadge) levelBadge.textContent = `Lv. ${profile.level}`;
        if (xpText) xpText.textContent = `${levelProgress.current} / ${levelProgress.needed} XP`;
        if (xpFill) xpFill.style.width = `${levelProgress.progress * 100}%`;
        if (gamesPlayed) gamesPlayed.textContent = stats.totalGamesPlayed.toLocaleString();
        if (achievementsCount) {
            const metaCount = achievementService.getUnlockedCount();
            achievementsCount.textContent = profile.totalAchievements + metaCount;
        }
        if (totalPlaytime) {
            const hours = Math.floor(stats.totalPlayTime / 3600);
            const minutes = Math.floor((stats.totalPlayTime % 3600) / 60);
            totalPlaytime.textContent = hours > 0 ? `${hours}h` : `${minutes}m`;
        }
        if (streakCount) streakCount.textContent = stats.currentStreak;
        
        // Update leaderboard preview
        await this.updateLeaderboardPreview();
        
        // Update best games
        this.updateBestGames();
    }

    async updateLeaderboardPreview() {
        const container = document.getElementById('leaderboard-preview');
        if (!container) return;
        
        const scores = await leaderboardService.getGlobalLeaderboard(3);
        
        if (scores.length === 0) {
            container.innerHTML = `<div class="leaderboard-empty">
                <svg class="leaderboard-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <span>No scores yet. Be the first!</span>
            </div>`;
            return;
        }
        
        const rankClasses = ['gold', 'silver', 'bronze'];
        container.innerHTML = scores.map((entry, i) => `
            <div class="leaderboard-item ${entry.isCurrentUser ? 'current-user' : ''}">
                <span class="leaderboard-rank ${rankClasses[i] || ''}">${entry.rank}</span>
                <span class="leaderboard-name">${entry.name}</span>
                <span class="leaderboard-score">${entry.score.toLocaleString()}</span>
            </div>
        `).join('');
    }

    updateBestGames() {
        const container = document.getElementById('best-games-list');
        if (!container) return;
        
        const stats = globalStateManager.getStatistics();
        const bestGames = [];
        
        for (const [gameId, gameStats] of Object.entries(stats.gameStats)) {
            if (gameStats.highScore > 0) {
                const game = this.games.find(g => g.id === gameId);
                if (game) {
                    bestGames.push({
                        ...game,
                        score: gameStats.highScore
                    });
                }
            }
        }
        
        // Sort by score and take top 3
        bestGames.sort((a, b) => b.score - a.score);
        const top3 = bestGames.slice(0, 3);
        
        if (top3.length === 0) {
            container.innerHTML = '<div class="best-games-empty">Play games to see your best scores!</div>';
            return;
        }
        
        container.innerHTML = top3.map(game => `
            <div class="best-game-item">
                <span class="best-game-icon">${GAME_ICONS[game.id] || ''}</span>
                <div class="best-game-info">
                    <div class="best-game-name">${game.title}</div>
                    <div class="best-game-score">${game.score.toLocaleString()} pts</div>
                </div>
            </div>
        `).join('');
    }

    setupProfileEditor() {
        const editBtn = document.getElementById('edit-profile-btn');
        const modal = document.getElementById('profile-modal');
        const saveBtn = document.getElementById('save-profile-btn');
        const cancelBtn = document.getElementById('cancel-profile-btn');
        const nameInput = document.getElementById('edit-name-input');
        const avatarGrid = document.getElementById('avatar-grid');
        
        let selectedAvatar = globalStateManager.getProfile().avatar;
        
        // Populate avatar grid
        if (avatarGrid) {
            avatarGrid.innerHTML = AVATAR_OPTIONS.map(avatar => {
                const iconPath = AVATAR_ICONS[avatar] || '';
                return `
                <div class="avatar-option ${avatar === selectedAvatar ? 'selected' : ''}" data-avatar="${avatar}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        ${iconPath}
                    </svg>
                </div>
            `}).join('');
            
            avatarGrid.addEventListener('click', (e) => {
                const option = e.target.closest('.avatar-option');
                if (option) {
                    document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    selectedAvatar = option.dataset.avatar;
                }
            });
        }
        
        // Open modal
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                const profile = globalStateManager.getProfile();
                if (nameInput) nameInput.value = profile.displayName;
                selectedAvatar = profile.avatar;
                
                // Update selected avatar
                document.querySelectorAll('.avatar-option').forEach(o => {
                    o.classList.toggle('selected', o.dataset.avatar === selectedAvatar);
                });
                
                modal?.classList.remove('hidden');
            });
        }
        
        // Save
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const newName = nameInput?.value.trim();
                if (newName) globalStateManager.setDisplayName(newName);
                if (selectedAvatar) globalStateManager.setAvatar(selectedAvatar);
                
                modal?.classList.add('hidden');
                this.updateDashboard();
                notificationService.success('Profile updated!');
            });
        }
        
        // Cancel
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => modal?.classList.add('hidden'));
        }
        
        // Close on backdrop
        modal?.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                modal.classList.add('hidden');
            }
        });
    }

    setupPartyUI() {
        // UI Elements
        const widget = document.getElementById('party-widget');
        const statusEl = document.getElementById('party-status');
        const contentEl = document.getElementById('party-content');
        const actionsEl = document.getElementById('party-actions');
        const membersEl = document.getElementById('party-members');
        const codeEl = document.getElementById('party-code');
        const createBtn = document.getElementById('create-party-btn');
        const joinTrigger = document.getElementById('join-party-btn-trigger');
        const leaveBtn = document.getElementById('leave-party-btn');
        const joinArea = document.getElementById('join-party-input-area');
        const joinInput = document.getElementById('join-party-input');
        const confirmJoin = document.getElementById('confirm-join-party');
        const cancelJoin = document.getElementById('cancel-join-party');
        const copyBtn = document.getElementById('copy-party-code');

        if (!widget) return;

        // --- Render Function ---
        const render = () => {
            const partyId = partyService.partyId;
            const members = partyService.members;
            const isLeader = partyService.isLeader;
            
            if (partyId) {
                // In Party
                statusEl.textContent = isLeader ? 'Leader' : 'Member';
                statusEl.style.color = '#00ffaa';
                
                contentEl.classList.remove('hidden');
                actionsEl.classList.add('hidden');
                joinArea.classList.add('hidden');
                
                codeEl.textContent = partyId;
                
                membersEl.innerHTML = members.map(m => `
                    <div class="party-member">
                        <div class="member-avatar">${m.avatar}</div>
                        <span>${m.name}</span>
                        ${m.isLeader ? '<span class="member-leader-icon">👑</span>' : ''}
                    </div>
                `).join('');
            } else {
                // Solo
                statusEl.textContent = 'Solo';
                statusEl.style.color = 'var(--color-text-muted)';
                
                contentEl.classList.add('hidden');
                actionsEl.classList.remove('hidden');
            }
        };

        // --- Event Listeners ---
        
        createBtn?.addEventListener('click', () => {
            partyService.createParty();
            render();
            audioService.playSFX('success');
        });

        joinTrigger?.addEventListener('click', () => {
            actionsEl.classList.add('hidden');
            joinArea.classList.remove('hidden');
        });

        cancelJoin?.addEventListener('click', () => {
            joinArea.classList.add('hidden');
            actionsEl.classList.remove('hidden');
        });

        confirmJoin?.addEventListener('click', () => {
            const code = joinInput.value.trim().toUpperCase();
            if (code.length === 6) {
                partyService.joinParty(code);
                joinInput.value = '';
                joinArea.classList.add('hidden');
                actionsEl.classList.remove('hidden');
            } else {
                notificationService.error('Invalid Code');
                audioService.playSFX('error');
            }
        });

        leaveBtn?.addEventListener('click', () => {
            partyService.leaveParty();
            render();
            audioService.playSFX('notification');
        });

        copyBtn?.addEventListener('click', () => {
            if (partyService.partyId) {
                navigator.clipboard.writeText(partyService.partyId);
                notificationService.success('Code copied!');
            }
        });

        // Listen for updates from service
        eventBus.on('partyStateChange', render);
    }

    setupLeaderboards() {
        const viewBtn = document.getElementById('view-leaderboard-btn');
        const modal = document.getElementById('leaderboard-modal');
        const closeBtn = document.getElementById('leaderboard-close-btn');
        const tabs = document.getElementById('leaderboard-tabs');
        const content = document.getElementById('leaderboard-content');
        
        // Populate game tabs
        if (tabs) {
            const globalTabIcon = `<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
            const gameTabs = this.games.map(g => 
                `<button class="leaderboard-tab" data-game="${g.id}"><span class="tab-icon-wrap">${GAME_ICONS[g.id] || ''}</span></button>`
            ).join('');
            tabs.innerHTML = `<button class="leaderboard-tab active" data-game="global">${globalTabIcon} Global</button>${gameTabs}`;
            
            tabs.addEventListener('click', async (e) => {
                const tab = e.target.closest('.leaderboard-tab');
                if (tab) {
                    document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    await this.loadLeaderboard(tab.dataset.game);
                }
            });
        }
        
        // Open modal
        if (viewBtn) {
            viewBtn.addEventListener('click', async () => {
                modal?.classList.remove('hidden');
                await this.loadLeaderboard('global');
            });
        }
        
        // Close
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal?.classList.add('hidden'));
        }
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                modal.classList.add('hidden');
            }
        });
    }

    async loadLeaderboard(gameId) {
        const content = document.getElementById('leaderboard-content');
        if (!content) return;
        
        content.innerHTML = '<div class="leaderboard-empty">Loading...</div>';
        
        let scores;
        if (gameId === 'global') {
            scores = await leaderboardService.getGlobalLeaderboard(10);
        } else {
            scores = await leaderboardService.getGameLeaderboard(gameId, 'allTime', 10);
        }
        
        if (scores.length === 0) {
            content.innerHTML = `<div class="leaderboard-empty">
                <svg class="leaderboard-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <span>No scores yet!</span>
            </div>`;
            return;
        }
        
        const rankClasses = ['gold', 'silver', 'bronze'];
        content.innerHTML = `<div class="leaderboard-list">${scores.map((entry, i) => `
            <div class="leaderboard-item ${entry.isCurrentUser ? 'current-user' : ''}">
                <span class="leaderboard-rank ${rankClasses[i] || ''}">${entry.rank}</span>
                <span class="leaderboard-name">${entry.name}</span>
                <span class="leaderboard-score">${entry.score.toLocaleString()}</span>
            </div>
        `).join('')}</div>`;
    }

    setupSettings() {
        const modal = document.getElementById('settings-modal');
        const closeBtn = document.getElementById('settings-close-btn');
        const soundToggle = document.getElementById('sound-toggle');
        const musicToggle = document.getElementById('music-toggle');
        const notificationsToggle = document.getElementById('notifications-toggle');
        const contrastToggle = document.getElementById('contrast-toggle');
        
        // Load current preferences
        const prefs = globalStateManager.getProfile().preferences;
        if (soundToggle) soundToggle.checked = prefs.soundEnabled;
        if (musicToggle) musicToggle.checked = prefs.musicEnabled;
        if (notificationsToggle) notificationsToggle.checked = prefs.notificationsEnabled;
        
        // Save on change
        const savePrefs = () => {
            globalStateManager.setPreferences({
                soundEnabled: soundToggle?.checked ?? true,
                musicEnabled: musicToggle?.checked ?? true,
                notificationsEnabled: notificationsToggle?.checked ?? true
            });
        };
        
        soundToggle?.addEventListener('change', savePrefs);
        musicToggle?.addEventListener('change', savePrefs);
        notificationsToggle?.addEventListener('change', savePrefs);
        
        // High contrast mode
        contrastToggle?.addEventListener('change', () => {
            document.body.classList.toggle('high-contrast', contrastToggle.checked);
        });
        
        // Close
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal?.classList.add('hidden'));
        }
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                modal.classList.add('hidden');
            }
        });
    }

    updateStatsFromGlobal() {
        const profile = globalStateManager.getProfile();
        const stats = globalStateManager.getStatistics();
        
        // Update header stats with global data
        const userLevel = document.getElementById('user-level');
        const totalScore = document.getElementById('total-score');
        const achievementsCount = document.getElementById('achievements-count');
        
        if (userLevel) userLevel.textContent = `Lv. ${profile.level}`;
        if (totalScore) totalScore.textContent = stats.totalScore.toLocaleString();
        if (achievementsCount) {
            const metaCount = achievementService.getUnlockedCount();
            achievementsCount.textContent = profile.totalAchievements + metaCount;
        }
        
        // Update profile display if signed in
        this.updateProfileDisplay(profile);
    }

    updateProfileDisplay(profile) {
        const avatarEl = document.querySelector('.dropdown-avatar');
        const nameEl = document.querySelector('.dropdown-name');
        
        if (avatarEl) {
            const iconSvg = AVATAR_ICONS[profile.avatar] || '';
            avatarEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>`;
        }
        if (nameEl && profile.displayName !== 'Player') {
            nameEl.textContent = profile.displayName;
        }
    }

    setupAchievementGallery() {
        const achievementBtn = document.getElementById('achievements-btn');
        const galleryModal = document.getElementById('achievement-gallery');
        
        if (achievementBtn) {
            achievementBtn.addEventListener('click', () => {
                this.openAchievementGallery();
            });
            
            // Update count badge
            this.updateAchievementBadge();
        }
        
        // Close gallery on backdrop click
        if (galleryModal) {
            galleryModal.addEventListener('click', (e) => {
                if (e.target === galleryModal || e.target.classList.contains('modal-backdrop')) {
                    galleryModal.classList.add('hidden');
                }
            });
        }
    }

    updateAchievementBadge() {
        const badge = document.getElementById('achievement-count');
        if (badge) {
            const profile = globalStateManager.getProfile();
            const metaCount = achievementService.getUnlockedCount();
            badge.textContent = profile.totalAchievements + metaCount;
        }
    }

    openAchievementGallery() {
        const modal = document.getElementById('achievement-gallery');
        if (!modal) return;
        
        modal.classList.remove('hidden');
        this.renderAchievementGallery();
    }

    renderAchievementGallery() {
        const content = document.getElementById('gallery-content');
        if (!content) return;
        
        const allMeta = achievementService.getAllMetaAchievements();
        const aggregated = achievementService.getAggregatedAchievements();
        
        let html = `
            <div class="gallery-header">
                <h2>🏆 Achievement Gallery</h2>
                <p>Total Achievements: ${aggregated.total}</p>
            </div>
            
            <div class="gallery-section">
                <h3>🌟 Meta Achievements (${achievementService.getUnlockedCount()}/${achievementService.getTotalCount()})</h3>
                <div class="achievement-grid">
        `;
        
        allMeta.forEach(ach => {
            const progress = ach.unlocked ? 1 : (achievementService.getProgress()[ach.id]?.progress || 0);
            html += `
                <div class="achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${ach.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${ach.unlocked ? ach.name : '???'}</div>
                        <div class="achievement-desc">${ach.unlocked ? ach.desc : 'Keep playing to unlock!'}</div>
                        ${!ach.unlocked ? `<div class="achievement-progress-bar"><div class="progress-fill" style="width: ${progress * 100}%"></div></div>` : ''}
                        ${ach.unlocked && ach.xp > 0 ? `<div class="achievement-xp">+${ach.xp} XP</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
        
        // Add game achievements sections
        for (const [gameId, data] of Object.entries(aggregated.byGame)) {
            if (gameId === 'hub' || data.count === 0) continue;
            
            const game = this.games.find(g => g.id === gameId);
            if (!game) continue;
            
            html += `
                <div class="gallery-section">
                    <h3>${game.icon} ${game.title} (${data.count} unlocked)</h3>
                </div>
            `;
        }
        
        html += `
            <button class="btn btn-ghost gallery-close" id="gallery-close-btn">Close</button>
        `;
        
        content.innerHTML = html;
        
        // Add close handler
        document.getElementById('gallery-close-btn')?.addEventListener('click', () => {
            document.getElementById('achievement-gallery')?.classList.add('hidden');
        });
    }

    setupDailyChallenges() {
        this.renderDailyChallenges();
        
        // Update periodically
        setInterval(() => this.renderDailyChallenges(), 60000);
    }

    renderDailyChallenges() {
        const challengeSection = document.getElementById('challenge-section');
        if (!challengeSection) return;
        
        const info = dailyChallengeService.getChallengeInfo();
        
        let html = '';
        
        // Daily challenge
        if (info.daily) {
            const progressPct = Math.round(info.daily.progress * 100);
            html += `
                <div class="challenge-card ${info.daily.completed ? 'completed' : ''}">
                    <div class="challenge-header">
                        <span class="challenge-type"><svg class="challenge-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> DAILY</span>
                        <span class="challenge-timer">${info.daily.remaining}</span>
                    </div>
                    <div class="challenge-desc">${info.daily.description}</div>
                    <div class="challenge-progress">
                        <div class="challenge-bar">
                            <div class="challenge-fill" style="width: ${progressPct}%"></div>
                        </div>
                        <span class="challenge-pct">${progressPct}%</span>
                    </div>
                    ${info.daily.completed ? 
                        '<div class="challenge-complete"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg> Complete!</div>' : 
                        `<div class="challenge-reward">+${info.daily.reward} XP</div>`
                    }
                </div>
            `;
        }
        
        // Weekly challenge
        if (info.weekly) {
            const progressPct = Math.round(info.weekly.progress * 100);
            html += `
                <div class="challenge-card weekly ${info.weekly.completed ? 'completed' : ''}">
                    <div class="challenge-header">
                        <span class="challenge-type"><svg class="challenge-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> WEEKLY</span>
                        <span class="challenge-timer">${info.weekly.remaining}</span>
                    </div>
                    <div class="challenge-name">${info.weekly.name}</div>
                    <div class="challenge-desc">${info.weekly.description}</div>
                    <div class="challenge-progress">
                        <div class="challenge-bar">
                            <div class="challenge-fill" style="width: ${progressPct}%"></div>
                        </div>
                        <span class="challenge-pct">${progressPct}%</span>
                    </div>
                    ${info.weekly.completed ? 
                        '<div class="challenge-complete"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"/></svg> Complete!</div>' : 
                        `<div class="challenge-reward">+${info.weekly.reward} XP</div>`
                    }
                </div>
            `;
        }
        
        challengeSection.innerHTML = html;
    }

    renderGames(filter = 'all') {
        const grid = document.getElementById('games-grid');
        if (!grid) return;

        grid.innerHTML = '';

        const filteredGames = filter === 'all' 
            ? this.games 
            : this.games.filter(g => g.difficulty === filter);

        filteredGames.forEach((game, index) => {
            const card = this.createGameCard(game, index);
            grid.appendChild(card);
        });
    }

    createGameCard(game, index) {
        const card = document.createElement('article');
        card.className = 'game-card';
        card.style.animationDelay = `${index * 0.05}s`;

        const highScore = this.highScores[game.id] || 0;
        const difficultyClass = `difficulty-${game.difficulty}`;
        const svgIcon = GAME_ICONS[game.id] || '';

        // Generate star rating with SVG icons
        const starIcon = '<svg class="star-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>';
        const starRating = Array(game.rating).fill(starIcon).join('');

        // Trophy icon for high score
        const trophyIcon = '<svg class="trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';

        card.innerHTML = `
            <div class="game-card-icon-wrapper">
                <div class="game-card-svg-icon">
                    ${svgIcon}
                </div>
                <span class="game-card-difficulty ${difficultyClass}">${game.difficulty}</span>
            </div>
            <div class="game-card-content">
                <h3 class="game-card-title">${game.title}</h3>
                <p class="game-card-description">${game.description}</p>
                <div class="game-card-meta">
                    <div class="game-card-highscore">
                        ${trophyIcon}
                        <span class="score-label">High Score:</span>
                        <span class="score">${highScore.toLocaleString()}</span>
                    </div>
                    <div class="game-card-rating">
                        ${starRating}
                    </div>
                </div>
            </div>
            ${!game.comingSoon ? `
            <div class="game-card-play-overlay">
                <button class="play-btn" aria-label="Play ${game.title}">
                    <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                </button>
            </div>
            ` : `
            <div class="game-card-play-overlay coming-soon-overlay">
                <span class="coming-soon-label">COMING SOON</span>
            </div>
            `}
        `;

        // Apply equipped card skin if present
        const skin = economyService.getEquippedCardSkin();
        if (skin) {
            card.classList.add(skin.cssClass);
        }

        if (!game.comingSoon) {
            card.addEventListener('click', () => {
                audioService.playSFX('click');
                this.launchGame(game);
            });
            card.addEventListener('mouseenter', () => audioService.playSFX('hover'));
            card.style.cursor = 'pointer';
        } else {
            card.style.opacity = '0.7';
        }

        return card;
    }

    launchGame(game) {
        // SPA Mode: Use GameLoaderService instead of navigation
        gameLoaderService.loadGame(game);
        
        // Legacy fallback if needed:
        // window.location.href = game.path;
    }

    setupFilters() {
        const filterTabs = document.querySelectorAll('.filter-tab');

        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active state
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Apply filter
                const filter = tab.dataset.filter;
                this.currentFilter = filter;
                this.renderGames(filter);
            });
        });
    }

    updateStats() {
        const stats = storageManager.getStats();

        // Update stat cards
        const gamesPlayed = document.getElementById('games-played');
        const achievementsCount = document.getElementById('achievements-count');
        const totalPlaytime = document.getElementById('total-playtime');
        const currentXP = document.getElementById('current-xp');

        if (gamesPlayed) gamesPlayed.textContent = stats.gamesPlayed.toLocaleString();
        if (achievementsCount) achievementsCount.textContent = storageManager.getAchievements().length;
        if (totalPlaytime) {
            const hours = Math.floor(stats.totalPlayTime / 3600);
            const minutes = Math.floor((stats.totalPlayTime % 3600) / 60);
            totalPlaytime.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }
        if (currentXP) currentXP.textContent = `${stats.xp} XP`;

        // Update header stats
        const userLevel = document.getElementById('user-level');
        const totalScore = document.getElementById('total-score');

        if (userLevel) userLevel.textContent = `Lv. ${stats.level}`;
        if (totalScore) {
            const total = Object.values(this.highScores).reduce((sum, s) => sum + s, 0);
            totalScore.textContent = total.toLocaleString();
        }
    }

    setupAuth() {
        const authBtn = document.getElementById('auth-btn');
        const authModal = document.getElementById('auth-modal');
        const modalClose = document.getElementById('modal-close');
        const backdrop = authModal?.querySelector('.modal-backdrop');
        const guestPlay = document.getElementById('guest-play');
        const googleSignin = document.getElementById('google-signin');

        if (authBtn && authModal) {
            authBtn.addEventListener('click', () => {
                // If signed in, toggle dropdown
                const user = firebaseService.getCurrentUser();
                if (user && !user.isAnonymous) {
                    const dropdownMenu = document.getElementById('dropdown-menu');
                    dropdownMenu?.classList.toggle('hidden');
                } else {
                    // Not signed in, show auth modal
                    authModal.classList.remove('hidden');
                }
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('user-dropdown');
            const dropdownMenu = document.getElementById('dropdown-menu');
            if (dropdown && dropdownMenu && !dropdown.contains(e.target)) {
                dropdownMenu.classList.add('hidden');
            }
        });

        // Sign out button in dropdown
        const signOutBtn = document.getElementById('dropdown-signout');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                await firebaseService.signOut();
                this.updateAuthUI(null);
                document.getElementById('dropdown-menu')?.classList.add('hidden');
            });
        }

        if (modalClose) {
            modalClose.addEventListener('click', () => {
                authModal.classList.add('hidden');
            });
        }

        if (backdrop) {
            backdrop.addEventListener('click', () => {
                authModal.classList.add('hidden');
            });
        }

        if (guestPlay) {
            guestPlay.addEventListener('click', async () => {
                authModal.classList.add('hidden');
                // Sign in anonymously for cloud features
                try {
                    await firebaseService.signInAnonymously();
                } catch (e) {
                    console.warn('Anonymous sign-in failed:', e);
                }
            });
        }

        if (googleSignin) {
            googleSignin.addEventListener('click', async () => {
                try {
                    const user = await firebaseService.signInWithGoogle();
                    authModal.classList.add('hidden');
                    // Popup returns user directly, update UI immediately
                    if (user) {
                        console.log('Sign-in successful, updating UI for:', user.displayName);
                        this.updateAuthUI(user);
                    }
                } catch (e) {
                    console.error('Google sign-in failed:', e);
                    if (e.code !== 'auth/popup-closed-by-user') {
                        alert('Sign-in failed: ' + e.message);
                    }
                }
            });
        }

        // Initialize Firebase and set up auth state listener
        this.initFirebase();
    }

    setupEventListeners() {
        // Listen for score updates from games
        eventBus.on(GameEvents.HIGHSCORE_UPDATE, ({ gameId, score }) => {
            this.highScores[gameId] = score;
            this.updateStats();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Number keys 1-4 for category filters
            if (e.code >= 'Digit1' && e.code <= 'Digit4') {
                const filters = ['all', 'easy', 'medium', 'hard'];
                const index = parseInt(e.code.replace('Digit', '')) - 1;
                const tab = document.querySelector(`[data-filter="${filters[index]}"]`);
                if (tab) tab.click();
            }
        });
    }

    async initFirebase() {
        // Set up auth state change handler BEFORE init (so we catch the auth state)
        firebaseService.onAuthStateChanged = (user) => {
            console.log('Auth state changed in app.js:', user?.displayName || user?.email || 'null');
            this.updateAuthUI(user);
        };

        const success = await firebaseService.init();
        if (success) {
            console.log('Firebase initialized successfully!');
            
            // Update UI with current user (in case auth state fired before handler was set)
            const currentUser = firebaseService.getCurrentUser();
            console.log('Current user after init:', currentUser?.displayName || currentUser?.email || 'null');
            if (currentUser) {
                this.updateAuthUI(currentUser);
            }
        }
    }

    updateAuthUI(user = null) {
        const authBtn = document.getElementById('auth-btn');
        const dropdownName = document.querySelector('.dropdown-name');
        const dropdownEmail = document.querySelector('.dropdown-email');
        const dropdownMenu = document.getElementById('dropdown-menu');
        const dropdownAvatar = document.querySelector('.dropdown-avatar');
        const signOutBtn = document.getElementById('dropdown-signout');

        if (!authBtn) return;

        console.log('[updateAuthUI] Called with user:', user?.displayName || user?.email || 'null');

        if (user && !user.isAnonymous) {
            // Signed in with Google
            const displayName = user.displayName || 'User';
            const photoURL = user.photoURL;
            
            // Update auth button with avatar and name
            authBtn.innerHTML = `
                ${photoURL 
                    ? `<img src="${photoURL}" alt="avatar" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`
                    : `<span>👤</span>`
                }
                <span style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayName}</span>
                <span style="font-size: 0.6rem; margin-left: 4px;">▼</span>
            `;
            authBtn.title = 'Click for account options';
            authBtn.classList.add('signed-in');

            // Update dropdown header
            if (dropdownName) dropdownName.textContent = displayName;
            if (dropdownEmail) dropdownEmail.textContent = user.email || '';
            if (dropdownAvatar) {
                dropdownAvatar.innerHTML = photoURL 
                    ? `<img src="${photoURL}" alt="avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`
                    : '👤';
            }
            
            // Ensure sign out button is visible
            if (signOutBtn) signOutBtn.style.display = 'flex';
            
            console.log('[updateAuthUI] Updated to signed-in state:', displayName);
        } else if (user && user.isAnonymous) {
            // Anonymous user
            authBtn.innerHTML = `
                <span>👤</span>
                <span>Guest</span>
            `;
            authBtn.title = 'Playing as guest - Click to sign in with Google';
            authBtn.classList.remove('signed-in');
            
            // Hide sign out for anonymous
            if (signOutBtn) signOutBtn.style.display = 'none';
        } else {
            // Not signed in
            authBtn.innerHTML = `
                <span>👤</span>
                <span>Sign In</span>
            `;
            authBtn.title = 'Sign in to save scores to leaderboard';
            authBtn.classList.remove('signed-in');
            
            // Hide dropdown if showing
            if (dropdownMenu) dropdownMenu.classList.add('hidden');
        }
    }

    setupShop() {
        const shopBtn = document.getElementById('shop-btn');
        const modal = document.getElementById('shop-modal');
        const closeBtn = document.getElementById('shop-close-btn');
        const tabs = document.getElementById('shop-tabs');
        const coinDisplay = document.getElementById('header-coins');
        const shopCoins = document.getElementById('shop-coins');
        
        // Update coin display
        const updateCoins = () => {
             const coins = economyService.getBalance('coins');
             if (coinDisplay) coinDisplay.textContent = coins.toLocaleString();
             if (shopCoins) shopCoins.textContent = coins.toLocaleString();
        };

        eventBus.on('currencyEarned', updateCoins);
        eventBus.on('currencySpent', updateCoins);
        updateCoins();

        // Open modal
        if (shopBtn) {
            shopBtn.addEventListener('click', () => {
                modal?.classList.remove('hidden');
                this.renderShopItems('all');
            });
        }

        // Close modal
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal?.classList.add('hidden'));
        }

        modal?.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                modal.classList.add('hidden');
            }
        });

        // Tab switching
        if (tabs) {
            tabs.addEventListener('click', (e) => {
                if (e.target.classList.contains('shop-tab')) {
                    document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    this.renderShopItems(e.target.dataset.category);
                }
            });
        }
    }

    renderShopItems(category) {
        const grid = document.getElementById('shop-grid');
        if (!grid) return;

        const items = economyService.getShopItems(category === 'all' ? null : category);
        
        grid.innerHTML = items.map(item => `
            <div class="shop-item ${item.owned ? 'owned' : ''}">
                <div class="item-preview">${item.icon || item.preview || '📦'}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${item.description}</div>
                ${item.owned ? `
                    <button class="btn btn-sm ${item.equipped ? 'btn-success' : 'btn-primary'} equip-btn" data-id="${item.id}">
                        ${item.equipped ? 'Equipped' : 'Equip'}
                    </button>
                ` : `
                    <div class="item-price">${item.price} 🪙</div>
                    <button class="btn btn-sm ${item.canAfford ? 'btn-primary' : 'btn-ghost'} buy-btn" 
                        data-id="${item.id}" ${!item.canAfford ? 'disabled' : ''}>
                        Buy
                    </button>
                `}
            </div>
        `).join('');

        // Action listeners
        grid.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (economyService.purchaseItem(id)) {
                    this.renderShopItems(document.querySelector('.shop-tab.active').dataset.category);
                }
            });
        });

        grid.querySelectorAll('.equip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (economyService.equipItem(id)) {
                    this.renderShopItems(document.querySelector('.shop-tab.active').dataset.category);
                    
                    // Specific UI updates for equipped items
                    const item = SHOP_ITEMS[id];
                    if (item.type === 'card_skin') {
                        this.renderGames(this.currentFilter);
                    }
                }
            });
        });
    }

    setupTournaments() {
        const createBtn = document.getElementById('create-tournament-btn');
        const modal = document.getElementById('create-tournament-modal');
        const startBtn = document.getElementById('start-tournament-btn');
        const cancelBtn = document.getElementById('cancel-tournament-btn');
        
        // Render tournaments
        this.renderTournaments();
        eventBus.on('tournamentCreated', () => this.renderTournaments());
        eventBus.on('tournamentJoined', () => this.renderTournaments());
        eventBus.on('tournamentStarted', () => this.renderTournaments());
        eventBus.on('tournamentCompleted', () => this.renderTournaments());

        // Open create modal
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                modal?.classList.remove('hidden');
                this.renderTournamentGameSelect();
            });
        }

        // Close modal
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => modal?.classList.add('hidden'));
        }

        // Create tournament
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const name = document.getElementById('tourney-name-input').value;
                const gameId = document.querySelector('.game-select-option.selected')?.dataset.id;
                const size = parseInt(document.getElementById('tourney-size-select').value);

                if (name && gameId) {
                    const tournament = tournamentService.createTournament({
                        name,
                        gameId,
                        size,
                        type: TOURNAMENT_TYPES.SINGLE_ELIMINATION
                    });

                    // Auto-join host
                    tournamentService.joinTournament(tournament.id);

                    modal?.classList.add('hidden');
                    notificationService.success('Tournament created!');
                } else {
                    notificationService.error('Please select a game and enter a name');
                }
            });
        }
    }

    renderTournaments() {
        const container = document.getElementById('tournament-section');
        if (!container) return;

        const tournaments = tournamentService.getOpenTournaments();
        
        if (tournaments.length === 0) {
            container.innerHTML = '<div class="tournament-empty">No active tournaments. Create one to compete!</div>';
            return;
        }

        container.innerHTML = tournaments.map(t => {
            const isJoined = tournamentService.isParticipant(t.id);
            const progress = (t.participants.length / t.size) * 100;
            
            return `
                <div class="tournament-card ${isJoined ? 'active' : ''}">
                    <div class="tournament-status ${t.status}">${t.status.replace('_', ' ').toUpperCase()}</div>
                    <div class="tournament-info">
                        <h3>${t.name}</h3>
                        <div class="tournament-meta">
                            <span>🎮 ${this.getGameTitle(t.gameId)}</span>
                            <span>🏆 ${t.size} Players</span>
                        </div>
                        <div class="tournament-participants">
                            <div class="participant-count">${t.participants.length} / ${t.size} Joined</div>
                            <div class="participant-bar">
                                <div class="participant-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                        <div class="tournament-actions">
                            ${isJoined ? `
                                <button class="btn btn-sm btn-ghost leave-tourney" data-id="${t.id}">Leave</button>
                            ` : `
                                <button class="btn btn-sm btn-primary join-tourney" data-id="${t.id}" 
                                    ${t.participants.length >= t.size ? 'disabled' : ''}>
                                    Join
                                </button>
                            `}
                            <button class="btn btn-sm btn-ghost view-bracket" data-id="${t.id}">View Bracket</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Action listeners
        container.querySelectorAll('.join-tourney').forEach(btn => {
            btn.addEventListener('click', (e) => {
                tournamentService.joinTournament(e.target.dataset.id);
            });
        });

        container.querySelectorAll('.leave-tourney').forEach(btn => {
            btn.addEventListener('click', (e) => {
                tournamentService.leaveTournament(e.target.dataset.id);
            });
        });

        container.querySelectorAll('.view-bracket').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.openBracketModal(e.target.dataset.id);
            });
        });
    }

    openBracketModal(tournamentId) {
        const tournament = tournamentService.getTournament(tournamentId);
        if (!tournament) return;

        const modal = document.getElementById('bracket-modal');
        const title = document.getElementById('bracket-title');
        const closeBtn = document.getElementById('bracket-close-btn');
        const refreshBtn = document.getElementById('bracket-refresh');

        if (title) title.textContent = `${tournament.name} Bracket`;
        
        this.renderBracket(tournament);
        modal?.classList.remove('hidden');

        // Setup listeners
        if (closeBtn) {
            closeBtn.onclick = () => modal?.classList.add('hidden');
        }

        if (refreshBtn) {
            refreshBtn.onclick = () => this.renderBracket(tournamentService.getTournament(tournamentId));
        }
    }

    renderBracket(tournament) {
        const container = document.getElementById('bracket-container');
        if (!container || !tournament.bracket) return;

        container.innerHTML = tournament.bracket.rounds.map((round, rIndex) => `
            <div class="bracket-round">
                <div class="round-title">Round ${rIndex + 1}</div>
                ${round.map(match => `
                    <div class="bracket-match ${match.completed ? 'completed' : ''} ${match.id === tournament.currentMatch?.id ? 'active' : ''}">
                        <div class="match-player ${match.winner === match.player1?.id ? 'winner' : ''}">
                            <span class="player-name">${match.player1?.name || (match.player1?.isBye ? 'BYE' : 'Waiting...')}</span>
                            ${match.result ? `<span class="player-score">${match.result.scores?.[match.player1?.id] || ''}</span>` : ''}
                        </div>
                        <div class="match-player ${match.winner === match.player2?.id ? 'winner' : ''}">
                            <span class="player-name">${match.player2?.name || (match.player2?.isBye ? 'BYE' : 'Waiting...')}</span>
                            ${match.result ? `<span class="player-score">${match.result.scores?.[match.player2?.id] || ''}</span>` : ''}
                        </div>
                        ${this.canManageMatch(tournament, match) ? `
                            <button class="btn btn-xs btn-primary manage-match-btn" data-id="${match.id}">Manage</button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    canManageMatch(tournament, match) {
        const profile = globalStateManager.getProfile();
        // Host can manage, or participants can report (simplified for now)
        return tournament.hostId === profile.id && !match.completed && match.player1 && match.player2;
    }

    renderTournamentGameSelect() {
        const container = document.getElementById('tourney-game-select');
        if (!container) return;

        container.innerHTML = this.games.map(g => `
            <div class="game-select-option" data-id="${g.id}">
                <div class="game-select-icon">${g.icon}</div>
                <div class="game-select-title">${g.title}</div>
            </div>
        `).join('');

        container.querySelectorAll('.game-select-option').forEach(opt => {
            opt.addEventListener('click', () => {
                container.querySelectorAll('.game-select-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });
    }

    getGameTitle(id) {
        return this.games.find(g => g.id === id)?.title || id;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new ArcadeHub();
});

// Add modal styles dynamically
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .modal {
        position: fixed;
        inset: 0;
        z-index: var(--z-modal);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal.hidden {
        display: none;
    }

    .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
    }

    .modal-content {
        position: relative;
        background: var(--color-bg-card);
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-lg);
        padding: var(--space-2xl);
        max-width: 400px;
        text-align: center;
        box-shadow: var(--glow-primary);
        animation: scaleIn 0.3s ease;
    }

    .modal-content h2 {
        margin-bottom: var(--space-md);
    }

    .modal-content p {
        color: var(--color-text-muted);
        margin-bottom: var(--space-xl);
    }

    .modal-buttons {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
    }

    .modal-close {
        position: absolute;
        top: var(--space-md);
        right: var(--space-md);
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-sm);
        color: var(--color-text-muted);
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .modal-close:hover {
        border-color: var(--color-danger);
        color: var(--color-danger);
    }
`;
document.head.appendChild(modalStyles);
