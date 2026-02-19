# 🚀 Phase 1 Execution - START HERE

**Status:** Ready to Begin  
**Phase:** 1 - Security Hardening & Critical Fixes  
**Duration:** Weeks 1-2  
**Priority:** 🔴 CRITICAL

---

## ⚡ Immediate Action Items (Do These First)

### Step 1: Create a Feature Branch
```bash
git checkout -b phase1/security-hardening
```

### Step 2: Create Environment File (DO THIS NOW)
```bash
# Copy the example file
copy .env.example .env.local

# DO NOT commit .env.local to git!
echo .env.local >> .gitignore
```

### Step 3: Gather Firebase Credentials
Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → General → Your Apps → Web App

Copy these values to `.env.local`:
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

---

## 📋 Task Board - Week 1

### Day 1-2: Firebase Security Rules 🔴 CRITICAL

**File:** `firestore.rules`

**Tasks:**
- [ ] 1. Backup current rules: `firebase firestore:rules:history`
- [ ] 2. Review current rules against security audit
- [ ] 3. Implement secure rules (see below)
- [ ] 4. Test rules locally: `firebase emulators:start`
- [ ] 5. Deploy to staging first
- [ ] 6. Deploy to production

**Secure Rules Template:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Private user data - only owner can access
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      
      match /achievements/{achievementId} {
        allow read, write: if isOwner(userId);
      }
      
      match /gameStats/{gameId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    // Public profiles - anyone can read, only owner can write
    match /publicProfiles/{userId} {
      allow read: if true;
      allow create, update: if isOwner(userId) && 
        request.resource.data.keys().hasOnly([
          'displayName', 'avatar', 'level', 'title', 
          'totalAchievements', 'favoriteGame', 'lastSeen'
        ]);
      allow delete: if false;
    }
    
    // Scores - public read, authenticated write
    match /scores/{scoreId} {
      allow read: if true;
      allow create: if isSignedIn() && 
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.score is number &&
        request.resource.data.score >= 0;
      allow update, delete: if false;
    }
    
    // Leaderboards - read-only
    match /leaderboards/{gameId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Tournaments
    match /tournaments/{tournamentId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update: if isSignedIn() && 
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['participants', 'updatedAt']);
      allow delete: if false;
    }
    
    // Analytics - system only
    match /analytics/{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### Day 3-4: Environment Configuration 🔴 CRITICAL

**Files to Create:**
- [ ] `.env.example` (template) ✅ ALREADY CREATED
- [ ] `.env.local` (your actual values - NOT COMMITTED)
- [ ] `js/config/env.js` (config loader)

**Tasks:**
- [ ] 1. Move Firebase config from hardcoded to environment
- [ ] 2. Update `js/config/firebase-config.js` to use env
- [ ] 3. Update build process
- [ ] 4. Test with different environments
- [ ] 5. Document setup for team

**Code Changes:**
```javascript
// js/config/firebase-config.js - BEFORE
const firebaseConfig = {
  apiKey: "AIzaSyABC123...", // ❌ HARDCODED - REMOVE THIS
  // ...
};

// js/config/firebase-config.js - AFTER
import { config } from './env.js';

const firebaseConfig = config.firebase; // ✅ From environment
```

---

### Day 5-7: Critical Bug Fixes 🔴 HIGH

**Issues to Fix:**

#### Fix 1: Remove Duplicate Function Call
**File:** `js/app.js` (around line 173-174)
```javascript
// Find and remove duplicate:
this.setupLeaderboards(); // Keep this one
this.setupSettings();
this.setupShop();
this.setupTournaments();
this.setupTournamentsModal();
this.setupChallengesModal();
// REMOVE: this.setupLeaderboards(); // ❌ DUPLICATE
```

#### Fix 2: Memory Leaks in DM Modals
**File:** `js/app.js` - `openDMChat()` method
```javascript
// Add cleanup in close handler:
modal.querySelector('.dm-modal-close').addEventListener('click', () => {
    modal.remove();
    if (this.dmUnsubscribe) {
        this.dmUnsubscribe();  // ✅ CLEAN UP LISTENER
        this.dmUnsubscribe = null;
    }
});
```

#### Fix 3: Input Sanitization
**Create:** `js/utils/sanitize.js` ✅ ALREADY CREATED

**Update:** All chat inputs to use sanitization

---

## 🧪 Testing Checklist

Before deploying Phase 1:

- [ ] Security rules tested in emulator
- [ ] All authentication flows work
- [ ] Score submission still functions
- [ ] Leaderboards load correctly
- [ ] Chat messages sanitized
- [ ] No console errors
- [ ] Mobile responsive still works

---

## 📊 Progress Tracker

Copy this into a GitHub issue or project board:

```markdown
## Phase 1: Security Hardening

### Week 1
- [ ] Task 1.1.1: Firestore Security Rules
- [ ] Task 1.1.2: Data Migration Script
- [ ] Task 1.2.1: Environment Configuration
- [ ] Task 1.2.2: Build Pipeline
- [ ] Task 1.3.1: Fix Duplicate Function Calls
- [ ] Task 1.3.2: Fix Memory Leaks
- [ ] Task 1.3.3: Input Sanitization

### Week 2
- [ ] Task 1.4.1: Security Test Suite
- [ ] Task 1.4.2: Penetration Testing
- [ ] Task 1.5.1: Security Documentation
- [ ] Task 1.5.2: Production Deployment
```

---

## 🆘 Support Resources

### Documentation
- [Firebase Security Rules Reference](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Environment Variables in Web Apps](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Troubleshooting

**Problem:** Rules deployment fails  
**Solution:** Check syntax with `firebase firestore:rules:history`

**Problem:** Environment variables not loading  
**Solution:** Ensure `.env.local` is in project root, restart dev server

**Problem:** App breaks after changes  
**Solution:** Check browser console, revert to last commit: `git checkout HEAD -- .`

---

## ✅ Phase 1 Completion Criteria

- [ ] All security rules deployed and tested
- [ ] Environment variables configured
- [ ] No hardcoded secrets in codebase
- [ ] Security test suite passing
- [ ] Documentation updated
- [ ] Production deployment successful
- [ ] Team sign-off

---

## 🎯 Next Phase Preview

Once Phase 1 is complete, you'll move to **Phase 2: Architecture & Foundation**

Key tasks:
- Split app.js into modules
- Create component library
- Set up testing infrastructure
- Implement error handling

**Ready to begin? Start with Step 1 above!**

---

**Questions or blockers?** Document them in `docs/execution-phase1/BLOCKERS.md`
