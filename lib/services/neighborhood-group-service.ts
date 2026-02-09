import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Group membership status
 */
export type MembershipStatus =
  | 'pending'
  | 'active'
  | 'suspended'
  | 'left'
  | 'removed'

/**
 * Group visibility
 */
export type GroupVisibility = 'public' | 'private' | 'restricted'

/**
 * Group type
 */
export type GroupType =
  | 'neighborhood'
  | 'street'
  | 'condo'
  | 'village'
  | 'district'
  | 'municipality'
  | 'custom'

/**
 * Member role
 */
export type MemberRole = 'owner' | 'admin' | 'moderator' | 'member'

/**
 * Post visibility
 */
export type PostVisibility = 'public' | 'members' | 'admins'

/**
 * Group entry
 */
export interface NeighborhoodGroup {
  id: string
  
  // Identity
  name: string
  description?: string
  type: GroupType
  visibility: GroupVisibility
  
  // Location
  municipality?: string
  parish?: string
  latitude?: number
  longitude?: number
  radius?: number
  address?: string
  
  // Settings
  isActive: boolean
  allowMemberPosts: boolean
  requirePostApproval: boolean
  allowResourceSharing: boolean
  
  // Branding
  coverImageUrl?: string
  iconUrl?: string
  
  // Statistics
  memberCount: number
  postCount: number
  
  // Metadata
  metadata?: Record<string, unknown>
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Group member
 */
export interface GroupMember {
  id: string
  groupId: string
  userId: string
  
  // Profile
  displayName?: string
  avatarUrl?: string
  
  // Membership
  role: MemberRole
  status: MembershipStatus
  
  // Preferences
  notificationsEnabled: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  
  // Activity
  lastActiveAt?: string
  joinedAt: string
  
  // Moderation
  bannedAt?: string
  banReason?: string
}

/**
 * Group post
 */
export interface GroupPost {
  id: string
  groupId: string
  authorId: string
  
  // Content
  title?: string
  content: string
  visibility: PostVisibility
  
  // Media
  mediaUrls?: string[]
  mediaCount: number
  
  // Type
  postType: 'announcement' | 'alert' | 'question' | 'resource' | 'event' | 'discussion'
  isPinned: boolean
  isEdited: boolean
  
  // Engagement
  likeCount: number
  commentCount: number
  
  // Moderation
  isHidden: boolean
  hiddenReason?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Post comment
 */
export interface PostComment {
  id: string
  postId: string
  authorId: string
  
  // Content
  content: string
  
  // Parent
  parentCommentId?: string
  
  // Engagement
  likeCount: number
  
  // Moderation
  isHidden: boolean
  
  createdAt: string
  updatedAt: string
}

/**
 * Group invitation
 */
export interface GroupInvitation {
  id: string
  groupId: string
  invitedEmail?: string
  invitedUserId?: string
  invitedBy: string
  
  // Status
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  
  // Message
  personalMessage?: string
  
  // Timestamps
  expiresAt?: string
  respondedAt?: string
  createdAt: string
}

/**
 * Group resource
 */
export interface GroupResource {
  id: string
  groupId: string
  authorId: string
  
  // Content
  title: string
  description?: string
  resourceType: 'tool' | 'information' | 'contact' | 'link' | 'document'
  url?: string
  
  // Category
  category?: string
  
  // Engagement
  viewCount: number
  likeCount: number
  
  createdAt: string
  updatedAt: string
}

/**
 * Create group input
 */
export interface CreateGroupInput {
  name: string
  description?: string
  type: GroupType
  visibility?: GroupVisibility
  municipality?: string
  parish?: string
  latitude?: number
  longitude?: number
  radius?: number
  address?: string
  coverImageUrl?: string
  iconUrl?: string
  allowMemberPosts?: boolean
  requirePostApproval?: boolean
  allowResourceSharing?: boolean
}

/**
 * Create post input
 */
export interface CreatePostInput {
  groupId: string
  title?: string
  content: string
  visibility?: PostVisibility
  postType?: 'announcement' | 'alert' | 'question' | 'resource' | 'event' | 'discussion'
  mediaUrls?: string[]
}

/**
 * Create comment input
 */
export interface CreateCommentInput {
  postId: string
  content: string
  parentCommentId?: string
}

/**
 * Group filter options
 */
export interface GroupFilterOptions {
  municipality?: string
  parish?: string
  type?: GroupType[]
  visibility?: GroupVisibility[]
  isActive?: boolean
  limit?: number
  offset?: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating a group
 */
export const createGroupSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['neighborhood', 'street', 'condo', 'village', 'district', 'municipality', 'custom']),
  visibility: z.enum(['public', 'private', 'restricted']).optional(),
  municipality: z.string().optional(),
  parish: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().positive().optional(),
  address: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  iconUrl: z.string().url().optional(),
  allowMemberPosts: z.boolean().optional(),
  requirePostApproval: z.boolean().optional(),
  allowResourceSharing: z.boolean().optional(),
})

/**
 * Schema for creating a post
 */
export const createPostSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(5000),
  visibility: z.enum(['public', 'members', 'admins']).optional(),
  postType: z.enum(['announcement', 'alert', 'question', 'resource', 'event', 'discussion']).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
})

/**
 * Schema for creating a comment
 */
export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentCommentId: z.string().uuid().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for group type
 */
export function getGroupTypeDisplayName(type: GroupType): string {
  const names: Record<GroupType, string> = {
    neighborhood: 'Neighborhood',
    street: 'Street',
    condo: 'Condominium',
    village: 'Village',
    district: 'District',
    municipality: 'Municipality',
    custom: 'Custom Group',
  }
  return names[type]
}

/**
 * Gets display name for visibility
 */
export function getVisibilityDisplayName(visibility: GroupVisibility): string {
  const names: Record<GroupVisibility, string> = {
    public: 'Public',
    private: 'Private',
    restricted: 'Restricted',
  }
  return names[visibility]
}

/**
 * Gets display name for membership status
 */
export function getMembershipStatusDisplayName(status: MembershipStatus): string {
  const names: Record<MembershipStatus, string> = {
    pending: 'Pending',
    active: 'Active',
    suspended: 'Suspended',
    left: 'Left',
    removed: 'Removed',
  }
  return names[status]
}

/**
 * Gets display name for member role
 */
export function getMemberRoleDisplayName(role: MemberRole): string {
  const names: Record<MemberRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    moderator: 'Moderator',
    member: 'Member',
  }
  return names[role]
}

/**
 * Gets display name for post type
 */
export function getPostTypeDisplayName(type: string): string {
  const names: Record<string, string> = {
    announcement: 'Announcement',
    alert: 'Alert',
    question: 'Question',
    resource: 'Resource',
    event: 'Event',
    discussion: 'Discussion',
  }
  return names[type] || type
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a new neighborhood group
 */
export async function createNeighborhoodGroup(
  ownerId: string,
  input: CreateGroupInput
): Promise<NeighborhoodGroup> {
  const validationResult = createGroupSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid group input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Create group
  const { data: group, error } = await supabase
    .from('neighborhood_groups')
    .insert({
      name: input.name,
      description: input.description || null,
      type: input.type,
      visibility: input.visibility || 'restricted',
      municipality: input.municipality || null,
      parish: input.parish || null,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      radius: input.radius || null,
      address: input.address || null,
      cover_image_url: input.coverImageUrl || null,
      icon_url: input.iconUrl || null,
      is_active: true,
      allow_member_posts: input.allowMemberPosts ?? true,
      require_post_approval: input.requirePostApproval ?? false,
      allow_resource_sharing: input.allowResourceSharing ?? true,
      member_count: 1,
      post_count: 0,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating group:', error)
    throw new Error(`Failed to create group: ${error.message}`)
  }

  // Add owner as member
  await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: ownerId,
      role: 'owner',
      status: 'active',
      notifications_enabled: true,
      email_notifications: true,
      push_notifications: true,
      joined_at: new Date().toISOString(),
    })

  return mapGroupFromDB(group)
}

/**
 * Gets a group by ID
 */
export async function getNeighborhoodGroup(
  groupId: string
): Promise<NeighborhoodGroup | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('neighborhood_groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error) {
    console.error('Error fetching group:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapGroupFromDB(data)
}

/**
 * Gets groups with filters
 */
export async function getNeighborhoodGroups(
  filters?: GroupFilterOptions
): Promise<NeighborhoodGroup[]> {
  const supabase = createClient()

  let query = supabase
    .from('neighborhood_groups')
    .select('*')
    .eq('is_active', true)
    .order('member_count', { ascending: false })

  if (filters?.municipality) {
    query = query.eq('municipality', filters.municipality)
  }

  if (filters?.parish) {
    query = query.eq('parish', filters.parish)
  }

  if (filters?.type && filters.type.length > 0) {
    query = query.in('type', filters.type)
  }

  if (filters?.visibility && filters.visibility.length > 0) {
    query = query.in('visibility', filters.visibility)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching groups:', error)
    return []
  }

  return (data || []).map(mapGroupFromDB)
}

/**
 * Gets groups near a location
 */
export async function getNearbyGroups(
  latitude: number,
  longitude: number,
  radiusKm: number = 5,
  limit: number = 10
): Promise<NeighborhoodGroup[]> {
  const groups = await getNeighborhoodGroups({ limit: 50 })

  return groups
    .filter(group => group.latitude && group.longitude)
    .filter(group => {
      const distance = calculateDistance(
        { latitude, longitude },
        { latitude: group.latitude!, longitude: group.longitude! }
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
    .slice(0, limit)
}

/**
 * Gets user's groups
 */
export async function getUserGroups(
  userId: string,
  status?: MembershipStatus[]
): Promise<NeighborhoodGroup[]> {
  const supabase = createClient()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .in('status', status || ['active'])

  if (!memberships || memberships.length === 0) {
    return []
  }

  const groupIds = memberships.map(m => m.group_id)

  const { data, error } = await supabase
    .from('neighborhood_groups')
    .select('*')
    .in('id', groupIds)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching user groups:', error)
    return []
  }

  return (data || []).map(mapGroupFromDB)
}

/**
 * Joins a group
 */
export async function joinGroup(
  groupId: string,
  userId: string
): Promise<GroupMember> {
  const supabase = createClient()

  // Check if group exists and is public or restricted
  const { data: group } = await supabase
    .from('neighborhood_groups')
    .select('visibility')
    .eq('id', groupId)
    .single()

  if (!group) {
    throw new Error('Group not found')
  }

  // Check for existing membership
  const { data: existing } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    if (existing.status === 'active') {
      throw new Error('Already a member')
    }
    // Reactivate membership
    const { data, error } = await supabase
      .from('group_members')
      .update({
        status: 'active',
        joined_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to rejoin: ${error.message}`)
    }

    await updateGroupMemberCount(groupId)
    return mapMemberFromDB(data)
  }

  // Create new membership
  const { data, error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
      status: group.visibility === 'public' ? 'active' : 'pending',
      notifications_enabled: true,
      email_notifications: true,
      push_notifications: true,
      joined_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error joining group:', error)
    throw new Error(`Failed to join: ${error.message}`)
  }

  if (group.visibility === 'public') {
    await updateGroupMemberCount(groupId)
  }

  return mapMemberFromDB(data)
}

/**
 * Leaves a group
 */
export async function leaveGroup(
  groupId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('group_members')
    .update({
      status: 'left',
      left_at: new Date().toISOString(),
    })
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('role', 'member') // Can't leave if owner

  if (error) {
    console.error('Error leaving group:', error)
    return false
  }

  await updateGroupMemberCount(groupId)
  return true
}

/**
 * Creates a post in a group
 */
export async function createGroupPost(
  authorId: string,
  input: CreatePostInput
): Promise<GroupPost> {
  const validationResult = createPostSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid post input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Check membership
  const { data: membership } = await supabase
    .from('group_members')
    .select('role, status')
    .eq('group_id', input.groupId)
    .eq('user_id', authorId)
    .single()

  if (!membership || membership.status !== 'active') {
    throw new Error('Not a member of this group')
  }

  const { data, error } = await supabase
    .from('group_posts')
    .insert({
      group_id: input.groupId,
      author_id: authorId,
      title: input.title || null,
      content: input.content,
      visibility: input.visibility || 'members',
      post_type: input.postType || 'discussion',
      media_urls: input.mediaUrls || [],
      media_count: (input.mediaUrls || []).length,
      is_pinned: false,
      is_hidden: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating post:', error)
    throw new Error(`Failed to create post: ${error.message}`)
  }

  // Update post count
  await supabase
    .from('neighborhood_groups')
    .update({ post_count: supabase.rpc('increment', { row_id: input.groupId, column: 'post_count' }) })
    .eq('id', input.groupId)

  return mapPostFromDB(data)
}

/**
 * Gets posts in a group
 */
export async function getGroupPosts(
  groupId: string,
  options?: {
    limit?: number
    before?: string
    postType?: string
  }
): Promise<GroupPost[]> {
  const supabase = createClient()

  let query = supabase
    .from('group_posts')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_hidden', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (options?.postType) {
    query = query.eq('post_type', options.postType)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.before) {
    query = query.lt('created_at', options.before)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return (data || []).map(mapPostFromDB)
}

/**
 * Gets a single post
 */
export async function getGroupPost(
  postId: string
): Promise<GroupPost | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('group_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapPostFromDB(data)
}

/**
 * Creates a comment on a post
 */
export async function createPostComment(
  authorId: string,
  input: CreateCommentInput
): Promise<PostComment> {
  const validationResult = createCommentSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid comment input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: input.postId,
      author_id: authorId,
      content: input.content,
      parent_comment_id: input.parentCommentId || null,
      is_hidden: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    throw new Error(`Failed to create comment: ${error.message}`)
  }

  return {
    id: data.id,
    postId: data.post_id,
    authorId: data.author_id,
    content: data.content,
    parentCommentId: data.parent_comment_id || undefined,
    likeCount: 0,
    isHidden: data.is_hidden,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Gets comments for a post
 */
export async function getPostComments(
  postId: string,
  limit: number = 50
): Promise<PostComment[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .eq('is_hidden', false)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  return (data || []).map(comment => ({
    id: comment.id,
    postId: comment.post_id,
    authorId: comment.author_id,
    content: comment.content,
    parentCommentId: comment.parent_comment_id || undefined,
    likeCount: 0,
    isHidden: comment.is_hidden,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  }))
}

/**
 * Invites a user to a group
 */
export async function inviteToGroup(
  groupId: string,
  inviterId: string,
  invitedEmail?: string,
  invitedUserId?: string,
  personalMessage?: string
): Promise<GroupInvitation> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('group_invitations')
    .insert({
      group_id: groupId,
      invited_email: invitedEmail || null,
      invited_user_id: invitedUserId || null,
      invited_by: inviterId,
      personal_message: personalMessage || null,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating invitation:', error)
    throw new Error(`Failed to create invitation: ${error.message}`)
  }

  return {
    id: data.id,
    groupId: data.group_id,
    invitedEmail: data.invited_email || undefined,
    invitedUserId: data.invited_user_id || undefined,
    invitedBy: data.invited_by,
    status: data.status,
    personalMessage: data.personal_message || undefined,
    expiresAt: data.expires_at || undefined,
    respondedAt: data.responded_at || undefined,
    createdAt: data.created_at,
  }
}

/**
 * Gets group statistics
 */
export async function getGroupStats(
  groupId: string
): Promise<{
  memberCount: number
  postCount: number
  activeToday: number
  newThisWeek: number
}> {
  const supabase = createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: group } = await supabase
    .from('neighborhood_groups')
    .select('member_count, post_count')
    .eq('id', groupId)
    .single()

  const { count: activeToday } = await supabase
    .from('group_members')
    .select('*', { count: 'exact' })
    .eq('group_id', groupId)
    .eq('status', 'active')
    .gte('last_active_at', today.toISOString())

  const { count: newThisWeek } = await supabase
    .from('group_members')
    .select('*', { count: 'exact' })
    .eq('group_id', groupId)
    .eq('status', 'active')
    .gte('joined_at', weekAgo.toISOString())

  return {
    memberCount: group?.member_count || 0,
    postCount: group?.post_count || 0,
    activeToday: activeToday || 0,
    newThisWeek: newThisWeek || 0,
  }
}

/**
 * Searches groups
 */
export async function searchGroups(
  query: string,
  options?: {
    municipality?: string
    type?: GroupType
    limit?: number
  }
): Promise<NeighborhoodGroup[]> {
  const supabase = createClient()

  let dbQuery = supabase
    .from('neighborhood_groups')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('is_active', true)
    .in('visibility', ['public', 'restricted'])
    .order('member_count', { ascending: false })

  if (options?.municipality) {
    dbQuery = dbQuery.eq('municipality', options.municipality)
  }

  if (options?.type) {
    dbQuery = dbQuery.eq('type', options.type)
  }

  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error searching groups:', error)
    return []
  }

  return (data || []).map(mapGroupFromDB)
}

/**
 * Updates group settings
 */
export async function updateGroupSettings(
  groupId: string,
  adminId: string,
  updates: Partial<CreateGroupInput>
): Promise<NeighborhoodGroup> {
  const supabase = createClient()

  // Check admin role
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', adminId)
    .in('role', ['owner', 'admin'])
    .single()

  if (!membership) {
    throw new Error('Not authorized')
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.visibility !== undefined) updateData.visibility = updates.visibility
  if (updates.allowMemberPosts !== undefined) updateData.allow_member_posts = updates.allowMemberPosts
  if (updates.requirePostApproval !== undefined) updateData.require_post_approval = updates.requirePostApproval
  if (updates.allowResourceSharing !== undefined) updateData.allow_resource_sharing = updates.allowResourceSharing

  const { data, error } = await supabase
    .from('neighborhood_groups')
    .update(updateData)
    .eq('id', groupId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating group:', error)
    throw new Error(`Failed to update: ${error.message}`)
  }

  return mapGroupFromDB(data)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to NeighborhoodGroup
 */
function mapGroupFromDB(data: Record<string, unknown>): NeighborhoodGroup {
  return {
    id: data.id,
    name: data.name,
    description: data.description as string | undefined,
    type: data.type as GroupType,
    visibility: data.visibility as GroupVisibility,
    municipality: data.municipality as string | undefined,
    parish: data.parish as string | undefined,
    latitude: data.latitude as number | undefined,
    longitude: data.longitude as number | undefined,
    radius: data.radius as number | undefined,
    address: data.address as string | undefined,
    isActive: data.is_active,
    allowMemberPosts: data.allow_member_posts,
    requirePostApproval: data.require_post_approval,
    allowResourceSharing: data.allow_resource_sharing,
    coverImageUrl: data.cover_image_url as string | undefined,
    iconUrl: data.icon_url as string | undefined,
    memberCount: data.member_count || 0,
    postCount: data.post_count || 0,
    metadata: data.metadata as Record<string, unknown> | undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Maps database record to GroupMember
 */
function mapMemberFromDB(data: Record<string, unknown>): GroupMember {
  return {
    id: data.id,
    groupId: data.group_id,
    userId: data.user_id,
    displayName: data.display_name as string | undefined,
    avatarUrl: data.avatar_url as string | undefined,
    role: data.role as MemberRole,
    status: data.status as MembershipStatus,
    notificationsEnabled: data.notifications_enabled,
    emailNotifications: data.email_notifications,
    pushNotifications: data.push_notifications,
    lastActiveAt: data.last_active_at as string | undefined,
    joinedAt: data.joined_at,
    bannedAt: data.banned_at as string | undefined,
    banReason: data.ban_reason as string | undefined,
  }
}

/**
 * Maps database record to GroupPost
 */
function mapPostFromDB(data: Record<string, unknown>): GroupPost {
  return {
    id: data.id,
    groupId: data.group_id,
    authorId: data.author_id,
    title: data.title as string | undefined,
    content: data.content,
    visibility: data.visibility as PostVisibility,
    mediaUrls: data.media_urls as string[] | undefined,
    mediaCount: data.media_count || 0,
    postType: data.post_type as 'announcement' | 'alert' | 'question' | 'resource' | 'event' | 'discussion',
    isPinned: data.is_pinned,
    isEdited: data.is_edited,
    likeCount: data.like_count || 0,
    commentCount: data.comment_count || 0,
    isHidden: data.is_hidden,
    hiddenReason: data.hidden_reason as string | undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Updates group member count
 */
async function updateGroupMemberCount(groupId: string): Promise<void> {
  const supabase = createClient()

  const { count } = await supabase
    .from('group_members')
    .select('*', { count: 'exact' })
    .eq('group_id', groupId)
    .eq('status', 'active')

  await supabase
    .from('neighborhood_groups')
    .update({
      member_count: count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupId)
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
