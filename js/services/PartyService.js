/**
 * PartyService - Global Party System
 * Manages party state and synchronization across tabs using BroadcastChannel
 * Mocking a real backend for now
 */
import { globalStateManager } from './GlobalStateManager.js';
import { notificationService } from './NotificationService.js';
import { eventBus } from '../engine/EventBus.js';

class PartyService {
    constructor() {
        this.partyId = null;
        this.isLeader = false;
        this.members = []; // { id, name, avatar, isLeader, status }
        this.channel = new BroadcastChannel('arcade_party_sync');
        this.initialized = false;
        
        // Mock ID generation
        this.myPeerId = 'player_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        if (this.initialized) return;

        // Listen for messages from other tabs
        this.channel.onmessage = (event) => this.handleMessage(event.data);

        // Periodically broadcast presence if in party
        setInterval(() => {
            if (this.partyId) {
                this.broadcast({
                    type: 'HEARTBEAT',
                    player: this.getLocalPlayerInfo()
                });
            }
        }, 3000);

        this.initialized = true;
        console.log('PartyService initialized', this.myPeerId);
    }

    // ============ ACTIONS ============

    createParty() {
        this.partyId = Math.random().toString(36).substr(2, 6).toUpperCase();
        this.isLeader = true;
        this.members = [this.getLocalPlayerInfo()];
        
        this.emitStateChange();
        notificationService.success(`Party created! Code: ${this.partyId}`);
        return this.partyId;
    }

    joinParty(code) {
        if (!code) return;
        
        // In a real network, we'd query the server. 
        // Here, we broadcast a JOIN_REQUEST and hope a leader responds.
        this.broadcast({
            type: 'JOIN_REQUEST',
            partyId: code,
            player: this.getLocalPlayerInfo()
        });
        
        // Optimistically set ID for now, but wait for sync to confirm
        this.pendingPartyId = code;
        notificationService.info('Joining party...');
    }

    leaveParty() {
        if (!this.partyId) return;

        this.broadcast({
            type: 'PLAYER_LEFT',
            partyId: this.partyId,
            playerId: this.myPeerId
        });

        this.partyId = null;
        this.isLeader = false;
        this.members = [];
        this.emitStateChange();
        notificationService.info('Left party');
    }

    // ============ NETWORK HANDLING (MOCK) ============

    handleMessage(data) {
        // Ignore messages if not relevant
        if (!data || !data.type) return;

        const { type, partyId, player } = data;

        // 1. Join Request (Handled by Leader)
        if (type === 'JOIN_REQUEST' && this.isLeader && this.partyId === partyId) {
            // Add member
            if (!this.members.find(m => m.id === player.id)) {
                this.members.push({ ...player, isLeader: false, status: 'ready' });
                this.emitStateChange();
                notificationService.success(`${player.name} joined the party!`);
                
                // Send full state back to new joiner
                this.broadcastPartyState();
            }
        }

        // 2. Party State Update (Handled by Members)
        if (type === 'PARTY_STATE' && data.partyId === (this.partyId || this.pendingPartyId)) {
            // Accept the state
            this.partyId = data.partyId;
            this.members = data.members;
            
            // If I was pending, I am now joined
            if (this.pendingPartyId === data.partyId) {
                this.pendingPartyId = null;
                this.isLeader = false;
                notificationService.success('Joined party successfully!');
            }
            
            this.emitStateChange();
        }

        // 3. Player Left
        if (type === 'PLAYER_LEFT' && this.partyId === partyId) {
            this.members = this.members.filter(m => m.id !== data.playerId);
            this.emitStateChange();
            if (this.isLeader) {
                this.broadcastPartyState(); // Sync removal to others
            }
        }
    }

    broadcastPartyState() {
        this.broadcast({
            type: 'PARTY_STATE',
            partyId: this.partyId,
            members: this.members
        });
    }

    broadcast(data) {
        this.channel.postMessage(data);
    }

    // ============ HELPERS ============

    getLocalPlayerInfo() {
        const profile = globalStateManager.getProfile();
        return {
            id: this.myPeerId,
            name: profile.displayName,
            avatar: profile.avatar,
            isLeader: this.isLeader,
            status: 'online'
        };
    }

    emitStateChange() {
        eventBus.emit('partyStateChange', {
            partyId: this.partyId,
            members: this.members,
            isLeader: this.isLeader
        });
    }
}

export const partyService = new PartyService();
export default PartyService;
