/**
 * Enhanced Authentication Module
 * Handles email/password, Google, and guest authentication
 */

import { firebaseService } from '../engine/FirebaseService.js';
import { eventBus } from '../engine/EventBus.js';
import { publicProfileService } from '../services/PublicProfileService.js';
import { Modal } from '../components/Modal.js';
import { logger, LogCategory } from '../utils/logger.js';

export class AuthManager {
    constructor(app) {
        this.app = app;
        this.authBtn = null;
        this.authModal = null;
        this.dropdownMenu = null;
        this.currentTab = 'signin';
    }

    init() {
        this.authBtn = document.getElementById('auth-btn');
        this.authModal = document.getElementById('auth-modal');
        this.dropdownMenu = document.getElementById('dropdown-menu');

        this.setupAuthButton();
        this.setupModalListeners();
        this.setupDropdown();
        this.setupTabs();
        this.setupForms();
        this.setupPasswordToggle();
        this.initFirebase();
    }

    setupAuthButton() {
        if (!this.authBtn) return;

        this.authBtn.addEventListener('click', () => {
            const user = firebaseService.getCurrentUser();
            if (user && !user.isAnonymous) {
                this.dropdownMenu?.classList.toggle('hidden');
            } else {
                this.showModal();
            }
        });
    }

    setupModalListeners() {
        const modalClose = document.getElementById('modal-close');
        const backdrop = this.authModal?.querySelector('.auth-modal-backdrop');
        const guestPlay = document.getElementById('guest-play');
        const googleSignin = document.getElementById('google-signin');

        modalClose?.addEventListener('click', () => this.hideModal());
        backdrop?.addEventListener('click', () => this.hideModal());

        guestPlay?.addEventListener('click', () => this.signInAsGuest());
        googleSignin?.addEventListener('click', () => this.signInWithGoogle());

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.authModal?.classList.contains('hidden')) {
                this.hideModal();
            }
        });
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.auth-tab');
        const forms = document.querySelectorAll('.auth-form');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update tab states
                tabs.forEach(t => {
                    t.classList.toggle('active', t.dataset.tab === targetTab);
                    t.setAttribute('aria-selected', t.dataset.tab === targetTab);
                });

                // Update form visibility
                forms.forEach(form => {
                    form.classList.toggle('active', form.dataset.form === targetTab);
                });

                this.currentTab = targetTab;
                this.clearErrors();
            });
        });
    }

    setupForms() {
        // Sign In Form
        const signinForm = document.getElementById('signin-form');
        signinForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignIn();
        });

        // Sign Up Form
        const signupForm = document.getElementById('signup-form');
        signupForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignUp();
        });

        // Forgot password
        const forgotPassword = document.getElementById('forgot-password');
        forgotPassword?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });
    }

    setupPasswordToggle() {
        const toggles = document.querySelectorAll('.auth-password-toggle');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const input = toggle.parentElement.querySelector('input');
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                
                // Update icon
                toggle.innerHTML = isPassword 
                    ? `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                       </svg>`
                    : `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                       </svg>`;
            });
        });
    }

    async handleSignIn() {
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        const rememberMe = document.getElementById('remember-me')?.checked;

        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        this.setLoading(true);

        try {
            const user = await firebaseService.signInWithEmail(email, password);
            if (user) {
                this.hideModal();
                this.updateUI(user);
                await publicProfileService.init();
                
                // Set persistence based on remember me
                if (rememberMe) {
                    await firebaseService.setPersistence('local');
                }
            }
        } catch (error) {
            logger.error(LogCategory.AUTH, 'Sign-in error:', error);
            this.handleAuthError(error);
        } finally {
            this.setLoading(false);
        }
    }

    async handleSignUp() {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        if (!name || !email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        this.setLoading(true);

        try {
            const user = await firebaseService.signUpWithEmail(email, password, name);
            if (user) {
                this.hideModal();
                this.updateUI(user);
                await publicProfileService.init();
                
                // Show welcome message
                if (window.accessibilityManager) {
                    window.accessibilityManager.announce(`Welcome to Arcade Hub, ${name}!`);
                }
            }
        } catch (error) {
            logger.error(LogCategory.AUTH, 'Sign-up error:', error);
            this.handleAuthError(error);
        } finally {
            this.setLoading(false);
        }
    }

    async handleForgotPassword() {
        const email = document.getElementById('signin-email').value;
        
        if (!email) {
            this.showError('Please enter your email address first');
            document.getElementById('signin-email')?.focus();
            return;
        }

        try {
            await firebaseService.sendPasswordResetEmail(email);
            this.showSuccess(`Password reset email sent to ${email}`);
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    handleAuthError(error) {
        let message = 'An error occurred. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                message = 'Invalid email or password';
                break;
            case 'auth/email-already-in-use':
                message = 'An account with this email already exists';
                break;
            case 'auth/invalid-email':
                message = 'Please enter a valid email address';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak. Please use at least 6 characters';
                break;
            case 'auth/popup-closed-by-user':
                return; // Silent fail for popup closed
            case 'auth/unauthorized-domain':
                message = 'Google sign-in is not available on this domain. Please use email/password or continue as guest.';
                break;
            case 'auth/too-many-requests':
                message = 'Too many attempts. Please try again later.';
                break;
            default:
                message = error.message || message;
        }
        
        this.showError(message);
    }

    showError(message) {
        this.clearErrors();
        const form = document.querySelector(`.auth-form[data-form="${this.currentTab}"]`);
        if (!form) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error';
        errorDiv.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            ${message}
        `;
        form.insertBefore(errorDiv, form.firstChild);

        // Auto remove after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSuccess(message) {
        this.clearErrors();
        const form = document.querySelector(`.auth-form[data-form="${this.currentTab}"]`);
        if (!form) return;

        const successDiv = document.createElement('div');
        successDiv.className = 'auth-success';
        successDiv.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            ${message}
        `;
        form.insertBefore(successDiv, form.firstChild);

        setTimeout(() => successDiv.remove(), 5000);
    }

    clearErrors() {
        document.querySelectorAll('.auth-error, .auth-success').forEach(el => el.remove());
    }

    setLoading(loading) {
        const form = document.querySelector(`.auth-form[data-form="${this.currentTab}"]`);
        if (!form) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        const text = submitBtn.querySelector('.auth-btn-text');
        const loader = submitBtn.querySelector('.auth-btn-loader');

        submitBtn.disabled = loading;
        text?.classList.toggle('hidden', loading);
        loader?.classList.toggle('hidden', !loading);
    }

    showModal() {
        this.authModal?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = this.authModal?.querySelector('.auth-input');
            firstInput?.focus();
        }, 100);
    }

    hideModal() {
        this.authModal?.classList.add('hidden');
        document.body.style.overflow = '';
        this.clearErrors();
        
        // Reset forms
        document.querySelectorAll('.auth-form').forEach(form => form.reset());
    }

    async signInWithGoogle() {
        this.setLoading(true);
        try {
            const user = await firebaseService.signInWithGoogle();
            this.hideModal();
            if (user) {
                this.updateUI(user);
                await publicProfileService.init();
            }
        } catch (error) {
            this.handleAuthError(error);
        } finally {
            this.setLoading(false);
        }
    }

    async signInAsGuest() {
        this.hideModal();
        try {
            await firebaseService.signInAnonymously();
        } catch (error) {
            logger.warn(LogCategory.AUTH, 'Anonymous sign-in failed:', error);
        }
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

    async signOut() {
        try {
            await firebaseService.signOut();
            this.updateUI(null);
            this.dropdownMenu?.classList.add('hidden');
            eventBus.emit('userSignedOut');
        } catch (error) {
            logger.error(LogCategory.AUTH, 'Sign-out error:', error);
        }
    }

    async initFirebase() {
        firebaseService.onAuthStateChanged = (user) => {
            logger.info(LogCategory.AUTH, 'Auth state changed:', user?.email || 'Not signed in');
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

    updateUI(user = null) {
        const authBtn = document.getElementById('auth-btn');
        const dropdownName = document.querySelector('.dropdown-name');
        const dropdownEmail = document.querySelector('.dropdown-email');
        const dropdownAvatar = document.querySelector('.dropdown-avatar');
        const signOutBtn = document.getElementById('dropdown-signout');

        if (!authBtn) return;

        if (user && !user.isAnonymous) {
            // Signed in
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
            authBtn.title = 'Playing as guest - Click to sign in';
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
