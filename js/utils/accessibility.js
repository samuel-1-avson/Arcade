/**
 * Accessibility Utilities
 * Focus management and ARIA helpers
 */

/**
 * Create a focus trap for modals and dialogs
 * @param {HTMLElement} element - Container element to trap focus within
 */
export function createTrapFocus(element) {
    const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    let focusableElements = [];
    let firstFocusable = null;
    let lastFocusable = null;

    function updateFocusableElements() {
        focusableElements = Array.from(element.querySelectorAll(focusableSelectors));
        firstFocusable = focusableElements[0];
        lastFocusable = focusableElements[focusableElements.length - 1];
    }

    function handleKeyDown(e) {
        if (e.key !== 'Tab') return;

        updateFocusableElements();

        if (focusableElements.length === 0) {
            e.preventDefault();
            return;
        }

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable || !element.contains(document.activeElement)) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable || !element.contains(document.activeElement)) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    return {
        activate() {
            updateFocusableElements();
            document.addEventListener('keydown', handleKeyDown);
        },
        deactivate() {
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announce(message, priority = 'polite') {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    `;
    
    document.body.appendChild(announcer);
    
    // Small delay to ensure screen reader picks up the change
    setTimeout(() => {
        announcer.textContent = message;
    }, 100);
    
    // Clean up
    setTimeout(() => {
        announcer.remove();
    }, 1000);
}

/**
 * Set aria-expanded attribute
 * @param {HTMLElement} element - Target element
 * @param {boolean} expanded - Expanded state
 */
export function setExpanded(element, expanded) {
    element.setAttribute('aria-expanded', expanded.toString());
}

/**
 * Set aria-hidden attribute on all siblings
 * @param {HTMLElement} element - Element to exclude
 * @param {boolean} hidden - Hidden state
 * @param {string} rootSelector - Container selector
 */
export function setSiblingsHidden(element, hidden, rootSelector = 'body') {
    const root = document.querySelector(rootSelector);
    const siblings = root.querySelectorAll(':scope > *:not(script):not(style)');
    
    siblings.forEach(sibling => {
        if (sibling !== element && !element.contains(sibling) && !sibling.contains(element)) {
            sibling.setAttribute('aria-hidden', hidden.toString());
        }
    });
}

/**
 * Skip link helper - create skip navigation link
 * @param {string} targetId - ID of main content
 */
export function createSkipLink(targetId) {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        background: #000;
        color: #fff;
        padding: 8px 16px;
        z-index: 10000;
        transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '0';
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add id to target if not exists
    const target = document.getElementById(targetId);
    if (target) {
        target.setAttribute('tabindex', '-1');
    }
    
    skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        target?.focus();
        target?.scrollIntoView({ behavior: 'smooth' });
    });
}

/**
 * Check if element is visible
 * @param {HTMLElement} element - Element to check
 */
export function isVisible(element) {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

/**
 * Trap scroll within an element
 * @param {HTMLElement} element - Container element
 */
export function trapScroll(element) {
    function handleWheel(e) {
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const height = element.clientHeight;
        const delta = e.deltaY;
        
        const isScrollingUp = delta < 0;
        const isScrollingDown = delta > 0;
        
        const atTop = scrollTop === 0;
        const atBottom = scrollTop + height >= scrollHeight;
        
        if ((isScrollingUp && atTop) || (isScrollingDown && atBottom)) {
            e.preventDefault();
        }
    }
    
    element.addEventListener('wheel', handleWheel, { passive: false });
    
    return {
        release() {
            element.removeEventListener('wheel', handleWheel);
        }
    };
}

export default {
    createTrapFocus,
    announce,
    setExpanded,
    setSiblingsHidden,
    createSkipLink,
    isVisible,
    trapScroll
};
