/**
 * Animation Utilities
 * Helper functions for animations and transitions
 */

/**
 * Waits for a CSS transition to complete on an element
 * @param {HTMLElement} element - The element to watch
 * @param {string} property - Optional specific property to wait for
 * @returns {Promise<void>}
 */
export function waitForTransition(element, property = null) {
  return new Promise((resolve) => {
    const handler = (e) => {
      if (property && e.propertyName !== property) return;
      element.removeEventListener('transitionend', handler);
      resolve();
    };
    element.addEventListener('transitionend', handler);
  });
}

/**
 * Waits for an animation to complete
 * @param {HTMLElement} element - The element to watch
 * @returns {Promise<void>}
}
 */
export function waitForAnimation(element) {
  return new Promise((resolve) => {
    const handler = () => {
      element.removeEventListener('animationend', handler);
      resolve();
    };
    element.addEventListener('animationend', handler);
  });
}

/**
 * Animates an element with fade in
 * @param {HTMLElement} element - Element to animate
 * @param {number} duration - Duration in ms
 */
export function fadeIn(element, duration = 250) {
  element.style.opacity = '0';
  element.style.display = '';
  
  requestAnimationFrame(() => {
    element.style.transition = `opacity ${duration}ms ease-out`;
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  });
}

/**
 * Animates an element with fade out
 * @param {HTMLElement} element - Element to animate
 * @param {number} duration - Duration in ms
 * @returns {Promise<void>}
 */
export async function fadeOut(element, duration = 250) {
  element.style.transition = `opacity ${duration}ms ease-out`;
  element.style.opacity = '0';
  
  await waitForTransition(element, 'opacity');
  element.style.display = 'none';
}

/**
 * Slides an element in from the right
 * @param {HTMLElement} element - Element to animate
 * @param {number} duration - Duration in ms
 */
export function slideInRight(element, duration = 300) {
  element.style.transform = 'translateX(100%)';
  element.style.display = '';
  element.style.visibility = 'visible';
  
  requestAnimationFrame(() => {
    element.style.transition = `transform ${duration}ms cubic-bezier(0, 0, 0.2, 1)`;
    requestAnimationFrame(() => {
      element.style.transform = 'translateX(0)';
    });
  });
}

/**
 * Slides an element out to the right
 * @param {HTMLElement} element - Element to animate
 * @param {number} duration - Duration in ms
 * @returns {Promise<void>}
 */
export async function slideOutRight(element, duration = 300) {
  element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 1, 1)`;
  element.style.transform = 'translateX(100%)';
  
  await waitForTransition(element, 'transform');
  element.style.display = 'none';
}

/**
 * Scales an element in with fade
 * @param {HTMLElement} element - Element to animate
 * @param {number} duration - Duration in ms
 */
export function scaleIn(element, duration = 250) {
  element.style.opacity = '0';
  element.style.transform = 'scale(0.95)';
  element.style.display = '';
  
  requestAnimationFrame(() => {
    element.style.transition = `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    });
  });
}

/**
 * Scales an element out with fade
 * @param {HTMLElement} element - Element to animate
 * @param {number} duration - Duration in ms
 * @returns {Promise<void>}
 */
export async function scaleOut(element, duration = 250) {
  element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 1, 1)`;
  element.style.opacity = '0';
  element.style.transform = 'scale(0.95)';
  
  await waitForTransition(element);
  element.style.display = 'none';
}

/**
 * Animates multiple elements with stagger
 * @param {HTMLElement[]} elements - Elements to animate
 * @param {Function} animationFn - Animation function to apply
 * @param {number} staggerMs - Delay between each element
 */
export function staggerAnimation(elements, animationFn, staggerMs = 50) {
  elements.forEach((el, index) => {
    setTimeout(() => animationFn(el), index * staggerMs);
  });
}

/**
 * Checks if user prefers reduced motion
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Applies animation only if user doesn't prefer reduced motion
 * @param {HTMLElement} element - Element to animate
 * @param {string} animationClass - CSS animation class
 */
export function applyAnimation(element, animationClass) {
  if (prefersReducedMotion()) return;
  element.classList.add(animationClass);
}

/**
 * Debounce function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function}
 */
export function debounce(fn, delay = 250) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit in ms
 * @returns {Function}
 */
export function throttle(fn, limit = 250) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
