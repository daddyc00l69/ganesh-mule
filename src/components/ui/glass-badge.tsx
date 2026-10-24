import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'glass-control text-foreground/90 border border-border/40',
    success:
      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    warning:
      'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    destructive:
      'bg-destructive/15 text-destructive dark:text-destructive-foreground border border-destructive/30',
    info: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
    outline: 'border border-border/70 text-foreground/80',
  }[variant];

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 backdrop-blur-sm select-none transition-colors',
        sizeStyles,
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
