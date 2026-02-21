# Arcade Hub Database Analysis Report

**Date:** February 2026  
**Project:** Arcade Hub Next.js  
**Database:** Firebase Firestore  

---

## Executive Summary

The Arcade Hub database is built on Firebase Firestore with a well-structured collection architecture. The system supports user management, leaderboards, achievements, challenges, tournaments, and a shop system. However, there are several critical issues that need addressing before production deployment.

**Overall Status:** ⚠️ **Requires Attention Before Production**

---

## 1. Database Architecture Overview

### 1.1 Current Collections

| Collection | Purpose | Data Volume Expected |
|------------|---------|---------------------|
| `users` | User profiles and stats | High (1 doc per user) |
| `scores` | All game scores submitted | Very High (1 doc per game played) |
| `userStats` | Best scores per user per game | Medium (1 doc per user-game combo) |
| `achievements` | Global achievement definitions | Low (static data, ~10 docs) |
| `userAchievements` | User achievement progress | High (1 doc per user-achievement) |
| `challenges` | Active challenge definitions | Low (~5-10 active at a time) |
| `userChallenges` | User challenge progress | High (1 doc per user-challenge) |
| `shopItems` | Shop item definitions | Low (static data, ~20 items) |
| `userInventory` | User purchased items | High (1 doc per user) |
| `tournaments` | Tournament definitions | Medium (~10-50 at a time) |
| `tournamentParticipants` | Tournament participant data | High (1 doc per participant) |

### 1.2 Collection Relationships

```
users (root)
├── achievements (subcollection) - NOT IMPLEMENTED
├── gameStats (subcollection) - NOT IMPLEMENTED  
├── preferences (subcollection) - NOT IMPLEMENTED
└── notifications (subcollection) - NOT IMPLEMENTED

scores (root collection)
├── Links to users via userId
└── Links to games via gameId

userStats (root collection)
├── Composite ID: {userId}_{gameId}
└── Stores best score per user per game

achievements (root collection)
└── Static definitions

userAchievements (root collection)
├── Composite ID: {userId}_{achievementId}
└── Links to users and achievements

[Additional collections follow similar patterns...]
```

---

## 2. Security Rules Analysis

### 2.1 Current Rules Status: ⚠️ PARTIALLY CONFIGURED

**Location:** `/firestore.rules` (outside Next.js app directory)

### 2.2 Implemented Protections ✅

| Feature | Status | Notes |
|---------|--------|-------|
| User authentication required | ✅ | `isSignedIn()` function |
| User ownership validation | ✅ | `isOwner(userId)` function |
| Admin role check | ✅ | `isAdmin()` function |
| Display name validation | ✅ | 3-20 chars, alphanumeric |
| Score validation | ✅ | Range 0-100M, must include gameId |
| Input sanitization | ✅ | Field whitelisting on writes |

### 2.3 Critical Security Issues 🚨

#### Issue 1: Missing Rules Deployment
**Severity:** CRITICAL  
**Description:** The `firestore.rules` file exists in the parent directory but may not be deployed to Firebase.  
**Impact:** Database may be using default "allow all" rules.  
**Fix:** Run `firebase deploy --only firestore:rules`

#### Issue 2: Collection Mismatch
**Severity:** HIGH  
**Description:** Security rules reference collections that don't match the code:

| Rule Collection | Code Collection | Status |
|----------------|-----------------|--------|
| `users` | `users` | ✅ Match |
| `scores` | `scores` | ✅ Match |
| `userStats` (subcollection) | `userStats` (root) | ❌ MISMATCH |
| `achievements` (subcollection) | `achievements` (root) | ❌ MISMATCH |
| `publicProfiles` | Not implemented | ❌ Missing |
| `leaderboards` | Not implemented | ❌ Missing |

#### Issue 3: No Rate Limiting Enforcement
**Severity:** MEDIUM  
**Description:** Rules mention rate limiting but don't enforce it.  
**Code:** `isRateLimited()` always returns `true`.

### 2.4 Recommended Security Fixes

```javascript
// Fix 1: Add missing collection rules for root collections
match /userStats/{docId} {
  allow read: if true;
  allow create: if isSignedIn() 
    && docId.matches('^' + request.auth.uid + '_.+$');
  allow update: if isSignedIn() 
    && docId.matches('^' + request.auth.uid + '_.+$');
}

match /userAchievements/{docId} {
  allow read: if isSignedIn() 
    && docId.matches('^' + request.auth.uid + '_.+$');
  allow write: if isSignedIn() 
    && docId.matches('^' + request.auth.uid + '_.+$');
}

match /userChallenges/{docId} {
  allow read: if isSignedIn() 
    && docId.matches('^' + request.auth.uid + '_.+$');
  allow write: if isSignedIn() 
    && docId.matches('^' + request.auth.uid + '_.+$');
}

match /userInventory/{userId} {
  allow read, write: if isOwner(userId);
}
```

---

## 3. Index Requirements

### 3.1 Current Indexes (firestore.indexes.json)

```json
{
  "collectionGroup": "scores",
  "fields": [
    { "fieldPath": "gameId", "order": "ASCENDING" },
    { "fieldPath": "verified", "order": "ASCENDING" },
    { "fieldPath": "score", "order": "DESCENDING" }
  ]
}
```

### 3.2 Missing Required Indexes ⚠️

Based on code analysis, these queries will fail without indexes:

#### Index 1: User Stats Leaderboard Query
**File:** `leaderboard.ts:78-84`
```javascript
q = query(
  userStatsRef, 
  where('gameId', '==', gameId),
  orderBy('bestScore', 'desc'), 
  limit(limitCount)
)
```
**Required Index:**
```json
{
  "collectionGroup": "userStats",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "gameId", "order": "ASCENDING" },
    { "fieldPath": "bestScore", "order": "DESCENDING" }
  ]
}
```

#### Index 2: Active Challenges Query
**File:** `challenges.ts:187-191`
```javascript
q = query(
  challengesRef,
  where('expiresAt', '>', now),
  where('active', '==', true)
)
```
**Required Index:**
```json
{
  "collectionGroup": "challenges",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "active", "order": "ASCENDING" },
    { "fieldPath": "expiresAt", "order": "ASCENDING" }
  ]
}
```

#### Index 3: User Achievements Query
**File:** `achievements.ts:172-174`
```javascript
const q = query(userAchievementsRef, where('userId', '==', userId));
```
**Required Index:**
```json
{
  "collectionGroup": "userAchievements",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" }
  ]
}
```

#### Index 4: Tournament Participants Query
**File:** `tournaments.ts:224`
```javascript
const q = query(participantsRef, where('tournamentId', '==', tournamentId));
```
**Required Index:**
```json
{
  "collectionGroup": "tournamentParticipants",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "tournamentId", "order": "ASCENDING" },
    { "fieldPath": "score", "order": "DESCENDING" }
  ]
}
```

### 3.3 Recommended Index Strategy

Deploy these indexes to prevent query failures:

```json
{
  "indexes": [
    {
      "collectionGroup": "userStats",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "gameId", "order": "ASCENDING" },
        { "fieldPath": "bestScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "challenges",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "userAchievements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "userChallenges",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tournamentParticipants",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tournamentId", "order": "ASCENDING" },
        { "fieldPath": "score", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 4. Game Integration Analysis

### 4.1 Current Game Communication Protocol

**Hub → Game:**
```javascript
iframe.contentWindow.postMessage({
  type: 'INIT_GAME',
  userId: user?.id || 'guest',
  username: user?.displayName || 'Guest',
}, '*');
```

**Game → Hub:**
```javascript
// Expected message format
{
  type: 'GAME_SCORE',
  score: number
}
```

### 4.2 Game Integration Status ❌

| Game | Score Submission | Status |
|------|-----------------|--------|
| Snake | ❌ Not implemented | Game doesn't send scores |
| Pac-Man | ❌ Not implemented | Game doesn't send scores |
| Tetris | ❌ Not implemented | Game doesn't send scores |
| Breakout | ❌ Not implemented | Game doesn't send scores |
| Asteroids | ❌ Not implemented | Game doesn't send scores |
| Minesweeper | ❌ Not implemented | Game doesn't send scores |
| 2048 | ❌ Not implemented | Game doesn't send scores |
| Tic Tac Toe | ❌ Not implemented | Game doesn't send scores |

### 4.3 Critical Issue: Scores Not Persisting

**Problem:** Games are standalone HTML/JS files that don't communicate scores back to the parent hub.

**Impact:** 
- Leaderboards remain empty
- Achievements never unlock
- Challenges never complete
- User stats never update

### 4.4 Recommended Fix: Game Integration API

Add this script to each game's `index.html`:

```javascript
// Game Integration Bridge
(function() {
  const GameBridge = {
    // Send score to parent hub
    submitScore: function(score) {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'GAME_SCORE',
          score: score,
          timestamp: Date.now()
        }, '*');
      }
    },
    
    // Notify game is ready
    notifyReady: function() {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'GAME_READY'
        }, '*');
      }
    },
    
    // Request to exit game
    exitGame: function() {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'GAME_EXIT'
        }, '*');
      }
    },
    
    // Listen for init messages from hub
    onInit: function(callback) {
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'INIT_GAME') {
          callback(event.data);
        }
      });
    }
  };
  
  // Expose globally for games to use
  window.ArcadeHub = GameBridge;
})();
```

**Usage in games:**
```javascript
// When game ends
ArcadeHub.submitScore(finalScore);

// On game load
ArcadeHub.notifyReady();

// On exit button
ArcadeHub.exitGame();
```

---

## 5. Data Consistency Issues

### 5.1 Issue: Denormalized Data Without Sync

**Problem:** User display names and avatars are stored in multiple places.

**Locations:**
1. `users` collection - source of truth
2. `scores` collection - copied at submission time
3. `userStats` collection - not storing display info
4. `tournamentParticipants` - copied at join time

**Risk:** If user changes their display name, historical scores show old name.

**Recommendation:** Either:
- Option A: Store only userId, lookup display info in real-time (slower, more reads)
- Option B: Implement Cloud Function to sync name changes across collections
- Option C: Accept stale data for historical records (current approach - document it)

### 5.2 Issue: Missing Transactions

**Critical Code:** `shop.ts:270-281`
```typescript
// Spend coins
const success = await userStatsService.spendCoins(userId, item.price);
if (!success) {
  return { success: false, error: 'Purchase failed' };
}

// Add to inventory
const inventoryRef = doc(db, USER_INVENTORY_COLLECTION, userId);
await updateDoc(inventoryRef, {
  items: arrayUnion(itemId),
  updatedAt: serverTimestamp(),
});
```

**Risk:** If user refreshes between spendCoins and updateDoc, coins are spent but item not received.

**Fix:** Use Firestore transaction:
```typescript
await runTransaction(db, async (transaction) => {
  const userDoc = await transaction.get(userRef);
  const inventoryDoc = await transaction.get(inventoryRef);
  
  // Check coins
  if (userDoc.data().coins < item.price) {
    throw new Error('Insufficient coins');
  }
  
  // Deduct coins and add item atomically
  transaction.update(userRef, { coins: increment(-item.price) });
  transaction.update(inventoryRef, { items: arrayUnion(itemId) });
});
```

---

## 6. Performance Analysis

### 6.1 N+1 Query Issues

**File:** `leaderboard.ts:86-104`
```typescript
// First query: Get user stats
const snapshot = await getDocs(q);

// N additional queries: Get user profiles
const userIds = Array.from(new Set(snapshot.docs.map(doc => doc.data().userId)));
for (const userId of userIds) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef); // N queries!
}
```

**Impact:** For 50 leaderboard entries, this makes 51 database queries.

**Fix:** Use `in` query (max 10 per query) or denormalize display name into userStats.

### 6.2 Missing Pagination

**File:** Multiple services use `limit(50)` but no pagination cursors.

**Collections affected:**
- `scores` - Will grow indefinitely
- `userAchievements` - Could be large for active users
- `userChallenges` - Could be large over time

**Recommendation:** Implement cursor-based pagination for all list queries.

---

## 7. Data Integrity Checks

### 7.1 Missing Validation

| Field | Validation | Status |
|-------|-----------|--------|
| score | Range 0-100M | ✅ In rules |
| score | Type number | ✅ In rules |
| userId | Matches auth.uid | ✅ In rules |
| gameId | Valid game ID | ❌ Not validated |
| coins | Non-negative | ❌ Not validated |
| level | Range 1-100 | ✅ In rules |

### 7.2 Recommended Additional Validations

Add game ID validation against allowed games list:
```javascript
const VALID_GAMES = ['snake', 'pacman', 'tetris', 'breakout', 'asteroids', 'minesweeper', '2048', 'tictactoe'];

function isValidGameId(gameId) {
  return gameId is string && gameId in VALID_GAMES;
}
```

---

## 8. Backup and Recovery

### 8.1 Current Status: ❌ Not Configured

**Missing:**
- Automated backup policy
- Data retention rules
- Point-in-time recovery setup
- Export/Import procedures

### 8.2 Recommendations

1. **Enable Automated Backups:**
   ```bash
   gcloud firestore backups schedules create --database='(default)' --recurrence=daily
   ```

2. **Set Up Data Retention:**
   - `scores` collection: Keep 90 days, archive older to Cloud Storage
   - `analytics` collection: Keep 30 days
   - User data: Keep until account deletion

3. **Document Recovery Procedures:**
   - User account recovery
   - Score dispute resolution
   - Corrupted data handling

---

## 9. Summary of Critical Issues

### 🚨 P0 - Fix Before Production

1. **Deploy Security Rules** - Database may be open to public
2. **Deploy Firestore Indexes** - Queries will fail
3. **Fix Game Integration** - Scores not being recorded
4. **Fix Security Rule/Collection Mismatch** - userStats and achievements rules don't match code

### ⚠️ P1 - Fix Within First Week

1. **Add Firestore Transactions** - Prevent data corruption in shop purchases
2. **Fix N+1 Query in Leaderboard** - Performance degradation at scale
3. **Add Game ID Validation** - Prevent invalid data

### 📋 P2 - Fix Within First Month

1. **Implement Data Backup Strategy**
2. **Add Pagination to List Queries**
3. **Document Denormalization Strategy**
4. **Add Rate Limiting Enforcement**

---

## 10. Action Items Checklist

- [ ] Deploy updated `firestore.rules` to Firebase
- [ ] Deploy updated `firestore.indexes.json` to Firebase
- [ ] Add game bridge script to all game index.html files
- [ ] Test score submission end-to-end
- [ ] Implement Firestore transactions for shop purchases
- [ ] Fix N+1 query in leaderboard service
- [ ] Add gameId validation to security rules
- [ ] Set up automated Firestore backups
- [ ] Add pagination to scores query
- [ ] Document data model for future developers

---

## Appendix A: Complete Collection Schema

### A.1 users
```typescript
{
  id: string,                    // Firebase Auth UID
  totalScore: number,
  gamesPlayed: number,
  totalPlayTime: number,         // minutes
  achievementsUnlocked: number,
  coins: number,
  level: number,
  xp: number,
  lastPlayed: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### A.2 userStats
```typescript
{
  id: string,                    // {userId}_{gameId}
  userId: string,
  gameId: string,
  bestScore: number,
  gamesPlayed: number,
  lastPlayed: Timestamp
}
```

### A.3 scores
```typescript
{
  id: string,                    // Auto-generated
  userId: string,
  displayName: string,
  avatar: string,
  gameId: string,
  score: number,
  timestamp: Timestamp
}
```

### A.4 achievements
```typescript
{
  id: string,                    // achievement identifier
  name: string,
  description: string,
  icon: string,
  maxProgress: number,
  rarity: 'common' | 'rare' | 'epic' | 'legendary',
  xpReward: number,
  coinReward: number
}
```

### A.5 userAchievements
```typescript
{
  id: string,                    // {userId}_{achievementId}
  userId: string,
  achievementId: string,
  progress: number,
  unlocked: boolean,
  unlockedAt: Timestamp | null,
  updatedAt: Timestamp
}
```

### A.6 challenges
```typescript
{
  id: string,                    // auto-generated
  title: string,
  description: string,
  game: string,                  // 'any' or specific gameId
  target: number,
  reward: number,
  expiresAt: Timestamp,
  active: boolean,
  type: 'daily' | 'weekly',
  createdAt: Timestamp
}
```

### A.7 userChallenges
```typescript
{
  id: string,                    // {userId}_{challengeId}
  userId: string,
  challengeId: string,
  progress: number,
  completed: boolean,
  completedAt: Timestamp | null,
  claimed: boolean,
  updatedAt: Timestamp
}
```

### A.8 shopItems
```typescript
{
  id: string,                    // item identifier
  name: string,
  description: string,
  icon: string,
  price: number,
  category: 'avatar' | 'theme' | 'badge' | 'powerup',
  rarity: 'common' | 'rare' | 'epic' | 'legendary',
  active: boolean
}
```

### A.9 userInventory
```typescript
{
  id: string,                    // userId
  items: string[],               // array of shopItem IDs
  equipped: {
    avatar?: string,
    theme?: string,
    badge?: string,
    powerup?: string
  },
  updatedAt: Timestamp
}
```

### A.10 tournaments
```typescript
{
  id: string,                    // auto-generated
  name: string,
  game: string,
  description: string,
  participants: number,
  maxParticipants: number,
  startTime: Timestamp,
  endTime: Timestamp | null,
  prize: number,
  status: 'upcoming' | 'active' | 'ended',
  createdBy: string,             // userId
  winner: string | null,         // userId
  createdAt: Timestamp
}
```

### A.11 tournamentParticipants
```typescript
{
  id: string,                    // {tournamentId}_{userId}
  userId: string,
  tournamentId: string,
  displayName: string,
  photoURL: string | null,
  score: number,
  joinedAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Appendix B: Query Performance Optimization Guide

### B.1 Efficient Queries

✅ **Good - Single field equality:**
```javascript
query(collection, where('userId', '==', userId))
```

✅ **Good - Equality + Sort:**
```javascript
query(collection, 
  where('gameId', '==', gameId),
  orderBy('bestScore', 'desc')
)
```

❌ **Bad - Range on multiple fields:**
```javascript
query(collection,
  where('score', '>', 100),
  where('timestamp', '>', yesterday)  // Requires composite index
)
```

### B.2 Indexing Strategy

1. **Single field indexes** - Auto-created by Firestore
2. **Composite indexes** - Must be defined in firestore.indexes.json
3. **Collection group indexes** - Required for subcollection queries

---

**End of Report**

*For questions or updates to this report, contact the development team.*
