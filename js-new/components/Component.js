/**
 * Base Component Class
 * All UI components extend this class
 */

import { $ } from '../utils/dom.js';

/**
 * Base class for all UI components
 */
export class Component {
  /**
   * @param {HTMLElement|string} element - Element or selector
   * @param {Object} options - Component options
   */
  constructor(element, options = {}) {
    this.element = typeof element === 'string' ? $(element) : element;
    this.options = { ...this.defaultOptions, ...options };
    this.state = { ...this.defaultState };
    this.listeners = [];
    this.isDestroyed = false;
    
    if (this.element) {
      this.init();
    }
  }
  
  /**
   * Default options - override in subclasses
   */
  get defaultOptions() {
    return {};
  }
  
  /**
   * Default state - override in subclasses
   */
  get defaultState() {
    return {};
  }
  
  /**
   * Initialize the component - override in subclasses
   */
  init() {
    this.bindEvents();
  }
  
  /**
   * Bind event listeners - override in subclasses
   */
  bindEvents() {
    // Override in subclasses
  }
  
  /**
   * Sets component state
   * @param {Object} newState - New state properties
   * @param {boolean} shouldRender - Whether to trigger render
   */
  setState(newState, shouldRender = true) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    if (shouldRender) {
      this.render();
    }
    
    this.onStateChange(this.state, prevState);
  }
  
  /**
   * Called when state changes - override in subclasses
   * @param {Object} state - Current state
   * @param {Object} prevState - Previous state
   */
  onStateChange(state, prevState) {
    // Override in subclasses
  }
  
  /**
   * Renders the component - override in subclasses
   */
  render() {
    // Override in subclasses
  }
  
  /**
   * Adds event listener with automatic tracking
   * @param {HTMLElement} element - Target element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   */
  on(element, event, handler, options = {}) {
    const boundHandler = handler.bind(this);
    element.addEventListener(event, boundHandler, options);
    this.listeners.push({ element, event, handler: boundHandler, options });
    return boundHandler;
  }
  
  /**
   * Adds delegated event listener
   * @param {string} selector - Child selector
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  delegate(selector, event, handler) {
    const boundHandler = (e) => {
      const target = e.target.closest(selector);
      if (target && this.element.contains(target)) {
        handler.call(this, e, target);
      }
    };
    
    this.element.addEventListener(event, boundHandler);
    this.listeners.push({ 
      element: this.element, 
      event, 
      handler: boundHandler,
      options: {}
    });
  }
  
  /**
   * Emits a custom event
   * @param {string} name - Event name
   * @param {*} detail - Event detail
   */
  emit(name, detail = null) {
    const event = new CustomEvent(name, {
      bubbles: true,
      cancelable: true,
      detail
    });
    this.element.dispatchEvent(event);
  }
  
  /**
   * Shows the component
   */
  show() {
    this.element.style.display = '';
    this.emit('show');
  }
  
  /**
   * Hides the component
   */
  hide() {
    this.element.style.display = 'none';
    this.emit('hide');
  }
  
  /**
   * Destroys the component
   */
  destroy() {
    if (this.isDestroyed) return;
    
    // Remove all event listeners
    this.listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.listeners = [];
    
    this.onDestroy();
    this.isDestroyed = true;
  }
  
  /**
   * Called before destruction - override in subclasses
   */
  onDestroy() {
    // Override in subclasses
  }
}

/**
 * Component Registry
 * Manages component instances
 */
export class ComponentRegistry {
  constructor() {
    this.components = new Map();
  }
  
  /**
   * Registers a component instance
   * @param {string} id - Component ID
   * @param {Component} component - Component instance
   */
  register(id, component) {
    this.components.set(id, component);
  }
  
  /**
   * Gets a registered component
   * @param {string} id - Component ID
   * @returns {Component|undefined}
   */
  get(id) {
    return this.components.get(id);
  }
  
  /**
   * Unregisters a component
   * @param {string} id - Component ID
   */
  unregister(id) {
    const component = this.components.get(id);
    if (component) {
      component.destroy();
      this.components.delete(id);
    }
  }
  
  /**
   * Destroys all registered components
   */
  destroyAll() {
    this.components.forEach(component => component.destroy());
    this.components.clear();
  }
}

// Create singleton registry
export const registry = new ComponentRegistry();
