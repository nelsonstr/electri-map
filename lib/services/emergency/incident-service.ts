// Emergency Incident Service
// Phase 1: Core Infrastructure
// Service layer for incident CRUD operations and business logic

import { createClient } from '@/lib/supabase/server'
import type { 
  EmergencyIncident, 
  CreateIncidentInput, 
  UpdateIncidentInput,
  IncidentFilters,
  IncidentStatus,
  IncidentSeverity,
  IncidentType,
  IncidentPriority
} from '@/types/emergency'

// ============================================================================
// Create Incident
// ============================================================================

export async function createIncident(input: CreateIncidentInput): Promise<EmergencyIncident> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('create_emergency_incident', {
      p_title: input.title,
      p_description: input.description,
      p_incident_type: input.incidentType,
      p_severity: input.severity,
      p_priority: input.priority,
      p_location_lat: input.location.coordinates.latitude,
      p_location_lng: input.location.coordinates.longitude,
      p_location_address: input.location.address,
      p_location_city: input.location.city,
      p_location_municipality: input.location.municipality,
      p_location_district: input.location.district,
      p_reporting_user_id: input.reportingUserId,
      p_source: input.source,
      p_notes: input.notes
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create incident: ${error.message}`)
  }
  
  return mapIncidentRow(data)
}

// ============================================================================
// Get Incident by ID
// ============================================================================

export async function getIncidentById(id: string): Promise<EmergencyIncident | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get incident: ${error.message}`)
  }
  
  return mapIncidentRow(data)
}

// ============================================================================
// Get Incident by Number
// ============================================================================

export async function getIncidentByNumber(incidentNumber: string): Promise<EmergencyIncident | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('incident_number', incidentNumber)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get incident: ${error.message}`)
  }
  
  return mapIncidentRow(data)
}

// ============================================================================
// List Incidents with Filters
// ============================================================================

export async function listIncidents(filters?: IncidentFilters): Promise<EmergencyIncident[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('incidents')
    .select('*')
    .order('detected_at', { ascending: false })
  
  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }
  
  if (filters?.severity && filters.severity.length > 0) {
    query = query.in('severity', filters.severity)
  }
  
  if (filters?.incidentType && filters.incidentType.length > 0) {
    query = query.in('incident_type', filters.incidentType)
  }
  
  if (filters?.agencyId) {
    query = query.contains('agencies_involved', [filters.agencyId])
  }
  
  if (filters?.incidentCommanderId) {
    query = query.eq('incident_commander_id', filters.incidentCommanderId)
  }
  
  if (filters?.activeOnly) {
    query = query.not('status', 'in', `('closed', 'resolved')`)
  }
  
  if (filters?.offset !== undefined || filters?.limit !== undefined) {
    const from = filters?.offset || 0
    const to = filters?.limit ? from + filters.limit - 1 : from + 99
    query = query.range(from, to)
  }
  
  // Date range filter
  if (filters?.dateFrom) {
    query = query.gte('detected_at', filters.dateFrom.toISOString())
  }
  
  if (filters?.dateTo) {
    query = query.lte('detected_at', filters.dateTo.toISOString())
  }
  
  // Bounding box filter
  if (filters?.boundingBox) {
    query = query.filter('location_point', 'intersects', {
      type: 'Point',
      coordinates: [
        filters.boundingBox.west,
        filters.boundingBox.south
      ],
      $nx: filters.boundingBox.north,
      $ny: filters.boundingBox.east
    })
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to list incidents: ${error.message}`)
  }
  
  return (data || []).map(mapIncidentRow)
}

// ============================================================================
// Update Incident
// ============================================================================

export async function updateIncident(input: UpdateIncidentInput): Promise<EmergencyIncident> {
  const supabase = createClient()
  
  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }
  
  if (input.title !== undefined) updateData.title = input.title
  if (input.description !== undefined) updateData.description = input.description
  if (input.incidentType !== undefined) updateData.incident_type = input.incidentType
  if (input.severity !== undefined) updateData.severity = input.severity
  if (input.status !== undefined) updateData.status = input.status
  if (input.priority !== undefined) updateData.priority = input.priority
  if (input.location !== undefined && input.location.coordinates) {
    updateData.location_point = `POINT(${input.location.coordinates.longitude} ${input.location.coordinates.latitude})`
    if (input.location.address !== undefined) updateData.location_address = input.location.address
    if (input.location.city !== undefined) updateData.location_city = input.location.city
  }
  if (input.incidentCommanderId !== undefined) updateData.incident_commander_id = input.incidentCommanderId
  if (input.assignedUnitId !== undefined) updateData.assigned_unit_id = input.assignedUnitId
  if (input.agenciesInvolved !== undefined) updateData.agencies_involved = input.agenciesInvolved
  if (input.resourcesRequired !== undefined) updateData.resources_required = input.resourcesRequired
  if (input.affectedPopulation !== undefined) updateData.affected_population = input.affectedPopulation
  if (input.estimatedDamage !== undefined) updateData.estimated_damage = input.estimatedDamage
  if (input.notes !== undefined) updateData.notes = input.notes
  
  // Handle status timestamps
  if (input.status === 'responding' && input.status !== undefined) {
    updateData.responded_at = new Date().toISOString()
  } else if (input.status === 'contained') {
    updateData.contained_at = new Date().toISOString()
  } else if (input.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
  } else if (input.status === 'closed') {
    updateData.closed_at = new Date().toISOString()
  }
  
  // Add to status history
  if (input.status !== undefined) {
    const { data: currentData } = await supabase
      .from('incidents')
      .select('status_history')
      .eq('id', input.id)
      .single()
    
    const history = currentData?.status_history || []
    history.push({
      status: input.status,
      timestamp: new Date().toISOString()
    })
    updateData.status_history = history
  }
  
  const { data, error } = await supabase
    .from('incidents')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update incident: ${error.message}`)
  }
  
  return mapIncidentRow(data)
}

// ============================================================================
// Update Incident Status
// ============================================================================

export async function updateIncidentStatus(
  id: string, 
  status: IncidentStatus,
  userId: string
): Promise<EmergencyIncident> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('update_incident_status', {
      p_id: id,
      p_status: status,
      p_user_id: userId
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update incident status: ${error.message}`)
  }
  
  return mapIncidentRow(data)
}

// ============================================================================
// Add Timeline Event
// ============================================================================

export async function addTimelineEvent(
  incidentId: string,
  event: {
    type: string
    title: string
    description?: string
    data?: Record<string, unknown>
    userId?: string
    userName?: string
  }
): Promise<EmergencyIncident> {
  const supabase = createClient()
  
  // Get current timeline
  const { data: currentData } = await supabase
    .from('incidents')
    .select('timeline')
    .eq('id', incidentId)
    .single()
  
  const timeline = currentData?.timeline || []
  
  // Add new event
  timeline.push({
    ...event,
    timestamp: new Date().toISOString()
  })
  
  const { data, error } = await supabase
    .from('incidents')
    .update({ 
      timeline,
      updated_at: new Date().toISOString()
    })
    .eq('id', incidentId)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to add timeline event: ${error.message}`)
  }
  
  return mapIncidentRow(data)
}

// ============================================================================
// Assign Incident Commander
// ============================================================================

export async function assignIncidentCommander(
  incidentId: string,
  commanderId: string
): Promise<EmergencyIncident> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('incidents')
    .update({
      incident_commander_id: commanderId,
      updated_at: new Date().toISOString()
    })
    .eq('id', incidentId)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to assign incident commander: ${error.message}`)
  }
  
  return mapIncidentRow(data)
}

// ============================================================================
// Add Agency to Incident
// ============================================================================

export async function addAgencyToIncident(
  incidentId: string,
  agencyId: string
): Promise<EmergencyIncident> {
  const supabase = createClient()
  
  // Get current agencies
  const { data: currentData } = await supabase
    .from('incidents')
    .select('agencies_involved')
    .eq('id', incidentId)
    .single()
  
  const agencies = currentData?.agencies_involved || []
  
  // Add agency if not already present
  if (!agencies.includes(agencyId)) {
    agencies.push(agencyId)
  }
  
  const { data, error } = await supabase
    .from('incidents')
    .update({
      agencies_involved: agencies,
      updated_at: new Date().toISOString()
    })
    .eq('id', incidentId)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to add agency to incident: ${error.message}`)
  }
  
  return mapIncidentRow(data)
}

// ============================================================================
// Get Active Incidents Count
// ============================================================================

export async function getActiveIncidentsCount(): Promise<{
  total: number
  bySeverity: Record<IncidentSeverity, number>
  byType: Record<string, number>
}> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('incidents')
    .select('severity, incident_type')
    .not('status', 'in', `('closed', 'resolved')`)
  
  if (error) {
    throw new Error(`Failed to get active incidents count: ${error.message}`)
  }
  
  const result = {
    total: data.length,
    bySeverity: {} as Record<IncidentSeverity, number>,
    byType: {} as Record<string, number>
  }
  
  for (const incident of data) {
    // Count by severity
    result.bySeverity[incident.severity as IncidentSeverity] = 
      (result.bySeverity[incident.severity as IncidentSeverity] || 0) + 1
    
    // Count by type
    result.byType[incident.incident_type] = 
      (result.byType[incident.incident_type] || 0) + 1
  }
  
  return result
}

// ============================================================================
// Search Incidents
// ============================================================================

export async function searchIncidents(query: string): Promise<EmergencyIncident[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,incident_number.ilike.%${query}%`)
    .order('detected_at', { ascending: false })
    .limit(20)
  
  if (error) {
    throw new Error(`Failed to search incidents: ${error.message}`)
  }
  
  return (data || []).map(mapIncidentRow)
}

// ============================================================================
// Get Incidents Near Location
// ============================================================================

export async function getIncidentsNearLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  limit: number = 50
): Promise<EmergencyIncident[]> {
  const supabase = createClient()
  
  // Use PostGIS for distance calculation
  const { data, error } = await supabase
    .rpc('incidents_near_location', {
      p_lat: latitude,
      p_lng: longitude,
      p_radius_km: radiusKm,
      p_limit: limit
    })
  
  if (error) {
    throw new Error(`Failed to get nearby incidents: ${error.message}`)
  }
  
  return (data || []).map(mapIncidentRow)
}

// ============================================================================
// Helper: Map Database Row to Type
// ============================================================================

function mapIncidentRow(row: Record<string, unknown>): EmergencyIncident {
  const locationPoint = row.location_point as string | null
  
  let coords = {
    latitude: (row.latitude as number) || 0,
    longitude: (row.longitude as number) || 0
  }

  if (locationPoint && locationPoint.startsWith('POINT(')) {
    const matches = locationPoint.match(/POINT\(([-\d.]+) ([-\d.]+)\)/)
    if (matches) {
      coords = {
        latitude: parseFloat(matches[2]),
        longitude: parseFloat(matches[1])
      }
    }
  }
  
  return {
    id: row.id as string,
    incidentNumber: row.incident_number as string,
    title: row.title as string,
    description: row.description as string || '',
    incidentType: (row.incident_type as IncidentType) || 'other',
    severity: (row.severity as IncidentSeverity) || 'moderate',
    status: (row.status as IncidentStatus) || 'detected',
    priority: (row.priority as IncidentPriority) || 3,
    location: {
      coordinates: coords,
      city: (row.location_city as string) || undefined,
      address: (row.location_address as string) || undefined,
      municipality: (row.location_municipality as string) || undefined,
      district: (row.location_district as string) || undefined,
      country: 'Portugal'
    },
    detectedAt: row.detected_at ? new Date(row.detected_at as string) : new Date(),
    reportedAt: row.reported_at ? new Date(row.reported_at as string) : undefined,
    closedAt: row.closed_at ? new Date(row.closed_at as string) : undefined,
    reportingUserId: (row.reporting_user_id as string) || '',
    reportingUserName: (row.reporting_user_name as string) || 'Anonymous',
    agenciesInvolved: (row.agencies_involved as string[]) || [],
    resourcesAllocated: (row.resources_allocated as number) || 0,
    resourcesRequired: (row.resources_required as number) || 0,
    tags: (row.tags as string[]) || [],
    createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),
    lastUpdatedBy: (row.last_updated_by as string) || ''
  }
}

// ============================================================================
// Real-time Subscription Helpers
// ============================================================================

export function subscribeToIncidents(
  callback: (incident: EmergencyIncident, type: 'INSERT' | 'UPDATE' | 'DELETE') => void
) {
  const supabase = createClient()
  
  const subscription = supabase
    .channel('emergency-incidents')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'incidents'
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          callback(mapIncidentRow(payload.new as Record<string, unknown>), 'INSERT')
        } else if (payload.eventType === 'UPDATE') {
          callback(mapIncidentRow(payload.new as Record<string, unknown>), 'UPDATE')
        } else if (payload.eventType === 'DELETE') {
          callback({ id: payload.old.id } as EmergencyIncident, 'DELETE')
        }
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(subscription)
  }
}
