'use client';

import { cn, type PickGradeResult } from '@/lib/utils';

interface GradeBadgeProps {
  grade: PickGradeResult;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function GradeBadge({ grade, showLabel = false, size = 'md' }: GradeBadgeProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'rounded-lg flex items-center justify-center font-["Space_Grotesk"] font-black border',
          sizeClasses[size],
          grade.color,
          grade.bg
        )}
      >
        {grade.grade}
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', grade.color)}>{grade.label}</span>
      )}
    </div>
  );
}
