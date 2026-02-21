/**
 * Leaderboard Manager
 * Integrates LeaderboardList component with VirtualList for performance
 */

import { LeaderboardList } from '../components/LeaderboardList.js';
import { leaderboardService } from '../services/LeaderboardService.js';
import { GAME_ICONS } from '../config/gameRegistry.js';
import { logger, LogCategory } from '../utils/logger.js';

export class LeaderboardManager {
    constructor(app) {
        this.app = app;
        this.modal = null;
        this.content = null;
        this.tabsContainer = null;
        this.currentGameId = 'global';
        this.leaderboardList = null;
        this.closeBtn = null;
    }
    
    init() {
        this.modal = document.getElementById('leaderboard-modal');
        this.content = document.getElementById('leaderboard-content');
        this.tabsContainer = document.getElementById('leaderboard-tabs');
        this.closeBtn = document.getElementById('leaderboard-close-btn');
        
        this.setupTabs();
        this.setupEventListeners();
    }
    
    setupTabs() {
        if (!this.tabsContainer) return;
        
        // Add game tabs dynamically from app games
        const games = this.app?.games || [];
        games.forEach(game => {
            const tab = document.createElement('button');
            tab.className = 'leaderboard-tab';
            tab.dataset.game = game.id;
            const svgIcon = GAME_ICONS[game.id] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1em; height: 1em; vertical-align: middle;"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M15 10v4"/><path d="M13 12h4"/></svg>';
            tab.innerHTML = `
                <span class="tab-icon" style="width:16px;height:16px;display:inline-block;">${svgIcon}</span>
                ${game.title}
            `;
            this.tabsContainer.appendChild(tab);
        });
        
        // Tab click handlers
        this.tabsContainer.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const gameId = tab.dataset.game;
                this.switchTab(gameId);
            });
        });
    }
    
    setupEventListeners() {
        // Close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.close();
            });
        }
        
        // Close on backdrop click
        const backdrop = this.modal?.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.close();
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }
    
    switchTab(gameId) {
        this.currentGameId = gameId;
        
        // Update active tab
        this.tabsContainer?.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.game === gameId);
        });
        
        // Load leaderboard
        this.loadLeaderboard(gameId);
    }
    
    async loadLeaderboard(gameId) {
        if (!this.content) return;
        
        // Clean up existing leaderboard
        if (this.leaderboardList) {
            this.leaderboardList.destroy();
            this.leaderboardList = null;
        }
        
        // Create new leaderboard list with virtual scrolling
        this.leaderboardList = new LeaderboardList(this.content, {
            gameId: gameId,
            pageSize: 20,
            itemHeight: 60,
            showRank: true,
            showAvatar: true,
            onItemClick: (entry) => {
                // Could open player profile
                logger.info(LogCategory.GAME, 'Clicked player:', entry);
            }
        });
        
        await this.leaderboardList.init();
    }
    
    open(gameId = 'global') {
        if (!this.modal) return;
        
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Switch to requested tab
        this.switchTab(gameId);
    }
    
    close() {
        if (!this.modal) return;
        
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Clean up
        if (this.leaderboardList) {
            this.leaderboardList.destroy();
            this.leaderboardList = null;
        }
    }
    
    isOpen() {
        return this.modal && !this.modal.classList.contains('hidden');
    }
    
    refresh() {
        if (this.leaderboardList) {
            this.leaderboardList.refresh();
        }
    }
}

export default LeaderboardManager;
