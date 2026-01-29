"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, AlertCircle, AlertOctagon, CheckCircle2, 
  Clock, MapPin, Users, RefreshCw, Search, Filter,
  ChevronRight, ArrowUpRight, TrendingDown, Zap, Flame,
  Siren, BrainCircuit, History, MessageSquare
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

// Type definitions
export interface Incident {
  id: string;
  incident_number?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'investigating' | 'contained' | 'resolved' | 'closed';
  category: string;
  location?: { latitude: number; longitude: number; address?: string; impact_radius?: number };
  affected_customers?: number;
  reported_by?: string;
  assigned_team?: string;
  assigned_to?: string[];
  estimated_restoration?: string;
  actual_restoration?: string;
  created_at: string;
  updated_at: string;
  timestamps?: {
    reported: string;
    acknowledged?: string;
    investigating?: string;
    contained?: string;
    resolved?: string;
    closed?: string;
  };
}

interface IncidentDashboardStats {
  totalActive: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  avgResponseTime: number;
  affectedCustomers: number;
  resolvedToday: number;
}

// Severity configuration
const severityConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  critical: { color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertOctagon, label: 'Critical' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Flame, label: 'High' },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle, label: 'Medium' },
  low: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: AlertCircle, label: 'Low' },
};

// Status configuration
const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  active: { color: 'text-red-600', bgColor: 'bg-red-100', icon: Siren, label: 'Active' },
  investigating: { color: 'text-purple-600', bgColor: 'bg-purple-100', icon: BrainCircuit, label: 'Investigating' },
  contained: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle, label: 'Contained' },
  resolved: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2, label: 'Resolved' },
  closed: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: CheckCircle2, label: 'Closed' },
};

interface IncidentDashboardProps {
  onIncidentSelect?: (incident: Incident) => void;
  onNewIncident?: () => void;
}

export function IncidentDashboard({ onIncidentSelect, onNewIncident }: IncidentDashboardProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const [incidentsRes, statsRes] = await Promise.all([
        fetch(`/api/incidents?${params.toString()}`),
        fetch(`/api/incidents/stats?${params.toString()}`),
      ]);

      const incidentsData = await incidentsRes.json();
      const statsData = await statsRes.json();

      if (incidentsData.success) {
        setIncidents(incidentsData.data);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err) {
      setError('Failed to load incident data');
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const sortedIncidents = [...incidents].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  if (loading && incidents.length === 0) {
    return <IncidentDashboardSkeleton />;
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <SeverityStatCard
            severity="critical"
            count={stats.critical}
            icon={AlertOctagon}
          />
          <SeverityStatCard
            severity="high"
            count={stats.high}
            icon={Flame}
          />
          <SeverityStatCard
            severity="medium"
            count={stats.medium}
            icon={AlertTriangle}
          />
          <SeverityStatCard
            severity="low"
            count={stats.low}
            icon={AlertCircle}
          />
          <StatCard
            title="Active"
            value={stats.totalActive}
            icon={Siren}
            className="bg-red-50"
            alert={stats.totalActive > 0}
          />
          <StatCard
            title="Affected"
            value={stats.affectedCustomers.toLocaleString()}
            icon={Users}
            className="bg-orange-50"
          />
          <StatCard
            title="Avg Response"
            value={`${stats.avgResponseTime}min`}
            icon={Clock}
            className="bg-blue-50"
          />
          <StatCard
            title="Resolved Today"
            value={stats.resolvedToday}
            icon={CheckCircle2}
            className="bg-green-50"
          />
        </div>
      )}

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Siren className="h-5 w-5 text-red-500" />
                  Active Incidents
                  <Badge variant="secondary">{sortedIncidents.length}</Badge>
                </CardTitle>
                <Button size="sm" onClick={onNewIncident}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report Incident
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search incidents..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="contained">Contained</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Incident List */}
              {sortedIncidents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p className="text-lg font-medium">No active incidents</p>
                  <p className="text-sm">All systems operating normally</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedIncidents.map((incident) => (
                    <IncidentRow
                      key={incident.id}
                      incident={incident}
                      onClick={() => onIncidentSelect?.(incident)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Quick Info */}
        <div className="space-y-6">
          {/* Response Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Response Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TeamStatus name="Electrical" available={3} deployed={5} />
              <TeamStatus name="Traffic" available={2} deployed={3} />
              <TeamStatus name="Gas" available={4} deployed={2} />
              <TeamStatus name="Water" available={5} deployed={1} />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActivityItem
                time="2 min ago"
                message="Critical incident acknowledged"
                incident="INC-2024-001"
              />
              <ActivityItem
                time="15 min ago"
                message="Team dispatched to location"
                incident="INC-2024-002"
              />
              <ActivityItem
                time="1 hour ago"
                message="Incident contained"
                incident="INC-2024-003"
              />
            </CardContent>
          </Card>

          {/* SLA Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Response SLA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Critical (15 min)</span>
                  <span className="text-green-600">95%</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>High (30 min)</span>
                  <span className="text-green-600">88%</span>
                </div>
                <Progress value={88} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Medium (2 hours)</span>
                  <span className="text-yellow-600">72%</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Sub-components
interface SeverityStatCardProps {
  severity: string;
  count: number;
  icon: React.ElementType;
}

function SeverityStatCard({ severity, count, icon: Icon }: SeverityStatCardProps) {
  const config = severityConfig[severity];
  return (
    <Card className={cn('relative overflow-hidden', config.bgColor)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-xs font-medium uppercase tracking-wider', config.color)}>
              {config.label}
            </p>
            <p className={cn('text-2xl font-bold mt-1', config.color)}>
              {count}
            </p>
          </div>
          <Icon className={cn('h-8 w-8 opacity-20', config.color)} />
        </div>
        {count > 0 && (
          <div className={cn('absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse', config.color.replace('text-', 'bg-'))} />
        )}
      </CardContent>
    </Card>
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
      <CardContent className="p-3">
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

interface IncidentRowProps {
  incident: Incident;
  onClick: () => void;
}

function IncidentRow({ incident, onClick }: IncidentRowProps) {
  const severity = severityConfig[incident.severity];
  const status = statusConfig[incident.status];
  const SeverityIcon = severity.icon;
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors',
        'hover:bg-muted/50',
        incident.severity === 'critical' && 'border-red-200 bg-red-50/50',
        incident.severity === 'high' && 'border-orange-200 bg-orange-50/50'
      )}
      onClick={onClick}
    >
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', severity.bgColor)}>
        <SeverityIcon className={cn('h-5 w-5', severity.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {incident.incident_number && (
            <Badge variant="outline" className="font-mono text-xs">
              {incident.incident_number}
            </Badge>
          )}
          <Badge className={cn('text-xs', status.bgColor, status.color)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
          {incident.affected_customers && (
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {incident.affected_customers} affected
            </Badge>
          )}
        </div>
        <p className="font-medium">{incident.title}</p>
        <p className="text-sm text-muted-foreground truncate">
          {incident.category} • Reported {formatRelativeTime(incident.created_at)}
        </p>
        {incident.location?.address && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{incident.location.address}</span>
          </div>
        )}
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
    </div>
  );
}

interface TeamStatusProps {
  name: string;
  available: number;
  deployed: number;
}

function TeamStatus({ name, available, deployed }: TeamStatusProps) {
  const total = available + deployed;
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          {available} available / {deployed} deployed
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          available > 0 ? 'bg-green-500' : 'bg-red-500'
        )} />
      </div>
    </div>
  );
}

interface ActivityItemProps {
  time: string;
  message: string;
  incident: string;
}

function ActivityItem({ time, message, incident }: ActivityItemProps) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{message}</p>
        <p className="text-xs text-muted-foreground">
          {incident} • {time}
        </p>
      </div>
    </div>
  );
}

export function IncidentDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-7 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-10 w-full mb-4" />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full mb-2" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
          <Card><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
          <Card><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
