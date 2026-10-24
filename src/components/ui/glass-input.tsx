import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-foreground/85">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'glass-input w-full h-10 px-3.5 text-sm rounded-control text-foreground placeholder:text-muted-foreground/60 transition-all outline-none',
            'focus:ring-2 focus:ring-ring/40',
            error && 'ring-2 ring-destructive/60',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
