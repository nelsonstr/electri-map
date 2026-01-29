"use client";

import { cn } from '@/lib/utils';
import { 
  Phone, 
  AlertTriangle, 
  Zap, 
  Droplets, 
  Trash2, 
  Lightbulb, 
  Footprints,
  Trees,
  Building2,
  Leaf,
  MoreHorizontal
} from 'lucide-react';
import type { IssueCategory } from '@/types/civic-issue';

const categoryConfig: Record<IssueCategory, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  telecommunications: {
    icon: Phone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    label: 'Telecommunications',
  },
  road_damage: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    label: 'Road Damage',
  },
  electrical: {
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    label: 'Electrical',
  },
  water_supply: {
    icon: Droplets,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900',
    label: 'Water Supply',
  },
  waste_management: {
    icon: Trash2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    label: 'Waste Management',
  },
  public_lighting: {
    icon: Lightbulb,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900',
    label: 'Public Lighting',
  },
  traffic_signals: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
    label: 'Traffic Signals',
  },
  sidewalks: {
    icon: Footprints,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    label: 'Sidewalks',
  },
  parks_recreation: {
    icon: Trees,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900',
    label: 'Parks & Recreation',
  },
  building_safety: {
    icon: Building2,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 dark:bg-slate-900',
    label: 'Building Safety',
  },
  environmental: {
    icon: Leaf,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-900',
    label: 'Environmental',
  },
  other: {
    icon: MoreHorizontal,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900',
    label: 'Other',
  },
};

interface CategorySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function CategorySelector({
  value,
  onValueChange,
  disabled = false,
  className,
  showLabel = false,
}: CategorySelectorProps) {
  const categories = Object.entries(categoryConfig) as [IssueCategory, typeof categoryConfig[IssueCategory]][];

  return (
    <div className={cn('space-y-3', className)}>
      {showLabel && (
        <label className="text-sm font-medium">Select Category</label>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map(([category, config]) => {
          const Icon = config.icon;
          const isSelected = value === category;
          
          return (
            <button
              key={category}
              type="button"
              onClick={() => onValueChange(category)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                'hover:border-primary/50 hover:bg-primary/5',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isSelected 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-card',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-pressed={isSelected}
              aria-label={config.label}
            >
              <div className={cn('p-2 rounded-full', config.bgColor)}>
                <Icon className={cn('h-5 w-5', config.color)} />
              </div>
              <span className={cn(
                'text-xs font-medium text-center',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}>
                {config.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface CategoryBadgeProps {
  category: IssueCategory;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function CategoryBadge({ 
  category, 
  size = 'md',
  showIcon = true 
}: CategoryBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      config.bgColor,
      config.color,
      sizeClasses[size]
    )}>
      {showIcon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />}
      {config.label}
    </span>
  );
}
