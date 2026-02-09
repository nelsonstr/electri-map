import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Login status
 */
export type LoginStatus =
  | 'success'
  | 'failed'
  | 'locked_out'
  | 'mfa_required'
  | 'mfa_failed'
  | 'blocked'
  | 'expired'

/**
 * Login method
 */
export type LoginMethod =
  | 'password'
  | 'sso'
  | 'magic_link'
  | 'social_google'
  | 'social_facebook'
  | 'social_apple'
  | 'biometric'
  | 'recovery_code'
  | 'api_key'

/**
 * Login failure reason
 */
export type LoginFailureReason =
  | 'invalid_credentials'
  | 'account_disabled'
  | 'account_locked'
  | 'mfa_required'
  | 'mfa_invalid'
  | 'session_expired'
  | 'ip_blocked'
  | 'suspended'
  | 'rate_limited'
  | 'geographic_restriction'
  | 'device_restricted'
  | 'expired_password'
  | 'pending_verification'

/**
 * Login history entry
 */
export interface LoginHistoryEntry {
  id: string
  
  // User
  userId: string
  
  // Login info
  sessionId?: string
  method: LoginMethod
  status: LoginStatus
  
  // Failure details
  failureReason?: LoginFailureReason
  failureMessage?: string
  
  // Device info
  deviceId?: string
  deviceName?: string
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'other'
  os?: string
  browser?: string
  
  // Location
  ipAddress?: string
  location?: string
  country?: string
  timezone?: string
  
  // Context
  userAgent?: string
  referer?: string
  appVersion?: string
  
  // Security
  threatLevel: 'low' | 'medium' | 'high'
  suspiciousIndicators?: string[]
  
  // Duration (for successful logins)
  sessionDuration?: number
  
  // Timestamps
  timestamp: string
  timezone: string
}

/**
 * Login statistics
 */
export interface LoginStatistics {
  totalLogins: number
  successfulLogins: number
  failedLogins: number
  uniqueDevices: number
  uniqueLocations: number
  lastLoginAt?: string
  averageSessionDuration: number
  successRate: number
  failureRate: number
  threatLevelDistribution: Record<string, number>
}

/**
 * Suspicious activity detection
 */
export interface SuspiciousActivity {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  indicators: string[]
  description: string
  recommendedAction: string
}

/**
 * Create login entry input
 */
export interface CreateLoginEntryInput {
  userId: string
  sessionId?: string
  method: LoginMethod
  status: LoginStatus
  failureReason?: LoginFailureReason
  failureMessage?: string
  deviceId?: string
  deviceName?: string
  deviceType?: string
  os?: string
  browser?: string
  ipAddress?: string
  location?: string
  country?: string
  timezone?: string
  userAgent?: string
  referer?: string
  appVersion?: string
}

/**
 * Login query options
 */
export interface LoginQueryOptions {
  status?: LoginStatus
  method?: LoginMethod
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating login entry
 */
export const createLoginEntrySchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().optional(),
  method: z.enum([
    'password',
    'sso',
    'magic_link',
    'social_google',
    'social_facebook',
    'social_apple',
    'biometric',
    'recovery_code',
    'api_key',
  ]),
  status: z.enum([
    'success',
    'failed',
    'locked_out',
    'mfa_required',
    'mfa_failed',
    'blocked',
    'expired',
  ]),
  failureReason: z.enum([
    'invalid_credentials',
    'account_disabled',
    'account_locked',
    'mfa_required',
    'mfa_invalid',
    'session_expired',
    'ip_blocked',
    'suspended',
    'rate_limited',
    'geographic_restriction',
    'device_restricted',
    'expired_password',
    'pending_verification',
  ]).optional(),
  failureMessage: z.string().max(500).optional(),
  deviceId: z.string().optional(),
  deviceName: z.string().max(100).optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'other']).optional(),
  os: z.string().max(50).optional(),
  browser: z.string().max(50).optional(),
  ipAddress: z.string().ip().optional(),
  location: z.string().max(100).optional(),
  country: z.string().max(2).optional(),
  timezone: z.string().max(50).optional(),
  userAgent: z.string().max(500).optional(),
  referer: z.string().max(500).optional(),
  appVersion: z.string().max(20).optional(),
})

/**
 * Schema for login query
 */
export const loginQuerySchema = z.object({
  status: z.enum([
    'success',
    'failed',
    'locked_out',
    'mfa_required',
    'mfa_failed',
    'blocked',
    'expired',
  ]).optional(),
  method: z.enum([
    'password',
    'sso',
    'magic_link',
    'social_google',
    'social_facebook',
    'social_apple',
    'biometric',
    'recovery_code',
    'api_key',
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for login status
 */
export function getLoginStatusDisplayName(status: LoginStatus): string {
  const names: Record<LoginStatus, string> = {
    success: 'Successful',
    failed: 'Failed',
    locked_out: 'Locked Out',
    mfa_required: 'MFA Required',
    mfa_failed: 'MFA Failed',
    blocked: 'Blocked',
    expired: 'Expired',
  }
  return names[status]
}

/**
 * Gets display name for login method
 */
export function getLoginMethodDisplayName(method: LoginMethod): string {
  const names: Record<LoginMethod, string> = {
    password: 'Password',
    sso: 'Single Sign-On',
    magic_link: 'Magic Link',
    social_google: 'Google',
    social_facebook: 'Facebook',
    social_apple: 'Apple',
    biometric: 'Biometric',
    recovery_code: 'Recovery Code',
    api_key: 'API Key',
  }
  return names[method]
}

/**
 * Gets display name for failure reason
 */
export function getFailureReasonDisplayName(reason: LoginFailureReason): string {
  const names: Record<LoginFailureReason, string> = {
    invalid_credentials: 'Invalid Credentials',
    account_disabled: 'Account Disabled',
    account_locked: 'Account Locked',
    mfa_required: 'MFA Required',
    mfa_invalid: 'Invalid MFA Code',
    session_expired: 'Session Expired',
    ip_blocked: 'IP Address Blocked',
    suspended: 'Account Suspended',
    rate_limited: 'Rate Limited',
    geographic_restriction: 'Geographic Restriction',
    device_restricted: 'Device Restricted',
    expired_password: 'Password Expired',
    pending_verification: 'Verification Pending',
  }
  return names[reason]
}

/**
 * Parses device type from user agent
 */
export function parseDeviceType(userAgent?: string): 'desktop' | 'mobile' | 'tablet' | 'other' {
  if (!userAgent) return 'other'
  
  const ua = userAgent.toLowerCase()
  
  if (/(tablet|ipad|playbook|silk)/.test(ua)) {
    return 'tablet'
  }
  
  if (/(android|webos|iphone|ipod|blackberry|iemobile|opera mini)/.test(ua)) {
    return 'mobile'
  }
  
  return 'desktop'
}

/**
 * Parses browser from user agent
 */
export function parseBrowserFromUA(userAgent?: string): string | undefined {
  if (!userAgent) return undefined
  
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'Internet Explorer'
  
  return undefined
}

/**
 * Parses OS from user agent
 */
export function parseOSFromUA(userAgent?: string): string | undefined {
  if (!userAgent) return undefined
  
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac OS')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
  
  return undefined
}

/**
 * Detects suspicious indicators from login data
 */
export function detectSuspiciousIndicators(
  loginData: CreateLoginEntryInput,
  previousLogins: LoginHistoryEntry[]
): string[] {
  const indicators: string[] = []
  
  // Check for unusual location
  if (loginData.location && previousLogins.length > 0) {
    const locations = new Set(previousLogins.slice(0, 10).map(l => l.location).filter(Boolean))
    if (!locations.has(loginData.location)) {
      indicators.push('New location detected')
    }
  }
  
  // Check for unusual time
  const loginHour = new Date().getHours()
  const recentHours = previousLogins.slice(0, 5).map(l => new Date(l.timestamp).getHours())
  if (recentHours.length > 0) {
    const avgHour = recentHours.reduce((a, b) => a + b, 0) / recentHours.length
    if (Math.abs(loginHour - avgHour) > 6) {
      indicators.push('Unusual login time')
    }
  }
  
  // Check for new device
  if (loginData.deviceId && previousLogins.length > 0) {
    const devices = new Set(previousLogins.slice(0, 10).map(l => l.deviceId).filter(Boolean))
    if (!devices.has(loginData.deviceId)) {
      indicators.push('New device detected')
    }
  }
  
  // Check for multiple failures
  const recentFailures = previousLogins.filter(
    l => l.status === 'failed' && 
    new Date(l.timestamp).getTime() > Date.now() - 3600000 // Last hour
  ).length
  
  if (recentFailures >= 3) {
    indicators.push('Multiple recent failures')
  }
  
  return indicators
}

/**
 * Determines threat level from login data
 */
export function determineThreatLevel(
  status: LoginStatus,
  suspiciousIndicators: string[],
  failureReason?: LoginFailureReason
): 'low' | 'medium' | 'high' {
  // Failed logins have higher threat level
  if (status === 'failed' || status === 'mfa_failed' || status === 'locked_out') {
    if (suspiciousIndicators.length >= 2) {
      return 'high'
    }
    if (suspiciousIndicators.length >= 1) {
      return 'medium'
    }
    if (failureReason === 'rate_limited' || failureReason === 'account_locked') {
      return 'medium'
    }
  }
  
  // Check for high severity indicators
  if (suspiciousIndicators.some(i => 
    i.includes('multiple failures') || 
    i.includes('suspicious location')
  )) {
    return 'high'
  }
  
  return 'low'
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a login history entry
 */
export async function createLoginEntry(
  input: CreateLoginEntryInput
): Promise<LoginHistoryEntry> {
  const validationResult = createLoginEntrySchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid login entry: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Parse device info from user agent if not provided
  const deviceType = input.deviceType || parseDeviceType(input.userAgent)
  const browser = input.browser || parseBrowserFromUA(input.userAgent)
  const os = input.os || parseOSFromUA(input.userAgent)

  // Get recent logins for threat detection
  const { data: recentLogins } = await supabase
    .from('login_history')
    .select('*')
    .eq('user_id', input.userId)
    .order('timestamp', { ascending: false })
    .limit(10)

  // Detect suspicious indicators
  const suspiciousIndicators = detectSuspiciousIndicators(
    input,
    recentLogins?.map(mapEntryFromDB) || []
  )

  // Determine threat level
  const threatLevel = determineThreatLevel(input.status, suspiciousIndicators, input.failureReason)

  const entryId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('login_history')
    .insert({
      id: entryId,
      user_id: input.userId,
      session_id: input.sessionId || null,
      method: input.method,
      status: input.status,
      failure_reason: input.failureReason || null,
      failure_message: input.failureMessage || null,
      device_id: input.deviceId || null,
      device_name: input.deviceName || null,
      device_type: deviceType,
      os,
      browser,
      ip_address: input.ipAddress || null,
      location: input.location || null,
      country: input.country || null,
      timezone: input.timezone || null,
      user_agent: input.userAgent || null,
      referer: input.referer || null,
      app_version: input.appVersion || null,
      suspicious_indicators: suspiciousIndicators,
      threat_level: threatLevel,
      timestamp: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating login entry:', error)
    throw new Error(`Failed to create entry: ${error.message}`)
  }

  return mapEntryFromDB(data)
}

/**
 * Gets login history for user
 */
export async function getLoginHistory(
  userId: string,
  options?: LoginQueryOptions
): Promise<LoginHistoryEntry[]> {
  const supabase = createClient()

  let query = supabase
    .from('login_history')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.method) {
    query = query.eq('method', options.method)
  }

  if (options?.startDate) {
    query = query.gte('timestamp', options.startDate)
  }

  if (options?.endDate) {
    query = query.lte('timestamp', options.endDate)
  }

  if (options?.offset) {
    query = query.offset(options.offset)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  } else {
    query = query.limit(50)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching login history:', error)
    return []
  }

  return (data || []).map(mapEntryFromDB)
}

/**
 * Gets recent login history
 */
export async function getRecentLogins(
  userId: string,
  limit: number = 10
): Promise<LoginHistoryEntry[]> {
  return getLoginHistory(userId, { limit })
}

/**
 * Gets last successful login
 */
export async function getLastSuccessfulLogin(
  userId: string
): Promise<LoginHistoryEntry | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('login_history')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'success')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching last login:', error)
    return null
  }

  return mapEntryFromDB(data)
}

/**
 * Gets login statistics for user
 */
export async function getLoginStatistics(
  userId: string,
  days: number = 30
): Promise<LoginStatistics> {
  const supabase = createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('login_history')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', startDate.toISOString())

  if (error) {
    console.error('Error fetching statistics:', error)
    return {
      totalLogins: 0,
      successfulLogins: 0,
      failedLogins: 0,
      uniqueDevices: 0,
      uniqueLocations: 0,
      averageSessionDuration: 0,
      successRate: 0,
      failureRate: 0,
      threatLevelDistribution: {},
    }
  }

  const entries = data || []
  
  const successful = entries.filter(e => e.status === 'success')
  const failed = entries.filter(e => e.status === 'failed')

  const uniqueDevices = new Set(entries.map(e => e.device_id).filter(Boolean)).size
  const uniqueLocations = new Set(entries.map(e => e.location).filter(Boolean)).size

  const threatDistribution: Record<string, number> = {}
  entries.forEach(e => {
    const level = e.threat_level || 'low'
    threatDistribution[level] = (threatDistribution[level] || 0) + 1
  })

  const lastLogin = entries
    .filter(e => e.status === 'success')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

  return {
    totalLogins: entries.length,
    successfulLogins: successful.length,
    failedLogins: failed.length,
    uniqueDevices,
    uniqueLocations,
    lastLoginAt: lastLogin?.timestamp,
    averageSessionDuration: 0, // Would need session data
    successRate: entries.length > 0 ? (successful.length / entries.length) * 100 : 0,
    failureRate: entries.length > 0 ? (failed.length / entries.length) * 100 : 0,
    threatLevelDistribution: threatDistribution,
  }
}

/**
 * Gets failed login attempts count
 */
export async function getFailedLoginCount(
  userId: string,
  windowMinutes: number = 60
): Promise<number> {
  const supabase = createClient()

  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)

  const { count, error } = await supabase
    .from('login_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'failed')
    .gte('timestamp', windowStart.toISOString())

  if (error) {
    console.error('Error counting failed logins:', error)
    return 0
  }

  return count || 0
}

/**
 * Checks if account should be locked
 */
export async function shouldLockAccount(
  userId: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<boolean> {
  const failedCount = await getFailedLoginCount(userId, windowMinutes)
  return failedCount >= maxAttempts
}

/**
 * Gets login activity summary
 */
export async function getLoginActivitySummary(
  userId: string
): Promise<{
  recentActivity: LoginHistoryEntry[]
  suspiciousActivity: LoginHistoryEntry[]
  statistics: LoginStatistics
  recommendations: string[]
}> {
  const [recentActivity, statistics] = await Promise.all([
    getRecentLogins(userId, 10),
    getLoginStatistics(userId, 30),
  ])

  // Get suspicious logins
  const suspiciousActivity = recentActivity.filter(
    entry => entry.threatLevel === 'high' || 
    (entry.status === 'failed' && entry.suspiciousIndicators && entry.suspiciousIndicators.length > 0)
  )

  // Generate recommendations
  const recommendations: string[] = []
  
  if (statistics.failureRate > 20) {
    recommendations.push('Consider reviewing your recent failed login attempts for suspicious activity.')
  }
  
  if (suspiciousActivity.length > 0) {
    recommendations.push('Enable two-factor authentication for additional security.')
  }
  
  if (statistics.uniqueDevices > 3) {
    recommendations.push('Review and remove any unrecognized devices from your account.')
  }

  return {
    recentActivity,
    suspiciousActivity,
    statistics,
    recommendations,
  }
}

/**
 * Exports login history
 */
export async function exportLoginHistory(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<LoginHistoryEntry[]> {
  const supabase = createClient()

  let query = supabase
    .from('login_history')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })

  if (startDate) {
    query = query.gte('timestamp', startDate)
  }

  if (endDate) {
    query = query.lte('timestamp', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error exporting login history:', error)
    return []
  }

  return (data || []).map(mapEntryFromDB)
}

/**
 * Clears old login history
 */
export async function clearOldLoginHistory(
  userId: string,
  olderThanDays: number = 365
): Promise<number> {
  const supabase = createClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const { count, error } = await supabase
    .from('login_history')
    .delete()
    .eq('user_id', userId)
    .lt('timestamp', cutoffDate.toISOString())

  if (error) {
    console.error('Error clearing old history:', error)
    return 0
  }

  return count || 0
}

/**
 * Gets all logins for a specific device
 */
export async function getLoginsByDevice(
  userId: string,
  deviceId: string
): Promise<LoginHistoryEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('login_history')
    .select('*')
    .eq('user_id', userId)
    .eq('device_id', deviceId)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching device logins:', error)
    return []
  }

  return (data || []).map(mapEntryFromDB)
}

/**
 * Gets logins from specific location
 */
export async function getLoginsByLocation(
  userId: string,
  location: string
): Promise<LoginHistoryEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('login_history')
    .select('*')
    .eq('user_id', userId)
    .eq('location', location)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching location logins:', error)
    return []
  }

  return (data || []).map(mapEntryFromDB)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to LoginHistoryEntry
 */
function mapEntryFromDB(data: Record<string, unknown>): LoginHistoryEntry {
  return {
    id: data.id,
    userId: data.user_id,
    sessionId: data.session_id as string | undefined,
    method: data.method as LoginMethod,
    status: data.status as LoginStatus,
    failureReason: data.failure_reason as LoginFailureReason | undefined,
    failureMessage: data.failure_message as string | undefined,
    deviceId: data.device_id as string | undefined,
    deviceName: data.device_name as string | undefined,
    deviceType: data.device_type as 'desktop' | 'mobile' | 'tablet' | 'other' | undefined,
    os: data.os as string | undefined,
    browser: data.browser as string | undefined,
    ipAddress: data.ip_address as string | undefined,
    location: data.location as string | undefined,
    country: data.country as string | undefined,
    timezone: data.timezone as string | undefined,
    userAgent: data.user_agent as string | undefined,
    referer: data.referer as string | undefined,
    appVersion: data.app_version as string | undefined,
    suspiciousIndicators: data.suspicious_indicators as string[] | undefined,
    threatLevel: data.threat_level as 'low' | 'medium' | 'high',
    sessionDuration: data.session_duration as number | undefined,
    timestamp: data.timestamp,
    timezone: data.timezone as string || 'UTC',
  }
}
