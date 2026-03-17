import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Outage status
 */
export type PowerOutageStatus =
  | 'active'
  | 'reported'
  | 'confirmed'
  | 'investigating'
  | 'crew_dispatched'
  | 'restoring'
  | 'partially_restored'
  | 'fully_restored'
  | 'resolved'

/**
 * Outage severity
 */
export type OutageSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Cause type
 */
export type OutageCause =
  | 'weather'
  | 'equipment_failure'
  | 'animal_damage'
  | 'vehicle_accident'
  | 'vegetation'
  | 'planned_maintenance'
  | 'overload'
  | 'vandalism'
  | 'unknown'
  | 'other'

/**
 * Customer type
 */
export type CustomerType =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'critical_infrastructure'
  | 'hospital'
  | 'school'
  | 'government'

/**
 * Power outage entry
 */
export interface PowerOutage {
  id: string
  externalId?: string
  
  // Location
  municipality?: string
  parish?: string
  latitude?: number
  longitude?: number
  affectedArea?: string
  affectedSubstation?: string
  affectedFeeder?: string
  
  // Status
  status: PowerOutageStatus
  severity: OutageSeverity
  
  // Details
  cause?: OutageCause
  causeDetails?: string
  
  // Customer impact
  affectedCustomersTotal?: number
  affectedCustomersResidential?: number
  affectedCustomersCommercial?: number
  affectedCustomersIndustrial?: number
  criticalCustomersAffected?: number
  
  // Timeline
  outageStartedAt?: string
  estimatedRestoration?: string
  actualRestoration?: string
  
  // Crew information
  crewStatus?: string
  estimatedArrival?: string
  crewId?: string
  
  // Updates
  lastUpdated?: string
  updateCount: number
  
  // Related
  relatedOutageIds?: string[]
  parentOutageId?: string
  
  // Source
  source?: string
  reportCount: number
  
  createdAt: string
  updatedAt: string
}

/**
 * Outage report
 */
export interface OutageReport {
  id: string
  outageId?: string
  
  // Location
  latitude: number
  longitude: number
  address?: string
  municipality?: string
  parish?: string
  
  // Reporter
  reporterId?: string
  reporterType?: 'user' | 'automated' | 'utility' | 'government'
  reporterName?: string
  
  // Details
  cause?: OutageCause
  description?: string
  
  // Visibility
  isVisible: boolean
  verified: boolean
  
  createdAt: string
}

/**
 * Outage update
 */
export interface OutageUpdate {
  id: string
  outageId: string
  
  // Content
  title?: string
  description: string
  
  // Status change
  previousStatus?: PowerOutageStatus
  newStatus: PowerOutageStatus
  
  // Progress
  customersRestored?: number
  progressPercentage?: number
  
  // Crew
  crewId?: string
  crewStatus?: string
  
  // Timeline
  estimatedRestoration?: string
  
  createdAt: string
}

/**
 * Outage statistics
 */
export interface OutageStats {
  totalActiveOutages: number
  totalAffectedCustomers: number
  criticalOutages: number
  byMunicipality: Record<string, number>
  byCause: Record<OutageCause, number>
  averageRestorationTime: number | null
  restorationProgress: number
}

/**
 * Create outage input
 */
export interface CreateOutageInput {
  municipality?: string
  parish?: string
  latitude?: number
  longitude?: number
  affectedArea?: string
  affectedSubstation?: string
  affectedFeeder?: string
  cause?: OutageCause
  causeDetails?: string
  severity?: OutageSeverity
  estimatedRestoration?: string
  source?: string
}

/**
 * Create report input
 */
export interface CreateReportInput {
  outageId?: string
  latitude: number
  longitude: number
  address?: string
  municipality?: string
  parish?: string
  reporterId?: string
  cause?: OutageCause
  description?: string
}

/**
 * Update input
 */
export interface UpdateInput {
  status?: PowerOutageStatus
  severity?: OutageSeverity
  cause?: OutageCause
  affectedCustomersTotal?: number
  estimatedRestoration?: string
  crewId?: string
  crewStatus?: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating an outage
 */
export const createOutageSchema = z.object({
  municipality: z.string().optional(),
  parish: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  affectedArea: z.string().optional(),
  affectedSubstation: z.string().optional(),
  affectedFeeder: z.string().optional(),
  cause: z.enum([
    'weather', 'equipment_failure', 'animal_damage', 'vehicle_accident',
    'vegetation', 'planned_maintenance', 'overload', 'vandalism', 'unknown', 'other'
  ]).optional(),
  causeDetails: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  estimatedRestoration: z.string().datetime().optional(),
  source: z.string().optional(),
})

/**
 * Schema for creating a report
 */
export const createReportSchema = z.object({
  outageId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  municipality: z.string().optional(),
  parish: z.string().optional(),
  reporterId: z.string().uuid().optional(),
  cause: z.enum([
    'weather', 'equipment_failure', 'animal_damage', 'vehicle_accident',
    'vegetation', 'planned_maintenance', 'overload', 'vandalism', 'unknown', 'other'
  ]).optional(),
  description: z.string().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for outage status
 */
export function getOutageStatusDisplayName(status: PowerOutageStatus): string {
  const names: Record<PowerOutageStatus, string> = {
    active: 'Active',
    reported: 'Reported',
    confirmed: 'Confirmed',
    investigating: 'Investigating',
    crew_dispatched: 'Crew Dispatched',
    restoring: 'Restoring',
    partially_restored: 'Partially Restored',
    fully_restored: 'Fully Restored',
    resolved: 'Resolved',
  }
  return names[status]
}

/**
 * Gets color for outage status
 */
export function getOutageStatusColor(status: PowerOutageStatus): string {
  const colors: Record<PowerOutageStatus, string> = {
    active: 'bg-red-600',
    reported: 'bg-orange-500',
    confirmed: 'bg-yellow-500',
    investigating: 'bg-purple-500',
    crew_dispatched: 'bg-blue-500',
    restoring: 'bg-cyan-500',
    partially_restored: 'bg-teal-500',
    fully_restored: 'bg-green-500',
    resolved: 'bg-gray-500',
  }
  return colors[status]
}

/**
 * Gets display name for severity
 */
export function getSeverityDisplayName(severity: OutageSeverity): string {
  const names: Record<OutageSeverity, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  }
  return names[severity]
}

/**
 * Gets color for severity
 */
export function getSeverityColor(severity: OutageSeverity): string {
  const colors: Record<OutageSeverity, string> = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-600',
  }
  return colors[severity]
}

/**
 * Gets display name for cause
 */
export function getCauseDisplayName(cause: OutageCause): string {
  const names: Record<OutageCause, string> = {
    weather: 'Weather',
    equipment_failure: 'Equipment Failure',
    animal_damage: 'Animal Damage',
    vehicle_accident: 'Vehicle Accident',
    vegetation: 'Vegetation',
    planned_maintenance: 'Planned Maintenance',
    overload: 'Overload',
    vandalism: 'Vandalism',
    unknown: 'Unknown',
    other: 'Other',
  }
  return names[cause]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a new power outage
 */
export async function createPowerOutage(
  input: CreateOutageInput
): Promise<PowerOutage> {
  const validationResult = createOutageSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid outage input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('power_outages')
    .insert({
      municipality: input.municipality || null,
      parish: input.parish || null,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      affected_area: input.affectedArea || null,
      affected_substation: input.affectedSubstation || null,
      affected_feeder: input.affectedFeeder || null,
      cause: input.cause || null,
      cause_details: input.causeDetails || null,
      severity: input.severity || 'medium',
      status: 'active',
      estimated_restoration: input.estimatedRestoration || null,
      source: input.source || null,
      report_count: 0,
      update_count: 0,
      outage_started_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating power outage:', error)
    throw new Error(`Failed to create power outage: ${error.message}`)
  }

  return mapOutageFromDB(data)
}

/**
 * Gets a power outage by ID
 */
export async function getPowerOutage(
  outageId: string
): Promise<PowerOutage | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('power_outages')
    .select('*')
    .eq('id', outageId)
    .single()

  if (error) {
    console.error('Error fetching power outage:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapOutageFromDB(data)
}

/**
 * Gets active power outages
 */
export async function getActiveOutages(
  municipality?: string
): Promise<PowerOutage[]> {
  const supabase = createClient()

  let query = supabase
    .from('power_outages')
    .select('*')
    .in('status', ['active', 'reported', 'confirmed', 'investigating', 'crew_dispatched', 'restoring', 'partially_restored'])
    .order('severity', { ascending: false })
    .order('affected_customers_total', { ascending: false })

  if (municipality) {
    query = query.eq('municipality', municipality)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching active outages:', error)
    return []
  }

  return (data || []).map(mapOutageFromDB)
}

/**
 * Gets outages near a location
 */
export async function getNearbyOutages(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<PowerOutage[]> {
  const outages = await getActiveOutages()

  return outages
    .filter(outage => outage.latitude && outage.longitude)
    .filter(outage => {
      const distance = calculateDistance(
        { latitude, longitude },
        { latitude: outage.latitude!, longitude: outage.longitude! }
      )
      return distance <= radiusKm * 1000
    })
    .sort((a, b) => {
      const distA = calculateDistance(
        { latitude, longitude },
        { latitude: a.latitude!, longitude: a.longitude! }
      )
      const distB = calculateDistance(
        { latitude, longitude },
        { latitude: b.latitude!, longitude: b.longitude! }
      )
      return distA - distB
    })
}

/**
 * Creates an outage report
 */
export async function createOutageReport(
  input: CreateReportInput
): Promise<OutageReport> {
  const validationResult = createReportSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid report input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Check if there's an existing outage nearby
  let outageId = input.outageId
  if (!outageId) {
    const { data: nearbyOutages } = await supabase
      .from('power_outages')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .order('created_at', { ascending: false })

    if (nearbyOutages && nearbyOutages.length > 0) {
      outageId = nearbyOutages[0].id as string
    }
  }

  const { data, error } = await supabase
    .from('outage_reports')
    .insert({
      outage_id: outageId || null,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address || null,
      municipality: input.municipality || null,
      parish: input.parish || null,
      reporter_id: input.reporterId || null,
      cause: input.cause || null,
      description: input.description || null,
      is_visible: true,
      verified: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating report:', error)
    throw new Error(`Failed to create report: ${error.message}`)
  }

  // If linked to outage, update report count
  if (outageId) {
    await supabase
      .from('power_outages')
      .update({ report_count: supabase.rpc('increment', { row_id: outageId, column: 'report_count' }) })
      .eq('id', outageId)
  }

  return {
    id: data.id as string,
    outageId: (data.outage_id as string) || undefined,
    latitude: data.latitude as number,
    longitude: data.longitude as number,
    address: (data.address as string) || undefined,
    municipality: (data.municipality as string) || undefined,
    parish: (data.parish as string) || undefined,
    reporterId: (data.reporter_id as string) || undefined,
    cause: (data.cause as OutageCause) || undefined,
    description: (data.description as string) || undefined,
    isVisible: data.is_visible as boolean,
    verified: data.verified as boolean,
    createdAt: data.created_at as string,
  }
}

/**
 * Gets outage reports for an outage
 */
export async function getOutageReports(
  outageId: string
): Promise<OutageReport[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('outage_reports')
    .select('*')
    .eq('outage_id', outageId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports:', error)
    return []
  }

  return (data || []).map(report => ({
    id: report.id as string,
    outageId: (report.outage_id as string) || undefined,
    latitude: report.latitude as number,
    longitude: report.longitude as number,
    address: (report.address as string) || undefined,
    municipality: (report.municipality as string) || undefined,
    parish: (report.parish as string) || undefined,
    reporterId: (report.reporter_id as string) || undefined,
    reporterType: (report.reporter_type as 'user' | 'automated' | 'utility' | 'government') || undefined,
    cause: (report.cause as OutageCause) || undefined,
    description: (report.description as string) || undefined,
    isVisible: report.is_visible as boolean,
    verified: report.verified as boolean,
    createdAt: report.created_at as string,
  }))
}

/**
 * Updates outage status
 */
export async function updateOutageStatus(
  outageId: string,
  status: PowerOutageStatus,
  description: string
): Promise<PowerOutage> {
  const supabase = createClient()

  // Get current status
  const { data: current } = await supabase
    .from('power_outages')
    .select('status, affected_customers_total')
    .eq('id', outageId)
    .single()

  // Create update
  await supabase
    .from('outage_updates')
    .insert({
      outage_id: outageId,
      description,
      previous_status: current?.status,
      new_status: status,
    })

  const updateData: Record<string, unknown> = {
    status,
    last_updated: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (status === 'fully_restored' || status === 'resolved') {
    updateData.actual_restoration = new Date().toISOString()
    updateData.progress_percentage = 100
  }

  const { data, error } = await supabase
    .from('power_outages')
    .update(updateData)
    .eq('id', outageId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating outage status:', error)
    throw new Error(`Failed to update status: ${error.message}`)
  }

  return mapOutageFromDB(data)
}

/**
 * Gets outage updates
 */
export async function getOutageUpdates(
  outageId: string
): Promise<OutageUpdate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('outage_updates')
    .select('*')
    .eq('outage_id', outageId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching updates:', error)
    return []
  }

  return (data || []).map(update => ({
    id: update.id as string,
    outageId: update.outage_id as string,
    title: (update.title as string) || undefined,
    description: update.description as string,
    previousStatus: (update.previous_status as PowerOutageStatus) || undefined,
    newStatus: update.new_status as PowerOutageStatus,
    customersRestored: (update.customers_restored as number) || undefined,
    progressPercentage: (update.progress_percentage as number) || undefined,
    crewId: (update.crew_id as string) || undefined,
    crewStatus: (update.crew_status as string) || undefined,
    estimatedRestoration: (update.estimated_restoration as string) || undefined,
    createdAt: update.created_at as string,
  }))
}

/**
 * Updates affected customer count
 */
export async function updateAffectedCustomers(
  outageId: string,
  customers: {
    total?: number
    residential?: number
    commercial?: number
    industrial?: number
    critical?: number
  }
): Promise<PowerOutage> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('power_outages')
    .update({
      affected_customers_total: customers.total,
      affected_customers_residential: customers.residential,
      affected_customers_commercial: customers.commercial,
      affected_customers_industrial: customers.industrial,
      critical_customers_affected: customers.critical,
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', outageId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating affected customers:', error)
    throw new Error(`Failed to update: ${error.message}`)
  }

  return mapOutageFromDB(data)
}

/**
 * Gets outage statistics
 */
export async function getOutageStats(
  municipality?: string
): Promise<OutageStats> {
  const supabase = createClient()

  let query = supabase
    .from('power_outages')
    .select('status, severity, cause, municipality, affected_customers_total')

  if (municipality) {
    query = query.eq('municipality', municipality)
  }

  const { data } = await query

  const stats: OutageStats = {
    totalActiveOutages: 0,
    totalAffectedCustomers: 0,
    criticalOutages: 0,
    byMunicipality: {},
    byCause: {
      weather: 0,
      equipment_failure: 0,
      animal_damage: 0,
      vehicle_accident: 0,
      vegetation: 0,
      planned_maintenance: 0,
      overload: 0,
      vandalism: 0,
      unknown: 0,
      other: 0,
    },
    averageRestorationTime: null,
    restorationProgress: 0,
  }

  let totalRestorationTime = 0
  let restorationCount = 0

  for (const outage of (data || []) as any[]) {
    const status = outage.status as string
    if (['active', 'reported', 'confirmed', 'investigating', 'crew_dispatched', 'restoring', 'partially_restored'].includes(status)) {
      stats.totalActiveOutages++
      
      if (outage.severity === 'critical') {
        stats.criticalOutages++
      }

      stats.totalAffectedCustomers += (outage.affected_customers_total as number) || 0

      if (outage.municipality) {
        const municipality = outage.municipality as string
        stats.byMunicipality[municipality] = (stats.byMunicipality[municipality] || 0) + 1
      }

      if (outage.cause) {
        stats.byCause[outage.cause as OutageCause]++
      }

      // Calculate restoration time
      if (outage.actual_restoration && outage.outage_started_at) {
        const start = new Date(outage.outage_started_at as string)
        const end = new Date(outage.actual_restoration as string)
        totalRestorationTime += (end.getTime() - start.getTime())
        restorationCount++
      }
    }
  }

  if (restorationCount > 0) {
    stats.averageRestorationTime = totalRestorationTime / restorationCount
  }

  return stats
}

/**
 * Gets municipality outage summary
 */
export async function getMunicipalityOutageSummary(
  municipality: string
): Promise<{
  outages: PowerOutage[]
  totalAffected: number
  criticalOutages: number
  restoredToday: number
}> {
  const supabase = createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('power_outages')
    .select('*')
    .eq('municipality', municipality)

  const outages = (data || []).map(mapOutageFromDB)
  const activeOutages = outages.filter(o =>
    ['active', 'reported', 'confirmed', 'investigating', 'crew_dispatched', 'restoring', 'partially_restored'].includes(o.status)
  )
  const criticalOutages = activeOutages.filter(o => o.severity === 'critical')
  const restoredToday = outages.filter(o =>
    o.actualRestoration && new Date(o.actualRestoration) >= today
  )

  return {
    outages: activeOutages,
    totalAffected: activeOutages.reduce((sum, o) => sum + (o.affectedCustomersTotal || 0), 0),
    criticalOutages: criticalOutages.length,
    restoredToday: restoredToday.length,
  }
}

/**
 * Searches outages
 */
export async function searchOutages(
  query: string,
  options?: {
    status?: PowerOutageStatus[]
    municipality?: string
    limit?: number
  }
): Promise<PowerOutage[]> {
  const supabase = createClient()

  let dbQuery = supabase
    .from('power_outages')
    .select('*')
    .or(`affected_area.ilike.%${query}%,municipality.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (options?.status && options.status.length > 0) {
    dbQuery = dbQuery.in('status', options.status)
  }

  if (options?.municipality) {
    dbQuery = dbQuery.eq('municipality', options.municipality)
  }

  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error searching outages:', error)
    return []
  }

  return (data || []).map(mapOutageFromDB)
}

/**
 * Calculates estimated restoration time based on historical data
 */
export async function getEstimatedRestorationTime(
  municipality: string,
  cause: OutageCause,
  severity: OutageSeverity
): Promise<number | null> {
  const supabase = createClient()

  const { data } = await supabase
    .from('power_outages')
    .select('actual_restoration, outage_started_at')
    .eq('municipality', municipality)
    .eq('cause', cause)
    .eq('severity', severity)
    .not('actual_restoration', 'is', null)

  if (!data || data.length as number === 0) {
    return null
  }

  let totalTime = 0
  let count = 0

  for (const outage of (data || []) as any[]) {
    if (outage.actual_restoration && outage.outage_started_at) {
      const start = new Date(outage.outage_started_at as string)
      const end = new Date(outage.actual_restoration as string)
      totalTime += (end.getTime() - start.getTime())
      count++
    }
  }

  return count > 0 ? totalTime / count : null
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to PowerOutage
 */
function mapOutageFromDB(data: Record<string, unknown>): PowerOutage {
  return {
    id: data.id as string,
    externalId: data.external_id as string | undefined,
    municipality: data.municipality as string | undefined,
    parish: data.parish as string | undefined,
    latitude: data.latitude as number | undefined,
    longitude: data.longitude as number | undefined,
    affectedArea: data.affected_area as string | undefined,
    affectedSubstation: data.affected_substation as string | undefined,
    affectedFeeder: data.affected_feeder as string | undefined,
    status: data.status as PowerOutageStatus,
    severity: data.severity as OutageSeverity,
    cause: data.cause as OutageCause | undefined,
    causeDetails: data.cause_details as string | undefined,
    affectedCustomersTotal: data.affected_customers_total as number | undefined,
    affectedCustomersResidential: data.affected_customers_residential as number | undefined,
    affectedCustomersCommercial: data.affected_customers_commercial as number | undefined,
    affectedCustomersIndustrial: data.affected_customers_industrial as number | undefined,
    criticalCustomersAffected: data.critical_customers_affected as number | undefined,
    outageStartedAt: data.outage_started_at as string | undefined,
    estimatedRestoration: data.estimated_restoration as string | undefined,
    actualRestoration: data.actual_restoration as string | undefined,
    crewStatus: data.crew_status as string | undefined,
    estimatedArrival: data.estimated_arrival as string | undefined,
    crewId: data.crew_id as string | undefined,
    lastUpdated: data.last_updated as string | undefined,
    updateCount: data.update_count as number || 0,
    relatedOutageIds: data.related_outage_ids as string[] | undefined,
    parentOutageId: data.parent_outage_id as string | undefined,
    source: data.source as string | undefined,
    reportCount: data.report_count as number || 0,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Calculates distance between two points (Haversine formula)
 */
function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371000 // Earth's radius in meters
  const lat1 = (point1.latitude * Math.PI) / 180
  const lat2 = (point2.latitude * Math.PI) / 180
  const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180
  const deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
