"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, User, MapPin, Calendar, Clock, MessageSquare, 
  AlertTriangle, CheckCircle2, Send, Loader2, MoreHorizontal,
  ChevronDown, ChevronUp, History, Paperclip
} from 'lucide-react';
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { RequestStatusTracker, ServiceRequest } from './request-status-tracker';

// Status and priority configurations (duplicated for self-containment)
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

const priorityConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  minor: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Minor' },
  moderate: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Moderate' },
  major: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Major' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Critical' },
};

const statusTransitions: Record<string, string[]> = {
  submitted: ['acknowledged', 'cancelled'],
  acknowledged: ['in_progress', 'cancelled'],
  in_progress: ['pending_parts', 'scheduled', 'completed', 'cancelled'],
  pending_parts: ['in_progress', 'completed', 'cancelled'],
  scheduled: ['in_progress', 'completed', 'cancelled'],
  completed: ['verified', 'closed'],
  verified: ['closed'],
  closed: [],
  cancelled: [],
};

interface RequestDetailViewProps {
  requestId: string;
  onBack?: () => void;
  onEscalate?: (requestId: string) => void;
}

export function RequestDetailView({ requestId, onBack, onEscalate }: RequestDetailViewProps) {
  const { toast } = useToast();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [internalNote, setInternalNote] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  const fetchRequest = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/service-requests/${requestId}`);
      const data = await response.json();
      if (data.success) {
        setRequest(data.data);
        setNewStatus(data.data.status);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load request details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [requestId, toast]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleStatusUpdate = async () => {
    if (!request || !newStatus) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/service-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, internal_notes: internalNote }),
      });
      const data = await response.json();
      if (data.success) {
        setRequest(data.data);
        setShowStatusDialog(false);
        setInternalNote('');
        toast({ title: 'Status Updated', description: 'Request status has been updated' });
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

  const handleAssign = async (userId: string) => {
    if (!request) return;
    try {
      const response = await fetch(`/api/service-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: userId }),
      });
      const data = await response.json();
      if (data.success) {
        setRequest(data.data);
        toast({ title: 'Assigned', description: 'Request has been assigned' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign request',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Request not found</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  const status = statusConfig[request.status] || statusConfig.submitted;
  const priority = priorityConfig[request.priority] || priorityConfig.moderate;
  const availableTransitions = statusTransitions[request.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{request.title}</h1>
              {request.request_number && (
                <Badge variant="outline" className="font-mono">
                  {request.request_number}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Category: {request.category} • Created {formatRelativeTime(request.timestamps.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('text-sm px-3 py-1', status.bgColor, status.color)}>
            {status.label}
          </Badge>
          <Badge className={cn('text-sm px-3 py-1', priority.bgColor, priority.color)}>
            {priority.label}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p className="whitespace-pre-wrap">{request.description}</p>
              </div>

              {request.location && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Location</h4>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {request.location.address || 
                        `${request.location.latitude.toFixed(6)}, ${request.location.longitude.toFixed(6)}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Customer</h4>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{request.customer_name}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact</h4>
                  <p className="text-sm">
                    {request.customer_email || request.customer_phone || 'Not provided'}
                  </p>
                </div>
              </div>

              {request.sla_deadline && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">SLA Deadline</h4>
                  <div className={cn(
                    'flex items-center gap-2',
                    new Date(request.sla_deadline) < new Date() && 'text-red-600'
                  )}>
                    <Clock className="h-4 w-4" />
                    <span>{formatDateTime(request.sla_deadline)}</span>
                    {new Date(request.sla_deadline) < new Date() && (
                      <Badge variant="destructive">Overdue</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <RequestStatusTracker 
            request={request} 
            showFullTimeline={true}
            showCommunications={true}
            onRefresh={fetchRequest}
          />
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableTransitions.length > 0 && (
                <Button 
                  className="w-full" 
                  onClick={() => setShowStatusDialog(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              )}
              
              <Select onValueChange={handleAssign}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">John Smith</SelectItem>
                  <SelectItem value="user2">Jane Doe</SelectItem>
                  <SelectItem value="user3">Team Lead</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="w-full" onClick={() => setShowEscalateDialog(true)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Escalate
              </Button>

              <Button variant="outline" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Update to Customer
              </Button>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Internal Notes
                </span>
                <Button variant="ghost" size="sm" onClick={() => setNotesExpanded(!notesExpanded)}>
                  {notesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(!notesExpanded && 'line-clamp-3')}>
              {request.internal_notes ? (
                <p className="whitespace-pre-wrap text-sm">{request.internal_notes}</p>
              ) : (
                <p className="text-muted-foreground text-sm">No internal notes</p>
              )}
            </CardContent>
          </Card>

          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{request.assigned_department || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="font-medium">{request.assigned_to || 'Unassigned'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="font-medium">Request submitted</p>
                    <p className="text-muted-foreground">{formatDateTime(request.timestamps.created_at)}</p>
                  </div>
                </div>
                {request.timestamps.acknowledged_at && (
                  <div className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                    <div>
                      <p className="font-medium">Acknowledged</p>
                      <p className="text-muted-foreground">{formatDateTime(request.timestamps.acknowledged_at)}</p>
                    </div>
                  </div>
                )}
                {request.timestamps.in_progress_at && (
                  <div className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                    <div>
                      <p className="font-medium">Work started</p>
                      <p className="text-muted-foreground">{formatDateTime(request.timestamps.in_progress_at)}</p>
                    </div>
                  </div>
                )}
                {request.timestamps.completed_at && (
                  <div className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                    <div>
                      <p className="font-medium">Completed</p>
                      <p className="text-muted-foreground">{formatDateTime(request.timestamps.completed_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request Status</DialogTitle>
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
            <div>
              <label className="text-sm font-medium">Internal Note (Optional)</label>
              <Textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Add a note about this status change..."
                className="mt-2"
              />
            </div>
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
            <DialogTitle>Escalate Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              This will escalate the request to a supervisor. Please provide a reason for escalation.
            </p>
            <div>
              <label className="text-sm font-medium">Escalation Reason</label>
              <Textarea
                placeholder="Explain why this request needs escalation..."
                className="mt-2"
              />
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Escalation Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="manager">Department Manager</SelectItem>
                <SelectItem value="director">Director</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEscalateDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                onEscalate?.(requestId);
                setShowEscalateDialog(false);
                toast({ title: 'Escalated', description: 'Request has been escalated' });
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
