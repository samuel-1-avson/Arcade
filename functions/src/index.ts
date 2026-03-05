/**
 * Arcade Gaming Hub — Cloud Functions Entry Point (TypeScript)
 * 
 * All functions are split into focused modules:
 * - scores:       Score validation, anti-cheat, leaderboard updates
 * - leaderboards: Scheduled leaderboard aggregation
 * - analytics:    Event processing, counters, daily rollups
 * - tournaments:  Tournament scheduling and finalization
 * - users:        User lifecycle (creation, updates, notifications)
 * - maintenance:  Presence cleanup, rate limit cleanup, health check
 */

export { onScoreSubmit } from './scores';
export { aggregateLeaderboards } from './leaderboards';
export { processAnalytics, dailyAnalyticsRollup } from './analytics';
export { startScheduledTournaments } from './tournaments';
export { onUserUpdate, onUserCreate, sendTestNotification } from './users';
export { cleanupPresence, cleanupRateLimits, healthCheck } from './maintenance';
