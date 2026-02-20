/**
 * Environment Configuration Loader
 * Browser-safe configuration - no process.env dependencies
 */

// Determine current environment (browser-safe)
const ENV = window.ENV?.NODE_ENV || 'production';

// Firebase config from global or fallback (for production deployment)
const getFirebaseConfig = () => {
  // Try to get from window.ENV (injected at build time)
  if (window.ENV?.FIREBASE_API_KEY) {
    return {
      apiKey: window.ENV.FIREBASE_API_KEY,
      authDomain: window.ENV.FIREBASE_AUTH_DOMAIN,
      databaseURL: window.ENV.FIREBASE_DATABASE_URL,
      projectId: window.ENV.FIREBASE_PROJECT_ID,
      storageBucket: window.ENV.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: window.ENV.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: window.ENV.FIREBASE_APP_ID || '',
      measurementId: window.ENV.FIREBASE_MEASUREMENT_ID || ''
    };
  }
  
  // Fallback to hardcoded production config
  // This is safe for client-side Firebase (API key is public)
  return {
    apiKey: 'AIzaSyCumtfvMCnSRXMHtOghgLv87PdvmwD3yjA',
    authDomain: 'arcade-7f03c.firebaseapp.com',
    databaseURL: 'https://arcade-7f03c-default-rtdb.firebaseio.com',
    projectId: 'arcade-7f03c',
    storageBucket: 'arcade-7f03c.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123',
    measurementId: 'G-XXXXXXXXXX'
  };
};

// Configuration for different environments
const CONFIGS = {
  development: {
    firebase: getFirebaseConfig(),
    features: {
      analytics: false,
      ads: false,
      debug: true,
      betaFeatures: true
    },
    limits: {
      maxChatMessageLength: 500,
      maxDisplayNameLength: 20,
      cacheExpiry: 300000, // 5 minutes
      leaderboardLimit: 100
    }
  },
  
  production: {
    firebase: getFirebaseConfig(),
    features: {
      analytics: true,
      ads: false,
      debug: false,
      betaFeatures: false
    },
    limits: {
      maxChatMessageLength: 500,
      maxDisplayNameLength: 20,
      cacheExpiry: 600000, // 10 minutes
      leaderboardLimit: 100
    }
  },
  
  test: {
    firebase: {
      apiKey: 'test-api-key',
      authDomain: 'test-project.firebaseapp.com',
      databaseURL: 'https://test-project.firebaseio.com',
      projectId: 'test-project',
      storageBucket: 'test-project.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:test',
      measurementId: 'G-TEST123'
    },
    features: {
      analytics: false,
      ads: false,
      debug: true,
      betaFeatures: true
    },
    limits: {
      maxChatMessageLength: 100,
      maxDisplayNameLength: 20,
      cacheExpiry: 1000, // 1 second for tests
      leaderboardLimit: 10
    }
  }
};

// Get current configuration
const currentConfig = CONFIGS[ENV] || CONFIGS.development;

// Validate Firebase config
function validateFirebaseConfig(config) {
  const required = ['apiKey', 'authDomain', 'projectId'];
  const missing = required.filter(key => !config.firebase[key]);
  
  if (missing.length > 0) {
    console.warn(
      `[Config] Missing Firebase configuration: ${missing.join(', ')}\n` +
      `Make sure to create .env.local file from .env.example`
    );
    return false;
  }
  return true;
}

// Export configuration
export const config = currentConfig;
export const environment = ENV;

// Export validation status
export const isConfigValid = validateFirebaseConfig(currentConfig);

// Helper to check if running in development
export const isDevelopment = ENV === 'development';

// Helper to check if running in production
export const isProduction = ENV === 'production';

// Helper to check if running in test
export const isTest = ENV === 'test';

// Export default
export default {
  config: currentConfig,
  environment: ENV,
  isConfigValid,
  isDevelopment,
  isProduction,
  isTest
};
