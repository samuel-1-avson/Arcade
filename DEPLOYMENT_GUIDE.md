# 🚀 Deployment Guide - Arcade Hub Critical Fixes

> **Last Updated:** March 6, 2026  
> **Commit:** `2a4bde4` - refactor(functions): migrate Cloud Functions to Gen2 TypeScript

---

## ✅ What's Been Completed

### 1. Code Changes (Pushed to GitHub)
- ✅ Migrated Cloud Functions from Gen1 to Gen2
- ✅ Converted all functions from JavaScript to TypeScript
- ✅ Split monolithic 666-line file into 10 modular files
- ✅ Replaced 42 console.log statements with structured logger
- ✅ Secured Firebase credentials (removed from repo)
- ✅ Built TypeScript functions (output in `functions/lib/`)

### 2. Git Status
```
Branch: main
Commit: 2a4bde4
Status: Pushed to origin/main
```

---

## 🎯 Remaining Deployment Steps

### Step 1: Deploy Cloud Functions to Firebase

**Prerequisites:**
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in to Firebase (`firebase login`)

**Commands:**
```bash
# Navigate to project root
cd "C:\Users\samue\OneDrive\Desktop\project\ideas testing games"

# Deploy only functions
firebase deploy --only functions

# Or run the deploy script
deploy-phase1.bat
```

**What Gets Deployed:**
| Function | Type | Trigger |
|----------|------|---------|
| `onScoreSubmit` | Firestore | onDocumentCreated |
| `aggregateLeaderboards` | Scheduled | Every 15 minutes |
| `processAnalytics` | Firestore | onDocumentCreated |
| `dailyAnalyticsRollup` | Scheduled | Daily at midnight |
| `cleanupPresence` | Scheduled | Every 10 minutes |
| `startScheduledTournaments` | Scheduled | Every 5 minutes |
| `cleanupRateLimits` | Scheduled | Every hour |
| `onUserUpdate` | Firestore | onDocumentUpdated |
| `onUserCreate` | Firestore | onDocumentCreated |
| `healthCheck` | HTTP | On request |
| `sendTestNotification` | Callable | On call |

**Expected Output:**
```
✔  functions[onScoreSubmit(us-central1)]
✔  functions[aggregateLeaderboards(us-central1)]
✔  functions[processAnalytics(us-central1)]
...
✔  Deploy complete!
```

---

### Step 2: Vercel Deployment (Automatic)

**Status:** Vercel should auto-deploy on git push to `main` branch.

**Verify Deployment:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Check the latest deployment

**If Not Auto-Deployed:**
```bash
# Install Vercel CLI if needed
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

---

### Step 3: Verify Deployments

#### Check Firebase Functions:
```bash
# List all functions
firebase functions:list

# View logs
firebase functions:log

# Test health check
curl https://us-central1-<project-id>.cloudfunctions.net/healthCheck
```

#### Check Vercel Deployment:
1. Visit your Vercel URL
2. Test authentication
3. Test score submission
4. Check browser console for errors

---

## 🔧 Post-Deployment Configuration

### 1. Create `.env.local` File

**⚠️ IMPORTANT:** The `.env.local` file was removed from the repo for security. You must recreate it locally:

```bash
# Copy from example
cp .env.local.example .env.local

# Edit with your actual Firebase credentials
notepad .env.local
```

**Required Environment Variables:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all Firebase environment variables from above
5. Redeploy if necessary

---

## 📊 Deployment Checklist

| Task | Status | Command/Action |
|------|--------|----------------|
| Git commit pushed | ✅ Done | `git push origin main` |
| TypeScript built | ✅ Done | `cd functions && npm run build` |
| Firebase functions deploy | ⏳ Pending | `firebase deploy --only functions` |
| Vercel deploy | ⏳ Pending | Auto or `vercel --prod` |
| Environment variables set | ⏳ Pending | Vercel Dashboard |
| Smoke tests | ⏳ Pending | Manual testing |

---

## 🐛 Troubleshooting

### Firebase Deploy Fails

**Error: "functions.config() is deprecated"**
- ✅ Fixed: Now using environment variables

**Error: "Cannot find module"**
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

**Error: "Permission denied"**
```bash
firebase login
# Then retry deploy
```

### Vercel Build Fails

**Error: "Cannot find module '@/lib/logger'"**
- Check if `lib/logger.ts` exists in the repo
- Verify import paths are correct

**Error: "Firebase config missing"**
- Add environment variables in Vercel Dashboard
- Or add them to `.env.local` and commit (not recommended for sensitive values)

---

## 📈 Monitoring After Deployment

### Firebase Functions
```bash
# Watch logs in real-time
firebase functions:log --tail

# Check function health
firebase functions:log --only onScoreSubmit
```

### Vercel
- Check [Vercel Analytics](https://vercel.com/analytics)
- Monitor [Vercel Logs](https://vercel.com/dashboard)

---

## 📝 Summary of Changes

### Security Improvements
- 🔐 Removed exposed Firebase credentials from repository
- 🔐 Added `.env.local` to `.gitignore`
- 🔐 Updated Firestore rules (user read requires auth)

### Code Quality
- ✅ Migrated to Cloud Functions Gen2 (future-proof)
- ✅ Full TypeScript support on backend
- ✅ Modular architecture (10 files vs 1 monolithic)
- ✅ Production-safe logging (no console.log in prod)
- ✅ Comprehensive error handling

### Performance
- ⚡ Gen2 functions have better cold start
- ⚡ TypeScript compilation optimizations
- ⚡ Tree-shaking unused code

---

## 🆘 Need Help?

If deployment fails:

1. **Check Firebase Console:** https://console.firebase.google.com
2. **Check Vercel Dashboard:** https://vercel.com/dashboard
3. **Review logs:** Use commands above
4. **Rollback if needed:**
   ```bash
   # Firebase rollback
   firebase functions:delete onScoreSubmit
   firebase deploy --only functions
   
   # Git rollback
   git revert 2a4bde4
   git push origin main
   ```

---

*Generated on March 6, 2026*  
*For support, refer to the SYSTEM_ANALYSIS_REPORT_2026-03-06.md*
