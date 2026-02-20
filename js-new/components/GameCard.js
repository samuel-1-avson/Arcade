/**
 * Game Card Component
 * Interactive game card with hover effects and play functionality
 */

import { Component } from './Component.js';
import { $ } from '../utils/dom.js';

/**
 * GameCard component for individual game cards
 */
export class GameCard extends Component {
  get defaultOptions() {
    return {
      id: '',
      title: '',
      description: '',
      category: 'Arcade',
      difficulty: 'easy', // easy, medium, hard
      icon: '🎮',
      highScore: 0,
      players: 0,
      rating: 5,
      onPlay: null,
      onFavorite: null
    };
  }
  
  get defaultState() {
    return {
      isHovered: false,
      isFavorite: false,
      isLoading: false
    };
  }
  
  init() {
    this.playBtn = $('.game-card__play-btn', this.element);
    this.favoriteBtn = $('.game-card__favorite-btn', this.element);
    
    super.init();
  }
  
  bindEvents() {
    // Card click
    this.on(this.element, 'click', (e) => {
      // Don't trigger if clicking play button directly
      if (e.target.closest('.game-card__play-btn')) return;
      
      this.emit('select', { id: this.options.id });
    });
    
    // Play button
    this.playBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.play();
    });
    
    // Favorite button
    this.favoriteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite();
    });
    
    // Keyboard support
    this.on(this.element, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.play();
      }
    });
    
    // Hover states
    this.on(this.element, 'mouseenter', () => {
      this.setState({ isHovered: true });
    });
    
    this.on(this.element, 'mouseleave', () => {
      this.setState({ isHovered: false });
    });
  }
  
  /**
   * Launches the game
   */
  play() {
    if (this.state.isLoading) return;
    
    this.setState({ isLoading: true });
    
    // Simulate loading
    setTimeout(() => {
      this.setState({ isLoading: false });
      this.emit('play', { id: this.options.id });
      
      if (this.options.onPlay) {
        this.options.onPlay(this.options.id);
      }
    }, 300);
  }
  
  /**
   * Toggles favorite status
   */
  toggleFavorite() {
    this.setState({ isFavorite: !this.state.isFavorite });
    this.emit('favorite', { 
      id: this.options.id, 
      isFavorite: this.state.isFavorite 
    });
  }
  
  render() {
    // Update favorite state
    this.element.classList.toggle('game-card--favorite', this.state.isFavorite);
    
    // Update loading state
    this.element.classList.toggle('game-card--loading', this.state.isLoading);
    
    if (this.playBtn) {
      this.playBtn.disabled = this.state.isLoading;
      this.playBtn.textContent = this.state.isLoading ? 'Loading...' : 'PLAY';
    }
  }
  
  /**
   * Updates the high score display
   * @param {number} score - New high score
   */
  updateHighScore(score) {
    this.options.highScore = score;
    const scoreEl = $('.game-card__stat-value', this.element);
    if (scoreEl) {
      scoreEl.textContent = score.toLocaleString();
    }
  }
  
  /**
   * Sets favorite status
   * @param {boolean} isFavorite - Whether game is favorited
   */
  setFavorite(isFavorite) {
    this.setState({ isFavorite });
  }
}

/**
 * GamesGrid component managing multiple game cards
 */
export class GamesGrid extends Component {
  get defaultOptions() {
    return {
      view: 'grid', // 'grid' or 'list'
      filter: 'all', // 'all', 'easy', 'medium', 'hard', 'favorites'
      sortBy: 'name' // 'name', 'popular', 'rating'
    };
  }
  
  get defaultState() {
    return {
      games: [],
      filteredGames: [],
      view: this.options.view
    };
  }
  
  init() {
    this.grid = $('.games-grid', this.element);
    this.viewToggleGrid = $('[data-view="grid"]', this.element);
    this.viewToggleList = $('[data-view="list"]', this.element);
    
    super.init();
  }
  
  bindEvents() {
    // View toggle
    this.viewToggleGrid?.addEventListener('click', () => {
      this.setView('grid');
    });
    
    this.viewToggleList?.addEventListener('click', () => {
      this.setView('list');
    });
    
    // Filter buttons
    this.delegate('[data-filter]', 'click', (e, target) => {
      const filter = target.dataset.filter;
      this.setFilter(filter);
      
      // Update active state
      $$('[data-filter]', this.element).forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
      });
    });
    
    // Game card events
    this.delegate('.game-card', 'play', (e) => {
      this.emit('game:play', e.detail);
    });
    
    this.delegate('.game-card', 'favorite', (e) => {
      this.emit('game:favorite', e.detail);
    });
  }
  
  /**
   * Sets the view mode
   * @param {string} view - 'grid' or 'list'
   */
  setView(view) {
    if (this.state.view === view) return;
    
    this.setState({ view });
    this.element.classList.toggle('games-grid--list', view === 'list');
    
    // Update toggle buttons
    this.viewToggleGrid?.classList.toggle('active', view === 'grid');
    this.viewToggleList?.classList.toggle('active', view === 'list');
    
    this.emit('view:change', { view });
  }
  
  /**
   * Sets the filter
   * @param {string} filter - Filter value
   */
  setFilter(filter) {
    this.filterGames(filter);
    this.emit('filter:change', { filter });
  }
  
  /**
   * Sets games data
   * @param {Array} games - Array of game objects
   */
  setGames(games) {
    this.setState({ games });
    this.filterGames(this.options.filter);
  }
  
  /**
   * Filters games based on criteria
   * @param {string} filter - Filter value
   */
  filterGames(filter) {
    let filtered = [...this.state.games];
    
    switch (filter) {
      case 'easy':
      case 'medium':
      case 'hard':
        filtered = filtered.filter(g => g.difficulty === filter);
        break;
      case 'favorites':
        filtered = filtered.filter(g => g.isFavorite);
        break;
      case 'all':
      default:
        break;
    }
    
    this.setState({ filteredGames: filtered });
    this.render();
  }
  
  render() {
    if (!this.grid) return;
    
    this.grid.innerHTML = this.state.filteredGames.map((game, index) => `
      <article class="game-card" data-id="${game.id}" style="animation-delay: ${index * 50}ms">
        <div class="game-card__header">
          <div class="game-card__icon">${game.icon}</div>
          <div class="game-card__info">
            <h3 class="game-card__title">${game.title}</h3>
            <span class="game-card__category">${game.category}</span>
          </div>
          <span class="game-card__difficulty game-card__difficulty--${game.difficulty}" 
                title="${game.difficulty}"></span>
        </div>
        <div class="game-card__body">
          <p class="game-card__description">${game.description}</p>
        </div>
        <div class="game-card__footer">
          <div class="game-card__stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
            <span class="game-card__stat-value">${(game.highScore || 0).toLocaleString()}</span>
          </div>
          <div class="game-card__stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span class="game-card__stat-value">${(game.players || 0).toLocaleString()}</span>
          </div>
          <div class="game-card__rating">
            ${Array(game.rating || 5).fill('<svg class="game-card__star" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>').join('')}
          </div>
        </div>
        <div class="game-card__play">
          <button class="btn btn--primary btn--sm game-card__play-btn">PLAY</button>
        </div>
      </article>
    `).join('');
    
    // Initialize individual card components
    this.cardComponents = [];
    $$('.game-card', this.grid).forEach((cardEl, index) => {
      const game = this.state.filteredGames[index];
      const card = new GameCard(cardEl, game);
      this.cardComponents.push(card);
    });
  }
  
  onDestroy() {
    // Destroy all card components
    this.cardComponents?.forEach(card => card.destroy());
  }
}
