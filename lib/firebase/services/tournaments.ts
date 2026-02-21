import { 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';

const TOURNAMENTS_COLLECTION = 'tournaments';
const TOURNAMENT_PARTICIPANTS_COLLECTION = 'tournamentParticipants';

export interface Tournament {
  id: string;
  name: string;
  game: string;
  description: string;
  participants: number;
  maxParticipants: number;
  startTime: Date;
  endTime?: Date;
  prize: number;
  status: 'upcoming' | 'active' | 'ended';
  createdBy: string;
  winner?: string;
}

export interface TournamentParticipant {
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  joinedAt: Date;
}

export const tournamentsService = {
  // Get tournaments by status
  getTournaments: async (status?: Tournament['status']): Promise<Tournament[]> => {
    const db = await getFirebaseDb();
    if (!db) return [];

    const tournamentsRef = collection(db, TOURNAMENTS_COLLECTION);
    let q;
    
    if (status) {
      q = query(
        tournamentsRef,
        where('status', '==', status),
        orderBy('startTime', 'asc')
      );
    } else {
      q = query(tournamentsRef, orderBy('startTime', 'asc'));
    }
    
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      game: doc.data().game,
      description: doc.data().description,
      participants: doc.data().participants || 0,
      maxParticipants: doc.data().maxParticipants,
      startTime: doc.data().startTime?.toDate() || new Date(),
      endTime: doc.data().endTime?.toDate(),
      prize: doc.data().prize,
      status: doc.data().status,
      createdBy: doc.data().createdBy,
      winner: doc.data().winner,
    }));
  },

  // Get upcoming tournaments
  getUpcomingTournaments: async (): Promise<Tournament[]> => {
    const db = await getFirebaseDb();
    if (!db) return [];

    const tournamentsRef = collection(db, TOURNAMENTS_COLLECTION);
    const now = Timestamp.now();
    
    const q = query(
      tournamentsRef,
      where('startTime', '>', now),
      where('status', '==', 'upcoming'),
      orderBy('startTime', 'asc')
    );
    
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      game: doc.data().game,
      description: doc.data().description,
      participants: doc.data().participants || 0,
      maxParticipants: doc.data().maxParticipants,
      startTime: doc.data().startTime?.toDate() || new Date(),
      endTime: doc.data().endTime?.toDate(),
      prize: doc.data().prize,
      status: doc.data().status,
      createdBy: doc.data().createdBy,
      winner: doc.data().winner,
    }));
  },

  // Get active tournaments
  getActiveTournaments: async (): Promise<Tournament[]> => {
    return tournamentsService.getTournaments('active');
  },

  // Get ended tournaments
  getEndedTournaments: async (): Promise<Tournament[]> => {
    return tournamentsService.getTournaments('ended');
  },

  // Get tournament details
  getTournament: async (tournamentId: string): Promise<Tournament | null> => {
    const db = await getFirebaseDb();
    if (!db) return null;

    const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
    const snapshot = await getDoc(tournamentRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      game: data.game,
      description: data.description,
      participants: data.participants || 0,
      maxParticipants: data.maxParticipants,
      startTime: data.startTime?.toDate() || new Date(),
      endTime: data.endTime?.toDate(),
      prize: data.prize,
      status: data.status,
      createdBy: data.createdBy,
      winner: data.winner,
    };
  },

  // Create tournament
  createTournament: async (
    userId: string,
    tournament: Omit<Tournament, 'id' | 'participants' | 'status' | 'createdBy'>
  ): Promise<string | null> => {
    const db = await getFirebaseDb();
    if (!db) return null;

    const tournamentsRef = collection(db, TOURNAMENTS_COLLECTION);
    const newTournamentRef = doc(tournamentsRef);

    await setDoc(newTournamentRef, {
      ...tournament,
      participants: 0,
      status: 'upcoming',
      createdBy: userId,
      createdAt: serverTimestamp(),
    });

    return newTournamentRef.id;
  },

  // Join tournament
  joinTournament: async (
    userId: string,
    tournamentId: string,
    displayName: string,
    photoURL?: string
  ): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    // Check if tournament exists and has space
    const tournament = await tournamentsService.getTournament(tournamentId);
    if (!tournament || tournament.participants >= tournament.maxParticipants) {
      return false;
    }

    // Check if already joined
    const participantRef = doc(
      db,
      TOURNAMENT_PARTICIPANTS_COLLECTION,
      `${tournamentId}_${userId}`
    );
    const participantSnap = await getDoc(participantRef);
    if (participantSnap.exists()) {
      return false; // Already joined
    }

    // Add participant
    await setDoc(participantRef, {
      userId,
      tournamentId,
      displayName,
      photoURL,
      score: 0,
      joinedAt: serverTimestamp(),
    });

    // Increment participant count
    const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
    await updateDoc(tournamentRef, {
      participants: (tournament.participants || 0) + 1,
    });

    return true;
  },

  // Get tournament participants
  getParticipants: async (tournamentId: string): Promise<TournamentParticipant[]> => {
    const db = await getFirebaseDb();
    if (!db) return [];

    const participantsRef = collection(db, TOURNAMENT_PARTICIPANTS_COLLECTION);
    const q = query(participantsRef, where('tournamentId', '==', tournamentId));
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(doc => ({
        userId: doc.data().userId,
        displayName: doc.data().displayName,
        photoURL: doc.data().photoURL,
        score: doc.data().score || 0,
        joinedAt: doc.data().joinedAt?.toDate() || new Date(),
      }))
      .sort((a, b) => b.score - a.score);
  },

  // Check if user is participant
  isParticipant: async (userId: string, tournamentId: string): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    const participantRef = doc(
      db,
      TOURNAMENT_PARTICIPANTS_COLLECTION,
      `${tournamentId}_${userId}`
    );
    const snapshot = await getDoc(participantRef);
    return snapshot.exists();
  },

  // Update participant score
  updateScore: async (
    userId: string,
    tournamentId: string,
    score: number
  ): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) return;

    const participantRef = doc(
      db,
      TOURNAMENT_PARTICIPANTS_COLLECTION,
      `${tournamentId}_${userId}`
    );
    
    await updateDoc(participantRef, {
      score,
      updatedAt: serverTimestamp(),
    });
  },
};
