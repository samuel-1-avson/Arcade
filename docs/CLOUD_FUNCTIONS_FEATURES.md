# Arcade Gaming Hub - Features Requiring Firebase Cloud Functions

**Document Date:** February 21, 2026  
**Firebase Project:** arcade-7f03c  
**Plan Required:** Firebase Blaze (Pay-as-you-go)

---

## Executive Summary

The Arcade Gaming Hub has **12 Cloud Functions** that provide essential backend functionality. Without deploying these functions (requires Blaze plan), the system will operate in **limited mode** with reduced functionality.

---

## Cloud Functions Overview

| # | Function Name | Type | Schedule | Priority |
|---|---------------|------|----------|----------|
| 1 | `onScoreSubmit` | Firestore Trigger | On score creation | 🔴 Critical |
| 2 | `aggregateLeaderboards` | Pub/Sub | Every 15 minutes | 🔴 Critical |
| 3 | `processAnalytics` | Firestore Trigger | On analytics event | 🟡 Medium |
| 4 | `dailyAnalyticsRollup` | Pub/Sub | Daily at midnight | 🟢 Low |
| 5 | `cleanupPresence` | Pub/Sub | Every 10 minutes | 🟡 Medium |
| 6 | `onUserUpdate` | Firestore Trigger | On user update | 🟡 Medium |
| 7 | `onUserCreate` | Firestore Trigger | On user creation | 🟡 Medium |
| 8 | `sendTestNotification` | HTTP Callable | On-demand | 🟢 Low |
| 9 | `startScheduledTournaments` | Pub/Sub | Every 1 minute | 🟡 Medium |
| 10 | `finalizeTournament` | Internal | Called by #9 | 🟡 Medium |
| 11 | `healthCheck` | HTTP Request | On-demand | 🟢 Low |
| 12 | `cleanupRateLimits` | Pub/Sub | Every 1 hour | 🟡 Medium |

---

## Detailed Feature Breakdown

### 🔴 CRITICAL Features (Will NOT work without Cloud Functions)

#### 1. Score Validation & Anti-Cheat
**Function:** `onScoreSubmit`

**What it does:**
- Validates all score submissions in real-time
- Applies anti-cheat detection algorithms
- Checks for banned users
- Enforces rate limiting (prevents spam)
- Verifies scores don't exceed game maximums
- Flags suspicious activity for review
- Updates live leaderboard in Realtime Database

**Impact without it:**
- ❌ Scores will NOT be verified
- ❌ No anti-cheat protection (easy to hack)
- ❌ No rate limiting (spam vulnerability)
- ❌ Live leaderboards won't update
- ❌ Achievement checks won't run

**Client-side fallback:** None - scores submit but aren't processed

---

#### 2. Leaderboard Aggregation
**Function:** `aggregateLeaderboards`

**What it does:**
- Aggregates top 50 scores for each game every 15 minutes
- Removes duplicate entries (keeps best score per user)
- Updates global statistics
- Maintains historical leaderboard data

**Impact without it:**
- ❌ Leaderboards will show stale/empty data
- ❌ No deduplication (same user can occupy multiple slots)
- ❌ Global stats won't update

**Client-side fallback:** Client can query Firestore directly, but slower and more expensive

---

### 🟡 MEDIUM Priority Features (Degraded without Cloud Functions)

#### 3. Real-Time Presence Cleanup
**Function:** `cleanupPresence`

**What it does:**
- Cleans up stale presence data every 10 minutes
- Removes users who haven't been active for 1+ hour
- Keeps "online now" list accurate

**Impact without it:**
- ⚠️ "Online" users list will show stale data
- ⚠️ Users may appear online when they're not
- ⚠️ Database will accumulate dead presence entries

**Client-side fallback:** None

---

#### 4. User Notifications
**Functions:** `onUserUpdate`, `onUserCreate`

**What they do:**
- Sends welcome notification to new users
- Sends level-up notifications
- Delivers achievement unlock notifications
- Tournament start/end notifications

**Impact without it:**
- ⚠️ No automated welcome messages
- ⚠️ No level-up notifications
- ⚠️ No achievement notifications
- ⚠️ Tournament notifications won't work

**Client-side fallback:** Can be done client-side for some notifications

---

#### 5. Tournament Management
**Function:** `startScheduledTournaments`

**What it does:**
- Automatically starts scheduled tournaments every minute
- Automatically ends tournaments when time expires
- Calculates winners and finalizes results
- Sends notifications to participants

**Impact without it:**
- ⚠️ Tournaments won't auto-start
- ⚠️ Tournaments won't auto-end
- ⚠️ Winners won't be calculated
- ⚠️ Tournament system essentially broken

**Client-side fallback:** Manual tournament management (not feasible)

---

#### 6. Analytics Processing
**Function:** `processAnalytics`

**What it does:**
- Processes analytics events in real-time
- Enriches event data with server timestamps
- Aggregates counters by date/game
- Maintains analytics history

**Impact without it:**
- ⚠️ Analytics events pile up unprocessed
- ⚠️ No daily/weekly/monthly stats
- ⚠️ Admin dashboard won't show accurate data

**Client-side fallback:** None

---

#### 7. Daily Analytics Rollup
**Function:** `dailyAnalyticsRollup`

**What it does:**
- Runs at midnight UTC daily
- Aggregates previous day's analytics
- Archives historical data
- Generates daily reports

**Impact without it:**
- ⚠️ Historical analytics won't be archived
- ⚠️ Daily reports won't generate

**Client-side fallback:** None

---

#### 8. Rate Limit Cleanup
**Function:** `cleanupRateLimits`

**What it does:**
- Cleans up expired rate limit documents hourly
- Prevents database from growing indefinitely

**Impact without it:**
- ⚠️ Rate limit collection grows forever
- ⚠️ Database costs increase over time

**Client-side fallback:** None

---

### 🟢 LOW Priority Features (Nice to have)

#### 9. Test Notifications
**Function:** `sendTestNotification`

**What it does:**
- HTTP endpoint for sending test notifications
- Useful for debugging notification system

**Impact without it:**
- ℹ️ Can't send test notifications

---

#### 10. Health Check
**Function:** `healthCheck`

**What it does:**
- Simple HTTP endpoint for monitoring
- Returns system status

**Impact without it:**
- ℹ️ No automated health monitoring

---

## Impact Summary by Feature Area

| Feature Area | Without Cloud Functions | Priority |
|--------------|------------------------|----------|
| **Score System** | Scores submit but aren't validated; no anti-cheat; leaderboards stale | 🔴 Critical |
| **Leaderboards** | Show stale or empty data; no deduplication | 🔴 Critical |
| **Achievements** | Game achievements work, but global score achievements don't unlock | 🟡 Medium |
| **Tournaments** | Completely broken - won't start/end automatically | 🟡 Medium |
| **Notifications** | No automated notifications (welcome, level-up, etc.) | 🟡 Medium |
| **Presence** | "Online" list shows stale data | 🟡 Medium |
| **Analytics** | Events pile up unprocessed; no reports | 🟡 Medium |
| **Anti-Cheat** | No protection against hackers/cheaters | 🔴 Critical |
| **Rate Limiting** | No spam protection | 🔴 Critical |

---

## What Works WITHOUT Cloud Functions

The following features work entirely client-side and don't require Cloud Functions:

✅ **User Authentication** (Firebase Auth)  
✅ **Game Launcher & Hub UI**  
✅ **Game Score Submission** (submits to Firestore)  
✅ **Local Game Achievements**  
✅ **User Profiles**  
✅ **Friend System**  
✅ **Party System**  
✅ **Basic Leaderboard** (queries Firestore directly)  
✅ **Chat System**  
✅ **Settings & Preferences**  

---

## Cost Considerations (Blaze Plan)

### Firebase Blaze Plan Pricing

| Resource | Price | Typical Usage |
|----------|-------|---------------|
| **Cloud Function invocations** | $0.40/million | ~50K-200K/month |
| **Compute time (GB-seconds)** | $0.0000025/GB-sec | ~$5-20/month |
| **Firestore reads** | $0.06/100K | ~$10-30/month |
| **Firestore writes** | $0.18/100K | ~$5-15/month |
| **Firestore deletes** | $0.02/100K | ~$1-5/month |
| **Realtime Database** | $5/GB/month | ~$5-10/month |

### Estimated Monthly Cost

| User Base | Estimated Cost |
|-----------|----------------|
| < 1,000 users | $10-30/month |
| 1,000-10,000 users | $30-100/month |
| 10,000-100,000 users | $100-500/month |

**Free tier includes:**
- 2 million Cloud Function invocations/month
- 400,000 GB-seconds compute time
- 50,000 Firestore reads/day
- 20,000 Firestore writes/day
- 20,000 Firestore deletes/day

---

## Recommendation

### Phase 1: Launch Without Cloud Functions (Current State)
- ✅ Hub is functional
- ✅ Games work and submit scores
- ⚠️ No anti-cheat (risk of fake scores)
- ⚠️ Leaderboards may be inaccurate
- ⚠️ No automated tournaments

### Phase 2: Upgrade to Blaze Plan (Recommended within 1-2 weeks)
Deploy Cloud Functions to enable:
- 🔒 Anti-cheat protection
- 📊 Accurate leaderboards
- 🏆 Working tournament system
- 📈 Analytics and reporting
- 🔔 User notifications

---

## How to Upgrade & Deploy

### Step 1: Upgrade to Blaze Plan
1. Go to: https://console.firebase.google.com/project/arcade-7f03c/usage/details
2. Click "Upgrade to Blaze plan"
3. Add billing information

### Step 2: Deploy Cloud Functions
```bash
cd "c:\Users\samue\Desktop\project\ideas testing games"
firebase deploy --only functions
```

### Step 3: Verify Deployment
```bash
firebase functions:list
```

---

## Conclusion

While the Arcade Hub **can function** without Cloud Functions, several **critical features** will be missing:

1. **Anti-cheat protection** - Most important for competitive integrity
2. **Leaderboard accuracy** - Stale data hurts user engagement
3. **Tournament system** - Completely broken without functions

**Recommendation:** Upgrade to Firebase Blaze plan and deploy Cloud Functions before public launch to ensure a complete, secure gaming experience.

---

*Document generated on February 21, 2026*
