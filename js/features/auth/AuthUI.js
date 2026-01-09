/**
 * AuthUI - Authentication UI Component
 * Handles login modal, auth state display, and user authentication flows
 */

import { firebaseService } from '../engine/FirebaseService.js';
import { userAccountService } from '../services/UserAccountService.js';
import { globalStateManager, AVATAR_ICONS, AVATAR_OPTIONS } from '../services/GlobalStateManager.js';
import { eventBus } from '../engine/EventBus.js';
import { notificationService } from '../services/NotificationService.js';

/**
 * AuthUI manages all authentication-related UI interactions
 */
class AuthUI {
    constructor(arcadeHub) {
        this.hub = arcadeHub;
        this.authModal = null;
    }

    /**
     * Initialize auth UI components
     */
    setup() {
        this.authModal = document.getElementById('auth-modal');
        this.setupAuthButtons();
        this.setupEventListeners();
    }

    /**
     * Set up authentication button handlers
     */
    setupAuthButtons() {
        // Guest login button
        const guestBtn = document.getElementById('guest-login-btn');
        if (guestBtn) {
            guestBtn.addEventListener('click', async () => {
                guestBtn.disabled = true;
                guestBtn.textContent = 'Signing in...';
                try {
                    await firebaseService.signInAnonymously();
                    this.closeModal();
                } catch (e) {
                    console.error('Guest login failed:', e);
                    notificationService.showToast('Login failed. Please try again.', 'error');
                } finally {
                    guestBtn.disabled = false;
                    guestBtn.textContent = 'Play as Guest';
                }
            });
        }

        // Google login button
        const googleBtn = document.getElementById('google-login-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                googleBtn.disabled = true;
                googleBtn.textContent = 'Signing in...';
                try {
                    await firebaseService.signInWithGoogle();
                    this.closeModal();
                } catch (e) {
                    console.error('Google login failed:', e);
                    notificationService.showToast('Login failed. Please try again.', 'error');
                } finally {
                    googleBtn.disabled = false;
                    googleBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                    `;
                }
            });
        }

        // Close button
        const closeBtn = this.authModal?.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Sign out button
        const signOutBtn = document.getElementById('sign-out-btn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                try {
                    await firebaseService.signOut();
                } catch (e) {
                    console.error('Sign out failed:', e);
                }
            });
        }

        // Link to Google button (for anonymous users)
        const linkGoogleBtn = document.getElementById('link-google-btn');
        if (linkGoogleBtn) {
            linkGoogleBtn.addEventListener('click', async () => {
                try {
                    await userAccountService.linkToGoogle();
                    notificationService.showToast('Account linked successfully!', 'success');
                } catch (e) {
                    console.error('Link to Google failed:', e);
                    notificationService.showToast('Failed to link account.', 'error');
                }
            });
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for auth state changes
        eventBus.on('userSignedIn', ({ user }) => {
            this.updateUI(user);
        });

        eventBus.on('userSignedOut', () => {
            this.updateUI(null);
        });
    }

    /**
     * Open the auth modal
     */
    openModal() {
        if (this.authModal) {
            this.authModal.classList.add('open');
        }
    }

    /**
     * Close the auth modal
     */
    closeModal() {
        if (this.authModal) {
            this.authModal.classList.remove('open');
        }
    }

    /**
     * Update UI based on auth state
     * @param {Object|null} user - Firebase user object
     */
    updateUI(user) {
        const profile = globalStateManager.getProfile();
        const authStatus = document.querySelector('.auth-status');
        const userAvatar = document.querySelector('.user-avatar');
        const userName = document.querySelector('.user-name');
        const userLevel = document.querySelector('.user-level');
        const signOutBtn = document.getElementById('sign-out-btn');
        const linkGoogleBtn = document.getElementById('link-google-btn');
        
        if (user) {
            // User is signed in
            if (authStatus) authStatus.classList.add('signed-in');
            
            if (userAvatar) {
                const iconPath = AVATAR_ICONS[profile.avatar] || AVATAR_ICONS.gamepad;
                userAvatar.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        ${iconPath}
                    </svg>
                `;
            }
            
            if (userName) userName.textContent = profile.displayName || user.displayName || 'Player';
            if (userLevel) userLevel.textContent = `Level ${profile.level || 1}`;
            if (signOutBtn) signOutBtn.style.display = 'block';
            
            // Show link button for anonymous users
            if (linkGoogleBtn) {
                linkGoogleBtn.style.display = user.isAnonymous ? 'block' : 'none';
            }
        } else {
            // User is signed out
            if (authStatus) authStatus.classList.remove('signed-in');
            if (userAvatar) userAvatar.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
            `;
            if (userName) userName.textContent = 'Guest';
            if (userLevel) userLevel.textContent = 'Sign in to save';
            if (signOutBtn) signOutBtn.style.display = 'none';
            if (linkGoogleBtn) linkGoogleBtn.style.display = 'none';
        }
    }
}

export { AuthUI };
export default AuthUI;
