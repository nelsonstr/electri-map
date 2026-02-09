import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Offline capability type
 */
export type OfflineCapability =
  | 'maps'
  | 'alerts'
  | 'contacts'
  | 'forms'
  | 'resources'
  | 'settings'

/**
 * Sync status
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error'

/**
 * Offline queue item status
 */
export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Network status
 */
export interface NetworkStatus {
  isOnline: boolean
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  downlink?: number // Mbps
  rtt?: number // ms
  lastChecked: string
}

/**
 * Offline capability config
 */
export interface OfflineCapabilityConfig {
  id: string
  capability: OfflineCapability
  
  // Status
  isEnabled: boolean
  isDownloaded: boolean
  
  // Data
  version: string
  size: number
  lastUpdated: string
  
  // Download progress
  downloadProgress: number
  downloadStarted?: string
  downloadCompleted?: string
  
  // Expiration
  expiresAt?: string
  autoUpdate: boolean
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Offline queue item
 */
export interface OfflineQueueItem {
  id: string
  userId?: string
  
  // Action
  action: 'create' | 'update' | 'delete'
  entity: string
  entityId?: string
  data: Record<string, unknown>
  
  // Status
  status: QueueItemStatus
  retryCount: number
  maxRetries: number
  errorMessage?: string
  
  // Priority (lower = higher priority)
  priority: number
  
  // Dependencies
  dependsOn?: string[]
  
  // Timestamps
  createdAt: string
  lastAttemptAt?: string
  completedAt?: string
}

/**
 * Sync session
 */
export interface SyncSession {
  id: string
  userId?: string
  
  // Status
  status: SyncStatus
  startedAt: string
  completedAt?: string
  
  // Stats
  itemsProcessed: number
  itemsSucceeded: number
  itemsFailed: number
  
  // Data
  bytesUploaded: number
  bytesDownloaded: number
  
  // Errors
  errors: Array<{
    queueItemId: string
    error: string
    timestamp: string
  }>
  
  // Context
  deviceInfo?: string
  networkType?: string
}

/**
 * Cached data
 */
export interface CachedData {
  id: string
  
  // Content
  key: string
  data: Record<string, unknown>
  version?: string
  
  // Metadata
  source?: string
  lastSynced?: string
  expiresAt?: string
  
  // Size
  size: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Offline resource
 */
export interface OfflineResource {
  id: string
  
  // Content
  type: 'alert' | 'map' | 'guide' | 'contact' | 'form'
  key: string
  title: string
  description?: string
  
  // Data
  content: Record<string, unknown>
  
  // Language
  language: string
  
  // Version
  version: string
  
  // Size
  size: number
  
  // Status
  isDownloaded: boolean
  downloadProgress: number
  
  // Timestamps
  createdAt: string
  downloadedAt?: string
  expiresAt?: string
}

/**
 * Create offline capability config
 */
export interface CreateCapabilityConfigInput {
  capability: OfflineCapability
  isEnabled: boolean
  autoUpdate: boolean
}

/**
 * Queue action input
 */
export interface QueueActionInput {
  action: 'create' | 'update' | 'delete'
  entity: string
  entityId?: string
  data: Record<string, unknown>
  priority?: number
  dependsOn?: string[]
}

/**
 * Update network status input
 */
export interface UpdateNetworkStatusInput {
  isOnline: boolean
  connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  downlink?: number
  rtt?: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for queue action
 */
export const queueActionSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  entity: z.string().min(1),
  entityId: z.string().optional(),
  data: z.record(z.unknown()),
  priority: z.number().int().min(0).max(100).default(50),
  dependsOn: z.array(z.string()).optional(),
})

/**
 * Schema for network status
 */
export const networkStatusSchema = z.object({
  isOnline: z.boolean(),
  connectionType: z.enum(['wifi', 'cellular', 'ethernet', 'unknown']).optional(),
  downlink: z.number().positive().optional(),
  rtt: z.number().positive().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for capability
 */
export function getCapabilityDisplayName(capability: OfflineCapability): string {
  const names: Record<OfflineCapability, string> = {
    maps: 'Maps',
    alerts: 'Alerts',
    contacts: 'Emergency Contacts',
    forms: 'Report Forms',
    resources: 'Resources',
    settings: 'Settings',
  }
  return names[capability]
}

/**
 * Gets display name for sync status
 */
export function getSyncStatusDisplayName(status: SyncStatus): string {
  const names: Record<SyncStatus, string> = {
    pending: 'Pending',
    syncing: 'Syncing',
    synced: 'Synced',
    error: 'Error',
  }
  return names[status]
}

/**
 * Gets display name for queue item status
 */
export function getQueueItemStatusDisplayName(status: QueueItemStatus): string {
  const names: Record<QueueItemStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  }
  return names[status]
}

/**
 * Calculates storage estimate
 */
function calculateStorageEstimate(
  capabilities: OfflineCapabilityConfig[],
  resources: OfflineResource[]
): {
  used: number
  available: number
  breakdown: Record<string, number>
} {
  let used = 0
  const breakdown: Record<string, number> = {}
  
  for (const capability of capabilities) {
    breakdown[capability.capability] = capability.size
    used += capability.size
  }
  
  for (const resource of resources) {
    if (resource.isDownloaded) {
      const key = `resource:${resource.type}`
      breakdown[key] = (breakdown[key] || 0) + resource.size
      used += resource.size
    }
  }
  
  return {
    used,
    available: 0, // Would need navigator.storage.estimate()
    breakdown,
  }
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Gets user's offline capabilities
 */
export async function getOfflineCapabilities(
  userId: string
): Promise<OfflineCapabilityConfig[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('offline_capabilities')
    .select('*')
    .eq('user_id', userId)
    .order('capability')

  if (error) {
    console.error('Error fetching capabilities:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id,
    capability: data.capability as OfflineCapability,
    isEnabled: data.is_enabled,
    isDownloaded: data.is_downloaded,
    version: data.version,
    size: data.size,
    lastUpdated: data.last_updated,
    downloadProgress: data.download_progress,
    downloadStarted: data.download_started || undefined,
    downloadCompleted: data.download_completed || undefined,
    expiresAt: data.expires_at || undefined,
    autoUpdate: data.auto_update,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }))
}

/**
 * Creates or updates offline capability config
 */
export async function setOfflineCapability(
  userId: string,
  input: CreateCapabilityConfigInput
): Promise<OfflineCapabilityConfig> {
  const supabase = createClient()

  // Check existing
  const { data: existing } = await supabase
    .from('offline_capabilities')
    .select('*')
    .eq('user_id', userId)
    .eq('capability', input.capability)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('offline_capabilities')
      .update({
        is_enabled: input.isEnabled,
        auto_update: input.autoUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating capability:', error)
      throw new Error(`Failed to update: ${error.message}`)
    }

    return {
      id: data.id,
      capability: data.capability as OfflineCapability,
      isEnabled: data.is_enabled,
      isDownloaded: data.is_downloaded,
      version: data.version,
      size: data.size,
      lastUpdated: data.last_updated,
      downloadProgress: data.download_progress,
      downloadStarted: data.download_started || undefined,
      downloadCompleted: data.download_completed || undefined,
      expiresAt: data.expires_at || undefined,
      autoUpdate: data.auto_update,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  const { data, error } = await supabase
    .from('offline_capabilities')
    .insert({
      user_id: userId,
      capability: input.capability,
      is_enabled: input.isEnabled,
      is_downloaded: false,
      version: '1.0.0',
      size: 0,
      last_updated: new Date().toISOString(),
      download_progress: 0,
      auto_update: input.autoUpdate,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating capability:', error)
    throw new Error(`Failed to create: ${error.message}`)
  }

  return {
    id: data.id,
    capability: data.capability as OfflineCapability,
    isEnabled: data.is_enabled,
    isDownloaded: data.is_downloaded,
    version: data.version,
    size: data.size,
    lastUpdated: data.last_updated,
    downloadProgress: data.download_progress,
    autoUpdate: data.auto_update,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Queues an action for sync
 */
export async function queueOfflineAction(
  userId: string | undefined,
  input: QueueActionInput
): Promise<OfflineQueueItem> {
  const validationResult = queueActionSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid action: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('offline_queue')
    .insert({
      id: queueId,
      user_id: userId || null,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId || null,
      data: input.data,
      status: 'pending',
      retry_count: 0,
      max_retries: 3,
      priority: input.priority || 50,
      depends_on: input.dependsOn || [],
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error queueing action:', error)
    throw new Error(`Failed to queue: ${error.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id || undefined,
    action: data.action as 'create' | 'update' | 'delete',
    entity: data.entity,
    entityId: data.entity_id || undefined,
    data: data.data,
    status: data.status as QueueItemStatus,
    retryCount: data.retry_count,
    maxRetries: data.max_retries,
    priority: data.priority,
    dependsOn: data.depends_on,
    createdAt: data.created_at,
  }
}

/**
 * Gets pending queue items
 */
export async function getPendingQueueItems(
  userId?: string,
  limit: number = 50
): Promise<OfflineQueueItem[]> {
  const supabase = createClient()

  let query = supabase
    .from('offline_queue')
    .select('*')
    .in('status', ['pending', 'failed'])
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching queue:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id,
    userId: data.user_id || undefined,
    action: data.action as 'create' | 'update' | 'delete',
    entity: data.entity,
    entityId: data.entity_id || undefined,
    data: data.data,
    status: data.status as QueueItemStatus,
    retryCount: data.retry_count,
    maxRetries: data.max_retries,
    errorMessage: data.error_message || undefined,
    priority: data.priority,
    dependsOn: data.depends_on,
    createdAt: data.created_at,
    lastAttemptAt: data.last_attempt_at || undefined,
  }))
}

/**
 * Processes sync queue
 */
export async function processSyncQueue(
  userId: string
): Promise<SyncSession> {
  const supabase = createClient()

  const sessionId = `sync_${Date.now()}`

  // Create sync session
  const { data: session, error: sessionError } = await supabase
    .from('sync_sessions')
    .insert({
      id: sessionId,
      user_id: userId,
      status: 'syncing',
      started_at: new Date().toISOString(),
      items_processed: 0,
      items_succeeded: 0,
      items_failed: 0,
      bytes_uploaded: 0,
      bytes_downloaded: 0,
      errors: [],
    })
    .select('*')
    .single()

  if (sessionError) {
    console.error('Error creating session:', sessionError)
    throw new Error('Failed to start sync')
  }

  // Get pending items
  const pendingItems = await getPendingQueueItems(userId, 100)

  let itemsSucceeded = 0
  let itemsFailed = 0
  const errors: SyncSession['errors'] = []

  for (const item of pendingItems) {
    try {
      // Update status to processing
      await supabase
        .from('offline_queue')
        .update({
          status: 'processing',
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      // Process the action
      await processQueueItem(item)

      // Mark as completed
      await supabase
        .from('offline_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      itemsSucceeded++
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      // Increment retry count
      await supabase
        .from('offline_queue')
        .update({
          status: item.retryCount + 1 >= item.maxRetries ? 'failed' : 'pending',
          retry_count: item.retryCount + 1,
          error_message: errorMessage,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      errors.push({
        queueItemId: item.id,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      })

      itemsFailed++
    }
  }

  // Complete session
  const { error: completeError } = await supabase
    .from('sync_sessions')
    .update({
      status: itemsFailed === 0 ? 'synced' : 'error',
      completed_at: new Date().toISOString(),
      items_processed: itemsSucceeded + itemsFailed,
      items_succeeded: itemsSucceeded,
      items_failed: itemsFailed,
      errors,
    })
    .eq('id', sessionId)

  if (completeError) {
    console.error('Error completing session:', completeError)
  }

  return {
    id: session.id,
    userId: session.user_id,
    status: itemsFailed === 0 ? 'synced' : 'error',
    startedAt: session.started_at,
    completedAt: new Date().toISOString(),
    itemsProcessed: itemsSucceeded + itemsFailed,
    itemsSucceeded,
    itemsFailed,
    bytesUploaded: 0,
    bytesDownloaded: 0,
    errors,
  }
}

/**
 * Processes a single queue item
 */
async function processQueueItem(item: OfflineQueueItem): Promise<void> {
  const supabase = createClient()

  switch (item.entity) {
    case 'alert':
      await processAlertAction(item)
      break
    case 'incident':
      await processIncidentAction(item)
      break
    case 'report':
      await processReportAction(item)
      break
    default:
      throw new Error(`Unknown entity type: ${item.entity}`)
  }
}

/**
 * Processes alert actions
 */
async function processAlertAction(item: OfflineQueueItem): Promise<void> {
  const supabase = createClient()

  switch (item.action) {
    case 'create':
      await supabase.from('alerts').insert(item.data)
      break
    case 'update':
      if (item.entityId) {
        await supabase.from('alerts').update(item.data).eq('id', item.entityId)
      }
      break
    case 'delete':
      if (item.entityId) {
        await supabase.from('alerts').delete().eq('id', item.entityId)
      }
      break
  }
}

/**
 * Processes incident actions
 */
async function processIncidentAction(item: OfflineQueueItem): Promise<void> {
  const supabase = createClient()

  switch (item.action) {
    case 'create':
      await supabase.from('incidents').insert(item.data)
      break
    case 'update':
      if (item.entityId) {
        await supabase.from('incidents').update(item.data).eq('id', item.entityId)
      }
      break
    case 'delete':
      if (item.entityId) {
        await supabase.from('incidents').delete().eq('id', item.entityId)
      }
      break
  }
}

/**
 * Processes report actions
 */
async function processReportAction(item: OfflineQueueItem): Promise<void> {
  const supabase = createClient()

  switch (item.action) {
    case 'create':
      await supabase.from('reports').insert(item.data)
      break
    case 'update':
      if (item.entityId) {
        await supabase.from('reports').update(item.data).eq('id', item.entityId)
      }
      break
    case 'delete':
      if (item.entityId) {
        await supabase.from('reports').delete().eq('id', item.entityId)
      }
      break
  }
}

/**
 * Gets sync sessions
 */
export async function getSyncSessions(
  userId: string,
  limit: number = 10
): Promise<SyncSession[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sync_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching sessions:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id,
    userId: data.user_id,
    status: data.status as SyncStatus,
    startedAt: data.started_at,
    completedAt: data.completed_at || undefined,
    itemsProcessed: data.items_processed,
    itemsSucceeded: data.items_succeeded,
    itemsFailed: data.items_failed,
    bytesUploaded: data.bytes_uploaded,
    bytesDownloaded: data.bytes_downloaded,
    errors: data.errors || [],
    deviceInfo: data.device_info || undefined,
    networkType: data.network_type || undefined,
  }))
}

/**
 * Gets last sync status
 */
export async function getLastSyncStatus(
  userId: string
): Promise<{
  lastSync: string | null
  pendingItems: number
  status: SyncStatus
} | null> {
  const supabase = createClient()

  // Get last completed session
  const { data: session } = await supabase
    .from('sync_sessions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['synced', 'error'])
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  // Get pending items count
  const { count: pendingCount } = await supabase
    .from('offline_queue')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['pending', 'failed'])

  return {
    lastSync: session?.started_at || null,
    pendingItems: pendingCount || 0,
    status: (session?.status as SyncStatus) || 'pending',
  }
}

/**
 * Caches data locally
 */
export async function cacheData(
  key: string,
  data: Record<string, unknown>,
  options?: {
    version?: string
    source?: string
    expiresAt?: string
  }
): Promise<CachedData> {
  const supabase = createClient()

  const cacheId = `cache_${key.replace(/[^a-zA-Z0-9]/g, '_')}`

  const { data: cached, error } = await supabase
    .from('local_cache')
    .upsert({
      id: cacheId,
      key,
      data,
      version: options?.version || null,
      source: options?.source || null,
      expires_at: options?.expiresAt || null,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error caching data:', error)
    throw new Error(`Failed to cache: ${error.message}`)
  }

  return {
    id: cached.id,
    key: cached.key,
    data: cached.data,
    version: cached.version || undefined,
    lastSynced: cached.updated_at,
    expiresAt: cached.expires_at || undefined,
    size: JSON.stringify(cached.data).length,
    createdAt: cached.created_at,
    updatedAt: cached.updated_at,
  }
}

/**
 * Gets cached data
 */
export async function getCachedData(
  key: string
): Promise<CachedData | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('local_cache')
    .select('*')
    .eq('key', key)
    .single()

  if (error) {
    return null
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null
  }

  return {
    id: data.id,
    key: data.key,
    data: data.data,
    version: data.version || undefined,
    lastSynced: data.updated_at,
    expiresAt: data.expires_at || undefined,
    size: JSON.stringify(data.data).length,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Invalidates cache
 */
export async function invalidateCache(key: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('local_cache')
    .delete()
    .eq('key', key)
}

/**
 * Downloads offline resource
 */
export async function downloadOfflineResource(
  userId: string,
  resourceKey: string
): Promise<OfflineResource> {
  const supabase = createClient()

  // Get resource definition
  const { data: resourceDef, error: defError } = await supabase
    .from('offline_resources')
    .select('*')
    .eq('key', resourceKey)
    .single()

  if (defError || !resourceDef) {
    throw new Error('Resource not found')
  }

  // Create download record
  const downloadId = `download_${Date.now()}`

  const { data, error } = await supabase
    .from('offline_downloads')
    .insert({
      id: downloadId,
      user_id: userId,
      resource_key: resourceKey,
      status: 'downloading',
      downloaded_at: null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating download:', error)
    throw new Error(`Failed to start download: ${error.message}`)
  }

  // In a real implementation, this would trigger actual download
  // For now, mark as completed
  await supabase
    .from('offline_downloads')
    .update({
      status: 'completed',
      downloaded_at: new Date().toISOString(),
    })
    .eq('id', downloadId)

  return {
    id: data.id,
    type: resourceDef.type as OfflineResource['type'],
    key: resourceDef.key,
    title: resourceDef.title,
    description: resourceDef.description || undefined,
    content: resourceDef.content,
    language: resourceDef.language,
    version: resourceDef.version,
    size: resourceDef.size,
    isDownloaded: true,
    downloadProgress: 100,
    downloadedAt: new Date().toISOString(),
    createdAt: resourceDef.created_at,
  }
}

/**
 * Gets user offline resources
 */
export async function getOfflineResources(
  userId: string
): Promise<OfflineResource[]> {
  const supabase = createClient()

  const { data: downloads, error } = await supabase
    .from('offline_downloads')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')

  if (error) {
    console.error('Error fetching downloads:', error)
    return []
  }

  const resources: OfflineResource[] = []

  for (const download of downloads || []) {
    const { data: resourceDef } = await supabase
      .from('offline_resources')
      .select('*')
      .eq('key', download.resource_key)
      .single()

    if (resourceDef) {
      resources.push({
        id: download.id,
        type: resourceDef.type as OfflineResource['type'],
        key: resourceDef.key,
        title: resourceDef.title,
        description: resourceDef.description || undefined,
        content: resourceDef.content,
        language: resourceDef.language,
        version: resourceDef.version,
        size: resourceDef.size,
        isDownloaded: download.status === 'completed',
        downloadProgress: download.status === 'completed' ? 100 : 0,
        downloadedAt: download.downloaded_at || undefined,
        expiresAt: resourceDef.expires_at || undefined,
        createdAt: resourceDef.created_at,
      })
    }
  }

  return resources
}

/**
 * Gets offline storage estimate
 */
export async function getOfflineStorageEstimate(
  userId: string
): Promise<{
  used: number
  available: number
  breakdown: Record<string, number>
}> {
  const capabilities = await getOfflineCapabilities(userId)
  const resources = await getOfflineResources(userId)

  return calculateStorageEstimate(capabilities, resources)
}

/**
 * Clears all offline data
 */
export async function clearOfflineData(userId: string): Promise<void> {
  const supabase = createClient()

  // Clear queue
  await supabase
    .from('offline_queue')
    .delete()
    .eq('user_id', userId)

  // Clear cache
  await supabase
    .from('local_cache')
    .delete()
    .eq('user_id', userId)

  // Clear downloads
  await supabase
    .from('offline_downloads')
    .delete()
    .eq('user_id', userId)
}

/**
 * Updates network status
 */
export async function updateNetworkStatus(
  userId: string,
  input: UpdateNetworkStatusInput
): Promise<NetworkStatus> {
  const validationResult = networkStatusSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid status: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('network_status')
    .upsert({
      user_id: userId,
      is_online: input.isOnline,
      connection_type: input.connectionType || 'unknown',
      downlink: input.downlink,
      rtt: input.rtt,
      last_checked: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating network status:', error)
  }

  return {
    isOnline: data?.is_online ?? input.isOnline,
    connectionType: (data?.connection_type as NetworkStatus['connectionType']) || input.connectionType || 'unknown',
    downlink: data?.downlink,
    rtt: data?.rtt,
    lastChecked: data?.last_checked || new Date().toISOString(),
  }
}

/**
 * Gets current network status
 */
export async function getNetworkStatus(
  userId: string
): Promise<NetworkStatus | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('network_status')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    return null
  }

  return {
    isOnline: data.is_online,
    connectionType: data.connection_type as NetworkStatus['connectionType'],
    downlink: data.downlink,
    rtt: data.rtt,
    lastChecked: data.last_checked,
  }
}
