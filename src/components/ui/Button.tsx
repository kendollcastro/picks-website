import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 cursor-pointer relative overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-primary to-primary-container text-on-primary-container hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]',
        primary:
          'bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]',
        secondary:
          'bg-surface-container-high text-on-surface border border-white/10 hover:bg-surface-container-highest hover:border-white/15 active:scale-[0.98]',
        ghost:
          'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface active:scale-[0.98]',
        outline:
          'border border-white/10 text-on-surface hover:bg-surface-container-high hover:border-white/15 active:scale-[0.98]',
        danger:
          'bg-error text-on-error hover:bg-error/90 shadow-lg shadow-error/20 active:scale-[0.98]',
        success:
          'bg-tertiary text-on-tertiary hover:bg-tertiary/90 shadow-lg shadow-tertiary/20 active:scale-[0.98]',
        link:
          'text-primary underline-offset-4 hover:underline',
        premium:
          'bg-gradient-to-r from-primary via-secondary to-tertiary text-white shadow-xl shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]',
        glass:
          'bg-white/5 backdrop-blur-xl border border-white/10 text-on-surface hover:bg-white/10 hover:border-white/15 active:scale-[0.98]',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-13 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-11 w-11',
        'icon-sm': 'h-9 w-9',
        'icon-lg': 'h-13 w-13',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          <>
            {children}
            {/* Shimmer effect for premium buttons */}
            {variant === 'premium' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
