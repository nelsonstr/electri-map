import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type AlertChannel = 'sms' | 'email' | 'push' | 'voice' | 'whatsapp' | 'telegram'

export type AlertStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked' | 'acknowledged'

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low'

export interface AlertDelivery {
  channel: AlertChannel
  status: AlertStatus
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  clickedAt?: string
  failedAt?: string
  failureReason?: string
  deliveryMetadata?: Record<string, unknown>
}

export interface MultiChannelAlert {
  id: string
  userId?: string
  
  // Alert Content
  title: string
  body: string
  alertType: string
  priority: AlertPriority
  
  // Target
  targetType: 'user' | 'group' | 'location' | 'broadcast'
  targetIds?: string[]
  locationFilter?: {
    latitude: number
    longitude: number
    radiusKm: number
  }
  
  // Channels Configuration
  channels: AlertChannel[]
  channelPreferences?: Record<string, boolean>
  
  // Delivery Tracking
  deliveries: Record<string, AlertDelivery>
  totalSent: number
  totalDelivered: number
  totalFailed: number
  
  // Timing
  scheduledAt?: string
  expiresAt?: string
  sentAt?: string
  completedAt?: string
  
  // Action
  actionUrl?: string
  actionLabel?: string
  
  // Metadata
  alertId?: string
  incidentId?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CreateAlertInput {
  userId?: string
  title: string
  body: string
  alertType: string
  priority: AlertPriority
  targetType: 'user' | 'group' | 'location' | 'broadcast'
  targetIds?: string[]
  locationFilter?: {
    latitude: number
    longitude: number
    radiusKm: number
  }
  channels?: AlertChannel[]
  scheduledAt?: string
  expiresAt?: string
  actionUrl?: string
  actionLabel?: string
  alertId?: string
  incidentId?: string
}

export interface SendChannelInput {
  alertId: string
  channel: AlertChannel
  recipients: string[]
  content: {
    title: string
    body: string
    data?: Record<string, unknown>
  }
}

export interface ChannelCredentials {
  provider: string
  apiKey?: string
  apiSecret?: string
  fromAddress: string
  isVerified: boolean
}

// ============================================================================
// SMS Provider Configuration
// ============================================================================

export const SMS_PROVIDERS = {
  twilio: {
    name: 'Twilio',
    baseUrl: 'https://api.twilio.com/2010-04-01',
    maxMessageLength: 1600,
    supportsUnicode: true,
  },
  nexmo: {
    name: 'Vonage (Nexmo)',
    baseUrl: 'https://api.nexmo.com',
    maxMessageLength: 1600,
    supportsUnicode: true,
  },
  aws_sns: {
    name: 'AWS SNS',
    baseUrl: 'https://sns.us-east-1.amazonaws.com',
    maxMessageLength: 1600,
    supportsUnicode: true,
  },
} as const

// ============================================================================
// Email Provider Configuration
// ============================================================================

export const EMAIL_PROVIDERS = {
  sendgrid: {
    name: 'SendGrid',
    baseUrl: 'https://api.sendgrid.com/v3',
    maxSubjectLength: 200,
    supportsHtml: true,
    supportsTemplates: true,
  },
  mailgun: {
    name: 'Mailgun',
    baseUrl: 'https://api.mailgun.net/v3',
    maxSubjectLength: 200,
    supportsHtml: true,
    supportsTemplates: true,
  },
  aws_ses: {
    name: 'AWS SES',
    baseUrl: 'https://email.us-east-1.amazonaws.com',
    maxSubjectLength: 200,
    supportsHtml: true,
    supportsTemplates: true,
  },
  postmark: {
    name: 'Postmark',
    baseUrl: 'https://api.postmarkapp.com',
    maxSubjectLength: 200,
    supportsHtml: true,
    supportsTemplates: true,
  },
} as const

// ============================================================================
// Validation Schemas
// ============================================================================

export const createAlertSchema = z.object({
  userId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  alertType: z.string().min(1),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  targetType: z.enum(['user', 'group', 'location', 'broadcast']),
  targetIds: z.array(z.string()).optional(),
  locationFilter: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusKm: z.number().positive().max(100),
  }).optional(),
  channels: z.array(z.enum(['sms', 'email', 'push', 'voice', 'whatsapp', 'telegram'])).optional(),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().optional(),
  alertId: z.string().optional(),
  incidentId: z.string().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getChannelDisplayName(channel: AlertChannel): string {
  const names: Record<AlertChannel, string> = {
    sms: 'SMS',
    email: 'Email',
    push: 'Push Notification',
    voice: 'Voice Call',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
  }
  return names[channel]
}

export function getStatusDisplayName(status: AlertStatus): string {
  const names: Record<AlertStatus, string> = {
    pending: 'Pending',
    sent: 'Sent',
    delivered: 'Delivered',
    failed: 'Failed',
    clicked: 'Clicked',
    acknowledged: 'Acknowledged',
  }
  return names[status]
}

export function getPriorityDisplayName(priority: AlertPriority): string {
  const names: Record<AlertPriority, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }
  return names[priority]
}

export function formatSMSContent(content: { body: string }): string {
  // Basic SMS formatting - truncate if too long
  const maxLength = 1600
  if (content.body.length <= maxLength) {
    return content.body
  }
  return content.body.substring(0, maxLength - 3) + '...'
}

export function formatEmailContent(
  content: { title: string; body: string },
  options?: {
    html?: boolean
    footer?: string
  }
): { subject: string; text: string; html?: string } {
  const subject = content.title
  
  let text = content.body
  let html: string | undefined

  if (options?.html) {
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">${content.title}</h1>
    <div style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
      ${content.body.replace(/\n/g, '<br>')}
    </div>
    ${options?.footer ? `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e4; color: #888; font-size: 14px;">${options.footer}</div>` : ''}
  </div>
</body>
</html>
    `.trim()
  }

  return { subject, text, html }
}

export function calculateDeliveryRate(
  deliveries: MultiChannelAlert['deliveries']
): number {
  const total = Object.keys(deliveries).length
  if (total === 0) return 0
  
  const delivered = Object.values(deliveries).filter(
    d => d.status === 'delivered' || d.status === 'clicked' || d.status === 'acknowledged'
  ).length
  
  return (delivered / total) * 100
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createMultiChannelAlert(
  input: CreateAlertInput
): Promise<MultiChannelAlert> {
  const validationResult = createAlertSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const alertId = `mcalert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Default channels based on priority
  const defaultChannels: Record<AlertPriority, AlertChannel[]> = {
    critical: ['sms', 'email', 'push', 'voice'],
    high: ['sms', 'email', 'push'],
    medium: ['email', 'push'],
    low: ['push'],
  }

  const channels = input.channels || defaultChannels[input.priority]

  const alert: MultiChannelAlert = {
    id: alertId,
    userId: input.userId,
    title: input.title,
    body: input.body,
    alertType: input.alertType,
    priority: input.priority,
    targetType: input.targetType,
    targetIds: input.targetIds,
    locationFilter: input.locationFilter,
    channels,
    deliveries: {},
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    scheduledAt: input.scheduledAt,
    expiresAt: input.expiresAt,
    actionUrl: input.actionUrl,
    actionLabel: input.actionLabel,
    alertId: input.alertId,
    incidentId: input.incidentId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('multi_channel_alerts')
    .insert({
      id: alertId,
      user_id: input.userId,
      title: input.title,
      body: input.body,
      alert_type: input.alertType,
      priority: input.priority,
      target_type: input.targetType,
      target_ids: input.targetIds,
      location_filter: input.locationFilter,
      channels,
      deliveries: {},
      total_sent: 0,
      total_delivered: 0,
      total_failed: 0,
      scheduled_at: input.scheduledAt,
      expires_at: input.expiresAt,
      action_url: input.actionUrl,
      action_label: input.actionLabel,
      alert_id: input.alertId,
      incident_id: input.incidentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating multi-channel alert:', error)
    throw new Error('Failed to create multi-channel alert')
  }

  // Schedule delivery if specified
  if (input.scheduledAt) {
    await scheduleAlertDelivery(alertId, input.scheduledAt)
  } else {
    // Send immediately
    await sendMultiChannelAlert(alertId)
  }

  return alert
}

export async function getAlert(alertId: string): Promise<MultiChannelAlert | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('multi_channel_alerts')
    .select('*')
    .eq('id', alertId)
    .single()

  if (error || !data) {
    return null
  }

  return mapAlertFromDB(data)
}

export async function sendMultiChannelAlert(alertId: string): Promise<void> {
  const alert = await getAlert(alertId)
  if (!alert) {
    throw new Error('Alert not found')
  }

  // Check if alert is expired
  if (alert.expiresAt && new Date(alert.expiresAt) < new Date()) {
    await updateAlertStatus(alertId, 'failed', 'Alert expired')
    return
  }

  // Get recipients based on target type
  const recipients = await getAlertRecipients(alert)
  
  if (recipients.length === 0) {
    await updateAlertStatus(alertId, 'failed', 'No recipients found')
    return
  }

  const supabase = createClient()

  // Send through each channel
  const results: Record<string, { sent: number; failed: number }> = {}

  for (const channel of alert.channels) {
    try {
      const result = await sendThroughChannel(alert, channel, recipients)
      results[channel] = result
    } catch (error) {
      console.error(`Error sending through ${channel}:`, error)
      results[channel] = { sent: 0, failed: recipients.length }
    }
  }

  // Update alert with results
  const totalSent = Object.values(results).reduce((sum, r) => sum + r.sent, 0)
  const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0)

  const deliveries: MultiChannelAlert['deliveries'] = {}
  for (const [channel, result] of Object.entries(results)) {
    deliveries[channel] = {
      channel: channel as AlertChannel,
      status: result.failed === recipients.length ? 'failed' : 'sent',
      sentAt: new Date().toISOString(),
      failedAt: result.failed > 0 ? new Date().toISOString() : undefined,
    }
  }

  await supabase
    .from('multi_channel_alerts')
    .update({
      deliveries,
      total_sent: totalSent,
      total_delivered: totalSent - totalFailed,
      total_failed: totalFailed,
      sent_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
}

async function sendThroughChannel(
  alert: MultiChannelAlert,
  channel: AlertChannel,
  recipients: Array<{ id: string; phone?: string; email?: string; pushToken?: string }>
): Promise<{ sent: number; failed: number }> {
  const content = {
    title: alert.title,
    body: alert.body,
    data: {
      alertId: alert.id,
      alertType: alert.alertType,
      priority: alert.priority,
      actionUrl: alert.actionUrl,
    },
  }

  switch (channel) {
    case 'sms':
      return await sendSMS(recipients.map(r => r.phone!).filter(Boolean), content)
    case 'email':
      return await sendEmail(recipients.map(r => r.email!).filter(Boolean), content)
    case 'push':
      return await sendPush(recipients.filter(r => r.pushToken).map(r => r.pushToken!), content)
    case 'voice':
      return await sendVoice(recipients.map(r => r.phone!).filter(Boolean), content)
    case 'whatsapp':
      return await sendWhatsApp(recipients.map(r => r.phone!).filter(Boolean), content)
    case 'telegram':
      return await sendTelegram(recipients.map(r => r.id).filter(Boolean), content)
    default:
      return { sent: 0, failed: recipients.length }
  }
}

async function sendSMS(
  phoneNumbers: string[],
  content: { title: string; body: string; data?: Record<string, unknown> }
): Promise<{ sent: number; failed: number }> {
  // In production, integrate with SMS provider (Twilio, Nexmo, AWS SNS)
  console.log(`Sending SMS to ${phoneNumbers.length} recipients`)
  console.log(`Content: ${content.body}`)
  
  // Simulate API call
  return { sent: phoneNumbers.length, failed: 0 }
}

async function sendEmail(
  emails: string[],
  content: { title: string; body: string; data?: Record<string, unknown> }
): Promise<{ sent: number; failed: number }> {
  // In production, integrate with email provider (SendGrid, Mailgun, AWS SES)
  console.log(`Sending email to ${emails.length} recipients`)
  console.log(`Subject: ${content.title}`)
  
  const emailContent = formatEmailContent(content, {
    html: true,
    footer: 'This is an automated alert from NeighborPulse. Do not reply to this email.',
  })
  
  console.log('Email content prepared:', emailContent)
  
  // Simulate API call
  return { sent: emails.length, failed: 0 }
}

async function sendPush(
  tokens: string[],
  content: { title: string; body: string; data?: Record<string, unknown> }
): Promise<{ sent: number; failed: number }> {
  // In production, integrate with push provider (Firebase, OneSignal)
  console.log(`Sending push notification to ${tokens.length} devices`)
  console.log(`Title: ${content.title}`)
  console.log(`Body: ${content.body}`)
  
  // Simulate API call
  return { sent: tokens.length, failed: 0 }
}

async function sendVoice(
  phoneNumbers: string[],
  content: { title: string; body: string; data?: Record<string, unknown> }
): Promise<{ sent: number; failed: number }> {
  // In production, integrate with voice provider (Twilio, Vonage)
  console.log(`Initiating voice call to ${phoneNumbers.length} recipients`)
  console.log(`Message: ${content.body}`)
  
  // Simulate API call
  return { sent: phoneNumbers.length, failed: 0 }
}

async function sendWhatsApp(
  phoneNumbers: string[],
  content: { title: string; body: string; data?: Record<string, unknown> }
): Promise<{ sent: number; failed: number }> {
  // In production, integrate with WhatsApp Business API
  console.log(`Sending WhatsApp message to ${phoneNumbers.length} recipients`)
  console.log(`Content: ${content.body}`)
  
  // Simulate API call
  return { sent: phoneNumbers.length, failed: 0 }
}

async function sendTelegram(
  userIds: string[],
  content: { title: string; body: string; data?: Record<string, unknown> }
): Promise<{ sent: number; failed: number }> {
  // In production, integrate with Telegram Bot API
  console.log(`Sending Telegram message to ${userIds.length} users`)
  console.log(`Content: ${content.title}\n${content.body}`)
  
  // Simulate API call
  return { sent: userIds.length, failed: 0 }
}

async function getAlertRecipients(
  alert: MultiChannelAlert
): Promise<Array<{ id: string; phone?: string; email?: string; pushToken?: string }>> {
  const supabase = createClient()

  if (alert.targetType === 'user' && alert.userId) {
    // Single user
    const { data } = await supabase
      .from('users')
      .select('id, phone, email, push_token')
      .eq('id', alert.userId)
      .single()

    return data ? [data as { id: string; phone?: string; email?: string; pushToken?: string }] : []
  }

  if (alert.targetType === 'group') {
    const { data } = await supabase
      .from('user_groups')
      .select('user_id')
      .in('id', alert.targetIds || [])

    if (!data || data.length as number === 0) return []

    const userIds = data.map(g => g.user_id)
    
    const { data: users } = await supabase
      .from('users')
      .select('id, phone, email, push_token')
      .in('id', userIds)

    return (users || []) as Array<{ id: string; phone?: string; email?: string; pushToken?: string }>
  }

  if (alert.targetType === 'location') {
    // Get users within location radius
    // In production, use PostGIS for geospatial queries
    const { data } = await supabase
      .from('users')
      .select('id, phone, email, push_token, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (!data) return []

    const recipients: Array<{ id: string; phone?: string; email?: string; pushToken?: string }> = []
    
    if (alert.locationFilter) {
      const { latitude, longitude, radiusKm } = alert.locationFilter
      
      for (const user of (data || [])) {
        // Explicitly cast user to any to access properties
        const u = user as any
        if (u.latitude && u.longitude) {
          const distance = calculateDistance(
            latitude,
            longitude,
            u.latitude,
            u.longitude
          )
          
          if (distance <= radiusKm) {
            recipients.push(user as { id: string; phone?: string; email?: string; pushToken?: string })
          }
        }
      }
    }

    return recipients
  }

  // Broadcast to all users
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, phone, email, push_token')

  return (allUsers || []) as Array<{ id: string; phone?: string; email?: string; pushToken?: string }>
}

async function scheduleAlertDelivery(alertId: string, scheduledAt: string): Promise<void> {
  const supabase = createClient()

  // In production, use a job queue (Bull, Agenda, RQ)
  const { error } = await supabase
    .from('scheduled_alerts')
    .insert({
      alert_id: alertId,
      scheduled_at: scheduledAt,
      status: 'pending',
      created_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error scheduling alert:', error)
  }
}

async function updateAlertStatus(
  alertId: string,
  status: AlertStatus,
  reason?: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('multi_channel_alerts')
    .update({
      status,
      failure_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
}

export async function updateDeliveryStatus(
  alertId: string,
  channel: AlertChannel,
  status: AlertStatus,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createClient()

  const alert = await getAlert(alertId)
  if (!alert) return

  const deliveries = { ...alert.deliveries }
  if (!deliveries[channel]) {
    deliveries[channel] = { channel, status: 'pending' }
  }

  const updateData: Record<string, unknown> = {
    [`deliveries.${channel}.status`]: status,
    updated_at: new Date().toISOString(),
  }

  switch (status) {
    case 'sent':
      updateData[`deliveries.${channel}.sentAt`] = new Date().toISOString()
      break
    case 'delivered':
      updateData[`deliveries.${channel}.deliveredAt`] = new Date().toISOString()
      break
    case 'clicked':
      updateData[`deliveries.${channel}.clickedAt`] = new Date().toISOString()
      break
    case 'failed':
      updateData[`deliveries.${channel}.failedAt`] = new Date().toISOString()
      updateData[`deliveries.${channel}.failureReason`] = metadata?.reason
      break
  }

  if (metadata) {
    updateData[`deliveries.${channel}.deliveryMetadata`] = metadata
  }

  await supabase
    .from('multi_channel_alerts')
    .update(updateData)
    .eq('id', alertId)
}

export async function getAlerts(options?: {
  userId?: string
  status?: AlertStatus
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}): Promise<MultiChannelAlert[]> {
  const supabase = createClient()

  let query = supabase
    .from('multi_channel_alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.userId) {
    query = query.eq('user_id', options.userId)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.fromDate) {
    query = query.gte('created_at', options.fromDate)
  }

  if (options?.toDate) {
    query = query.lte('created_at', options.toDate)
  }

  // Use range for pagination
  const limit = options?.limit || 50
  const offset = options?.offset || 0
  if (limit) {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching alerts:', error)
    return []
  }

  return (data || []).map(mapAlertFromDB)
}

// ============================================================================
// Utility Functions
// ============================================================================

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function mapAlertFromDB(data: Record<string, unknown>): MultiChannelAlert {
  return {
    id: data.id as string,
    userId: data.user_id as string | undefined,
    title: data.title as string,
    body: data.body as string,
    alertType: data.alert_type as string,
    priority: data.priority as AlertPriority,
    targetType: data.target_type as 'user' | 'group' | 'location' | 'broadcast',
    targetIds: data.target_ids as string[] | undefined,
    locationFilter: data.location_filter as MultiChannelAlert['locationFilter'] | undefined,
    channels: (data.channels as AlertChannel[]) || [],
    channelPreferences: data.channel_preferences as Record<string, boolean> | undefined,
    deliveries: (data.deliveries as Record<string, AlertDelivery>) || {},
    totalSent: data.total_sent as number,
    totalDelivered: data.total_delivered as number,
    totalFailed: data.total_failed as number,
    scheduledAt: data.scheduled_at as string | undefined,
    expiresAt: data.expires_at as string | undefined,
    sentAt: data.sent_at as string | undefined,
    completedAt: data.completed_at as string | undefined,
    actionUrl: data.action_url as string | undefined,
    actionLabel: data.action_label as string | undefined,
    alertId: data.alert_id as string | undefined,
    incidentId: data.incident_id as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
