/**
 * Loading Component
 * Reusable loading states and skeletons
 */

export class LoadingSpinner {
    constructor(options = {}) {
        this.options = {
            size: 'md', // sm, md, lg, xl
            color: 'primary', // primary, secondary, white
            fullPage: false,
            text: null,
            ...options
        };
    }

    render() {
        const container = document.createElement('div');
        container.className = this.buildClassName();
        
        const spinner = document.createElement('div');
        spinner.className = `spinner spinner-${this.options.size} spinner-${this.options.color}`;
        
        container.appendChild(spinner);
        
        if (this.options.text) {
            const text = document.createElement('span');
            text.className = 'spinner-text';
            text.textContent = this.options.text;
            container.appendChild(text);
        }
        
        return container;
    }

    buildClassName() {
        const classes = ['loading-container'];
        if (this.options.fullPage) {
            classes.push('loading-fullpage');
        }
        return classes.join(' ');
    }

    static showFullPage(text = 'Loading...') {
        const spinner = new LoadingSpinner({ fullPage: true, text });
        const element = spinner.render();
        element.id = 'full-page-loader';
        document.body.appendChild(element);
        return element;
    }

    static hideFullPage() {
        const loader = document.getElementById('full-page-loader');
        loader?.remove();
    }
}

export class SkeletonLoader {
    constructor(options = {}) {
        this.options = {
            type: 'text', // text, card, avatar, image
            lines: 1,
            width: '100%',
            height: null,
            animated: true,
            ...options
        };
    }

    render() {
        const container = document.createElement('div');
        container.className = 'skeleton-container';
        
        for (let i = 0; i < this.options.lines; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = this.buildClassName();
            
            if (this.options.width) {
                skeleton.style.width = typeof this.options.width === 'number' 
                    ? `${this.options.width}px` 
                    : this.options.width;
            }
            
            if (this.options.height) {
                skeleton.style.height = typeof this.options.height === 'number'
                    ? `${this.options.height}px`
                    : this.options.height;
            }
            
            // Vary line widths for text skeletons
            if (this.options.type === 'text' && this.options.lines > 1) {
                const widths = ['100%', '92%', '85%', '70%'];
                skeleton.style.width = widths[i % widths.length];
            }
            
            container.appendChild(skeleton);
        }
        
        return container;
    }

    buildClassName() {
        const classes = ['skeleton', `skeleton-${this.options.type}`];
        if (this.options.animated) {
            classes.push('skeleton-animated');
        }
        return classes.join(' ');
    }

    // Helper for card skeleton
    static card() {
        const container = document.createElement('div');
        container.className = 'skeleton-card';
        container.innerHTML = `
            <div class="skeleton skeleton-image skeleton-animated"></div>
            <div class="skeleton-card-content">
                <div class="skeleton skeleton-text skeleton-animated" style="width: 70%"></div>
                <div class="skeleton skeleton-text skeleton-animated" style="width: 100%"></div>
                <div class="skeleton skeleton-text skeleton-animated" style="width: 85%"></div>
            </div>
        `;
        return container;
    }

    // Helper for game card skeleton
    static gameCard() {
        const container = document.createElement('div');
        container.className = 'skeleton-game-card';
        container.innerHTML = `
            <div class="skeleton skeleton-image skeleton-animated"></div>
            <div class="skeleton-game-card-info">
                <div class="skeleton skeleton-text skeleton-animated" style="width: 60%"></div>
                <div class="skeleton skeleton-text skeleton-animated" style="width: 40%"></div>
            </div>
        `;
        return container;
    }

    // Show skeleton grid
    static showGrid(container, count = 6, type = 'gameCard') {
        container.innerHTML = '';
        container.classList.add('skeleton-grid');
        
        for (let i = 0; i < count; i++) {
            const skeleton = type === 'gameCard' 
                ? SkeletonLoader.gameCard() 
                : SkeletonLoader.card();
            container.appendChild(skeleton);
        }
    }

    static hideGrid(container) {
        container.classList.remove('skeleton-grid');
    }
}

export class ProgressBar {
    constructor(options = {}) {
        this.options = {
            value: 0,
            max: 100,
            showPercentage: true,
            size: 'md', // sm, md, lg
            variant: 'primary', // primary, success, warning, danger
            ...options
        };
        
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = `progress progress-${this.options.size}`;
        
        const percentage = Math.round((this.options.value / this.options.max) * 100);
        
        this.element.innerHTML = `
            <div class="progress-bar progress-${this.options.variant}" style="width: ${percentage}%">
                ${this.options.showPercentage ? `<span>${percentage}%</span>` : ''}
            </div>
        `;
        
        return this.element;
    }

    setValue(value) {
        this.options.value = Math.min(value, this.options.max);
        const bar = this.element?.querySelector('.progress-bar');
        const percentage = Math.round((this.options.value / this.options.max) * 100);
        
        if (bar) {
            bar.style.width = `${percentage}%`;
            if (this.options.showPercentage) {
                bar.querySelector('span').textContent = `${percentage}%`;
            }
        }
    }
}

export default { LoadingSpinner, SkeletonLoader, ProgressBar };
