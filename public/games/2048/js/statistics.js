/**
 * Statistics Dashboard for 2048
 * Tracks and displays player statistics with minimal charts
 */

class StatisticsManager {
    constructor() {
        this.stats = this.loadStats();
    }

    loadStats() {
        const saved = localStorage.getItem('2048-statistics');
        if (saved) {
            return JSON.parse(saved);
        }

        return {
            gamesPlayed: 0,
            gamesWon: 0,
            totalScore: 0,
            highestScore: 0,
            highestTile: 0,
            totalMoves: 0,
            totalTime: 0,
            powerUpsUsed: 0,
            undosUsed: 0,
            averageScore: 0,
            winRate: 0,
            scoreHistory: [],
            tileHistory: {}
        };
    }

    saveStats() {
        localStorage.setItem('2048-statistics', JSON.stringify(this.stats));
    }

    recordGame(gameData) {
        this.stats.gamesPlayed++;
        if (gameData.won) this.stats.gamesWon++;
        
        this.stats.totalScore += gameData.score;
        this.stats.highestScore = Math.max(this.stats.highestScore, gameData.score);
        this.stats.highestTile = Math.max(this.stats.highestTile, gameData.highestTile);
        this.stats.totalMoves += gameData.moves || 0;
        this.stats.totalTime += gameData.timeElapsed || 0;
        
        // Calculate averages
        this.stats.averageScore = Math.round(this.stats.totalScore / this.stats.gamesPlayed);
        this.stats.winRate = Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100);
        
        // Record score history (keep last 20 games)
        this.stats.scoreHistory.push(gameData.score);
        if (this.stats.scoreHistory.length > 20) {
            this.stats.scoreHistory.shift();
        }

        // Track tile distribution
        if (gameData.highestTile) {
            this.stats.tileHistory[gameData.highestTile] = 
                (this.stats.tileHistory[gameData.highestTile] || 0) + 1;
        }

        this.saveStats();
    }

    recordPowerUpUsed(powerUpId) {
        this.stats.powerUpsUsed++;
        this.saveStats();
    }

    recordUndo() {
        this.stats.undosUsed++;
        this.saveStats();
    }

    showDashboard() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-content stats-modal">
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2><svg viewBox="0 0 24 24" width="24" height="24" fill="#ff4d00" style="vertical-align: text-bottom; margin-right: 10px;"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg> Statistics</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.gamesPlayed}</div>
                        <div class="stat-label">Games Played</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.gamesWon}</div>
                        <div class="stat-label">Games Won</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.winRate}%</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.highestScore.toLocaleString()}</div>
                        <div class="stat-label">Highest Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.highestTile}</div>
                        <div class="stat-label">Highest Tile</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.averageScore.toLocaleString()}</div>
                        <div class="stat-label">Average Score</div>
                    </div>
                </div>

                <h3><svg viewBox="0 0 24 24" width="20" height="20" fill="#ff4d00" style="vertical-align: text-bottom; margin-right: 8px;"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg> Score History</h3>
                <div class="stats-chart">
                    <div class="chart-container">
                        ${this.renderScoreChart()}
                    </div>
                    <div style="text-align: center; font-size: 11px; color: #999; margin-top: 5px;">Last 20 Games</div>
                </div>

                <h3><svg viewBox="0 0 24 24" width="20" height="20" fill="#ff4d00" style="vertical-align: text-bottom; margin-right: 8px;"><path d="M17 19h2v-8h-2v8zm-4 4h2V7h-2v16zm-4-4h2v-4H9v4zm-6 0h2v-2H3v2z"/></svg> Tile Distribution</h3>
                <div class="stats-tiles">
                    <div class="tile-bars">
                        ${this.renderTileDistribution()}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn-secondary" onclick="statisticsManager.resetStats()">Reset Stats</button>
                    <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    renderScoreChart() {
        if (this.stats.scoreHistory.length === 0) {
            return '<p class="no-data">No games played yet</p>';
        }

        const maxScore = Math.max(...this.stats.scoreHistory);
        
        return this.stats.scoreHistory.map((score, index) => {
            const height = (score / maxScore) * 100;
            return `
                <div class="chart-bar" style="height: ${height}%" title="Game ${index + 1}: ${score}">
                    <div class="bar-fill"></div>
                </div>
            `;
        }).join('');
    }

    renderTileDistribution() {
        const tiles = Object.entries(this.stats.tileHistory)
            .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

        if (tiles.length === 0) {
            return '<p class="no-data">No data yet</p>';
        }

        const maxCount = Math.max(...tiles.map(([_, count]) => count));

        return tiles.map(([tile, count]) => {
            const width = (count / maxCount) * 100;
            return `
                <div class="tile-bar-row">
                    <div class="tile-label">${tile}</div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${width}%"></div>
                    </div>
                    <div class="tile-count">${count}</div>
                </div>
            `;
        }).join('');
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    getStats() {
        return { ...this.stats };
    }

    resetStats() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            this.stats = {
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                highestScore: 0,
                highestTile: 0,
                totalMoves: 0,
                totalTime: 0,
                powerUpsUsed: 0,
                undosUsed: 0,
                averageScore: 0,
                winRate: 0,
                scoreHistory: [],
                tileHistory: {}
            };
            this.saveStats();
        }
    }
}

// Initialize statistics manager
const statisticsManager = new StatisticsManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsManager;
}
