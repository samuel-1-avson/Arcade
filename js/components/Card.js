/**
 * Card Component
 * Reusable card container with variants
 */

export const CARD_VARIANTS = {
    DEFAULT: 'default',
    GAME: 'game',
    LEADERBOARD: 'leaderboard',
    STATS: 'stats',
    FLAT: 'flat'
};

export class Card {
    constructor(options = {}) {
        this.options = {
            variant: CARD_VARIANTS.DEFAULT,
            title: null,
            subtitle: null,
            content: null,
            footer: null,
            image: null,
            imageAlt: '',
            badge: null,
            hoverable: false,
            clickable: false,
            onClick: null,
            customClass: '',
            ...options
        };
        
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = this.buildClassName();
        
        if (this.options.clickable) {
            this.element.style.cursor = 'pointer';
        }
        
        this.element.innerHTML = this.buildContent();
        
        if (this.options.onClick && this.options.clickable) {
            this.element.addEventListener('click', (e) => {
                if (!e.target.closest('button, a, input')) {
                    this.options.onClick(e);
                }
            });
        }
        
        return this.element;
    }

    buildClassName() {
        const classes = [
            'card',
            `card-${this.options.variant}`
        ];
        
        if (this.options.hoverable) {
            classes.push('card-hoverable');
        }
        
        if (this.options.clickable) {
            classes.push('card-clickable');
        }
        
        if (this.options.customClass) {
            classes.push(this.options.customClass);
        }
        
        return classes.join(' ');
    }

    buildContent() {
        let html = '';
        
        // Image
        if (this.options.image) {
            html += `
                <div class="card-image">
                    <img src="${this.options.image}" alt="${this.options.imageAlt}" loading="lazy">
                    ${this.options.badge ? `<span class="card-badge">${this.options.badge}</span>` : ''}
                </div>
            `;
        } else if (this.options.badge) {
            html += `<span class="card-badge">${this.options.badge}</span>`;
        }
        
        // Header
        if (this.options.title || this.options.subtitle) {
            html += '<div class="card-header">';
            if (this.options.title) {
                html += `<h3 class="card-title">${this.options.title}</h3>`;
            }
            if (this.options.subtitle) {
                html += `<p class="card-subtitle">${this.options.subtitle}</p>`;
            }
            html += '</div>';
        }
        
        // Content
        if (this.options.content) {
            html += `<div class="card-content">${this.options.content}</div>`;
        }
        
        // Footer
        if (this.options.footer) {
            html += `<div class="card-footer">${this.options.footer}</div>`;
        }
        
        return html;
    }

    setContent(content) {
        const contentEl = this.element?.querySelector('.card-content');
        if (contentEl) {
            contentEl.innerHTML = content;
        }
    }

    setLoading(loading) {
        if (loading) {
            this.element?.classList.add('card-loading');
        } else {
            this.element?.classList.remove('card-loading');
        }
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

// Game-specific card helper
export const createGameCard = (game, onClick) => {
    const card = new Card({
        variant: CARD_VARIANTS.GAME,
        title: game.name,
        subtitle: game.category,
        image: game.image,
        imageAlt: `${game.name} preview`,
        badge: game.isNew ? 'NEW' : (game.isPopular ? 'HOT' : null),
        hoverable: true,
        clickable: true,
        onClick: onClick,
        content: `
            <p class="game-description">${game.description}</p>
            <div class="game-stats">
                <span class="game-plays">${game.plays?.toLocaleString() || 0} plays</span>
                <span class="game-rating">${game.rating || 0} ⭐</span>
            </div>
        `
    });
    return card;
};

// Stats card helper
export const createStatsCard = (title, value, icon, change = null) => {
    const card = new Card({
        variant: CARD_VARIANTS.STATS,
        customClass: 'stats-card',
        content: `
            <div class="stats-icon">${icon}</div>
            <div class="stats-info">
                <h4 class="stats-title">${title}</h4>
                <p class="stats-value">${value}</p>
                ${change ? `<span class="stats-change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}%</span>` : ''}
            </div>
        `
    });
    return card;
};

export default Card;
