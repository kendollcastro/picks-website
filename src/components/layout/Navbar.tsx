'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Bell,
  Menu,
  TrendingUp,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export function Navbar({ onMenuClick, sidebarCollapsed }: NavbarProps) {
  const [showSearch, setShowSearch] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const unreadCount = 2;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-background-secondary/80 backdrop-blur-xl border-b border-border z-30 transition-all duration-300',
        sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'
      )}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden flex items-center justify-center h-10 w-10 rounded-lg hover:bg-background-hover text-foreground-secondary"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={18} />
              <input
                type="text"
                placeholder="Search picks, sports, teams..."
                className="w-64 lg:w-80 h-10 pl-10 pr-4 rounded-lg bg-background-card border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-kcm-blue/50 focus:border-kcm-blue transition-all"
              />
            </div>
          </div>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg hover:bg-background-hover text-foreground-secondary"
          >
            <Search size={20} />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          <div className="hidden xl:flex items-center gap-4 px-4 py-2 rounded-lg bg-background-card border border-border">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-kcm-green" />
              <div>
                <p className="text-xs text-foreground-muted">Today</p>
                <p className="text-sm font-semibold text-kcm-green">+$125.00</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-kcm-green" />
              <div>
                <p className="text-xs text-foreground-muted">Win Rate</p>
                <p className="text-sm font-semibold text-foreground">62.5%</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-xs text-foreground-muted">Streak</p>
              <p className="text-sm font-semibold text-foreground">🔥 5W</p>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center justify-center h-10 w-10 rounded-lg hover:bg-background-hover text-foreground-secondary transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-kcm-red" />
              )}
            </button>

            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-12 w-80 rounded-xl bg-background-card border border-border shadow-2xl shadow-black/40 overflow-hidden"
              >
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {[
                    { title: 'Pick Won! 🎉', desc: 'Lakers -4.5 hit', time: '2m ago', type: 'win' },
                    { title: 'Game Starting', desc: 'Warriors vs Celtics in 30min', time: '28m ago', type: 'info' },
                    { title: 'Pick Lost', desc: 'Over 220.5 missed', time: '1h ago', type: 'loss' },
                  ].map((notif, i) => (
                    <div
                      key={i}
                      className="p-4 hover:bg-background-hover transition-colors cursor-pointer border-b border-border last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full mt-2',
                            notif.type === 'win' && 'bg-kcm-green',
                            notif.type === 'loss' && 'bg-kcm-red',
                            notif.type === 'info' && 'bg-kcm-blue'
                          )}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{notif.title}</p>
                          <p className="text-xs text-foreground-muted">{notif.desc}</p>
                          <p className="text-xs text-foreground-muted mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="w-full text-center text-sm text-kcm-blue hover:text-kcm-blue-light transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Profile */}
          <Link href="/profile">
            <Avatar
              size="default"
              alt="User"
              className="ring-2 ring-border hover:ring-kcm-blue transition-all cursor-pointer"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
