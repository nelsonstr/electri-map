import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Scheduled notification status
 */
export type ScheduledNotificationStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'cancelled'
  | 'expired'

/**
 * Notification type
 */
export type ScheduledNotificationType =
  | 'reminder'
  | 'weather_alert'
  | 'event_reminder'
  | 'maintenance_reminder'
  | 'check_in'
  | 'daily_digest'
  | 'weekly_digest'
  | 'custom'

/**
 * Repeat frequency
 */
export type RepeatFrequency =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom'

/**
 * Recurrence pattern for custom schedules
 */
export interface RecurrencePattern {
  frequency: RepeatFrequency
  interval?: number // Repeat every N periods
  daysOfWeek?: number[] // 0-6 (Sunday-Saturday)
  dayOfMonth?: number // 1-31
  monthOfYear?: number // 1-12
  endDate?: string // ISO datetime when recurrence ends
}

/**
 * Scheduled notification entry
 */
export interface ScheduledNotification {
  id: string
  userId: string
  
  // Content
  type: ScheduledNotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  
  // Targeting
  alertCategory?: string
  priority?: string
  
  // Scheduling
  scheduledFor: string
  expiresAt?: string
  timezone: string
  
  // Recurrence
  isRecurring: boolean
  recurrencePattern?: RecurrencePattern
  parentNotificationId?: string // For recurring child notifications
  
  // Status
  status: ScheduledNotificationStatus
  sentAt?: string
  failureReason?: string
  retryCount: number
  
  // Channels
  channels: string[]
  
  createdAt: string
  updatedAt: string
}

/**
 * Input for creating a scheduled notification
 */
export interface CreateScheduledNotificationInput {
  userId: string
  type: ScheduledNotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  scheduledFor: string
  expiresAt?: string
  timezone?: string
  isRecurring?: boolean
  recurrencePattern?: RecurrencePattern
  channels?: string[]
}

/**
 * User notification schedule preferences
 */
export interface NotificationSchedulePreferences {
  id: string
  userId: string
  
  // Quiet hours (global)
  quietHoursEnabled: boolean
  quietHoursStart: string // HH:mm
  quietHoursEnd: string // HH:mm
  quietHoursTimezone: string
  
  // DND mode
  dndEnabled: boolean
  dndEndTime?: string
  
  // Preferred notification times
  preferredTimes?: {
    label: string
    time: string // HH:mm
    daysOfWeek?: number[]
    enabled: boolean
  }[]
  
  // Digest preferences
  digestEnabled: boolean
  digestType: 'daily' | 'weekly' | 'none'
  digestTime: string // HH:mm
  digestDayOfWeek?: number // 0-6 for weekly
  
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for recurrence pattern
 */
export const recurrencePatternSchema = z.object({
  frequency: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']),
  interval: z.number().positive().optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  monthOfYear: z.number().min(1).max(12).optional(),
  endDate: z.string().datetime().optional(),
})

/**
 * Schema for creating a scheduled notification
 */
export const createScheduledNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([
    'reminder',
    'weather_alert',
    'event_reminder',
    'maintenance_reminder',
    'check_in',
    'daily_digest',
    'weekly_digest',
    'custom',
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  data: z.record(z.unknown()).optional(),
  scheduledFor: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  timezone: z.string().default('Europe/Lisbon'),
  isRecurring: z.boolean().optional(),
  recurrencePattern: recurrencePatternSchema.optional(),
  channels: z.array(z.string()).optional(),
})

/**
 * Schema for schedule preferences
 */
export const schedulePreferencesSchema = z.object({
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  quietHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  quietHoursTimezone: z.string(),
  dndEnabled: z.boolean(),
  dndEndTime: z.string().optional(),
  preferredTimes: z.array(z.object({
    label: z.string(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    daysOfWeek: z.array(z.number()).optional(),
    enabled: z.boolean(),
  })).optional(),
  digestEnabled: z.boolean(),
  digestType: z.enum(['daily', 'weekly', 'none']),
  digestTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  digestDayOfWeek: z.number().min(0).max(6).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for notification type
 */
export function getNotificationTypeDisplayName(type: ScheduledNotificationType): string {
  const names: Record<ScheduledNotificationType, string> = {
    reminder: 'Reminder',
    weather_alert: 'Weather Alert',
    event_reminder: 'Event Reminder',
    maintenance_reminder: 'Maintenance Reminder',
    check_in: 'Check-in Request',
    daily_digest: 'Daily Digest',
    weekly_digest: 'Weekly Digest',
    custom: 'Custom Notification',
  }
  return names[type]
}

/**
 * Gets display name for repeat frequency
 */
export function getRepeatFrequencyDisplayName(frequency: RepeatFrequency): string {
  const names: Record<RepeatFrequency, string> = {
    none: 'One-time',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    custom: 'Custom',
  }
  return names[frequency]
}

/**
 * Gets status color for scheduled notification
 */
export function getScheduledNotificationStatusColor(status: ScheduledNotificationStatus): string {
  const colors: Record<ScheduledNotificationStatus, string> = {
    pending: 'bg-yellow-500',
    processing: 'bg-blue-500',
    sent: 'bg-green-500',
    failed: 'bg-red-500',
    cancelled: 'bg-gray-500',
    expired: 'bg-orange-500',
  }
  return colors[status]
}

/**
 * Checks if a time falls within quiet hours
 */
export function isWithinQuietHours(
  time: Date,
  startTime: string,
  endTime: string,
  timezone: string
): boolean {
  const currentTime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime
  } else {
    // Overnight (e.g., 22:00 - 07:00)
    return currentTime >= startTime || currentTime <= endTime
  }
}

/**
 * Calculates the next occurrence based on recurrence pattern
 */
export function calculateNextOccurrence(
  fromDate: Date,
  pattern: RecurrencePattern
): Date | null {
  const nextDate = new Date(fromDate)

  switch (pattern.frequency) {
    case 'daily': {
      const interval = pattern.interval || 1
      nextDate.setDate(nextDate.getDate() + interval)
      break
    }
    case 'weekly': {
      const interval = pattern.interval || 1
      const daysOfWeek = pattern.daysOfWeek || [0]
      let daysToAdd = 7 * interval
      for (const day of daysOfWeek) {
        const daysUntilNext = (day - nextDate.getDay() + 7) % 7
        if (daysUntilNext < daysToAdd) {
          daysToAdd = daysUntilNext
        }
      }
      nextDate.setDate(nextDate.getDate() + daysToAdd)
      break
    }
    case 'monthly': {
      const interval = pattern.interval || 1
      nextDate.setMonth(nextDate.getMonth() + interval)
      const dayOfMonth = pattern.dayOfMonth || nextDate.getDate()
      nextDate.setDate(Math.min(dayOfMonth, getDaysInMonth(nextDate)))
      break
    }
    case 'yearly': {
      const interval = pattern.interval || 1
      nextDate.setFullYear(nextDate.getFullYear() + interval)
      break
    }
    default:
      return null
  }

  // Check if beyond end date
  if (pattern.endDate && nextDate > new Date(pattern.endDate)) {
    return null
  }

  return nextDate
}

/**
 * Gets days in a month
 */
function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a scheduled notification
 */
export async function createScheduledNotification(
  input: CreateScheduledNotificationInput
): Promise<ScheduledNotification> {
  const validationResult = createScheduledNotificationSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid scheduled notification: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('scheduled_notifications')
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data || null,
      scheduled_for: input.scheduledFor,
      expires_at: input.expiresAt || null,
      timezone: input.timezone || 'Europe/Lisbon',
      is_recurring: input.isRecurring || false,
      recurrence_pattern: input.recurrencePattern || null,
      channels: input.channels || ['push', 'in_app'],
      status: 'pending',
      retry_count: 0,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating scheduled notification:', error)
    throw new Error(`Failed to create scheduled notification: ${error.message}`)
  }

  return mapScheduledNotificationFromDB(data)
}

/**
 * Gets a scheduled notification by ID
 */
export async function getScheduledNotification(
  notificationId: string
): Promise<ScheduledNotification | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('id', notificationId)
    .single()

  if (error) {
    console.error('Error fetching scheduled notification:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapScheduledNotificationFromDB(data)
}

/**
 * Gets user's scheduled notifications
 */
export async function getUserScheduledNotifications(
  userId: string,
  options?: {
    status?: ScheduledNotificationStatus
    type?: ScheduledNotificationType
    limit?: number
    offset?: number
  }
): Promise<ScheduledNotification[]> {
  const supabase = createClient()

  let query = supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_for', { ascending: true })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching user scheduled notifications:', error)
    return []
  }

  return (data || []).map(mapScheduledNotificationFromDB)
}

/**
 * Cancels a scheduled notification
 */
export async function cancelScheduledNotification(
  notificationId: string
): Promise<ScheduledNotification> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('scheduled_notifications')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('status', 'pending')
    .select('*')
    .single()

  if (error) {
    console.error('Error cancelling scheduled notification:', error)
    throw new Error(`Failed to cancel scheduled notification: ${error.message}`)
  }

  // Also cancel any child recurring notifications
  await supabase
    .from('scheduled_notifications')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('parent_notification_id', notificationId)
    .eq('status', 'pending')

  return mapScheduledNotificationFromDB(data)
}

/**
 * Updates a scheduled notification
 */
export async function updateScheduledNotification(
  notificationId: string,
  updates: Partial<CreateScheduledNotificationInput>
): Promise<ScheduledNotification> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.title) updateData.title = updates.title
  if (updates.message) updateData.message = updates.message
  if (updates.scheduledFor) updateData.scheduled_for = updates.scheduledFor
  if (updates.expiresAt) updateData.expires_at = updates.expiresAt
  if (updates.timezone) updateData.timezone = updates.timezone
  if (updates.channels) updateData.channels = updates.channels
  if (updates.recurrencePattern) updateData.recurrence_pattern = updates.recurrencePattern

  const { data, error } = await supabase
    .from('scheduled_notifications')
    .update(updateData)
    .eq('id', notificationId)
    .eq('status', 'pending')
    .select('*')
    .single()

  if (error) {
    console.error('Error updating scheduled notification:', error)
    throw new Error(`Failed to update scheduled notification: ${error.message}`)
  }

  return mapScheduledNotificationFromDB(data)
}

/**
 * Marks a notification as sent
 */
export async function markNotificationSent(
  notificationId: string
): Promise<void> {
  const supabase = createClient()

  const notification = await getScheduledNotification(notificationId)
  if (!notification) {
    throw new Error('Notification not found')
  }

  // Update current notification
  await supabase
    .from('scheduled_notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)

  // Create next occurrence if recurring
  if (notification.isRecurring && notification.recurrencePattern) {
    const nextOccurrence = calculateNextOccurrence(
      new Date(notification.scheduledFor),
      notification.recurrencePattern
    )

    if (nextOccurrence) {
      await createScheduledNotification({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        scheduledFor: nextOccurrence.toISOString(),
        timezone: notification.timezone,
        isRecurring: true,
        recurrencePattern: notification.recurrencePattern,
        channels: notification.channels,
      })
    }
  }
}

/**
 * Marks a notification as failed
 */
export async function markNotificationFailed(
  notificationId: string,
  reason: string
): Promise<void> {
  const supabase = createClient()

  // Get current retry count
  const notification = await getScheduledNotification(notificationId)
  if (!notification) {
    throw new Error('Notification not found')
  }

  const maxRetries = 3
  const newStatus = notification.retryCount >= maxRetries ? 'failed' : 'pending'

  await supabase
    .from('scheduled_notifications')
    .update({
      status: newStatus,
      failure_reason: reason,
      retry_count: notification.retryCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
}

/**
 * Gets pending notifications ready to be sent
 */
export async function getPendingNotifications(
  limit: number = 100
): Promise<ScheduledNotification[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .is('expires_at', null)
    .order('scheduled_for', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching pending notifications:', error)
    return []
  }

  return (data || []).map(mapScheduledNotificationFromDB)
}

/**
 * Creates a reminder notification
 */
export async function createReminder(
  userId: string,
  title: string,
  message: string,
  scheduledFor: string,
  options?: {
    data?: Record<string, unknown>
    channels?: string[]
  }
): Promise<ScheduledNotification> {
  return createScheduledNotification({
    userId,
    type: 'reminder',
    title,
    message,
    scheduledFor,
    data: options?.data,
    channels: options?.channels,
  })
}

/**
 * Creates a check-in request notification
 */
export async function createCheckInRequest(
  userId: string,
  scheduledFor: string
): Promise<ScheduledNotification> {
  return createScheduledNotification({
    userId,
    type: 'check_in',
    title: 'Check-in Request',
    message: 'Please confirm you are safe by tapping this notification.',
    scheduledFor,
    channels: ['push', 'in_app'],
  })
}

/**
 * Creates daily digest notification
 */
export async function createDailyDigest(
  userId: string,
  scheduledTime: string = '08:00'
): Promise<ScheduledNotification> {
  const now = new Date()
  const [hours, minutes] = scheduledTime.split(':')
  now.setHours(parseInt(hours), parseInt(minutes), 0, 0)

  if (now < new Date()) {
    now.setDate(now.getDate() + 1)
  }

  return createScheduledNotification({
    userId,
    type: 'daily_digest',
    title: 'Daily Digest',
    message: 'Here\'s your daily summary of alerts and updates.',
    scheduledFor: now.toISOString(),
    timezone: 'Europe/Lisbon',
    isRecurring: true,
    recurrencePattern: {
      frequency: 'daily',
    },
    channels: ['push', 'in_app'],
  })
}

/**
 * Creates weekly digest notification
 */
export async function createWeeklyDigest(
  userId: string,
  dayOfWeek: number = 1, // Monday
  scheduledTime: string = '09:00'
): Promise<ScheduledNotification> {
  const now = new Date()
  const [hours, minutes] = scheduledTime.split(':')
  now.setHours(parseInt(hours), parseInt(minutes), 0, 0)

  // Calculate days until target day
  const currentDay = now.getDay()
  const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7
  now.setDate(now.getDate() + daysUntil)

  return createScheduledNotification({
    userId,
    type: 'weekly_digest',
    title: 'Weekly Digest',
    message: 'Here\'s your weekly summary of alerts and community updates.',
    scheduledFor: now.toISOString(),
    timezone: 'Europe/Lisbon',
    isRecurring: true,
    recurrencePattern: {
      frequency: 'weekly',
      daysOfWeek: [dayOfWeek],
    },
    channels: ['push', 'in_app', 'email'],
  })
}

// ============================================================================
// Schedule Preferences Functions
// ============================================================================

/**
 * Gets user's schedule preferences
 */
export async function getSchedulePreferences(
  userId: string
): Promise<NotificationSchedulePreferences | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notification_schedule_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching schedule preferences:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    quietHoursEnabled: data.quiet_hours_enabled,
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
    quietHoursTimezone: data.quiet_hours_timezone,
    dndEnabled: data.dnd_enabled,
    dndEndTime: data.dnd_end_time || undefined,
    preferredTimes: data.preferred_times || undefined,
    digestEnabled: data.digest_enabled,
    digestType: data.digest_type,
    digestTime: data.digest_time,
    digestDayOfWeek: data.digest_day_of_week || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Updates user's schedule preferences
 */
export async function updateSchedulePreferences(
  userId: string,
  updates: Partial<NotificationSchedulePreferences>
): Promise<NotificationSchedulePreferences> {
  const supabase = createClient()

  const currentPrefs = await getSchedulePreferences(userId)
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.quietHoursEnabled !== undefined) {
    updateData.quiet_hours_enabled = updates.quietHoursEnabled
  }
  if (updates.quietHoursStart) {
    updateData.quiet_hours_start = updates.quietHoursStart
  }
  if (updates.quietHoursEnd) {
    updateData.quiet_hours_end = updates.quietHoursEnd
  }
  if (updates.quietHoursTimezone) {
    updateData.quiet_hours_timezone = updates.quietHoursTimezone
  }
  if (updates.dndEnabled !== undefined) {
    updateData.dnd_enabled = updates.dndEnabled
  }
  if (updates.dndEndTime) {
    updateData.dnd_end_time = updates.dndEndTime
  }
  if (updates.preferredTimes) {
    updateData.preferred_times = updates.preferredTimes
  }
  if (updates.digestEnabled !== undefined) {
    updateData.digest_enabled = updates.digestEnabled
  }
  if (updates.digestType) {
    updateData.digest_type = updates.digestType
  }
  if (updates.digestTime) {
    updateData.digest_time = updates.digestTime
  }
  if (updates.digestDayOfWeek !== undefined) {
    updateData.digest_day_of_week = updates.digestDayOfWeek
  }

  const { data, error } = await supabase
    .from('notification_schedule_preferences')
    .upsert({
      user_id: userId,
      ...updateData,
    }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating schedule preferences:', error)
    throw new Error(`Failed to update schedule preferences: ${error.message}`)
  }

  return {
    id: data.id,
    userId: data.user_id,
    quietHoursEnabled: data.quiet_hours_enabled,
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
    quietHoursTimezone: data.quiet_hours_timezone,
    dndEnabled: data.dnd_enabled,
    dndEndTime: data.dnd_end_time || undefined,
    preferredTimes: data.preferred_times || undefined,
    digestEnabled: data.digest_enabled,
    digestType: data.digest_type,
    digestTime: data.digest_time,
    digestDayOfWeek: data.digest_day_of_week || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Enables DND mode for a user
 */
export async function enableDND(
  userId: string,
  durationMinutes?: number
): Promise<void> {
  const endTime = durationMinutes
    ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
    : undefined

  await updateSchedulePreferences(userId, {
    dndEnabled: true,
    dndEndTime: endTime,
  })
}

/**
 * Disables DND mode for a user
 */
export async function disableDND(userId: string): Promise<void> {
  await updateSchedulePreferences(userId, {
    dndEnabled: false,
    dndEndTime: undefined,
  })
}

/**
 * Checks if user should receive notifications now
 */
export async function shouldReceiveNotificationNow(userId: string): Promise<{
  canReceive: boolean
  reason?: string
}> {
  const prefs = await getSchedulePreferences(userId)

  // If no preferences, allow notifications
  if (!prefs) {
    return { canReceive: true }
  }

  // Check DND
  if (prefs.dndEnabled) {
    if (prefs.dndEndTime) {
      const dndEnd = new Date(prefs.dndEndTime)
      if (dndEnd < new Date()) {
        // DND has expired, automatically disable
        await disableDND(userId)
        return { canReceive: true }
      }
    }
    return { canReceive: false, reason: 'Do Not Disturb is enabled' }
  }

  // Check quiet hours
  if (prefs.quietHoursEnabled) {
    const now = new Date()
    if (isWithinQuietHours(now, prefs.quietHoursStart, prefs.quietHoursEnd, prefs.quietHoursTimezone)) {
      return { canReceive: false, reason: 'Within quiet hours' }
    }
  }

  return { canReceive: true }
}

/**
 * Gets notification statistics for a user
 */
export async function getNotificationStats(
  userId: string
): Promise<{
  totalScheduled: number
  pending: number
  sent: number
  failed: number
  cancelled: number
}> {
  const supabase = createClient()

  const { data } = await supabase
    .from('scheduled_notifications')
    .select('status')
    .eq('user_id', userId)

  const stats = {
    totalScheduled: 0,
    pending: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
  }

  for (const item of data || []) {
    stats.totalScheduled++
    switch (item.status) {
      case 'pending':
        stats.pending++
        break
      case 'sent':
        stats.sent++
        break
      case 'failed':
        stats.failed++
        break
      case 'cancelled':
        stats.cancelled++
        break
    }
  }

  return stats
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to ScheduledNotification
 */
function mapScheduledNotificationFromDB(data: Record<string, unknown>): ScheduledNotification {
  return {
    id: data.id,
    userId: data.user_id,
    type: data.type as ScheduledNotificationType,
    title: data.title,
    message: data.message,
    data: data.data as Record<string, unknown> | undefined,
    scheduledFor: data.scheduled_for,
    expiresAt: data.expires_at as string | undefined,
    timezone: data.timezone,
    isRecurring: data.is_recurring,
    recurrencePattern: data.recurrence_pattern as RecurrencePattern | undefined,
    parentNotificationId: data.parent_notification_id as string | undefined,
    status: data.status as ScheduledNotificationStatus,
    sentAt: data.sent_at as string | undefined,
    failureReason: data.failure_reason as string | undefined,
    retryCount: data.retry_count,
    channels: data.channels as string[],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
