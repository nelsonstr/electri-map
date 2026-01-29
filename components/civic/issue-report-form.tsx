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
import dynamic from 'next/dynamic';
import { MediaUploader } from './media-uploader';
import { CategorySelector } from './category-selector';
import { MapPin, Camera, Send, Loader2 } from 'lucide-react';
import type { IssueCategory, IssuePriority, IssueLocation } from '@/types/civic-issue';

const LocationPickerMap = dynamic(
  () => import('./location-picker-map').then((mod) => mod.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
        Loading Map...
      </div>
    ),
  }
);

const issueFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.string().min(1, 'Please select a category'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  reporterName: z.string().min(2, 'Name is required'),
  reporterPhone: z.string().optional(),
  reporterEmail: z.string().email('Invalid email').optional().or(z.literal('')),
});

type IssueFormData = z.infer<typeof issueFormSchema>;

interface IssueReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function IssueReportForm({ onSuccess, onCancel }: IssueReportFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<IssueLocation | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueFormSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const handleLocationSelect = useCallback((lat: number, lng: number, address?: string) => {
    setLocation({
      latitude: lat,
      longitude: lng,
      address,
    });
  }, []);

  const handleMediaChange = useCallback((files: File[]) => {
    setMediaFiles(files);
  }, []);

  const onSubmit = async (data: IssueFormData) => {
    if (!location) {
      toast({
        title: 'Location Required',
        description: 'Please select a location on the map',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = {
        ...data,
        location,
        media_files: mediaFiles,
      };

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Issue Reported!',
          description: 'Your report has been submitted successfully. Reference ID: ' + result.data.id.slice(0, 8),
          variant: 'default',
        });
        
        form.reset();
        setLocation(null);
        setMediaFiles([]);
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Failed to submit issue');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit issue',
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
          Report an Issue
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
                  <CategorySelector
                    value={field.value}
                    onValueChange={field.onChange}
                  />
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

            {/* Location Picker */}
            <div className="space-y-2">
              <FormLabel>Location</FormLabel>
              <LocationPickerMap
                onLocationSelect={handleLocationSelect}
                selectedLocation={location}
              />
              {location && (
                <p className="text-sm text-muted-foreground">
                  Selected: {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                </p>
              )}
            </div>

            {/* Media Upload */}
            <div className="space-y-2">
              <FormLabel>Photos & Videos (Optional)</FormLabel>
              <MediaUploader
                onChange={handleMediaChange}
                maxFiles={5}
                maxSize={10 * 1024 * 1024} // 10MB
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                  'video/*': ['.mp4', '.mov', '.avi'],
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
                      <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                      <SelectItem value="medium">Medium - Affects daily life</SelectItem>
                      <SelectItem value="high">High - Safety concern</SelectItem>
                      <SelectItem value="critical">Critical - Emergency situation</SelectItem>
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
                name="reporterName"
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
                name="reporterPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    Submit Report
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
