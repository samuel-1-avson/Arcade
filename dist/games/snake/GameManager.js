import { SceneManager } from './SceneManager.js';
import { SnakeController } from './SnakeController.js';
import { FoodManager } from './FoodManager.js';
import { GameEngine, GameState } from '../../js/engine/GameEngine.js';

class GameManager extends GameEngine {
    constructor() {
        super({
            canvasId: 'game-canvas',
            gameId: 'snake-3d',
            width: 800,
            height: 600,
            contextType: 'webgl' 
        });

        // Dependencies
        this.sceneManager = new SceneManager('game-canvas');
        this.snakeController = new SnakeController(this.sceneManager.scene);
        this.foodManager = new FoodManager(this.sceneManager.scene, 50);
        
        // Game Loop State
        this.lastTime = performance.now();
        this.isPlaying = false;
        
        // Bounds for 50x50 grid (approx +/- 25)
        this.bounds = 24.5;

        this.initUI();
    }

    initUI() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }
    }

    startGame() {
        this.isPlaying = true;
        this.state = GameState.PLAYING;
        
        // Reset score
        this.score = 0;
        this.setScore(0);
        
        // Hide config menu
        const menu = document.getElementById('main-menu');
        if (menu) menu.classList.add('hidden');
        
        const ui = document.getElementById('game-ui');
        if (ui) ui.classList.remove('hidden');

        this.start();
    }

    update(deltaTime) {
        if (!this.isPlaying) return;

        // Sub-updates
        this.snakeController.update(deltaTime);
        this.foodManager.update(deltaTime);
        
        // Game Logic
        this.checkCollisions();

        // Update Camera
        this.sceneManager.update(deltaTime, this.snakeController.getPosition());
    }

    checkCollisions() {
        const snakePos = this.snakeController.getPosition();
        
        // 1. Snake vs Food
        const foodPos = this.foodManager.getPosition();
        if (snakePos.distanceTo(foodPos) < 1.5) {
            // EAT
            this.handleEat();
        }

        // 2. Snake vs World (Walls / Self)
        if (this.snakeController.checkCollision(this.bounds)) {
            this.handleGameOver();
        }
    }

    handleEat() {
        this.addScore(100);
        this.snakeController.grow();
        this.foodManager.spawn(this.snakeController.segments);
        // Play sound (if audio manager was hooked up)
    }

    handleGameOver() {
        this.isPlaying = false;
        this.gameOver(false); // GameEngine method
    }

    render() {
        // Handled by SceneManager
    }
}

// Start the game instance
window.game = new GameManager();
