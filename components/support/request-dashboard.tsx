"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, Filter, RefreshCw, AlertTriangle, Clock, 
  CheckCircle2, Users, TrendingUp, Calendar, MapPin,
  ChevronRight, ArrowUp, ArrowDown, MoreHorizontal
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

export interface ServiceRequest {
  id: string;
  request_number?: string;
  title: string;
  description: string;
  category: string;
  priority: 'minor' | 'moderate' | 'major' | 'critical';
  status: string;
  location?: { latitude: number; longitude: number; address?: string };
  customer_name: string;
  customer_email?: string;
  assigned_department?: string;
  assigned_to?: string;
  sla_deadline?: string;
  created_at: string;
  updated_at: string;
}

// Dashboard statistics
interface DashboardStats {
  totalRequests: number;
  openRequests: number;
  inProgressRequests: number;
  completedToday: number;
  slaAtRisk: number;
  slaBreached: number;
  avgResolutionTime: number;
}

// Status configuration
const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  submitted: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: AlertTriangle, label: 'Submitted' },
  acknowledged: { color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: AlertTriangle, label: 'Acknowledged' },
  in_progress: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock, label: 'In Progress' },
  pending_parts: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock, label: 'Pending Parts' },
  scheduled: { color: 'text-cyan-600', bgColor: 'bg-cyan-100', icon: Calendar, label: 'Scheduled' },
  completed: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2, label: 'Completed' },
  verified: { color: 'text-teal-600', bgColor: 'bg-teal-100', icon: CheckCircle2, label: 'Verified' },
  closed: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: CheckCircle2, label: 'Closed' },
};

const priorityConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  minor: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Minor' },
  moderate: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Moderate' },
  major: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Major' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Critical' },
};

interface RequestDashboardProps {
  departmentId?: string;
  teamId?: string;
  userId?: string;
  onRequestSelect?: (request: ServiceRequest) => void;
}

export function RequestDashboard({ 
  departmentId, 
  teamId, 
  userId,
  onRequestSelect 
}: RequestDashboardProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (departmentId) params.append('assigned_department', departmentId);
      if (teamId) params.append('assigned_team', teamId);
      if (userId) params.append('assigned_to', userId);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (search) params.append('search', search);

      const [requestsRes, statsRes] = await Promise.all([
        fetch(`/api/service-requests?${params.toString()}`),
        fetch(`/api/service-requests/stats?${params.toString()}`),
      ]);

      const requestsData = await requestsRes.json();
      const statsData = await statsRes.json();

      if (requestsData.success) {
        setRequests(requestsData.data);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [departmentId, teamId, userId, statusFilter, priorityFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedRequests = [...requests].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'priority':
        const priorityOrder = { critical: 0, major: 1, moderate: 2, minor: 3 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'sla_deadline':
        if (!a.sla_deadline && !b.sla_deadline) comparison = 0;
        else if (!a.sla_deadline) comparison = 1;
        else if (!b.sla_deadline) comparison = -1;
        else comparison = new Date(a.sla_deadline).getTime() - new Date(b.sla_deadline).getTime();
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return <RequestDashboardSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchData} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total"
            value={stats.totalRequests}
            icon={Users}
            className="bg-blue-50"
          />
          <StatCard
            title="Open"
            value={stats.openRequests}
            icon={AlertTriangle}
            className="bg-yellow-50"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgressRequests}
            icon={Clock}
            className="bg-orange-50"
          />
          <StatCard
            title="SLA At Risk"
            value={stats.slaAtRisk}
            icon={TrendingUp}
            className="bg-red-50"
            alert={stats.slaAtRisk > 0}
          />
          <StatCard
            title="SLA Breached"
            value={stats.slaBreached}
            icon={AlertTriangle}
            className="bg-red-100"
          />
          <StatCard
            title="Avg Resolution"
            value={`${stats.avgResolutionTime}h`}
            icon={CheckCircle2}
            className="bg-green-50"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, number, or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Request Queue</span>
            <Badge variant="secondary">{sortedRequests.length} requests</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No requests match your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedRequests.map((request, index) => (
                <RequestRow 
                  key={request.id} 
                  request={request}
                  onClick={() => onRequestSelect?.(request)}
                  isAtRisk={request.sla_deadline && new Date(request.sla_deadline) < new Date()}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  className?: string;
  alert?: boolean;
}

function StatCard({ title, value, icon: Icon, className, alert }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={cn('text-2xl font-bold mt-1', alert && 'text-red-600')}>
              {value}
            </p>
          </div>
          <Icon className={cn('h-8 w-8 opacity-20', alert && 'text-red-600')} />
        </div>
        {alert && (
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RequestRowProps {
  request: ServiceRequest;
  onClick: () => void;
  isAtRisk?: boolean;
}

function RequestRow({ request, onClick, isAtRisk }: RequestRowProps) {
  const status = statusConfig[request.status] || statusConfig.submitted;
  const priority = priorityConfig[request.priority] || priorityConfig.moderate;
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors',
        'hover:bg-muted/50',
        isAtRisk && 'border-red-200 bg-red-50/50'
      )}
      onClick={onClick}
    >
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', status.bgColor)}>
        <StatusIcon className={cn('h-5 w-5', status.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {request.request_number && (
            <Badge variant="outline" className="font-mono text-xs">
              {request.request_number}
            </Badge>
          )}
          <Badge className={cn('text-xs', priority.bgColor, priority.color)}>
            {priority.label}
          </Badge>
          {isAtRisk && (
            <Badge variant="destructive" className="text-xs">
              SLA At Risk
            </Badge>
          )}
        </div>
        <p className="font-medium truncate">{request.title}</p>
        <p className="text-sm text-muted-foreground truncate">
          {request.customer_name} • {request.category}
        </p>
      </div>

      <div className="text-right text-sm text-muted-foreground hidden md:block">
        <p>{formatRelativeTime(request.created_at)}</p>
        {request.assigned_to && (
          <p className="text-xs">Assigned: {request.assigned_to}</p>
        )}
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

export function RequestDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-7 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
