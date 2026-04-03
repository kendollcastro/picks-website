'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';
import {
  User,
  Bell,
  Shield,
  Moon,
  Sun,
  Smartphone,
  Mail,
  Lock,
  LogOut,
  Check,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const sections: SettingsSection[] = [
  { id: 'profile', title: 'Profile', description: 'Manage your account details', icon: User },
  { id: 'notifications', title: 'Notifications', description: 'Configure alerts and updates', icon: Bell },
  { id: 'appearance', title: 'Appearance', description: 'Customize the app look', icon: Sun },
  { id: 'security', title: 'Security', description: 'Password and authentication', icon: Shield },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, refreshUser } = useUser();
  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState({
    picks: true,
    results: true,
    promotions: false,
    newsletter: true,
  });
  const [twoFactor, setTwoFactor] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [user, profile]);

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      if (profile) {
        const { error } = await supabase
          .from('profiles')
          .update({ username, updated_at: new Date().toISOString() })
          .eq('id', user?.id);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await refreshUser();
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setIsLoading(true);
    setMessage(null);

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setIsLoading(false);
      return;
    }

    if (passwords.new.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: unknown) {
      const err = error as { message?: string };
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notifications: JSON.stringify(notifications),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Notification preferences saved!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save notifications' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-on-surface-variant text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={cn(
          'p-3 rounded-xl text-sm font-medium flex items-center gap-2',
          message.type === 'success' ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' : 'bg-error/10 text-error border border-error/20'
        )}>
          {message.type === 'success' ? <Check size={16} /> : null}
          {message.text}
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-high rounded-2xl p-3 border border-white/5 space-y-1">
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                    activeSection === section.id
                      ? 'bg-primary/15 text-primary'
                      : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                  )}
                >
                  <IconComponent size={18} />
                  <span className="font-medium text-sm">{section.title}</span>
                </button>
              );
            })}
            
            <div className="border-t border-white/5 my-2 pt-2">
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-error/80 hover:bg-error/5 hover:text-error"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-surface-container-high rounded-2xl p-6 border border-white/5">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-['Space_Grotesk'] text-xl font-bold flex items-center gap-2">
                    <User size={20} className="text-primary" />
                    Profile Settings
                  </h2>
                  <p className="text-on-surface-variant text-sm mt-1">Update your personal information</p>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-black text-on-primary-container">
                      {username ? username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-tertiary rounded-full border-2 border-surface-container-high flex items-center justify-center">
                      <Check size={12} className="text-on-tertiary" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-on-surface-variant">Profile photo is managed by your auth provider</p>
                  </div>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Username</label>
                    <div className="flex items-center bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3">
                      <span className="text-on-surface-variant mr-2">@</span>
                      <input
                        className="bg-transparent border-none focus:ring-0 w-full text-on-surface"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Email</label>
                    <div className="flex items-center bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3">
                      <Mail size={16} className="text-on-surface-variant mr-3" />
                      <input
                        className="bg-transparent border-none focus:ring-0 w-full text-on-surface"
                        type="email"
                        value={email}
                        disabled
                        title="Email cannot be changed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-['Space_Grotesk'] text-xl font-bold flex items-center gap-2">
                    <Bell size={20} className="text-primary" />
                    Notification Settings
                  </h2>
                  <p className="text-on-surface-variant text-sm mt-1">Choose what updates you receive</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'picks', label: 'New AI Picks', desc: 'Get notified when new picks are available' },
                    { key: 'results', label: 'Pick Results', desc: 'Receive updates when your picks settle' },
                    { key: 'promotions', label: 'Promotions', desc: 'Special offers and bonus opportunities' },
                    { key: 'newsletter', label: 'Newsletter', desc: 'Weekly digest and insights' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/50 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                          <Bell size={18} className="text-on-surface-variant" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-[10px] text-on-surface-variant">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                        className={cn(
                          'w-12 h-7 rounded-full transition-colors relative',
                          notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-surface-container-highest'
                        )}
                      >
                        <div className={cn(
                          'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-md',
                          notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                        )} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-['Space_Grotesk'] text-xl font-bold flex items-center gap-2">
                    <Sun size={20} className="text-primary" />
                    Appearance Settings
                  </h2>
                  <p className="text-on-surface-variant text-sm mt-1">Customize how KCM Picks looks</p>
                </div>

                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3 block">Theme</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDarkMode(true)}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all text-left',
                          darkMode ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'
                        )}
                      >
                        <Moon size={24} className={cn('mb-2', darkMode ? 'text-primary' : 'text-on-surface-variant')} />
                        <p className="font-medium text-sm">Dark</p>
                        <p className="text-[10px] text-on-surface-variant">Easy on the eyes</p>
                      </button>
                      <button
                        onClick={() => setDarkMode(false)}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all text-left',
                          !darkMode ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'
                        )}
                      >
                        <Sun size={24} className={cn('mb-2', !darkMode ? 'text-primary' : 'text-on-surface-variant')} />
                        <p className="font-medium text-sm">Light</p>
                        <p className="text-[10px] text-on-surface-variant">Bright and clean</p>
                      </button>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2">Light theme coming soon</p>
                  </div>

                  {/* Compact Mode */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/50 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Smartphone size={20} className="text-on-surface-variant" />
                      <div>
                        <p className="font-medium text-sm">Compact Mode</p>
                        <p className="text-[10px] text-on-surface-variant">Show more content on screen</p>
                      </div>
                    </div>
                    <button className="w-12 h-7 rounded-full bg-surface-container-highest transition-colors relative">
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-['Space_Grotesk'] text-xl font-bold flex items-center gap-2">
                    <Shield size={20} className="text-primary" />
                    Security Settings
                  </h2>
                  <p className="text-on-surface-variant text-sm mt-1">Keep your account safe</p>
                </div>

                <div className="space-y-4">
                  {/* Change Password */}
                  <div className="p-4 rounded-xl bg-surface-container-low/50 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lock size={18} className="text-on-surface-variant" />
                        <p className="font-medium text-sm">Change Password</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="relative">
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          placeholder="Current password"
                          value={passwords.current}
                          onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                          className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-3 py-2 text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                        >
                          {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        placeholder="New password"
                        value={passwords.new}
                        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                        className="bg-surface-container-lowest border border-white/10 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                        className="bg-surface-container-lowest border border-white/10 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleChangePassword}
                        disabled={isLoading || !passwords.current || !passwords.new || !passwords.confirm}
                        className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        Update Password
                      </button>
                    </div>
                  </div>

                  {/* Two Factor - placeholder for now */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/50 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                        <Shield size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Two-Factor Authentication</p>
                        <p className="text-[10px] text-on-surface-variant">Add an extra layer of security</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTwoFactor(!twoFactor)}
                      className={cn(
                        'w-12 h-7 rounded-full transition-colors relative',
                        twoFactor ? 'bg-primary' : 'bg-surface-container-highest'
                      )}
                    >
                      <div className={cn(
                        'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-md',
                        twoFactor ? 'translate-x-6' : 'translate-x-1'
                      )} />
                    </button>
                  </div>

                  {/* Active Sessions */}
                  <div className="p-4 rounded-xl bg-surface-container-low/50 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-sm">Active Sessions</p>
                      <button className="text-xs text-error font-medium">Sign out all</button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-white/5">
                        <div className="flex items-center gap-3">
                          <Smartphone size={16} className="text-on-surface-variant" />
                          <div>
                            <p className="text-xs font-medium">Current Device</p>
                            <p className="text-[10px] text-on-surface-variant">Active session</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-tertiary font-medium bg-tertiary/10 px-2 py-1 rounded">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}