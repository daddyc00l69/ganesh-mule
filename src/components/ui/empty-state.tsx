import React from 'react';
import { GlassCard } from './glass-card';
import { GlassButton } from './glass-button';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}) => {
  return (
    <GlassCard
      variant="card"
      className={cn('text-center py-12 px-6 flex flex-col items-center justify-center', className)}
    >
      <div className="glass-control p-4 rounded-2xl text-muted-foreground mb-4">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <GlassButton variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </GlassButton>
        </div>
      )}
    </GlassCard>
  );
};
