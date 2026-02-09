import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type VerificationStatus =
  | 'pending'
  | 'sent'
  | 'verified'
  | 'failed'
  | 'expired'
  | 'cancelled'

export type VerificationType =
  | 'email_confirmation'
  | 'email_change'
  | 'password_reset'
  | 'account_recovery'
  | 'security_alert'
  | 'promotional'

export interface EmailVerificationRequest {
  id: string
  userId: string
  email: string
  verificationToken: string
  tokenHash: string
  type: VerificationType
  status: VerificationStatus
  attempts: number
  maxAttempts: number
  createdAt: string
  expiresAt: string
  verifiedAt?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export interface VerifiedEmail {
  id: string
  userId: string
  email: string
  isPrimary: boolean
  isVerified: boolean
  verifiedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateVerificationInput {
  userId: string
  email: string
  type: VerificationType
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export interface VerifyEmailInput {
  token: string
  userId: string
}

export interface VerificationStatistics {
  totalRequests: number
  successfulVerifications: number
  expiredRequests: number
  failedAttempts: number
  averageVerificationTime: number
  successRate: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createVerificationSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  type: z.enum([
    'email_confirmation',
    'email_change',
    'password_reset',
    'account_recovery',
    'security_alert',
    'promotional',
  ]),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
  userId: z.string().uuid(),
})

export const resendVerificationSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getVerificationStatusDisplayName(status: VerificationStatus): string {
  const names: Record<VerificationStatus, string> = {
    pending: 'Pending',
    sent: 'Verification Sent',
    verified: 'Verified',
    failed: 'Failed',
    expired: 'Expired',
    cancelled: 'Cancelled',
  }
  return names[status]
}

export function getVerificationTypeDisplayName(type: VerificationType): string {
  const names: Record<VerificationType, string> = {
    email_confirmation: 'Email Confirmation',
    email_change: 'Email Change',
    password_reset: 'Password Reset',
    account_recovery: 'Account Recovery',
    security_alert: 'Security Alert',
    promotional: 'Promotional',
  }
  return names[type]
}

export function generateVerificationToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function getExpiryDuration(type: VerificationType): number {
  const durations: Record<VerificationType, number> = {
    email_confirmation: 24 * 60 * 60 * 1000,
    email_change: 1 * 60 * 60 * 1000,
    password_reset: 1 * 60 * 60 * 1000,
    account_recovery: 24 * 60 * 60 * 1000,
    security_alert: 1 * 60 * 60 * 1000,
    promotional: 7 * 24 * 60 * 60 * 1000,
  }
  return durations[type]
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createEmailVerification(
  input: CreateVerificationInput
): Promise<{ requestId: string; expiresAt: string }> {
  const validationResult = createVerificationSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid request: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data: existing } = await supabase
    .from('email_verification_requests')
    .select('*')
    .eq('user_id', input.userId)
    .eq('email', input.email.toLowerCase())
    .eq('type', input.type)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existing) {
    return { requestId: existing.id, expiresAt: existing.expires_at }
  }

  const token = generateVerificationToken()
  const tokenHash = await hashToken(token)
  const expiresAt = new Date(Date.now() + getExpiryDuration(input.type))
  const requestId = `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { error } = await supabase
    .from('email_verification_requests')
    .insert({
      id: requestId,
      user_id: input.userId,
      email: input.email.toLowerCase(),
      verification_token: token,
      token_hash: tokenHash,
      type: input.type,
      status: 'pending',
      attempts: 0,
      max_attempts: 5,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
      metadata: input.metadata || null,
    })

  if (error) {
    console.error('Error creating verification:', error)
    throw new Error('Failed to create verification request')
  }

  return { requestId, expiresAt: expiresAt.toISOString() }
}

export async function verifyEmail(
  input: VerifyEmailInput
): Promise<{ success: boolean; error?: string }> {
  const validationResult = verifyEmailSchema.safeParse(input)
  if (!validationResult.success) {
    return { success: false, error: 'Invalid request format' }
  }

  const supabase = createClient()

  const { data: request, error } = await supabase
    .from('email_verification_requests')
    .select('*')
    .eq('user_id', input.userId)
    .eq('verification_token', input.token)
    .in('status', ['pending', 'sent'])
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !request) {
    return { success: false, error: 'Invalid or expired verification token' }
  }

  if (request.attempts >= request.max_attempts) {
    await supabase
      .from('email_verification_requests')
      .update({ status: 'failed' })
      .eq('id', request.id)
    return { success: false, error: 'Maximum verification attempts exceeded' }
  }

  await supabase
    .from('email_verification_requests')
    .update({ attempts: request.attempts + 1 })
    .eq('id', request.id)

  await supabase
    .from('email_verification_requests')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
    })
    .eq('id', request.id)

  const { data: existingVerified } = await supabase
    .from('verified_emails')
    .select('*')
    .eq('user_id', input.userId)
    .eq('email', request.email)
    .single()

  if (existingVerified) {
    await supabase
      .from('verified_emails')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingVerified.id)
  } else {
    await supabase.from('verified_emails').insert({
      id: `ve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: input.userId,
      email: request.email,
      is_primary: false,
      is_verified: true,
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  if (request.type === 'email_change' || request.type === 'email_confirmation') {
    await supabase
      .from('auth_users')
      .update({
        email: request.email,
        email_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.userId)
  }

  return { success: true }
}

export async function resendVerification(
  userId: string,
  email?: string
): Promise<{ success: boolean; requestId?: string; expiresAt?: string; error?: string }> {
  const supabase = createClient()

  let targetEmail = email
  if (!targetEmail) {
    const { data: user } = await supabase
      .from('auth_users')
      .select('email')
      .eq('id', userId)
      .single()

    if (!user?.email) {
      return { success: false, error: 'No email found for user' }
    }
    targetEmail = user.email
  }

  const { data: recentRequest } = await supabase
    .from('email_verification_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('email', targetEmail.toLowerCase())
    .eq('type', 'email_confirmation')
    .in('status', ['pending', 'sent'])
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (recentRequest) {
    const createdAt = new Date(recentRequest.created_at)
    if (Date.now() - createdAt.getTime() < 60000) {
      return { success: false, error: 'Please wait 60 seconds before requesting again' }
    }
  }

  const { requestId, expiresAt } = await createEmailVerification({
    userId,
    email: targetEmail,
    type: 'email_confirmation',
  })

  console.log(`Verification email sent to ${targetEmail}`)

  return { success: true, requestId, expiresAt }
}

export async function getVerifiedEmails(userId: string): Promise<VerifiedEmail[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('verified_emails')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching verified emails:', error)
    return []
  }

  return (data || []).map(mapVerifiedEmailFromDB)
}

export async function isEmailVerified(userId: string, email?: string): Promise<boolean> {
  const supabase = createClient()

  let query = supabase
    .from('verified_emails')
    .select('*')
    .eq('user_id', userId)
    .eq('is_verified', true)

  if (email) {
    query = query.eq('email', email.toLowerCase())
  }

  const { data, error } = await query

  if (error || !data || data.length === 0) {
    return false
  }

  return true
}

export async function getPendingVerification(
  userId: string
): Promise<EmailVerificationRequest | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('email_verification_requests')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'sent'])
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return mapRequestFromDB(data)
}

export async function cancelVerification(userId: string, email?: string): Promise<void> {
  const supabase = createClient()

  let query = supabase
    .from('email_verification_requests')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'pending')

  if (email) {
    query = query.eq('email', email.toLowerCase())
  }

  await query
}

export async function verifyEmailAdmin(userId: string, email: string): Promise<void> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('verified_emails')
    .select('*')
    .eq('user_id', userId)
    .eq('email', email.toLowerCase())
    .single()

  if (existing) {
    await supabase
      .from('verified_emails')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('verified_emails').insert({
      id: `ve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      email: email.toLowerCase(),
      is_primary: false,
      is_verified: true,
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  await supabase
    .from('auth_users')
    .update({
      email_confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  await cancelVerification(userId, email)
}

export async function getVerificationStatistics(
  userId: string
): Promise<VerificationStatistics> {
  const supabase = createClient()

  const { data } = await supabase
    .from('email_verification_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!data || data.length === 0) {
    return {
      totalRequests: 0,
      successfulVerifications: 0,
      expiredRequests: 0,
      failedAttempts: 0,
      averageVerificationTime: 0,
      successRate: 0,
    }
  }

  const successful = data.filter(d => d.status === 'verified')
  const expired = data.filter(d => d.status === 'expired')
  const failed = data.filter(d => d.status === 'failed')

  let avgTime = 0
  if (successful.length > 0) {
    const totalTime = successful.reduce((sum, d) => {
      const created = new Date(d.created_at).getTime()
      const verified = new Date(d.verified_at).getTime()
      return sum + (verified - created)
    }, 0)
    avgTime = totalTime / successful.length
  }

  return {
    totalRequests: data.length,
    successfulVerifications: successful.length,
    expiredRequests: expired.length,
    failedAttempts: failed.reduce((sum, d) => sum + d.attempts, 0),
    averageVerificationTime: avgTime,
    successRate: (successful.length / data.length) * 100,
  }
}

export async function cleanupExpiredVerifications(): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('email_verification_requests')
    .delete()
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error cleaning up verifications:', error)
    return 0
  }

  return count || 0
}

export async function hasVerifiedEmail(userId: string): Promise<boolean> {
  const { data: user } = await createClient()
    .from('auth_users')
    .select('email_confirmed_at')
    .eq('id', userId)
    .single()

  return !!user?.email_confirmed_at
}

function mapRequestFromDB(data: Record<string, unknown>): EmailVerificationRequest {
  return {
    id: data.id,
    userId: data.user_id,
    email: data.email,
    verificationToken: data.verification_token,
    tokenHash: data.token_hash,
    type: data.type as VerificationType,
    status: data.status as VerificationStatus,
    attempts: data.attempts,
    maxAttempts: data.max_attempts,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    verifiedAt: data.verified_at as string | undefined,
    ipAddress: data.ip_address as string | undefined,
    userAgent: data.user_agent as string | undefined,
    metadata: data.metadata as Record<string, unknown> | undefined,
  }
}

function mapVerifiedEmailFromDB(data: Record<string, unknown>): VerifiedEmail {
  return {
    id: data.id,
    userId: data.user_id,
    email: data.email,
    isPrimary: data.is_primary,
    isVerified: data.is_verified,
    verifiedAt: data.verified_at as string | undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
