/**
 * Integration Bridge
 * Connects the new UI components to the existing ArcadeHub infrastructure
 */

import { app } from '../App.js';
import { eventBus } from '../../js/engine/EventBus.js';

/**
 * Bridge class that adapts between old and new UI
 */
export class UIBridge {
  constructor(arcadeHub) {
    this.arcadeHub = arcadeHub;
    this.isInitialized = false;
    
    // Reference to existing services
    this.services = {
      auth: null,
      games: null,
      user: null,
      social: null,
      tournaments: null,
      settings: null
    };
  }
  
  /**
   * Initialize the bridge
   */
  async init() {
    if (this.isInitialized) return;
    
    console.log('🔗 Initializing UI Bridge...');
    
    // Wait for existing services to be ready
    await this.waitForServices();
    
    // Connect new UI to existing data
    this.connectData();
    
    // Bind events between old and new
    this.bindEvents();
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    this.isInitialized = true;
    console.log('✅ UI Bridge initialized');
  }
  
  /**
   * Wait for existing services to be available
   */
  async waitForServices() {
    // Wait for ArcadeHub to be fully initialized
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      if (window.arcadeHub) {
        this.services.arcadeHub = window.arcadeHub;
        this.services.auth = window.arcadeHub.auth;
        this.services.user = window.arcadeHub.dashboard;
        break;
      }
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    
    if (!this.services.arcadeHub) {
      console.warn('⚠️ ArcadeHub not found, running in standalone mode');
    }
  }
  
  /**
   * Connect existing data to new UI
   */
  connectData() {
    if (!this.services.arcadeHub) return;
    
    // Connect games data
    this.connectGames();
    
    // Connect user data
    this.connectUserData();
    
    // Connect social data
    this.connectSocialData();
    
    // Connect settings
    this.connectSettings();
  }
  
  /**
   * Connect games to new UI
   */
  connectGames() {
    const games = this.services.arcadeHub.games || [];
    
    // Transform to new format
    const transformedGames = games.map(game => ({
      id: game.id,
      title: game.title,
      description: game.description,
      category: this.getGameCategory(game.id),
      difficulty: game.difficulty || 'medium',
      icon: game.icon || '🎮',
      highScore: this.getHighScore(game.id),
      players: this.getPlayerCount(game.id),
      rating: game.rating || 5,
      path: game.path
    }));
    
    app.setGames(transformedGames);
  }
  
  /**
   * Connect user data to new UI
   */
  connectUserData() {
    const arcadeHub = this.services.arcadeHub;
    
    // Get user stats
    const stats = this.getUserStats();
    
    // Update new UI
    app.setUser({
      name: stats.name || 'Player',
      avatar: stats.avatar || '🎮',
      xp: stats.xp || 0,
      level: stats.level || 1,
      gamesPlayed: stats.gamesPlayed || 0,
      achievements: stats.achievements || 0,
      streak: stats.streak || 0
    });
    
    // Update top bar stats
    app.topBar?.updateStats({ xp: stats.xp || 0 });
  }
  
  /**
   * Connect social data to new UI
   */
  connectSocialData() {
    // Get friends list if available
    const friends = this.getFriendsList();
    app.socialPanel?.updateFriends(friends);
    
    // Get party info
    const party = this.getPartyInfo();
    app.socialPanel?.updateParty(party);
  }
  
  /**
   * Connect settings to new UI
   */
  connectSettings() {
    const settings = this.getSettings();
    
    // Apply settings to new UI
    Object.entries(settings).forEach(([key, value]) => {
      app.settingsPanel?.setSetting(key, value);
    });
  }
  
  /**
   * Bind events between old and new UI
   */
  bindEvents() {
    // Listen to new UI events and route to existing handlers
    this.bindUIEvents();
    
    // Listen to existing events and update new UI
    this.bindServiceEvents();
  }
  
  /**
   * Bind new UI events
   */
  bindUIEvents() {
    // Game launch
    app.on('game:launch', ({ gameId }) => {
      this.launchGame(gameId);
    });
    
    // Search
    app.on('search', (query) => {
      this.handleSearch(query);
    });
    
    // Navigation
    app.on('navigate', ({ view }) => {
      this.handleNavigation(view);
    });
    
    // Auth
    app.on('auth:signin', ({ email, password }) => {
      this.signIn(email, password);
    });
    
    app.on('auth:signup', ({ name, email, password }) => {
      this.signUp(name, email, password);
    });
    
    // Social
    app.on('party:create', () => {
      this.createParty();
    });
    
    app.on('party:join', ({ code }) => {
      this.joinParty(code);
    });
    
    app.on('friend:add', () => {
      this.addFriend();
    });
    
    // Settings
    app.on('setting:change', ({ id, value }) => {
      this.updateSetting(id, value);
    });
  }
  
  /**
   * Bind to existing service events
   */
  bindServiceEvents() {
    if (!eventBus) return;
    
    // Listen for auth events
    eventBus.on('userSignedIn', (user) => {
      app.setUser({
        name: user.displayName || 'Player',
        avatar: user.photoURL || '🎮',
        email: user.email
      });
      app.hideAuth();
    });
    
    eventBus.on('userSignedOut', () => {
      app.setUser(null);
    });
    
    // Listen for high score updates
    eventBus.on('HIGHSCORE_UPDATE', ({ gameId, score }) => {
      this.updateGameHighScore(gameId, score);
    });
    
    // Listen for sync status
    eventBus.on('syncStatusChanged', ({ status }) => {
      app.topBar?.setSyncStatus(status);
    });
  }
  
  /**
   * Launch a game
   * @param {string} gameId - Game ID
   */
  launchGame(gameId) {
    const game = this.services.arcadeHub?.games?.find(g => g.id === gameId);
    if (!game) {
      app.showToast('Game not found', 'error');
      return;
    }
    
    // Use existing game loader
    if (window.gameLoaderService) {
      window.gameLoaderService.loadGame(game);
    } else if (this.services.arcadeHub?.gameCards) {
      this.services.arcadeHub.gameCards.launchGame(game);
    }
    
    app.showToast(`Launching ${game.title}...`);
  }
  
  /**
   * Handle search
   * @param {string} query - Search query
   */
  handleSearch(query) {
    // Update URL or state
    const url = new URL(window.location);
    url.searchParams.set('search', query);
    window.history.pushState({}, '', url);
    
    // Filter games
    app.gamesGrid?.filterGames('all'); // Reset filter first
    
    const games = app.gamesGrid?.state.games || [];
    const filtered = games.filter(g => 
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      g.description.toLowerCase().includes(query.toLowerCase())
    );
    
    // Show results
    if (filtered.length === 0) {
      app.showToast('No games found', 'info');
    }
  }
  
  /**
   * Handle navigation
   * @param {string} view - View ID
   */
  handleNavigation(view) {
    switch (view) {
      case 'tournaments':
        this.services.arcadeHub?.loadLeaderboard?.('global');
        break;
      case 'challenges':
        this.services.arcadeHub?.setupDailyChallenges?.();
        break;
      case 'shop':
        this.services.arcadeHub?.setupShop?.();
        break;
    }
  }
  
  /**
   * Sign in user
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async signIn(email, password) {
    try {
      if (this.services.auth?.signIn) {
        await this.services.auth.signIn(email, password);
      } else if (window.firebaseService?.signIn) {
        await window.firebaseService.signIn(email, password);
      }
      app.hideAuth();
      app.showToast('Welcome back!', 'success');
    } catch (error) {
      app.setAuthError(error.message || 'Sign in failed');
    }
  }
  
  /**
   * Sign up user
   * @param {string} name - Display name
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async signUp(name, email, password) {
    try {
      if (this.services.auth?.signUp) {
        await this.services.auth.signUp(email, password, name);
      } else if (window.firebaseService?.signUp) {
        await window.firebaseService.signUp(email, password, name);
      }
      app.hideAuth();
      app.showToast('Account created!', 'success');
    } catch (error) {
      app.setAuthError(error.message || 'Sign up failed');
    }
  }
  
  /**
   * Create a party
   */
  createParty() {
    if (window.partyService?.createParty) {
      window.partyService.createParty();
      app.showToast('Party created!');
    }
  }
  
  /**
   * Join a party
   * @param {string} code - Party code
   */
  joinParty(code) {
    if (window.partyService?.joinParty) {
      window.partyService.joinParty(code);
      app.showToast('Joining party...');
    }
  }
  
  /**
   * Add a friend
   */
  addFriend() {
    const friendId = prompt('Enter friend ID:');
    if (friendId && window.friendsService?.sendRequest) {
      window.friendsService.sendRequest(friendId);
      app.showToast('Friend request sent');
    }
  }
  
  /**
   * Update a setting
   * @param {string} id - Setting ID
   * @param {*} value - Setting value
   */
  updateSetting(id, value) {
    // Map new setting IDs to old format
    const settingMap = {
      'sound-toggle': 'soundEnabled',
      'music-toggle': 'musicEnabled',
      'notifications-toggle': 'notificationsEnabled',
      'contrast-toggle': 'highContrast'
    };
    
    const oldKey = settingMap[id] || id;
    
    // Save to existing storage
    if (window.storageManager?.set) {
      window.storageManager.set(`setting_${oldKey}`, value);
    }
    
    // Apply setting
    this.applySetting(id, value);
  }
  
  /**
   * Apply a setting immediately
   * @param {string} id - Setting ID
   * @param {*} value - Setting value
   */
  applySetting(id, value) {
    switch (id) {
      case 'sound-toggle':
        if (window.audioService) {
          window.audioService.enabled = value;
        }
        break;
      case 'music-toggle':
        if (window.backgroundService) {
          window.backgroundService.setMusicEnabled(value);
        }
        break;
      case 'contrast-toggle':
        document.body.classList.toggle('high-contrast', value);
        break;
    }
  }
  
  /**
   * Update game high score display
   * @param {string} gameId - Game ID
   * @param {number} score - New score
   */
  updateGameHighScore(gameId, score) {
    // Find and update the card
    app.gamesGrid?.cardComponents?.forEach(card => {
      if (card.options.id === gameId) {
        card.updateHighScore(score);
      }
    });
    
    // Update user stats
    this.connectUserData();
  }
  
  // Helper methods for data transformation
  
  getGameCategory(gameId) {
    const categories = {
      snake: 'Classic',
      tetris: 'Classic',
      pacman: 'Classic',
      breakout: 'Classic',
      minesweeper: 'Puzzle',
      '2048': 'Puzzle',
      'tower-defense': 'Strategy',
      rhythm: 'Music',
      roguelike: 'RPG',
      asteroids: 'Action',
      toonshooter: 'Action'
    };
    return categories[gameId] || 'Arcade';
  }
  
  getHighScore(gameId) {
    if (window.storageManager?.getHighScore) {
      return window.storageManager.getHighScore(gameId) || 0;
    }
    if (window.globalStateManager?.getStatistics) {
      const stats = window.globalStateManager.getStatistics();
      return stats.gameStats?.[gameId]?.highScore || 0;
    }
    return 0;
  }
  
  getPlayerCount(gameId) {
    return 0;
  }
  
  getUserStats() {
    if (window.globalStateManager?.getStatistics) {
      const stats = window.globalStateManager.getStatistics();
      return {
        name: stats.name || 'Player',
        avatar: stats.avatar,
        xp: stats.totalXP || 0,
        level: stats.level || 1,
        gamesPlayed: stats.gamesPlayed || 0,
        achievements: stats.achievements?.length || 0,
        streak: stats.streak || 0
      };
    }
    return {};
  }
  
  getFriendsList() {
    if (window.friendsService?.getFriends) {
      return window.friendsService.getFriends();
    }
    return [];
  }
  
  getPartyInfo() {
    if (window.partyService?.getCurrentParty) {
      return window.partyService.getCurrentParty();
    }
    return null;
  }
  
  getSettings() {
    const settings = {};
    
    if (window.storageManager?.get) {
      settings['sound-toggle'] = window.storageManager.get('setting_soundEnabled') !== false;
      settings['music-toggle'] = window.storageManager.get('setting_musicEnabled') !== false;
      settings['notifications-toggle'] = window.storageManager.get('setting_notificationsEnabled') !== false;
      settings['contrast-toggle'] = window.storageManager.get('setting_highContrast') === true;
    }
    
    return settings;
  }
  
  setupKeyboardShortcuts() {
    // Game launch shortcut
    document.addEventListener('keydown', (e) => {
      if (e.key === 'g' && e.ctrlKey) {
        e.preventDefault();
        const firstGame = app.gamesGrid?.state.filteredGames[0];
        if (firstGame) {
          app.launchGame(firstGame.id);
        }
      }
    });
  }
}

// Export singleton
export const bridge = new UIBridge();
