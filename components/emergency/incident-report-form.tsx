// Emergency Incident Report Form
// Phase 1: Core Infrastructure
// Form for reporting new emergencies

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CreateIncidentInput, IncidentSeverity, IncidentStatus } from '@/types/emergency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Flame, Waves, Wind, Building2, Zap, Siren, Upload, Loader2, CheckCircle2 } from 'lucide-react'
import { LocationPickerMap } from '@/components/location-picker-map'

// Incident types
const incidentTypes = [
  { value: 'fire', label: 'Fire', icon: <Flame className="h-4 w-4" /> },
  { value: 'medical', label: 'Medical Emergency', icon: <Siren className="h-4 w-4" /> },
  { value: 'flood', label: 'Flood', icon: <Waves className="h-4 w-4" /> },
  { value: 'storm', label: 'Storm', icon: <Wind className="h-4 w-4" /> },
  { value: 'earthquake', label: 'Earthquake', icon: <Building2 className="h-4 w-4" /> },
  { value: 'power_outage', label: 'Power Outage', icon: <Zap className="h-4 w-4" /> },
  { value: 'hazmat', label: 'Hazardous Materials', icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <Siren className="h-4 w-4" /> }
]

// Severity levels
const severityLevels = [
  { value: 'critical', label: 'Critical - Immediate threat to life', color: 'bg-red-600' },
  { value: 'major', label: 'Major - Serious threat, multiple resources needed', color: 'bg-orange-500' },
  { value: 'moderate', label: 'Moderate - Significant incident', color: 'bg-yellow-500' },
  { value: 'minor', label: 'Minor - Limited impact', color: 'bg-blue-500' },
  { value: 'low', label: 'Low - Minor incident', color: 'bg-green-500' }
]

// Priority options
const priorityOptions = [
  { value: 'emergency', label: 'Emergency - Response within minutes' },
  { value: 'urgent', label: 'Urgent - Response within 15 minutes' },
  { value: 'priority', label: 'Priority - Response within 30 minutes' },
  { value: 'routine', label: 'Routine - Response within 1 hour' },
  { value: 'scheduled', label: 'Scheduled - Non-urgent' }
]

// Source options
const sourceOptions = [
  { value: 'phone', label: 'Phone Call (112/911)' },
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'web', label: 'Web Report' },
  { value: 'sensor', label: 'Sensor/IoT Alert' },
  { value: 'camera', label: 'Camera/Video Detection' },
  { value: 'radio', label: 'Radio Communication' },
  { value: 'other_agency', label: 'Other Agency' },
  { value: 'citizen', label: 'Citizen Report' },
  { value: 'social_media', label: 'Social Media' }
]

interface IncidentReportFormProps {
  onSuccess?: (incidentId: string) => void
  onCancel?: () => void
  preselectedLocation?: { latitude: number; longitude: number } | null
}

export function IncidentReportForm({ 
  onSuccess, 
  onCancel,
  preselectedLocation 
}: IncidentReportFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [incidentType, setIncidentType] = useState('')
  const [severity, setSeverity] = useState<IncidentSeverity | ''>('')
  const [priority, setPriority] = useState('routine')
  const [source, setSource] = useState('')
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(
    preselectedLocation || null
  )
  const [locationAddress, setLocationAddress] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [notes, setNotes] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      if (!title || !incidentType || !severity || !location) {
        throw new Error('Please fill in all required fields')
      }
      
      const incidentData: CreateIncidentInput = {
        title,
        description,
        incidentType,
        severity,
        priority,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: locationAddress || undefined,
          city: locationCity || undefined
        },
        source: source || undefined,
        notes: notes || undefined,
        reportingUserId: (await supabase.auth.getUser()).data.user?.id || null
      }
      
      const response = await fetch('/api/emergency/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData)
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create incident')
      }
      
      setSuccess(true)
      
      // Trigger success callback or redirect
      if (onSuccess) {
        onSuccess(data.data.id)
      } else {
        // Auto-redirect to incidents page after short delay
        setTimeout(() => {
          router.push('/emergency/incidents')
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error creating incident:', err)
    } finally {
      setLoading(false)
    }
  }
  
  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <h3 className="mt-4 text-xl font-semibold text-green-800">Incident Reported Successfully</h3>
            <p className="mt-2 text-green-700">
              Your emergency report has been submitted. Emergency services have been dispatched.
            </p>
            <Button 
              className="mt-6" 
              variant="outline"
              onClick={() => {
                setSuccess(false)
                // Reset form
                setTitle('')
                setDescription('')
                setIncidentType('')
                setSeverity('')
                setLocation(null)
              }}
            >
              Report Another Incident
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Report Emergency
          </CardTitle>
          <CardDescription>
            Provide details about the emergency. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {/* Incident Type */}
          <div className="space-y-2">
            <Label htmlFor="incidentType">Incident Type *</Label>
            <Select value={incidentType} onValueChange={setIncidentType}>
              <SelectTrigger id="incidentType">
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      {type.icon}
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Incident Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the emergency"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          
          {/* Severity */}
          <div className="space-y-2">
            <Label>Severity Level *</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {severityLevels.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setSeverity(level.value as IncidentSeverity)}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${
                    severity === level.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${level.color}`} />
                    <span className="font-medium">{level.value.charAt(0).toUpperCase() + level.value.slice(1)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {level.label.split(' - ')[1]}
                  </p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the emergency..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          
          {/* Location */}
          <div className="space-y-2">
            <Label>Location *</Label>
            <div className="rounded-lg border overflow-hidden">
              <LocationPickerMap
                center={location}
                onLocationSelect={setLocation}
                height="300px"
              />
            </div>
            {location && (
              <p className="text-sm text-muted-foreground">
                Selected: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            )}
          </div>
          
          {/* Address Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Street address (if known)"
                value={locationAddress}
                onChange={e => setLocationAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City/Municipality</Label>
              <Input
                id="city"
                placeholder="City or municipality name"
                value={locationCity}
                onChange={e => setLocationCity(e.target.value)}
              />
            </div>
          </div>
          
          {/* Priority and Source */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Report Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="How was this reported?" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information that may help responders..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          {/* Media Upload (placeholder) */}
          <div className="space-y-2">
            <Label>Attach Photos/Videos</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, MP4 up to 50MB
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Siren className="mr-2 h-4 w-4" />
                  Submit Emergency Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
