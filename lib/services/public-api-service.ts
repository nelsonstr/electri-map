import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * API key tier
 */
export type APIKeyTier = 
  | 'free'
  | 'basic'
  | 'professional'
  | 'enterprise'
  | 'partner'

/**
 * API endpoint category
 */
export type APIEndpointCategory = 
  | 'alerts'
  | 'outages'
  | 'weather'
  | 'status'
  | 'locations'
  | 'analytics'
  | 'users'
  | 'webhooks'

/**
 * API authentication method
 */
export type APIAuthMethod = 
  | 'api_key'
  | 'oauth2'
  | 'jwt'
  | 'basic'
  | 'none'

/**
 * Rate limit tier
 */
export interface RateLimitTier {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  requestsPerMonth: number
  burstLimit: number
}

/**
 * API key information
 */
export interface APIKey {
  id: string
  keyId: string
  
  // Key info
  name: string
  description?: string
  tier: APIKeyTier
  
  // Credentials
  keyPrefix: string
  hashedKey: string
  
  // Owner
  userId?: string
  organizationId?: string
  
  // Permissions
  permissions: string[]
  allowedEndpoints: APIEndpointCategory[]
  allowedOrigins?: string[]
  ipWhitelist?: string[]
  
  // Rate limits
  rateLimit: RateLimitTier
  
  // Usage
  usage: {
    requestsToday: number
    requestsThisMonth: number
    quotaUsed: number
    quotaTotal: number
  }
  
  // Status
  status: 'active' | 'inactive' | 'revoked' | 'expired'
  
  // Expiry
  expiresAt?: string
  lastUsedAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * API endpoint definition
 */
export interface APIEndpoint {
  id: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  category: APIEndpointCategory
  
  // Description
  summary: string
  description?: string
  
  // Authentication
  authRequired: boolean
  authMethods: APIAuthMethod[]
  
  // Rate limiting
  rateLimited: boolean
  rateLimitOverride?: RateLimitTier
  
  // Caching
  cacheable: boolean
  cacheDurationSeconds?: number
  
  // Documentation
  documentationUrl?: string
  openApiSpec?: Record<string, unknown>
  
  // Status
  status: 'stable' | 'beta' | 'deprecated' | 'experimental'
  version: string
  
  // Metrics
  metrics?: {
    avgResponseTime: number
    requestsPerDay: number
    errorRate: number
  }
}

/**
 * API request log
 */
export interface APIRequestLog {
  id: string
  
  // Request info
  requestId: string
  apiKeyId?: string
  userId?: string
  
  // Endpoint
  method: string
  path: string
  query?: Record<string, unknown>
  body?: unknown
  
  // Response
  statusCode: number
  responseTimeMs: number
  responseSize?: number
  
  // Client info
  ipAddress?: string
  userAgent?: string
  origin?: string
  
  // Location
  location?: {
    country?: string
    region?: string
    city?: string
  }
  
  // Timestamp
  timestamp: string
}

/**
 * API usage statistics
 */
export interface APIUsageStats {
  // Overview
  totalRequests: number
  uniqueApiKeys: number
  uniqueUsers: number
  
  // By tier
  usageByTier: Record<APIKeyTier, {
    requests: number
    apiKeys: number
    percentage: number
  }>
  
  // By endpoint
  usageByEndpoint: Record<string, {
    requests: number
    avgResponseTime: number
    errorRate: number
  }>
  
  // By category
  usageByCategory: Record<APIEndpointCategory, number>
  
  // Time series
  timeSeries: Array<{
    timestamp: string
    requests: number
    errors: number
    avgResponseTime: number
  }>
  
  // Top consumers
  topConsumers: Array<{
    apiKeyId: string
    keyName: string
    requests: number
    percentage: number
  }>
  
  // Period
  periodStart: string
  periodEnd: string
}

/**
 * API webhook configuration
 */
export interface APIWebhookConfig {
  id: string
  userId: string
  
  // Webhook info
  name: string
  description?: string
  url: string
  secret: string
  
  // Events
  events: string[]
  
  // Filters
  filters?: {
    alertTypes?: string[]
    severities?: string[]
    regions?: string[]
  }
  
  // Status
  status: 'active' | 'inactive' | 'paused'
  
  // Authentication
  authType: 'none' | 'basic' | 'bearer' | 'hmac'
  authConfig?: Record<string, unknown>
  
  // Retry policy
  retryPolicy: {
    maxRetries: number
    retryDelayMs: number
    backoffMultiplier: number
  }
  
  // Stats
  stats?: {
    totalDeliveries: number
    successfulDeliveries: number
    failedDeliveries: number
    lastDeliveryAt?: string
  }
  
  createdAt: string
  updatedAt: string
}

/**
 * API quota usage
 */
export interface APIQuotaUsage {
  apiKeyId: string
  tier: APIKeyTier
  
  // Daily
  dailyUsed: number
  dailyLimit: number
  dailyResetAt: string
  
  // Monthly
  monthlyUsed: number
  monthlyLimit: number
  monthlyResetAt: string
  
  // Rate limit
  rateLimitUsed: number
  rateLimitRemaining: number
  rateLimitResetAt: string
  
  // Percentage
  dailyPercentage: number
  monthlyPercentage: number
}

/**
 * API deprecation notice
 */
export interface APIDeprecationNotice {
  id: string
  
  // Affected
  endpoint: string
  method: string
  apiVersion?: string
  
  // Notice
  deprecationDate: string
  sunsetDate: string
  removalDate: string
  
  // Details
  reason: string
  migrationGuide?: string
  alternativeEndpoint?: string
  
  // Status
  status: 'planned' | 'announced' | 'active'
  
  // Notifications
  notifyApiKeys?: string[]
  notifyUsers?: boolean
  
  createdAt: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating API key
 */
export const createAPIKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  tier: z.enum(['free', 'basic', 'professional', 'enterprise', 'partner']).optional(),
  permissions: z.array(z.string()).optional(),
  allowedEndpoints: z.array(z.enum(['alerts', 'outages', 'weather', 'status', 'locations', 'analytics', 'users', 'webhooks'])).optional(),
  allowedOrigins: z.array(z.string().url()).optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
  expiresAt: z.string().datetime().optional(),
})

/**
 * Schema for updating API key
 */
export const updateAPIKeySchema = z.object({
  keyId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).optional(),
  allowedEndpoints: z.array(z.enum(['alerts', 'outages', 'weather', 'status', 'locations', 'analytics', 'users', 'webhooks'])).optional(),
  allowedOrigins: z.array(z.string().url()).optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

/**
 * Schema for webhook configuration
 */
export const webhookConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  filters: z.object({
    alertTypes: z.array(z.string()).optional(),
    severities: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
  }).optional(),
  authType: z.enum(['none', 'basic', 'bearer', 'hmac']).optional(),
  authConfig: z.record(z.unknown()).optional(),
  retryPolicy: z.object({
    maxRetries: z.number().min(0).max(10).optional(),
    retryDelayMs: z.number().min(100).max(60000).optional(),
    backoffMultiplier: z.number().min(1).max(5).optional(),
  }).optional(),
})

// ============================================================================
// Rate Limit Configuration
// ============================================================================

/**
 * Default rate limits by tier
 */
export const RATE_LIMITS: Record<APIKeyTier, RateLimitTier> = {
  free: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    requestsPerMonth: 100000,
    burstLimit: 10,
  },
  basic: {
    requestsPerMinute: 300,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    requestsPerMonth: 1000000,
    burstLimit: 25,
  },
  professional: {
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    requestsPerDay: 500000,
    requestsPerMonth: 5000000,
    burstLimit: 50,
  },
  enterprise: {
    requestsPerMinute: 5000,
    requestsPerHour: 200000,
    requestsPerDay: 2000000,
    requestsPerMonth: 20000000,
    burstLimit: 100,
  },
  partner: {
    requestsPerMinute: 10000,
    requestsPerHour: 500000,
    requestsPerDay: 5000000,
    requestsPerMonth: 50000000,
    burstLimit: 200,
  },
}

/**
 * Endpoint rate limit overrides
 */
export const ENDPOINT_RATE_LIMITS: Record<string, RateLimitTier> = {
  '/api/v1/alerts': {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    requestsPerMonth: 100000,
    burstLimit: 5,
  },
  '/api/v1/outages/report': {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000,
    requestsPerMonth: 10000,
    burstLimit: 2,
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for API tier
 */
export function getAPITierDisplayName(tier: APIKeyTier): string {
  const names: Record<APIKeyTier, string> = {
    free: 'Free',
    basic: 'Basic',
    professional: 'Professional',
    enterprise: 'Enterprise',
    partner: 'Partner',
  }
  return names[tier]
}

/**
 * Gets rate limit display info
 */
export function getRateLimitDisplayInfo(tier: APIKeyTier): {
  requestsPerMinute: number
  requestsPerMonth: number
  color: string
} {
  const limits = RATE_LIMITS[tier]
  const colors: Record<APIKeyTier, string> = {
    free: 'text-gray-500',
    basic: 'text-blue-500',
    professional: 'text-purple-500',
    enterprise: 'text-orange-500',
    partner: 'text-gold-500',
  }
  return {
    requestsPerMinute: limits.requestsPerMinute,
    requestsPerMonth: limits.requestsPerMonth,
    color: colors[tier],
  }
}

/**
 * Generates a new API key
 */
export function generateAPIKey(): { key: string; keyPrefix: string; hashedKey: string } {
  const key = `np_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
  const keyPrefix = key.substring(0, 12) + '...'
  const hashedKey = `hashed_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  
  return { key, keyPrefix, hashedKey }
}

/**
 * Generates webhook secret
 */
export function generateWebhookSecret(): string {
  return `whsec_${Date.now()}_${Math.random().toString(36).substring(2, 22)}`
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a new API key
 */
export async function createAPIKey(
  userId: string,
  input: z.infer<typeof createAPIKeySchema>
): Promise<{ apiKey: APIKey; rawKey: string }> {
  const validationResult = createAPIKeySchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()
  
  const tier = input.tier || 'free'
  const rateLimit = RATE_LIMITS[tier]
  const { key, keyPrefix, hashedKey } = generateAPIKey()

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description,
      tier,
      key_prefix: keyPrefix,
      hashed_key: hashedKey,
      permissions: input.permissions || ['read:alerts', 'read:outages'],
      allowed_endpoints: input.allowedEndpoints || ['alerts', 'outages', 'weather', 'status'],
      allowed_origins: input.allowedOrigins,
      ip_whitelist: input.ipWhitelist,
      rate_limit: rateLimit,
      usage: {
        requestsToday: 0,
        requestsThisMonth: 0,
        quotaUsed: 0,
        quotaTotal: rateLimit.requestsPerMonth,
      },
      status: 'active',
      expires_at: input.expiresAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating API key:', error)
    throw new Error(`Failed to create API key: ${error.message}`)
  }

  return {
    rawKey: key,
    apiKey: mapAPIKeyFromDB(data, keyPrefix),
  }
}

/**
 * Gets API keys for a user
 */
export async function getAPIKeys(
  userId: string,
  options?: {
    status?: APIKey['status']
    tier?: APIKeyTier
  }
): Promise<APIKey[]> {
  const supabase = createClient()

  let query = supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.tier) {
    query = query.eq('tier', options.tier)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching API keys:', error)
    return []
  }

  return (data || []).map(d => mapAPIKeyFromDB(d, d.key_prefix as string))
}

/**
 * Gets API key by ID
 */
export async function getAPIKeyById(
  userId: string,
  keyId: string
): Promise<APIKey | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .eq('id', keyId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching API key:', error)
    return null
  }

  if (!data) return null
  return mapAPIKeyFromDB(data, data.key_prefix as string)
}

/**
 * Updates API key
 */
export async function updateAPIKey(
  userId: string,
  input: z.infer<typeof updateAPIKeySchema>
): Promise<APIKey> {
  const validationResult = updateAPIKeySchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name) updateData.name = input.name
  if (input.description !== undefined) updateData.description = input.description
  if (input.permissions) updateData.permissions = input.permissions
  if (input.allowedEndpoints) updateData.allowed_endpoints = input.allowedEndpoints
  if (input.allowedOrigins) updateData.allowed_origins = input.allowedOrigins
  if (input.ipWhitelist) updateData.ip_whitelist = input.ipWhitelist
  if (input.status) updateData.status = input.status

  const { data, error } = await supabase
    .from('api_keys')
    .update(updateData)
    .eq('user_id', userId)
    .eq('id', input.keyId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating API key:', error)
    throw new Error(`Failed to update API key: ${error.message}`)
  }

  return mapAPIKeyFromDB(data, data.key_prefix as string)
}

/**
 * Revokes an API key
 */
export async function revokeAPIKey(
  userId: string,
  keyId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('api_keys')
    .update({
      status: 'revoked',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', keyId)

  if (error) {
    console.error('Error revoking API key:', error)
    throw new Error(`Failed to revoke API key: ${error.message}`)
  }

  return true
}

/**
 * Rotates an API key (regenerates the key value)
 */
export async function rotateAPIKey(
  userId: string,
  keyId: string
): Promise<{ apiKey: APIKey; rawKey: string }> {
  const supabase = createClient()

  const { key, keyPrefix, hashedKey } = generateAPIKey()

  const { data, error } = await supabase
    .from('api_keys')
    .update({
      key_prefix: keyPrefix,
      hashed_key: hashedKey,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', keyId)
    .eq('status', 'active')
    .select('*')
    .single()

  if (error) {
    console.error('Error rotating API key:', error)
    throw new Error(`Failed to rotate API key: ${error.message}`)
  }

  return {
    rawKey: key,
    apiKey: mapAPIKeyFromDB(data, keyPrefix),
  }
}

/**
 * Gets API quota usage for a key
 */
export async function getAPIQuotaUsage(
  apiKeyId: string
): Promise<APIQuotaUsage | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('api_keys')
    .select('tier, usage, rate_limit')
    .eq('id', apiKeyId)
    .eq('status', 'active')
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching quota usage:', error)
    return null
  }

  if (!data) return null

  const rateLimit = data.rate_limit as RateLimitTier
  const usage = data.usage as { requestsThisMonth: number; requestsToday: number }

  return {
    apiKeyId,
    tier: data.tier as APIKeyTier,
    dailyUsed: usage.requestsToday || 0,
    dailyLimit: rateLimit.requestsPerDay,
    dailyResetAt: getDailyResetTime(),
    monthlyUsed: usage.requestsThisMonth || 0,
    monthlyLimit: rateLimit.requestsPerMonth,
    monthlyResetAt: getMonthlyResetTime(),
    rateLimitUsed: 0,
    rateLimitRemaining: rateLimit.requestsPerMinute,
    rateLimitResetAt: getMinuteResetTime(),
    dailyPercentage: Math.round((usage.requestsToday / rateLimit.requestsPerDay) * 100),
    monthlyPercentage: Math.round((usage.requestsThisMonth / rateLimit.requestsPerMonth) * 100),
  }
}

/**
 * Creates a webhook configuration
 */
export async function createWebhookConfig(
  userId: string,
  input: z.infer<typeof webhookConfigSchema>
): Promise<APIWebhookConfig> {
  const validationResult = webhookConfigSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()
  const secret = generateWebhookSecret()

  const { data, error } = await supabase
    .from('api_webhooks')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description,
      url: input.url,
      secret,
      events: input.events,
      filters: input.filters,
      auth_type: input.authType || 'hmac',
      auth_config: input.authConfig,
      retry_policy: {
        maxRetries: input.retryPolicy?.maxRetries ?? 3,
        retryDelayMs: input.retryPolicy?.retryDelayMs ?? 1000,
        backoffMultiplier: input.retryPolicy?.backoffMultiplier ?? 2,
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating webhook:', error)
    throw new Error(`Failed to create webhook: ${error.message}`)
  }

  return mapWebhookFromDB(data)
}

/**
 * Gets webhook configurations for a user
 */
export async function getWebhookConfigs(
  userId: string
): Promise<APIWebhookConfig[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('api_webhooks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching webhooks:', error)
    return []
  }

  return (data || []).map(mapWebhookFromDB)
}

/**
 * Updates webhook configuration
 */
export async function updateWebhookConfig(
  userId: string,
  webhookId: string,
  updates: Partial<APIWebhookConfig>
): Promise<APIWebhookConfig> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.url) updateData.url = updates.url
  if (updates.events) updateData.events = updates.events
  if (updates.filters) updateData.filters = updates.filters
  if (updates.status) updateData.status = updates.status
  if (updates.authType) updateData.auth_type = updates.authType
  if (updates.authConfig) updateData.auth_config = updates.authConfig

  const { data, error } = await supabase
    .from('api_webhooks')
    .update(updateData)
    .eq('user_id', userId)
    .eq('id', webhookId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating webhook:', error)
    throw new Error(`Failed to update webhook: ${error.message}`)
  }

  return mapWebhookFromDB(data)
}

/**
 * Deletes a webhook configuration
 */
export async function deleteWebhookConfig(
  userId: string,
  webhookId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('api_webhooks')
    .delete()
    .eq('user_id', userId)
    .eq('id', webhookId)

  if (error) {
    console.error('Error deleting webhook:', error)
    throw new Error(`Failed to delete webhook: ${error.message}`)
  }

  return true
}

/**
 * Gets API usage statistics
 */
export async function getAPIUsageStats(
  periodDays: number = 30
): Promise<APIUsageStats> {
  const supabase = createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  // Get request logs
  const { data: logs } = await supabase
    .from('api_request_logs')
    .select('*')
    .gte('timestamp', startDate.toISOString())

  // Calculate stats
  const totalRequests = (logs || []).length
  const uniqueApiKeys = new Set((logs || []).map(l => l.api_key_id)).size
  const uniqueUsers = new Set((logs || []).map(l => l.user_id).filter(Boolean)).size

  // Calculate tier usage
  const usageByTier: Record<APIKeyTier, { requests: number; apiKeys: number; percentage: number }> = {
    free: { requests: 0, apiKeys: 0, percentage: 0 },
    basic: { requests: 0, apiKeys: 0, percentage: 0 },
    professional: { requests: 0, apiKeys: 0, percentage: 0 },
    enterprise: { requests: 0, apiKeys: 0, percentage: 0 },
    partner: { requests: 0, apiKeys: 0, percentage: 0 },
  }

  // Get API keys for tier mapping
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id, tier')

  const keyToTier: Record<string, APIKeyTier> = {}
  for (const key of (apiKeys || []) as any[]) {
    keyToTier[key.id as string] = key.tier as APIKeyTier
  }

  for (const log of (logs || []) as any[]) {
    const tier = (keyToTier[log.api_key_id as string] || 'free') as APIKeyTier
    if (usageByTier[tier]) {
      usageByTier[tier].requests++
    }
  }

  // Calculate percentages
  for (const tier of Object.keys(usageByTier) as APIKeyTier[]) {
    usageByTier[tier].percentage = totalRequests > 0
      ? Math.round((usageByTier[tier].requests / totalRequests) * 100)
      : 0
  }

  return {
    totalRequests,
    uniqueApiKeys,
    uniqueUsers,
    usageByTier,
    usageByEndpoint: {},
    usageByCategory: {
      alerts: 0,
      outages: 0,
      weather: 0,
      status: 0,
      locations: 0,
      analytics: 0,
      users: 0,
      webhooks: 0,
    },
    timeSeries: [],
    topConsumers: [],
    periodStart: startDate.toISOString(),
    periodEnd: new Date().toISOString(),
  }
}

/**
 * Gets available API endpoints
 */
export async function getAPIEndpoints(): Promise<APIEndpoint[]> {
  return [
    {
      id: 'alerts-list',
      path: '/api/v1/alerts',
      method: 'GET',
      category: 'alerts',
      summary: 'List alerts',
      description: 'Retrieve a list of active alerts in a region',
      authRequired: true,
      authMethods: ['api_key', 'oauth2', 'jwt'],
      rateLimited: true,
      cacheable: true,
      cacheDurationSeconds: 60,
      status: 'stable',
      version: 'v1',
    },
    {
      id: 'alerts-get',
      path: '/api/v1/alerts/{id}',
      method: 'GET',
      category: 'alerts',
      summary: 'Get alert details',
      description: 'Retrieve detailed information about a specific alert',
      authRequired: true,
      authMethods: ['api_key', 'oauth2', 'jwt'],
      rateLimited: true,
      cacheable: true,
      cacheDurationSeconds: 300,
      status: 'stable',
      version: 'v1',
    },
    {
      id: 'outages-list',
      path: '/api/v1/outages',
      method: 'GET',
      category: 'outages',
      summary: 'List outages',
      description: 'Retrieve a list of current power outages',
      authRequired: true,
      authMethods: ['api_key', 'oauth2', 'jwt'],
      rateLimited: true,
      cacheable: true,
      cacheDurationSeconds: 120,
      status: 'stable',
      version: 'v1',
    },
    {
      id: 'outages-report',
      path: '/api/v1/outages',
      method: 'POST',
      category: 'outages',
      summary: 'Report outage',
      description: 'Report a power outage at a specific location',
      authRequired: true,
      authMethods: ['api_key', 'oauth2', 'jwt'],
      rateLimited: true,
      cacheable: false,
      status: 'stable',
      version: 'v1',
    },
    {
      id: 'outages-nearby',
      path: '/api/v1/outages/nearby',
      method: 'GET',
      category: 'outages',
      summary: 'Nearby outages',
      description: 'Find outages near a specific location',
      authRequired: false,
      authMethods: ['api_key', 'oauth2', 'jwt', 'none'],
      rateLimited: true,
      cacheable: true,
      cacheDurationSeconds: 60,
      status: 'stable',
      version: 'v1',
    },
    {
      id: 'weather-alerts',
      path: '/api/v1/weather/alerts',
      method: 'GET',
      category: 'weather',
      summary: 'Weather alerts',
      description: 'Retrieve weather alerts for a region',
      authRequired: false,
      authMethods: ['api_key', 'oauth2', 'jwt', 'none'],
      rateLimited: true,
      cacheable: true,
      cacheDurationSeconds: 300,
      status: 'stable',
      version: 'v1',
    },
    {
      id: 'grid-status',
      path: '/api/v1/status',
      method: 'GET',
      category: 'status',
      summary: 'Grid status',
      description: 'Get current grid operational status',
      authRequired: false,
      authMethods: ['api_key', 'oauth2', 'jwt', 'none'],
      rateLimited: true,
      cacheable: true,
      cacheDurationSeconds: 30,
      status: 'stable',
      version: 'v1',
    },
    {
      id: 'restoration-etr',
      path: '/api/v1/status/etr',
      method: 'GET',
      category: 'status',
      summary: 'ETR information',
      description: 'Get estimated time of restoration for an outage',
      authRequired: true,
      authMethods: ['api_key', 'oauth2', 'jwt'],
      rateLimited: true,
      cacheable: false,
      status: 'stable',
      version: 'v1',
    },
  ]
}

/**
 * Records API request for analytics
 */
export async function recordAPIRequest(
  request: Omit<APIRequestLog, 'id'>
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('api_request_logs')
    .insert({
      request_id: request.requestId,
      api_key_id: request.apiKeyId,
      user_id: request.userId,
      method: request.method,
      path: request.path,
      query: request.query,
      body: request.body,
      status_code: request.statusCode,
      response_time_ms: request.responseTimeMs,
      response_size: request.responseSize,
      ip_address: request.ipAddress,
      user_agent: request.userAgent,
      origin: request.origin,
      location: request.location,
      timestamp: request.timestamp,
    })
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to APIKey
 */
function mapAPIKeyFromDB(data: Record<string, unknown>, keyPrefix: string): APIKey {
  return {
    id: data.id as string,
    keyId: data.id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    tier: data.tier as APIKeyTier,
    keyPrefix,
    hashedKey: data.hashed_key as string,
    userId: data.user_id as string,
    organizationId: data.organization_id as string | undefined,
    permissions: data.permissions as string[],
    allowedEndpoints: data.allowed_endpoints as APIEndpointCategory[],
    allowedOrigins: (data.allowed_origins as string[]) || undefined,
    ipWhitelist: (data.ip_whitelist as string[]) || undefined,
    rateLimit: data.rate_limit as RateLimitTier,
    usage: data.usage as APIKey['usage'],
    status: data.status as APIKey['status'],
    expiresAt: data.expires_at as string | undefined,
    lastUsedAt: data.last_used_at as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to APIWebhookConfig
 */
function mapWebhookFromDB(data: Record<string, unknown>): APIWebhookConfig {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    url: data.url as string,
    secret: data.secret as string,
    events: data.events as string[],
    filters: (data.filters as APIWebhookConfig['filters']) || undefined,
    status: data.status as APIWebhookConfig['status'],
    authType: data.auth_type as APIWebhookConfig['authType'],
    authConfig: (data.auth_config as Record<string, unknown>) || undefined,
    retryPolicy: data.retry_policy as APIWebhookConfig['retryPolicy'],
    stats: (data.stats as APIWebhookConfig['stats']) || undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Gets daily reset time (midnight UTC)
 */
function getDailyResetTime(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  return tomorrow.toISOString()
}

/**
 * Gets monthly reset time (first of next month)
 */
function getMonthlyResetTime(): string {
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  nextMonth.setDate(1)
  nextMonth.setUTCHours(0, 0, 0, 0)
  return nextMonth.toISOString()
}

/**
 * Gets minute reset time
 */
function getMinuteResetTime(): string {
  const nextMinute = new Date()
  nextMinute.setMinutes(nextMinute.getMinutes() + 1)
  nextMinute.setSeconds(0, 0)
  return nextMinute.toISOString()
}
