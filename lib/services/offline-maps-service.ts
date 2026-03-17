import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Map tile type
 */
export type MapTileType = 
  | 'street' 
  | 'satellite' 
  | 'terrain' 
  | 'hybrid'
  | 'dark'

/**
 * Map region status
 */
export type MapRegionStatus = 
  | 'not_downloaded' 
  | 'downloading' 
  | 'downloaded' 
  | 'update_available' 
  | 'error'

/**
 * Offline map tile
 */
export interface OfflineMapTile {
  id: string
  regionId: string
  
  // Tile info
  x: number
  y: number
  z: number
  tileType: MapTileType
  
  // Data
  data: Uint8Array
  size: number
  
  // Status
  isValid: boolean
  downloadedAt?: string
  expiresAt?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Offline map region
 */
export interface OfflineMapRegion {
  id: string
  userId?: string
  
  // Region info
  name: string
  description?: string
  
  // Bounds
  minLatitude: number
  maxLatitude: number
  minLongitude: number
  maxLongitude: number
  centerLatitude: number
  centerLongitude: number
  
  // Tile types
  tileTypes: MapTileType[]
  
  // Zoom levels
  minZoom: number
  maxZoom: number
  
  // Status
  status: MapRegionStatus
  downloadProgress: number
  totalTiles: number
  downloadedTiles: number
  failedTiles: number
  
  // Size
  sizeBytes: number
  
  // Timestamps
  downloadStarted?: string
  downloadCompleted?: string
  lastAccessed?: string
  lastUpdated?: string
  expiresAt?: string
  
  // Metadata
  version: string
  source?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Map cache entry
 */
export interface MapCacheEntry {
  id: string
  
  // Content
  key: string
  type: 'tile' | 'marker' | 'overlay' | 'style'
  data: Uint8Array | Record<string, unknown>
  size: number
  
  // Metadata
  tileType?: MapTileType
  zoom?: number
  bounds?: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }
  
  // Versioning
  version?: string
  etag?: string
  
  // Expiration
  expiresAt?: string
  lastValidated?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Map overlay
 */
export interface MapOverlay {
  id: string
  regionId?: string
  
  // Overlay info
  name: string
  type: 'alert_zone' | 'safe_zone' | 'outage_area' | 'weather_zone' | 'custom'
  
  // Geometry
  geometry: GeoJSON.FeatureCollection
  
  // Style
  style?: {
    fillColor?: string
    fillOpacity?: number
    strokeColor?: string
    strokeWidth?: number
  }
  
  // Status
  isVisible: boolean
  zIndex: number
  
  // Offline support
  isCached: boolean
  
  // Timestamps
  expiresAt?: string
  lastUpdated?: string
}

/**
 * Download progress callback
 */
export interface DownloadProgress {
  regionId: string
  progress: number
  downloadedTiles: number
  totalTiles: number
  sizeBytes: number
  status: MapRegionStatus
  eta?: number // seconds
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for offline map region input
 */
export const offlineMapRegionInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  minLatitude: z.number().min(-90).max(90),
  maxLatitude: z.number().min(-90).max(90),
  minLongitude: z.number().min(-180).max(180),
  maxLongitude: z.number().min(-180).max(180),
  tileTypes: z.array(z.enum(['street', 'satellite', 'terrain', 'hybrid', 'dark'])),
  minZoom: z.number().int().min(0).max(20).default(10),
  maxZoom: z.number().int().min(0).max(20).default(15),
})

/**
 * Schema for map bounds
 */
export const mapBoundsSchema = z.object({
  minLatitude: z.number().min(-90).max(90),
  maxLatitude: z.number().min(-90).max(90),
  minLongitude: z.number().min(-180).max(180),
  maxLongitude: z.number().min(-180).max(180),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculates the number of tiles for a region
 */
function calculateTileCount(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  minZoom: number,
  maxZoom: number
): number {
  let totalTiles = 0
  
  for (let z = minZoom; z <= maxZoom; z++) {
    const tilesAtZoom = Math.pow(2, z)
    
    const minX = Math.floor(((minLng + 180) / 360) * tilesAtZoom)
    const maxX = Math.floor(((maxLng + 180) / 360) * tilesAtZoom)
    
    const minY = Math.floor(
      ((1 - Math.log(Math.tan((minLat * Math.PI) / 180) + 1 / Math.cos((minLat * Math.PI) / 180)) / Math.PI) / 2) *
      tilesAtZoom
    )
    const maxY = Math.floor(
      ((1 - Math.log(Math.tan((maxLat * Math.PI) / 180) + 1 / Math.cos((maxLat * Math.PI) / 180)) / Math.PI) / 2) *
      tilesAtZoom
    )
    
    const tilesX = maxX - minX + 1
    const tilesY = maxY - minY + 1
    
    totalTiles += tilesX * tilesY
  }
  
  return totalTiles
}

/**
 * Converts tile coordinates to bounds
 */
function tileToBounds(x: number, y: number, z: number): {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
} {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z)
  const minLng = (x / Math.pow(2, z)) * 360 - 180
  const maxLng = ((x + 1) / Math.pow(2, z)) * 360 - 180
  const minLat = (180 / Math.PI) * Math.atan(Math.sinh(n))
  const maxLat = (180 / Math.PI) * Math.atan(Math.sinh(Math.PI - (2 * Math.PI * y) / Math.pow(2, z)))
  
  return { minLat, maxLat, minLng, maxLng }
}

/**
 * Gets display name for tile type
 */
export function getTileTypeDisplayName(type: MapTileType): string {
  const names: Record<MapTileType, string> = {
    street: 'Street Map',
    satellite: 'Satellite',
    terrain: 'Terrain',
    hybrid: 'Hybrid',
    dark: 'Dark Mode',
  }
  return names[type]
}

/**
 * Gets status badge for region
 */
export function getRegionStatusBadge(status: MapRegionStatus): {
  label: string
  color: string
} {
  const badges: Record<MapRegionStatus, { label: string; color: string }> = {
    not_downloaded: { label: 'Not Downloaded', color: 'bg-gray-100 text-gray-800' },
    downloading: { label: 'Downloading', color: 'bg-blue-100 text-blue-800' },
    downloaded: { label: 'Downloaded', color: 'bg-green-100 text-green-800' },
    update_available: { label: 'Update Available', color: 'bg-yellow-100 text-yellow-800' },
    error: { label: 'Error', color: 'bg-red-100 text-red-800' },
  }
  return badges[status]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates an offline map region for download
 */
export async function createOfflineMapRegion(
  userId: string,
  input: z.infer<typeof offlineMapRegionInputSchema>
): Promise<OfflineMapRegion> {
  const validationResult = offlineMapRegionInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid region input: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const centerLat = (validatedInput.minLatitude + validatedInput.maxLatitude) / 2
  const centerLng = (validatedInput.minLongitude + validatedInput.maxLongitude) / 2
  const totalTiles = calculateTileCount(
    validatedInput.minLatitude,
    validatedInput.maxLatitude,
    validatedInput.minLongitude,
    validatedInput.maxLongitude,
    validatedInput.minZoom,
    validatedInput.maxZoom
  )

  const { data, error } = await supabase
    .from('offline_map_regions')
    .insert({
      user_id: userId,
      name: validatedInput.name,
      description: validatedInput.description || null,
      min_latitude: validatedInput.minLatitude,
      max_latitude: validatedInput.maxLatitude,
      min_longitude: validatedInput.minLongitude,
      max_longitude: validatedInput.maxLongitude,
      center_latitude: centerLat,
      center_longitude: centerLng,
      tile_types: validatedInput.tileTypes,
      min_zoom: validatedInput.minZoom,
      max_zoom: validatedInput.maxZoom,
      status: 'not_downloaded',
      download_progress: 0,
      total_tiles: totalTiles,
      downloaded_tiles: 0,
      failed_tiles: 0,
      size_bytes: 0,
      version: '1.0.0',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating offline map region:', error)
    throw new Error(`Failed to create region: ${error.message}`)
  }

  return mapRegionFromDB(data)
}

/**
 * Gets offline map regions for a user
 */
export async function getOfflineMapRegions(
  userId: string
): Promise<OfflineMapRegion[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('offline_map_regions')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching offline map regions:', error)
    return []
  }

  return (data || []).map(mapRegionFromDB)
}

/**
 * Gets a single offline map region
 */
export async function getOfflineMapRegion(
  regionId: string
): Promise<OfflineMapRegion | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('offline_map_regions')
    .select('*')
    .eq('id', regionId)
    .single()

  if (error) {
    console.error('Error fetching offline map region:', error)
    return null
  }

  return mapRegionFromDB(data)
}

/**
 * Updates download progress for a region
 */
export async function updateDownloadProgress(
  regionId: string,
  progress: number,
  downloadedTiles: number,
  failedTiles: number,
  sizeBytes: number
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('offline_map_regions')
    .update({
      download_progress: progress,
      downloaded_tiles: downloadedTiles,
      failed_tiles: failedTiles,
      size_bytes: sizeBytes,
      status: progress >= 100 ? 'downloaded' : 'downloading',
      download_completed: progress >= 100 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', regionId)

  if (error) {
    console.error('Error updating download progress:', error)
  }
}

/**
 * Marks a region as downloaded
 */
export async function markRegionDownloaded(
  regionId: string
): Promise<OfflineMapRegion> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('offline_map_regions')
    .update({
      status: 'downloaded',
      download_progress: 100,
      download_completed: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', regionId)
    .select('*')
    .single()

  if (error) {
    console.error('Error marking region as downloaded:', error)
    throw new Error(`Failed to update region: ${error.message}`)
  }

  return mapRegionFromDB(data)
}

/**
 * Deletes an offline map region
 */
export async function deleteOfflineMapRegion(regionId: string): Promise<boolean> {
  const supabase = createClient()

  // Delete associated tiles
  await supabase
    .from('offline_map_tiles')
    .delete()
    .eq('region_id', regionId)

  // Delete the region
  const { error } = await supabase
    .from('offline_map_regions')
    .delete()
    .eq('id', regionId)

  if (error) {
    console.error('Error deleting offline map region:', error)
    return false
  }

  return true
}

/**
 * Gets offline tiles for a region and bounds
 */
export async function getOfflineTiles(
  regionId: string,
  bounds: z.infer<typeof mapBoundsSchema>,
  zoom: number,
  tileType: MapTileType
): Promise<OfflineMapTile[]> {
  const supabase = createClient()

  const tilesAtZoom = Math.pow(2, zoom)
  
  const minX = Math.floor(((bounds.minLongitude + 180) / 360) * tilesAtZoom)
  const maxX = Math.floor(((bounds.maxLongitude + 180) / 360) * tilesAtZoom)
  
  const minY = Math.floor(
    ((1 - Math.log(Math.tan((bounds.minLatitude * Math.PI) / 180) + 1 / Math.cos((bounds.minLatitude * Math.PI) / 180)) / Math.PI) / 2) *
    tilesAtZoom
  )
  const maxY = Math.floor(
    ((1 - Math.log(Math.tan((bounds.maxLatitude * Math.PI) / 180) + 1 / Math.cos((bounds.maxLatitude * Math.PI) / 180)) / Math.PI) / 2) *
    tilesAtZoom
  )

  const { data, error } = await supabase
    .from('offline_map_tiles')
    .select('*')
    .eq('region_id', regionId)
    .eq('tile_type', tileType)
    .eq('z', zoom)
    .gte('x', minX)
    .lte('x', maxX)
    .gte('y', minY)
    .lte('y', maxY)

  if (error) {
    console.error('Error fetching offline tiles:', error)
    return []
  }

  return (data || []).map(tile => ({
    id: tile.id as string,
    regionId: tile.region_id as string,
    x: tile.x as number,
    y: tile.y as number,
    z: tile.z as number,
    tileType: tile.tile_type as MapTileType,
    data: new Uint8Array(tile.data as any),
    size: tile.size as number,
    isValid: tile.is_valid as boolean,
    downloadedAt: (tile.downloaded_at as string) || undefined,
    expiresAt: (tile.expires_at as string) || undefined,
    createdAt: tile.created_at as string,
    updatedAt: tile.updated_at as string,
  }))
}

/**
 * Caches a map tile
 */
export async function cacheMapTile(
  regionId: string,
  x: number,
  y: number,
  z: number,
  tileType: MapTileType,
  data: Uint8Array,
  expiresAt?: string
): Promise<OfflineMapTile> {
  const supabase = createClient()

  const tileId = `tile_${regionId}_${tileType}_${z}_${x}_${y}`

  const { data: tile, error } = await supabase
    .from('offline_map_tiles')
    .upsert({
      id: tileId,
      region_id: regionId,
      x,
      y,
      z,
      tile_type: tileType,
      data: Array.from(data),
      size: data.length as number,
      is_valid: true,
      downloaded_at: new Date().toISOString(),
      expires_at: expiresAt || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error caching map tile:', error)
    throw new Error(`Failed to cache tile: ${error.message}`)
  }

  return {
    id: tile.id as string,
    regionId: tile.region_id as string,
    x: tile.x as number,
    y: tile.y as number,
    z: tile.z as number,
    tileType: tile.tile_type as MapTileType,
    data: new Uint8Array(tile.data as any),
    size: tile.size as number,
    isValid: tile.is_valid as boolean,
    downloadedAt: (tile.downloaded_at as string) || undefined,
    expiresAt: (tile.expires_at as string) || undefined,
    createdAt: tile.created_at as string,
    updatedAt: tile.updated_at as string,
  }
}

/**
 * Gets map cache entries
 */
export async function getMapCacheEntries(
  userId: string,
  options?: {
    type?: MapCacheEntry['type']
    tileType?: MapTileType
    limit?: number
  }
): Promise<MapCacheEntry[]> {
  const supabase = createClient()

  let query = supabase
    .from('map_cache')
    .select('*')
    .eq('user_id', userId)

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.tileType) {
    query = query.eq('tile_type', options.tileType)
  }

  query = query.order('last_accessed', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching map cache entries:', error)
    return []
  }

  return (data || []).map(entry => ({
    id: entry.id as string,
    key: entry.key as string,
    type: entry.type as MapCacheEntry['type'],
    data: new Uint8Array(entry.data as any),
    size: entry.size as number,
    tileType: (entry.tile_type as MapTileType) || undefined,
    zoom: entry.zoom as number,
    version: (entry.version as string) || undefined,
    etag: (entry.etag as string) || undefined,
    expiresAt: (entry.expires_at as string) || undefined,
    lastValidated: (entry.last_validated as string) || undefined,
    createdAt: entry.created_at as string,
    updatedAt: entry.updated_at as string,
  }))
}

/**
 * Invalidates expired cache entries
 */
export async function invalidateExpiredCache(userId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('map_cache')
    .delete()
    .eq('user_id', userId)
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error invalidating expired cache:', error)
    return 0
  }

  return count || 0
}

/**
 * Gets total offline maps storage used
 */
export async function getOfflineMapsStorageUsed(userId: string): Promise<{
  regions: number
  tiles: number
  cache: number
  total: number
}> {
  const supabase = createClient()

  // Get region sizes
  const { data: regions } = await supabase
    .from('offline_map_regions')
    .select('size_bytes')
    .eq('user_id', userId)

  // Get tiles storage
  const { data: tiles } = await supabase
    .from('offline_map_tiles')
    .select('size')
    .eq('user_id', userId)

  // Get cache sizes
  const { data: cache } = await supabase
    .from('map_cache')
    .select('size')
    .eq('user_id', userId)

  const regionsSize = regions?.reduce((sum, r) => sum + (r.size_bytes as number || 0), 0) || 0
  const tilesSize = tiles?.reduce((sum, t) => sum + (t.size as number || 0), 0) || 0
  const cacheSize = cache?.reduce((sum, c) => sum + (c.size as number || 0), 0) || 0

  return {
    regions: regionsSize,
    tiles: tilesSize,
    cache: cacheSize,
    total: regionsSize + tilesSize + cacheSize,
  }
}

/**
 * Clears all offline map data for a user
 */
export async function clearOfflineMapsData(userId: string): Promise<void> {
  const supabase = createClient()

  // Delete tiles
  await supabase
    .from('offline_map_tiles')
    .delete()
    .eq('user_id', userId)

  // Delete regions
  await supabase
    .from('offline_map_regions')
    .delete()
    .eq('user_id', userId)

  // Delete cache
  await supabase
    .from('map_cache')
    .delete()
    .eq('user_id', userId)
}

/**
 * Updates region access time
 */
export async function updateRegionAccessTime(regionId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('offline_map_regions')
    .update({
      last_accessed: new Date().toISOString(),
    })
    .eq('id', regionId)
}

// ============================================================================
// Map Overlay Functions
// ============================================================================

/**
 * Gets offline map overlays
 */
export async function getOfflineMapOverlays(
  userId: string
): Promise<MapOverlay[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('map_overlays')
    .select('*')
    .eq('user_id', userId)
    .eq('is_cached', true)
    .order('z_index', { ascending: true })

  if (error) {
    console.error('Error fetching map overlays:', error)
    return []
  }

  return (data || []).map(overlay => ({
    id: overlay.id as string,
    regionId: (overlay.region_id as string) || undefined,
    name: overlay.name as string,
    type: overlay.type as MapOverlay['type'],
    geometry: overlay.geometry as GeoJSON.FeatureCollection,
    style: overlay.style || undefined,
    isVisible: overlay.is_visible as boolean,
    zIndex: overlay.z_index as number,
    isCached: overlay.is_cached as boolean,
    expiresAt: (overlay.expires_at as string) || undefined,
    lastUpdated: (overlay.last_updated as string) || undefined,
  }))
}

/**
 * Caches a map overlay for offline use
 */
export async function cacheMapOverlay(
  userId: string,
  overlay: Omit<MapOverlay, 'id' | 'isCached'>
): Promise<MapOverlay> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('map_overlays')
    .insert({
      user_id: userId,
      region_id: overlay.regionId || null,
      name: overlay.name,
      type: overlay.type,
      geometry: overlay.geometry,
      style: overlay.style || null,
      is_visible: overlay.isVisible,
      z_index: overlay.zIndex,
      is_cached: true,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error caching map overlay:', error)
    throw new Error(`Failed to cache overlay: ${error.message}`)
  }

  return {
    id: data.id as string,
    regionId: data.region_id as string || undefined,
    name: data.name as string,
    type: data.type as MapOverlay['type'],
    geometry: data.geometry as GeoJSON.FeatureCollection,
    style: data.style || undefined,
    isVisible: data.is_visible as boolean,
    zIndex: data.z_index as number,
    isCached: true,
    expiresAt: data.expires_at as string || undefined,
    lastUpdated: (data.last_updated as string) || undefined,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to OfflineMapRegion
 */
function mapRegionFromDB(data: Record<string, unknown>): OfflineMapRegion {
  return {
    id: data.id as string,
    userId: data.user_id as string | undefined,
    name: data.name as string,
    description: data.description as string | undefined,
    minLatitude: data.min_latitude as number,
    maxLatitude: data.max_latitude as number,
    minLongitude: data.min_longitude as number,
    maxLongitude: data.max_longitude as number,
    centerLatitude: data.center_latitude as number,
    centerLongitude: data.center_longitude as number,
    tileTypes: data.tile_types as MapTileType[],
    minZoom: data.min_zoom as number,
    maxZoom: data.max_zoom as number,
    status: data.status as MapRegionStatus,
    downloadProgress: data.download_progress as number,
    totalTiles: data.total_tiles as number,
    downloadedTiles: data.downloaded_tiles as number,
    failedTiles: data.failed_tiles as number,
    sizeBytes: data.size_bytes as number,
    downloadStarted: (data.download_started as string) || undefined,
    downloadCompleted: (data.download_completed as string) || undefined,
    lastAccessed: (data.last_accessed as string) || undefined,
    lastUpdated: (data.last_updated as string) || undefined,
    expiresAt: data.expires_at as string || undefined,
    version: data.version as string,
    source: data.source as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Formats bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Calculates estimated download time
 */
export function estimateDownloadTime(
  sizeBytes: number,
  speedKbps: number = 500 // Default assumed speed in Kbps
): number {
  const speedBytes = speedKbps * 1024
  return Math.ceil(sizeBytes / speedBytes) // Returns seconds
}
