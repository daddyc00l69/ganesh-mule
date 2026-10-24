import React from 'react';
import { GlassCard } from './glass-card';
import { cn } from '@/lib/utils';

export interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}) => {
  return (
    <GlassCard variant="card" className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className={cn('flex-1 w-full min-h-[260px]', contentClassName)}>
        {children}
      </div>
    </GlassCard>
  );
};
