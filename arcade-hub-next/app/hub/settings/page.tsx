'use client';

import { useState, useEffect } from 'react';
import { Volume2, Music, Bell, Moon, Monitor, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';

interface SettingItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  type: 'toggle' | 'button';
}

const SETTINGS: SettingItem[] = [
  {
    id: 'sound',
    label: 'Sound Effects',
    description: 'Play sounds for game actions',
    icon: Volume2,
    type: 'toggle',
  },
  {
    id: 'music',
    label: 'Background Music',
    description: 'Play music in games',
    icon: Music,
    type: 'toggle',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Show achievement popups and alerts',
    icon: Bell,
    type: 'toggle',
  },
  {
    id: 'darkmode',
    label: 'Dark Mode',
    description: 'Always use dark theme',
    icon: Moon,
    type: 'toggle',
  },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 transition-colors focus:outline-none',
        checked ? 'bg-accent' : 'bg-elevated border border-white/[0.08]'
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 w-4 h-4 bg-primary transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, signOut, updateProfile } = useAuth();
  const [settings, setSettings] = useState<Record<string, boolean>>({
    sound: true,
    music: true,
    notifications: true,
    darkmode: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('arcade_hub_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        // Invalid settings
      }
    }
    
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  const handleToggle = (id: string, value: boolean) => {
    const newSettings = { ...settings, [id]: value };
    setSettings(newSettings);
    
    // Save to localStorage
    localStorage.setItem('arcade_hub_settings', JSON.stringify(newSettings));
    
    // Apply dark mode immediately
    if (id === 'darkmode') {
      document.documentElement.classList.toggle('dark', value);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    
    setIsLoading(true);
    try {
      await updateProfile?.(displayName.trim());
      setShowEditProfile(false);
    } catch (error) {
      alert('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Customize your arcade experience
        </p>
      </div>

      {/* Preferences Section */}
      <section className="bg-elevated border border-white/[0.06]">
        <div className="px-4 py-3 border-b border-white/[0.05]">
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Preferences
          </h2>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {SETTINGS.map((setting) => {
            const Icon = setting.icon;
            return (
              <div key={setting.id} className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-surface border border-white/[0.08] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary text-sm">{setting.label}</h3>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                </div>
                {setting.type === 'toggle' && (
                  <Toggle
                    checked={settings[setting.id] ?? true}
                    onChange={(value) => handleToggle(setting.id, value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Account Section */}
      <section className="bg-elevated border border-white/[0.06]">
        <div className="px-4 py-3 border-b border-white/[0.05]">
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Account
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Profile Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-surface border border-white/[0.08] flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-primary text-sm">Display Name</h3>
                <p className="text-xs text-muted-foreground">{user?.displayName || 'Not set'}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowEditProfile(!showEditProfile)}>
              {showEditProfile ? 'Cancel' : 'Edit'}
            </Button>
          </div>
          
          {/* Edit Profile Form */}
          {showEditProfile && (
            <div className="pl-14 space-y-3">
              <Input
                placeholder="Enter display name..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={20}
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSaveProfile}
                  disabled={isLoading || !displayName.trim()}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-danger/5 border border-danger/20">
        <div className="px-4 py-3 border-b border-danger/10">
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-danger">
            Danger Zone
          </h2>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-danger/10 border border-danger/20 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="font-medium text-primary text-sm">Sign Out</h3>
                <p className="text-xs text-muted-foreground">Sign out of your account</p>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </section>

      {/* Version */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        Arcade Hub v1.0.0
      </div>
    </div>
  );
}
