/**
 * Daily Challenges System for 2048
 * Generates unique puzzles each day with seeded randomness
 */

class DailyChallengeManager {
    constructor() {
        this.challenges = this.loadChallenges();
        this.currentStreak = this.loadStreak();
    }

    loadChallenges() {
        const saved = localStorage.getItem('2048-daily-challenges');
        return saved ? JSON.parse(saved) : {};
    }

    saveChallenges() {
        localStorage.setItem('2048-daily-challenges', JSON.stringify(this.challenges));
    }

    loadStreak() {
        return parseInt(localStorage.getItem('2048-challenge-streak') || '0');
    }

    saveStreak() {
        localStorage.setItem('2048-challenge-streak', this.currentStreak.toString());
    }

    getTodayKey() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    }

    generateChallenges() {
        const todayKey = this.getTodayKey();
        
        // Return existing if tracked
        if (this.challenges[todayKey] && Array.isArray(this.challenges[todayKey])) {
            return this.challenges[todayKey];
        }

        // Generate seeded randomness
        const seed = this.hashCode(todayKey);
        const rng = this.seededRandom(seed);

        const difficulties = ['Easy', 'Medium', 'Hard'];
        const dailySet = difficulties.map((diff, index) => {
            return this.createChallengeForDifficulty(diff, rng, index);
        });

        this.challenges[todayKey] = dailySet;
        this.saveChallenges();

        return dailySet;
    }

    createChallengeForDifficulty(difficulty, rng, index) {
        const templates = {
            'Easy': [
                { name: 'Score Starter', description: 'Reach 2,000 points', goal: { type: 'score', target: 2000 } },
                { name: 'Tile Beginner', description: 'Find the 128 tile', goal: { type: 'tile', target: 128 } },
                { name: 'Quick Win', description: 'Play 50 moves', goal: { type: 'moves_played', target: 50 } } // changed to moves played for easy
            ],
            'Medium': [
                { name: 'Score Runner', description: 'Reach 10,000 points', goal: { type: 'score', target: 10000 } },
                { name: 'Tile Hunter', description: 'Find the 512 tile', goal: { type: 'tile', target: 512 } },
                { name: 'Survivor', description: 'Reach 256 without undo', goal: { type: 'no_undo', tile: 256 } }
            ],
            'Hard': [
                { name: 'Score Master', description: 'Reach 25,000 points', goal: { type: 'score', target: 25000 } },
                { name: 'Tile Legend', description: 'Find the 2048 tile', goal: { type: 'tile', target: 2048 } },
                { name: 'Speed Demon', description: 'Reach 1024 in 4 mins', goal: { type: 'time', target: 240, tile: 1024 } }
            ]
        };

        const pool = templates[difficulty];
        // simple rotation based on date seed to ensure variety
        const template = pool[Math.floor(rng() * pool.length)]; 

        return {
            id: `${this.getTodayKey()}-${difficulty}`,
            ...template,
            difficulty: difficulty,
            completed: false,
            reward: this.calculateReward(difficulty)
        };
    }

    // ... hashCode and seededRandom ...

    checkChallengeProgress(gameState) {
        const todayKey = this.getTodayKey();
        const dailySet = this.challenges[todayKey];

        if (!dailySet || !Array.isArray(dailySet)) return;

        dailySet.forEach(challenge => {
            if (challenge.completed) return;

            let completed = false;
            switch (challenge.goal.type) {
                case 'score': completed = gameState.score >= challenge.goal.target; break;
                case 'tile': completed = gameState.highestTile >= challenge.goal.target; break;
                case 'moves_played': completed = (gameState.moves || 0) >= challenge.goal.target; break;
                case 'time': completed = gameState.highestTile >= challenge.goal.tile && gameState.timeElapsed <= challenge.goal.target; break;
                case 'no_undo': completed = gameState.highestTile >= challenge.goal.tile && (gameState.undosUsed || 0) === 0; break;
            }

            if (completed) {
                challenge.completed = true;
                this.saveChallenges();
                this.updateStreak(); // Check if all completed? Or just one? Let's say any challenge contributes to activity, but maybe bonus for all? 
                // For simplicity, just mark complete.
                this.showCompletionNotification(challenge);
            }
        });
    }

    // Updated updateStreak logic to counting days with AT LEAST ONE challenge completed
    updateStreak() {
        const todayKey = this.getTodayKey();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

        // If this is the FIRST completion for today, increment streak if yesterday was active
        const todayChallenges = this.challenges[todayKey];
        const completedToday = todayChallenges.filter(c => c.completed).length;
        
        if (completedToday === 1) { // Only on the first one
             if (this.challenges[yesterdayKey] && this.challenges[yesterdayKey].some(c => c.completed)) {
                this.currentStreak++;
             } else {
                 if (this.currentStreak === 0) this.currentStreak = 1; 
                 // If streak was broken, it resets to 1 today
             }
             this.saveStreak();
        }
    }

    showChallengeModal() {
        const dailySet = this.generateChallenges();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const cardsHTML = dailySet.map(challenge => `
            <div class="challenge-card ${challenge.completed ? 'completed' : ''}">
                <div class="challenge-ribbon ${challenge.difficulty.toLowerCase()}">
                     <span>${challenge.difficulty}</span>
                </div>
                <div class="challenge-header">
                    <span class="challenge-name">${challenge.name}</span>
                </div>
                <div class="challenge-desc">${challenge.description}</div>
                <div class="challenge-footer">
                    <span class="challenge-reward"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="margin-right:2px; vertical-align:text-top;"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg> +${challenge.reward.xp} XP</span>
                    ${challenge.completed ? '<span class="challenge-status"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="margin-right:2px; vertical-align:text-top;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> COMPLETED</span>' : ''}
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content challenge-modal">
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2><svg viewBox="0 0 24 24" width="24" height="24" fill="#ff4d00" style="vertical-align: text-bottom; margin-right: 10px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> Daily Challenges</h2>
                
                <div class="streak-display">
                     <div class="streak-item">
                        <div class="streak-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        </div>
                        <div class="streak-text">${this.currentStreak} Day Streak</div>
                     </div>
                     <div class="streak-divider"></div>
                     <div class="streak-item">
                        <div class="streak-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"/></svg>
                        </div>
                        <div class="streak-text">${new Date().toLocaleDateString()}</div>
                     </div>
                </div>

                <div class="challenges-list">
                    ${cardsHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    getDifficultyColor(diff) {
        return diff === 'Easy' ? '#8bc34a' : diff === 'Medium' ? '#ff9800' : '#f44336';
    }

    // Keep helper methods (hashCode, seededRandom, calculateReward)
    
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return Math.abs(hash);
    }

    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    calculateReward(difficulty) {
        const rewards = {
            'Easy': { xp: 50, powerUps: 1 },
            'Medium': { xp: 100, powerUps: 2 },
            'Hard': { xp: 200, powerUps: 3 }
        };
        return rewards[difficulty] || rewards['Easy'];
    }

    renderChallengeHistory() { return ''; }

    showCompletionNotification(challenge) {
        const notification = document.createElement('div');
        notification.className = 'challenge-complete-toast';
        notification.innerHTML = `
            <div class="challenge-complete-icon"><svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>
            <div class="challenge-complete-info">
                <div class="challenge-complete-header">CHALLENGE COMPLETE</div>
                <div class="challenge-complete-title">${challenge.name}</div>
                <div class="challenge-complete-rewards">
                    <span>+${challenge.reward.xp} XP</span>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        requestAnimationFrame(() => notification.classList.add('show'));
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

}

// Initialize daily challenge manager
const dailyChallengeManager = new DailyChallengeManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DailyChallengeManager;
}
