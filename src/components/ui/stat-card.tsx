import React from 'react';
import { GlassCard } from './glass-card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number | string;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  className,
}) => {
  return (
    <GlassCard variant="card" className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </div>
        </div>
        {icon && (
          <div className="glass-control p-2.5 rounded-xl text-foreground/80 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {(change || description) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {change && (
            <div
              className={cn(
                'inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-md',
                change.trend === 'up' && 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400',
                change.trend === 'down' && 'text-rose-600 bg-rose-500/10 dark:text-rose-400',
                change.trend === 'neutral' && 'text-muted-foreground bg-muted/40'
              )}
            >
              {change.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
              {change.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
              {change.trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              <span>{change.value}</span>
            </div>
          )}
          {change?.label && (
            <span className="text-muted-foreground">{change.label}</span>
          )}
          {description && !change && (
            <span className="text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </GlassCard>
  );
};
