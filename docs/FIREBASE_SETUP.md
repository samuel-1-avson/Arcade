# 🔥 Firebase Setup Guide for Arcade Hub

This guide helps you set up Firebase for authentication and global leaderboards.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"**
3. Enter a project name (e.g., "arcade-hub")
4. Disable Google Analytics (optional for games)
5. Click **"Create Project"**

## Step 2: Enable Authentication

1. In Firebase Console, go to **Build → Authentication**
2. Click **"Get Started"**
3. Go to **Sign-in Method** tab
4. Enable **Google** sign-in:
   - Click Google
   - Toggle "Enable"
   - Add your email as support email
   - Click **Save**
5. Enable **Anonymous** sign-in (for guests):
   - Click Anonymous
   - Toggle "Enable"
   - Click **Save**

## Step 3: Create Firestore Database

1. Go to **Build → Firestore Database**
2. Click **"Create Database"**
3. Select **"Start in test mode"** (for development)
4. Choose a location close to your users
5. Click **Enable**

## Step 4: Get Your Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"**
3. Click the web icon `</>`
4. Register your app with a nickname
5. Copy the `firebaseConfig` object

## Step 5: Add Firebase SDK to Your Project

Add this to your `index.html` before the closing `</body>` tag:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
```

## Step 6: Update FirebaseService.js

Open `js/engine/FirebaseService.js` and replace the config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

## Step 7: Security Rules (Production)

When ready for production, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read scores, only authenticated users can write
    match /scores/{scoreId} {
      allow read: if true;
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.score is number;
    }
  }
}
```

## Step 8: Initialize in Your App

In `app.js`, add:

```javascript
import { firebaseService } from './engine/FirebaseService.js';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await firebaseService.init();
    
    // Update UI when auth state changes
    firebaseService.onAuthStateChanged = (user) => {
        if (user) {
            console.log('Signed in as:', user.displayName || 'Anonymous');
            // Update UI to show user info
        } else {
            console.log('Not signed in');
        }
    };
});
```

## Step 9: Add Sign-in Buttons

Update your auth modal handlers:

```javascript
// Google sign-in
document.getElementById('google-signin').addEventListener('click', async () => {
    try {
        await firebaseService.signInWithGoogle();
        modal.classList.add('hidden');
    } catch (error) {
        console.error('Sign-in failed:', error);
    }
});

// Guest play
document.getElementById('guest-play').addEventListener('click', async () => {
    await firebaseService.signInAnonymously();
    modal.classList.add('hidden');
});
```

## Step 10: Submit Scores

In your games, submit scores after game over:

```javascript
// In GameEngine.js or individual games
async gameOver(won) {
    // ... existing code ...
    
    // Submit to leaderboard
    if (this.score > 0) {
        try {
            await firebaseService.submitScore(this.gameId, this.score, {
                level: this.level,
                time: this.elapsedTime
            });
        } catch (e) {
            console.warn('Could not submit score:', e);
        }
    }
}
```

## Testing

1. Run your local server: `npx serve .`
2. Open the game in browser
3. Click "Sign In" and test Google login
4. Play a game and check Firebase Console → Firestore
5. You should see scores appearing in the `scores` collection!

## Troubleshooting

**"Firebase is not defined"**
- Make sure the SDK scripts are loaded before your JavaScript

**"Permission denied"**
- Check Firestore rules are in test mode
- Make sure user is authenticated

**"Invalid API key"**
- Double-check you copied the full config from Firebase Console

**Google sign-in popup blocked**
- Make sure you're testing from localhost or an authorized domain
- Add your domain to Firebase Console → Authentication → Settings → Authorized domains
