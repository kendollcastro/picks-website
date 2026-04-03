import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'glass-elevated' | 'bordered' | 'elevated';
  hover?: boolean;
  glow?: 'primary' | 'secondary' | 'tertiary';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', hover = false, glow, ...props }, ref) => {
    const variants = {
      default: 'bg-surface-container rounded-2xl border border-white/5',
      glass: 'glass-card rounded-2xl',
      'glass-elevated': 'glass-card-elevated rounded-2xl',
      bordered: 'bg-transparent rounded-2xl border border-white/10',
      elevated: 'bg-surface-container-high rounded-2xl shadow-xl shadow-black/20 border border-white/5',
    };

    const glowStyles = {
      primary: 'shadow-lg shadow-primary/20 border-primary/20 hover:shadow-primary/30',
      secondary: 'shadow-lg shadow-secondary/20 border-secondary/20 hover:shadow-secondary/30',
      tertiary: 'shadow-lg shadow-tertiary/20 border-tertiary/20 hover:shadow-tertiary/30',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          hover && 'transition-all duration-300 hover:border-white/15 hover:-translate-y-1 hover:shadow-xl cursor-pointer',
          glow && glowStyles[glow],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-bold leading-none tracking-tight font-["Space_Grotesk"]', className)}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-on-surface-variant', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
