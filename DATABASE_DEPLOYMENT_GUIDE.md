# Database Deployment Guide

This guide walks you through deploying the database configuration to Firebase.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. Project initialized: `firebase init` (already done)

## Step 1: Deploy Firestore Security Rules

The security rules control who can read/write data to your database.

```bash
# Navigate to the arcade-hub-next directory
cd arcade-hub-next

# Deploy only the Firestore rules
firebase deploy --only firestore:rules
```

**Verify deployment:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database > Rules
4. Confirm the rules match `firestore.rules`

## Step 2: Deploy Firestore Indexes

Indexes are required for complex queries (sorting + filtering).

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

**Note:** Index creation can take several minutes. You can monitor progress in the Firebase Console under Firestore Database > Indexes.

**Common Index Errors:**
If you see errors like:
```
The query requires an index. You can create it here: [...]
```

The index will be automatically created after deploying. If testing locally first, you can create indexes manually through the Firebase Console.

## Step 3: Verify Database Collections

After deployment, verify these collections exist:

### Required Collections (will be auto-created on first use):
- `users` - User profiles
- `userStats` - Best scores per user per game
- `scores` - All submitted scores
- `achievements` - Achievement definitions
- `userAchievements` - User achievement progress
- `challenges` - Active challenges
- `userChallenges` - User challenge progress
- `shopItems` - Shop item definitions
- `userInventory` - User purchased items
- `tournaments` - Tournament definitions
- `tournamentParticipants` - Tournament participants

## Step 4: Initialize Static Data

Some collections need initial data. Run these once after deployment:

### Initialize Achievements
The app will automatically create default achievements when first loaded, but you can also seed them:

```javascript
// In Firebase Console > Firestore, manually create these documents in 'achievements':

// Document ID: first-game
{
  name: "First Steps",
  description: "Play your first game",
  icon: "Gamepad2",
  maxProgress: 1,
  rarity: "common",
  xpReward: 25,
  coinReward: 10
}

// Document ID: score-1000
{
  name: "Score Hunter",
  description: "Score 1,000 points in any game",
  icon: "Trophy",
  maxProgress: 1000,
  rarity: "common",
  xpReward: 50,
  coinReward: 25
}

// [Create remaining achievements as defined in achievements.ts]
```

### Initialize Shop Items
Similarly, create shop items in the `shopItems` collection:

```javascript
// Document ID: avatar-cyber
{
  name: "Cyber Avatar",
  description: "A futuristic cyberpunk avatar",
  icon: "UserCircle",
  price: 100,
  category: "avatar",
  rarity: "rare",
  active: true
}

// [Create remaining items as defined in shop.ts]
```

## Step 5: Test Database Integration

### Test 1: User Sign Up
1. Open the app
2. Sign up with Google
3. Check Firebase Console > Firestore > `users` collection
4. Verify a document was created with your user ID

### Test 2: Leaderboard Query
1. Open the Leaderboard page
2. Check browser console for errors
3. Verify no "index required" errors appear

### Test 3: Score Submission (requires game integration)
1. Play a game that has the bridge script
2. Finish the game
3. Check `scores` collection for new document
4. Check `userStats` collection for updated best score

## Troubleshooting

### Issue: "Missing or insufficient permissions"
**Cause:** Security rules not deployed or user not authenticated
**Fix:**
```bash
firebase deploy --only firestore:rules
```

### Issue: "The query requires an index"
**Cause:** Composite index not created yet
**Fix:**
1. Deploy indexes: `firebase deploy --only firestore:indexes`
2. Wait for index creation (check Firebase Console)

### Issue: "Firebase not initialized"
**Cause:** Environment variables missing
**Fix:** Check `.env.local` has all Firebase config values

## Environment Variables

Ensure these are set in your environment:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Monitoring

After deployment, monitor these metrics in Firebase Console:

1. **Firestore Usage** - Track reads/writes
2. **Security Rules** - Check for rule violations
3. **Indexes** - Verify all indexes are active
4. **Rules Playground** - Test rule scenarios

## Rollback Plan

If issues occur after deployment:

1. **Revert Rules:**
   ```bash
   git checkout HEAD~1 firestore.rules
   firebase deploy --only firestore:rules
   ```

2. **View Previous Rules:**
   - Firebase Console > Firestore > Rules > History

3. **Emergency Disable Writes:**
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read: if true;
         allow write: if false;
       }
     }
   }
   ```

## Next Steps

After database deployment:
1. [Integrate games with the bridge script](./GAME_INTEGRATION.md)
2. [Set up automated backups](#)
3. [Configure monitoring alerts](#)

---

For support, contact the development team.
