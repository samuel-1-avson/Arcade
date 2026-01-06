/**
 * Firebase Cloud Functions for Arcade Gaming Hub
 * Server-side validation, analytics, and real-time processing
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const rtdb = admin.database();

// ==================== SCORE VALIDATION ====================

/**
 * Validate and process score submissions
 * Triggered when a new score is added to Firestore
 */
exports.onScoreSubmit = functions.firestore
    .document('scores/{scoreId}')
    .onCreate(async (snap, context) => {
        const scoreData = snap.data();
        const scoreId = context.params.scoreId;

        console.log(`Processing score submission: ${scoreId}`);

        try {
            // Validate score data
            const validationResult = validateScore(scoreData);
            
            if (!validationResult.valid) {
                console.warn(`Invalid score rejected: ${validationResult.reason}`);
                
                // Mark as invalid but don't delete (for audit)
                await snap.ref.update({
                    verified: false,
                    invalidReason: validationResult.reason,
                    processedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                return null;
            }

            // Mark as verified
            await snap.ref.update({
                verified: true,
                processedAt: admin.firestore.FieldValue.serverTimestamp()
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
                verified: true
            });

            console.log(`Score ${scoreId} verified and processed`);
            return null;

        } catch (error) {
            console.error('Score processing error:', error);
            return null;
        }
    });

/**
 * Validate score for anti-cheat
 */
function validateScore(scoreData) {
    // Required fields
    if (!scoreData.userId || !scoreData.gameId || scoreData.score === undefined) {
        return { valid: false, reason: 'Missing required fields' };
    }

    // Score must be a positive number
    if (typeof scoreData.score !== 'number' || scoreData.score < 0) {
        return { valid: false, reason: 'Invalid score value' };
    }

    // Game-specific validation
    const gameValidators = {
        'snake': (s) => s.score <= 1000000, // Max reasonable score
        '2048': (s) => s.score <= 10000000,
        'breakout': (s) => s.score <= 500000,
        'tetris': (s) => s.score <= 5000000,
        'minesweeper': (s) => s.score <= 100000,
        'pacman': (s) => s.score <= 2000000,
        'asteroids': (s) => s.score <= 1000000,
        'tower-defense': (s) => s.score <= 10000000,
        'rhythm': (s) => s.score <= 1000000,
        'roguelike': (s) => s.score <= 500000,
        'dino-runner': (s) => s.score <= 100000
    };

    const validator = gameValidators[scoreData.gameId];
    if (validator && !validator(scoreData)) {
        return { valid: false, reason: 'Score exceeds maximum for game' };
    }

    return { valid: true };
}

/**
 * Update live leaderboard in RTDB
 */
async function updateLiveLeaderboard(gameId, scoreId, scoreData) {
    const leaderboardRef = rtdb.ref(`liveLeaderboards/${gameId}/${scoreId}`);
    
    await leaderboardRef.set({
        userId: scoreData.userId,
        userName: scoreData.userName || 'Anonymous',
        score: scoreData.score,
        timestamp: admin.database.ServerValue.TIMESTAMP
    });

    // Trim leaderboard to top 100
    const snapshot = await rtdb.ref(`liveLeaderboards/${gameId}`)
        .orderByChild('score')
        .limitToFirst(1)
        .once('value');
    
    const leaderboardSize = await rtdb.ref(`liveLeaderboards/${gameId}`).once('value');
    
    if (leaderboardSize.numChildren() > 100) {
        snapshot.forEach((child) => {
            child.ref.remove();
        });
    }
}

/**
 * Check for score-based achievements
 */
async function checkScoreAchievements(scoreData) {
    const userId = scoreData.userId;
    const gameId = scoreData.gameId;
    const score = scoreData.score;

    const achievements = [];

    // First score achievement
    const userScores = await db.collection('scores')
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
        const achRef = db.collection('users').doc(userId)
            .collection('achievements').doc(`global_${achievementId}`);
        
        const existing = await achRef.get();
        if (!existing.exists) {
            await achRef.set({
                id: achievementId,
                gameId: 'global',
                unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
                triggeredBy: { gameId, score }
            });
            
            // Send notification
            await sendNotification(userId, {
                type: 'achievement',
                title: 'Achievement Unlocked!',
                message: `You earned: ${achievementId}`,
                icon: '🏆'
            });
        }
    }
}

// ==================== LEADERBOARD AGGREGATION ====================

/**
 * Aggregate leaderboards every 5 minutes
 */
exports.aggregateLeaderboards = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
        console.log('Running leaderboard aggregation');

        const games = ['snake', '2048', 'breakout', 'tetris', 'minesweeper', 
                       'pacman', 'asteroids', 'tower-defense', 'rhythm', 'roguelike', 'dino-runner'];

        for (const gameId of games) {
            try {
                await aggregateGameLeaderboard(gameId);
            } catch (error) {
                console.error(`Failed to aggregate ${gameId}:`, error);
            }
        }

        // Update global stats
        await updateGlobalStats();

        return null;
    });

/**
 * Aggregate a single game's leaderboard
 */
async function aggregateGameLeaderboard(gameId) {
    // Get top 100 verified scores
    const scoresSnapshot = await db.collection('scores')
        .where('gameId', '==', gameId)
        .where('verified', '==', true)
        .orderBy('score', 'desc')
        .limit(100)
        .get();

    const leaderboard = [];
    const uniqueUsers = new Set();

    scoresSnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include best score per user
        if (!uniqueUsers.has(data.userId)) {
            uniqueUsers.add(data.userId);
            leaderboard.push({
                rank: leaderboard.length + 1,
                scoreId: doc.id,
                userId: data.userId,
                userName: data.userName,
                score: data.score,
                timestamp: data.timestamp
            });
        }
    });

    // Store aggregated leaderboard
    await db.collection('leaderboards').doc(gameId).set({
        gameId,
        entries: leaderboard.slice(0, 50), // Top 50
        totalPlayers: uniqueUsers.size,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Aggregated ${gameId}: ${leaderboard.length} entries`);
}

/**
 * Update global statistics
 */
async function updateGlobalStats() {
    const usersCount = await db.collection('users').count().get();
    const scoresCount = await db.collection('scores').where('verified', '==', true).count().get();
    
    await db.collection('stats').doc('global').set({
        totalUsers: usersCount.data().count,
        totalScores: scoresCount.data().count,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// ==================== ANALYTICS PIPELINE ====================

/**
 * Process analytics events
 */
exports.processAnalytics = functions.firestore
    .document('analytics/{eventId}')
    .onCreate(async (snap, context) => {
        const eventData = snap.data();
        
        console.log(`Processing analytics event: ${eventData.type}`);

        try {
            // Enrich event data
            const enrichedEvent = {
                ...eventData,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                serverTimestamp: Date.now()
            };

            // Store in analytics collection partitioned by date
            const dateStr = new Date().toISOString().split('T')[0];
            await db.collection('analytics_processed')
                .doc(dateStr)
                .collection('events')
                .add(enrichedEvent);

            // Update real-time counters
            await updateAnalyticsCounters(eventData);

            // Delete original event (processed)
            await snap.ref.delete();

            return null;
        } catch (error) {
            console.error('Analytics processing error:', error);
            return null;
        }
    });

/**
 * Record an analytics event (called from other functions)
 */
async function recordAnalyticsEvent(eventType, data) {
    await db.collection('analytics').add({
        type: eventType,
        data,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
    });
}

/**
 * Update real-time analytics counters
 */
async function updateAnalyticsCounters(eventData) {
    const dateStr = new Date().toISOString().split('T')[0];
    const countersRef = db.collection('analytics_counters').doc(dateStr);

    const updates = {
        [`events.${eventData.type}`]: admin.firestore.FieldValue.increment(1),
        totalEvents: admin.firestore.FieldValue.increment(1)
    };

    if (eventData.data?.gameId) {
        updates[`games.${eventData.data.gameId}`] = admin.firestore.FieldValue.increment(1);
    }

    await countersRef.set(updates, { merge: true });
}

/**
 * Daily analytics aggregation (runs at midnight)
 */
exports.dailyAnalyticsRollup = functions.pubsub
    .schedule('0 0 * * *')
    .timeZone('UTC')
    .onRun(async (context) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        console.log(`Running daily rollup for ${dateStr}`);

        try {
            // Get daily counters
            const countersDoc = await db.collection('analytics_counters').doc(dateStr).get();
            
            if (countersDoc.exists) {
                // Store in historical collection
                await db.collection('analytics_daily').doc(dateStr).set({
                    date: dateStr,
                    counters: countersDoc.data(),
                    processedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            return null;
        } catch (error) {
            console.error('Daily rollup error:', error);
            return null;
        }
    });

// ==================== PRESENCE CLEANUP ====================

/**
 * Clean up stale presence data every 10 minutes
 */
exports.cleanupPresence = functions.pubsub
    .schedule('every 10 minutes')
    .onRun(async (context) => {
        console.log('Cleaning up stale presence');

        // Stale threshold: 1 hour
        const staleThreshold = Date.now() - (60 * 60 * 1000);

        try {
            const staleUsers = await rtdb.ref('presence')
                .orderByChild('lastChanged')
                .endAt(staleThreshold)
                .once('value');

            const updates = {};
            staleUsers.forEach((child) => {
                if (child.val().online === false) {
                    updates[child.key] = null;
                }
            });

            if (Object.keys(updates).length > 0) {
                await rtdb.ref('presence').update(updates);
                console.log(`Cleaned up ${Object.keys(updates).length} stale presence entries`);
            }

            return null;
        } catch (error) {
            console.error('Presence cleanup error:', error);
            return null;
        }
    });

// ==================== USER SYNC ====================

/**
 * Handle user profile updates
 */
exports.onUserUpdate = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const userId = context.params.userId;
        const before = change.before.data();
        const after = change.after.data();

        // Check for level up
        if (after.level > before.level) {
            await sendNotification(userId, {
                type: 'level_up',
                title: 'Level Up!',
                message: `Congratulations! You reached level ${after.level}!`,
                icon: '⬆️'
            });

            // Record analytics
            await recordAnalyticsEvent('level_up', {
                userId,
                newLevel: after.level,
                previousLevel: before.level
            });
        }

        return null;
    });

/**
 * Handle new user creation
 */
exports.onUserCreate = functions.firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
        const userId = context.params.userId;
        const userData = snap.data();

        console.log(`New user created: ${userId}`);

        // Initialize user stats document
        await db.collection('stats').doc('global').set({
            totalUsers: admin.firestore.FieldValue.increment(1)
        }, { merge: true });

        // Send welcome notification
        await sendNotification(userId, {
            type: 'welcome',
            title: 'Welcome to Arcade Hub!',
            message: 'Start playing games to earn achievements and climb the leaderboards!',
            icon: '🎮'
        });

        // Record analytics
        await recordAnalyticsEvent('user_signup', {
            userId,
            isAnonymous: userData.isAnonymous || false
        });

        return null;
    });

// ==================== NOTIFICATIONS ====================

/**
 * Send a notification to a user
 */
async function sendNotification(userId, notification) {
    await rtdb.ref(`notifications/${userId}`).push({
        ...notification,
        read: false,
        timestamp: admin.database.ServerValue.TIMESTAMP
    });
}

/**
 * HTTP endpoint for sending notifications (for testing)
 */
exports.sendTestNotification = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }

    const userId = context.auth.uid;
    
    await sendNotification(userId, {
        type: 'test',
        title: data.title || 'Test Notification',
        message: data.message || 'This is a test notification',
        icon: '🔔'
    });

    return { success: true };
});

// ==================== TOURNAMENTS ====================

/**
 * Start scheduled tournaments
 */
exports.startScheduledTournaments = functions.pubsub
    .schedule('every 1 minutes')
    .onRun(async (context) => {
        const now = admin.firestore.Timestamp.now();

        // Find tournaments that should start
        const toStart = await db.collection('tournaments')
            .where('status', '==', 'scheduled')
            .where('startTime', '<=', now)
            .get();

        for (const doc of toStart.docs) {
            await doc.ref.update({
                status: 'in_progress',
                actualStartTime: now
            });

            // Notify all participants
            const participants = doc.data().participants || [];
            for (const participantId of participants) {
                await sendNotification(participantId, {
                    type: 'tournament_start',
                    title: 'Tournament Started!',
                    message: `The tournament "${doc.data().name}" has begun!`,
                    icon: '🏆',
                    tournamentId: doc.id
                });
            }
        }

        // Find tournaments that should end
        const toEnd = await db.collection('tournaments')
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
async function finalizeTournament(tournamentDoc) {
    const tournament = tournamentDoc.data();
    
    // Get all scores for this tournament
    const scores = await db.collection('tournament_scores')
        .where('tournamentId', '==', tournamentDoc.id)
        .orderBy('score', 'desc')
        .limit(10)
        .get();

    const winners = [];
    scores.forEach((doc, index) => {
        winners.push({
            rank: index + 1,
            ...doc.data()
        });
    });

    // Update tournament with results
    await tournamentDoc.ref.update({
        status: 'completed',
        winners: winners.slice(0, 3),
        allResults: winners,
        finalizedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notify winners
    for (const winner of winners.slice(0, 3)) {
        await sendNotification(winner.userId, {
            type: 'tournament_win',
            title: `You placed #${winner.rank}!`,
            message: `Congratulations on your performance in "${tournament.name}"!`,
            icon: winner.rank === 1 ? '🥇' : winner.rank === 2 ? '🥈' : '🥉',
            tournamentId: tournamentDoc.id
        });
    }
}

// ==================== HEALTH CHECK ====================

/**
 * Health check endpoint
 */
exports.healthCheck = functions.https.onRequest((req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

console.log('Arcade Hub Cloud Functions loaded');
