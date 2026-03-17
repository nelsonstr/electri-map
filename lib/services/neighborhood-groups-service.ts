import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type GroupVisibility = 'public' | 'private' | 'hidden'

export type GroupMembershipRole = 'admin' | 'moderator' | 'member'

export interface NeighborhoodGroup {
  id: string
  name: string
  description: string
  visibility: GroupVisibility
  
  // Location
  centerLatitude: number
  centerLongitude: number
  radius: number
  address?: string
  city?: string
  state?: string
  country?: string
  
  // Membership
  memberCount: number
  maxMembers?: number
  membershipType: 'open' | 'approval_required' | 'invite_only'
  
  // Features
  alertEnabled: boolean
  alertRadius: number
  features: {
    outages: boolean
    safetyAlerts: boolean
    communityEvents: boolean
    resourceSharing: boolean
    volunteerCoordination: boolean
  }
  
  // Moderation
  admins: string[]
  moderators: string[]
  
  // Verification
  isVerified: boolean
  verifiedAt?: string
  verifiedBy?: string
  
  // Branding
  coverImage?: string
  icon?: string
  color?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: GroupMembershipRole
  joinedAt: string
  notificationsEnabled: boolean
  lastActiveAt: string
}

export interface GroupInvitation {
  id: string
  groupId: string
  invitedEmail: string
  invitedBy: string
  role: GroupMembershipRole
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: string
  expiresAt: string
}

export interface CreateGroupInput {
  name: string
  description: string
  visibility?: GroupVisibility
  centerLatitude: number
  centerLongitude: number
  radius?: number
  address?: string
  city?: string
  state?: string
  country?: string
  maxMembers?: number
  membershipType?: 'open' | 'approval_required' | 'invite_only'
  alertRadius?: number
  features?: Partial<NeighborhoodGroup['features']>
}

export interface UpdateGroupInput {
  groupId: string
  name?: string
  description?: string
  visibility?: GroupVisibility
  radius?: number
  maxMembers?: number
  membershipType?: 'open' | 'approval_required' | 'invite_only'
  alertRadius?: number
  features?: Partial<NeighborhoodGroup['features']>
  coverImage?: string
  icon?: string
  color?: string
}

export interface JoinGroupInput {
  groupId: string
  userId: string
  message?: string
}

// ============================================================================
// Status Configuration
// ============================================================================

export const GROUP_VISIBILITY_CONFIG: Record<GroupVisibility, {
  label: string
  color: string
  description: string
}> = {
  public: { label: 'Public', color: '#22c55e', description: 'Anyone can find and join' },
  private: { label: 'Private', color: '#f59e0b', description: 'Visible but requires approval' },
  hidden: { label: 'Hidden', color: '#6b7280', description: 'Invite only, not searchable' },
}

export const GROUP_MEMBERSHIP_CONFIG: Record<GroupMembershipRole, {
  label: string
  color: string
  permissions: string[]
}> = {
  admin: { label: 'Admin', color: '#dc2626', permissions: ['manage_group', 'manage_members', 'manage_alerts', 'delete_group'] },
  moderator: { label: 'Moderator', color: '#ea580c', permissions: ['manage_members', 'manage_alerts'] },
  member: { label: 'Member', color: '#22c55e', permissions: ['view_content', 'post_alerts'] },
}

export const FEATURE_CONFIG = {
  outages: { label: 'Outage Tracking', icon: '⚡', description: 'Track and share power outages' },
  safetyAlerts: { label: 'Safety Alerts', icon: '🚨', description: 'Share safety notifications' },
  communityEvents: { label: 'Community Events', icon: '📅', description: 'Organize community events' },
  resourceSharing: { label: 'Resource Sharing', icon: '🤝', description: 'Share resources with neighbors' },
  volunteerCoordination: { label: 'Volunteer Coordination', icon: '👥', description: 'Coordinate volunteer efforts' },
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  visibility: z.enum(['public', 'private', 'hidden']).optional(),
  centerLatitude: z.number().min(-90).max(90),
  centerLongitude: z.number().min(-180).max(180),
  radius: z.number().positive().max(50000).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  maxMembers: z.number().positive().max(10000).optional(),
  membershipType: z.enum(['open', 'approval_required', 'invite_only']).optional(),
  alertRadius: z.number().positive().max(50000).optional(),
  features: z.object({
    outages: z.boolean().optional(),
    safetyAlerts: z.boolean().optional(),
    communityEvents: z.boolean().optional(),
    resourceSharing: z.boolean().optional(),
    volunteerCoordination: z.boolean().optional(),
  }).optional(),
})

export const updateGroupSchema = z.object({
  groupId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  visibility: z.enum(['public', 'private', 'hidden']).optional(),
  radius: z.number().positive().max(50000).optional(),
  maxMembers: z.number().positive().max(10000).optional(),
  membershipType: z.enum(['open', 'approval_required', 'invite_only']).optional(),
  alertRadius: z.number().positive().max(50000).optional(),
  features: z.object({
    outages: z.boolean().optional(),
    safetyAlerts: z.boolean().optional(),
    communityEvents: z.boolean().optional(),
    resourceSharing: z.boolean().optional(),
    volunteerCoordination: z.boolean().optional(),
  }).optional(),
  coverImage: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getVisibilityDisplayName(visibility: GroupVisibility): string {
  return GROUP_VISIBILITY_CONFIG[visibility]?.label || visibility
}

export function getVisibilityColor(visibility: GroupVisibility): string {
  return GROUP_VISIBILITY_CONFIG[visibility]?.color || '#6b7280'
}

export function getRoleDisplayName(role: GroupMembershipRole): string {
  return GROUP_MEMBERSHIP_CONFIG[role]?.label || role
}

export function getRoleColor(role: GroupMembershipRole): string {
  return GROUP_MEMBERSHIP_CONFIG[role]?.color || '#6b7280'
}

export function isUserInGroup(userId: string, group: NeighborhoodGroup): boolean {
  return group.admins.includes(userId) || group.moderators.includes(userId)
}

export function getUserRoleInGroup(userId: string, group: NeighborhoodGroup): GroupMembershipRole | null {
  if (group.admins.includes(userId)) return 'admin'
  if (group.moderators.includes(userId)) return 'moderator'
  return null
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createGroup(
  input: CreateGroupInput,
  userId: string
): Promise<NeighborhoodGroup> {
  const validationResult = createGroupSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const group: NeighborhoodGroup = {
    id: groupId,
    name: input.name,
    description: input.description,
    visibility: input.visibility || 'public',
    centerLatitude: input.centerLatitude,
    centerLongitude: input.centerLongitude,
    radius: input.radius || 5000,
    address: input.address,
    city: input.city,
    state: input.state,
    country: input.country,
    memberCount: 1,
    maxMembers: input.maxMembers,
    membershipType: input.membershipType || 'open',
    alertRadius: input.alertRadius || 5000,
    features: {
      outages: true,
      safetyAlerts: true,
      communityEvents: false,
      resourceSharing: false,
      volunteerCoordination: false,
      ...input.features,
    },
    admins: [userId],
    moderators: [],
    isVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('neighborhood_groups')
    .insert({
      id: groupId,
      name: input.name,
      description: input.description,
      visibility: input.visibility || 'public',
      center_latitude: input.centerLatitude,
      center_longitude: input.centerLongitude,
      radius: input.radius || 5000,
      address: input.address,
      city: input.city,
      state: input.state,
      country: input.country,
      member_count: 1,
      max_members: input.maxMembers,
      membership_type: input.membershipType || 'open',
      alert_radius: input.alertRadius || 5000,
      features: group.features,
      admins: [userId],
      moderators: [],
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating group:', error)
    throw new Error('Failed to create neighborhood group')
  }

  return group
}

export async function getGroup(groupId: string): Promise<NeighborhoodGroup | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('neighborhood_groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error || !data) return null

  return mapGroupFromDB(data)
}

export async function updateGroup(
  input: UpdateGroupInput,
  userId: string
): Promise<NeighborhoodGroup> {
  const validationResult = updateGroupSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const group = await getGroup(input.groupId)
  if (!group) {
    throw new Error('Group not found')
  }

  if (!group.admins.includes(userId)) {
    throw new Error('Only admins can update the group')
  }

  const updates: Partial<NeighborhoodGroup> = {
    updatedAt: new Date().toISOString(),
  }

  if (input.name) updates.name = input.name
  if (input.description) updates.description = input.description
  if (input.visibility) updates.visibility = input.visibility
  if (input.radius) updates.radius = input.radius
  if (input.maxMembers) updates.maxMembers = input.maxMembers
  if (input.membershipType) updates.membershipType = input.membershipType
  if (input.alertRadius) updates.alertRadius = input.alertRadius
  if (input.features) updates.features = { ...group.features, ...input.features }
  if (input.coverImage) updates.coverImage = input.coverImage
  if (input.icon) updates.icon = input.icon
  if (input.color) updates.color = input.color

  const { error } = await supabase
    .from('neighborhood_groups')
    .update({
      name: updates.name,
      description: updates.description,
      visibility: updates.visibility,
      radius: updates.radius,
      max_members: updates.maxMembers,
      membership_type: updates.membershipType,
      alert_radius: updates.alertRadius,
      features: updates.features,
      cover_image: updates.coverImage,
      icon: updates.icon,
      color: updates.color,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.groupId)

  if (error) {
    console.error('Error updating group:', error)
    throw new Error('Failed to update group')
  }

  return getGroup(input.groupId) as Promise<NeighborhoodGroup>
}

export async function joinGroup(
  input: JoinGroupInput,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  const group = await getGroup(input.groupId)
  if (!group) {
    return { success: false, message: 'Group not found' }
  }

  // Check if already a member
  if (isUserInGroup(userId, group)) {
    return { success: false, message: 'Already a member of this group' }
  }

  // Check membership limits
  if (group.maxMembers && group.memberCount >= group.maxMembers) {
    return { success: false, message: 'Group is at maximum capacity' }
  }

  if (group.membershipType === 'invite_only') {
    return { success: false, message: 'This group is invite only' }
  }

  if (group.membershipType === 'approval_required') {
    // Create a join request
    const { error } = await supabase
      .from('group_join_requests')
      .insert({
        group_id: input.groupId,
        user_id: userId,
        message: input.message,
        status: 'pending',
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error creating join request:', error)
      return { success: false, message: 'Failed to create join request' }
    }

    return { success: true, message: 'Join request submitted for approval' }
  }

  // Open membership - add directly
  const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { error } = await supabase
    .from('group_members')
    .insert({
      id: memberId,
      group_id: input.groupId,
      user_id: userId,
      role: 'member',
      joined_at: new Date().toISOString(),
      notifications_enabled: true,
      last_active_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error joining group:', error)
    return { success: false, message: 'Failed to join group' }
  }

  // Update member count
  await supabase
    .from('neighborhood_groups')
    .update({ member_count: group.memberCount + 1 })
    .eq('id', input.groupId)

  return { success: true, message: 'Successfully joined the group' }
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const supabase = createClient()

  const group = await getGroup(groupId)
  if (!group) {
    throw new Error('Group not found')
  }

  if (group.admins.includes(userId) && group.admins.length === 1) {
    throw new Error('Cannot leave - you are the only admin')
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error leaving group:', error)
    throw new Error('Failed to leave group')
  }

  // Update member count
  await supabase
    .from('neighborhood_groups')
    .update({ member_count: group.memberCount - 1 })
    .eq('id', groupId)
}

export async function searchGroups(
  latitude: number,
  longitude: number,
  radiusKm: number = 50,
  filters?: {
    visibility?: GroupVisibility[]
    features?: string[]
    minMembers?: number
  }
): Promise<NeighborhoodGroup[]> {
  const supabase = createClient()

  let query = supabase
    .from('neighborhood_groups')
    .select('*')
    .eq('visibility', 'public')

  if (filters?.minMembers) {
    query = query.gte('member_count', filters.minMembers)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error searching groups:', error)
    return []
  }

  let groups = (data || []).map(mapGroupFromDB)

  // Filter by radius
  groups = groups.filter(g => {
    const distance = calculateDistance(latitude, longitude, g.centerLatitude, g.centerLongitude)
    return distance <= radiusKm
  })

  // Filter by features
  if (filters?.features && filters.features.length > 0) {
    groups = groups.filter(g =>
      filters.features!.some(f => (g.features as Record<string, boolean>)[f])
    )
  }

  return groups
}

export async function getNearbyGroups(
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 25
): Promise<NeighborhoodGroup[]> {
  return searchGroups(latitude, longitude, maxDistanceKm)
}

export async function getUserGroups(userId: string): Promise<NeighborhoodGroup[]> {
  const supabase = createClient()

  const { data: memberships, error: membershipError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  if (membershipError) {
    console.error('Error fetching user groups:', membershipError)
    return []
  }

  if (!memberships || memberships.length === 0) {
    return []
  }

  const groupIds = memberships.map(m => m.group_id)

  const { data, error } = await supabase
    .from('neighborhood_groups')
    .select('*')
    .in('id', groupIds)

  if (error) {
    console.error('Error fetching groups:', error)
    return []
  }

  return (data || []).map(mapGroupFromDB)
}

export async function verifyGroup(groupId: string, verifiedBy: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('neighborhood_groups')
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
    })
    .eq('id', groupId)
}

export async function addGroupModerator(groupId: string, userId: string, adminId: string): Promise<void> {
  const supabase = createClient()

  const group = await getGroup(groupId)
  if (!group) {
    throw new Error('Group not found')
  }

  if (!group.admins.includes(adminId)) {
    throw new Error('Only admins can add moderators')
  }

  await supabase.rpc('add_group_moderator', {
    group_id: groupId,
    moderator_id: userId,
  })
}

export async function getGroupStats(groupId: string): Promise<{
  memberCount: number
  adminCount: number
  moderatorCount: number
  isFull: boolean
  age: number
  activityScore: number
}> {
  const group = await getGroup(groupId)
  if (!group) {
    throw new Error('Group not found')
  }

  const age = Math.floor(
    (new Date().getTime() - new Date(group.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    memberCount: group.memberCount,
    adminCount: group.admins.length,
    moderatorCount: group.moderators.length,
    isFull: group.maxMembers ? group.memberCount >= group.maxMembers : false,
    age,
    activityScore: 0, // Calculate based on recent activity
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapGroupFromDB(data: Record<string, unknown>): NeighborhoodGroup {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string,
    visibility: data.visibility as GroupVisibility,
    centerLatitude: data.center_latitude as number,
    centerLongitude: data.center_longitude as number,
    radius: data.radius as number,
    address: data.address as string | undefined,
    city: data.city as string | undefined,
    state: data.state as string | undefined,
    country: data.country as string | undefined,
    memberCount: data.member_count as number,
    maxMembers: data.max_members as number | undefined,
    membershipType: data.membership_type as string,
    alertRadius: data.alert_radius as number,
    features: data.features as NeighborhoodGroup['features'],
    admins: (data.admins as string[]) || [],
    moderators: (data.moderators as string[]) || [],
    isVerified: data.is_verified as boolean,
    verifiedAt: data.verified_at as string | undefined,
    verifiedBy: data.verified_by as string | undefined,
    coverImage: data.cover_image as string | undefined,
    icon: data.icon as string | undefined,
    color: data.color as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
