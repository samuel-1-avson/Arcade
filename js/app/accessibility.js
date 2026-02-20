/**
 * Accessibility Module (WCAG 2.1 AA Compliance)
 * Keyboard navigation, focus management, screen reader support
 */

import { createTrapFocus, announce, createSkipLink } from '../utils/accessibility.js';

export class AccessibilityManager {
    constructor() {
        this.focusTraps = new Map();
        this.keyboardHandlers = new WeakMap();
        this.liveRegion = null;
    }

    init() {
        this.setupLiveRegion();
        this.setupGlobalKeyboardShortcuts();
        this.setupFocusVisible();
        this.enhanceInteractiveElements();
        
        // Add skip link for keyboard users
        if (document.getElementById('main-content')) {
            createSkipLink('main-content');
        }
    }

    /**
     * Setup ARIA live region for screen reader announcements
     */
    setupLiveRegion() {
        this.liveRegion = document.createElement('div');
        this.liveRegion.id = 'sr-announcer';
        this.liveRegion.setAttribute('role', 'status');
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.className = 'sr-only';
        this.liveRegion.style.cssText = `
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
        document.body.appendChild(this.liveRegion);
    }

    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
        if (this.liveRegion) {
            this.liveRegion.setAttribute('aria-live', priority);
            // Clear first, then set text (helps some screen readers)
            this.liveRegion.textContent = '';
            setTimeout(() => {
                this.liveRegion.textContent = message;
            }, 100);
        }
    }

    /**
     * Setup global keyboard shortcuts
     */
    setupGlobalKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC to close modals/popups
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
            
            // / to focus search (if exists)
            if (e.key === '/' && !this.isTypingInInput()) {
                e.preventDefault();
                const searchInput = document.querySelector('[data-search-input]');
                searchInput?.focus();
            }
            
            // ? to show keyboard help
            if (e.key === '?' && !this.isTypingInInput()) {
                e.preventDefault();
                this.showKeyboardHelp();
            }
        });
    }

    /**
     * Setup focus-visible polyfill for keyboard navigation
     */
    setupFocusVisible() {
        // Add focus-visible class for styling keyboard focus
        document.body.addEventListener('mousedown', () => {
            document.body.classList.add('using-mouse');
        });
        
        document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.remove('using-mouse');
            }
        });
    }

    /**
     * Enhance all interactive elements with keyboard support
     */
    enhanceInteractiveElements() {
        // Make cards keyboard accessible
        document.querySelectorAll('.game-card, .clickable').forEach(el => {
            if (!el.getAttribute('role')) {
                el.setAttribute('role', 'button');
            }
            if (!el.hasAttribute('tabindex')) {
                el.setAttribute('tabindex', '0');
            }
            this.addKeyboardActivation(el);
        });

        // Enhance custom dropdowns
        document.querySelectorAll('[data-dropdown]').forEach(dropdown => {
            this.enhanceDropdown(dropdown);
        });

        // Enhance tabs
        document.querySelectorAll('[role="tablist"]').forEach(tablist => {
            this.enhanceTabs(tablist);
        });
    }

    /**
     * Add keyboard activation support (Enter/Space)
     */
    addKeyboardActivation(element, callback = null) {
        const handler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (callback) {
                    callback(e);
                } else {
                    element.click();
                }
            }
        };
        
        element.addEventListener('keydown', handler);
        this.keyboardHandlers.set(element, handler);
    }

    /**
     * Enhance dropdown with keyboard navigation
     */
    enhanceDropdown(dropdown) {
        const trigger = dropdown.querySelector('[data-dropdown-trigger]');
        const menu = dropdown.querySelector('[data-dropdown-menu]');
        const items = dropdown.querySelectorAll('[data-dropdown-item]');
        
        if (!trigger || !menu) return;

        let isOpen = false;
        let currentIndex = -1;

        const open = () => {
            isOpen = true;
            menu.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            items[0]?.focus();
            currentIndex = 0;
        };

        const close = () => {
            isOpen = false;
            menu.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
            currentIndex = -1;
        };

        trigger.addEventListener('click', () => {
            isOpen ? close() : open();
        });

        trigger.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    isOpen ? close() : open();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (!isOpen) open();
                    break;
                case 'Escape':
                    if (isOpen) close();
                    break;
            }
        });

        menu.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    currentIndex = (currentIndex + 1) % items.length;
                    items[currentIndex].focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    currentIndex = (currentIndex - 1 + items.length) % items.length;
                    items[currentIndex].focus();
                    break;
                case 'Home':
                    e.preventDefault();
                    currentIndex = 0;
                    items[0].focus();
                    break;
                case 'End':
                    e.preventDefault();
                    currentIndex = items.length - 1;
                    items[currentIndex].focus();
                    break;
                case 'Escape':
                    close();
                    break;
                case 'Tab':
                    close();
                    break;
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                close();
            }
        });
    }

    /**
     * Enhance tablist with keyboard navigation
     */
    enhanceTabs(tablist) {
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
        let currentIndex = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
        if (currentIndex === -1) currentIndex = 0;

        const activateTab = (index) => {
            tabs.forEach((tab, i) => {
                const isSelected = i === index;
                tab.setAttribute('aria-selected', isSelected.toString());
                tab.setAttribute('tabindex', isSelected ? '0' : '-1');
            });
            
            panels.forEach((panel, i) => {
                panel.hidden = i !== index;
            });
            
            currentIndex = index;
        };

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => activateTab(index));
            
            tab.addEventListener('keydown', (e) => {
                let newIndex = currentIndex;
                
                switch (e.key) {
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                        break;
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        newIndex = (currentIndex + 1) % tabs.length;
                        break;
                    case 'Home':
                        e.preventDefault();
                        newIndex = 0;
                        break;
                    case 'End':
                        e.preventDefault();
                        newIndex = tabs.length - 1;
                        break;
                }
                
                if (newIndex !== currentIndex) {
                    tabs[newIndex].focus();
                    activateTab(newIndex);
                }
            });
        });
    }

    /**
     * Trap focus within a modal/container
     */
    trapFocus(container, options = {}) {
        const trap = createTrapFocus(container);
        
        if (options.restoreFocus !== false) {
            const previousFocus = document.activeElement;
            trap.previousFocus = previousFocus;
        }
        
        trap.activate();
        this.focusTraps.set(container, trap);
        
        return trap;
    }

    /**
     * Release focus trap
     */
    releaseFocus(container) {
        const trap = this.focusTraps.get(container);
        if (trap) {
            trap.deactivate();
            trap.previousFocus?.focus();
            this.focusTraps.delete(container);
        }
    }

    /**
     * Handle Escape key globally
     */
    handleEscapeKey() {
        // Close topmost modal
        const modals = document.querySelectorAll('.modal-backdrop, [role="dialog"]');
        const topModal = modals[modals.length - 1];
        
        if (topModal) {
            const closeBtn = topModal.querySelector('[data-close], .modal-close');
            closeBtn?.click();
        }

        // Close dropdowns
        document.querySelectorAll('[data-dropdown]').forEach(dropdown => {
            const menu = dropdown.querySelector('[data-dropdown-menu]');
            if (menu && !menu.hidden) {
                menu.hidden = true;
                dropdown.querySelector('[data-dropdown-trigger]')?.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /**
     * Check if user is currently typing in an input
     */
    isTypingInInput() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );
    }

    /**
     * Show keyboard shortcuts help
     */
    showKeyboardHelp() {
        const helpContent = `
            <div class="keyboard-help" role="dialog" aria-labelledby="keyboard-help-title">
                <h2 id="keyboard-help-title">Keyboard Shortcuts</h2>
                <dl>
                    <dt><kbd>?</kbd></dt><dd>Show this help</dd>
                    <dt><kbd>Esc</kbd></dt><dd>Close modals/menus</dd>
                    <dt><kbd>/</kbd></dt><dd>Focus search</dd>
                    <dt><kbd>Tab</kbd></dt><dd>Navigate between elements</dd>
                    <dt><kbd>Enter</kbd> or <kbd>Space</kbd></dt><dd>Activate button</dd>
                    <dt><kbd>Arrow Keys</kbd></dt><dd>Navigate within menus/tabs</dd>
                </dl>
                <button class="btn btn-primary" data-close>Close</button>
            </div>
        `;
        
        // Create and show modal (simplified version)
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop keyboard-help-modal';
        backdrop.innerHTML = helpContent;
        document.body.appendChild(backdrop);
        
        const trap = this.trapFocus(backdrop);
        
        backdrop.querySelector('[data-close]').addEventListener('click', () => {
            this.releaseFocus(backdrop);
            backdrop.remove();
        });
    }

    /**
     * Set page title with site suffix
     */
    setPageTitle(title) {
        document.title = title ? `${title} | Arcade Gaming Hub` : 'Arcade Gaming Hub';
    }

    /**
     * Announce route changes to screen readers
     */
    announceRouteChange(pageName) {
        this.announce(`Navigated to ${pageName}`);
    }
}

// Singleton instance
export const accessibilityManager = new AccessibilityManager();

export default AccessibilityManager;
