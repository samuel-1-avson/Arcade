/**
 * Button Component
 * Reusable button with variants and states
 */

export const BUTTON_VARIANTS = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    GHOST: 'ghost',
    DANGER: 'danger',
    SUCCESS: 'success'
};

export const BUTTON_SIZES = {
    SM: 'sm',
    MD: 'md',
    LG: 'lg'
};

export class Button {
    constructor(options = {}) {
        this.options = {
            text: '',
            variant: BUTTON_VARIANTS.PRIMARY,
            size: BUTTON_SIZES.MD,
            icon: null,
            iconPosition: 'left',
            disabled: false,
            loading: false,
            fullWidth: false,
            onClick: null,
            type: 'button',
            ariaLabel: null,
            ...options
        };
        
        this.element = null;
    }

    render() {
        this.element = document.createElement('button');
        this.element.type = this.options.type;
        this.element.className = this.buildClassName();
        
        if (this.options.disabled) {
            this.element.disabled = true;
        }
        
        if (this.options.ariaLabel) {
            this.element.setAttribute('aria-label', this.options.ariaLabel);
        }
        
        this.element.innerHTML = this.buildContent();
        
        if (this.options.onClick && !this.options.disabled) {
            this.element.addEventListener('click', (e) => {
                e.preventDefault();
                this.options.onClick(e);
            });
        }
        
        return this.element;
    }

    buildClassName() {
        const classes = [
            'btn',
            `btn-${this.options.variant}`,
            `btn-${this.options.size}`
        ];
        
        if (this.options.fullWidth) {
            classes.push('btn-full');
        }
        
        if (this.options.loading) {
            classes.push('btn-loading');
        }
        
        return classes.join(' ');
    }

    buildContent() {
        let content = '';
        
        if (this.options.loading) {
            content += '<span class="btn-spinner"></span>';
        }
        
        if (this.options.icon && this.options.iconPosition === 'left') {
            content += `<span class="btn-icon">${this.options.icon}</span>`;
        }
        
        if (this.options.text) {
            content += `<span class="btn-text">${this.options.text}</span>`;
        }
        
        if (this.options.icon && this.options.iconPosition === 'right') {
            content += `<span class="btn-icon">${this.options.icon}</span>`;
        }
        
        return content;
    }

    setLoading(loading) {
        this.options.loading = loading;
        if (this.element) {
            this.element.classList.toggle('btn-loading', loading);
            this.element.disabled = loading;
            this.element.innerHTML = this.buildContent();
        }
    }

    setDisabled(disabled) {
        this.options.disabled = disabled;
        if (this.element) {
            this.element.disabled = disabled;
        }
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

// Factory functions for common button types
export const createPrimaryButton = (text, onClick) => 
    new Button({ text, variant: BUTTON_VARIANTS.PRIMARY, onClick });

export const createSecondaryButton = (text, onClick) => 
    new Button({ text, variant: BUTTON_VARIANTS.SECONDARY, onClick });

export const createGhostButton = (text, onClick) => 
    new Button({ text, variant: BUTTON_VARIANTS.GHOST, onClick });

export const createDangerButton = (text, onClick) => 
    new Button({ text, variant: BUTTON_VARIANTS.DANGER, onClick });

export default Button;
