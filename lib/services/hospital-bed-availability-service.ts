import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Hospital bed type
 */
export type HospitalBedType = 
  | 'icu'
  | 'nicu'
  | 'picu'
  | 'emergency'
  | 'general'
  | 'surgical'
  | 'cardiac'
  | 'neuro'
  | 'maternity'
  | 'pediatric'
  | 'psychiatric'
  | 'rehabilitation'
  | 'isolation'
  | 'hospice'
  | 'long_term_care'

/**
 * Hospital status
 */
export type HospitalStatus = 
  | 'operational'
  | 'reduced_capacity'
  | 'emergency'
  | 'critical'
  | 'closed'
  | 'evacuating'

/**
 * Hospital information
 */
export interface Hospital {
  id: string
  
  // Basic info
  name: string
  shortName?: string
  
  // Location
  location: {
    latitude: number
    longitude: number
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  
  // Contact
  contact: {
    phone: string
    fax?: string
    email?: string
    website?: string
    emergency?: string
  }
  
  // Details
  type: 'general' | 'specialty' | 'trauma' | 'research' | 'military'
  traumaLevel?: 1 | 2 | 3 | 4
  capacity?: {
    totalBeds: number
    staffedBeds: number
    licensedBeds: number
  }
  
  // Services
  services: string[]
  specialties: string[]
  
  // Status
  status: HospitalStatus
  statusUpdatedAt?: string
  
  // Integration
  systemId?: string
  systemName?: string
  
  // Restoration
  restorationStatus?: {
    powerStatus: 'full' | 'partial' | 'generator' | 'none'
    waterStatus: 'full' | 'partial' | 'none'
    backupStatus: 'operational' | 'standby' | 'depleted' | 'unknown'
    etr?: string
    lastUpdate: string
  }
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Bed availability
 */
export interface BedAvailability {
  id: string
  hospitalId: string
  
  // Bed type
  bedType: HospitalBedType
  
  // Counts
  total: number
  available: number
  reserved: number
  occupied: number
  
  // Waitlist
  waitlistCount: number
  avgWaitTime?: number
  
  // Last update
  lastUpdated: string
  source?: string
}

/**
 * Bed availability snapshot
 */
export interface BedAvailabilitySnapshot {
  id: string
  hospitalId: string
  timestamp: string
  
  // By type
  availability: Array<{
    bedType: HospitalBedType
    total: number
    available: number
    reserved: number
    occupied: number
  }>
  
  // Totals
  totalBeds: number
  totalAvailable: number
  
  // Metadata
  source: 'direct' | 'ems' | 'state' | 'federal' | 'calculated'
}

/**
 * Hospital capacity alert
 */
export interface CapacityAlert {
  id: string
  hospitalId: string
  
  // Alert details
  alertType: 'capacity_warning' | 'capacity_critical' | 'surge' | 'diversion' | 'closure' | 'restoration'
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  // Details
  message: string
  affectedBedTypes?: HospitalBedType[]
  
  // Timing
  triggeredAt: string
  expiresAt?: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  
  // Status
  status: 'active' | 'acknowledged' | 'resolved' | 'expired'
  
  // Actions
  actions?: Array<{
    type: 'diversion' | 'transfer' | 'alert' | 'update'
    description: string
    timestamp: string
    completed: boolean
  }>
  
  createdAt: string
}

/**
 * Transfer request
 */
export interface TransferRequest {
  id: string
  
  // Request info
  requestNumber: string
  
  // Patient
  patientInfo: {
    age?: number
    gender?: string
    weight?: number
    condition?: string
    notes?: string
  }
  
  // Requirements
  requirements: {
    bedType: HospitalBedType
    specialty?: string
    distanceMax?: number
    equipment?: string[]
    isolationRequired?: boolean
  }
  
  // Origin
  originHospitalId: string
  originHospitalName: string
  originContact?: {
    name?: string
    phone?: string
  }
  
  // Destination
  destinationHospitalId?: string
  destinationHospitalName?: string
  
  // Status
  status: 'pending' | 'searching' | 'matched' | 'accepted' | 'transit' | 'completed' | 'cancelled'
  
  // Timing
  urgency: 'immediate' | 'urgent' | 'standard'
  requestedAt: string
  completedAt?: string
  
  // Matching
  matchedHospitals?: Array<{
    hospitalId: string
    hospitalName: string
    distance: number
    bedAvailable: number
    eta?: string
  }>
  
  createdAt: string
  updatedAt: string
}

/**
 * Hospital system status
 */
export interface HospitalSystemStatus {
  systemId: string
  systemName: string
  
  // Coverage
  hospitals: number
  operational: number
  reducedCapacity: number
  emergency: number
  closed: number
  
  // Totals
  totalBeds: number
  availableBeds: number
  
  // By type
  byBedType: Record<HospitalBedType, {
    total: number
    available: number
  }>
  
  // Alerts
  activeAlerts: number
  
  // Update
  lastUpdate: string
}

/**
 * Emergency capacity info
 */
export interface EmergencyCapacityInfo {
  // Alert level
  alertLevel: 'normal' | 'advisory' | 'warning' | 'critical' | 'emergency'
  
  // Regional status
  region: string
  hospitals: {
    total: number
    onDiversion: number
    atCapacity: number
    accepting: number
  }
  
  // Bed summary
  beds: {
    icu: { total: number; available: number }
    ed: { total: number; waitlist: number; avgWait: number }
    general: { total: number; available: number }
  }
  
  // Recommendations
  recommendations: Array<{
    type: 'diversion' | 'transfer' | 'alert' | 'prepare'
    message: string
    targetHospitals?: string[]
  }>
  
  // Sources
  sources: string[]
  
  // Update
  lastUpdate: string
}

/**
 * Bed request history
 */
export interface BedRequestHistory {
  id: string
  
  // Request
  requestId: string
  requestNumber: string
  
  // Hospital
  hospitalId: string
  hospitalName: string
  
  // Status change
  action: 'requested' | 'offered' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
  reason?: string
  
  // Timing
  timestamp: string
  
  // Details
  bedType: HospitalBedType
  quantity: number
}

/**
 * Hospital staffing info
 */
export interface HospitalStaffing {
  hospitalId: string
  
  // Staff counts
  physicians: { total: number; available: number }
  nurses: { total: number; available: number }
  emts: { total: number; available: number }
  specialists: { total: number; available: number }
  
  // Status
  status: 'adequate' | 'reduced' | 'critical' | 'unknown'
  
  // Impacted areas
  impactedServices?: string[]
  
  lastUpdate: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating hospital
 */
export const createHospitalSchema = z.object({
  name: z.string().min(1).max(200),
  shortName: z.string().max(20).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(5).max(10),
    country: z.string().min(2),
  }),
  contact: z.object({
    phone: z.string().min(1),
    fax: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    emergency: z.string().optional(),
  }),
  type: z.enum(['general', 'specialty', 'trauma', 'research', 'military']),
  traumaLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  capacity: z.object({
    totalBeds: z.number().int().positive(),
    staffedBeds: z.number().int().positive(),
    licensedBeds: z.number().int().positive(),
  }).optional(),
  services: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  systemId: z.string().optional(),
  systemName: z.string().optional(),
})

/**
 * Schema for updating bed availability
 */
export const updateBedAvailabilitySchema = z.object({
  hospitalId: z.string().uuid(),
  bedType: z.enum([
    'icu', 'nicu', 'picu', 'emergency', 'general', 'surgical',
    'cardiac', 'neuro', 'maternity', 'pediatric', 'psychiatric',
    'rehabilitation', 'isolation', 'hospice', 'long_term_care'
  ]),
  total: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  reserved: z.number().int().nonnegative(),
  occupied: z.number().int().nonnegative(),
})

/**
 * Schema for creating transfer request
 */
export const createTransferRequestSchema = z.object({
  patientInfo: z.object({
    age: z.number().int().positive().optional(),
    gender: z.string().optional(),
    weight: z.number().positive().optional(),
    condition: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  requirements: z.object({
    bedType: z.enum([
      'icu', 'nicu', 'picu', 'emergency', 'general', 'surgical',
      'cardiac', 'neuro', 'maternity', 'pediatric', 'psychiatric',
      'rehabilitation', 'isolation', 'hospice', 'long_term_care'
    ]),
    specialty: z.string().optional(),
    distanceMax: z.number().positive().optional(),
    equipment: z.array(z.string()).optional(),
    isolationRequired: z.boolean().optional(),
  }),
  originHospitalId: z.string().uuid(),
  originHospitalName: z.string().min(1),
  originContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  urgency: z.enum(['immediate', 'urgent', 'standard']),
})

/**
 * Schema for hospital query
 */
export const hospitalQuerySchema = z.object({
  status: z.array(z.enum(['operational', 'reduced_capacity', 'emergency', 'critical', 'closed', 'evacuating'])).optional(),
  type: z.array(z.enum(['general', 'specialty', 'trauma', 'research', 'military'])).optional(),
  traumaLevel: z.array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  boundingBox: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }).optional(),
  services: z.array(z.string()).optional(),
  hasBeds: z.object({
    bedType: z.enum([
      'icu', 'nicu', 'picu', 'emergency', 'general', 'surgical',
      'cardiac', 'neuro', 'maternity', 'pediatric', 'psychiatric',
      'rehabilitation', 'isolation', 'hospice', 'long_term_care'
    ]),
    minAvailable: z.number().int().nonnegative().optional(),
  }).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for bed type
 */
export function getBedTypeDisplayName(type: HospitalBedType): string {
  const names: Record<HospitalBedType, string> = {
    icu: 'ICU',
    nicu: 'NICU',
    picu: 'PICU',
    emergency: 'Emergency',
    general: 'General',
    surgical: 'Surgical',
    cardiac: 'Cardiac',
    neuro: 'Neurological',
    maternity: 'Maternity',
    pediatric: 'Pediatric',
    psychiatric: 'Psychiatric',
    rehabilitation: 'Rehabilitation',
    isolation: 'Isolation',
    hospice: 'Hospice',
    long_term_care: 'Long-term Care',
  }
  return names[type]
}

/**
 * Gets color for bed type
 */
export function getBedTypeColor(type: HospitalBedType): string {
  const colors: Record<HospitalBedType, string> = {
    icu: '#dc2626',
    nicu: '#f97316',
    picu: '#f97316',
    emergency: '#ef4444',
    general: '#3b82f6',
    surgical: '#8b5cf6',
    cardiac: '#ec4899',
    neuro: '#6366f1',
    maternity: '#f472b6',
    pediatric: '#fb923c',
    psychiatric: '#a16207',
    rehabilitation: '#22c55e',
    isolation: '#eab308',
    hospice: '#6b7280',
    long_term_care: '#9ca3af',
  }
  return colors[type]
}

/**
 * Gets display name for hospital status
 */
export function getHospitalStatusDisplayName(status: HospitalStatus): string {
  const names: Record<HospitalStatus, string> = {
    operational: 'Operational',
    reduced_capacity: 'Reduced Capacity',
    emergency: 'Emergency Operations',
    critical: 'Critical',
    closed: 'Closed',
    evacuating: 'Evacuating',
  }
  return names[status]
}

/**
 * Gets color for hospital status
 */
export function getHospitalStatusColor(status: HospitalStatus): string {
  const colors: Record<HospitalStatus, string> = {
    operational: '#22c55e',
    reduced_capacity: '#eab308',
    emergency: '#f97316',
    critical: '#ef4444',
    closed: '#6b7280',
    evacuating: '#dc2626',
  }
  return colors[status]
}

/**
 * Gets alert severity color
 */
export function getAlertSeverityColor(severity: CapacityAlert['severity']): string {
  const colors: Record<CapacityAlert['severity'], string> = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444',
  }
  return colors[severity]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a hospital
 */
export async function createHospital(
  input: z.infer<typeof createHospitalSchema>
): Promise<Hospital> {
  const validationResult = createHospitalSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('hospitals')
    .insert({
      name: input.name,
      short_name: input.shortName,
      location: input.location,
      contact: input.contact,
      type: input.type,
      trauma_level: input.traumaLevel,
      capacity: input.capacity,
      services: input.services || [],
      specialties: input.specialties || [],
      system_id: input.systemId,
      system_name: input.systemName,
      status: 'operational',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating hospital:', error)
    throw new Error(`Failed to create hospital: ${error.message}`)
  }

  return mapHospitalFromDB(data)
}

/**
 * Gets hospitals
 */
export async function getHospitals(
  input: z.infer<typeof hospitalQuerySchema>
): Promise<Hospital[]> {
  const validationResult = hospitalQuerySchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  let query = supabase
    .from('hospitals')
    .select('*')
    .order('name')

  if (input.status && input.status.length > 0) {
    query = query.in('status', input.status)
  }

  if (input.type && input.type.length > 0) {
    query = query.in('type', input.type)
  }

  if (input.traumaLevel && input.traumaLevel.length > 0) {
    query = query.in('trauma_level', input.traumaLevel)
  }

  if (input.city) {
    query = query.eq('location->>city', input.city)
  }

  if (input.state) {
    query = query.eq('location->>state', input.state)
  }

  if (input.services && input.services.length > 0) {
    query = query.contains('services', input.services)
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
    query = query.range(input.offset, input.offset + (input.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching hospitals:', error)
    return []
  }

  return (data || []).map(mapHospitalFromDB)
}

/**
 * Gets hospital by ID
 */
export async function getHospitalById(hospitalId: string): Promise<Hospital | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('id', hospitalId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching hospital:', error)
    return null
  }

  if (!data) return null
  return mapHospitalFromDB(data)
}

/**
 * Updates hospital status
 */
export async function updateHospitalStatus(
  hospitalId: string,
  status: HospitalStatus
): Promise<Hospital> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hospitals')
    .update({
      status,
      status_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', hospitalId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating hospital status:', error)
    throw new Error(`Failed to update status: ${error.message}`)
  }

  return mapHospitalFromDB(data)
}

/**
 * Updates restoration status
 */
export async function updateRestorationStatus(
  hospitalId: string,
  restoration: Hospital['restorationStatus']
): Promise<Hospital> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hospitals')
    .update({
      restoration_status: {
        ...restoration,
        lastUpdate: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', hospitalId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating restoration status:', error)
    throw new Error(`Failed to update restoration: ${error.message}`)
  }

  return mapHospitalFromDB(data)
}

/**
 * Updates bed availability
 */
export async function updateBedAvailability(
  input: z.infer<typeof updateBedAvailabilitySchema>
): Promise<BedAvailability> {
  const validationResult = updateBedAvailabilitySchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('bed_availability')
    .upsert({
      hospital_id: input.hospitalId,
      bed_type: input.bedType,
      total: input.total,
      available: input.available,
      reserved: input.reserved,
      occupied: input.occupied,
      last_updated: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating bed availability:', error)
    throw new Error(`Failed to update availability: ${error.message}`)
  }

  return mapBedAvailabilityFromDB(data)
}

/**
 * Gets bed availability for a hospital
 */
export async function getBedAvailability(
  hospitalId: string,
  options?: {
    bedType?: HospitalBedType
    includeWaitlist?: boolean
  }
): Promise<BedAvailability[]> {
  const supabase = createClient()

  let query = supabase
    .from('bed_availability')
    .select('*')
    .eq('hospital_id', hospitalId)
    .order('bed_type')

  if (options?.bedType) {
    query = query.eq('bed_type', options.bedType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching bed availability:', error)
    return []
  }

  return (data || []).map(mapBedAvailabilityFromDB)
}

/**
 * Gets hospitals with available beds
 */
export async function getHospitalsWithAvailableBeds(
  bedType: HospitalBedType,
  options?: {
    boundingBox?: { north: number; south: number; east: number; west: number }
    city?: string
    state?: string
    minAvailable?: number
    limit?: number
  }
): Promise<Array<Hospital & { availableBeds: number; distance?: number }>> {
  const supabase = createClient()

  // Get hospitals with availability
  let query = supabase
    .from('bed_availability')
    .select(`
      hospital_id,
      bed_type,
      available,
      hospitals (
        id,
        name,
        short_name,
        location,
        contact,
        type,
        trauma_level,
        capacity,
        services,
        specialties,
        status,
        status_updated_at,
        system_id,
        system_name,
        created_at,
        updated_at
      )
    `)
    .eq('bed_type', bedType)
    .gte('available', options?.minAvailable || 0)

  if (options?.boundingBox) {
    query = query.filter('hospitals->location->>latitude', 'gte', options.boundingBox.south)
    query = query.filter('hospitals->location->>latitude', 'lte', options.boundingBox.north)
    query = query.filter('hospitals->location->>longitude', 'gte', options.boundingBox.west)
    query = query.filter('hospitals->location->>longitude', 'lte', options.boundingBox.east)
  }

  if (options?.city) {
    query = query.eq('hospitals->location->>city', options.city)
  }

  if (options?.state) {
    query = query.eq('hospitals->location->>state', options.state)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching hospitals with beds:', error)
    return []
  }

  return (data || []).map(d => ({
    ...mapHospitalFromDB((d.hospitals as unknown) as Record<string, unknown>),
    availableBeds: d.available as number,
  }))
}

/**
 * Creates a capacity alert
 */
export async function createCapacityAlert(
  input: Omit<CapacityAlert, 'id' | 'triggeredAt' | 'createdAt'>
): Promise<CapacityAlert> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('capacity_alerts')
    .insert({
      hospital_id: input.hospitalId,
      alert_type: input.alertType,
      severity: input.severity,
      message: input.message,
      affected_bed_types: input.affectedBedTypes,
      expires_at: input.expiresAt,
      acknowledged_at: input.acknowledgedAt,
      acknowledged_by: input.acknowledgedBy,
      status: input.status,
      actions: input.actions,
      triggered_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating alert:', error)
    throw new Error(`Failed to create alert: ${error.message}`)
  }

  return mapAlertFromDB(data)
}

/**
 * Gets capacity alerts
 */
export async function getCapacityAlerts(
  options?: {
    hospitalId?: string
    status?: CapacityAlert['status']
    severity?: CapacityAlert['severity']
    alertType?: CapacityAlert['alertType']
    activeOnly?: boolean
    limit?: number
  }
): Promise<CapacityAlert[]> {
  const supabase = createClient()

  let query = supabase
    .from('capacity_alerts')
    .select('*')
    .order('triggered_at', { ascending: false })

  if (options?.hospitalId) {
    query = query.eq('hospital_id', options.hospitalId)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.severity) {
    query = query.eq('severity', options.severity)
  }

  if (options?.alertType) {
    query = query.eq('alert_type', options.alertType)
  }

  if (options?.activeOnly) {
    query = query.eq('status', 'active')
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching alerts:', error)
    return []
  }

  return (data || []).map(mapAlertFromDB)
}

/**
 * Acknowledges a capacity alert
 */
export async function acknowledgeCapacityAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<CapacityAlert> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('capacity_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: acknowledgedBy,
    })
    .eq('id', alertId)
    .select('*')
    .single()

  if (error) {
    console.error('Error acknowledging alert:', error)
    throw new Error(`Failed to acknowledge alert: ${error.message}`)
  }

  return mapAlertFromDB(data)
}

/**
 * Creates a transfer request
 */
export async function createTransferRequest(
  userId: string,
  input: z.infer<typeof createTransferRequestSchema>
): Promise<TransferRequest> {
  const validationResult = createTransferRequestSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const requestNumber = `TR-${Date.now().toString(36).toUpperCase()}`

  const { data, error } = await supabase
    .from('transfer_requests')
    .insert({
      request_number: requestNumber,
      patient_info: input.patientInfo,
      requirements: input.requirements,
      origin_hospital_id: input.originHospitalId,
      origin_hospital_name: input.originHospitalName,
      origin_contact: input.originContact,
      urgency: input.urgency,
      status: 'pending',
      requested_at: new Date().toISOString(),
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating transfer request:', error)
    throw new Error(`Failed to create transfer: ${error.message}`)
  }

  return mapTransferFromDB(data)
}

/**
 * Gets transfer requests
 */
export async function getTransferRequests(
  options?: {
    status?: TransferRequest['status']
    urgency?: TransferRequest['urgency']
    originHospitalId?: string
    destinationHospitalId?: string
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<TransferRequest[]> {
  const supabase = createClient()

  let query = supabase
    .from('transfer_requests')
    .select('*')
    .order('requested_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.urgency) {
    query = query.eq('urgency', options.urgency)
  }

  if (options?.originHospitalId) {
    query = query.eq('origin_hospital_id', options.originHospitalId)
  }

  if (options?.destinationHospitalId) {
    query = query.eq('destination_hospital_id', options.destinationHospitalId)
  }

  if (options?.startDate) {
    query = query.gte('requested_at', options.startDate)
  }

  if (options?.endDate) {
    query = query.lte('requested_at', options.endDate)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching transfer requests:', error)
    return []
  }

  return (data || []).map(mapTransferFromDB)
}

/**
 * Updates transfer request status
 */
export async function updateTransferRequestStatus(
  requestId: string,
  status: TransferRequest['status'],
  updates?: {
    destinationHospitalId?: string
    destinationHospitalName?: string
    matchedHospitals?: TransferRequest['matchedHospitals']
    reason?: string
  }
): Promise<TransferRequest> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (updates?.destinationHospitalId) {
    updateData.destination_hospital_id = updates.destinationHospitalId
  }

  if (updates?.destinationHospitalName) {
    updateData.destination_hospital_name = updates.destinationHospitalName
  }

  if (updates?.matchedHospitals) {
    updateData.matched_hospitals = updates.matchedHospitals
  }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('transfer_requests')
    .update(updateData)
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating transfer:', error)
    throw new Error(`Failed to update transfer: ${error.message}`)
  }

  return mapTransferFromDB(data)
}

/**
 * Gets hospital system status
 */
export async function getHospitalSystemStatus(
  systemId?: string
): Promise<HospitalSystemStatus> {
  const supabase = createClient()

  let query = supabase
    .from('hospitals')
    .select('*')

  if (systemId) {
    query = query.eq('system_id', systemId)
  }

  const { data: hospitals, error } = await query

  if (error) {
    console.error('Error fetching system status:', error)
    throw new Error(`Failed to fetch status: ${error.message}`)
  }

  // Aggregate status
  const statusCounts = {
    operational: 0,
    reduced_capacity: 0,
    emergency: 0,
    closed: 0,
  }

  let totalBeds = 0
  let availableBeds = 0

  const byBedType: Record<string, { total: number; available: number }> = {}

  for (const hospital of (hospitals || []) as any[]) {
    statusCounts[hospital.status as keyof typeof statusCounts]++
    
    const capacity = hospital.capacity
    if (capacity) {
      totalBeds += capacity.totalBeds
    }
  }

  // Get bed availability
  const { data: availabilities } = await supabase
    .from('bed_availability')
    .select('hospital_id, bed_type, total, available')

  for (const avail of (availabilities || []) as any[]) {
    if (byBedType[avail.bed_type]) {
      byBedType[avail.bed_type].total += avail.total
      byBedType[avail.bed_type].available += avail.available
    } else {
      byBedType[avail.bed_type] = {
        total: avail.total,
        available: avail.available,
      }
    }
    availableBeds += avail.available
  }

  // Get active alerts
  const { count: activeAlerts } = await supabase
    .from('capacity_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  return {
    systemId: systemId || 'all',
    systemName: (hospitals?.[0] as any)?.system_name || 'All Hospitals',
    hospitals: hospitals?.length || 0,
    operational: statusCounts.operational,
    reducedCapacity: statusCounts.reduced_capacity,
    emergency: statusCounts.emergency,
    closed: statusCounts.closed,
    totalBeds,
    availableBeds,
    byBedType: byBedType as Record<HospitalBedType, { total: number; available: number }>,
    activeAlerts: activeAlerts || 0,
    lastUpdate: new Date().toISOString(),
  }
}

/**
 * Gets emergency capacity info for a region
 */
export async function getEmergencyCapacityInfo(
  region: string
): Promise<EmergencyCapacityInfo> {
  const supabase = createClient()

  // Get hospitals in region
  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('*')
    .eq('location->>city', region)

  if (!hospitals || hospitals.length === 0) {
    return {
      alertLevel: 'normal',
      region,
      hospitals: { total: 0, onDiversion: 0, atCapacity: 0, accepting: 0 },
      beds: {
        icu: { total: 0, available: 0 },
        ed: { total: 0, waitlist: 0, avgWait: 0 },
        general: { total: 0, available: 0 },
      },
      recommendations: [],
      sources: [],
      lastUpdate: new Date().toISOString(),
    }
  }

  // Count status
  const status = {
    onDiversion: 0,
    atCapacity: 0,
    accepting: 0,
  }

  const bedCounts = {
    icu: { total: 0, available: 0 },
    ed: { total: 0, waitlist: 0, avgWait: 0 },
    general: { total: 0, available: 0 },
  }

  for (const hospital of hospitals) {
    if (hospital.status === 'reduced_capacity') {
      status.onDiversion++
    }
    if (hospital.status === 'critical' || hospital.status === 'closed') {
      status.atCapacity++
    }
    if (hospital.status === 'operational') {
      status.accepting++
    }
  }

  // Get bed availability
  const { data: availabilities } = await supabase
    .from('bed_availability')
    .select('bed_type, total, available')
    .in('hospital_id', hospitals.map(h => h.id))

  for (const avail of (availabilities || []) as any[]) {
    if (avail.bed_type === 'icu') {
      bedCounts.icu.total += avail.total
      bedCounts.icu.available += avail.available
    } else if (avail.bed_type === 'emergency') {
      bedCounts.ed.total += avail.total
    } else if (avail.bed_type === 'general') {
      bedCounts.general.total += avail.total
      bedCounts.general.available += avail.available
    }
  }

  // Determine alert level
  let alertLevel: EmergencyCapacityInfo['alertLevel'] = 'normal'
  if (status.atCapacity > hospitals.length * 0.5) {
    alertLevel = 'critical'
  } else if (status.atCapacity > hospitals.length * 0.25) {
    alertLevel = 'warning'
  } else if (status.onDiversion > hospitals.length * 0.3) {
    alertLevel = 'advisory'
  }

  return {
    alertLevel,
    region,
    hospitals: {
      total: hospitals.length,
      ...status,
    },
    beds: bedCounts,
    recommendations: [],
    sources: ['hospital_direct', 'state_ems'],
    lastUpdate: new Date().toISOString(),
  }
}

/**
 * Gets nearest hospital with specific bed type
 */
export async function getNearestHospitalWithBed(
  latitude: number,
  longitude: number,
  bedType: HospitalBedType,
  options?: {
    maxDistanceKm?: number
    minAvailable?: number
    includeClosed?: boolean
    limit?: number
  }
): Promise<Array<Hospital & { availableBeds: number; distance: number }>> {
  const hospitals = await getHospitalsWithAvailableBeds(bedType, {
    limit: options?.limit || 10,
    minAvailable: options?.minAvailable || 1,
  })

  // Calculate distances and filter
  const withDistances = hospitals.map(h => ({
    ...h,
    distance: calculateDistance(
      latitude,
      longitude,
      h.location.latitude,
      h.location.longitude
    ),
  }))

  // Filter by max distance
  const filtered = withDistances.filter(h => {
    if (options?.maxDistanceKm && h.distance > options.maxDistanceKm) {
      return false
    }
    if (!options?.includeClosed && h.status !== 'operational') {
      return false
    }
    return true
  })

  // Sort by distance
  filtered.sort((a, b) => a.distance - b.distance)

  return filtered
}

/**
 * Updates hospital staffing
 */
export async function updateHospitalStaffing(
  hospitalId: string,
  staffing: Omit<HospitalStaffing, 'hospitalId' | 'lastUpdate'>
): Promise<HospitalStaffing> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hospital_staffing')
    .upsert({
      hospital_id: hospitalId,
      physicians: staffing.physicians,
      nurses: staffing.nurses,
      emts: staffing.emts,
      specialists: staffing.specialists,
      status: staffing.status,
      impacted_services: staffing.impactedServices,
      last_update: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating staffing:', error)
    throw new Error(`Failed to update staffing: ${error.message}`)
  }

  return {
    hospitalId: data.hospital_id as string,
    physicians: data.physicians as HospitalStaffing['physicians'],
    nurses: data.nurses as HospitalStaffing['nurses'],
    emts: data.emts as HospitalStaffing['emts'],
    specialists: data.specialists as HospitalStaffing['specialists'],
    status: data.status as HospitalStaffing['status'],
    impactedServices: data.impacted_services as string[] | undefined,
    lastUpdate: data.last_update as string,
  }
}

/**
 * Gets hospital staffing
 */
export async function getHospitalStaffing(
  hospitalId: string
): Promise<HospitalStaffing | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hospital_staffing')
    .select('*')
    .eq('hospital_id', hospitalId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching staffing:', error)
    return null
  }

  if (!data) return null

  return {
    hospitalId: data.hospital_id as string,
    physicians: data.physicians as HospitalStaffing['physicians'],
    nurses: data.nurses as HospitalStaffing['nurses'],
    emts: data.emts as HospitalStaffing['emts'],
    specialists: data.specialists as HospitalStaffing['specialists'],
    status: data.status as HospitalStaffing['status'],
    impactedServices: data.impacted_services as string[] | undefined,
    lastUpdate: data.last_update as string,
  }
}

/**
 * Calculates distance between two points
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

function mapHospitalFromDB(data: Record<string, unknown>): Hospital {
  return {
    id: data.id as string,
    name: data.name as string,
    shortName: (data.short_name as string) || undefined,
    location: data.location as Hospital['location'],
    contact: data.contact as Hospital['contact'],
    type: data.type as Hospital['type'],
    traumaLevel: data.trauma_level as Hospital['traumaLevel'],
    capacity: data.capacity as Hospital['capacity'],
    services: (data.services as string[]) || [],
    specialties: (data.specialties as string[]) || [],
    status: data.status as HospitalStatus,
    statusUpdatedAt: (data.status_updated_at as string) || undefined,
    systemId: (data.system_id as string) || undefined,
    systemName: (data.system_name as string) || undefined,
    restorationStatus: data.restoration_status as Hospital['restorationStatus'],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

function mapBedAvailabilityFromDB(data: Record<string, unknown>): BedAvailability {
  return {
    id: data.id as string,
    hospitalId: data.hospital_id as string,
    bedType: data.bed_type as HospitalBedType,
    total: data.total as number,
    available: data.available as number,
    reserved: data.reserved as number,
    occupied: data.occupied as number,
    waitlistCount: (data.waitlist_count as number) || 0,
    avgWaitTime: (data.avg_wait_time as number) || undefined,
    lastUpdated: data.last_updated as string,
    source: (data.source as string) || undefined,
  }
}

function mapAlertFromDB(data: Record<string, unknown>): CapacityAlert {
  return {
    id: data.id as string,
    hospitalId: data.hospital_id as string,
    alertType: data.alert_type as CapacityAlert['alertType'],
    severity: data.severity as CapacityAlert['severity'],
    message: data.message as string,
    affectedBedTypes: (data.affected_bed_types as HospitalBedType[]) || undefined,
    triggeredAt: data.triggered_at as string,
    expiresAt: (data.expires_at as string) || undefined,
    acknowledgedAt: (data.acknowledged_at as string) || undefined,
    acknowledgedBy: (data.acknowledged_by as string) || undefined,
    status: data.status as CapacityAlert['status'],
    actions: data.actions as CapacityAlert['actions'],
    createdAt: data.created_at as string,
  }
}

function mapTransferFromDB(data: Record<string, unknown>): TransferRequest {
  return {
    id: data.id as string,
    requestNumber: data.request_number as string,
    patientInfo: (data.patient_info as TransferRequest['patientInfo']) || {},
    requirements: data.requirements as TransferRequest['requirements'],
    originHospitalId: data.origin_hospital_id as string,
    originHospitalName: data.origin_hospital_name as string,
    originContact: data.origin_contact as TransferRequest['originContact'],
    destinationHospitalId: (data.destination_hospital_id as string) || undefined,
    destinationHospitalName: (data.destination_hospital_name as string) || undefined,
    status: data.status as TransferRequest['status'],
    urgency: data.urgency as TransferRequest['urgency'],
    requestedAt: data.requested_at as string,
    completedAt: (data.completed_at as string) || undefined,
    matchedHospitals: data.matched_hospitals as TransferRequest['matchedHospitals'],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
