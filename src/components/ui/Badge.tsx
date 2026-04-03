import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-kcm-blue/20 text-kcm-blue',
        secondary: 'bg-foreground-muted/20 text-foreground-secondary',
        success: 'bg-kcm-green/20 text-kcm-green',
        danger: 'bg-kcm-red/20 text-kcm-red',
        warning: 'bg-kcm-yellow/20 text-kcm-yellow',
        purple: 'bg-kcm-purple/20 text-kcm-purple-light',
        outline: 'border border-border text-foreground-secondary',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.25 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
