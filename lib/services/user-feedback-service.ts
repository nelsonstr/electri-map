import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Feedback type
 */
export type FeedbackType =
  | 'bug_report'
  | 'feature_request'
  | 'improvement_suggestion'
  | 'general_feedback'
  | 'complaint'
  | 'praise'
  | 'experience_rating'

/**
 * Feedback status
 */
export type FeedbackStatus =
  | 'submitted'
  | 'acknowledged'
  | 'under_review'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'archived'

/**
 * Feedback priority
 */
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Experience category
 */
export type ExperienceCategory =
  | 'alert_accuracy'
  | 'response_time'
  | 'ease_of_use'
  | 'interface_design'
  | 'notification_quality'
  | 'map_accuracy'
  | 'community_features'
  | 'emergency_response'
  | 'overall_satisfaction'

/**
 * Feedback entry
 */
export interface Feedback {
  id: string
  userId?: string
  
  // Content
  type: FeedbackType
  category?: ExperienceCategory
  title: string
  description: string
  
  // Context
  pageUrl?: string
  deviceInfo?: DeviceInfo
  alertId?: string
  
  // Attachments
  attachments: string[]
  
  // Status
  status: FeedbackStatus
  priority: FeedbackPriority
  
  // Moderation
  flagged: boolean
  flagReason?: string
  
  // Response
  responseCount: number
  lastResponseAt?: string
  
  // Metadata
  tags: string[]
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Device information
 */
export interface DeviceInfo {
  userAgent?: string
  platform?: string
  language?: string
  timezone?: string
  appVersion?: string
}

/**
 * Experience rating
 */
export interface ExperienceRating {
  id: string
  userId: string
  
  // Context
  alertId?: string
  alertType?: string
  
  // Ratings (1-5)
  overallRating: number
  accuracyRating?: number
  timelinessRating?: number
  usefulnessRating?: number
  
  // Feedback
  comment?: string
  
  // Timestamps
  createdAt: string
}

/**
 * Feedback response
 */
interface FeedbackResponse {
  id: string
  feedbackId: string
  responderId: string
  responderType: 'user' | 'admin' | 'system'
  
  // Content
  message: string
  isInternal: boolean
  
  // Related
  parentResponseId?: string
  
  // Attachments
  attachments: string[]
  
  createdAt: string
}

/**
 * Feedback summary
 */
export interface FeedbackSummary {
  period: string
  
  // Counts
  totalFeedback: number
  byType: Record<FeedbackType, number>
  byStatus: Record<FeedbackStatus, number>
  
  // Ratings
  averageRating: number
  ratingDistribution: Record<number, number>
  
  // Trends
  trendDirection: 'up' | 'down' | 'stable'
  trendPercentage: number
  
  // Top issues
  topIssues: { type: FeedbackType; count: number }[]
}

/**
 * Create feedback input
 */
export interface CreateFeedbackInput {
  type: FeedbackType
  category?: ExperienceCategory
  title: string
  description: string
  pageUrl?: string
  deviceInfo?: DeviceInfo
  alertId?: string
  attachments?: string[]
  tags?: string[]
}

/**
 * Create rating input
 */
export interface CreateRatingInput {
  alertId?: string
  alertType?: string
  overallRating: number
  accuracyRating?: number
  timelinessRating?: number
  usefulnessRating?: number
  comment?: string
}

/**
 * Response input
 */
export interface CreateResponseInput {
  feedbackId: string
  message: string
  parentResponseId?: string
  attachments?: string[]
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating feedback
 */
export const createFeedbackSchema = z.object({
  type: z.enum([
    'bug_report', 'feature_request', 'improvement_suggestion',
    'general_feedback', 'complaint', 'praise', 'experience_rating'
  ]),
  category: z.enum([
    'alert_accuracy', 'response_time', 'ease_of_use', 'interface_design',
    'notification_quality', 'map_accuracy', 'community_features',
    'emergency_response', 'overall_satisfaction'
  ]).optional(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  pageUrl: z.string().url().optional(),
  alertId: z.string().uuid().optional(),
  attachments: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
})

/**
 * Schema for creating rating
 */
export const createRatingSchema = z.object({
  alertId: z.string().uuid().optional(),
  alertType: z.string().optional(),
  overallRating: z.number().min(1).max(5),
  accuracyRating: z.number().min(1).max(5).optional(),
  timelinessRating: z.number().min(1).max(5).optional(),
  usefulnessRating: z.number().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
})

/**
 * Schema for creating response
 */
export const createResponseSchema = z.object({
  feedbackId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  parentResponseId: z.string().uuid().optional(),
  attachments: z.array(z.string().url()).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for feedback type
 */
export function getFeedbackTypeDisplayName(type: FeedbackType): string {
  const names: Record<FeedbackType, string> = {
    bug_report: 'Bug Report',
    feature_request: 'Feature Request',
    improvement_suggestion: 'Improvement Suggestion',
    general_feedback: 'General Feedback',
    complaint: 'Complaint',
    praise: 'Praise',
    experience_rating: 'Experience Rating',
  }
  return names[type]
}

/**
 * Gets display name for feedback status
 */
export function getFeedbackStatusDisplayName(status: FeedbackStatus): string {
  const names: Record<FeedbackStatus, string> = {
    submitted: 'Submitted',
    acknowledged: 'Acknowledged',
    under_review: 'Under Review',
    planned: 'Planned',
    in_progress: 'In Progress',
    completed: 'Completed',
    declined: 'Declined',
    archived: 'Archived',
  }
  return names[status]
}

/**
 * Gets color for feedback status
 */
export function getFeedbackStatusColor(status: FeedbackStatus): string {
  const colors: Record<FeedbackStatus, string> = {
    submitted: 'bg-blue-500',
    acknowledged: 'bg-cyan-500',
    under_review: 'bg-purple-500',
    planned: 'bg-indigo-500',
    in_progress: 'bg-yellow-500',
    completed: 'bg-green-500',
    declined: 'bg-red-500',
    archived: 'bg-gray-500',
  }
  return colors[status]
}

/**
 * Gets display name for experience category
 */
export function getCategoryDisplayName(category: ExperienceCategory): string {
  const names: Record<ExperienceCategory, string> = {
    alert_accuracy: 'Alert Accuracy',
    response_time: 'Response Time',
    ease_of_use: 'Ease of Use',
    interface_design: 'Interface Design',
    notification_quality: 'Notification Quality',
    map_accuracy: 'Map Accuracy',
    community_features: 'Community Features',
    emergency_response: 'Emergency Response',
    overall_satisfaction: 'Overall Satisfaction',
  }
  return names[category]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates feedback
 */
export async function createFeedback(
  userId: string | undefined,
  input: CreateFeedbackInput
): Promise<Feedback> {
  const validationResult = createFeedbackSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid feedback: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_feedback')
    .insert({
      user_id: userId || null,
      type: input.type,
      category: input.category || null,
      title: input.title,
      description: input.description,
      page_url: input.pageUrl || null,
      device_info: input.deviceInfo || null,
      alert_id: input.alertId || null,
      attachments: input.attachments || [],
      status: 'submitted',
      priority: input.type === 'bug_report' || input.type === 'complaint' ? 'high' : 'medium',
      flagged: false,
      response_count: 0,
      tags: input.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating feedback:', error)
    throw new Error(`Failed to create feedback: ${error.message}`)
  }

  return mapFeedbackFromDB(data)
}

/**
 * Gets feedback by ID
 */
export async function getFeedback(
  feedbackId: string
): Promise<Feedback | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('id', feedbackId)
    .single()

  if (error) {
    console.error('Error fetching feedback:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapFeedbackFromDB(data)
}

/**
 * Gets user's feedback
 */
export async function getUserFeedback(
  userId: string,
  options?: {
    status?: FeedbackStatus[]
    type?: FeedbackType[]
    limit?: number
  }
): Promise<Feedback[]> {
  const supabase = createClient()

  let query = supabase
    .from('user_feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.status && options.status.length > 0) {
    query = query.in('status', options.status)
  }

  if (options?.type && options.type.length > 0) {
    query = query.in('type', options.type)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching user feedback:', error)
    return []
  }

  return (data || []).map(mapFeedbackFromDB)
}

/**
 * Gets feedback for review
 */
export async function getFeedbackForReview(
  options?: {
    status?: FeedbackStatus[]
    type?: FeedbackType[]
    flagged?: boolean
    limit?: number
    offset?: number
  }
): Promise<Feedback[]> {
  const supabase = createClient()

  let query = supabase
    .from('user_feedback')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (options?.status && options.status.length > 0) {
    query = query.in('status', options.status)
  }

  if (options?.type && options.type.length > 0) {
    query = query.in('type', options.type)
  }

  if (options?.flagged !== undefined) {
    query = query.eq('flagged', options.flagged)
  }

  if (options?.limit) {
    query = query.range(
      options.offset || 0,
      (options.offset || 0) + options.limit - 1
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching feedback for review:', error)
    return []
  }

  return (data || []).map(mapFeedbackFromDB)
}

/**
 * Updates feedback status
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
  priority?: FeedbackPriority
): Promise<Feedback> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (priority) {
    updateData.priority = priority
  }

  const { data, error } = await supabase
    .from('user_feedback')
    .update(updateData)
    .eq('id', feedbackId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating feedback status:', error)
    throw new Error(`Failed to update: ${error.message}`)
  }

  return mapFeedbackFromDB(data)
}

/**
 * Adds response to feedback
 */
export async function addFeedbackResponse(
  feedbackId: string,
  responderId: string,
  input: CreateResponseInput
): Promise<FeedbackResponse> {
  const validationResult = createResponseSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid response: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('feedback_responses')
    .insert({
      feedback_id: input.feedbackId,
      responder_id: responderId,
      message: input.message,
      parent_response_id: input.parentResponseId || null,
      attachments: input.attachments || [],
      is_internal: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error adding response:', error)
    throw new Error(`Failed to add response: ${error.message}`)
  }

  // Update feedback response count and last response time
  await supabase
    .from('user_feedback')
    .update({
      response_count: supabase.rpc('increment', { row_id: feedbackId, column: 'response_count' }),
      last_response_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', feedbackId)

  return {
    id: data.id,
    feedbackId: data.feedback_id,
    responderId: data.responder_id,
    responderType: data.responder_type,
    message: data.message,
    isInternal: data.is_internal,
    parentResponseId: data.parent_response_id || undefined,
    attachments: data.attachments || [],
    createdAt: data.created_at,
  }
}

/**
 * Gets responses for feedback
 */
export async function getFeedbackResponses(
  feedbackId: string
): Promise<FeedbackResponse[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('feedback_responses')
    .select('*')
    .eq('feedback_id', feedbackId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching responses:', error)
    return []
  }

  return (data || []).map(r => ({
    id: r.id,
    feedbackId: r.feedback_id,
    responderId: r.responder_id,
    responderType: r.responder_type,
    message: r.message,
    isInternal: r.is_internal,
    parentResponseId: r.parent_response_id || undefined,
    attachments: r.attachments || [],
    createdAt: r.created_at,
  }))
}

/**
 * Creates experience rating
 */
export async function createExperienceRating(
  userId: string,
  input: CreateRatingInput
): Promise<ExperienceRating> {
  const validationResult = createRatingSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid rating: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('experience_ratings')
    .insert({
      user_id: userId,
      alert_id: input.alertId || null,
      alert_type: input.alertType || null,
      overall_rating: input.overallRating,
      accuracy_rating: input.accuracyRating || null,
      timeliness_rating: input.timelinessRating || null,
      usefulness_rating: input.usefulnessRating || null,
      comment: input.comment || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating rating:', error)
    throw new Error(`Failed to create rating: ${error.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
    alertId: data.alert_id || undefined,
    alertType: data.alert_type || undefined,
    overallRating: data.overall_rating,
    accuracyRating: data.accuracy_rating || undefined,
    timelinessRating: data.timeliness_rating || undefined,
    usefulnessRating: data.usefulness_rating || undefined,
    comment: data.comment || undefined,
    createdAt: data.created_at,
  }
}

/**
 * Gets user's ratings
 */
export async function getUserRatings(
  userId: string,
  limit: number = 20
): Promise<ExperienceRating[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('experience_ratings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching ratings:', error)
    return []
  }

  return (data || []).map(r => ({
    id: r.id,
    userId: r.user_id,
    alertId: r.alert_id || undefined,
    alertType: r.alert_type || undefined,
    overallRating: r.overall_rating,
    accuracyRating: r.accuracy_rating || undefined,
    timelinessRating: r.timeliness_rating || undefined,
    usefulnessRating: r.usefulness_rating || undefined,
    comment: r.comment || undefined,
    createdAt: r.created_at,
  }))
}

/**
 * Gets ratings for an alert
 */
export async function getAlertRatings(
  alertId: string
): Promise<{
  ratings: ExperienceRating[]
  averageRating: number
  ratingCount: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('experience_ratings')
    .select('*')
    .eq('alert_id', alertId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching alert ratings:', error)
    return { ratings: [], averageRating: 0, ratingCount: 0 }
  }

  const ratings = (data || []).map(r => ({
    id: r.id,
    userId: r.user_id,
    alertId: r.alert_id || undefined,
    alertType: r.alert_type || undefined,
    overallRating: r.overall_rating,
    accuracyRating: r.accuracy_rating || undefined,
    timelinessRating: r.timeliness_rating || undefined,
    usefulnessRating: r.usefulness_rating || undefined,
    comment: r.comment || undefined,
    createdAt: r.created_at,
  }))

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length
    : 0

  return {
    ratings,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingCount: ratings.length,
  }
}

/**
 * Gets feedback summary
 */
export async function getFeedbackSummary(
  period: 'week' | 'month' | 'quarter' = 'month'
): Promise<FeedbackSummary> {
  const supabase = createClient()

  const startDate = new Date()
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1)
      break
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3)
      break
  }

  const { data: feedback } = await supabase
    .from('user_feedback')
    .select('type, status, priority, created_at')
    .gte('created_at', startDate.toISOString())

  const { data: ratings } = await supabase
    .from('experience_ratings')
    .select('overall_rating, created_at')
    .gte('created_at', startDate.toISOString())

  // Count by type
  const byType: Record<FeedbackType, number> = {
    bug_report: 0,
    feature_request: 0,
    improvement_suggestion: 0,
    general_feedback: 0,
    complaint: 0,
    praise: 0,
    experience_rating: 0,
  }

  for (const f of feedback || []) {
    if (byType[f.type as FeedbackType] !== undefined) {
      byType[f.type as FeedbackType]++
    }
  }

  // Count by status
  const byStatus: Record<FeedbackStatus, number> = {
    submitted: 0,
    acknowledged: 0,
    under_review: 0,
    planned: 0,
    in_progress: 0,
    completed: 0,
    declined: 0,
    archived: 0,
  }

  for (const f of feedback || []) {
    if (byStatus[f.status as FeedbackStatus] !== undefined) {
      byStatus[f.status as FeedbackStatus]++
    }
  }

  // Rating distribution
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let totalRating = 0

  for (const r of ratings || []) {
    const rounded = Math.round(r.overall_rating)
    if (rounded >= 1 && rounded <= 5) {
      ratingDistribution[rounded]++
      totalRating += r.overall_rating
    }
  }

  const averageRating = ratings?.length
    ? totalRating / ratings.length
    : 0

  // Calculate trend (compare to previous period)
  const previousStart = new Date(startDate)
  const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90
  previousStart.setDate(previousStart.getDate() - periodDays)

  const { data: previousFeedback } = await supabase
    .from('user_feedback')
    .select('id', { count: 'exact' })
    .gte('created_at', previousStart.toISOString())
    .lt('created_at', startDate.toISOString())

  const currentCount = feedback?.length || 0
  const previousCount = previousFeedback?.length || 0

  let trendDirection: 'up' | 'down' | 'stable' = 'stable'
  let trendPercentage = 0

  if (previousCount > 0) {
    trendPercentage = Math.round(((currentCount - previousCount) / previousCount) * 100)
    if (trendPercentage > 5) trendDirection = 'up'
    else if (trendPercentage < -5) trendDirection = 'down'
  }

  // Top issues
  const topIssues = Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type: type as FeedbackType, count }))

  return {
    period,
    totalFeedback: currentCount,
    byType,
    byStatus,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution,
    trendDirection,
    trendPercentage,
    topIssues,
  }
}

/**
 * Gets NPS score
 */
export async function getNPSScore(): Promise<{
  score: number
  promoters: number
  passives: number
  detractors: number
  responses: number
}> {
  const supabase = createClient()

  const { data: ratings } = await supabase
    .from('experience_ratings')
    .select('overall_rating')
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

  let promoters = 0
  let passives = 0
  let detractors = 0

  for (const r of ratings || []) {
    if (r.overall_rating >= 9) promoters++
    else if (r.overall_rating >= 7) passives++
    else detractors++
  }

  const total = ratings?.length || 0
  const score = total > 0
    ? Math.round(((promoters - detractors) / total) * 100)
    : 0

  return {
    score,
    promoters,
    passives,
    detractors,
    responses: total,
  }
}

/**
 * Flags feedback
 */
export async function flagFeedback(
  feedbackId: string,
  reason: string
): Promise<Feedback> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_feedback')
    .update({
      flagged: true,
      flag_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', feedbackId)
    .select('*')
    .single()

  if (error) {
    console.error('Error flagging feedback:', error)
    throw new Error(`Failed to flag: ${error.message}`)
  }

  return mapFeedbackFromDB(data)
}

/**
 * Searches feedback
 */
export async function searchFeedback(
  query: string,
  options?: {
    type?: FeedbackType[]
    status?: FeedbackStatus[]
    limit?: number
  }
): Promise<Feedback[]> {
  const supabase = createClient()

  let dbQuery = supabase
    .from('user_feedback')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (options?.type && options.type.length > 0) {
    dbQuery = dbQuery.in('type', options.type)
  }

  if (options?.status && options.status.length > 0) {
    dbQuery = dbQuery.in('status', options.status)
  }

  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error searching feedback:', error)
    return []
  }

  return (data || []).map(mapFeedbackFromDB)
}

/**
 * Archives old feedback
 */
export async function archiveOldFeedback(
  daysOld: number = 180
): Promise<number> {
  const supabase = createClient()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysOld)

  const { data, error } = await supabase
    .from('user_feedback')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .lt('created_at', cutoff.toISOString())
    .eq('status', 'completed')
    .select('id')

  if (error) {
    console.error('Error archiving feedback:', error)
    return 0
  }

  return (data || []).length
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to Feedback
 */
function mapFeedbackFromDB(data: Record<string, unknown>): Feedback {
  return {
    id: data.id,
    userId: data.user_id as string | undefined,
    type: data.type as FeedbackType,
    category: data.category as ExperienceCategory | undefined,
    title: data.title,
    description: data.description,
    pageUrl: data.page_url as string | undefined,
    deviceInfo: data.device_info as DeviceInfo | undefined,
    alertId: data.alert_id as string | undefined,
    attachments: (data.attachments as string[]) || [],
    status: data.status as FeedbackStatus,
    priority: data.priority as FeedbackPriority,
    flagged: data.flagged,
    flagReason: data.flag_reason as string | undefined,
    responseCount: data.response_count || 0,
    lastResponseAt: data.last_response_at as string | undefined,
    tags: (data.tags as string[]) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
