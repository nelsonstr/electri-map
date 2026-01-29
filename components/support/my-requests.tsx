"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Filter, RefreshCw, ChevronRight, Calendar, 
  MapPin, Clock, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { RequestStatusTracker, ServiceRequest } from './request-status-tracker';

// Status badge configuration
const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  submitted: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Submitted' },
  acknowledged: { color: 'text-indigo-600', bgColor: 'bg-indigo-100', label: 'Acknowledged' },
  in_progress: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'In Progress' },
  pending_parts: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Pending Parts' },
  scheduled: { color: 'text-cyan-600', bgColor: 'bg-cyan-100', label: 'Scheduled' },
  completed: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Completed' },
  verified: { color: 'text-teal-600', bgColor: 'bg-teal-100', label: 'Verified' },
  closed: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Closed' },
  cancelled: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Cancelled' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  minor: { color: 'text-green-600', label: 'Minor' },
  moderate: { color: 'text-yellow-600', label: 'Moderate' },
  major: { color: 'text-orange-600', label: 'Major' },
  critical: { color: 'text-red-600', label: 'Critical' },
};

interface MyRequestsProps {
  customerId?: string;
  onRequestClick?: (request: ServiceRequest) => void;
}

export function MyRequests({ customerId, onRequestClick }: MyRequestsProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (customerId) params.append('customer_id', customerId);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/service-requests?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch requests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [customerId, statusFilter, priorityFilter, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter((request) => {
    if (dateFilter === 'today') {
      const today = new Date();
      const requestDate = new Date(request.timestamps.created_at);
      return requestDate.toDateString() === today.toDateString();
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(request.timestamps.created_at) >= weekAgo;
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(request.timestamps.created_at) >= monthAgo;
    }
    return true;
  });

  const pendingRequests = filteredRequests.filter(
    (r) => !['closed', 'cancelled', 'completed', 'verified'].includes(r.status)
  );
  const completedRequests = filteredRequests.filter(
    (r) => ['closed', 'cancelled', 'completed', 'verified'].includes(r.status)
  );

  if (selectedRequest) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedRequest(null)}>
          ← Back to Requests
        </Button>
        <RequestStatusTracker 
          request={selectedRequest} 
          showCommunications={true}
          onRefresh={() => {
            fetchRequests();
            const updated = requests.find(r => r.id === selectedRequest.id);
            if (updated) setSelectedRequest(updated);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchRequests}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="flex gap-4 mt-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed ({completedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No active requests</p>
                  <p className="text-muted-foreground">You don't have any requests in progress</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <RequestCard 
                    key={request.id} 
                    request={request} 
                    onClick={() => onRequestClick?.(request) || setSelectedRequest(request)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No completed requests</p>
                  <p className="text-muted-foreground">You don't have any completed requests yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {completedRequests.map((request) => (
                  <RequestCard 
                    key={request.id} 
                    request={request} 
                    onClick={() => onRequestClick?.(request) || setSelectedRequest(request)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

interface RequestCardProps {
  request: ServiceRequest;
  onClick: () => void;
}

function RequestCard({ request, onClick }: RequestCardProps) {
  const status = statusConfig[request.status] || statusConfig.submitted;
  const priority = priorityConfig[request.priority] || priorityConfig.moderate;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {request.request_number && (
                <Badge variant="outline" className="font-mono text-xs">
                  {request.request_number}
                </Badge>
              )}
              <Badge className={cn('text-xs', status.bgColor, status.color)}>
                {status.label}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', priority.color)}>
                {priority.label}
              </Badge>
            </div>
            <h3 className="font-medium truncate">{request.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {request.description}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground ml-4 flex-shrink-0" />
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatRelativeTime(request.timestamps.created_at)}
          </div>
          {request.location?.address && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="truncate max-w-[200px]">{request.location.address}</span>
            </div>
          )}
          {request.sla_deadline && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              SLA: {formatDateTime(request.sla_deadline)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MyRequestsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
