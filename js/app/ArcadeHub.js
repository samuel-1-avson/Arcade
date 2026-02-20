/**
 * Arcade Gaming Hub - Main Application (Refactored)
 * Modular architecture with separate managers for each feature
 */

// Core imports
import { storageManager } from '../engine/StorageManager.js';
import { eventBus, GameEvents } from '../engine/EventBus.js';
import { firebaseService } from '../engine/FirebaseService.js';

// Services
import { globalStateManager } from '../services/GlobalStateManager.js';
import { notificationService } from '../services/NotificationService.js';
import { achievementService } from '../services/AchievementService.js';
import { dailyChallengeService } from '../services/DailyChallengeService.js';
import { leaderboardService } from '../services/LeaderboardService.js';
import { tournamentService, TOURNAMENT_TYPES } from '../services/TournamentService.js';
import { tournamentRecommender } from '../services/TournamentRecommender.js';
import { economyService, SHOP_ITEMS } from '../services/EconomyService.js';
import { audioService } from '../services/AudioService.js';
import { backgroundService } from '../services/BackgroundService.js';
import { partyService } from '../services/PartyService.js';
import { gameLoaderService } from '../services/GameLoaderService.js';
import { commandPaletteService } from '../services/CommandPalette.js';
import { navigationService } from '../services/NavigationService.js';
import { userAccountService } from '../services/UserAccountService.js';
import { syncEngine } from '../engine/SyncEngine.js';
import { streamService } from '../services/StreamService.js';
import { presenceService } from '../services/PresenceService.js';
import { analyticsService } from '../services/AnalyticsService.js';
import { publicProfileService } from '../services/PublicProfileService.js';
import { friendsService } from '../services/FriendsService.js';
import { chatService } from '../services/ChatService.js';
import { zenModeService } from '../services/ZenModeService.js';

// Module imports
import { NavigationManager } from './navigation.js';
import { GameCardsManager } from './gameCards.js';
import { AuthManager } from './auth.js';
import { DashboardManager } from './dashboard.js';
import { ProfileModalManager } from './modals/profile.js';
import { SettingsModalManager } from './modals/settings.js';
import { FriendsManager } from './social/friends.js';
import { LeaderboardManager } from './leaderboard.js';
import { accessibilityManager } from './accessibility.js';
import { ErrorBoundary } from '../components/ErrorBoundary.v2.js';
import { connectionDiagnostics } from '../utils/connectionDiagnostics.js';

// Free Tier Client-Side Features
import { clientSideAggregator } from '../services/ClientSideAggregator.js';
import { offlineManager } from '../utils/OfflineManager.js';
import { clientAnalytics } from '../utils/ClientAnalytics.js';
import { localTournamentManager } from '../services/LocalTournamentManager.js';

// Config
import { GAME_ICONS } from '../config/gameRegistry.js';

// Game catalog
const GAMES = [
    { id: 'snake', title: 'Snake', description: 'Eat food, grow longer, don\'t hit yourself!', difficulty: 'easy', path: 'games/snake/', rating: 5, hudMode: 'GAME_MINIMAL' },
    { id: '2048', title: '2048', description: 'Slide tiles and merge them to reach 2048!', difficulty: 'easy', path: 'games/2048/', rating: 5 },
    { id: 'breakout', title: 'Breakout', description: 'Break all the bricks with the ball!', difficulty: 'easy', path: 'games/breakout/', rating: 5 },
    { id: 'minesweeper', title: 'Minesweeper', description: 'Find all the mines without exploding!', difficulty: 'easy', path: 'games/minesweeper/', rating: 5 },
    { id: 'tetris', title: 'Tetris', description: 'Stack blocks and clear lines!', difficulty: 'medium', path: 'games/tetris/', rating: 5 },
    { id: 'pacman', title: 'Pac-Man', description: 'Eat dots and avoid ghosts!', difficulty: 'medium', path: 'games/pacman/', rating: 5 },
    { id: 'asteroids', title: 'Asteroids', description: 'Shoot asteroids in deep space!', difficulty: 'medium', path: 'games/asteroids/', rating: 5 },
    { id: 'tower-defense', title: 'Tower Defense', description: 'Build towers and stop the enemies!', difficulty: 'hard', path: 'games/tower-defense/', rating: 5 },
    { id: 'rhythm', title: 'Rhythm', description: 'Hit notes to the beat!', difficulty: 'hard', path: 'games/rhythm/', rating: 5 },
    { id: 'roguelike', title: 'Roguelike', description: 'Explore procedural dungeons!', difficulty: 'hard', path: 'games/roguelike/', rating: 5 },
    { id: 'toonshooter', title: 'Toon Shooter', description: 'Duel in a tiny toon arena!', difficulty: 'medium', path: 'games/toonshooter/', rating: 5 }
];

export class ArcadeHub {
    constructor() {
        this.games = GAMES;
        this.highScores = storageManager.getAllHighScores();

        // Managers
        this.navigation = new NavigationManager(this);
        this.gameCards = new GameCardsManager(this, GAMES);
        this.auth = new AuthManager(this);
        this.dashboard = new DashboardManager(this, GAMES);
        this.profileModal = new ProfileModalManager(this);
        this.settingsModal = new SettingsModalManager(this);
        this.friends = new FriendsManager(this);
        this.leaderboardManager = new LeaderboardManager(this);

        // DM chat state
        this.dmUnsubscribe = null;

        this.init();
    }

    async init() {
        // Initialize error boundary for global error handling
        this.errorBoundary = new ErrorBoundary({
            fallbackMessage: 'Something went wrong. Please try again.',
            showDetails: false, // Don't show sensitive error details to users
            onError: (error, context) => {
                console.error(`[ArcadeHub] Error in ${context}:`, error);
                analyticsService.track('error', {
                    context,
                    message: error.message,
                    stack: error.stack
                });
            }
        }).install();

        // Wrap initialization in try-catch to prevent total failure
        try {
            await this.initializeApp();
        } catch (error) {
            console.error('[ArcadeHub] Fatal initialization error:', error);
            this.errorBoundary.handleError(error, 'App Initialization');
            notificationService.error('Failed to initialize app. Please refresh the page.');
        }
    }

    async initializeApp() {
        this.renderGames();
        this.setupEventListeners();
        
        // Initialize managers
        this.navigation.init();
        this.gameCards.init();
        this.auth.init();
        this.dashboard.init();
        this.profileModal.init();
        this.settingsModal.init();
        this.friends.init();
        this.leaderboardManager.init();

        // Initialize services
        await this.initServices();

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW Registered'))
                .catch(err => console.log('SW Failed', err));
        }
    }

    async initServices() {
        await globalStateManager.init();
        notificationService.init();
        achievementService.init();
        dailyChallengeService.init();
        leaderboardService.init();
        tournamentService.init();
        economyService.init();
        audioService.init();
        backgroundService.init();
        partyService.init();
        gameLoaderService.init();
        navigationService.init();
        commandPaletteService.init();
        syncEngine.init();
        await userAccountService.init();
        streamService.init();
        await presenceService.init();
        await friendsService.init();
        await chatService.init();
        analyticsService.init();
        analyticsService.trackPageView('hub_home');
        
        // Initialize public profile service (handles migration)
        publicProfileService.init();
        
        // Initialize accessibility manager (Phase 3)
        accessibilityManager.init();

        // Initialize connection diagnostics
        connectionDiagnostics.init();
        
        // Initialize free tier client-side features
        clientSideAggregator.init();
        offlineManager.init();
        clientAnalytics.init();
        localTournamentManager.init();
        
        // Show connection status in development
        if (config.features.debug) {
            connectionDiagnostics.createStatusIndicator();
        }

        // Setup additional UI
        this.setupAchievementGallery();
        this.setupDailyChallenges();
        this.setupTournaments();
        this.setupTournamentsModal();
        this.setupChallengesModal();
        this.setupShop();
        this.setupLeaderboards();
        this.setupSidebarToggle();
        this.setupPartyUI();
        this.setupPartyChatUI();

        // Listen for events
        this.setupGlobalEventListeners();

        console.log('Arcade Hub initialized with modular architecture');
    }

    setupEventListeners() {
        // High score updates
        eventBus.on(GameEvents.HIGHSCORE_UPDATE, ({ gameId, score }) => {
            this.highScores[gameId] = score;
            this.gameCards.updateHighScores();
        });

        // Global state changes
        eventBus.on('globalStateChange', ({ type }) => {
            if (type === 'session' || type === 'stats') {
                this.gameCards.render();
            }
        });
    }

    setupGlobalEventListeners() {
        // Sync status
        eventBus.on('syncStatusChanged', ({ status }) => {
            this.updateSyncIndicator(status);
        });

        // User auth
        eventBus.on('userSignedIn', (user) => {
            console.log('User signed in:', user.displayName);
            presenceService.setOnline();
        });

        eventBus.on('userSignedOut', () => {
            console.log('User signed out');
        });

        // Game close button
        document.getElementById('close-game-btn')?.addEventListener('click', () => {
            // Clean up DM chat
            if (this.dmUnsubscribe) {
                this.dmUnsubscribe();
                this.dmUnsubscribe = null;
            }
            document.querySelector('.dm-modal')?.remove();
            gameLoaderService.closeGame();
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (this.dmUnsubscribe) {
                this.dmUnsubscribe();
            }
        });
    }

    // ==================== UI RENDERING ====================

    renderGames() {
        this.gameCards.render();
    }

    updateDashboard() {
        this.dashboard.update();
    }

    updateSyncIndicator(status) {
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.className = `sync-indicator sync-${status}`;
            indicator.title = `Sync: ${status}`;
        }
    }

    // ==================== MODAL METHODS ====================

    setupAchievementGallery() {
        // Achievement gallery setup
    }

    setupDailyChallenges() {
        // Daily challenges setup
    }

    setupTournaments() {
        // Tournaments setup
    }

    setupTournamentsModal() {
        // Tournament modal setup
    }

    setupChallengesModal() {
        // Challenges modal setup
    }

    setupShop() {
        // Shop setup
    }

    setupLeaderboards() {
        // Leaderboard manager handles setup
        // Tabs are populated dynamically based on available games
    }

    setupSidebarToggle() {
        const toggleBtn = document.getElementById('toggle-right-sidebar');
        const sidebar = document.getElementById('right-sidebar');
        
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                // Check if we are on mobile/tablet layout (where it slides in instead of minimizing)
                if (window.innerWidth <= 1280) {
                    sidebar.classList.toggle('open');
                } else {
                    // Desktop layout: minimize to icon strip
                    sidebar.classList.toggle('minimized');
                    // Add a class to body to adjust main container padding
                    document.body.classList.toggle('sidebar-minimized');
                }
            });
        }
    }

    setupPartyUI() {
        const createBtn = document.getElementById('create-party-btn');
        const joinInput = document.getElementById('join-party-input');
        const joinBtn = document.getElementById('join-party-btn');
        const copyBtn = document.getElementById('copy-party-code');
        const leaveBtn = document.getElementById('leave-party-btn');
        const actionsView = document.getElementById('party-actions-view');
        const activeView = document.getElementById('active-party-view');

        createBtn?.addEventListener('click', async () => {
            const code = await partyService.createParty();
        });

        joinBtn?.addEventListener('click', async () => {
            const code = joinInput.value.trim();
            if (code) await partyService.joinParty(code);
        });

        copyBtn?.addEventListener('click', () => {
            const code = document.getElementById('current-party-code')?.textContent;
            if (code && code !== '------') {
                navigator.clipboard.writeText(code);
                notificationService.success('Party code copied!');
            }
        });

        leaveBtn?.addEventListener('click', () => {
            partyService.leaveParty();
        });

        // Listen for party state changes
        eventBus.on('partyStateChange', (state) => {
            if (partyService.isInParty()) {
                actionsView?.classList.add('hidden');
                activeView?.classList.remove('hidden');
                const codeEl = document.getElementById('current-party-code');
                if (codeEl) codeEl.textContent = state.partyId;
                this.updatePartyMembers(state.members, state.isLeader);
            } else {
                actionsView?.classList.remove('hidden');
                activeView?.classList.add('hidden');
                const codeEl = document.getElementById('current-party-code');
                if (codeEl) codeEl.textContent = '------';
            }
        });
    }

    updatePartyMembers(members, isLeader) {
        const list = document.getElementById('party-members-list');
        if (!list) return;

        list.innerHTML = members.map(m => `
            <div class="party-member ${m.isLeader ? 'is-host' : ''}">
                <div class="member-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                </div>
                <div class="member-name">${m.name}</div>
                ${m.isLeader ? '<span class="host-badge">HOST</span>' : ''}
                <div class="member-status-dot ${m.status}"></div>
            </div>
        `).join('');
    }

    setupPartyChatUI() {
        // Party chat setup
    }

    // ==================== PUBLIC API ====================

    async loadLeaderboard(gameId) {
        // Delegate to leaderboard manager
        this.leaderboardManager.open(gameId);
    }

    renderAchievementGallery() {
        // Render achievement gallery
    }

    openDMChat(friendId) {
        // Open DM chat
    }
}

export default ArcadeHub;
