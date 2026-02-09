import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Service type for restoration tracking
 */
export type RestorationServiceType =
  | 'power'
  | 'water'
  | 'gas'
  | 'telecom'
  | 'internet'
  | 'sewage'
  | 'road'
  | 'bridge'
  | 'public_transport'
  | 'healthcare'
  | 'emergency_services'
  | 'other'

/**
 * Restoration status
 */
export type RestorationStatus =
  | 'outage'
  | 'partial_restoration'
  | 'restoring'
  | 'fully_restored'
  | 'scheduled'
  | 'investigating'
  | 'assessing_damage'

/**
 * Restoration priority
 */
export type RestorationPriority = 'critical' | 'high' | 'normal' | 'low'

/**
 * Estimated restoration accuracy
 */
export type EstimationAccuracy =
  | 'preliminary'
  | 'updated'
  | 'confirmed'
  | 'final'

/**
 * Restoration update source
 */
export type UpdateSource =
  | 'utility_company'
  | 'government'
  | 'automated'
  | 'field_report'
  | 'crowdsourced'
  | 'official'

/**
 * Restoration entry
 */
export interface RestorationEntry {
  id: string
  externalId?: string
  
  // Service information
  serviceType: RestorationServiceType
  serviceProvider?: string
  
  // Location
  municipality?: string
  parish?: string
  latitude?: number
  longitude?: number
  affectedArea?: string
  affectedAddress?: string
  
  // Status
  status: RestorationStatus
  priority: RestorationPriority
  
  // Details
  outageType?: string
  cause?: string
  affectedCustomers?: number
  
  // Timeline
  outageReportedAt?: string
  estimatedRestoration?: string
  actualRestoration?: string
  lastUpdated?: string
  
  // Estimation metadata
  estimationAccuracy?: EstimationAccuracy
  estimationSource?: string
  
  // Progress
  progressPercentage?: number
  crewsAssigned?: number
  
  // Source information
  source?: UpdateSource
  sourceId?: string
  sourceName?: string
  
  // Updates
  updateCount: number
  latestUpdate?: string
  
  // Related entries
  relatedEntryIds?: string[]
  parentEntryId?: string
  
  // Metadata
  metadata?: Record<string, unknown>
  
  createdAt: string
  updatedAt: string
}

/**
 * Restoration update
 */
export interface RestorationUpdate {
  id: string
  restorationId: string
  
  // Content
  title?: string
  description: string
  
  // Status change
  previousStatus?: RestorationStatus
  newStatus: RestorationStatus
  
  // Progress
  progressPercentage?: number
  
  // Timeline
  estimatedRestoration?: string
  
  // Source
  source?: UpdateSource
  sourceName?: string
  
  // Additional info
  affectedCustomers?: number
  crewsDeployed?: number
  
  // Metadata
  metadata?: Record<string, unknown>
  
  createdAt: string
}

/**
 * Create restoration entry input
 */
export interface CreateRestorationInput {
  serviceType: RestorationServiceType
  serviceProvider?: string
  municipality?: string
  parish?: string
  latitude?: number
  longitude?: number
  affectedArea?: string
  affectedAddress?: string
  status?: RestorationStatus
  priority?: RestorationPriority
  outageType?: string
  cause?: string
  affectedCustomers?: number
  estimatedRestoration?: string
  source?: UpdateSource
  sourceName?: string
}

/**
 * Create update input
 */
export interface CreateUpdateInput {
  restorationId: string
  title?: string
  description: string
  newStatus?: RestorationStatus
  progressPercentage?: number
  estimatedRestoration?: string
  source?: UpdateSource
  sourceName?: string
  affectedCustomers?: number
  crewsDeployed?: number
}

/**
 * Restoration filter options
 */
export interface RestorationFilterOptions {
  serviceTypes?: RestorationServiceType[]
  status?: RestorationStatus[]
  municipality?: string
  parish?: string
  priority?: RestorationPriority[]
  dateFrom?: string
  dateTo?: string
  affectedCustomersMin?: number
  affectedCustomersMax?: number
  hasEstimatedRestoration?: boolean
  limit?: number
  offset?: number
}

/**
 * Restoration statistics
 */
export interface RestorationStats {
  totalEntries: number
  byStatus: Record<RestorationStatus, number>
  byServiceType: Record<RestorationServiceType, number>
  averageProgress: number
  totalAffectedCustomers: number
  criticalEntries: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating a restoration entry
 */
export const createRestorationSchema = z.object({
  serviceType: z.enum([
    'power', 'water', 'gas', 'telecom', 'internet', 'sewage',
    'road', 'bridge', 'public_transport', 'healthcare',
    'emergency_services', 'other'
  ]),
  serviceProvider: z.string().optional(),
  municipality: z.string().optional(),
  parish: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  affectedArea: z.string().optional(),
  affectedAddress: z.string().optional(),
  status: z.enum([
    'outage', 'partial_restoration', 'restoring', 'fully_restored',
    'scheduled', 'investigating', 'assessing_damage'
  ]).optional(),
  priority: z.enum(['critical', 'high', 'normal', 'low']).optional(),
  outageType: z.string().optional(),
  cause: z.string().optional(),
  affectedCustomers: z.number().positive().optional(),
  estimatedRestoration: z.string().datetime().optional(),
  source: z.enum(['utility_company', 'government', 'automated', 'field_report', 'crowdsourced', 'official']).optional(),
  sourceName: z.string().optional(),
})

/**
 * Schema for restoration filter
 */
export const restorationFilterSchema = z.object({
  serviceTypes: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  municipality: z.string().optional(),
  parish: z.string().optional(),
  priority: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  affectedCustomersMin: z.number().positive().optional(),
  affectedCustomersMax: z.number().positive().optional(),
  hasEstimatedRestoration: z.boolean().optional(),
  limit: z.number().positive().max(100).optional(),
  offset: z.number().nonnegative().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for service type
 */
export function getServiceTypeDisplayName(type: RestorationServiceType): string {
  const names: Record<RestorationServiceType, string> = {
    power: 'Power',
    water: 'Water',
    gas: 'Gas',
    telecom: 'Telecom',
    internet: 'Internet',
    sewage: 'Sewage',
    road: 'Road',
    bridge: 'Bridge',
    public_transport: 'Public Transport',
    healthcare: 'Healthcare',
    emergency_services: 'Emergency Services',
    other: 'Other',
  }
  return names[type]
}

/**
 * Gets icon for service type
 */
export function getServiceTypeIcon(type: RestorationServiceType): string {
  const icons: Record<RestorationServiceType, string> = {
    power: '⚡',
    water: '💧',
    gas: '🔥',
    telecom: '📞',
    internet: '🌐',
    sewage: '🚽',
    road: '🛣️',
    bridge: '🌉',
    public_transport: '🚌',
    healthcare: '🏥',
    emergency_services: '🚑',
    other: '🔧',
  }
  return icons[type]
}

/**
 * Gets display name for status
 */
export function getRestorationStatusDisplayName(status: RestorationStatus): string {
  const names: Record<RestorationStatus, string> = {
    outage: 'Outage',
    partial_restoration: 'Partial Restoration',
    restoring: 'Restoring',
    fully_restored: 'Fully Restored',
    scheduled: 'Scheduled Work',
    investigating: 'Investigating',
    assessing_damage: 'Assessing Damage',
  }
  return names[status]
}

/**
 * Gets color for status
 */
export function getRestorationStatusColor(status: RestorationStatus): string {
  const colors: Record<RestorationStatus, string> = {
    outage: 'bg-red-600',
    partial_restoration: 'bg-orange-500',
    restoring: 'bg-yellow-500',
    fully_restored: 'bg-green-500',
    scheduled: 'bg-blue-500',
    investigating: 'bg-purple-500',
    assessing_damage: 'bg-gray-500',
  }
  return colors[status]
}

/**
 * Gets display name for priority
 */
export function getPriorityDisplayName(priority: RestorationPriority): string {
  const names: Record<RestorationPriority, string> = {
    critical: 'Critical',
    high: 'High',
    normal: 'Normal',
    low: 'Low',
  }
  return names[priority]
}

/**
 * Gets color for priority
 */
export function getPriorityColor(priority: RestorationPriority): string {
  const colors: Record<RestorationPriority, string> = {
    critical: 'bg-red-600',
    high: 'bg-orange-500',
    normal: 'bg-blue-500',
    low: 'bg-gray-400',
  }
  return colors[priority]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a new restoration entry
 */
export async function createRestorationEntry(
  input: CreateRestorationInput
): Promise<RestorationEntry> {
  const validationResult = createRestorationSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid restoration entry: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('restoration_entries')
    .insert({
      service_type: input.serviceType,
      service_provider: input.serviceProvider || null,
      municipality: input.municipality || null,
      parish: input.parish || null,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      affected_area: input.affectedArea || null,
      affected_address: input.affectedAddress || null,
      status: input.status || 'outage',
      priority: input.priority || 'normal',
      outage_type: input.outageType || null,
      cause: input.cause || null,
      affected_customers: input.affectedCustomers || null,
      estimated_restoration: input.estimatedRestoration || null,
      source: input.source || null,
      source_name: input.sourceName || null,
      update_count: 0,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating restoration entry:', error)
    throw new Error(`Failed to create restoration entry: ${error.message}`)
  }

  return mapRestorationFromDB(data)
}

/**
 * Gets a restoration entry by ID
 */
export async function getRestorationEntry(
  entryId: string
): Promise<RestorationEntry | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('restoration_entries')
    .select('*')
    .eq('id', entryId)
    .single()

  if (error) {
    console.error('Error fetching restoration entry:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapRestorationFromDB(data)
}

/**
 * Gets restoration entries with filters
 */
export async function getRestorationEntries(
  filters?: RestorationFilterOptions
): Promise<RestorationEntry[]> {
  const supabase = createClient()

  let query = supabase
    .from('restoration_entries')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.serviceTypes && filters.serviceTypes.length > 0) {
    query = query.in('service_type', filters.serviceTypes)
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters?.municipality) {
    query = query.eq('municipality', filters.municipality)
  }

  if (filters?.parish) {
    query = query.eq('parish', filters.parish)
  }

  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority)
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  if (filters?.affectedCustomersMin !== undefined) {
    query = query.gte('affected_customers', filters.affectedCustomersMin)
  }

  if (filters?.affectedCustomersMax !== undefined) {
    query = query.lte('affected_customers', filters.affectedCustomersMax)
  }

  if (filters?.hasEstimatedRestoration) {
    query = query.not('estimated_restoration', 'is', null)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching restoration entries:', error)
    return []
  }

  return (data || []).map(mapRestorationFromDB)
}

/**
 * Updates restoration entry status
 */
export async function updateRestorationStatus(
  entryId: string,
  status: RestorationStatus,
  updateDescription: string,
  source?: UpdateSource,
  sourceName?: string
): Promise<RestorationEntry> {
  const supabase = createClient()

  // Get current status
  const { data: current } = await supabase
    .from('restoration_entries')
    .select('status')
    .eq('id', entryId)
    .single()

  // Create update record
  await supabase
    .from('restoration_updates')
    .insert({
      restoration_id: entryId,
      description: updateDescription,
      previous_status: current?.status,
      new_status: status,
      source: source || null,
      source_name: sourceName || null,
    })

  // Update entry
  const updateData: Record<string, unknown> = {
    status,
    last_updated: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (status === 'fully_restored') {
    updateData.actual_restoration = new Date().toISOString()
    updateData.progress_percentage = 100
  }

  const { data, error } = await supabase
    .from('restoration_entries')
    .update(updateData)
    .eq('id', entryId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating restoration status:', error)
    throw new Error(`Failed to update restoration status: ${error.message}`)
  }

  return mapRestorationFromDB(data)
}

/**
 * Adds an update to a restoration entry
 */
export async function addRestorationUpdate(
  input: CreateUpdateInput
): Promise<RestorationUpdate> {
  const supabase = createClient()

  // Get current entry
  const { data: current } = await supabase
    .from('restoration_entries')
    .select('*')
    .eq('id', input.restorationId)
    .single()

  if (!current) {
    throw new Error('Restoration entry not found')
  }

  // Create update record
  const { data: update, error } = await supabase
    .from('restoration_updates')
    .insert({
      restoration_id: input.restorationId,
      title: input.title || null,
      description: input.description,
      previous_status: current.status,
      new_status: input.newStatus || current.status,
      progress_percentage: input.progressPercentage || null,
      estimated_restoration: input.estimatedRestoration || null,
      source: input.source || null,
      source_name: input.sourceName || null,
      affected_customers: input.affectedCustomers || null,
      crews_deployed: input.crewsDeployed || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating update:', error)
    throw new Error(`Failed to create update: ${error.message}`)
  }

  // Update entry
  const updateData: Record<string, unknown> = {
    last_updated: new Date().toISOString(),
    last_update_description: input.description,
    update_count: (current.update_count || 0) + 1,
    updated_at: new Date().toISOString(),
  }

  if (input.newStatus) {
    updateData.status = input.newStatus
  }

  if (input.progressPercentage !== undefined) {
    updateData.progress_percentage = input.progressPercentage
  }

  if (input.estimatedRestoration) {
    updateData.estimated_restoration = input.estimatedRestoration
  }

  if (input.crewsDeployed) {
    updateData.crews_assigned = input.crewsDeployed
  }

  await supabase
    .from('restoration_entries')
    .update(updateData)
    .eq('id', input.restorationId)

  return {
    id: update.id,
    restorationId: update.restoration_id,
    title: update.title || undefined,
    description: update.description,
    previousStatus: update.previous_status,
    newStatus: update.new_status,
    progressPercentage: update.progress_percentage || undefined,
    estimatedRestoration: update.estimated_restoration || undefined,
    source: update.source || undefined,
    sourceName: update.source_name || undefined,
    affectedCustomers: update.affected_customers || undefined,
    crewsDeployed: update.crews_deployed || undefined,
    metadata: update.metadata,
    createdAt: update.created_at,
  }
}

/**
 * Gets updates for a restoration entry
 */
export async function getRestorationUpdates(
  restorationId: string,
  limit: number = 50
): Promise<RestorationUpdate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('restoration_updates')
    .select('*')
    .eq('restoration_id', restorationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching updates:', error)
    return []
  }

  return (data || []).map(update => ({
    id: update.id,
    restorationId: update.restoration_id,
    title: update.title || undefined,
    description: update.description,
    previousStatus: update.previous_status || undefined,
    newStatus: update.new_status,
    progressPercentage: update.progress_percentage || undefined,
    estimatedRestoration: update.estimated_restoration || undefined,
    source: update.source || undefined,
    sourceName: update.source_name || undefined,
    affectedCustomers: update.affected_customers || undefined,
    crewsDeployed: update.crews_deployed || undefined,
    metadata: update.metadata,
    createdAt: update.created_at,
  }))
}

/**
 * Gets restoration entries near a location
 */
export async function getNearbyRestorations(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  filters?: RestorationFilterOptions
): Promise<RestorationEntry[]> {
  const entries = await getRestorationEntries({
    ...filters,
    limit: 50,
  })

  return entries
    .filter(entry => entry.latitude && entry.longitude)
    .filter(entry => {
      const distance = calculateDistance(
        { latitude, longitude },
        { latitude: entry.latitude!, longitude: entry.longitude! }
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
 * Gets restoration entries by municipality
 */
export async function getMunicipalityRestorations(
  municipality: string,
  includeRestored: boolean = false
): Promise<RestorationEntry[]> {
  const statuses = includeRestored
    ? undefined
    : ['outage', 'partial_restoration', 'restoring', 'investigating', 'assessing_damage']

  return getRestorationEntries({
    municipality,
    status: statuses,
  })
}

/**
 * Gets restoration statistics
 */
export async function getRestorationStats(
  municipality?: string
): Promise<RestorationStats> {
  const supabase = createClient()

  let query = supabase
    .from('restoration_entries')
    .select('status, service_type, priority, affected_customers, progress_percentage')

  if (municipality) {
    query = query.eq('municipality', municipality)
  }

  const { data } = await query

  const stats: RestorationStats = {
    totalEntries: 0,
    byStatus: {
      outage: 0,
      partial_restoration: 0,
      restoring: 0,
      fully_restored: 0,
      scheduled: 0,
      investigating: 0,
      assessing_damage: 0,
    },
    byServiceType: {
      power: 0,
      water: 0,
      gas: 0,
      telecom: 0,
      internet: 0,
      sewage: 0,
      road: 0,
      bridge: 0,
      public_transport: 0,
      healthcare: 0,
      emergency_services: 0,
      other: 0,
    },
    averageProgress: 0,
    totalAffectedCustomers: 0,
    criticalEntries: 0,
  }

  let totalProgress = 0
  let progressCount = 0

  for (const entry of data || []) {
    stats.totalEntries++
    stats.byStatus[entry.status as RestorationStatus]++
    stats.byServiceType[entry.service_type as RestorationServiceType]++
    stats.totalAffectedCustomers += entry.affected_customers || 0

    if (entry.priority === 'critical') {
      stats.criticalEntries++
    }

    if (entry.progress_percentage !== null) {
      totalProgress += entry.progress_percentage
      progressCount++
    }
  }

  stats.averageProgress = progressCount > 0 ? totalProgress / progressCount : 0

  return stats
}

/**
 * Searches restoration entries
 */
export async function searchRestorations(
  query: string,
  options?: {
    serviceType?: RestorationServiceType
    municipality?: string
    limit?: number
  }
): Promise<RestorationEntry[]> {
  const supabase = createClient()

  let dbQuery = supabase
    .from('restoration_entries')
    .select('*')
    .or(`affected_area.ilike.%${query}%,affected_address.ilike.%${query}%,municipality.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (options?.serviceType) {
    dbQuery = dbQuery.eq('service_type', options.serviceType)
  }

  if (options?.municipality) {
    dbQuery = dbQuery.eq('municipality', options.municipality)
  }

  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error searching restorations:', error)
    return []
  }

  return (data || []).map(mapRestorationFromDB)
}

/**
 * Gets estimated time of restoration for an area
 */
export async function getEstimatedRestorations(
  municipality?: string
): Promise<{
  entries: RestorationEntry[]
  averageEstimate: string | null
  earliestEstimate: string | null
  latestEstimate: string | null
}> {
  const entries = await getRestorationEntries({
    municipality,
    status: ['outage', 'partial_restoration', 'restoring', 'scheduled'],
    hasEstimatedRestoration: true,
  })

  if (entries.length === 0) {
    return {
      entries: [],
      averageEstimate: null,
      earliestEstimate: null,
      latestEstimate: null,
    }
  }

  const estimates = entries
    .filter(e => e.estimatedRestoration)
    .map(e => new Date(e.estimatedRestoration!))

  const now = new Date()
  const estimatesInFuture = estimates.filter(d => d > now)

  if (estimatesInFuture.length === 0) {
    return {
      entries,
      averageEstimate: null,
      earliestEstimate: null,
      latestEstimate: null,
    }
  }

  const earliest = new Date(Math.min(...estimatesInFuture.map(d => d.getTime())))
  const latest = new Date(Math.max(...estimatesInFuture.map(d => d.getTime())))

  // Calculate average
  const avgTime = estimatesInFuture.reduce((sum, d) => sum + d.getTime(), 0) / estimatesInFuture.length
  const average = new Date(avgTime)

  return {
    entries,
    averageEstimate: average.toISOString(),
    earliestEstimate: earliest.toISOString(),
    latestEstimate: latest.toISOString(),
  }
}

/**
 * Gets service summary by type
 */
export async function getServiceSummary(): Promise<{
  type: RestorationServiceType
  displayName: string
  icon: string
  totalEntries: number
  outages: number
  restored: number
  affectedCustomers: number
  averageProgress: number
}[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('restoration_entries')
    .select('service_type, status, affected_customers, progress_percentage')

  const serviceTypes: RestorationServiceType[] = [
    'power', 'water', 'gas', 'telecom', 'internet', 'sewage',
    'road', 'bridge', 'public_transport', 'healthcare', 'emergency_services', 'other'
  ]

  const summaries = []

  for (const type of serviceTypes) {
    const entries = (data || []).filter(e => e.service_type === type)

    if (entries.length === 0) {
      continue
    }

    const outages = entries.filter(e =>
      ['outage', 'partial_restoration', 'restoring'].includes(e.status)
    ).length

    const restored = entries.filter(e =>
      ['fully_restored'].includes(e.status)
    ).length

    let totalProgress = 0
    let progressCount = 0

    for (const entry of entries) {
      if (entry.progress_percentage !== null) {
        totalProgress += entry.progress_percentage
        progressCount++
      }
    }

    summaries.push({
      type,
      displayName: getServiceTypeDisplayName(type),
      icon: getServiceTypeIcon(type),
      totalEntries: entries.length,
      outages,
      restored,
      affectedCustomers: entries.reduce((sum, e) => sum + (e.affected_customers || 0), 0),
      averageProgress: progressCount > 0 ? totalProgress / progressCount : 0,
    })
  }

  return summaries
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to RestorationEntry
 */
function mapRestorationFromDB(data: Record<string, unknown>): RestorationEntry {
  return {
    id: data.id,
    externalId: data.external_id as string | undefined,
    serviceType: data.service_type as RestorationServiceType,
    serviceProvider: data.service_provider as string | undefined,
    municipality: data.municipality as string | undefined,
    parish: data.parish as string | undefined,
    latitude: data.latitude as number | undefined,
    longitude: data.longitude as number | undefined,
    affectedArea: data.affected_area as string | undefined,
    affectedAddress: data.affected_address as string | undefined,
    status: data.status as RestorationStatus,
    priority: data.priority as RestorationPriority,
    outageType: data.outage_type as string | undefined,
    cause: data.cause as string | undefined,
    affectedCustomers: data.affected_customers as number | undefined,
    outageReportedAt: data.outage_reported_at as string | undefined,
    estimatedRestoration: data.estimated_restoration as string | undefined,
    actualRestoration: data.actual_restoration as string | undefined,
    lastUpdated: data.last_updated as string | undefined,
    estimationAccuracy: data.estimation_accuracy as EstimationAccuracy | undefined,
    estimationSource: data.estimation_source as string | undefined,
    progressPercentage: data.progress_percentage as number | undefined,
    crewsAssigned: data.crews_assigned as number | undefined,
    source: data.source as UpdateSource | undefined,
    sourceId: data.source_id as string | undefined,
    sourceName: data.source_name as string | undefined,
    updateCount: data.update_count || 0,
    latestUpdate: data.latest_update as string | undefined,
    relatedEntryIds: data.related_entry_ids as string[] | undefined,
    parentEntryId: data.parent_entry_id as string | undefined,
    metadata: data.metadata as Record<string, unknown> | undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
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
