import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type HospitalStatus = 
  | 'operational' 
  | 'limited_operations' 
  | 'emergency_only' 
  | 'evacuating' 
  | 'closed'
  | 'restoring'

export type RestorationPhase = 
  | 'assessment' 
  | 'stabilization' 
  | 'partial_restore' 
  | 'full_restore' 
  | 'complete'

export type ResourceType = 
  | 'emergency_room' 
  | 'icu' 
  | 'operating_room' 
  | 'pharmacy' 
  | 'laboratory' 
  | 'imaging' 
  | 'blood_bank'
  | 'trauma_center'
  | 'pediatrics'
  | 'cardiac_care'
  | 'burn_unit'
  | 'neonatal_icu'
  | 'mental_health'
  | 'outpatient_clinic'
  | 'ambulance_bay'

export type ResourceStatus = 'available' | 'limited' | 'unavailable' | 'maintenance'

export interface HospitalResource {
  id: string
  hospitalId: string
  resourceType: ResourceType
  status: ResourceStatus
  capacity?: number
  currentOccupancy?: number
  lastUpdated: string
  notes?: string
}

export interface Hospital {
  id: string
  
  // Basic Information
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string
  website?: string
  
  // Status
  status: HospitalStatus
  restorationPhase: RestorationPhase
  lastAssessed?: string
  estimatedFullRestore?: string
  
  // Contact Information
  emergencyContact?: string
  adminContact?: string
  
  // Capacity
  totalBeds?: number
  availableBeds?: number
  icuBeds?: number
  availableIcuBeds?: number
  
  // Resources
  resources: HospitalResource[]
  
  // Staffing
  staffCount?: number
  availableStaff?: number
  
  // Additional Services
  services: string[]
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface RestorationUpdate {
  id: string
  hospitalId: string
  
  // Update Details
  phase: RestorationPhase
  statusChange?: HospitalStatus
  description: string
  
  // Resources
  resourceUpdates?: Array<{
    resourceType: ResourceType
    status: ResourceStatus
    capacity?: number
    notes?: string
  }>
  
  // Capacity
  capacityChange?: {
    totalBeds?: number
    availableBeds?: number
    icuBeds?: number
    availableIcuBeds?: number
  }
  
  // Staffing
  staffingUpdate?: {
    staffCount?: number
    availableStaff?: number
  }
  
  // Timeline
  nextAssessment?: string
  estimatedFullRestore?: string
  
  // Assessment
  assessedBy?: string
  notes?: string
  
  // Timestamps
  createdAt: string
}

export interface CreateHospitalInput {
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string
  website?: string
  emergencyContact?: string
  adminContact?: string
  totalBeds?: number
  icuBeds?: number
  services?: string[]
}

export interface CreateRestorationUpdateInput {
  hospitalId: string
  phase: RestorationPhase
  statusChange?: HospitalStatus
  description: string
  resourceUpdates?: Array<{
    resourceType: ResourceType
    status: ResourceStatus
    capacity?: number
    notes?: string
  }>
  capacityChange?: {
    totalBeds?: number
    availableBeds?: number
    icuBeds?: number
    availableIcuBeds?: number
  }
  staffingUpdate?: {
    staffCount?: number
    availableStaff?: number
  }
  nextAssessment?: string
  estimatedFullRestore?: string
  assessedBy?: string
  notes?: string
}

// ============================================================================
// Status Configuration
// ============================================================================

export const HOSPITAL_STATUS_CONFIG = {
  operational: {
    label: 'Operational',
    color: '#16a34a',
    icon: '🏥',
    description: 'Hospital is operating normally',
    priority: 1,
  },
  limited_operations: {
    label: 'Limited Operations',
    color: '#ca8a04',
    icon: '⚠️',
    description: 'Hospital is operating with reduced capacity',
    priority: 2,
  },
  emergency_only: {
    label: 'Emergency Only',
    color: '#ea580c',
    icon: '🚨',
    description: 'Only emergency services available',
    priority: 3,
  },
  evacuating: {
    label: 'Evacuating',
    color: '#dc2626',
    icon: '🚑',
    description: 'Hospital is in the process of evacuation',
    priority: 4,
  },
  closed: {
    label: 'Closed',
    color: '#6b7280',
    icon: '🔒',
    description: 'Hospital is closed',
    priority: 5,
  },
  restoring: {
    label: 'Restoring',
    color: '#0891b2',
    icon: '🔧',
    description: 'Hospital is in the process of restoration',
    priority: 2,
  },
}

export const RESTORATION_PHASE_CONFIG = {
  assessment: {
    label: 'Assessment',
    color: '#6366f1',
    description: 'Initial assessment of damage and needs',
    estimatedDuration: '24-48 hours',
  },
  stabilization: {
    label: 'Stabilization',
    color: '#8b5cf6',
    description: 'Stabilizing critical systems and infrastructure',
    estimatedDuration: '2-5 days',
  },
  partial_restore: {
    label: 'Partial Restore',
    color: '#0891b2',
    description: 'Restoring partial services and capacity',
    estimatedDuration: '1-2 weeks',
  },
  full_restore: {
    label: 'Full Restore',
    color: '#10b981',
    description: 'Restoring full operations',
    estimatedDuration: '2-4 weeks',
  },
  complete: {
    label: 'Complete',
    color: '#16a34a',
    description: 'Restoration complete',
    estimatedDuration: 'N/A',
  },
}

export const RESOURCE_CONFIG = {
  emergency_room: { label: 'Emergency Room', icon: '🚑', priority: 1 },
  icu: { label: 'ICU', icon: '💓', priority: 2 },
  operating_room: { label: 'Operating Room', icon: '🔪', priority: 3 },
  pharmacy: { label: 'Pharmacy', icon: '💊', priority: 4 },
  laboratory: { label: 'Laboratory', icon: '🔬', priority: 5 },
  imaging: { label: 'Imaging', icon: '📷', priority: 6 },
  blood_bank: { label: 'Blood Bank', icon: '🩸', priority: 7 },
  trauma_center: { label: 'Trauma Center', icon: '🏥', priority: 1 },
  pediatrics: { label: 'Pediatrics', icon: '👶', priority: 8 },
  cardiac_care: { label: 'Cardiac Care', icon: '❤️', priority: 2 },
  burn_unit: { label: 'Burn Unit', icon: '🔥', priority: 1 },
  neonatal_icu: { label: 'Neonatal ICU', icon: '👶', priority: 2 },
  mental_health: { label: 'Mental Health', icon: '🧠', priority: 9 },
  outpatient_clinic: { label: 'Outpatient Clinic', icon: '🏥', priority: 10 },
  ambulance_bay: { label: 'Ambulance Bay', icon: '🚐', priority: 1 },
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createHospitalSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().min(1),
  website: z.string().url().optional(),
  emergencyContact: z.string().optional(),
  adminContact: z.string().optional(),
  totalBeds: z.number().positive().optional(),
  icuBeds: z.number().positive().optional(),
  services: z.array(z.string()).optional(),
})

export const createRestorationUpdateSchema = z.object({
  hospitalId: z.string(),
  phase: z.enum(['assessment', 'stabilization', 'partial_restore', 'full_restore', 'complete']),
  statusChange: z.enum(['operational', 'limited_operations', 'emergency_only', 'evacuating', 'closed', 'restoring']).optional(),
  description: z.string().min(1),
  resourceUpdates: z.array(z.object({
    resourceType: z.enum([
      'emergency_room', 'icu', 'operating_room', 'pharmacy', 'laboratory',
      'imaging', 'blood_bank', 'trauma_center', 'pediatrics', 'cardiac_care',
      'burn_unit', 'neonatal_icu', 'mental_health', 'outpatient_clinic', 'ambulance_bay',
    ]),
    status: z.enum(['available', 'limited', 'unavailable', 'maintenance']),
    capacity: z.number().optional(),
    notes: z.string().optional(),
  })).optional(),
  capacityChange: z.object({
    totalBeds: z.number().optional(),
    availableBeds: z.number().optional(),
    icuBeds: z.number().optional(),
    availableIcuBeds: z.number().optional(),
  }).optional(),
  staffingUpdate: z.object({
    staffCount: z.number().optional(),
    availableStaff: z.number().optional(),
  }).optional(),
  nextAssessment: z.string().optional(),
  estimatedFullRestore: z.string().optional(),
  assessedBy: z.string().optional(),
  notes: z.string().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getStatusDisplayName(status: HospitalStatus): string {
  return HOSPITAL_STATUS_CONFIG[status]?.label || status
}

export function getStatusColor(status: HospitalStatus): string {
  return HOSPITAL_STATUS_CONFIG[status]?.color || '#6b7280'
}

export function getStatusIcon(status: HospitalStatus): string {
  return HOSPITAL_STATUS_CONFIG[status]?.icon || '🏥'
}

export function getPhaseDisplayName(phase: RestorationPhase): string {
  return RESTORATION_PHASE_CONFIG[phase]?.label || phase
}

export function getPhaseColor(phase: RestorationPhase): string {
  return RESTORATION_PHASE_CONFIG[phase]?.color || '#6b7280'
}

export function getResourceDisplayName(type: ResourceType): string {
  return RESOURCE_CONFIG[type]?.label || type
}

export function getResourceIcon(type: ResourceType): string {
  return RESOURCE_CONFIG[type]?.icon || '🏥'
}

export function getResourceStatusDisplayName(status: ResourceStatus): string {
  const names: Record<ResourceStatus, string> = {
    available: 'Available',
    limited: 'Limited',
    unavailable: 'Unavailable',
    maintenance: 'Maintenance',
  }
  return names[status] || status
}

export function calculateHospitalCapacityScore(hospital: Hospital): number {
  let score = 100

  // Deduct for status
  const statusPenalties: Record<HospitalStatus, number> = {
    operational: 0,
    limited_operations: 20,
    emergency_only: 40,
    evacuating: 80,
    closed: 100,
    restoring: 30,
  }
  score -= statusPenalties[hospital.status] || 0

  // Deduct for resource availability
  const resourceScores = hospital.resources.map(r => {
    const resourcePenalties: Record<ResourceStatus, number> = {
      available: 0,
      limited: 10,
      unavailable: 25,
      maintenance: 15,
    }
    return resourcePenalties[r.status] || 0
  })
  const avgResourcePenalty = resourceScores.length > 0
    ? resourceScores.reduce((a, b) => a + b, 0) / resourceScores.length
    : 0
  score -= avgResourcePenalty

  // Factor in bed availability
  if (hospital.totalBeds && hospital.availableBeds !== undefined) {
    const bedRatio = hospital.availableBeds / hospital.totalBeds
    score -= (1 - bedRatio) * 30
  }

  // Factor in ICU availability
  if (hospital.icuBeds && hospital.availableIcuBeds !== undefined) {
    const icuRatio = hospital.availableIcuBeds / hospital.icuBeds
    score -= (1 - icuRatio) * 20
  }

  return Math.max(0, Math.min(100, score))
}

export function estimateArrivalTime(
  userLatitude: number,
  userLongitude: number,
  hospital: Hospital
): number {
  // Calculate distance (simplified)
  const distance = calculateDistance(
    userLatitude,
    userLongitude,
    hospital.latitude,
    hospital.longitude
  )

  // Estimate travel time (assuming 40 km/h average in city)
  const averageSpeed = 40 // km/h
  const timeHours = distance / averageSpeed

  return Math.round(timeHours * 60) // Return minutes
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createHospital(
  input: CreateHospitalInput
): Promise<Hospital> {
  const validationResult = createHospitalSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const hospitalId = `hospital_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const hospital: Hospital = {
    id: hospitalId,
    name: input.name,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    phone: input.phone,
    website: input.website,
    status: 'operational',
    restorationPhase: 'complete',
    emergencyContact: input.emergencyContact,
    adminContact: input.adminContact,
    totalBeds: input.totalBeds,
    availableBeds: input.totalBeds,
    icuBeds: input.icuBeds,
    availableIcuBeds: input.icuBeds,
    resources: [],
    services: input.services || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('hospitals')
    .insert({
      id: hospitalId,
      name: input.name,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      phone: input.phone,
      website: input.website,
      status: 'operational',
      restoration_phase: 'complete',
      emergency_contact: input.emergencyContact,
      admin_contact: input.adminContact,
      total_beds: input.totalBeds,
      available_beds: input.totalBeds,
      icu_beds: input.icuBeds,
      available_icu_beds: input.icuBeds,
      resources: [],
      services: input.services || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating hospital:', error)
    throw new Error('Failed to create hospital')
  }

  return hospital
}

export async function getHospital(hospitalId: string): Promise<Hospital | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('id', hospitalId)
    .single()

  if (error || !data) {
    return null
  }

  return mapHospitalFromDB(data)
}

export async function updateHospitalStatus(
  hospitalId: string,
  status: HospitalStatus,
  restorationPhase: RestorationPhase
): Promise<Hospital> {
  const supabase = createClient()

  const { error } = await supabase
    .from('hospitals')
    .update({
      status,
      restoration_phase: restorationPhase,
      last_assessed: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', hospitalId)

  if (error) {
    console.error('Error updating hospital status:', error)
    throw new Error('Failed to update hospital status')
  }

  return getHospital(hospitalId) as Promise<Hospital>
}

export async function createRestorationUpdate(
  input: CreateRestorationUpdateInput,
  userId: string
): Promise<RestorationUpdate> {
  const validationResult = createRestorationUpdateSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const updateId = `restore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Create update record
  const update: RestorationUpdate = {
    id: updateId,
    hospitalId: input.hospitalId,
    phase: input.phase,
    statusChange: input.statusChange,
    description: input.description,
    resourceUpdates: input.resourceUpdates,
    capacityChange: input.capacityChange,
    staffingUpdate: input.staffingUpdate,
    nextAssessment: input.nextAssessment,
    estimatedFullRestore: input.estimatedFullRestore,
    assessedBy: input.assessedBy || userId,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('restoration_updates')
    .insert({
      id: updateId,
      hospital_id: input.hospitalId,
      phase: input.phase,
      status_change: input.statusChange,
      description: input.description,
      resource_updates: input.resourceUpdates,
      capacity_change: input.capacityChange,
      staffing_update: input.staffingUpdate,
      next_assessment: input.nextAssessment,
      estimated_full_restore: input.estimatedFullRestore,
      assessed_by: input.assessedBy || userId,
      notes: input.notes,
      created_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating restoration update:', error)
    throw new Error('Failed to create restoration update')
  }

  // Update hospital with new values
  await supabase
    .from('hospitals')
    .update({
      restoration_phase: input.phase,
      status: input.statusChange,
      last_assessed: new Date().toISOString(),
      estimated_full_restore: input.estimatedFullRestore,
      total_beds: input.capacityChange?.totalBeds,
      available_beds: input.capacityChange?.availableBeds,
      icu_beds: input.capacityChange?.icuBeds,
      available_icu_beds: input.capacityChange?.availableIcuBeds,
      staff_count: input.staffingUpdate?.staffCount,
      available_staff: input.staffingUpdate?.availableStaff,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.hospitalId)

  // Update individual resources if provided
  if (input.resourceUpdates && input.resourceUpdates.length > 0) {
    for (const resourceUpdate of input.resourceUpdates) {
      // Check if resource exists
      const { data: existingResource } = await supabase
        .from('hospital_resources')
        .select('id')
        .eq('hospital_id', input.hospitalId)
        .eq('resource_type', resourceUpdate.resourceType)
        .single()

      if (existingResource) {
        await supabase
          .from('hospital_resources')
          .update({
            status: resourceUpdate.status,
            capacity: resourceUpdate.capacity,
            notes: resourceUpdate.notes,
            last_updated: new Date().toISOString(),
          })
          .eq('id', existingResource.id)
      } else {
        // Create new resource
        const resourceId = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await supabase
          .from('hospital_resources')
          .insert({
            id: resourceId,
            hospital_id: input.hospitalId,
            resource_type: resourceUpdate.resourceType,
            status: resourceUpdate.status,
            capacity: resourceUpdate.capacity,
            notes: resourceUpdate.notes,
            last_updated: new Date().toISOString(),
          })
      }
    }
  }

  return update
}

export async function getRestorationUpdates(
  hospitalId: string,
  limit?: number
): Promise<RestorationUpdate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('restoration_updates')
    .select('*')
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false })
    .limit(limit || 50)

  if (error) {
    console.error('Error fetching restoration updates:', error)
    return []
  }

  return (data || []).map(d => ({
    id: d.id,
    hospitalId: d.hospital_id,
    phase: d.phase,
    statusChange: d.status_change,
    description: d.description,
    resourceUpdates: d.resource_updates,
    capacityChange: d.capacity_change,
    staffingUpdate: d.staffing_update,
    nextAssessment: d.next_assessment,
    estimatedFullRestore: d.estimated_full_restore,
    assessedBy: d.assessed_by,
    notes: d.notes,
    createdAt: d.created_at,
  }))
}

export async function getAllHospitals(options?: {
  status?: HospitalStatus
  minCapacity?: number
  hasICU?: boolean
  latitude?: number
  longitude?: number
  radiusKm?: number
  limit?: number
  offset?: number
}): Promise<Hospital[]> {
  const supabase = createClient()

  let query = supabase
    .from('hospitals')
    .select('*')
    .order('name')

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.minCapacity) {
    query = query.gte('available_beds', options.minCapacity)
  }

  if (options?.hasICU) {
    query = query.gte('icu_beds', 1)
  }

  query = query
    .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 100) - 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching hospitals:', error)
    return []
  }

  let hospitals = (data || []).map(mapHospitalFromDB)

  // Filter by location if provided
  if (options?.latitude && options?.longitude && options?.radiusKm) {
    hospitals = hospitals.filter(h => {
      const distance = calculateDistance(
        options.latitude!,
        options.longitude!,
        h.latitude,
        h.longitude
      )
      return distance <= options.radiusKm!
    })
  }

  return hospitals
}

export async function findNearestHospital(
  latitude: number,
  longitude: number,
  options?: {
    status?: HospitalStatus[]
    hasICU?: boolean
    minBeds?: number
    limit?: number
  }
): Promise<Array<Hospital & { distance: number; estimatedMinutes: number }>> {
  const hospitals = await getAllHospitals({
    status: options?.status?.[0] as HospitalStatus | undefined,
    hasICU: options?.hasICU,
    minCapacity: options?.minBeds,
    limit: 50,
  })

  // Calculate distance and estimated time for each hospital
  const hospitalsWithDistance = hospitals.map(h => ({
    ...h,
    distance: calculateDistance(latitude, longitude, h.latitude, h.longitude),
    estimatedMinutes: estimateArrivalTime(latitude, longitude, h),
  }))

  // Sort by estimated time
  hospitalsWithDistance.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)

  return hospitalsWithDistance.slice(0, options?.limit || 5)
}

export async function getOperationalHospitals(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<Array<Hospital & { distance: number; estimatedMinutes: number }>> {
  return findNearestHospital(latitude, longitude, {
    status: ['operational', 'limited_operations'],
    limit: 10,
  }).then(hospitals => hospitals.filter(h => h.distance <= radiusKm))
}

export async function getHospitalCapacityReport(): Promise<{
  totalHospitals: number
  operational: number
  limited: number
  emergency: number
  evacuating: number
  closed: number
  totalBeds: number
  availableBeds: number
  totalIcuBeds: number
  availableIcuBeds: number
  averageCapacityScore: number
}> {
  const hospitals = await getAllHospitals({ limit: 1000 })

  const report = {
    totalHospitals: hospitals.length,
    operational: 0,
    limited: 0,
    emergency: 0,
    evacuating: 0,
    closed: 0,
    totalBeds: 0,
    availableBeds: 0,
    totalIcuBeds: 0,
    availableIcuBeds: 0,
    averageCapacityScore: 0,
  }

  let totalScore = 0

  for (const hospital of hospitals) {
    // Count by status
    switch (hospital.status) {
      case 'operational':
        report.operational++
        break
      case 'limited_operations':
        report.limited++
        break
      case 'emergency_only':
        report.emergency++
        break
      case 'evacuating':
        report.evacuating++
        break
      case 'closed':
        report.closed++
        break
    }

    // Sum capacities
    report.totalBeds += hospital.totalBeds || 0
    report.availableBeds += hospital.availableBeds || 0
    report.totalIcuBeds += hospital.icuBeds || 0
    report.availableIcuBeds += hospital.availableIcuBeds || 0

    totalScore += calculateHospitalCapacityScore(hospital)
  }

  report.averageCapacityScore = hospitals.length > 0
    ? totalScore / hospitals.length
    : 0

  return report
}

export async function updateResourceStatus(
  hospitalId: string,
  resourceType: ResourceType,
  status: ResourceStatus,
  capacity?: number,
  notes?: string
): Promise<void> {
  const supabase = createClient()

  // Check if resource exists
  const { data: existingResource } = await supabase
    .from('hospital_resources')
    .select('id')
    .eq('hospital_id', hospitalId)
    .eq('resource_type', resourceType)
    .single()

  if (existingResource) {
    await supabase
      .from('hospital_resources')
      .update({
        status,
        capacity,
        notes,
        last_updated: new Date().toISOString(),
      })
      .eq('id', existingResource.id)
  } else {
    // Create new resource
    const resourceId = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await supabase
      .from('hospital_resources')
      .insert({
        id: resourceId,
        hospital_id: hospitalId,
        resource_type: resourceType,
        status,
        capacity,
        notes,
        last_updated: new Date().toISOString(),
      })
  }

  // Update hospital's resources array
  await updateHospitalResourcesArray(hospitalId)
}

async function updateHospitalResourcesArray(hospitalId: string): Promise<void> {
  const supabase = createClient()

  const { data: resources } = await supabase
    .from('hospital_resources')
    .select('*')
    .eq('hospital_id', hospitalId)

  await supabase
    .from('hospitals')
    .update({
      resources: (resources || []).map(r => ({
        id: r.id,
        hospitalId: r.hospital_id,
        resourceType: r.resource_type,
        status: r.status,
        capacity: r.capacity,
        currentOccupancy: r.current_occupancy,
        lastUpdated: r.last_updated,
        notes: r.notes,
      })),
      updated_at: new Date().toISOString(),
    })
    .eq('id', hospitalId)
}

export async function subscribeToHospitalUpdates(
  hospitalId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('hospital_subscriptions')
    .insert({
      user_id: userId,
      hospital_id: hospitalId,
      created_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error subscribing to hospital updates:', error)
    throw new Error('Failed to subscribe to hospital updates')
  }
}

export async function notifyHospitalSubscribers(
  hospitalId: string,
  update: RestorationUpdate
): Promise<void> {
  const supabase = createClient()

  // Get subscribers
  const { data: subscribers } = await supabase
    .from('hospital_subscriptions')
    .select('user_id')
    .eq('hospital_id', hospitalId)

  if (!subscribers || subscribers.length === 0) return

  // Create notifications
  const notifications = subscribers.map(s => ({
    user_id: s.user_id,
    type: 'hospital_restoration_update',
    title: 'Hospital Status Update',
    body: `${update.phase}: ${update.description}`,
    data: { hospitalId, updateId: update.id },
    created_at: new Date().toISOString(),
  }))

  await supabase.from('notifications').insert(notifications)
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapHospitalFromDB(data: Record<string, unknown>): Hospital {
  return {
    id: data.id as string,
    name: data.name as string,
    address: data.address as string,
    latitude: data.latitude as number,
    longitude: data.longitude as number,
    phone: data.phone as string,
    website: data.website as string | undefined,
    status: data.status as HospitalStatus,
    restorationPhase: data.restoration_phase as RestorationPhase,
    lastAssessed: data.last_assessed as string | undefined,
    estimatedFullRestore: data.estimated_full_restore as string | undefined,
    emergencyContact: data.emergency_contact as string | undefined,
    adminContact: data.admin_contact as string | undefined,
    totalBeds: data.total_beds as number | undefined,
    availableBeds: data.available_beds as number | undefined,
    icuBeds: data.icu_beds as number | undefined,
    availableIcuBeds: data.available_icu_beds as number | undefined,
    resources: (data.resources as HospitalResource[]) || [],
    staffCount: data.staff_count as number | undefined,
    availableStaff: data.available_staff as number | undefined,
    services: (data.services as string[]) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
