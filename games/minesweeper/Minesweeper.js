/**
 * Minesweeper Game - Find all mines without exploding
 */
import { storageManager } from '../../js/engine/StorageManager.js';
import { eventBus, GameEvents } from '../../js/engine/EventBus.js';

// Difficulty settings
const DIFFICULTIES = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
};

class Minesweeper {
    constructor() {
        this.gameId = 'minesweeper';
        this.board = document.getElementById('game-board');
        this.overlay = document.getElementById('game-overlay');
        
        // Game state
        this.grid = [];
        this.difficulty = 'easy';
        this.rows = 9;
        this.cols = 9;
        this.mineCount = 10;
        this.flagCount = 0;
        this.revealed = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        
        // Timer
        this.startTime = 0;
        this.timerInterval = null;
        
        // High scores
        this.highScores = {
            easy: storageManager.getHighScore(`${this.gameId}-easy`) || null,
            medium: storageManager.getHighScore(`${this.gameId}-medium`) || null,
            hard: storageManager.getHighScore(`${this.gameId}-hard`) || null
        };
        
        this.setupUI();
        this.newGame();
    }
    
    setupUI() {
        // Difficulty selector
        const diffSelect = document.getElementById('difficulty-select');
        if (diffSelect) {
            diffSelect.addEventListener('change', (e) => {
                this.difficulty = e.target.value;
                this.newGame();
            });
        }
        
        // Restart button
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.newGame();
        });
        
        // Start button in overlay
        document.getElementById('start-btn')?.addEventListener('click', () => {
            this.newGame();
        });
        
        // Prevent context menu
        this.board.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    newGame() {
        // Reset state
        const settings = DIFFICULTIES[this.difficulty];
        this.rows = settings.rows;
        this.cols = settings.cols;
        this.mineCount = settings.mines;
        this.flagCount = 0;
        this.revealed = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        
        // Stop timer
        this.stopTimer();
        this.updateTimer(0);
        
        // Hide overlay
        this.overlay.classList.add('hidden');
        
        // Initialize grid
        this.initializeGrid();
        this.renderBoard();
        this.updateMinesDisplay();
        this.updateHighScoreDisplay();
        
        storageManager.incrementGamesPlayed();
    }
    
    initializeGrid() {
        this.grid = [];
        
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = {
                    mine: false,
                    revealed: false,
                    flagged: false,
                    question: false,
                    adjacentMines: 0
                };
            }
        }
    }
    
    placeMines(excludeRow, excludeCol) {
        let placed = 0;
        
        while (placed < this.mineCount) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Don't place mine on first click or adjacent cells
            const isExcluded = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
            
            if (!this.grid[row][col].mine && !isExcluded) {
                this.grid[row][col].mine = true;
                placed++;
            }
        }
        
        // Calculate adjacent mine counts
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.grid[row][col].mine) {
                    this.grid[row][col].adjacentMines = this.countAdjacentMines(row, col);
                }
            }
        }
    }
    
    countAdjacentMines(row, col) {
        let count = 0;
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const r = row + dr;
                const c = col + dc;
                
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    if (this.grid[r][c].mine) count++;
                }
            }
        }
        
        return count;
    }
    
    renderBoard() {
        this.board.innerHTML = '';
        this.board.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell covered';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Left click - reveal
                cell.addEventListener('click', () => this.handleLeftClick(row, col));
                
                // Right click - flag
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(row, col);
                });
                
                // Middle click - chord
                cell.addEventListener('mousedown', (e) => {
                    if (e.button === 1) {
                        e.preventDefault();
                        this.handleChord(row, col);
                    }
                });
                
                // Touch support - long press for flag
                let touchTimer;
                cell.addEventListener('touchstart', (e) => {
                    touchTimer = setTimeout(() => {
                        e.preventDefault();
                        this.handleRightClick(row, col);
                    }, 500);
                });
                cell.addEventListener('touchend', () => clearTimeout(touchTimer));
                cell.addEventListener('touchmove', () => clearTimeout(touchTimer));
                
                this.board.appendChild(cell);
            }
        }
    }
    
    handleLeftClick(row, col) {
        if (this.gameOver) return;
        
        const cell = this.grid[row][col];
        if (cell.revealed || cell.flagged) return;
        
        // First click - place mines and start timer
        if (this.firstClick) {
            this.placeMines(row, col);
            this.startTimer();
            this.firstClick = false;
        }
        
        this.revealCell(row, col);
    }
    
    handleRightClick(row, col) {
        if (this.gameOver) return;
        
        const cell = this.grid[row][col];
        if (cell.revealed) return;
        
        // Cycle: covered -> flagged -> question -> covered
        if (!cell.flagged && !cell.question) {
            cell.flagged = true;
            this.flagCount++;
        } else if (cell.flagged) {
            cell.flagged = false;
            cell.question = true;
            this.flagCount--;
        } else {
            cell.question = false;
        }
        
        this.updateCellDisplay(row, col);
        this.updateMinesDisplay();
    }
    
    handleChord(row, col) {
        if (this.gameOver) return;
        
        const cell = this.grid[row][col];
        if (!cell.revealed || cell.adjacentMines === 0) return;
        
        // Count adjacent flags
        let flagCount = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    if (this.grid[r][c].flagged) flagCount++;
                }
            }
        }
        
        // If flags match adjacent mines, reveal all unflagged neighbors
        if (flagCount === cell.adjacentMines) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const r = row + dr;
                    const c = col + dc;
                    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                        const neighbor = this.grid[r][c];
                        if (!neighbor.revealed && !neighbor.flagged) {
                            this.revealCell(r, c);
                        }
                    }
                }
            }
        }
    }
    
    revealCell(row, col) {
        const cell = this.grid[row][col];
        if (cell.revealed || cell.flagged) return;
        
        cell.revealed = true;
        this.revealed++;
        
        if (cell.mine) {
            this.lose(row, col);
            return;
        }
        
        this.updateCellDisplay(row, col);
        
        // Flood fill for empty cells
        if (cell.adjacentMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const r = row + dr;
                    const c = col + dc;
                    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                        this.revealCell(r, c);
                    }
                }
            }
        }
        
        // Check win
        this.checkWin();
    }
    
    updateCellDisplay(row, col) {
        const cell = this.grid[row][col];
        const element = this.board.children[row * this.cols + col];
        
        element.className = 'cell';
        element.textContent = '';
        
        if (cell.revealed) {
            element.classList.add('revealed');
            if (cell.mine) {
                element.classList.add('mine');
            } else if (cell.adjacentMines > 0) {
                element.textContent = cell.adjacentMines;
                element.classList.add(`n${cell.adjacentMines}`);
            }
        } else if (cell.flagged) {
            element.classList.add('covered', 'flagged');
        } else if (cell.question) {
            element.classList.add('covered', 'question');
        } else {
            element.classList.add('covered');
        }
    }
    
    checkWin() {
        const totalSafeCells = this.rows * this.cols - this.mineCount;
        
        if (this.revealed === totalSafeCells) {
            this.win();
        }
    }
    
    win() {
        this.gameOver = true;
        this.gameWon = true;
        this.stopTimer();
        
        const time = this.getElapsedTime();
        
        // Check for high score (faster is better)
        const bestKey = `${this.gameId}-${this.difficulty}`;
        const currentBest = this.highScores[this.difficulty];
        
        if (!currentBest || time < currentBest) {
            this.highScores[this.difficulty] = time;
            storageManager.setHighScore(bestKey, time);
        }
        
        // Calculate score based on time and difficulty
        const score = Math.floor(10000 / time * DIFFICULTIES[this.difficulty].mines);
        storageManager.addXP(Math.floor(score / 10));
        
        // Flag all remaining mines
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                if (cell.mine && !cell.flagged) {
                    cell.flagged = true;
                    this.updateCellDisplay(row, col);
                }
            }
        }
        
        // Show win animation
        const cells = this.board.querySelectorAll('.cell');
        cells.forEach(c => c.classList.add('win'));
        
        // Show overlay
        this.showOverlay(true, time);
    }
    
    lose(clickedRow, clickedCol) {
        this.gameOver = true;
        this.stopTimer();
        
        // Mark clicked mine as exploded
        const clickedElement = this.board.children[clickedRow * this.cols + clickedCol];
        clickedElement.classList.add('exploded');
        
        // Reveal all mines and wrong flags
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                const element = this.board.children[row * this.cols + col];
                
                if (cell.mine && !cell.flagged) {
                    cell.revealed = true;
                    this.updateCellDisplay(row, col);
                } else if (!cell.mine && cell.flagged) {
                    element.classList.remove('flagged');
                    element.classList.add('wrong');
                }
            }
        }
        
        this.showOverlay(false, this.getElapsedTime());
    }
    
    showOverlay(isWin, time) {
        const title = this.overlay.querySelector('.overlay-title');
        const score = this.overlay.querySelector('.overlay-score');
        const message = this.overlay.querySelector('.overlay-message');
        
        if (isWin) {
            title.textContent = 'YOU WIN!';
            title.style.color = 'var(--color-success)';
            score.style.display = 'block';
            score.innerHTML = `Time: ${time}s`;
            
            const best = this.highScores[this.difficulty];
            if (time === best) {
                score.innerHTML += '<br><span style="color: var(--color-accent)">NEW RECORD!</span>';
            }
            
            message.textContent = 'Click to play again';
        } else {
            title.textContent = 'GAME OVER';
            title.style.color = 'var(--color-danger)';
            score.style.display = 'none';
            message.textContent = 'You hit a mine! Click to try again';
        }
        
        this.overlay.classList.remove('hidden');
    }
    
    // Timer functions
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.updateTimer(this.getElapsedTime());
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    updateTimer(seconds) {
        const el = document.querySelector('.timer-value');
        if (el) {
            el.textContent = String(Math.min(seconds, 999)).padStart(3, '0');
        }
    }
    
    // Display updates
    updateMinesDisplay() {
        const el = document.querySelector('.mines-value');
        if (el) {
            el.textContent = Math.max(0, this.mineCount - this.flagCount);
        }
    }
    
    updateHighScoreDisplay() {
        const el = document.querySelector('.highscore-value');
        if (el) {
            const best = this.highScores[this.difficulty];
            el.textContent = best ? `${best}s` : '---';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Minesweeper();
});
