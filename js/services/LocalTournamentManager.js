/**
 * Local Tournament Manager
 * Client-side tournament bracket management without Cloud Functions
 * Supports single/double elimination and round-robin formats
 */

import { eventBus } from '../engine/EventBus.js';

class LocalTournamentManager {
    constructor() {
        this.activeTournaments = new Map();
        this.tournamentHistory = [];
    }

    /**
     * Initialize manager
     */
    init() {
        console.log('[LocalTournamentManager] Initialized');
        this.loadFromStorage();
    }

    /**
     * Create a new tournament
     */
    createTournament(config) {
        const {
            name,
            gameId,
            format = 'single_elimination',
            maxPlayers = 16,
            players = [],
            roundsToWin = 1,
            timeLimit = null
        } = config;

        const tournament = {
            id: `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            gameId,
            format,
            maxPlayers,
            players: players.map((p, i) => ({
                id: typeof p === 'string' ? p : p.id,
                name: typeof p === 'string' ? p : p.name,
                seed: i + 1
            })),
            roundsToWin,
            timeLimit,
            status: 'pending',
            createdAt: Date.now(),
            startedAt: null,
            completedAt: null,
            bracket: null,
            matches: [],
            currentRound: 0,
            winner: null
        };

        tournament.bracket = this.generateBracket(tournament);
        tournament.matches = this.generateMatches(tournament);

        this.activeTournaments.set(tournament.id, tournament);
        this.saveToStorage();

        console.log('[LocalTournamentManager] Tournament created:', tournament.id);
        eventBus.emit('tournamentCreated', { tournament });

        return tournament;
    }

    /**
     * Generate tournament bracket
     */
    generateBracket(tournament) {
        const { format, players } = tournament;
        
        let bracketPlayers = [...players];
        const targetSize = Math.pow(2, Math.ceil(Math.log2(Math.max(players.length, 2))));
        
        while (bracketPlayers.length < targetSize) {
            bracketPlayers.push({ id: `bye_${bracketPlayers.length}`, name: 'BYE', isBye: true });
        }

        if (!players.some(p => p.seed)) {
            bracketPlayers = this.shuffleArray(bracketPlayers);
        } else {
            bracketPlayers.sort((a, b) => (a.seed || 999) - (b.seed || 999));
        }

        if (format === 'single_elimination') {
            return this.generateSingleEliminationBracket(bracketPlayers);
        } else if (format === 'double_elimination') {
            return this.generateDoubleEliminationBracket(bracketPlayers);
        } else if (format === 'round_robin') {
            return this.generateRoundRobinBracket(bracketPlayers);
        }

        return null;
    }

    /**
     * Generate single elimination bracket
     */
    generateSingleEliminationBracket(players) {
        const rounds = Math.log2(players.length);
        const bracket = {
            rounds: [],
            type: 'single_elimination'
        };

        for (let r = 0; r < rounds; r++) {
            const matchesInRound = players.length / Math.pow(2, r + 1);
            const round = {
                round: r + 1,
                name: r === rounds - 1 ? 'Final' : 
                      r === rounds - 2 ? 'Semi-Finals' :
                      r === rounds - 3 ? 'Quarter-Finals' :
                      `Round ${r + 1}`,
                matches: []
            };

            for (let m = 0; m < matchesInRound; m++) {
                round.matches.push({
                    id: `r${r}_m${m}`,
                    round: r + 1,
                    match: m + 1,
                    player1: r === 0 ? players[m * 2] : null,
                    player2: r === 0 ? players[m * 2 + 1] : null,
                    winner: null,
                    score1: null,
                    score2: null,
                    status: r === 0 ? 'ready' : 'pending'
                });
            }

            bracket.rounds.push(round);
        }

        return bracket;
    }

    /**
     * Generate double elimination bracket
     */
    generateDoubleEliminationBracket(players) {
        const winnersBracket = this.generateSingleEliminationBracket(players);
        winnersBracket.type = 'winners';

        const numLosersRounds = (winnersBracket.rounds.length - 1) * 2;
        const losersBracket = {
            rounds: [],
            type: 'losers'
        };

        for (let r = 0; r < numLosersRounds; r++) {
            losersBracket.rounds.push({
                round: r + 1,
                name: `Losers Round ${r + 1}`,
                matches: []
            });
        }

        const grandFinals = {
            rounds: [{
                round: 1,
                name: 'Grand Finals',
                matches: [{
                    id: 'gf_1',
                    round: 'finals',
                    match: 1,
                    player1: null,
                    player2: null,
                    winner: null,
                    score1: null,
                    score2: null,
                    status: 'pending'
                }]
            }],
            type: 'finals'
        };

        return {
            brackets: [winnersBracket, losersBracket, grandFinals]
        };
    }

    /**
     * Generate round robin bracket
     */
    generateRoundRobinBracket(players) {
        const n = players.length;
        const matches = [];
        const rounds = [];

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                matches.push({
                    id: `rr_${i}_${j}`,
                    player1: players[i],
                    player2: players[j],
                    winner: null,
                    score1: null,
                    score2: null,
                    status: 'pending'
                });
            }
        }

        const matchesPerRound = Math.floor(n / 2);
        const numRounds = n - 1;

        for (let r = 0; r < numRounds; r++) {
            const roundMatches = matches.slice(r * matchesPerRound, (r + 1) * matchesPerRound);
            rounds.push({
                round: r + 1,
                name: `Round ${r + 1}`,
                matches: roundMatches.map((m, i) => ({
                    ...m,
                    round: r + 1,
                    match: i + 1
                }))
            });
        }

        return {
            rounds,
            type: 'round_robin',
            standings: players.map(p => ({
                player: p,
                played: 0,
                wins: 0,
                losses: 0,
                points: 0
            }))
        };
    }

    /**
     * Generate matches array from bracket
     */
    generateMatches(tournament) {
        const matches = [];
        
        if (tournament.format === 'round_robin') {
            tournament.bracket.rounds.forEach(round => {
                matches.push(...round.matches);
            });
        } else if (tournament.bracket.brackets) {
            tournament.bracket.brackets.forEach(b => {
                b.rounds.forEach(round => {
                    matches.push(...round.matches);
                });
            });
        } else {
            tournament.bracket.rounds.forEach(round => {
                matches.push(...round.matches);
            });
        }

        return matches;
    }

    /**
     * Start tournament
     */
    startTournament(tournamentId) {
        const tournament = this.activeTournaments.get(tournamentId);
        if (!tournament) return null;

        tournament.status = 'active';
        tournament.startedAt = Date.now();
        tournament.currentRound = 1;

        this.saveToStorage();
        eventBus.emit('tournamentStarted', { tournament });

        return tournament;
    }

    /**
     * Report match result
     */
    reportMatchResult(tournamentId, matchId, winner, score1, score2) {
        const tournament = this.activeTournaments.get(tournamentId);
        if (!tournament) return null;

        const match = tournament.matches.find(m => m.id === matchId);
        if (!match) return null;

        match.winner = winner;
        match.score1 = score1;
        match.score2 = score2;
        match.status = 'completed';
        match.completedAt = Date.now();

        this.advanceWinner(tournament, match, winner);

        if (tournament.format === 'round_robin') {
            this.updateRoundRobinStandings(tournament, match);
        }

        this.checkRoundComplete(tournament);
        this.saveToStorage();
        eventBus.emit('matchCompleted', { tournament, match });

        return match;
    }

    /**
     * Advance winner to next round
     */
    advanceWinner(tournament, match, winnerId) {
        if (tournament.format === 'round_robin') return;

        const nextRound = match.round + 1;
        
        if (tournament.bracket.rounds) {
            const nextRoundData = tournament.bracket.rounds.find(r => r.round === nextRound);
            if (nextRoundData) {
                const nextMatchIndex = Math.floor((match.match - 1) / 2);
                const nextMatch = nextRoundData.matches[nextMatchIndex];
                if (nextMatch) {
                    const winner = match.player1?.id === winnerId ? match.player1 : match.player2;
                    if (!nextMatch.player1) {
                        nextMatch.player1 = winner;
                    } else {
                        nextMatch.player2 = winner;
                    }
                    
                    if (nextMatch.player1 && nextMatch.player2) {
                        nextMatch.status = 'ready';
                    }
                }
            }
        }
    }

    /**
     * Update round robin standings
     */
    updateRoundRobinStandings(tournament, match) {
        const standings = tournament.bracket.standings;
        const player1Standing = standings.find(s => s.player.id === match.player1.id);
        const player2Standing = standings.find(s => s.player.id === match.player2.id);

        if (player1Standing && player2Standing) {
            player1Standing.played++;
            player2Standing.played++;

            if (match.winner === match.player1.id) {
                player1Standing.wins++;
                player1Standing.points += 3;
                player2Standing.losses++;
            } else {
                player2Standing.wins++;
                player2Standing.points += 3;
                player1Standing.losses++;
            }
        }

        standings.sort((a, b) => b.points - a.points || b.wins - a.wins);
    }

    /**
     * Check if current round is complete
     */
    checkRoundComplete(tournament) {
        const currentRoundMatches = tournament.matches.filter(m => m.round === tournament.currentRound);
        const allCompleted = currentRoundMatches.every(m => m.status === 'completed');

        if (allCompleted) {
            const finalMatch = tournament.matches.find(m => 
                (tournament.format === 'single_elimination' && m.round === tournament.bracket.rounds.length) ||
                (tournament.format === 'round_robin' && m.round === tournament.bracket.rounds.length)
            );

            if (finalMatch && finalMatch.status === 'completed') {
                this.completeTournament(tournament);
            } else {
                tournament.currentRound++;
                eventBus.emit('roundComplete', { tournament, round: tournament.currentRound - 1 });
            }
        }
    }

    /**
     * Complete tournament
     */
    completeTournament(tournament) {
        tournament.status = 'completed';
        tournament.completedAt = Date.now();

        if (tournament.format === 'round_robin') {
            tournament.winner = tournament.bracket.standings[0] && tournament.bracket.standings[0].player || null;
        } else {
            const finalMatch = tournament.matches.find(m => m.round === tournament.bracket.rounds.length);
            tournament.winner = finalMatch && finalMatch.winner ? 
                (finalMatch.player1 && finalMatch.player1.id === finalMatch.winner ? finalMatch.player1 : finalMatch.player2) : null;
        }

        this.tournamentHistory.push({
            ...tournament,
            archivedAt: Date.now()
        });

        this.saveToStorage();
        eventBus.emit('tournamentCompleted', { tournament });
    }

    /**
     * Get tournament by ID
     */
    getTournament(tournamentId) {
        return this.activeTournaments.get(tournamentId);
    }

    /**
     * Get all active tournaments
     */
    getActiveTournaments() {
        return Array.from(this.activeTournaments.values());
    }

    /**
     * Get tournament history
     */
    getTournamentHistory() {
        return this.tournamentHistory;
    }

    /**
     * Delete tournament
     */
    deleteTournament(tournamentId) {
        this.activeTournaments.delete(tournamentId);
        this.saveToStorage();
    }

    /**
     * Shuffle array
     */
    shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Save to localStorage
     */
    saveToStorage() {
        try {
            const data = {
                activeTournaments: Array.from(this.activeTournaments.entries()),
                tournamentHistory: this.tournamentHistory
            };
            localStorage.setItem('arcadeHub_tournaments', JSON.stringify(data));
        } catch (e) {
            console.warn('[LocalTournamentManager] Save error:', e);
        }
    }

    /**
     * Load from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('arcadeHub_tournaments');
            if (saved) {
                const data = JSON.parse(saved);
                this.activeTournaments = new Map(data.activeTournaments || []);
                this.tournamentHistory = data.tournamentHistory || [];
            }
        } catch (e) {
            console.warn('[LocalTournamentManager] Load error:', e);
        }
    }
}

// Singleton
export const localTournamentManager = new LocalTournamentManager();
export default LocalTournamentManager;
