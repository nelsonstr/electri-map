import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types - Accessibility
// ============================================================================

/**
 * Visual alert type
 */
export type VisualAlertType = 
  | 'flash'
  | 'strobe'
  | 'color_change'
  | 'icon_notification'
  | 'text_notification'
  | 'full_screen'
  | 'banner'
  | 'badge'
  | 'pulse'

/**
 * Audio alert type
 */
export type AudioAlertType = 
  | 'siren'
  | 'alarm'
  | 'voice'
  | 'tone'
  | 'chime'
  | 'bell'
  | 'custom'

/**
 * Haptic alert pattern
 */
export type HapticPattern = 
  | 'short'
  | 'long'
  | 'double'
  | 'triple'
  | ' SOS'
  | 'pattern'
  | 'custom'

/**
 * Alert priority
 */
export type AlertPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'emergency'

/**
 * Accessibility preference category
 */
export type AccessibilityCategory = 
  | 'visual'
  | 'audio'
  | 'haptic'
  | 'cognitive'
  | 'motor'
  | 'language'

/**
 * User accessibility profile
 */
export interface AccessibilityProfile {
  id: string
  userId: string
  name: string
  description?: string
  
  // Visual settings
  visualAlertsEnabled: boolean
  highContrastMode: boolean
  reducedMotion: boolean
  largeText: boolean
  customColors?: {
    background: string
    foreground: string
    alert: string
    warning: string
    info: string
  }
  flashAlertsEnabled: boolean
  
  // Audio settings
  audioAlertsEnabled: boolean
  audioType: AudioAlertType
  audioVolume: number // 0-100
  audioFrequency?: number // Hz for tone alerts
  audioDuration?: number // seconds
  screenReaderEnabled: boolean
  speechRate?: number // 0.5-2.0
  
  // Haptic settings
  hapticEnabled: boolean
  hapticPattern: HapticPattern
  hapticIntensity: number // 0-100
  hapticDuration?: number // milliseconds
  emergencyHapticPattern?: HapticPattern
  
  // Cognitive settings
  simplifiedMode: boolean
  extendedNotifications: boolean
  stepByStepDirections: boolean
  pictogramSupport: boolean
  
  // Language
  preferredLanguage: string
  multiLanguageAudioEnabled: boolean
  availableLanguages: string[]
  
  // Emergency contact
  emergencyContactEnabled: boolean
  emergencyContactNumber?: string
  
  // Created/Updated
  isDefault: boolean
  isActive: boolean
  
  createdAt: string
  updatedAt: string
}

/**
 * Visual alert configuration
 */
export interface VisualAlertConfig {
  id: string
  userId: string
  profileId?: string
  
  // Alert settings
  enabled: boolean
  alertTypes: VisualAlertType[]
  priority: AlertPriority
  
  // Visual settings
  duration: number // milliseconds
  flashRate?: number // per second
  color?: string
  size?: number // percentage of screen
  
  // Location
  displayLocation: 'fullscreen' | 'top' | 'bottom' | 'notification_bar'
  
  // Repeat
  repeatEnabled: boolean
  repeatInterval?: number // seconds
  repeatCount?: number
  
  createdAt: string
  updatedAt: string
}

/**
 * Audio alert configuration
 */
export interface AudioAlertConfig {
  id: string
  userId: string
  profileId?: string
  
  // Alert settings
  enabled: boolean
  alertTypes: AudioAlertType[]
  priority: AlertPriority
  
  // Audio settings
  volume: number // 0-100
  duration: number // milliseconds
  frequency?: number // Hz for tones
  customSoundUrl?: string
  
  // Voice settings
  voiceId?: string
  language: string
  speechRate: number // 0.5-2.0
  pitch?: number
  
  // Loop
  loopEnabled: boolean
  loopInterval?: number // seconds
  
  createdAt: string
  updatedAt: string
}

/**
 * Haptic alert configuration
 */
export interface HapticAlertConfig {
  id: string
  userId: string
  profileId?: string
  
  // Alert settings
  enabled: boolean
  priority: AlertPriority
  
  // Pattern settings
  pattern: HapticPattern
  customPattern?: number[]
  intensity: number // 0-100
  duration: number // milliseconds
  
  // Emergency override
  emergencyOverride: boolean
  emergencyPattern?: HapticPattern
  emergencyIntensity?: number
  
  createdAt: string
  updatedAt: string
}

/**
 * Multi-language audio configuration
 */
export interface MultiLanguageAudioConfig {
  id: string
  userId: string
  
  // Languages
  primaryLanguage: string
  secondaryLanguage?: string
  
  // Audio settings
  autoDetectLanguage: boolean
  translateAlerts: boolean
  
  // Voice settings
  voiceGender?: 'male' | 'female' | 'neutral'
  voiceAge?: 'child' | 'adult' | 'senior'
  
  // Emergency priority language
  emergencyLanguage?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Cognitive load configuration
 */
export interface CognitiveLoadConfig {
  id: string
  userId: string
  
  // Simplification
  simplifiedUI: boolean
  hideAdvancedOptions: boolean
  collapsedMenus: boolean
  
  // Content
  plainLanguage: boolean
  bulletPoints: boolean
  shortParagraphs: boolean
  
  // Notifications
  extendedNotifications: boolean
  notificationDelay?: number // seconds
  groupedNotifications: boolean
  
  // Directions
  stepByStepMode: boolean
  estimatedTime: boolean
  progressIndicators: boolean
  
  createdAt: string
  updatedAt: string
}

/**
 * Alert template
 */
export interface AlertTemplate {
  id: string
  name: string
  type: 'visual' | 'audio' | 'haptic'
  priority: AlertPriority
  content: {
    visual?: {
      type: VisualAlertType
      color?: string
      text?: string
      icon?: string
    }
    audio?: {
      type: AudioAlertType
      soundUrl?: string
      textToSpeech?: string
    }
    haptic?: {
      pattern: HapticPattern
      intensity?: number
    }
  }
  duration?: number
  repeatEnabled?: boolean
}

/**
 * Generated alert
 */
export interface GeneratedAlert {
  id: string
  alertId: string
  type: 'visual' | 'audio' | 'haptic'
  priority: AlertPriority
  
  // Content
  title: string
  message: string
  language: string
  
  // Data
  data: Record<string, unknown>
  
  // Delivery
  status: 'pending' | 'delivered' | 'failed' | 'acknowledged'
  deliveredAt?: string
  acknowledgedAt?: string
  
  // Metadata
  source: string
  expiresAt?: string
  
  createdAt: string
}

// ============================================================================
// Validation Schemas - Accessibility
// ============================================================================

/**
 * Schema for accessibility profile
 */
export const accessibilityProfileSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  visualAlertsEnabled: z.boolean().default(true),
  highContrastMode: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  largeText: z.boolean().default(false),
  customColors: z.object({
    background: z.string(),
    foreground: z.string(),
    alert: z.string(),
    warning: z.string(),
    info: z.string(),
  }).optional(),
  flashAlertsEnabled: z.boolean().default(false),
  audioAlertsEnabled: z.boolean().default(true),
  audioType: z.enum(['siren', 'alarm', 'voice', 'tone', 'chime', 'bell', 'custom']).default('siren'),
  audioVolume: z.number().min(0).max(100).default(70),
  audioFrequency: z.number().optional(),
  audioDuration: z.number().optional(),
  screenReaderEnabled: z.boolean().default(false),
  speechRate: z.number().min(0.5).max(2.0).optional(),
  hapticEnabled: z.boolean().default(true),
  hapticPattern: z.enum(['short', 'long', 'double', 'triple', ' SOS', 'pattern', 'custom']).default('short'),
  hapticIntensity: z.number().min(0).max(100).default(70),
  hapticDuration: z.number().optional(),
  emergencyHapticPattern: z.enum(['short', 'long', 'double', 'triple', ' SOS', 'pattern', 'custom']).optional(),
  simplifiedMode: z.boolean().default(false),
  extendedNotifications: z.boolean().default(false),
  stepByStepDirections: z.boolean().default(false),
  pictogramSupport: z.boolean().default(false),
  preferredLanguage: z.string().default('en'),
  multiLanguageAudioEnabled: z.boolean().default(false),
  availableLanguages: z.array(z.string()).default(['en']),
  emergencyContactEnabled: z.boolean().default(false),
  emergencyContactNumber: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

/**
 * Schema for visual alert config
 */
export const visualAlertConfigSchema = z.object({
  enabled: z.boolean().default(true),
  alertTypes: z.array(z.enum(['flash', 'strobe', 'color_change', 'icon_notification', 'text_notification', 'full_screen', 'banner', 'badge', 'pulse'])),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']).default('high'),
  duration: z.number().positive().default(5000),
  flashRate: z.number().optional(),
  color: z.string().optional(),
  size: z.number().min(1).max(100).optional(),
  displayLocation: z.enum(['fullscreen', 'top', 'bottom', 'notification_bar']).default('fullscreen'),
  repeatEnabled: z.boolean().default(false),
  repeatInterval: z.number().optional(),
  repeatCount: z.number().optional(),
})

/**
 * Schema for audio alert config
 */
export const audioAlertConfigSchema = z.object({
  enabled: z.boolean().default(true),
  alertTypes: z.array(z.enum(['siren', 'alarm', 'voice', 'tone', 'chime', 'bell', 'custom'])),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']).default('high'),
  volume: z.number().min(0).max(100).default(70),
  duration: z.number().positive().default(10000),
  frequency: z.number().optional(),
  customSoundUrl: z.string().url().optional(),
  voiceId: z.string().optional(),
  language: z.string().default('en'),
  speechRate: z.number().min(0.5).max(2.0).default(1.0),
  pitch: z.number().optional(),
  loopEnabled: z.boolean().default(false),
  loopInterval: z.number().optional(),
})

/**
 * Schema for haptic alert config
 */
export const hapticAlertConfigSchema = z.object({
  enabled: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']).default('high'),
  pattern: z.enum(['short', 'long', 'double', 'triple', ' SOS', 'pattern', 'custom']).default('short'),
  customPattern: z.array(z.number()).optional(),
  intensity: z.number().min(0).max(100).default(70),
  duration: z.number().positive().optional(),
  emergencyOverride: z.boolean().default(true),
  emergencyPattern: z.enum(['short', 'long', 'double', 'triple', ' SOS', 'pattern', 'custom']).optional(),
  emergencyIntensity: z.number().min(0).max(100).optional(),
})

/**
 * Schema for multi-language audio config
 */
export const multiLanguageAudioConfigSchema = z.object({
  primaryLanguage: z.string().min(2),
  secondaryLanguage: z.string().optional(),
  autoDetectLanguage: z.boolean().default(true),
  translateAlerts: z.boolean().default(false),
  voiceGender: z.enum(['male', 'female', 'neutral']).optional(),
  voiceAge: z.enum(['child', 'adult', 'senior']).optional(),
  emergencyLanguage: z.string().optional(),
})

/**
 * Schema for cognitive load config
 */
export const cognitiveLoadConfigSchema = z.object({
  simplifiedUI: z.boolean().default(false),
  hideAdvancedOptions: z.boolean().default(false),
  collapsedMenus: z.boolean().default(false),
  plainLanguage: z.boolean().default(false),
  bulletPoints: z.boolean().default(true),
  shortParagraphs: z.boolean().default(true),
  extendedNotifications: z.boolean().default(false),
  notificationDelay: z.number().optional(),
  groupedNotifications: z.boolean().default(true),
  stepByStepMode: z.boolean().default(false),
  estimatedTime: z.boolean().default(true),
  progressIndicators: z.boolean().default(true),
})

// ============================================================================
// Helper Functions - Accessibility
// ============================================================================

/**
 * Gets visual alert type display name
 */
export function getVisualAlertTypeName(type: VisualAlertType): string {
  const names: Record<VisualAlertType, string> = {
    flash: 'Flash',
    strobe: 'Strobe',
    color_change: 'Color Change',
    icon_notification: 'Icon Notification',
    text_notification: 'Text Notification',
    full_screen: 'Full Screen',
    banner: 'Banner',
    badge: 'Badge',
    pulse: 'Pulse',
  }
  return names[type]
}

/**
 * Gets audio alert type display name
 */
export function getAudioAlertTypeName(type: AudioAlertType): string {
  const names: Record<AudioAlertType, string> = {
    siren: 'Siren',
    alarm: 'Alarm',
    voice: 'Voice',
    tone: 'Tone',
    chime: 'Chime',
    bell: 'Bell',
    custom: 'Custom Sound',
  }
  return names[type]
}

/**
 * Gets haptic pattern display name
 */
export function getHapticPatternName(pattern: HapticPattern): string {
  const names: Record<HapticPattern, string> = {
    short: 'Short Vibration',
    long: 'Long Vibration',
    double: 'Double Vibration',
    triple: 'Triple Vibration',
    ' SOS': 'SOS Pattern',
    pattern: 'Custom Pattern',
    custom: 'Custom',
  }
  return names[pattern]
}

/**
 * Gets priority badge
 */
export function getAlertPriorityBadge(priority: AlertPriority): {
  label: string
  color: string
} {
  const badges: Record<AlertPriority, { label: string; color: string }> = {
    low: { label: 'Low', color: 'bg-green-100 text-green-800' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800' },
    emergency: { label: 'Emergency', color: 'bg-purple-100 text-purple-800' },
  }
  return badges[priority]
}

// ============================================================================
// Main Service Functions - Accessibility
// ============================================================================

/**
 * Creates an accessibility profile
 */
export async function createAccessibilityProfile(
  userId: string,
  input: z.infer<typeof accessibilityProfileSchema>
): Promise<AccessibilityProfile> {
  const validationResult = accessibilityProfileSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid profile: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('accessibility_profiles')
    .insert({
      user_id: userId,
      name: validatedInput.name,
      description: validatedInput.description || null,
      visual_alerts_enabled: validatedInput.visualAlertsEnabled,
      high_contrast_mode: validatedInput.highContrastMode,
      reduced_motion: validatedInput.reducedMotion,
      large_text: validatedInput.largeText,
      custom_colors: validatedInput.customColors || null,
      flash_alerts_enabled: validatedInput.flashAlertsEnabled,
      audio_alerts_enabled: validatedInput.audioAlertsEnabled,
      audio_type: validatedInput.audioType,
      audio_volume: validatedInput.audioVolume,
      audio_frequency: validatedInput.audioFrequency || null,
      audio_duration: validatedInput.audioDuration || null,
      screen_reader_enabled: validatedInput.screenReaderEnabled,
      speech_rate: validatedInput.speechRate || null,
      haptic_enabled: validatedInput.hapticEnabled,
      haptic_pattern: validatedInput.hapticPattern,
      haptic_intensity: validatedInput.hapticIntensity,
      haptic_duration: validatedInput.hapticDuration || null,
      emergency_haptic_pattern: validatedInput.emergencyHapticPattern || null,
      simplified_mode: validatedInput.simplifiedMode,
      extended_notifications: validatedInput.extendedNotifications,
      step_by_step_directions: validatedInput.stepByStepDirections,
      pictogram_support: validatedInput.pictogramSupport,
      preferred_language: validatedInput.preferredLanguage,
      multi_language_audio_enabled: validatedInput.multiLanguageAudioEnabled,
      available_languages: validatedInput.availableLanguages,
      emergency_contact_enabled: validatedInput.emergencyContactEnabled,
      emergency_contact_number: validatedInput.emergencyContactNumber || null,
      is_default: validatedInput.isDefault,
      is_active: validatedInput.isActive,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating accessibility profile:', error)
    throw new Error(`Failed to create profile: ${error.message}`)
  }

  return mapAccessibilityProfileFromDB(data)
}

/**
 * Gets user's accessibility profiles
 */
export async function getAccessibilityProfiles(
  userId: string
): Promise<AccessibilityProfile[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('accessibility_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching accessibility profiles:', error)
    return []
  }

  return (data || []).map(mapAccessibilityProfileFromDB)
}

/**
 * Gets user's active accessibility profile
 */
export async function getActiveAccessibilityProfile(
  userId: string
): Promise<AccessibilityProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('accessibility_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching active accessibility profile:', error)
    return null
  }

  return mapAccessibilityProfileFromDB(data)
}

/**
 * Updates an accessibility profile
 */
export async function updateAccessibilityProfile(
  profileId: string,
  input: Partial<z.infer<typeof accessibilityProfileSchema>>
): Promise<AccessibilityProfile> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (input.name !== undefined) updateData.name = input.name
  if (input.description !== undefined) updateData.description = input.description
  if (input.visualAlertsEnabled !== undefined) updateData.visual_alerts_enabled = input.visualAlertsEnabled
  if (input.highContrastMode !== undefined) updateData.high_contrast_mode = input.highContrastMode
  if (input.reducedMotion !== undefined) updateData.reduced_motion = input.reducedMotion
  if (input.largeText !== undefined) updateData.large_text = input.largeText
  if (input.customColors !== undefined) updateData.custom_colors = input.customColors
  if (input.flashAlertsEnabled !== undefined) updateData.flash_alerts_enabled = input.flashAlertsEnabled
  if (input.audioAlertsEnabled !== undefined) updateData.audio_alerts_enabled = input.audioAlertsEnabled
  if (input.audioType !== undefined) updateData.audio_type = input.audioType
  if (input.audioVolume !== undefined) updateData.audio_volume = input.audioVolume
  if (input.audioFrequency !== undefined) updateData.audio_frequency = input.audioFrequency
  if (input.audioDuration !== undefined) updateData.audio_duration = input.audioDuration
  if (input.screenReaderEnabled !== undefined) updateData.screen_reader_enabled = input.screenReaderEnabled
  if (input.speechRate !== undefined) updateData.speech_rate = input.speechRate
  if (input.hapticEnabled !== undefined) updateData.haptic_enabled = input.hapticEnabled
  if (input.hapticPattern !== undefined) updateData.haptic_pattern = input.hapticPattern
  if (input.hapticIntensity !== undefined) updateData.haptic_intensity = input.hapticIntensity
  if (input.hapticDuration !== undefined) updateData.haptic_duration = input.hapticDuration
  if (input.emergencyHapticPattern !== undefined) updateData.emergency_haptic_pattern = input.emergencyHapticPattern
  if (input.simplifiedMode !== undefined) updateData.simplified_mode = input.simplifiedMode
  if (input.extendedNotifications !== undefined) updateData.extended_notifications = input.extendedNotifications
  if (input.stepByStepDirections !== undefined) updateData.step_by_step_directions = input.stepByStepDirections
  if (input.pictogramSupport !== undefined) updateData.pictogram_support = input.pictogramSupport
  if (input.preferredLanguage !== undefined) updateData.preferred_language = input.preferredLanguage
  if (input.multiLanguageAudioEnabled !== undefined) updateData.multi_language_audio_enabled = input.multiLanguageAudioEnabled
  if (input.availableLanguages !== undefined) updateData.available_languages = input.availableLanguages
  if (input.emergencyContactEnabled !== undefined) updateData.emergency_contact_enabled = input.emergencyContactEnabled
  if (input.emergencyContactNumber !== undefined) updateData.emergency_contact_number = input.emergencyContactNumber
  if (input.isDefault !== undefined) updateData.is_default = input.isDefault
  if (input.isActive !== undefined) updateData.is_active = input.isActive

  const { data, error } = await supabase
    .from('accessibility_profiles')
    .update(updateData)
    .eq('id', profileId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating accessibility profile:', error)
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  return mapAccessibilityProfileFromDB(data)
}

/**
 * Deletes an accessibility profile
 */
export async function deleteAccessibilityProfile(profileId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('accessibility_profiles')
    .delete()
    .eq('id', profileId)

  if (error) {
    console.error('Error deleting accessibility profile:', error)
    throw new Error(`Failed to delete profile: ${error.message}`)
  }
}

/**
 * Creates a visual alert configuration
 */
export async function createVisualAlertConfig(
  userId: string,
  input: z.infer<typeof visualAlertConfigSchema>
): Promise<VisualAlertConfig> {
  const validationResult = visualAlertConfigSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid visual alert config: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('visual_alert_configs')
    .insert({
      user_id: userId,
      enabled: validatedInput.enabled,
      alert_types: validatedInput.alertTypes,
      priority: validatedInput.priority,
      duration: validatedInput.duration,
      flash_rate: validatedInput.flashRate || null,
      color: validatedInput.color || null,
      size: validatedInput.size || null,
      display_location: validatedInput.displayLocation,
      repeat_enabled: validatedInput.repeatEnabled,
      repeat_interval: validatedInput.repeatInterval || null,
      repeat_count: validatedInput.repeatCount || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating visual alert config:', error)
    throw new Error(`Failed to create config: ${error.message}`)
  }

  return mapVisualAlertConfigFromDB(data)
}

/**
 * Creates an audio alert configuration
 */
export async function createAudioAlertConfig(
  userId: string,
  input: z.infer<typeof audioAlertConfigSchema>
): Promise<AudioAlertConfig> {
  const validationResult = audioAlertConfigSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid audio alert config: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('audio_alert_configs')
    .insert({
      user_id: userId,
      enabled: validatedInput.enabled,
      alert_types: validatedInput.alertTypes,
      priority: validatedInput.priority,
      volume: validatedInput.volume,
      duration: validatedInput.duration,
      frequency: validatedInput.frequency || null,
      custom_sound_url: validatedInput.customSoundUrl || null,
      voice_id: validatedInput.voiceId || null,
      language: validatedInput.language,
      speech_rate: validatedInput.speechRate,
      pitch: validatedInput.pitch || null,
      loop_enabled: validatedInput.loopEnabled,
      loop_interval: validatedInput.loopInterval || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating audio alert config:', error)
    throw new Error(`Failed to create config: ${error.message}`)
  }

  return mapAudioAlertConfigFromDB(data)
}

/**
 * Creates a haptic alert configuration
 */
export async function createHapticAlertConfig(
  userId: string,
  input: z.infer<typeof hapticAlertConfigSchema>
): Promise<HapticAlertConfig> {
  const validationResult = hapticAlertConfigSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid haptic alert config: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('haptic_alert_configs')
    .insert({
      user_id: userId,
      enabled: validatedInput.enabled,
      priority: validatedInput.priority,
      pattern: validatedInput.pattern,
      custom_pattern: validatedInput.customPattern || null,
      intensity: validatedInput.intensity,
      duration: validatedInput.duration || null,
      emergency_override: validatedInput.emergencyOverride,
      emergency_pattern: validatedInput.emergencyPattern || null,
      emergency_intensity: validatedInput.emergencyIntensity || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating haptic alert config:', error)
    throw new Error(`Failed to create config: ${error.message}`)
  }

  return mapHapticAlertConfigFromDB(data)
}

/**
 * Creates a multi-language audio configuration
 */
export async function createMultiLanguageAudioConfig(
  userId: string,
  input: z.infer<typeof multiLanguageAudioConfigSchema>
): Promise<MultiLanguageAudioConfig> {
  const validationResult = multiLanguageAudioConfigSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid multi-language audio config: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('multi_language_audio_configs')
    .insert({
      user_id: userId,
      primary_language: validatedInput.primaryLanguage,
      secondary_language: validatedInput.secondaryLanguage || null,
      auto_detect_language: validatedInput.autoDetectLanguage,
      translate_alerts: validatedInput.translateAlerts,
      voice_gender: validatedInput.voiceGender || null,
      voice_age: validatedInput.voiceAge || null,
      emergency_language: validatedInput.emergencyLanguage || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating multi-language audio config:', error)
    throw new Error(`Failed to create config: ${error.message}`)
  }

  return mapMultiLanguageAudioConfigFromDB(data)
}

/**
 * Creates a cognitive load configuration
 */
export async function createCognitiveLoadConfig(
  userId: string,
  input: z.infer<typeof cognitiveLoadConfigSchema>
): Promise<CognitiveLoadConfig> {
  const validationResult = cognitiveLoadConfigSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid cognitive load config: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cognitive_load_configs')
    .insert({
      user_id: userId,
      simplified_ui: validatedInput.simplifiedUI,
      hide_advanced_options: validatedInput.hideAdvancedOptions,
      collapsed_menus: validatedInput.collapsedMenus,
      plain_language: validatedInput.plainLanguage,
      bullet_points: validatedInput.bulletPoints,
      short_paragraphs: validatedInput.shortParagraphs,
      extended_notifications: validatedInput.extendedNotifications,
      notification_delay: validatedInput.notificationDelay || null,
      grouped_notifications: validatedInput.groupedNotifications,
      step_by_step_mode: validatedInput.stepByStepMode,
      estimated_time: validatedInput.estimatedTime,
      progress_indicators: validatedInput.progressIndicators,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating cognitive load config:', error)
    throw new Error(`Failed to create config: ${error.message}`)
  }

  return mapCognitiveLoadConfigFromDB(data)
}

/**
 * Gets accessibility settings for an alert
 */
export async function getAlertAccessibilitySettings(
  userId: string,
  alertPriority: AlertPriority
): Promise<{
  visual: VisualAlertConfig | null
  audio: AudioAlertConfig | null
  haptic: HapticAlertConfig | null
}> {
  const supabase = createClient()

  // Get active profile
  const { data: profile } = await supabase
    .from('accessibility_profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (!profile) {
    return { visual: null, audio: null, haptic: null }
  }

  // Get configs matching priority or lower
  const { data: visualConfigs } = await supabase
    .from('visual_alert_configs')
    .select('*')
    .eq('user_id', userId)
    .eq('profile_id', profile.id)
    .lte('priority', alertPriority)
    .order('priority', { ascending: false })
    .limit(1)

  const { data: audioConfigs } = await supabase
    .from('audio_alert_configs')
    .select('*')
    .eq('user_id', userId)
    .eq('profile_id', profile.id)
    .lte('priority', alertPriority)
    .order('priority', { ascending: false })
    .limit(1)

  const { data: hapticConfigs } = await supabase
    .from('haptic_alert_configs')
    .select('*')
    .eq('user_id', userId)
    .eq('profile_id', profile.id)
    .lte('priority', alertPriority)
    .order('priority', { ascending: false })
    .limit(1)

  return {
    visual: visualConfigs?.[0] ? mapVisualAlertConfigFromDB(visualConfigs[0]) : null,
    audio: audioConfigs?.[0] ? mapAudioAlertConfigFromDB(audioConfigs[0]) : null,
    haptic: hapticConfigs?.[0] ? mapHapticAlertConfigFromDB(hapticConfigs[0]) : null,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to AccessibilityProfile
 */
function mapAccessibilityProfileFromDB(data: Record<string, unknown>): AccessibilityProfile {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    visualAlertsEnabled: data.visual_alerts_enabled as boolean,
    highContrastMode: data.high_contrast_mode,
    reducedMotion: data.reduced_motion,
    largeText: data.large_text as string,
    customColors: data.custom_colors as AccessibilityProfile['customColors'] | undefined,
    flashAlertsEnabled: data.flash_alerts_enabled as boolean,
    audioAlertsEnabled: data.audio_alerts_enabled as boolean,
    audioType: data.audio_type as AudioAlertType,
    audioVolume: data.audio_volume,
    audioFrequency: data.audio_frequency as number | undefined,
    audioDuration: data.audio_duration as number | undefined,
    screenReaderEnabled: data.screen_reader_enabled as boolean,
    speechRate: data.speech_rate as number | undefined,
    hapticEnabled: data.haptic_enabled as boolean,
    hapticPattern: data.haptic_pattern as HapticPattern,
    hapticIntensity: data.haptic_intensity as number,
    hapticDuration: data.haptic_duration as number | undefined,
    emergencyHapticPattern: data.emergency_haptic_pattern as HapticPattern | undefined,
    simplifiedMode: data.simplified_mode,
    extendedNotifications: data.extended_notifications,
    stepByStepDirections: data.step_by_step_directions,
    pictogramSupport: data.pictogram_support,
    preferredLanguage: data.preferred_language,
    multiLanguageAudioEnabled: data.multi_language_audio_enabled as boolean,
    availableLanguages: data.available_languages as string[],
    emergencyContactEnabled: data.emergency_contact_enabled as boolean,
    emergencyContactNumber: data.emergency_contact_number as string | undefined,
    isDefault: data.is_default as boolean,
    isActive: data.is_active as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to VisualAlertConfig
 */
function mapVisualAlertConfigFromDB(data: Record<string, unknown>): VisualAlertConfig {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    profileId: data.profile_id as string | undefined,
    enabled: data.enabled as boolean,
    alertTypes: data.alert_types as VisualAlertType[],
    priority: data.priority as AlertPriority,
    duration: data.duration as number,
    flashRate: data.flash_rate as number | undefined,
    color: data.color as string | undefined,
    size: data.size as number | undefined,
    displayLocation: data.display_location as 'fullscreen' | 'top' | 'bottom' | 'notification_bar',
    repeatEnabled: data.repeat_enabled as boolean,
    repeatInterval: data.repeat_interval as number | undefined,
    repeatCount: data.repeat_count as number | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to AudioAlertConfig
 */
function mapAudioAlertConfigFromDB(data: Record<string, unknown>): AudioAlertConfig {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    profileId: data.profile_id as string | undefined,
    enabled: data.enabled as boolean,
    alertTypes: data.alert_types as AudioAlertType[],
    priority: data.priority as AlertPriority,
    volume: data.volume,
    duration: data.duration as number,
    frequency: data.frequency as number | undefined,
    customSoundUrl: data.custom_sound_url as string | undefined,
    voiceId: data.voice_id as string | undefined,
    language: data.language,
    speechRate: data.speech_rate as number,
    pitch: data.pitch as number | undefined,
    loopEnabled: data.loop_enabled as boolean,
    loopInterval: data.loop_interval as number | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to HapticAlertConfig
 */
function mapHapticAlertConfigFromDB(data: Record<string, unknown>): HapticAlertConfig {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    profileId: data.profile_id as string | undefined,
    enabled: data.enabled as boolean,
    priority: data.priority as AlertPriority,
    pattern: data.pattern as HapticPattern,
    customPattern: data.custom_pattern as number[] | undefined,
    intensity: data.intensity as number,
    duration: data.duration as number | undefined,
    emergencyOverride: data.emergency_override,
    emergencyPattern: data.emergency_pattern as HapticPattern | undefined,
    emergencyIntensity: data.emergency_intensity as number | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to MultiLanguageAudioConfig
 */
function mapMultiLanguageAudioConfigFromDB(data: Record<string, unknown>): MultiLanguageAudioConfig {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    primaryLanguage: data.primary_language,
    secondaryLanguage: data.secondary_language as string | undefined,
    autoDetectLanguage: data.auto_detect_language,
    translateAlerts: data.translate_alerts,
    voiceGender: data.voice_gender as 'male' | 'female' | 'neutral' | undefined,
    voiceAge: data.voice_age as 'child' | 'adult' | 'senior' | undefined,
    emergencyLanguage: data.emergency_language as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to CognitiveLoadConfig
 */
function mapCognitiveLoadConfigFromDB(data: Record<string, unknown>): CognitiveLoadConfig {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    simplifiedUI: data.simplified_ui,
    hideAdvancedOptions: data.hide_advanced_options,
    collapsedMenus: data.collapsed_menus,
    plainLanguage: data.plain_language,
    bulletPoints: data.bullet_points as any[],
    shortParagraphs: data.short_paragraphs,
    extendedNotifications: data.extended_notifications,
    notificationDelay: data.notification_delay as number | undefined,
    groupedNotifications: data.grouped_notifications,
    stepByStepMode: data.step_by_step_mode,
    estimatedTime: data.estimated_time,
    progressIndicators: data.progress_indicators,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
