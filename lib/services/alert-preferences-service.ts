import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Alert category types
 */
export type AlertCategory =
  | 'emergency'
  | 'weather'
  | 'fire'
  | 'flood'
  | 'power_outage'
  | 'medical'
  | 'security'
  | 'traffic'
  | 'infrastructure'
  | 'community'
  | 'informational'

/**
 * Notification channel types
 */
export type NotificationChannel =
  | 'push'
  | 'sms'
  | 'email'
  | 'whatsapp'
  | 'telegram'
  | 'in_app'

/**
 * Alert priority level
 */
export type AlertPriority = 'critical' | 'high' | 'normal' | 'low'

/**
 * Quiet hours settings
 */
export interface QuietHours {
  enabled: boolean
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  timezone: string
  excludeCritical: boolean
}

/**
 * Alert frequency settings
 */
export type AlertFrequency = 'realtime' | 'hourly' | 'daily' | 'digest'

/**
 * Geographic preference
 */
export interface GeographicPreference {
  homeRadius: number // meters
  workRadius: number // meters
  notifyOnTravel: boolean
  travelRadius: number // meters
}

/**
 * User's alert preferences
 */
export interface AlertPreferences {
  id: string
  userId: string
  enabled: boolean
  globalFrequency: AlertFrequency
  
  // Channel preferences (enabled/disabled for each channel)
  channels: Record<NotificationChannel, boolean>
  
  // Category-specific preferences
  categories: Record<AlertCategory, {
    enabled: boolean
    priorityThreshold: AlertPriority
    channels: Record<NotificationChannel, boolean>
  }>
  
  // Quiet hours
  quietHours: QuietHours
  
  // Geographic preferences
  geographic: GeographicPreference
  
  // Do not disturb for specific periods
  dndSchedule?: {
    enabled: boolean
    startDate: string
    endDate: string
    reason?: string
  }
  
  // Alert digest preferences
  digestSettings?: {
    enabled: boolean
    time: string // HH:mm
    daysOfWeek: number[] // 0-6 (Sunday-Saturday)
    categories: AlertCategory[]
  }
  
  createdAt: string
  updatedAt: string
}

/**
 * Category preference input
 */
export interface CategoryPreferenceInput {
  enabled: boolean
  priorityThreshold: AlertPriority
  channels: Record<NotificationChannel, boolean>
}

/**
 * Alert preference template
 */
export interface AlertPreferenceTemplate {
  id: string
  name: string
  description: string
  isDefault: boolean
  isSystem: boolean
  preferences: Omit<AlertPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for quiet hours
 */
export const quietHoursSchema = z.object({
  enabled: z.boolean(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  timezone: z.string(),
  excludeCritical: z.boolean(),
})

/**
 * Schema for geographic preference
 */
export const geographicPreferenceSchema = z.object({
  homeRadius: z.number().positive().max(50000),
  workRadius: z.number().positive().max(50000),
  notifyOnTravel: z.boolean(),
  travelRadius: z.number().positive().max(100000),
})

/**
 * Schema for alert preferences input
 */
export const alertPreferencesInputSchema = z.object({
  enabled: z.boolean(),
  globalFrequency: z.enum(['realtime', 'hourly', 'daily', 'digest']),
  channels: z.record(
    z.enum(['push', 'sms', 'email', 'whatsapp', 'telegram', 'in_app']),
    z.boolean()
  ),
  quietHours: quietHoursSchema,
  geographic: geographicPreferenceSchema,
})

/**
 * Schema for category preference
 */
export const categoryPreferenceSchema = z.object({
  enabled: z.boolean(),
  priorityThreshold: z.enum(['critical', 'high', 'normal', 'low']),
  channels: z.record(
    z.enum(['push', 'sms', 'email', 'whatsapp', 'telegram', 'in_app']),
    z.boolean()
  ),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets default alert preferences for new users
 */
export function getDefaultAlertPreferences(): Omit<AlertPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  return {
    enabled: true,
    globalFrequency: 'realtime',
    channels: {
      push: true,
      sms: true,
      email: true,
      whatsapp: false,
      telegram: false,
      in_app: true,
    },
    categories: {
      emergency: {
        enabled: true,
        priorityThreshold: 'low',
        channels: {
          push: true,
          sms: true,
          email: true,
          whatsapp: true,
          telegram: true,
          in_app: true,
        },
      },
      weather: {
        enabled: true,
        priorityThreshold: 'high',
        channels: {
          push: true,
          sms: false,
          email: true,
          whatsapp: false,
          telegram: false,
          in_app: true,
        },
      },
      fire: {
        enabled: true,
        priorityThreshold: 'normal',
        channels: {
          push: true,
          sms: true,
          email: true,
          whatsapp: false,
          telegram: false,
          in_app: true,
        },
      },
      flood: {
        enabled: true,
        priorityThreshold: 'normal',
        channels: {
          push: true,
          sms: true,
          email: true,
          whatsapp: false,
          telegram: false,
          in_app: true,
        },
      },
      power_outage: {
        enabled: true,
        priorityThreshold: 'high',
        channels: {
          push: true,
          sms: true,
          email: true,
          whatsapp: false,
          telegram: false,
          in_app: true,
        },
      },
      medical: {
        enabled: true,
        priorityThreshold: 'low',
        channels: {
          push: true,
          sms: true,
          email: true,
          whatsapp: true,
          telegram: true,
          in_app: true,
        },
      },
      security: {
        enabled: true,
        priorityThreshold: 'normal',
        channels: {
          push: true,
          sms: false,
          email: true,
          whatsapp: false,
          telegram: false,
          in_app: true,
        },
      },
      traffic: {
        enabled: false,
        priorityThreshold: 'high',
        channels: {
          push: false,
          sms: false,
          email: false,
          whatsapp: false,
          telegram: false,
          in_app: true,
        },
      },
      infrastructure: {
        enabled: true,
        priorityThreshold: 'high',
        channels: {
          push: true,
          sms: false,
          email: true,
          whatsapp: false,
          telegram: false,
          in_app: true,
        },
      },
      community: {
        enabled: true,
        priorityThreshold: 'normal',
        channels: {
          push: true,
          sms: false,
          email: true,
          whatsapp: false,
          telegram: false,
          in_app: true,
        },
      },
      informational: {
        enabled: false,
        priorityThreshold: 'low',
        channels: {
          push: false,
          sms: false,
          email: false,
          whatsapp: false,
          telegram: false,
          in_app: true,
        },
      },
    },
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '07:00',
      timezone: 'Europe/Lisbon',
      excludeCritical: true,
    },
    geographic: {
      homeRadius: 5000,
      workRadius: 5000,
      notifyOnTravel: true,
      travelRadius: 25000,
    },
  }
}

/**
 * Gets display name for alert category
 */
export function getAlertCategoryDisplayName(category: AlertCategory): string {
  const names: Record<AlertCategory, string> = {
    emergency: 'Emergency',
    weather: 'Weather',
    fire: 'Fire',
    flood: 'Flood',
    power_outage: 'Power Outage',
    medical: 'Medical',
    security: 'Security',
    traffic: 'Traffic',
    infrastructure: 'Infrastructure',
    community: 'Community',
    informational: 'Informational',
  }
  return names[category]
}

/**
 * Gets display name for notification channel
 */
export function getNotificationChannelDisplayName(channel: NotificationChannel): string {
  const names: Record<NotificationChannel, string> = {
    push: 'Push Notifications',
    sms: 'SMS',
    email: 'Email',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    in_app: 'In-App',
  }
  return names[channel]
}

/**
 * Gets display name for alert priority
 */
export function getAlertPriorityDisplayName(priority: AlertPriority): string {
  const names: Record<AlertPriority, string> = {
    critical: 'Critical',
    high: 'High',
    normal: 'Normal',
    low: 'Low',
  }
  return names[priority]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Gets user's alert preferences
 */
export async function getAlertPreferences(userId: string): Promise<AlertPreferences | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('alert_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching alert preferences:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapPreferencesFromDB(data)
}

/**
 * Creates or updates user's alert preferences
 */
export async function updateAlertPreferences(
  userId: string,
  updates: Partial<AlertPreferences>
): Promise<AlertPreferences> {
  const supabase = createClient()

  const currentPrefs = await getAlertPreferences(userId)
  const defaults = getDefaultAlertPreferences()

  const mergedPrefs = {
    enabled: updates.enabled ?? currentPrefs?.enabled ?? defaults.enabled,
    globalFrequency: updates.globalFrequency ?? currentPrefs?.globalFrequency ?? defaults.globalFrequency,
    channels: updates.channels ?? currentPrefs?.channels ?? defaults.channels,
    categories: updates.categories ?? currentPrefs?.categories ?? defaults.categories,
    quietHours: updates.quietHours ?? currentPrefs?.quietHours ?? defaults.quietHours,
    geographic: updates.geographic ?? currentPrefs?.geographic ?? defaults.geographic,
    dndSchedule: updates.dndSchedule ?? currentPrefs?.dndSchedule,
    digestSettings: updates.digestSettings ?? currentPrefs?.digestSettings,
  }

  const { data, error } = await supabase
    .from('alert_preferences')
    .upsert({
      user_id: userId,
      enabled: mergedPrefs.enabled,
      global_frequency: mergedPrefs.globalFrequency,
      channels: mergedPrefs.channels as unknown as Record<string, unknown>,
      categories: mergedPrefs.categories as unknown as Record<string, unknown>,
      quiet_hours: mergedPrefs.quietHours as unknown as Record<string, unknown>,
      geographic: mergedPrefs.geographic as unknown as Record<string, unknown>,
      dnd_schedule: mergedPrefs.dndSchedule || null,
      digest_settings: mergedPrefs.digestSettings || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating alert preferences:', error)
    throw new Error(`Failed to update alert preferences: ${error.message}`)
  }

  return mapPreferencesFromDB(data)
}

/**
 * Resets user's alert preferences to defaults
 */
export async function resetAlertPreferences(userId: string): Promise<AlertPreferences> {
  const supabase = createClient()

  const defaults = getDefaultAlertPreferences()

  const { data, error } = await supabase
    .from('alert_preferences')
    .upsert({
      user_id: userId,
      enabled: defaults.enabled,
      global_frequency: defaults.globalFrequency,
      channels: defaults.channels as unknown as Record<string, unknown>,
      categories: defaults.categories as unknown as Record<string, unknown>,
      quiet_hours: defaults.quietHours as unknown as Record<string, unknown>,
      geographic: defaults.geographic as unknown as Record<string, unknown>,
      dnd_schedule: null,
      digest_settings: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    console.error('Error resetting alert preferences:', error)
    throw new Error(`Failed to reset alert preferences: ${error.message}`)
  }

  return mapPreferencesFromDB(data)
}

/**
 * Updates preferences for a specific category
 */
export async function updateCategoryPreference(
  userId: string,
  category: AlertCategory,
  preference: CategoryPreferenceInput
): Promise<AlertPreferences> {
  const validationResult = categoryPreferenceSchema.safeParse(preference)
  if (!validationResult.success) {
    throw new Error(`Invalid category preference: ${validationResult.error.message}`)
  }

  const currentPrefs = await getAlertPreferences(userId)
  if (!currentPrefs) {
    throw new Error('Alert preferences not found')
  }

  currentPrefs.categories[category] = {
    enabled: preference.enabled,
    priorityThreshold: preference.priorityThreshold,
    channels: preference.channels,
  }

  return updateAlertPreferences(userId, { categories: currentPrefs.categories })
}

/**
 * Updates channel preferences
 */
export async function updateChannelPreferences(
  userId: string,
  channels: Record<NotificationChannel, boolean>
): Promise<AlertPreferences> {
  return updateAlertPreferences(userId, { channels })
}

/**
 * Updates quiet hours settings
 */
export async function updateQuietHours(
  userId: string,
  quietHours: QuietHours
): Promise<AlertPreferences> {
  const validationResult = quietHoursSchema.safeParse(quietHours)
  if (!validationResult.success) {
    throw new Error(`Invalid quiet hours: ${validationResult.error.message}`)
  }

  return updateAlertPreferences(userId, { quietHours })
}

/**
 * Temporarily enables DND mode
 */
export async function enableDNDMode(
  userId: string,
  endDate: string,
  reason?: string
): Promise<AlertPreferences> {
  return updateAlertPreferences(userId, {
    dndSchedule: {
      enabled: true,
      startDate: new Date().toISOString(),
      endDate,
      reason,
    },
  })
}

/**
 * Disables DND mode
 */
export async function disableDNDMode(userId: string): Promise<AlertPreferences> {
  return updateAlertPreferences(userId, {
    dndSchedule: undefined,
  })
}

/**
 * Checks if user should receive alerts at current time
 */
export async function shouldReceiveAlert(
  userId: string,
  alertPriority: AlertPriority
): Promise<boolean> {
  const prefs = await getAlertPreferences(userId)
  if (!prefs || !prefs.enabled) {
    return false
  }

  // Check if DND is active
  if (prefs.dndSchedule?.enabled) {
    const now = new Date()
    const endDate = new Date(prefs.dndSchedule.endDate)
    if (now < endDate) {
      // Check if critical alerts are excluded
      if (prefs.quietHours.excludeCritical && alertPriority === 'critical') {
        return true
      }
      return false
    }
  }

  // Check quiet hours
  if (prefs.quietHours.enabled) {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const { startTime, endTime, excludeCritical } = prefs.quietHours
    
    if (excludeCritical && alertPriority === 'critical') {
      return true
    }

    if (startTime <= endTime) {
      // Same day (e.g., 22:00 - 07:00 doesn't work with this logic)
      if (currentTime >= startTime && currentTime <= endTime) {
        return false
      }
    } else {
      // Overnight (e.g., 22:00 - 07:00)
      if (currentTime >= startTime || currentTime <= endTime) {
        return false
      }
    }
  }

  return true
}

/**
 * Gets enabled channels for an alert
 */
export async function getEnabledChannelsForAlert(
  userId: string,
  category: AlertCategory,
  priority: AlertPriority
): Promise<NotificationChannel[]> {
  const prefs = await getAlertPreferences(userId)
  if (!prefs) {
    return ['push', 'in_app'] // Default channels
  }

  const categoryPrefs = prefs.categories[category]
  const enabledChannels: NotificationChannel[] = []

  // Check if category is enabled
  if (!categoryPrefs.enabled) {
    return []
  }

  // Check priority threshold
  const priorityOrder: AlertPriority[] = ['low', 'normal', 'high', 'critical']
  const alertPriorityIndex = priorityOrder.indexOf(priority)
  const thresholdIndex = priorityOrder.indexOf(categoryPrefs.priorityThreshold)

  if (alertPriorityIndex < thresholdIndex) {
    return []
  }

  // Get enabled channels
  for (const [channel, enabled] of Object.entries(prefs.channels) as [NotificationChannel, boolean][]) {
    if (enabled && categoryPrefs.channels[channel]) {
      enabledChannels.push(channel)
    }
  }

  return enabledChannels
}

/**
 * Checks if user is subscribed to a category
 */
export async function isSubscribedToCategory(
  userId: string,
  category: AlertCategory
): Promise<boolean> {
  const prefs = await getAlertPreferences(userId)
  if (!prefs) {
    return true // Default to subscribed
  }

  return prefs.categories[category]?.enabled ?? true
}

/**
 * Gets preference templates
 */
export async function getPreferenceTemplates(): Promise<AlertPreferenceTemplate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('preference_templates')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching preference templates:', error)
    return []
  }

  // If no templates in DB, return system defaults
  if (!data || data.length === 0) {
    return getSystemTemplates()
  }

  return data.map(mapTemplateFromDB)
}

/**
 * Applies a preference template to a user
 */
export async function applyPreferenceTemplate(
  userId: string,
  templateId: string
): Promise<AlertPreferences> {
  const templates = await getPreferenceTemplates()
  const template = templates.find(t => t.id === templateId)

  if (!template) {
    throw new Error('Template not found')
  }

  return updateAlertPreferences(userId, {
    enabled: template.preferences.enabled,
    globalFrequency: template.preferences.globalFrequency,
    channels: template.preferences.channels,
    categories: template.preferences.categories,
    quietHours: template.preferences.quietHours,
    geographic: template.preferences.geographic,
    digestSettings: template.preferences.digestSettings,
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to AlertPreferences
 */
function mapPreferencesFromDB(data: Record<string, unknown>): AlertPreferences {
  return {
    id: data.id,
    userId: data.user_id,
    enabled: data.enabled,
    globalFrequency: data.global_frequency as AlertFrequency,
    channels: data.channels as Record<NotificationChannel, boolean>,
    categories: data.categories as Record<AlertCategory, {
      enabled: boolean
      priorityThreshold: AlertPriority
      channels: Record<NotificationChannel, boolean>
    }>,
    quietHours: data.quiet_hours as QuietHours,
    geographic: data.geographic as GeographicPreference,
    dndSchedule: data.dnd_schedule as AlertPreferences['dndSchedule'],
    digestSettings: data.digest_settings as AlertPreferences['digestSettings'],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Maps database record to template
 */
function mapTemplateFromDB(data: Record<string, unknown>): AlertPreferenceTemplate {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    isDefault: data.is_default,
    isSystem: data.is_system,
    preferences: {
      enabled: data.preferences.enabled,
      globalFrequency: data.preferences.global_frequency,
      channels: data.preferences.channels,
      categories: data.preferences.categories,
      quietHours: data.preferences.quiet_hours,
      geographic: data.preferences.geographic,
      digestSettings: data.preferences.digest_settings,
    },
  }
}

/**
 * Gets system default templates
 */
function getSystemTemplates(): AlertPreferenceTemplate[] {
  return [
    {
      id: 'template-minimal',
      name: 'Minimal',
      description: 'Only critical emergency alerts',
      isDefault: false,
      isSystem: true,
      preferences: {
        enabled: true,
        globalFrequency: 'realtime',
        channels: { push: true, sms: true, email: false, whatsapp: false, telegram: false, in_app: true },
        categories: {
          emergency: { enabled: true, priorityThreshold: 'low', channels: { push: true, sms: true, email: false, whatsapp: false, telegram: false, in_app: true } },
          weather: { enabled: false, priorityThreshold: 'critical', channels: { push: false, sms: false, email: false, whatsapp: false, telegram: false, in_app: false } },
          fire: { enabled: true, priorityThreshold: 'high', channels: { push: true, sms: false, email: false, whatsapp: false, telegram: false, in_app: true } },
          flood: { enabled: true, priorityThreshold: 'high', channels: { push: true, sms: false, email: false, whatsapp: false, telegram: false, in_app: true } },
          power_outage: { enabled: false, priorityThreshold: 'critical', channels: { push: false, sms: false, email: false, whatsapp: false, telegram: false, in_app: false } },
          medical: { enabled: true, priorityThreshold: 'low', channels: { push: true, sms: true, email: false, whatsapp: false, telegram: false, in_app: true } },
          security: { enabled: false, priorityThreshold: 'critical', channels: { push: false, sms: false, email: false, whatsapp: false, telegram: false, in_app: false } },
          traffic: { enabled: false, priorityThreshold: 'critical', channels: { push: false, sms: false, email: false, whatsapp: false, telegram: false, in_app: false } },
          infrastructure: { enabled: false, priorityThreshold: 'critical', channels: { push: false, sms: false, email: false, whatsapp: false, telegram: false, in_app: false } },
          community: { enabled: false, priorityThreshold: 'critical', channels: { push: false, sms: false, email: false, whatsapp: false, telegram: false, in_app: false } },
          informational: { enabled: false, priorityThreshold: 'critical', channels: { push: false, sms: false, email: false, whatsapp: false, telegram: false, in_app: false } },
        },
        quietHours: { enabled: false, startTime: '22:00', endTime: '07:00', timezone: 'Europe/Lisbon', excludeCritical: true },
        geographic: { homeRadius: 5000, workRadius: 5000, notifyOnTravel: false, travelRadius: 25000 },
      },
    },
    {
      id: 'template-balanced',
      name: 'Balanced',
      description: 'Standard alert settings for most users',
      isDefault: true,
      isSystem: true,
      preferences: getDefaultAlertPreferences(),
    },
    {
      id: 'template-comprehensive',
      name: 'Comprehensive',
      description: 'All alerts enabled with maximum notification channels',
      isDefault: false,
      isSystem: true,
      preferences: {
        enabled: true,
        globalFrequency: 'realtime',
        channels: { push: true, sms: true, email: true, whatsapp: true, telegram: true, in_app: true },
        categories: {
          emergency: { enabled: true, priorityThreshold: 'low', channels: { push: true, sms: true, email: true, whatsapp: true, telegram: true, in_app: true } },
          weather: { enabled: true, priorityThreshold: 'low', channels: { push: true, sms: true, email: true, whatsapp: true, telegram: true, in_app: true } },
          fire: { enabled: true, priorityThreshold: 'low', channels: { push: true, sms: true, email: true, whatsapp: true, telegram: true, in_app: true } },
          flood: { enabled: true, priorityThreshold: 'low', channels: { push: true, sms: true, email: true, whatsapp: true, telegram: true, in_app: true } },
          power_outage: { enabled: true, priorityThreshold: 'low', channels: { push: true, sms: true, email: true, whatsapp: true, telegram: true, in_app: true } },
          medical: { enabled: true, priorityThreshold: 'low', channels: { push: true, sms: true, email: true, whatsapp: true, telegram: true, in_app: true } },
          security: { enabled: true, priorityThreshold: 'low', channels: { push: true, sms: true, email: true, whatsapp: true, telegram: true, in_app: true } },
          traffic: { enabled: true, priorityThreshold: 'high', channels: { push: true, sms: false, email: true, whatsapp: false, telegram: false, in_app: true } },
          infrastructure: { enabled: true, priorityThreshold: 'normal', channels: { push: true, sms: true, email: true, whatsapp: false, telegram: false, in_app: true } },
          community: { enabled: true, priorityThreshold: 'normal', channels: { push: true, sms: false, email: true, whatsapp: false, telegram: false, in_app: true } },
          informational: { enabled: true, priorityThreshold: 'normal', channels: { push: true, sms: false, email: true, whatsapp: false, telegram: false, in_app: true } },
        },
        quietHours: { enabled: true, startTime: '22:00', endTime: '07:00', timezone: 'Europe/Lisbon', excludeCritical: true },
        geographic: { homeRadius: 10000, workRadius: 10000, notifyOnTravel: true, travelRadius: 50000 },
      },
    },
  ]
}
