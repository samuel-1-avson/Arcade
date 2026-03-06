/**
 * Arcade Gaming Hub — Cloud Functions Entry Point (Gen1 - Spark Plan Compatible)
 * 
 * All functions are split into focused modules:
 * - scores:       Score validation, anti-cheat, leaderboard updates
 * - leaderboards: Scheduled leaderboard aggregation
 * - analytics:    Event processing, counters, daily rollups
 * - tournaments:  Tournament scheduling and finalization
 * - users:        User lifecycle (creation, updates, notifications)
 * - maintenance:  Presence cleanup, rate limit cleanup, health check
 */

import * as functions from 'firebase-functions';

// Re-export all functions using Gen1 syntax
export { onScoreSubmit } from './scores';
export { aggregateLeaderboards } from './leaderboards';
export { processAnalytics, dailyAnalyticsRollup } from './analytics';
export { startScheduledTournaments } from './tournaments';
export { onUserUpdate, onUserCreate, sendTestNotification } from './users';
export { cleanupPresence, cleanupRateLimitsFn as cleanupRateLimits, healthCheck } from './maintenance';

// Log that functions are loaded
functions.logger.info('Arcade Hub Cloud Functions (Gen1) loaded');
