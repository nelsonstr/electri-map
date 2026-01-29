"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, Clock, AlertCircle, Loader2, MapPin, 
  Calendar, User, MessageSquare, ChevronDown, ChevronUp 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Service request status types based on support-system-architecture.md
export type RequestStatus = 
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'pending_parts'
  | 'scheduled'
  | 'completed'
  | 'verified'
  | 'closed'
  | 'cancelled';

export interface RequestTimestamps {
  created_at: string;
  acknowledged_at?: string;
  assigned_at?: string;
  in_progress_at?: string;
  scheduled_at?: string;
  pending_parts_at?: string;
  completed_at?: string;
  verified_at?: string;
  closed_at?: string;
  cancelled_at?: string;
}

export interface RequestCommunication {
  id: string;
  timestamp: string;
  type: 'system' | 'staff' | 'customer';
  direction?: 'inbound' | 'outbound';
  channel: 'email' | 'sms' | 'phone' | 'in_app' | 'portal';
  message: string;
  sender?: string;
}

export interface ServiceRequest {
  id: string;
  request_number?: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  priority: 'minor' | 'moderate' | 'major' | 'critical';
  status: RequestStatus;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  assigned_department?: string;
  assigned_team?: string;
  assigned_to?: string;
  estimated_completion?: string;
  sla_deadline?: string;
  timestamps: RequestTimestamps;
  communications?: RequestCommunication[];
}

// Status configuration
const statusConfig: Record<RequestStatus, { 
  label: string; 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
  description: string;
}> = {
  submitted: { 
    label: 'Submitted', 
    icon: AlertCircle, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Your request has been received and is waiting for review'
  },
  acknowledged: { 
    label: 'Acknowledged', 
    icon: CheckCircle2, 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    description: 'Your request has been reviewed and assigned'
  },
  in_progress: { 
    label: 'In Progress', 
    icon: Loader2, 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'Work is actively being done on your request'
  },
  pending_parts: { 
    label: 'Pending Parts', 
    icon: Clock, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Waiting for materials or equipment to arrive'
  },
  scheduled: { 
    label: 'Scheduled', 
    icon: Calendar, 
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    description: 'Work has been scheduled for a future date'
  },
  completed: { 
    label: 'Completed', 
    icon: CheckCircle2, 
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Work has been completed'
  },
  verified: { 
    label: 'Verified', 
    icon: CheckCircle2, 
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    description: 'Work has been verified as complete'
  },
  closed: { 
    label: 'Closed', 
    icon: CheckCircle2, 
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'This request has been closed'
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: AlertCircle, 
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'This request has been cancelled'
  },
};

// Request lifecycle for progress visualization
const requestLifecycle: RequestStatus[] = [
  'submitted',
  'acknowledged',
  'in_progress',
  'completed',
  'verified',
  'closed',
];

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDateTime(dateString);
}

interface RequestStatusTrackerProps {
  request: ServiceRequest;
  showFullTimeline?: boolean;
  showCommunications?: boolean;
  onRefresh?: () => void;
}

export function RequestStatusTracker({ 
  request, 
  showFullTimeline = true,
  showCommunications = true,
  onRefresh 
}: RequestStatusTrackerProps) {
  const [expanded, setExpanded] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(request);
  const [loading, setLoading] = useState(false);

  // Poll for updates if not in final state
  useEffect(() => {
    if (['closed', 'cancelled', 'verified'].includes(currentRequest.status)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/service-requests/${currentRequest.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCurrentRequest(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch request status:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [currentRequest.id, currentRequest.status]);

  const currentStatusIndex = requestLifecycle.indexOf(currentRequest.status);
  
  // Handle cancelled or early statuses
  let displayLifecycle = requestLifecycle;
  if (currentRequest.status === 'cancelled') {
    displayLifecycle = ['submitted', 'cancelled'];
  } else if (['submitted', 'acknowledged'].includes(currentRequest.status)) {
    displayLifecycle = requestLifecycle.slice(0, 3);
  } else if (currentRequest.status === 'pending_parts') {
    displayLifecycle = requestLifecycle.slice(0, 4);
  } else if (currentRequest.status === 'scheduled') {
    displayLifecycle = requestLifecycle.slice(0, 5);
  }

  const currentIndex = displayLifecycle.indexOf(currentRequest.status);
  const config = statusConfig[currentRequest.status];

  const StatusIcon = config.icon;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {currentRequest.request_number && (
                <Badge variant="outline" className="font-mono">
                  {currentRequest.request_number}
                </Badge>
              )}
              <Badge className={cn(
                'text-sm px-3 py-1',
                config.bgColor,
                config.color
              )}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {config.label}
              </Badge>
            </div>
            <CardTitle className="text-xl">{currentRequest.title}</CardTitle>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <Loader2 className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Description */}
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm">{config.description}</p>
        </div>

        {/* Progress Timeline - Desktop */}
        {showFullTimeline && (
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              {displayLifecycle.map((status, index) => {
                const statusInfo = statusConfig[status];
                const StatusIconComponent = statusInfo.icon;
                const isCompleted = index < currentIndex || 
                  (currentRequest.status === 'cancelled' && status === 'submitted');
                const isCurrent = index === currentIndex;
                const isFuture = index > currentIndex;

                // Get timestamp for this status
                const timestampKey = `${status}_at` as keyof RequestTimestamps;
                const statusTimestamp = currentRequest.timestamps[timestampKey];

                return (
                  <div key={status} className="flex items-center flex-1 last:flex-none relative">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                          isCompleted && 'bg-green-500 border-green-500 text-white',
                          isCurrent && !isCompleted && 'bg-primary border-primary text-white animate-pulse',
                          isFuture && 'bg-muted border-muted-200 text-muted-400'
                        )}
                      >
                        <StatusIconComponent className={cn('h-5 w-5', status === 'in_progress' && isCurrent && 'animate-spin')} />
                      </div>
                      <div className="mt-3 text-center min-w-[100px]">
                        <p className={cn(
                          'text-sm font-medium',
                          isCompleted && 'text-green-600',
                          isCurrent && 'text-primary',
                          isFuture && 'text-muted-foreground'
                        )}>
                          {statusInfo.label}
                        </p>
                        {statusTimestamp && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(statusTimestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                    {index < displayLifecycle.length - 1 && (
                      <>
                        {isCompleted ? (
                          <div className="flex-1 h-1 bg-green-500 mx-2" />
                        ) : (
                          <div className="flex-1 h-1 bg-muted mx-2" />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Timeline - Mobile */}
        {showFullTimeline && (
          <div className="md:hidden space-y-3">
            {displayLifecycle.slice(0, currentIndex + 1).map((status, index) => {
              const statusInfo = statusConfig[status];
              const StatusIconComponent = statusInfo.icon;
              const isCurrent = index === currentIndex;
              const timestampKey = `${status}_at` as keyof RequestTimestamps;
              const statusTimestamp = currentRequest.timestamps[timestampKey];

              return (
                <div
                  key={status}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    isCurrent && 'bg-primary/10 border border-primary/20'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    isCurrent ? 'bg-primary text-white' : 'bg-green-500 text-white'
                  )}>
                    <StatusIconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={cn('font-medium', isCurrent && 'text-primary')}>
                      {statusInfo.label}
                    </p>
                    {statusTimestamp && (
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(statusTimestamp)}
                      </p>
                    )}
                  </div>
                  {isCurrent && (
                    <Badge variant="secondary" className="flex-shrink-0">Current</Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SLA Information */}
        {currentRequest.sla_deadline && !['closed', 'cancelled', 'verified'].includes(currentRequest.status) && (
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">SLA Target</p>
              <p className="text-xs text-muted-foreground">
                Expected completion by {formatDateTime(currentRequest.sla_deadline)}
              </p>
            </div>
            <Badge variant={new Date(currentRequest.sla_deadline) < new Date() ? 'destructive' : 'outline'}>
              {new Date(currentRequest.sla_deadline) < new Date() ? 'Overdue' : 'On Track'}
            </Badge>
          </div>
        )}

        {/* Location */}
        {currentRequest.location && (
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">
                {currentRequest.location.address || 
                  `${currentRequest.location.latitude.toFixed(6)}, ${currentRequest.location.longitude.toFixed(6)}`}
              </p>
            </div>
          </div>
        )}

        {/* Assignment Info */}
        {(currentRequest.assigned_department || currentRequest.assigned_to) && (
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Assigned To</p>
              <p className="text-sm text-muted-foreground">
                {currentRequest.assigned_department || 'Unknown Department'}
                {currentRequest.assigned_to && ` • ${currentRequest.assigned_to}`}
              </p>
            </div>
          </div>
        )}

        {/* Communications Toggle */}
        {showCommunications && currentRequest.communications && currentRequest.communications.length > 0 && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setExpanded(!expanded)}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Communication History ({currentRequest.communications.length})
              </span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {expanded && (
              <div className="mt-4 space-y-3">
                {currentRequest.communications.map((comm) => (
                  <div
                    key={comm.id}
                    className={cn(
                      'p-3 rounded-lg text-sm',
                      comm.type === 'system' && 'bg-muted/50',
                      comm.type === 'staff' && 'bg-blue-50 border border-blue-100',
                      comm.type === 'customer' && 'bg-green-50 border border-green-100'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {comm.channel}
                        </Badge>
                        {comm.sender && (
                          <span className="text-xs text-muted-foreground">
                            {comm.sender}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comm.timestamp)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{comm.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamps Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t text-sm">
          <div>
            <p className="text-muted-foreground">Submitted</p>
            <p className="font-medium">{formatDateTime(currentRequest.timestamps.created_at)}</p>
          </div>
          {currentRequest.timestamps.acknowledged_at && (
            <div>
              <p className="text-muted-foreground">Acknowledged</p>
              <p className="font-medium">{formatDateTime(currentRequest.timestamps.acknowledged_at)}</p>
            </div>
          )}
          {currentRequest.timestamps.completed_at && (
            <div>
              <p className="text-muted-foreground">Completed</p>
              <p className="font-medium">{formatDateTime(currentRequest.timestamps.completed_at)}</p>
            </div>
          )}
          {currentRequest.timestamps.closed_at && (
            <div>
              <p className="text-muted-foreground">Closed</p>
              <p className="font-medium">{formatDateTime(currentRequest.timestamps.closed_at)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RequestStatusTrackerSkeletonProps {
  showFullTimeline?: boolean;
}

export function RequestStatusTrackerSkeleton({ showFullTimeline = true }: RequestStatusTrackerSkeletonProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-7 w-3/4 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        
        {showFullTimeline && (
          <div className="hidden md:flex items-center justify-between gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-4 w-16 mt-3" />
              </div>
            ))}
          </div>
        )}

        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}
