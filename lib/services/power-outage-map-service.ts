import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type OutageStatus = 
  | 'reported' 
  | 'confirmed' 
  | 'investigating' 
  | 'repair_scheduled' 
  | 'repair_in_progress' 
  | 'partially_restored' 
  | 'fully_restored' 
  | 'resolved'

export type OutageSeverity = 'low' | 'medium' | 'high' | 'critical'

export type OutageCause = 
  | 'weather' 
  | 'equipment_failure' 
  | 'animal_contact' 
  | 'vehicle_accident' 
  | 'vegetation' 
  | 'planned_maintenance' 
  | 'overload' 
  | 'vandalism' 
  | 'unknown'
  | 'other'

export type OutageType = 
  | 'residential' 
  | 'commercial' 
  | 'industrial' 
  | 'infrastructure' 
  | 'street_lighting' 
  | 'traffic_signals'

export interface OutageLocation {
  latitude: number
  longitude: number
  address?: string
  area?: string
  postalCode?: string
}

export interface PowerOutage {
  id: string
  location: OutageLocation
  status: OutageStatus
  severity: OutageSeverity
  cause: OutageCause
  outageType: OutageType
  affectedCustomers: number
  reportedAt: string
  confirmedAt?: string
  estimatedRestore?: string
  actualRestore?: string
  description: string
  updates: Array<{
    timestamp: string
    status: OutageStatus
    message: string
    updatedBy?: string
  }>
  source: 'customer_report' | 'sensor' | 'grid_monitor' | 'utility_company' | 'automated'
  verificationCount: number
  verifiedBy?: string[]
  crewAssigned?: string
  crewETA?: string
  createdAt: string
  updatedAt: string
}

export interface CreateOutageInput {
  latitude: number
  longitude: number
  address?: string
  area?: string
  postalCode?: string
  severity?: OutageSeverity
  cause?: OutageCause
  outageType?: OutageType
  affectedCustomers?: number
  description: string
  source?: 'customer_report' | 'sensor' | 'grid_monitor' | 'utility_company' | 'automated'
}

export interface UpdateOutageInput {
  outageId: string
  status?: OutageStatus
  severity?: OutageSeverity
  cause?: OutageCause
  affectedCustomers?: number
  estimatedRestore?: string
  crewAssigned?: string
  crewETA?: string
  message?: string
}

// ============================================================================
// Status Configuration
// ============================================================================

export const OUTAGE_STATUS_CONFIG: Record<OutageStatus, {
  label: string
  color: string
  icon: string
  description: string
}> = {
  reported: { label: 'Reported', color: '#f59e0b', icon: '📢', description: 'Outage has been reported' },
  confirmed: { label: 'Confirmed', color: '#ea580c', icon: '✅', description: 'Outage confirmed' },
  investigating: { label: 'Investigating', color: '#8b5cf6', icon: '🔍', description: 'Investigating cause' },
  repair_scheduled: { label: 'Repair Scheduled', color: '#0ea5e9', icon: '📅', description: 'Repair scheduled' },
  repair_in_progress: { label: 'Repair in Progress', color: '#14b8a6', icon: '🔧', description: 'Repair in progress' },
  partially_restored: { label: 'Partially Restored', color: '#84cc16', icon: '⚡', description: 'Partially restored' },
  fully_restored: { label: 'Fully Restored', color: '#22c55e', icon: '✅', description: 'Fully restored' },
  resolved: { label: 'Resolved', color: '#16a34a', icon: '🎉', description: 'Resolved' },
}

export const OUTAGE_SEVERITY_CONFIG: Record<OutageSeverity, {
  label: string
  color: string
  priority: number
}> = {
  low: { label: 'Low', color: '#22c55e', priority: 4 },
  medium: { label: 'Medium', color: '#f59e0b', priority: 3 },
  high: { label: 'High', color: '#f97316', priority: 2 },
  critical: { label: 'Critical', color: '#dc2626', priority: 1 },
}

export const OUTAGE_CAUSE_CONFIG: Record<OutageCause, {
  label: string
  icon: string
  description: string
}> = {
  weather: { label: 'Weather', icon: '⛈️', description: 'Severe weather' },
  equipment_failure: { label: 'Equipment Failure', icon: '⚙️', description: 'Equipment failed' },
  animal_contact: { label: 'Animal Contact', icon: '🐿️', description: 'Animal caused' },
  vehicle_accident: { label: 'Vehicle Accident', icon: '🚗', description: 'Vehicle accident' },
  vegetation: { label: 'Vegetation', icon: '🌳', description: 'Vegetation related' },
  planned_maintenance: { label: 'Planned Maintenance', icon: '🔧', description: 'Planned work' },
  overload: { label: 'Overload', icon: '⚡', description: 'Power overload' },
  vandalism: { label: 'Vandalism', icon: '🔨', description: 'Vandalism' },
  unknown: { label: 'Unknown', icon: '❓', description: 'Unknown cause' },
  other: { label: 'Other', icon: '📋', description: 'Other cause' },
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createOutageSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  area: z.string().optional(),
  postalCode: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  cause: z.enum(['weather', 'equipment_failure', 'animal_contact', 'vehicle_accident', 'vegetation', 'planned_maintenance', 'overload', 'vandalism', 'unknown', 'other']).optional(),
  outageType: z.enum(['residential', 'commercial', 'industrial', 'infrastructure', 'street_lighting', 'traffic_signals']).optional(),
  affectedCustomers: z.number().positive().optional(),
  description: z.string().min(1),
  source: z.enum(['customer_report', 'sensor', 'grid_monitor', 'utility_company', 'automated']).optional(),
})

export const updateOutageSchema = z.object({
  outageId: z.string(),
  status: z.enum(['reported', 'confirmed', 'investigating', 'repair_scheduled', 'repair_in_progress', 'partially_restored', 'fully_restored', 'resolved']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  cause: z.enum(['weather', 'equipment_failure', 'animal_contact', 'vehicle_accident', 'vegetation', 'planned_maintenance', 'overload', 'vandalism', 'unknown', 'other']).optional(),
  affectedCustomers: z.number().positive().optional(),
  estimatedRestore: z.string().optional(),
  crewAssigned: z.string().optional(),
  crewETA: z.string().optional(),
  message: z.string().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getStatusDisplayName(status: OutageStatus): string {
  return OUTAGE_STATUS_CONFIG[status]?.label || status
}

export function getStatusColor(status: OutageStatus): string {
  return OUTAGE_STATUS_CONFIG[status]?.color || '#6b7280'
}

export function getStatusIcon(status: OutageStatus): string {
  return OUTAGE_STATUS_CONFIG[status]?.icon || '📄'
}

export function getSeverityDisplayName(severity: OutageSeverity): string {
  return OUTAGE_SEVERITY_CONFIG[severity]?.label || severity
}

export function getSeverityColor(severity: OutageSeverity): string {
  return OUTAGE_SEVERITY_CONFIG[severity]?.color || '#6b7280'
}

export function getCauseDisplayName(cause: OutageCause): string {
  return OUTAGE_CAUSE_CONFIG[cause]?.label || cause
}

export function getCauseIcon(cause: OutageCause): string {
  return OUTAGE_CAUSE_CONFIG[cause]?.icon || '📄'
}

export function isOutageActive(outage: PowerOutage): boolean {
  const resolvedStatuses: OutageStatus[] = ['fully_restored', 'resolved']
  return !resolvedStatuses.includes(outage.status)
}

export function calculateOutageDuration(outage: PowerOutage): number {
  const start = new Date(outage.reportedAt)
  const end = outage.actualRestore ? new Date(outage.actualRestore) : new Date()
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function reportOutage(
  input: CreateOutageInput,
  userId?: string
): Promise<PowerOutage> {
  const validationResult = createOutageSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const outageId = `outage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  let severity = input.severity
  if (!severity && input.affectedCustomers) {
    if (input.affectedCustomers >= 1000) severity = 'critical'
    else if (input.affectedCustomers >= 500) severity = 'high'
    else if (input.affectedCustomers >= 100) severity = 'medium'
    else severity = 'low'
  }

  const outage: PowerOutage = {
    id: outageId,
    location: {
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      area: input.area,
      postalCode: input.postalCode,
    },
    status: 'reported',
    severity: severity || 'low',
    cause: input.cause || 'unknown',
    outageType: input.outageType || 'residential',
    affectedCustomers: input.affectedCustomers || 1,
    reportedAt: new Date().toISOString(),
    description: input.description,
    updates: [{
      timestamp: new Date().toISOString(),
      status: 'reported',
      message: input.description,
    }],
    source: input.source || 'customer_report',
    verificationCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('power_outages')
    .insert({
      id: outageId,
      location: outage.location,
      status: 'reported',
      severity: severity || 'low',
      cause: input.cause || 'unknown',
      outage_type: input.outageType || 'residential',
      affected_customers: input.affectedCustomers || 1,
      reported_at: new Date().toISOString(),
      description: input.description,
      updates: outage.updates,
      source: input.source || 'customer_report',
      verification_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error reporting outage:', error)
    throw new Error('Failed to report outage')
  }

  return outage
}

export async function getOutage(outageId: string): Promise<PowerOutage | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('power_outages')
    .select('*')
    .eq('id', outageId)
    .single()

  if (error || !data) return null

  return mapOutageFromDB(data)
}

export async function getActiveOutages(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<PowerOutage[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('power_outages')
    .select('*')
    .not('status', 'in', '("fully_restored","resolved")')
    .order('severity', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error fetching outages:', error)
    return []
  }

  let outages = (data || []).map(mapOutageFromDB)

  // Filter by radius
  outages = outages.filter(o => {
    const distance = calculateDistance(latitude, longitude, o.location.latitude, o.location.longitude)
    return distance <= radiusKm
  })

  return outages
}

export async function getAllActiveOutages(): Promise<PowerOutage[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('power_outages')
    .select('*')
    .not('status', 'in', '("fully_restored","resolved")')
    .order('severity', { ascending: true })

  if (error) {
    console.error('Error fetching outages:', error)
    return []
  }

  return (data || []).map(mapOutageFromDB)
}

export async function updateOutage(
  input: UpdateOutageInput,
  userId?: string
): Promise<PowerOutage> {
  const validationResult = updateOutageSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const currentOutage = await getOutage(input.outageId)
  if (!currentOutage) {
    throw new Error('Outage not found')
  }

  const updates: Partial<PowerOutage> = { updatedAt: new Date().toISOString() }
  const statusUpdate = input.status && input.status !== currentOutage.status

  if (input.status) updates.status = input.status
  if (input.severity) updates.severity = input.severity
  if (input.cause) updates.cause = input.cause
  if (input.affectedCustomers) updates.affectedCustomers = input.affectedCustomers
  if (input.estimatedRestore) updates.estimatedRestore = input.estimatedRestore
  if (input.crewAssigned) updates.crewAssigned = input.crewAssigned
  if (input.crewETA) updates.crewETA = input.crewETA

  if (statusUpdate) {
    const newUpdate = {
      timestamp: new Date().toISOString(),
      status: input.status!,
      message: input.message || `Status updated to ${getStatusDisplayName(input.status!)}`,
      updatedBy: userId,
    }
    updates.updates = [...currentOutage.updates, newUpdate]

    if (input.status === 'confirmed') {
      updates.confirmedAt = new Date().toISOString()
    }
    if (input.status === 'fully_restored') {
      updates.actualRestore = new Date().toISOString()
    }
  }

  const { error } = await supabase
    .from('power_outages')
    .update({
      status: updates.status,
      severity: updates.severity,
      cause: updates.cause,
      affected_customers: updates.affectedCustomers,
      estimated_restore: updates.estimatedRestore,
      actual_restore: updates.actualRestore,
      crew_assigned: updates.crewAssigned,
      crew_eta: updates.crewETA,
      updates: updates.updates,
      confirmed_at: updates.confirmedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.outageId)

  if (error) {
    console.error('Error updating outage:', error)
    throw new Error('Failed to update outage')
  }

  return getOutage(input.outageId) as Promise<PowerOutage>
}

export async function verifyOutage(outageId: string, userId: string): Promise<void> {
  const supabase = createClient()

  const outage = await getOutage(outageId)
  if (!outage) {
    throw new Error('Outage not found')
  }

  const verifiedBy = outage.verifiedBy || []
  if (!verifiedBy.includes(userId)) {
    verifiedBy.push(userId)
  }

  await supabase
    .from('power_outages')
    .update({
      verification_count: outage.verificationCount + 1,
      verified_by: verifiedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', outageId)
}

export async function reportOutageResolution(outageId: string): Promise<void> {
  await updateOutage({
    outageId,
    status: 'resolved',
    message: 'Outage has been resolved',
  })
}

export async function getOutageStats(): Promise<{
  totalActive: number
  byStatus: Record<string, number>
  bySeverity: Record<string, number>
  totalAffected: number
  criticalOutages: PowerOutage[]
}> {
  const outages = await getAllActiveOutages()

  const byStatus: Record<string, number> = {}
  const bySeverity: Record<string, number> = {}
  let totalAffected = 0
  const criticalOutages: PowerOutage[] = []

  for (const outage of outages) {
    byStatus[outage.status] = (byStatus[outage.status] || 0) + 1
    bySeverity[outage.severity] = (bySeverity[outage.severity] || 0) + 1
    totalAffected += outage.affectedCustomers

    if (outage.severity === 'critical') {
      criticalOutages.push(outage)
    }
  }

  return {
    totalActive: outages.length,
    byStatus,
    bySeverity,
    totalAffected,
    criticalOutages,
  }
}

export async function getOutagesByArea(area: string): Promise<PowerOutage[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('power_outages')
    .select('*')
    .eq('location->>area', area)
    .not('status', 'in', '("fully_restored","resolved")')

  if (error) {
    console.error('Error fetching outages by area:', error)
    return []
  }

  return (data || []).map(mapOutageFromDB)
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
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

function mapOutageFromDB(data: Record<string, unknown>): PowerOutage {
  return {
    id: data.id as string,
    location: data.location as OutageLocation,
    status: data.status as OutageStatus,
    severity: data.severity as OutageSeverity,
    cause: data.cause as OutageCause,
    outageType: data.outage_type as OutageType,
    affectedCustomers: data.affected_customers as number,
    reportedAt: data.reported_at as string,
    confirmedAt: data.confirmed_at as string | undefined,
    estimatedRestore: data.estimated_restore as string | undefined,
    actualRestore: data.actual_restore as string | undefined,
    description: data.description as string,
    updates: (data.updates as Array<{
      timestamp: string
      status: OutageStatus
      message: string
      updatedBy?: string
    }>) || [],
    source: data.source as 'customer_report' | 'sensor' | 'grid_monitor' | 'utility_company' | 'automated',
    verificationCount: data.verification_count as number,
    verifiedBy: data.verified_by as string[] | undefined,
    crewAssigned: data.crew_assigned as string | undefined,
    crewETA: data.crew_eta as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
