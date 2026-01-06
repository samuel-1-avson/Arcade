/**
 * Command Palette Service
 * Universal keyboard-driven navigation with fuzzy search
 * Minimal Retro Calm Theme
 */

class CommandPaletteService {
    constructor() {
        this.isOpen = false;
        this.searchIndex = [];
        this.results = [];
        this.selectedIndex = 0;
        this.element = null;
        this.inputEl = null;
        this.resultsEl = null;
        this.onSelect = null;
    }

    init() {
        this.buildSearchIndex();
        this.createDOM();
        this.bindKeyboardShortcuts();
        console.log('[CommandPalette] Initialized with', this.searchIndex.length, 'items');
    }

    buildSearchIndex() {
        this.searchIndex = [];

        // Games
        const games = [
            { id: 'snake', title: 'Snake', icon: '🐍', path: 'games/snake/' },
            { id: '2048', title: '2048', icon: '🔢', path: 'games/2048/' },
            { id: 'breakout', title: 'Breakout', icon: '🎯', path: 'games/breakout/' },
            { id: 'minesweeper', title: 'Minesweeper', icon: '💣', path: 'games/minesweeper/' },

            { id: 'tetris', title: 'Tetris', icon: '🧱', path: 'games/tetris/' },
            { id: 'pacman', title: 'Pac-Man', icon: '👻', path: 'games/pacman/' },
            { id: 'asteroids', title: 'Asteroids', icon: '☄️', path: 'games/asteroids/' },
            { id: 'tower-defense', title: 'Tower Defense', icon: '🏰', path: 'games/tower-defense/' },
            { id: 'rhythm', title: 'Rhythm', icon: '🎵', path: 'games/rhythm/' },
            { id: 'roguelike', title: 'Roguelike', icon: '⚔️', path: 'games/roguelike/' }
        ];

        games.forEach(game => {
            this.searchIndex.push({
                type: 'game',
                id: game.id,
                title: game.title,
                description: `Play ${game.title}`,
                icon: game.icon,
                keywords: [game.title.toLowerCase(), 'game', 'play'],
                action: () => this.navigateToGame(game.path)
            });
        });

        // Navigation
        const navItems = [
            { id: 'home', title: 'Home', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1em; height: 1em; vertical-align: middle;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>', section: 'home' },
            { id: 'tournaments', title: 'Tournaments', icon: '🏆', section: 'tournaments' },
            { id: 'challenges', title: 'Challenges', icon: '🎯', section: 'challenges' },
            { id: 'leaderboard', title: 'Leaderboard', icon: '📊', modal: 'leaderboard-modal' },
            { id: 'achievements', title: 'Achievements', icon: '🌟', modal: 'achievement-gallery' },
            { id: 'shop', title: 'Shop', icon: '🛒', modal: 'shop-modal' },
            { id: 'settings', title: 'Settings', icon: '⚙️', modal: 'settings-modal' }
        ];

        navItems.forEach(nav => {
            this.searchIndex.push({
                type: 'navigation',
                id: nav.id,
                title: nav.title,
                description: nav.modal ? `Open ${nav.title}` : `Go to ${nav.title}`,
                icon: nav.icon,
                keywords: [nav.title.toLowerCase(), 'navigate', 'go'],
                action: () => {
                    if (nav.modal) {
                        document.getElementById(nav.modal)?.classList.remove('hidden');
                    } else if (nav.section) {
                        const el = document.getElementById(`${nav.section}-section`) ||
                                   document.querySelector(`.${nav.section}-section`);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                        else if (nav.section === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }
            });
        });

        // Quick Actions
        const actions = [
            { id: 'create-party', title: 'Create Party', icon: '👥', description: 'Start a new party' },
            { id: 'join-party', title: 'Join Party', icon: '🔗', description: 'Join with a code' },
            { id: 'edit-profile', title: 'Edit Profile', icon: '✏️', description: 'Change name & avatar' },
            { id: 'create-tournament', title: 'Create Tournament', icon: '🏆', description: 'Start competing' }
        ];

        actions.forEach(action => {
            this.searchIndex.push({
                type: 'action',
                id: action.id,
                title: action.title,
                description: action.description,
                icon: action.icon,
                keywords: [action.title.toLowerCase()],
                action: () => this.executeAction(action.id)
            });
        });
    }

    createDOM() {
        // Create palette container
        this.element = document.createElement('div');
        this.element.className = 'command-palette';
        this.element.innerHTML = `
            <div class="command-dialog">
                <div class="command-input-wrapper">
                    <span class="command-input-icon">🔍</span>
                    <input type="text" class="command-input" placeholder="Search games, navigate, actions..." autofocus>
                    <span class="command-shortcut">ESC</span>
                </div>
                <div class="command-results"></div>
                <div class="command-footer">
                    <div class="command-hints">
                        <span class="command-hint"><kbd>↑↓</kbd> Navigate</span>
                        <span class="command-hint"><kbd>↵</kbd> Select</span>
                        <span class="command-hint"><kbd>Esc</kbd> Close</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.element);

        this.inputEl = this.element.querySelector('.command-input');
        this.resultsEl = this.element.querySelector('.command-results');

        // Event listeners
        this.inputEl.addEventListener('input', () => this.handleSearch());
        this.inputEl.addEventListener('keydown', (e) => this.handleKeyNav(e));
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });

        // Initial results
        this.showDefaultResults();
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K to open
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
            // Escape to close
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Command trigger button click
        document.getElementById('command-trigger')?.addEventListener('click', () => {
            this.open();
        });

        // Quick actions sheet handling
        this.setupQuickActionsSheet();
    }

    setupQuickActionsSheet() {
        const sheet = document.getElementById('quick-actions-sheet');
        const menuBtn = document.getElementById('mobile-menu-btn');
        
        if (!sheet || !menuBtn) return;

        // Open quick actions on menu button click
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sheet.classList.toggle('open');
        });

        // Close on backdrop tap
        sheet.addEventListener('click', (e) => {
            if (e.target === sheet) {
                sheet.classList.remove('open');
            }
        });

        // Handle quick action items
        sheet.querySelectorAll('.quick-action-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                sheet.classList.remove('open');
                this.handleQuickAction(action);
            });
        });
    }

    handleQuickAction(action) {
        const actionMap = {
            'leaderboard': () => document.getElementById('leaderboard-modal')?.classList.remove('hidden'),
            'achievements': () => document.getElementById('achievement-gallery')?.classList.remove('hidden'),
            'settings': () => document.getElementById('settings-modal')?.classList.remove('hidden'),
            'party': () => document.getElementById('create-party-btn')?.click(),
            'challenges': () => document.querySelector('.challenges-section')?.scrollIntoView({ behavior: 'smooth' }),
            'tournaments': () => document.querySelector('.tournaments-section')?.scrollIntoView({ behavior: 'smooth' }),
            'search': () => this.open(),
            'profile': () => document.getElementById('edit-profile-btn')?.click()
        };

        if (actionMap[action]) {
            actionMap[action]();
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.element.classList.add('active');
        this.inputEl.value = '';
        this.inputEl.focus();
        this.showDefaultResults();
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        this.element.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleSearch() {
        const query = this.inputEl.value.trim().toLowerCase();
        
        if (!query) {
            this.showDefaultResults();
            return;
        }

        // Fuzzy search
        this.results = this.searchIndex.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(query);
            const descMatch = item.description?.toLowerCase().includes(query);
            const keywordMatch = item.keywords?.some(k => k.includes(query));
            return titleMatch || descMatch || keywordMatch;
        });

        // Sort by relevance (title match first)
        this.results.sort((a, b) => {
            const aTitle = a.title.toLowerCase().startsWith(query) ? -1 : 0;
            const bTitle = b.title.toLowerCase().startsWith(query) ? -1 : 0;
            return aTitle - bTitle;
        });

        this.selectedIndex = 0;
        this.renderResults();
    }

    showDefaultResults() {
        // Show recent/popular items
        this.results = this.searchIndex.slice(0, 8);
        this.selectedIndex = 0;
        this.renderResults();
    }

    renderResults() {
        if (this.results.length === 0) {
            this.resultsEl.innerHTML = `
                <div class="command-empty">
                    <div>No results found</div>
                    <div style="font-size: 0.8rem; margin-top: 4px; opacity: 0.6">Try a different search term</div>
                </div>
            `;
            return;
        }

        // Group by type
        const grouped = {};
        this.results.forEach(item => {
            if (!grouped[item.type]) grouped[item.type] = [];
            grouped[item.type].push(item);
        });

        const typeLabels = {
            game: '🎮 Games',
            navigation: '📍 Navigation',
            action: '⚡ Quick Actions'
        };

        let html = '';
        let globalIndex = 0;

        for (const [type, items] of Object.entries(grouped)) {
            html += `<div class="command-category">${typeLabels[type] || type}</div>`;
            items.forEach(item => {
                const isSelected = globalIndex === this.selectedIndex;
                html += `
                    <div class="command-item ${isSelected ? 'selected' : ''}" data-index="${globalIndex}">
                        <span class="command-item-icon">${item.icon}</span>
                        <div class="command-item-content">
                            <div class="command-item-title">${item.title}</div>
                            <div class="command-item-desc">${item.description || ''}</div>
                        </div>
                        <span class="command-item-type">${item.type}</span>
                    </div>
                `;
                globalIndex++;
            });
        }

        this.resultsEl.innerHTML = html;

        // Add click handlers
        this.resultsEl.querySelectorAll('.command-item').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.index);
                this.executeResult(index);
            });
        });

        // Scroll selected into view
        const selectedEl = this.resultsEl.querySelector('.command-item.selected');
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }

    handleKeyNav(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
            this.renderResults();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
            this.renderResults();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.executeResult(this.selectedIndex);
        }
    }

    executeResult(index) {
        const item = this.results[index];
        if (item && item.action) {
            item.action();
            this.close();
        }
    }

    navigateToGame(path) {
        // Use GameLoaderService if available
        if (window.gameLoaderService) {
            window.gameLoaderService.loadGame(path);
        } else {
            window.location.href = path;
        }
    }

    executeAction(actionId) {
        switch (actionId) {
            case 'create-party':
                document.getElementById('create-party-btn')?.click();
                break;
            case 'join-party':
                document.getElementById('join-party-btn-trigger')?.click();
                break;
            case 'edit-profile':
                document.getElementById('edit-profile-btn')?.click();
                break;
            case 'create-tournament':
                document.getElementById('create-tournament-btn')?.click();
                break;
        }
    }
}

export const commandPaletteService = new CommandPaletteService();
