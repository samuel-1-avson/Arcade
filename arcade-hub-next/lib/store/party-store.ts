import { create } from 'zustand';
import { Party, PartyMember, PartyMessage } from '@/types/party';

interface PartyState {
  currentParty: Party | null;
  isInParty: boolean;
  messages: PartyMessage[];
  isDrawerOpen: boolean;
  
  // Actions
  createParty: () => Promise<void>;
  joinParty: (code: string) => Promise<void>;
  leaveParty: () => void;
  sendMessage: (text: string) => void;
  addMember: (member: PartyMember) => void;
  removeMember: (userId: string) => void;
  setDrawerOpen: (isOpen: boolean) => void;
}

export const usePartyStore = create<PartyState>()((set, get) => ({
  currentParty: null,
  isInParty: false,
  messages: [],
  isDrawerOpen: false,
  
  createParty: async () => {
    // Generate random code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create party (will integrate with Firebase later)
    const newParty: Party = {
      id: crypto.randomUUID(),
      code,
      hostId: 'current-user',
      members: [],
      status: 'waiting',
      createdAt: new Date(),
    };
    
    set({ currentParty: newParty, isInParty: true });
  },
  
  joinParty: async (code) => {
    // Will integrate with Firebase
    // Joining party - TODO: implement with Firebase
  },
  
  leaveParty: () => {
    set({ currentParty: null, isInParty: false, messages: [] });
  },
  
  sendMessage: (text) => {
    const { currentParty } = get();
    if (!currentParty) return;
    
    const newMessage: PartyMessage = {
      id: crypto.randomUUID(),
      userId: 'current-user',
      displayName: 'You',
      text,
      timestamp: new Date(),
    };
    
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },
  
  addMember: (member) => {
    set((state) => ({
      currentParty: state.currentParty
        ? { ...state.currentParty, members: [...state.currentParty.members, member] }
        : null,
    }));
  },
  
  removeMember: (userId) => {
    set((state) => ({
      currentParty: state.currentParty
        ? { ...state.currentParty, members: state.currentParty.members.filter((m) => m.userId !== userId) }
        : null,
    }));
  },
  
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
}));
