/**
 * LeaderboardList Component
 * Virtual scrolling leaderboard with pagination
 */

import { VirtualList } from './VirtualList.js';
import { leaderboardService } from '../services/LeaderboardService.js';
import { SkeletonLoader } from './Loading.js';

export class LeaderboardList {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            gameId: 'global',
            pageSize: 20,
            itemHeight: 60,
            showRank: true,
            showAvatar: true,
            onItemClick: null,
            ...options
        };
        
        this.virtualList = null;
        this.entries = [];
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.scrollTriggerElement = null;
    }

    async init() {
        this.renderContainer();
        await this.loadInitialData();
    }

    renderContainer() {
        this.container.innerHTML = `
            <div class="leaderboard-header">
                <span class="leaderboard-col rank">Rank</span>
                <span class="leaderboard-col player">Player</span>
                <span class="leaderboard-col score">Score</span>
            </div>
            <div class="leaderboard-virtual-container"></div>
            <div class="leaderboard-loading-trigger"></div>
        `;
        
        this.listContainer = this.container.querySelector('.leaderboard-virtual-container');
        this.loadingTrigger = this.container.querySelector('.leaderboard-loading-trigger');
    }

    async loadInitialData() {
        // Show skeleton loading
        this.showSkeleton();
        
        try {
            let result;
            if (this.options.gameId === 'global') {
                result = await leaderboardService.getGlobalLeaderboardPaginated({
                    limit: this.options.pageSize,
                    page: 1
                });
            } else {
                result = await leaderboardService.getGameLeaderboard(
                    this.options.gameId,
                    'allTime',
                    { limit: this.options.pageSize, page: 1 }
                );
            }
            
            this.entries = result.scores;
            this.hasMore = result.hasMore;
            this.currentPage = result.page;
            
            this.hideSkeleton();
            this.setupVirtualList();
            this.setupInfiniteScroll();
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.showError();
        }
    }

    setupVirtualList() {
        if (this.virtualList) {
            this.virtualList.destroy();
        }

        this.virtualList = new VirtualList(this.listContainer, {
            itemHeight: this.options.itemHeight,
            totalItems: this.entries.length,
            overscan: 3,
            renderItem: (index) => this.renderEntry(this.entries[index], index),
            onVisibleRangeChange: (start, end) => {
                // Preload next page when near end
                if (end >= this.entries.length - 5 && this.hasMore && !this.isLoading) {
                    this.loadMore();
                }
            }
        });
    }

    renderEntry(entry, index) {
        const el = document.createElement('div');
        el.className = `leaderboard-item ${entry.isCurrentUser ? 'current-user' : ''}`;
        el.setAttribute('role', 'listitem');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `Rank ${entry.rank}, ${entry.name}, score ${entry.score.toLocaleString()}`);
        
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        el.innerHTML = `
            <span class="leaderboard-col rank ${rankClass}">
                ${medal || `#${entry.rank}`}
            </span>
            <span class="leaderboard-col player">
                ${this.options.showAvatar ? `
                    <img src="${this.getAvatarUrl(entry.avatar)}" 
                         alt="" 
                         class="leaderboard-avatar"
                         loading="lazy">
                ` : ''}
                <span class="player-name">${this.escapeHtml(entry.name)}</span>
                ${entry.isCurrentUser ? '<span class="you-badge">YOU</span>' : ''}
            </span>
            <span class="leaderboard-col score">${entry.score.toLocaleString()}</span>
        `;
        
        if (this.options.onItemClick) {
            el.addEventListener('click', () => this.options.onItemClick(entry));
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.options.onItemClick(entry);
                }
            });
        }
        
        return el;
    }

    async loadMore() {
        if (this.isLoading || !this.hasMore) return;
        
        this.isLoading = true;
        this.showLoadingIndicator();
        
        try {
            const nextPage = this.currentPage + 1;
            let result;
            
            if (this.options.gameId === 'global') {
                result = await leaderboardService.getGlobalLeaderboardPaginated({
                    limit: this.options.pageSize,
                    page: nextPage
                });
            } else {
                result = await leaderboardService.getGameLeaderboard(
                    this.options.gameId,
                    'allTime',
                    { limit: this.options.pageSize, page: nextPage }
                );
            }
            
            // Append new entries
            this.entries = [...this.entries, ...result.scores];
            this.hasMore = result.hasMore;
            this.currentPage = result.page;
            
            // Update virtual list
            this.virtualList.updateTotalItems(this.entries.length);
        } catch (error) {
            console.error('Failed to load more entries:', error);
        } finally {
            this.isLoading = false;
            this.hideLoadingIndicator();
        }
    }

    setupInfiniteScroll() {
        // Use IntersectionObserver for infinite scroll trigger
        if ('IntersectionObserver' in window) {
            this.scrollObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && this.hasMore && !this.isLoading) {
                        this.loadMore();
                    }
                });
            }, { rootMargin: '100px' });
            
            this.scrollObserver.observe(this.loadingTrigger);
        }
    }

    showSkeleton() {
        this.listContainer.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'leaderboard-item skeleton-item';
            skeleton.innerHTML = `
                <div class="skeleton skeleton-text" style="width: 40px"></div>
                <div class="skeleton skeleton-text" style="width: 60%; margin-left: 16px"></div>
                <div class="skeleton skeleton-text" style="width: 80px"></div>
            `;
            this.listContainer.appendChild(skeleton);
        }
    }

    hideSkeleton() {
        this.listContainer.innerHTML = '';
    }

    showLoadingIndicator() {
        this.loadingTrigger.innerHTML = '<div class="spinner spinner-sm"></div>';
    }

    hideLoadingIndicator() {
        this.loadingTrigger.innerHTML = '';
    }

    showError() {
        this.listContainer.innerHTML = `
            <div class="leaderboard-error">
                <p>Failed to load leaderboard</p>
                <button class="btn btn-secondary" onclick="this.closest('.leaderboard-list').dispatchEvent(new CustomEvent('retry'))">
                    Retry
                </button>
            </div>
        `;
    }

    getAvatarUrl(avatar) {
        // Map avatar keys to URLs
        const avatarUrls = {
            'gamepad': 'https://api.dicebear.com/7.x/avataaars/svg?seed=gamepad',
            'trophy': 'https://api.dicebear.com/7.x/avataaars/svg?seed=trophy',
            'star': 'https://api.dicebear.com/7.x/avataaars/svg?seed=star'
        };
        return avatarUrls[avatar] || avatarUrls['gamepad'];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    refresh() {
        leaderboardService.resetPagination(this.options.gameId);
        this.entries = [];
        this.currentPage = 1;
        this.hasMore = true;
        this.loadInitialData();
    }

    destroy() {
        this.scrollObserver?.disconnect();
        this.virtualList?.destroy();
        this.container.innerHTML = '';
    }
}

export default LeaderboardList;
