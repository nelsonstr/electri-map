import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Fire alert severity level
 */
export type FireSeverity = 'low' | 'moderate' | 'high' | 'very_high' | 'extreme' | 'code_red'

/**
 * Fire status
 */
export type FireStatus = 
  | 'detected' 
  | 'investigating' 
  | 'confirmed' 
  | 'active' 
  | 'contained' 
  | 'controlled' 
  | 'out' 
  | 'closed'

/**
 * Fire type
 */
export type FireType = 
  | 'wildfire'
  | 'structure'
  | 'vehicle'
  | 'vegetation'
  | 'industrial'
  | 'hazmat'
  | 'controlled_burn'
  | 'prescribed_fire'
  | 'other'

/**
 * Fire cause
 */
export type FireCause = 
  | 'natural'
  | 'lightning'
  | 'human'
  | 'accidental'
  | 'intentional'
  | 'under_investigation'
  | 'unknown'

/**
 * Fire alert source
 */
export type FireAlertSource = 
  | 'satellite'
  | 'sensor'
  | 'camera'
  | 'user_report'
  | ' authorities'
  | 'aircraft'
  | 'drone'

/**
 * Input for reporting a fire
 */
export interface FireReportInput {
  // Location
  latitude: number
  longitude: number
  address?: string
  municipality: string
  parish?: string
  
  // Fire details
  type: FireType
  severity: FireSeverity
  description?: string
  
  // Media
  photos?: string[]
  videos?: string[]
  
  // Reporter
  reporterName?: string
  reporterPhone?: string
  isAnonymous?: boolean
  
  // Additional info
  isEvacuationNeeded?: boolean
  peopleTrapped?: boolean
  hazardousMaterials?: boolean
  nearbyStructures?: string[]
}

/**
 * Full fire data
 */
export interface FireData {
  id: string
  fireId: string
  
  // Type and status
  type: FireType
  status: FireStatus
  severity: FireSeverity
  cause: FireCause
  
  // Location
  latitude: number
  longitude: number
  address?: string
  municipality: string
  parish?: string
  
  // Geometry (perimeter)
  perimeter?: GeoJSON.FeatureCollection
  
  // Description
  description?: string
  
  // Media
  photos: string[]
  videos: string[]
  
  // Evacuation
  evacuationZones?: EvacuationZone[]
  isEvacuationOrdered: boolean
  
  // Resources
  resourcesDeployed?: ResourceDeployment[]
  
  // Reporter
  reporterId?: string
  reporterName?: string
  reporterPhone?: string
  isAnonymous: boolean
  source: FireAlertSource
  
  // Discovery/containment times
  discoveredAt?: string
  reportedAt?: string
  containedAt?: string
  controlledAt?: string
  outAt?: string
  
  // Predicted spread
  predictedSpread?: FireSpreadPrediction
  
  // Metadata
  lastUpdated?: string
  nextUpdate?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Evacuation zone
 */
export interface EvacuationZone {
  id: string
  fireId: string
  
  // Zone info
  zoneId: string
  zoneName: string
  
  // Type
  type: 'mandatory' | 'voluntary' | 'warning' | 'shelter_in_place'
  
  // Geometry
  geometry: GeoJSON.FeatureCollection
  
  // Status
  isActive: boolean
  
  // Population
  populationAffected?: number
  
  // Timestamps
  orderedAt?: string
  liftedAt?: string
  
  // Instructions
  instructions?: string
  
  // Shelters
  shelters?: Shelter[]
  
  createdAt: string
  updatedAt: string
}

/**
 * Shelter
 */
export interface Shelter {
  id: string
  
  // Location
  name: string
  address: string
  latitude: number
  longitude: number
  
  // Capacity
  capacity: number
  currentOccupancy?: number
  
  // Status
  isOpen: boolean
  acceptsPets: boolean
  accessible: boolean
  
  // Contact
  phone?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Resource deployment
 */
export interface ResourceDeployment {
  id: string
  
  // Resource info
  type: 'personnel' | 'vehicle' | 'aircraft' | 'equipment'
  name: string
  
  // Quantity
  quantity: number
  
  // Status
  status: 'en_route' | 'on_scene' | 'returning' | 'available'
  
  // Assignment
  assignedZone?: string
  
  // Arrival estimate
  eta?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Fire spread prediction
 */
export interface FireSpreadPrediction {
  id: string
  fireId: string
  
  // Predicted perimeter
  predictedPerimeter: GeoJSON.FeatureCollection
  
  // Timeline
  predictionTime: string
  hoursAhead: number
  
  // Affected areas
  affectedAreas?: {
    municipality: string
    parish: string
    populationAtRisk?: number
  }[]
  
  // Risk assessment
  riskLevel: FireSeverity
  
  // Confidence
  confidence: number // 0-1
  
  createdAt: string
}

/**
 * Fire statistics
 */
export interface FireStats {
  totalActive: number
  totalContained: number
  totalOut: number
  
  byType: Record<FireType, number>
  bySeverity: Record<FireSeverity, number>
  byMunicipality: Record<string, number>
  
  acresBurned: number
  structuresDestroyed: number
  structuresDamaged: number
  
  personnelDeployed: number
  resourcesDeployed: number
  
  activeEvacuations: number
  peopleAffected: number
  
  // Comparison to average
  vsAverage: {
    active: number // percentage
    acres: number // percentage
  }
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for fire report input
 */
export const fireReportInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  municipality: z.string().min(1),
  parish: z.string().optional(),
  type: z.enum([
    'wildfire',
    'structure',
    'vehicle',
    'vegetation',
    'industrial',
    'hazmat',
    'controlled_burn',
    'prescribed_fire',
    'other',
  ]),
  severity: z.enum(['low', 'moderate', 'high', 'very_high', 'extreme', 'code_red']),
  description: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  isEvacuationNeeded: z.boolean().default(false),
  peopleTrapped: z.boolean().default(false),
  hazardousMaterials: z.boolean().default(false),
  nearbyStructures: z.array(z.string()).optional(),
})

/**
 * Schema for evacuation zone input
 */
export const evacuationZoneInputSchema = z.object({
  fireId: z.string().uuid(),
  zoneId: z.string(),
  zoneName: z.string(),
  type: z.enum(['mandatory', 'voluntary', 'warning', 'shelter_in_place']),
  geometry: z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(z.object({
      type: z.literal('Feature'),
      geometry: z.object({
        type: z.enum(['Polygon', 'MultiPolygon']),
        coordinates: z.array(z.array(z.array(z.number()))),
      }),
    })),
  }),
  populationAffected: z.number().optional(),
  instructions: z.string().optional(),
})

/**
 * Schema for resource deployment input
 */
export const resourceDeploymentInputSchema = z.object({
  fireId: z.string().uuid(),
  type: z.enum(['personnel', 'vehicle', 'aircraft', 'equipment']),
  name: z.string(),
  quantity: z.number().int().min(1),
  assignedZone: z.string().optional(),
  eta: z.string().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for fire type
 */
export function getFireTypeDisplayName(type: FireType): string {
  const names: Record<FireType, string> = {
    wildfire: 'Wildfire',
    structure: 'Structure Fire',
    vehicle: 'Vehicle Fire',
    vegetation: 'Vegetation Fire',
    industrial: 'Industrial Fire',
    hazmat: 'Hazmat Incident',
    controlled_burn: 'Controlled Burn',
    prescribed_fire: 'Prescribed Fire',
    other: 'Other Fire',
  }
  return names[type]
}

/**
 * Gets display name for fire status
 */
export function getFireStatusDisplayName(status: FireStatus): string {
  const names: Record<FireStatus, string> = {
    detected: 'Detected',
    investigating: 'Under Investigation',
    confirmed: 'Confirmed',
    active: 'Active',
    contained: 'Contained',
    controlled: 'Controlled',
    out: 'Out',
    closed: 'Closed',
  }
  return names[status]
}

/**
 * Gets severity badge info
 */
export function getFireSeverityBadge(severity: FireSeverity): {
  label: string
  color: string
  priority: number
} {
  const badges: Record<FireSeverity, { label: string; color: string; priority: number }> = {
    low: { label: 'Low', color: 'bg-green-100 text-green-800', priority: 1 },
    moderate: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800', priority: 2 },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800', priority: 3 },
    very_high: { label: 'Very High', color: 'bg-red-100 text-red-800', priority: 4 },
    extreme: { label: 'Extreme', color: 'bg-red-200 text-red-900', priority: 5 },
    code_red: { label: 'Code Red', color: 'bg-purple-100 text-purple-800', priority: 6 },
  }
  return badges[severity]
}

/**
 * Gets evacuation order badge
 */
export function getEvacuationTypeBadge(type: EvacuationZone['type']): {
  label: string
  color: string
} {
  const badges: Record<EvacuationZone['type'], { label: string; color: string }> = {
    mandatory: { label: 'Mandatory Evacuation', color: 'bg-red-100 text-red-800' },
    voluntary: { label: 'Voluntary Evacuation', color: 'bg-yellow-100 text-yellow-800' },
    warning: { label: 'Warning', color: 'bg-orange-100 text-orange-800' },
    shelter_in_place: { label: 'Shelter in Place', color: 'bg-blue-100 text-blue-800' },
  }
  return badges[type]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Reports a fire
 */
export async function reportFire(
  input: FireReportInput,
  userId?: string
): Promise<FireData> {
  const validationResult = fireReportInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid fire report: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const fireId = `FIRE-${Date.now().toString(36).toUpperCase()}`

  const { data, error } = await supabase
    .from('fire_data')
    .insert({
      fire_id: fireId,
      status: 'detected',
      type: validatedInput.type,
      severity: validatedInput.severity,
      cause: 'under_investigation',
      latitude: validatedInput.latitude,
      longitude: validatedInput.longitude,
      address: validatedInput.address || null,
      municipality: validatedInput.municipality,
      parish: validatedInput.parish || null,
      description: validatedInput.description || null,
      photos: validatedInput.photos || [],
      videos: validatedInput.videos || [],
      reporter_id: userId || null,
      reporter_name: validatedInput.reporterName || null,
      reporter_phone: validatedInput.reporterPhone || null,
      is_anonymous: validatedInput.isAnonymous,
      is_evacuation_ordered: validatedInput.isEvacuationNeeded,
      source: 'user_report',
      reported_at: new Date().toISOString(),
      discovered_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error reporting fire:', error)
    throw new Error(`Failed to report fire: ${error.message}`)
  }

  return mapFireFromDB(data)
}

/**
 * Gets active fires
 */
export async function getActiveFires(
  options?: {
    municipality?: string
    severity?: FireSeverity[]
    status?: FireStatus[]
  }
): Promise<FireData[]> {
  const supabase = createClient()

  let query = supabase
    .from('fire_data')
    .select('*')
    .not('status', 'in', ['out', 'closed'])

  if (options?.municipality) {
    query = query.eq('municipality', options.municipality)
  }

  if (options?.severity && options.severity.length > 0) {
    query = query.in('severity', options.severity)
  }

  if (options?.status && options.status.length > 0) {
    query = query.in('status', options.status)
  }

  query = query.order('severity', { ascending: false }).order('discovered_at', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching active fires:', error)
    return []
  }

  return (data || []).map(mapFireFromDB)
}

/**
 * Gets a fire by ID
 */
export async function getFire(fireId: string): Promise<FireData | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('fire_data')
    .select('*')
    .eq('id', fireId)
    .single()

  if (error) {
    console.error('Error fetching fire:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapFireFromDB(data)
}

/**
 * Gets fires near a location
 */
export async function getNearbyFires(
  latitude: number,
  longitude: number,
  radiusKm: number = 50,
  includeContained: boolean = false
): Promise<FireData[]> {
  const supabase = createClient()

  const latDelta = radiusKm / 111
  const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))

  let query = supabase
    .from('fire_data')
    .select('*')
    .gte('latitude', latitude - latDelta)
    .lte('latitude', latitude + latDelta)
    .gte('longitude', longitude - lonDelta)
    .lte('longitude', longitude + lonDelta)

  if (!includeContained) {
    query = query.not('status', 'in', ['out', 'closed', 'controlled', 'contained'])
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching nearby fires:', error)
    return []
  }

  return (data || []).map(mapFireFromDB)
}

/**
 * Updates fire status
 */
export async function updateFireStatus(
  fireId: string,
  status: FireStatus,
  updates?: {
    severity?: FireSeverity
    cause?: FireCause
    description?: string
    perimeter?: GeoJSON.FeatureCollection
  }
): Promise<FireData> {
  const supabase = createClient()

  const dbUpdates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Set timestamp based on status
  if (status === 'contained') {
    dbUpdates.contained_at = new Date().toISOString()
  } else if (status === 'controlled') {
    dbUpdates.controlled_at = new Date().toISOString()
  } else if (status === 'out') {
    dbUpdates.out_at = new Date().toISOString()
  }

  if (updates) {
    if (updates.severity) dbUpdates.severity = updates.severity
    if (updates.cause) dbUpdates.cause = updates.cause
    if (updates.description) dbUpdates.description = updates.description
    if (updates.perimeter) dbUpdates.perimeter = updates.perimeter
  }

  const { data, error } = await supabase
    .from('fire_data')
    .update(dbUpdates)
    .eq('id', fireId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating fire status:', error)
    throw new Error(`Failed to update fire: ${error.message}`)
  }

  return mapFireFromDB(data)
}

/**
 * Creates an evacuation zone
 */
export async function createEvacuationZone(
  input: z.infer<typeof evacuationZoneInputSchema>
): Promise<EvacuationZone> {
  const validationResult = evacuationZoneInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid evacuation zone: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('evacuation_zones')
    .insert({
      fire_id: validatedInput.fireId,
      zone_id: validatedInput.zoneId,
      zone_name: validatedInput.zoneName,
      type: validatedInput.type,
      geometry: validatedInput.geometry,
      population_affected: validatedInput.populationAffected || null,
      instructions: validatedInput.instructions || null,
      is_active: true,
      ordered_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating evacuation zone:', error)
    throw new Error(`Failed to create evacuation zone: ${error.message}`)
  }

  return mapEvacuationZoneFromDB(data)
}

/**
 * Gets evacuation zones for a fire
 */
export async function getEvacuationZones(
  fireId: string
): Promise<EvacuationZone[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('evacuation_zones')
    .select('*')
    .eq('fire_id', fireId)
    .eq('is_active', true)
    .order('type', { ascending: false })

  if (error) {
    console.error('Error fetching evacuation zones:', error)
    return []
  }

  return (data || []).map(mapEvacuationZoneFromDB)
}

/**
 * Lifts an evacuation zone
 */
export async function liftEvacuationZone(zoneId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('evacuation_zones')
    .update({
      is_active: false,
      lifted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', zoneId)
}

/**
 * Deploys resources to a fire
 */
export async function deployResources(
  input: z.infer<typeof resourceDeploymentInputSchema>
): Promise<ResourceDeployment> {
  const validationResult = resourceDeploymentInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid resource deployment: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_deployments')
    .insert({
      fire_id: validatedInput.fireId,
      type: validatedInput.type,
      name: validatedInput.name,
      quantity: validatedInput.quantity,
      assigned_zone: validatedInput.assignedZone || null,
      eta: validatedInput.eta || null,
      status: 'en_route',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error deploying resources:', error)
    throw new Error(`Failed to deploy resources: ${error.message}`)
  }

  return mapResourceDeploymentFromDB(data)
}

/**
 * Gets resources deployed to a fire
 */
export async function getFireResources(
  fireId: string
): Promise<ResourceDeployment[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_deployments')
    .select('*')
    .eq('fire_id', fireId)

  if (error) {
    console.error('Error fetching fire resources:', error)
    return []
  }

  return (data || []).map(mapResourceDeploymentFromDB)
}

/**
 * Gets fire statistics
 */
export async function getFireStats(
  municipality?: string
): Promise<FireStats> {
  const supabase = createClient()

  let query = supabase.from('fire_data').select('*')

  if (municipality) {
    query = query.eq('municipality', municipality)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching fire stats:', error)
    return getDefaultFireStats()
  }

  const fires = data || []
  
  const stats: FireStats = {
    totalActive: 0,
    totalContained: 0,
    totalOut: 0,
    byType: {} as Record<FireType, number>,
    bySeverity: {} as Record<FireSeverity, number>,
    byMunicipality: {},
    acresBurned: 0,
    structuresDestroyed: 0,
    structuresDamaged: 0,
    personnelDeployed: 0,
    resourcesDeployed: 0,
    activeEvacuations: 0,
    peopleAffected: 0,
    vsAverage: { active: 0, acres: 0 },
  }

  for (const fire of fires) {
    // Count by status
    if (['active', 'confirmed', 'investigating', 'detected'].includes(fire.status)) {
      stats.totalActive++
    } else if (fire.status === 'contained' || fire.status === 'controlled') {
      stats.totalContained++
    } else if (fire.status === 'out') {
      stats.totalOut++
    }

    // Count by type
    stats.byType[fire.type as FireType] = (stats.byType[fire.type as FireType] || 0) + 1

    // Count by severity
    stats.bySeverity[fire.severity as FireSeverity] = (stats.bySeverity[fire.severity as FireSeverity] || 0) + 1

    // Count by municipality
    stats.byMunicipality[fire.municipality] = (stats.byMunicipality[fire.municipality] || 0) + 1
  }

  return stats
}

/**
 * Gets fires within a polygon (for map display)
 */
export async function getFiresInPolygon(
  polygon: GeoJSON.Polygon
): Promise<FireData[]> {
  const supabase = createClient()

  // Convert polygon to bounds for simple filtering
  const coordinates = polygon.coordinates[0]
  const lons = coordinates.map(c => c[0])
  const lats = coordinates.map(c => c[1])

  const minLng = Math.min(...lons)
  const maxLng = Math.max(...lons)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)

  const { data, error } = await supabase
    .from('fire_data')
    .select('*')
    .gte('latitude', minLat)
    .lte('latitude', maxLat)
    .gte('longitude', minLng)
    .lte('longitude', maxLng)
    .not('status', 'in', ['out', 'closed'])

  if (error) {
    console.error('Error fetching fires in polygon:', error)
    return []
  }

  return (data || []).map(mapFireFromDB)
}

/**
 * Subscribes to fire updates (real-time)
 */
export function subscribeToFireUpdates(
  fireId: string,
  callback: (fire: FireData) => void
): () => void {
  const supabase = createClient()

  const subscription = supabase
    .channel(`fire-${fireId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fire_data',
        filter: `id=eq.${fireId}`,
      },
      (payload) => {
        if (payload.new) {
          callback(mapFireFromDB(payload.new as Record<string, unknown>))
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(subscription)
  }
}

/**
 * Searches fire data
 */
export async function searchFireData(
  query: string,
  options?: {
    status?: FireStatus[]
    type?: FireType[]
    limit?: number
  }
): Promise<FireData[]> {
  const supabase = createClient()

  let dbQuery = supabase
    .from('fire_data')
    .select('*')
    .or(`description.ilike.%${query}%,municipality.ilike.%${query}%`)

  if (options?.status && options.status.length > 0) {
    dbQuery = dbQuery.in('status', options.status)
  }

  if (options?.type && options.type.length > 0) {
    dbQuery = dbQuery.in('type', options.type)
  }

  dbQuery = query.order('discovered_at', { ascending: false })

  if (options?.limit) {
    dbQuery = query.limit(options.limit)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error searching fire data:', error)
    return []
  }

  return (data || []).map(mapFireFromDB)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to FireData
 */
function mapFireFromDB(data: Record<string, unknown>): FireData {
  return {
    id: data.id as string,
    fireId: data.fire_id as string,
    type: data.type as FireType,
    status: data.status as FireStatus,
    severity: data.severity as FireSeverity,
    cause: data.cause as FireCause,
    latitude: data.latitude as number,
    longitude: data.longitude as number,
    address: data.address as string | undefined,
    municipality: data.municipality,
    parish: data.parish as string | undefined,
    perimeter: data.perimeter as GeoJSON.FeatureCollection | undefined,
    description: data.description as string | undefined,
    photos: (data.photos as string[]) || [],
    videos: (data.videos as string[]) || [],
    isEvacuationOrdered: data.is_evacuation_ordered as boolean,
    reporterId: data.reporter_id as string | undefined,
    reporterName: data.reporter_name as string | undefined,
    reporterPhone: data.reporter_phone as string | undefined,
    isAnonymous: data.is_anonymous as boolean,
    source: data.source as FireAlertSource,
    discoveredAt: data.discovered_at as string | undefined,
    reportedAt: data.reported_at as string | undefined,
    containedAt: data.contained_at as string | undefined,
    controlledAt: data.controlled_at as string | undefined,
    outAt: data.out_at as string | undefined,
    lastUpdated: data.last_updated as string | undefined,
    nextUpdate: data.next_update as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to EvacuationZone
 */
function mapEvacuationZoneFromDB(data: Record<string, unknown>): EvacuationZone {
  return {
    id: data.id as string,
    fireId: data.fire_id as string,
    zoneId: data.zone_id as string,
    zoneName: data.zone_name as string,
    type: data.type as EvacuationZone['type'],
    geometry: data.geometry as GeoJSON.FeatureCollection,
    isActive: data.is_active as boolean,
    populationAffected: data.population_affected as number | undefined,
    orderedAt: data.ordered_at as string | undefined,
    liftedAt: data.lifted_at as string | undefined,
    instructions: data.instructions as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to ResourceDeployment
 */
function mapResourceDeploymentFromDB(data: Record<string, unknown>): ResourceDeployment {
  return {
    id: data.id as string,
    type: data.type as ResourceDeployment['type'],
    name: data.name as string,
    quantity: data.quantity,
    status: data.status as ResourceDeployment['status'],
    assignedZone: data.assigned_zone as string | undefined,
    eta: data.eta as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Returns default fire stats
 */
function getDefaultFireStats(): FireStats {
  return {
    totalActive: 0,
    totalContained: 0,
    totalOut: 0,
    byType: {} as Record<FireType, number>,
    bySeverity: {} as Record<FireSeverity, number>,
    byMunicipality: {},
    acresBurned: 0,
    structuresDestroyed: 0,
    structuresDamaged: 0,
    personnelDeployed: 0,
    resourcesDeployed: 0,
    activeEvacuations: 0,
    peopleAffected: 0,
    vsAverage: { active: 0, acres: 0 },
  }
}
