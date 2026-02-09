import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Community alert status
 */
export type CommunityAlertStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'dismissed'
  | 'escalated'
  | 'published'

/**
 * Community alert priority (user-assigned)
 */
export type CommunityAlertPriority = 'low' | 'normal' | 'high' | 'critical'

/**
 * Alert source type
 */
export type AlertSourceType =
  | 'user'
  | 'community_member'
  | 'verified_reporter'
  | 'authorities'
  | 'automatic'
  | 'integration'

/**
 * Verification status
 */
export type VerificationStatus =
  | 'unverified'
  | 'pending_verification'
  | 'verified'
  | 'discredited'

/**
 * Community alert entry
 */
export interface CommunityAlert {
  id: string
  externalId?: string
  
  // Content
  title: string
  description: string
  category: string
  subcategory?: string
  
  // Location
  latitude: number
  longitude: number
  address?: string
  municipality?: string
  parish?: string
  
  // Source
  sourceType: AlertSourceType
  sourceId?: string
  sourceName?: string
  reporterId?: string
  
  // Status and priority
  status: CommunityAlertStatus
  priority: CommunityAlertPriority
  verificationStatus: VerificationStatus
  
  // Media
  mediaUrls?: string[]
  mediaCount: number
  
  // Impact information
  impactRadius?: number
  affectedPeople?: number
  estimatedDuration?: string
  
  // Timestamps
  incidentTime: string
  expiresAt?: string
  
  // Verification
  verifiedBy?: string
  verifiedAt?: string
  verificationNotes?: string
  
  // Moderation
  moderatedBy?: string
  moderatedAt?: string
  moderationNotes?: string
  
  // Escalation
  escalatedTo?: string
  escalatedAt?: string
  
  // Cross-references
  relatedAlertIds?: string[]
  parentAlertId?: string
  
  // Engagement metrics
  viewCount: number
  confirmationCount: number
  denialCount: number
  
  createdAt: string
  updatedAt: string
}

/**
 * Alert confirmation/denial (crowdsourced verification)
 */
export interface AlertConfirmation {
  id: string
  alertId: string
  userId: string
  action: 'confirmed' | 'denied' | 'help_needed'
  notes?: string
  distance?: number
  createdAt: string
}

/**
 * Alert comment
 */
export interface AlertComment {
  id: string
  alertId: string
  userId: string
  content: string
  isOfficial: boolean
  parentCommentId?: string
  createdAt: string
  updatedAt: string
}

/**
 * Alert subscription (for updates)
 */
export interface AlertSubscription {
  id: string
  alertId: string
  userId: string
  createdAt: string
}

/**
 * Alert vote (for quality/relevance)
 */
export interface AlertVote {
  id: string
  alertId: string
  userId: string
  voteType: 'up' | 'down'
  createdAt: string
}

/**
 * Input for creating a community alert
 */
export interface CreateCommunityAlertInput {
  title: string
  description: string
  category: string
  subcategory?: string
  latitude: number
  longitude: number
  address?: string
  municipality?: string
  parish?: string
  sourceType?: AlertSourceType
  sourceName?: string
  priority?: CommunityAlertPriority
  incidentTime?: string
  expiresAt?: string
  mediaUrls?: string[]
  impactRadius?: number
  affectedPeople?: number
}

/**
 * Alert filter options
 */
export interface AlertFilterOptions {
  categories?: string[]
  status?: CommunityAlertStatus[]
  priority?: CommunityAlertPriority[]
  municipality?: string
  dateFrom?: string
  dateTo?: string
  sourceType?: AlertSourceType[]
  verified?: boolean
  radius?: number
  centerLat?: number
  centerLon?: number
  limit?: number
  offset?: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating a community alert
 */
export const createCommunityAlertSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  municipality: z.string().optional(),
  parish: z.string().optional(),
  sourceType: z.enum(['user', 'community_member', 'verified_reporter', 'authorities', 'automatic', 'integration']).optional(),
  sourceName: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  incidentTime: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  impactRadius: z.number().positive().optional(),
  affectedPeople: z.number().positive().optional(),
})

/**
 * Schema for alert filter
 */
export const alertFilterSchema = z.object({
  categories: z.array(z.string()).optional(),
  status: z.array(z.enum(['pending', 'under_review', 'verified', 'dismissed', 'escalated', 'published'])).optional(),
  priority: z.array(z.enum(['low', 'normal', 'high', 'critical'])).optional(),
  municipality: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sourceType: z.array(z.enum(['user', 'community_member', 'verified_reporter', 'authorities', 'automatic', 'integration'])).optional(),
  verified: z.boolean().optional(),
  radius: z.number().positive().optional(),
  centerLat: z.number().min(-90).max(90).optional(),
  centerLon: z.number().min(-180).max(180).optional(),
  limit: z.number().positive().max(100).optional(),
  offset: z.number().nonnegative().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for alert status
 */
export function getAlertStatusDisplayName(status: CommunityAlertStatus): string {
  const names: Record<CommunityAlertStatus, string> = {
    pending: 'Pending Review',
    under_review: 'Under Review',
    verified: 'Verified',
    dismissed: 'Dismissed',
    escalated: 'Escalated',
    published: 'Published',
  }
  return names[status]
}

/**
 * Gets color for alert status
 */
export function getAlertStatusColor(status: CommunityAlertStatus): string {
  const colors: Record<CommunityAlertStatus, string> = {
    pending: 'bg-yellow-500',
    under_review: 'bg-blue-500',
    verified: 'bg-green-500',
    dismissed: 'bg-gray-500',
    escalated: 'bg-orange-500',
    published: 'bg-purple-500',
  }
  return colors[status]
}

/**
 * Gets display name for priority
 */
export function getPriorityDisplayName(priority: CommunityAlertPriority): string {
  const names: Record<CommunityAlertPriority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    critical: 'Critical',
  }
  return names[priority]
}

/**
 * Gets color for priority
 */
export function getPriorityColor(priority: CommunityAlertPriority): string {
  const colors: Record<CommunityAlertPriority, string> = {
    low: 'bg-gray-400',
    normal: 'bg-blue-500',
    high: 'bg-orange-500',
    critical: 'bg-red-600',
  }
  return colors[priority]
}

/**
 * Gets display name for source type
 */
export function getSourceTypeDisplayName(sourceType: AlertSourceType): string {
  const names: Record<AlertSourceType, string> = {
    user: 'User',
    community_member: 'Community Member',
    verified_reporter: 'Verified Reporter',
    authorities: 'Authorities',
    automatic: 'Automatic',
    integration: 'Integration',
  }
  return names[sourceType]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a new community alert
 */
export async function createCommunityAlert(
  reporterId: string,
  input: CreateCommunityAlertInput
): Promise<CommunityAlert> {
  const validationResult = createCommunityAlertSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid community alert: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_alerts')
    .insert({
      title: input.title,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory || null,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address || null,
      municipality: input.municipality || null,
      parish: input.parish || null,
      source_type: input.sourceType || 'user',
      source_name: input.sourceName || null,
      reporter_id: reporterId,
      status: 'pending',
      priority: input.priority || 'normal',
      verification_status: 'unverified',
      media_urls: input.mediaUrls || [],
      media_count: (input.mediaUrls || []).length,
      incident_time: input.incidentTime || new Date().toISOString(),
      expires_at: input.expiresAt || null,
      impact_radius: input.impactRadius || null,
      affected_people: input.affectedPeople || null,
      view_count: 0,
      confirmation_count: 0,
      denial_count: 0,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating community alert:', error)
    throw new Error(`Failed to create community alert: ${error.message}`)
  }

  return mapCommunityAlertFromDB(data)
}

/**
 * Gets a community alert by ID
 */
export async function getCommunityAlert(
  alertId: string
): Promise<CommunityAlert | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_alerts')
    .select('*')
    .eq('id', alertId)
    .single()

  if (error) {
    console.error('Error fetching community alert:', error)
    return null
  }

  if (!data) {
    return null
  }

  // Increment view count
  await supabase
    .from('community_alerts')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', alertId)

  return mapCommunityAlertFromDB(data)
}

/**
 * Gets community alerts with filters
 */
export async function getCommunityAlerts(
  filters?: AlertFilterOptions
): Promise<CommunityAlert[]> {
  const supabase = createClient()

  let query = supabase
    .from('community_alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.categories && filters.categories.length > 0) {
    query = query.in('category', filters.categories)
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority)
  }

  if (filters?.municipality) {
    query = query.eq('municipality', filters.municipality)
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  if (filters?.sourceType && filters.sourceType.length > 0) {
    query = query.in('source_type', filters.sourceType)
  }

  if (filters?.verified !== undefined) {
    query = query.eq('verification_status', filters.verified ? 'verified' : 'unverified')
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching community alerts:', error)
    return []
  }

  let alerts = (data || []).map(mapCommunityAlertFromDB)

  // Filter by radius if specified
  if (filters?.radius && filters.centerLat && filters.centerLon) {
    alerts = alerts.filter(alert => {
      const distance = calculateDistance(
        { latitude: filters.centerLat!, longitude: filters.centerLon! },
        { latitude: alert.latitude, longitude: alert.longitude }
      )
      return distance <= filters.radius!
    })
  }

  return alerts
}

/**
 * Updates community alert status
 */
export async function updateCommunityAlertStatus(
  alertId: string,
  status: CommunityAlertStatus,
  moderatorId: string,
  notes?: string
): Promise<CommunityAlert> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_alerts')
    .update({
      status,
      moderated_by: moderatorId,
      moderated_at: new Date().toISOString(),
      moderation_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating community alert status:', error)
    throw new Error(`Failed to update alert status: ${error.message}`)
  }

  return mapCommunityAlertFromDB(data)
}

/**
 * Verifies a community alert
 */
export async function verifyCommunityAlert(
  alertId: string,
  verifierId: string,
  notes?: string
): Promise<CommunityAlert> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_alerts')
    .update({
      verification_status: 'verified',
      verified_by: verifierId,
      verified_at: new Date().toISOString(),
      verification_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select('*')
    .single()

  if (error) {
    console.error('Error verifying community alert:', error)
    throw new Error(`Failed to verify alert: ${error.message}`)
  }

  return mapCommunityAlertFromDB(data)
}

/**
 * Escalates a community alert
 */
export async function escalateCommunityAlert(
  alertId: string,
  escalationTarget: string,
  escalatorId: string,
  reason?: string
): Promise<CommunityAlert> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_alerts')
    .update({
      status: 'escalated',
      escalated_to: escalationTarget,
      escalated_at: new Date().toISOString(),
      moderation_notes: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select('*')
    .single()

  if (error) {
    console.error('Error escalating community alert:', error)
    throw new Error(`Failed to escalate alert: ${error.message}`)
  }

  return mapCommunityAlertFromDB(data)
}

/**
 * Confirms or denies an alert (crowdsourced verification)
 */
export async function confirmAlert(
  alertId: string,
  userId: string,
  action: 'confirmed' | 'denied' | 'help_needed',
  notes?: string
): Promise<AlertConfirmation> {
  const supabase = createClient()

  // Check for existing confirmation
  const { data: existing } = await supabase
    .from('alert_confirmations')
    .select('*')
    .eq('alert_id', alertId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('alert_confirmations')
      .update({
        action,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating confirmation:', error)
      throw new Error(`Failed to update confirmation: ${error.message}`)
    }

    await updateConfirmationCounts(alertId)
    return mapConfirmationFromDB(data)
  }

  // Create new confirmation
  const { data, error } = await supabase
    .from('alert_confirmations')
    .insert({
      alert_id: alertId,
      user_id: userId,
      action,
      notes: notes || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating confirmation:', error)
    throw new Error(`Failed to create confirmation: ${error.message}`)
  }

  await updateConfirmationCounts(alertId)
  return mapConfirmationFromDB(data)
}

/**
 * Adds a comment to an alert
 */
export async function addAlertComment(
  alertId: string,
  userId: string,
  content: string,
  parentCommentId?: string,
  isOfficial: boolean = false
): Promise<AlertComment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('alert_comments')
    .insert({
      alert_id: alertId,
      user_id: userId,
      content,
      parent_comment_id: parentCommentId || null,
      is_official: isOfficial,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    throw new Error(`Failed to add comment: ${error.message}`)
  }

  return {
    id: data.id,
    alertId: data.alert_id,
    userId: data.user_id,
    content: data.content,
    isOfficial: data.is_official,
    parentCommentId: data.parent_comment_id || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Gets comments for an alert
 */
export async function getAlertComments(
  alertId: string,
  limit: number = 50
): Promise<AlertComment[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('alert_comments')
    .select('*')
    .eq('alert_id', alertId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  // Fetch replies for each comment
  const comments: AlertComment[] = []
  for (const comment of data || []) {
    const { data: replies } = await supabase
      .from('alert_comments')
      .select('*')
      .eq('parent_comment_id', comment.id)
      .order('created_at', { ascending: true })

    comments.push({
      id: comment.id,
      alertId: comment.alert_id,
      userId: comment.user_id,
      content: comment.content,
      isOfficial: comment.is_official,
      parentCommentId: comment.parent_comment_id || undefined,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    })

    // Add replies
    for (const reply of replies || []) {
      comments.push({
        id: reply.id,
        alertId: reply.alert_id,
        userId: reply.user_id,
        content: reply.content,
        isOfficial: reply.is_official,
        parentCommentId: reply.parent_comment_id || undefined,
        createdAt: reply.created_at,
        updatedAt: reply.updated_at,
      })
    }
  }

  return comments
}

/**
 * Subscribes a user to alert updates
 */
export async function subscribeToAlert(
  alertId: string,
  userId: string
): Promise<AlertSubscription> {
  const supabase = createClient()

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('alert_subscriptions')
    .select('*')
    .eq('alert_id', alertId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    return {
      id: existing.id,
      alertId: existing.alert_id,
      userId: existing.user_id,
      createdAt: existing.created_at,
    }
  }

  const { data, error } = await supabase
    .from('alert_subscriptions')
    .insert({
      alert_id: alertId,
      user_id: userId,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error subscribing to alert:', error)
    throw new Error(`Failed to subscribe: ${error.message}`)
  }

  return {
    id: data.id,
    alertId: data.alert_id,
    userId: data.user_id,
    createdAt: data.created_at,
  }
}

/**
 * Unsubscribes a user from alert updates
 */
export async function unsubscribeFromAlert(
  alertId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('alert_subscriptions')
    .delete()
    .eq('alert_id', alertId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error unsubscribing from alert:', error)
    return false
  }

  return true
}

/**
 * Gets user's alert subscriptions
 */
export async function getUserSubscriptions(
  userId: string
): Promise<CommunityAlert[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('alert_subscriptions')
    .select('community_alerts(*)')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching subscriptions:', error)
    return []
  }

  return (data || [])
    .map(item => item.community_alerts)
    .filter(Boolean)
    .map(mapCommunityAlertFromDB)
}

/**
 * Votes on an alert
 */
export async function voteOnAlert(
  alertId: string,
  userId: string,
  voteType: 'up' | 'down'
): Promise<AlertVote> {
  const supabase = createClient()

  // Check for existing vote
  const { data: existing } = await supabase
    .from('alert_votes')
    .select('*')
    .eq('alert_id', alertId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    if (existing.vote_type === voteType) {
      // Remove vote if same
      await supabase
        .from('alert_votes')
        .delete()
        .eq('id', existing.id)

      await updateVoteScore(alertId)
      return {
        id: existing.id,
        alertId: existing.alert_id,
        userId: existing.user_id,
        voteType: existing.vote_type,
        createdAt: existing.created_at,
      }
    }

    // Update vote
    const { data, error } = await supabase
      .from('alert_votes')
      .update({ vote_type: voteType })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating vote:', error)
      throw new Error(`Failed to update vote: ${error.message}`)
    }

    await updateVoteScore(alertId)
    return {
      id: data.id,
      alertId: data.alert_id,
      userId: data.user_id,
      voteType: data.vote_type,
      createdAt: data.created_at,
    }
  }

  // Create new vote
  const { data, error } = await supabase
    .from('alert_votes')
    .insert({
      alert_id: alertId,
      user_id: userId,
      vote_type: voteType,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating vote:', error)
    throw new Error(`Failed to create vote: ${error.message}`)
  }

  await updateVoteScore(alertId)
  return {
    id: data.id,
    alertId: data.alert_id,
    userId: data.user_id,
    voteType: data.vote_type,
    createdAt: data.created_at,
  }
}

/**
 * Gets nearby alerts
 */
export async function getNearbyAlerts(
  latitude: number,
  longitude: number,
  radiusKm: number = 5,
  limit: number = 20
): Promise<CommunityAlert[]> {
  const alerts = await getCommunityAlerts({
    status: ['pending', 'under_review', 'verified', 'published'],
    radius: radiusKm * 1000,
    centerLat: latitude,
    centerLon: longitude,
    limit,
  })

  return alerts.sort((a, b) => {
    const distA = calculateDistance(
      { latitude, longitude },
      { latitude: a.latitude, longitude: a.longitude }
    )
    const distB = calculateDistance(
      { latitude, longitude },
      { latitude: b.latitude, longitude: b.longitude }
    )
    return distA - distB
  })
}

/**
 * Gets alert statistics
 */
export async function getAlertStats(): Promise<{
  totalAlerts: number
  pendingReview: number
  verified: number
  byCategory: Record<string, number>
  byMunicipality: Record<string, number>
}> {
  const supabase = createClient()

  const { data } = await supabase
    .from('community_alerts')
    .select('status, category, municipality')

  const stats = {
    totalAlerts: 0,
    pendingReview: 0,
    verified: 0,
    byCategory: {} as Record<string, number>,
    byMunicipality: {} as Record<string, number>,
  }

  for (const alert of data || []) {
    stats.totalAlerts++
    if (alert.status === 'pending' || alert.status === 'under_review') {
      stats.pendingReview++
    }
    if (alert.verification_status === 'verified') {
      stats.verified++
    }
    if (alert.category) {
      stats.byCategory[alert.category] = (stats.byCategory[alert.category] || 0) + 1
    }
    if (alert.municipality) {
      stats.byMunicipality[alert.municipality] = (stats.byMunicipality[alert.municipality] || 0) + 1
    }
  }

  return stats
}

/**
 * Searches alerts
 */
export async function searchAlerts(
  query: string,
  options?: {
    municipality?: string
    category?: string
    limit?: number
  }
): Promise<CommunityAlert[]> {
  const supabase = createClient()

  let dbQuery = supabase
    .from('community_alerts')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (options?.municipality) {
    dbQuery = dbQuery.eq('municipality', options.municipality)
  }

  if (options?.category) {
    dbQuery = dbQuery.eq('category', options.category)
  }

  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error searching alerts:', error)
    return []
  }

  return (data || []).map(mapCommunityAlertFromDB)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to CommunityAlert
 */
function mapCommunityAlertFromDB(data: Record<string, unknown>): CommunityAlert {
  return {
    id: data.id,
    externalId: data.external_id as string | undefined,
    title: data.title,
    description: data.description,
    category: data.category,
    subcategory: data.subcategory as string | undefined,
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address as string | undefined,
    municipality: data.municipality as string | undefined,
    parish: data.parish as string | undefined,
    sourceType: data.source_type as AlertSourceType,
    sourceId: data.source_id as string | undefined,
    sourceName: data.source_name as string | undefined,
    reporterId: data.reporter_id as string | undefined,
    status: data.status as CommunityAlertStatus,
    priority: data.priority as CommunityAlertPriority,
    verificationStatus: data.verification_status as VerificationStatus,
    mediaUrls: data.media_urls as string[] | undefined,
    mediaCount: data.media_count || 0,
    impactRadius: data.impact_radius as number | undefined,
    affectedPeople: data.affected_people as number | undefined,
    incidentTime: data.incident_time,
    expiresAt: data.expires_at as string | undefined,
    verifiedBy: data.verified_by as string | undefined,
    verifiedAt: data.verified_at as string | undefined,
    verificationNotes: data.verification_notes as string | undefined,
    moderatedBy: data.moderated_by as string | undefined,
    moderatedAt: data.moderated_at as string | undefined,
    moderationNotes: data.moderation_notes as string | undefined,
    escalatedTo: data.escalated_to as string | undefined,
    escalatedAt: data.escalated_at as string | undefined,
    relatedAlertIds: data.related_alert_ids as string[] | undefined,
    parentAlertId: data.parent_alert_id as string | undefined,
    viewCount: data.view_count || 0,
    confirmationCount: data.confirmation_count || 0,
    denialCount: data.denial_count || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Maps database record to AlertConfirmation
 */
function mapConfirmationFromDB(data: Record<string, unknown>): AlertConfirmation {
  return {
    id: data.id,
    alertId: data.alert_id,
    userId: data.user_id,
    action: data.action as 'confirmed' | 'denied' | 'help_needed',
    notes: data.notes as string | undefined,
    distance: data.distance as number | undefined,
    createdAt: data.created_at,
  }
}

/**
 * Updates confirmation counts for an alert
 */
async function updateConfirmationCounts(alertId: string): Promise<void> {
  const supabase = createClient()

  const { count: confirmations } = await supabase
    .from('alert_confirmations')
    .select('*', { count: 'exact' })
    .eq('alert_id', alertId)
    .eq('action', 'confirmed')

  const { count: denials } = await supabase
    .from('alert_confirmations')
    .select('*', { count: 'exact' })
    .eq('alert_id', alertId)
    .eq('action', 'denied')

  await supabase
    .from('community_alerts')
    .update({
      confirmation_count: confirmations || 0,
      denial_count: denials || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
}

/**
 * Updates vote score for an alert
 */
async function updateVoteScore(alertId: string): Promise<void> {
  const supabase = createClient()

  const { count: ups } = await supabase
    .from('alert_votes')
    .select('*', { count: 'exact' })
    .eq('alert_id', alertId)
    .eq('vote_type', 'up')

  const { count: downs } = await supabase
    .from('alert_votes')
    .select('*', { count: 'exact' })
    .eq('alert_id', alertId)
    .eq('vote_type', 'down')

  const score = (ups || 0) - (downs || 0)

  await supabase
    .from('community_alerts')
    .update({ vote_score: score })
    .eq('id', alertId)
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
