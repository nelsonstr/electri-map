"use client";

import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Loader2, AlertCircle, CheckCheck, Package } from 'lucide-react';
import type { IssueStatus } from '@/types/civic-issue';

interface StatusTrackerProps {
  currentStatus: IssueStatus;
  timestamps: {
    created_at: string;
    acknowledged_at?: string;
    started_at?: string;
    completed_at?: string;
    verified_at?: string;
    closed_at?: string;
  };
}

const statuses: { id: IssueStatus; label: string; icon: React.ElementType }[] = [
  { id: 'submitted', label: 'Submitted', icon: AlertCircle },
  { id: 'acknowledged', label: 'Acknowledged', icon: CheckCircle2 },
  { id: 'in_progress', label: 'In Progress', icon: Loader2 },
  { id: 'pending_parts', label: 'Pending Parts', icon: Package },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  { id: 'verified', label: 'Verified', icon: CheckCheck },
  { id: 'closed', label: 'Closed', icon: CheckCircle2 },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getStatusTime(status: IssueStatus, timestamps: StatusTrackerProps['timestamps']): string | null {
  switch (status) {
    case 'submitted':
      return formatDate(timestamps.created_at);
    case 'acknowledged':
      return timestamps.acknowledged_at ? formatDate(timestamps.acknowledged_at) : null;
    case 'in_progress':
    case 'pending_parts':
      return timestamps.started_at ? formatDate(timestamps.started_at) : null;
    case 'completed':
      return timestamps.completed_at ? formatDate(timestamps.completed_at) : null;
    case 'verified':
      return timestamps.verified_at ? formatDate(timestamps.verified_at) : null;
    case 'closed':
      return timestamps.closed_at ? formatDate(timestamps.closed_at) : null;
    default:
      return null;
  }
}

export function StatusTracker({ currentStatus, timestamps }: StatusTrackerProps) {
  const currentIndex = statuses.findIndex(s => s.id === currentStatus);

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:flex items-center justify-between">
        {statuses.map((status, index) => {
          const Icon = status.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const time = getStatusTime(status.id, timestamps);
          const showStatus = index <= currentIndex || index <= 2; // Show first 3 and up to current

          if (!showStatus) return null;

          return (
            <div key={status.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                    isCompleted && 'bg-green-500 border-green-500 text-white',
                    isCurrent && 'bg-blue-500 border-blue-500 text-white',
                    !isCompleted && !isCurrent && 'bg-gray-100 border-gray-300 text-gray-400'
                  )}
                >
                  <Icon className={cn('h-5 w-5', status.id === 'in_progress' && isCurrent && 'animate-spin')} />
                </div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    'text-sm font-medium',
                    isCompleted && 'text-green-600',
                    isCurrent && 'text-blue-600',
                    !isCompleted && !isCurrent && 'text-gray-400'
                  )}>
                    {status.label}
                  </p>
                  {time && (
                    <p className="text-xs text-muted-foreground">{time}</p>
                  )}
                </div>
              </div>
              {index < statuses.length - 1 && index < currentIndex && (
                <div className="flex-1 h-0.5 bg-green-500 mx-2" />
              )}
              {index < statuses.length - 1 && index >= currentIndex && (
                <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {statuses.map((status, index) => {
          const Icon = status.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const time = getStatusTime(status.id, timestamps);

          if (index > currentIndex) return null;

          return (
            <div
              key={status.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                isCurrent && 'bg-blue-50 border border-blue-200',
                isCompleted && 'bg-green-50 border border-green-200'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-blue-500 text-white',
                  !isCompleted && !isCurrent && 'bg-gray-100 text-gray-400'
                )}
              >
                <Icon className={cn('h-4 w-4', status.id === 'in_progress' && isCurrent && 'animate-spin')} />
              </div>
              <div className="flex-1">
                <p className={cn(
                  'font-medium',
                  isCompleted && 'text-green-700',
                  isCurrent && 'text-blue-700'
                )}>
                  {status.label}
                  {isCurrent && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </p>
                {time && (
                  <p className="text-xs text-muted-foreground">{time}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: IssueStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<IssueStatus, { color: string; bg: string; label: string }> = {
    submitted: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Submitted' },
    acknowledged: { color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Acknowledged' },
    in_progress: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'In Progress' },
    pending_parts: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Pending Parts' },
    completed: { color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
    verified: { color: 'text-teal-600', bg: 'bg-teal-100', label: 'Verified' },
    closed: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Closed' },
  };

  const config = statusConfig[status];

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.bg,
      config.color
    )}>
      {config.label}
    </span>
  );
}
