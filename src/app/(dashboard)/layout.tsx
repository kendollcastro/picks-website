'use client';

import React from 'react';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNavbar } from '@/components/layout/BottomNavbar';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopAppBar />
      <main className="pt-20 pb-28 lg:pb-8 lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <BottomNavbar />
    </div>
  );
}
