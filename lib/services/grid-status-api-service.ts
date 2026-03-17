import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Grid status type
 */
export type GridStatusType = 
  | 'normal'
  | 'advisory'
  | 'watch'
  | 'warning'
  | 'emergency'
  | 'critical'

/**
 * Grid component type
 */
export type GridComponentType = 
  | 'generation'
  | 'transmission'
  | 'distribution'
  | 'substation'
  | 'feeder'
  | 'transformer'
  | 'line'
  | 'switch'
  | 'breaker'

/**
 * Grid component status
 */
export type GridComponentStatus = 
  | 'operational'
  | 'degraded'
  | 'impaired'
  | 'outage'
  | 'maintenance'
  | 'planned_outage'

/**
 * Region type
 */
export type RegionType = 
  | 'country'
  | 'state'
  | 'county'
  | 'city'
  | 'neighborhood'
  | 'custom'

/**
 * Grid status
 */
export interface GridStatus {
  id: string
  
  // Status info
  status: GridStatusType
  statusLevel: number // 1-5 scale
  message: string
  
  // Region
  region: {
    id: string
    name: string
    type: RegionType
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  
  // Metrics
  metrics: {
    totalGenerationMW: number
    peakDemandMW: number
    currentDemandMW: number
    reserveMarginMW: number
    frequencyHz: number
    renewablePercent: number
  }
  
  // Timestamps
  lastUpdated: string
  nextUpdate?: string
  validUntil?: string
}

/**
 * Grid component
 */
export interface GridComponent {
  id: string
  componentId: string
  
  // Component info
  name: string
  type: GridComponentType
  status: GridComponentStatus
  
  // Location
  location: {
    latitude: number
    longitude: number
    address?: string
    region?: string
  }
  
  // Capacity
  capacity?: {
    value: number
    unit: string
  }
  
  // Load
  currentLoad?: {
    value: number
    unit: string
    percentOfCapacity: number
  }
  
  // Outage info
  outageStartedAt?: string
  estimatedRestoration?: string
  customersAffected?: number
  
  // Maintenance
  maintenanceScheduled?: {
    startAt: string
    endAt: string
    description?: string
  }
  
  createdAt: string
  updatedAt: string
}

/**
 * Outage information
 */
export interface GridOutage {
  id: string
  outageId: string
  
  // Outage info
  type: 'planned' | 'unplanned' | 'storm' | 'equipment_failure' | 'vegetation' | 'animal' | 'human_error' | 'weather' | 'unknown'
  cause: string
  status: 'investigating' | 'identified' | 'restoration_started' | 'restored' | 'cancelled'
  
  // Location
  affectedArea: {
    latitude: number
    longitude: number
    radius: number // meters
    description?: string
  }
  
  // Impact
  customersAffected: number
  criticalCustomersAffected?: number
  
  // Timing
  reportedAt: string
  startedAt: string
  estimatedRestoration?: string
  actualRestoration?: string
  
  // Crew
  crewAssigned?: {
    crewId: string
    crewName: string
    estimatedArrival?: string
  }
  
  // Updates
  updates?: Array<{
    timestamp: string
    message: string
    action?: string
  }>
  
  createdAt: string
  updatedAt: string
}

/**
 * Power flow data
 */
export interface PowerFlowData {
  timestamp: string
  
  // Generation by source
  generation: {
    coalMW: number
    naturalGasMW: number
    nuclearMW: number
    hydroMW: number
    solarMW: number
    windMW: number
    geothermalMW: number
    biomassMW: number
    otherMW: number
  }
  
  // Total
  totalGenerationMW: number
  totalDemandMW: number
  importExportMW: number // positive = import, negative = export
  
  // Frequency
  frequencyHz: number
  
  // Reserve
  reserveMarginMW: number
  reservePercent: number
  
  // Renewables
  renewablePercent: number
  carbonIntensity: number // gCO2/kWh
}

/**
 * Capacity data
 */
export interface CapacityData {
  timestamp: string
  
  // Peak demand forecast
  peakDemandForecastMW: number
  peakDemandActualMW?: number
  
  // Available capacity
  availableCapacityMW: number
  installedCapacityMW: number
  
  // Margin
  capacityMarginMW: number
  capacityMarginPercent: number
  
  // Forecast
  nextDayPeakForecastMW: number
  nextWeekPeakForecastMW: number
}

/**
 * Alert information
 */
export interface GridAlert {
  id: string
  alertId: string
  
  // Alert info
  type: 'weather' | 'outage' | 'conservation' | 'emergency' | 'maintenance' | 'market' | 'operational'
  severity: 'info' | 'watch' | 'warning' | 'critical'
  title: string
  message: string
  
  // Timing
  issuedAt: string
  expiresAt?: string
  updatedAt?: string
  
  // Action
  actionRequired?: string
  recommendations?: string[]
  
  // Region
  affectedRegions?: Array<{
    id: string
    name: string
  }>
  
  // Links
  links?: Array<{
    title: string
    url: string
  }>
  
  createdAt: string
}

/**
 * Conservation request
 */
export interface ConservationRequest {
  id: string
  
  // Request info
  type: 'voluntary' | 'mandatory' | 'emergency'
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  level: number // 1-4
  
  // Details
  message: string
  targetReductionPercent: number
  actualReductionPercent?: number
  
  // Timing
  startAt: string
  endAt: string
  nextUpdate?: string
  
  // Impact
  expectedSavingsMW?: number
  actualSavingsMW?: number
  
  // Areas
  affectedAreas?: string[]
  
  createdAt: string
  updatedAt: string
}

/**
 * Weather impact
 */
export interface WeatherImpact {
  id: string
  
  // Weather info
  type: 'heat_wave' | 'cold_snap' | 'storm' | 'hurricane' | 'tornado' | 'flood' | 'wildfire' | 'ice' | 'snow' | 'wind'
  severity: 'minor' | 'moderate' | 'major' | 'extreme'
  
  // Details
  description: string
  forecast?: string
  
  // Timing
  expectedStart: string
  expectedEnd: string
  
  // Grid impact
  expectedImpactMW: number
  estimatedCustomersAffected: number
  potentialOutageDuration?: string
  
  // Preparation
  actionsTaken?: string[]
  recommendations?: string[]
  
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for querying grid status
 */
export const gridStatusQuerySchema = z.object({
  regionId: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().positive().max(100000).optional(), // meters
  includeComponents: z.boolean().optional(),
  includeOutages: z.boolean().optional(),
})

/**
 * Schema for querying outages
 */
export const outageQuerySchema = z.object({
  status: z.enum(['investigating', 'identified', 'restoration_started', 'restored', 'cancelled']).optional(),
  type: z.enum(['planned', 'unplanned', 'storm', 'equipment_failure', 'vegetation', 'animal', 'human_error', 'weather', 'unknown']).optional(),
  regionId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().positive().max(100).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for grid status
 */
export function getGridStatusDisplayName(status: GridStatusType): string {
  const names: Record<GridStatusType, string> = {
    normal: 'Normal Operations',
    advisory: 'Advisory',
    watch: 'Watch',
    warning: 'Warning',
    emergency: 'Emergency',
    critical: 'Critical',
  }
  return names[status]
}

/**
 * Gets color for grid status
 */
export function getGridStatusColor(status: GridStatusType): string {
  const colors: Record<GridStatusType, string> = {
    normal: 'bg-green-500',
    advisory: 'bg-blue-500',
    watch: 'bg-yellow-500',
    warning: 'bg-orange-500',
    emergency: 'bg-red-500',
    critical: 'bg-red-700',
  }
  return colors[status]
}

/**
 * Gets display name for component type
 */
export function getGridComponentTypeDisplayName(type: GridComponentType): string {
  const names: Record<GridComponentType, string> = {
    generation: 'Generation',
    transmission: 'Transmission',
    distribution: 'Distribution',
    substation: 'Substation',
    feeder: 'Feeder',
    transformer: 'Transformer',
    line: 'Power Line',
    switch: 'Switch',
    breaker: 'Breaker',
  }
  return names[type]
}

/**
 * Gets color for component status
 */
export function getGridComponentStatusColor(status: GridComponentStatus): string {
  const colors: Record<GridComponentStatus, string> = {
    operational: 'bg-green-500',
    degraded: 'bg-yellow-500',
    impaired: 'bg-orange-500',
    outage: 'bg-red-500',
    maintenance: 'bg-blue-500',
    planned_outage: 'bg-gray-500',
  }
  return colors[status]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Gets current grid status
 */
export async function getGridStatus(
  options?: {
    regionId?: string
    latitude?: number
    longitude?: number
    includeComponents?: boolean
    includeOutages?: boolean
  }
): Promise<GridStatus | null> {
  const validationResult = gridStatusQuerySchema.safeParse(options)
  if (!validationResult.success) {
    throw new Error(`Invalid query: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Get status from database or API
  const { data, error } = await supabase
    .from('grid_status')
    .select('*')
    .order('last_updated', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching grid status:', error)
    return null
  }

  if (!data) {
    // Return default status if none exists
    return {
      id: 'default',
      status: 'normal',
      statusLevel: 1,
      message: 'Grid operating normally',
      region: {
        id: 'default',
        name: 'Service Area',
        type: 'country',
      },
      metrics: {
        totalGenerationMW: 0,
        peakDemandMW: 0,
        currentDemandMW: 0,
        reserveMarginMW: 0,
        frequencyHz: 50,
        renewablePercent: 0,
      },
      lastUpdated: new Date().toISOString(),
    }
  }

  return {
    id: data.id as string,
    status: data.status as GridStatusType,
    statusLevel: data.status_level as number,
    message: data.message as string,
    region: {
      id: data.region_id as string,
      name: data.region_name as string,
      type: data.region_type as RegionType,
      coordinates: data.region_coordinates as { latitude: number; longitude: number } | undefined,
    },
    metrics: {
      totalGenerationMW: data.total_generation_mw as number,
      peakDemandMW: data.peak_demand_mw as number,
      currentDemandMW: data.current_demand_mw as number,
      reserveMarginMW: data.reserve_margin_mw as number,
      frequencyHz: data.frequency_hz as number,
      renewablePercent: data.renewable_percent as number,
    },
    lastUpdated: data.last_updated as string,
    nextUpdate: data.next_update as string | undefined,
    validUntil: data.valid_until as string | undefined,
  }
}

/**
 * Updates grid status
 */
export async function updateGridStatus(
  status: GridStatusType,
  message: string,
  options?: {
    regionId?: string
    metrics?: Partial<GridStatus['metrics']>
    validForMinutes?: number
  }
): Promise<GridStatus> {
  const supabase = createClient()

  const statusLevels: Record<GridStatusType, number> = {
    normal: 1,
    advisory: 2,
    watch: 3,
    warning: 4,
    emergency: 5,
    critical: 5,
  }

  const now = new Date()
  const validUntil = options?.validForMinutes
    ? new Date(now.getTime() + options.validForMinutes * 60000)
    : null

  const { data, error } = await supabase
    .from('grid_status')
    .insert({
      status,
      status_level: statusLevels[status],
      message,
      region_id: options?.regionId || 'default',
      region_name: 'Service Area',
      region_type: 'country',
      total_generation_mw: options?.metrics?.totalGenerationMW || 0,
      peak_demand_mw: options?.metrics?.peakDemandMW || 0,
      current_demand_mw: options?.metrics?.currentDemandMW || 0,
      reserve_margin_mw: options?.metrics?.reserveMarginMW || 0,
      frequency_hz: options?.metrics?.frequencyHz || 50,
      renewable_percent: options?.metrics?.renewablePercent || 0,
      valid_until: validUntil?.toISOString(),
      last_updated: now.toISOString(),
      next_update: new Date(now.getTime() + 15 * 60000).toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating grid status:', error)
    throw new Error(`Failed to update status: ${error.message}`)
  }

  return {
    id: data.id as string,
    status: data.status as GridStatusType,
    statusLevel: data.status_level as number,
    message: data.message as string,
    region: {
      id: data.region_id as string,
      name: data.region_name as string,
      type: data.region_type as RegionType,
      coordinates: data.region_coordinates as { latitude: number; longitude: number } | undefined,
    },
    metrics: {
      totalGenerationMW: data.total_generation_mw as number,
      peakDemandMW: data.peak_demand_mw as number,
      currentDemandMW: data.current_demand_mw as number,
      reserveMarginMW: data.reserve_margin_mw as number,
      frequencyHz: data.frequency_hz as number,
      renewablePercent: data.renewable_percent as number,
    },
    lastUpdated: data.last_updated as string,
    nextUpdate: data.next_update as string | undefined,
    validUntil: data.valid_until as string | undefined,
  }
}

/**
 * Gets grid components in an area
 */
export async function getGridComponents(
  options?: {
    latitude?: number
    longitude?: number
    radius?: number // meters
    type?: GridComponentType
    status?: GridComponentStatus
    limit?: number
  }
): Promise<GridComponent[]> {
  const supabase = createClient()

  let query = supabase
    .from('grid_components')
    .select('*')
    .order('name', { ascending: true })

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching components:', error)
    return []
  }

  return (data || []).map(mapComponentFromDB)
}

/**
 * Gets active outages
 */
export async function getActiveOutages(
  options?: {
    regionId?: string
    type?: GridOutage['type']
    limit?: number
  }
): Promise<GridOutage[]> {
  const validationResult = outageQuerySchema.safeParse(options)
  if (!validationResult.success) {
    throw new Error(`Invalid query: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  let query = supabase
    .from('grid_outages')
    .select('*')
    .neq('status', 'restored')
    .neq('status', 'cancelled')
    .order('started_at', { ascending: false })

  if (options?.regionId) {
    query = query.eq('region_id', options.regionId)
  }

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching outages:', error)
    return []
  }

  return (data || []).map(mapOutageFromDB)
}

/**
 * Gets outage by ID
 */
export async function getOutageById(outageId: string): Promise<GridOutage | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('grid_outages')
    .select('*')
    .eq('outage_id', outageId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching outage:', error)
    return null
  }

  if (!data) return null
  return mapOutageFromDB(data)
}

/**
 * Reports an outage
 */
export async function reportOutage(
  reporterId: string,
  data: {
    latitude: number
    longitude: number
    type?: GridOutage['type']
    description?: string
    customersAffected?: number
  }
): Promise<GridOutage> {
  const supabase = createClient()

  const outageId = `outage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data: outage, error } = await supabase
    .from('grid_outages')
    .insert({
      outage_id: outageId,
      reporter_id: reporterId,
      type: data.type as string || 'unknown',
      cause: data.description as string || 'Reported by customer',
      status: 'investigating',
      affected_area: {
        latitude: data.latitude as number,
        longitude: data.longitude as number,
        radius: 500,
      },
      customers_affected: data.customersAffected || 1,
      started_at: new Date().toISOString(),
      reported_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error reporting outage:', error)
    throw new Error(`Failed to report outage: ${error.message}`)
  }

  return mapOutageFromDB(outage)
}

/**
 * Gets power flow data
 */
export async function getPowerFlowData(): Promise<PowerFlowData> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('power_flow')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching power flow:', error)
    // Return default values
    return getDefaultPowerFlowData()
  }

  if (!data) {
    return getDefaultPowerFlowData()
  }

  return {
    timestamp: data.timestamp as string,
    generation: {
      coalMW: (data.generation_coal_mw as number) || 0,
      naturalGasMW: (data.generation_natural_gas_mw as number) || 0,
      nuclearMW: (data.generation_nuclear_mw as number) || 0,
      hydroMW: (data.generation_hydro_mw as number) || 0,
      solarMW: (data.generation_solar_mw as number) || 0,
      windMW: (data.generation_wind_mw as number) || 0,
      geothermalMW: (data.generation_geothermal_mw as number) || 0,
      biomassMW: (data.generation_biomass_mw as number) || 0,
      otherMW: (data.generation_other_mw as number) || 0,
    },
    totalGenerationMW: (data.total_generation_mw as number) || 0,
    totalDemandMW: (data.total_demand_mw as number) || 0,
    importExportMW: (data.import_export_mw as number) || 0,
    frequencyHz: (data.frequency_hz as number) || 50,
    reserveMarginMW: (data.reserve_margin_mw as number) || 0,
    reservePercent: (data.reserve_percent as number) || 0,
    renewablePercent: (data.renewable_percent as number) || 0,
    carbonIntensity: (data.carbon_intensity as number) || 0,
  }
}

/**
 * Gets capacity data
 */
export async function getCapacityData(): Promise<CapacityData> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('capacity_data')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching capacity:', error)
    return getDefaultCapacityData()
  }

  if (!data) {
    return getDefaultCapacityData()
  }

  return {
    timestamp: data.timestamp as string,
    peakDemandForecastMW: (data.peak_demand_forecast_mw as number) || 0,
    peakDemandActualMW: (data.peak_demand_actual_mw as number) || undefined,
    availableCapacityMW: (data.available_capacity_mw as number) || 0,
    installedCapacityMW: (data.installed_capacity_mw as number) || 0,
    capacityMarginMW: (data.capacity_margin_mw as number) || 0,
    capacityMarginPercent: (data.capacity_margin_percent as number) || 0,
    nextDayPeakForecastMW: (data.next_day_peak_forecast_mw as number) || 0,
    nextWeekPeakForecastMW: (data.next_week_peak_forecast_mw as number) || 0,
  }
}

/**
 * Gets active alerts
 */
export async function getActiveAlerts(
  options?: {
    severity?: GridAlert['severity']
    type?: GridAlert['type']
    regionId?: string
  }
): Promise<GridAlert[]> {
  const supabase = createClient()

  let query = supabase
    .from('grid_alerts')
    .select('*')
    .is('expired_at', null)
    .order('issued_at', { ascending: false })

  if (options?.severity) {
    query = query.eq('severity', options.severity)
  }

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.regionId) {
    query = query.eq('region_id', options.regionId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching alerts:', error)
    return []
  }

  return (data || []).map(mapAlertFromDB)
}

/**
 * Creates a conservation request
 */
export async function createConservationRequest(
  data: {
    type: ConservationRequest['type']
    level: number
    message: string
    targetReductionPercent: number
    startAt: string
    endAt: string
    affectedAreas?: string[]
  }
): Promise<ConservationRequest> {
  const supabase = createClient()

  const { data: request, error } = await supabase
    .from('conservation_requests')
    .insert({
      type: data.type as string,
      level: data.level as number,
      message: data.message as string,
      target_reduction_percent: data.targetReductionPercent as number,
      start_at: data.startAt,
      end_at: data.endAt,
      affected_areas: data.affectedAreas || [],
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating conservation request:', error)
    throw new Error(`Failed to create request: ${error.message}`)
  }

  return {
    id: request.id as string,
    type: request.type as ConservationRequest['type'],
    status: request.status as ConservationRequest['status'],
    level: request.level as number,
    message: request.message as string,
    targetReductionPercent: request.target_reduction_percent as number,
    startAt: request.start_at as string,
    endAt: request.end_at as string,
    affectedAreas: request.affected_areas as string[] | undefined,
    createdAt: request.created_at as string,
    updatedAt: request.updated_at as string,
  }
}

/**
 * Gets active conservation requests
 */
export async function getActiveConservationRequests(): Promise<ConservationRequest[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('conservation_requests')
    .select('*')
    .in('status', ['pending', 'active'])
    .order('level', { ascending: false })
    .order('start_at', { ascending: true })

  if (error) {
    console.error('Error fetching conservation requests:', error)
    return []
  }

  return (data || []).map(r => ({
    id: (r as any).id as string,
    type: (r as any).type as ConservationRequest['type'],
    status: (r as any).status as ConservationRequest['status'],
    level: (r as any).level as number,
    message: (r as any).message as string,
    targetReductionPercent: (r as any).target_reduction_percent as number,
    actualReductionPercent: (r as any).actual_reduction_percent as number | undefined,
    startAt: (r as any).start_at as string,
    endAt: (r as any).end_at as string,
    nextUpdate: (r as any).next_update as string | undefined,
    expectedSavingsMW: (r as any).expected_savings_mw as number | undefined,
    actualSavingsMW: (r as any).actual_savings_mw as number | undefined,
    affectedAreas: (r as any).affected_areas as string[] | undefined,
    createdAt: (r as any).created_at as string,
    updatedAt: (r as any).updated_at as string,
  }))
}

/**
 * Gets weather impacts on grid
 */
export async function getWeatherImpacts(): Promise<WeatherImpact[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('weather_impacts')
    .select('*')
    .gte('expected_end', new Date().toISOString())
    .order('expected_start', { ascending: true })

  if (error) {
    console.error('Error fetching weather impacts:', error)
    return []
  }

  return (data || []).map(w => ({
    id: (w as any).id as string,
    type: (w as any).type as WeatherImpact['type'],
    severity: (w as any).severity as WeatherImpact['severity'],
    description: (w as any).description as string,
    forecast: (w as any).forecast as string | undefined,
    expectedStart: (w as any).expected_start as string,
    expectedEnd: (w as any).expected_end as string,
    expectedImpactMW: (w as any).expected_impact_mw as number,
    estimatedCustomersAffected: (w as any).estimated_customers_affected as number,
    potentialOutageDuration: (w as any).potential_outage_duration as string | undefined,
    actionsTaken: (w as any).actions_taken as string[] | undefined,
    recommendations: (w as any).recommendations as string[] | undefined,
    createdAt: (w as any).created_at as string,
    updatedAt: (w as any).updated_at as string,
  }))
}

/**
 * Gets grid statistics for a region
 */
export async function getGridStatistics(
  regionId: string,
  days: number = 7
): Promise<{
  totalOutages: number
  totalCustomersAffected: number
  averageRestorationTime: number // minutes
  saidi: number // System Average Interruption Duration Index
  saifi: number // System Average Interruption Frequency Index
  outageCauses: Array<{ cause: string; count: number }>
  hourlyOutageDistribution: Array<{ hour: number; outages: number }>
}> {
  const supabase = createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get outage statistics
  const { data: outages } = await supabase
    .from('grid_outages')
    .select('*')
    .gte('started_at', startDate.toISOString())

  let totalOutages = 0
  let totalCustomersAffected = 0
  let totalRestorationTime = 0
  let restorationCount = 0
  const causeCounts: Record<string, number> = {}
  const hourlyDistribution: Record<number, number> = {}

  for (const outage of outages || []) {
    const outageAny = outage as any
    totalOutages++
    totalCustomersAffected += (outageAny.customers_affected as number) || 0

    const cause = (outageAny.type as string) || 'unknown'
    causeCounts[cause] = (causeCounts[cause] || 0) + 1

    if (outageAny.started_at && outageAny.actual_restoration) {
      const start = new Date(outageAny.started_at as string)
      const end = new Date(outageAny.actual_restoration as string)
      const duration = (end.getTime() - start.getTime()) / 60000
      totalRestorationTime += duration
      restorationCount++
    }

    const hour = new Date(outageAny.started_at as string).getHours()
    hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1
  }

  const averageRestorationTime = restorationCount > 0
    ? Math.round(totalRestorationTime / restorationCount)
    : 0

  // Simplified SAIDI/SAIFI calculations
  const saidi = totalCustomersAffected > 0
    ? Math.round(totalRestorationTime * 1000 / totalCustomersAffected)
    : 0

  const saifi = totalCustomersAffected > 0
    ? Math.round(totalOutages * 1000 / totalCustomersAffected)
    : 0

  const outageCauses = Object.entries(causeCounts).map(([cause, count]) => ({
    cause,
    count,
  }))

  const hourlyOutageDistribution = Object.entries(hourlyDistribution).map(([hour, outages]) => ({
    hour: parseInt(hour),
    outages,
  }))

  return {
    totalOutages,
    totalCustomersAffected,
    averageRestorationTime,
    saidi,
    saifi,
    outageCauses,
    hourlyOutageDistribution,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets default power flow data
 */
function getDefaultPowerFlowData(): PowerFlowData {
  return {
    timestamp: new Date().toISOString(),
    generation: {
      coalMW: 0,
      naturalGasMW: 0,
      nuclearMW: 0,
      hydroMW: 0,
      solarMW: 0,
      windMW: 0,
      geothermalMW: 0,
      biomassMW: 0,
      otherMW: 0,
    },
    totalGenerationMW: 0,
    totalDemandMW: 0,
    importExportMW: 0,
    frequencyHz: 50,
    reserveMarginMW: 0,
    reservePercent: 0,
    renewablePercent: 0,
    carbonIntensity: 0,
  }
}

/**
 * Gets default capacity data
 */
function getDefaultCapacityData(): CapacityData {
  return {
    timestamp: new Date().toISOString(),
    peakDemandForecastMW: 0,
    availableCapacityMW: 0,
    installedCapacityMW: 0,
    capacityMarginMW: 0,
    capacityMarginPercent: 0,
    nextDayPeakForecastMW: 0,
    nextWeekPeakForecastMW: 0,
  }
}

/**
 * Maps database record to GridComponent
 */
function mapComponentFromDB(data: Record<string, unknown>): GridComponent {
  return {
    id: data.id as string,
    componentId: data.component_id as string,
    name: data.name as string,
    type: data.type as GridComponentType,
    status: data.status as GridComponentStatus,
    location: {
      latitude: data.latitude as number,
      longitude: data.longitude as number,
      address: data.address as string | undefined,
      region: data.region as string | undefined,
    },
    capacity: data.capacity_value as number ? {
      value: data.capacity_value as number,
      unit: (data.capacity_unit as string) || 'MW',
    } : undefined,
    currentLoad: data.load_value as number ? {
      value: data.load_value as number,
      unit: (data.load_unit as string) || 'MW',
      percentOfCapacity: (data.load_percent as number) || 0,
    } : undefined,
    outageStartedAt: data.outage_started_at as string | undefined,
    estimatedRestoration: data.estimated_restoration as string | undefined,
    customersAffected: data.customers_affected as number | undefined,
    maintenanceScheduled: data.maintenance_start as string ? {
      startAt: data.maintenance_start as string,
      endAt: (data.maintenance_end as string) || '',
      description: data.maintenance_description as string | undefined,
    } : undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to GridOutage
 */
function mapOutageFromDB(data: Record<string, unknown>): GridOutage {
  return {
    id: data.id as string,
    outageId: data.outage_id as string,
    type: data.type as GridOutage['type'],
    cause: (data.cause as string) || '',
    status: data.status as GridOutage['status'],
    affectedArea: data.affected_area as { latitude: number; longitude: number; radius: number; description?: string },
    customersAffected: (data.customers_affected as number) || 0,
    criticalCustomersAffected: data.critical_customers_affected as number | undefined,
    reportedAt: data.reported_at as string,
    startedAt: data.started_at as string,
    estimatedRestoration: data.estimated_restoration as string | undefined,
    actualRestoration: data.actual_restoration as string | undefined,
    crewAssigned: data.crew_id as string ? {
      crewId: data.crew_id as string,
      crewName: (data.crew_name as string) || '',
      estimatedArrival: data.crew_estimated_arrival as string | undefined,
    } : undefined,
    updates: data.updates as Array<{ timestamp: string; message: string; action?: string }> | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to GridAlert
 */
function mapAlertFromDB(data: Record<string, unknown>): GridAlert {
  return {
    id: data.id as string,
    alertId: data.alert_id as string,
    type: data.type as GridAlert['type'],
    severity: data.severity as GridAlert['severity'],
    title: data.title as string,
    message: data.message as string,
    issuedAt: data.issued_at as string,
    expiresAt: data.expires_at as string | undefined,
    updatedAt: data.updated_at as string | undefined,
    actionRequired: data.action_required as string | undefined,
    recommendations: data.recommendations as string[] | undefined,
    affectedRegions: data.affected_regions as Array<{ id: string; name: string }> | undefined,
    links: data.links as Array<{ title: string; url: string }> | undefined,
    createdAt: data.created_at as string,
  }
}
