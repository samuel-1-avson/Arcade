# Security Documentation

**Version:** 1.0  
**Last Updated:** February 20, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Security Measures Implemented](#security-measures-implemented)
3. [Authentication & Authorization](#authentication--authorization)
4. [Data Validation & Sanitization](#data-validation--sanitization)
5. [Rate Limiting](#rate-limiting)
6. [Firestore Security Rules](#firestore-security-rules)
7. [XSS Prevention](#xss-prevention)
8. [Best Practices](#best-practices)
9. [Incident Response](#incident-response)

---

## Overview

This document outlines the security measures implemented in the Arcade Gaming Hub platform. Security is a top priority, and multiple layers of protection have been implemented to safeguard user data and prevent abuse.

### Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Input        │ │ Rate         │ │ Error        │            │
│  │ Sanitization │ │ Limiting     │ │ Boundaries   │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                      FIREBASE SDK                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Auth         │ │ Security     │ │ Validation   │            │
│  │ State        │ │ Rules        │ │ Checks       │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                    CLOUD FUNCTIONS                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Anti-Cheat   │ │ Score        │ │ Server-Side  │            │
│  │ Validation   │ │ Verification │ │ Enforcement  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Measures Implemented

### 1. Input Sanitization ✅

All user inputs are sanitized to prevent XSS attacks and injection:

- **Chat Messages:** Sanitized with `sanitizeChatMessage()`
- **Display Names:** Validated with `sanitizeDisplayName()` - allows only alphanumeric, spaces, hyphens, and underscores (3-20 characters)
- **HTML Content:** Escaped with `sanitizeHTML()` using textContent assignment
- **URLs:** Validated to prevent `javascript:` and `data:` protocol injection

**Location:** `js/utils/sanitize.js`

### 2. Rate Limiting ✅

Client-side rate limiting prevents spam and abuse:

| Action | Limit | Window | Block Duration |
|--------|-------|--------|----------------|
| Chat Messages | 30 | 1 minute | 5 minutes |
| Score Submissions | 60 | 1 minute | 10 minutes |
| Friend Requests | 10 | 1 hour | 24 hours |
| Search | 20 | 1 minute | 5 minutes |
| Tournament Creation | 5 | 1 hour | 24 hours |
| Profile Updates | 10 | 1 minute | 5 minutes |

**Location:** `js/utils/rateLimiter.js`

### 3. Firestore Security Rules ✅

Comprehensive security rules with:

- **Ownership-based access:** Users can only read/write their own data
- **Public profile separation:** Private data separate from public profiles
- **Field validation:** Strict type and length checking
- **Key whitelisting:** Only allowed fields can be written
- **Display name validation:** Regex pattern matching for valid names

**Location:** `firestore.rules`

### 4. Transaction-Based Score Updates ✅

Score submissions use atomic transactions to prevent race conditions:

```javascript
// Uses Firestore transaction for atomic update
const result = await firebaseService.submitScoreWithTransaction(gameId, score, metadata);
// Returns: { scoreId, isNewBest, previousBest, newBest }
```

**Location:** `js/engine/FirebaseService.js`

### 5. Error Boundaries ✅

Global error handling prevents app crashes and logs errors:

- Catches unhandled errors and promise rejections
- Shows user-friendly error messages
- Reports to analytics (if configured)
- Prevents sensitive error details from leaking to users

**Location:** `js/components/ErrorBoundary.js`, `js/app/ArcadeHub.js`

---

## Authentication & Authorization

### Authentication Methods

1. **Google Sign-In** - OAuth 2.0
2. **Email/Password** - Firebase Auth
3. **Anonymous/Guest** - Limited functionality

### Authorization Model

```
┌──────────────────────────────────────────────────────────────┐
│                     AUTHORIZATION FLOW                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User Authenticates                                        │
│     └── Firebase Auth verifies identity                       │
│                                                               │
│  2. Request Made                                              │
│     └── request.auth.uid populated                            │
│                                                               │
│  3. Security Rules Check                                      │
│     ├── isOwner(userId) - User owns resource?                │
│     ├── isSignedIn() - User authenticated?                   │
│     └── Field validation - Data format correct?              │
│                                                               │
│  4. Access Granted/Denied                                     │
│     └── Based on rule evaluation                              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Data Access Matrix

| Collection | Create | Read | Update | Delete |
|------------|--------|------|--------|--------|
| users/{uid} | Owner | Owner | Owner | ❌ |
| publicProfiles/{uid} | Owner | Public | Owner | ❌ |
| scores/{id} | Signed In | Public | Cloud Functions Only | ❌ |
| leaderboards/{id} | Cloud Functions | Public | Cloud Functions | ❌ |
| friends/{id} | Participant | Participant | Participant | ❌ |
| parties/{id} | Signed In | Member | Member | Leader |
| messages/{id} | Member | Member | ❌ | ❌ |

---

## Data Validation & Sanitization

### Display Name Validation

**Pattern:** `^[a-zA-Z0-9 _-]+$`

**Requirements:**
- 3-20 characters
- Alphanumeric characters only
- Spaces, hyphens, and underscores allowed
- No HTML tags
- No special characters

**Example:**
```javascript
const isValid = isValidDisplayName('Player_One'); // ✅
const isValid = isValidDisplayName('<script>');   // ❌
```

### Score Validation

**Server-side validation in Cloud Functions:**
```javascript
const validationResult = antiCheat.validateScore({
    userId: scoreData.userId,
    gameId: scoreData.gameId,
    score: scoreData.score,
    sessionId: scoreData.sessionId,
    duration: scoreData.duration,
    checksum: scoreData.checksum
});
```

**Game-specific max scores:**
| Game | Max Score |
|------|-----------|
| Snake | 1,000,000 |
| 2048 | 10,000,000 |
| Breakout | 500,000 |
| Tetris | 5,000,000 |
| Minesweeper | 100,000 |
| Pac-Man | 2,000,000 |
| Asteroids | 1,000,000 |
| Tower Defense | 10,000,000 |
| Rhythm | 1,000,000 |
| Roguelike | 500,000 |
| Toon Shooter | 1,000,000 |

### Chat Message Validation

**Client-side:**
- Max length: 500 characters
- Control characters removed
- HTML entities escaped

**Server-side (Firestore Rules):**
```javascript
function isValidMessage() {
    return request.resource.data.text is string
        && request.resource.data.text.size() > 0
        && request.resource.data.text.size() <= 500
        && request.resource.data.from == request.auth.uid;
}
```

---

## Rate Limiting

### Implementation

Rate limiting is implemented on the client side to prevent spam:

```javascript
import { rateLimiter, RATE_LIMITS } from './utils/rateLimiter.js';

// Check if action is allowed
const status = rateLimiter.checkLimit('CHAT', {
    maxRequests: 30,
    windowMs: 60000
});

if (!status.allowed) {
    console.log(`Rate limited. Try again at ${status.resetTime}`);
}

// Execute with rate limiting
try {
    await rateLimiter.execute('CHAT', async () => {
        await sendMessage(text);
    }, RATE_LIMITS.CHAT);
} catch (error) {
    if (error.rateLimited) {
        showError(error.message);
    }
}
```

### Storage

Rate limit data is stored in `localStorage` to persist across sessions:
- Key: `arcadeHub_rateLimits`
- Format: JSON serialized action timestamps
- Auto-cleanup of expired entries

---

## Firestore Security Rules

### Key Security Features

#### 1. Ownership-Based Access
```javascript
function isOwner(userId) {
    return request.auth.uid == userId;
}

match /users/{userId} {
    allow read: if isOwner(userId);
    allow update: if isOwner(userId);
}
```

#### 2. Field Whitelisting
```javascript
allow create: if isOwner(userId) 
    && request.resource.data.keys().hasOnly([
        'displayName', 'avatar', 'level', 'title', ...
    ]);
```

#### 3. Type Validation
```javascript
function isValidScore() {
    return request.resource.data.score is number 
        && request.resource.data.score >= 0
        && request.resource.data.gameId is string;
}
```

#### 4. String Length Validation
```javascript
function isValidString(value, minLen, maxLen) {
    return value is string &&
        value.size() >= minLen &&
        value.size() <= maxLen;
}
```

### Deployment

To deploy the security rules:

```bash
firebase deploy --only firestore:rules
```

Or using the Firebase Console:
1. Go to Firebase Console → Firestore Database → Rules
2. Copy content from `firestore.rules`
3. Click "Publish"

---

## XSS Prevention

### Attack Vectors Protected Against

1. **Stored XSS**
   - All user-generated content sanitized before storage
   - Double-sanitization on retrieval (defense in depth)

2. **Reflected XSS**
   - URL parameters validated
   - No direct DOM insertion of user input

3. **DOM-based XSS**
   - `textContent` used instead of `innerHTML`
   - Safe element creation with `createSafeElement()`

### Sanitization Functions

```javascript
// HTML sanitization - converts to entities
sanitizeHTML('<script>alert("xss")</script>');
// Returns: &lt;script&gt;alert("xss")&lt;/script&gt;

// Display name sanitization
sanitizeDisplayName('<script>alert(1)</script>');
// Returns: 'Player' (removes invalid chars)

// Chat message sanitization
sanitizeChatMessage('Hello <b>world</b>');
// Returns: 'Hello world' (HTML tags removed)
```

---

## Best Practices

### For Developers

1. **Always sanitize user input** before displaying or storing
2. **Use rate limiting** for all user actions
3. **Validate data types** in Firestore rules
4. **Never trust client-side validation alone**
5. **Use parameterized queries** (Cloud Functions)
6. **Log security events** for audit trails
7. **Regular security reviews** of code and rules

### For Users

1. **Use strong passwords** for email accounts
2. **Enable 2FA** where available
3. **Report suspicious activity**
4. **Don't share account credentials**
5. **Be cautious of phishing attempts**

---

## Incident Response

### Security Incident Categories

| Severity | Examples | Response Time |
|----------|----------|---------------|
| Critical | Data breach, auth bypass | Immediate |
| High | Rate limit bypass, XSS | 24 hours |
| Medium | Spam, minor abuse | 72 hours |
| Low | UI issues, typos | Next release |

### Response Procedure

1. **Detect**
   - Monitor error logs
   - User reports
   - Automated alerts

2. **Assess**
   - Determine scope
   - Identify affected users
   - Classify severity

3. **Contain**
   - Disable affected features
   - Block malicious users
   - Update security rules

4. **Resolve**
   - Deploy fix
   - Verify resolution
   - Document incident

5. **Review**
   - Post-mortem analysis
   - Update security measures
   - Improve monitoring

### Contact

For security issues, contact: security@arcadehub.gg

---

## Security Checklist

### Pre-Deployment

- [ ] Firestore rules deployed and tested
- [ ] All inputs sanitized
- [ ] Rate limiting enabled
- [ ] Error boundaries active
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Sensitive data encrypted
- [ ] Logs configured

### Regular Maintenance

- [ ] Review security logs weekly
- [ ] Update dependencies monthly
- [ ] Audit user permissions quarterly
- [ ] Penetration testing annually
- [ ] Security training for team

---

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

---

**End of Security Documentation**
