import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Location accuracy level
 */
export type LocationAccuracy = 'high' | 'medium' | 'low' | 'unknown'

/**
 * Location source type
 */
export type LocationSource = 'gps' | 'network' | 'ip' | 'manual' | 'cached'

/**
 * User's location history entry
 */
export interface LocationEntry {
  id: string
  userId: string
  latitude: number
  longitude: number
  accuracy: LocationAccuracy
  source: LocationSource
  altitude?: number
  speed?: number
  heading?: number
  timestamp: string
  context?: 'home' | 'work' | 'transit' | 'other'
}

/**
 * Location update input
 */
export interface LocationUpdateInput {
  latitude: number
  longitude: number
  accuracy?: LocationAccuracy
  source?: LocationSource
  altitude?: number
  speed?: number
  heading?: number
  context?: 'home' | 'work' | 'transit' | 'other'
}

/**
 * Saved location (home/work)
 */
export interface SavedLocation {
  id: string
  userId: string
  name: string
  type: 'home' | 'work' | 'other'
  latitude: number
  longitude: number
  address?: string
  radius?: number // meters
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Location search result
 */
export interface LocationSearchResult {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  type?: string
  placeId?: string
  distance?: number
}

/**
 * Geofence event
 */
export interface GeofenceEvent {
  id: string
  userId: string
  geofenceId: string
  geofenceName: string
  eventType: 'enter' | 'exit' | 'dwell'
  location: {
    latitude: number
    longitude: number
  }
  timestamp: string
  durationSeconds?: number
}

/**
 * Location settings
 */
export interface LocationSettings {
  userId: string
  shareLocation: boolean
  shareWithEmergencyContacts: boolean
  allowBackgroundUpdates: boolean
  updateInterval: number // seconds
  accuracy: LocationAccuracy
  notifyOnGeofenceEvents: boolean
  saveLocationHistory: boolean
  historyRetentionDays: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for location update input
 */
export const locationUpdateInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.enum(['high', 'medium', 'low', 'unknown']).optional(),
  source: z.enum(['gps', 'network', 'ip', 'manual', 'cached']).optional(),
  altitude: z.number().optional(),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  context: z.enum(['home', 'work', 'transit', 'other']).optional(),
})

/**
 * Schema for saved location input
 */
export const savedLocationInputSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['home', 'work', 'other']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  radius: z.number().positive().max(5000).optional(),
})

/**
 * Schema for location settings
 */
export const locationSettingsInputSchema = z.object({
  shareLocation: z.boolean(),
  shareWithEmergencyContacts: z.boolean(),
  allowBackgroundUpdates: z.boolean(),
  updateInterval: z.number().positive().max(3600), // Max 1 hour
  accuracy: z.enum(['high', 'medium', 'low', 'unknown']),
  notifyOnGeofenceEvents: z.boolean(),
  saveLocationHistory: z.boolean(),
  historyRetentionDays: z.number().positive().max(365), // Max 1 year
})

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Updates user's current location
 */
export async function updateUserLocation(
  userId: string,
  input: LocationUpdateInput
): Promise<LocationEntry> {
  const validationResult = locationUpdateInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid location update: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  // Get current location for calculating speed/heading
  const { data: lastLocation } = await supabase
    .from('user_locations')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  // Calculate speed if we have two points
  let calculatedSpeed: number | undefined
  let calculatedHeading: number | undefined

  if (lastLocation && validatedInput.speed === undefined) {
    const loc = lastLocation as any
    const timeDiff = (new Date().getTime() - new Date(loc.timestamp).getTime()) / 1000
    if (timeDiff > 0) {
      const distance = calculateDistance(
        { latitude: loc.latitude, longitude: loc.longitude },
        { latitude: validatedInput.latitude, longitude: validatedInput.longitude }
      )
      calculatedSpeed = distance / timeDiff // m/s

      // Calculate heading
      calculatedHeading = calculateHeading(
        { latitude: loc.latitude, longitude: loc.longitude },
        { latitude: validatedInput.latitude, longitude: validatedInput.longitude }
      )
    }
  }

  // Insert new location
  const { data, error } = await supabase
    .from('user_locations')
    .insert({
      user_id: userId,
      latitude: validatedInput.latitude,
      longitude: validatedInput.longitude,
      accuracy: validatedInput.accuracy || 'unknown',
      source: validatedInput.source || 'gps',
      altitude: validatedInput.altitude || null,
      speed: validatedInput.speed || calculatedSpeed || null,
      heading: validatedInput.heading || calculatedHeading || null,
      context: validatedInput.context || null,
      timestamp: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating location:', error)
    throw new Error(`Failed to update location: ${error.message}`)
  }

  // Check for geofence events
  await checkGeofenceEvents(userId, {
    latitude: validatedInput.latitude,
    longitude: validatedInput.longitude,
    timestamp: data.timestamp as string,
  })

  return {
    id: data.id as string,
    userId: data.user_id as string,
    latitude: data.latitude as number,
    longitude: data.longitude as number,
    accuracy: data.accuracy as LocationAccuracy,
    source: data.source as LocationSource,
    altitude: (data.altitude as number) || undefined,
    speed: (data.speed as number) || undefined,
    heading: (data.heading as number) || undefined,
    context: (data.context as 'home' | 'work' | 'transit' | 'other' | undefined),
    timestamp: data.timestamp as string,
  }
}

/**
 * Gets user's last known location
 */
export async function getLastLocation(userId: string): Promise<LocationEntry | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_locations')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching last location:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    latitude: data.latitude as number,
    longitude: data.longitude as number,
    accuracy: data.accuracy as LocationAccuracy,
    source: data.source as LocationSource,
    altitude: (data.altitude as number) || undefined,
    speed: (data.speed as number) || undefined,
    heading: (data.heading as number) || undefined,
    context: (data.context as 'home' | 'work' | 'transit' | 'other' | undefined),
    timestamp: data.timestamp as string,
  }
}

/**
 * Gets user's location history within a time range
 */
export async function getLocationHistory(
  userId: string,
  options?: {
    startTime?: string
    endTime?: string
    limit?: number
  }
): Promise<LocationEntry[]> {
  const supabase = createClient()

  let query = supabase
    .from('user_locations')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })

  if (options?.startTime) {
    query = query.gte('timestamp', options.startTime)
  }

  if (options?.endTime) {
    query = query.lte('timestamp', options.endTime)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching location history:', error)
    return []
  }

  return ((data || []) as any[]).map(item => ({
    id: item.id,
    userId: item.user_id,
    latitude: item.latitude,
    longitude: item.longitude,
    accuracy: item.accuracy,
    source: item.source,
    altitude: item.altitude || undefined,
    speed: item.speed || undefined,
    heading: item.heading || undefined,
    context: item.context || undefined,
    timestamp: item.timestamp,
  }))
}

/**
 * Creates a saved location (home/work/other)
 */
export async function createSavedLocation(
  userId: string,
  input: z.infer<typeof savedLocationInputSchema>
): Promise<SavedLocation> {
  const validationResult = savedLocationInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid saved location input: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  // Deactivate existing location of same type
  if (validatedInput.type !== 'other') {
    await supabase
      .from('saved_locations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('type', validatedInput.type)
  }

  const { data, error } = await supabase
    .from('saved_locations')
    .insert({
      user_id: userId,
      name: validatedInput.name,
      type: validatedInput.type,
      latitude: validatedInput.latitude,
      longitude: validatedInput.longitude,
      address: validatedInput.address || null,
      radius: validatedInput.radius || null,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating saved location:', error)
    throw new Error(`Failed to create saved location: ${error.message}`)
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    name: data.name as string,
    type: data.type as SavedLocation['type'],
    latitude: data.latitude as number,
    longitude: data.longitude as number,
    address: (data.address as string) || undefined,
    radius: (data.radius as number) || undefined,
    isActive: data.is_active as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Gets user's saved locations
 */
export async function getSavedLocations(userId: string): Promise<SavedLocation[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('saved_locations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching saved locations:', error)
    return []
  }

  return ((data || []) as any[]).map(item => ({
    id: item.id,
    userId: item.user_id,
    name: item.name,
    type: item.type,
    latitude: item.latitude,
    longitude: item.longitude,
    address: item.address || undefined,
    radius: item.radius || undefined,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

/**
 * Gets user's location settings
 */
export async function getLocationSettings(userId: string): Promise<LocationSettings | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('location_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching location settings:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    userId: data.user_id as string,
    shareLocation: data.share_location as boolean,
    shareWithEmergencyContacts: data.share_with_emergency_contacts as boolean,
    allowBackgroundUpdates: data.allow_background_updates as boolean,
    updateInterval: data.update_interval as number,
    accuracy: data.accuracy as LocationAccuracy,
    notifyOnGeofenceEvents: data.notify_on_geofence_events as boolean,
    saveLocationHistory: data.save_location_history as boolean,
    historyRetentionDays: data.history_retention_days as number,
  }
}

/**
 * Updates user's location settings
 */
export async function updateLocationSettings(
  userId: string,
  input: Partial<z.infer<typeof locationSettingsInputSchema>>
): Promise<LocationSettings> {
  const supabase = createClient()

  const { error } = await supabase
    .from('location_settings')
    .upsert({
      user_id: userId,
      share_location: input.shareLocation ?? true,
      share_with_emergency_contacts: input.shareWithEmergencyContacts ?? false,
      allow_background_updates: input.allowBackgroundUpdates ?? false,
      update_interval: input.updateInterval ?? 60,
      accuracy: input.accuracy ?? 'medium',
      notify_on_geofence_events: input.notifyOnGeofenceEvents ?? true,
      save_location_history: input.saveLocationHistory ?? true,
      history_retention_days: input.historyRetentionDays ?? 30,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error updating location settings:', error)
    throw new Error(`Failed to update location settings: ${error.message}`)
  }

  return getLocationSettings(userId) as Promise<LocationSettings>
}

/**
 * Calculates distance between two points (Haversine formula)
 */
export function calculateDistance(
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

/**
 * Calculates heading between two points
 */
export function calculateHeading(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number {
  const lat1 = (from.latitude * Math.PI) / 180
  const lat2 = (to.latitude * Math.PI) / 180
  const deltaLon = ((to.longitude - from.longitude) * Math.PI) / 180

  const y = Math.sin(deltaLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon)

  const heading = (Math.atan2(y, x) * 180) / Math.PI
  return ((heading + 360) % 360) // Normalize to 0-360
}

/**
 * Gets current location from browser
 */
export async function getCurrentLocation(
  options?: {
    enableHighAccuracy?: boolean
    timeout?: number
    maximumAge?: number
  }
): Promise<{ latitude: number; longitude: number; accuracy?: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    console.warn('Geolocation not supported')
    return null
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        console.error('Geolocation error:', error.message)
        resolve(null)
      },
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 0,
      }
    )
  })
}

/**
 * Watches location changes
 */
export function watchLocation(
  callback: (location: {
    latitude: number
    longitude: number
    accuracy?: number
    speed?: number
    heading?: number
  }) => void,
  options?: {
    enableHighAccuracy?: boolean
    interval?: number
  }
): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    console.warn('Geolocation not supported')
    return () => {}
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed ?? undefined,
        heading: position.coords.heading ?? undefined,
      })
    },
    (error) => {
      console.error('Geolocation watch error:', error.message)
    },
    {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      maximumAge: options?.interval ?? 10000,
      timeout: 10000,
    }
  )

  return () => navigator.geolocation.clearWatch(watchId)
}

// ============================================================================
// Geofence Functions
// ============================================================================

/**
 * Creates a geofence for a saved location
 */
export async function createGeofence(
  userId: string,
  savedLocationId: string,
  radius?: number
): Promise<{ id: string; name: string; radius: number }> {
  const supabase = createClient()

  // Get saved location
  const { data: savedLocation } = await supabase
    .from('saved_locations')
    .select('*')
    .eq('id', savedLocationId)
    .eq('user_id', userId)
    .single()

  if (!savedLocation) {
    throw new Error('Saved location not found')
  }

  const geofenceRadius = radius || (savedLocation as any).radius || 100 // Default 100m

  const { data, error } = await supabase
    .from('user_geofences')
    .insert({
      user_id: userId,
      saved_location_id: savedLocationId,
      name: (savedLocation as any).name,
      latitude: (savedLocation as any).latitude,
      longitude: (savedLocation as any).longitude,
      radius: geofenceRadius,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating geofence:', error)
    throw new Error(`Failed to create geofence: ${error.message}`)
  }

  return {
    id: data.id as string,
    name: data.name as string,
    radius: data.radius as number,
  }
}

/**
 * Gets user's geofences
 */
export async function getUserGeofences(userId: string): Promise<Array<{
  id: string
  savedLocationId: string
  name: string
  latitude: number
  longitude: number
  radius: number
  isActive: boolean
}>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_geofences')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching geofences:', error)
    return []
  }

  return ((data || []) as any[]).map(item => ({
    id: item.id,
    savedLocationId: item.saved_location_id,
    name: item.name,
    latitude: item.latitude,
    longitude: item.longitude,
    radius: item.radius,
    isActive: item.is_active,
  }))
}

/**
 * Checks geofence events when location updates
 */
async function checkGeofenceEvents(
  userId: string,
  location: { latitude: number; longitude: number; timestamp: string }
): Promise<void> {
  const supabase = createClient()

  const { data: geofences } = await supabase
    .from('user_geofences')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!geofences || (geofences as any[]).length === 0) return

  // Get last geofence event for each geofence
  const { data: lastEvents } = await supabase
    .from('geofence_events')
    .select('*')
    .eq('user_id', userId)
    .in('geofence_id', (geofences as any[]).map(g => g.id))
    .order('timestamp', { ascending: false })

  const lastEventByGeofence = new Map<string, GeofenceEvent>()
  for (const event of (lastEvents || []) as any[]) {
    if (!lastEventByGeofence.has(event.geofence_id)) {
      lastEventByGeofence.set(event.geofence_id, {
        id: event.id,
        userId: event.user_id,
        geofenceId: event.geofence_id,
        geofenceName: event.geofence_name,
        eventType: event.event_type,
        location: event.location,
        timestamp: event.timestamp,
        durationSeconds: event.duration_seconds || undefined,
      })
    }
  }

  // Check each geofence
  const eventsToInsert: Array<{
    user_id: string
    geofence_id: string
    geofence_name: string
    event_type: 'enter' | 'exit' | 'dwell'
    location: { latitude: number; longitude: number }
    timestamp: string
    duration_seconds?: number
  }> = []

  for (const geofence of (geofences as any[])) {
    const distance = calculateDistance(
      { latitude: geofence.latitude, longitude: geofence.longitude },
      location
    )

    const wasInside = lastEventByGeofence.has(geofence.id)
    const isInside = distance <= geofence.radius

    if (!wasInside && isInside) {
      // Enter event
      eventsToInsert.push({
        user_id: userId,
        geofence_id: geofence.id,
        geofence_name: geofence.name,
        event_type: 'enter',
        location: { latitude: location.latitude, longitude: location.longitude },
        timestamp: location.timestamp,
      })
    } else if (wasInside && !isInside) {
      // Exit event - calculate duration
      const lastEvent = lastEventByGeofence.get(geofence.id)!
      const duration = (new Date(location.timestamp).getTime() - new Date(lastEvent.timestamp).getTime()) / 1000

      eventsToInsert.push({
        user_id: userId,
        geofence_id: geofence.id,
        geofence_name: geofence.name,
        event_type: 'exit',
        location: { latitude: location.latitude, longitude: location.longitude },
        timestamp: location.timestamp,
        duration_seconds: Math.round(duration),
      })
    }
  }

  if (eventsToInsert.length > 0) {
    await supabase.from('geofence_events').insert(eventsToInsert)
  }
}

/**
 * Gets user's geofence events
 */
export async function getGeofenceEvents(
  userId: string,
  options?: {
    limit?: number
    since?: string
  }
): Promise<GeofenceEvent[]> {
  const supabase = createClient()

  let query = supabase
    .from('geofence_events')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })

  if (options?.since) {
    query = query.gte('timestamp', options.since)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching geofence events:', error)
    return []
  }

  return ((data || []) as any[]).map(item => ({
    id: item.id,
    userId: item.user_id,
    geofenceId: item.geofence_id,
    geofenceName: item.geofence_name,
    eventType: item.event_type,
    location: item.location,
    timestamp: item.timestamp,
    durationSeconds: item.duration_seconds || undefined,
  }))
}

/**
 * Cleans up old location history based on retention settings
 */
export async function cleanupOldLocationHistory(userId: string): Promise<number> {
  const settings = await getLocationSettings(userId)
  const retentionDays = settings?.historyRetentionDays || 30

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  const supabase = createClient()
  const { error, count } = await supabase
    .from('user_locations')
    .delete()
    .eq('user_id', userId)
    .lt('timestamp', cutoffDate.toISOString())

  if (error) {
    console.error('Error cleaning up location history:', error)
    return 0
  }

  return count || 0
}
