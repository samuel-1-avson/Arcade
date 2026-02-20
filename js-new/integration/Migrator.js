/**
 * UI Migrator
 * Handles migration from old UI to new UI
 */

import { app } from '../App.js';
import { bridge } from './Bridge.js';

/**
 * UI Migration helper
 */
export class UIMigrator {
  constructor() {
    this.oldUI = null;
    this.newUI = null;
    this.migrationState = {
      isMigrated: false,
      elementsHidden: [],
      listenersRemoved: []
    };
  }
  
  /**
   * Initialize migration
   */
  async migrate() {
    console.log('🔄 Starting UI Migration...');
    
    // 1. Capture old UI state
    this.captureOldState();
    
    // 2. Hide old UI elements
    this.hideOldUI();
    
    // 3. Initialize new UI
    await this.initializeNewUI();
    
    // 4. Transfer data
    await this.transferData();
    
    // 5. Connect bridge
    await bridge.init();
    
    this.migrationState.isMigrated = true;
    console.log('✅ UI Migration complete');
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('ui:migrated'));
  }
  
  /**
   * Capture current state of old UI
   */
  captureOldState() {
    this.oldUI = {
      // Current view/section
      currentSection: document.querySelector('.nav-item.active')?.dataset.section || 'home',
      
      // Open modals
      openModals: Array.from(document.querySelectorAll('.modal:not(.hidden)')).map(m => m.id),
      
      // Sidebar state
      sidebarOpen: document.getElementById('hub-sidebar')?.classList.contains('open'),
      
      // Active filters
      activeFilter: document.querySelector('.filter-tab.active')?.dataset.filter || 'all',
      
      // Scroll positions
      scrollPositions: {
        games: document.querySelector('.games-grid')?.scrollTop || 0,
        main: window.scrollY
      }
    };
    
    console.log('📸 Captured old UI state:', this.oldUI);
  }
  
  /**
   * Hide old UI elements
   */
  hideOldUI() {
    const selectorsToHide = [
      '.hub-header',           // Old header
      '.hub-nav',              // Old nav
      '.hub-sidebar',          // Left sidebar
      '.hub-sidebar-right',    // Right sidebar
      '.bottom-nav',           // Old bottom nav
      '.filter-tabs',          // Old filter tabs
      '.hero-section',         // Old hero (we have new one)
      '.dashboard-grid',       // Old dashboard (we have new one)
      '#story-menu',           // Story overlay
      '.modal:not(#auth-modal)' // Old modals except auth
    ];
    
    selectorsToHide.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.id !== 'auth-modal') { // Keep auth modal for now
          el.style.display = 'none';
          el.setAttribute('data-migrated', 'true');
          this.migrationState.elementsHidden.push(el);
        }
      });
    });
    
    // Add migration class to body
    document.body.classList.add('ui-migrated');
  }
  
  /**
   * Restore old UI (rollback)
   */
  rollback() {
    console.log('↩️ Rolling back to old UI...');
    
    // Show hidden elements
    this.migrationState.elementsHidden.forEach(el => {
      el.style.display = '';
      el.removeAttribute('data-migrated');
    });
    
    // Hide new UI
    document.querySelectorAll('[data-new-ui]').forEach(el => {
      el.style.display = 'none';
    });
    
    // Remove migration class
    document.body.classList.remove('ui-migrated');
    
    this.migrationState.isMigrated = false;
    console.log('✅ Rollback complete');
  }
  
  /**
   * Initialize new UI elements
   */
  async initializeNewUI() {
    // The new UI is already in the HTML (prototype-new-ui.html)
    // Just ensure it's visible
    document.querySelectorAll('[data-new-ui]').forEach(el => {
      el.style.display = '';
    });
  }
  
  /**
   * Transfer data from old to new
   */
  async transferData() {
    // Transfer user data
    await this.transferUserData();
    
    // Transfer game data
    await this.transferGameData();
    
    // Transfer settings
    await this.transferSettings();
  }
  
  /**
   * Transfer user data
   */
  async transferUserData() {
    // Get from old UI
    const oldName = document.getElementById('profile-name')?.textContent || 'Player';
    const oldXp = document.getElementById('total-score')?.textContent || '0';
    
    // Set in new UI
    app.setUser({
      name: oldName,
      xp: parseInt(oldXp.replace(/,/g, '')) || 0
    });
  }
  
  /**
   * Transfer game data
   */
  async transferGameData() {
    // Games are already in the registry, just need to get high scores
    const games = app.gamesGrid?.state.games || [];
    
    games.forEach(game => {
      const highScore = this.getHighScoreFromOldUI(game.id);
      if (highScore > 0) {
        game.highScore = highScore;
      }
    });
    
    // Refresh display
    app.gamesGrid?.render();
  }
  
  /**
   * Transfer settings
   */
  async transferSettings() {
    // Get sound setting
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
      app.settingsPanel?.setSetting('sound-toggle', soundToggle.checked);
    }
    
    // Get music setting
    const musicToggle = document.getElementById('music-toggle');
    if (musicToggle) {
      app.settingsPanel?.setSetting('music-toggle', musicToggle.checked);
    }
  }
  
  /**
   * Get high score from old UI
   * @param {string} gameId - Game ID
   * @returns {number}
   */
  getHighScoreFromOldUI(gameId) {
    // Try to find in old dashboard
    const oldCards = document.querySelectorAll('.game-card');
    for (const card of oldCards) {
      if (card.dataset.gameId === gameId) {
        const scoreEl = card.querySelector('.game-card-highscore .score');
        if (scoreEl) {
          return parseInt(scoreEl.textContent.replace(/,/g, '')) || 0;
        }
      }
    }
    return 0;
  }
  
  /**
   * Check if migration is active
   * @returns {boolean}
   */
  isMigrated() {
    return this.migrationState.isMigrated;
  }
}

// Export singleton
export const migrator = new UIMigrator();
