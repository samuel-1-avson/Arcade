import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Party, PartyMember, PartyMessage } from '@/types/party';
import { partyService } from '@/lib/firebase/services/party';
import { useAuthStore } from './auth-store';

interface PartyState {
  currentParty: Party | null;
  isInParty: boolean;
  messages: PartyMessage[];
  isDrawerOpen: boolean;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  
  // Actions
  createParty: () => Promise<void>;
  joinParty: (code: string) => Promise<boolean>;
  leaveParty: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  kickMember: (userId: string) => Promise<void>;
  setDrawerOpen: (isOpen: boolean) => void;
  clearError: () => void;
}

// Unsubscribe functions for listeners
let partyUnsubscribe: (() => void) | null = null;
let messagesUnsubscribe: (() => void) | null = null;

export const usePartyStore = create<PartyState>()(
  subscribeWithSelector((set, get) => ({
    currentParty: null,
    isInParty: false,
    messages: [],
    isDrawerOpen: false,
    isLoading: false,
    error: null,
    unreadCount: 0,
    
    createParty: async () => {
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ error: 'You must be signed in to create a party' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const result = await partyService.createParty(
          user.uid,
          user.displayName || 'Player',
          user.photoURL || undefined
        );
        
        if (!result) {
          set({ error: 'Failed to create party', isLoading: false });
          return;
        }
        
        // Subscribe to party updates
        partyUnsubscribe = partyService.subscribeToParty(result.partyId, (party) => {
          if (party) {
            set({ currentParty: party, isInParty: true });
          } else {
            // Party was deleted
            get().leaveParty();
          }
        });
        
        // Subscribe to messages
        messagesUnsubscribe = partyService.subscribeToMessages(result.partyId, (messages) => {
          const wasDrawerOpen = get().isDrawerOpen;
          const prevCount = get().messages.length;
          set({ messages });
          
          // Increment unread count if drawer is closed and new messages arrived
          if (!wasDrawerOpen && messages.length > prevCount) {
            set((state) => ({ unreadCount: state.unreadCount + 1 }));
          }
        });
        
        set({ isLoading: false });
      } catch (error) {
        set({ error: 'Failed to create party', isLoading: false });
      }
    },
    
    joinParty: async (code: string) => {
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ error: 'You must be signed in to join a party' });
        return false;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const result = await partyService.joinParty(
          code,
          user.uid,
          user.displayName || 'Player',
          user.photoURL || undefined
        );
        
        if (!result.success) {
          set({ error: result.error || 'Failed to join party', isLoading: false });
          return false;
        }
        
        // Subscribe to party updates
        partyUnsubscribe = partyService.subscribeToParty(result.party!.id, (party) => {
          if (party) {
            set({ currentParty: party, isInParty: true });
          } else {
            get().leaveParty();
          }
        });
        
        // Subscribe to messages
        messagesUnsubscribe = partyService.subscribeToMessages(result.party!.id, (messages) => {
          const wasDrawerOpen = get().isDrawerOpen;
          const prevCount = get().messages.length;
          set({ messages });
          
          if (!wasDrawerOpen && messages.length > prevCount) {
            set((state) => ({ unreadCount: state.unreadCount + 1 }));
          }
        });
        
        set({ isLoading: false, unreadCount: 0 });
        return true;
      } catch (error) {
        set({ error: 'Failed to join party', isLoading: false });
        return false;
      }
    },
    
    leaveParty: async () => {
      const { currentParty } = get();
      const user = useAuthStore.getState().user;
      
      // Unsubscribe from listeners
      if (partyUnsubscribe) {
        partyUnsubscribe();
        partyUnsubscribe = null;
      }
      if (messagesUnsubscribe) {
        messagesUnsubscribe();
        messagesUnsubscribe = null;
      }
      
      if (currentParty && user) {
        await partyService.leaveParty(currentParty.id, user.uid);
      }
      
      set({ 
        currentParty: null, 
        isInParty: false, 
        messages: [],
        unreadCount: 0,
        error: null 
      });
    },
    
    sendMessage: async (text: string) => {
      const { currentParty } = get();
      const user = useAuthStore.getState().user;
      
      if (!currentParty || !user) return;
      
      try {
        await partyService.sendMessage(
          currentParty.id,
          user.uid,
          user.displayName || 'Player',
          text,
          user.photoURL || undefined
        );
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    
    setReady: async (ready: boolean) => {
      const { currentParty } = get();
      const user = useAuthStore.getState().user;
      
      if (!currentParty || !user) return;
      
      try {
        await partyService.setReady(currentParty.id, user.uid, ready);
      } catch (error) {
        console.error('Failed to set ready status:', error);
      }
    },
    
    kickMember: async (userId: string) => {
      const { currentParty } = get();
      const user = useAuthStore.getState().user;
      if (!currentParty || !user) return;
      
      try {
        await partyService.kickMember(currentParty.id, userId, user.uid);
      } catch (error) {
        console.error('Failed to kick member:', error);
      }
    },
    
    setDrawerOpen: (isOpen: boolean) => {
      set({ isDrawerOpen: isOpen });
      if (isOpen) {
        set({ unreadCount: 0 });
      }
    },
    
    clearError: () => set({ error: null }),
  }))
);
