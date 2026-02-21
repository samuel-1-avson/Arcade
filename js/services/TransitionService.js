/**
 * TransitionService - Standardized Transitions for AAA feel
 * Handles UI fades and 3D camera zooms when entering/exiting games
 */
import { backgroundService } from './BackgroundService.js';
import { logger, LogCategory } from '../utils/logger.js';

class TransitionService {
    constructor() {
        this.overlay = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        // Add CSS for fade transitions if not already present
        const style = document.createElement('style');
        style.textContent = `
            .fade-out {
                opacity: 0 !important;
                pointer-events: none;
                transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .fade-in {
                opacity: 1 !important;
                transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .zoom-effect {
                transform: scale(1.1);
                transition: transform 6s cubic-bezier(0.1, 0, 0.1, 1);
            }
        `;
        document.head.appendChild(style);

        this.initialized = true;
        logger.info(LogCategory.UI, 'TransitionService initialized');
    }

    /**
     * Transition from Hub Overview to Active Game
     * 1. Zoom Camera into the Void
     * 2. Fade out Hub UI
     * 3. Callback to load game
     */
    async enterGame(callback) {
        // 1. Trigger 3D Zoom
        if (backgroundService && backgroundService.zoomIn) {
            backgroundService.zoomIn();
        }

        // 2. Fade out Main Content
        const main = document.querySelector('.hub-main');
        const header = document.querySelector('.hub-header');
        const nav = document.querySelector('.hub-nav');
        
        if (main) main.classList.add('fade-out');
        if (nav) nav.classList.add('fade-out');
        // Header stays but might dim? For now fade all
        // if (header) header.classList.add('fade-out');

        // Wait for visual transition
        await new Promise(resolve => setTimeout(resolve, 800));

        // 3. Execute Load Callback
        if (callback) callback();
    }

    /**
     * Transition from Active Game back to Hub
     */
    exitGame() {
        // 1. Reset 3D Camera
        if (backgroundService && backgroundService.zoomOut) {
            backgroundService.zoomOut();
        }

        // 2. Fade UI back in
        const main = document.querySelector('.hub-main');
        const header = document.querySelector('.hub-header');
        const nav = document.querySelector('.hub-nav');
        
        if (main) main.classList.remove('fade-out');
        if (nav) nav.classList.remove('fade-out');
        if (header) header.classList.remove('fade-out');
    }
}

export const transitionService = new TransitionService();
export default TransitionService;
