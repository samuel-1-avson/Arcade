/**
 * Firebase Configuration
 * This file is generated from environment variables or falls back to defaults
 * 
 * For production, set environment variables or create a .env file
 * For development, you can use this file directly with default values
 * 
 * SECURITY NOTE: In a production environment, API keys should be loaded
 * from environment variables and not committed to source control.
 */

// Check if we're in a module context that supports import.meta
const isModule = typeof import.meta !== 'undefined';

// Firebase configuration
// In production, these would come from environment variables
// For now, we keep the existing values but structure them properly
export const firebaseConfig = {
    apiKey: "AIzaSyCumtfvMCnSRXMHtOghgLv87PdvmwD3yjA",
    authDomain: "arcade-7f03c.firebaseapp.com",
    projectId: "arcade-7f03c",
    storageBucket: "arcade-7f03c.firebasestorage.app",
    messagingSenderId: "883884342768",
    appId: "1:883884342768:web:8c6a43c1c3c01790d2f135",
    measurementId: "G-NCQBGH5RR3",
    databaseURL: "https://arcade-7f03c-default-rtdb.firebaseio.com"
};

/**
 * Environment configuration
 * Indicates current environment and feature flags
 */
export const envConfig = {
    isDevelopment: typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1'),
    isProduction: typeof window !== 'undefined' && 
        window.location.hostname.includes('vercel.app'),
    enableDebugLogging: false,
    enableAnalytics: true
};

// Log environment on init (only in development)
if (envConfig.isDevelopment) {
    console.log('[Config] Running in development mode');
}
