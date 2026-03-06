/**
 * Tournament Management
 * Scheduled tournament start/end and finalization
 */

import { functions, admin, db, sendNotification, logger, LogCategory } from './utils';

/**
 * Start scheduled tournaments
 * Runs every 5 minutes to check for tournaments that should start or end
 */
export const startScheduledTournaments = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    // Find tournaments that should start
    const toStart = await db
      .collection('tournaments')
      .where('status', '==', 'scheduled')
      .where('startTime', '<=', now)
      .get();

    for (const doc of toStart.docs) {
      await doc.ref.update({
        status: 'in_progress',
        actualStartTime: now,
      });

      const participants = doc.data().participants || [];
      for (const participantId of participants) {
        await sendNotification(participantId, {
          type: 'tournament_start',
          title: 'Tournament Started!',
          message: `The tournament "${doc.data().name}" has begun!`,
          icon: '🏆',
          tournamentId: doc.id,
        });
      }
    }

    // Find tournaments that should end
    const toEnd = await db
      .collection('tournaments')
      .where('status', '==', 'in_progress')
      .where('endTime', '<=', now)
      .get();

    for (const doc of toEnd.docs) {
      await finalizeTournament(doc);
    }

    return null;
  });

/**
 * Finalize a tournament and determine winners
 */
async function finalizeTournament(tournamentDoc: admin.firestore.QueryDocumentSnapshot): Promise<void> {
  const tournament = tournamentDoc.data();

  const scores = await db
    .collection('tournament_scores')
    .where('tournamentId', '==', tournamentDoc.id)
    .orderBy('score', 'desc')
    .limit(10)
    .get();

  const winners: any[] = [];
  let index = 0;
  scores.forEach((doc) => {
    winners.push({
      rank: index + 1,
      ...doc.data(),
    });
    index++;
  });

  await tournamentDoc.ref.update({
    status: 'completed',
    winners: winners.slice(0, 3),
    allResults: winners,
    finalizedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notify winners
  for (const winner of winners.slice(0, 3)) {
    const icon = winner.rank === 1 ? '🥇' : winner.rank === 2 ? '🥈' : '🥉';
    await sendNotification(winner.userId, {
      type: 'tournament_win',
      title: `You placed #${winner.rank}!`,
      message: `Congratulations on your performance in "${tournament.name}"!`,
      icon,
      tournamentId: tournamentDoc.id,
    });
  }

  logger.info(LogCategory.TOURNAMENT, `Finalized tournament ${tournamentDoc.id}`, {
    winners: winners.length,
  });
}
