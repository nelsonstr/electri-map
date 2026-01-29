"use client";

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { LocationPickerMap } from '@/components/civic/location-picker-map';
import { MediaUploader } from '@/components/civic/media-uploader';
import { CategorySelector } from '@/components/civic/category-selector';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, Camera, Send, Loader2, ChevronRight, ChevronLeft, 
  CheckCircle2, AlertTriangle, Clock, User, Phone, Mail 
} from 'lucide-react';

// Service category taxonomy based on support-system-architecture.md
const serviceCategories = [
  { id: 'electrical', label: 'Electrical Systems', icon: '⚡', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { id: 'telecommunications', label: 'Telecommunications', icon: '📞', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'road_networks', label: 'Road Networks', icon: '🛣️', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'water_sanitation', label: 'Water & Sanitation', icon: '💧', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  { id: 'gas_distribution', label: 'Gas Distribution', icon: '🔥', color: 'text-red-600', bgColor: 'bg-red-100' },
  { id: 'public_buildings', label: 'Public Buildings', icon: '🏛️', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  { id: 'waste_management', label: 'Waste Management', icon: '🗑️', color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'public_safety', label: 'Public Safety', icon: '🚨', color: 'text-purple-600', bgColor: 'bg-purple-100' },
];

const subcategories: Record<string, { id: string; label: string }[]> = {
  electrical: [
    { id: 'power_distribution', label: 'Power Distribution' },
    { id: 'public_lighting', label: 'Public Lighting' },
    { id: 'substations', label: 'Substations & Equipment' },
  ],
  telecommunications: [
    { id: 'fiber_optics', label: 'Fiber Optic Networks' },
    { id: 'broadband', label: 'Broadband Services' },
    { id: 'cellular', label: 'Cellular Infrastructure' },
  ],
  road_networks: [
    { id: 'pavement', label: 'Pavement Conditions' },
    { id: 'signage', label: 'Traffic Signage' },
    { id: 'traffic_signals', label: 'Traffic Signals' },
    { id: 'sidewalks', label: 'Sidewalks & Pathways' },
  ],
  water_sanitation: [
    { id: 'water_supply', label: 'Water Supply' },
    { id: 'sanitary_sewer', label: 'Sanitary Sewer' },
    { id: 'storm_drainage', label: 'Storm Drainage' },
  ],
  gas_distribution: [
    { id: 'pipeline', label: 'Pipeline Integrity' },
    { id: 'meters', label: 'Metering Equipment' },
    { id: 'leak_response', label: 'Leak Response' },
  ],
  public_buildings: [
    { id: 'municipal', label: 'Municipal Buildings' },
    { id: 'recreation', label: 'Recreation Facilities' },
    { id: 'emergency', label: 'Emergency Facilities' },
  ],
  waste_management: [
    { id: 'collection', label: 'Collection Services' },
    { id: 'recycling', label: 'Recycling Programs' },
    { id: 'disposal', label: 'Disposal Facilities' },
  ],
  public_safety: [
    { id: 'surveillance', label: 'Surveillance Systems' },
    { id: 'emergency_systems', label: 'Emergency Systems' },
    { id: 'access_control', label: 'Access Control' },
  ],
};

const priorityLevels = [
  { id: 'minor', label: 'Minor', description: 'Minor inconvenience, routine response acceptable', color: 'bg-green-500' },
  { id: 'moderate', label: 'Moderate', description: 'Affects daily life, prompt response needed', color: 'bg-yellow-500' },
  { id: 'major', label: 'Major', description: 'Significant disruption, priority response', color: 'bg-orange-500' },
  { id: 'critical', label: 'Critical', description: 'Emergency, immediate response required', color: 'bg-red-500' },
];

const intakeChannels = [
  { id: 'web', label: 'Web Portal', icon: '🌐' },
  { id: 'mobile', label: 'Mobile App', icon: '📱' },
  { id: 'phone', label: 'Phone Call', icon: '📞' },
  { id: 'kiosk', label: 'In-Person Kiosk', icon: '🏪' },
  { id: 'email', label: 'Email', icon: '📧' },
];

// Form validation schema
const serviceRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Please provide more detail about your request').max(2000),
  category: z.string().min(1, 'Please select a category'),
  subcategory: z.string().optional(),
  priority: z.enum(['minor', 'moderate', 'major', 'critical']).default('moderate'),
  intake_channel: z.string().min(1, 'Please select how you\'re submitting this request'),
  customer_name: z.string().min(2, 'Name is required'),
  customer_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  customer_phone: z.string().optional(),
  preferred_contact: z.enum(['email', 'phone', 'both']).default('email'),
});

type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

interface ServiceRequestFormProps {
  onSuccess?: (requestId: string) => void;
  onCancel?: () => void;
  preselectedCategory?: string;
}

export function ServiceRequestForm({ onSuccess, onCancel, preselectedCategory }: ServiceRequestFormProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(preselectedCategory || '');

  const form = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      priority: 'moderate',
      intake_channel: 'web',
      preferred_contact: 'email',
    },
  });

  const steps = [
    { title: 'Category', description: 'Select service category' },
    { title: 'Details', description: 'Describe your request' },
    { title: 'Location', description: 'Specify location' },
    { title: 'Contact', description: 'Your information' },
    { title: 'Review', description: 'Review & submit' },
  ];

  const handleLocationSelect = useCallback((lat: number, lng: number, address?: string) => {
    setLocation({ latitude: lat, longitude: lng, address });
  }, []);

  const handleMediaChange = useCallback((files: File[]) => {
    setMediaFiles(files);
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    form.setValue('category', categoryId);
    form.setValue('subcategory', '');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!form.getValues('category');
      case 1:
        return !!(form.getValues('title') && form.getValues('title').length >= 5 && 
                  form.getValues('description') && form.getValues('description').length >= 20);
      case 2:
        return !!location;
      case 3:
        return !!form.getValues('customer_name') && 
               (!!form.getValues('customer_email') || !!form.getValues('customer_phone'));
      default:
        return true;
    }
  };

  const onSubmit = async (data: ServiceRequestFormData) => {
    setIsSubmitting(true);

    try {
      const formData = {
        ...data,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        } : undefined,
        media_urls: mediaFiles,
      };

      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Request Submitted!',
          description: `Your service request has been submitted. Reference: ${result.data.request_number || result.data.id.slice(0, 8)}`,
          variant: 'default',
        });
        
        onSuccess?.(result.data.id);
      } else {
        throw new Error(result.error || 'Failed to submit request');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit service request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Select Service Category</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {serviceCategories.map((category) => {
                      const isSelected = field.value === category.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategorySelect(category.id)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left
                            ${isSelected 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50 hover:bg-primary/5'
                            }`}
                        >
                          <span className="text-2xl">{category.icon}</span>
                          <span className={`text-sm font-medium ${category.color}`}>
                            {category.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedCategory && subcategories[selectedCategory] && (
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Subcategory (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subcategories[selectedCategory].map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Priority Level</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {priorityLevels.map((priority) => {
                      const isSelected = field.value === priority.id;
                      return (
                        <button
                          key={priority.id}
                          type="button"
                          onClick={() => field.onChange(priority.id)}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left
                            ${isSelected 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50 hover:bg-primary/5'
                            }`}
                        >
                          <div className={`w-4 h-4 rounded-full mt-0.5 ${priority.color} flex-shrink-0`} />
                          <div>
                            <p className="font-medium">{priority.label}</p>
                            <p className="text-sm text-muted-foreground">{priority.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Request Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Brief description of your request" 
                      {...field}
                      className="text-lg py-6"
                    />
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
                  <FormLabel className="text-lg font-semibold">Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide as much detail as possible about your request. Include relevant dates, times, and any other information that might help us address your issue..."
                      className="min-h-[150px] text-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel className="text-lg font-semibold">Photos & Supporting Documents</FormLabel>
              <MediaUploader
                onChange={handleMediaChange}
                maxFiles={5}
                maxSize={10 * 1024 * 1024}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                  'video/*': ['.mp4', '.mov', '.avi'],
                  'application/pdf': ['.pdf'],
                }}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Select Location</h3>
              <p className="text-muted-foreground">Click on the map to mark the location of your request</p>
            </div>
            
            <div className="h-[400px] rounded-xl overflow-hidden border-2">
              <LocationPickerMap
                onLocationSelect={handleLocationSelect}
                selectedLocation={location}
              />
            </div>

            {location && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Selected Location</p>
                  <p className="text-sm text-muted-foreground">
                    {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(null)}
                  className="ml-auto"
                >
                  Change
                </Button>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">
                    <User className="inline h-4 w-4 mr-2" />
                    Your Name *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} className="text-lg py-6" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" type="email" {...field} className="text-lg py-6" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">
                      <Phone className="inline h-4 w-4 mr-2" />
                      Phone (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" type="tel" {...field} className="text-lg py-6" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferred_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Preferred Contact Method</FormLabel>
                  <div className="flex gap-3 mt-2">
                    {[
                      { id: 'email', label: 'Email' },
                      { id: 'phone', label: 'Phone' },
                      { id: 'both', label: 'Either' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => field.onChange(method.id)}
                        className={`flex-1 py-3 rounded-lg border-2 transition-all font-medium
                          ${field.value === method.id 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-border hover:border-primary/50'
                          }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="intake_channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">How did you hear about this service?</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                    {intakeChannels.map((channel) => {
                      const isSelected = field.value === channel.id;
                      return (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => field.onChange(channel.id)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                            ${isSelected 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50 hover:bg-primary/5'
                            }`}
                        >
                          <span className="text-2xl">{channel.icon}</span>
                          <span className="text-sm font-medium">{channel.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Review Your Request</h3>
              <p className="text-muted-foreground">Please review all details before submitting</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{form.getValues('title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">
                      {serviceCategories.find(c => c.id === form.getValues('category'))?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <p className="font-medium capitalize">{form.getValues('priority')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1">{form.getValues('description')}</p>
                </div>

                {location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">
                      {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">{form.getValues('customer_name')}</p>
                  {form.getValues('customer_email') && <p className="text-sm">{form.getValues('customer_email')}</p>}
                  {form.getValues('customer_phone') && <p className="text-sm">{form.getValues('customer_phone')}</p>}
                </div>

                {mediaFiles.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Attachments</p>
                    <p className="font-medium">{mediaFiles.length} file(s) attached</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <CheckCircle2 className="h-7 w-7 text-primary" />
          Submit Service Request
        </CardTitle>
        <CardDescription>
          Complete the form below to submit a new service request
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.title} className="flex items-center">
                  <div className={`flex flex-col items-center ${index < steps.length ? 'relative' : ''}`}>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                        ${isActive ? 'bg-primary text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <p className={`text-xs mt-2 hidden md:block ${isActive ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${index < currentStep ? 'bg-green-500' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground md:hidden">
            {steps[currentStep].title} - {steps[currentStep].description}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {renderStepContent()}
            </form>
          </Form>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          )}
        </div>

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="mt-4 w-full"
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
