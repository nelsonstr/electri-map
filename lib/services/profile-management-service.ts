import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type ProfileVisibility = 'public' | 'community' | 'private'

export type NotificationFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'none'

export interface Profile {
  id: string
  userId: string
  
  // Basic Info
  displayName: string
  email: string
  phone?: string
  avatarUrl?: string
  bio?: string
  
  // Location
  location?: {
    city?: string
    state?: string
    country?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  
  // Preferences
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    frequency: NotificationFrequency
  }
  
  // Privacy
  visibility: ProfileVisibility
  showOnlineStatus: boolean
  
  // Emergency
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  
  // Verification
  isVerified: boolean
  verifiedAt?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileInput {
  displayName?: string
  phone?: string
  avatarUrl?: string
  bio?: string
  location?: Profile['location']
  language?: string
  timezone?: string
  notifications?: Partial<Profile['notifications']>
  visibility?: ProfileVisibility
  showOnlineStatus?: boolean
  emergencyContact?: Profile['emergencyContact']
}

export interface ProfileSearchFilters {
  searchQuery?: string
  location?: string
  language?: string
  verified?: boolean
  limit?: number
  offset?: number
}

export interface ProfileStatistics {
  totalProfiles: number
  verifiedProfiles: number
  activeToday: number
  profileCompleteness: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional(),
  }).optional(),
  language: z.string().length(2).optional(),
  timezone: z.string().optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    frequency: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'none']).optional(),
  }).optional(),
  visibility: z.enum(['public', 'community', 'private']).optional(),
  showOnlineStatus: z.boolean().optional(),
  emergencyContact: z.object({
    name: z.string().min(1),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    relationship: z.string().min(1),
  }).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getVisibilityDisplayName(visibility: ProfileVisibility): string {
  const names: Record<ProfileVisibility, string> = {
    public: 'Public',
    community: 'Community Members',
    private: 'Private',
  }
  return names[visibility]
}

export function getNotificationFrequencyDisplayName(frequency: NotificationFrequency): string {
  const names: Record<NotificationFrequency, string> = {
    realtime: 'Real-time',
    hourly: 'Hourly Digest',
    daily: 'Daily Digest',
    weekly: 'Weekly Digest',
    none: 'None',
  }
  return names[frequency]
}

export function calculateProfileCompleteness(profile: Partial<Profile>): number {
  const fields = [
    { key: 'displayName', weight: 15 },
    { key: 'avatarUrl', weight: 10 },
    { key: 'bio', weight: 10 },
    { key: 'phone', weight: 10 },
    { key: 'location', weight: 15 },
    { key: 'emergencyContact', weight: 15 },
    { key: 'notifications', weight: 10 },
    { key: 'language', weight: 5 },
    { key: 'timezone', weight: 5 },
    { key: 'timezone', weight: 5 },
  ]

  let totalWeight = 0
  let filledWeight = 0

  for (const field of fields) {
    totalWeight += field.weight
    if (field.key === 'location' && profile.location) {
      filledWeight += field.weight
    } else if (field.key === 'notifications' && profile.notifications) {
      filledWeight += field.weight
    } else if (field.key === 'timezone' && profile.timezone) {
      filledWeight += field.weight
    } else if (profile[field.key as keyof Profile]) {
      filledWeight += field.weight
    }
  }

  return Math.round((filledWeight / totalWeight) * 100)
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return mapProfileFromDB(data)
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<Profile> {
  const validationResult = updateProfileSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...(input.displayName !== undefined && { display_name: input.displayName }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.language !== undefined && { language: input.language }),
      ...(input.timezone !== undefined && { timezone: input.timezone }),
      ...(input.notifications !== undefined && { notifications: input.notifications }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      ...(input.showOnlineStatus !== undefined && { show_online_status: input.showOnlineStatus }),
      ...(input.emergencyContact !== undefined && { emergency_contact: input.emergencyContact }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error('Failed to update profile')
  }

  return mapProfileFromDB(data)
}

export async function deleteProfile(userId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error deleting profile:', error)
    throw new Error('Failed to delete profile')
  }
}

export async function searchProfiles(
  userId: string,
  filters: ProfileSearchFilters
): Promise<Profile[]> {
  const supabase = createClient()

  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .neq('id', userId)

  if (filters.searchQuery) {
    query = query.or(`display_name.ilike.%${filters.searchQuery}%,bio.ilike.%${filters.searchQuery}%`)
  }

  if (filters.location) {
    query = query.eq('location->>country', filters.location)
  }

  if (filters.language) {
    query = query.eq('language', filters.language)
  }

  if (filters.verified !== undefined) {
    query = query.eq('is_verified', filters.verified)
  }

  query = query
    .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1)
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error searching profiles:', error)
    return []
  }

  return (data || []).map(mapProfileFromDB)
}

export async function getPublicProfile(
  profileId: string
): Promise<Partial<Profile> | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id,display_name,avatar_url,bio,location,is_verified,visibility')
    .eq('id', profileId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  if (data.visibility === 'private') {
    return null
  }

  return {
    id: data.id as string,
    displayName: data.display_name as string,
    avatarUrl: (data.avatar_url as string) || undefined,
    bio: (data.bio as string) || undefined,
    location: (data.location as Profile['location']) || undefined,
    isVerified: data.is_verified as boolean,
  }
}

export async function updateAvatar(
  userId: string,
  avatarUrl: string
): Promise<string> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating avatar:', error)
    throw new Error('Failed to update avatar')
  }

  return avatarUrl
}

export async function updateEmergencyContact(
  userId: string,
  emergencyContact: Profile['emergencyContact']
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      emergency_contact: emergencyContact,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating emergency contact:', error)
    throw new Error('Failed to update emergency contact')
  }
}

export async function getProfileStatistics(): Promise<ProfileStatistics> {
  const supabase = createClient()

  const { count: totalProfiles } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: verifiedProfiles } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('is_verified', true)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: activeToday } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .gte('last_active_at', today.toISOString())

  return {
    totalProfiles: totalProfiles || 0,
    verifiedProfiles: verifiedProfiles || 0,
    activeToday: activeToday || 0,
    profileCompleteness: 0,
  }
}

export async function recordProfileActivity(userId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('profiles')
    .update({
      last_active_at: new Date().toISOString(),
    })
    .eq('id', userId)
}

export async function getNearbyProfiles(
  userId: string,
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  limit: number = 20
): Promise<Profile[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .rpc('get_nearby_profiles', {
      user_id: userId,
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm,
      limit_num: limit,
    })

  if (error) {
    console.error('Error getting nearby profiles:', error)
    return []
  }

  return ((data || []) as any[]).map(mapProfileFromDB)
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapProfileFromDB(data: Record<string, unknown>): Profile {
  return {
    id: data.id as string,
    userId: (data.user_id as string) || (data.id as string),
    displayName: data.display_name as string,
    email: data.email as string,
    phone: (data.phone as string) || undefined,
    avatarUrl: (data.avatar_url as string) || undefined,
    bio: (data.bio as string) || undefined,
    location: (data.location as Profile['location']) || undefined,
    language: (data.language as string) || 'en',
    timezone: (data.timezone as string) || 'UTC',
    notifications: (data.notifications as Profile['notifications']) || {
      email: true,
      push: true,
      sms: false,
      frequency: 'realtime',
    },
    visibility: (data.visibility as ProfileVisibility) || 'public',
    showOnlineStatus: (data.show_online_status as boolean) || false,
    emergencyContact: (data.emergency_contact as Profile['emergencyContact']) || undefined,
    isVerified: (data.is_verified as boolean) || false,
    verifiedAt: (data.verified_at as string) || undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
