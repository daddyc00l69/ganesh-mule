import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassButton } from './glass-button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-between gap-4 py-3 text-xs', className)}>
      <span className="text-muted-foreground">
        Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
        <span className="font-medium text-foreground">{totalPages}</span>
      </span>

      <div className="flex items-center gap-1.5">
        <GlassButton
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </GlassButton>

        <GlassButton
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </GlassButton>
      </div>
    </div>
  );
};
