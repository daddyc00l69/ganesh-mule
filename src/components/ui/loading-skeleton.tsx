import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  lines = 1,
  ...props
}) => {
  if (lines > 1) {
    return (
      <div className="space-y-2.5 w-full">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 rounded-control bg-muted/40 animate-pulse',
              i === lines - 1 && 'w-3/4',
              className
            )}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('h-8 w-full rounded-control bg-muted/40 animate-pulse', className)}
      {...props}
    />
  );
};
