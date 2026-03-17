import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Voice assistant platform type
 */
export type VoiceAssistantPlatform = 
  | 'alexa'
  | 'google_assistant'
  | 'siri'
  | 'cortana'
  | 'bixby'
  | 'custom'

/**
 * Voice assistant status
 */
export type VoiceAssistantStatus = 
  | 'active'
  | 'inactive'
  | 'error'
  | 'pending_verification'
  | 'degraded'

/**
 * Voice command type
 */
export type VoiceCommandType = 
  | 'check_status'
  | 'report_outage'
  | 'subscribe_alerts'
  | 'unsubscribe_alerts'
  | 'get_safety_info'
  | 'find_shelter'
  | 'emergency_alert'
  | 'check_restoration'
  | 'custom'

/**
 * Voice session state
 */
export type VoiceSessionState = 
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error'

/**
 * Voice interaction record
 */
export interface VoiceInteraction {
  id: string
  sessionId: string
  
  // User info
  userId: string
  deviceId: string
  
  // Platform
  platform: VoiceAssistantPlatform
  
  // Command info
  commandType: VoiceCommandType
  rawTranscript: string
  intent?: string
  entities?: Record<string, unknown>
  
  // Response
  response?: string
  responseAudioUrl?: string
  
  // Session
  sessionState: VoiceSessionState
  
  // Timing
  startedAt: string
  endedAt?: string
  processingTimeMs?: number
  
  // Success
  success: boolean
  errorMessage?: string
  
  createdAt: string
}

/**
 * Linked voice assistant device
 */
export interface LinkedVoiceDevice {
  id: string
  userId: string
  
  // Device info
  deviceId: string
  deviceName: string
  platform: VoiceAssistantPlatform
  
  // Status
  status: VoiceAssistantStatus
  lastSeenAt?: string
  
  // Settings
  settings: {
    alertsEnabled: boolean
    outageAlerts: boolean
    weatherAlerts: boolean
    safetyAlerts: boolean
    voiceVolume: number // 0-100
    notificationsEnabled: boolean
  }
  
  // Location
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  
  // Verification
  verifiedAt?: string
  verificationToken?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Voice skill/action configuration
 */
export interface VoiceSkillConfig {
  id: string
  skillId: string
  
  // Skill info
  name: string
  description: string
  platform: VoiceAssistantPlatform
  
  // Status
  status: 'development' | 'certification' | 'published' | 'deprecated'
  version: string
  
  // Capabilities
  capabilities: VoiceCommandType[]
  
  // Endpoint
  endpointUrl?: string
  authentication?: {
    type: 'oauth' | 'api_key' | 'none'
    clientId?: string
    scopes?: string[]
  }
  
  // Metrics
  metrics?: {
    totalInvocations: number
    averageResponseTime: number
    successRate: number
    errorRate: number
  }
  
  createdAt: string
  updatedAt: string
}

/**
 * Voice alert notification
 */
export interface VoiceAlertNotification {
  id: string
  
  // Alert info
  alertId: string
  alertType: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  
  // Delivery
  platform: VoiceAssistantPlatform
  deviceId?: string
  userId?: string
  
  // Content
  audioUrl?: string
  ttsText: string
  
  // Status
  status: 'pending' | 'delivered' | 'failed' | 'listened' | 'dismissed'
  
  // Timing
  scheduledFor?: string
  deliveredAt?: string
  listenedAt?: string
  
  // Interaction
  interaction?: {
    listenedDuration: number
    actionTaken?: string
    followUpRequest?: string
  }
  
  createdAt: string
}

/**
 * Voice session for ongoing interaction
 */
export interface VoiceSession {
  id: string
  sessionId: string
  
  // User info
  userId: string
  deviceId: string
  platform: VoiceAssistantPlatform
  
  // State
  state: VoiceSessionState
  currentIntent?: string
  context?: Record<string, unknown>
  
  // History
  interactionHistory: Array<{
    timestamp: string
    type: 'user' | 'system'
    transcript?: string
    response?: string
  }>
  
  // Timing
  startedAt: string
  lastActivityAt?: string
  expiresAt: string
  
  // Location (for context)
  location?: {
    latitude: number
    longitude: number
  }
}

/**
 * Voice analytics
 */
export interface VoiceAnalytics {
  // Overview
  totalInteractions: number
  uniqueUsers: number
  uniqueDevices: number
  
  // Platform breakdown
  platformStats: Record<VoiceAssistantPlatform, {
    interactions: number
    devices: number
    successRate: number
  }>
  
  // Command breakdown
  commandStats: Record<VoiceCommandType, {
    count: number
    successRate: number
    avgResponseTime: number
  }>
  
  // Session metrics
  avgSessionDuration: number
  avgInteractionsPerSession: number
  
  // Error metrics
  errorRate: number
  topErrors: Array<{
    error: string
    count: number
  }>
  
  // Time period
  periodStart: string
  periodEnd: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for linking a voice device
 */
export const linkDeviceSchema = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().min(1).max(100),
  platform: z.enum(['alexa', 'google_assistant', 'siri', 'cortana', 'bixby', 'custom']),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }).optional(),
})

/**
 * Schema for voice command input
 */
export const voiceCommandSchema = z.object({
  sessionId: z.string().optional(),
  deviceId: z.string().min(1),
  platform: z.enum(['alexa', 'google_assistant', 'siri', 'cortana', 'bixby', 'custom']),
  transcript: z.string().min(1),
  intent: z.string().optional(),
  entities: z.record(z.unknown()).optional(),
  userId: z.string().optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
})

/**
 * Schema for updating device settings
 */
export const updateDeviceSettingsSchema = z.object({
  deviceId: z.string().min(1),
  settings: z.object({
    alertsEnabled: z.boolean().optional(),
    outageAlerts: z.boolean().optional(),
    weatherAlerts: z.boolean().optional(),
    safetyAlerts: z.boolean().optional(),
    voiceVolume: z.number().min(0).max(100).optional(),
    notificationsEnabled: z.boolean().optional(),
  }),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for voice platform
 */
export function getVoicePlatformDisplayName(platform: VoiceAssistantPlatform): string {
  const names: Record<VoiceAssistantPlatform, string> = {
    alexa: 'Amazon Alexa',
    google_assistant: 'Google Assistant',
    siri: 'Apple Siri',
    cortana: 'Microsoft Cortana',
    bixby: 'Samsung Bixby',
    custom: 'Custom Assistant',
  }
  return names[platform]
}

/**
 * Gets display name for voice command
 */
export function getVoiceCommandDisplayName(command: VoiceCommandType): string {
  const names: Record<VoiceCommandType, string> = {
    check_status: 'Check Outage Status',
    report_outage: 'Report Outage',
    subscribe_alerts: 'Subscribe to Alerts',
    unsubscribe_alerts: 'Unsubscribe from Alerts',
    get_safety_info: 'Get Safety Information',
    find_shelter: 'Find Shelter',
    emergency_alert: 'Emergency Alert',
    check_restoration: 'Check Restoration Time',
    custom: 'Custom Command',
  }
  return names[command]
}

/**
 * Gets icon for voice platform
 */
export function getVoicePlatformIcon(platform: VoiceAssistantPlatform): string {
  const icons: Record<VoiceAssistantPlatform, string> = {
    alexa: '🔊',
    google_assistant: '🎙️',
    siri: '🗣️',
    cortana: '💬',
    bixby: '🔈',
    custom: '🤖',
  }
  return icons[platform]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Links a voice assistant device to a user account
 */
export async function linkVoiceDevice(
  userId: string,
  input: z.infer<typeof linkDeviceSchema>
): Promise<LinkedVoiceDevice> {
  const validationResult = linkDeviceSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const deviceId = input.deviceId
  const verificationToken = generateVerificationToken()

  const { data, error } = await supabase
    .from('linked_voice_devices')
    .upsert({
      user_id: userId,
      device_id: deviceId,
      device_name: input.deviceName,
      platform: input.platform,
      status: 'pending_verification',
      verification_token: verificationToken,
      location: input.location,
      settings: {
        alertsEnabled: true,
        outageAlerts: true,
        weatherAlerts: true,
        safetyAlerts: true,
        voiceVolume: 80,
        notificationsEnabled: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error linking device:', error)
    throw new Error(`Failed to link device: ${error.message}`)
  }

  return mapDeviceFromDB(data)
}

/**
 * Unlinks a voice assistant device
 */
export async function unlinkVoiceDevice(
  userId: string,
  deviceId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('linked_voice_devices')
    .delete()
    .eq('user_id', userId)
    .eq('device_id', deviceId)

  if (error) {
    console.error('Error unlinking device:', error)
    throw new Error(`Failed to unlink device: ${error.message}`)
  }

  return true
}

/**
 * Gets linked voice devices for a user
 */
export async function getLinkedDevices(
  userId: string,
  options?: {
    platform?: VoiceAssistantPlatform
    status?: VoiceAssistantStatus
  }
): Promise<LinkedVoiceDevice[]> {
  const supabase = createClient()

  let query = supabase
    .from('linked_voice_devices')
    .select('*')
    .eq('user_id', userId)

  if (options?.platform) {
    query = query.eq('platform', options.platform)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching devices:', error)
    return []
  }

  return (data || []).map(mapDeviceFromDB)
}

/**
 * Updates device settings
 */
export async function updateDeviceSettings(
  userId: string,
  input: z.infer<typeof updateDeviceSettingsSchema>
): Promise<LinkedVoiceDevice> {
  const validationResult = updateDeviceSettingsSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Get existing settings
  const { data: existing } = await supabase
    .from('linked_voice_devices')
    .select('settings')
    .eq('user_id', userId)
    .eq('device_id', input.deviceId)
    .single()

  const newSettings = {
    ...(existing?.settings || {}),
    ...input.settings,
  }

  const { data, error } = await supabase
    .from('linked_voice_devices')
    .update({
      settings: newSettings,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('device_id', input.deviceId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating settings:', error)
    throw new Error(`Failed to update settings: ${error.message}`)
  }

  return mapDeviceFromDB(data)
}

/**
 * Processes a voice command
 */
export async function processVoiceCommand(
  input: z.infer<typeof voiceCommandSchema>
): Promise<{
  response: string
  audioUrl?: string
  sessionId: string
  success: boolean
}> {
  const validationResult = voiceCommandSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Determine intent from transcript
  const intent = determineIntentFromTranscript(input.transcript)
  const commandType = mapIntentToCommandType(intent)

  // Generate response based on intent
  const response = await generateVoiceResponse(
    commandType,
    input.entities,
    input.location
  )

  // Create interaction record
  const interactionId = `interaction_${Date.now()}`
  const sessionId = input.sessionId || `session_${Date.now()}`

  const { error } = await supabase
    .from('voice_interactions')
    .insert({
      id: interactionId,
      session_id: sessionId,
      user_id: input.userId,
      device_id: input.deviceId,
      platform: input.platform,
      command_type: commandType,
      raw_transcript: input.transcript,
      intent,
      entities: input.entities,
      response,
      session_state: 'idle',
      success: true,
      started_at: new Date().toISOString(),
      processing_time_ms: Math.random() * 500 + 100, // Simulated
    })

  if (error) {
    console.error('Error recording interaction:', error)
  }

  return {
    response,
    sessionId,
    success: true,
  }
}

/**
 * Starts a voice session
 */
export async function startVoiceSession(
  userId: string,
  deviceId: string,
  platform: VoiceAssistantPlatform,
  location?: { latitude: number; longitude: number }
): Promise<VoiceSession> {
  const supabase = createClient()

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours

  const { data, error } = await supabase
    .from('voice_sessions')
    .insert({
      session_id: sessionId,
      user_id: userId,
      device_id: deviceId,
      platform,
      state: 'idle',
      interaction_history: [],
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      location,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error starting session:', error)
    throw new Error(`Failed to start session: ${error.message}`)
  }

  return mapSessionFromDB(data)
}

/**
 * Ends a voice session
 */
export async function endVoiceSession(sessionId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('voice_sessions')
    .update({
      state: 'idle',
      last_activity_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)

  if (error) {
    console.error('Error ending session:', error)
    throw new Error(`Failed to end session: ${error.message}`)
  }

  return true
}

/**
 * Sends a voice alert notification
 */
export async function sendVoiceAlert(
  alertId: string,
  userId: string,
  platform: VoiceAssistantPlatform,
  options?: {
    deviceId?: string
    ttsText?: string
    audioUrl?: string
  }
): Promise<VoiceAlertNotification> {
  const supabase = createClient()

  const notificationId = `voice_alert_${Date.now()}`

  const { data, error } = await supabase
    .from('voice_alert_notifications')
    .insert({
      id: notificationId,
      alert_id: alertId,
      alert_type: 'emergency',
      severity: 'critical',
      title: 'Emergency Alert',
      message: options?.ttsText || 'You have an important alert.',
      tts_text: options?.ttsText || 'You have an important alert.',
      audio_url: options?.audioUrl,
      platform,
      device_id: options?.deviceId,
      user_id: userId,
      status: 'pending',
      scheduled_for: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error sending voice alert:', error)
    throw new Error(`Failed to send alert: ${error.message}`)
  }

  return mapAlertFromDB(data)
}

/**
 * Gets voice analytics
 */
export async function getVoiceAnalytics(
  periodDays: number = 30
): Promise<VoiceAnalytics> {
  const supabase = createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  // Get interactions
  const { data: interactions } = await supabase
    .from('voice_interactions')
    .select('*')
    .gte('created_at', startDate.toISOString())

  // Get devices
  const { data: devices } = await supabase
    .from('linked_voice_devices')
    .select('*')

  // Calculate statistics
  const uniqueUsers = new Set((interactions || []).map(i => i.user_id)).size
  const uniqueDevices = new Set((interactions || []).map(i => i.device_id)).size

  // Platform stats
  const platformStats: VoiceAnalytics['platformStats'] = {
    alexa: { interactions: 0, devices: 0, successRate: 0 },
    google_assistant: { interactions: 0, devices: 0, successRate: 0 },
    siri: { interactions: 0, devices: 0, successRate: 0 },
    cortana: { interactions: 0, devices: 0, successRate: 0 },
    bixby: { interactions: 0, devices: 0, successRate: 0 },
    custom: { interactions: 0, devices: 0, successRate: 0 },
  }

  for (const interaction of interactions || []) {
    const platform = interaction.platform as VoiceAssistantPlatform
    if (platformStats[platform]) {
      platformStats[platform].interactions++
    }
  }

  for (const device of devices || []) {
    const platform = device.platform as VoiceAssistantPlatform
    if (platformStats[platform]) {
      platformStats[platform].devices++
    }
  }

  // Command stats
  const commandStats: VoiceAnalytics['commandStats'] = {
    check_status: { count: 0, successRate: 0, avgResponseTime: 0 },
    report_outage: { count: 0, successRate: 0, avgResponseTime: 0 },
    subscribe_alerts: { count: 0, successRate: 0, avgResponseTime: 0 },
    unsubscribe_alerts: { count: 0, successRate: 0, avgResponseTime: 0 },
    get_safety_info: { count: 0, successRate: 0, avgResponseTime: 0 },
    find_shelter: { count: 0, successRate: 0, avgResponseTime: 0 },
    emergency_alert: { count: 0, successRate: 0, avgResponseTime: 0 },
    check_restoration: { count: 0, successRate: 0, avgResponseTime: 0 },
    custom: { count: 0, successRate: 0, avgResponseTime: 0 },
  }

  for (const interaction of interactions || []) {
    const command = interaction.command_type as VoiceCommandType
    if (commandStats[command]) {
      commandStats[command].count++
      if (interaction.processing_time_ms) {
        commandStats[command].avgResponseTime = interaction.processing_time_ms as number
      }
    }
  }

  return {
    totalInteractions: (interactions || []).length,
    uniqueUsers,
    uniqueDevices,
    platformStats,
    commandStats,
    avgSessionDuration: 0,
    avgInteractionsPerSession: 0,
    errorRate: 0,
    topErrors: [],
    periodStart: startDate.toISOString(),
    periodEnd: new Date().toISOString(),
  }
}

/**
 * Verifies a voice device
 */
export async function verifyVoiceDevice(
  userId: string,
  deviceId: string,
  verificationToken: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('linked_voice_devices')
    .update({
      status: 'active',
      verified_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('device_id', deviceId)
    .eq('verification_token', verificationToken)

  if (error) {
    console.error('Error verifying device:', error)
    return false
  }

  return true
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a verification token
 */
function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

/**
 * Determines intent from transcript
 */
function determineIntentFromTranscript(transcript: string): string {
  const lower = transcript.toLowerCase()
  
  if (lower.includes('status') || lower.includes('outage')) {
    return 'check_outage_status'
  }
  if (lower.includes('report') || lower.includes('no power')) {
    return 'report_outage'
  }
  if (lower.includes('subscribe') || lower.includes('alert')) {
    return 'subscribe_alerts'
  }
  if (lower.includes('unsubscribe') || lower.includes('stop')) {
    return 'unsubscribe_alerts'
  }
  if (lower.includes('safety') || lower.includes('safe')) {
    return 'get_safety_info'
  }
  if (lower.includes('shelter') || lower.includes('location')) {
    return 'find_shelter'
  }
  if (lower.includes('emergency') || lower.includes('help')) {
    return 'emergency_alert'
  }
  if (lower.includes('restoration') || lower.includes('fixed')) {
    return 'check_restoration'
  }
  
  return 'unknown'
}

/**
 * Maps intent to command type
 */
function mapIntentToCommandType(intent: string): VoiceCommandType {
  const mapping: Record<string, VoiceCommandType> = {
    check_outage_status: 'check_status',
    report_outage: 'report_outage',
    subscribe_alerts: 'subscribe_alerts',
    unsubscribe_alerts: 'unsubscribe_alerts',
    get_safety_info: 'get_safety_info',
    find_shelter: 'find_shelter',
    emergency_alert: 'emergency_alert',
    check_restoration: 'check_restoration',
    unknown: 'custom',
  }
  return mapping[intent] || 'custom'
}

/**
 * Generates a voice response
 */
async function generateVoiceResponse(
  commandType: VoiceCommandType,
  entities?: Record<string, unknown>,
  location?: { latitude: number; longitude: number }
): Promise<string> {
  const responses: Record<VoiceCommandType, string> = {
    check_status: 'According to our records, there are no reported outages in your area.',
    report_outage: 'Thank you for reporting. Your outage report has been submitted. We will investigate and provide updates.',
    subscribe_alerts: 'You have been subscribed to outage alerts. You will receive notifications about power outages in your area.',
    unsubscribe_alerts: 'You have been unsubscribed from outage alerts.',
    get_safety_info: 'For your safety during a power outage, please use flashlights instead of candles, keep refrigerator doors closed, and avoid using generators indoors.',
    find_shelter: 'The nearest shelter is located at the community center on Main Street. It is open 24 hours.',
    emergency_alert: 'Emergency services have been notified. Please stay calm and follow any instructions from emergency personnel.',
    check_restoration: 'Our crews are working to restore power. Estimated restoration time is 4 PM today.',
    custom: 'I did not understand that command. Please try again.',
  }

  return responses[commandType] || responses.custom
}

/**
 * Maps database record to LinkedVoiceDevice
 */
function mapDeviceFromDB(data: Record<string, unknown>): LinkedVoiceDevice {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    deviceId: data.device_id as string,
    deviceName: data.device_name as string,
    platform: data.platform as VoiceAssistantPlatform,
    status: data.status as VoiceAssistantStatus,
    lastSeenAt: data.last_seen_at as string | undefined,
    settings: (data.settings as unknown as LinkedVoiceDevice['settings']) || {
      alertsEnabled: true,
      outageAlerts: true,
      weatherAlerts: true,
      safetyAlerts: true,
      voiceVolume: 50,
      notificationsEnabled: true
    },
    location: (data.location as LinkedVoiceDevice['location']) || undefined,
    verifiedAt: data.verified_at as string | undefined,
    verificationToken: data.verification_token as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to VoiceSession
 */
function mapSessionFromDB(data: Record<string, unknown>): VoiceSession {
  return {
    id: data.id as string,
    sessionId: data.session_id as string,
    userId: data.user_id as string,
    deviceId: data.device_id as string,
    platform: data.platform as VoiceAssistantPlatform,
    state: data.state as VoiceSessionState,
    currentIntent: data.current_intent as string | undefined,
    context: data.context as Record<string, unknown> | undefined,
    interactionHistory: (data.interaction_history || []) as { timestamp: string; type: "user" | "system"; transcript?: string; response?: string }[],
    startedAt: data.started_at as string,
    lastActivityAt: data.last_activity_at as string | undefined,
    expiresAt: data.expires_at as string,
    location: data.location as { latitude: number; longitude: number } | undefined,
  }
}

/**
 * Maps database record to VoiceAlertNotification
 */
function mapAlertFromDB(data: Record<string, unknown>): VoiceAlertNotification {
  return {
    id: data.id as string,
    alertId: data.alert_id as string,
    alertType: data.alert_type as string,
    severity: data.severity as "critical" | "warning" | "info",
    title: data.title as string,
    message: data.message as string,
    platform: data.platform as VoiceAssistantPlatform,
    deviceId: data.device_id as string | undefined,
    userId: data.user_id as string | undefined,
    audioUrl: data.audio_url as string | undefined,
    ttsText: data.tts_text as string,
    status: data.status as "pending" | "delivered" | "listened" | "dismissed" | "failed",
    scheduledFor: data.scheduled_for as string | undefined,
    deliveredAt: data.delivered_at as string | undefined,
    listenedAt: data.listened_at as string | undefined,
    createdAt: data.created_at as string,
  }
}
