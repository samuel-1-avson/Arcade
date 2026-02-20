/**
 * Top Bar Component
 * Main header with logo, search, user menu, and settings
 */

import { Component } from './Component.js';
import { $, trapFocus, preventBodyScroll, copyToClipboard } from '../utils/dom.js';
import { keyboardManager, announce } from '../utils/keyboard.js';
import { slideInRight, slideOutRight } from '../utils/animations.js';

/**
 * TopBar component managing header interactions
 */
export class TopBar extends Component {
  get defaultOptions() {
    return {
      onSearch: null,
      onSettingsOpen: null,
      onUserMenuToggle: null
    };
  }
  
  get defaultState() {
    return {
      isUserMenuOpen: false,
      isSearchFocused: false
    };
  }
  
  init() {
    // Cache DOM elements
    this.searchInput = $('.search-input__field', this.element);
    this.userAvatar = $('.topbar__avatar', this.element);
    this.userDropdown = $('.user-dropdown', this.element);
    this.settingsBtn = $('.topbar__settings', this.element);
    this.menuBtn = $('.topbar__menu', this.element);
    this.syncBtn = $('.topbar__sync', this.element);
    
    super.init();
    this.bindKeyboardShortcuts();
  }
  
  bindEvents() {
    // Search focus/blur
    if (this.searchInput) {
      this.on(this.searchInput, 'focus', () => {
        this.setState({ isSearchFocused: true });
      });
      
      this.on(this.searchInput, 'blur', () => {
        this.setState({ isSearchFocused: false });
      });
      
      this.on(this.searchInput, 'input', (e) => {
        this.emit('search', e.target.value);
      });
    }
    
    // User avatar click
    if (this.userAvatar) {
      this.on(this.userAvatar, 'click', () => {
        this.toggleUserMenu();
      });
    }
    
    // Settings button
    if (this.settingsBtn) {
      this.on(this.settingsBtn, 'click', () => {
        this.emit('settings:open');
      });
    }
    
    // Menu button (mobile)
    if (this.menuBtn) {
      this.on(this.menuBtn, 'click', () => {
        this.emit('menu:open');
      });
    }
    
    // Sync button
    if (this.syncBtn) {
      this.on(this.syncBtn, 'click', () => {
        this.emit('sync:click');
      });
    }
    
    // Close user menu on outside click
    this.on(document, 'click', (e) => {
      if (this.state.isUserMenuOpen && 
          !this.userAvatar?.contains(e.target) && 
          !this.userDropdown?.contains(e.target)) {
        this.closeUserMenu();
      }
    });
    
    // Close on Escape
    this.on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && this.state.isUserMenuOpen) {
        this.closeUserMenu();
      }
    });
  }
  
  bindKeyboardShortcuts() {
    // Focus search on /
    keyboardManager.register('focusSearch', 
      { key: '/' }, 
      () => {
        this.searchInput?.focus();
        announce('Search focused');
      }
    );
    
    // Focus search on Cmd/Ctrl+K
    keyboardManager.register('searchCmdK', 
      { key: 'k', ctrl: true }, 
      () => {
        this.searchInput?.focus();
        announce('Search focused');
      }
    );
  }
  
  /**
   * Toggles user dropdown menu
   */
  toggleUserMenu() {
    if (this.state.isUserMenuOpen) {
      this.closeUserMenu();
    } else {
      this.openUserMenu();
    }
  }
  
  /**
   * Opens user dropdown menu
   */
  openUserMenu() {
    if (!this.userDropdown) return;
    
    this.setState({ isUserMenuOpen: true });
    this.userDropdown.hidden = false;
    
    // Trap focus within dropdown
    this.untrapFocus = trapFocus(this.userDropdown);
    
    // Focus first item
    const firstItem = $('[role="menuitem"], button, a', this.userDropdown);
    firstItem?.focus();
    
    this.emit('usermenu:open');
  }
  
  /**
   * Closes user dropdown menu
   */
  closeUserMenu() {
    if (!this.userDropdown) return;
    
    this.setState({ isUserMenuOpen: false });
    this.userDropdown.hidden = true;
    
    // Release focus trap
    if (this.untrapFocus) {
      this.untrapFocus();
      this.untrapFocus = null;
    }
    
    // Return focus to avatar
    this.userAvatar?.focus();
    
    this.emit('usermenu:close');
  }
  
  /**
   * Updates sync status indicator
   * @param {string} status - 'online', 'offline', 'syncing', 'error'
   */
  setSyncStatus(status) {
    if (!this.syncBtn) return;
    
    // Remove existing status classes
    this.syncBtn.classList.remove(
      'topbar__sync--online',
      'topbar__sync--offline', 
      'topbar__sync--syncing',
      'topbar__sync--error'
    );
    
    // Add new status class
    this.syncBtn.classList.add(`topbar__sync--${status}`);
    
    // Update title
    const titles = {
      online: 'Online',
      offline: 'Offline',
      syncing: 'Syncing...',
      error: 'Sync error'
    };
    this.syncBtn.title = titles[status] || status;
  }
  
  /**
   * Updates user stats display
   * @param {Object} stats - Stats object
   */
  updateStats(stats) {
    const statsContainer = $('.topbar__stats', this.element);
    if (!statsContainer) return;
    
    // Update XP
    const xpElement = $('.topbar__stat-value', statsContainer);
    if (xpElement && stats.xp !== undefined) {
      xpElement.textContent = stats.xp.toLocaleString();
    }
  }
  
  /**
   * Updates user avatar
   * @param {string} avatar - Avatar emoji or URL
   */
  updateAvatar(avatar) {
    if (this.userAvatar) {
      this.userAvatar.textContent = avatar;
    }
  }
  
  render() {
    // Visual updates based on state
    if (this.searchInput) {
      this.searchInput.parentElement.classList.toggle(
        'search-input--focused',
        this.state.isSearchFocused
      );
    }
  }
  
  onDestroy() {
    keyboardManager.unregister('focusSearch');
    keyboardManager.unregister('searchCmdK');
    if (this.untrapFocus) {
      this.untrapFocus();
    }
  }
}
