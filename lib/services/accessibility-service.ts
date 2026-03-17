import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Accessibility preference type
 */
export type AccessibilityPreference =
  | 'text_size'
  | 'high_contrast'
  | 'reduce_motion'
  | 'screen_reader'
  | 'color_blind_mode'
  | 'focus_indicators'
  | 'screen_orientation'
  | 'font_family'
  | 'line_spacing'
  | 'word_spacing'
  | 'custom_colors'

/**
 * Text size preset
 */
export type TextSizePreset = 'small' | 'medium' | 'large' | 'extra_large' | 'maximum'

/**
 * High contrast mode
 */
export type HighContrastMode = 'off' | 'light' | 'dark' | 'custom'

/**
 * Color blind mode
 */
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'

/**
 * Screen orientation
 */
export type ScreenOrientation = 'portrait' | 'landscape' | 'auto'

/**
 * Font family type
 */
export type FontFamilyType = 'default' | 'dyslexic' | 'mono' | 'serif' | 'sans_serif'

/**
 * Accessibility settings
 */
export interface AccessibilitySettings {
  id: string
  userId?: string
  
  // Visual
  textSize: TextSizePreset
  textSizeMultiplier: number
  highContrast: HighContrastMode
  reduceMotion: boolean
  colorBlindMode: ColorBlindMode
  
  // Focus
  focusIndicators: boolean
  focusIndicatorSize: number
  
  // Layout
  screenOrientation: ScreenOrientation
  lineSpacing: number
  wordSpacing: number
  
  // Colors
  customColors?: {
    primary: string
    secondary: string
    background: string
    text: string
    link: string
  }
  
  // Font
  fontFamily: FontFamilyType
  
  // Screen reader
  screenReaderOptimized: boolean
  announceAlerts: boolean
  describeImages: boolean
  
  // Keyboard
  keyboardNavigation: boolean
  shortcutsEnabled: boolean
  
  // Assistive tech
  externalAssistiveDevices?: string[]
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Accessibility audit
 */
export interface AccessibilityAudit {
  id: string
  
  // Context
  pageUrl: string
  pageTitle: string
  
  // Results
  score: number
  issues: Array<{
    id: string
    severity: 'error' | 'warning' | 'notice'
    wcagCriteria: string
    description: string
    impact: 'critical' | 'serious' | 'moderate' | 'minor'
    element?: string
    suggestion?: string
    fixedAt?: string
  }>
  
  // Testing
  testedWith: string
  testedAt: string
  
  // Status
  isResolved: boolean
  resolvedAt?: string
  
  // Timestamps
  createdAt: string
}

/**
 * Screen reader announcement
 */
export interface ScreenReaderAnnouncement {
  id: string
  
  // Content
  message: string
  priority: 'polite' | 'assertive'
  
  // Context
  pageSection?: string
  
  // Status
  isRead: boolean
  readAt?: string
  
  // Timestamps
  createdAt: string
}

/**
 * Accessibility shortcut
 */
export interface AccessibilityShortcut {
  id: string
  
  // Shortcut
  key: string
  modifiers: string[]
  
  // Action
  action: string
  description: string
  
  // Status
  isEnabled: boolean
  
  // Timestamps
  createdAt: string
}

/**
 * Update accessibility settings input
 */
export interface UpdateAccessibilitySettingsInput {
  textSize?: TextSizePreset
  textSizeMultiplier?: number
  highContrast?: HighContrastMode
  reduceMotion?: boolean
  colorBlindMode?: ColorBlindMode
  focusIndicators?: boolean
  focusIndicatorSize?: number
  screenOrientation?: ScreenOrientation
  lineSpacing?: number
  wordSpacing?: number
  customColors?: AccessibilitySettings['customColors']
  fontFamily?: FontFamilyType
  screenReaderOptimized?: boolean
  announceAlerts?: boolean
  describeImages?: boolean
  keyboardNavigation?: boolean
  shortcutsEnabled?: boolean
  externalAssistiveDevices?: string[]
}

/**
 * Create audit input
 */
export interface CreateAuditInput {
  pageUrl: string
  pageTitle: string
  score: number
  issues: Array<{
    id: string
    severity: 'error' | 'warning' | 'notice'
    wcagCriteria: string
    description: string
    impact: 'critical' | 'serious' | 'moderate' | 'minor'
    element?: string
    suggestion?: string
  }>
  testedWith: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for updating settings
 */
export const updateAccessibilitySettingsSchema = z.object({
  textSize: z.enum(['small', 'medium', 'large', 'extra_large', 'maximum']).optional(),
  textSizeMultiplier: z.number().min(0.5).max(3).optional(),
  highContrast: z.enum(['off', 'light', 'dark', 'custom']).optional(),
  reduceMotion: z.boolean().optional(),
  colorBlindMode: z.enum(['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia']).optional(),
  focusIndicators: z.boolean().optional(),
  focusIndicatorSize: z.number().min(1).max(10).optional(),
  screenOrientation: z.enum(['portrait', 'landscape', 'auto']).optional(),
  lineSpacing: z.number().min(1).max(3).optional(),
  wordSpacing: z.number().min(0).max(1).optional(),
  customColors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    link: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
  fontFamily: z.enum(['default', 'dyslexic', 'mono', 'serif', 'sans_serif']).optional(),
  screenReaderOptimized: z.boolean().optional(),
  announceAlerts: z.boolean().optional(),
  describeImages: z.boolean().optional(),
  keyboardNavigation: z.boolean().optional(),
  shortcutsEnabled: z.boolean().optional(),
  externalAssistiveDevices: z.array(z.string()).optional(),
})

/**
 * Schema for creating audit
 */
export const createAuditSchema = z.object({
  pageUrl: z.string().url(),
  pageTitle: z.string().min(1),
  score: z.number().min(0).max(100),
  issues: z.array(z.object({
    id: z.string().min(1),
    severity: z.enum(['error', 'warning', 'notice']),
    wcagCriteria: z.string().min(1),
    description: z.string().min(1),
    impact: z.enum(['critical', 'serious', 'moderate', 'minor']),
    element: z.string().optional(),
    suggestion: z.string().optional(),
  })),
  testedWith: z.string().min(1),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for text size preset
 */
export function getTextSizeDisplayName(preset: TextSizePreset): string {
  const names: Record<TextSizePreset, string> = {
    small: 'Small (80%)',
    medium: 'Medium (100%)',
    large: 'Large (125%)',
    extra_large: 'Extra Large (150%)',
    maximum: 'Maximum (200%)',
  }
  return names[preset]
}

/**
 * Gets display name for high contrast mode
 */
export function getHighContrastDisplayName(mode: HighContrastMode): string {
  const names: Record<HighContrastMode, string> = {
    off: 'Off',
    light: 'Light High Contrast',
    dark: 'Dark High Contrast',
    custom: 'Custom Colors',
  }
  return names[mode]
}

/**
 * Gets display name for color blind mode
 */
export function getColorBlindModeDisplayName(mode: ColorBlindMode): string {
  const names: Record<ColorBlindMode, string> = {
    none: 'None',
    protanopia: 'Protanopia (Red-Blind)',
    deuteranopia: 'Deuteranopia (Green-Blind)',
    tritanopia: 'Tritanopia (Blue-Blind)',
    achromatopsia: 'Achromatopsia (Color Blind)',
  }
  return names[mode]
}

/**
 * Gets display name for WCAG criteria
 */
export function getWCAGCriteriaDisplayName(code: string): string {
  const criteria: Record<string, string> = {
    '1.1.1': 'Non-text Content',
    '1.2.1': 'Audio-only and Video-only',
    '1.2.2': 'Captions',
    '1.2.3': 'Audio Description',
    '1.3.1': 'Info and Relationships',
    '1.3.2': 'Meaningful Sequence',
    '1.3.3': 'Sensory Characteristics',
    '1.4.1': 'Use of Color',
    '1.4.2': 'Audio Control',
    '1.4.3': 'Contrast Minimum',
    '1.4.4': 'Resize Text',
    '1.4.5': 'Images of Text',
    '2.1.1': 'Keyboard',
    '2.1.2': 'No Keyboard Trap',
    '2.2.1': 'Timing Adjustable',
    '2.2.2': 'Pause, Stop, Hide',
    '2.3.1': 'Three Flashes',
    '2.4.1': 'Bypass Blocks',
    '2.4.2': 'Page Titled',
    '2.4.3': 'Focus Order',
    '2.4.4': 'Link Purpose',
    '2.4.5': 'Multiple Ways',
    '2.4.6': 'Headings and Labels',
    '2.4.7': 'Focus Visible',
    '3.1.1': 'Language of Page',
    '3.1.2': 'Language of Parts',
    '3.2.1': 'On Focus',
    '3.2.2': 'On Input',
    '3.3.1': 'Error Identification',
    '3.3.2': 'Labels or Instructions',
    '4.1.1': 'Parsing',
    '4.1.2': 'Name, Role, Value',
  }
  return criteria[code] || code
}

/**
 * Gets impact description
 */
export function getImpactDescription(impact: string): string {
  const descriptions: Record<string, string> = {
    critical: 'Prevents users from completing essential tasks',
    serious: 'Creates significant barriers for users',
    moderate: 'Causes issues for some users',
    minor: 'Minor inconvenience or improvement opportunity',
  }
  return descriptions[impact] || impact
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Gets user accessibility settings
 */
export async function getAccessibilitySettings(
  userId?: string
): Promise<AccessibilitySettings> {
  const supabase = createClient()

  if (userId) {
    const { data, error } = await supabase
      .from('accessibility_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!error && data) {
      return mapSettingsFromDB(data)
    }
  }

  // Return default settings
  return getDefaultSettings(userId)
}

/**
 * Updates accessibility settings
 */
export async function updateAccessibilitySettings(
  userId: string,
  input: UpdateAccessibilitySettingsInput
): Promise<AccessibilitySettings> {
  const validationResult = updateAccessibilitySettingsSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid settings: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Check existing
  const { data: existing } = await supabase
    .from('accessibility_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.textSize !== undefined) updateData.text_size = input.textSize
  if (input.textSizeMultiplier !== undefined) updateData.text_size_multiplier = input.textSizeMultiplier
  if (input.highContrast !== undefined) updateData.high_contrast = input.highContrast
  if (input.reduceMotion !== undefined) updateData.reduce_motion = input.reduceMotion
  if (input.colorBlindMode !== undefined) updateData.color_blind_mode = input.colorBlindMode
  if (input.focusIndicators !== undefined) updateData.focus_indicators = input.focusIndicators
  if (input.focusIndicatorSize !== undefined) updateData.focus_indicator_size = input.focusIndicatorSize
  if (input.screenOrientation !== undefined) updateData.screen_orientation = input.screenOrientation
  if (input.lineSpacing !== undefined) updateData.line_spacing = input.lineSpacing
  if (input.wordSpacing !== undefined) updateData.word_spacing = input.wordSpacing
  if (input.customColors !== undefined) updateData.custom_colors = input.customColors
  if (input.fontFamily !== undefined) updateData.font_family = input.fontFamily
  if (input.screenReaderOptimized !== undefined) updateData.screen_reader_optimized = input.screenReaderOptimized
  if (input.announceAlerts !== undefined) updateData.announce_alerts = input.announceAlerts
  if (input.describeImages !== undefined) updateData.describe_images = input.describeImages
  if (input.keyboardNavigation !== undefined) updateData.keyboard_navigation = input.keyboardNavigation
  if (input.shortcutsEnabled !== undefined) updateData.shortcuts_enabled = input.shortcutsEnabled
  if (input.externalAssistiveDevices !== undefined) updateData.external_assistive_devices = input.externalAssistiveDevices

  let data
  if (existing) {
    const { data: updated, error } = await supabase
      .from('accessibility_settings')
      .update(updateData)
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating settings:', error)
      throw new Error(`Failed to update: ${error.message}`)
    }

    data = updated
  } else {
    const { data: created, error } = await supabase
      .from('accessibility_settings')
      .insert({
        user_id: userId,
        ...updateData,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating settings:', error)
      throw new Error(`Failed to create: ${error.message}`)
    }

    data = created
  }

  return mapSettingsFromDB(data)
}

/**
 * Resets accessibility settings to defaults
 */
export async function resetAccessibilitySettings(userId: string): Promise<AccessibilitySettings> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('accessibility_settings')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error resetting settings:', error)
  }

  return getDefaultSettings(userId)
}

/**
 * Creates accessibility audit
 */
export async function createAccessibilityAudit(
  input: CreateAuditInput
): Promise<AccessibilityAudit> {
  const validationResult = createAuditSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid audit: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const auditId = `audit_${Date.now()}`

  const { data, error } = await supabase
    .from('accessibility_audits')
    .insert({
      id: auditId,
      page_url: input.pageUrl,
      page_title: input.pageTitle,
      score: input.score,
      issues: input.issues,
      tested_with: input.testedWith,
      is_resolved: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating audit:', error)
    throw new Error(`Failed to create audit: ${error.message}`)
  }

  return {
    id: data.id as string,
    pageUrl: data.page_url as string,
    pageTitle: data.page_title as string,
    score: data.score,
    issues: data.issues.map((issue: Record<string, unknown>) => ({
      id: issue.id,
      severity: issue.severity,
      wcagCriteria: issue.wcagCriteria,
      description: issue.description,
      impact: issue.impact,
      element: issue.element,
      suggestion: issue.suggestion,
    })),
    testedWith: data.tested_with,
    testedAt: data.created_at as string,
    isResolved: data.is_resolved as boolean,
    createdAt: data.created_at as string,
  }
}

/**
 * Gets accessibility audits
 */
export async function getAccessibilityAudits(
  options?: {
    pageUrl?: string
    resolved?: boolean
    limit?: number
  }
): Promise<AccessibilityAudit[]> {
  const supabase = createClient()

  let query = supabase
    .from('accessibility_audits')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.pageUrl) {
    query = query.eq('page_url', options.pageUrl)
  }

  if (options?.resolved !== undefined) {
    query = query.eq('is_resolved', options.resolved)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching audits:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id as string,
    pageUrl: data.page_url as string,
    pageTitle: data.page_title as string,
    score: data.score,
    issues: data.issues || [],
    testedWith: data.tested_with,
    testedAt: data.created_at as string,
    isResolved: data.is_resolved as boolean,
    resolvedAt: data.resolved_at as string || undefined,
    createdAt: data.created_at as string,
  }))
}

/**
 * Marks audit issue as fixed
 */
export async function markAuditIssueFixed(
  auditId: string,
  issueId: string
): Promise<void> {
  const supabase = createClient()

  // Get current audit
  const { data: audit } = await supabase
    .from('accessibility_audits')
    .select('*')
    .eq('id', auditId)
    .single()

  if (!audit) {
    throw new Error('Audit not found')
  }

  // Update specific issue
  const issues = audit.issues || []
  const issueIndex = issues.findIndex((i: Record<string, unknown>) => i.id === issueId)
  
  if (issueIndex === -1) {
    throw new Error('Issue not found')
  }

  issues[issueIndex] = {
    ...issues[issueIndex],
    fixedAt: new Date().toISOString(),
  }

  // Check if all issues are resolved
  const allResolved = issues.every((i: Record<string, unknown>) => i.fixedAt)

  await supabase
    .from('accessibility_audits')
    .update({
      issues,
      is_resolved: allResolved,
      resolved_at: allResolved ? new Date().toISOString() : null,
    })
    .eq('id', auditId)
}

/**
 * Gets accessibility score summary
 */
export async function getAccessibilityScoreSummary(): Promise<{
  overall: number
  byPage: Array<{ page: string; score: number }>
  byCriteria: Array<{ criteria: string; passRate: number }>
  trend: Array<{ date: string; score: number }>
}> {
  const supabase = createClient()

  // Get all audits
  const { data: audits } = await supabase
    .from('accessibility_audits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (!audits || audits.length === 0) {
    return {
      overall: 100,
      byPage: [],
      byCriteria: [],
      trend: [],
    }
  }

  // Calculate overall score
  const overall = Math.round(
    audits.reduce((sum: number, a: Record<string, unknown>) => sum + (a.score as number), 0) / audits.length
  )

  // By page
  const pageScores = new Map<string, { total: number; count: number }>()
  for (const audit of audits) {
    const key = audit.page_url
    const existing = pageScores.get(key) || { total: 0, count: 0 }
    existing.total += audit.score
    existing.count++
    pageScores.set(key, existing)
  }

  const byPage = Array.from(pageScores.entries()).map(([page, { total, count }]) => ({
    page,
    score: Math.round(total / count),
  }))

  // By criteria
  const criteriaCounts = new Map<string, { pass: number; total: number }>()
  for (const audit of audits) {
    const issues = audit.issues || []
    for (const issue of issues) {
      const criteria = issue.wcagCriteria
      const existing = criteriaCounts.get(criteria) || { pass: 0, total: 0 }
      existing.total++
      if (issue.fixedAt) {
        existing.pass++
      }
      criteriaCounts.set(criteria, existing)
    }
  }

  const byCriteria = Array.from(criteriaCounts.entries()).map(([criteria, { pass, total }]) => ({
    criteria,
    passRate: Math.round((pass / total) * 100),
  }))

  // Trend (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentAudits = audits.filter(
    (a: Record<string, unknown>) => new Date(a.created_at as string) >= thirtyDaysAgo
  )

  const trendMap = new Map<string, { total: number; count: number }>()
  for (const audit of recentAudits) {
    const date = (audit.created_at as string).split('T')[0]
    const existing = trendMap.get(date) || { total: 0, count: 0 }
    existing.total += audit.score
    existing.count++
    trendMap.set(date, existing)
  }

  const trend = Array.from(trendMap.entries())
    .map(([date, { total, count }]) => ({ date, score: Math.round(total / count) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    overall,
    byPage,
    byCriteria,
    trend,
  }
}

/**
 * Creates screen reader announcement
 */
export async function createScreenReaderAnnouncement(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
  pageSection?: string
): Promise<ScreenReaderAnnouncement> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('screen_reader_announcements')
    .insert({
      message,
      priority,
      page_section: pageSection || null,
      is_read: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating announcement:', error)
    throw new Error(`Failed to create announcement: ${error.message}`)
  }

  return {
    id: data.id as string,
    message: data.message as string,
    priority: data.priority as number,
    pageSection: data.page_section || undefined,
    isRead: data.is_read as boolean,
    createdAt: data.created_at as string,
  }
}

/**
 * Gets unread announcements
 */
export async function getUnreadAnnouncements(): Promise<ScreenReaderAnnouncement[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('screen_reader_announcements')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching announcements:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id as string,
    message: data.message as string,
    priority: data.priority as number,
    pageSection: data.page_section || undefined,
    isRead: data.is_read as boolean,
    readAt: data.read_at as string || undefined,
    createdAt: data.created_at as string,
  }))
}

/**
 * Marks announcement as read
 */
export async function markAnnouncementRead(announcementId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('screen_reader_announcements')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', announcementId)
}

/**
 * Gets accessibility shortcuts
 */
export async function getAccessibilityShortcuts(): Promise<AccessibilityShortcut[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('accessibility_shortcuts')
    .select('*')
    .eq('is_enabled', true)
    .order('key')

  if (error) {
    console.error('Error fetching shortcuts:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id as string,
    key: data.key as string,
    modifiers: data.modifiers,
    action: data.action as string,
    description: data.description as string,
    isEnabled: data.is_enabled as boolean,
    createdAt: data.created_at as string,
  }))
}

/**
 * Generates CSS for accessibility settings
 */
export function generateAccessibilityCSS(settings: AccessibilitySettings): string {
  const css: string[] = []

  // Text size
  const multipliers: Record<TextSizePreset, number> = {
    small: 0.8,
    medium: 1,
    large: 1.25,
    extra_large: 1.5,
    maximum: 2,
  }
  const multiplier = settings.textSizeMultiplier * multipliers[settings.textSize]
  css.push(`html { font-size: ${multiplier * 16}px; }`)

  // Line spacing
  css.push(`body { line-height: ${settings.lineSpacing}; }`)

  // Word spacing
  if (settings.wordSpacing > 0) {
    css.push(`body { word-spacing: ${settings.wordSpacing}em; }`)
  }

  // Focus indicators
  if (settings.focusIndicators) {
    css.push(`
      *:focus {
        outline: ${settings.focusIndicatorSize}px solid #2563eb;
        outline-offset: 2px;
      }
    `)
  }

  // High contrast
  if (settings.highContrast === 'light') {
    css.push(`
      * { background-color: #fff !important; color: #000 !important; }
      a { text-decoration: underline !important; }
    `)
  } else if (settings.highContrast === 'dark') {
    css.push(`
      * { background-color: #000 !important; color: #fff !important; }
      a { text-decoration: underline !important; }
    `)
  } else if (settings.highContrast === 'custom' && settings.customColors) {
    const { primary, secondary, background, text, link } = settings.customColors
    css.push(`
      :root {
        --color-primary: ${primary};
        --color-secondary: ${secondary};
        --color-background: ${background};
        --color-text: ${text};
        --color-link: ${link};
      }
    `)
  }

  // Reduce motion
  if (settings.reduceMotion) {
    css.push(`
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `)
  }

  // Font family
  const fonts: Record<FontFamilyType, string> = {
    default: 'system-ui, -apple-system, sans-serif',
    dyslexic: '"OpenDyslexic", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
    serif: 'Georgia, "Times New Roman", serif',
    sans_serif: 'system-ui, -apple-system, sans-serif',
  }
  css.push(`body { font-family: ${fonts[settings.fontFamily]}; }`)

  return css.join('\n')
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets default accessibility settings
 */
function getDefaultSettings(userId?: string): AccessibilitySettings {
  return {
    id: '',
    userId,
    textSize: 'medium',
    textSizeMultiplier: 1,
    highContrast: 'off',
    reduceMotion: false,
    colorBlindMode: 'none',
    focusIndicators: true,
    focusIndicatorSize: 2,
    screenOrientation: 'auto',
    lineSpacing: 1.5,
    wordSpacing: 0,
    fontFamily: 'default',
    screenReaderOptimized: false,
    announceAlerts: true,
    describeImages: true,
    keyboardNavigation: true,
    shortcutsEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Maps database record to settings
 */
function mapSettingsFromDB(data: Record<string, unknown>): AccessibilitySettings {
  return {
    id: data.id as string,
    userId: data.user_id as string | undefined,
    textSize: data.text_size as TextSizePreset,
    textSizeMultiplier: data.text_size_multiplier as number,
    highContrast: data.high_contrast as HighContrastMode,
    reduceMotion: data.reduce_motion as boolean,
    colorBlindMode: data.color_blind_mode as ColorBlindMode,
    focusIndicators: data.focus_indicators as boolean,
    focusIndicatorSize: data.focus_indicator_size as number,
    screenOrientation: data.screen_orientation as ScreenOrientation,
    lineSpacing: data.line_spacing as number,
    wordSpacing: data.word_spacing as number,
    customColors: data.custom_colors as AccessibilitySettings['customColors'] | undefined,
    fontFamily: data.font_family as FontFamilyType,
    screenReaderOptimized: data.screen_reader_optimized as boolean,
    announceAlerts: data.announce_alerts as boolean,
    describeImages: data.describe_images as boolean,
    keyboardNavigation: data.keyboard_navigation as boolean,
    shortcutsEnabled: data.shortcuts_enabled as boolean,
    externalAssistiveDevices: data.external_assistive_devices as string[] | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Checks WCAG compliance for element
 */
export function checkWCAGCompliance(
  element: {
    hasAltText: boolean
    hasAriaLabel: boolean
    hasLabel: boolean
    isKeyboardAccessible: boolean
    hasFocusOrder: boolean
    hasSufficientContrast: boolean
    textSizeAdjustable: boolean
  }
): {
  compliant: boolean
  issues: Array<{ criteria: string; issue: string }>
} {
  const issues: Array<{ criteria: string; issue: string }> = []

  if (!element.hasAltText && !element.hasAriaLabel) {
    issues.push({ criteria: '1.1.1', issue: 'Missing alternative text' })
  }

  if (!element.hasLabel && !element.hasAriaLabel) {
    issues.push({ criteria: '3.3.2', issue: 'Missing label' })
  }

  if (!element.isKeyboardAccessible) {
    issues.push({ criteria: '2.1.1', issue: 'Not keyboard accessible' })
  }

  if (!element.hasFocusOrder) {
    issues.push({ criteria: '2.4.3', issue: 'Incorrect focus order' })
  }

  if (!element.hasSufficientContrast) {
    issues.push({ criteria: '1.4.3', issue: 'Insufficient color contrast' })
  }

  if (!element.textSizeAdjustable) {
    issues.push({ criteria: '1.4.4', issue: 'Text cannot be resized' })
  }

  return {
    compliant: issues.length === 0,
    issues,
  }
}
