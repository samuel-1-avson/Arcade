import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';

const PARTIES_COLLECTION = 'parties';
const PARTY_MESSAGES_COLLECTION = 'partyMessages';

export interface Party {
  id: string;
  code: string;
  leaderId: string;
  leaderName: string;
  members: PartyMember[];
  memberIds: string[];
  status: 'waiting' | 'playing' | 'ended';
  gameId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartyMember {
  userId: string;
  displayName: string;
  photoURL?: string;
  isReady: boolean;
  joinedAt: Date;
}

export interface PartyMessage {
  id: string;
  partyId: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  text: string;
  timestamp: Date;
}

export const partyService = {
  // Create a new party
  createParty: async (leaderId: string, leaderName: string, leaderPhoto?: string): Promise<{ partyId: string; code: string } | null> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return null;

      // Generate random 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const now = new Date();

      const partyRef = doc(collection(db, PARTIES_COLLECTION));
      const partyId = partyRef.id;

      // NOTE: serverTimestamp() CANNOT be used inside arrays in Firestore
      // Use a regular Date for joinedAt inside the members array
      await setDoc(partyRef, {
        code,
        leaderId,
        leaderName,
        members: [{
          userId: leaderId,
          displayName: leaderName,
          photoURL: leaderPhoto || null,
          isReady: false,
          joinedAt: now,
        }],
        memberIds: [leaderId],
        status: 'waiting',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { partyId, code };
    } catch (error) {
      console.error('[Party] createParty error:', error);
      return null;
    }
  },

  // Join a party by code
  joinParty: async (code: string, userId: string, displayName: string, photoURL?: string): Promise<{ success: boolean; party?: Party; error?: string }> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return { success: false, error: 'Database not available' };

      // Find party by code
      const partiesRef = collection(db, PARTIES_COLLECTION);
      const q = query(partiesRef, where('code', '==', code.toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return { success: false, error: 'Party not found' };

      const partyDoc = snapshot.docs[0];
      const partyData = partyDoc.data();

      if (partyData.status !== 'waiting') return { success: false, error: 'Party already started' };
      if (partyData.memberIds?.includes(userId)) return { success: false, error: 'Already in party' };
      if (partyData.members?.length >= 8) return { success: false, error: 'Party is full' };

      const now = new Date();

      // Add member — use direct array manipulation instead of arrayUnion
      // because arrayUnion doesn't support serverTimestamp() inside objects
      const updatedMembers = [...(partyData.members || []), {
        userId,
        displayName,
        photoURL: photoURL || null,
        isReady: false,
        joinedAt: now,
      }];
      const updatedMemberIds = [...(partyData.memberIds || []), userId];

      await updateDoc(doc(db, PARTIES_COLLECTION, partyDoc.id), {
        members: updatedMembers,
        memberIds: updatedMemberIds,
        updatedAt: serverTimestamp(),
      });

      const party = await partyService.getParty(partyDoc.id);
      return { success: true, party: party || undefined };
    } catch (error) {
      console.error('[Party] joinParty error:', error);
      return { success: false, error: 'Failed to join party' };
    }
  },

  // Get party by ID
  getParty: async (partyId: string): Promise<Party | null> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return null;

      const partyDoc = await getDoc(doc(db, PARTIES_COLLECTION, partyId));
      if (!partyDoc.exists()) return null;

      const data = partyDoc.data();
      return {
        id: partyDoc.id,
        code: data.code,
        leaderId: data.leaderId,
        leaderName: data.leaderName,
        members: (data.members || []).map((m: any) => ({
          ...m,
          joinedAt: m.joinedAt?.toDate?.() || (m.joinedAt instanceof Date ? m.joinedAt : new Date()),
        })),
        memberIds: data.memberIds || [],
        status: data.status,
        gameId: data.gameId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };
    } catch (error) {
      console.error('[Party] getParty error:', error);
      return null;
    }
  },

  // Leave party
  leaveParty: async (partyId: string, userId: string): Promise<boolean> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return false;

      const partyRef = doc(db, PARTIES_COLLECTION, partyId);
      const partyDoc = await getDoc(partyRef);

      if (!partyDoc.exists()) return false;
      const data = partyDoc.data();

      // If leader leaves, disband party
      if (data.leaderId === userId) {
        await deleteDoc(partyRef);
        return true;
      }

      // Remove member — filter arrays instead of arrayRemove  
      // (arrayRemove requires exact object match including timestamps which fails)
      const updatedMembers = (data.members || []).filter((m: any) => m.userId !== userId);
      const updatedMemberIds = (data.memberIds || []).filter((id: string) => id !== userId);

      await updateDoc(partyRef, {
        members: updatedMembers,
        memberIds: updatedMemberIds,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('[Party] leaveParty error:', error);
      return false;
    }
  },

  // Set member ready status
  setReady: async (partyId: string, userId: string, isReady: boolean): Promise<boolean> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return false;

      const partyRef = doc(db, PARTIES_COLLECTION, partyId);
      const partyDoc = await getDoc(partyRef);

      if (!partyDoc.exists()) return false;
      const data = partyDoc.data();

      const updatedMembers = (data.members || []).map((m: any) => 
        m.userId === userId ? { ...m, isReady } : m
      );

      await updateDoc(partyRef, {
        members: updatedMembers,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('[Party] setReady error:', error);
      return false;
    }
  },

  // Start game (leader only)
  startGame: async (partyId: string, userId: string, gameId: string): Promise<boolean> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return false;

      const partyRef = doc(db, PARTIES_COLLECTION, partyId);
      const partyDoc = await getDoc(partyRef);

      if (!partyDoc.exists()) return false;
      const data = partyDoc.data();

      if (data.leaderId !== userId) return false;

      await updateDoc(partyRef, {
        status: 'playing',
        gameId,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('[Party] startGame error:', error);
      return false;
    }
  },

  // Send message to party
  sendMessage: async (partyId: string, userId: string, displayName: string, text: string, photoURL?: string): Promise<boolean> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return false;

      const messagesRef = collection(db, PARTY_MESSAGES_COLLECTION);
      await setDoc(doc(messagesRef), {
        partyId,
        userId,
        displayName,
        photoURL: photoURL || null,
        text: text.slice(0, 500),
        timestamp: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('[Party] sendMessage error:', error);
      return false;
    }
  },

  // Get party messages
  getMessages: async (partyId: string, limitCount: number = 50): Promise<PartyMessage[]> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return [];

      const messagesRef = collection(db, PARTY_MESSAGES_COLLECTION);
      const q = query(
        messagesRef,
        where('partyId', '==', partyId),
      );
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map(d => ({
          id: d.id,
          partyId: d.data().partyId,
          userId: d.data().userId,
          displayName: d.data().displayName,
          photoURL: d.data().photoURL,
          text: d.data().text,
          timestamp: d.data().timestamp?.toDate?.() || new Date(),
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(-limitCount);
    } catch (error) {
      console.error('[Party] getMessages error:', error);
      return [];
    }
  },

  // Subscribe to party updates
  subscribeToParty: (partyId: string, callback: (party: Party | null) => void): (() => void) => {
    let unsubscribe = () => {};
    
    getFirebaseDb().then(db => {
      if (!db) return;

      unsubscribe = onSnapshot(
        doc(db, PARTIES_COLLECTION, partyId),
        (docSnap) => {
          if (!docSnap.exists()) {
            callback(null);
            return;
          }

          const data = docSnap.data();
          callback({
            id: docSnap.id,
            code: data.code,
            leaderId: data.leaderId,
            leaderName: data.leaderName,
            members: (data.members || []).map((m: any) => ({
              ...m,
              joinedAt: m.joinedAt?.toDate?.() || (m.joinedAt instanceof Date ? m.joinedAt : new Date()),
            })),
            memberIds: data.memberIds || [],
            status: data.status,
            gameId: data.gameId,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          });
        },
        (error) => {
          console.error('[Party] subscribeToParty error:', error);
          callback(null);
        }
      );
    });

    return () => unsubscribe();
  },

  // Subscribe to messages
  subscribeToMessages: (partyId: string, callback: (messages: PartyMessage[]) => void): (() => void) => {
    let unsubscribe = () => {};
    
    getFirebaseDb().then(db => {
      if (!db) return;

      const messagesRef = collection(db, PARTY_MESSAGES_COLLECTION);
      const q = query(messagesRef, where('partyId', '==', partyId));

      unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const messages = snapshot.docs
            .map(d => ({
              id: d.id,
              partyId: d.data().partyId,
              userId: d.data().userId,
              displayName: d.data().displayName,
              photoURL: d.data().photoURL,
              text: d.data().text,
              timestamp: d.data().timestamp?.toDate?.() || new Date(),
            }))
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          callback(messages);
        },
        (error) => {
          console.error('[Party] subscribeToMessages error:', error);
          callback([]);
        }
      );
    });

    return () => unsubscribe();
  },

  // Kick member (leader only)
  kickMember: async (partyId: string, userId: string, leaderId?: string): Promise<boolean> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return false;

      const partyRef = doc(db, PARTIES_COLLECTION, partyId);
      const partyDoc = await getDoc(partyRef);

      if (!partyDoc.exists()) return false;
      const data = partyDoc.data();

      // Only leader can kick
      if (leaderId && data.leaderId !== leaderId) return false;

      // Remove member — filter arrays instead of arrayRemove
      const updatedMembers = (data.members || []).filter((m: any) => m.userId !== userId);
      const updatedMemberIds = (data.memberIds || []).filter((id: string) => id !== userId);

      await updateDoc(partyRef, {
        members: updatedMembers,
        memberIds: updatedMemberIds,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('[Party] kickMember error:', error);
      return false;
    }
  },

  // Invite friend to party (send as party message with invite type)
  inviteToParty: async (partyId: string, fromUserId: string, fromDisplayName: string, targetUserId: string, targetDisplayName: string): Promise<boolean> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return false;

      const messagesRef = collection(db, PARTY_MESSAGES_COLLECTION);
      await setDoc(doc(messagesRef), {
        partyId,
        userId: fromUserId,
        displayName: fromDisplayName,
        text: `🎮 Invited ${targetDisplayName} to play a game!`,
        type: 'system',
        timestamp: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('[Party] inviteToParty error:', error);
      return false;
    }
  },
};
