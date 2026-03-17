import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Emergency service type
 */
export type EmergencyServiceType = 
  | 'police'
  | 'fire'
  | 'ambulance'
  | 'search_rescue'
  | 'hazmat'
  | 'utility'
  | 'road_service'
  | 'coast_guard'
  | 'mountain_rescue'
  | 'civil_defense'

/**
 * Emergency service status
 */
export type EmergencyServiceStatus = 
  | 'available'
  | 'busy'
  | 'en_route'
  | 'on_scene'
  | 'returning'
  | 'out_of_service'
  | 'decommissioned'

/**
 * Incident priority
 */
export type IncidentPriority = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational'

/**
 * Emergency service unit
 */
export interface EmergencyServiceUnit {
  id: string
  
  // Unit info
  unitNumber: string
  callsign: string
  type: EmergencyServiceType
  
  // Agency
  agencyId: string
  agencyName: string
  
  // Status
  status: EmergencyServiceStatus
  
  // Location
  currentLocation?: {
    latitude: number
    longitude: number
    address?: string
    timestamp: string
  }
  
  // Assignment
  currentIncidentId?: string
  assignedTo?: string
  
  // Personnel
  personnelCount: number
  personnelNames?: string[]
  
  // Capabilities
  capabilities: string[]
  equipment?: string[]
  
  // Schedule
  shiftStart?: string
  shiftEnd?: string
  
  // Timestamps
  lastStatusUpdate: string
  lastLocationUpdate?: string
}

/**
 * Emergency agency
 */
export interface EmergencyAgency {
  id: string
  
  // Agency info
  name: string
  shortName: string
  type: EmergencyServiceType
  
  // Jurisdiction
  jurisdiction: {
    type: 'city' | 'county' | 'state' | 'regional' | 'national'
    name: string
    boundary?: {
      type: 'polygon'
      coordinates: number[][]
    }
  }
  
  // Contact
  contact: {
    phone: string
    fax?: string
    email?: string
    website?: string
    address?: string
  }
  
  // Dispatch
  dispatchCenter?: string
  dispatchPhone?: string
  
  // Capabilities
  services: string[]
  coverage: string[]
  
  // Status
  status: 'active' | 'inactive' | 'alert'
  alertLevel?: 'none' | 'advisory' | 'watch' | 'warning'
  
  // Integration
  integrationLevel: 'none' | 'basic' | 'standard' | 'full'
  apiEndpoint?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Emergency incident
 */
export interface EmergencyIncident {
  id: string
  
  // Incident info
  incidentNumber: string
  type: EmergencyServiceType
  category: string
  
  // Location
  location: {
    latitude: number
    longitude: number
    address?: string
    landmark?: string
    crossStreet?: string
  }
  
  // Severity
  priority: IncidentPriority
  severity?: number
  
  // Status
  status: 'reported' | 'dispatched' | 'en_route' | 'on_scene' | 'contained' | 'resolved' | 'cancelled'
  
  // Timeline
  reportedAt: string
  dispatchedAt?: string
  enRouteAt?: string
  onSceneAt?: string
  containedAt?: string
  resolvedAt?: string
  
  // Units assigned
  assignedUnits: string[]
  
  // Description
  description: string
  callerInfo?: {
    name?: string
    phone?: string
    relationship?: string
  }
  
  // Dispositions
  dispositions?: Array<{
    unitId: string
    action: string
    notes?: string
    timestamp: string
  }>
  
  // Related
  relatedIncidentIds?: string[]
  
  // Notes
  dispatchNotes?: string
  fieldNotes?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Dispatch request
 */
export interface DispatchRequest {
  id: string
  
  // Request info
  requestNumber: string
  priority: IncidentPriority
  
  // Incident details
  incidentType: EmergencyServiceType
  category: string
  description: string
  
  // Location
  location: {
    latitude: number
    longitude: number
    address?: string
    landmark?: string
  }
  
  // Caller
  caller?: {
    name?: string
    phone?: string
    callbackNumber?: string
  }
  
  // Special circumstances
  circumstances?: {
    fire?: { structureType?: string;烟火?: string;hazmat?: string }
    medical?: { patientCount?: number; nature?: string; traumaLevel?: number }
    rescue?: { victimCount?: string; accessRequired?: string; equipment?: string[] }
    hazmat?: { material?: string; container?: string; amount?: string }
  }
  
  // Resource request
  resources?: Array<{
    type: EmergencyServiceType
    quantity: number
    specificRequirements?: string[]
  }>
  
  // Dispatch info
  dispatchCenter: string
  dispatchedAt?: string
  
  // Status
  status: 'pending' | 'dispatched' | 'acknowledged' | 'completed' | 'cancelled'
  
  createdAt: string
}

/**
 * Service availability
 */
export interface ServiceAvailability {
  serviceType: EmergencyServiceType
  agencyId: string
  agencyName: string
  
  // Coverage
  coverage: {
    status: 'covered' | 'partial' | 'limited' | 'unavailable'
    unitsAvailable: number
    unitsTotal: number
    avgResponseTime?: number
  }
  
  // Current incidents
  currentIncidents: number
  
  // Alert status
  alertLevel: 'none' | 'advisory' | 'watch' | 'warning'
  
  // Last update
  lastUpdate: string
}

/**
 * CAD integration status
 */
export interface CADIntegrationStatus {
  agencyId: string
  
  // Connection
  connected: boolean
  lastHeartbeat?: string
  latency?: number
  
  // Sync
  lastSyncAt?: string
  pendingSyncs: number
  
  // Data quality
  dataFreshness: 'realtime' | 'near_realtime' | 'delayed' | 'stale'
  
  // Issues
  issues?: Array<{
    type: 'connection' | 'data' | 'sync' | 'auth'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: string
  }>
}

/**
 * First responder info
 */
export interface FirstResponderInfo {
  id: string
  
  // Personal info
  firstName: string
  lastName: string
  badgeNumber?: string
  
  // Agency
  agencyId: string
  agencyName: string
  department?: string
  
  // Role
  role: 'dispatcher' | 'supervisor' | 'field_officer' | 'commander'
  rank?: string
  
  // Certification
  certifications: string[]
  certificationsExpiry?: string
  
  // Status
  status: 'available' | 'on_duty' | 'on_break' | 'off_duty' | 'on_incident'
  currentIncidentId?: string
  
  // Contact
  radioCallsign?: string
  phone?: string
  
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating agency
 */
export const createAgencySchema = z.object({
  name: z.string().min(1).max(200),
  shortName: z.string().min(1).max(20),
  type: z.enum(['police', 'fire', 'ambulance', 'search_rescue', 'hazmat', 'utility', 'road_service', 'coast_guard', 'mountain_rescue', 'civil_defense']),
  jurisdiction: z.object({
    type: z.enum(['city', 'county', 'state', 'regional', 'national']),
    name: z.string().min(1),
    boundary: z.object({
      type: z.literal('polygon'),
      coordinates: z.array(z.array(z.number()).length(2)),
    }).optional(),
  }),
  contact: z.object({
    phone: z.string().min(1),
    fax: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    address: z.string().optional(),
  }),
  dispatchCenter: z.string().optional(),
  dispatchPhone: z.string().optional(),
  services: z.array(z.string()).optional(),
  coverage: z.array(z.string()).optional(),
})

/**
 * Schema for creating unit
 */
export const createUnitSchema = z.object({
  unitNumber: z.string().min(1).max(50),
  callsign: z.string().min(1).max(50),
  type: z.enum(['police', 'fire', 'ambulance', 'search_rescue', 'hazmat', 'utility', 'road_service', 'coast_guard', 'mountain_rescue', 'civil_defense']),
  agencyId: z.string().uuid(),
  capabilities: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  personnelCount: z.number().int().positive().optional(),
})

/**
 * Schema for dispatch request
 */
export const createDispatchRequestSchema = z.object({
  priority: z.enum(['critical', 'high', 'medium', 'low', 'informational']),
  incidentType: z.enum(['police', 'fire', 'ambulance', 'search_rescue', 'hazmat', 'utility', 'road_service', 'coast_guard', 'mountain_rescue', 'civil_defense']),
  category: z.string().min(1),
  description: z.string().min(1),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
    landmark: z.string().optional(),
  }),
  caller: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    callbackNumber: z.string().optional(),
  }).optional(),
  circumstances: z.object({
    fire: z.object({
      structureType: z.string().optional(),
     烟火: z.string().optional(),
      hazmat: z.string().optional(),
    }).optional(),
    medical: z.object({
      patientCount: z.number().optional(),
      nature: z.string().optional(),
      traumaLevel: z.number().optional(),
    }).optional(),
    rescue: z.object({
      victimCount: z.string().optional(),
      accessRequired: z.string().optional(),
      equipment: z.array(z.string()).optional(),
    }).optional(),
    hazmat: z.object({
      material: z.string().optional(),
      container: z.string().optional(),
      amount: z.string().optional(),
    }).optional(),
  }).optional(),
  resources: z.array(z.object({
    type: z.enum(['police', 'fire', 'ambulance', 'search_rescue', 'hazmat', 'utility', 'road_service', 'coast_guard', 'mountain_rescue', 'civil_defense']),
    quantity: z.number().int().positive(),
    specificRequirements: z.array(z.string()).optional(),
  })).optional(),
  dispatchCenter: z.string().optional(),
})

/**
 * Schema for updating unit status
 */
export const updateUnitStatusSchema = z.object({
  unitId: z.string().uuid(),
  status: z.enum(['available', 'busy', 'en_route', 'on_scene', 'returning', 'out_of_service', 'decommissioned']),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  incidentId: z.string().uuid().optional(),
})

/**
 * Schema for incident query
 */
export const incidentQuerySchema = z.object({
  status: z.array(z.enum(['reported', 'dispatched', 'en_route', 'on_scene', 'contained', 'resolved', 'cancelled'])).optional(),
  type: z.array(z.string()).optional(),
  priority: z.array(z.enum(['critical', 'high', 'medium', 'low', 'informational'])).optional(),
  agencyId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  boundingBox: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }).optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for service type
 */
export function getServiceTypeDisplayName(type: EmergencyServiceType): string {
  const names: Record<EmergencyServiceType, string> = {
    police: 'Police',
    fire: 'Fire Department',
    ambulance: 'EMS/Ambulance',
    search_rescue: 'Search & Rescue',
    hazmat: 'Hazmat',
    utility: 'Utility Company',
    road_service: 'Road Service',
    coast_guard: 'Coast Guard',
    mountain_rescue: 'Mountain Rescue',
    civil_defense: 'Civil Defense',
  }
  return names[type]
}

/**
 * Gets color for service type
 */
export function getServiceTypeColor(type: EmergencyServiceType): string {
  const colors: Record<EmergencyServiceType, string> = {
    police: '#1e40af',
    fire: '#dc2626',
    ambulance: '#16a34a',
    search_rescue: '#ea580c',
    hazmat: '#7c3aed',
    utility: '#0891b2',
    road_service: '#4b5563',
    coast_guard: '#0369a1',
    mountain_rescue: '#854d0e',
    civil_defense: '#65a30d',
  }
  return colors[type]
}

/**
 * Gets display name for status
 */
export function getStatusDisplayName(status: EmergencyServiceStatus): string {
  const names: Record<EmergencyServiceStatus, string> = {
    available: 'Available',
    busy: 'Busy',
    en_route: 'En Route',
    on_scene: 'On Scene',
    returning: 'Returning',
    out_of_service: 'Out of Service',
    decommissioned: 'Decommissioned',
  }
  return names[status]
}

/**
 * Gets color for status
 */
export function getStatusColor(status: EmergencyServiceStatus): string {
  const colors: Record<EmergencyServiceStatus, string> = {
    available: '#22c55e',
    busy: '#f59e0b',
    en_route: '#3b82f6',
    on_scene: '#ef4444',
    returning: '#6366f1',
    out_of_service: '#6b7280',
    decommissioned: '#9ca3af',
  }
  return colors[status]
}

/**
 * Gets display name for priority
 */
export function getPriorityDisplayName(priority: IncidentPriority): string {
  const names: Record<IncidentPriority, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    informational: 'Informational',
  }
  return names[priority]
}

/**
 * Gets color for priority
 */
export function getPriorityColor(priority: IncidentPriority): string {
  const colors: Record<IncidentPriority, string> = {
    critical: '#dc2626',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
    informational: '#3b82f6',
  }
  return colors[priority]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates an emergency agency
 */
export async function createAgency(
  input: z.infer<typeof createAgencySchema>
): Promise<EmergencyAgency> {
  const validationResult = createAgencySchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('emergency_agencies')
    .insert({
      name: input.name,
      short_name: input.shortName,
      type: input.type,
      jurisdiction: input.jurisdiction,
      contact: input.contact,
      dispatch_center: input.dispatchCenter,
      dispatch_phone: input.dispatchPhone,
      services: input.services || [],
      coverage: input.coverage || [],
      status: 'active',
      integration_level: 'basic',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating agency:', error)
    throw new Error(`Failed to create agency: ${error.message}`)
  }

  return mapAgencyFromDB(data)
}

/**
 * Gets emergency agencies
 */
export async function getAgencies(
  options?: {
    type?: EmergencyServiceType
    status?: EmergencyAgency['status']
    jurisdiction?: string
  }
): Promise<EmergencyAgency[]> {
  const supabase = createClient()

  let query = supabase
    .from('emergency_agencies')
    .select('*')
    .order('name')

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.jurisdiction) {
    query = query.eq('jurisdiction->>name', options.jurisdiction)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching agencies:', error)
    return []
  }

  return (data || []).map(mapAgencyFromDB)
}

/**
 * Gets agency by ID
 */
export async function getAgencyById(agencyId: string): Promise<EmergencyAgency | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('emergency_agencies')
    .select('*')
    .eq('id', agencyId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching agency:', error)
    return null
  }

  if (!data) return null
  return mapAgencyFromDB(data)
}

/**
 * Creates an emergency service unit
 */
export async function createUnit(
  input: z.infer<typeof createUnitSchema>
): Promise<EmergencyServiceUnit> {
  const validationResult = createUnitSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Get agency info
  const agency = await getAgencyById(input.agencyId)
  if (!agency) {
    throw new Error('Agency not found')
  }

  const { data, error } = await supabase
    .from('emergency_units')
    .insert({
      unit_number: input.unitNumber,
      callsign: input.callsign,
      type: input.type,
      agency_id: input.agencyId,
      agency_name: agency.name,
      capabilities: input.capabilities || [],
      equipment: input.equipment || [],
      personnel_count: input.personnelCount || 2,
      status: 'available',
      last_status_update: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating unit:', error)
    throw new Error(`Failed to create unit: ${error.message}`)
  }

  return mapUnitFromDB(data)
}

/**
 * Gets emergency units
 */
export async function getUnits(
  options?: {
    agencyId?: string
    type?: EmergencyServiceType
    status?: EmergencyServiceStatus
    available?: boolean
    incidentId?: string
  }
): Promise<EmergencyServiceUnit[]> {
  const supabase = createClient()

  let query = supabase
    .from('emergency_units')
    .select('*')
    .order('callsign')

  if (options?.agencyId) {
    query = query.eq('agency_id', options.agencyId)
  }

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.available) {
    query = query.eq('status', 'available')
  }

  if (options?.incidentId) {
    query = query.eq('current_incident_id', options.incidentId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching units:', error)
    return []
  }

  return (data || []).map(mapUnitFromDB)
}

/**
 * Updates unit status
 */
export async function updateUnitStatus(
  input: z.infer<typeof updateUnitStatusSchema>
): Promise<EmergencyServiceUnit> {
  const validationResult = updateUnitStatusSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status: input.status,
    last_status_update: new Date().toISOString(),
  }

  if (input.location) {
    updateData.current_location = {
      ...input.location,
      timestamp: new Date().toISOString(),
    }
    updateData.last_location_update = new Date().toISOString()
  }

  if (input.incidentId) {
    updateData.current_incident_id = input.incidentId
  }

  const { data, error } = await supabase
    .from('emergency_units')
    .update(updateData)
    .eq('id', input.unitId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating unit status:', error)
    throw new Error(`Failed to update unit: ${error.message}`)
  }

  return mapUnitFromDB(data)
}

/**
 * Creates a dispatch request
 */
export async function createDispatchRequest(
  userId: string,
  input: z.infer<typeof createDispatchRequestSchema>
): Promise<DispatchRequest> {
  const validationResult = createDispatchRequestSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const requestNumber = `D-${Date.now().toString(36).toUpperCase()}`

  const { data, error } = await supabase
    .from('dispatch_requests')
    .insert({
      request_number: requestNumber,
      priority: input.priority,
      incident_type: input.incidentType,
      category: input.category,
      description: input.description,
      location: input.location,
      caller: input.caller,
      circumstances: input.circumstances,
      resources: input.resources,
      dispatch_center: input.dispatchCenter || 'Primary',
      status: 'pending',
      created_by: userId,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating dispatch request:', error)
    throw new Error(`Failed to create dispatch request: ${error.message}`)
  }

  return mapDispatchFromDB(data)
}

/**
 * Gets dispatch requests
 */
export async function getDispatchRequests(
  options?: {
    status?: DispatchRequest['status']
    priority?: IncidentPriority
    incidentType?: EmergencyServiceType
    dispatchCenter?: string
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<DispatchRequest[]> {
  const supabase = createClient()

  let query = supabase
    .from('dispatch_requests')
    .select('*')
    .order('priority')
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.priority) {
    query = query.eq('priority', options.priority)
  }

  if (options?.incidentType) {
    query = query.eq('incident_type', options.incidentType)
  }

  if (options?.dispatchCenter) {
    query = query.eq('dispatch_center', options.dispatchCenter)
  }

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate)
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching dispatch requests:', error)
    return []
  }

  return (data || []).map(mapDispatchFromDB)
}

/**
 * Gets emergency incidents
 */
export async function getIncidents(
  input: z.infer<typeof incidentQuerySchema>
): Promise<EmergencyIncident[]> {
  const validationResult = incidentQuerySchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  let query = supabase
    .from('emergency_incidents')
    .select('*')
    .order('priority')
    .order('reported_at', { ascending: false })

  if (input.status && input.status.length > 0) {
    query = query.in('status', input.status)
  }

  if (input.type && input.type.length > 0) {
    query = query.in('type', input.type)
  }

  if (input.priority && input.priority.length > 0) {
    query = query.in('priority', input.priority)
  }

  if (input.agencyId) {
    query = query.eq('agency_id', input.agencyId)
  }

  if (input.startDate) {
    query = query.gte('reported_at', input.startDate)
  }

  if (input.endDate) {
    query = query.lte('reported_at', input.endDate)
  }

  if (input.boundingBox) {
    query = query.filter('location->>latitude', 'gte', input.boundingBox.south)
    query = query.filter('location->>latitude', 'lte', input.boundingBox.north)
    query = query.filter('location->>longitude', 'gte', input.boundingBox.west)
    query = query.filter('location->>longitude', 'lte', input.boundingBox.east)
  }

  if (input.limit) {
    query = query.limit(input.limit)
  }

  if (input.offset) {
    query = query.range(input.offset, input.offset + (input.limit || 50) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching incidents:', error)
    return []
  }

  return (data || []).map(mapIncidentFromDB)
}

/**
 * Gets incident by ID
 */
export async function getIncidentById(incidentId: string): Promise<EmergencyIncident | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('emergency_incidents')
    .select('*')
    .eq('id', incidentId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching incident:', error)
    return null
  }

  if (!data) return null
  return mapIncidentFromDB(data)
}

/**
 * Gets service availability
 */
export async function getServiceAvailability(
  jurisdiction?: string
): Promise<ServiceAvailability[]> {
  const supabase = createClient()

  // Get all agencies
  let query = supabase
    .from('emergency_agencies')
    .select('*')

  if (jurisdiction) {
    query = query.eq('jurisdiction->>name', jurisdiction)
  }

  const { data: agencies, error: agencyError } = await query

  if (agencyError) {
    console.error('Error fetching agencies:', agencyError)
    return []
  }

  const availability: ServiceAvailability[] = []

  for (const agency of agencies || []) {
    const agencyAny = agency as any
    // Get unit counts
    const { data: units } = await supabase
      .from('emergency_units')
      .select('status')
      .eq('agency_id', agencyAny.id)

    const availableUnits = units?.filter(u => (u as any).status === 'available').length || 0
    const totalUnits = units?.length || 0

    // Get current incidents
    const { count: incidentCount } = await supabase
      .from('emergency_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyAny.id)
      .not('status', 'in', ['resolved', 'cancelled'])
    availability.push({
      serviceType: agencyAny.type as EmergencyServiceType,
      agencyId: agencyAny.id as string,
      agencyName: agencyAny.name as string,
      coverage: {
        status: availableUnits === 0 ? 'unavailable' : availableUnits < totalUnits / 2 ? 'limited' : 'covered',
        unitsAvailable: availableUnits,
        unitsTotal: totalUnits,
      },
      currentIncidents: incidentCount || 0,
      alertLevel: (agencyAny.alert_level as 'none' | 'advisory' | 'watch' | 'warning') || 'none',
      lastUpdate: agencyAny.updated_at as string,
    })
  }

  return availability
}

/**
 * Gets CAD integration status
 */
export async function getCADIntegrationStatus(
  agencyId: string
): Promise<CADIntegrationStatus | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cad_integration_status')
    .select('*')
    .eq('agency_id', agencyId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching CAD status:', error)
    return null
  }

  if (!data) {
    return {
      agencyId,
      connected: false,
      pendingSyncs: 0,
      dataFreshness: 'delayed',
    }
  }

  return {
    agencyId: data.agency_id as string,
    connected: data.connected as boolean,
    lastHeartbeat: data.last_heartbeat as string | undefined,
    latency: data.latency as number | undefined,
    lastSyncAt: data.last_sync_at as string | undefined,
    pendingSyncs: data.pending_syncs as number,
    dataFreshness: data.data_freshness as 'realtime' | 'near_realtime' | 'delayed' | 'stale',
    issues: data.issues as Array<{ type: 'connection' | 'data' | 'sync' | 'auth'; severity: 'low' | 'medium' | 'high' | 'critical'; message: string; timestamp: string }> | undefined,
  }
}

/**
 * Updates CAD integration status
 */
export async function updateCADIntegrationStatus(
  agencyId: string,
  updates: Partial<CADIntegrationStatus>
): Promise<CADIntegrationStatus> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    agency_id: agencyId,
    connected: updates.connected ?? false,
    last_heartbeat: updates.lastHeartbeat || new Date().toISOString(),
    latency: updates.latency,
    last_sync_at: updates.lastSyncAt,
    pending_syncs: updates.pendingSyncs || 0,
    data_freshness: updates.dataFreshness || 'delayed',
    issues: updates.issues,
  }

  const { data, error } = await supabase
    .from('cad_integration_status')
    .upsert(updateData)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating CAD status:', error)
    throw new Error(`Failed to update CAD status: ${error.message}`)
  }

  return {
    agencyId: data.agency_id as string,
    connected: data.connected as boolean,
    lastHeartbeat: data.last_heartbeat as string | undefined,
    latency: data.latency as number | undefined,
    lastSyncAt: data.last_sync_at as string | undefined,
    pendingSyncs: data.pending_syncs as number,
    dataFreshness: data.data_freshness as 'realtime' | 'near_realtime' | 'delayed' | 'stale',
    issues: data.issues as Array<{ type: 'connection' | 'data' | 'sync' | 'auth'; severity: 'low' | 'medium' | 'high' | 'critical'; message: string; timestamp: string }> | undefined,
  }
}

/**
 * Creates a first responder
 */
export async function createFirstResponder(
  input: {
    firstName: string
    lastName: string
    badgeNumber?: string
    agencyId: string
    agencyName: string
    department?: string
    role: FirstResponderInfo['role']
    rank?: string
    certifications: string[]
    certificationsExpiry?: string
    radioCallsign?: string
    phone?: string
  }
): Promise<FirstResponderInfo> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('first_responders')
    .insert({
      first_name: input.firstName,
      last_name: input.lastName,
      badge_number: input.badgeNumber,
      agency_id: input.agencyId,
      agency_name: input.agencyName,
      department: input.department,
      role: input.role,
      rank: input.rank,
      certifications: input.certifications,
      certifications_expiry: input.certificationsExpiry,
      radio_callsign: input.radioCallsign,
      phone: input.phone,
      status: 'off_duty',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating responder:', error)
    throw new Error(`Failed to create responder: ${error.message}`)
  }

  return mapResponderFromDB(data)
}

/**
 * Gets first responders
 */
export async function getFirstResponders(
  options?: {
    agencyId?: string
    role?: FirstResponderInfo['role']
    status?: FirstResponderInfo['status']
    onIncident?: string
  }
): Promise<FirstResponderInfo[]> {
  const supabase = createClient()

  let query = supabase
    .from('first_responders')
    .select('*')
    .order('last_name')

  if (options?.agencyId) {
    query = query.eq('agency_id', options.agencyId)
  }

  if (options?.role) {
    query = query.eq('role', options.role)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.onIncident) {
    query = query.eq('current_incident_id', options.onIncident)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching responders:', error)
    return []
  }

  return (data || []).map(mapResponderFromDB)
}

/**
 * Updates first responder status
 */
export async function updateFirstResponderStatus(
  responderId: string,
  status: FirstResponderInfo['status'],
  incidentId?: string
): Promise<FirstResponderInfo> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (incidentId) {
    updateData.current_incident_id = incidentId
  }

  const { data, error } = await supabase
    .from('first_responders')
    .update(updateData)
    .eq('id', responderId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating responder status:', error)
    throw new Error(`Failed to update responder: ${error.message}`)
  }

  return mapResponderFromDB(data)
}

/**
 * Gets nearby units for dispatch
 */
export async function getNearbyUnits(
  latitude: number,
  longitude: number,
  radiusKm: number,
  types?: EmergencyServiceType[]
): Promise<EmergencyServiceUnit[]> {
  const supabase = createClient()

  // Get available units within radius (approximate using lat/lng bounds)
  const latDelta = radiusKm / 111 // ~111km per degree latitude
  const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))

  let query = supabase
    .from('emergency_units')
    .select('*')
    .eq('status', 'available')
    .filter('current_location->>latitude', 'gte', latitude - latDelta)
    .filter('current_location->>latitude', 'lte', latitude + latDelta)
    .filter('current_location->>longitude', 'gte', longitude - lngDelta)
    .filter('current_location->>longitude', 'lte', longitude + lngDelta)

  if (types && types.length > 0) {
    query = query.in('type', types)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching nearby units:', error)
    return []
  }

  // Sort by distance (calculate actual distance)
  const units = (data || []).map(mapUnitFromDB).map(unit => {
    const unitLat = unit.currentLocation?.latitude || 0
    const unitLng = unit.currentLocation?.longitude || 0
    const distance = calculateDistance(latitude, longitude, unitLat, unitLng)
    return { ...unit, distance }
  })

  // Sort by distance
  units.sort((a, b) => (a.distance || 0) - (b.distance || 0))

  return units
}

/**
 * Calculates distance between two points (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapAgencyFromDB(data: Record<string, unknown>): EmergencyAgency {
  return {
    id: data.id as string,
    name: data.name as string,
    shortName: data.short_name as string,
    type: data.type as EmergencyServiceType,
    jurisdiction: data.jurisdiction as { type: 'city' | 'county' | 'state' | 'regional' | 'national'; name: string; boundary?: { type: 'polygon'; coordinates: number[][] } },
    contact: data.contact as { phone: string; fax?: string; email?: string; website?: string; address?: string },
    dispatchCenter: data.dispatch_center as string | undefined,
    dispatchPhone: data.dispatch_phone as string | undefined,
    services: (data.services as string[]) || [],
    coverage: (data.coverage as string[]) || [],
    status: data.status as EmergencyAgency['status'],
    alertLevel: data.alert_level as EmergencyAgency['alertLevel'],
    integrationLevel: data.integration_level as EmergencyAgency['integrationLevel'],
    apiEndpoint: data.api_endpoint as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

function mapUnitFromDB(data: Record<string, unknown>): EmergencyServiceUnit {
  return {
    id: data.id as string,
    unitNumber: data.unit_number as string,
    callsign: data.callsign as string,
    type: data.type as EmergencyServiceType,
    agencyId: data.agency_id as string,
    agencyName: data.agency_name as string,
    status: data.status as EmergencyServiceStatus,
    currentLocation: data.current_location as { latitude: number; longitude: number; timestamp: string } | undefined,
    currentIncidentId: data.current_incident_id as string | undefined,
    personnelCount: data.personnel_count as number,
    personnelNames: data.personnel_names as string[] | undefined,
    capabilities: (data.capabilities as string[]) || [],
    equipment: data.equipment as string[] | undefined,
    shiftStart: data.shift_start as string | undefined,
    shiftEnd: data.shift_end as string | undefined,
    lastStatusUpdate: data.last_status_update as string,
    lastLocationUpdate: data.last_location_update as string | undefined,
  }
}

function mapIncidentFromDB(data: Record<string, unknown>): EmergencyIncident {
  return {
    id: data.id as string,
    incidentNumber: data.incident_number as string,
    type: data.type as EmergencyServiceType,
    category: data.category as string,
    location: data.location as { latitude: number; longitude: number; address?: string; landmark?: string },
    priority: data.priority as IncidentPriority,
    severity: data.severity as number | undefined,
    status: data.status as EmergencyIncident['status'],
    reportedAt: data.reported_at as string,
    dispatchedAt: data.dispatched_at as string | undefined,
    enRouteAt: data.en_route_at as string | undefined,
    onSceneAt: data.on_scene_at as string | undefined,
    containedAt: data.contained_at as string | undefined,
    resolvedAt: data.resolved_at as string | undefined,
    assignedUnits: (data.assigned_units as string[]) || [],
    description: data.description as string,
    callerInfo: data.caller_info as { name?: string; phone?: string; relationship?: string } | undefined,
    dispositions: data.dispositions as Array<{ unitId: string; action: string; notes?: string; timestamp: string }> | undefined,
    relatedIncidentIds: data.related_incident_ids as string[] | undefined,
    dispatchNotes: data.dispatch_notes as string | undefined,
    fieldNotes: data.field_notes as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

function mapDispatchFromDB(data: Record<string, unknown>): DispatchRequest {
  return {
    id: data.id as string,
    requestNumber: data.request_number as string,
    priority: data.priority as IncidentPriority,
    incidentType: data.incident_type as EmergencyServiceType,
    category: data.category as string,
    description: data.description as string,
    location: data.location as { latitude: number; longitude: number; address?: string; landmark?: string },
    caller: data.caller as { name?: string; phone?: string; relationship?: string } | undefined,
    circumstances: data.circumstances as { fire?: { structureType?: string; 烟火?: string; hazmat?: string }; medical?: { patientCount?: number; nature?: string; traumaLevel?: number }; rescue?: { victimCount?: string; accessRequired?: string; equipment?: string[] }; hazmat?: { material?: string; container?: string; amount?: string } } | undefined,
    resources: data.resources as Array<{ type: EmergencyServiceType; quantity: number; specificRequirements?: string[] }> | undefined,
    dispatchCenter: data.dispatch_center as string,
    dispatchedAt: data.dispatched_at as string | undefined,
    status: data.status as DispatchRequest['status'],
    createdAt: data.created_at as string,
  }
}

function mapResponderFromDB(data: Record<string, unknown>): FirstResponderInfo {
  return {
    id: data.id as string,
    firstName: data.first_name as string,
    lastName: data.last_name as string,
    badgeNumber: data.badge_number as string | undefined,
    agencyId: data.agency_id as string,
    agencyName: data.agency_name as string,
    department: data.department as string | undefined,
    role: data.role as FirstResponderInfo['role'],
    rank: data.rank as string | undefined,
    certifications: (data.certifications as string[]) || [],
    certificationsExpiry: data.certifications_expiry as string | undefined,
    status: data.status as FirstResponderInfo['status'],
    currentIncidentId: data.current_incident_id as string | undefined,
    radioCallsign: data.radio_callsign as string | undefined,
    phone: data.phone as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
