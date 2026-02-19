/**
 * Virtual List Component
 * Efficiently render large lists by only showing visible items
 */

export class VirtualList {
    constructor(container, options = {}) {
        this.container = container;
        this.itemHeight = options.itemHeight || 50;
        this.totalItems = options.totalItems || 0;
        this.renderItem = options.renderItem;
        this.overscan = options.overscan || 5;
        this.onVisibleRangeChange = options.onVisibleRangeChange || null;
        
        this.visibleItems = new Map();
        this.scrollHandler = null;
        this.resizeObserver = null;
        
        this.init();
    }

    init() {
        // Setup container
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        this.container.style.height = '100%';
        
        // Create spacer for total height
        this.spacer = document.createElement('div');
        this.spacer.className = 'virtual-list-spacer';
        this.container.appendChild(this.spacer);
        
        // Create viewport for visible items
        this.viewport = document.createElement('div');
        this.viewport.className = 'virtual-list-viewport';
        this.container.appendChild(this.viewport);
        
        // Setup scroll handler with throttling
        this.scrollHandler = this.throttle(this.onScroll.bind(this), 16); // ~60fps
        this.container.addEventListener('scroll', this.scrollHandler);
        
        // Setup resize observer
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.onScroll());
            this.resizeObserver.observe(this.container);
        }
        
        this.updateSpacerHeight();
        this.onScroll();
    }

    updateSpacerHeight() {
        const totalHeight = this.totalItems * this.itemHeight;
        this.spacer.style.height = `${totalHeight}px`;
    }

    onScroll() {
        const scrollTop = this.container.scrollTop;
        const containerHeight = this.container.clientHeight;
        
        const startIndex = Math.floor(scrollTop / this.itemHeight) - this.overscan;
        const endIndex = Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.overscan;
        
        const visibleStart = Math.max(0, startIndex);
        const visibleEnd = Math.min(this.totalItems, endIndex);
        
        // Notify about visible range change
        if (this.onVisibleRangeChange) {
            this.onVisibleRangeChange(visibleStart, visibleEnd);
        }
        
        // Render visible items
        const newVisibleItems = new Map();
        
        for (let i = visibleStart; i < visibleEnd; i++) {
            let item = this.visibleItems.get(i);
            
            if (!item) {
                item = this.renderItem(i);
                item.style.position = 'absolute';
                item.style.top = `${i * this.itemHeight}px`;
                item.style.height = `${this.itemHeight}px`;
                item.style.width = '100%';
                item.dataset.index = i;
                this.viewport.appendChild(item);
            }
            
            newVisibleItems.set(i, item);
        }
        
        // Remove items outside viewport
        this.visibleItems.forEach((item, index) => {
            if (index < visibleStart || index >= visibleEnd) {
                item.remove();
            }
        });
        
        this.visibleItems = newVisibleItems;
    }

    scrollToIndex(index, behavior = 'smooth') {
        const scrollTop = index * this.itemHeight;
        this.container.scrollTo({ top: scrollTop, behavior });
    }

    scrollToItem(itemElement, behavior = 'smooth') {
        const index = parseInt(itemElement.dataset.index, 10);
        if (!isNaN(index)) {
            this.scrollToIndex(index, behavior);
        }
    }

    updateTotalItems(newTotal) {
        this.totalItems = newTotal;
        this.updateSpacerHeight();
        this.onScroll();
    }

    updateItemHeight(newHeight) {
        this.itemHeight = newHeight;
        this.updateSpacerHeight();
        
        // Update positions of visible items
        this.visibleItems.forEach((item, index) => {
            item.style.top = `${index * this.itemHeight}px`;
            item.style.height = `${this.itemHeight}px`;
        });
        
        this.onScroll();
    }

    refresh() {
        this.visibleItems.forEach(item => item.remove());
        this.visibleItems.clear();
        this.onScroll();
    }

    throttle(fn, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    destroy() {
        this.container.removeEventListener('scroll', this.scrollHandler);
        this.resizeObserver?.disconnect();
        
        this.visibleItems.forEach(item => item.remove());
        this.visibleItems.clear();
        
        this.spacer?.remove();
        this.viewport?.remove();
    }
}

// Hook-based helper for game lists
export function createGameVirtualList(container, games, options = {}) {
    return new VirtualList(container, {
        itemHeight: 80,
        totalItems: games.length,
        renderItem: (index) => {
            const game = games[index];
            const el = document.createElement('div');
            el.className = 'game-list-item';
            el.innerHTML = `
                <img src="${game.image}" alt="" loading="lazy">
                <div class="game-list-info">
                    <h4>${game.name}</h4>
                    <span class="game-category">${game.category}</span>
                </div>
            `;
            el.addEventListener('click', () => options.onGameClick?.(game, index));
            return el;
        },
        ...options
    });
}

// Hook-based helper for leaderboard lists
export function createLeaderboardVirtualList(container, entries, options = {}) {
    return new VirtualList(container, {
        itemHeight: 60,
        totalItems: entries.length,
        renderItem: (index) => {
            const entry = entries[index];
            const el = document.createElement('div');
            el.className = `leaderboard-item ${entry.isCurrentUser ? 'current-user' : ''}`;
            el.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <img src="${entry.avatar}" alt="" class="avatar">
                <span class="name">${entry.displayName}</span>
                <span class="score">${entry.score.toLocaleString()}</span>
            `;
            return el;
        },
        ...options
    });
}

export default VirtualList;
