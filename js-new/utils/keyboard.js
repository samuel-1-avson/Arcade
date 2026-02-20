/**
 * Keyboard Shortcuts & Navigation Utilities
 */

/**
 * Keyboard shortcut configuration
 */
export const SHORTCUTS = {
  // Global shortcuts
  SEARCH: { key: 'k', ctrl: true, description: 'Open search' },
  CLOSE: { key: 'Escape', description: 'Close modal/panel' },
  HELP: { key: '?', description: 'Show keyboard shortcuts' },
  
  // Navigation shortcuts
  GO_GAMES: { key: 'g', sequence: 'g', description: 'Go to games' },
  GO_TOURNAMENTS: { key: 't', sequence: 'g t', description: 'Go to tournaments' },
  GO_CHALLENGES: { key: 'c', sequence: 'g c', description: 'Go to challenges' },
  
  // Focus shortcuts
  FOCUS_SEARCH: { key: '/', description: 'Focus search' },
};

/**
 * Keyboard shortcut manager
 */
export class KeyboardManager {
  constructor() {
    this.shortcuts = new Map();
    this.sequence = [];
    this.sequenceTimeout = null;
    this.isEnabled = true;
    
    this.handleKeydown = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.handleKeydown);
  }
  
  /**
   * Registers a keyboard shortcut
   * @param {string} name - Shortcut name
   * @param {Object} config - Shortcut configuration
   * @param {Function} handler - Handler function
   */
  register(name, config, handler) {
    this.shortcuts.set(name, { ...config, handler });
  }
  
  /**
   * Unregisters a keyboard shortcut
   * @param {string} name - Shortcut name
   */
  unregister(name) {
    this.shortcuts.delete(name);
  }
  
  /**
   * Enables keyboard shortcuts
   */
  enable() {
    this.isEnabled = true;
  }
  
  /**
   * Disables keyboard shortcuts
   */
  disable() {
    this.isEnabled = false;
  }
  
  /**
   * Destroys the manager
   */
  destroy() {
    document.removeEventListener('keydown', this.handleKeydown);
    this.shortcuts.clear();
  }
  
  /**
   * Handles keydown events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeydown(e) {
    if (!this.isEnabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    if (e.target.matches('input, textarea, [contenteditable]')) {
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }
    
    // Check for matching shortcuts
    for (const [name, config] of this.shortcuts) {
      if (this.matchesShortcut(e, config)) {
        e.preventDefault();
        config.handler(e);
        return;
      }
    }
  }
  
  /**
   * Checks if event matches a shortcut configuration
   * @param {KeyboardEvent} e - Keyboard event
   * @param {Object} config - Shortcut configuration
   * @returns {boolean}
   */
  matchesShortcut(e, config) {
    // Check modifiers
    if (config.ctrl && !e.ctrlKey && !e.metaKey) return false;
    if (config.alt && !e.altKey) return false;
    if (config.shift && !e.shiftKey) return false;
    
    // Check key
    if (e.key.toLowerCase() !== config.key.toLowerCase()) return false;
    
    // Check that only required modifiers are pressed
    if (!config.ctrl && (e.ctrlKey || e.metaKey)) return false;
    if (!config.alt && e.altKey) return false;
    if (!config.shift && e.shiftKey) return false;
    
    return true;
  }
}

// Create singleton instance
export const keyboardManager = new KeyboardManager();

/**
 * Announces to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announce(message, priority = 'polite') {
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

/**
 * Navigates with arrow keys within a container
 * @param {HTMLElement} container - Container element
 * @param {string} selector - Selector for navigable items
 * @param {KeyboardEvent} e - Keyboard event
 */
export function handleArrowNavigation(container, selector, e) {
  const items = Array.from(container.querySelectorAll(selector));
  if (items.length === 0) return;
  
  const currentIndex = items.indexOf(document.activeElement);
  let nextIndex = currentIndex;
  
  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      e.preventDefault();
      nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      e.preventDefault();
      nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      break;
    case 'Home':
      e.preventDefault();
      nextIndex = 0;
      break;
    case 'End':
      e.preventDefault();
      nextIndex = items.length - 1;
      break;
  }
  
  if (nextIndex !== currentIndex) {
    items[nextIndex].focus();
  }
}
