'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Volleyball,
  Radio,
  BarChart3,
  User,
  MoreHorizontal,
  Trophy,
  Settings,
} from 'lucide-react';

const mainNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/picks', label: 'Picks', icon: Volleyball },
  { href: '/live', label: 'Live', icon: Radio, badge: true },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: User },
];

const moreNavItems = [
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNavbar() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full z-50 lg:hidden bg-surface/95 backdrop-blur-xl border-t border-white/5">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-primary via-secondary to-tertiary opacity-50" />
        
        <div className="flex items-end justify-around px-2 pb-safe pt-2">
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            const IconComponent = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center transition-all duration-200 rounded-2xl px-4 py-2',
                  active 
                    ? 'text-primary' 
                    : 'text-on-surface-variant hover:text-on-surface'
                )}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-primary to-primary-container rounded-full" />
                )}
                
                <div className={cn(
                  'relative flex items-center justify-center transition-all duration-200',
                  active ? 'scale-110' : 'scale-100'
                )}>
                  <IconComponent
                    size={22}
                    strokeWidth={active ? 2.5 : 2}
                    fill={active ? 'currentColor' : 'none'}
                  />
                  
                  {/* Live badge */}
                  {item.badge && !active && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-tertiary rounded-full animate-pulse" />
                  )}
                  
                  {/* Active glow */}
                  {active && (
                    <div className="absolute inset-0 bg-primary/10 rounded-xl blur-xl" />
                  )}
                </div>
                
                <span className={cn(
                  'font-semibold text-[10px] mt-1.5 transition-colors',
                  active ? 'text-primary' : ''
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* More Menu Button */}
          <button
            onClick={() => setShowMore(true)}
            className="relative flex flex-col items-center justify-center transition-all duration-200 rounded-2xl px-4 py-2 text-on-surface-variant hover:text-on-surface"
          >
            <div className="relative flex items-center justify-center">
              <MoreHorizontal size={22} strokeWidth={2} />
            </div>
            <span className="font-semibold text-[10px] mt-1.5">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Bottom Sheet */}
      {showMore && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-surface border-t border-white/10 rounded-t-2xl p-4 animate-slide-up">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h3 className="font-['Space_Grotesk'] font-bold text-lg mb-4 px-2">More Options</h3>
            <div className="space-y-2">
              {moreNavItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      'flex items-center gap-4 px-4 py-4 rounded-xl transition-colors',
                      active 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-on-surface hover:bg-white/5'
                    )}
                  >
                    <IconComponent size={22} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
