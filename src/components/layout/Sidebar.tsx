'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { usePicks } from '@/hooks/usePicks';
import {
  LayoutDashboard,
  Volleyball,
  Radio,
  BarChart3,
  User,
  Settings,
  LogOut,
  Zap,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    badge: null,
  },
  { 
    href: '/picks', 
    label: 'Picks', 
    icon: Volleyball,
    badge: null,
  },
  { 
    href: '/live', 
    label: 'Live', 
    icon: Radio,
    badge: 'LIVE',
    badgeVariant: 'success' as const,
  },
  { 
    href: '/stats', 
    label: 'Stats', 
    icon: BarChart3,
    badge: null,
  },
  { 
    href: '/profile', 
    label: 'Profile', 
    icon: User,
    badge: null,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { user, profile } = useUser();
  const { stats } = usePicks();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const username = profile?.username || user?.email?.split('@')[0] || 'User';
  const initial = username.charAt(0).toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-72 bg-surface border-r border-white/5 z-40">
      {/* Gradient Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary" />
      
      {/* Logo Section */}
      <div className="p-6 pt-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary-container font-black text-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
              K
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-tertiary rounded-full border-2 border-surface animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-['Space_Grotesk'] text-xl font-black italic tracking-tighter bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
              KCM PICKS
            </span>
            <span className="text-[10px] text-on-surface-variant -mt-0.5 flex items-center gap-1">
              <Zap size={10} className="text-tertiary" />
              {user ? 'Member Active' : 'Guest Mode'}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <div className="mb-4">
          <p className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant/50 mb-2">
            Menu
          </p>
        </div>
        
        {navItems.map((item) => {
          const active = isActive(item.href);
          const IconComponent = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group',
                active
                  ? 'bg-gradient-to-r from-primary/15 to-primary-container/10 text-primary border border-primary/20'
                  : 'text-on-surface-variant hover:bg-white/[0.03] hover:text-on-surface'
              )}
            >
              {/* Active Indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-primary-container rounded-r-full" />
              )}
              
              <IconComponent
                size={20}
                strokeWidth={active ? 2.5 : 2}
                className={cn(
                  'transition-all duration-200',
                  active ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
                )}
              />
              
              <span className={cn(
                'flex-1 font-semibold text-sm tracking-wide',
                active ? 'text-primary' : ''
              )}>
                {item.label}
              </span>
              
              {/* Badge */}
              {item.badge && (
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold',
                  item.badgeVariant === 'success'
                    ? 'bg-tertiary/15 text-tertiary'
                    : 'bg-primary/15 text-primary'
                )}>
                  {item.badge}
                </span>
              )}
              
              {/* Hover Arrow */}
              {!active && (
                <ChevronRight 
                  size={16} 
                  className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-on-surface-variant/50" 
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Stats Card */}
      {user && stats && (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
              Your Stats
            </span>
            <span className={cn('text-[10px] font-bold', stats.roi >= 0 ? 'text-tertiary' : 'text-error')}>
              {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}% ROI
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-black font-['Space_Grotesk'] text-primary">{stats.wins}</p>
              <p className="text-[9px] text-on-surface-variant">Wins</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black font-['Space_Grotesk'] text-error">{stats.losses}</p>
              <p className="text-[9px] text-on-surface-variant">Loss</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black font-['Space_Grotesk'] text-secondary">{stats.win_rate.toFixed(0)}%</p>
              <p className="text-[9px] text-on-surface-variant">Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className="px-4 py-4 border-t border-white/5 space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
            isActive('/settings')
              ? 'bg-primary/15 text-primary'
              : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
          )}
        >
          <Settings 
            size={18} 
            className={cn(
              'transition-transform duration-200 group-hover:scale-110',
              isActive('/settings') ? 'text-primary' : ''
            )} 
          />
          <span className="font-medium text-sm">Settings</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-error/70 hover:text-error hover:bg-error/5"
        >
          <LogOut 
            size={18} 
            className="transition-transform duration-200 group-hover:scale-110" 
          />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>

      {/* User Card */}
      <div className="p-4 border-t border-white/5">
        {user ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-high/50 border border-white/5 group hover:border-primary/20 transition-colors">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary-container font-bold text-sm">
                {initial}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-tertiary rounded-full border-2 border-surface-container-high/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{username}</p>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary text-[9px] font-bold uppercase">
                  Member
                </span>
              </div>
            </div>
            <Link href="/profile">
              <ChevronRight size={16} className="text-on-surface-variant/50 group-hover:text-primary transition-colors" />
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-high/50 border border-white/5 group hover:border-primary/20 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-sm">
              ?
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface">Sign In</p>
              <p className="text-[10px] text-on-surface-variant">Log in to track picks</p>
            </div>
            <ChevronRight size={16} className="text-on-surface-variant/50 group-hover:text-primary transition-colors" />
          </Link>
        )}
      </div>
    </aside>
  );
}