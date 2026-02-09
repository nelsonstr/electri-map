import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Deep link action type
 */
export type DeepLinkAction =
  | 'view_alert'
  | 'view_incident'
  | 'view_outage'
  | 'view_safe_zone'
  | 'view_group'
  | 'view_profile'
  | 'view_settings'
  | 'create_report'
  | 'navigate'
  | 'share'
  | 'emergency'

/**
 * Deep link source
 */
export type DeepLinkSource =
  | 'push_notification'
  | 'sms'
  | 'email'
  | 'social_media'
  | 'external_website'
  | 'qr_code'
  | 'app_clipboard'

/**
 * Deep link route
 */
export interface DeepLinkRoute {
  path: string
  action: DeepLinkAction
  params: Record<string, string | number | boolean>
}

/**
 * Deep link configuration
 */
export interface DeepLinkConfig {
  id: string
  
  // Route info
  path: string
  action: DeepLinkAction
  
  // Requirements
  requiredParams: string[]
  optionalParams: string[]
  
  // Behavior
  requiresAuth: boolean
  requiresVerified: boolean
  
  // Fallback
  fallbackUrl?: string
  deeplinkFallback?: string
  
  // Metadata
  title: string
  description?: string
  
  // Tracking
  trackingEnabled: boolean
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  
  // Status
  isActive: boolean
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Deep link analytics event
 */
export interface DeepLinkAnalytics {
  id: string
  
  // Link info
  routeId: string
  path: string
  source: DeepLinkSource
  
  // User context
  userId?: string
  sessionId?: string
  
  // Device context
  deviceId?: string
  platform?: string
  
  // Parameters
  params: Record<string, string>
  utmParams?: Record<string, string>
  
  // Result
  outcome: 'success' | 'fallback' | 'error'
  errorMessage?: string
  
  // Timestamps
  clickedAt: string
  resolvedAt?: string
}

/**
 * Short link
 */
export interface ShortLink {
  id: string
  
  // Target
  targetPath: string
  targetParams: Record<string, string>
  
  // Short code
  code: string
  
  // Metadata
  title?: string
  description?: string
  
  // Tracking
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  
  // Expiration
  expiresAt?: string
  maxClicks?: number
  
  // Statistics
  clickCount: number
  uniqueClickCount: number
  
  // Status
  isActive: boolean
  
  // Creator
  createdBy?: string
  
  // Timestamps
  createdAt: string
  lastClickedAt?: string
}

/**
 * Create short link input
 */
export interface CreateShortLinkInput {
  targetPath: string
  targetParams?: Record<string, string>
  title?: string
  description?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  expiresAt?: string
  maxClicks?: number
}

/**
 * Deep link error
 */
export interface DeepLinkError {
  code: string
  message: string
  path?: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating short link
 */
export const createShortLinkSchema = z.object({
  targetPath: z.string().min(1).startsWith('/'),
  targetParams: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  maxClicks: z.number().positive().optional(),
})

/**
 * Schema for resolving deep link
 */
export const resolveDeepLinkSchema = z.object({
  path: z.string().min(1),
  source: z.enum(['push_notification', 'sms', 'email', 'social_media', 'external_website', 'qr_code', 'app_clipboard']),
  params: z.record(z.string()).optional(),
  utmParams: z.record(z.string()).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for action
 */
export function getDeepLinkActionDisplayName(action: DeepLinkAction): string {
  const names: Record<DeepLinkAction, string> = {
    view_alert: 'View Alert',
    view_incident: 'View Incident',
    view_outage: 'View Outage',
    view_safe_zone: 'View Safe Zone',
    view_group: 'View Group',
    view_profile: 'View Profile',
    view_settings: 'View Settings',
    create_report: 'Create Report',
    navigate: 'Navigate',
    share: 'Share',
    emergency: 'Emergency',
  }
  return names[action]
}

/**
 * Gets display name for source
 */
export function getDeepLinkSourceDisplayName(source: DeepLinkSource): string {
  const names: Record<DeepLinkSource, string> = {
    push_notification: 'Push Notification',
    sms: 'SMS',
    email: 'Email',
    social_media: 'Social Media',
    external_website: 'External Website',
    qr_code: 'QR Code',
    app_clipboard: 'App Clipboard',
  }
  return names[source]
}

/**
 * Generates short code
 */
function generateShortCode(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Validates URL path
 */
function isValidPath(path: string): boolean {
  // Allow alphanumeric, slashes, hyphens, underscores, and query params
  const pathRegex = /^\/[a-zA-Z0-9\-_/=?]*$/
  return pathRegex.test(path)
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Resolves deep link path to route
 */
export async function resolveDeepLink(
  path: string,
  source: DeepLinkSource,
  params?: Record<string, string>,
  utmParams?: Record<string, string>
): Promise<{
  route: DeepLinkRoute
  config?: DeepLinkConfig
}> {
  const validationResult = resolveDeepLinkSchema.safeParse({ path, source, params, utmParams })
  if (!validationResult.success) {
    throw new DeepLinkError('INVALID_PATH', 'Invalid deep link path')
  }

  const supabase = createClient()

  // Try to find matching route config
  const { data: config } = await supabase
    .from('deep_link_configs')
    .select('*')
    .eq('path', path)
    .eq('is_active', true)
    .single()

  // Determine action from path
  const action = determineActionFromPath(path)
  
  // Parse params from path
  const parsedParams = parseParamsFromPath(path, params || {})

  // Validate required params
  if (config) {
    const missingParams = config.required_params.filter(
      (p: string) => !parsedParams[p]
    )
    
    if (missingParams.length > 0) {
      throw new DeepLinkError(
        'MISSING_PARAMS',
        `Missing required parameters: ${missingParams.join(', ')}`,
        path
      )
    }
  }

  const route: DeepLinkRoute = {
    path,
    action,
    params: parsedParams,
  }

  // Log analytics
  await logDeepLinkAnalytics({
    routeId: config?.id || 'unknown',
    path,
    source,
    params: parsedParams,
    utmParams,
    outcome: 'success',
  })

  return {
    route,
    config: config ? {
      id: config.id,
      path: config.path,
      action: config.action as DeepLinkAction,
      requiredParams: config.required_params,
      optionalParams: config.optional_params,
      requiresAuth: config.requires_auth,
      requiresVerified: config.requires_verified,
      fallbackUrl: config.fallback_url || undefined,
      deeplinkFallback: config.deeplink_fallback || undefined,
      title: config.title,
      description: config.description || undefined,
      trackingEnabled: config.tracking_enabled,
      utmSource: config.utm_source || undefined,
      utmMedium: config.utm_medium || undefined,
      utmCampaign: config.utm_campaign || undefined,
      isActive: config.is_active,
      createdAt: config.created_at,
      updatedAt: config.updated_at,
    } : undefined,
  }
}

/**
 * Creates a short link
 */
export async function createShortLink(
  input: CreateShortLinkInput,
  createdBy?: string
): Promise<ShortLink> {
  const validationResult = createShortLinkSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid short link: ${validationResult.error.message}`)
  }

  if (!isValidPath(input.targetPath)) {
    throw new DeepLinkError('INVALID_PATH', 'Invalid target path')
  }

  const supabase = createClient()

  // Generate unique short code
  let code = generateShortCode()
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('short_links')
      .select('id')
      .eq('code', code)
      .single()

    if (!existing) {
      break
    }

    code = generateShortCode()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique short code')
  }

  const { data, error } = await supabase
    .from('short_links')
    .insert({
      target_path: input.targetPath,
      target_params: input.targetParams || {},
      code,
      title: input.title || null,
      description: input.description || null,
      utm_source: input.utmSource || null,
      utm_medium: input.utmMedium || null,
      utm_campaign: input.utmCampaign || null,
      expires_at: input.expiresAt || null,
      max_clicks: input.maxClicks || null,
      is_active: true,
      created_by: createdBy || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating short link:', error)
    throw new Error(`Failed to create short link: ${error.message}`)
  }

  return {
    id: data.id,
    targetPath: data.target_path,
    targetParams: data.target_params,
    code: data.code,
    title: data.title || undefined,
    description: data.description || undefined,
    utmSource: data.utm_source || undefined,
    utmMedium: data.utm_medium || undefined,
    utmCampaign: data.utm_campaign || undefined,
    expiresAt: data.expires_at || undefined,
    maxClicks: data.max_clicks || undefined,
    clickCount: data.click_count,
    uniqueClickCount: data.unique_click_count,
    isActive: data.is_active,
    createdBy: data.created_by || undefined,
    createdAt: data.created_at,
  }
}

/**
 * Resolves short link
 */
export async function resolveShortLink(
  code: string,
  options?: {
    userId?: string
    sessionId?: string
    deviceId?: string
    platform?: string
  }
): Promise<{
  targetPath: string
  targetParams: Record<string, string>
  utmParams?: Record<string, string>
}> {
  const supabase = createClient()

  // Find short link
  const { data: shortLink, error } = await supabase
    .from('short_links')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (error || !shortLink) {
    throw new DeepLinkError('LINK_NOT_FOUND', 'Short link not found or expired')
  }

  // Check expiration
  if (shortLink.expires_at && new Date(shortLink.expires_at) < new Date()) {
    throw new DeepLinkError('LINK_EXPIRED', 'Short link has expired')
  }

  // Check max clicks
  if (shortLink.max_clicks && shortLink.click_count >= shortLink.max_clicks) {
    throw new DeepLinkError('LINK_EXPIRED', 'Short link has reached maximum clicks')
  }

  // Update click count
  const { error: updateError } = await supabase
    .from('short_links')
    .update({
      click_count: shortLink.click_count + 1,
      last_clicked_at: new Date().toISOString(),
    })
    .eq('id', shortLink.id)

  if (updateError) {
    console.error('Error updating click count:', updateError)
  }

  // Log analytics
  await supabase
    .from('short_link_analytics')
    .insert({
      short_link_id: shortLink.id,
      target_path: shortLink.target_path,
      user_id: options?.userId || null,
      session_id: options?.sessionId || null,
      device_id: options?.deviceId || null,
      platform: options?.platform || null,
      clicked_at: new Date().toISOString(),
    })

  return {
    targetPath: shortLink.target_path,
    targetParams: shortLink.target_params,
    utmParams: shortLink.utm_source ? {
      utm_source: shortLink.utm_source,
      utm_medium: shortLink.utm_medium || '',
      utm_campaign: shortLink.utm_campaign || '',
    } : undefined,
  }
}

/**
 * Gets short link by ID
 */
export async function getShortLink(shortLinkId: string): Promise<ShortLink | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('short_links')
    .select('*')
    .eq('id', shortLinkId)
    .single()

  if (error) {
    console.error('Error fetching short link:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    targetPath: data.target_path,
    targetParams: data.target_params,
    code: data.code,
    title: data.title || undefined,
    description: data.description || undefined,
    utmSource: data.utm_source || undefined,
    utmMedium: data.utm_medium || undefined,
    utmCampaign: data.utm_campaign || undefined,
    expiresAt: data.expires_at || undefined,
    maxClicks: data.max_clicks || undefined,
    clickCount: data.click_count,
    uniqueClickCount: data.unique_click_count,
    isActive: data.is_active,
    createdBy: data.created_by || undefined,
    createdAt: data.created_at,
    lastClickedAt: data.last_clicked_at || undefined,
  }
}

/**
 * Deactivates short link
 */
export async function deactivateShortLink(shortLinkId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('short_links')
    .update({
      is_active: false,
    })
    .eq('id', shortLinkId)

  if (error) {
    console.error('Error deactivating short link:', error)
    throw new Error(`Failed to deactivate: ${error.message}`)
  }
}

/**
 * Gets user short links
 */
export async function getUserShortLinks(
  userId: string,
  activeOnly: boolean = true
): Promise<ShortLink[]> {
  const supabase = createClient()

  let query = supabase
    .from('short_links')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching short links:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id,
    targetPath: data.target_path,
    targetParams: data.target_params,
    code: data.code,
    title: data.title || undefined,
    description: data.description || undefined,
    utmSource: data.utm_source || undefined,
    utmMedium: data.utm_medium || undefined,
    utmCampaign: data.utm_campaign || undefined,
    expiresAt: data.expires_at || undefined,
    maxClicks: data.max_clicks || undefined,
    clickCount: data.click_count,
    uniqueClickCount: data.unique_click_count,
    isActive: data.is_active,
    createdBy: data.created_by || undefined,
    createdAt: data.created_at,
    lastClickedAt: data.last_clicked_at || undefined,
  }))
}

/**
 * Gets short link statistics
 */
export async function getShortLinkStats(
  shortLinkId: string
): Promise<{
  totalClicks: number
  uniqueClicks: number
  clicksBySource: Record<DeepLinkSource, number>
  clicksByDay: Array<{ date: string; count: number }>
}> {
  const supabase = createClient()

  const shortLink = await getShortLink(shortLinkId)
  if (!shortLink) {
    throw new Error('Short link not found')
  }

  // Get clicks by source
  const { data: analytics } = await supabase
    .from('short_link_analytics')
    .select('source, clicked_at')
    .eq('short_link_id', shortLinkId)

  const clicksBySource: Record<DeepLinkSource, number> = {
    push_notification: 0,
    sms: 0,
    email: 0,
    social_media: 0,
    external_website: 0,
    qr_code: 0,
    app_clipboard: 0,
  }

  for (const a of analytics || []) {
    if (clicksBySource[a.source as DeepLinkSource] !== undefined) {
      clicksBySource[a.source as DeepLinkSource]++
    }
  }

  // Get clicks by day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: dailyData } = await supabase
    .from('short_link_analytics')
    .select('clicked_at')
    .eq('short_link_id', shortLinkId)
    .gte('clicked_at', thirtyDaysAgo.toISOString())

  const clicksByDayMap = new Map<string, number>()
  
  for (const d of dailyData || []) {
    const date = d.clicked_at.split('T')[0]
    clicksByDayMap.set(date, (clicksByDayMap.get(date) || 0) + 1)
  }

  const clicksByDay = Array.from(clicksByDayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalClicks: shortLink.clickCount,
    uniqueClicks: shortLink.uniqueClickCount,
    clicksBySource,
    clicksByDay,
  }
}

/**
 * Creates deep link configuration
 */
export async function createDeepLinkConfig(
  config: Omit<DeepLinkConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DeepLinkConfig> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('deep_link_configs')
    .insert({
      path: config.path,
      action: config.action,
      required_params: config.requiredParams,
      optional_params: config.optionalParams,
      requires_auth: config.requiresAuth,
      requires_verified: config.requiresVerified,
      fallback_url: config.fallbackUrl || null,
      deeplink_fallback: config.deeplinkFallback || null,
      title: config.title,
      description: config.description || null,
      tracking_enabled: config.trackingEnabled,
      utm_source: config.utmSource || null,
      utm_medium: config.utmMedium || null,
      utm_campaign: config.utmCampaign || null,
      is_active: config.isActive,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating config:', error)
    throw new Error(`Failed to create config: ${error.message}`)
  }

  return {
    id: data.id,
    path: data.path,
    action: data.action as DeepLinkAction,
    requiredParams: data.required_params,
    optionalParams: data.optional_params,
    requiresAuth: data.requires_auth,
    requiresVerified: data.requires_verified,
    fallbackUrl: data.fallback_url || undefined,
    deeplinkFallback: data.deeplink_fallback || undefined,
    title: data.title,
    description: data.description || undefined,
    trackingEnabled: data.tracking_enabled,
    utmSource: data.utm_source || undefined,
    utmMedium: data.utm_medium || undefined,
    utmCampaign: data.utm_campaign || undefined,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Gets all active deep link configs
 */
export async function getDeepLinkConfigs(): Promise<DeepLinkConfig[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('deep_link_configs')
    .select('*')
    .eq('is_active', true)
    .order('path')

  if (error) {
    console.error('Error fetching configs:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id,
    path: data.path,
    action: data.action as DeepLinkAction,
    requiredParams: data.required_params,
    optionalParams: data.optional_params,
    requiresAuth: data.requires_auth,
    requiresVerified: data.requires_verified,
    fallbackUrl: data.fallback_url || undefined,
    deeplinkFallback: data.deeplink_fallback || undefined,
    title: data.title,
    description: data.description || undefined,
    trackingEnabled: data.tracking_enabled,
    utmSource: data.utm_source || undefined,
    utmMedium: data.utm_medium || undefined,
    utmCampaign: data.utm_campaign || undefined,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }))
}

/**
 * Updates deep link config
 */
export async function updateDeepLinkConfig(
  configId: string,
  updates: Partial<Omit<DeepLinkConfig, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<DeepLinkConfig> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.path) updateData.path = updates.path
  if (updates.action) updateData.action = updates.action
  if (updates.requiredParams) updateData.required_params = updates.requiredParams
  if (updates.optionalParams) updateData.optional_params = updates.optionalParams
  if (updates.requiresAuth !== undefined) updateData.requires_auth = updates.requiresAuth
  if (updates.requiresVerified !== undefined) updateData.requires_verified = updates.requiresVerified
  if (updates.fallbackUrl !== undefined) updateData.fallback_url = updates.fallbackUrl
  if (updates.deeplinkFallback !== undefined) updateData.deeplink_fallback = updates.deeplinkFallback
  if (updates.title) updateData.title = updates.title
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.trackingEnabled !== undefined) updateData.tracking_enabled = updates.trackingEnabled
  if (updates.utmSource !== undefined) updateData.utm_source = updates.utmSource
  if (updates.utmMedium !== undefined) updateData.utm_medium = updates.utmMedium
  if (updates.utmCampaign !== undefined) updateData.utm_campaign = updates.utmCampaign
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive

  const { data, error } = await supabase
    .from('deep_link_configs')
    .update(updateData)
    .eq('id', configId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating config:', error)
    throw new Error(`Failed to update: ${error.message}`)
  }

  return {
    id: data.id,
    path: data.path,
    action: data.action as DeepLinkAction,
    requiredParams: data.required_params,
    optionalParams: data.optional_params,
    requiresAuth: data.requires_auth,
    requiresVerified: data.requires_verified,
    fallbackUrl: data.fallback_url || undefined,
    deeplinkFallback: data.deeplink_fallback || undefined,
    title: data.title,
    description: data.description || undefined,
    trackingEnabled: data.tracking_enabled,
    utmSource: data.utm_source || undefined,
    utmMedium: data.utm_medium || undefined,
    utmCampaign: data.utm_campaign || undefined,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determines action from path
 */
function determineActionFromPath(path: string): DeepLinkAction {
  const pathLower = path.toLowerCase()
  
  if (pathLower.includes('/alert/')) return 'view_alert'
  if (pathLower.includes('/incident/')) return 'view_incident'
  if (pathLower.includes('/outage/')) return 'view_outage'
  if (pathLower.includes('/safe-zone/')) return 'view_safe_zone'
  if (pathLower.includes('/group/')) return 'view_group'
  if (pathLower.includes('/profile/')) return 'view_profile'
  if (pathLower.includes('/settings')) return 'view_settings'
  if (pathLower.includes('/report')) return 'create_report'
  if (pathLower.includes('/navigate')) return 'navigate'
  if (pathLower.includes('/share')) return 'share'
  if (pathLower.includes('/emergency')) return 'emergency'
  
  return 'view_alert' // default
}

/**
 * Parses parameters from path
 */
function parseParamsFromPath(
  path: string,
  additionalParams: Record<string, string>
): Record<string, string> {
  const params: Record<string, string> = { ...additionalParams }
  
  // Parse path segments
  const segments = path.split('/').filter(Boolean)
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    
    // Check for ID patterns
    if (segment.match(/^[a-f0-9-]{36}$/)) {
      params.id = segment
    } else if (segment.match(/^[a-z]+-[a-z0-9]+$/)) {
      const nextSegment = segments[i + 1]
      if (nextSegment && nextSegment.match(/^[a-f0-9-]+$/)) {
        params.type = segment
        params.slug = nextSegment
        i++
      }
    }
  }
  
  // Parse query params from path
  const queryIndex = path.indexOf('?')
  if (queryIndex !== -1) {
    const queryString = path.substring(queryIndex + 1)
    const queryParams = new URLSearchParams(queryString)
    
    for (const [key, value] of queryParams) {
      params[key] = value
    }
  }
  
  return params
}

/**
 * Logs deep link analytics
 */
async function logDeepLinkAnalytics(event: {
  routeId: string
  path: string
  source: DeepLinkSource
  params: Record<string, string>
  utmParams?: Record<string, string>
  outcome: 'success' | 'fallback' | 'error'
  errorMessage?: string
}): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('deep_link_analytics')
    .insert({
      route_id: event.routeId,
      path: event.path,
      source: event.source,
      params: event.params,
      utm_params: event.utmParams || null,
      outcome: event.outcome,
      error_message: event.errorMessage || null,
      clicked_at: new Date().toISOString(),
    })
    .catch(err => console.error('Error logging analytics:', err))
}

/**
 * Builds full deep link URL
 */
export function buildDeepLinkUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string>
): string {
  const url = new URL(path, baseUrl)
  
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  
  return url.toString()
}

/**
 * Builds universal/app links
 */
export function buildUniversalLink(
  hostname: string,
  path: string,
  params?: Record<string, string>
): string {
  return buildDeepLinkUrl(`https://${hostname}`, path, params)
}

/**
 * Builds intent links for Android
 */
export function buildAndroidIntent(
  packageName: string,
  path: string,
  params?: Record<string, string>
): string {
  const deepLink = buildDeepLinkUrl('https://neighborpulse.app', path, params)
  return `intent://neighborpulse.app${path}#Intent;scheme=https;package=${packageName};S.browser_fallback_url=${encodeURIComponent(deepLink)};end;`
}
