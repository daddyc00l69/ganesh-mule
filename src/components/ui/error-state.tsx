import React from 'react';
import { GlassCard } from './glass-card';
import { GlassButton } from './glass-button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}) => {
  return (
    <GlassCard
      variant="card"
      className={cn('text-center py-10 px-6 flex flex-col items-center justify-center border-destructive/20', className)}
    >
      <div className="p-3 rounded-2xl bg-destructive/10 text-destructive mb-3">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <GlassButton variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </GlassButton>
      )}
    </GlassCard>
  );
};
