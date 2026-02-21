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
  arrayUnion,
  arrayRemove
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
    const db = await getFirebaseDb();
    if (!db) return null;

    // Generate random 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const partyRef = doc(collection(db, PARTIES_COLLECTION));
    const partyId = partyRef.id;

    await setDoc(partyRef, {
      code,
      leaderId,
      leaderName,
      members: [{
        userId: leaderId,
        displayName: leaderName,
        photoURL: leaderPhoto,
        isReady: false,
        joinedAt: serverTimestamp(),
      }],
      memberIds: [leaderId],
      status: 'waiting',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { partyId, code };
  },

  // Join a party by code
  joinParty: async (code: string, userId: string, displayName: string, photoURL?: string): Promise<{ success: boolean; party?: Party; error?: string }> => {
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
    if (partyData.memberIds.includes(userId)) return { success: false, error: 'Already in party' };
    if (partyData.members.length >= 8) return { success: false, error: 'Party is full' };

    // Add member
    await updateDoc(doc(db, PARTIES_COLLECTION, partyDoc.id), {
      members: arrayUnion({
        userId,
        displayName,
        photoURL,
        isReady: false,
        joinedAt: serverTimestamp(),
      }),
      memberIds: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });

    const party = await partyService.getParty(partyDoc.id);
    return { success: true, party: party || undefined };
  },

  // Get party by ID
  getParty: async (partyId: string): Promise<Party | null> => {
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
      members: data.members.map((m: any) => ({
        ...m,
        joinedAt: m.joinedAt?.toDate() || new Date(),
      })),
      memberIds: data.memberIds,
      status: data.status,
      gameId: data.gameId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },

  // Leave party
  leaveParty: async (partyId: string, userId: string): Promise<boolean> => {
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

    // Remove member
    const member = data.members.find((m: any) => m.userId === userId);
    if (member) {
      await updateDoc(partyRef, {
        members: arrayRemove(member),
        memberIds: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });
    }

    return true;
  },

  // Set member ready status
  setReady: async (partyId: string, userId: string, isReady: boolean): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    const partyRef = doc(db, PARTIES_COLLECTION, partyId);
    const partyDoc = await getDoc(partyRef);

    if (!partyDoc.exists()) return false;
    const data = partyDoc.data();

    const updatedMembers = data.members.map((m: any) => 
      m.userId === userId ? { ...m, isReady } : m
    );

    await updateDoc(partyRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });

    return true;
  },

  // Start game (leader only)
  startGame: async (partyId: string, userId: string, gameId: string): Promise<boolean> => {
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
  },

  // Send message to party
  sendMessage: async (partyId: string, userId: string, displayName: string, text: string, photoURL?: string): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    // Verify user is in party
    const party = await partyService.getParty(partyId);
    if (!party || !party.memberIds.includes(userId)) return false;

    const messagesRef = collection(db, PARTY_MESSAGES_COLLECTION);
    await setDoc(doc(messagesRef), {
      partyId,
      userId,
      displayName,
      photoURL,
      text: text.slice(0, 500), // Limit message length
      timestamp: serverTimestamp(),
    });

    return true;
  },

  // Get party messages
  getMessages: async (partyId: string, limitCount: number = 50): Promise<PartyMessage[]> => {
    const db = await getFirebaseDb();
    if (!db) return [];

    const messagesRef = collection(db, PARTY_MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('partyId', '==', partyId),
      // Note: Would need index for orderBy + where
    );
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        partyId: doc.data().partyId,
        userId: doc.data().userId,
        displayName: doc.data().displayName,
        photoURL: doc.data().photoURL,
        text: doc.data().text,
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-limitCount);
  },

  // Subscribe to party updates
  subscribeToParty: (partyId: string, callback: (party: Party | null) => void): (() => void) => {
    let unsubscribe = () => {};
    
    getFirebaseDb().then(db => {
      if (!db) return;

      unsubscribe = onSnapshot(
        doc(db, PARTIES_COLLECTION, partyId),
        (doc) => {
          if (!doc.exists()) {
            callback(null);
            return;
          }

          const data = doc.data();
          callback({
            id: doc.id,
            code: data.code,
            leaderId: data.leaderId,
            leaderName: data.leaderName,
            members: data.members.map((m: any) => ({
              ...m,
              joinedAt: m.joinedAt?.toDate() || new Date(),
            })),
            memberIds: data.memberIds,
            status: data.status,
            gameId: data.gameId,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
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

      unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs
          .map(doc => ({
            id: doc.id,
            partyId: doc.data().partyId,
            userId: doc.data().userId,
            displayName: doc.data().displayName,
            photoURL: doc.data().photoURL,
            text: doc.data().text,
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          }))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        callback(messages);
      });
    });

    return () => unsubscribe();
  },
};
