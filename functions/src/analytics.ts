/**
 * Analytics Pipeline
 * Event processing, counters, and daily rollups
 */

import { functions, admin, db, logger, LogCategory } from './utils';

/**
 * Process analytics events
 */
export const processAnalytics = functions.firestore
  .document('analytics/{eventId}')
  .onCreate(async (snap, context) => {
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

    return null;
  });

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
export const dailyAnalyticsRollup = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
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

    return null;
  });
