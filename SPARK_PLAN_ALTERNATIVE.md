# 🆓 Spark Plan Alternative (No Cloud Functions)

Since Firebase now requires Blaze plan for Cloud Functions, here are workarounds using **Firestore Security Rules** and **Client-Side Logic**.

---

## What We'll Lose Without Functions

| Feature | Current (Functions) | Alternative (Spark) |
|---------|---------------------|---------------------|
| Score anti-cheat | Server-side validation | Client-side + Firestore rules |
| Leaderboard aggregation | Auto every 15 min | Client-side calculation |
| Analytics pipeline | Server processing | Direct Firestore writes |
| Tournament scheduling | Auto start/end | Manual or client-triggered |
| Presence cleanup | Auto every 10 min | Client-side on disconnect |

---

## Alternative Implementation

### 1. Score Validation (Firestore Rules + Client)

**firestore.rules additions:**
```javascript
// Validate scores on write
function isValidScore() {
  return request.resource.data.score is number 
    && request.resource.data.score >= 0
    && request.resource.data.score <= 100000000
    && request.resource.data.gameId is string
    && request.resource.data.userId == request.auth.uid
    && request.time == request.resource.data.timestamp; // Prevent backdating
}

match /scores/{scoreId} {
  allow create: if isSignedIn() 
    && isValidScore()
    && request.resource.data.verified == false; // Must be unverified initially
}
```

**Client-side validation:**
```typescript
// Add to lib/firebase/services/leaderboard.ts
export function validateScoreClient(score: number, gameId: string, duration: number): boolean {
  const config = GAME_CONFIGS[gameId];
  if (!config) return false;
  if (score > config.maxScore) return false;
  if (duration < config.minDuration) return false;
  return true;
}
```

### 2. Leaderboard Aggregation (Client-Side)

```typescript
// Fetch and sort on client
export async function getLeaderboardClient(gameId: string): Promise<LeaderboardEntry[]> {
  const db = await getFirebaseDb();
  if (!db) return [];
  
  const snapshot = await db
    .collection('scores')
    .where('gameId', '==', gameId)
    .where('verified', '==', true)
    .orderBy('score', 'desc')
    .limit(100)
    .get();
  
  // Deduplicate by user (keep best score only)
  const userBestScores = new Map();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (!userBestScores.has(data.userId)) {
      userBestScores.set(data.userId, {
        id: doc.id,
        ...data,
        rank: 0, // Will calculate
      });
    }
  });
  
  // Convert to array and assign ranks
  return Array.from(userBestScores.values())
    .slice(0, 50)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}
```

### 3. Tournament Management (Manual/Client)

Remove scheduled functions, add manual triggers in UI:

```typescript
// Add admin button in tournaments page
async function manuallyStartTournament(tournamentId: string) {
  await db.collection('tournaments').doc(tournamentId).update({
    status: 'in_progress',
    actualStartTime: serverTimestamp(),
  });
}

async function manuallyEndTournament(tournamentId: string) {
  // Calculate winners on client
  const scores = await db
    .collection('tournament_scores')
    .where('tournamentId', '==', tournamentId)
    .orderBy('score', 'desc')
    .limit(10)
    .get();
  
  const winners = scores.docs.map((doc, index) => ({
    rank: index + 1,
    ...doc.data(),
  }));
  
  await db.collection('tournaments').doc(tournamentId).update({
    status: 'completed',
    winners: winners.slice(0, 3),
  });
}
```

### 4. Presence Cleanup (Client-Side)

```typescript
// In hooks/usePresence.ts
useEffect(() => {
  const handleDisconnect = () => {
    if (user?.id) {
      friendsService.updatePresence(user.id, false);
    }
  };
  
  window.addEventListener('beforeunload', handleDisconnect);
  
  // Also set up periodic cleanup
  const cleanupInterval = setInterval(() => {
    cleanupStalePresence(); // Query and delete old presence entries
  }, 60000); // Every minute
  
  return () => {
    window.removeEventListener('beforeunload', handleDisconnect);
    clearInterval(cleanupInterval);
    handleDisconnect();
  };
}, [user?.id]);
```

---

## Implementation Steps

### Step 1: Remove Functions Directory
```bash
rm -rf functions/
```

### Step 2: Update firestore.rules
Add the enhanced validation rules (see above).

### Step 3: Update Client Code
- Add client-side score validation
- Update leaderboard service to calculate ranks client-side
- Add admin buttons for tournament management

### Step 4: Deploy (Spark Compatible!)
```bash
firebase deploy --only firestore:rules,hosting
```

---

## Trade-offs

| Aspect | With Functions | Without Functions (Spark) |
|--------|----------------|---------------------------|
| **Security** | ✅ Server-side validation | ⚠️ Client-side (rules help) |
| **Cost** | Blaze (~$0-5/mo) | ✅ Spark ($0) |
| **Performance** | ✅ Fast (server-side) | ⚠️ Slower (client calculates) |
| **Anti-cheat** | ✅ Strong | ⚠️ Weaker |
| **Maintenance** | ✅ Auto-scheduled | ⚠️ Manual/client-triggered |

---

## Recommendation

If you want to stay completely free:
1. **Create a new Firebase project** (Option 1) - Easiest, keeps all features
2. **Use this alternative** (Option 2) - More work, weaker security

The new project approach is strongly recommended!
