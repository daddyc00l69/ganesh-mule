import React from 'react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterBarProps {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  options,
  selectedValue,
  onSelect,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none', className)}>
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-control transition-all cursor-pointer whitespace-nowrap select-none',
              isSelected
                ? 'glass-primary font-semibold'
                : 'glass-control text-muted-foreground hover:text-foreground hover:bg-white/10 dark:hover:bg-white/10'
            )}
          >
            <span>{option.label}</span>
            {typeof option.count === 'number' && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full',
                  isSelected
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted/80 text-muted-foreground'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
