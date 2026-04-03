'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bell, X, Clock, Trophy, Sparkles } from 'lucide-react';

interface Notification {
  id: string;
  type: 'pick' | 'result' | 'alert' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  action?: string;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'pick',
    title: 'New AI Pick Available',
    message: 'Chiefs vs Eagles has a high-value pick with 82% confidence',
    time: '2 min ago',
    read: true,
    action: '/picks',
  },
  {
    id: '2',
    type: 'result',
    title: 'Pick Settled - WIN!',
    message: 'Your Lakers ML pick won +$125.00',
    time: '15 min ago',
    read: true,
    action: '/stats',
  },
  {
    id: '3',
    type: 'alert',
    title: 'Game Starting Soon',
    message: 'Lakers vs Warriors starts in 10 minutes',
    time: '1 hour ago',
    read: true,
  },
  {
    id: '4',
    type: 'pick',
    title: 'Hot Trend Detected',
    message: '76% of bets are on Celtics -4.5',
    time: '2 hours ago',
    read: true,
    action: '/live',
  },
  {
    id: '5',
    type: 'system',
    title: 'Welcome to KCM Picks!',
    message: 'Start by taking your first AI-powered pick',
    time: '1 day ago',
    read: true,
    action: '/picks',
  },
];

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.action) {
      router.push(notification.action);
      setIsOpen(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'pick': return Sparkles;
      case 'result': return Trophy;
      case 'alert': return Clock;
      case 'system': return Bell;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high hover:bg-surface-variant transition-colors relative group"
      >
        <Bell size={18} className="text-on-surface-variant group-hover:text-on-surface transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-error rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
        <span className="absolute inset-0 rounded-xl bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-surface-container-high rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <h3 className="font-['Space_Grotesk'] font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-error/15 text-error text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-primary font-medium hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center ml-2"
              >
                <X size={14} className="text-on-surface-variant" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-on-surface-variant/50 mb-2" />
                <p className="text-sm text-on-surface-variant">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const IconComponent = getIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors relative cursor-pointer group',
                      !notification.read && 'bg-primary/5'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Unread indicator */}
                    {!notification.read && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}

                    <div className="flex items-start gap-3 pl-3">
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                        notification.type === 'result' ? 'bg-tertiary/15 text-tertiary' :
                        notification.type === 'pick' ? 'bg-primary/15 text-primary' :
                        notification.type === 'alert' ? 'bg-kcm-orange/15 text-kcm-orange' :
                        'bg-surface-container-low text-on-surface-variant'
                      )}>
                        <IconComponent size={16} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={cn(
                              'text-sm font-semibold',
                              !notification.read ? 'text-on-surface' : 'text-on-surface-variant'
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <button
                            onClick={(e) => dismissNotification(e, notification.id)}
                            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <X size={12} className="text-on-surface-variant" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-on-surface-variant">
                            {notification.time}
                          </span>
                          {notification.action && (
                            <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                              View
                              <span className="text-[8px]">→</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
