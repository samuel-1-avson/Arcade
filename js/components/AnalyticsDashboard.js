/**
 * AnalyticsDashboard - Player Statistics Visualization Component
 * Displays game performance, achievements, and progression data
 */

import { globalStateManager } from '../services/GlobalStateManager.js';
import { achievementService } from '../services/AchievementService.js';
import { eventBus } from './EventBus.js';
import { logger, LogCategory } from '../utils/logger.js';

// Chart colors
const CHART_COLORS = {
    primary: '#ff6b35',
    secondary: '#4a9eff',
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#f87171',
    muted: '#6b7280',
    grid: 'rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)'
};

/**
 * AnalyticsDashboard Class
 */
export class AnalyticsDashboard {
    constructor() {
        this.container = null;
        this.charts = {};
        this.data = null;
        this.isVisible = false;
    }

    /**
     * Render the dashboard in a container
     * @param {HTMLElement|string} container - Container element or selector
     */
    async render(container) {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!this.container) {
            logger.error(LogCategory.ANALYTICS, '[AnalyticsDashboard] Container not found');
            return;
        }

        // Fetch data
        this.data = this.gatherData();
        
        // Build HTML
        this.container.innerHTML = this.buildDashboardHTML();
        
        // Render charts
        this.renderCharts();
        
        // Setup event listeners
        this.setupEventListeners();
        
        this.isVisible = true;
        logger.info(LogCategory.ANALYTICS, '[AnalyticsDashboard] Rendered');
    }

    /**
     * Gather all analytics data
     */
    gatherData() {
        const profile = globalStateManager.getProfile();
        const stats = globalStateManager.getStatistics();
        const achievements = achievementService.getAllAchievements();
        
        // Calculate additional metrics
        const gameStats = stats.gameStats || {};
        const gamesWithData = Object.entries(gameStats).filter(([_, s]) => s.played > 0);
        
        const totalGames = gamesWithData.length;
        const avgScore = totalGames > 0 
            ? Math.round(gamesWithData.reduce((sum, [_, s]) => sum + (s.totalScore || 0), 0) / totalGames) 
            : 0;
        
        // Build game performance data
        const gamePerformance = gamesWithData.map(([gameId, s]) => ({
            gameId,
            name: this.formatGameName(gameId),
            highScore: s.highScore || 0,
            played: s.played || 0,
            achievements: s.achievements || 0,
            avgScore: s.played > 0 ? Math.round((s.totalScore || 0) / s.played) : 0
        })).sort((a, b) => b.highScore - a.highScore);

        return {
            profile,
            stats,
            achievements,
            metrics: {
                totalGames,
                avgScore,
                totalPlayTime: stats.totalPlayTime || 0,
                totalScore: stats.totalScore || 0,
                perfectRuns: stats.perfectRuns || 0,
                longestStreak: stats.longestStreak || 0,
                currentStreak: stats.currentStreak || 0
            },
            gamePerformance
        };
    }

    /**
     * Build the dashboard HTML
     */
    buildDashboardHTML() {
        const { profile, metrics, achievements, gamePerformance } = this.data;
        
        return `
            <div class="analytics-dashboard">
                <div class="dashboard-header">
                    <h2 class="dashboard-title">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3v18h18"></path>
                            <path d="M7 16l4-8 4 10 3-6 3 4"></path>
                        </svg>
                        Player Analytics
                    </h2>
                    <button class="dashboard-close" id="close-dashboard">×</button>
                </div>

                <!-- Quick Stats Row -->
                <div class="stats-grid">
                    ${this.buildStatCard('Level', profile.level, 'level', CHART_COLORS.primary)}
                    ${this.buildStatCard('Total XP', this.formatNumber(profile.xp), 'xp', CHART_COLORS.secondary)}
                    ${this.buildStatCard('Games Played', metrics.totalGames, 'games', CHART_COLORS.success)}
                    ${this.buildStatCard('Play Time', this.formatTime(metrics.totalPlayTime), 'time', CHART_COLORS.warning)}
                    ${this.buildStatCard('Perfect Runs', metrics.perfectRuns, 'perfect', CHART_COLORS.danger)}
                    ${this.buildStatCard('Best Streak', metrics.longestStreak + ' days', 'streak', '#9966ff')}
                </div>

                <!-- Charts Section -->
                <div class="charts-section">
                    <div class="chart-container">
                        <h3 class="chart-title">Score by Game</h3>
                        <canvas id="chart-scores" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3 class="chart-title">Play Session Distribution</h3>
                        <canvas id="chart-sessions" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- Game Performance Table -->
                <div class="table-section">
                    <h3 class="section-title">Game Performance</h3>
                    <table class="performance-table">
                        <thead>
                            <tr>
                                <th>Game</th>
                                <th>High Score</th>
                                <th>Sessions</th>
                                <th>Avg Score</th>
                                <th>Achievements</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${gamePerformance.map(g => `
                                <tr>
                                    <td class="game-name">${g.name}</td>
                                    <td class="score">${this.formatNumber(g.highScore)}</td>
                                    <td>${g.played}</td>
                                    <td>${this.formatNumber(g.avgScore)}</td>
                                    <td>
                                        <span class="achievement-badge">${g.achievements}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Achievements Summary -->
                <div class="achievements-section">
                    <h3 class="section-title">Achievements Progress</h3>
                    <div class="achievement-progress">
                        <div class="progress-bar" style="--progress: ${(achievements.total / 50) * 100}%">
                            <span>${achievements.total} / 50</span>
                        </div>
                    </div>
                    <div class="achievement-categories">
                        ${Object.entries(achievements.byGame || {}).slice(0, 6).map(([gameId, data]) => `
                            <div class="category-item">
                                <span class="category-name">${this.formatGameName(gameId)}</span>
                                <span class="category-count">${data.count || 0}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <style>
                .analytics-dashboard {
                    background: linear-gradient(145deg, #1a1a2e, #16213e);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 24px;
                    color: #e8eaed;
                    font-family: 'Inter', -apple-system, sans-serif;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .dashboard-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: ${CHART_COLORS.primary};
                    margin: 0;
                }

                .dashboard-close {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 0 8px;
                    line-height: 1;
                }

                .dashboard-close:hover {
                    color: #e8eaed;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .stat-card {
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                    padding: 16px;
                    text-align: center;
                    border-left: 3px solid var(--accent-color);
                }

                .stat-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--accent-color);
                    margin-bottom: 4px;
                }

                .stat-label {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .charts-section {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 24px;
                    margin-bottom: 24px;
                }

                .chart-container {
                    background: rgba(0,0,0,0.2);
                    border-radius: 8px;
                    padding: 16px;
                }

                .chart-title {
                    font-size: 0.9rem;
                    color: #9ca3af;
                    margin: 0 0 12px 0;
                }

                .section-title {
                    font-size: 1rem;
                    color: #9ca3af;
                    margin: 0 0 16px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .performance-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }

                .performance-table th {
                    text-align: left;
                    padding: 12px 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    color: #6b7280;
                    font-weight: 500;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                }

                .performance-table td {
                    padding: 12px 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }

                .performance-table tr:hover {
                    background: rgba(255,255,255,0.03);
                }

                .game-name {
                    font-weight: 500;
                    color: ${CHART_COLORS.secondary};
                }

                .score {
                    font-family: 'JetBrains Mono', monospace;
                    color: ${CHART_COLORS.success};
                }

                .achievement-badge {
                    background: ${CHART_COLORS.warning};
                    color: #000;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .achievements-section {
                    margin-top: 24px;
                }

                .achievement-progress {
                    margin-bottom: 16px;
                }

                .progress-bar {
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    height: 32px;
                    position: relative;
                    overflow: hidden;
                }

                .progress-bar::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    width: var(--progress);
                    background: linear-gradient(90deg, ${CHART_COLORS.primary}, ${CHART_COLORS.warning});
                    border-radius: 8px;
                }

                .progress-bar span {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    font-weight: 600;
                    font-size: 0.85rem;
                    z-index: 1;
                }

                .achievement-categories {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 12px;
                }

                .category-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255,255,255,0.05);
                    padding: 10px 14px;
                    border-radius: 6px;
                }

                .category-name {
                    font-size: 0.85rem;
                }

                .category-count {
                    font-weight: 600;
                    color: ${CHART_COLORS.primary};
                }

                .table-section {
                    max-height: 300px;
                    overflow-y: auto;
                }
            </style>
        `;
    }

    /**
     * Build a stat card HTML
     */
    buildStatCard(label, value, type, color) {
        return `
            <div class="stat-card" style="--accent-color: ${color}">
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
            </div>
        `;
    }

    /**
     * Render canvas charts
     */
    renderCharts() {
        this.renderScoresChart();
        this.renderSessionsChart();
    }

    /**
     * Render bar chart for scores by game
     */
    renderScoresChart() {
        const canvas = document.getElementById('chart-scores');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.data.gamePerformance.slice(0, 8);
        
        if (data.length === 0) {
            ctx.fillStyle = CHART_COLORS.muted;
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data yet', canvas.width / 2, canvas.height / 2);
            return;
        }

        const padding = 40;
        const barWidth = (canvas.width - padding * 2) / data.length - 10;
        const maxScore = Math.max(...data.map(d => d.highScore)) || 100;
        const chartHeight = canvas.height - padding * 2;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = CHART_COLORS.grid;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }

        // Draw bars
        data.forEach((game, i) => {
            const x = padding + i * (barWidth + 10);
            const barHeight = (game.highScore / maxScore) * chartHeight;
            const y = canvas.height - padding - barHeight;

            // Gradient bar
            const gradient = ctx.createLinearGradient(x, y, x, canvas.height - padding);
            gradient.addColorStop(0, CHART_COLORS.primary);
            gradient.addColorStop(1, CHART_COLORS.secondary);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Label
            ctx.fillStyle = CHART_COLORS.muted;
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(x + barWidth / 2, canvas.height - 10);
            ctx.rotate(-Math.PI / 6);
            ctx.fillText(game.name.slice(0, 8), 0, 0);
            ctx.restore();
        });
    }

    /**
     * Render donut chart for session distribution
     */
    renderSessionsChart() {
        const canvas = document.getElementById('chart-sessions');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.data.gamePerformance.slice(0, 6);
        
        if (data.length === 0) {
            ctx.fillStyle = CHART_COLORS.muted;
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data yet', canvas.width / 2, canvas.height / 2);
            return;
        }

        const total = data.reduce((sum, d) => sum + d.played, 0) || 1;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        const innerRadius = radius * 0.6;

        const colors = [
            CHART_COLORS.primary,
            CHART_COLORS.secondary,
            CHART_COLORS.success,
            CHART_COLORS.warning,
            CHART_COLORS.danger,
            '#9966ff'
        ];

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let currentAngle = -Math.PI / 2;

        data.forEach((game, i) => {
            const sliceAngle = (game.played / total) * Math.PI * 2;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();

            currentAngle += sliceAngle;
        });

        // Center text
        ctx.fillStyle = '#e8eaed';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total.toString(), centerX, centerY - 8);
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = CHART_COLORS.muted;
        ctx.fillText('sessions', centerX, centerY + 12);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const closeBtn = document.getElementById('close-dashboard');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
    }

    /**
     * Hide the dashboard
     */
    hide() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.isVisible = false;
        eventBus.emit('dashboardClosed', {});
    }

    /**
     * Refresh data and re-render
     */
    refresh() {
        if (this.isVisible && this.container) {
            this.render(this.container);
        }
    }

    // ============ UTILITY ============

    formatGameName(gameId) {
        const names = {
            snake: 'Snake',
            tetris: 'Tetris',
            pacman: 'Pac-Man',
            asteroids: 'Asteroids',
            breakout: 'Breakout',
            minesweeper: 'Minesweeper',
            rhythm: 'Rhythm',
            roguelike: 'Roguelike',
            'tower-defense': 'Tower Defense',
            hub: 'Hub'
        };
        return names[gameId] || gameId.charAt(0).toUpperCase() + gameId.slice(1);
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    formatTime(minutes) {
        if (!minutes) return '0m';
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (hours < 24) return `${hours}h ${mins}m`;
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }
}

// Singleton instance
export const analyticsDashboard = new AnalyticsDashboard();
export default AnalyticsDashboard;
