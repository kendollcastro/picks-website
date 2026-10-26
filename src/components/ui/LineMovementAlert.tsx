'use client';

import { cn, type LineMovement } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LineMovementAlertProps {
  movement: LineMovement;
  className?: string;
  size?: 'sm' | 'md';
}

export function LineMovementAlert({ movement, className, size = 'sm' }: LineMovementAlertProps) {
  if (!movement.hasOpening) return null;

  const colors = {
    favor: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    against: 'bg-error/10 text-error border-error/20',
    none: 'bg-surface-container-high text-on-surface-variant border-white/10',
  };

  const icons = {
    favor: <TrendingUp size={size === 'sm' ? 12 : 14} />,
    against: <TrendingDown size={size === 'sm' ? 12 : 14} />,
    none: <Minus size={size === 'sm' ? 12 : 14} />,
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2 py-1 font-medium',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        colors[movement.direction],
        className
      )}
    >
      {icons[movement.direction]}
      <span>{movement.text}</span>
    </div>
  );
}
