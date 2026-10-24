import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'panel' | 'popover';
  hoverEffect?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'card', hoverEffect = false, children, ...props }, ref) => {
    const variantClass = {
      card: 'glass-card rounded-2xl',
      panel: 'glass-panel rounded-2xl',
      popover: 'glass-popover rounded-2xl',
    }[variant];

    return (
      <div
        ref={ref}
        className={cn(
          variantClass,
          'p-5 transition-all duration-200',
          hoverEffect && 'hover:translate-y-[-1px] hover:shadow-lg',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
