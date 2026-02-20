/**
 * Mobile Menu Component
 * Slide-out menu for mobile navigation
 */

import { Component } from './Component.js';
import { $, trapFocus } from '../utils/dom.js';
import { announce } from '../utils/keyboard.js';

/**
 * MobileMenu component for mobile navigation
 */
export class MobileMenu extends Component {
  get defaultOptions() {
    return {
      closeOnOverlayClick: true,
      closeOnEscape: true,
      trapFocus: true
    };
  }
  
  get defaultState() {
    return {
      isOpen: false
    };
  }
  
  init() {
    this.overlay = $('.mobile-menu', this.element);
    this.content = $('.mobile-menu__content', this.element);
    this.closeBtn = $('.mobile-menu__close', this.element);
    this.trigger = $('.topbar__menu'); // Menu button in topbar
    
    super.init();
  }
  
  bindEvents() {
    // Trigger button (in topbar)
    this.trigger?.addEventListener('click', () => {
      this.open();
    });
    
    // Close button
    this.closeBtn?.addEventListener('click', () => {
      this.close();
    });
    
    // Overlay click
    if (this.options.closeOnOverlayClick) {
      this.on(this.element, 'click', (e) => {
        if (e.target === this.element) {
          this.close();
        }
      });
    }
    
    // Menu item clicks
    this.delegate('.mobile-menu__item', 'click', (e, target) => {
      const id = target.dataset.id;
      if (id) {
        this.emit('navigate', { id });
        this.close();
      }
    });
    
    // Swipe to close
    this.bindSwipe();
  }
  
  bindSwipe() {
    let startX = 0;
    let currentX = 0;
    
    this.on(this.content, 'touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    
    this.on(this.content, 'touchmove', (e) => {
      if (!this.state.isOpen) return;
      currentX = e.touches[0].clientX;
      
      // Only allow swiping left to close
      const diff = startX - currentX;
      if (diff > 0) {
        const translate = Math.min(diff, 100);
        this.content.style.transform = `translateX(-${translate}px)`;
      }
    }, { passive: true });
    
    this.on(this.content, 'touchend', () => {
      if (!this.state.isOpen) return;
      
      const diff = startX - currentX;
      if (diff > 100) {
        this.close();
      } else {
        this.content.style.transform = '';
      }
      
      startX = 0;
      currentX = 0;
    });
  }
  
  /**
   * Opens the mobile menu
   */
  open() {
    if (this.state.isOpen) return;
    
    this.setState({ isOpen: true });
    
    // Show menu
    this.element.classList.add('mobile-menu--visible');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Trap focus
    if (this.options.trapFocus) {
      this.untrapFocus = trapFocus(this.content);
    }
    
    // Focus close button
    this.closeBtn?.focus();
    
    announce('Menu opened');
    this.emit('open');
  }
  
  /**
   * Closes the mobile menu
   */
  close() {
    if (!this.state.isOpen) return;
    
    this.setState({ isOpen: false });
    
    // Hide menu
    this.element.classList.remove('mobile-menu--visible');
    this.content.style.transform = '';
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Release focus trap
    if (this.untrapFocus) {
      this.untrapFocus();
      this.untrapFocus = null;
    }
    
    // Return focus to trigger
    this.trigger?.focus();
    
    this.emit('close');
  }
  
  /**
   * Toggles the menu
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
