/**
 * Analytics Pipeline
 * Event processing, counters, and daily rollups
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db, logger, LogCategory } from './utils';
import * as admin from 'firebase-admin';

/**
 * Process analytics events
 */
export const processAnalytics = onDocumentCreated(
  {
    document: 'analytics/{eventId}',
    region: 'us-central1',
    memory: '256MiB',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const eventData = snap.data();
    logger.info(LogCategory.ANALYTICS, `Processing analytics event: ${eventData.type}`);

    try {
      const enrichedEvent = {
        ...eventData,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        serverTimestamp: Date.now(),
      };

      const dateStr = new Date().toISOString().split('T')[0];
      await db.collection('analytics_processed').doc(dateStr).collection('events').add(enrichedEvent);

      await updateAnalyticsCounters(eventData);
      await snap.ref.delete();
    } catch (error: any) {
      logger.error(LogCategory.ANALYTICS, 'Analytics processing error', { error: error.message });
    }
  }
);

/**
 * Update real-time analytics counters
 */
async function updateAnalyticsCounters(eventData: any): Promise<void> {
  const dateStr = new Date().toISOString().split('T')[0];
  const countersRef = db.collection('analytics_counters').doc(dateStr);

  const updates: Record<string, any> = {
    [`events.${eventData.type}`]: admin.firestore.FieldValue.increment(1),
    totalEvents: admin.firestore.FieldValue.increment(1),
  };

  if (eventData.data?.gameId) {
    updates[`games.${eventData.data.gameId}`] = admin.firestore.FieldValue.increment(1);
  }

  await countersRef.set(updates, { merge: true });
}

/**
 * Daily analytics aggregation (runs at midnight)
 */
export const dailyAnalyticsRollup = onSchedule(
  {
    schedule: '0 0 * * *',
    timeZone: 'UTC',
    region: 'us-central1',
    memory: '256MiB',
  },
  async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    logger.info(LogCategory.ANALYTICS, `Running daily rollup for ${dateStr}`);

    try {
      const countersDoc = await db.collection('analytics_counters').doc(dateStr).get();

      if (countersDoc.exists) {
        await db
          .collection('analytics_daily')
          .doc(dateStr)
          .set({
            date: dateStr,
            counters: countersDoc.data(),
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      }
    } catch (error: any) {
      logger.error(LogCategory.ANALYTICS, 'Daily rollup error', { error: error.message });
    }
  }
);
