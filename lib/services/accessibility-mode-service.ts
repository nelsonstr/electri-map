import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Accessibility mode type
 */
export type AccessibilityModeType = 
  | 'visual'
  | 'hearing'
  | 'motor'
  | 'cognitive'
  | 'custom'

/**
 * Visual accessibility setting
 */
export type VisualAccessibilitySetting = 
  | 'screen_reader'
  | 'high_contrast'
  | 'large_text'
  | 'color_blind_mode'
  | 'reduced_motion'
  | 'braille_display'
  | 'voice_over'
  | 'zoom'

/**
 * Hearing accessibility setting
 */
export type HearingAccessibilitySetting = 
  | 'captions'
  | 'visual_alerts'
  | 'sign_language'
  | 'haptic_feedback'
  | 'vibration_alerts'
  | 'sound_amplification'
  | 'hearing_aid_compatible'

/**
 * Motor accessibility setting
 */
export type MotorAccessibilitySetting = 
  | 'voice_control'
  | 'switch_control'
  | 'eye_tracking'
  | 'single_switch'
  | 'head_movement'
  | 'foot_controls'
  | 'adaptive_keyboard'
  | 'larger_touch_targets'

/**
 * Cognitive accessibility setting
 */
export type CognitiveAccessibilitySetting = 
  | 'simplified_interface'
  | 'extended_time'
  | 'step_by_step'
  | 'predictive_text'
  | 'calendar_reminders'
  | 'routine_alerts'
  | 'visual_schedule'

/**
 * User accessibility profile
 */
export interface AccessibilityProfile {
  id: string
  userId: string
  
  // Profile name
  name: string
  description?: string
  
  // Mode
  mode: AccessibilityModeType
  
  // Visual settings
  visualSettings?: {
    enabled: boolean
    settings: VisualAccessibilitySetting[]
    screenReaderVoice?: string
    screenReaderSpeed?: number // 0.5-2.0
    zoomLevel?: number // 1.0-3.0
    highContrastMode?: 'light' | 'dark' | 'custom'
    highContrastColors?: {
      foreground: string
      background: string
    }
    colorBlindMode?: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromacy'
    reducedMotion: boolean
    brailleDisplay?: {
      enabled: boolean
      grade?: number // 1 or 2
      contraction?: boolean
    }
  }
  
  // Hearing settings
  hearingSettings?: {
    enabled: boolean
    settings: HearingAccessibilitySetting[]
    captionsEnabled: boolean
    captionsSize?: 'small' | 'medium' | 'large' | 'extra_large'
    captionsStyle?: 'standard' | 'high_contrast'
    visualAlertType?: 'flash' | 'pulse' | 'static'
    vibrationIntensity?: number // 0-100
  }
  
  // Motor settings
  motorSettings?: {
    enabled: boolean
    settings: MotorAccessibilitySetting[]
    voiceControlEnabled: boolean
    switchControlEnabled: boolean
    dwellClickEnabled: boolean
    dwellTimeMs?: number
    touchTargetSize?: number // multiplier
    swipeSensitivity?: number // 0.5-2.0
  }
  
  // Cognitive settings
  cognitiveSettings?: {
    enabled: boolean
    settings: CognitiveAccessibilitySetting[]
    interfaceComplexity?: 'simple' | 'medium' | 'full'
    timeMultiplier?: number // multiplier for time limits
    enablePredictive?: boolean
    routineNotifications?: boolean
  }
  
  // Presets
  preset?: 'default' | 'blind' | 'low_vision' | 'deaf' | 'hard_of_hearing' | 'mobility_impaired' | 'adhd' | 'autism'
  
  // Priority
  priority: number
  
  // Active status
  isActive: boolean
  isDefault: boolean
  
  createdAt: string
  updatedAt: string
}

/**
 * Screen reader configuration
 */
export interface ScreenReaderConfig {
  id: string
  userId: string
  
  // Voice
  voice: string
  voiceSpeed: number // 0.5-2.0
  voicePitch: number // 0.5-2.0
  voiceVolume: number // 0-100
  
  // Announcement settings
  announcements: {
    alerts: boolean
    navigation: boolean
    formErrors: boolean
    pageChanges: boolean
    liveRegions: boolean
  }
  
  // Reading settings
  reading: {
    readPageStructure: boolean
    readImages: boolean
    readFormLabels: boolean
    autoReadPage: boolean
    skipLinks: boolean
  }
  
  // Keyboard navigation
  keyboard: {
    virtualCursor: boolean
    focusHighlight: boolean
    skipToMain: boolean
    shortcutHints: boolean
  }
}

/**
 * High contrast configuration
 */
export interface HighContrastConfig {
  id: string
  userId: string
  
  // Mode
  mode: 'light' | 'dark' | 'custom'
  
  // Custom colors (if mode is custom)
  customColors?: {
    foreground: string
    background: string
    linkColor: string
    buttonBackground: string
    buttonForeground: string
    borderColor: string
    focusColor: string
  }
  
  // Text settings
  textSize: 'normal' | 'large' | 'extra_large'
  textWeight: 'normal' | 'bold'
  textSpacing: 'normal' | 'increased'
  
  // Border settings
  borders: 'normal' | 'thick' | 'very_thick'
  focusIndicators: 'normal' | 'thick' | 'very_thick'
  
  // Color overrides
  forceColorSchemes: boolean
  colorOverrideMode?: 'grayscale' | 'monochrome' | 'high_saturation'
}

/**
 * Assistive technology device
 */
export interface AssistiveDevice {
  id: string
  userId: string
  
  // Device info
  deviceType: 'screen_reader' | 'braille_display' | 'switch_device' | 'eye_tracker' | 'voice_control' | 'hearing_aid' | 'other'
  deviceName: string
  deviceManufacturer?: string
  deviceModel?: string
  
  // Status
  status: 'active' | 'inactive' | 'error' | 'paired'
  lastConnectedAt?: string
  
  // Configuration
  config?: Record<string, unknown>
  
  // Connection
  connectionType: 'bluetooth' | 'usb' | 'wireless' | 'built_in'
  
  createdAt: string
  updatedAt: string
}

/**
 * Accessibility analytics
 */
export interface AccessibilityAnalytics {
  // Usage stats
  totalUsersWithAccessibilityEnabled: number
  totalAssistiveDevices: number
  
  // Mode breakdown
  modeBreakdown: Record<AccessibilityModeType, number>
  
  // Feature usage
  featureUsage: Record<string, number>
  
  // Device breakdown
  deviceBreakdown: Record<string, number>
  
  // Issues
  accessibilityIssues: Array<{
    issue: string
    occurrences: number
    severity: 'low' | 'medium' | 'high'
  }>
  
  // Compliance
  wcagCompliance: {
    level: 'A' | 'AA' | 'AAA'
    score: number
    issues: Array<{
      criterion: string
      status: 'passed' | 'failed' | 'partial'
    }>
  }
  
  // Period
  periodStart: string
  periodEnd: string
}

/**
 * Accessibility notification preference
 */
export interface AccessibilityNotificationPreference {
  id: string
  userId: string
  
  // Channel
  channel: 'visual' | 'haptic' | 'audio' | 'braille' | 'push'
  
  // Alert types
  alertTypes: {
    emergency: boolean
    outage: boolean
    weather: boolean
    safety: boolean
    restoration: boolean
  }
  
  // Priority
  priority: 'high' | 'medium' | 'low'
  
  // Settings
  settings?: Record<string, unknown>
  
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating accessibility profile
 */
export const createAccessibilityProfileSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  mode: z.enum(['visual', 'hearing', 'motor', 'cognitive', 'custom']),
  preset: z.enum(['default', 'blind', 'low_vision', 'deaf', 'hard_of_hearing', 'mobility_impaired', 'adhd', 'autism']).optional(),
  priority: z.number().int().min(0).max(100).optional(),
})

/**
 * Schema for updating accessibility settings
 */
export const updateAccessibilitySettingsSchema = z.object({
  profileId: z.string().min(1),
  visualSettings: z.object({
    enabled: z.boolean().optional(),
    settings: z.array(z.enum(['screen_reader', 'high_contrast', 'large_text', 'color_blind_mode', 'reduced_motion', 'braille_display', 'voice_over', 'zoom'])).optional(),
    screenReaderVoice: z.string().optional(),
    screenReaderSpeed: z.number().min(0.5).max(2.0).optional(),
    zoomLevel: z.number().min(1.0).max(3.0).optional(),
    highContrastMode: z.enum(['light', 'dark', 'custom']).optional(),
    reducedMotion: z.boolean().optional(),
    brailleDisplay: z.object({
      enabled: z.boolean(),
      grade: z.number().optional(),
      contraction: z.boolean().optional(),
    }).optional(),
  }).optional(),
  hearingSettings: z.object({
    enabled: z.boolean().optional(),
    settings: z.array(z.enum(['captions', 'visual_alerts', 'sign_language', 'haptic_feedback', 'vibration_alerts', 'sound_amplification', 'hearing_aid_compatible'])).optional(),
    captionsEnabled: z.boolean().optional(),
    captionsSize: z.enum(['small', 'medium', 'large', 'extra_large']).optional(),
    captionsStyle: z.enum(['standard', 'high_contrast']).optional(),
    vibrationIntensity: z.number().min(0).max(100).optional(),
  }).optional(),
  motorSettings: z.object({
    enabled: z.boolean().optional(),
    settings: z.array(z.enum(['voice_control', 'switch_control', 'eye_tracking', 'single_switch', 'head_movement', 'foot_controls', 'adaptive_keyboard', 'larger_touch_targets'])).optional(),
    voiceControlEnabled: z.boolean().optional(),
    switchControlEnabled: z.boolean().optional(),
    dwellClickEnabled: z.boolean().optional(),
    dwellTimeMs: z.number().optional(),
    touchTargetSize: z.number().optional(),
  }).optional(),
  cognitiveSettings: z.object({
    enabled: z.boolean().optional(),
    settings: z.array(z.enum(['simplified_interface', 'extended_time', 'step_by_step', 'predictive_text', 'calendar_reminders', 'routine_alerts', 'visual_schedule'])).optional(),
    interfaceComplexity: z.enum(['simple', 'medium', 'full']).optional(),
    timeMultiplier: z.number().optional(),
  }).optional(),
})

/**
 * Schema for screen reader config
 */
export const screenReaderConfigSchema = z.object({
  voice: z.string().min(1),
  voiceSpeed: z.number().min(0.5).max(2.0),
  voicePitch: z.number().min(0.5).max(2.0),
  voiceVolume: z.number().min(0).max(100),
  announcements: z.object({
    alerts: z.boolean(),
    navigation: z.boolean(),
    formErrors: z.boolean(),
    pageChanges: z.boolean(),
    liveRegions: z.boolean(),
  }),
  reading: z.object({
    readPageStructure: z.boolean(),
    readImages: z.boolean(),
    readFormLabels: z.boolean(),
    autoReadPage: z.boolean(),
    skipLinks: z.boolean(),
  }),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for accessibility mode
 */
export function getAccessibilityModeDisplayName(mode: AccessibilityModeType): string {
  const names: Record<AccessibilityModeType, string> = {
    visual: 'Visual Accessibility',
    hearing: 'Hearing Accessibility',
    motor: 'Motor Accessibility',
    cognitive: 'Cognitive Accessibility',
    custom: 'Custom Accessibility',
  }
  return names[mode]
}

/**
 * Gets display name for visual setting
 */
export function getVisualSettingDisplayName(setting: VisualAccessibilitySetting): string {
  const names: Record<VisualAccessibilitySetting, string> = {
    screen_reader: 'Screen Reader',
    high_contrast: 'High Contrast',
    large_text: 'Large Text',
    color_blind_mode: 'Color Blind Mode',
    reduced_motion: 'Reduced Motion',
    braille_display: 'Braille Display',
    voice_over: 'Voice Over',
    zoom: 'Zoom',
  }
  return names[setting]
}

/**
 * Gets display name for hearing setting
 */
export function getHearingSettingDisplayName(setting: HearingAccessibilitySetting): string {
  const names: Record<HearingAccessibilitySetting, string> = {
    captions: 'Captions',
    visual_alerts: 'Visual Alerts',
    sign_language: 'Sign Language Support',
    haptic_feedback: 'Haptic Feedback',
    vibration_alerts: 'Vibration Alerts',
    sound_amplification: 'Sound Amplification',
    hearing_aid_compatible: 'Hearing Aid Compatible',
  }
  return names[setting]
}

/**
 * Gets preset description
 */
export function getPresetDescription(preset: string): string {
  const descriptions: Record<string, string> = {
    default: 'Standard accessibility settings',
    blind: 'Optimized for users with visual impairments',
    low_vision: 'Enhanced visibility for low vision users',
    deaf: 'Visual and haptic alerts for deaf users',
    hard_of_hearing: 'Amplified audio and visual cues',
    mobility_impaired: 'Simplified touch and motor controls',
    adhd: 'Reduced distractions and extended time',
    autism: 'Predictable interface and calm design',
  }
  return descriptions[preset] || ''
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates an accessibility profile
 */
export async function createAccessibilityProfile(
  userId: string,
  input: z.infer<typeof createAccessibilityProfileSchema>
): Promise<AccessibilityProfile> {
  const validationResult = createAccessibilityProfileSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Check if this is the first profile
  const { data: existingProfiles } = await supabase
    .from('accessibility_profiles')
    .select('id')
    .eq('user_id', userId)

  const isFirstProfile = !existingProfiles || existingProfiles.length === 0

  const { data, error } = await supabase
    .from('accessibility_profiles')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description,
      mode: input.mode,
      preset: input.preset,
      priority: input.priority ?? (isFirstProfile ? 0 : 100),
      is_active: true,
      is_default: isFirstProfile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    throw new Error(`Failed to create profile: ${error.message}`)
  }

  return mapProfileFromDB(data)
}

/**
 * Gets accessibility profiles for a user
 */
export async function getAccessibilityProfiles(
  userId: string
): Promise<AccessibilityProfile[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('accessibility_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: true })

  if (error) {
    console.error('Error fetching profiles:', error)
    return []
  }

  return (data || []).map(mapProfileFromDB)
}

/**
 * Gets active accessibility profile
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
    .order('priority', { ascending: true })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching active profile:', error)
    return null
  }

  if (!data) return null
  return mapProfileFromDB(data)
}

/**
 * Updates accessibility profile settings
 */
export async function updateAccessibilitySettings(
  userId: string,
  input: z.infer<typeof updateAccessibilitySettingsSchema>
): Promise<AccessibilityProfile> {
  const validationResult = updateAccessibilitySettingsSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.visualSettings) {
    updateData.visual_settings = input.visualSettings
  }
  if (input.hearingSettings) {
    updateData.hearing_settings = input.hearingSettings
  }
  if (input.motorSettings) {
    updateData.motor_settings = input.motorSettings
  }
  if (input.cognitiveSettings) {
    updateData.cognitive_settings = input.cognitiveSettings
  }

  const { data, error } = await supabase
    .from('accessibility_profiles')
    .update(updateData)
    .eq('id', input.profileId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating settings:', error)
    throw new Error(`Failed to update settings: ${error.message}`)
  }

  return mapProfileFromDB(data)
}

/**
 * Sets a profile as active
 */
export async function setActiveProfile(
  userId: string,
  profileId: string
): Promise<AccessibilityProfile> {
  const supabase = createClient()

  // Deactivate all profiles
  await supabase
    .from('accessibility_profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  // Activate selected profile
  const { data, error } = await supabase
    .from('accessibility_profiles')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    console.error('Error activating profile:', error)
    throw new Error(`Failed to activate profile: ${error.message}`)
  }

  return mapProfileFromDB(data)
}

/**
 * Deletes an accessibility profile
 */
export async function deleteAccessibilityProfile(
  userId: string,
  profileId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('accessibility_profiles')
    .delete()
    .eq('id', profileId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting profile:', error)
    throw new Error(`Failed to delete profile: ${error.message}`)
  }

  return true
}

/**
 * Registers an assistive device
 */
export async function registerAssistiveDevice(
  userId: string,
  device: Omit<AssistiveDevice, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<AssistiveDevice> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('assistive_devices')
    .insert({
      user_id: userId,
      device_type: device.deviceType,
      device_name: device.deviceName,
      device_manufacturer: device.deviceManufacturer,
      device_model: device.deviceModel,
      status: 'active',
      config: device.config,
      connection_type: device.connectionType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error registering device:', error)
    throw new Error(`Failed to register device: ${error.message}`)
  }

  return mapDeviceFromDB(data)
}

/**
 * Gets assistive devices for a user
 */
export async function getAssistiveDevices(
  userId: string
): Promise<AssistiveDevice[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('assistive_devices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching devices:', error)
    return []
  }

  return (data || []).map(mapDeviceFromDB)
}

/**
 * Updates screen reader configuration
 */
export async function updateScreenReaderConfig(
  userId: string,
  config: z.infer<typeof screenReaderConfigSchema>
): Promise<ScreenReaderConfig> {
  const validationResult = screenReaderConfigSchema.safeParse(config)
  if (!validationResult.success) {
    throw new Error(`Invalid config: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('screen_reader_configs')
    .upsert({
      user_id: userId,
      voice: config.voice,
      voice_speed: config.voiceSpeed,
      voice_pitch: config.voicePitch,
      voice_volume: config.voiceVolume,
      announcements: config.announcements,
      reading: config.reading,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating screen reader config:', error)
    throw new Error(`Failed to update config: ${error.message}`)
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    voice: data.voice,
    voiceSpeed: data.voice_speed as number,
    voicePitch: data.voice_pitch,
    voiceVolume: data.voice_volume,
    announcements: data.announcements,
    reading: data.reading,
  }
}

/**
 * Gets screen reader configuration
 */
export async function getScreenReaderConfig(
  userId: string
): Promise<ScreenReaderConfig | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('screen_reader_configs')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching screen reader config:', error)
    return null
  }

  if (!data) {
    // Return default config
    return {
      id: 'default',
      userId,
      voice: 'default',
      voiceSpeed: 1.0,
      voicePitch: 1.0,
      voiceVolume: 100,
      announcements: {
        alerts: true,
        navigation: true,
        formErrors: true,
        pageChanges: true,
        liveRegions: true,
      },
      reading: {
        readPageStructure: true,
        readImages: false,
        readFormLabels: true,
        autoReadPage: false,
        skipLinks: false,
      },
    }
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    voice: data.voice,
    voiceSpeed: data.voice_speed as number,
    voicePitch: data.voice_pitch,
    voiceVolume: data.voice_volume,
    announcements: data.announcements,
    reading: data.reading,
  }
}

/**
 * Updates high contrast configuration
 */
export async function updateHighContrastConfig(
  userId: string,
  config: Omit<HighContrastConfig, 'id' | 'userId'>
): Promise<HighContrastConfig> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('high_contrast_configs')
    .upsert({
      user_id: userId,
      mode: config.mode,
      custom_colors: config.customColors,
      text_size: config.textSize,
      text_weight: config.textWeight,
      text_spacing: config.textSpacing,
      borders: config.borders,
      focus_indicators: config.focusIndicators,
      force_color_schemes: config.forceColorSchemes,
      color_override_mode: config.colorOverrideMode,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating high contrast config:', error)
    throw new Error(`Failed to update config: ${error.message}`)
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    mode: data.mode,
    customColors: data.custom_colors,
    textSize: data.text_size as number,
    textWeight: data.text_weight,
    textSpacing: data.text_spacing,
    borders: data.borders,
    focusIndicators: data.focus_indicators,
    forceColorSchemes: data.force_color_schemes,
    colorOverrideMode: data.color_override_mode,
  }
}

/**
 * Gets high contrast configuration
 */
export async function getHighContrastConfig(
  userId: string
): Promise<HighContrastConfig | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('high_contrast_configs')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching high contrast config:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    mode: data.mode,
    customColors: data.custom_colors,
    textSize: data.text_size as number,
    textWeight: data.text_weight,
    textSpacing: data.text_spacing,
    borders: data.borders,
    focusIndicators: data.focus_indicators,
    forceColorSchemes: data.force_color_schemes,
    colorOverrideMode: data.color_override_mode,
  }
}

/**
 * Gets accessibility analytics
 */
export async function getAccessibilityAnalytics(
  periodDays: number = 30
): Promise<AccessibilityAnalytics> {
  const supabase = createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  // Get profiles
  const { data: profiles } = await supabase
    .from('accessibility_profiles')
    .select('*')
    .gte('created_at', startDate.toISOString())

  // Get devices
  const { data: devices } = await supabase
    .from('assistive_devices')
    .select('*')
    .gte('created_at', startDate.toISOString())

  // Calculate mode breakdown
  const modeBreakdown: Record<AccessibilityModeType, number> = {
    visual: 0,
    hearing: 0,
    motor: 0,
    cognitive: 0,
    custom: 0,
  }

  for (const profile of profiles || []) {
    const mode = profile.mode as AccessibilityModeType
    if (modeBreakdown[mode] !== undefined) {
      modeBreakdown[mode]++
    }
  }

  // Calculate device breakdown
  const deviceBreakdown: Record<string, number> = {}
  for (const device of devices || []) {
    const type = device.device_type
    deviceBreakdown[type] = (deviceBreakdown[type] || 0) + 1
  }

  return {
    totalUsersWithAccessibilityEnabled: new Set((profiles || []).map(p => p.user_id)).size,
    totalAssistiveDevices: (devices || []).length,
    modeBreakdown,
    featureUsage: {},
    deviceBreakdown,
    accessibilityIssues: [],
    wcagCompliance: {
      level: 'AA',
      score: 95,
      issues: [],
    },
    periodStart: startDate.toISOString(),
    periodEnd: new Date().toISOString(),
  }
}

/**
 * Applies preset to profile
 */
export async function applyPreset(
  userId: string,
  profileId: string,
  preset: AccessibilityProfile['preset']
): Promise<AccessibilityProfile> {
  const supabase = createClient()

  // Preset configurations
  const presets: Record<string, Record<string, unknown>> = {
    blind: {
      visual_settings: {
        enabled: true,
        settings: ['screen_reader', 'braille_display', 'voice_over'],
        reducedMotion: true,
        screenReaderSpeed: 1.2,
      },
    },
    low_vision: {
      visual_settings: {
        enabled: true,
        settings: ['high_contrast', 'large_text', 'zoom'],
        zoomLevel: 1.5,
        highContrastMode: 'light',
      },
    },
    deaf: {
      hearing_settings: {
        enabled: true,
        settings: ['visual_alerts', 'haptic_feedback', 'vibration_alerts'],
        captionsEnabled: true,
        vibrationIntensity: 100,
      },
    },
    hard_of_hearing: {
      hearing_settings: {
        enabled: true,
        settings: ['captions', 'sound_amplification', 'hearing_aid_compatible'],
        captionsEnabled: true,
        captionsSize: 'large',
      },
    },
    mobility_impaired: {
      motor_settings: {
        enabled: true,
        settings: ['voice_control', 'switch_control', 'larger_touch_targets'],
        touchTargetSize: 1.5,
      },
    },
    adhd: {
      cognitive_settings: {
        enabled: true,
        settings: ['simplified_interface', 'extended_time'],
        interfaceComplexity: 'simple',
        timeMultiplier: 2.0,
      },
    },
    autism: {
      cognitive_settings: {
        enabled: true,
        settings: ['simplified_interface', 'predictive_text', 'visual_schedule'],
        interfaceComplexity: 'simple',
      },
    },
  }

  const presetConfig = presets[preset || 'default'] || {}

  const { data, error } = await supabase
    .from('accessibility_profiles')
    .update({
      preset,
      ...presetConfig,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    console.error('Error applying preset:', error)
    throw new Error(`Failed to apply preset: ${error.message}`)
  }

  return mapProfileFromDB(data)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to AccessibilityProfile
 */
function mapProfileFromDB(data: Record<string, unknown>): AccessibilityProfile {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    mode: data.mode as AccessibilityModeType,
    visualSettings: data.visual_settings,
    hearingSettings: data.hearing_settings,
    motorSettings: data.motor_settings,
    cognitiveSettings: data.cognitive_settings,
    preset: data.preset as AccessibilityProfile['preset'] | undefined,
    priority: data.priority as number,
    isActive: data.is_active as boolean,
    isDefault: data.is_default as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to AssistiveDevice
 */
function mapDeviceFromDB(data: Record<string, unknown>): AssistiveDevice {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    deviceType: data.device_type as AssistiveDevice['deviceType'],
    deviceName: data.device_name as string,
    deviceManufacturer: data.device_manufacturer as string | undefined,
    deviceModel: data.device_model as string | undefined,
    status: data.status as AssistiveDevice['status'],
    lastConnectedAt: data.last_connected_at as string | undefined,
    config: data.config,
    connectionType: data.connection_type as AssistiveDevice['connectionType'],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
