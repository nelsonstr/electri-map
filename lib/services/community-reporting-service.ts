import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Report type
 */
export type ReportType =
  | 'suspicious_activity'
  | 'infrastructure_issue'
  | 'safety_concern'
  | 'environmental_hazard'
  | 'traffic_incident'
  | 'medical_emergency'
  | 'fire_hazard'
  | 'flooding'
  | 'power_outage'
  | 'communication_outage'
  | 'road_closure'
  | 'animal_hazard'
  | 'other'

/**
 * Report status
 */
export type ReportStatus =
  | 'submitted'
  | 'acknowledged'
  | 'investigating'
  | 'verified'
  | 'resolved'
  | 'dismissed'
  | 'escalated'

/**
 * Report priority
 */
export type ReportPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Verification method
 */
export type VerificationMethod =
  | 'eye_witness'
  | 'photo_video'
  | 'sensor_data'
  | 'official_source'
  | 'community_verification'
  | 'authority_confirmation'

/**
 * Community report
 */
export interface CommunityReport {
  id: string
  
  // Report info
  type: ReportType
  title: string
  description: string
  
  // Location
  latitude: number
  longitude: number
  address?: string
  landmark?: string
  
  // Media
  media?: Array<{
    type: 'image' | 'video' | 'audio'
    url: string
    thumbnail?: string
    caption?: string
  }>
  
  // Timing
  incidentTime?: string
  reportedAt: string
  
  // Status
  status: ReportStatus
  priority: ReportPriority
  
  // Verification
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'disputed'
  verificationMethod?: VerificationMethod
  verificationCount: number
  
  // Reporter
  reporterId?: string
  reporterAnonymous: boolean
  
  // Attribution
  attributionScore?: number
  isAnonymousAllowed: boolean
  
  // Metadata
  tags?: string[]
  category?: string
  
  // Moderation
  moderationStatus: 'pending' | 'approved' | 'rejected'
  moderatedBy?: string
  moderatedAt?: string
  
  // Resolution
  resolution?: string
  resolvedAt?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Verification vote
 */
export interface VerificationVote {
  id: string
  
  // Report
  reportId: string
  
  // Voter
  voterId?: string
  voterAnonymous: boolean
  
  // Vote
  vote: 'verify' | 'dispute' | 'neutral'
  confidence?: number
  
  // Method
  verificationMethod?: VerificationMethod
  
  // Comment
  comment?: string
  
  // Media
  supportingMedia?: Array<{
    type: 'image' | 'video' | 'audio'
    url: string
  }>
  
  // Timestamps
  createdAt: string
}

/**
 * Community witness
 */
export interface CommunityWitness {
  id: string
  
  // Report
  reportId: string
  
  // Witness
  witnessId?: string
  witnessAnonymous: boolean
  
  // Statement
  statement: string
  
  // Contact
  contactInfo?: string
  willingToTestify: boolean
  
  // Timing
  witnessedAt: string
  
  // Timestamps
  createdAt: string
}

/**
 * Report template
 */
export interface ReportTemplate {
  id: string
  
  // Template info
  type: ReportType
  title: string
  description: string
  
  // Fields
  requiredFields: Array<{
    name: string
    type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'datetime' | 'location'
    label: string
    placeholder?: string
    options?: string[]
    validation?: string
  }>
  
  optionalFields: Array<{
    name: string
    type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'datetime' | 'location' | 'media'
    label: string
    placeholder?: string
    options?: string[]
    validation?: string
  }>
  
  // Media requirements
  mediaRequired: boolean
  mediaTypes?: string[]
  
  // Guidelines
  instructions?: string
  examples?: string[]
  
  // Status
  isActive: boolean
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Report statistics
 */
export interface ReportStatistics {
  totalReports: number
  byType: Record<ReportType, number>
  byStatus: Record<ReportStatus, number>
  byPriority: Record<ReportPriority, number>
  averageResolutionTime: number
  verificationRate: number
  communityEngagement: number
}

/**
 * Create report input
 */
export interface CreateReportInput {
  type: ReportType
  title: string
  description: string
  latitude: number
  longitude: number
  address?: string
  landmark?: string
  media?: Array<{
    type: 'image' | 'video' | 'audio'
    url: string
    thumbnail?: string
    caption?: string
  }>
  incidentTime?: string
  tags?: string[]
  category?: string
  isAnonymous?: boolean
}

/**
 * Create verification vote input
 */
export interface CreateVerificationVoteInput {
  reportId: string
  vote: 'verify' | 'dispute' | 'neutral'
  confidence?: number
  verificationMethod?: VerificationMethod
  comment?: string
  supportingMedia?: Array<{
    type: 'image' | 'video' | 'audio'
    url: string
  }>
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating report
 */
export const createReportSchema = z.object({
  type: z.enum([
    'suspicious_activity',
    'infrastructure_issue',
    'safety_concern',
    'environmental_hazard',
    'traffic_incident',
    'medical_emergency',
    'fire_hazard',
    'flooding',
    'power_outage',
    'communication_outage',
    'road_closure',
    'animal_hazard',
    'other',
  ]),
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(500).optional(),
  landmark: z.string().max(200).optional(),
  media: z.array(z.object({
    type: z.enum(['image', 'video', 'audio']),
    url: z.string().url(),
    thumbnail: z.string().url().optional(),
    caption: z.string().max(500).optional(),
  })).max(5).optional(),
  incidentTime: z.string().datetime().optional(),
  tags: z.array(z.string()).max(10).optional(),
  category: z.string().max(100).optional(),
  isAnonymous: z.boolean().optional(),
})

/**
 * Schema for verification vote
 */
export const createVerificationVoteSchema = z.object({
  reportId: z.string().uuid(),
  vote: z.enum(['verify', 'dispute', 'neutral']),
  confidence: z.number().min(1).max(10).optional(),
  verificationMethod: z.enum([
    'eye_witness',
    'photo_video',
    'sensor_data',
    'official_source',
    'community_verification',
    'authority_confirmation',
  ]).optional(),
  comment: z.string().max(1000).optional(),
  supportingMedia: z.array(z.object({
    type: z.enum(['image', 'video', 'audio']),
    url: z.string().url(),
  })).max(3).optional(),
})

/**
 * Schema for witness statement
 */
export const createWitnessSchema = z.object({
  reportId: z.string().uuid(),
  statement: z.string().min(50).max(5000),
  contactInfo: z.string().email().optional(),
  willingToTestify: z.boolean().default(false),
  witnessedAt: z.string().datetime(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for report type
 */
export function getReportTypeDisplayName(type: ReportType): string {
  const names: Record<ReportType, string> = {
    suspicious_activity: 'Suspicious Activity',
    infrastructure_issue: 'Infrastructure Issue',
    safety_concern: 'Safety Concern',
    environmental_hazard: 'Environmental Hazard',
    traffic_incident: 'Traffic Incident',
    medical_emergency: 'Medical Emergency',
    fire_hazard: 'Fire Hazard',
    flooding: 'Flooding',
    power_outage: 'Power Outage',
    communication_outage: 'Communication Outage',
    road_closure: 'Road Closure',
    animal_hazard: 'Animal Hazard',
    other: 'Other',
  }
  return names[type]
}

/**
 * Gets display name for report status
 */
export function getReportStatusDisplayName(status: ReportStatus): string {
  const names: Record<ReportStatus, string> = {
    submitted: 'Submitted',
    acknowledged: 'Acknowledged',
    investigating: 'Investigating',
    verified: 'Verified',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
    escalated: 'Escalated',
  }
  return names[status]
}

/**
 * Gets color for report status
 */
export function getReportStatusColor(status: ReportStatus): string {
  const colors: Record<ReportStatus, string> = {
    submitted: 'bg-blue-500',
    acknowledged: 'bg-yellow-500',
    investigating: 'bg-orange-500',
    verified: 'bg-green-500',
    resolved: 'bg-gray-500',
    dismissed: 'bg-red-500',
    escalated: 'bg-purple-500',
  }
  return colors[status]
}

/**
 * Gets display name for priority
 */
export function getReportPriorityDisplayName(priority: ReportPriority): string {
  const names: Record<ReportPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  }
  return names[priority]
}

/**
 * Gets priority from report type and context
 */
function calculatePriority(
  type: ReportType,
  context?: {
    hasMedia?: boolean
    incidentTime?: string
    tags?: string[]
  }
): ReportPriority {
  // Critical types
  const criticalTypes: ReportType[] = [
    'medical_emergency',
    'fire_hazard',
    'flooding',
  ]
  
  if (criticalTypes.includes(type)) {
    return 'critical'
  }
  
  // High priority types with media
  const highTypes: ReportType[] = [
    'suspicious_activity',
    'safety_concern',
    'environmental_hazard',
    'traffic_incident',
  ]
  
  if (highTypes.includes(type) && context?.hasMedia) {
    return 'high'
  }
  
  // Check tags
  if (context?.tags) {
    const urgentTags = ['urgent', 'immediate', 'emergency', 'life-threatening']
    if (context.tags.some(tag => urgentTags.includes(tag.toLowerCase()))) {
      return 'high'
    }
  }
  
  return 'medium'
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a community report
 */
export async function createCommunityReport(
  userId: string | undefined,
  input: CreateReportInput
): Promise<CommunityReport> {
  const validationResult = createReportSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid report: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const priority = calculatePriority(input.type, {
    hasMedia: input.media && input.media.length > 0,
    incidentTime: input.incidentTime,
    tags: input.tags,
  })

  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('community_reports')
    .insert({
      id: reportId,
      type: input.type,
      title: input.title,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address || null,
      landmark: input.landmark || null,
      media: input.media || null,
      incident_time: input.incidentTime || null,
      status: 'submitted',
      priority,
      verification_status: 'unverified',
      verification_count: 0,
      reporter_id: input.isAnonymous ? null : userId,
      reporter_anonymous: input.isAnonymous || false,
      attribution_score: input.isAnonymous ? 0 : null,
      is_anonymous_allowed: true,
      tags: input.tags || null,
      category: input.category || null,
      moderation_status: 'pending',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating report:', error)
    throw new Error(`Failed to create report: ${error.message}`)
  }

  return mapReportFromDB(data)
}

/**
 * Gets a community report
 */
export async function getCommunityReport(
  reportId: string
): Promise<CommunityReport | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (error) {
    console.error('Error fetching report:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapReportFromDB(data)
}

/**
 * Gets community reports with filters
 */
export async function getCommunityReports(
  options?: {
    type?: ReportType
    status?: ReportStatus[]
    priority?: ReportPriority[]
    bounds?: {
      minLat: number
      maxLat: number
      minLng: number
      maxLng: number
    }
    userId?: string
    limit?: number
    offset?: number
  }
): Promise<{ reports: CommunityReport[]; total: number }> {
  const supabase = createClient()

  let query = supabase
    .from('community_reports')
    .select('*', { count: 'exact' })
    .eq('moderation_status', 'approved')

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.status && options.status.length > 0) {
    query = query.in('status', options.status)
  }

  if (options?.priority && options.priority.length > 0) {
    query = query.in('priority', options.priority)
  }

  if (options?.bounds) {
    query = query
      .gte('latitude', options.bounds.minLat)
      .lte('latitude', options.bounds.maxLat)
      .gte('longitude', options.bounds.minLng)
      .lte('longitude', options.bounds.maxLng)
  }

  if (options?.userId) {
    query = query.eq('reporter_id', options.userId)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(
      options?.offset || 0,
      (options?.offset || 0) + (options?.limit || 20) - 1
    )

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching reports:', error)
    return { reports: [], total: 0 }
  }

  return {
    reports: (data || []).map(mapReportFromDB),
    total: count || 0,
  }
}

/**
 * Updates report status
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  moderatorId?: string,
  resolution?: string
): Promise<CommunityReport> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (moderatorId) {
    updateData.moderated_by = moderatorId
    updateData.moderated_at = new Date().toISOString()
  }

  if (status === 'resolved' && resolution) {
    updateData.resolution = resolution
    updateData.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('community_reports')
    .update(updateData)
    .eq('id', reportId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating status:', error)
    throw new Error(`Failed to update: ${error.message}`)
  }

  return mapReportFromDB(data)
}

/**
 * Submits verification vote
 */
export async function submitVerificationVote(
  userId: string | undefined,
  input: CreateVerificationVoteInput
): Promise<VerificationVote> {
  const validationResult = createVerificationVoteSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid vote: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Check if report exists
  const report = await getCommunityReport(input.reportId)
  if (!report) {
    throw new Error('Report not found')
  }

  // Check if user already voted
  if (userId) {
    const { data: existing } = await supabase
      .from('verification_votes')
      .select('*')
      .eq('report_id', input.reportId)
      .eq('voter_id', userId)
      .single()

    if (existing) {
      // Update existing vote
      const { data, error } = await supabase
        .from('verification_votes')
        .update({
          vote: input.vote,
          confidence: input.confidence || null,
          verification_method: input.verificationMethod || null,
          comment: input.comment || null,
          supporting_media: input.supportingMedia || null,
        })
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating vote:', error)
        throw new Error(`Failed to update vote: ${error.message}`)
      }

      return mapVoteFromDB(data)
    }
  }

  // Create new vote
  const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('verification_votes')
    .insert({
      id: voteId,
      report_id: input.reportId,
      voter_id: userId || null,
      voter_anonymous: !userId,
      vote: input.vote,
      confidence: input.confidence || null,
      verification_method: input.verificationMethod || null,
      comment: input.comment || null,
      supporting_media: input.supportingMedia || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating vote:', error)
    throw new Error(`Failed to create vote: ${error.message}`)
  }

  // Update verification count on report
  await supabase
    .from('community_reports')
    .update({
      verification_count: report.verificationCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.reportId)

  return mapVoteFromDB(data)
}

/**
 * Gets verification votes for a report
 */
export async function getVerificationVotes(
  reportId: string
): Promise<VerificationVote[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('verification_votes')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching votes:', error)
    return []
  }

  return (data || []).map(mapVoteFromDB)
}

/**
 * Gets verification summary for a report
 */
export async function getVerificationSummary(
  reportId: string
): Promise<{
  verify: number
  dispute: number
  neutral: number
  averageConfidence?: number
  consensus: 'verified' | 'disputed' | 'pending'
}> {
  const votes = await getVerificationVotes(reportId)

  let verify = 0
  let dispute = 0
  let neutral = 0
  let confidenceSum = 0
  let confidenceCount = 0

  for (const vote of votes) {
    if (vote.vote === 'verify') {
      verify++
    } else if (vote.vote === 'dispute') {
      dispute++
    } else {
      neutral++
    }

    if (vote.confidence) {
      confidenceSum += vote.confidence
      confidenceCount++
    }
  }

  let consensus: 'verified' | 'disputed' | 'pending' = 'pending'
  const total = verify + dispute + neutral

  if (total >= 3) {
    const verifyRatio = verify / total
    const disputeRatio = dispute / total

    if (verifyRatio >= 0.7) {
      consensus = 'verified'
    } else if (disputeRatio >= 0.5) {
      consensus = 'disputed'
    }
  }

  return {
    verify,
    dispute,
    neutral,
    averageConfidence: confidenceCount > 0 ? confidenceSum / confidenceCount : undefined,
    consensus,
  }
}

/**
 * Adds witness statement
 */
export async function addWitnessStatement(
  userId: string | undefined,
  input: {
    reportId: string
    statement: string
    contactInfo?: string
    willingToTestify: boolean
    witnessedAt: string
  }
): Promise<CommunityWitness> {
  const validationResult = createWitnessSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid statement: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const witnessId = `witness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('community_witnesses')
    .insert({
      id: witnessId,
      report_id: input.reportId,
      witness_id: userId || null,
      witness_anonymous: !userId,
      statement: input.statement,
      contact_info: input.contactInfo || null,
      willing_to_testify: input.willingToTestify,
      witnessed_at: input.witnessedAt,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating witness:', error)
    throw new Error(`Failed to create witness: ${error.message}`)
  }

  return {
    id: data.id as string,
    reportId: data.report_id as string,
    witnessId: data.witness_id as string || undefined,
    witnessAnonymous: data.witness_anonymous,
    statement: data.statement,
    contactInfo: data.contact_info as string || undefined,
    willingToTestify: data.willing_to_testify,
    witnessedAt: data.witnessed_at as string,
    createdAt: data.created_at as string,
  }
}

/**
 * Gets report statistics
 */
export async function getReportStatistics(
  options?: {
    days?: number
    type?: ReportType
  }
): Promise<ReportStatistics> {
  const supabase = createClient()

  let query = supabase
    .from('community_reports')
    .select('*')
    .eq('moderation_status', 'approved')

  if (options?.days) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - options.days)
    query = query.gte('created_at', startDate.toISOString())
  }

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching statistics:', error)
    return getEmptyStats()
  }

  const reports = data || []
  const byType: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  const byPriority: Record<string, number> = {}

  let totalReports = reports.length
  let totalResolutionTime = 0
  let resolvedCount = 0
  let verifiedCount = 0

  for (const report of reports) {
    // By type
    byType[report.type] = (byType[report.type] || 0) + 1

    // By status
    byStatus[report.status] = (byStatus[report.status] || 0) + 1

    // By priority
    byPriority[report.priority] = (byPriority[report.priority] || 0) + 1

    // Resolution time
    if (report.resolved_at && report.created_at) {
      const resolutionTime = new Date(report.resolved_at).getTime() - new Date(report.created_at).getTime()
      totalResolutionTime += resolutionTime
      resolvedCount++
    }

    // Verification
    if (report.verification_status === 'verified') {
      verifiedCount++
    }
  }

  return {
    totalReports,
    byType: byType as Record<ReportType, number>,
    byStatus: byStatus as Record<ReportStatus, number>,
    byPriority: byPriority as Record<ReportPriority, number>,
    averageResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
    verificationRate: totalReports > 0 ? (verifiedCount / totalReports) * 100 : 0,
    communityEngagement: 0, // Would need separate query for engagement metrics
  }
}

/**
 * Gets report templates
 */
export async function getReportTemplates(
  activeOnly: boolean = true
): Promise<ReportTemplate[]> {
  const supabase = createClient()

  let query = supabase
    .from('report_templates')
    .select('*')
    .order('type')

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching templates:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id as string,
    type: data.type as ReportType,
    title: data.title as string,
    description: data.description as string,
    requiredFields: data.required_fields,
    optionalFields: data.optional_fields,
    mediaRequired: data.media_required,
    mediaTypes: data.media_types as any[] || undefined,
    instructions: data.instructions || undefined,
    examples: data.examples || undefined,
    isActive: data.is_active as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }))
}

/**
 * Moderates a report
 */
export async function moderateReport(
  reportId: string,
  decision: 'approved' | 'rejected',
  moderatorId: string,
  reason?: string
): Promise<CommunityReport> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_reports')
    .update({
      moderation_status: decision,
      moderated_by: moderatorId,
      moderated_at: new Date().toISOString(),
      moderation_notes: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select('*')
    .single()

  if (error) {
    console.error('Error moderating report:', error)
    throw new Error(`Failed to moderate: ${error.message}`)
  }

  return mapReportFromDB(data)
}

/**
 * Searches reports
 */
export async function searchReports(
  query: string,
  options?: {
    type?: ReportType
    status?: ReportStatus[]
    limit?: number
  }
): Promise<CommunityReport[]> {
  const supabase = createClient()

  let dbQuery = supabase
    .from('community_reports')
    .select('*')
    .eq('moderation_status', 'approved')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(options?.limit || 20)

  if (options?.type) {
    dbQuery = dbQuery.eq('type', options.type)
  }

  if (options?.status && options.status.length > 0) {
    dbQuery = dbQuery.in('status', options.status)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error searching reports:', error)
    return []
  }

  return (data || []).map(mapReportFromDB)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets empty statistics
 */
function getEmptyStats(): ReportStatistics {
  return {
    totalReports: 0,
    byType: {} as Record<ReportType, number>,
    byStatus: {} as Record<ReportStatus, number>,
    byPriority: {} as Record<ReportPriority, number>,
    averageResolutionTime: 0,
    verificationRate: 0,
    communityEngagement: 0,
  }
}

/**
 * Maps database record to CommunityReport
 */
function mapReportFromDB(data: Record<string, unknown>): CommunityReport {
  return {
    id: data.id as string,
    type: data.type as ReportType,
    title: data.title as string,
    description: data.description as string,
    latitude: data.latitude as number,
    longitude: data.longitude as number,
    address: data.address as string | undefined,
    landmark: data.landmark as string | undefined,
    media: data.media as CommunityReport['media'] | undefined,
    incidentTime: data.incident_time as string | undefined,
    status: data.status as ReportStatus,
    priority: data.priority as ReportPriority,
    verificationStatus: data.verification_status as 'unverified' | 'pending' | 'verified' | 'disputed',
    verificationMethod: data.verification_method as VerificationMethod | undefined,
    verificationCount: data.verification_count as number,
    reporterId: data.reporter_id as string | undefined,
    reporterAnonymous: data.reporter_anonymous,
    attributionScore: data.attribution_score as number | undefined,
    isAnonymousAllowed: data.is_anonymous_allowed as boolean,
    tags: data.tags as string[] | undefined,
    category: data.category as string | undefined,
    moderationStatus: data.moderation_status as string,
    moderatedBy: data.moderated_by as string | undefined,
    moderatedAt: data.moderated_at as string | undefined,
    resolution: data.resolution as string | undefined,
    resolvedAt: data.resolved_at as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to VerificationVote
 */
function mapVoteFromDB(data: Record<string, unknown>): VerificationVote {
  return {
    id: data.id as string,
    reportId: data.report_id as string,
    voterId: data.voter_id as string | undefined,
    voterAnonymous: data.voter_anonymous,
    vote: data.vote as 'verify' | 'dispute' | 'neutral',
    confidence: data.confidence as number | undefined,
    verificationMethod: data.verification_method as VerificationMethod | undefined,
    comment: data.comment as string | undefined,
    supportingMedia: data.supporting_media as VerificationVote['supportingMedia'] | undefined,
    createdAt: data.created_at as string,
  }
}
