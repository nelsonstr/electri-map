"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { 
  CheckCircle, Clock, MapPin, Users, Wrench, AlertTriangle, 
  Camera, FileText, Loader2, ChevronDown, ChevronUp, 
  Download, Send, History, ClipboardList
} from 'lucide-react';

// Types
export interface WorkOrderStep {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
}

export interface WorkOrderMaterial {
  name: string;
  quantity: number;
  unit: string;
  used: boolean;
}

export interface WorkOrderEquipment {
  name: string;
  available: boolean;
  checked_out: boolean;
  returned: boolean;
}

export interface WorkOrderDetail {
  id: string;
  work_order_number?: string;
  title: string;
  description: string;
  type: 'preventive' | 'predictive' | 'emergency' | 'corrective';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location?: { latitude: number; longitude: number; address?: string };
  start_date: string;
  end_date: string;
  assigned_team?: string;
  assigned_personnel?: { id: string; name: string; role: string }[];
  steps: WorkOrderStep[];
  materials: WorkOrderMaterial[];
  equipment: WorkOrderEquipment[];
  before_photos?: string[];
  after_photos?: string[];
  safety_precautions?: string[];
  notes?: string;
  completion_signature?: { name: string; date: string; signature_data?: string };
  created_at: string;
  updated_at: string;
}

interface WorkOrderDetailProps {
  workOrder: WorkOrderDetail;
  onStatusChange?: (status: string) => void;
  onStepComplete?: (stepId: string, notes: string) => void;
  onMaterialUse?: (materialIndex: number, used: boolean) => void;
  onEquipmentReturn?: (equipmentIndex: number) => void;
  onAddNote?: (note: string) => void;
  onComplete?: (signature: { name: string }) => void;
  onCancel?: () => void;
}

// Configuration objects
const typeConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  preventive: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Preventive' },
  predictive: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Predictive' },
  emergency: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Emergency' },
  corrective: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Corrective' },
};

const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ElementType }> = {
  draft: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Draft', icon: FileText },
  scheduled: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Scheduled', icon: Clock },
  in_progress: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'In Progress', icon: Wrench },
  completed: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Completed', icon: CheckCircle },
  cancelled: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Cancelled', icon: AlertTriangle },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'text-green-600', label: 'Low' },
  medium: { color: 'text-yellow-600', label: 'Medium' },
  high: { color: 'text-orange-600', label: 'High' },
  critical: { color: 'text-red-600', label: 'Critical' },
};

export function WorkOrderDetail({ 
  workOrder, 
  onStatusChange, 
  onStepComplete,
  onMaterialUse,
  onEquipmentReturn,
  onAddNote,
  onComplete,
  onCancel 
}: WorkOrderDetailProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSteps, setExpandedSteps] = useState<number | null>(null);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [newNote, setNewNote] = useState('');

  const completedSteps = workOrder.steps.filter(s => s.completed).length;
  const progressPercentage = workOrder.steps.length > 0 
    ? (completedSteps / workOrder.steps.length) * 100 
    : 0;

  const handleCompleteStep = (stepIndex: number) => {
    const step = workOrder.steps[stepIndex];
    if (!step.completed) {
      onStepComplete?.(step.id, stepNotes[step.id] || '');
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote?.(newNote);
      setNewNote('');
      toast({ title: 'Note Added', description: 'Your note has been added to the work order.' });
    }
  };

  const handleSignatureSubmit = () => {
    if (signatureName.trim()) {
      onComplete?.({ name: signatureName });
      setShowSignatureDialog(false);
      setSignatureName('');
    }
  };

  const currentStatus = statusConfig[workOrder.status];
  const currentType = typeConfig[workOrder.type];
  const currentPriority = priorityConfig[workOrder.priority];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {workOrder.work_order_number && (
                  <Badge variant="outline">{workOrder.work_order_number}</Badge>
                )}
                <Badge className={currentType.bgColor}>
                  {currentType.label}
                </Badge>
                <Badge className={currentStatus.bgColor}>
                  <currentStatus.icon className="h-3 w-3 mr-1" />
                  {currentStatus.label}
                </Badge>
                <Badge variant="outline" className={currentPriority.color}>
                  {currentPriority.label} Priority
                </Badge>
              </div>
              <h1 className="text-2xl font-bold">{workOrder.title}</h1>
              <p className="text-muted-foreground">{workOrder.description}</p>
            </div>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>Back to List</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span>Completion Progress</span>
              <span className="font-medium">{completedSteps}/{workOrder.steps.length} steps</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">{Math.round(progressPercentage)}% complete</p>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Start</p>
                <p className="text-sm font-medium">{formatDateTime(workOrder.start_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">End</p>
                <p className="text-sm font-medium">{formatDateTime(workOrder.end_date)}</p>
              </div>
            </div>
            {workOrder.location?.address && (
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium truncate">{workOrder.location.address}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assigned Team */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assigned Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workOrder.assigned_team && (
                  <p className="font-medium mb-4">{workOrder.assigned_team}</p>
                )}
                {workOrder.assigned_personnel && workOrder.assigned_personnel.length > 0 ? (
                  <div className="space-y-3">
                    {workOrder.assigned_personnel.map(person => (
                      <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-sm text-muted-foreground">{person.role}</p>
                        </div>
                        <Badge variant="outline">Assigned</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No personnel assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Safety Precautions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Safety Precautions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workOrder.safety_precautions && workOrder.safety_precautions.length > 0 ? (
                  <ul className="space-y-2">
                    {workOrder.safety_precautions.map((precaution, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                        <span className="text-sm">{precaution}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No safety precautions listed</p>
                )}
              </CardContent>
            </Card>

            {/* Equipment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workOrder.equipment && workOrder.equipment.length > 0 ? (
                  <div className="space-y-2">
                    {workOrder.equipment.map((eq, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{eq.name}</span>
                        <div className="flex items-center gap-2">
                          {eq.returned ? (
                            <Badge className="bg-green-100 text-green-700">Returned</Badge>
                          ) : eq.checked_out ? (
                            <Badge className="bg-yellow-100 text-yellow-700">In Use</Badge>
                          ) : eq.available ? (
                            <Badge variant="outline">Available</Badge>
                          ) : (
                            <Badge variant="destructive">Unavailable</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No equipment required</p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workOrder.status === 'scheduled' && (
                  <Button className="w-full" onClick={() => onStatusChange?.('in_progress')}>
                    <Wrench className="h-4 w-4 mr-2" />
                    Start Work Order
                  </Button>
                )}
                {workOrder.status === 'in_progress' && (
                  <Button className="w-full" onClick={() => setShowSignatureDialog(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Work Order
                  </Button>
                )}
                {workOrder.status === 'in_progress' && (
                  <Button variant="outline" className="w-full" onClick={() => onStatusChange?.('cancelled')}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Cancel Work Order
                  </Button>
                )}
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Steps Tab */}
        <TabsContent value="steps" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Work Steps
              </CardTitle>
              <CardDescription>
                Complete each step in order. Mark as done when finished.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workOrder.steps.map((step, index) => (
                  <div key={step.id} className="border rounded-lg">
                    <div 
                      className={cn(
                        "flex items-center gap-4 p-4 cursor-pointer",
                        step.completed && "bg-muted/50"
                      )}
                      onClick={() => setExpandedSteps(expandedSteps === index ? null : index)}
                    >
                      <Checkbox
                        checked={step.completed}
                        onCheckedChange={() => handleCompleteStep(index)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={step.completed}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Step {index + 1}</span>
                          {step.completed && (
                            <Badge className="bg-green-100 text-green-700">Completed</Badge>
                          )}
                        </div>
                        <p className={cn("text-sm", step.completed && "line-through text-muted-foreground")}>
                          {step.title}
                        </p>
                      </div>
                      {expandedSteps === index ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                    {expandedSteps === index && (
                      <div className="px-4 pb-4 pl-12 space-y-4">
                        {step.description && (
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        )}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Notes</label>
                          <Textarea
                            placeholder="Add completion notes..."
                            value={stepNotes[step.id] || step.notes || ''}
                            onChange={(e) => setStepNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {!step.completed && (
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); handleCompleteStep(index); }}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                        {step.completed && step.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            Completed at {formatDateTime(step.completed_at)}
                            {step.completed_by && ` by ${step.completed_by}`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Materials Checklist
              </CardTitle>
              <CardDescription>
                Track materials used during the work order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workOrder.materials.map((material, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={material.used}
                        onCheckedChange={(checked) => onMaterialUse?.(index, checked as boolean)}
                      />
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {material.quantity} {material.unit}
                        </p>
                      </div>
                    </div>
                    <Badge className={material.used ? "bg-green-100 text-green-700" : "bg-gray-100"}>
                      {material.used ? "Used" : "Available"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before Photos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Before Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workOrder.before_photos && workOrder.before_photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {workOrder.before_photos.map((photo, index) => (
                      <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No before photos</p>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4">
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Before Photos
                </Button>
              </CardContent>
            </Card>

            {/* After Photos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  After Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workOrder.after_photos && workOrder.after_photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {workOrder.after_photos.map((photo, index) => (
                      <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No after photos</p>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4">
                  <Camera className="h-4 w-4 mr-2" />
                  Upload After Photos
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes & History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a new note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button onClick={handleAddNote}>
                  <Send className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
              <Separator />
              {workOrder.notes && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-4 w-4" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(workOrder.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{workOrder.notes}</p>
                </div>
              )}
              <p className="text-muted-foreground text-center">No additional notes</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Work Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              By signing below, you confirm that all work has been completed according to the specifications.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="Enter your full name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignatureDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignatureSubmit} disabled={!signatureName.trim()}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Sign & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
