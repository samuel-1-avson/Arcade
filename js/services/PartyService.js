/**
 * PartyService - Global Party System
 * Manages party state and synchronization using Firebase Realtime Database
 * Supports real cross-device party rooms
 */
import { globalStateManager } from './GlobalStateManager.js';
import { notificationService } from './NotificationService.js';
import { eventBus } from '../engine/EventBus.js';

class PartyService {
    constructor() {
        this.partyId = null;
        this.isLeader = false;
        this.members = []; // { id, name, avatar, isLeader, status }
        this.initialized = false;
        
        // Firebase references
        this.db = null;
        this.partyRef = null;
        this.membersRef = null;
        this.listeners = [];
        
        // Player ID (use Firebase auth if available, otherwise generate)
        this.myPeerId = null;
    }

    async init() {
        if (this.initialized) return;

        // Initialize Firebase RTDB
        if (typeof firebase !== 'undefined' && firebase.database) {
            this.db = firebase.database();
            
            // Get or generate player ID
            if (firebase.auth().currentUser) {
                this.myPeerId = firebase.auth().currentUser.uid;
            } else {
                // Generate persistent ID for anonymous users
                this.myPeerId = localStorage.getItem('arcade_party_peer_id');
                if (!this.myPeerId) {
                    this.myPeerId = 'anon_' + Math.random().toString(36).substring(2, 11);
                    localStorage.setItem('arcade_party_peer_id', this.myPeerId);
                }
            }
            
            console.log('[PartyService] Initialized with Firebase RTDB, ID:', this.myPeerId);
        } else {
            console.warn('[PartyService] Firebase RTDB not available');
            this.myPeerId = 'local_' + Math.random().toString(36).substring(2, 11);
        }

        this.initialized = true;
    }

    // ============ ROOM CODE GENERATION ============

    generatePartyCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // ============ ACTIONS ============

    async createParty() {
        if (!this.db) {
            await this.init();
            if (!this.db) {
                notificationService.error('Party system unavailable');
                return null;
            }
        }

        // Generate unique party code
        this.partyId = this.generatePartyCode();
        this.isLeader = true;
        
        // Create party in Firebase RTDB
        this.partyRef = this.db.ref(`parties/${this.partyId}`);
        
        const playerInfo = this.getLocalPlayerInfo();
        playerInfo.isLeader = true;
        
        const partyData = {
            leader: this.myPeerId,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            status: 'open', // open, ingame, closed
            gameId: null,
            members: {
                [this.myPeerId]: playerInfo
            }
        };

        try {
            await this.partyRef.set(partyData);
            
            // Set up disconnect handler - remove self from party
            this.partyRef.child(`members/${this.myPeerId}`).onDisconnect().remove();
            
            // If leader disconnects, delete the party
            this.partyRef.onDisconnect().remove();
            
            // Set up listeners
            this.setupListeners();
            
            this.members = [playerInfo];
            this.emitStateChange();
            notificationService.success(`Party created! Code: ${this.partyId}`);
            
            return this.partyId;
        } catch (error) {
            console.error('[PartyService] Create party failed:', error);
            notificationService.error('Failed to create party');
            return null;
        }
    }

    async joinParty(code) {
        if (!code) return false;
        
        if (!this.db) {
            await this.init();
            if (!this.db) {
                notificationService.error('Party system unavailable');
                return false;
            }
        }

        const partyCode = code.toUpperCase().trim();
        this.partyRef = this.db.ref(`parties/${partyCode}`);
        
        try {
            // Check if party exists
            const snapshot = await this.partyRef.once('value');
            if (!snapshot.exists()) {
                notificationService.error('Party not found');
                return false;
            }

            const partyData = snapshot.val();
            
            if (partyData.status === 'closed') {
                notificationService.error('Party is closed');
                return false;
            }

            // Count members
            const memberCount = Object.keys(partyData.members || {}).length;
            if (memberCount >= 8) {
                notificationService.error('Party is full');
                return false;
            }

            // Add self to party
            const playerInfo = this.getLocalPlayerInfo();
            playerInfo.isLeader = false;
            
            await this.partyRef.child(`members/${this.myPeerId}`).set(playerInfo);
            
            // Set up disconnect handler
            this.partyRef.child(`members/${this.myPeerId}`).onDisconnect().remove();
            
            this.partyId = partyCode;
            this.isLeader = false;
            
            // Set up listeners
            this.setupListeners();
            
            notificationService.success('Joined party!');
            return true;
        } catch (error) {
            console.error('[PartyService] Join party failed:', error);
            notificationService.error('Failed to join party');
            return false;
        }
    }

    async leaveParty() {
        if (!this.partyId || !this.partyRef) return;

        try {
            // Remove self from members
            await this.partyRef.child(`members/${this.myPeerId}`).remove();
            
            // If leader, delete the party
            if (this.isLeader) {
                await this.partyRef.remove();
            }
        } catch (error) {
            console.error('[PartyService] Leave party error:', error);
        }

        // Clean up
        this.removeListeners();
        this.partyRef = null;
        this.partyId = null;
        this.isLeader = false;
        this.members = [];
        
        this.emitStateChange();
        notificationService.info('Left party');
    }

    // ============ FIREBASE LISTENERS ============

    setupListeners() {
        if (!this.partyRef) return;

        // Listen for member changes
        const membersRef = this.partyRef.child('members');
        const membersListener = membersRef.on('value', (snapshot) => {
            const members = snapshot.val() || {};
            this.members = Object.entries(members).map(([id, data]) => ({
                id,
                ...data
            }));
            
            // Check if we're still in the party
            const stillMember = this.members.some(m => m.id === this.myPeerId);
            if (!stillMember && this.partyId) {
                // We were kicked or party was deleted
                this.handleRemovedFromParty();
                return;
            }
            
            this.emitStateChange();
        });
        this.listeners.push({ ref: membersRef, event: 'value', callback: membersListener });

        // Listen for party status changes
        const statusRef = this.partyRef.child('status');
        const statusListener = statusRef.on('value', (snapshot) => {
            const status = snapshot.val();
            if (status === 'ingame') {
                eventBus.emit('partyGameStart', { partyId: this.partyId });
            }
        });
        this.listeners.push({ ref: statusRef, event: 'value', callback: statusListener });

        // Listen for party deletion
        this.partyRef.on('value', (snapshot) => {
            if (!snapshot.exists() && this.partyId) {
                this.handleRemovedFromParty();
            }
        });
    }

    removeListeners() {
        for (const listener of this.listeners) {
            listener.ref.off(listener.event, listener.callback);
        }
        this.listeners = [];
    }

    handleRemovedFromParty() {
        this.removeListeners();
        this.partyRef = null;
        this.partyId = null;
        this.isLeader = false;
        this.members = [];
        
        this.emitStateChange();
        notificationService.info('Party closed');
    }

    // ============ PARTY ACTIONS ============

    /**
     * Start a game for the party (leader only)
     * @param {string} gameId
     */
    async startGame(gameId) {
        if (!this.isLeader || !this.partyRef) return;

        await this.partyRef.update({
            status: 'ingame',
            gameId: gameId
        });
    }

    /**
     * Send a chat message to party
     * @param {string} message
     */
    async sendChat(message) {
        if (!this.partyRef || !message.trim()) return;

        await this.partyRef.child('chat').push({
            playerId: this.myPeerId,
            playerName: globalStateManager.getProfile().displayName,
            message: message.trim(),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    /**
     * Update player status
     * @param {string} status - 'ready', 'notready', 'ingame'
     */
    async setStatus(status) {
        if (!this.partyRef) return;

        await this.partyRef.child(`members/${this.myPeerId}/status`).set(status);
    }

    // ============ HELPERS ============

    getLocalPlayerInfo() {
        const profile = globalStateManager.getProfile();
        return {
            id: this.myPeerId,
            name: profile.displayName || 'Player',
            avatar: profile.avatar || 'gamepad',
            isLeader: this.isLeader,
            status: 'online',
            joinedAt: firebase.database?.ServerValue?.TIMESTAMP || Date.now()
        };
    }

    emitStateChange() {
        eventBus.emit('partyStateChange', {
            partyId: this.partyId,
            members: this.members,
            isLeader: this.isLeader
        });
    }

    /**
     * Get current party state
     */
    getState() {
        return {
            partyId: this.partyId,
            members: this.members,
            isLeader: this.isLeader,
            myPeerId: this.myPeerId
        };
    }

    /**
     * Check if currently in a party
     */
    isInParty() {
        return this.partyId !== null;
    }
}

export const partyService = new PartyService();
export default PartyService;
