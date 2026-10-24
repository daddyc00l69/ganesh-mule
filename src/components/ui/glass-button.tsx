import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs rounded-control gap-1.5',
      md: 'h-10 px-4 text-sm rounded-control gap-2',
      lg: 'h-12 px-6 text-base rounded-control gap-2.5',
      icon: 'h-9 w-9 p-0 rounded-control justify-center',
    }[size];

    const variantClasses = {
      primary:
        'glass-primary font-medium hover:brightness-110 active:scale-[0.99] transition-all',
      secondary:
        'glass-control text-foreground font-medium hover:bg-white/10 dark:hover:bg-white/10 active:scale-[0.99] transition-all',
      outline:
        'border border-border/60 hover:bg-accent/40 text-foreground font-medium transition-all',
      ghost:
        'hover:bg-accent/30 text-foreground font-medium transition-colors',
      destructive:
        'bg-destructive/90 text-destructive-foreground hover:bg-destructive active:scale-[0.99] shadow-sm font-medium transition-all',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center select-none outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          sizeClasses,
          variantClasses,
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
