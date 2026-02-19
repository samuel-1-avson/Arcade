/**
 * Firebase Configuration
 * 
 * SECURITY WARNING: 
 * Do NOT commit actual Firebase credentials to version control.
 * Copy .env.example to .env.local and fill in your values.
 * .env.local is in .gitignore and will not be committed.
 * 
 * For production deployments, set environment variables in your
 * hosting platform (Vercel, Netlify, etc.)
 */

import { config, isConfigValid, isDevelopment } from './env.js';

// Firebase configuration from environment
export const firebaseConfig = config.firebase;

// Validate configuration
if (!isConfigValid) {
  console.error(`
╔════════════════════════════════════════════════════════════════╗
║                    CONFIGURATION ERROR                         ║
╠════════════════════════════════════════════════════════════════╣
║  Firebase configuration is missing or incomplete!              ║
║                                                                ║
║  To fix this:                                                  ║
║  1. Copy .env.example to .env.local                            ║
║  2. Fill in your Firebase credentials from:                    ║
║     https://console.firebase.google.com/ → Project Settings    ║
║  3. Restart your development server                            ║
║                                                                ║
║  DO NOT commit .env.local to version control!                  ║
╚════════════════════════════════════════════════════════════════╝
  `);
}

/**
 * Environment configuration
 * Indicates current environment and feature flags
 */
export const envConfig = {
  isDevelopment: isDevelopment,
  isProduction: !isDevelopment,
  enableDebugLogging: config.features.debug,
  enableAnalytics: config.features.analytics
};

// Log environment on init (only in development)
if (isDevelopment) {
  console.log('[Config] Running in development mode');
  console.log('[Config] Firebase project:', firebaseConfig.projectId || 'NOT CONFIGURED');
}

// Export feature flags
export const features = config.features;

// Export limits
export const limits = config.limits;

// Default export
export default {
  firebaseConfig,
  envConfig,
  features,
  limits,
  isConfigValid
};
