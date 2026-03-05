/**
 * Score Submission & Validation
 * Handles score processing, anti-cheat validation, and leaderboard updates
 */

import { functions, admin, db, rtdb, sendNotification, recordAnalyticsEvent } from './utils';
const { checkRateLimit } = require('../rateLimiter');
const antiCheat = require('../antiCheat');
const { logger, LogCategory } = require('../logger');

/**
 * Validate and process score submissions
 * Triggered when a new score is added to Firestore
 */
export const onScoreSubmit = functions.firestore
    .document('scores/{scoreId}')
    .onCreate(async (snap, context) => {
        const scoreData = snap.data();
        const scoreId = context.params.scoreId;
        const startTime = logger.startTimer();

        logger.info(LogCategory.SCORE, 'Score submission received', {
            scoreId,
            userId: scoreData.userId,
            gameId: scoreData.gameId,
            score: scoreData.score,
        });

        try {
            // Check if user is banned
            const isBanned = await antiCheat.isUserBanned(scoreData.userId);
            if (isBanned) {
                logger.warn(LogCategory.SECURITY, 'Score from banned user rejected', {
                    userId: scoreData.userId,
                    scoreId,
                });
                await snap.ref.update({
                    verified: false,
                    invalidReason: 'User banned',
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return null;
            }

            // Rate limit check
            const rateLimitResult = await checkRateLimit(scoreData.userId, 'score');
            if (!rateLimitResult.allowed) {
                logger.warn(LogCategory.SECURITY, 'Rate limit exceeded', {
                    userId: scoreData.userId,
                    remaining: rateLimitResult.remaining,
                });
                await snap.ref.update({
                    verified: false,
                    invalidReason: 'Rate limit exceeded',
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return null;
            }

            // Enhanced anti-cheat validation
            const validationResult = antiCheat.validateScore({
                ...scoreData,
                sessionId: scoreData.sessionId,
                duration: scoreData.duration,
                checksum: scoreData.checksum,
            });

            if (!validationResult.valid) {
                logger.logScoreRejected(
                    scoreData.userId,
                    scoreData.gameId,
                    scoreData.score,
                    validationResult.reason,
                    { severity: validationResult.severity, details: validationResult.details }
                );

                if (validationResult.severity === 'critical') {
                    await antiCheat.logSuspiciousActivity({
                        userId: scoreData.userId,
                        gameId: scoreData.gameId,
                        score: scoreData.score,
                        reason: validationResult.reason,
                        details: validationResult.details,
                    });
                }

                await snap.ref.update({
                    verified: false,
                    invalidReason: validationResult.reason,
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                return null;
            }

            // Mark as verified
            await snap.ref.update({
                verified: true,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Update live leaderboard in RTDB for real-time updates
            await updateLiveLeaderboard(scoreData.gameId, scoreId, scoreData);

            // Check for achievements
            await checkScoreAchievements(scoreData);

            // Record analytics event
            await recordAnalyticsEvent('score_submitted', {
                gameId: scoreData.gameId,
                userId: scoreData.userId,
                score: scoreData.score,
                verified: true,
            });

            logger.logScoreSubmission(scoreData.userId, scoreData.gameId, scoreData.score, 'verified');
            logger.endTimer(startTime, 'onScoreSubmit', { scoreId });

            return null;
        } catch (error: any) {
            logger.error(LogCategory.SCORE, 'Score processing error', {
                scoreId,
                error: error.message,
                stack: error.stack,
            });
            return null;
        }
    });

/**
 * Update live leaderboard in RTDB
 */
async function updateLiveLeaderboard(
    gameId: string,
    scoreId: string,
    scoreData: any
): Promise<void> {
    const leaderboardRef = rtdb.ref(`liveLeaderboards/${gameId}/${scoreId}`);

    await leaderboardRef.set({
        userId: scoreData.userId,
        userName: scoreData.userName || 'Anonymous',
        score: scoreData.score,
        timestamp: admin.database.ServerValue.TIMESTAMP,
    });

    // Trim leaderboard to top 100
    const snapshot = await rtdb
        .ref(`liveLeaderboards/${gameId}`)
        .orderByChild('score')
        .limitToFirst(1)
        .once('value');

    const leaderboardSize = await rtdb.ref(`liveLeaderboards/${gameId}`).once('value');

    if (leaderboardSize.numChildren() > 100) {
        snapshot.forEach((child) => {
            child.ref.remove();
            return false;
        });
    }
}

/**
 * Check for score-based achievements
 */
async function checkScoreAchievements(scoreData: any): Promise<void> {
    const userId = scoreData.userId;
    const gameId = scoreData.gameId;
    const score = scoreData.score;

    const achievements: string[] = [];

    // First score achievement
    const userScores = await db
        .collection('scores')
        .where('userId', '==', userId)
        .limit(2)
        .get();

    if (userScores.size === 1) {
        achievements.push('first_score');
    }

    // High score achievements
    if (score >= 10000) achievements.push('score_10k');
    if (score >= 50000) achievements.push('score_50k');
    if (score >= 100000) achievements.push('score_100k');
    if (score >= 500000) achievements.push('score_500k');
    if (score >= 1000000) achievements.push('score_1m');

    // Record achievements
    for (const achievementId of achievements) {
        const achRef = db
            .collection('users')
            .doc(userId)
            .collection('achievements')
            .doc(`global_${achievementId}`);

        const existing = await achRef.get();
        if (!existing.exists) {
            await achRef.set({
                id: achievementId,
                gameId: 'global',
                unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
                triggeredBy: { gameId, score },
            });

            await sendNotification(userId, {
                type: 'achievement',
                title: 'Achievement Unlocked!',
                message: `You earned: ${achievementId}`,
                icon: '🏆',
            });
        }
    }
}
