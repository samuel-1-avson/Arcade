/**
 * Firebase Admin & Functions Utilities
 * Centralized initialization and helper functions
 */

import * as admin from 'firebase-admin';
import { getFunctions } from 'firebase-admin/functions';

// Initialize Firebase Admin
admin.initializeApp();

// Export initialized instances
export const db = admin.firestore();
export const rtdb = admin.database();
export const auth = admin.auth();
export const functions = getFunctions();

/**
 * Send a notification to a user via Realtime Database
 */
export async function sendNotification(
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    icon?: string;
    [key: string]: any;
  }
): Promise<void> {
  await rtdb.ref(`notifications/${userId}`).push({
    ...notification,
    read: false,
    timestamp: admin.database.ServerValue.TIMESTAMP,
  });
}

/**
 * Record an analytics event
 */
export async function recordAnalyticsEvent(
  eventType: string,
  data: Record<string, any>
): Promise<void> {
  await db.collection('analytics').add({
    type: eventType,
    data,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    date: new Date().toISOString().split('T')[0],
  });
}

/**
 * Logger categories for consistent logging
 */
export enum LogCategory {
  SCORE = 'SCORE',
  SECURITY = 'SECURITY',
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  ANALYTICS = 'ANALYTICS',
  TOURNAMENT = 'TOURNAMENT',
}

/**
 * Structured logger
 */
export const logger = {
  info: (category: LogCategory, message: string, data?: Record<string, any>) => {
    console.log(`[${category}] ${message}`, data || '');
  },
  warn: (category: LogCategory, message: string, data?: Record<string, any>) => {
    console.warn(`[${category}] ${message}`, data || '');
  },
  error: (category: LogCategory, message: string, data?: Record<string, any>) => {
    console.error(`[${category}] ${message}`, data || '');
  },
  startTimer: () => Date.now(),
  endTimer: (startTime: number, operation: string, data?: Record<string, any>) => {
    const duration = Date.now() - startTime;
    console.log(`[TIMER] ${operation} completed in ${duration}ms`, data || '');
  },
  logScoreSubmission: (userId: string, gameId: string, score: number, status: string) => {
    console.log(`[SCORE] User ${userId} submitted ${score} in ${gameId} - ${status}`);
  },
  logScoreRejected: (
    userId: string,
    gameId: string,
    score: number,
    reason: string,
    details?: Record<string, any>
  ) => {
    console.warn(`[SCORE_REJECTED] User ${userId} score ${score} in ${gameId} rejected: ${reason}`, details || '');
  },
};
