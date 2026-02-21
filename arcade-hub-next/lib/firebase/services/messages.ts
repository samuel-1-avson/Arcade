import { 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  limit,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  participantPhotos?: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

export const messagesService = {
  // Get or create a conversation between two users
  getOrCreateConversation: async (userId1: string, userId2: string): Promise<string | null> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return null;

      // Check for existing conversation
      const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId1)
      );
      const snapshot = await getDocs(q);
      
      const existingConv = snapshot.docs.find(doc => {
        const participants = doc.data().participants as string[];
        return participants.includes(userId2);
      });

      if (existingConv) {
        return existingConv.id;
      }

      // Get user details
      let user1Name = 'Anonymous';
      let user2Name = 'Anonymous';
      let user1Photo = '';
      let user2Photo = '';
      
      try {
        const [user1Doc, user2Doc] = await Promise.all([
          getDoc(doc(db, 'users', userId1)),
          getDoc(doc(db, 'users', userId2))
        ]);
        
        if (user1Doc.exists()) {
          user1Name = user1Doc.data().displayName || 'Anonymous';
          user1Photo = user1Doc.data().photoURL || '';
        }
        if (user2Doc.exists()) {
          user2Name = user2Doc.data().displayName || 'Anonymous';
          user2Photo = user2Doc.data().photoURL || '';
        }
      } catch (e) {
        // Use defaults
      }

      // Create new conversation
      const newConvRef = await addDoc(conversationsRef, {
        participants: [userId1, userId2],
        participantNames: [user1Name, user2Name],
        participantPhotos: [user1Photo, user2Photo],
        unreadCount: { [userId1]: 0, [userId2]: 0 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return newConvRef.id;
    } catch (error) {
      return null;
    }
  },

  // Get user's conversations
  getConversations: async (userId: string): Promise<Conversation[]> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return [];

      const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        participants: doc.data().participants,
        participantNames: doc.data().participantNames,
        participantPhotos: doc.data().participantPhotos,
        lastMessage: doc.data().lastMessage,
        lastMessageTime: doc.data().lastMessageTime?.toDate(),
        unreadCount: doc.data().unreadCount || {},
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));
    } catch (error) {
      return [];
    }
  },

  // Send a message
  sendMessage: async (
    conversationId: string, 
    senderId: string, 
    text: string
  ): Promise<boolean> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return false;

      // Get sender details
      let senderName = 'Anonymous';
      let senderPhoto = null;
      
      try {
        const senderDoc = await getDoc(doc(db, 'users', senderId));
        if (senderDoc.exists()) {
          senderName = senderDoc.data().displayName || 'Anonymous';
          senderPhoto = senderDoc.data().photoURL || null;
        }
      } catch (e) {
        // Use defaults
      }

      // Get conversation to find other participant
      const convDoc = await getDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId));
      if (!convDoc.exists()) return false;
      
      const convData = convDoc.data();
      const otherParticipantId = convData.participants.find((id: string) => id !== senderId);

      // Add message
      await addDoc(collection(db, MESSAGES_COLLECTION), {
        conversationId,
        senderId,
        senderName,
        senderPhoto,
        text: text.slice(0, 1000), // Limit message length
        timestamp: serverTimestamp(),
        read: false,
      });

      // Update conversation
      const currentUnread = convData.unreadCount || {};
      await updateDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId), {
        lastMessage: text.slice(0, 100),
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`unreadCount.${otherParticipantId}`]: (currentUnread[otherParticipantId] || 0) + 1,
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string, limitCount: number = 50): Promise<Message[]> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return [];

      const messagesRef = collection(db, MESSAGES_COLLECTION);
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          conversationId: doc.data().conversationId,
          senderId: doc.data().senderId,
          senderName: doc.data().senderName,
          senderPhoto: doc.data().senderPhoto,
          text: doc.data().text,
          timestamp: doc.data().timestamp?.toDate() || new Date(),
          read: doc.data().read || false,
        }))
        .reverse();
    } catch (error) {
      console.error('[Messages] getMessages error:', error);
      return [];
    }
  },

  // Mark messages as read
  markAsRead: async (conversationId: string, userId: string): Promise<void> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return;

      // Update unread count in conversation
      await updateDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId), {
        [`unreadCount.${userId}`]: 0,
      });

      // Mark unread messages as read (only those NOT sent by current user)
      // Avoid using != filter which requires complex composite indexes
      const messagesRef = collection(db, MESSAGES_COLLECTION);
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);

      // Filter in code: only mark messages from OTHER users as read
      const updates = snapshot.docs
        .filter(docSnap => docSnap.data().senderId !== userId)
        .map(docSnap => 
          updateDoc(doc(db, MESSAGES_COLLECTION, docSnap.id), { read: true })
        );
      await Promise.all(updates);
    } catch (error) {
      // Silently handle - marking as read is non-critical
      console.warn('[Messages] markAsRead error:', error);
    }
  },

  // Subscribe to messages in a conversation
  subscribeToMessages: (
    conversationId: string, 
    callback: (messages: Message[]) => void
  ): (() => void) => {
    let unsubscribe = () => {};
    
    getFirebaseDb().then(db => {
      if (!db) return;

      const messagesRef = collection(db, MESSAGES_COLLECTION);
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          conversationId: doc.data().conversationId,
          senderId: doc.data().senderId,
          senderName: doc.data().senderName,
          senderPhoto: doc.data().senderPhoto,
          text: doc.data().text,
          timestamp: doc.data().timestamp?.toDate() || new Date(),
          read: doc.data().read || false,
        }));
        callback(messages);
      });
    });

    return () => unsubscribe();
  },

  // Subscribe to user's conversations
  subscribeToConversations: (
    userId: string, 
    callback: (conversations: Conversation[]) => void
  ): (() => void) => {
    let unsubscribe = () => {};
    
    getFirebaseDb().then(db => {
      if (!db) return;

      const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const conversations = snapshot.docs.map(doc => ({
          id: doc.id,
          participants: doc.data().participants,
          participantNames: doc.data().participantNames,
          participantPhotos: doc.data().participantPhotos,
          lastMessage: doc.data().lastMessage,
          lastMessageTime: doc.data().lastMessageTime?.toDate(),
          unreadCount: doc.data().unreadCount || {},
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }));
        callback(conversations);
      });
    });

    return () => unsubscribe();
  },
};
