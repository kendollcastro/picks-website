'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';
import { usePicks } from '@/hooks/usePicks';
import {
  Search,
  ChevronLeft,
  Settings,
  X,
  Volleyball,
  TrendingUp,
  Users,
  BarChart3,
} from 'lucide-react';
import { NotificationsPanel } from './NotificationsPanel';

interface TopAppBarProps {
  showBack?: boolean;
  title?: string;
  showSearch?: boolean;
}

const quickLinks = [
  { href: '/picks', label: 'Picks', icon: Volleyball },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/live', label: 'Live', icon: TrendingUp },
  { href: '/leaderboard', label: 'Leaderboard', icon: Users },
];

export function TopAppBar({ showBack = false, title, showSearch = true }: TopAppBarProps) {
  const router = useRouter();
  const { user, profile } = useUser();
  const { stats } = usePicks();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(false);
      router.push(`/picks?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const username = profile?.username || user?.email?.split('@')[0] || 'User';
  const initial = username.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-72 z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-tertiary" />
      
      <div className="flex justify-between items-center px-4 sm:px-6 py-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <>
              <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors lg:hidden">
                <ChevronLeft size={22} className="text-on-surface-variant" />
              </Link>
              <h1 className="font-['Space_Grotesk'] tracking-tight font-bold bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent uppercase text-lg">
                {title || 'KCMPICKS'}
              </h1>
            </>
          ) : (
            <>
              {/* Mobile Logo */}
              <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-sm font-black text-on-primary-container">K</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-tertiary rounded-full border-2 border-surface" />
                </div>
                <div className="flex flex-col">
                  <span className="font-['Space_Grotesk'] text-lg font-black italic tracking-tighter bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                    KCM
                  </span>
                </div>
              </Link>
              
              {/* Desktop Title */}
              <div className="hidden lg:block">
                <h1 className="font-['Space_Grotesk'] text-xl font-bold tracking-tight">
                  {title || 'Dashboard'}
                </h1>
                <p className="text-xs text-on-surface-variant -mt-0.5">Welcome back</p>
              </div>
            </>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search with Results */}
          {showSearch && (
            <div className="relative" ref={searchRef}>
              {/* Desktop Search */}
              <form onSubmit={handleSearch} className="hidden md:flex items-center bg-surface-container-high rounded-xl px-4 py-2.5 border border-white/5 w-72 group focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <Search size={16} className="text-on-surface-variant/50 mr-3" />
                <input
                  type="text"
                  placeholder="Search picks, sports, players..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(e.target.value.length > 0);
                  }}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant/40 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="mr-1"
                  >
                    <X size={14} className="text-on-surface-variant/50" />
                  </button>
                )}
                <kbd className="hidden xl:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-surface-container-low px-1.5 font-mono text-[10px] font-medium text-on-surface-variant/50">
                  ⌘K
                </kbd>
              </form>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-high rounded-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
                  {/* Quick Links */}
                  <div className="p-2 border-b border-white/5">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-2 mb-1">Quick Links</p>
                    {quickLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <link.icon size={14} className="text-primary" />
                        <span className="text-sm">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Search Actions */}
                  <div className="p-2">
                    <button
                      onClick={handleSearch}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                    >
                      <Search size={14} />
                      <span className="text-sm">Search for &quot;{searchQuery}&quot;</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Icon Mobile */}
          {showSearch && (
            <button 
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high hover:bg-surface-variant transition-colors"
              onClick={() => router.push('/picks?search=')}
            >
              <Search size={18} className="text-on-surface-variant" />
            </button>
          )}

          {/* Quick Stats (Desktop) */}
          {user && stats && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-tertiary/10 border border-tertiary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              <span className={cn('text-xs font-bold', stats.roi >= 0 ? 'text-tertiary' : 'text-error')}>
                {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
              </span>
              <span className="text-xs text-on-surface-variant">ROI</span>
            </div>
          )}

          {/* Notifications */}
          <NotificationsPanel />

          {/* Settings (Desktop) */}
          <Link href="/settings" className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl bg-surface-container-high hover:bg-surface-variant transition-colors group">
            <Settings size={18} className="text-on-surface-variant group-hover:text-on-surface transition-colors" />
          </Link>

          {/* Profile (Desktop) */}
          {user && (
            <Link href="/profile" className="hidden lg:flex items-center gap-2 ml-1 pl-3 border-l border-white/5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/10">
                  <span className="text-xs font-bold text-on-primary-container">{initial}</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-tertiary rounded-full border-2 border-surface-container-high" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold">{username}</span>
                {stats && (
                  <span className={cn('text-[10px] font-bold', stats.roi >= 0 ? 'text-tertiary' : 'text-error')}>
                    {stats.total_profit >= 0 ? '+' : ''}${stats.total_profit.toFixed(0)}
                  </span>
                )}
              </div>
            </Link>
          )}
          
          {!user && (
            <Link href="/login" className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}