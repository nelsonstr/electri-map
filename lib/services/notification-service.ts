import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Notification channels
 */
export type NotificationChannel = 
  | 'sms'
  | 'email'
  | 'push'
  | 'in_app'
  | 'whatsapp'
  | 'telegram'

/**
 * Notification priority
 */
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low'

/**
 * Notification status
 */
export type NotificationStatus = 
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'read'
  | 'clicked'

/**
 * Alert type categories
 */
export type AlertType =
  | 'emergency'
  | 'weather'
  | 'fire'
  | 'flood'
  | 'power_outage'
  | 'medical'
  | 'security'
  | 'informational'

/**
 * Recipient type for notifications
 */
export interface NotificationRecipient {
  userId?: string
  email?: string
  phone?: string
  deviceTokens?: string[]
  channelPreferences?: NotificationChannel[]
}

/**
 * Input for creating a notification
 */
export interface NotificationInput {
  alertId?: string
  alertType: AlertType
  title: string
  body: string
  priority: NotificationPriority
  channels: NotificationChannel[]
  recipients: NotificationRecipient[]
  metadata?: Record<string, unknown>
  scheduledAt?: string
  expiresAt?: string
  actionUrl?: string
  imageUrl?: string
}

/**
 * Full notification record (for display)
 */
export interface Notification {
  id: string
  alertId?: string
  alertType: AlertType
  title: string
  body: string
  priority: NotificationPriority
  channel: NotificationChannel
  recipientUserId?: string
  recipientEmail?: string
  recipientPhone?: string
  status: NotificationStatus
  metadata?: Record<string, unknown>
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  clickedAt?: string
  errorMessage?: string
  actionUrl?: string
  imageUrl?: string
  createdAt: string
}

/**
 * Bulk notification result
 */
export interface BulkNotificationResult {
  totalRecipients: number
  successfulDeliveries: number
  failedDeliveries: number
  pendingDeliveries: number
  channelBreakdown: Record<NotificationChannel, { sent: number; failed: number }>
  errors: Array<{ recipient: string; channel: NotificationChannel; error: string }>
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for notification recipient
 */
export const notificationRecipientSchema = z.object({
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  deviceTokens: z.array(z.string()).optional(),
  channelPreferences: z.array(z.enum(['sms', 'email', 'push', 'in_app', 'whatsapp', 'telegram'])).optional(),
})

/**
 * Schema for notification input
 */
export const notificationInputSchema = z.object({
  alertId: z.string().uuid().optional(),
  alertType: z.enum([
    'emergency',
    'weather',
    'fire',
    'flood',
    'power_outage',
    'medical',
    'security',
    'informational'
  ]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  priority: z.enum(['critical', 'high', 'normal', 'low']),
  channels: z.array(z.enum(['sms', 'email', 'push', 'in_app', 'whatsapp', 'telegram'])).min(1),
  recipients: z.array(notificationRecipientSchema).min(1),
  metadata: z.record(z.unknown()).optional(),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  actionUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the display name for a notification channel
 */
export function getChannelDisplayName(channel: NotificationChannel): string {
  const names: Record<NotificationChannel, string> = {
    sms: 'SMS',
    email: 'Email',
    push: 'Push Notification',
    in_app: 'In-App',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
  }
  return names[channel]
}

/**
 * Gets the icon for a notification channel
 */
export function getChannelIcon(channel: NotificationChannel): string {
  const icons: Record<NotificationChannel, string> = {
    sms: '📱',
    email: '📧',
    push: '🔔',
    in_app: '📬',
    whatsapp: '💬',
    telegram: '✈️',
  }
  return icons[channel]
}

/**
 * Gets the color for notification priority
 */
export function getPriorityColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-500 text-white',
    normal: 'bg-blue-500 text-white',
    low: 'bg-gray-400 text-white',
  }
  return colors[priority]
}

/**
 * Formats phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 9) {
    return `+351 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned.startsWith('351')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }
  return phone
}

// ============================================================================
// SMS Integration (Stub for Twilio)
// ============================================================================

/**
 * Sends SMS via Twilio (stub implementation)
 */
async function sendSMS(phone: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // In production, integrate with Twilio:
  // const twilio = require('twilio')(accountSid, authToken)
  // const message = await twilio.messages.create({
  //   body,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phone,
  // })
  
  console.log(`[SMS Stub] Sending to ${formatPhoneNumber(phone)}: ${body.substring(0, 50)}...`)
  
  // Simulate success
  return {
    success: true,
    messageId: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }
}

// ============================================================================
// Email Integration (Stub for SendGrid/Resend)
// ============================================================================

/**
 * Sends email via SendGrid/Resend (stub implementation)
 */
async function sendEmail(
  email: string,
  subject: string,
  body: string,
  htmlBody?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // In production, integrate with Resend/SendGrid:
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // const { data, error } = await resend.emails.send({
  //   from: 'alerts@neighborpulse.com',
  //   to: email,
  //   subject,
  //   html: htmlBody,
  // })
  
  console.log(`[Email Stub] Sending to ${email}: ${subject}`)
  
  // Simulate success
  return {
    success: true,
    messageId: `EMAIL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }
}

// ============================================================================
// Push Notification Integration (Stub for Firebase)
// ============================================================================

/**
 * Sends push notification via Firebase (stub implementation)
 */
async function sendPushNotification(
  deviceTokens: string[],
  title: string,
  body: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; messageIds: string[]; errors: string[] }> {
  // In production, integrate with Firebase Cloud Messaging:
  // const admin = require('firebase-admin')
  // await admin.messaging().sendEachForMulticast({
  //   tokens: deviceTokens,
  //   notification: { title, body },
  //   data: metadata,
  // })
  
  console.log(`[Push Stub] Sending to ${deviceTokens.length} devices: ${title}`)
  
  const messageIds = deviceTokens.map((_, i) => `PUSH-${Date.now()}-${i}`)
  return {
    success: true,
    messageIds,
    errors: [],
  }
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates and sends notifications via multiple channels
 */
export async function sendNotification(input: NotificationInput): Promise<BulkNotificationResult> {
  const validationResult = notificationInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid notification input: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const result: BulkNotificationResult = {
    totalRecipients: validatedInput.recipients.length,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    pendingDeliveries: 0,
    channelBreakdown: {
      sms: { sent: 0, failed: 0 },
      email: { sent: 0, failed: 0 },
      push: { sent: 0, failed: 0 },
      in_app: { sent: 0, failed: 0 },
      whatsapp: { sent: 0, failed: 0 },
      telegram: { sent: 0, failed: 0 },
    },
    errors: [],
  }

  // Process each recipient
  for (const recipient of validatedInput.recipients) {
    // Determine channels for this recipient
    const channels = recipient.channelPreferences?.length 
      ? recipient.channelPreferences.filter(c => validatedInput.channels.includes(c))
      : validatedInput.channels

    for (const channel of channels) {
      try {
        let sendResult: { success: boolean; messageId?: string; error?: string }
        let recipientIdentifier = ''

        switch (channel) {
          case 'sms':
            if (recipient.phone) {
              recipientIdentifier = recipient.phone
              sendResult = await sendSMS(recipient.phone, `${validatedInput.title}\n\n${validatedInput.body}`)
            }
            break
          case 'email':
            if (recipient.email) {
              recipientIdentifier = recipient.email
              sendResult = await sendEmail(
                recipient.email,
                validatedInput.title,
                validatedInput.body,
                `<h1>${validatedInput.title}</h1><p>${validatedInput.body}</p>`
              )
            }
            break
          case 'push':
            if (recipient.deviceTokens && recipient.deviceTokens.length > 0) {
              recipientIdentifier = `${recipient.deviceTokens.length} devices`
              sendResult = await sendPushNotification(
                recipient.deviceTokens,
                validatedInput.title,
                validatedInput.body,
                validatedInput.metadata
              )
            }
            break
          case 'whatsapp':
            // WhatsApp integration stub (would use Twilio WhatsApp API)
            if (recipient.phone) {
              recipientIdentifier = recipient.phone
              sendResult = await sendSMS(recipient.phone, `📱 WhatsApp: ${validatedInput.title}\n\n${validatedInput.body}`)
            }
            break
          case 'telegram':
            // Telegram integration stub (would use Telegram Bot API)
            if (recipient.userId) {
              recipientIdentifier = `Telegram User: ${recipient.userId}`
              sendResult = { success: true, messageId: `TG-${Date.now()}` }
            }
            break
          case 'in_app':
            // In-app notifications are stored and displayed in the app
            recipientIdentifier = `User: ${recipient.userId || 'unknown'}`
            sendResult = { success: true, messageId: `INAPP-${Date.now()}` }
            break
        }

        // Record the notification in the database
        if (recipientIdentifier) {
          const { error: insertError } = await supabase
            .from('notifications')
            .insert({
              alert_id: validatedInput.alertId || null,
              alert_type: validatedInput.alertType,
              title: validatedInput.title,
              body: validatedInput.body,
              priority: validatedInput.priority,
              channel,
              recipient_user_id: recipient.userId || null,
              recipient_email: recipient.email || null,
              recipient_phone: recipient.phone || null,
              status: sendResult?.success ? 'sent' : 'failed',
              metadata: validatedInput.metadata || null,
              sent_at: sendResult?.success ? new Date().toISOString() : null,
              error_message: sendResult?.error || null,
              action_url: validatedInput.actionUrl || null,
              image_url: validatedInput.imageUrl || null,
              created_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('Error recording notification:', insertError)
          }
        }

        if (sendResult?.success) {
          result.successfulDeliveries++
          result.channelBreakdown[channel].sent++
        } else {
          result.failedDeliveries++
          result.channelBreakdown[channel].failed++
          if (recipientIdentifier) {
            result.errors.push({
              recipient: recipientIdentifier,
              channel,
              error: sendResult?.error || 'Unknown error',
            })
          }
        }
      } catch (error) {
        result.failedDeliveries++
        result.channelBreakdown[channel].failed++
        result.errors.push({
          recipient: recipient.userId || recipient.email || recipient.phone || 'unknown',
          channel,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }

  return result
}

/**
 * Creates a scheduled notification
 */
export async function scheduleNotification(input: NotificationInput): Promise<{ scheduledCount: number }> {
  const validationResult = notificationInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid notification input: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  if (!validatedInput.scheduledAt) {
    throw new Error('Scheduled time is required')
  }

  let scheduledCount = 0

  for (const recipient of validatedInput.recipients) {
    for (const channel of validatedInput.channels) {
      const { error } = await supabase
        .from('scheduled_notifications')
        .insert({
          alert_id: validatedInput.alertId || null,
          alert_type: validatedInput.alertType,
          title: validatedInput.title,
          body: validatedInput.body,
          priority: validatedInput.priority,
          channel,
          recipient_user_id: recipient.userId || null,
          recipient_email: recipient.email || null,
          recipient_phone: recipient.phone || null,
          scheduled_at: validatedInput.scheduledAt,
          expires_at: validatedInput.expiresAt || null,
          metadata: validatedInput.metadata || null,
          action_url: validatedInput.actionUrl || null,
          image_url: validatedInput.imageUrl || null,
          status: 'pending',
          created_at: new Date().toISOString(),
        })

      if (!error) {
        scheduledCount++
      }
    }
  }

  return { scheduledCount }
}

/**
 * Retrieves a notification by ID
 */
export async function getNotification(id: string): Promise<Notification | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching notification:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    alertId: data.alert_id || undefined,
    alertType: data.alert_type as AlertType,
    title: data.title,
    body: data.body,
    priority: data.priority as NotificationPriority,
    channel: data.channel as NotificationChannel,
    recipientUserId: data.recipient_user_id || undefined,
    recipientEmail: data.recipient_email || undefined,
    recipientPhone: data.recipient_phone || undefined,
    status: data.status as NotificationStatus,
    metadata: data.metadata || undefined,
    sentAt: data.sent_at || undefined,
    deliveredAt: data.delivered_at || undefined,
    readAt: data.read_at || undefined,
    clickedAt: data.clicked_at || undefined,
    errorMessage: data.error_message || undefined,
    actionUrl: data.action_url || undefined,
    imageUrl: data.image_url || undefined,
    createdAt: data.created_at,
  }
}

/**
 * Marks a notification as read
 */
export async function markNotificationRead(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ 
      status: 'read',
      read_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return true
}

/**
 * Marks a notification as clicked
 */
export async function markNotificationClicked(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ 
      status: 'clicked',
      clicked_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error marking notification as clicked:', error)
    return false
  }

  return true
}

/**
 * Lists notifications for a user
 */
export async function listUserNotifications(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
    alertType?: AlertType
  }
): Promise<{ notifications: Notification[]; total: number }> {
  const supabase = createClient()

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.unreadOnly) {
    query = query.in('status', ['sent', 'delivered'])
  }

  if (options?.alertType) {
    query = query.eq('alert_type', options.alertType)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error listing notifications:', error)
    return { notifications: [], total: 0 }
  }

  const notifications: Notification[] = data.map(item => ({
    id: item.id,
    alertId: item.alert_id || undefined,
    alertType: item.alert_type as AlertType,
    title: item.title,
    body: item.body,
    priority: item.priority as NotificationPriority,
    channel: item.channel as NotificationChannel,
    recipientUserId: item.recipient_user_id || undefined,
    recipientEmail: item.recipient_email || undefined,
    recipientPhone: item.recipient_phone || undefined,
    status: item.status as NotificationStatus,
    metadata: item.metadata || undefined,
    sentAt: item.sent_at || undefined,
    deliveredAt: item.delivered_at || undefined,
    readAt: item.read_at || undefined,
    clickedAt: item.clicked_at || undefined,
    errorMessage: item.error_message || undefined,
    actionUrl: item.action_url || undefined,
    imageUrl: item.image_url || undefined,
    createdAt: item.created_at,
  }))

  return { notifications, total: count || 0 }
}

/**
 * Gets unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_user_id', userId)
    .in('status', ['sent', 'delivered'])

  if (error) {
    console.error('Error counting unread notifications:', error)
    return 0
  }

  return count || 0
}

/**
 * Creates an emergency broadcast notification
 */
export async function sendEmergencyBroadcast(
  title: string,
  body: string,
  alertType: AlertType = 'emergency',
  urgency: NotificationPriority = 'critical'
): Promise<BulkNotificationResult> {
  const supabase = createClient()

  // Get all users who have opted in to emergency notifications
  const { data: users } = await supabase
    .from('users')
    .select('id, email, phone, notification_preferences')
    .eq('notification_preferences->emergency_alerts', true)

  if (!users || users.length === 0) {
    return {
      totalRecipients: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      pendingDeliveries: 0,
      channelBreakdown: {
        sms: { sent: 0, failed: 0 },
        email: { sent: 0, failed: 0 },
        push: { sent: 0, failed: 0 },
        in_app: { sent: 0, failed: 0 },
        whatsapp: { sent: 0, failed: 0 },
        telegram: { sent: 0, failed: 0 },
      },
      errors: [],
    }
  }

  const recipients = users.map(user => ({
    userId: user.id,
    email: user.email,
    phone: user.phone,
    channelPreferences: ['push', 'in_app'] as NotificationChannel[], // Default channels
  }))

  return sendNotification({
    alertType,
    title,
    body,
    priority: urgency,
    channels: ['push', 'in_app', 'sms', 'email'],
    recipients,
    metadata: {
      broadcast: true,
      timestamp: new Date().toISOString(),
    },
  })
}
