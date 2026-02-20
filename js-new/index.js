/**
 * Arcade Gaming Hub - New UI
 * Phase 2: JavaScript Implementation
 * 
 * This module provides the new UI components and application logic.
 * Import this to use the new redesigned interface.
 */

// Export components
export * from './components/index.js';

// Export utilities
export * from './utils/index.js';

// Export App
export { App, app } from './App.js';

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Import and initialize
    import('./App.js').then(({ app }) => {
      // App is auto-initialized
      window.arcadeHubUI = app;
    });
  });
} else {
  // DOM already loaded
  import('./App.js').then(({ app }) => {
    window.arcadeHubUI = app;
  });
}
