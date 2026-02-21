'use client';

import { Volume2, Music, Bell, Moon, Monitor, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface SettingItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  type: 'toggle' | 'button';
  value?: boolean;
}

const SETTINGS: SettingItem[] = [
  {
    id: 'sound',
    label: 'Sound Effects',
    description: 'Play sounds for game actions',
    icon: Volume2,
    type: 'toggle',
    value: true,
  },
  {
    id: 'music',
    label: 'Background Music',
    description: 'Play music in games',
    icon: Music,
    type: 'toggle',
    value: true,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Show achievement popups and alerts',
    icon: Bell,
    type: 'toggle',
    value: true,
  },
  {
    id: 'darkmode',
    label: 'Dark Mode',
    description: 'Always use dark theme',
    icon: Moon,
    type: 'toggle',
    value: true,
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
  const { signOut } = useAuth();

  const handleToggle = (id: string, value: boolean) => {
    // TODO: Update user preferences
    console.log('Toggle:', id, value);
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
                    checked={setting.value || false}
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
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-surface border border-white/[0.08] flex items-center justify-center">
                <Monitor className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-primary text-sm">Profile</h3>
                <p className="text-xs text-muted-foreground">Edit your profile information</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </div>
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
