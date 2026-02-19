/**
 * Environment Configuration Loader
 * Loads configuration based on current environment
 */

// Determine current environment
const ENV = typeof process !== 'undefined' && process.env 
  ? process.env.NODE_ENV || 'development'
  : 'development';

// Configuration for different environments
const CONFIGS = {
  development: {
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      databaseURL: process.env.FIREBASE_DATABASE_URL || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
    },
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
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      databaseURL: process.env.FIREBASE_DATABASE_URL || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
    },
    features: {
      analytics: true,
      ads: process.env.ENABLE_ADS === 'true',
      debug: false,
      betaFeatures: process.env.ENABLE_BETA_FEATURES === 'true'
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
