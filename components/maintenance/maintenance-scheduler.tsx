"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { cn, formatDateTime } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock, MapPin, Users, 
  Wrench, FileText, AlertTriangle, Loader2, Plus } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Types
export interface WorkOrder {
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
  estimated_duration_hours?: number;
  assigned_team?: string;
  assigned_personnel?: string[];
  required_equipment?: string[];
  materials?: { name: string; quantity: number; unit: string }[];
  safety_precautions?: string[];
  notes?: string;
  created_at: string;
}

// Form schema
const workOrderSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Please provide more details'),
  type: z.enum(['preventive', 'predictive', 'emergency', 'corrective']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  start_date: z.date(),
  end_date: z.date(),
  estimated_duration_hours: z.number().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  assigned_team: z.string().optional(),
  required_equipment: z.array(z.string()).optional(),
  materials: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
  })).optional(),
  safety_precautions: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

interface MaintenanceSchedulerProps {
  onSave?: (workOrder: Partial<WorkOrder>) => void;
  onCancel?: () => void;
  initialData?: Partial<WorkOrder>;
  availableTeams?: { id: string; name: string; available: number }[];
  availableEquipment?: string[];
}

const maintenanceTypes = [
  { value: 'preventive', label: 'Preventive Maintenance', description: 'Scheduled routine maintenance' },
  { value: 'predictive', label: 'Predictive Maintenance', description: 'Condition-based maintenance' },
  { value: 'corrective', label: 'Corrective Maintenance', description: 'Repair after failure detection' },
  { value: 'emergency', label: 'Emergency Maintenance', description: 'Immediate response required' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
];

const equipmentOptions = [
  'Safety Harness', 'Power Tools', 'Ladder', 'Vehicle', 'Generator',
  'Welding Equipment', 'Heavy Machinery', 'Testing Equipment',
];

export function MaintenanceScheduler({ 
  onSave, 
  onCancel,
  initialData,
  availableTeams = [],
  availableEquipment = equipmentOptions,
}: MaintenanceSchedulerProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    initialData?.required_equipment || []
  );
  const [materials, setMaterials] = useState<{name: string; quantity: number; unit: string}[]>(
    initialData?.materials || []
  );
  const [safetyPrecautions, setSafetyPrecautions] = useState<string[]>(
    initialData?.safety_precautions || []
  );

  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      type: initialData?.type || 'preventive',
      priority: initialData?.priority || 'medium',
      start_date: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
      end_date: initialData?.end_date ? new Date(initialData.end_date) : new Date(),
      estimated_duration_hours: initialData?.estimated_duration_hours || 2,
      location: initialData?.location || { latitude: 0, longitude: 0 },
      assigned_team: initialData?.assigned_team || '',
      notes: initialData?.notes || '',
    },
  });

  const handleSubmit = async (data: WorkOrderFormData) => {
    setSubmitting(true);
    try {
      const workOrderData = {
        ...data,
        required_equipment: selectedEquipment,
        materials,
        safety_precautions: safetyPrecautions,
      };
      onSave?.(workOrderData);
      toast({
        title: 'Work Order Created',
        description: 'The maintenance work order has been scheduled successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create work order',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEquipment = (item: string) => {
    setSelectedEquipment(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const addMaterial = () => {
    setMaterials(prev => [...prev, { name: '', quantity: 1, unit: 'pcs' }]);
  };

  const updateMaterial = (index: number, field: string, value: string | number) => {
    setMaterials(prev => prev.map((m, i) => 
      i === index ? { ...m, [field]: value } : m
    ));
  };

  const removeMaterial = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const addSafetyPrecaution = () => {
    setSafetyPrecautions(prev => [...prev, '']);
  };

  const updateSafetyPrecaution = (index: number, value: string) => {
    setSafetyPrecautions(prev => prev.map((p, i) => i === index ? value : p));
  };

  const removeSafetyPrecaution = (index: number) => {
    setSafetyPrecautions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Schedule Maintenance Work Order
        </CardTitle>
        <CardDescription>
          Create a new maintenance work order with scheduling, resource allocation, and safety requirements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Work Order Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of maintenance work" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maintenance Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {maintenanceTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityOptions.map(priority => (
                            <SelectItem key={priority.value} value={priority.value}>
                              <span className="flex items-center gap-2">
                                <Badge className={cn('h-2 w-2 rounded-full p-0', priority.color)} />
                                {priority.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of maintenance work to be performed..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2">Scheduling</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date & Time *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn(
                              "justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? formatDateTime(field.value) : "Select date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date & Time *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn(
                              "justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? formatDateTime(field.value) : "Select date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimated_duration_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Duration (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2">Location</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location.latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="e.g., 38.7223"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any"
                          placeholder="e.g., -9.1393"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Street address or landmark" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2">Resources</h3>
              
              <FormField
                control={form.control}
                name="assigned_team"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Team</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="electrical">Electrical Team</SelectItem>
                        <SelectItem value="plumbing">Plumbing Team</SelectItem>
                        <SelectItem value="hvac">HVAC Team</SelectItem>
                        <SelectItem value="general">General Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>Required Equipment</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {availableEquipment.map(item => (
                    <label key={item} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted">
                      <Checkbox
                        checked={selectedEquipment.includes(item)}
                        onCheckedChange={() => toggleEquipment(item)}
                      />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Materials</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                    <Plus className="h-4 w-4 mr-1" /> Add Material
                  </Button>
                </div>
                <div className="space-y-2">
                  {materials.map((material, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Material name"
                        value={material.name}
                        onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={material.quantity}
                        onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Select
                        value={material.unit}
                        onValueChange={(value) => updateMaterial(index, 'unit', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">pcs</SelectItem>
                          <SelectItem value="meters">meters</SelectItem>
                          <SelectItem value="liters">liters</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeMaterial(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {materials.length === 0 && (
                    <p className="text-sm text-muted-foreground">No materials added</p>
                  )}
                </div>
              </div>
            </div>

            {/* Safety */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Safety Precautions
              </h3>
              
              <div className="space-y-2">
                {safetyPrecautions.map((precaution, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Safety precaution"
                      value={precaution}
                      onChange={(e) => updateSafetyPrecaution(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeSafetyPrecaution(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSafetyPrecaution}>
                  <Plus className="h-4 w-4 mr-1" /> Add Precaution
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2">Additional Notes</h3>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes or special instructions..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <FileText className="h-4 w-4 mr-2" />
                Create Work Order
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
