/**
 * TournamentPanel - Tournament UI Component
 * Handles tournament listing, creation, joining, and bracket display
 */

import { tournamentService } from '../services/TournamentService.js';
import { eventBus } from '../engine/EventBus.js';
import { globalStateManager } from '../services/GlobalStateManager.js';
import { notificationService } from '../services/NotificationService.js';
import { GAME_REGISTRY, GAME_IDS } from '../config/gameRegistry.js';

/**
 * TournamentPanel manages tournament UI interactions
 */
class TournamentPanel {
    constructor(arcadeHub) {
        this.hub = arcadeHub;
        this.bracketModal = null;
    }

    /**
     * Initialize tournament panel
     */
    setup() {
        this.setupTournamentsTab();
        this.setupCreateForm();
        this.setupEventListeners();
        this.renderTournaments();
    }

    /**
     * Set up tournaments tab
     */
    setupTournamentsTab() {
        const tabs = document.querySelectorAll('.tournament-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderTournaments(tab.dataset.status);
            });
        });
    }

    /**
     * Set up tournament creation form
     */
    setupCreateForm() {
        const form = document.getElementById('create-tournament-form');
        const gameSelect = document.getElementById('tournament-game');
        
        // Populate game select
        if (gameSelect) {
            gameSelect.innerHTML = GAME_IDS.map(id => {
                const game = GAME_REGISTRY[id];
                return `<option value="${id}">${game.name}</option>`;
            }).join('');
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const data = new FormData(form);
                const tournamentData = {
                    name: data.get('name'),
                    gameId: data.get('game'),
                    maxPlayers: parseInt(data.get('players')),
                    isPublic: data.get('visibility') === 'public'
                };

                try {
                    await tournamentService.createTournament(tournamentData);
                    notificationService.showToast('Tournament created!', 'success');
                    form.reset();
                    this.renderTournaments();
                } catch (e) {
                    console.error('Failed to create tournament:', e);
                    notificationService.showToast('Failed to create tournament', 'error');
                }
            });
        }
    }

    /**
     * Render tournaments list
     */
    renderTournaments(status = 'all') {
        const container = document.getElementById('tournaments-list');
        if (!container) return;

        const tournaments = tournamentService.getTournaments(status);
        const currentUserId = globalStateManager.getProfile().id;

        if (tournaments.length === 0) {
            container.innerHTML = '<p class="empty-state">No tournaments found</p>';
            return;
        }

        container.innerHTML = tournaments.map(t => `
            <div class="tournament-card ${t.status}" data-tournament-id="${t.id}">
                <div class="tournament-header">
                    <h3 class="tournament-name">${this.escapeHtml(t.name)}</h3>
                    <span class="tournament-status ${t.status}">${t.status}</span>
                </div>
                <div class="tournament-info">
                    <span class="tournament-game">${GAME_REGISTRY[t.gameId]?.name || t.gameId}</span>
                    <span class="tournament-players">
                        ${t.participants?.length || 0}/${t.maxPlayers} players
                    </span>
                </div>
                <div class="tournament-actions">
                    ${this.getTournamentActions(t, currentUserId)}
                </div>
            </div>
        `).join('');

        // Add action handlers
        this.attachActionHandlers(container);
    }

    /**
     * Get action buttons for tournament
     */
    getTournamentActions(tournament, currentUserId) {
        const isParticipant = tournament.participants?.some(p => p.id === currentUserId);
        const isCreator = tournament.creatorId === currentUserId;

        if (tournament.status === 'open') {
            if (isParticipant) {
                return `<button class="btn-leave" data-id="${tournament.id}">Leave</button>`;
            }
            return `<button class="btn-join" data-id="${tournament.id}">Join</button>`;
        }

        if (tournament.status === 'active') {
            return `<button class="btn-bracket" data-id="${tournament.id}">View Bracket</button>`;
        }

        return `<button class="btn-bracket" data-id="${tournament.id}">View Results</button>`;
    }

    /**
     * Attach action handlers
     */
    attachActionHandlers(container) {
        container.querySelectorAll('.btn-join').forEach(btn => {
            btn.addEventListener('click', () => this.joinTournament(btn.dataset.id));
        });

        container.querySelectorAll('.btn-leave').forEach(btn => {
            btn.addEventListener('click', () => this.leaveTournament(btn.dataset.id));
        });

        container.querySelectorAll('.btn-bracket').forEach(btn => {
            btn.addEventListener('click', () => this.openBracketModal(btn.dataset.id));
        });
    }

    /**
     * Join a tournament
     */
    async joinTournament(tournamentId) {
        try {
            await tournamentService.joinTournament(tournamentId);
            notificationService.showToast('Joined tournament!', 'success');
            this.renderTournaments();
        } catch (e) {
            console.error('Failed to join:', e);
            notificationService.showToast('Failed to join tournament', 'error');
        }
    }

    /**
     * Leave a tournament
     */
    async leaveTournament(tournamentId) {
        try {
            await tournamentService.leaveTournament(tournamentId);
            this.renderTournaments();
        } catch (e) {
            console.error('Failed to leave:', e);
        }
    }

    /**
     * Open bracket modal
     */
    openBracketModal(tournamentId) {
        const modal = document.getElementById('bracket-modal');
        if (!modal) return;

        const tournament = tournamentService.getTournament(tournamentId);
        if (!tournament) return;

        modal.classList.add('open');
        this.renderBracket(tournament);

        // Close handler
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('open');
        }
    }

    /**
     * Render tournament bracket
     */
    renderBracket(tournament) {
        const container = document.getElementById('bracket-container');
        if (!container) return;

        const bracket = tournament.bracket || [];

        if (bracket.length === 0) {
            container.innerHTML = '<p class="empty-state">Bracket not yet generated</p>';
            return;
        }

        container.innerHTML = bracket.map((round, roundIndex) => `
            <div class="bracket-round">
                <h4>Round ${roundIndex + 1}</h4>
                ${round.map(match => this.renderMatch(match, tournament)).join('')}
            </div>
        `).join('');
    }

    /**
     * Render a single match
     */
    renderMatch(match, tournament) {
        const player1 = match.player1 || { name: 'TBD' };
        const player2 = match.player2 || { name: 'TBD' };
        const winner = match.winner;

        return `
            <div class="bracket-match ${match.status}">
                <div class="match-player ${winner === player1.id ? 'winner' : ''}">
                    ${this.escapeHtml(player1.name)}
                    ${match.scores ? `<span class="score">${match.scores.player1 || 0}</span>` : ''}
                </div>
                <div class="match-vs">vs</div>
                <div class="match-player ${winner === player2.id ? 'winner' : ''}">
                    ${this.escapeHtml(player2.name)}
                    ${match.scores ? `<span class="score">${match.scores.player2 || 0}</span>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        eventBus.on('tournamentUpdated', () => {
            this.renderTournaments();
        });
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

export { TournamentPanel };
export default TournamentPanel;
