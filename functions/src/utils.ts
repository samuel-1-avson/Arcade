/**
 * Shared utilities for Cloud Functions
 * Common imports and helper functions used across all modules
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    admin.initializeApp();
}

export const db = admin.firestore();
export const rtdb = admin.database();

export { functions, admin };

/**
 * Send a notification to a user via RTDB
 */
export async function sendNotification(
    userId: string,
    notification: {
        type: string;
        title: string;
        message: string;
        icon: string;
        tournamentId?: string;
    }
): Promise<void> {
    await rtdb.ref(`notifications/${userId}`).push({
        ...notification,
        read: false,
        timestamp: admin.database.ServerValue.TIMESTAMP,
    });
}

/**
 * Record an analytics event to Firestore
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
