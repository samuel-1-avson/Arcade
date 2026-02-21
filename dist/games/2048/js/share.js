/**
 * Share Feature for 2048
 * Screenshot generation and social sharing
 */

class ShareManager {
    constructor() {
        this.canvasCache = null;
    }

    /**
     * Generate screenshot of current game board
     */
    async generateScreenshot() {
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) return null;

        // Create a canvas to draw the game state
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 700;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#fafafa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#2c3e50';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('2048', canvas.width / 2, 60);

        // Score
        const score = document.querySelector('.score-container')?.textContent || '0';
        ctx.font = '32px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, 110);

        // Draw simplified game board
        const gridSize = 4;
        const cellSize = 120;
        const gap = 12;
        const startX = (canvas.width - (gridSize * cellSize + (gridSize - 1) * gap)) / 2;
        const startY = 150;

        // Get all tiles
        const tiles = document.querySelectorAll('.tile');
        const tileData = Array.from(tiles).map(tile => {
            const transform = tile.style.transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
            const x = transform ? parseFloat(transform[1]) : 0;
            const y = transform ? parseFloat(transform[2]) : 0;
            const value = tile.textContent;
            return { x, y, value };
        });

        // Draw grid background
        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(startX - gap, startY - gap, 
                     gridSize * cellSize + (gridSize + 1) * gap, 
                     gridSize * cellSize + (gridSize + 1) * gap);

        // Draw grid cells
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                ctx.fillStyle = '#f5f5f5';
                ctx.fillRect(
                    startX + col * (cellSize + gap),
                    startY + row * (cellSize + gap),
                    cellSize,
                    cellSize
                );
            }
        }

        // Draw tiles
        tileData.forEach(({ x, y, value }) => {
            const tileValue = parseInt(value);
            const col = Math.round(x / (cellSize + gap));
            const row = Math.round(y / (cellSize + gap));

            const tileX = startX + col * (cellSize + gap);
            const tileY = startY + row * (cellSize + gap);

            // Tile background
            ctx.fillStyle = this.getTileColor(tileValue);
            ctx.fillRect(tileX, tileY, cellSize, cellSize);

            // Tile text
            ctx.fillStyle = tileValue <= 4 ? '#776e65' : '#f9f6f3';
            ctx.font = tileValue >= 1000 ? 'bold 32px Arial' : 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value, tileX + cellSize / 2, tileY + cellSize / 2);
        });

        // Footer
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '20px Arial';
        ctx.fillText('Created with 2048 | Arcade Hub', canvas.width / 2, canvas.height - 30);

        return canvas;
    }

    getTileColor(value) {
        const colors = {
            2: '#eee4da',
            4: '#ede0c8',
            8: '#f2b179',
            16: '#f59563',
            32: '#f67c5f',
            64: '#f65e3b',
            128: '#edcf72',
            256: '#edcc61',
            512: '#edc850',
            1024: '#edc53f',
            2048: '#edc22e'
        };
        return colors[value] || '#3c3a32';
    }

    /**
     * Download screenshot
     */
    async downloadScreenshot() {
        const canvas = await this.generateScreenshot();
        if (!canvas) return;

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `2048-game-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    /**
     * Share to social media
     */
    shareToTwitter(score, highestTile) {
        const text = `I scored ${score} points and reached the ${highestTile} tile in 2048! 🎮`;
        const url = encodeURIComponent(window.location.href);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    }

    /**
     * Copy score to clipboard
     */
    async copyScore(score, highestTile) {
        const text = `I scored ${score} points and reached the ${highestTile} tile in 2048!`;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Score copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    /**
     * Show share modal
     */
    showShareModal() {
        const score = document.querySelector('.score-container')?.textContent || '0';
        const bestScore = document.querySelector('.best-container')?.textContent || '0';
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-content share-modal">
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h2>Share Your Game</h2>
                
                <div class="share-preview">
                    <div class="share-score">
                        <div class="share-label">Current Score</div>
                        <div class="share-value">${score}</div>
                    </div>
                    <div class="share-score">
                        <div class="share-label">Best Score</div>
                        <div class="share-value">${bestScore}</div>
                    </div>
                </div>

                <div class="share-buttons">
                    <button class="share-btn twitter" onclick="shareManager.shareToTwitter(${score}, 2048)">
                        <span>🐦</span> Share on Twitter
                    </button>
                    <button class="share-btn download" onclick="shareManager.downloadScreenshot()">
                        <span>📸</span> Download Screenshot
                    </button>
                    <button class="share-btn copy" onclick="shareManager.copyScore(${score}, 2048)">
                        <span>📋</span> Copy Score
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'share-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Initialize share manager
const shareManager = new ShareManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShareManager;
}
