/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

/**
 * Creates an element with attributes and children
 * @param {string} tag - Element tag name
 * @param {Object} attrs - Attributes object
 * @param {Array} children - Child elements or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      el.appendChild(child);
    }
  });
  
  return el;
}

/**
 * Finds elements matching selector within context
 * @param {string} selector - CSS selector
 * @param {HTMLElement} context - Search context (default: document)
 * @returns {HTMLElement|null}
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Finds all elements matching selector within context
 * @param {string} selector - CSS selector
 * @param {HTMLElement} context - Search context (default: document)
 * @returns {NodeListOf<HTMLElement>}
 */
export function $$(selector, context = document) {
  return context.querySelectorAll(selector);
}

/**
 * Toggles a class on an element
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class to toggle
 * @param {boolean} force - Force add or remove
 */
export function toggleClass(element, className, force) {
  if (force === undefined) {
    element.classList.toggle(className);
  } else {
    element.classList.toggle(className, force);
  }
}

/**
 * Adds event listener with automatic cleanup
 * @param {HTMLElement} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 * @returns {Function} Cleanup function
 */
export function on(element, event, handler, options = {}) {
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

/**
 * Delegates event to child elements
 * @param {HTMLElement} parent - Parent element
 * @param {string} selector - Child selector
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @returns {Function} Cleanup function
 */
export function delegate(parent, selector, event, handler) {
  const wrappedHandler = (e) => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, e);
    }
  };
  
  parent.addEventListener(event, wrappedHandler);
  return () => parent.removeEventListener(event, wrappedHandler);
}

/**
 * Traps focus within an element (for modals/dialogs)
 * @param {HTMLElement} element - Container element
 * @returns {Function} Cleanup function
 */
export function trapFocus(element) {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  
  const focusableElements = Array.from(element.querySelectorAll(focusableSelectors));
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleKeydown = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };
  
  element.addEventListener('keydown', handleKeydown);
  firstElement?.focus();
  
  return () => element.removeEventListener('keydown', handleKeydown);
}

/**
 * Gets the scrollbar width
 * @returns {number}
 */
export function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

/**
 * Prevents body scroll (for modals)
 * @returns {Function} Cleanup function to restore scroll
 */
export function preventBodyScroll() {
  const scrollBarWidth = getScrollbarWidth();
  const originalPadding = document.body.style.paddingRight;
  const originalOverflow = document.body.style.overflow;
  
  document.body.style.paddingRight = `${scrollBarWidth}px`;
  document.body.style.overflow = 'hidden';
  
  return () => {
    document.body.style.paddingRight = originalPadding;
    document.body.style.overflow = originalOverflow;
  };
}

/**
 * Checks if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} offset - Offset in pixels
 * @returns {boolean}
 */
export function isInViewport(element, offset = 0) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Intersection Observer helper
 * @param {HTMLElement} element - Element to observe
 * @param {Function} callback - Callback when intersection changes
 * @param {Object} options - Observer options
 * @returns {IntersectionObserver}
 */
export function observeIntersection(element, callback, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => callback(entry));
  }, {
    threshold: 0,
    rootMargin: '0px',
    ...options
  });
  
  observer.observe(element);
  return observer;
}

/**
 * Generates a unique ID
 * @param {string} prefix - ID prefix
 * @returns {string}
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}
