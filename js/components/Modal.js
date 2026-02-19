/**
 * Modal Component
 * Reusable modal with focus management and accessibility
 */

import { createTrapFocus } from '../utils/accessibility.js';

export const MODAL_SIZES = {
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
    XL: 'xl',
    FULL: 'full'
};

let modalStack = [];
let bodyOverflow = '';

export class Modal {
    constructor(options = {}) {
        this.options = {
            title: '',
            content: '',
            size: MODAL_SIZES.MD,
            closable: true,
            backdropClose: true,
            showCloseButton: true,
            onOpen: null,
            onClose: null,
            onConfirm: null,
            footer: null,
            ...options
        };
        
        this.element = null;
        this.backdrop = null;
        this.focusTrap = null;
        this.isOpen = false;
        this.previousActiveElement = null;
    }

    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.previousActiveElement = document.activeElement;
        
        // Save body overflow on first modal
        if (modalStack.length === 0) {
            bodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        
        this.render();
        this.attachEventListeners();
        
        // Add to stack
        modalStack.push(this);
        
        // Focus trap
        this.focusTrap = createTrapFocus(this.element);
        this.focusTrap.activate();
        
        // Focus first focusable element
        setTimeout(() => {
            const focusable = this.element.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            focusable?.focus();
        }, 50);
        
        if (this.options.onOpen) {
            this.options.onOpen();
        }
        
        return this;
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        // Remove from stack
        const index = modalStack.indexOf(this);
        if (index > -1) {
            modalStack.splice(index, 1);
        }
        
        // Restore body overflow if last modal
        if (modalStack.length === 0) {
            document.body.style.overflow = bodyOverflow;
        }
        
        this.focusTrap?.deactivate();
        this.removeEventListeners();
        
        // Animation out
        this.element?.classList.add('modal-closing');
        
        setTimeout(() => {
            this.destroy();
            
            // Restore focus
            if (this.previousActiveElement) {
                this.previousActiveElement.focus();
            }
        }, 200);
        
        if (this.options.onClose) {
            this.options.onClose();
        }
        
        return this;
    }

    render() {
        // Backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop';
        this.backdrop.setAttribute('role', 'presentation');
        
        // Modal container
        this.element = document.createElement('div');
        this.element.className = `modal modal-${this.options.size}`;
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-modal', 'true');
        this.element.setAttribute('aria-labelledby', 'modal-title');
        
        this.element.innerHTML = this.buildContent();
        
        // Append to DOM
        this.backdrop.appendChild(this.element);
        document.body.appendChild(this.backdrop);
        
        return this.element;
    }

    buildContent() {
        let html = '<div class="modal-content">';
        
        // Header
        if (this.options.title || this.options.showCloseButton) {
            html += '<div class="modal-header">';
            if (this.options.title) {
                html += `<h2 id="modal-title" class="modal-title">${this.options.title}</h2>`;
            }
            if (this.options.showCloseButton && this.options.closable) {
                html += `
                    <button class="modal-close" aria-label="Close" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
            html += '</div>';
        }
        
        // Body
        html += `<div class="modal-body">${this.options.content}</div>`;
        
        // Footer
        if (this.options.footer) {
            html += `<div class="modal-footer">${this.options.footer}</div>`;
        }
        
        html += '</div>';
        
        return html;
    }

    setContent(content) {
        this.options.content = content;
        const body = this.element?.querySelector('.modal-body');
        if (body) {
            body.innerHTML = content;
        }
    }

    attachEventListeners() {
        // Close button
        const closeBtn = this.element?.querySelector('.modal-close');
        closeBtn?.addEventListener('click', () => this.close());
        
        // Backdrop click
        if (this.options.backdropClose && this.options.closable) {
            this.backdrop?.addEventListener('click', (e) => {
                if (e.target === this.backdrop) {
                    this.close();
                }
            });
        }
        
        // Escape key
        this.handleKeydown = (e) => {
            if (e.key === 'Escape' && this.options.closable) {
                // Only close top modal
                if (modalStack[modalStack.length - 1] === this) {
                    this.close();
                }
            }
        };
        document.addEventListener('keydown', this.handleKeydown);
    }

    removeEventListeners() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    destroy() {
        this.backdrop?.remove();
        this.element = null;
        this.backdrop = null;
    }

    static closeAll() {
        [...modalStack].forEach(modal => modal.close());
    }

    static getOpenModals() {
        return [...modalStack];
    }
}

// Alert modal helper
export const alert = (message, title = 'Alert') => {
    const modal = new Modal({
        title,
        content: `<p>${message}</p>`,
        size: MODAL_SIZES.SM,
        footer: `
            <button class="btn btn-primary" onclick="this.closest('.modal').dispatchEvent(new CustomEvent('modal:confirm'))">
                OK
            </button>
        `
    });
    
    return new Promise((resolve) => {
        modal.element?.addEventListener('modal:confirm', () => {
            modal.close();
            resolve(true);
        });
        modal.options.onClose = () => resolve(false);
        modal.open();
    });
};

// Confirm modal helper
export const confirm = (message, title = 'Confirm') => {
    const modal = new Modal({
        title,
        content: `<p>${message}</p>`,
        size: MODAL_SIZES.SM,
        footer: `
            <button class="btn btn-secondary" onclick="this.closest('.modal').dispatchEvent(new CustomEvent('modal:cancel'))">
                Cancel
            </button>
            <button class="btn btn-primary" onclick="this.closest('.modal').dispatchEvent(new CustomEvent('modal:confirm'))">
                Confirm
            </button>
        `
    });
    
    return new Promise((resolve) => {
        modal.element?.addEventListener('modal:confirm', () => {
            modal.close();
            resolve(true);
        });
        modal.element?.addEventListener('modal:cancel', () => {
            modal.close();
            resolve(false);
        });
        modal.options.onClose = () => resolve(false);
        modal.open();
    });
};

export default Modal;
