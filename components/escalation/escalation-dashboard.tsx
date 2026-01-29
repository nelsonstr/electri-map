"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { 
  AlertTriangle, Clock, Users, RefreshCw, Filter, Search,
  ArrowUp, ArrowDown, CheckCircle, XCircle, AlertCircle,
  TrendingUp, TrendingDown, Timer, Warning
} from 'lucide-react';

// Types
export interface Escalation {
  id: string;
  entity_type: 'service_request' | 'incident' | 'maintenance';
  entity_id: string;
  entity_title: string;
  current_level: number;
  max_level: number;
  status: 'active' | 'resolved' | 'dismissed';
  triggered_at: string;
  triggered_by: string;
  reason: string;
  assigned_to?: { id: string; name: string; role: string };
  sla_deadline?: string;
  time_elapsed_minutes: number;
  escalation_chain?: { level: number; role: string; name: string; notified: boolean }[];
}

export interface SLAMetric {
  id: string;
  entity_type: string;
  period: 'daily' | 'weekly' | 'monthly';
  total_items: number;
  within_sla: number;
  breached: number;
  compliance_rate: number;
  avg_response_time_minutes: number;
  avg_resolution_time_minutes: number;
}

interface EscalationDashboardProps {
  escalations?: Escalation[];
  slaMetrics?: SLAMetric[];
  onRefresh?: () => void;
  onResolve?: (escalationId: string) => void;
  onDismiss?: (escalationId: string) => void;
  onAssign?: (escalationId: string, userId: string) => void;
}

const levelConfig: Record<number, { color: string; bgColor: string; label: string }> = {
  1: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Level 1' },
  2: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Level 2' },
  3: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Level 3' },
  4: { color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Critical' },
};

const entityTypeLabels: Record<string, string> = {
  service_request: 'Service Request',
  incident: 'Incident',
  maintenance: 'Maintenance',
};

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  active: { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle },
  resolved: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  dismissed: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: XCircle },
};

export function EscalationDashboard({
  escalations = [],
  slaMetrics = [],
  onRefresh,
  onResolve,
  onDismiss,
  onAssign
}: EscalationDashboardProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('active');

  // Filter escalations
  const filteredEscalations = useMemo(() => {
    return escalations
      .filter(e => {
        const matchesSearch = e.entity_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.reason.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
        const matchesLevel = filterLevel === 'all' || e.current_level === parseInt(filterLevel);
        return matchesSearch && matchesStatus && matchesLevel;
      })
      .sort((a, b) => b.time_elapsed_minutes - a.time_elapsed_minutes);
  }, [escalations, searchQuery, filterStatus, filterLevel]);

  // Active escalations count
  const activeCount = escalations.filter(e => e.status === 'active').length;
  const criticalCount = escalations.filter(e => e.status === 'active' && e.current_level >= 3).length;

  // SLA compliance overview
  const overallCompliance = useMemo(() => {
    if (slaMetrics.length === 0) return 0;
    const total = slaMetrics.reduce((sum, m) => sum + m.total_items, 0);
    const within = slaMetrics.reduce((sum, m) => sum + m.within_sla, 0);
    return total > 0 ? Math.round((within / total) * 100) : 0;
  }, [slaMetrics]);

  const handleResolve = (id: string) => {
    onResolve?.(id);
    toast({ title: 'Escalation Resolved', description: 'The escalation has been marked as resolved.' });
  };

  const handleDismiss = (id: string) => {
    onDismiss?.(id);
    toast({ title: 'Escalation Dismissed', description: 'The escalation has been dismissed.' });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Escalation Dashboard</h1>
          <p className="text-muted-foreground">Monitor active escalations and SLA compliance</p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn("border-l-4", criticalCount > 0 ? "border-l-red-500" : "border-l-green-500")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active Escalations</p>
              </div>
              <AlertTriangle className={cn("h-8 w-8", criticalCount > 0 ? "text-red-500" : "text-green-500")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-sm text-muted-foreground">Critical Level</p>
              </div>
              <Warning className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{overallCompliance}%</p>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={overallCompliance} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {escalations.filter(e => e.status === 'resolved').length}
                </p>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search escalations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="1">Level 1</SelectItem>
            <SelectItem value="2">Level 2</SelectItem>
            <SelectItem value="3">Level 3</SelectItem>
            <SelectItem value="4">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Resolved
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            SLA Metrics
          </TabsTrigger>
        </TabsList>

        {/* Active Escalations Tab */}
        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {filteredEscalations.filter(e => e.status === 'active').map(escalation => {
              const level = levelConfig[escalation.current_level];
              const status = statusConfig[escalation.status];
              const isBreached = escalation.sla_deadline && 
                new Date(escalation.sla_deadline) < new Date();

              return (
                <Card key={escalation.id} className={cn(
                  "border-l-4",
                  isBreached ? "border-l-red-500" : level.bgColor.replace('bg-', 'border-l-')
                )}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-lg", level.bgColor)}>
                          <ArrowUp className={cn("h-5 w-5", level.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={level.bgColor}>
                              {level.label}
                            </Badge>
                            <Badge variant="outline">
                              {entityTypeLabels[escalation.entity_type]}
                            </Badge>
                            {isBreached && (
                              <Badge className="bg-red-100 text-red-700">
                                SLA Breached
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium">{escalation.entity_title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{escalation.reason}</p>
                          
                          {/* Time Info */}
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>Elapsed: {escalation.time_elapsed_minutes} min</span>
                            </div>
                            {escalation.sla_deadline && (
                              <div className={cn("flex items-center gap-1", isBreached && "text-red-600 font-medium")}>
                                <Timer className="h-4 w-4" />
                                <span>Deadline: {formatDateTime(escalation.sla_deadline)}</span>
                              </div>
                            )}
                          </div>

                          {/* Escalation Chain */}
                          {escalation.escalation_chain && (
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground mb-2">Escalation Chain</p>
                              <div className="flex items-center gap-2">
                                {escalation.escalation_chain.map((chain, index) => (
                                  <div key={index} className="flex items-center">
                                    <div className={cn(
                                      "px-2 py-1 rounded text-xs",
                                      chain.notified ? "bg-green-100 text-green-700" : "bg-gray-100"
                                    )}>
                                      {chain.role}
                                    </div>
                                    {index < escalation.escalation_chain.length - 1 && (
                                      <ArrowDown className="h-4 w-4 mx-1 text-muted-foreground" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Assigned To */}
                          {escalation.assigned_to && (
                            <div className="flex items-center gap-2 mt-3">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{escalation.assigned_to.name}</span>
                              <Badge variant="outline">{escalation.assigned_to.role}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {onAssign && !escalation.assigned_to && (
                          <Select onValueChange={(value) => onAssign(escalation.id, value)}>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user1">John Smith</SelectItem>
                              <SelectItem value="user2">Jane Doe</SelectItem>
                              <SelectItem value="user3">Mike Johnson</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleResolve(escalation.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDismiss(escalation.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredEscalations.filter(e => e.status === 'active').length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No active escalations</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Resolved Escalations Tab */}
        <TabsContent value="resolved" className="mt-6">
          <div className="space-y-4">
            {filteredEscalations.filter(e => e.status === 'resolved' || e.status === 'dismissed').map(escalation => {
              const level = levelConfig[escalation.current_level];
              const status = statusConfig[escalation.status];
              const StatusIcon = status.icon;

              return (
                <Card key={escalation.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", status.bgColor)}>
                          <StatusIcon className={cn("h-5 w-5", status.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={level.bgColor}>
                              {level.label}
                            </Badge>
                            <Badge variant="outline">
                              {escalation.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                            </Badge>
                          </div>
                          <h3 className="font-medium">{escalation.entity_title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Triggered by {escalation.triggered_by} • {formatDate(escalation.triggered_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredEscalations.filter(e => e.status === 'resolved' || e.status === 'dismissed').length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No resolved escalations
              </div>
            )}
          </div>
        </TabsContent>

        {/* SLA Metrics Tab */}
        <TabsContent value="sla" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slaMetrics.map(metric => (
              <Card key={metric.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {entityTypeLabels[metric.entity_type]}
                  </CardTitle>
                  <CardDescription>
                    {metric.period} overview
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Compliance Rate</span>
                    <span className={cn(
                      "font-bold",
                      metric.compliance_rate >= 95 ? "text-green-600" :
                      metric.compliance_rate >= 85 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {metric.compliance_rate}%
                    </span>
                  </div>
                  <Progress value={metric.compliance_rate} className="h-2" />
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{metric.total_items}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{metric.within_sla}</p>
                      <p className="text-xs text-muted-foreground">Within SLA</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{metric.breached}</p>
                      <p className="text-xs text-muted-foreground">Breached</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Response</span>
                      <span>{metric.avg_response_time_minutes} min</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Avg Resolution</span>
                      <span>{metric.avg_resolution_time_minutes} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
