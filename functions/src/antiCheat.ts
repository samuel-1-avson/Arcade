/**
 * Anti-Cheat Service - Enhanced Score Validation
 * Server-side validation with session tracking, timing analysis, and pattern detection
 */

import { db } from './utils';
import * as admin from 'firebase-admin';

// Session cache - stores active game sessions
const sessionCache = new Map<string, GameSession>();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes max session

interface GameSession {
  userId: string;
  gameId: string;
  startTime: number;
  actions: GameAction[];
  scoreHistory: ScoreEntry[];
  checksumSeed: string;
}

interface GameAction {
  type: string;
  data: any;
  timestamp: number;
}

interface ScoreEntry {
  score: number;
  timestamp: number;
}

interface GameConfig {
  maxScore: number;
  minDuration: number;
  maxScorePerSecond: number;
  suspiciousPatterns: string[];
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
  severity?: 'error' | 'warning' | 'critical';
  details?: Record<string, any>;
}

// Validation thresholds per game
export const GAME_CONFIGS: Record<string, GameConfig> = {
  snake: {
    maxScore: 1_000_000,
    minDuration: 10_000,
    maxScorePerSecond: 100,
    suspiciousPatterns: ['perfect_score', 'impossible_time'],
  },
  '2048': {
    maxScore: 10_000_000,
    minDuration: 30_000,
    maxScorePerSecond: 5000,
    suspiciousPatterns: ['instant_win'],
  },
  breakout: {
    maxScore: 500_000,
    minDuration: 60_000,
    maxScorePerSecond: 2000,
    suspiciousPatterns: ['all_bricks_instant'],
  },
  tetris: {
    maxScore: 5_000_000,
    minDuration: 60_000,
    maxScorePerSecond: 1000,
    suspiciousPatterns: ['impossible_tetris'],
  },
  minesweeper: {
    maxScore: 100_000,
    minDuration: 5_000,
    maxScorePerSecond: 500,
    suspiciousPatterns: ['instant_solve'],
  },
  pacman: {
    maxScore: 2_000_000,
    minDuration: 60_000,
    maxScorePerSecond: 3000,
    suspiciousPatterns: ['ghost_collision_none'],
  },
  asteroids: {
    maxScore: 1_000_000,
    minDuration: 30_000,
    maxScorePerSecond: 500,
    suspiciousPatterns: ['impossible_dodge'],
  },
  'tower-defense': {
    maxScore: 10_000_000,
    minDuration: 120_000,
    maxScorePerSecond: 5000,
    suspiciousPatterns: ['instant_wave_clear'],
  },
  rhythm: {
    maxScore: 1_000_000,
    minDuration: 60_000,
    maxScorePerSecond: 1000,
    suspiciousPatterns: ['perfect_timing_all'],
  },
  roguelike: {
    maxScore: 500_000,
    minDuration: 120_000,
    maxScorePerSecond: 200,
    suspiciousPatterns: ['invincible'],
  },
  toonshooter: {
    maxScore: 1_000_000,
    minDuration: 30_000,
    maxScorePerSecond: 1000,
    suspiciousPatterns: ['aimbot'],
  },
};

/**
 * Start a game session
 */
export function startSession(userId: string, gameId: string): string {
  const sessionId = `${userId}_${gameId}_${Date.now()}`;
  const session: GameSession = {
    userId,
    gameId,
    startTime: Date.now(),
    actions: [],
    scoreHistory: [],
    checksumSeed: Math.random().toString(36).substring(7),
  };

  sessionCache.set(sessionId, session);
  cleanupOldSessions();
  return sessionId;
}

/**
 * Record game action for validation
 */
export function recordAction(sessionId: string, action: string, data: any): boolean {
  const session = sessionCache.get(sessionId);
  if (!session) return false;

  session.actions.push({
    type: action,
    data,
    timestamp: Date.now(),
  });

  return true;
}

/**
 * Validate score submission with enhanced checks
 */
export function validateScore(scoreData: {
  userId: string;
  gameId: string;
  score: number;
  sessionId?: string;
  duration?: number;
  checksum?: string;
}): ValidationResult {
  const { userId, gameId, score, sessionId, duration, checksum } = scoreData;

  // Basic validation
  if (!userId || !gameId || score === undefined) {
    return { valid: false, reason: 'missing_required_fields', severity: 'error' };
  }

  // Score must be a positive number
  if (typeof score !== 'number' || score < 0 || !Number.isFinite(score)) {
    return { valid: false, reason: 'invalid_score_type', severity: 'error' };
  }

  // Get game config
  const config = GAME_CONFIGS[gameId];
  if (!config) {
    return { valid: false, reason: 'unknown_game', severity: 'warning' };
  }

  // Max score check
  if (score > config.maxScore) {
    return {
      valid: false,
      reason: 'score_exceeds_maximum',
      severity: 'critical',
      details: { score, maxScore: config.maxScore },
    };
  }

  // Session validation
  if (sessionId) {
    const sessionResult = validateSession(sessionId, score, duration);
    if (!sessionResult.valid) {
      return sessionResult;
    }
  }

  // Duration check
  if (duration && duration < config.minDuration) {
    return {
      valid: false,
      reason: 'impossible_duration',
      severity: 'warning',
      details: { duration, minDuration: config.minDuration },
    };
  }

  // Score rate check
  if (duration && duration > 0) {
    const scorePerSecond = score / (duration / 1000);
    if (scorePerSecond > config.maxScorePerSecond) {
      return {
        valid: false,
        reason: 'suspicious_score_rate',
        severity: 'warning',
        details: { scorePerSecond, maxScorePerSecond: config.maxScorePerSecond },
      };
    }
  }

  // Checksum validation (if provided)
  if (checksum && sessionId) {
    const session = sessionCache.get(sessionId);
    if (session) {
      const expectedChecksum = generateChecksum(session, score);
      if (checksum !== expectedChecksum) {
        return {
          valid: false,
          reason: 'invalid_checksum',
          severity: 'critical',
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Validate session state
 */
function validateSession(sessionId: string, score: number, duration?: number): ValidationResult {
  const session = sessionCache.get(sessionId);

  if (!session) {
    return {
      valid: false,
      reason: 'session_not_found',
      severity: 'warning',
    };
  }

  const sessionDuration = Date.now() - session.startTime;

  // Session timeout check
  if (sessionDuration > SESSION_TIMEOUT) {
    return {
      valid: false,
      reason: 'session_expired',
      severity: 'warning',
    };
  }

  // Action count check - too few actions is suspicious
  const minActions = Math.floor(score / 1000);
  if (session.actions.length < minActions && minActions > 5) {
    return {
      valid: false,
      reason: 'insufficient_actions',
      severity: 'warning',
      details: { actionCount: session.actions.length, expectedMin: minActions },
    };
  }

  // Score progression check - should be gradual, not instant
  if (session.scoreHistory.length > 0) {
    const lastScore = session.scoreHistory[session.scoreHistory.length - 1];
    const scoreJump = score - lastScore.score;
    const timeDelta = Date.now() - lastScore.timestamp;

    if (scoreJump > 10000 && timeDelta < 1000) {
      return {
        valid: false,
        reason: 'suspicious_score_jump',
        severity: 'warning',
        details: { scoreJump, timeDelta },
      };
    }
  }

  return { valid: true };
}

/**
 * Generate checksum for score validation
 */
function generateChecksum(session: GameSession, score: number): string {
  const data = `${session.checksumSeed}_${session.userId}_${score}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Clean up old sessions
 */
export function cleanupOldSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of sessionCache.entries()) {
    if (now - session.startTime > SESSION_TIMEOUT) {
      sessionCache.delete(sessionId);
    }
  }
}

/**
 * Log suspicious activity for monitoring
 */
export async function logSuspiciousActivity(data: {
  userId: string;
  gameId: string;
  score: number;
  reason: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    await db.collection('security_logs').add({
      type: 'suspicious_score',
      ...data,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.warn('[AntiCheat] Suspicious activity logged:', data.reason);
  } catch (error) {
    console.error('[AntiCheat] Failed to log suspicious activity:', error);
  }
}

/**
 * Check for ban status
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  try {
    const banDoc = await db.collection('bans').doc(userId).get();
    if (banDoc.exists) {
      const banData = banDoc.data();
      if (banData?.expiresAt && banData.expiresAt.toDate() < new Date()) {
        await banDoc.ref.delete();
        return false;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('[AntiCheat] Ban check failed:', error);
    return false;
  }
}
