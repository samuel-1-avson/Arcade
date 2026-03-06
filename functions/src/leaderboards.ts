/**
 * Leaderboard Aggregation
 * Scheduled aggregation of game leaderboards
 */

import { functions, admin, db, logger, LogCategory } from './utils';

const GAMES = [
  'snake',
  '2048',
  'breakout',
  'tetris',
  'minesweeper',
  'pacman',
  'asteroids',
  'tower-defense',
  'rhythm',
  'roguelike',
  'toonshooter',
];

/**
 * Aggregate leaderboards every 15 minutes
 */
export const aggregateLeaderboards = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    logger.info(LogCategory.SCORE, 'Running leaderboard aggregation');

    for (const gameId of GAMES) {
      try {
        await aggregateGameLeaderboard(gameId);
      } catch (error: any) {
        logger.error(LogCategory.SCORE, `Failed to aggregate ${gameId}`, { error: error.message });
      }
    }

    // Update global stats
    await updateGlobalStats();

    return null;
  });

/**
 * Aggregate a single game's leaderboard
 */
async function aggregateGameLeaderboard(gameId: string): Promise<void> {
  const scoresSnapshot = await db
    .collection('scores')
    .where('gameId', '==', gameId)
    .where('verified', '==', true)
    .orderBy('score', 'desc')
    .limit(100)
    .get();

  const leaderboard: any[] = [];
  const uniqueUsers = new Set<string>();

  scoresSnapshot.forEach((doc) => {
    const data = doc.data();
    if (!uniqueUsers.has(data.userId)) {
      uniqueUsers.add(data.userId);
      leaderboard.push({
        rank: leaderboard.length + 1,
        scoreId: doc.id,
        userId: data.userId,
        userName: data.userName,
        score: data.score,
        timestamp: data.timestamp,
      });
    }
  });

  await db
    .collection('leaderboards')
    .doc(gameId)
    .set({
      gameId,
      entries: leaderboard.slice(0, 50),
      totalPlayers: uniqueUsers.size,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

  logger.info(LogCategory.SCORE, `Aggregated ${gameId}`, { entries: leaderboard.length });
}

/**
 * Update global statistics
 */
async function updateGlobalStats(): Promise<void> {
  const usersCount = await db.collection('users').count().get();
  const scoresCount = await db.collection('scores').where('verified', '==', true).count().get();

  await db
    .collection('stats')
    .doc('global')
    .set(
      {
        totalUsers: usersCount.data().count,
        totalScores: scoresCount.data().count,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}
