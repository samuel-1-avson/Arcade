/**
 * Arcade Gaming Hub - Main Entry Point
 * This file now imports from the modular app structure
 */

import { ArcadeHub } from './app/ArcadeHub.js?v=6';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.arcadeHub = new ArcadeHub();
});

// Export for global access
export { ArcadeHub };
