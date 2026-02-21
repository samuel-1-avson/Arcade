/**
 * Sidebar UI - Creates left and right sidebars with feature panels
 * Minimal retro clean design
 */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', initializeSidebars);

    function initializeSidebars() {
        // Remove old menu bar
        const oldMenuBar = document.querySelector('.feature-menu-bar');
        if (oldMenuBar) oldMenuBar.remove();

        // Create wrapper structure
        createLayoutWrapper();
        
        // Create sidebars
        createLeftSidebar();
        createRightSidebar();
        
        // Update data periodically
        setInterval(updateSidebarData, 2000);
        
        console.log('✅ Sidebars initialized');
    }

    function createLayoutWrapper() {
        const container = document.querySelector('.container');
        if (!container) return;

        // Create main wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'game-layout-wrapper';
        
        // Move container into wrapper
        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(container);
        
        // Add sidebar containers
        const leftSidebar = document.createElement('aside');
        leftSidebar.className = 'sidebar sidebar-left';
        leftSidebar.id = 'sidebar-left';
        
        const rightSidebar = document.createElement('aside');
        rightSidebar.className = 'sidebar sidebar-right';
        rightSidebar.id = 'sidebar-right';
        
        wrapper.insertBefore(leftSidebar, container);
        wrapper.appendChild(rightSidebar);
    }

    function createLeftSidebar() {
        const sidebar = document.getElementById('sidebar-left');
        if (!sidebar) return;

        sidebar.innerHTML = `
            <!-- Stats Panel -->
            <div class="sidebar-panel" id="stats-panel">
                <h3 class="panel-title"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="vertical-align: text-bottom; margin-right: 5px;"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg> Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value" id="stat-games">0</span>
                        <span class="stat-label">Games</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="stat-wins">0%</span>
                        <span class="stat-label">Win Rate</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="stat-best">0</span>
                        <span class="stat-label">Best Score</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="stat-tile">0</span>
                        <span class="stat-label">Best Tile</span>
                    </div>
                </div>
                <button class="panel-btn" onclick="statisticsManager.showDashboard()">View All Stats →</button>
            </div>

            <!-- Achievements Panel -->
            <div class="sidebar-panel" id="achievements-panel">
                <h3 class="panel-title"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="vertical-align: text-bottom; margin-right: 5px;"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg> Achievements</h3>
                <div class="achievement-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="achievement-progress" style="width: 0%"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:5px; color:#8f7a66;">
                         <span id="achievement-count">0/21</span>
                         <span>Unlocked</span>
                    </div>
                </div>
                
                <!-- NEW: Recent icons grid -->
                <div class="achievement-mini-grid" id="achievement-mini-grid" style="display:flex; gap:5px; flex-wrap:wrap; margin:15px 0;">
                     <!-- Icons injected here -->
                </div>
                
                <button class="panel-btn" onclick="achievementsManager.showGallery()">View All →</button>
            </div>

            <!-- Level Panel -->
            <div class="sidebar-panel" id="level-panel">
                <h3 class="panel-title"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="vertical-align: text-bottom; margin-right: 5px;"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> Level Progress</h3>
                <div class="level-info">
                    <div class="level-badge" id="level-badge" style="animation: pulse 2s infinite;">1</div>
                    <div class="level-details">
                        <div class="xp-text" id="xp-text">0 / 100 XP</div>
                        <div class="xp-bar">
                            <div class="xp-fill" id="xp-fill" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function createRightSidebar() {
        const sidebar = document.getElementById('sidebar-right');
        if (!sidebar) return;

        sidebar.innerHTML = `
            <!-- Leaderboard Panel -->
            <div class="sidebar-panel" id="leaderboard-panel">
                <h3 class="panel-title"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="vertical-align: text-bottom; margin-right: 5px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41C17.92 5.77 20 8.65 20 12c0 2.08-.81 3.98-2.11 5.39z"/></svg> Leaderboard (Top 5)</h3>
                <div class="leaderboard-mini" id="leaderboard-mini">
                    <div class="loading" style="text-align:center; padding:10px; font-size:12px;">Loading...</div>
                </div>
                <button class="panel-btn" onclick="leaderboardManager.showLeaderboard()">Full Rankings →</button>
            </div>

            <!-- Daily Challenge Panel -->
            <div class="sidebar-panel" id="daily-panel">
                <h3 class="panel-title"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="vertical-align: text-bottom; margin-right: 5px;"><path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 8.88 3.52l3.45 3.45L15.66 3l-2.1-2.1a9.99 9.99 0 0 0-7.07 2.93 9.93 9.93 0 0 0-2.43 3.98C4.06 7.8 4 7.9 4 8c0 .1.06.2.16.2.06 0 .11-.04.16-.09l1.63-1.63a7.97 7.97 0 0 1 9.8 1.95L18.66 6c.55.55 1.54 2.76 1.72 2.57zM12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg> Daily Challenges</h3>
                <div class="daily-challenges-list" id="daily-challenges-list" style="margin-bottom:15px;">
                     <!-- Challenge items injected here -->
                </div>
                
                <div class="streak-display">
                    <span class="streak-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="#ff4d00"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg></span>
                    <span class="streak-count" id="streak-count">0</span>
                    <span class="streak-label">Day Streak</span>
                </div>
                <button class="panel-btn" onclick="dailyChallengeManager.showChallengeModal()">View Details →</button>
            </div>

            <!-- Game Modes Panel -->
            <div class="sidebar-panel" id="modes-panel">
                <h3 class="panel-title"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="vertical-align: text-bottom; margin-right: 5px;"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg> Game Modes</h3>
                <div class="modes-list">
                    <button class="mode-btn active" data-mode="classic" onclick="selectMode('classic')">
                        <span class="mode-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg></span>
                        <span class="mode-name">Classic</span>
                    </button>
                    <button class="mode-btn" data-mode="timeattack" onclick="selectMode('timeattack')">
                        <span class="mode-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg></span>
                        <span class="mode-name">Time Attack</span>
                    </button>
                    <button class="mode-btn" data-mode="zen" onclick="selectMode('zen')">
                        <span class="mode-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg></span>
                        <span class="mode-name">Zen Mode</span>
                    </button>
                </div>
            </div>

            <!-- Share Panel -->
            <div class="sidebar-panel sidebar-panel-small" id="share-panel">
                <button class="share-btn" onclick="shareManager.showShareModal()">
                    <span><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg></span> Share Score
                </button>
            </div>
        `;
    }

    // Mode selection
    window.selectMode = function(mode) {
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');
        
        if (window.gameModesManager) {
            window.gameModesManager.setMode(mode);
        }
    };

    // Update sidebar data
    function updateSidebarData() {
        // Stats
        if (window.statisticsManager) {
            const stats = statisticsManager.getStats ? statisticsManager.getStats() : statisticsManager.stats;
            if (stats) {
                document.getElementById('stat-games').textContent = stats.gamesPlayed || 0;
                document.getElementById('stat-wins').textContent = 
                    stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) + '%' : '0%';
                document.getElementById('stat-best').textContent = (stats.highestScore || 0).toLocaleString();
                document.getElementById('stat-tile').textContent = stats.highestTile || 0;
            }
        }

        // Achievements
        if (window.achievementsManager) {
            const unlocked = Object.values(achievementsManager.achievements || {}).filter(a => a.unlocked);
            const total = Object.keys(achievementsManager.achievements || {}).length || 21;
            
            const progress = (unlocked.length / total) * 100;
            const pb = document.getElementById('achievement-progress');
            if(pb) pb.style.width = progress + '%';
            
            const ac = document.getElementById('achievement-count');
            if(ac) ac.textContent = `${unlocked.length}/${total}`;

            // Update mini grid with last 5 unlocked icons
            const miniGrid = document.getElementById('achievement-mini-grid');
            if (miniGrid) {
                const recent = unlocked.slice(-5).reverse(); // Show last 5
                if (recent.length === 0) {
                    miniGrid.innerHTML = '<span style="font-size:12px; color:#aaa; font-style:italic;">No achievements yet</span>';
                } else {
                    miniGrid.innerHTML = recent.map(a => `
                        <div title="${a.name}" style="font-size:20px; cursor:help; animation: fadeIn 0.5s;">
                            ${a.icon}
                        </div>
                    `).join('');
                }
            }
        }

        // Level
        if (window.levelSystem) {
            const info = levelSystem.getLevelInfo ? levelSystem.getLevelInfo() : levelSystem;
            document.getElementById('level-badge').textContent = info.level || info.currentLevel || 1;
            document.getElementById('xp-text').textContent = 
                `${info.currentXP || 0} / ${info.xpForNext || info.getXPForNextLevel?.() || 100} XP`;
            document.getElementById('xp-fill').style.width = (info.progress || 0) + '%';
        }

        // Daily Challenge (3 items)
        if (window.dailyChallengeManager) {
            const challenges = window.dailyChallengeManager.generateChallenges ? window.dailyChallengeManager.generateChallenges() : [];
            const container = document.getElementById('daily-challenges-list');
            
            if (container && challenges.length > 0) {
                container.innerHTML = challenges.map(c => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:6px; background:${c.completed ? '#e8f5e9' : '#fff'}; border-radius:4px; margin-bottom:4px; border:1px solid #eee;">
                         <div style="display:flex; flex-direction:column;">
                             <span style="font-size:12px; font-weight:bold; color:#776e65;">${c.difficulty}</span>
                             <span style="font-size:10px; color:#999;">${c.completed ? '✅ Done' : '🎁 ' + c.reward.xp + ' XP'}</span>
                         </div>
                         <div style="font-size:16px;">
                            ${c.completed ? '🏆' : '🎯'}
                         </div>
                    </div>
                `).join('');
            }

            document.getElementById('streak-count').textContent = dailyChallengeManager.currentStreak || dailyChallengeManager.streak || 0;
        }

        // Leaderboard (Top 5)
        if (window.leaderboardManager) {
            leaderboardManager.getLeaderboard?.('alltime', 5).then(entries => {
                const container = document.getElementById('leaderboard-mini');
                if (container && entries && entries.length > 0) {
                    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                    container.innerHTML = entries.map((entry, i) => `
                        <div class="leaderboard-entry" style="padding: 5px 0; border-bottom: 1px dashed #eee;">
                            <span class="rank" style="width:25px; display:inline-block;">${medals[i] || (i+1)+'.'}</span>
                            <span class="name" style="font-weight:bold; color:#776e65;">${entry.playerName || 'Player'}</span>
                            <span class="score" style="float:right; color:#8f7a66;">${(entry.score || 0).toLocaleString()}</span>
                        </div>
                    `).join('');
                } else if (container) {
                     container.innerHTML = '<div style="text-align:center; padding:10px; font-size:12px; color:#aaa;">No scores yet</div>';
                }
            }).catch(() => {});
        }
    }

    // Initial update
    setTimeout(updateSidebarData, 500);
})();
