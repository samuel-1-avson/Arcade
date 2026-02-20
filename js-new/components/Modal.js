/**
 * Modal Component
 * Accessible modal dialog component
 */

import { Component } from './Component.js';
import { $, trapFocus, preventBodyScroll } from '../utils/dom.js';
import { announce } from '../utils/keyboard.js';

/**
 * Modal component for dialogs
 */
export class Modal extends Component {
  get defaultOptions() {
    return {
      closeOnOverlayClick: true,
      closeOnEscape: true,
      trapFocus: true,
      preventBodyScroll: true,
      size: 'md', // sm, md, lg, xl, full
      animation: 'scale' // scale, slide-up
    };
  }
  
  get defaultState() {
    return {
      isOpen: false,
      isLoading: false
    };
  }
  
  init() {
    this.overlay = $('.modal-overlay', this.element);
    this.modal = $('.modal', this.element);
    this.closeBtn = $('.modal__close', this.element);
    this.trigger = null; // Element that triggered the modal
    
    super.init();
  }
  
  bindEvents() {
    // Close button
    this.closeBtn?.addEventListener('click', () => {
      this.close();
    });
    
    // Overlay click
    if (this.options.closeOnOverlayClick) {
      this.on(this.overlay, 'click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }
    
    // Close on escape
    if (this.options.closeOnEscape) {
      this.on(document, 'keydown', (e) => {
        if (e.key === 'Escape' && this.state.isOpen) {
          this.close();
        }
      });
    }
  }
  
  /**
   * Opens the modal
   * @param {HTMLElement} trigger - Element that triggered the modal
   */
  open(trigger = null) {
    if (this.state.isOpen) return;
    
    this.trigger = trigger;
    this.setState({ isOpen: true });
    
    // Show overlay
    this.overlay.classList.add('modal-overlay--visible');
    
    // Show modal with animation
    this.modal.classList.add('modal--visible');
    
    // Prevent body scroll
    if (this.options.preventBodyScroll) {
      this.restoreBodyScroll = preventBodyScroll();
    }
    
    // Trap focus
    if (this.options.trapFocus) {
      this.untrapFocus = trapFocus(this.modal);
    }
    
    // Focus first focusable element or close button
    const focusable = $('[autofocus]', this.modal) || 
                      $('button, input, select, textarea', this.modal) ||
                      this.closeBtn;
    focusable?.focus();
    
    // Announce to screen readers
    const title = $('.modal__title', this.modal)?.textContent;
    if (title) {
      announce(`${title} dialog opened`);
    }
    
    this.emit('open');
  }
  
  /**
   * Closes the modal
   */
  close() {
    if (!this.state.isOpen) return;
    
    this.setState({ isOpen: false });
    
    // Hide modal
    this.modal.classList.remove('modal--visible');
    
    // Hide overlay
    this.overlay.classList.remove('modal-overlay--visible');
    
    // Restore body scroll
    if (this.restoreBodyScroll) {
      this.restoreBodyScroll();
      this.restoreBodyScroll = null;
    }
    
    // Release focus trap
    if (this.untrapFocus) {
      this.untrapFocus();
      this.untrapFocus = null;
    }
    
    // Return focus to trigger
    this.trigger?.focus();
    this.trigger = null;
    
    this.emit('close');
  }
  
  /**
   * Shows loading state
   * @param {boolean} loading - Whether loading
   */
  setLoading(loading) {
    this.setState({ isLoading: loading });
    this.modal.classList.toggle('modal--loading', loading);
  }
  
  /**
   * Updates modal content
   * @param {string} html - New HTML content
   */
  setContent(html) {
    const content = $('.modal__content', this.modal);
    if (content) {
      content.innerHTML = html;
    }
  }
  
  onDestroy() {
    this.close();
  }
}

/**
 * Specialized Auth Modal
 */
export class AuthModal extends Modal {
  get defaultOptions() {
    return {
      ...super.defaultOptions,
      size: 'lg'
    };
  }
  
  get defaultState() {
    return {
      ...super.defaultState,
      activeTab: 'signin' // signin or signup
    };
  }
  
  init() {
    super.init();
    
    this.signinTab = $('[data-tab="signin"]', this.element);
    this.signupTab = $('[data-tab="signup"]', this.element);
    this.signinForm = $('#signin-form', this.element);
    this.signupForm = $('#signup-form', this.element);
  }
  
  bindEvents() {
    super.bindEvents();
    
    // Tab switching
    this.signinTab?.addEventListener('click', () => {
      this.switchTab('signin');
    });
    
    this.signupTab?.addEventListener('click', () => {
      this.switchTab('signup');
    });
    
    // Form submissions
    this.signinForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignin();
    });
    
    this.signupForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignup();
    });
  }
  
  switchTab(tab) {
    this.setState({ activeTab: tab });
    
    this.signinTab?.classList.toggle('auth-tab--active', tab === 'signin');
    this.signupTab?.classList.toggle('auth-tab--active', tab === 'signup');
    
    this.signinForm?.classList.toggle('auth-form--active', tab === 'signin');
    this.signupForm?.classList.toggle('auth-form--active', tab === 'signup');
  }
  
  handleSignin() {
    const email = $('#signin-email', this.element)?.value;
    const password = $('#signin-password', this.element)?.value;
    
    this.setLoading(true);
    
    // Emit event for auth handling
    this.emit('auth:signin', { email, password });
  }
  
  handleSignup() {
    const name = $('#signup-name', this.element)?.value;
    const email = $('#signup-email', this.element)?.value;
    const password = $('#signup-password', this.element)?.value;
    
    this.setLoading(true);
    
    // Emit event for auth handling
    this.emit('auth:signup', { name, email, password });
  }
  
  /**
   * Shows auth error
   * @param {string} message - Error message
   */
  showError(message) {
    this.setLoading(false);
    // Display error in form
    const form = this.state.activeTab === 'signin' ? this.signinForm : this.signupForm;
    const errorEl = $('.auth-error', form);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  }
}
