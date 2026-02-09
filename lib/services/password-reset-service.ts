import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Password reset request status
 */
export type PasswordResetStatus =
  | 'pending'
  | 'sent'
  | 'verified'
  | 'completed'
  | 'expired'
  | 'cancelled'

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  id: string
  
  // User
  userId: string
  email: string
  
  // Token
  resetToken: string
  tokenHash: string
  
  // Status
  status: PasswordResetStatus
  
  // Verification
  verifiedAt?: string
  verificationMethod?: 'email' | 'sms' | 'mfa'
  
  // Limits
  attempts: number
  maxAttempts: number
  
  // Expiry
  createdAt: string
  expiresAt: string
  completedAt?: string
  
  // IP tracking
  ipAddress?: string
  userAgent?: string
  
  // New password hash (temporary storage)
  newPasswordHash?: string
}

/**
 * Password reset request input
 */
export interface CreateResetRequestInput {
  email: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Verify reset token input
 */
export interface VerifyResetTokenInput {
  token: string
  userId: string
}

/**
 * Complete reset input
 */
export interface CompleteResetInput {
  userId: string
  token: string
  newPassword: string
}

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
  score: number // 0-4
  label: 'very_weak' | 'weak' | 'fair' | 'good' | 'strong'
  feedback: string[]
  requirements: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumbers: boolean
    hasSpecialChars: boolean
    noCommonPatterns: boolean
  }
}

/**
 * Password history entry
 */
export interface PasswordHistoryEntry {
  id: string
  userId: string
  passwordHash: string
  createdAt: string
}

/**
 * Password policy
 */
export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
  preventReuse: boolean
  reuseCount: number // Number of previous passwords to check
  maxAge: number // Days until expiry
  requireMfaAfterReset: boolean
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating reset request
 */
export const createResetRequestSchema = z.object({
  email: z.string().email(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
})

/**
 * Schema for verifying reset token
 */
export const verifyResetTokenSchema = z.object({
  token: z.string().min(1),
  userId: z.string().uuid(),
})

/**
 * Schema for completing reset
 */
export const completeResetSchema = z.object({
  userId: z.string().uuid(),
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

/**
 * Schema for validating password
 */
export const passwordValidationSchema = z.object({
  password: z.string().min(8).max(128),
})

// ============================================================================
// Constants
// ============================================================================

/**
 * Default password policy
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventReuse: true,
  reuseCount: 12,
  maxAge: 90, // 90 days
  requireMfaAfterReset: false,
}

/**
 * Common passwords to block
 */
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', 'master', 'dragon', 'letmein', 'login',
  'welcome', 'admin', 'passw0rd', 'iloveyou', 'sunshine',
  'princess', 'football', 'baseball', 'soccer', 'hockey',
  'basketball', 'superman', 'batman', 'trustno1', 'access',
  'shadow', 'ashley', 'michael', 'daniel', 'jordan',
  'password1', 'password123', 'qwerty123', 'hello', 'charlie',
])

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for reset status
 */
export function getResetStatusDisplayName(status: PasswordResetStatus): string {
  const names: Record<PasswordResetStatus, string> = {
    pending: 'Request Pending',
    sent: 'Reset Email Sent',
    verified: 'Token Verified',
    completed: 'Reset Complete',
    expired: 'Token Expired',
    cancelled: 'Request Cancelled',
  }
  return names[status]
}

/**
 * Gets display name for strength label
 */
export function getStrengthLabel(score: number): 'very_weak' | 'weak' | 'fair' | 'good' | 'strong' {
  const labels: Array<'very_weak' | 'weak' | 'fair' | 'good' | 'strong'> = [
    'very_weak', 'weak', 'fair', 'good', 'strong',
  ]
  return labels[Math.min(score, 4)]
}

/**
 * Generates reset token
 */
export function generateResetToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Simple password hasher
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verifies password
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// ============================================================================
// Password Strength Validation
// ============================================================================

/**
 * Validates password strength
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = []
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommonPatterns: !COMMON_PASSWORDS.has(password.toLowerCase()),
  }

  // Calculate score
  let score = 0
  if (requirements.minLength) score++
  if (requirements.hasUppercase && requirements.hasLowercase) score++
  if (requirements.hasNumbers) score++
  if (requirements.hasSpecialChars) score++
  if (password.length >= 12) score++
  if (requirements.noCommonPatterns) score++

  // Normalize to 0-4
  score = Math.floor(score / 1.5)

  // Generate feedback
  if (!requirements.minLength) {
    feedback.push('Password should be at least 8 characters long')
  }
  if (!requirements.hasUppercase) {
    feedback.push('Add uppercase letters for more security')
  }
  if (!requirements.hasLowercase) {
    feedback.push('Add lowercase letters for more security')
  }
  if (!requirements.hasNumbers) {
    feedback.push('Include numbers to strengthen your password')
  }
  if (!requirements.hasSpecialChars) {
    feedback.push('Special characters make your password harder to guess')
  }
  if (!requirements.noCommonPatterns) {
    feedback.push('This password is too common and easily guessable')
  }

  return {
    score,
    label: getStrengthLabel(score),
    feedback,
    requirements,
  }
}

/**
 * Checks password against policy
 */
export function validatePasswordPolicy(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`)
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password cannot exceed ${policy.maxLength} characters`)
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  if (policy.preventCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common and not allowed')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a password reset request
 */
export async function createPasswordResetRequest(
  input: CreateResetRequestInput
): Promise<{
  requestId: string
  expiresAt: string
}> {
  const validationResult = createResetRequestSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid request: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Get user by email
  const { data: user, error: userError } = await supabase
    .from('auth_users')
    .select('id, email')
    .eq('email', input.email.toLowerCase())
    .single()

  if (userError || !user) {
    // Don't reveal if user exists
    return {
      requestId: 'pending_verification',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    }
  }

  // Check for existing pending request
  const { data: existingRequest } = await supabase
    .from('password_reset_requests')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existingRequest) {
    // Don't send duplicate
    return {
      requestId: existingRequest.id,
      expiresAt: existingRequest.expires_at,
    }
  }

  // Generate token
  const resetToken = generateResetToken()
  const tokenHash = await hashPassword(resetToken)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

  // Create request
  const requestId = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { error } = await supabase
    .from('password_reset_requests')
    .insert({
      id: requestId,
      user_id: user.id,
      email: user.email,
      reset_token: resetToken,
      token_hash: tokenHash,
      status: 'pending',
      attempts: 0,
      max_attempts: 5,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
    })

  if (error) {
    console.error('Error creating reset request:', error)
    throw new Error('Failed to create reset request')
  }

  return {
    requestId,
    expiresAt: expiresAt.toISOString(),
  }
}

/**
 * Verifies reset token
 */
export async function verifyResetToken(
  input: VerifyResetTokenInput
): Promise<{
  valid: boolean
  request?: PasswordResetRequest
  error?: string
}> {
  const validationResult = verifyResetTokenSchema.safeParse(input)
  if (!validationResult.success) {
    return { valid: false, error: 'Invalid request format' }
  }

  const supabase = createClient()

  const { data: request, error } = await supabase
    .from('password_reset_requests')
    .select('*')
    .eq('user_id', input.userId)
    .eq('reset_token', input.token)
    .in('status', ['pending', 'sent'])
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !request) {
    return { valid: false, error: 'Invalid or expired reset token' }
  }

  // Check attempts
  if (request.attempts >= request.max_attempts) {
    return { valid: false, error: 'Maximum verification attempts exceeded' }
  }

  return {
    valid: true,
    request: mapRequestFromDB(request),
  }
}

/**
 * Completes password reset
 */
export async function completePasswordReset(
  input: CompleteResetInput
): Promise<{ success: boolean; error?: string }> {
  const validationResult = completeResetSchema.safeParse(input)
  if (!validationResult.success) {
    return { success: false, error: 'Invalid request format' }
  }

  const supabase = createClient()

  // Validate new password
  const policyValidation = validatePasswordPolicy(input.newPassword)
  if (!policyValidation.valid) {
    return { success: false, error: policyValidation.errors.join('; ') }
  }

  // Get and verify request
  const { data: request, error: requestError } = await supabase
    .from('password_reset_requests')
    .select('*')
    .eq('user_id', input.userId)
    .eq('reset_token', input.token)
    .in('status', ['pending', 'sent', 'verified'])
    .gt('expires_at', new Date().toISOString())
    .single()

  if (requestError || !request) {
    return { success: false, error: 'Invalid or expired reset token' }
  }

  if (request.attempts >= request.max_attempts) {
    return { success: false, error: 'Maximum attempts exceeded' }
  }

  // Increment attempts
  await supabase
    .from('password_reset_requests')
    .update({ attempts: request.attempts + 1 })
    .eq('id', request.id)

  // Hash new password
  const newPasswordHash = await hashPassword(input.newPassword)

  // Check against password history
  const { data: passwordHistory } = await supabase
    .from('password_history')
    .select('password_hash')
    .eq('user_id', input.userId)
    .order('created_at', { ascending: false })
    .limit(12)

  for (const historyEntry of passwordHistory || []) {
    if (historyEntry.password_hash === newPasswordHash) {
      return { success: false, error: 'Cannot reuse any of your last 12 passwords' }
    }
  }

  // Update user password
  const { error: updateError } = await supabase
    .from('auth_users')
    .update({
      encrypted_password: newPasswordHash,
      password_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.userId)

  if (updateError) {
    return { success: false, error: 'Failed to update password' }
  }

  // Add to password history
  await supabase
    .from('password_history')
    .insert({
      id: `ph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: input.userId,
      password_hash: newPasswordHash,
      created_at: new Date().toISOString(),
    })

  // Update request status
  await supabase
    .from('password_reset_requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      new_password_hash: newPasswordHash,
    })
    .eq('id', request.id)

  // Invalidate all other sessions
  await invalidateUserSessions(input.userId)

  // Invalidate all password reset requests
  await supabase
    .from('password_reset_requests')
    .update({ status: 'cancelled' })
    .eq('user_id', input.userId)
    .neq('id', request.id)

  return { success: true }
}

/**
 * Cancels a reset request
 */
export async function cancelResetRequest(
  userId: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('password_reset_requests')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'pending')
}

/**
 * Gets reset request status
 */
export async function getResetRequestStatus(
  requestId: string
): Promise<PasswordResetRequest | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('password_reset_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (error) {
    return null
  }

  return mapRequestFromDB(data)
}

/**
 * Gets user's password history
 */
export async function getPasswordHistory(
  userId: string,
  limit: number = 12
): Promise<PasswordHistoryEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('password_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching password history:', error)
    return []
  }

  return (data || []).map(entry => ({
    id: entry.id,
    userId: entry.user_id,
    passwordHash: entry.password_hash,
    createdAt: entry.created_at,
  }))
}

/**
 * Checks if password needs reset
 */
export async function isPasswordExpired(
  userId: string,
  maxAgeDays: number = 90
): Promise<boolean> {
  const supabase = createClient()

  const { data: user } = await supabase
    .from('auth_users')
    .select('password_changed_at')
    .eq('id', userId)
    .single()

  if (!user?.password_changed_at) {
    return true // Never changed
  }

  const changedAt = new Date(user.password_changed_at)
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() - maxAgeDays)

  return changedAt < expiryDate
}

/**
 * Gets password age in days
 */
export async function getPasswordAge(
  userId: string
): Promise<number | null> {
  const supabase = createClient()

  const { data: user } = await supabase
    .from('auth_users')
    .select('password_changed_at')
    .eq('id', userId)
    .single()

  if (!user?.password_changed_at) {
    return null
  }

  const changedAt = new Date(user.password_changed_at)
  const now = new Date()
  const diffMs = now.getTime() - changedAt.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Sends password change notification
 */
export async function sendPasswordChangeNotification(
  userId: string
): Promise<void> {
  // Implementation would integrate with notification service
  console.log(`Password change notification sent to user ${userId}`)
}

/**
 * Cleans up expired reset requests
 */
export async function cleanupExpiredRequests(): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('password_reset_requests')
    .delete()
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error cleaning up requests:', error)
    return 0
  }

  return count || 0
}

/**
 * Gets password reset statistics
 */
export async function getResetStatistics(
  userId: string
): Promise<{
  totalRequests: number
  completedResets: number
  expiredRequests: number
  lastResetAt?: string
}> {
  const supabase = createClient()

  const { data: requests } = await supabase
    .from('password_reset_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const completed = requests?.filter(r => r.status === 'completed') || []
  const expired = requests?.filter(r => r.status === 'expired') || []

  return {
    totalRequests: requests?.length || 0,
    completedResets: completed.length,
    expiredRequests: expired.length,
    lastResetAt: completed[0]?.completed_at,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to PasswordResetRequest
 */
function mapRequestFromDB(data: Record<string, unknown>): PasswordResetRequest {
  return {
    id: data.id,
    userId: data.user_id,
    email: data.email,
    resetToken: data.reset_token,
    tokenHash: data.token_hash,
    status: data.status as PasswordResetStatus,
    verifiedAt: data.verified_at as string | undefined,
    verificationMethod: data.verification_method as 'email' | 'sms' | 'mfa' | undefined,
    attempts: data.attempts,
    maxAttempts: data.max_attempts,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    completedAt: data.completed_at as string | undefined,
    ipAddress: data.ip_address as string | undefined,
    userAgent: data.user_agent as string | undefined,
    newPasswordHash: data.new_password_hash as string | undefined,
  }
}

/**
 * Invalidates all user sessions
 */
async function invalidateUserSessions(userId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('user_sessions')
    .update({ status: 'revoked' })
    .eq('user_id', userId)
    .eq('status', 'active')
}
