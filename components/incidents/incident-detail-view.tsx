"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, MapPin, Calendar, Clock, Users, AlertTriangle, 
  CheckCircle2, Send, Loader2, MoreHorizontal, ChevronDown, 
  ChevronUp, History, FileText, MessageSquare, Activity, 
  TrendingDown, AlertOctagon, Flame, Siren, BrainCircuit,
  Eye, EyeOff, ShieldAlert
} from 'lucide-react';
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { Incident } from './incident-dashboard';

// Configuration (duplicated for self-containment)
const severityConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  critical: { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertOctagon, label: 'Critical' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Flame, label: 'High' },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle, label: 'Medium' },
  low: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: AlertTriangle, label: 'Low' },
};

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  active: { color: 'text-red-600', bgColor: 'bg-red-100', icon: Siren, label: 'Active' },
  investigating: { color: 'text-purple-600', bgColor: 'bg-purple-100', icon: BrainCircuit, label: 'Investigating' },
  contained: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle, label: 'Contained' },
  resolved: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2, label: 'Resolved' },
  closed: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: CheckCircle2, label: 'Closed' },
};

const statusTransitions: Record<string, string[]> = {
  active: ['investigating', 'contained'],
  investigating: ['contained', 'resolved'],
  contained: ['resolved', 'active'],
  resolved: ['closed'],
  closed: [],
};

interface IncidentDetailViewProps {
  incidentId: string;
  onBack?: () => void;
  onEscalate?: (incidentId: string) => void;
  onCreateMaintenance?: (incidentId: string) => void;
}

export function IncidentDetailView({ 
  incidentId, 
  onBack, 
  onEscalate,
  onCreateMaintenance 
}: IncidentDetailViewProps) {
  const { toast } = useToast();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [investigationNote, setInvestigationNote] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showInvestigationDialog, setShowInvestigationDialog] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  const fetchIncident = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/incidents/${incidentId}`);
      const data = await response.json();
      if (data.success) {
        setIncident(data.data);
        setNewStatus(data.data.status);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load incident details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [incidentId, toast]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const handleStatusUpdate = async () => {
    if (!incident || !newStatus) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        setIncident(data.data);
        setShowStatusDialog(false);
        toast({ title: 'Status Updated', description: 'Incident status has been updated' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddInvestigationNote = async () => {
    if (!incident || !investigationNote) return;
    try {
      const response = await fetch(`/api/incidents/${incidentId}/investigation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: investigationNote }),
      });
      const data = await response.json();
      if (data.success) {
        setIncident(data.data);
        setShowInvestigationDialog(false);
        setInvestigationNote('');
        toast({ title: 'Note Added', description: 'Investigation note has been added' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      });
    }
  };

  const handleAssignTeam = async (teamId: string) => {
    if (!incident) return;
    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_team: teamId }),
      });
      const data = await response.json();
      if (data.success) {
        setIncident(data.data);
        toast({ title: 'Team Assigned', description: 'Response team has been assigned' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign team',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <IncidentDetailSkeleton />;
  }

  if (!incident) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Incident not found</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  const severity = severityConfig[incident.severity];
  const status = statusConfig[incident.status] || statusConfig.active;
  const StatusIcon = status.icon;
  const availableTransitions = statusTransitions[incident.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{incident.title}</h1>
              {incident.incident_number && (
                <Badge variant="outline" className="font-mono">
                  {incident.incident_number}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {incident.category} • Reported {formatRelativeTime(incident.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn('text-sm px-3 py-1', severity.bgColor, severity.color)}>
            <severity.icon className="h-4 w-4 mr-1" />
            {severity.label}
          </Badge>
          <Badge className={cn('text-sm px-3 py-1', status.bgColor, status.color)}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p className="whitespace-pre-wrap">{incident.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incident.location && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Location</h4>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {incident.location.address || 
                          `${incident.location.latitude.toFixed(6)}, ${incident.location.longitude.toFixed(6)}`}
                      </span>
                    </div>
                    {incident.location.impact_radius && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Impact radius: {incident.location.impact_radius}m
                      </p>
                    )}
                  </div>
                )}
                {incident.affected_customers !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Affected Customers</h4>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{incident.affected_customers.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {incident.estimated_restoration && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Estimated Restoration</h4>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateTime(incident.estimated_restoration)}</span>
                  </div>
                </div>
              )}

              {incident.reported_by && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Reported By</h4>
                  <p>{incident.reported_by}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Incident Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimelineEvent
                  icon={AlertTriangle}
                  iconColor="text-red-500"
                  title="Incident Reported"
                  time={formatDateTime(incident.created_at)}
                  completed
                />
                {incident.timestamps?.acknowledged && (
                  <TimelineEvent
                    icon={Eye}
                    iconColor="text-blue-500"
                    title="Acknowledged"
                    time={formatDateTime(incident.timestamps.acknowledged)}
                    completed
                  />
                )}
                {incident.timestamps?.investigating && (
                  <TimelineEvent
                    icon={BrainCircuit}
                    iconColor="text-purple-500"
                    title="Investigation Started"
                    time={formatDateTime(incident.timestamps.investigating)}
                    completed
                  />
                )}
                {incident.timestamps?.contained && (
                  <TimelineEvent
                    icon={ShieldAlert}
                    iconColor="text-yellow-500"
                    title="Contained"
                    time={formatDateTime(incident.timestamps.contained)}
                    completed
                  />
                )}
                {incident.timestamps?.resolved && (
                  <TimelineEvent
                    icon={CheckCircle2}
                    iconColor="text-green-500"
                    title="Resolved"
                    time={formatDateTime(incident.timestamps.resolved)}
                    completed
                  />
                )}
                <TimelineEvent
                  icon={Clock}
                  iconColor="text-muted-foreground"
                  title="Estimated Restoration"
                  time={incident.estimated_restoration ? formatDateTime(incident.estimated_restoration) : 'Pending'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Investigation Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Investigation Notes
                </span>
                <Button variant="outline" size="sm" onClick={() => setShowInvestigationDialog(true)}>
                  Add Note
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incident.investigation_notes && incident.investigation_notes.length > 0 ? (
                <div className="space-y-3">
                  {incident.investigation_notes.map((note: string, index: number) => (
                    <div key={index} className="bg-muted rounded-lg p-3">
                      <p className="text-sm">{note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No investigation notes yet</p>
              )}
            </CardContent>
          </Card>

          {/* Root Cause Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Root Cause Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incident.root_cause ? (
                <div className="space-y-2">
                  <p className="font-medium">{incident.root_cause.cause}</p>
                  <p className="text-sm text-muted-foreground">{incident.root_cause.description}</p>
                  {incident.root_cause.preventive_actions && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Preventive Actions:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {incident.root_cause.preventive_actions.map((action: string, i: number) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Root cause analysis not yet completed</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Response Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableTransitions.length > 0 && (
                <Button 
                  className="w-full" 
                  onClick={() => setShowStatusDialog(true)}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              )}
              
              <Select onValueChange={handleAssignTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign Response Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electrical">Electrical Team</SelectItem>
                  <SelectItem value="traffic">Traffic Control</SelectItem>
                  <SelectItem value="gas">Gas Department</SelectItem>
                  <SelectItem value="water">Water & Sanitation</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="w-full" onClick={() => setShowEscalateDialog(true)}>
                <AlertOctagon className="h-4 w-4 mr-2" />
                Escalate
              </Button>

              <Button variant="outline" className="w-full" onClick={() => onCreateMaintenance?.(incidentId)}>
                <FileText className="h-4 w-4 mr-2" />
                Create Maintenance
              </Button>

              <Button variant="outline" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Customer Alert
              </Button>
            </CardContent>
          </Card>

          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Assigned Team</p>
                <p className="font-medium">{incident.assigned_team || 'Unassigned'}</p>
              </div>
              {incident.assigned_to && incident.assigned_to.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {incident.assigned_to.map((member, i) => (
                      <Badge key={i} variant="outline">{member}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Response Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Response Time</span>
                  <span className="font-medium">12 min</span>
                </div>
                <Progress value={80} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">Target: 15 min</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Resolution Progress</span>
                  <span className="font-medium">65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Since Report</p>
                <p className="font-medium">{formatRelativeTime(incident.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Impact Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Impact Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ImpactItem
                label="Customers Affected"
                value={incident.affected_customers?.toLocaleString() || 'Unknown'}
              />
              <ImpactItem
                label="Area Impact"
                value={incident.location?.impact_radius ? `${incident.location.impact_radius}m radius` : 'Unknown'}
              />
              <ImpactItem
                label="Critical Infrastructure"
                value={incident.critical_infrastructure ? 'Yes' : 'No'}
                critical={incident.critical_infrastructure}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Incident Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {availableTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusConfig[status]?.label || status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} disabled={updating || !newStatus}>
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              This will escalate the incident to emergency response protocols.
            </p>
            <Textarea placeholder="Reason for escalation..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEscalateDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                onEscalate?.(incidentId);
                setShowEscalateDialog(false);
                toast({ title: 'Escalated', description: 'Incident has been escalated' });
              }}
            >
              <AlertOctagon className="h-4 w-4 mr-2" />
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Investigation Note Dialog */}
      <Dialog open={showInvestigationDialog} onOpenChange={setShowInvestigationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Investigation Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={investigationNote}
              onChange={(e) => setInvestigationNote(e.target.value)}
              placeholder="Document your investigation findings..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvestigationDialog(false)}>Cancel</Button>
            <Button onClick={handleAddInvestigationNote} disabled={!investigationNote}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-components
interface TimelineEventProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  time: string;
  completed?: boolean;
}

function TimelineEvent({ icon: Icon, iconColor, title, time, completed }: TimelineEventProps) {
  return (
    <div className="flex gap-4">
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
        completed ? 'bg-green-100' : 'bg-muted'
      )}>
        <Icon className={cn('h-5 w-5', completed ? 'text-green-600' : iconColor)} />
      </div>
      <div className="flex-1 pb-4 border-l-2 border-muted ml-5 pl-4 -ml-5 relative">
        <div className={cn(
          'absolute w-3 h-3 rounded-full bg-white border-2 -left-[7px] top-0',
          completed ? 'border-green-500' : 'border-muted-foreground'
        )} />
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

interface ImpactItemProps {
  label: string;
  value: string;
  critical?: boolean;
}

function ImpactItem({ label, value, critical }: ImpactItemProps) {
  return (
    <div className={cn('flex justify-between', critical && 'text-red-600 font-medium')}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function IncidentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
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
