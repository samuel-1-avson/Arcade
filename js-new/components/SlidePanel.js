/**
 * Slide Panel Component
 * Slide-in panels for Social Hub and Settings
 */

import { Component } from './Component.js';
import { $, trapFocus, preventBodyScroll } from '../utils/dom.js';
import { slideInRight, slideOutRight } from '../utils/animations.js';
import { announce } from '../utils/keyboard.js';

/**
 * SlidePanel component for side panels
 */
export class SlidePanel extends Component {
  get defaultOptions() {
    return {
      side: 'right', // 'left' or 'right'
      width: '360px',
      closeOnOverlayClick: true,
      closeOnEscape: true,
      trapFocus: true,
      preventBodyScroll: true
    };
  }
  
  get defaultState() {
    return {
      isOpen: false
    };
  }
  
  init() {
    // Create overlay if it doesn't exist
    this.overlay = $(`.panel-overlay[data-panel="${this.element.id}"]`);
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'panel-overlay';
      this.overlay.dataset.panel = this.element.id;
      this.element.parentNode.insertBefore(this.overlay, this.element);
    }
    
    this.closeBtn = $('.panel__close', this.element);
    
    super.init();
  }
  
  bindEvents() {
    // Close button
    if (this.closeBtn) {
      this.on(this.closeBtn, 'click', () => {
        this.close();
      });
    }
    
    // Overlay click
    if (this.options.closeOnOverlayClick) {
      this.on(this.overlay, 'click', () => {
        this.close();
      });
    }
    
    // Escape key
    if (this.options.closeOnEscape) {
      this.on(document, 'keydown', (e) => {
        if (e.key === 'Escape' && this.state.isOpen) {
          this.close();
        }
      });
    }
    
    // Swipe to close on mobile
    this.bindSwipe();
  }
  
  bindSwipe() {
    let startX = 0;
    let currentX = 0;
    
    this.on(this.element, 'touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    
    this.on(this.element, 'touchmove', (e) => {
      if (!this.state.isOpen) return;
      currentX = e.touches[0].clientX;
      
      const diff = this.options.side === 'right' 
        ? currentX - startX 
        : startX - currentX;
      
      if (diff > 0) {
        const translate = Math.min(diff, 100);
        this.element.style.transform = `translateX(${this.options.side === 'right' ? '' : '-'}${translate}px)`;
      }
    }, { passive: true });
    
    this.on(this.element, 'touchend', () => {
      if (!this.state.isOpen) return;
      
      const diff = this.options.side === 'right' 
        ? currentX - startX 
        : startX - currentX;
      
      if (diff > 100) {
        this.close();
      } else {
        this.element.style.transform = '';
      }
      
      startX = 0;
      currentX = 0;
    });
  }
  
  /**
   * Opens the panel
   */
  open() {
    if (this.state.isOpen) return;
    
    this.setState({ isOpen: true });
    
    // Show overlay
    this.overlay.classList.add('panel-overlay--visible');
    
    // Animate panel
    this.element.classList.add('panel--visible');
    
    // Trap focus
    if (this.options.trapFocus) {
      this.untrapFocus = trapFocus(this.element);
    }
    
    // Prevent body scroll
    if (this.options.preventBodyScroll) {
      this.restoreBodyScroll = preventBodyScroll();
    }
    
    // Focus close button
    this.closeBtn?.focus();
    
    // Announce to screen readers
    const title = $('.panel__title', this.element)?.textContent;
    announce(`${title} panel opened`);
    
    this.emit('open');
  }
  
  /**
   * Closes the panel
   */
  close() {
    if (!this.state.isOpen) return;
    
    this.setState({ isOpen: false });
    
    // Animate out
    this.element.classList.remove('panel--visible');
    
    // Hide overlay
    this.overlay.classList.remove('panel-overlay--visible');
    
    // Release focus trap
    if (this.untrapFocus) {
      this.untrapFocus();
      this.untrapFocus = null;
    }
    
    // Restore body scroll
    if (this.restoreBodyScroll) {
      this.restoreBodyScroll();
      this.restoreBodyScroll = null;
    }
    
    this.emit('close');
  }
  
  /**
   * Toggles the panel
   */
  toggle() {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  onDestroy() {
    this.close();
  }
}

/**
 * SocialPanel specialized component
 */
export class SocialPanel extends SlidePanel {
  get defaultOptions() {
    return {
      ...super.defaultOptions,
      side: 'right'
    };
  }
  
  init() {
    super.init();
    
    // Cache social-specific elements
    this.partyCreateBtn = $('#create-party-btn', this.element);
    this.partyJoinBtn = $('#join-party-btn', this.element);
    this.addFriendBtn = $('#add-friend-btn', this.element);
  }
  
  bindEvents() {
    super.bindEvents();
    
    // Party actions
    this.partyCreateBtn?.addEventListener('click', () => {
      this.emit('party:create');
    });
    
    this.partyJoinBtn?.addEventListener('click', () => {
      this.emit('party:join');
    });
    
    // Friend actions
    this.addFriendBtn?.addEventListener('click', () => {
      this.emit('friend:add');
    });
    
    // Delegate for friend items
    this.delegate('.friend-item', 'click', (e, target) => {
      const friendId = target.dataset.friendId;
      if (friendId) {
        this.emit('friend:select', { friendId });
      }
    });
  }
  
  /**
   * Updates party status display
   * @param {Object} party - Party data
   */
  updateParty(party) {
    const statusEl = $('.party-widget__status', this.element);
    if (statusEl) {
      statusEl.textContent = party ? 'In Party' : 'Solo';
      statusEl.classList.toggle('party-widget__status--active', !!party);
    }
    
    // Update members list
    const membersList = $('.party-members', this.element);
    if (membersList && party?.members) {
      // Render members
    }
  }
  
  /**
   * Updates friends list
   * @param {Array} friends - Friends array
   */
  updateFriends(friends) {
    const list = $('.friends-list__content', this.element);
    if (!list) return;
    
    // Update count
    const onlineCount = friends.filter(f => f.status === 'online').length;
    const countEl = $('.friends-list__count', this.element);
    if (countEl) {
      countEl.textContent = onlineCount;
    }
    
    // Render friends
    list.innerHTML = friends.map(friend => `
      <div class="friend-item" data-friend-id="${friend.id}">
        <div class="friend-item__avatar">
          ${friend.avatar}
          <span class="friend-item__status friend-item__status--${friend.status}"></span>
        </div>
        <div class="friend-item__info">
          <div class="friend-item__name">${friend.name}</div>
          <div class="friend-item__activity">${friend.activity || friend.status}</div>
        </div>
      </div>
    `).join('');
  }
}

/**
 * SettingsPanel specialized component
 */
export class SettingsPanel extends SlidePanel {
  get defaultOptions() {
    return {
      ...super.defaultOptions,
      side: 'right'
    };
  }
  
  init() {
    super.init();
    
    this.settings = new Map();
  }
  
  bindEvents() {
    super.bindEvents();
    
    // Toggle switches
    this.delegate('.toggle__input', 'change', (e, target) => {
      const settingId = target.id;
      const value = target.checked;
      this.setSetting(settingId, value);
    });
    
    // Select inputs
    this.delegate('select', 'change', (e, target) => {
      const settingId = target.id;
      const value = target.value;
      this.setSetting(settingId, value);
    });
  }
  
  /**
   * Sets a setting value
   * @param {string} id - Setting ID
   * @param {*} value - Setting value
   */
  setSetting(id, value) {
    this.settings.set(id, value);
    this.emit('setting:change', { id, value });
    
    // Apply setting immediately if applicable
    this.applySetting(id, value);
  }
  
  /**
   * Applies a setting to the UI
   * @param {string} id - Setting ID
   * @param {*} value - Setting value
   */
  applySetting(id, value) {
    switch (id) {
      case 'sound-toggle':
        document.body.classList.toggle('sound-disabled', !value);
        break;
      case 'music-toggle':
        document.body.classList.toggle('music-disabled', !value);
        break;
      case 'contrast-toggle':
        document.body.classList.toggle('high-contrast', value);
        break;
    }
  }
  
  /**
   * Gets current settings
   * @returns {Object}
   */
  getSettings() {
    return Object.fromEntries(this.settings);
  }
}
