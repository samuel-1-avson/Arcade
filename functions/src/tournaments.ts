/**
 * Tournament Management
 * Scheduled tournament start/end and finalization
 */

import { functions, admin, db, sendNotification } from './utils';
const { logger, LogCategory } = require('../logger');

/**
 * Start scheduled tournaments (checks every 5 minutes)
 */
export const startScheduledTournaments = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async () => {
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

            // Notify all participants
            const participants: string[] = doc.data().participants || [];
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
async function finalizeTournament(
    tournamentDoc: FirebaseFirestore.QueryDocumentSnapshot
): Promise<void> {
    const tournament = tournamentDoc.data();

    // Get all scores for this tournament
    const scores = await db
        .collection('tournament_scores')
        .where('tournamentId', '==', tournamentDoc.id)
        .orderBy('score', 'desc')
        .limit(10)
        .get();

    const winners: any[] = [];
    let winnerIndex = 0;
    scores.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        winners.push({
            rank: winnerIndex + 1,
            ...doc.data(),
        });
        winnerIndex++;
    });

    // Update tournament with results
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
}
