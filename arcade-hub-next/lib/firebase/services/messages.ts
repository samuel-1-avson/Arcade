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
    const [user1Doc, user2Doc] = await Promise.all([
      getDoc(doc(db, 'users', userId1)),
      getDoc(doc(db, 'users', userId2))
    ]);

    const user1Data = user1Doc.exists() ? user1Doc.data() : {};
    const user2Data = user2Doc.exists() ? user2Doc.data() : {};

    // Create new conversation
    const newConvRef = await addDoc(conversationsRef, {
      participants: [userId1, userId2],
      participantNames: [
        user1Data.displayName || 'Anonymous',
        user2Data.displayName || 'Anonymous'
      ],
      participantPhotos: [
        user1Data.photoURL || '',
        user2Data.photoURL || ''
      ],
      unreadCount: { [userId1]: 0, [userId2]: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newConvRef.id;
  },

  // Get user's conversations
  getConversations: async (userId: string): Promise<Conversation[]> => {
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
  },

  // Send a message
  sendMessage: async (
    conversationId: string, 
    senderId: string, 
    text: string
  ): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    // Get sender details
    const senderDoc = await getDoc(doc(db, 'users', senderId));
    const senderData = senderDoc.exists() ? senderDoc.data() : {};

    // Get conversation to find other participant
    const convDoc = await getDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId));
    if (!convDoc.exists()) return false;
    
    const convData = convDoc.data();
    const otherParticipantId = convData.participants.find((id: string) => id !== senderId);

    // Add message
    await addDoc(collection(db, MESSAGES_COLLECTION), {
      conversationId,
      senderId,
      senderName: senderData.displayName || 'Anonymous',
      senderPhoto: senderData.photoURL || null,
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
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string, limitCount: number = 50): Promise<Message[]> => {
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
  },

  // Mark messages as read
  markAsRead: async (conversationId: string, userId: string): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) return;

    // Update unread count in conversation
    await updateDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId), {
      [`unreadCount.${userId}`]: 0,
    });

    // Mark all messages as read
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);

    const updates = snapshot.docs.map(docSnap => 
      updateDoc(doc(db, MESSAGES_COLLECTION, docSnap.id), { read: true })
    );
    await Promise.all(updates);
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
