/**
 * Arcade Gaming Hub - New UI App
 * Main application class integrating all components
 */

import {
  TopBar,
  NavigationPills,
  BottomNav,
  SocialPanel,
  SettingsPanel,
  GamesGrid,
  MobileMenu,
  AuthModal,
  registry
} from './components/index.js';

import { keyboardManager, announce } from './utils/keyboard.js';
import { $, $$, copyToClipboard } from './utils/dom.js';

/**
 * Main Application Class
 */
export class App {
  constructor() {
    this.components = new Map();
    this.state = {
      isAuthenticated: false,
      user: null,
      currentView: 'games',
      activePanel: null
    };
    
    this.init();
  }
  
  /**
   * Initialize the application
   */
  init() {
    this.initComponents();
    this.bindEvents();
    this.bindKeyboardShortcuts();
    
    console.log('🎮 Arcade Hub UI initialized');
  }
  
  /**
   * Initialize all UI components
   */
  initComponents() {
    // Top Bar
    const topbar = $('.topbar');
    if (topbar) {
      this.topBar = new TopBar(topbar);
      this.components.set('topbar', this.topBar);
    }
    
    // Navigation Pills
    const navPills = $('.nav-pills');
    if (navPills) {
      this.navigation = new NavigationPills(navPills);
      this.components.set('navigation', this.navigation);
    }
    
    // Bottom Nav (Mobile)
    const bottomNav = $('.bottom-nav');
    if (bottomNav) {
      this.bottomNav = new BottomNav(bottomNav);
      this.components.set('bottomNav', this.bottomNav);
    }
    
    // Mobile Menu
    const mobileMenu = $('.mobile-menu');
    if (mobileMenu) {
      this.mobileMenu = new MobileMenu(mobileMenu);
      this.components.set('mobileMenu', this.mobileMenu);
    }
    
    // Social Panel
    const socialPanel = $('#social-panel');
    if (socialPanel) {
      this.socialPanel = new SocialPanel(socialPanel);
      this.components.set('socialPanel', this.socialPanel);
    }
    
    // Settings Panel
    const settingsPanel = $('#settings-panel');
    if (settingsPanel) {
      this.settingsPanel = new SettingsPanel(settingsPanel);
      this.components.set('settingsPanel', this.settingsPanel);
    }
    
    // Games Grid
    const gamesSection = $('.games-section');
    if (gamesSection) {
      this.gamesGrid = new GamesGrid(gamesSection);
      this.components.set('gamesGrid', this.gamesGrid);
    }
    
    // Auth Modal
    const authModal = $('#auth-modal');
    if (authModal) {
      this.authModal = new AuthModal(authModal);
      this.components.set('authModal', this.authModal);
    }
  }
  
  /**
   * Bind component events
   */
  bindEvents() {
    // TopBar events
    this.topBar?.on('settings:open', () => {
      this.openPanel('settings');
    });
    
    this.topBar?.on('menu:open', () => {
      this.mobileMenu?.open();
    });
    
    this.topBar?.on('search', (value) => {
      this.handleSearch(value);
    });
    
    // Navigation events
    this.navigation?.on('change', ({ id }) => {
      this.navigateTo(id);
    });
    
    this.bottomNav?.on('change', ({ id }) => {
      this.navigateTo(id);
    });
    
    this.bottomNav?.on('play:click', () => {
      this.emit('game:quickplay');
    });
    
    // Mobile menu navigation
    this.mobileMenu?.on('navigate', ({ id }) => {
      this.navigateTo(id);
    });
    
    // Panel events
    this.socialPanel?.on('party:create', () => {
      this.emit('party:create');
    });
    
    this.socialPanel?.on('party:join', () => {
      this.promptPartyCode();
    });
    
    this.socialPanel?.on('friend:add', () => {
      this.emit('friend:add');
    });
    
    this.settingsPanel?.on('setting:change', ({ id, value }) => {
      this.emit('setting:change', { id, value });
    });
    
    // Game events
    this.gamesGrid?.on('game:play', ({ id }) => {
      this.launchGame(id);
    });
    
    this.gamesGrid?.on('game:favorite', ({ id, isFavorite }) => {
      this.emit('game:favorite', { id, isFavorite });
    });
    
    // Auth modal events
    this.authModal?.on('auth:signin', ({ email, password }) => {
      this.emit('auth:signin', { email, password });
    });
    
    this.authModal?.on('auth:signup', ({ name, email, password }) => {
      this.emit('auth:signup', { name, email, password });
    });
  }
  
  /**
   * Bind global keyboard shortcuts
   */
  bindKeyboardShortcuts() {
    // Close panels/modals on Escape
    keyboardManager.register('close', { key: 'Escape' }, () => {
      if (this.state.activePanel) {
        this.closePanel();
      }
    });
    
    // Show help
    keyboardManager.register('help', { key: '?' }, () => {
      this.showKeyboardHelp();
    });
  }
  
  /**
   * Navigate to a view
   * @param {string} view - View ID
   */
  navigateTo(view) {
    this.state.currentView = view;
    
    // Update navigation states
    this.navigation?.activate(view);
    this.bottomNav?.activate(view);
    
    // Handle view-specific logic
    switch (view) {
      case 'social':
        this.openPanel('social');
        break;
      case 'shop':
        // Navigate to shop view
        break;
      default:
        // Default games view
        break;
    }
    
    this.emit('navigate', { view });
  }
  
  /**
   * Opens a side panel
   * @param {string} panel - 'social' or 'settings'
   */
  openPanel(panel) {
    // Close any open panel first
    this.closePanel();
    
    this.state.activePanel = panel;
    
    switch (panel) {
      case 'social':
        this.socialPanel?.open();
        break;
      case 'settings':
        this.settingsPanel?.open();
        break;
    }
  }
  
  /**
   * Closes the active panel
   */
  closePanel() {
    if (!this.state.activePanel) return;
    
    switch (this.state.activePanel) {
      case 'social':
        this.socialPanel?.close();
        break;
      case 'settings':
        this.settingsPanel?.close();
        break;
    }
    
    this.state.activePanel = null;
  }
  
  /**
   * Launches a game
   * @param {string} gameId - Game ID
   */
  launchGame(gameId) {
    this.emit('game:launch', { gameId });
    announce(`Launching game`);
  }
  
  /**
   * Handles search input
   * @param {string} query - Search query
   */
  handleSearch(query) {
    if (!query) return;
    
    // Filter games
    const games = this.gamesGrid?.state.games || [];
    const filtered = games.filter(g => 
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      g.description.toLowerCase().includes(query.toLowerCase())
    );
    
    this.gamesGrid?.setGames(filtered);
  }
  
  /**
   * Prompts for party code
   */
  promptPartyCode() {
    const code = prompt('Enter party code:');
    if (code) {
      this.emit('party:join', { code });
    }
  }
  
  /**
   * Shows keyboard shortcuts help
   */
  showKeyboardHelp() {
    const helpHTML = `
      <div class="keyboard-help">
        <h3>Keyboard Shortcuts</h3>
        <table>
          <tr><td><kbd>/</kbd></td><td>Focus search</td></tr>
          <tr><td><kbd>Ctrl+K</kbd></td><td>Open search</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Close panel/modal</td></tr>
          <tr><td><kbd>?</kbd></td><td>Show this help</td></tr>
        </table>
      </div>
    `;
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay modal-overlay--visible';
    modal.innerHTML = `
      <div class="modal modal--sm modal--visible">
        <div class="modal__header">
          <h3 class="modal__title">Keyboard Shortcuts</h3>
          <button class="modal__close">&times;</button>
        </div>
        <div class="modal__content">
          ${helpHTML}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('.modal__close')) {
        modal.remove();
      }
    });
  }
  
  /**
   * Updates user data
   * @param {Object} user - User data
   */
  setUser(user) {
    this.state.user = user;
    this.state.isAuthenticated = !!user;
    
    this.topBar?.updateAvatar(user?.avatar || '🎮');
    this.topBar?.updateStats({ xp: user?.xp || 0 });
  }
  
  /**
   * Updates games list
   * @param {Array} games - Array of game objects
   */
  setGames(games) {
    this.gamesGrid?.setGames(games);
  }
  
  /**
   * Shows auth modal
   */
  showAuth() {
    this.authModal?.open();
  }
  
  /**
   * Hides auth modal
   */
  hideAuth() {
    this.authModal?.close();
  }
  
  /**
   * Sets auth error
   * @param {string} message - Error message
   */
  setAuthError(message) {
    this.authModal?.showError(message);
  }
  
  /**
   * Shows toast notification
   * @param {string} message - Message to show
   * @param {string} type - 'success', 'error', 'info'
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('toast--visible');
    });
    
    // Remove after delay
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  /**
   * Emits an event
   * @param {string} name - Event name
   * @param {*} data - Event data
   */
  emit(name, data = null) {
    const event = new CustomEvent(`app:${name}`, {
      bubbles: true,
      detail: data
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Listens for app events
   * @param {string} name - Event name
   * @param {Function} handler - Event handler
   */
  on(name, handler) {
    document.addEventListener(`app:${name}`, (e) => {
      handler(e.detail);
    });
  }
  
  /**
   * Destroys the app and all components
   */
  destroy() {
    this.components.forEach(component => component.destroy());
    this.components.clear();
    keyboardManager.destroy();
  }
}

// Create singleton instance
export const app = new App();

// Also export as default for flexibility
export default App;
