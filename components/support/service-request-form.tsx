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
import { MediaUploader } from '@/components/civic/media-uploader';
import { MapPin, Camera, Send, Loader2 } from 'lucide-react';

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

const priorityLevels = [
  { id: 'low', label: 'Low', description: 'Minor inconvenience' },
  { id: 'medium', label: 'Medium', description: 'Affects daily life' },
  { id: 'high', label: 'High', description: 'Safety concern' },
];

// Form validation schema
const serviceRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Please provide more detail about your request').max(2000),
  category: z.string().min(1, 'Please select a category'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  customer_name: z.string().min(2, 'Name is required'),
  customer_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  customer_phone: z.string().optional(),
  location_address: z.string().optional(),
});

type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

interface ServiceRequestFormProps {
  onSuccess?: (requestId: string) => void;
  onCancel?: () => void;
  preselectedCategory?: string;
}

export function ServiceRequestForm({ onSuccess, onCancel, preselectedCategory }: ServiceRequestFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(preselectedCategory || '');

  const form = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const handleMediaChange = useCallback((files: File[]) => {
    setMediaFiles(files);
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    form.setValue('category', categoryId);
  };

  const onSubmit = async (data: ServiceRequestFormData) => {
    setIsSubmitting(true);

    try {
      const formData = {
        ...data,
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

        form.reset();
        setMediaFiles([]);
        setSelectedCategory('');
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Submit Service Request
        </CardTitle>
        <CardDescription>
          Help improve your community by reporting infrastructure and service problems
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
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

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide as much detail as possible about the issue..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address or location description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Media Upload */}
            <div className="space-y-2">
              <FormLabel>Photos (Optional)</FormLabel>
              <MediaUploader
                onChange={handleMediaChange}
                maxFiles={2}
                maxSize={5 * 1024 * 1024} // 5MB
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                }}
              />
            </div>

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityLevels.map((priority) => (
                        <SelectItem key={priority.id} value={priority.id}>
                          {priority.label} - {priority.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customer_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
