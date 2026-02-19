/**
 * Settings Modal Module
 * Handles user preferences and settings
 */

import { globalStateManager } from '../../services/GlobalStateManager.js';

export class SettingsModalManager {
    constructor(app) {
        this.app = app;
        this.modal = null;
        this.soundToggle = null;
        this.musicToggle = null;
        this.notificationsToggle = null;
        this.contrastToggle = null;
    }

    init() {
        this.modal = document.getElementById('settings-modal');
        this.soundToggle = document.getElementById('sound-toggle');
        this.musicToggle = document.getElementById('music-toggle');
        this.notificationsToggle = document.getElementById('notifications-toggle');
        this.contrastToggle = document.getElementById('contrast-toggle');

        this.setupListeners();
        this.loadPreferences();
    }

    setupListeners() {
        const closeBtn = document.getElementById('settings-close-btn');
        closeBtn?.addEventListener('click', () => this.close());

        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal || e.target.classList.contains('modal-backdrop')) {
                this.close();
            }
        });

        // Save on change
        this.soundToggle?.addEventListener('change', () => this.savePreferences());
        this.musicToggle?.addEventListener('change', () => this.savePreferences());
        this.notificationsToggle?.addEventListener('change', () => this.savePreferences());

        // High contrast mode
        this.contrastToggle?.addEventListener('change', () => {
            document.body.classList.toggle('high-contrast', this.contrastToggle.checked);
            this.savePreferences();
        });
    }

    loadPreferences() {
        const prefs = globalStateManager.getProfile().preferences;
        if (this.soundToggle) this.soundToggle.checked = prefs.soundEnabled;
        if (this.musicToggle) this.musicToggle.checked = prefs.musicEnabled;
        if (this.notificationsToggle) this.notificationsToggle.checked = prefs.notificationsEnabled;
    }

    savePreferences() {
        globalStateManager.setPreferences({
            soundEnabled: this.soundToggle?.checked ?? true,
            musicEnabled: this.musicToggle?.checked ?? true,
            notificationsEnabled: this.notificationsToggle?.checked ?? true
        });
    }

    close() {
        this.modal?.classList.add('hidden');
    }
}

export default SettingsModalManager;
