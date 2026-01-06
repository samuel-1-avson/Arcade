/**
 * Navigation Service
 * Handles breadcrumbs, history tracking, and navigation state
 * Minimal Retro Calm Theme
 */

import { eventBus } from '../engine/EventBus.js';

class NavigationService {
    constructor() {
        this.history = [];
        this.maxHistory = 10;
        this.breadcrumbContainer = null;
        this.currentSection = 'home';
        this.sectionObserver = null;
        
        // Context Awareness
        this.context = 'HUB'; // 'HUB' or 'GAME'
        this.systemMenuOpen = false;
        this.systemMenuCallback = null;
    }

    init() {
        this.createBreadcrumbContainer();
        this.setupScrollObserver();
        this.setupHeaderScrollEffect();
        this.enhanceSidebar();
        this.enhanceBottomNav();
        this.addRippleEffect();
        this.setupGlobalInput();
        
        // Set initial state
        // Set initial state
        const homeIcon = `<svg class="breadcrumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`;
        this.pushState('Home', homeIcon, 'home');
        
        console.log('[NavigationService] Initialized');
    }

    setupGlobalInput() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
    }

    handleEscapeKey() {
        if (this.context === 'GAME') {
            // Toggle System Menu
            this.toggleSystemMenu();
        } else {
            // In Hub: Close Modals or Go Back
            const lastState = this.history[this.history.length - 1];
            if (lastState?.isModal) {
                this.goBack();
            }
        }
    }

    setContext(context) {
        this.context = context;
        console.log(`[Nav] Context switched to: ${context}`);
        
        // Hide breadcrumbs in game mode
        if (this.breadcrumbContainer) {
            this.breadcrumbContainer.style.opacity = context === 'GAME' ? '0' : '1';
        }
    }

    registerSystemMenu(callback) {
        this.systemMenuCallback = callback;
    }

    toggleSystemMenu() {
        if (this.systemMenuCallback) {
            this.systemMenuOpen = !this.systemMenuOpen;
            this.systemMenuCallback(this.systemMenuOpen);
        }
    }

    createBreadcrumbContainer() {
        const header = document.querySelector('.hub-header .container');
        if (!header) return;

        // Insert after logo
        const logo = header.querySelector('.hub-logo');
        if (!logo) return;

        this.breadcrumbContainer = document.createElement('div');
        this.breadcrumbContainer.className = 'breadcrumb-container';
        this.breadcrumbContainer.innerHTML = `
            <button class="breadcrumb-back hidden" title="Go back">←</button>
            <div class="breadcrumb-trail"></div>
        `;

        logo.insertAdjacentElement('afterend', this.breadcrumbContainer);

        // Back button handler
        this.breadcrumbContainer.querySelector('.breadcrumb-back')?.addEventListener('click', () => {
            this.goBack();
        });
    }

    pushState(label, icon, sectionId, isModal = false) {
        const state = { label, icon, sectionId, isModal, timestamp: Date.now() };
        
        // Avoid duplicates
        if (this.history.length > 0) {
            const last = this.history[this.history.length - 1];
            if (last.sectionId === sectionId) return;
        }

        this.history.push(state);
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        this.currentSection = sectionId;
        this.renderBreadcrumbs();
        eventBus.emit('navigationChange', { section: sectionId });
    }

    goBack() {
        if (this.history.length <= 1) return;

        const current = this.history.pop();
        
        // Close modal if current is a modal
        if (current?.isModal) {
            const modalId = current.sectionId;
            document.getElementById(modalId)?.classList.add('hidden');
        }

        const previous = this.history[this.history.length - 1];
        if (previous) {
            this.currentSection = previous.sectionId;
            
            if (!previous.isModal) {
                // Scroll to section
                if (previous.sectionId === 'home') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    const el = document.getElementById(`${previous.sectionId}-section`) ||
                               document.querySelector(`.${previous.sectionId}-section`);
                    el?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }

        this.renderBreadcrumbs();
    }

    renderBreadcrumbs() {
        if (!this.breadcrumbContainer) return;

        const trail = this.breadcrumbContainer.querySelector('.breadcrumb-trail');
        const backBtn = this.breadcrumbContainer.querySelector('.breadcrumb-back');

        if (!trail) return;

        // Show back button if history > 1
        if (backBtn) {
            backBtn.classList.toggle('hidden', this.history.length <= 1);
        }

        // Only show last 3 items
        const visibleHistory = this.history.slice(-3);

        trail.innerHTML = visibleHistory.map((item, idx) => {
            const isLast = idx === visibleHistory.length - 1;
            const separator = !isLast ? '<span class="breadcrumb-separator">›</span>' : '';
            
            return `
                <span class="breadcrumb-item ${isLast ? 'current' : ''}" data-section="${item.sectionId}">
                    <span>${item.icon}</span>
                    <span>${item.label}</span>
                </span>
                ${separator}
            `;
        }).join('');

        // Click to navigate
        trail.querySelectorAll('.breadcrumb-item:not(.current)').forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.dataset.section;
                this.navigateToSection(sectionId);
            });
        });
    }

    navigateToSection(sectionId) {
        // Pop history until we reach the section
        while (this.history.length > 0) {
            const last = this.history[this.history.length - 1];
            if (last.sectionId === sectionId) break;
            this.history.pop();
        }

        if (sectionId === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const el = document.getElementById(`${sectionId}-section`) ||
                       document.querySelector(`.${sectionId}-section`);
            el?.scrollIntoView({ behavior: 'smooth' });
        }

        this.currentSection = sectionId;
        this.renderBreadcrumbs();
    }

    setupScrollObserver() {
        const sections = document.querySelectorAll('section[id], .section-title');
        if (sections.length === 0) return;

        this.sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id || 
                                     entry.target.closest('section')?.id || 
                                     entry.target.className.match(/(\w+)-section/)?.[1];
                    if (sectionId) {
                        this.highlightNavItem(sectionId);
                    }
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(section => this.sectionObserver.observe(section));
    }

    highlightNavItem(sectionId) {
        // Update sidebar nav
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            item.classList.remove('section-visible');
            if (item.dataset.section === sectionId) {
                item.classList.add('section-visible');
            }
        });
    }

    setupHeaderScrollEffect() {
        const header = document.querySelector('.hub-header');
        if (!header) return;

        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;
            
            // Add scrolled class when scrolled down
            header.classList.toggle('scrolled', currentScroll > 50);
            
            lastScroll = currentScroll;
        }, { passive: true });
    }

    enhanceSidebar() {
        const sidebar = document.querySelector('.sidebar-nav');
        if (!sidebar) return;

        // Add sliding indicator
        const indicator = document.createElement('div');
        indicator.className = 'nav-indicator';
        sidebar.appendChild(indicator);

        // Position indicator on active item
        const updateIndicator = () => {
            const activeItem = sidebar.querySelector('.nav-item.active');
            if (activeItem) {
                const itemRect = activeItem.getBoundingClientRect();
                const sidebarRect = sidebar.getBoundingClientRect();
                const top = itemRect.top - sidebarRect.top;
                indicator.style.transform = `translateY(${top}px)`;
            }
        };

        // Watch for active changes
        sidebar.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                sidebar.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                
                // Update navigation state
                const section = item.dataset.section;
                const label = item.querySelector('.nav-label')?.textContent || section;
                const icon = item.querySelector('.nav-icon')?.textContent || '📍';
                
                if (section) {
                    this.pushState(label, icon, section);
                }
                
                requestAnimationFrame(updateIndicator);
            });
        });

        // Initial position
        requestAnimationFrame(updateIndicator);

        // Add tooltips for collapsed state
        sidebar.querySelectorAll('.nav-item').forEach(item => {
            const label = item.querySelector('.nav-label')?.textContent;
            if (label) {
                const tooltip = document.createElement('div');
                tooltip.className = 'nav-tooltip';
                tooltip.textContent = label;
                item.appendChild(tooltip);
            }
        });
    }

    enhanceBottomNav() {
        const bottomNav = document.querySelector('.bottom-nav');
        if (!bottomNav) return;

        bottomNav.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                bottomNav.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    addRippleEffect() {
        const addRipple = (e, element) => {
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            
            element.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        };

        // Add to bottom nav items
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
            item.addEventListener('click', (e) => addRipple(e, item));
        });

        // Add to sidebar items
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            item.addEventListener('click', (e) => addRipple(e, item));
        });
    }

    // Public method for modals to register
    openModal(label, icon, modalId) {
        this.pushState(label, icon, modalId, true);
    }

    closeModal(modalId) {
        if (this.history.length > 0 && this.history[this.history.length - 1].sectionId === modalId) {
            this.goBack();
        }
    }
}

export const navigationService = new NavigationService();
