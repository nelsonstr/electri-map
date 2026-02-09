import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Verification status
 */
export type VerificationStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'suspended'
  | 'expired'

/**
 * Verification tier
 */
export type VerificationTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'

/**
 * Badge type
 */
export type BadgeType =
  | 'early_adopter'
  | 'verified_reporter'
  | 'community_hero'
  | 'first_responder'
  | 'trusted_source'
  | 'expert'
  | 'lifetime_contributor'

/**
 * Credential type
 */
export type CredentialType =
  | 'government_id'
  | 'professional_license'
  | 'official_credentials'
  | 'media_credentials'
  | 'community_leader'
  | 'organization_verification'

/**
 * Verification application
 */
export interface VerificationApplication {
  id: string
  userId: string
  
  // Status
  status: VerificationStatus
  tier: VerificationTier
  
  // Application data
  applicationType: string
  organizationName?: string
  jobTitle?: string
  credentials: CredentialSubmission[]
  supportingDocuments: string[]
  references: Reference[]
  
  // Review
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  rejectionReason?: string
  
  // Expiration
  expiresAt?: string
  
  // Timestamps
  submittedAt: string
  createdAt: string
  updatedAt: string
}

/**
 * Credential submission
 */
export interface CredentialSubmission {
  type: CredentialType
  documentUrl?: string
  documentId?: string
  issuedBy?: string
  issuedAt?: string
  expiresAt?: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verificationNotes?: string
}

/**
 * Reference for verification
 */
export interface Reference {
  name: string
  email: string
  phone?: string
  relationship: string
  verified: boolean
}

/**
 * User verification profile
 */
export interface VerificationProfile {
  userId: string
  
  // Status
  status: VerificationStatus
  tier: VerificationTier
  
  // Badges
  badges: UserBadge[]
  
  // Stats
  totalReports: number
  verifiedReports: number
  confirmationRate: number
  averageRating: number
  reputationScore: number
  
  // Permissions
  canVerifyOthers: boolean
  canEscalateAlerts: boolean
  priorityInAlerts: number
  
  // Timestamps
  verifiedAt?: string
  expiresAt?: string
  lastReviewAt?: string
}

/**
 * User badge
 */
export interface UserBadge {
  id: string
  type: BadgeType
  name: string
  description?: string
  iconUrl?: string
  
  // Criteria
  earnedAt: string
  expiresAt?: string
  
  // Display
  isVisible: boolean
  isFeatured: boolean
}

/**
 * Verification tier benefits
 */
export interface TierBenefits {
  tier: VerificationTier
  
  // Priority
  alertPriority: number
  verificationWeight: number
  
  // Features
  maxAlertsPerDay: number
  canVerifyReports: boolean
  canEscalateAlerts: boolean
  hasDedicatedChannel: boolean
  appearsOnLeaderboard: boolean
  
  // Badges
  exclusiveBadges: BadgeType[]
  
  // Support
  supportPriority: number
  hasDirectLine: boolean
}

/**
 * Badge definition
 */
export interface BadgeDefinition {
  type: BadgeType
  name: string
  description: string
  iconUrl?: string
  
  // Criteria
  criteria: string
  tierRequirement?: VerificationTier
  manualAwardOnly: boolean
  
  // Benefits
  reputationBonus: number
}

/**
 * Create application input
 */
export interface CreateApplicationInput {
  applicationType: string
  organizationName?: string
  jobTitle?: string
  credentials: CredentialSubmission[]
  references?: Reference[]
}

/**
 * Review input
 */
export interface ReviewInput {
  status: 'verified' | 'rejected'
  tier?: VerificationTier
  reviewNotes?: string
  rejectionReason?: string
  expiresAt?: string
}

/**
 * Badge award input
 */
export interface AwardBadgeInput {
  userId: string
  badgeType: BadgeType
  expiresAt?: string
  description?: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating verification application
 */
export const createApplicationSchema = z.object({
  applicationType: z.string().min(1),
  organizationName: z.string().optional(),
  jobTitle: z.string().optional(),
  credentials: z.array(z.object({
    type: z.enum([
      'government_id', 'professional_license', 'official_credentials',
      'media_credentials', 'community_leader', 'organization_verification'
    ]),
    documentUrl: z.string().url().optional(),
    issuedBy: z.string().optional(),
    issuedAt: z.string().optional(),
    expiresAt: z.string().optional(),
  })),
  references: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    relationship: z.string().min(1),
  })).optional(),
})

/**
 * Schema for review
 */
export const reviewSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for verification status
 */
export function getVerificationStatusDisplayName(status: VerificationStatus): string {
  const names: Record<VerificationStatus, string> = {
    pending: 'Pending',
    under_review: 'Under Review',
    verified: 'Verified',
    rejected: 'Rejected',
    suspended: 'Suspended',
    expired: 'Expired',
  }
  return names[status]
}

/**
 * Gets color for verification status
 */
export function getVerificationStatusColor(status: VerificationStatus): string {
  const colors: Record<VerificationStatus, string> = {
    pending: 'bg-yellow-500',
    under_review: 'bg-purple-500',
    verified: 'bg-green-500',
    rejected: 'bg-red-500',
    suspended: 'bg-orange-500',
    expired: 'bg-gray-500',
  }
  return colors[status]
}

/**
 * Gets display name for verification tier
 */
export function getTierDisplayName(tier: VerificationTier): string {
  const names: Record<VerificationTier, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
  }
  return names[tier]
}

/**
 * Gets tier color
 */
export function getTierColor(tier: VerificationTier): string {
  const colors: Record<VerificationTier, string> = {
    bronze: 'text-amber-600 bg-amber-100',
    silver: 'text-gray-600 bg-gray-100',
    gold: 'text-yellow-600 bg-yellow-100',
    platinum: 'text-slate-600 bg-slate-100',
  }
  return colors[tier]
}

/**
 * Gets display name for badge type
 */
export function getBadgeTypeDisplayName(type: BadgeType): string {
  const names: Record<BadgeType, string> = {
    early_adopter: 'Early Adopter',
    verified_reporter: 'Verified Reporter',
    community_hero: 'Community Hero',
    first_responder: 'First Responder',
    trusted_source: 'Trusted Source',
    expert: 'Expert',
    lifetime_contributor: 'Lifetime Contributor',
  }
  return names[type]
}

/**
 * Gets tier benefits
 */
export function getTierBenefits(tier: VerificationTier): TierBenefits {
  const benefits: Record<VerificationTier, TierBenefits> = {
    bronze: {
      tier: 'bronze',
      alertPriority: 3,
      verificationWeight: 1.2,
      maxAlertsPerDay: 10,
      canVerifyOthers: false,
      canEscalateAlerts: false,
      hasDedicatedChannel: false,
      appearsOnLeaderboard: true,
      exclusiveBadges: ['verified_reporter'],
      supportPriority: 3,
      hasDirectLine: false,
    },
    silver: {
      tier: 'silver',
      alertPriority: 2,
      verificationWeight: 1.5,
      maxAlertsPerDay: 25,
      canVerifyOthers: true,
      canEscalateAlerts: false,
      hasDedicatedChannel: false,
      appearsOnLeaderboard: true,
      exclusiveBadges: ['verified_reporter', 'trusted_source'],
      supportPriority: 2,
      hasDirectLine: false,
    },
    gold: {
      tier: 'gold',
      alertPriority: 1,
      verificationWeight: 2.0,
      maxAlertsPerDay: 100,
      canVerifyOthers: true,
      canEscalateAlerts: true,
      hasDedicatedChannel: true,
      appearsOnLeaderboard: true,
      exclusiveBadges: ['verified_reporter', 'trusted_source', 'expert'],
      supportPriority: 1,
      hasDirectLine: true,
    },
    platinum: {
      tier: 'platinum',
      alertPriority: 0,
      verificationWeight: 3.0,
      maxAlertsPerDay: -1, // Unlimited
      canVerifyOthers: true,
      canEscalateAlerts: true,
      hasDedicatedChannel: true,
      appearsOnLeaderboard: true,
      exclusiveBadges: ['verified_reporter', 'trusted_source', 'expert', 'lifetime_contributor'],
      supportPriority: 0,
      hasDirectLine: true,
    },
  }
  return benefits[tier]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a verification application
 */
export async function createVerificationApplication(
  userId: string,
  input: CreateApplicationInput
): Promise<VerificationApplication> {
  const validationResult = createApplicationSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid application: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Create application
  const { data: application, error } = await supabase
    .from('verification_applications')
    .insert({
      user_id: userId,
      status: 'pending',
      tier: 'bronze',
      application_type: input.applicationType,
      organization_name: input.organizationName || null,
      job_title: input.jobTitle || null,
      credentials: input.credentials.map(c => ({
        ...c,
        verification_status: 'pending',
      })),
      references: input.references || [],
      supporting_documents: [],
      submitted_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating application:', error)
    throw new Error(`Failed to create application: ${error.message}`)
  }

  return mapApplicationFromDB(data)
}

/**
 * Gets a verification application
 */
export async function getVerificationApplication(
  applicationId: string
): Promise<VerificationApplication | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('verification_applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (error) {
    console.error('Error fetching application:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapApplicationFromDB(data)
}

/**
 * Gets user's verification application
 */
export async function getUserVerificationApplication(
  userId: string
): Promise<VerificationApplication | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('verification_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching application:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapApplicationFromDB(data)
}

/**
 * Gets pending applications for review
 */
export async function getPendingApplications(
  limit: number = 20,
  offset: number = 0
): Promise<VerificationApplication[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('verification_applications')
    .select('*')
    .in('status', ['pending', 'under_review'])
    .order('submitted_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching pending applications:', error)
    return []
  }

  return (data || []).map(mapApplicationFromDB)
}

/**
 * Reviews a verification application
 */
export async function reviewApplication(
  applicationId: string,
  reviewerId: string,
  input: ReviewInput
): Promise<VerificationApplication> {
  const validationResult = reviewSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid review: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Get application
  const { data: current } = await supabase
    .from('verification_applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (!current) {
    throw new Error('Application not found')
  }

  // Update application
  const updateData: Record<string, unknown> = {
    status: input.status,
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
    review_notes: input.reviewNotes || null,
    rejection_reason: input.rejectionReason || null,
    expires_at: input.expiresAt || null,
  }

  if (input.status === 'verified') {
    updateData.tier = input.tier || 'bronze'
    updateData.verified_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('verification_applications')
    .update(updateData)
    .eq('id', applicationId)
    .select('*')
    .single()

  if (error) {
    console.error('Error reviewing application:', error)
    throw new Error(`Failed to review: ${error.message}`)
  }

  // If verified, create/update verification profile
  if (input.status === 'verified') {
    await upsertVerificationProfile(data.user_id, {
      status: 'verified',
      tier: input.tier || 'bronze',
      verifiedAt: new Date().toISOString(),
      expiresAt: input.expiresAt || null,
    })

    // Award verified reporter badge
    await awardBadge(data.user_id, 'verified_reporter')
  }

  return mapApplicationFromDB(data)
}

/**
 * Gets user verification profile
 */
export async function getVerificationProfile(
  userId: string
): Promise<VerificationProfile | null> {
  const supabase = createClient()

  // Get verification data
  const { data: verification } = await supabase
    .from('verification_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!verification) {
    return null
  }

  // Get badges
  const { data: badges } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .eq('is_visible', true)
    .order('earned_at', { ascending: false })

  // Get user stats
  const { count: totalReports } = await supabase
    .from('community_alerts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  const { count: verifiedReports } = await supabase
    .from('community_alerts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('verification_status', 'verified')

  const { count: confirmations } = await supabase
    .from('alert_confirmations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  const benefits = getTierBenefits(verification.tier)

  return {
    userId,
    status: verification.status as VerificationStatus,
    tier: verification.tier as VerificationTier,
    badges: (badges || []).map(b => ({
      id: b.id,
      type: b.badge_type as BadgeType,
      name: getBadgeTypeDisplayName(b.badge_type as BadgeType),
      iconUrl: b.icon_url || undefined,
      earnedAt: b.earned_at,
      expiresAt: b.expires_at || undefined,
      isVisible: b.is_visible,
      isFeatured: b.is_featured,
    })),
    totalReports: totalReports || 0,
    verifiedReports: verifiedReports || 0,
    confirmationRate: totalReports ? Math.round((confirmations! / totalReports) * 100) : 0,
    averageRating: verification.average_rating || 0,
    reputationScore: verification.reputation_score || 0,
    canVerifyOthers: benefits.canVerifyOthers,
    canEscalateAlerts: benefits.canEscalateAlerts,
    priorityInAlerts: benefits.alertPriority,
    verifiedAt: verification.verified_at || undefined,
    expiresAt: verification.expires_at || undefined,
    lastReviewAt: verification.last_review_at || undefined,
  }
}

/**
 * Awards a badge to user
 */
export async function awardBadge(
  userId: string,
  badgeType: BadgeType,
  options?: {
    expiresAt?: string
    description?: string
  }
): Promise<UserBadge> {
  const supabase = createClient()

  const badgeDefinition = getBadgeDefinition(badgeType)

  const { data, error } = await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_type: badgeType,
      name: badgeDefinition.name,
      description: options?.description || badgeDefinition.description,
      icon_url: badgeDefinition.iconUrl || null,
      earned_at: new Date().toISOString(),
      expires_at: options?.expiresAt || null,
      is_visible: true,
      is_featured: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error awarding badge:', error)
    throw new Error(`Failed to award badge: ${error.message}`)
  }

  // Update reputation score
  await updateReputationScore(userId, badgeDefinition.reputationBonus)

  return {
    id: data.id,
    type: data.badge_type as BadgeType,
    name: data.name,
    description: data.description || undefined,
    iconUrl: data.icon_url || undefined,
    earnedAt: data.earned_at,
    expiresAt: data.expires_at || undefined,
    isVisible: data.is_visible,
    isFeatured: data.is_featured,
  }
}

/**
 * Gets user's badges
 */
export async function getUserBadges(
  userId: string,
  visibleOnly: boolean = true
): Promise<UserBadge[]> {
  const supabase = createClient()

  let query = supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (visibleOnly) {
    query = query.eq('is_visible', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching badges:', error)
    return []
  }

  return (data || []).map(b => ({
    id: b.id,
    type: b.badge_type as BadgeType,
    name: b.name,
    description: b.description || undefined,
    iconUrl: b.icon_url || undefined,
    earnedAt: b.earned_at,
    expiresAt: b.expires_at || undefined,
    isVisible: b.is_visible,
    isFeatured: b.is_featured,
  }))
}

/**
 * Gets leaderboard
 */
export async function getLeaderboard(
  options?: {
    limit?: number
    tier?: VerificationTier
    municipality?: string
  }
): Promise<TopContributor[]> {
  const supabase = createClient()

  let query = supabase
    .from('verification_profiles')
    .select(`
      user_id,
      tier,
      reputation_score,
      verified_at,
      profiles!inner (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('status', 'verified')
    .order('reputation_score', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.tier) {
    query = query.eq('tier', options.tier)
  }

  const { data } = await query

  if (!data || data.length === 0) {
    return []
  }

  return (data || []).map((item, index) => ({
    userId: item.user_id,
    displayName: item.profiles?.display_name,
    avatarUrl: item.profiles?.avatar_url,
    contributions: 0,
    verifiedReports: 0,
    impactScore: item.reputation_score || 0,
    rank: index + 1,
  }))
}

/**
 * Suspends verification
 */
export async function suspendVerification(
  userId: string,
  reason: string
): Promise<VerificationProfile> {
  const supabase = createClient()

  await supabase
    .from('verification_profiles')
    .update({
      status: 'suspended',
      suspension_reason: reason,
      last_review_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return getVerificationProfile(userId) as Promise<VerificationProfile>
}

/**
 * Reinstates verification
 */
export async function reinstateVerification(
  userId: string
): Promise<VerificationProfile> {
  const supabase = createClient()

  await supabase
    .from('verification_profiles')
    .update({
      status: 'verified',
      last_review_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return getVerificationProfile(userId) as Promise<VerificationProfile>
}

/**
 * Gets verification statistics
 */
export async function getVerificationStats(): Promise<{
  totalVerified: number
  byTier: Record<VerificationTier, number>
  pendingApplications: number
  averageConfirmationRate: number
  topContributors: TopContributor[]
}> {
  const supabase = await createClient()

  // Total verified
  const { count: totalVerified } = await supabase
    .from('verification_profiles')
    .select('*', { count: 'exact' })
    .eq('status', 'verified')

  // By tier
  const { data: byTierData } = await supabase
    .from('verification_profiles')
    .select('tier', { count: 'exact' })
    .eq('status', 'verified')

  const byTier: Record<VerificationTier, number> = {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
  }

  for (const item of byTierData || []) {
    if (byTier[item.tier as VerificationTier] !== undefined) {
      byTier[item.tier as VerificationTier]++
    }
  }

  // Pending
  const { count: pendingApplications } = await supabase
    .from('verification_applications')
    .select('*', { count: 'exact' })
    .in('status', ['pending', 'under_review'])

  // Average confirmation rate
  const { data: profiles } = await supabase
    .from('verification_profiles')
    .select('average_rating')
    .eq('status', 'verified')

  const avgRating = profiles?.reduce((sum, p) => sum + (p.average_rating || 0), 0) / (profiles?.length || 1)

  // Top contributors
  const topContributors = await getLeaderboard({ limit: 5 })

  return {
    totalVerified: totalVerified || 0,
    byTier,
    pendingApplications: pendingApplications || 0,
    averageConfirmationRate: Math.round(avgRating * 20), // Convert to percentage
    topContributors,
  }
}

/**
 * Calculates verification tier based on metrics
 */
export async function calculateTier(
  userId: string
): Promise<VerificationTier> {
  const profile = await getVerificationProfile(userId)

  if (!profile) {
    return 'bronze'
  }

  const { verifiedReports, confirmationRate, averageRating, reputationScore } = profile

  // Platinum criteria
  if (reputationScore >= 1000 && verifiedReports >= 100 && confirmationRate >= 90) {
    return 'platinum'
  }

  // Gold criteria
  if (reputationScore >= 500 && verifiedReports >= 50 && confirmationRate >= 85) {
    return 'gold'
  }

  // Silver criteria
  if (reputationScore >= 200 && verifiedReports >= 20 && confirmationRate >= 80) {
    return 'silver'
  }

  return 'bronze'
}

/**
 * Upgrades verification tier
 */
export async function upgradeTier(
  userId: string,
  newTier: VerificationTier
): Promise<VerificationProfile> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('verification_profiles')
    .update({
      tier: newTier,
      last_review_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    console.error('Error upgrading tier:', error)
    throw new Error(`Failed to upgrade tier: ${error.message}`)
  }

  // Award tier badge
  const tierBadges: Record<VerificationTier, BadgeType> = {
    bronze: 'verified_reporter',
    silver: 'trusted_source',
    gold: 'expert',
    platinum: 'lifetime_contributor',
  }

  await awardBadge(userId, tierBadges[newTier])

  return getVerificationProfile(userId) as Promise<VerificationProfile>
}

/**
 * Submits verification appeal
 */
export async function submitAppeal(
  userId: string,
  reason: string,
  supportingDocuments?: string[]
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('verification_appeals')
    .insert({
      user_id: userId,
      reason,
      supporting_documents: supportingDocuments || [],
      status: 'pending',
    })
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to VerificationApplication
 */
function mapApplicationFromDB(data: Record<string, unknown>): VerificationApplication {
  return {
    id: data.id,
    userId: data.user_id,
    status: data.status as VerificationStatus,
    tier: data.tier as VerificationTier,
    applicationType: data.application_type,
    organizationName: data.organization_name as string | undefined,
    jobTitle: data.job_title as string | undefined,
    credentials: (data.credentials as CredentialSubmission[]) || [],
    supportingDocuments: (data.supporting_documents as string[]) || [],
    references: (data.references as Reference[]) || [],
    reviewedBy: data.reviewed_by as string | undefined,
    reviewedAt: data.reviewed_at as string | undefined,
    reviewNotes: data.review_notes as string | undefined,
    rejectionReason: data.rejection_reason as string | undefined,
    expiresAt: data.expires_at as string | undefined,
    submittedAt: data.submitted_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Gets badge definition
 */
function getBadgeDefinition(type: BadgeType): BadgeDefinition {
  const definitions: Record<BadgeType, BadgeDefinition> = {
    early_adopter: {
      type: 'early_adopter',
      name: 'Early Adopter',
      description: 'One of the first users to join NeighborPulse',
      criteria: 'Joined within the first month of launch',
      manualAwardOnly: true,
      reputationBonus: 50,
    },
    verified_reporter: {
      type: 'verified_reporter',
      name: 'Verified Reporter',
      description: 'Successfully completed the verification process',
      criteria: 'Verification application approved',
      manualAwardOnly: false,
      reputationBonus: 100,
    },
    community_hero: {
      type: 'community_hero',
      name: 'Community Hero',
      description: 'Made significant contributions to community safety',
      criteria: 'Nominated by peers and approved by moderators',
      manualAwardOnly: true,
      reputationBonus: 200,
    },
    first_responder: {
      type: 'first_responder',
      name: 'First Responder',
      description: 'Professional first responder verified by the platform',
      criteria: 'Government-issued credentials verified',
      manualAwardOnly: true,
      reputationBonus: 150,
    },
    trusted_source: {
      type: 'trusted_source',
      name: 'Trusted Source',
      description: 'Consistently provides verified and accurate reports',
      criteria: 'Silver tier verified reporter with 85%+ confirmation rate',
      tierRequirement: 'silver',
      manualAwardOnly: false,
      reputationBonus: 150,
    },
    expert: {
      type: 'expert',
      name: 'Expert',
      description: 'Recognized expert in a relevant field',
      criteria: 'Professional credentials verified in relevant field',
      tierRequirement: 'gold',
      manualAwardOnly: true,
      reputationBonus: 250,
    },
    lifetime_contributor: {
      type: 'lifetime_contributor',
      name: 'Lifetime Contributor',
      description: 'Exceptional long-term contribution to community safety',
      criteria: 'Platinum tier with 100+ verified reports',
      tierRequirement: 'platinum',
      manualAwardOnly: true,
      reputationBonus: 500,
    },
  }
  return definitions[type]
}

/**
 * Upserts verification profile
 */
async function upsertVerificationProfile(
  userId: string,
  data: {
    status: VerificationStatus
    tier: VerificationTier
    verifiedAt?: string
    expiresAt?: string
  }
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('verification_profiles')
    .upsert({
      user_id: userId,
      status: data.status,
      tier: data.tier,
      verified_at: data.verifiedAt || null,
      expires_at: data.expiresAt || null,
      last_review_at: new Date().toISOString(),
    })
}

/**
 * Updates reputation score
 */
async function updateReputationScore(
  userId: string,
  delta: number
): Promise<void> {
  const supabase = createClient()

  await supabase.rpc('update_reputation_score', {
    user_id: userId,
    delta,
  })
}
