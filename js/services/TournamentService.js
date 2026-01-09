/**
 * TournamentService - Hub-Wide Tournament System
 * Manages tournament creation, brackets, matchmaking, and rewards
 * Now with Firestore persistence for cross-device sync
 */
import { eventBus } from '../engine/EventBus.js';
import { globalStateManager, GAME_IDS } from './GlobalStateManager.js';
import { notificationService } from './NotificationService.js';
import { economyService, CURRENCY } from './EconomyService.js';
import { firebaseService } from '../engine/FirebaseService.js';
import { schemaVersionService } from './SchemaVersionService.js';

// Tournament types
export const TOURNAMENT_TYPES = {
    SINGLE_ELIMINATION: 'single_elimination',
    DOUBLE_ELIMINATION: 'double_elimination',
    ROUND_ROBIN: 'round_robin'
};

// Tournament sizes
export const TOURNAMENT_SIZES = [4, 8, 16, 32];

// Tournament status
export const TOURNAMENT_STATUS = {
    OPEN: 'open',           // Accepting entries
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// Reward tiers
const REWARD_TIERS = {
    1: { xp: 500, coins: 100, title: 'Champion' },
    2: { xp: 300, coins: 50, title: 'Runner-up' },
    3: { xp: 150, coins: 25, title: 'Semi-finalist' },
    4: { xp: 100, coins: 10, title: 'Quarterfinalist' }
};

class TournamentService {
    constructor() {
        this.tournaments = [];
        this.activeTournament = null;
        this.firestoreEnabled = false;
        this.unsubscribe = null;
    }

    /**
     * Initialize the tournament service
     * Now includes Firestore sync and auth state listener
     */
    async init() {
        // Always load from localStorage first
        this.tournaments = this._loadTournaments();
        
        // Try to enable Firestore if already signed in
        if (firebaseService.db && firebaseService.isSignedIn()) {
            this.firestoreEnabled = true;
            await this._syncFromFirestore();
            this._subscribeToUpdates();
            console.log('TournamentService initialized with Firestore');
        } else {
            console.log('TournamentService initialized with localStorage');
            
            // Listen for auth state changes to sync when user signs in later
            if (firebaseService.auth) {
                firebaseService.auth.onAuthStateChanged(async (user) => {
                    if (user && !this.firestoreEnabled && firebaseService.db) {
                        this.firestoreEnabled = true;
                        await this._syncFromFirestore();
                        this._subscribeToUpdates();
                        console.log('TournamentService: Firestore enabled after sign-in');
                        eventBus.emit('tournamentsUpdated', this.tournaments);
                    }
                });
            }
        }

        // Run migrations if needed
        if (schemaVersionService.needsMigration('tournaments')) {
            this.tournaments = schemaVersionService.migrateData('tournaments', this.tournaments);
            await this._saveTournaments();
        }

        this._checkActiveTournaments();
    }

    // ============ TOURNAMENT MANAGEMENT ============

    /**
     * Create a new tournament
     * @param {Object} config
     * @returns {Object} Tournament object
     */
    createTournament(config) {
        const {
            name,
            gameId,
            type = TOURNAMENT_TYPES.SINGLE_ELIMINATION,
            size = 8,
            entryFee = 0,
            startTime = Date.now() + 3600000 // 1 hour from now
        } = config;

        if (!GAME_IDS.includes(gameId)) {
            throw new Error('Invalid game ID');
        }

        if (!TOURNAMENT_SIZES.includes(size)) {
            throw new Error('Invalid tournament size');
        }

        const tournament = {
            id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name || `${this._getGameName(gameId)} Tournament`,
            gameId,
            type,
            size,
            entryFee,
            startTime,
            createdAt: Date.now(),
            status: TOURNAMENT_STATUS.OPEN,
            participants: [],
            bracket: null,
            currentRound: 0,
            results: null,
            hostId: globalStateManager.getProfile().id
        };

        this.tournaments.push(tournament);
        this._saveTournaments();

        eventBus.emit('tournamentCreated', tournament);
        return tournament;
    }

    /**
     * Join a tournament
     * @param {string} tournamentId
     * @returns {boolean} Success
     */
    joinTournament(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return false;

        if (tournament.status !== TOURNAMENT_STATUS.OPEN) {
            notificationService.error('Tournament is not accepting entries');
            return false;
        }

        if (tournament.participants.length >= tournament.size) {
            notificationService.error('Tournament is full');
            return false;
        }

        const profile = globalStateManager.getProfile();
        const participantId = profile.id || `guest_${Date.now()}`;

        // Check if already joined
        if (tournament.participants.some(p => p.id === participantId)) {
            notificationService.error('Already joined this tournament');
            return false;
        }

        // Deduct entry fee if applicable
        if (tournament.entryFee > 0) {
            if (!economyService.canAfford(CURRENCY.COINS, tournament.entryFee)) {
                notificationService.error('Not enough coins for entry fee');
                return false;
            }
            economyService.spendCurrency(CURRENCY.COINS, tournament.entryFee);
            notificationService.info(`Paid ${tournament.entryFee} coins entry fee`);
        }

        tournament.participants.push({
            id: participantId,
            name: profile.displayName,
            avatar: profile.avatar,
            joinedAt: Date.now(),
            seed: tournament.participants.length + 1
        });

        this._saveTournaments();

        notificationService.success(`Joined ${tournament.name}!`);
        eventBus.emit('tournamentJoined', { tournamentId, participant: profile });

        // Auto-start if full
        if (tournament.participants.length >= tournament.size) {
            this.startTournament(tournamentId);
        }

        return true;
    }

    /**
     * Leave a tournament
     * @param {string} tournamentId
     * @returns {boolean} Success
     */
    leaveTournament(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return false;

        if (tournament.status !== TOURNAMENT_STATUS.OPEN) {
            notificationService.error('Cannot leave a started tournament');
            return false;
        }

        const profile = globalStateManager.getProfile();
        const idx = tournament.participants.findIndex(p => p.id === profile.id);

        if (idx === -1) return false;

        tournament.participants.splice(idx, 1);
        this._saveTournaments();

        notificationService.info('Left the tournament');
        eventBus.emit('tournamentLeft', { tournamentId });

        return true;
    }

    /**
     * Start a tournament
     * @param {string} tournamentId
     * @returns {boolean} Success
     */
    startTournament(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return false;

        if (tournament.participants.length < 2) {
            notificationService.error('Need at least 2 participants');
            return false;
        }

        // Generate bracket
        tournament.bracket = this._generateBracket(tournament);
        tournament.status = TOURNAMENT_STATUS.IN_PROGRESS;
        tournament.currentRound = 1;

        this.activeTournament = tournament;
        this._saveTournaments();

        notificationService.showToast(`🏆 ${tournament.name} has started!`, 'challenge');
        eventBus.emit('tournamentStarted', tournament);

        return true;
    }

    /**
     * Report a match result
     * @param {string} tournamentId
     * @param {string} matchId
     * @param {Object} result - { winnerId, scores }
     */
    reportMatchResult(tournamentId, matchId, result) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament || !tournament.bracket) return false;

        const match = this._findMatch(tournament.bracket, matchId);
        if (!match) return false;

        match.result = result;
        match.winner = result.winnerId;
        match.completed = true;

        // Advance winner to next round
        this._advanceWinner(tournament, match);

        // Check if tournament is complete
        if (this._isTournamentComplete(tournament)) {
            this._completeTournament(tournament);
        }

        this._saveTournaments();
        eventBus.emit('matchCompleted', { tournamentId, matchId, result });

        return true;
    }

    // ============ QUERIES ============

    /**
     * Get tournament by ID
     * @param {string} tournamentId
     * @returns {Object|null}
     */
    getTournament(tournamentId) {
        return this.tournaments.find(t => t.id === tournamentId) || null;
    }

    /**
     * Get all tournaments
     * @param {Object} filters - { gameId, status }
     * @returns {Object[]}
     */
    getTournaments(filters = {}) {
        let result = [...this.tournaments];

        if (filters.gameId) {
            result = result.filter(t => t.gameId === filters.gameId);
        }

        if (filters.status) {
            result = result.filter(t => t.status === filters.status);
        }

        return result.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Get open tournaments
     * @returns {Object[]}
     */
    getOpenTournaments() {
        return this.getTournaments({ status: TOURNAMENT_STATUS.OPEN });
    }

    /**
     * Get user's tournaments
     * @returns {Object[]}
     */
    getMyTournaments() {
        const profile = globalStateManager.getProfile();
        return this.tournaments.filter(t => 
            t.participants.some(p => p.id === profile.id) ||
            t.hostId === profile.id
        );
    }

    /**
     * Get tournament history (completed)
     * @param {number} limit
     * @returns {Object[]}
     */
    getTournamentHistory(limit = 10) {
        return this.getTournaments({ status: TOURNAMENT_STATUS.COMPLETED })
            .slice(0, limit);
    }

    /**
     * Check if user is in tournament
     * @param {string} tournamentId
     * @returns {boolean}
     */
    isParticipant(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return false;

        const profile = globalStateManager.getProfile();
        return tournament.participants.some(p => p.id === profile.id);
    }

    // ============ BRACKET GENERATION ============

    /**
     * Generate tournament bracket
     * @private
     */
    _generateBracket(tournament) {
        const participants = [...tournament.participants];
        
        // Shuffle participants
        for (let i = participants.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [participants[i], participants[j]] = [participants[j], participants[i]];
        }

        // Pad to power of 2
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(participants.length)));
        while (participants.length < bracketSize) {
            participants.push({ id: 'BYE', name: 'BYE', isBye: true });
        }

        // Build bracket structure
        const rounds = Math.log2(bracketSize);
        const bracket = {
            rounds: [],
            totalRounds: rounds
        };

        // First round
        const firstRound = [];
        for (let i = 0; i < participants.length; i += 2) {
            const match = {
                id: `m_r1_${firstRound.length}`,
                round: 1,
                player1: participants[i],
                player2: participants[i + 1],
                winner: null,
                result: null,
                completed: false,
                nextMatchId: null
            };

            // Auto-advance if opponent is BYE
            if (participants[i + 1].isBye) {
                match.winner = participants[i].id;
                match.completed = true;
            } else if (participants[i].isBye) {
                match.winner = participants[i + 1].id;
                match.completed = true;
            }

            firstRound.push(match);
        }
        bracket.rounds.push(firstRound);

        // Subsequent rounds
        let prevRound = firstRound;
        for (let r = 2; r <= rounds; r++) {
            const currentRound = [];
            for (let i = 0; i < prevRound.length; i += 2) {
                const match = {
                    id: `m_r${r}_${currentRound.length}`,
                    round: r,
                    player1: null,
                    player2: null,
                    winner: null,
                    result: null,
                    completed: false,
                    nextMatchId: null
                };
                
                // Link previous matches
                prevRound[i].nextMatchId = match.id;
                prevRound[i + 1].nextMatchId = match.id;

                currentRound.push(match);
            }
            bracket.rounds.push(currentRound);
            prevRound = currentRound;
        }

        // Advance BYE winners
        this._advanceByes(bracket);

        return bracket;
    }

    /**
     * Advance BYE winners through bracket
     * @private
     */
    _advanceByes(bracket) {
        for (const round of bracket.rounds) {
            for (const match of round) {
                if (match.completed && match.winner) {
                    this._advanceWinnerToNext(bracket, match);
                }
            }
        }
    }

    /**
     * Advance winner to next match
     * @private
     */
    _advanceWinner(tournament, match) {
        this._advanceWinnerToNext(tournament.bracket, match);
    }

    /**
     * Advance winner to next match in bracket
     * @private
     */
    _advanceWinnerToNext(bracket, match) {
        if (!match.nextMatchId) return;

        const nextMatch = this._findMatch(bracket, match.nextMatchId);
        if (!nextMatch) return;

        const winner = match.player1?.id === match.winner ? match.player1 : match.player2;

        if (!nextMatch.player1) {
            nextMatch.player1 = winner;
        } else if (!nextMatch.player2) {
            nextMatch.player2 = winner;
        }
    }

    /**
     * Find match in bracket
     * @private
     */
    _findMatch(bracket, matchId) {
        for (const round of bracket.rounds) {
            const match = round.find(m => m.id === matchId);
            if (match) return match;
        }
        return null;
    }

    /**
     * Check if tournament is complete
     * @private
     */
    _isTournamentComplete(tournament) {
        const finalRound = tournament.bracket.rounds[tournament.bracket.rounds.length - 1];
        return finalRound[0].completed;
    }

    /**
     * Complete tournament and distribute rewards
     * @private
     */
    _completeTournament(tournament) {
        tournament.status = TOURNAMENT_STATUS.COMPLETED;
        tournament.completedAt = Date.now();

        // Determine placements
        const placements = this._calculatePlacements(tournament);
        tournament.results = placements;

        // Award rewards
        const profile = globalStateManager.getProfile();
        const myPlacement = placements.find(p => p.id === profile.id);

        if (myPlacement) {
            const reward = REWARD_TIERS[myPlacement.place] || REWARD_TIERS[4];
            globalStateManager.addXP(reward.xp);
            
            // Award coins via EconomyService
            economyService.addCurrency(CURRENCY.COINS, reward.coins, `Tournament Placement: ${myPlacement.place}`);

            notificationService.showChallengeComplete({
                name: `${tournament.name} - ${this._getPlaceName(myPlacement.place)}`,
                reward: `${reward.xp} XP & ${reward.coins} Coins`
            });
        }

        this.activeTournament = null;
        this._saveTournaments();

        eventBus.emit('tournamentCompleted', tournament);
    }

    /**
     * Calculate placements from bracket
     * @private
     */
    _calculatePlacements(tournament) {
        const placements = [];
        const bracket = tournament.bracket;
        
        // Winner (final match winner)
        const finalMatch = bracket.rounds[bracket.rounds.length - 1][0];
        if (finalMatch.winner) {
            const winner = finalMatch.player1?.id === finalMatch.winner ? finalMatch.player1 : finalMatch.player2;
            const runnerUp = finalMatch.player1?.id === finalMatch.winner ? finalMatch.player2 : finalMatch.player1;
            
            placements.push({ ...winner, place: 1 });
            placements.push({ ...runnerUp, place: 2 });
        }

        // Semi-finalists
        if (bracket.rounds.length >= 2) {
            const semiFinals = bracket.rounds[bracket.rounds.length - 2];
            for (const match of semiFinals) {
                if (match.completed && match.winner) {
                    const loser = match.player1?.id === match.winner ? match.player2 : match.player1;
                    if (loser && !loser.isBye && !placements.some(p => p.id === loser.id)) {
                        placements.push({ ...loser, place: 3 });
                    }
                }
            }
        }

        return placements;
    }

    /**
     * Get placement name
     * @private
     */
    _getPlaceName(place) {
        const names = { 1: '🥇 Champion', 2: '🥈 Runner-up', 3: '🥉 Semi-finalist' };
        return names[place] || `${place}th Place`;
    }

    /**
     * Get game name by ID
     * @private
     */
    _getGameName(gameId) {
        const names = {
            'snake': 'Snake', 'tetris': 'Tetris', 'pacman': 'Pac-Man',
            'breakout': 'Breakout', 'minesweeper': 'Minesweeper',
            'tower-defense': 'Tower Defense', 'rhythm': 'Rhythm',
            'roguelike': 'Roguelike', 'asteroids': 'Asteroids',
            '2048': '2048'
        };
        return names[gameId] || gameId;
    }

    // ============ PERSISTENCE ============

    /**
     * Load tournaments from localStorage (fallback)
     * @private
     */
    _loadTournaments() {
        try {
            const saved = localStorage.getItem('arcadeHub_tournaments');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load tournaments:', e);
            return [];
        }
    }

    /**
     * Save tournaments to storage (Firestore or localStorage)
     * @private
     */
    async _saveTournaments() {
        // Always save to localStorage as backup
        try {
            localStorage.setItem('arcadeHub_tournaments', JSON.stringify(this.tournaments));
        } catch (e) {
            console.warn('Failed to save tournaments locally:', e);
        }

        // Also save to Firestore if enabled
        if (this.firestoreEnabled && firebaseService.db) {
            try {
                const db = firebaseService.db;
                const batch = db.batch();

                for (const tournament of this.tournaments) {
                    const docRef = db.collection('tournaments').doc(tournament.id);
                    batch.set(docRef, {
                        ...tournament,
                        updatedAt: firebaseService.serverTimestamp()
                    }, { merge: true });
                }

                await batch.commit();
                console.log('[Tournaments] Saved to Firestore');
            } catch (e) {
                console.warn('Failed to save tournaments to Firestore:', e);
            }
        }
    }

    /**
     * Save a single tournament to Firestore
     * @private
     */
    async _saveTournamentToFirestore(tournament) {
        if (!this.firestoreEnabled || !firebaseService.db) return;

        try {
            const docRef = firebaseService.db.collection('tournaments').doc(tournament.id);
            await docRef.set({
                ...tournament,
                updatedAt: firebaseService.serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.warn('Failed to save tournament to Firestore:', e);
        }
    }

    /**
     * Sync tournaments from Firestore
     * @private
     */
    async _syncFromFirestore() {
        if (!firebaseService.db) return;

        try {
            const db = firebaseService.db;
            const snapshot = await db.collection('tournaments')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            const firestoreTournaments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Merge with local tournaments
            this.tournaments = this._mergeTournaments(firestoreTournaments);
            
            console.log(`[Tournaments] Synced ${firestoreTournaments.length} from Firestore`);
        } catch (e) {
            console.warn('Failed to sync from Firestore:', e);
            // Fall back to localStorage
            this.tournaments = this._loadTournaments();
        }
    }

    /**
     * Merge Firestore and local tournaments
     * @private
     */
    _mergeTournaments(firestoreTournaments) {
        const localTournaments = this._loadTournaments();
        const merged = [...firestoreTournaments];
        
        // Add local tournaments that aren't in Firestore
        for (const local of localTournaments) {
            if (!merged.some(t => t.id === local.id)) {
                merged.push(local);
            }
        }

        return merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    /**
     * Subscribe to real-time tournament updates
     * @private
     */
    _subscribeToUpdates() {
        if (!firebaseService.db || this.unsubscribe) return;

        try {
            this.unsubscribe = firebaseService.db.collection('tournaments')
                .where('status', 'in', ['open', 'in_progress'])
                .onSnapshot(snapshot => {
                    snapshot.docChanges().forEach(change => {
                        const tournament = { id: change.doc.id, ...change.doc.data() };
                        
                        if (change.type === 'added' || change.type === 'modified') {
                            const idx = this.tournaments.findIndex(t => t.id === tournament.id);
                            if (idx >= 0) {
                                this.tournaments[idx] = tournament;
                            } else {
                                this.tournaments.unshift(tournament);
                            }
                        } else if (change.type === 'removed') {
                            this.tournaments = this.tournaments.filter(t => t.id !== tournament.id);
                        }
                    });
                    
                    eventBus.emit('tournamentsUpdated', this.tournaments);
                }, error => {
                    console.warn('Tournament subscription error:', error);
                });
        } catch (e) {
            console.warn('Failed to subscribe to tournament updates:', e);
        }
    }

    /**
     * Unsubscribe from updates
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    /**
     * Check for active tournaments on init
     * @private
     */
    _checkActiveTournaments() {
        const active = this.tournaments.find(t => t.status === TOURNAMENT_STATUS.IN_PROGRESS);
        if (active) {
            this.activeTournament = active;
        }
    }

    /**
     * Clear all tournaments (for testing)
     */
    async clearAll() {
        this.tournaments = [];
        this.activeTournament = null;
        localStorage.removeItem('arcadeHub_tournaments');
        
        // Also clear from Firestore if enabled
        if (this.firestoreEnabled && firebaseService.db) {
            // Note: This would need admin permissions in production
            console.warn('Firestore tournaments not cleared - requires admin');
        }
    }

    /**
     * Migrate local tournaments to Firestore
     * Call this once to move existing data to cloud
     */
    async migrateToFirestore() {
        if (!firebaseService.db || !firebaseService.isSignedIn()) {
            console.warn('Cannot migrate: Firestore not available');
            return false;
        }

        const localTournaments = this._loadTournaments();
        if (localTournaments.length === 0) {
            console.log('No local tournaments to migrate');
            return true;
        }

        console.log(`Migrating ${localTournaments.length} tournaments to Firestore...`);

        try {
            const db = firebaseService.db;
            const batch = db.batch();

            for (const tournament of localTournaments) {
                const docRef = db.collection('tournaments').doc(tournament.id);
                batch.set(docRef, {
                    ...tournament,
                    migratedFromLocal: true,
                    migratedAt: firebaseService.serverTimestamp()
                });
            }

            await batch.commit();
            console.log('Migration complete!');
            return true;
        } catch (e) {
            console.error('Migration failed:', e);
            return false;
        }
    }
}

// Singleton instance
export const tournamentService = new TournamentService();
export default TournamentService;
