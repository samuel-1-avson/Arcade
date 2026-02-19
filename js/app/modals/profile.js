/**
 * Profile Modal Module
 * Handles profile editing and avatar selection
 */

import { globalStateManager, AVATAR_OPTIONS, AVATAR_ICONS } from '../../services/GlobalStateManager.js';
import { notificationService } from '../../services/NotificationService.js';

export class ProfileModalManager {
    constructor(app) {
        this.app = app;
        this.modal = null;
        this.saveBtn = null;
        this.cancelBtn = null;
        this.nameInput = null;
        this.avatarGrid = null;
        this.selectedAvatar = null;
    }

    init() {
        this.modal = document.getElementById('profile-modal');
        this.saveBtn = document.getElementById('save-profile-btn');
        this.cancelBtn = document.getElementById('cancel-profile-btn');
        this.nameInput = document.getElementById('edit-name-input');
        this.avatarGrid = document.getElementById('avatar-grid');

        this.setupListeners();
        this.populateAvatarGrid();
    }

    setupListeners() {
        // Edit profile button
        const editBtn = document.getElementById('edit-profile-btn');
        editBtn?.addEventListener('click', () => this.open());

        // Save button
        this.saveBtn?.addEventListener('click', () => this.save());

        // Cancel button
        this.cancelBtn?.addEventListener('click', () => this.close());

        // Close on backdrop click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal || e.target.classList.contains('modal-backdrop')) {
                this.close();
            }
        });
    }

    populateAvatarGrid() {
        if (!this.avatarGrid) return;

        const profile = globalStateManager.getProfile();
        this.selectedAvatar = profile.avatar;

        this.avatarGrid.innerHTML = AVATAR_OPTIONS.map(avatar => {
            const iconPath = AVATAR_ICONS[avatar] || '';
            return `
                <div class="avatar-option ${avatar === this.selectedAvatar ? 'selected' : ''}" data-avatar="${avatar}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        ${iconPath}
                    </svg>
                </div>
            `;
        }).join('');

        this.avatarGrid.addEventListener('click', (e) => {
            const option = e.target.closest('.avatar-option');
            if (option) {
                document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedAvatar = option.dataset.avatar;
            }
        });
    }

    open() {
        const profile = globalStateManager.getProfile();
        if (this.nameInput) this.nameInput.value = profile.displayName;
        this.selectedAvatar = profile.avatar;

        // Update selected avatar UI
        document.querySelectorAll('.avatar-option').forEach(o => {
            o.classList.toggle('selected', o.dataset.avatar === this.selectedAvatar);
        });

        this.modal?.classList.remove('hidden');
    }

    close() {
        this.modal?.classList.add('hidden');
    }

    save() {
        const newName = this.nameInput?.value.trim();
        if (newName) globalStateManager.setDisplayName(newName);
        if (this.selectedAvatar) globalStateManager.setAvatar(this.selectedAvatar);

        this.close();
        this.app.updateDashboard?.();
        notificationService.success('Profile updated!');
    }
}

export default ProfileModalManager;
