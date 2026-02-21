import { describe, it, expect } from 'vitest';
import { leaderboardService } from '@/lib/firebase/services/leaderboard';

describe('leaderboardService', () => {
  it('should return error when Firebase is not initialized', async () => {
    const scoreData = {
      userId: 'user-123',
      displayName: 'Test User',
      avatar: 'User',
      gameId: 'snake',
      score: 1000,
    };

    const result = await leaderboardService.submitScore(scoreData);

    // Firebase won't be initialized in test environment
    expect(result.success).toBe(false);
    expect(result.error).toBe('Firebase not initialized');
  });

  it('should handle empty leaderboard when Firebase not initialized', async () => {
    const result = await leaderboardService.getLeaderboard('snake', 50);

    // Should return empty array when Firebase not available
    expect(result.entries).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });

  it('should return null when Firebase not initialized for user rank', async () => {
    const rank = await leaderboardService.getUserRank('user-123', 'snake');

    expect(rank).toBeNull();
  });

  it('should return 0 when Firebase not initialized for high score', async () => {
    const score = await leaderboardService.getUserHighScore('user-123', 'snake');

    expect(score).toBe(0);
  });

  it('should return empty array when Firebase not initialized for top players', async () => {
    const topPlayers = await leaderboardService.getTopPlayers('snake', 10);

    expect(topPlayers).toHaveLength(0);
  });

  it('should clear the cache', () => {
    leaderboardService.clearCache();
    const stats = leaderboardService.getCacheStats();
    expect(stats.size).toBe(0);
  });

  it('should return cache statistics', () => {
    const stats = leaderboardService.getCacheStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('keys');
    expect(Array.isArray(stats.keys)).toBe(true);
  });
});
