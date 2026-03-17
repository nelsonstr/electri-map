import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Session status
 */
export type SessionStatus =
  | 'active'
  | 'expired'
  | 'revoked'
  | 'terminated'

/**
 * Session type
 */
export type SessionType =
  | 'web'
  | 'mobile'
  | 'api'
  | 'refresh'

/**
 * Session threat level
 */
export type SessionThreatLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

/**
 * User session
 */
export interface UserSession {
  id: string
  
  // User
  userId: string
  
  // Session info
  sessionToken: string
  type: SessionType
  status: SessionStatus
  
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
  
  // Timestamps
  createdAt: string
  lastActivityAt: string
  expiresAt: string
  revokedAt?: string
  revokedBy?: string
  revocationReason?: string
  
  // Activity
  pageViews: number
  actions: number
  
  // Security
  threatLevel: SessionThreatLevel
  suspiciousActivity?: Array<{
    type: string
    timestamp: string
    details: string
  }>
  
  // Metadata
  userAgent?: string
  referer?: string
  initialPath?: string
  
  // Token info
  accessTokenHash?: string
  refreshTokenHash?: string
}

/**
 * Session activity event
 */
export interface SessionActivityEvent {
  id: string
  
  // Session
  sessionId: string
  userId: string
  
  // Event
  eventType: 'page_view' | 'action' | 'api_call' | 'location_change' | 'heartbeat'
  eventData?: Record<string, unknown>
  
  // Context
  ipAddress?: string
  location?: string
  userAgent?: string
  
  // Timestamp
  timestamp: string
}

/**
 * Session settings
 */
export interface SessionSettings {
  id: string
  
  // User
  userId: string
  
  // Expiration
  absoluteTimeoutMinutes: number
  inactivityTimeoutMinutes: number
  slidingExpiration: boolean
  
  // Concurrent sessions
  maxConcurrentSessions: number
  allowMultipleDevices: boolean
  
  // Security
  requireReauthentication: boolean
  reauthTimeoutMinutes: number
  
  // IP
  bindToIp: boolean
  allowedIpRanges?: string[]
  
  // Device trust
  deviceTrustEnabled: boolean
  trustedDevicesOnly: boolean
  
  // Notifications
  newSessionNotification: boolean
  suspiciousActivityNotification: boolean
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Create session input
 */
export interface CreateSessionInput {
  userId: string
  type: SessionType
  deviceId?: string
  deviceName?: string
  deviceType?: string
  os?: string
  browser?: string
  ipAddress?: string
  location?: string
  userAgent?: string
  referer?: string
  initialPath?: string
}

/**
 * Session statistics
 */
export interface SessionStatistics {
  totalSessions: number
  activeSessions: number
  expiredSessions: number
  revokedSessions: number
  averageSessionDuration: number
  uniqueDevices: number
  averageActivityScore: number
  threatLevelDistribution: Record<SessionThreatLevel, number>
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating session
 */
export const createSessionSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['web', 'mobile', 'api', 'refresh']),
  deviceId: z.string().optional(),
  deviceName: z.string().max(100).optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'other']).optional(),
  os: z.string().max(50).optional(),
  browser: z.string().max(50).optional(),
  ipAddress: z.string().ip().optional(),
  location: z.string().max(100).optional(),
  userAgent: z.string().max(500).optional(),
  referer: z.string().max(500).optional(),
  initialPath: z.string().max(500).optional(),
})

/**
 * Schema for updating session settings
 */
export const updateSessionSettingsSchema = z.object({
  absoluteTimeoutMinutes: z.number().min(15).max(10080).optional(),
  inactivityTimeoutMinutes: z.number().min(5).max(1440).optional(),
  slidingExpiration: z.boolean().optional(),
  maxConcurrentSessions: z.number().min(1).max(20).optional(),
  allowMultipleDevices: z.boolean().optional(),
  requireReauthentication: z.boolean().optional(),
  reauthTimeoutMinutes: z.number().min(5).max(60).optional(),
  bindToIp: z.boolean().optional(),
  allowedIpRanges: z.array(z.string()).optional(),
  deviceTrustEnabled: z.boolean().optional(),
  trustedDevicesOnly: z.boolean().optional(),
  newSessionNotification: z.boolean().optional(),
  suspiciousActivityNotification: z.boolean().optional(),
})

/**
 * Schema for terminating session
 */
export const terminateSessionSchema = z.object({
  sessionId: z.string().uuid(),
  reason: z.string().max(500),
  revokeAll: z.boolean().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for session type
 */
export function getSessionTypeDisplayName(type: SessionType): string {
  const names: Record<SessionType, string> = {
    web: 'Web Browser',
    mobile: 'Mobile App',
    api: 'API Access',
    refresh: 'Refresh Token',
  }
  return names[type]
}

/**
 * Gets display name for session status
 */
export function getSessionStatusDisplayName(status: SessionStatus): string {
  const names: Record<SessionStatus, string> = {
    active: 'Active',
    expired: 'Expired',
    revoked: 'Revoked',
    terminated: 'Terminated',
  }
  return names[status]
}

/**
 * Gets display name for threat level
 */
export function getThreatLevelDisplayName(level: SessionThreatLevel): string {
  const names: Record<SessionThreatLevel, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  }
  return names[level]
}

/**
 * Generates session token
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Calculates session duration
 */
export function calculateSessionDuration(
  createdAt: string,
  endedAt?: string
): number {
  const start = new Date(createdAt).getTime()
  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  return Math.floor((end - start) / 1000 / 60) // Minutes
}

/**
 * Determines device type from user agent
 */
export function determineDeviceType(userAgent?: string): 'desktop' | 'mobile' | 'tablet' | 'other' {
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
export function parseBrowser(userAgent?: string): string | undefined {
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
export function parseOS(userAgent?: string): string | undefined {
  if (!userAgent) return undefined
  
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac OS')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
  
  return undefined
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a new session
 */
export async function createSession(
  input: CreateSessionInput
): Promise<UserSession> {
  const validationResult = createSessionSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid session: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Determine device info if not provided
  const deviceType = input.deviceType || determineDeviceType(input.userAgent)
  const browser = input.browser || parseBrowser(input.userAgent)
  const os = input.os || parseOS(input.userAgent)

  // Generate tokens
  const sessionToken = generateSessionToken()
  const accessTokenHash = await hashToken(sessionToken)
  const refreshToken = generateSessionToken()
  const refreshTokenHash = await hashToken(refreshToken)

  // Calculate expiration
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('user_sessions')
    .insert({
      id: sessionId,
      user_id: input.userId,
      session_token: accessTokenHash,
      type: input.type,
      status: 'active',
      device_id: input.deviceId || null,
      device_name: input.deviceName || null,
      device_type: deviceType,
      os,
      browser,
      ip_address: input.ipAddress || null,
      location: input.location || null,
      created_at: now.toISOString(),
      last_activity_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      page_views: 0,
      actions: 0,
      threat_level: 'low',
      user_agent: input.userAgent || null,
      referer: input.referer || null,
      initial_path: input.initialPath || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating session:', error)
    throw new Error(`Failed to create session: ${error.message}`)
  }

  return mapSessionFromDB(data)
}

/**
 * Gets active session by token
 */
export async function getSessionByToken(
  sessionToken: string
): Promise<UserSession | null> {
  const supabase = createClient()

  const tokenHash = await hashToken(sessionToken)

  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('session_token', tokenHash)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) {
    console.error('Error fetching session:', error)
    return null
  }

  return mapSessionFromDB(data)
}

/**
 * Gets user sessions
 */
export async function getUserSessions(
  userId: string,
  options?: {
    status?: SessionStatus
    type?: SessionType
    limit?: number
  }
): Promise<UserSession[]> {
  const supabase = createClient()

  let query = supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_activity_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching sessions:', error)
    return []
  }

  return (data || []).map(mapSessionFromDB)
}

/**
 * Gets active session count for user
 */
export async function getActiveSessionCount(
  userId: string
): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('user_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error counting sessions:', error)
    return 0
  }

  return count || 0
}

/**
 * Updates session activity
 */
export async function updateSessionActivity(
  sessionId: string,
  eventType: SessionActivityEvent['eventType'],
  eventData?: Record<string, unknown>
): Promise<void> {
  const supabase = createClient()

  // Log activity event
  await supabase
    .from('session_activity')
    .insert({
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData || null,
      timestamp: new Date().toISOString(),
    })
    .then(({ error }) => {
      if (error) console.error('Error logging activity:', error)
    })

  // Update session
  await supabase
    .from('user_sessions')
    .update({
      last_activity_at: new Date().toISOString(),
      actions: supabase.rpc('increment_actions', { row_id: sessionId }),
    })
    .eq('id', sessionId)
}

/**
 * Revokes a session
 */
export async function revokeSession(
  sessionId: string,
  revokedBy: string,
  reason: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('user_sessions')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revocation_reason: reason,
    })
    .eq('id', sessionId)
}

/**
 * Revokes all sessions for user
 */
export async function revokeAllSessions(
  userId: string,
  excludeSessionId?: string,
  reason: string = 'Security: All sessions revoked'
): Promise<number> {
  const supabase = createClient()

  let query = supabase
    .from('user_sessions')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: 'system',
      revocation_reason: reason,
    })
    .eq('user_id', userId)
    .eq('status', 'active')

  if (excludeSessionId) {
    query = query.neq('id', excludeSessionId)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error revoking sessions:', error)
    throw new Error(`Failed to revoke sessions: ${error.message}`)
  }

  return count || 0
}

/**
 * Terminates expired sessions
 */
export async function terminateExpiredSessions(): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('user_sessions')
    .update({
      status: 'expired',
    })
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'active')

  if (error) {
    console.error('Error terminating sessions:', error)
    return 0
  }

  return count || 0
}

/**
 * Gets session settings for user
 */
export async function getSessionSettings(
  userId: string
): Promise<SessionSettings> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('session_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    // Return default settings
    return {
      id: '',
      userId,
      absoluteTimeoutMinutes: 480, // 8 hours
      inactivityTimeoutMinutes: 30,
      slidingExpiration: true,
      maxConcurrentSessions: 5,
      allowMultipleDevices: true,
      requireReauthentication: false,
      reauthTimeoutMinutes: 15,
      bindToIp: false,
      deviceTrustEnabled: true,
      trustedDevicesOnly: false,
      newSessionNotification: true,
      suspiciousActivityNotification: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const settings = data as any
  return {
    id: settings.id,
    userId: settings.user_id,
    absoluteTimeoutMinutes: settings.absolute_timeout_minutes,
    inactivityTimeoutMinutes: settings.inactivity_timeout_minutes,
    slidingExpiration: settings.sliding_expiration,
    maxConcurrentSessions: settings.max_concurrent_sessions,
    allowMultipleDevices: settings.allow_multiple_devices,
    requireReauthentication: settings.require_reauthentication,
    reauthTimeoutMinutes: settings.reauth_timeout_minutes,
    bindToIp: settings.bind_to_ip,
    allowedIpRanges: settings.allowed_ip_ranges || undefined,
    deviceTrustEnabled: settings.device_trust_enabled,
    trustedDevicesOnly: settings.trusted_devices_only,
    newSessionNotification: settings.new_session_notification,
    suspiciousActivityNotification: settings.suspicious_activity_notification,
    createdAt: settings.created_at,
    updatedAt: settings.updated_at,
  }
}

/**
 * Updates session settings
 */
export async function updateSessionSettings(
  userId: string,
  input: z.infer<typeof updateSessionSettingsSchema>
): Promise<SessionSettings> {
  const validationResult = updateSessionSettingsSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid settings: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  Object.entries(input).forEach(([key, value]) => {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    updateData[dbKey] = value
  })

  const { data, error } = await supabase
    .from('session_settings')
    .upsert({
      user_id: userId,
      ...updateData,
    }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating settings:', error)
    throw new Error(`Failed to update settings: ${error.message}`)
  }

  const settings = data as any
  return {
    id: settings.id,
    userId: settings.user_id,
    absoluteTimeoutMinutes: settings.absolute_timeout_minutes,
    inactivityTimeoutMinutes: settings.inactivity_timeout_minutes,
    slidingExpiration: settings.sliding_expiration,
    maxConcurrentSessions: settings.max_concurrent_sessions,
    allowMultipleDevices: settings.allow_multiple_devices,
    requireReauthentication: settings.require_reauthentication,
    reauthTimeoutMinutes: settings.reauth_timeout_minutes,
    bindToIp: settings.bind_to_ip,
    allowedIpRanges: settings.allowed_ip_ranges || undefined,
    deviceTrustEnabled: settings.device_trust_enabled,
    trustedDevicesOnly: settings.trusted_devices_only,
    newSessionNotification: settings.new_session_notification,
    suspiciousActivityNotification: settings.suspicious_activity_notification,
    createdAt: settings.created_at,
    updatedAt: settings.updated_at,
  }
}

/**
 * Checks if session is valid and active
 */
export async function isSessionValid(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_sessions')
    .select('status, expires_at')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return false
  }

  const session = data as any

  if (session.status !== 'active') {
    return false
  }

  if (new Date(session.expires_at) < new Date()) {
    return false
  }

  return true
}

/**
 * Gets session statistics for user
 */
export async function getSessionStatistics(
  userId: string
): Promise<SessionStatistics> {
  const supabase = createClient()

  const sessions = await getUserSessions(userId)

  const distribution: Record<SessionThreatLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }

  let totalDuration = 0
  let completedSessions = 0
  const uniqueDevices = new Set<string>()

  sessions.forEach(session => {
    distribution[session.threatLevel]++
    
    if (session.deviceId) {
      uniqueDevices.add(session.deviceId)
    }

    if (session.status === 'expired' || session.status === 'revoked') {
      const endTime = session.revokedAt || session.expiresAt
      const duration = calculateSessionDuration(session.createdAt, endTime)
      totalDuration += duration
      completedSessions++
    }
  })

  return {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.status === 'active').length,
    expiredSessions: sessions.filter(s => s.status === 'expired').length,
    revokedSessions: sessions.filter(s => s.status === 'revoked').length,
    averageSessionDuration: completedSessions > 0 ? Math.round(totalDuration / completedSessions) : 0,
    uniqueDevices: uniqueDevices.size,
    averageActivityScore: 0, // Would need more complex calculation
    threatLevelDistribution: distribution,
  }
}

/**
 * Reports suspicious activity on session
 */
export async function reportSuspiciousActivity(
  sessionId: string,
  activityType: string,
  details: string
): Promise<void> {
  const supabase = createClient()

  const { data: session } = await supabase
    .from('user_sessions')
    .select('suspicious_activity, threat_level')
    .eq('id', sessionId)
    .single()

  if (!session) {
    throw new Error('Session not found')
  }

  const activities = (session.suspicious_activity as any[]) || []
  activities.push({
    type: activityType,
    timestamp: new Date().toISOString(),
    details,
  })

  // Escalate threat level
  let newThreatLevel: SessionThreatLevel = 'low'
  const activityCount = activities.length

  if (activityCount >= 5) {
    newThreatLevel = 'critical'
  } else if (activityCount >= 3) {
    newThreatLevel = 'high'
  } else if (activityCount >= 2) {
    newThreatLevel = 'medium'
  }

  await supabase
    .from('user_sessions')
    .update({
      suspicious_activity: activities,
      threat_level: newThreatLevel,
    })
    .eq('id', sessionId)
}

/**
 * Extends session expiration (sliding expiration)
 */
export async function extendSession(
  sessionId: string,
  settings: SessionSettings
): Promise<void> {
  const supabase = createClient()

  const newExpiry = new Date()
  newExpiry.setMinutes(newExpiry.getMinutes() + settings.inactivityTimeoutMinutes)

  await supabase
    .from('user_sessions')
    .update({
      expires_at: newExpiry.toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('status', 'active')
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Hashes a token
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Maps database record to UserSession
 */
function mapSessionFromDB(data: Record<string, unknown>): UserSession {
  const session = data as any
  return {
    id: session.id,
    userId: session.user_id,
    sessionToken: '', // Never return raw token
    type: session.type as SessionType,
    status: session.status as SessionStatus,
    deviceId: session.device_id as string | undefined,
    deviceName: session.device_name as string | undefined,
    deviceType: session.device_type as 'desktop' | 'mobile' | 'tablet' | 'other' | undefined,
    os: session.os as string | undefined,
    browser: session.browser as string | undefined,
    ipAddress: session.ip_address as string | undefined,
    location: session.location as string | undefined,
    country: session.country as string | undefined,
    createdAt: session.created_at,
    lastActivityAt: session.last_activity_at,
    expiresAt: session.expires_at,
    revokedAt: session.revoked_at as string | undefined,
    revokedBy: session.revoked_by as string | undefined,
    revocationReason: session.revocation_reason as string | undefined,
    pageViews: session.page_views,
    actions: session.actions,
    threatLevel: session.threat_level as SessionThreatLevel,
    suspiciousActivity: session.suspicious_activity as UserSession['suspiciousActivity'] | undefined,
    userAgent: session.user_agent as string | undefined,
    referer: session.referer as string | undefined,
    initialPath: session.initial_path as string | undefined,
  }
}

/**
 * Gets ended timestamp from session
 */
function getSessionEndedAt(session: UserSession): string | undefined {
  if (session.status === 'expired' || session.status === 'revoked') {
    return session.revokedAt || session.expiresAt
  }
  return undefined
}
