"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle, AlertOctagon, Flame, AlertCircle, MapPin, 
  Phone, Mail, MessageSquare, Loader2, ChevronRight, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Form schema
const incidentReportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Please provide more details about the incident').max(1000),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.string().min(1, 'Please select a category'),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  affected_customers: z.number().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  additional_info: z.string().optional(),
});

type IncidentReportFormData = z.infer<typeof incidentReportSchema>;

// Categories for incidents
const incidentCategories = [
  { value: 'power_outage', label: 'Power Outage', icon: '⚡' },
  { value: 'gas_leak', label: 'Gas Leak', icon: '🔥' },
  { value: 'water_main_break', label: 'Water Main Break', icon: '💧' },
  { value: 'traffic_signal', label: 'Traffic Signal Failure', icon: '🚦' },
  { value: 'road_hazard', label: 'Road Hazard', icon: '🛣️' },
  { value: 'public_safety', label: 'Public Safety Concern', icon: '🚨' },
  { value: 'structural', label: 'Structural Damage', icon: '🏗️' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const severityOptions = [
  { value: 'critical', label: 'Critical', icon: AlertOctagon, color: 'text-red-600', bgColor: 'bg-red-100', description: 'Immediate threat to life or safety' },
  { value: 'high', label: 'High', icon: Flame, color: 'text-orange-600', bgColor: 'bg-orange-100', description: 'Significant impact, requires urgent response' },
  { value: 'medium', label: 'Medium', icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100', description: 'Moderate impact, response within hours' },
  { value: 'low', label: 'Low', icon: AlertCircle, color: 'text-blue-600', bgColor: 'bg-blue-100', description: 'Minor impact, routine response' },
];

interface IncidentReportFormProps {
  onSuccess?: (incidentId: string) => void;
  onCancel?: () => void;
  initialLocation?: { latitude: number; longitude: number; address?: string };
}

export function IncidentReportForm({ onSuccess, onCancel, initialLocation }: IncidentReportFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<IncidentReportFormData>({
    resolver: zodResolver(incidentReportSchema),
    defaultValues: {
      title: '',
      description: '',
      severity: 'medium',
      category: '',
      location: initialLocation || { latitude: 0, longitude: 0 },
      affected_customers: 0,
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      additional_info: '',
    },
  });

  const handleSubmit = async (data: IncidentReportFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Incident Reported',
          description: `Your incident has been submitted. Reference: ${result.data.incident_number}`,
        });
        onSuccess?.(result.data.id);
      } else {
        throw new Error(result.error || 'Failed to submit incident');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit incident. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          Report an Incident
        </CardTitle>
        <CardDescription>
          Quickly report urgent civic infrastructure issues. Our response team will be notified immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {['Details', 'Location', 'Contact', 'Review'].map((label, index) => (
            <div key={label} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step > index + 1 ? 'bg-green-500 text-white' :
                step === index + 1 ? 'bg-blue-500 text-white' :
                'bg-muted text-muted-foreground'
              )}>
                {step > index + 1 ? '✓' : index + 1}
              </div>
              <span className={cn(
                'ml-2 text-sm hidden sm:inline',
                step === index + 1 ? 'font-medium' : 'text-muted-foreground'
              )}>
                {label}
              </span>
              {index < 3 && <div className="w-8 sm:w-16 h-0.5 bg-muted mx-2 hidden sm:block" />}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of the incident" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide as much detail as possible about what happened, when, and what you observed..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {incidentCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                              </span>
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
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity Level *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                          {severityOptions.map((option) => (
                            <Label
                              key={option.value}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                                field.value === option.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-muted hover:border-muted-foreground/50'
                              )}
                            >
                              <RadioGroupItem value={option.value} className="sr-only" />
                              <option.icon className={cn('h-5 w-5', option.color)} />
                              <div>
                                <p className={cn('font-medium', option.color)}>{option.label}</p>
                                <p className="text-xs text-muted-foreground">{option.description}</p>
                              </div>
                            </Label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Location Information</p>
                      <p className="text-sm text-yellow-700">
                        Please provide the incident location. If using mobile, we can use your current location.
                      </p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="location.latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude *</FormLabel>
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
                      <FormLabel>Longitude *</FormLabel>
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

                <FormField
                  control={form.control}
                  name="affected_customers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Affected Customers (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 50"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Provide your contact information so we can follow up if needed. This is optional.
                </p>

                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="John Doe" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="tel" placeholder="+1 (555) 000-0000" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="email" placeholder="john@example.com" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additional_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any other relevant details..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Review Your Report</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Severity:</span>
                    <span className={cn(
                      'font-medium capitalize',
                      form.watch('severity') === 'critical' && 'text-red-600',
                      form.watch('severity') === 'high' && 'text-orange-600',
                      form.watch('severity') === 'medium' && 'text-yellow-600',
                      form.watch('severity') === 'low' && 'text-blue-600'
                    )}>
                      {form.watch('severity')}
                    </span>

                    <span className="text-muted-foreground">Category:</span>
                    <span>{form.watch('category')}</span>

                    <span className="text-muted-foreground">Title:</span>
                    <span>{form.watch('title')}</span>

                    <span className="text-muted-foreground">Location:</span>
                    <span>
                      {form.watch('location.latitude')}, {form.watch('location.longitude')}
                    </span>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Description:</span>
                    <p className="text-sm mt-1">{form.watch('description')}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Critical incidents receive priority response</p>
                      <p className="text-sm text-red-700">
                        For immediate life-threatening emergencies, please call 911 first.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Back
                </Button>
              ) : (
                onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )
              )}

              {step < 4 ? (
                <Button type="button" onClick={nextStep}>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Incident Report
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
