'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  href?: string;
  onClick?: () => void;
}

export function FloatingActionButton({ href = '/picks/new', onClick }: FloatingActionButtonProps) {
  const ButtonContent = (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 sm:right-6 lg:bottom-8 lg:right-8 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(0,102,255,0.4)] inner-glow active:scale-90 transition-transform z-40"
    >
      <Plus size={28} strokeWidth={3} />
    </button>
  );

  if (href) {
    return <Link href={href}>{ButtonContent}</Link>;
  }

  return ButtonContent;
}
