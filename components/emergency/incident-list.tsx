// Emergency Incident List Component
// Phase 1: Core Infrastructure
// Displays list of incidents with filtering and real-time updates

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EmergencyIncident, IncidentFilters, IncidentStatus, IncidentSeverity } from '@/types/emergency'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  AlertTriangle, 
  Flame, 
  Siren, 
  Zap, 
  Waves, 
  TreePine, 
  Building2,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Clock,
  Users
} from 'lucide-react'

// Status badge colors
const statusColors: Record<IncidentStatus, string> = {
  detected: 'bg-blue-500',
  investigating: 'bg-yellow-500',
  responding: 'bg-orange-500',
  contained: 'bg-purple-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-500'
}

// Severity badge colors
const severityColors: Record<IncidentSeverity, string> = {
  critical: 'bg-red-600',
  major: 'bg-orange-500',
  moderate: 'bg-yellow-500',
  minor: 'bg-blue-500',
  low: 'bg-green-500'
}

// Incident type icons
const incidentTypeIcons: Record<string, React.ReactNode> = {
  fire: <Flame className="h-4 w-4 text-orange-500" />,
  medical: <Users className="h-4 w-4 text-red-500" />,
  flood: <Waves className="h-4 w-4 text-blue-500" />,
  earthquake: <Building2 className="h-4 w-4 text-gray-500" />,
  storm: <Waves className="h-4 w-4 text-cyan-500" />,
  hazmat: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  search_and_rescue: <Search className="h-4 w-4 text-purple-500" />,
  infrastructure: <Building2 className="h-4 w-4 text-gray-500" />,
  power_outage: <Zap className="h-4 w-4 text-yellow-500" />,
  other: <Siren className="h-4 w-4 text-gray-500" />
}

interface IncidentListProps {
  initialFilters?: IncidentFilters
  onIncidentClick?: (incident: EmergencyIncident) => void
  showActiveOnly?: boolean
}

export function IncidentList({ 
  initialFilters, 
  onIncidentClick,
  showActiveOnly = false 
}: IncidentListProps) {
  const supabase = createClient()
  
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<IncidentFilters>(initialFilters || {})
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  
  // Fetch incidents
  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      
      if (severityFilter !== 'all') {
        params.set('severity', severityFilter)
      }
      
      if (showActiveOnly || filters.activeOnly) {
        params.set('active', 'true')
      }
      
      if (filters.limit) {
        params.set('limit', filters.limit.toString())
      }
      
      const response = await fetch(`/api/emergency/incidents?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setIncidents(data.data)
      } else {
        setError(data.error || 'Failed to fetch incidents')
      }
    } catch (err) {
      setError('Network error while fetching incidents')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, severityFilter, showActiveOnly, filters])
  
  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchIncidents()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('emergency-incidents-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'emergency',
          table: 'incidents'
        },
        () => {
          fetchIncidents()
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchIncidents, supabase])
  
  // Filter incidents by search query
  const filteredIncidents = incidents.filter(incident => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      incident.title.toLowerCase().includes(query) ||
      incident.incidentNumber.toLowerCase().includes(query) ||
      incident.description?.toLowerCase().includes(query) ||
      incident.locationCity?.toLowerCase().includes(query)
    )
  })
  
  // Format status for display
  const formatStatus = (status: IncidentStatus): string => {
    const labels: Record<IncidentStatus, string> = {
      detected: 'Detected',
      investigating: 'Investigating',
      responding: 'Responding',
      contained: 'Contained',
      resolved: 'Resolved',
      closed: 'Closed'
    }
    return labels[status] || status
  }
  
  // Format severity for display
  const formatSeverity = (severity: IncidentSeverity): string => {
    const labels: Record<IncidentSeverity, string> = {
      critical: 'Critical',
      major: 'Major',
      moderate: 'Moderate',
      minor: 'Minor',
      low: 'Low'
    }
    return labels[severity] || severity
  }
  
  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }
  
  if (loading && incidents.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }
  
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={fetchIncidents} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="detected">Detected</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="responding">Responding</SelectItem>
            <SelectItem value="contained">Contained</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="icon" onClick={fetchIncidents}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Incident Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredIncidents.length} of {incidents.length} incidents
        {showActiveOnly && ' (active only)'}
      </div>
      
      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Siren className="mx-auto h-12 w-12 opacity-20" />
              <p className="mt-4">No incidents found</p>
            </CardContent>
          </Card>
        ) : (
          filteredIncidents.map(incident => (
            <Card 
              key={incident.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onIncidentClick?.(incident)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-1">
                    {incidentTypeIcons[incident.incidentType] || incidentTypeIcons.other}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {incident.incidentNumber}
                      </span>
                      <Badge className={severityColors[incident.severity]}>
                        {formatSeverity(incident.severity)}
                      </Badge>
                      <Badge className={statusColors[incident.status]}>
                        {formatStatus(incident.status)}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold mt-1 truncate">{incident.title}</h3>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {incident.locationCity || incident.locationAddress || 'Unknown location'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(incident.detectedAt)}</span>
                      </div>
                      
                      {incident.affectedPopulation && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>~{incident.affectedPopulation} affected</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
