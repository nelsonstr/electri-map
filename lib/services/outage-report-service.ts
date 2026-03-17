import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Outage status
 */
export type OutageStatus = 
  | 'reported' 
  | 'confirmed' 
  | 'investigating' 
  | 'scheduled_repair' 
  | 'in_progress' 
  | 'resolved' 
  | 'false_report'

/**
 * Outage severity level
 */
export type OutageSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Outage type
 */
export type OutageType = 
  | 'planned' 
  | 'unplanned' 
  | 'storm_damage' 
  | 'equipment_failure' 
  | 'animal_interference' 
  | 'vehicle_accident' 
  | 'vegetation' 
  | 'unknown'

/**
 * Outage impact scope
 */
export type OutageScope = 
  | 'single_location' 
  | 'street' 
  | 'neighborhood' 
  | 'municipality' 
  | 'region'

/**
 * Input for reporting an outage
 */
export interface OutageReportInput {
  // Location
  latitude: number
  longitude: number
  address?: string
  municipality: string
  parish?: string
  
  // Outage details
  type: OutageType
  severity: OutageSeverity
  scope: OutageScope
  
  // Description
  description?: string
  affectedCustomers?: number
  
  // Media
  photos?: string[]
  videos?: string[]
  
  // Contact (optional for anonymous reports)
  reporterName?: string
  reporterPhone?: string
  reporterEmail?: string
  isAnonymous?: boolean
  
  // Additional info
  isHazard?: boolean
  hazardDetails?: string
  hasBackupPower?: boolean
  vulnerablePeopleAffected?: boolean
}

/**
 * Full outage report data
 */
export interface OutageReport {
  id: string
  reportNumber: string
  status: OutageStatus
  type: OutageType
  severity: OutageSeverity
  scope: OutageScope
  
  // Location
  latitude: number
  longitude: number
  address?: string
  municipality: string
  parish?: string
  
  // Description
  description?: string
  affectedCustomers?: number
  
  // Media
  photos: string[]
  videos: string[]
  
  // Reporter
  reporterId?: string
  reporterName?: string
  reporterPhone?: string
  reporterEmail?: string
  isAnonymous: boolean
  
  // Hazard info
  isHazard: boolean
  hazardDetails?: string
  hasBackupPower: boolean
  vulnerablePeopleAffected: boolean
  
  // Verification
  isVerified: boolean
  verifiedBy?: string
  verifiedAt?: string
  
  // Assignment
  assignedTo?: string
  assignedAt?: string
  
  // Resolution
  resolvedAt?: string
  resolutionNotes?: string
  
  // Metadata
  source: string
  createdAt: string
  updatedAt: string
}

/**
 * Outage statistics
 */
export interface OutageStats {
  total: number
  byStatus: Record<OutageStatus, number>
  bySeverity: Record<OutageSeverity, number>
  byMunicipality: Record<string, number>
  averageResolutionTime: number // hours
  customersAffected: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for outage report input
 */
export const outageReportInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  municipality: z.string().min(1),
  parish: z.string().optional(),
  type: z.enum([
    'planned',
    'unplanned',
    'storm_damage',
    'equipment_failure',
    'animal_interference',
    'vehicle_accident',
    'vegetation',
    'unknown',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  scope: z.enum([
    'single_location',
    'street',
    'neighborhood',
    'municipality',
    'region',
  ]),
  description: z.string().max(1000).optional(),
  affectedCustomers: z.number().min(0).optional(),
  photos: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  reporterEmail: z.string().email().optional(),
  isAnonymous: z.boolean().default(false),
  isHazard: z.boolean().default(false),
  hazardDetails: z.string().optional(),
  hasBackupPower: z.boolean().default(false),
  vulnerablePeopleAffected: z.boolean().default(false),
})

/**
 * Schema for updating outage status
 */
export const outageStatusUpdateSchema = z.object({
  status: z.enum([
    'reported',
    'confirmed',
    'investigating',
    'scheduled_repair',
    'in_progress',
    'resolved',
    'false_report',
  ]),
  notes: z.string().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique report number for outage reports
 * Format: OUT-YYYYMMDD-XXXX
 */
function generateReportNumber(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `OUT-${dateStr}-${random}`
}

/**
 * Gets display name for outage type
 */
export function getOutageTypeDisplayName(type: OutageType): string {
  const names: Record<OutageType, string> = {
    planned: 'Planned Maintenance',
    unplanned: 'Unplanned Outage',
    storm_damage: 'Storm Damage',
    equipment_failure: 'Equipment Failure',
    animal_interference: 'Animal Interference',
    vehicle_accident: 'Vehicle Accident',
    vegetation: 'Vegetation Related',
    unknown: 'Unknown',
  }
  return names[type]
}

/**
 * Gets display name for outage status
 */
export function getOutageStatusDisplayName(status: OutageStatus): string {
  const names: Record<OutageStatus, string> = {
    reported: 'Reported',
    confirmed: 'Confirmed',
    investigating: 'Investigating',
    scheduled_repair: 'Scheduled for Repair',
    in_progress: 'Repair In Progress',
    resolved: 'Resolved',
    false_report: 'False Report',
  }
  return names[status]
}

/**
 * Gets severity badge info
 */
export function getOutageSeverityBadge(severity: OutageSeverity): {
  label: string
  color: string
  priority: number
} {
  const badges: Record<OutageSeverity, { label: string; color: string; priority: number }> = {
    low: { label: 'Low', color: 'bg-green-100 text-green-800', priority: 1 },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', priority: 2 },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800', priority: 3 },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800', priority: 4 },
  }
  return badges[severity]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Reports a power outage
 */
export async function reportOutage(
  input: OutageReportInput,
  userId?: string
): Promise<OutageReport> {
  const validationResult = outageReportInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid outage report: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const reportNumber = generateReportNumber()

  const { data, error } = await supabase
    .from('outage_reports')
    .insert({
      report_number: reportNumber,
      status: 'reported',
      type: validatedInput.type,
      severity: validatedInput.severity,
      scope: validatedInput.scope,
      latitude: validatedInput.latitude,
      longitude: validatedInput.longitude,
      address: validatedInput.address || null,
      municipality: validatedInput.municipality,
      parish: validatedInput.parish || null,
      description: validatedInput.description || null,
      affected_customers: validatedInput.affectedCustomers || null,
      photos: validatedInput.photos || [],
      videos: validatedInput.videos || [],
      reporter_id: userId || null,
      reporter_name: validatedInput.reporterName || null,
      reporter_phone: validatedInput.reporterPhone || null,
      reporter_email: validatedInput.reporterEmail || null,
      is_anonymous: validatedInput.isAnonymous,
      is_hazard: validatedInput.isHazard,
      hazard_details: validatedInput.hazardDetails || null,
      has_backup_power: validatedInput.hasBackupPower,
      vulnerable_people_affected: validatedInput.vulnerablePeopleAffected,
      is_verified: false,
      source: userId ? 'authenticated' : 'public',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error reporting outage:', error)
    throw new Error(`Failed to report outage: ${error.message}`)
  }

  return mapOutageReportFromDB(data)
}

/**
 * Gets an outage report by ID
 */
export async function getOutageReport(id: string): Promise<OutageReport | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('outage_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching outage report:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapOutageReportFromDB(data)
}

/**
 * Gets an outage report by report number
 */
export async function getOutageReportByNumber(
  reportNumber: string
): Promise<OutageReport | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('outage_reports')
    .select('*')
    .eq('report_number', reportNumber)
    .single()

  if (error) {
    console.error('Error fetching outage report:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapOutageReportFromDB(data)
}

/**
 * Gets outage reports by municipality
 */
export async function getOutageReportsByMunicipality(
  municipality: string,
  options?: {
    status?: OutageStatus[]
    severity?: OutageSeverity[]
    limit?: number
  }
): Promise<OutageReport[]> {
  const supabase = createClient()

  let query = supabase
    .from('outage_reports')
    .select('*')
    .eq('municipality', municipality)

  if (options?.status && options.status.length > 0) {
    query = query.in('status', options.status)
  }

  if (options?.severity && options.severity.length > 0) {
    query = query.in('severity', options.severity)
  }

  query = query.order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching outage reports:', error)
    return []
  }

  return (data || []).map(mapOutageReportFromDB)
}

/**
 * Gets active outages near a location
 */
export async function getNearbyOutages(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  includeResolved: boolean = false
): Promise<OutageReport[]> {
  const supabase = createClient()

  // Calculate bounding box
  const latDelta = radiusKm / 111
  const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))

  let query = supabase
    .from('outage_reports')
    .select('*')
    .gte('latitude', latitude - latDelta)
    .lte('latitude', latitude + latDelta)
    .gte('longitude', longitude - lonDelta)
    .lte('longitude', longitude + lonDelta)

  if (!includeResolved) {
    query = query.not('status', 'in', ['resolved', 'false_report'])
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching nearby outages:', error)
    return []
  }

  // Filter by exact distance and sort by severity
  const nearbyOutages = ((data as any[]) || [])
    .map(item => ({
      ...item,
      distance: calculateDistance(
        { latitude, longitude },
        { latitude: item.latitude as number, longitude: item.longitude as number }
      ),
    }))
    .filter(item => item.distance <= radiusKm * 1000)
    .sort((a, b) => {
      // Sort by severity first, then distance
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      const sevA = severityOrder[(a.severity as string)] ?? 3
      const sevB = severityOrder[(b.severity as string)] ?? 3
      const severityDiff = sevA - sevB
      if (severityDiff !== 0) return severityDiff
      return a.distance - b.distance
    })

  return nearbyOutages.map(mapOutageReportFromDB)
}

/**
 * Updates outage report status
 */
export async function updateOutageStatus(
  id: string,
  status: OutageStatus,
  notes?: string,
  assignedTo?: string
): Promise<OutageReport> {
  const supabase = createClient()

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (notes) {
    updates.resolution_notes = notes
  }

  if (status === 'resolved' || status === 'false_report') {
    updates.resolved_at = new Date().toISOString()
  }

  if (assignedTo) {
    updates.assigned_to = assignedTo
    updates.assigned_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('outage_reports')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating outage status:', error)
    throw new Error(`Failed to update outage status: ${error.message}`)
  }

  return mapOutageReportFromDB(data)
}

/**
 * Verifies an outage report
 */
export async function verifyOutageReport(
  id: string,
  verifiedBy: string
): Promise<OutageReport> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('outage_reports')
    .update({
      is_verified: true,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error verifying outage report:', error)
    throw new Error(`Failed to verify outage report: ${error.message}`)
  }

  return mapOutageReportFromDB(data)
}

/**
 * Gets outage statistics
 */
export async function getOutageStats(
  municipality?: string
): Promise<OutageStats> {
  const supabase = createClient()

  let query = supabase.from('outage_reports').select('*')

  if (municipality) {
    query = query.eq('municipality', municipality)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching outage stats:', error)
    return {
      total: 0,
      byStatus: {} as Record<OutageStatus, number>,
      bySeverity: {} as Record<OutageSeverity, number>,
      byMunicipality: {},
      averageResolutionTime: 0,
      customersAffected: 0,
    }
  }

  const reports = (data as any[]) || []
  
  const stats: OutageStats = {
    total: reports.length,
    byStatus: {} as Record<OutageStatus, number>,
    bySeverity: {} as Record<OutageSeverity, number>,
    byMunicipality: {},
    averageResolutionTime: 0,
    customersAffected: 0,
  }

  for (const report of reports) {
    // Count by status
    stats.byStatus[report.status as OutageStatus] = 
      (stats.byStatus[report.status as OutageStatus] || 0) + 1
    
    // Count by severity
    stats.bySeverity[report.severity as OutageSeverity] = 
      (stats.bySeverity[report.severity as OutageSeverity] || 0) + 1
    
    // Count by municipality
    stats.byMunicipality[report.municipality] = 
      (stats.byMunicipality[report.municipality] || 0) + 1
    
    // Sum affected customers
    if (report.affected_customers) {
      stats.customersAffected += report.affected_customers
    }
  }

  // Calculate average resolution time
  const resolvedReports = reports.filter(
    r => r.status === 'resolved' && r.resolved_at && r.created_at
  )
  
  if (resolvedReports.length > 0) {
    const totalHours = resolvedReports.reduce((sum, r) => {
      const created = new Date((r.created_at as string)).getTime()
      const resolved = new Date((r.resolved_at as string)).getTime()
      return sum + (resolved - created) / (1000 * 60 * 60)
    }, 0)
    stats.averageResolutionTime = totalHours / resolvedReports.length
  }

  return stats
}

/**
 * Searches outage reports
 */
export async function searchOutageReports(
  query: string,
  options?: {
    municipality?: string
    status?: OutageStatus[]
    limit?: number
  }
): Promise<OutageReport[]> {
  const supabase = createClient()

  let dbQuery = supabase
    .from('outage_reports')
    .select('*')
    .ilike('description', `%${query}%`)

  if (options?.municipality) {
    dbQuery = dbQuery.eq('municipality', options.municipality)
  }

  if (options?.status && options.status.length > 0) {
    dbQuery = dbQuery.in('status', options.status)
  }

  dbQuery = dbQuery.order('created_at', { ascending: false })

  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error searching outage reports:', error)
    return []
  }

  return (data || []).map(mapOutageReportFromDB)
}

/**
 * Gets user's outage reports
 */
export async function getUserOutageReports(
  userId: string,
  limit: number = 20
): Promise<OutageReport[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('outage_reports')
    .select('*')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching user outage reports:', error)
    return []
  }

  return (data || []).map(mapOutageReportFromDB)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to OutageReport
 */
function mapOutageReportFromDB(data: Record<string, unknown>): OutageReport {
  return {
    id: data.id as string,
    reportNumber: data.report_number as string,
    status: data.status as OutageStatus,
    type: data.type as OutageType,
    severity: data.severity as OutageSeverity,
    scope: data.scope as OutageScope,
    latitude: data.latitude as number,
    longitude: data.longitude as number,
    address: (data.address as string) || undefined,
    municipality: data.municipality as string,
    parish: (data.parish as string) || undefined,
    description: (data.description as string) || undefined,
    affectedCustomers: (data.affected_customers as number) || undefined,
    photos: (data.photos as string[]) || [],
    videos: (data.videos as string[]) || [],
    reporterId: (data.reporter_id as string) || undefined,
    reporterName: (data.reporter_name as string) || undefined,
    reporterPhone: (data.reporter_phone as string) || undefined,
    reporterEmail: (data.reporter_email as string) || undefined,
    isAnonymous: data.is_anonymous as boolean,
    isHazard: data.is_hazard as boolean,
    hazardDetails: (data.hazard_details as string) || undefined,
    hasBackupPower: data.has_backup_power as boolean,
    vulnerablePeopleAffected: data.vulnerable_people_affected as boolean,
    isVerified: data.is_verified as boolean,
    verifiedBy: (data.verified_by as string) || undefined,
    verifiedAt: (data.verified_at as string) || undefined,
    assignedTo: (data.assigned_to as string) || undefined,
    assignedAt: (data.assigned_at as string) || undefined,
    resolvedAt: (data.resolved_at as string) || undefined,
    resolutionNotes: (data.resolution_notes as string) || undefined,
    source: data.source as string,
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
