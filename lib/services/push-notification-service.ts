import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Push notification platform
 */
export type PushPlatform = 'web' | 'ios' | 'android'

/**
 * Push notification status
 */
export type PushStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked' | 'dismissed'

/**
 * Device information
 */
export interface DeviceInfo {
  id: string
  userId?: string
  
  // Platform
  platform: PushPlatform
  osVersion?: string
  appVersion?: string
  
  // Token
  pushToken: string
  
  // Capabilities
  capabilities: {
    notifications: boolean
    sound: boolean
    vibration: boolean
    badges: boolean
  }
  
  // Status
  isActive: boolean
  lastActiveAt?: string
  
  // Metadata
  model?: string
  manufacturer?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Push notification
 */
export interface PushNotification {
  id: string
  
  // Content
  title: string
  body: string
  subtitle?: string
  
  // Data
  data?: Record<string, string>
  
  // Actions
  actions?: Array<{
    id: string
    title: string
    icon?: string
    destructive?: boolean
    foreground?: boolean
  }>
  
  // Styling
  badge?: string | number
  icon?: string
  imageUrl?: string
  
  // Priority
  priority: 'normal' | 'high'
  
  // Timing
  scheduledAt?: string
  expiresAt?: string
  
  // Tracking
  status: PushStatus
  sentAt?: string
  deliveredAt?: string
  clickedAt?: string
  
  // Analytics
  sentCount: number
  deliveredCount: number
  clickedCount: number
  dismissedCount: number
  
  // Timestamps
  createdAt: string
}

/**
 * Notification preference
 */
export interface NotificationPreference {
  id: string
  userId: string
  
  // Categories
  categories: {
    emergency: boolean
    weather: boolean
    community: boolean
    restoration: boolean
    system: boolean
    marketing: boolean
  }
  
  // Quiet hours
  quietHours: {
    enabled: boolean
    start: string // HH:MM
    end: string // HH:MM
    timezone: string
  }
  
  // Delivery
  deliveryChannels: {
    push: boolean
    sms: boolean
    email: boolean
  }
  
  // Priority
  priorityThreshold: 'low' | 'medium' | 'high' | 'critical'
  
  // Batch
  batchDelivery: {
    enabled: boolean
    interval: number // minutes
    maxPerBatch: number
  }
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Push campaign
 */
export interface PushCampaign {
  id: string
  
  // Campaign info
  name: string
  description?: string
  
  // Content
  notifications: Array<{
    title: string
    body: string
    language: string
    data?: Record<string, string>
  }>
  
  // Targeting
  targeting: {
    userSegments?: string[]
    userIds?: string[]
    location?: {
      latitude: number
      longitude: number
      radius: number
    }
    includeInactive?: boolean
    excludeUserIds?: string[]
  }
  
  // Timing
  scheduledAt?: string
  expiresAt?: string
  timezone?: string
  
  // Status
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
  
  // Analytics
  targetCount: number
  sentCount: number
  deliveredCount: number
  clickedCount: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Notification history entry
 */
export interface NotificationHistory {
  id: string
  userId: string
  notificationId: string
  
  // Status
  status: PushStatus
  statusAt: string
  
  // Interaction
  clickedAt?: string
  dismissedAt?: string
  
  // Context
  deviceId?: string
  appState?: 'foreground' | 'background' | 'closed'
  
  createdAt: string
}

/**
 * Create device input
 */
export interface CreateDeviceInput {
  platform: PushPlatform
  pushToken: string
  osVersion?: string
  appVersion?: string
  model?: string
  manufacturer?: string
}

/**
 * Create notification input
 */
export interface CreateNotificationInput {
  title: string
  body: string
  subtitle?: string
  data?: Record<string, string>
  actions?: Array<{
    id: string
    title: string
    icon?: string
    destructive?: boolean
    foreground?: boolean
  }>
  badge?: string | number
  icon?: string
  imageUrl?: string
  priority?: 'normal' | 'high'
  scheduledAt?: string
  expiresAt?: string
}

/**
 * Create campaign input
 */
export interface CreateCampaignInput {
  name: string
  description?: string
  notifications: Array<{
    title: string
    body: string
    language: string
    data?: Record<string, string>
  }>
  targeting: {
    userSegments?: string[]
    userIds?: string[]
    location?: {
      latitude: number
      longitude: number
      radius: number
    }
    includeInactive?: boolean
    excludeUserIds?: string[]
  }
  scheduledAt?: string
  expiresAt?: string
  timezone?: string
}

/**
 * Update preferences input
 */
export interface UpdatePreferencesInput {
  categories?: Partial<NotificationPreference['categories']>
  quietHours?: Partial<NotificationPreference['quietHours']>
  deliveryChannels?: Partial<NotificationPreference['deliveryChannels']>
  priorityThreshold?: NotificationPreference['priorityThreshold']
  batchDelivery?: Partial<NotificationPreference['batchDelivery']>
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating device
 */
export const createDeviceSchema = z.object({
  platform: z.enum(['web', 'ios', 'android']),
  pushToken: z.string().min(1),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
})

/**
 * Schema for creating notification
 */
export const createNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  subtitle: z.string().max(100).optional(),
  data: z.record(z.string()).optional(),
  actions: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    icon: z.string().optional(),
    destructive: z.boolean().optional(),
    foreground: z.boolean().optional(),
  })).max(4).optional(),
  badge: z.union([z.string(), z.number()]).optional(),
  icon: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  priority: z.enum(['normal', 'high']).default('normal'),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
})

/**
 * Schema for updating preferences
 */
export const updatePreferencesSchema = z.object({
  categories: z.object({
    emergency: z.boolean().optional(),
    weather: z.boolean().optional(),
    community: z.boolean().optional(),
    restoration: z.boolean().optional(),
    system: z.boolean().optional(),
    marketing: z.boolean().optional(),
  }).optional(),
  quietHours: z.object({
    enabled: z.boolean().optional(),
    start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    timezone: z.string().optional(),
  }).optional(),
  deliveryChannels: z.object({
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    email: z.boolean().optional(),
  }).optional(),
  priorityThreshold: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  batchDelivery: z.object({
    enabled: z.boolean().optional(),
    interval: z.number().min(5).max(120).optional(),
    maxPerBatch: z.number().min(1).max(50).optional(),
  }).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for platform
 */
export function getPlatformDisplayName(platform: PushPlatform): string {
  const names: Record<PushPlatform, string> = {
    web: 'Web Browser',
    ios: 'iOS',
    android: 'Android',
  }
  return names[platform]
}

/**
 * Gets display name for push status
 */
export function getPushStatusDisplayName(status: PushStatus): string {
  const names: Record<PushStatus, string> = {
    pending: 'Pending',
    sent: 'Sent',
    delivered: 'Delivered',
    failed: 'Failed',
    clicked: 'Clicked',
    dismissed: 'Dismissed',
  }
  return names[status]
}

/**
 * Gets color for push status
 */
export function getPushStatusColor(status: PushStatus): string {
  const colors: Record<PushStatus, string> = {
    pending: 'bg-yellow-500',
    sent: 'bg-blue-500',
    delivered: 'bg-green-500',
    failed: 'bg-red-500',
    clicked: 'bg-purple-500',
    dismissed: 'bg-gray-500',
  }
  return colors[status]
}

/**
 * Checks if within quiet hours
 */
export function isWithinQuietHours(
  preferences: NotificationPreference['quietHours']
): boolean {
  if (!preferences || !preferences.enabled) {
    return false
  }

  const now = new Date()
  const timezone = preferences.timezone || 'UTC'
  
  // Simple check - would need more robust timezone handling in production
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = parseTimeString(preferences.start)
  const endMinutes = parseTimeString(preferences.end)

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  } else {
    // Overnight (e.g., 22:00 - 07:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes
  }
}

/**
 * Parses time string to minutes
 */
function parseTimeString(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Registers a device for push notifications
 */
export async function registerDevice(
  userId: string | undefined,
  input: CreateDeviceInput
): Promise<DeviceInfo> {
  const validationResult = createDeviceSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid device: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Generate device ID
  const deviceId = `${input.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Check if token already exists
  const { data: existing } = await supabase
    .from('push_devices')
    .select('*')
    .eq('push_token', input.pushToken)
    .maybeSingle()

  if (existing) {
    // Update existing device
    const { data, error } = await supabase
      .from('push_devices')
      .update({
        user_id: userId || null,
        platform: input.platform,
        os_version: input.osVersion || null,
        app_version: input.appVersion || null,
        model: input.model || null,
        manufacturer: input.manufacturer || null,
        is_active: true,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating device:', error)
      throw new Error(`Failed to update device: ${error.message}`)
    }

    return mapDeviceFromDB(data)
  }

  // Create new device
  const { data, error } = await supabase
    .from('push_devices')
    .insert({
      id: deviceId,
      user_id: userId || null,
      platform: input.platform,
      push_token: input.pushToken,
      os_version: input.osVersion || null,
      app_version: input.appVersion || null,
      model: input.model || null,
      manufacturer: input.manufacturer || null,
      is_active: true,
      last_active_at: new Date().toISOString(),
      capabilities: {
        notifications: true,
        sound: true,
        vibration: true,
        badges: true,
      },
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating device:', error)
    throw new Error(`Failed to create device: ${error.message}`)
  }

  return mapDeviceFromDB(data)
}

/**
 * Updates device information
 */
export async function updateDevice(
  deviceId: string,
  updates: Partial<{
    pushToken: string
    appVersion: string
    isActive: boolean
    capabilities: DeviceInfo['capabilities']
  }>
): Promise<DeviceInfo> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.pushToken) {
    updateData.push_token = updates.pushToken
  }

  if (updates.appVersion) {
    updateData.app_version = updates.appVersion
  }

  if (updates.isActive !== undefined) {
    updateData.is_active = updates.isActive
    if (updates.isActive) {
      updateData.last_active_at = new Date().toISOString()
    }
  }

  if (updates.capabilities) {
    updateData.capabilities = updates.capabilities
  }

  const { data, error } = await supabase
    .from('push_devices')
    .update(updateData)
    .eq('id', deviceId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating device:', error)
    throw new Error(`Failed to update device: ${error.message}`)
  }

  return mapDeviceFromDB(data)
}

/**
 * Unregisters a device
 */
export async function unregisterDevice(deviceId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('push_devices')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', deviceId)

  if (error) {
    console.error('Error unregistering device:', error)
    throw new Error(`Failed to unregister: ${error.message}`)
  }
}

/**
 * Gets user devices
 */
export async function getUserDevices(
  userId: string,
  activeOnly: boolean = true
): Promise<DeviceInfo[]> {
  const supabase = createClient()

  let query = supabase
    .from('push_devices')
    .select('*')
    .eq('user_id', userId)
    .order('last_active_at', { ascending: false })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching devices:', error)
    return []
  }

  return (data || []).map(mapDeviceFromDB)
}

/**
 * Gets user notification preferences
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreference | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching preferences:', error)
    return null
  }

  if (!data) {
    // Return default preferences
    return {
      id: '',
      userId,
      categories: {
        emergency: true,
        weather: true,
        community: true,
        restoration: true,
        system: true,
        marketing: false,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
        timezone: 'UTC',
      },
      deliveryChannels: {
        push: true,
        sms: false,
        email: false,
      },
      priorityThreshold: 'low',
      batchDelivery: {
        enabled: false,
        interval: 15,
        maxPerBatch: 5,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  return mapPreferencesFromDB(data)
}

/**
 * Updates notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  input: UpdatePreferencesInput
): Promise<NotificationPreference> {
  const validationResult = updatePreferencesSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid preferences: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Get existing preferences
  const existing = await getNotificationPreferences(userId)
  if (!existing) {
    throw new Error('Preferences not found')
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.categories) {
    updateData.categories = {
      ...existing.categories,
      ...input.categories,
    }
  }

  if (input.quietHours) {
    updateData.quiet_hours = {
      ...existing.quietHours,
      ...input.quietHours,
    }
  }

  if (input.deliveryChannels) {
    updateData.delivery_channels = {
      ...existing.deliveryChannels,
      ...input.deliveryChannels,
    }
  }

  if (input.priorityThreshold) {
    updateData.priority_threshold = input.priorityThreshold
  }

  if (input.batchDelivery) {
    updateData.batch_delivery = {
      ...existing.batchDelivery,
      ...input.batchDelivery,
    }
  }

  const { data, error } = await supabase
    .from('notification_preferences')
    .update(updateData)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating preferences:', error)
    throw new Error(`Failed to update preferences: ${error.message}`)
  }

  return mapPreferencesFromDB(data)
}

/**
 * Sends push notification to user
 */
export async function sendPushNotification(
  userId: string,
  input: CreateNotificationInput,
  options?: {
    deviceIds?: string[]
    priorityThreshold?: 'low' | 'medium' | 'high' | 'critical'
  }
): Promise<PushNotification> {
  const validationResult = createNotificationSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid notification: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Check preferences
  const preferences = await getNotificationPreferences(userId)
  if (preferences && !preferences.deliveryChannels.push) {
    throw new Error('Push notifications disabled for this user')
  }

  // Check quiet hours
  if (preferences && isWithinQuietHours(preferences.quietHours)) {
    throw new Error('Quiet hours active - notification queued')
  }

  // Get target devices
  const devices = options?.deviceIds
    ? await Promise.all(
        options.deviceIds.map(async id => {
          const { data } = await supabase
            .from('push_devices')
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .single()
          return data
        })
      )
    : await getUserDevices(userId)

  const activeDevices = devices.filter((d): d is NonNullable<typeof d> => d !== null)

  if (activeDevices.length === 0) {
    throw new Error('No active devices found')
  }

  // Create notification record
  const { data: notification, error: notifError } = await supabase
    .from('push_notifications')
    .insert({
      title: input.title,
      body: input.body,
      subtitle: input.subtitle || null,
      data: input.data || null,
      actions: input.actions || null,
      badge: input.badge?.toString() || null,
      icon: input.icon || null,
      image_url: input.imageUrl || null,
      priority: input.priority || 'normal',
      scheduled_at: input.scheduledAt || null,
      expires_at: input.expiresAt || null,
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_count: activeDevices.length,
    })
    .select('*')
    .single()

  if (notifError) {
    console.error('Error creating notification:', notifError)
    throw new Error(`Failed to create notification: ${notifError.message}`)
  }

  // Send to each device (in production, would use push service like Firebase)
  for (const device of activeDevices) {
    await supabase
      .from('notification_history')
      .insert({
        user_id: userId,
        notification_id: notification.id,
        device_id: device.id,
        status: 'sent',
        status_at: new Date().toISOString(),
      })
  }

  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    subtitle: notification.subtitle || undefined,
    data: notification.data || undefined,
    actions: notification.actions || undefined,
    badge: notification.badge || undefined,
    icon: notification.icon || undefined,
    imageUrl: notification.image_url || undefined,
    priority: notification.priority,
    scheduledAt: notification.scheduled_at || undefined,
    expiresAt: notification.expires_at || undefined,
    status: notification.status,
    sentAt: notification.sent_at || undefined,
    sentCount: notification.sent_count,
    deliveredCount: notification.delivered_count,
    clickedCount: notification.clicked_count,
    dismissedCount: notification.dismissed_count,
    createdAt: notification.created_at,
  }
}

/**
 * Creates push campaign
 */
export async function createPushCampaign(
  input: CreateCampaignInput
): Promise<PushCampaign> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('push_campaigns')
    .insert({
      name: input.name,
      description: input.description || null,
      notifications: input.notifications,
      targeting: input.targeting,
      scheduled_at: input.scheduledAt || null,
      expires_at: input.expiresAt || null,
      timezone: input.timezone || 'UTC',
      status: input.scheduledAt ? 'scheduled' : 'draft',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating campaign:', error)
    throw new Error(`Failed to create campaign: ${error.message}`)
  }

  return mapCampaignFromDB(data)
}

/**
 * Gets notification history for user
 */
export async function getNotificationHistory(
  userId: string,
  options?: {
    limit?: number
    status?: PushStatus[]
    since?: string
  }
): Promise<Array<NotificationHistory & { notification: PushNotification }>> {
  const supabase = createClient()

  let query = supabase
    .from('notification_history')
    .select(`
      *,
      push_notifications:push_notifications (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.status && options.status.length > 0) {
    query = query.in('status', options.status)
  }

  if (options?.since) {
    query = query.gte('created_at', options.since)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching history:', error)
    return []
  }

  return (data || []).map((item: Record<string, unknown>) => ({
    id: item.id,
    userId: item.user_id,
    notificationId: item.notification_id,
    status: item.status as PushStatus,
    statusAt: item.status_at,
    clickedAt: item.clicked_at || undefined,
    dismissedAt: item.dismissed_at || undefined,
    deviceId: item.device_id || undefined,
    appState: item.app_state as 'foreground' | 'background' | 'closed' | undefined,
    createdAt: item.created_at,
    notification: {
      id: (item.push_notifications as Record<string, unknown>)?.id,
      title: (item.push_notifications as Record<string, unknown>)?.title,
      body: (item.push_notifications as Record<string, unknown>)?.body,
      status: (item.push_notifications as Record<string, unknown>)?.status,
      createdAt: (item.push_notifications as Record<string, unknown>)?.created_at,
    } as PushNotification,
  }))
}

/**
 * Updates notification status (called by client)
 */
export async function updateNotificationStatus(
  userId: string,
  notificationId: string,
  status: 'clicked' | 'dismissed',
  deviceId: string,
  appState?: 'foreground' | 'background' | 'closed'
): Promise<void> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status,
    status_at: new Date().toISOString(),
  }

  if (status === 'clicked') {
    updateData.clicked_at = new Date().toISOString()
  } else if (status === 'dismissed') {
    updateData.dismissed_at = new Date().toISOString()
  }

  if (appState) {
    updateData.app_state = appState
  }

  await supabase
    .from('notification_history')
    .update(updateData)
    .eq('user_id', userId)
    .eq('notification_id', notificationId)
    .eq('device_id', deviceId)
})

/**
 * Gets unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('notification_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['pending', 'sent', 'delivered'])

  if (error) {
    console.error('Error counting notifications:', error)
    return 0
  }

  return count || 0
}

/**
 * Marks all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('notification_history')
    .update({
      status: 'clicked',
      status_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .in('status', ['pending', 'sent', 'delivered'])
}

/**
 * Gets push statistics
 */
export async function getPushStatistics(
  days: number = 30
): Promise<{
  totalSent: number
  deliveredRate: number
  clickRate: number
  topDevices: Array<{ platform: PushPlatform; count: number }>
  dailyStats: Array<{ date: string; sent: number; delivered: number; clicked: number }>
}> {
  const supabase = createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Total sent
  const { count: totalSent } = await supabase
    .from('push_notifications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())

  // Device breakdown
  const { data: devices } = await supabase
    .from('push_devices')
    .select('platform')
    .eq('is_active', true)

  const platformCounts: Record<PushPlatform, number> = {
    web: 0,
    ios: 0,
    android: 0,
  }

  for (const device of devices || []) {
    if (platformCounts[device.platform as PushPlatform] !== undefined) {
      platformCounts[device.platform as PushPlatform]++
    }
  }

  // Calculate rates from history
  const { data: history } = await supabase
    .from('notification_history')
    .select('status')
    .gte('created_at', startDate.toISOString())

  let delivered = 0
  let clicked = 0
  for (const item of history || []) {
    if (item.status === 'delivered' || item.status === 'clicked' || item.status === 'dismissed') {
      delivered++
    }
    if (item.status === 'clicked') {
      clicked++
    }
  }

  const deliveredRate = history?.length
    ? Math.round((delivered / history.length) * 100)
    : 0
  const clickRate = delivered
    ? Math.round((clicked / delivered) * 100)
    : 0

  return {
    totalSent: totalSent || 0,
    deliveredRate,
    clickRate,
    topDevices: Object.entries(platformCounts).map(([platform, count]) => ({
      platform: platform as PushPlatform,
      count,
    })),
    dailyStats: [], // Would need additional query for daily breakdown
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to DeviceInfo
 */
function mapDeviceFromDB(data: Record<string, unknown>): DeviceInfo {
  return {
    id: data.id,
    userId: data.user_id as string | undefined,
    platform: data.platform as PushPlatform,
    osVersion: data.os_version as string | undefined,
    appVersion: data.app_version as string | undefined,
    pushToken: data.push_token,
    capabilities: data.capabilities as DeviceInfo['capabilities'],
    isActive: data.is_active,
    lastActiveAt: data.last_active_at as string | undefined,
    model: data.model as string | undefined,
    manufacturer: data.manufacturer as string | undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Maps database record to NotificationPreference
 */
function mapPreferencesFromDB(data: Record<string, unknown>): NotificationPreference {
  return {
    id: data.id,
    userId: data.user_id,
    categories: data.categories as NotificationPreference['categories'],
    quietHours: data.quiet_hours as NotificationPreference['quietHours'],
    deliveryChannels: data.delivery_channels as NotificationPreference['deliveryChannels'],
    priorityThreshold: data.priority_threshold as NotificationPreference['priorityThreshold'],
    batchDelivery: data.batch_delivery as NotificationPreference['batchDelivery'],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Maps database record to PushCampaign
 */
function mapCampaignFromDB(data: Record<string, unknown>): PushCampaign {
  return {
    id: data.id,
    name: data.name,
    description: data.description as string | undefined,
    notifications: data.notifications as CreateNotificationInput['notifications'],
    targeting: data.targeting as CreateCampaignInput['targeting'],
    scheduledAt: data.scheduled_at as string | undefined,
    expiresAt: data.expires_at as string | undefined,
    timezone: data.timezone as string | undefined,
    status: data.status as PushCampaign['status'],
    targetCount: data.target_count || 0,
    sentCount: data.sent_count || 0,
    deliveredCount: data.delivered_count || 0,
    clickedCount: data.clicked_count || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
