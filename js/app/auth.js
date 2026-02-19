/**
 * Authentication Module
 * Handles user authentication, sign-in, sign-out
 */

import { firebaseService } from '../engine/FirebaseService.js';
import { eventBus } from '../engine/EventBus.js';
import { publicProfileService } from '../services/PublicProfileService.js';

export class AuthManager {
    constructor(app) {
        this.app = app;
        this.authBtn = null;
        this.authModal = null;
        this.dropdownMenu = null;
    }

    init() {
        this.authBtn = document.getElementById('auth-btn');
        this.authModal = document.getElementById('auth-modal');
        this.dropdownMenu = document.getElementById('dropdown-menu');

        this.setupAuthButton();
        this.setupModalListeners();
        this.setupDropdown();
        this.initFirebase();
    }

    setupAuthButton() {
        if (!this.authBtn) return;

        this.authBtn.addEventListener('click', () => {
            const user = firebaseService.getCurrentUser();
            if (user && !user.isAnonymous) {
                this.dropdownMenu?.classList.toggle('hidden');
            } else {
                this.authModal?.classList.remove('hidden');
            }
        });
    }

    setupModalListeners() {
        const modalClose = document.getElementById('modal-close');
        const backdrop = this.authModal?.querySelector('.modal-backdrop');
        const guestPlay = document.getElementById('guest-play');
        const googleSignin = document.getElementById('google-signin');

        modalClose?.addEventListener('click', () => this.hideModal());
        backdrop?.addEventListener('click', () => this.hideModal());

        guestPlay?.addEventListener('click', () => this.signInAsGuest());
        googleSignin?.addEventListener('click', () => this.signInWithGoogle());
    }

    setupDropdown() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.authBtn?.contains(e.target) && !this.dropdownMenu?.contains(e.target)) {
                this.dropdownMenu?.classList.add('hidden');
            }
        });

        // Sign out button
        const signOutBtn = document.getElementById('dropdown-signout');
        signOutBtn?.addEventListener('click', () => this.signOut());
    }

    async initFirebase() {
        firebaseService.onAuthStateChanged = (user) => {
            console.log('Auth state changed:', user?.email || 'Not signed in');
            this.updateUI(user);
        };

        const success = await firebaseService.init();
        if (success) {
            const currentUser = firebaseService.getCurrentUser();
            if (currentUser) {
                this.updateUI(currentUser);
            }
        }
    }

    async signInWithGoogle() {
        try {
            const user = await firebaseService.signInWithGoogle();
            this.hideModal();
            if (user) {
                console.log('Sign-in successful:', user.displayName);
                this.updateUI(user);
                
                // Migrate/create public profile
                await publicProfileService.init();
            }
        } catch (error) {
            console.error('Google sign-in failed:', error);
            if (error.code !== 'auth/popup-closed-by-user') {
                alert('Sign-in failed: ' + error.message);
            }
        }
    }

    async signInAsGuest() {
        this.hideModal();
        try {
            await firebaseService.signInAnonymously();
        } catch (error) {
            console.warn('Anonymous sign-in failed:', error);
        }
    }

    async signOut() {
        try {
            await firebaseService.signOut();
            this.updateUI(null);
            this.dropdownMenu?.classList.add('hidden');
            eventBus.emit('userSignedOut');
        } catch (error) {
            console.error('Sign-out error:', error);
        }
    }

    hideModal() {
        this.authModal?.classList.add('hidden');
    }

    updateUI(user = null) {
        const authBtn = document.getElementById('auth-btn');
        const dropdownName = document.querySelector('.dropdown-name');
        const dropdownEmail = document.querySelector('.dropdown-email');
        const dropdownAvatar = document.querySelector('.dropdown-avatar');
        const signOutBtn = document.getElementById('dropdown-signout');

        if (!authBtn) return;

        if (user && !user.isAnonymous) {
            // Signed in with Google
            const displayName = user.displayName || 'User';
            const photoURL = user.photoURL;

            authBtn.innerHTML = `
                ${photoURL 
                    ? `<img src="${photoURL}" alt="avatar" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`
                    : '<span>👤</span>'
                }
                <span style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayName}</span>
                <span style="font-size: 0.6rem; margin-left: 4px;">▼</span>
            `;
            authBtn.title = 'Click for account options';
            authBtn.classList.add('signed-in');

            if (dropdownName) dropdownName.textContent = displayName;
            if (dropdownEmail) dropdownEmail.textContent = user.email || '';
            if (dropdownAvatar) {
                dropdownAvatar.innerHTML = photoURL 
                    ? `<img src="${photoURL}" alt="avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`
                    : '👤';
            }
            if (signOutBtn) signOutBtn.style.display = 'flex';

            eventBus.emit('userSignedIn', user);
        } else if (user && user.isAnonymous) {
            // Anonymous user
            authBtn.innerHTML = `
                <span>👤</span>
                <span>Guest</span>
            `;
            authBtn.title = 'Playing as guest - Click to sign in with Google';
            authBtn.classList.remove('signed-in');
            if (signOutBtn) signOutBtn.style.display = 'none';
        } else {
            // Not signed in
            authBtn.innerHTML = `
                <span>👤</span>
                <span>Sign In</span>
            `;
            authBtn.title = 'Sign in to save scores to leaderboard';
            authBtn.classList.remove('signed-in');
            this.dropdownMenu?.classList.add('hidden');
        }
    }
}

export default AuthManager;
