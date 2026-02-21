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
  serverTimestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "../config";

const FRIENDS_COLLECTION = "friends";
const FRIEND_REQUESTS_COLLECTION = "friendRequests";
const PRESENCE_COLLECTION = "presence";

export interface Friend {
  id: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  level: number;
  isOnline: boolean;
  lastSeen: Date;
  currentGame?: string;
  friendshipId: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

export interface UserPresence {
  userId: string;
  displayName: string;
  photoURL?: string;
  online: boolean;
  lastSeen: Date;
  currentGame?: string;
  lastChanged: Date;
}

export const friendsService = {
  // Send a friend request
  sendFriendRequest: async (
    fromUserId: string,
    toUserId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return { success: false, error: "Database not available" };
      if (fromUserId === toUserId)
        return { success: false, error: "Cannot friend yourself" };

      // Check if already friends (from localStorage fallback)
      const localKey = `friends_${fromUserId}`;
      const localData =
        typeof window !== "undefined" ? localStorage.getItem(localKey) : null;
      const localFriends = localData ? JSON.parse(localData) : [];
      if (localFriends.some((f: any) => f.id === toUserId)) {
        return { success: false, error: "Already friends" };
      }

      // Check for existing request
      try {
        const requestsRef = collection(db, FRIEND_REQUESTS_COLLECTION);
        // Check both directions separately (Firestore doesn't support multiple 'in' filters)
        const [q1Result, q2Result] = await Promise.all([
          getDocs(
            query(
              requestsRef,
              where("fromUserId", "==", fromUserId),
              where("toUserId", "==", toUserId),
              where("status", "==", "pending"),
            ),
          ),
          getDocs(
            query(
              requestsRef,
              where("fromUserId", "==", toUserId),
              where("toUserId", "==", fromUserId),
              where("status", "==", "pending"),
            ),
          ),
        ]);
        if (!q1Result.empty || !q2Result.empty)
          return { success: false, error: "Request already pending" };
      } catch (e) {
        // Continue without duplicate check if query fails
      }

      // Get sender info
      let senderName = "Anonymous";
      let senderPhoto = null;

      try {
        const senderDoc = await getDoc(doc(db, "users", fromUserId));
        const senderData = senderDoc.exists() ? senderDoc.data() : {};
        senderName = senderData.displayName || "Anonymous";
        senderPhoto = senderData.photoURL || null;
      } catch (e) {
        // Use defaults
      }

      // Create request
      const requestRef = doc(collection(db, FRIEND_REQUESTS_COLLECTION));
      await setDoc(requestRef, {
        fromUserId,
        fromUserName: senderName,
        fromUserPhoto: senderPhoto,
        toUserId,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to send request" };
    }
  },

  // Accept a friend request
  acceptFriendRequest: async (
    requestId: string,
    userId: string,
  ): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) return false;
    const data = requestSnap.data();
    if (data.toUserId !== userId) return false;

    // Update request status
    await updateDoc(requestRef, { status: "accepted" });

    // Create friendship document (store twice for easy querying)
    const friendshipId = `${data.fromUserId}_${data.toUserId}`;
    await setDoc(doc(db, FRIENDS_COLLECTION, friendshipId), {
      user1Id: data.fromUserId,
      user2Id: data.toUserId,
      createdAt: serverTimestamp(),
    });

    return true;
  },

  // Reject a friend request
  rejectFriendRequest: async (
    requestId: string,
    userId: string,
  ): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) return false;
    const data = requestSnap.data();
    if (data.toUserId !== userId) return false;

    await updateDoc(requestRef, { status: "rejected" });
    return true;
  },

  // Get friends list
  getFriends: async (userId: string): Promise<Friend[]> => {
    try {
      const db = await getFirebaseDb();

      // Try localStorage fallback
      const localKey = `friends_${userId}`;
      const localData =
        typeof window !== "undefined" ? localStorage.getItem(localKey) : null;

      if (!db) {
        return localData ? JSON.parse(localData) : [];
      }

      // Query friendships where user is either user1 or user2
      const friendsRef = collection(db, FRIENDS_COLLECTION);
      const [q1, q2] = await Promise.all([
        getDocs(query(friendsRef, where("user1Id", "==", userId))),
        getDocs(query(friendsRef, where("user2Id", "==", userId))),
      ]);

      const friendIds: string[] = [];
      const friendshipMap = new Map();

      q1.docs.forEach((d) => {
        friendIds.push(d.data().user2Id);
        friendshipMap.set(d.data().user2Id, d.id);
      });
      q2.docs.forEach((d) => {
        friendIds.push(d.data().user1Id);
        friendshipMap.set(d.data().user1Id, d.id);
      });

      // Get friend details and presence
      const friends: Friend[] = [];
      for (const friendId of friendIds) {
        try {
          const [userDoc, presenceDoc] = await Promise.all([
            getDoc(doc(db, "users", friendId)),
            getDoc(doc(db, PRESENCE_COLLECTION, friendId)),
          ]);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const presenceData = presenceDoc.exists() ? presenceDoc.data() : {};

            friends.push({
              id: friendId,
              userId: friendId,
              displayName: userData.displayName || "Anonymous",
              photoURL: userData.photoURL,
              level: userData.level || 1,
              isOnline: presenceData.online || false,
              lastSeen: presenceData.lastSeen?.toDate() || new Date(),
              currentGame: presenceData.currentGame,
              friendshipId: friendshipMap.get(friendId) || "",
            });
          }
        } catch (e) {
          // Skip this friend if error
        }
      }

      // Cache to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(localKey, JSON.stringify(friends));
      }

      return friends.sort(
        (a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0),
      );
    } catch (error) {
      // Fallback to localStorage
      const localKey = `friends_${userId}`;
      const localData =
        typeof window !== "undefined" ? localStorage.getItem(localKey) : null;
      return localData ? JSON.parse(localData) : [];
    }
  },

  // Get pending friend requests
  getPendingRequests: async (userId: string): Promise<FriendRequest[]> => {
    try {
      const db = await getFirebaseDb();

      // Try localStorage fallback
      const localKey = `friendRequests_${userId}`;
      const localData =
        typeof window !== "undefined" ? localStorage.getItem(localKey) : null;

      if (!db) {
        return localData ? JSON.parse(localData) : [];
      }

      const requestsRef = collection(db, FRIEND_REQUESTS_COLLECTION);
      const q = query(
        requestsRef,
        where("toUserId", "==", userId),
        where("status", "==", "pending"),
      );
      const snapshot = await getDocs(q);

      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        fromUserId: doc.data().fromUserId,
        fromUserName: doc.data().fromUserName,
        fromUserPhoto: doc.data().fromUserPhoto,
        toUserId: doc.data().toUserId,
        status: doc.data().status,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      // Cache to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(localKey, JSON.stringify(requests));
      }

      return requests;
    } catch (error) {
      // Fallback to localStorage
      const localKey = `friendRequests_${userId}`;
      const localData =
        typeof window !== "undefined" ? localStorage.getItem(localKey) : null;
      return localData ? JSON.parse(localData) : [];
    }
  },

  // Check if two users are friends
  areFriends: async (userId1: string, userId2: string): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    const friendshipId1 = `${userId1}_${userId2}`;
    const friendshipId2 = `${userId2}_${userId1}`;

    const [doc1, doc2] = await Promise.all([
      getDoc(doc(db, FRIENDS_COLLECTION, friendshipId1)),
      getDoc(doc(db, FRIENDS_COLLECTION, friendshipId2)),
    ]);

    return doc1.exists() || doc2.exists();
  },

  // Remove a friend
  removeFriend: async (friendshipId: string): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    await deleteDoc(doc(db, FRIENDS_COLLECTION, friendshipId));
    return true;
  },

  // Update user presence
  updatePresence: async (
    userId: string,
    online: boolean,
    currentGame?: string,
  ): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) return;

    const presenceRef = doc(db, PRESENCE_COLLECTION, userId);
    await setDoc(
      presenceRef,
      {
        online,
        lastSeen: serverTimestamp(),
        currentGame: currentGame || null,
        lastChanged: serverTimestamp(),
      },
      { merge: true },
    );
  },

  // Get online users
  getOnlineUsers: async (): Promise<UserPresence[]> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return [];

      const presenceRef = collection(db, PRESENCE_COLLECTION);
      const q = query(presenceRef, where("online", "==", true));
      const snapshot = await getDocs(q);

      // Fetch user details for each online user
      const onlineUsers: UserPresence[] = [];
      for (const docSnap of snapshot.docs) {
        try {
          const data = docSnap.data();
          const userDoc = await getDoc(doc(db, "users", docSnap.id));
          const userData = userDoc.exists() ? userDoc.data() : {};

          onlineUsers.push({
            userId: docSnap.id,
            displayName: userData.displayName || "Anonymous",
            photoURL: userData.photoURL,
            online: data.online,
            lastSeen: data.lastSeen?.toDate() || new Date(),
            currentGame: data.currentGame,
            lastChanged: data.lastChanged?.toDate() || new Date(),
          });
        } catch (e) {
          // Skip this user if error
        }
      }

      return onlineUsers;
    } catch (error) {
      return [];
    }
  },

  // Subscribe to friends presence changes
  subscribeToFriends: (
    userId: string,
    callback: (friends: Friend[]) => void,
  ): (() => void) => {
    let unsubscribes: (() => void)[] = [];

    getFirebaseDb().then((db) => {
      if (!db) return;

      // Subscribe to friendships
      const friendsRef = collection(db, FRIENDS_COLLECTION);

      const setupSubscriptions = async () => {
        const [q1, q2] = await Promise.all([
          getDocs(query(friendsRef, where("user1Id", "==", userId))),
          getDocs(query(friendsRef, where("user2Id", "==", userId))),
        ]);

        const friendIds = [
          ...q1.docs.map((d) => d.data().user2Id),
          ...q2.docs.map((d) => d.data().user1Id),
        ];

        // Subscribe to each friend's presence
        friendIds.forEach((friendId) => {
          const unsub = onSnapshot(
            doc(db, PRESENCE_COLLECTION, friendId),
            () => {
              // Refetch all friends when any presence changes
              friendsService.getFriends(userId).then(callback);
            },
          );
          unsubscribes.push(unsub);
        });

        // Initial load
        friendsService.getFriends(userId).then(callback);
      };

      setupSubscriptions();
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  },

  // Subscribe to online users (real-time)
  subscribeToOnlineUsers: (
    callback: (users: UserPresence[]) => void,
  ): (() => void) => {
    let unsubscribe = () => {};

    getFirebaseDb().then((db) => {
      if (!db) return;

      const presenceRef = collection(db, PRESENCE_COLLECTION);
      const q = query(presenceRef, where("online", "==", true));

      unsubscribe = onSnapshot(q, async (snapshot) => {
        const onlineUsers: UserPresence[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const userDoc = await getDoc(doc(db, "users", docSnap.id));
          const userData = userDoc.exists() ? userDoc.data() : {};

          onlineUsers.push({
            userId: docSnap.id,
            displayName: userData.displayName || "Anonymous",
            photoURL: userData.photoURL,
            online: data.online,
            lastSeen: data.lastSeen?.toDate() || new Date(),
            currentGame: data.currentGame,
            lastChanged: data.lastChanged?.toDate() || new Date(),
          });
        }

        callback(onlineUsers);
      });
    });

    return () => unsubscribe();
  },

  // Search users by display name
  searchUsers: async (
    searchTerm: string,
    currentUserId: string,
  ): Promise<
    { id: string; displayName: string; photoURL?: string; level: number }[]
  > => {
    const db = await getFirebaseDb();
    if (!db || searchTerm.length < 3) return [];

    // Note: This is a simple implementation. For production, consider Algolia or similar
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    return snapshot.docs
      .filter((doc) => doc.id !== currentUserId)
      .filter((doc) => {
        const name = doc.data().displayName || "";
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .map((doc) => ({
        id: doc.id,
        displayName: doc.data().displayName || "Anonymous",
        photoURL: doc.data().photoURL,
        level: doc.data().level || 1,
      }))
      .slice(0, 20); // Limit results
  },
};
