/**
 * Navigation Pills Component
 * Horizontal navigation with active state management
 */

import { Component } from './Component.js';
import { $$ } from '../utils/dom.js';
import { keyboardManager, handleArrowNavigation } from '../utils/keyboard.js';

/**
 * NavigationPills component for main navigation
 */
export class NavigationPills extends Component {
  get defaultOptions() {
    return {
      pills: [
        { id: 'all', label: 'All Games', icon: 'gamepad' },
        { id: 'favorites', label: 'Favorites', icon: 'star' },
        { id: 'tournaments', label: 'Tournaments', icon: 'trophy' },
        { id: 'challenges', label: 'Challenges', icon: 'target' },
        { id: 'social', label: 'Social', icon: 'users' },
        { id: 'shop', label: 'Shop', icon: 'shopping-cart' }
      ],
      defaultActive: 'all'
    };
  }
  
  get defaultState() {
    return {
      activeId: this.options.defaultActive
    };
  }
  
  init() {
    this.pills = $$('.pill', this.element);
    
    if (this.pills.length === 0) {
      this.render();
    } else {
      super.init();
    }
    
    this.bindKeyboardShortcuts();
  }
  
  bindEvents() {
    // Click on pills
    this.pills.forEach(pill => {
      this.on(pill, 'click', () => {
        const id = pill.dataset.id;
        if (id) {
          this.activate(id);
        }
      });
    });
    
    // Keyboard navigation
    this.on(this.element, 'keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        handleArrowNavigation(this.element, '.pill', e);
      }
    });
  }
  
  bindKeyboardShortcuts() {
    // Navigate with keyboard
    keyboardManager.register('navGames', { key: 'g', ctrl: true }, () => {
      this.activate('all');
    });
  }
  
  /**
   * Activates a pill by ID
   * @param {string} id - Pill ID
   */
  activate(id) {
    if (id === this.state.activeId) return;
    
    const prevId = this.state.activeId;
    this.setState({ activeId: id });
    
    this.emit('change', { id, prevId });
  }
  
  render() {
    // Update active states
    this.pills.forEach(pill => {
      const isActive = pill.dataset.id === this.state.activeId;
      pill.classList.toggle('pill--active', isActive);
      pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
      pill.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }
  
  /**
   * Gets the currently active pill ID
   * @returns {string}
   */
  getActiveId() {
    return this.state.activeId;
  }
  
  /**
   * Sets a badge on a pill
   * @param {string} id - Pill ID
   * @param {number|string} badge - Badge content
   */
  setBadge(id, badge) {
    const pill = Array.from(this.pills).find(p => p.dataset.id === id);
    if (!pill) return;
    
    let badgeEl = $('.pill__badge', pill);
    
    if (badge) {
      if (!badgeEl) {
        badgeEl = document.createElement('span');
        badgeEl.className = 'pill__badge';
        pill.appendChild(badgeEl);
      }
      badgeEl.textContent = badge;
    } else if (badgeEl) {
      badgeEl.remove();
    }
  }
  
  onDestroy() {
    keyboardManager.unregister('navGames');
  }
}

/**
 * BottomNav component for mobile navigation
 */
export class BottomNav extends Component {
  get defaultOptions() {
    return {
      items: [
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'games', label: 'Games', icon: 'gamepad' },
        { id: 'social', label: 'Social', icon: 'users' },
        { id: 'shop', label: 'Shop', icon: 'shopping-cart' }
      ],
      defaultActive: 'home'
    };
  }
  
  get defaultState() {
    return {
      activeId: this.options.defaultActive
    };
  }
  
  init() {
    this.items = $$('.bottom-nav__item', this.element);
    super.init();
  }
  
  bindEvents() {
    this.items.forEach(item => {
      this.on(item, 'click', (e) => {
        e.preventDefault();
        const id = item.dataset.id;
        if (id) {
          this.activate(id);
        }
      });
    });
    
    // Play button
    const playBtn = $('.bottom-nav__play-btn', this.element);
    if (playBtn) {
      this.on(playBtn, 'click', (e) => {
        e.stopPropagation();
        this.emit('play:click');
      });
    }
  }
  
  /**
   * Activates an item by ID
   * @param {string} id - Item ID
   */
  activate(id) {
    if (id === this.state.activeId) return;
    
    this.setState({ activeId: id });
    this.emit('change', { id });
  }
  
  render() {
    this.items.forEach(item => {
      const isActive = item.dataset.id === this.state.activeId;
      item.classList.toggle('bottom-nav__item--active', isActive);
    });
  }
  
  /**
   * Shows a notification badge on an item
   * @param {string} id - Item ID
   * @param {boolean} show - Whether to show badge
   */
  showBadge(id, show = true) {
    const item = Array.from(this.items).find(i => i.dataset.id === id);
    if (item) {
      item.classList.toggle('has-badge', show);
    }
  }
}
