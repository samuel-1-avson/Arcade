# Phase 1 - Quick Reference Card

Keep this open while working!

---

## 🔥 Emergency Commands

```bash
# Revert all changes (emergency only)
git checkout HEAD -- .

# Reset to last commit (emergency only)
git reset --hard HEAD

# Check git status
git status

# View recent commits
git log --oneline -5
```

---

## 🔒 Security Rules Deployment

```bash
# Test rules locally
firebase emulators:start

# Deploy rules (staging)
firebase deploy --only firestore:rules --project=staging

# Deploy rules (production)
firebase deploy --only firestore:rules
```

**Test in Console:**
```javascript
// Should ALLOW
firebase.firestore().collection('publicProfiles').doc('test').get();

// Should DENY
firebase.firestore().collection('users').doc('other-user').get();
```

---

## 📝 Environment Setup

```bash
# 1. Create local env file
copy .env.example .env.local

# 2. Edit .env.local with your values
# 3. Add to .gitignore (IMPORTANT!)
echo .env.local >> .gitignore

# 4. Test build
npm run build:dev
```

---

## 🐛 Bug Fix Locations

### Duplicate Function Call
```
File: js/app.js
Line: ~173-174
Action: Remove second this.setupLeaderboards()
```

### Memory Leak Fix
```
File: js/app.js
Method: openDMChat()
Action: Add cleanup for this.dmUnsubscribe
```

### Input Sanitization
```
File: js/utils/sanitize.js (already created!)
Usage: import { sanitizeHTML } from './utils/sanitize.js'
```

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run security tests only
npm test -- tests/security/

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch
```

---

## 🔍 Debugging Checklist

App not working? Check these:

- [ ] Console errors? (F12 → Console)
- [ ] Network requests failing? (F12 → Network)
- [ ] Firebase rules blocking requests?
- [ ] Environment variables loaded?
- [ ] Correct branch checked out? (`git branch`)
- [ ] All dependencies installed? (`npm install`)

---

## 📊 Progress Tracker

Update this as you complete tasks:

### Day 1-2: Firestore Rules
- [ ] Backup current rules
- [ ] Write secure rules
- [ ] Test in emulator
- [ ] Deploy to staging
- [ ] Deploy to production

### Day 3-4: Environment
- [ ] Create .env.local
- [ ] Update firebase-config.js
- [ ] Test build
- [ ] Document setup

### Day 5-7: Bug Fixes
- [ ] Remove duplicate setupLeaderboards()
- [ ] Fix memory leaks
- [ ] Add input sanitization
- [ ] Test all fixes

### Day 8-10: Testing & Deploy
- [ ] Security tests passing
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Documentation complete

---

## 🆘 Common Issues

### "Permission denied" errors
**Cause:** New security rules too restrictive
**Fix:** Check rule logic, ensure publicProfiles collection exists

### "Module not found" errors
**Cause:** Import path incorrect
**Fix:** Check relative paths, ensure file exists

### Environment variables not loading
**Cause:** .env.local not in correct location
**Fix:** Ensure file is in project root, restart dev server

### Tests failing
**Cause:** Dependencies not installed
**Fix:** Run `npm install`

---

## 📞 Escalation Path

1. **Check documentation** (this file, START_HERE.md)
2. **Search error message** in project files
3. **Check Firebase status** (status.firebase.google.com)
4. **Ask team lead** (for blockers >1 hour)
5. **Rollback if needed** (`git checkout main`)

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] No console errors
- [ ] Security rules tested
- [ ] Environment variables set
- [ ] Documentation updated
- [ ] Rollback plan ready
- [ ] Team notified

---

## 🎉 Completion

When Phase 1 is done:

1. Merge branch: `git checkout main && git merge phase1/security-hardening`
2. Tag release: `git tag -a v1.5.1 -m "Security hardening Phase 1"`
3. Push tags: `git push origin --tags`
4. Update project board
5. Schedule Phase 2 kickoff

**Great job! 🚀**
