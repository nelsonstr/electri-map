import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'revoked'

export type ReporterTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export type VerificationMethod = 'id_document' | 'social_media' | 'professional' | 'community' | 'automated'

export interface VerifiedReporter {
  id: string
  userId: string
  
  // Verification Details
  status: VerificationStatus
  tier: ReporterTier
  verificationMethod: VerificationMethod
  verificationDate?: string
  expirationDate?: string
  
  // Background
  organization?: string
  role?: string
  credentials?: string[]
  badges: ReporterBadge[]
  
  // Performance Metrics
  totalReports: number
  verifiedReports: number
  accuracyScore: number
  reliabilityScore: number
  averageResponseTime: number
  
  // Activity
  lastReportAt?: string
  streak: number
  points: number
  
  // Constraints
  maxReportsPerDay?: number
  categories: string[]
  
  // Audit
  verifiedBy?: string
  rejectionReason?: string
  notes: string[]
  
  createdAt: string
  updatedAt: string
}

export interface ReporterBadge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: string
  category: 'accuracy' | 'volume' | 'specialty' | 'community' | 'achievement'
}

export interface VerificationApplication {
  id: string
  userId: string
  
  // Application Details
  status: VerificationStatus
  submittedAt: string
  reviewedAt?: string
  
  // Documents
  documents: Array<{
    type: string
    url: string
    verified: boolean
  }>
  
  // Information
  organization?: string
  role?: string
  credentials: string[]
  justification: string
  
  // Review
  reviewerId?: string
  reviewNotes?: string
  rejectionReason?: string
}

export interface ReportVerification {
  id: string
  reportId: string
  verifierId: string
  
  // Verification Result
  status: 'verified' | 'unverified' | 'disputed' | 'pending'
  accuracyRating: number
  reliabilityRating: number
  
  // Details
  notes: string
  sources?: string[]
  
  createdAt: string
}

export interface CreateApplicationInput {
  userId: string
  organization?: string
  role?: string
  credentials?: string[]
  justification: string
}

export interface UpdateReporterInput {
  reporterId: string
  tier?: ReporterTier
  categories?: string[]
  maxReportsPerDay?: number
  notes?: string
}

export interface VerifyReportInput {
  reportId: string
  verifierId: string
  status: 'verified' | 'unverified' | 'disputed'
  accuracyRating: number
  reliabilityRating: number
  notes: string
  sources?: string[]
}

// ============================================================================
// Status Configuration
// ============================================================================

export const VERIFICATION_STATUS_CONFIG: Record<VerificationStatus, {
  label: string
  color: string
  icon: string
  description: string
}> = {
  pending: { label: 'Pending', color: '#f59e0b', icon: '⏳', description: 'Application under review' },
  under_review: { label: 'Under Review', color: '#8b5cf6', icon: '🔍', description: 'Being actively reviewed' },
  approved: { label: 'Approved', color: '#22c55e', icon: '✅', description: 'Verification approved' },
  rejected: { label: 'Rejected', color: '#dc2626', icon: '❌', description: 'Application rejected' },
  revoked: { label: 'Revoked', color: '#6b7280', icon: '🚫', description: 'Verification revoked' },
}

export const REPORTER_TIER_CONFIG: Record<ReporterTier, {
  label: string
  color: string
  icon: string
  benefits: string[]
  requirements: {
    minReports: number
    minAccuracy: number
    minReliability: number
  }
}> = {
  bronze: {
    label: 'Bronze',
    color: '#cd7f32',
    icon: '🥉',
    benefits: ['Basic verification badge', 'Priority in review queue'],
    requirements: { minReports: 1, minAccuracy: 50, minReliability: 50 },
  },
  silver: {
    label: 'Silver',
    color: '#c0c0c0',
    icon: '🥈',
    benefits: ['Enhanced badge', 'Faster approval', 'Access to analytics'],
    requirements: { minReports: 25, minAccuracy: 70, minReliability: 70 },
  },
  gold: {
    label: 'Gold',
    color: '#ffd700',
    icon: '🥇',
    benefits: ['Premium badge', 'Direct line to admins', 'Early access features'],
    requirements: { minReports: 100, minAccuracy: 85, minReliability: 85 },
  },
  platinum: {
    label: 'Platinum',
    color: '#e5e4e2',
    icon: '💎',
    benefits: ['Elite status', 'White-glove support', 'Advisory role'],
    requirements: { minReports: 500, minAccuracy: 95, minReliability: 95 },
  },
}

export const BADGE_CONFIG: Record<string, {
  name: string
  description: string
  icon: string
  category: ReporterBadge['category']
}> = {
  first_report: { name: 'First Report', description: 'Submitted first verified report', icon: '📝', category: 'achievement' },
  century: { name: 'Century', description: '100 verified reports', icon: '💯', category: 'volume' },
  accuracy_master: { name: 'Accuracy Master', description: '95%+ accuracy rating', icon: '🎯', category: 'accuracy' },
  emergency_responder: { name: 'Emergency Responder', description: 'Reported 10+ emergencies', icon: '🚨', category: 'specialty' },
  community_hero: { name: 'Community Hero', description: 'Voted by community', icon: '🦸', category: 'community' },
  streak_master: { name: 'Streak Master', description: '30-day reporting streak', icon: '🔥', category: 'achievement' },
  quick_responder: { name: 'Quick Responder', description: 'Average response under 5 minutes', icon: '⚡', category: 'achievement' },
  verified_expert: { name: 'Verified Expert', description: 'Professional verification', icon: '🏆', category: 'specialty' },
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createApplicationSchema = z.object({
  userId: z.string(),
  organization: z.string().optional(),
  role: z.string().optional(),
  credentials: z.array(z.string()).optional(),
  justification: z.string().min(50),
})

export const updateReporterSchema = z.object({
  reporterId: z.string(),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
  categories: z.array(z.string()).optional(),
  maxReportsPerDay: z.number().positive().optional(),
  notes: z.string().optional(),
})

export const verifyReportSchema = z.object({
  reportId: z.string(),
  verifierId: z.string(),
  status: z.enum(['verified', 'unverified', 'disputed']),
  accuracyRating: z.number().min(1).max(5),
  reliabilityRating: z.number().min(1).max(5),
  notes: z.string(),
  sources: z.array(z.string()).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getStatusDisplayName(status: VerificationStatus): string {
  return VERIFICATION_STATUS_CONFIG[status]?.label || status
}

export function getStatusColor(status: VerificationStatus): string {
  return VERIFICATION_STATUS_CONFIG[status]?.color || '#6b7280'
}

export function getTierDisplayName(tier: ReporterTier): string {
  return REPORTER_TIER_CONFIG[tier]?.label || tier
}

export function getTierColor(tier: ReporterTier): string {
  return REPORTER_TIER_CONFIG[tier]?.color || '#6b7280'
}

export function getTierIcon(tier: ReporterTier): string {
  return REPORTER_TIER_CONFIG[tier]?.icon || '📊'
}

export function calculateReporterScore(
  totalReports: number,
  verifiedReports: number,
  accuracyScore: number,
  reliabilityScore: number
): number {
  const verificationRate = totalReports > 0 ? (verifiedReports / totalReports) * 100 : 0
  const score = (verificationRate * 0.3) + (accuracyScore * 0.3) + (reliabilityScore * 0.2) + (Math.min(totalReports / 100, 100) * 0.2)
  return Math.round(Math.min(score, 100))
}

export function determineTier(
  totalReports: number,
  accuracyScore: number,
  reliabilityScore: number
): ReporterTier {
  const config = REPORTER_TIER_CONFIG

  if (totalReports >= 500 && accuracyScore >= 95 && reliabilityScore >= 95) return 'platinum'
  if (totalReports >= 100 && accuracyScore >= 85 && reliabilityScore >= 85) return 'gold'
  if (totalReports >= 25 && accuracyScore >= 70 && reliabilityScore >= 70) return 'silver'
  return 'bronze'
}

export function getNextTierRequirements(tier: ReporterTier): {
  reports: number
  accuracy: number
  reliability: number
} | null {
  const requirements: Record<ReporterTier, { reports: number; accuracy: number; reliability: number }> = {
    bronze: { reports: 25, accuracy: 70, reliability: 70 },
    silver: { reports: 100, accuracy: 85, reliability: 85 },
    gold: { reports: 500, accuracy: 95, reliability: 95 },
    platinum: { reports: 0, accuracy: 0, reliability: 0 },
  }

  return requirements[tier] || null
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function submitApplication(
  input: CreateApplicationInput
): Promise<VerificationApplication> {
  const validationResult = createApplicationSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const application: VerificationApplication = {
    id: applicationId,
    userId: input.userId,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    documents: [],
    organization: input.organization,
    role: input.role,
    credentials: input.credentials || [],
    justification: input.justification,
  }

  const { error } = await supabase
    .from('verification_applications')
    .insert({
      id: applicationId,
      user_id: input.userId,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      organization: input.organization,
      role: input.role,
      credentials: input.credentials || [],
      justification: input.justification,
    })

  if (error) {
    console.error('Error submitting application:', error)
    throw new Error('Failed to submit verification application')
  }

  return application
}

export async function reviewApplication(
  applicationId: string,
  reviewerId: string,
  approved: boolean,
  notes?: string,
  rejectionReason?: string
): Promise<VerificationApplication> {
  const supabase = createClient()

  const status: VerificationStatus = approved ? 'approved' : 'rejected'

  const { error } = await supabase
    .from('verification_applications')
    .update({
      status,
      reviewer_id: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
      rejection_reason: rejectionReason,
    })
    .eq('id', applicationId)

  if (error) {
    console.error('Error reviewing application:', error)
    throw new Error('Failed to review application')
  }

  // If approved, create verified reporter record
  if (approved) {
    await createReporterFromApplication(applicationId, reviewerId)
  }

  const { data } = await supabase
    .from('verification_applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  return data as unknown as VerificationApplication
}

async function createReporterFromApplication(
  applicationId: string,
  verifiedBy: string
): Promise<VerifiedReporter> {
  const supabase = createClient()

  const { data: application } = await supabase
    .from('verification_applications')
    .select('*')
    .eq('id', applicationId)
    .eq('id', applicationId)
    .single()

  const typedApplication = application as unknown as VerificationApplication

  if (!application) {
    throw new Error('Application not found')
  }

  const reporterId = `reporter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const reporter: VerifiedReporter = {
    id: reporterId,
    userId: typedApplication.userId,
    status: 'approved',
    tier: 'bronze',
    verificationMethod: 'professional',
    verificationDate: new Date().toISOString(),
    organization: typedApplication.organization,
    role: typedApplication.role,
    credentials: typedApplication.credentials || [],
    badges: [],
    totalReports: 0,
    verifiedReports: 0,
    accuracyScore: 0,
    reliabilityScore: 0,
    averageResponseTime: 0,
    streak: 0,
    points: 100,
    categories: [],
    notes: [],
    verifiedBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await supabase
    .from('verified_reporters')
    .insert({
      id: reporterId,
      user_id: typedApplication.userId,
      status: 'approved',
      tier: 'bronze',
      verification_method: 'professional',
      verification_date: new Date().toISOString(),
      organization: typedApplication.organization,
      role: typedApplication.role,
      credentials: typedApplication.credentials || [],
      badges: [],
      total_reports: 0,
      verified_reports: 0,
      accuracy_score: 0,
      reliability_score: 0,
      average_response_time: 0,
      streak: 0,
      points: 100,
      categories: [],
      notes: [],
      verified_by: verifiedBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  return reporter
}

export async function getReporter(
  reporterId: string
): Promise<VerifiedReporter | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('verified_reporters')
    .select('*')
    .eq('id', reporterId)
    .single()

  if (error || !data) return null

  return mapReporterFromDB(data)
}

export async function getReporterByUserId(
  userId: string
): Promise<VerifiedReporter | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('verified_reporters')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  return mapReporterFromDB(data)
}

export async function updateReporter(
  input: UpdateReporterInput,
  updatedBy: string
): Promise<VerifiedReporter> {
  const validationResult = updateReporterSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const reporter = await getReporter(input.reporterId)
  if (!reporter) {
    throw new Error('Reporter not found')
  }

  const updates: Partial<VerifiedReporter> = {
    updatedAt: new Date().toISOString(),
    notes: [...reporter.notes],
  }

  if (input.tier) updates.tier = input.tier
  if (input.categories) updates.categories = input.categories
  if (input.maxReportsPerDay) updates.maxReportsPerDay = input.maxReportsPerDay
  if (input.notes) {
    updates.notes = updates.notes || []
    updates.notes.push(`[${new Date().toISOString()}] ${updatedBy}: ${input.notes}`)
  }

  const { error } = await supabase
    .from('verified_reporters')
    .update({
      tier: updates.tier,
      categories: updates.categories,
      max_reports_per_day: updates.maxReportsPerDay,
      notes: updates.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.reporterId)

  if (error) {
    console.error('Error updating reporter:', error)
    throw new Error('Failed to update reporter')
  }

  return getReporter(input.reporterId) as Promise<VerifiedReporter>
}

export async function verifyReport(
  input: VerifyReportInput
): Promise<ReportVerification> {
  const validationResult = verifyReportSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const verificationId = `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const verification: ReportVerification = {
    id: verificationId,
    reportId: input.reportId,
    verifierId: input.verifierId,
    status: input.status,
    accuracyRating: input.accuracyRating,
    reliabilityRating: input.reliabilityRating,
    notes: input.notes,
    sources: input.sources,
    createdAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('report_verifications')
    .insert({
      id: verificationId,
      report_id: input.reportId,
      verifier_id: input.verifierId,
      status: input.status,
      accuracy_rating: input.accuracyRating,
      reliability_rating: input.reliabilityRating,
      notes: input.notes,
      sources: input.sources,
      created_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error verifying report:', error)
    throw new Error('Failed to verify report')
  }

  // Update reporter stats if verification is for a verified reporter's report
  if (input.status === 'verified') {
    await updateReporterStatsAfterVerification(input.reportId)
  }

  return verification
}

async function updateReporterStatsAfterVerification(reportId: string): Promise<void> {
  const supabase = createClient()

  // Get report to find reporter
  const { data: report } = await supabase
    .from('reports')
    .select('user_id')
    .eq('id', reportId)
    .single()

  if (!report) return

  // Get all verifications for this report
  const { data: verifications } = await supabase
    .from('report_verifications')
    .select('*')
    .eq('report_id', reportId)

  if (!verifications || verifications.length === 0) return

  // Calculate average ratings
  const avgAccuracy = verifications.reduce((sum, v) => sum + (v.accuracy_rating as number), 0) / verifications.length
  const avgReliability = verifications.reduce((sum, v) => sum + (v.reliability_rating as number), 0) / verifications.length

  // Update reporter
  await supabase.rpc('increment_reporter_verified_reports', {
    reporter_id: report.user_id,
    accuracy_score: avgAccuracy,
    reliability_score: avgReliability,
  })

  // Check for new badges
  await checkAndAwardBadges(report.user_id as string)
}

async function checkAndAwardBadges(reporterId: string): Promise<void> {
  const supabase = createClient()

  const reporter = await getReporter(reporterId)
  if (!reporter) return

  const newBadges: ReporterBadge[] = []
  const now = new Date().toISOString()

  // Check for badges
  if (reporter.totalReports >= 1 && !reporter.badges.find(b => b.id === 'first_report')) {
    newBadges.push({
      id: 'first_report',
      name: BADGE_CONFIG.first_report.name,
      description: BADGE_CONFIG.first_report.description,
      icon: BADGE_CONFIG.first_report.icon,
      earnedAt: now,
      category: 'achievement',
    })
  }

  if (reporter.totalReports >= 100 && !reporter.badges.find(b => b.id === 'century')) {
    newBadges.push({
      id: 'century',
      name: BADGE_CONFIG.century.name,
      description: BADGE_CONFIG.century.description,
      icon: BADGE_CONFIG.century.icon,
      earnedAt: now,
      category: 'volume',
    })
  }

  if (reporter.accuracyScore >= 95 && !reporter.badges.find(b => b.id === 'accuracy_master')) {
    newBadges.push({
      id: 'accuracy_master',
      name: BADGE_CONFIG.accuracy_master.name,
      description: BADGE_CONFIG.accuracy_master.description,
      icon: BADGE_CONFIG.accuracy_master.icon,
      earnedAt: now,
      category: 'accuracy',
    })
  }

  if (newBadges.length > 0) {
    const updatedBadges = [...reporter.badges, ...newBadges]

    await supabase
      .from('verified_reporters')
      .update({ badges: updatedBadges })
      .eq('id', reporterId)
  }
}

export async function revokeVerification(
  reporterId: string,
  reason: string,
  revokedBy: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('verified_reporters')
    .update({
      status: 'revoked',
      notes: [`[${new Date().toISOString()}] Revoked by ${revokedBy}: ${reason}`],
      updated_at: new Date().toISOString(),
    })
    .eq('id', reporterId)
}

export async function getTopReporters(
  limit: number = 10,
  tier?: ReporterTier
): Promise<VerifiedReporter[]> {
  const supabase = createClient()

  let query = supabase
    .from('verified_reporters')
    .select('*')
    .eq('status', 'approved')
    .order('points', { ascending: false })
    .limit(limit)

  if (tier) {
    query = query.eq('tier', tier)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching top reporters:', error)
    return []
  }

  return (data || []).map(mapReporterFromDB)
}

export async function getReporterLeaderboard(
  limit: number = 100,
  category?: string
): Promise<Array<{
  rank: number
  reporter: VerifiedReporter
  score: number
}>> {
  const reporters = await getTopReporters(limit)

  const scored = reporters.map(reporter => ({
    reporter,
    score: calculateReporterScore(
      reporter.totalReports,
      reporter.verifiedReports,
      reporter.accuracyScore,
      reporter.reliabilityScore
    ),
  }))

  scored.sort((a, b) => b.score - a.score)

  return scored.map((item, index) => ({
    rank: index + 1,
    reporter: item.reporter,
    score: item.score,
  }))
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapReporterFromDB(data: Record<string, unknown>): VerifiedReporter {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    status: data.status as VerificationStatus,
    tier: data.tier as ReporterTier,
    verificationMethod: data.verification_method as VerificationMethod,
    verificationDate: data.verification_date as string | undefined,
    expirationDate: data.expiration_date as string | undefined,
    organization: data.organization as string | undefined,
    role: data.role as string | undefined,
    credentials: (data.credentials as string[]) || [],
    badges: (data.badges as ReporterBadge[]) || [],
    totalReports: data.total_reports as number,
    verifiedReports: data.verified_reports as number,
    accuracyScore: data.accuracy_score as number,
    reliabilityScore: data.reliability_score as number,
    averageResponseTime: data.average_response_time as number,
    lastReportAt: data.last_report_at as string | undefined,
    streak: data.streak as number,
    points: data.points as number,
    maxReportsPerDay: data.max_reports_per_day as number | undefined,
    categories: (data.categories as string[]) || [],
    verifiedBy: data.verified_by as string | undefined,
    rejectionReason: data.rejection_reason as string | undefined,
    notes: (data.notes as string[]) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
