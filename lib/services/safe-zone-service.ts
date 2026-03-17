import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Safe zone types
 */
export type SafeZoneType =
  | 'emergency_shelter'
  | 'hospital'
  | 'police_station'
  | 'fire_station'
  | 'community_center'
  | 'religious_center'
  | 'school'
  | 'government_building'
  | 'open_area'
  | 'other'

/**
 * Safe zone status
 */
export type SafeZoneStatus = 'active' | 'temporary_closed' | 'full' | 'inactive'

/**
 * Safe zone accessibility
 */
export type SafeZoneAccessibility =
  | 'fully_accessible'
  | 'limited_accessibility'
  | 'stairs_only'
  | 'ground_floor_only'
  | 'unknown'

/**
 * Available services at safe zone
 */
export type SafeZoneService =
  | 'medical'
  | 'food'
  | 'water'
  | 'shelter'
  | 'charging'
  | 'wifi'
  | 'first_aid'
  | 'psychological_support'
  | 'childcare'
  | 'pet_friendly'
  | 'ada_compliant'
  | 'generator_power'

/**
 * Capacity information
 */
export interface CapacityInfo {
  current: number
  maximum: number
  hasReachedCapacity: boolean
  percentageFull: number
}

/**
 * Operating hours
 */
export interface OperatingHours {
  monday: { open: string; close: string } | null
  tuesday: { open: string; close: string } | null
  wednesday: { open: string; close: string } | null
  thursday: { open: string; close: string } | null
  friday: { open: string; close: string } | null
  saturday: { open: string; close: string } | null
  sunday: { open: string; close: string } | null
}

/**
 * Contact information
 */
export interface SafeZoneContact {
  phone?: string
  email?: string
  website?: string
  facebook?: string
  twitter?: string
}

/**
 * Safe zone entry
 */
export interface SafeZone {
  id: string
  externalId?: string
  name: string
  description?: string
  type: SafeZoneType
  status: SafeZoneStatus
  
  // Location
  latitude: number
  longitude: number
  address: string
  municipality: string
  parish?: string
  
  // Details
  capacity?: CapacityInfo
  operatingHours?: OperatingHours
  accessibility: SafeZoneAccessibility
  services: SafeZoneService[]
  
  // Contact
  contact?: SafeZoneContact
  
  // Emergency specific
  isVerified: boolean
  isTemporary: boolean
  temporaryUntil?: string
  
  // Metadata
  source?: string
  lastVerifiedAt?: string
  notes?: string
  imageUrl?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Safe zone check-in
 */
export interface SafeZoneCheckIn {
  id: string
  safeZoneId: string
  userId: string
  timestamp: string
  status: 'checked_in' | 'checked_out'
  notes?: string
}

/**
 * Safe zone rating/review
 */
export interface SafeZoneReview {
  id: string
  safeZoneId: string
  userId: string
  rating: number // 1-5
  comment?: string
  categories?: Record<string, number>
  createdAt: string
}

/**
 * Safe zone bookmark
 */
export interface SafeZoneBookmark {
  id: string
  safeZoneId: string
  userId: string
  createdAt: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for geo coordinate
 */
export const geoCoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

/**
 * Schema for operating hours
 */
export const operatingHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string() }).nullable(),
  tuesday: z.object({ open: z.string(), close: z.string() }).nullable(),
  wednesday: z.object({ open: z.string(), close: z.string() }).nullable(),
  thursday: z.object({ open: z.string(), close: z.string() }).nullable(),
  friday: z.object({ open: z.string(), close: z.string() }).nullable(),
  saturday: z.object({ open: z.string(), close: z.string() }).nullable(),
  sunday: z.object({ open: z.string(), close: z.string() }).nullable(),
})

/**
 * Schema for safe zone input
 */
export const safeZoneInputSchema = z.object({
  externalId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    'emergency_shelter',
    'hospital',
    'police_station',
    'fire_station',
    'community_center',
    'religious_center',
    'school',
    'government_building',
    'open_area',
    'other',
  ]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1),
  municipality: z.string().min(1),
  parish: z.string().optional(),
  capacity: z.object({
    current: z.number().min(0),
    maximum: z.number().positive(),
  }).optional(),
  operatingHours: operatingHoursSchema.optional(),
  accessibility: z.enum([
    'fully_accessible',
    'limited_accessibility',
    'stairs_only',
    'ground_floor_only',
    'unknown',
  ]).optional(),
  services: z.array(z.enum([
    'medical',
    'food',
    'water',
    'shelter',
    'charging',
    'wifi',
    'first_aid',
    'psychological_support',
    'childcare',
    'pet_friendly',
    'ada_compliant',
    'generator_power',
  ])).optional(),
  contact: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
  isTemporary: z.boolean().optional(),
  temporaryUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for safe zone type
 */
export function getSafeZoneTypeDisplayName(type: SafeZoneType): string {
  const names: Record<SafeZoneType, string> = {
    emergency_shelter: 'Emergency Shelter',
    hospital: 'Hospital',
    police_station: 'Police Station',
    fire_station: 'Fire Station',
    community_center: 'Community Center',
    religious_center: 'Religious Center',
    school: 'School',
    government_building: 'Government Building',
    open_area: 'Open Area',
    other: 'Other',
  }
  return names[type]
}

/**
 * Gets icon for safe zone type
 */
export function getSafeZoneTypeIcon(type: SafeZoneType): string {
  const icons: Record<SafeZoneType, string> = {
    emergency_shelter: '⛺',
    hospital: '🏥',
    police_station: '🚓',
    fire_station: '🚒',
    community_center: '🏛️',
    religious_center: '⛪',
    school: '🏫',
    government_building: '🏢',
    open_area: '🌳',
    other: '📍',
  }
  return icons[type]
}

/**
 * Gets status color for safe zone
 */
export function getSafeZoneStatusColor(status: SafeZoneStatus): string {
  const colors: Record<SafeZoneStatus, string> = {
    active: 'bg-green-500',
    temporary_closed: 'bg-yellow-500',
    full: 'bg-red-500',
    inactive: 'bg-gray-500',
  }
  return colors[status]
}

/**
 * Gets accessibility badge
 */
export function getAccessibilityBadge(accessibility: SafeZoneAccessibility): {
  label: string
  color: string
} {
  const badges: Record<SafeZoneAccessibility, { label: string; color: string }> = {
    fully_accessible: { label: 'Fully Accessible', color: 'bg-green-100 text-green-800' },
    limited_accessibility: { label: 'Limited Accessibility', color: 'bg-yellow-100 text-yellow-800' },
    stairs_only: { label: 'Stairs Only', color: 'bg-orange-100 text-orange-800' },
    ground_floor_only: { label: 'Ground Floor Only', color: 'bg-blue-100 text-blue-800' },
    unknown: { label: 'Accessibility Unknown', color: 'bg-gray-100 text-gray-800' },
  }
  return badges[accessibility]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a new safe zone
 */
export async function createSafeZone(
  input: z.infer<typeof safeZoneInputSchema>
): Promise<SafeZone> {
  const validationResult = safeZoneInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid safe zone input: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('safe_zones')
    .insert({
      external_id: validatedInput.externalId || null,
      name: validatedInput.name,
      description: validatedInput.description || null,
      type: validatedInput.type,
      latitude: validatedInput.latitude,
      longitude: validatedInput.longitude,
      address: validatedInput.address,
      municipality: validatedInput.municipality,
      parish: validatedInput.parish || null,
      capacity: validatedInput.capacity || null,
      operating_hours: validatedInput.operatingHours || null,
      accessibility: validatedInput.accessibility || 'unknown',
      services: validatedInput.services || [],
      contact: validatedInput.contact || null,
      is_temporary: validatedInput.isTemporary || false,
      temporary_until: validatedInput.temporaryUntil || null,
      notes: validatedInput.notes || null,
      image_url: validatedInput.imageUrl || null,
      status: 'active',
      is_verified: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating safe zone:', error)
    throw new Error(`Failed to create safe zone: ${error.message}`)
  }

  return mapSafeZoneFromDB(data)
}

/**
 * Gets a safe zone by ID
 */
export async function getSafeZone(safeZoneId: string): Promise<SafeZone | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('safe_zones')
    .select('*')
    .eq('id', safeZoneId)
    .single()

  if (error) {
    console.error('Error fetching safe zone:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapSafeZoneFromDB(data)
}

/**
 * Gets safe zones near a location
 */
export async function getNearbySafeZones(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  options?: {
    types?: SafeZoneType[]
    status?: SafeZoneStatus[]
    minCapacity?: number
  }
): Promise<SafeZone[]> {
  const supabase = createClient()

  // Calculate bounding box for initial filter
  const latDelta = radiusKm / 111 // km per degree latitude
  const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))

  let query = supabase
    .from('safe_zones')
    .select('*')
    .gte('latitude', latitude - latDelta)
    .lte('latitude', latitude + latDelta)
    .gte('longitude', longitude - lonDelta)
    .lte('longitude', longitude + lonDelta)
    .eq('status', 'active')

  if (options?.types && options.types.length > 0) {
    query = query.in('type', options.types)
  }

  if (options?.status && options.status.length > 0) {
    query = query.in('status', options.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching nearby safe zones:', error)
    return []
  }

  // Filter by exact distance and sort
  const nearbyZones = (data || [])
    .map(item => ({
      ...item,
      distance: calculateDistance(
        { latitude, longitude },
        { latitude: (item as any).latitude, longitude: (item as any).longitude }
      ),
    }))
    .filter(item => item.distance <= radiusKm * 1000)
    .sort((a, b) => a.distance - b.distance)

  return nearbyZones.map(mapSafeZoneFromDB)
}

/**
 * Gets safe zones by municipality
 */
export async function getSafeZonesByMunicipality(
  municipality: string,
  options?: {
    type?: SafeZoneType
    status?: SafeZoneStatus
  }
): Promise<SafeZone[]> {
  const supabase = createClient()

  let query = supabase
    .from('safe_zones')
    .select('*')
    .eq('municipality', municipality)
    .eq('status', 'active')

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query.order('name', { ascending: true })

  if (error) {
    console.error('Error fetching safe zones by municipality:', error)
    return []
  }

  return (data || []).map(mapSafeZoneFromDB)
}

/**
 * Updates safe zone status
 */
export async function updateSafeZoneStatus(
  safeZoneId: string,
  status: SafeZoneStatus,
  notes?: string
): Promise<SafeZone> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('safe_zones')
    .update({
      status,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', safeZoneId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating safe zone status:', error)
    throw new Error(`Failed to update safe zone status: ${error.message}`)
  }

  return mapSafeZoneFromDB(data)
}

/**
 * Updates safe zone capacity
 */
export async function updateSafeZoneCapacity(
  safeZoneId: string,
  currentOccupancy: number
): Promise<SafeZone> {
  const supabase = createClient()

  // Get current zone to get max capacity
  const { data: zone } = await supabase
    .from('safe_zones')
    .select('capacity')
    .eq('id', safeZoneId)
    .single()

  const zoneAny = zone as any

  if (!zone) {
    throw new Error('Safe zone not found')
  }

  const maxCapacity = zoneAny.capacity?.maximum || 0
  const status = currentOccupancy >= maxCapacity ? 'full' : 'active'

  const { data, error } = await supabase
    .from('safe_zones')
    .update({
      capacity: {
        current: currentOccupancy,
        maximum: maxCapacity,
        hasReachedCapacity: currentOccupancy >= maxCapacity,
        percentageFull: maxCapacity > 0 ? (currentOccupancy / maxCapacity) * 100 : 0,
      },
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', safeZoneId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating safe zone capacity:', error)
    throw new Error(`Failed to update safe zone capacity: ${error.message}`)
  }

  return mapSafeZoneFromDB(data)
}

/**
 * Checks in a user to a safe zone
 */
export async function checkInToSafeZone(
  safeZoneId: string,
  userId: string
): Promise<SafeZoneCheckIn> {
  const supabase = createClient()

  // Check if already checked in
  const { data: existingCheckIn } = await supabase
    .from('safe_zone_check_ins')
    .select('*')
    .eq('safe_zone_id', safeZoneId)
    .eq('user_id', userId)
    .eq('status', 'checked_in')
    .single()

  if (existingCheckIn) {
    throw new Error('User is already checked in to this safe zone')
  }

  // Check out from any other safe zone
  await supabase
    .from('safe_zone_check_ins')
    .update({ status: 'checked_out', timestamp: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'checked_in')

  const { data, error } = await supabase
    .from('safe_zone_check_ins')
    .insert({
      safe_zone_id: safeZoneId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      status: 'checked_in',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error checking in to safe zone:', error)
    throw new Error(`Failed to check in: ${error.message}`)
  }

  // Update capacity
  const { count } = await supabase
    .from('safe_zone_check_ins')
    .select('*', { count: 'exact' })
    .eq('safe_zone_id', safeZoneId)
    .eq('status', 'checked_in')

  await updateSafeZoneCapacity(safeZoneId, count || 0)

  return {
    id: data.id as string,
    safeZoneId: data.safe_zone_id as string,
    userId: data.user_id as string,
    timestamp: data.timestamp as string,
    status: data.status as 'checked_in' | 'checked_out',
  }
}

/**
 * Checks out a user from a safe zone
 */
export async function checkOutFromSafeZone(
  safeZoneId: string,
  userId: string,
  notes?: string
): Promise<SafeZoneCheckIn> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('safe_zone_check_ins')
    .update({
      status: 'checked_out',
      timestamp: new Date().toISOString(),
      notes: notes || null,
    })
    .eq('safe_zone_id', safeZoneId)
    .eq('user_id', userId)
    .eq('status', 'checked_in')
    .select('*')
    .single()

  if (error) {
    console.error('Error checking out from safe zone:', error)
    throw new Error(`Failed to check out: ${error.message}`)
  }

  // Update capacity
  const { count } = await supabase
    .from('safe_zone_check_ins')
    .select('*', { count: 'exact' })
    .eq('safe_zone_id', safeZoneId)
    .eq('status', 'checked_in')

  await updateSafeZoneCapacity(safeZoneId, count || 0)

  return {
    id: data.id as string,
    safeZoneId: data.safe_zone_id as string,
    userId: data.user_id as string,
    timestamp: data.timestamp as string,
    status: data.status as 'checked_in' | 'checked_out',
    notes: (data.notes as string) || undefined,
  }
}

/**
 * Gets user's current safe zone check-in
 */
export async function getUserCheckIn(userId: string): Promise<SafeZoneCheckIn | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('safe_zone_check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'checked_in')
    .single()

  if (error) {
    console.error('Error fetching user check-in:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id as string,
    safeZoneId: data.safe_zone_id as string,
    userId: data.user_id as string,
    timestamp: data.timestamp as string,
    status: data.status as 'checked_in' | 'checked_out',
  }
}

/**
 * Creates a review for a safe zone
 */
export async function reviewSafeZone(
  safeZoneId: string,
  userId: string,
  rating: number,
  comment?: string,
  categories?: Record<string, number>
): Promise<SafeZoneReview> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('safe_zone_reviews')
    .insert({
      safe_zone_id: safeZoneId,
      user_id: userId,
      rating: Math.min(5, Math.max(1, rating)),
      comment: comment || null,
      categories: categories || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating safe zone review:', error)
    throw new Error(`Failed to create review: ${error.message}`)
  }

  return {
    id: data.id as string,
    safeZoneId: data.safe_zone_id as string,
    userId: data.user_id as string,
    rating: data.rating as number,
    comment: data.comment as string | undefined,
    categories: data.categories as Record<string, number> | undefined,
    createdAt: data.created_at as string,
  }
}

/**
 * Gets reviews for a safe zone
 */
export async function getSafeZoneReviews(
  safeZoneId: string,
  limit: number = 10
): Promise<SafeZoneReview[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('safe_zone_reviews')
    .select('*')
    .eq('safe_zone_id', safeZoneId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching safe zone reviews:', error)
    return []
  }

  return (data || []).map(item => ({
    id: (item as any).id,
    safeZoneId: (item as any).safe_zone_id,
    userId: (item as any).user_id,
    rating: (item as any).rating,
    comment: (item as any).comment || undefined,
    categories: (item as any).categories || undefined,
    createdAt: (item as any).created_at,
  }))
}

/**
 * Gets average rating for a safe zone
 */
export async function getSafeZoneAverageRating(
  safeZoneId: string
): Promise<{ average: number; count: number }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('safe_zone_reviews')
    .select('rating')
    .eq('safe_zone_id', safeZoneId)

  if (error) {
    console.error('Error calculating average rating:', error)
    return { average: 0, count: 0 }
  }

  const ratings = data || []
  const count = ratings.length
  const average = count > 0
    ? ratings.reduce((sum, r) => sum + (r as any).rating, 0) / count
    : 0

  return { average: Math.round(average * 10) / 10, count }
}

/**
 * Bookmarks a safe zone
 */
export async function bookmarkSafeZone(
  safeZoneId: string,
  userId: string
): Promise<SafeZoneBookmark> {
  const supabase = createClient()

  // Check if already bookmarked
  const { data: existing } = await supabase
    .from('safe_zone_bookmarks')
    .select('*')
    .eq('safe_zone_id', safeZoneId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    return {
      id: existing.id as string,
      safeZoneId: existing.safe_zone_id as string,
      userId: existing.user_id as string,
      createdAt: existing.created_at as string,
    }
  }

  const { data, error } = await supabase
    .from('safe_zone_bookmarks')
    .insert({
      safe_zone_id: safeZoneId,
      user_id: userId,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error bookmarking safe zone:', error)
    throw new Error(`Failed to bookmark: ${error.message}`)
  }

  return {
    id: data.id as string,
    safeZoneId: data.safe_zone_id as string,
    userId: data.user_id as string,
    createdAt: data.created_at as string,
  }
}

/**
 * Gets user's bookmarked safe zones
 */
export async function getBookmarkedSafeZones(userId: string): Promise<SafeZone[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('safe_zone_bookmarks')
    .select('safe_zones(*)')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching bookmarked safe zones:', error)
    return []
  }

  return (data || [])
    .map(item => (item as any).safe_zones)
    .filter(Boolean)
    .map(zone => mapSafeZoneFromDB(zone as Record<string, unknown>))
}

/**
 * Removes a safe zone bookmark
 */
export async function unbookmarkSafeZone(
  safeZoneId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('safe_zone_bookmarks')
    .delete()
    .eq('safe_zone_id', safeZoneId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error removing bookmark:', error)
    return false
  }

  return true
}

/**
 * Searches safe zones by name or address
 */
export async function searchSafeZones(
  query: string,
  options?: {
    municipality?: string
    type?: SafeZoneType
    limit?: number
  }
): Promise<SafeZone[]> {
  const supabase = createClient()

  let dbQuery = supabase
    .from('safe_zones')
    .select('*')
    .eq('status', 'active')
    .ilike('name', `%${query}%`)

  if (options?.municipality) {
    dbQuery = dbQuery.ilike('municipality', `%${options.municipality}%`)
  }

  if (options?.type) {
    dbQuery = dbQuery.eq('type', options.type)
  }

  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit)
  }

  const { data, error } = await dbQuery.order('name', { ascending: true })

  if (error) {
    console.error('Error searching safe zones:', error)
    return []
  }

  return (data || []).map(mapSafeZoneFromDB)
}

/**
 * Gets summary statistics for safe zones
 */
export async function getSafeZoneStats(): Promise<{
  totalActive: number
  byType: Record<SafeZoneType, number>
  byMunicipality: Record<string, number>
  totalCheckedIn: number
}> {
  const supabase = createClient()

  // Get all active safe zones
  const { data: zones } = await supabase
    .from('safe_zones')
    .select('*')
    .eq('status', 'active')

  // Get check-in count
  const { count: checkedInCount } = await supabase
    .from('safe_zone_check_ins')
    .select('*', { count: 'exact' })
    .eq('status', 'checked_in')

  const stats: {
    totalActive: number
    byType: Record<SafeZoneType, number>
    byMunicipality: Record<string, number>
    totalCheckedIn: number
  } = {
    totalActive: zones?.length || 0,
    byType: {} as Record<SafeZoneType, number>,
    byMunicipality: {},
    totalCheckedIn: checkedInCount || 0,
  }

  for (const zone of zones || []) {
    const zoneType = (zone as any).type as SafeZoneType
    const zoneMunicipality = (zone as any).municipality as string
    
    // Count by type
    stats.byType[zoneType] =
      (stats.byType[zoneType] || 0) + 1
    // Count by municipality
    stats.byMunicipality[zoneMunicipality] =
      (stats.byMunicipality[zoneMunicipality] || 0) + 1
  }

  return stats
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to SafeZone
 */
function mapSafeZoneFromDB(data: Record<string, unknown>): SafeZone {
  return {
    id: data.id as string,
    externalId: data.external_id as string | undefined,
    name: data.name as string,
    description: data.description as string | undefined,
    type: data.type as SafeZoneType,
    status: data.status as SafeZoneStatus,
    latitude: data.latitude as number,
    longitude: data.longitude as number,
    address: data.address as string,
    municipality: data.municipality as string,
    parish: data.parish as string | undefined,
    capacity: data.capacity as CapacityInfo | undefined,
    operatingHours: data.operating_hours as OperatingHours | undefined,
    accessibility: data.accessibility as SafeZoneAccessibility,
    services: data.services as SafeZoneService[],
    contact: data.contact as SafeZoneContact | undefined,
    isVerified: data.is_verified as boolean,
    isTemporary: data.is_temporary as boolean,
    temporaryUntil: data.temporary_until as string | undefined,
    source: data.source as string | undefined,
    lastVerifiedAt: data.last_verified_at as string | undefined,
    notes: data.notes as string | undefined,
    imageUrl: data.image_url as string | undefined,
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
