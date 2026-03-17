import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: string
  retryAfter?: number
}

/**
 * Rate limit bucket
 */
export interface RateLimitBucket {
  key: string
  limit: number
  windowSeconds: number
  current: number
  resetAt: string
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  id: string
  
  // Scope
  scopeType: 'api_key' | 'user' | 'ip' | 'global'
  scopeId?: string
  
  // Limits
  limits: Array<{
    windowSeconds: number
    maxRequests: number
  }>
  
  // Policy
  policy: 'block' | 'throttle' | 'queue'
  priority: number
  
  // Status
  enabled: boolean
  
  createdAt: string
  updatedAt: string
}

/**
 * Rate limit violation
 */
export interface RateLimitViolation {
  id: string
  
  // Violation info
  key: string
  keyType: 'api_key' | 'user' | 'ip'
  endpoint: string
  method: string
  
  // Limits exceeded
  limitsExceeded: Array<{
    windowSeconds: number
    maxRequests: number
    currentRequests: number
  }>
  
  // Action taken
  action: 'blocked' | 'throttled' | 'warned'
  
  // Request info
  requestHeaders?: Record<string, string>
  requestBody?: unknown
  
  // Timestamp
  timestamp: string
}

/**
 * Rate limit tier
 */
export type RateLimitTier = 
  | 'free'
  | 'basic'
  | 'professional'
  | 'enterprise'
  | 'partner'

/**
 * Rate limit window
 */
export interface RateLimitWindow {
  windowSeconds: number
  maxRequests: number
}

/**
 * Throttling configuration
 */
export interface ThrottleConfig {
  enabled: boolean
  
  // Throttle settings
  maxConcurrent: number
  maxQueueSize: number
  queueTimeoutSeconds: number
  
  // Backoff settings
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  
  // Jitter
  jitterEnabled: boolean
  jitterPercent: number
}

/**
 * Rate limit analytics
 */
export interface RateLimitAnalytics {
  // Overview
  totalRequests: number
  totalBlocked: number
  totalThrottled: number
  blockRate: number
  throttleRate: number
  
  // By tier
  byTier: Record<RateLimitTier, {
    total: number
    blocked: number
    throttled: number
  }>
  
  // By endpoint
  byEndpoint: Record<string, {
    total: number
    blocked: number
    topBlockers: Array<{ key: string; count: number }>
  }>
  
  // By key type
  byKeyType: Record<'api_key' | 'user' | 'ip', {
    total: number
    blocked: number
  }>
  
  // Time series
  timeSeries: Array<{
    timestamp: string
    requests: number
    blocked: number
    throttled: number
  }>
  
  // Period
  periodStart: string
  periodEnd: string
}

/**
 * Custom rate limit rule
 */
export interface CustomRateLimitRule {
  id: string
  
  // Scope
  scopeType: 'endpoint' | 'ip_range' | 'user_group' | 'api_key_tier'
  scopeValue: string
  
  // Limits
  limits: RateLimitWindow[]
  
  // Priority (higher = more important)
  priority: number
  
  // Status
  enabled: boolean
  
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for rate limit check
 */
export const rateLimitCheckSchema = z.object({
  key: z.string().min(1),
  keyType: z.enum(['api_key', 'user', 'ip']),
  endpoint: z.string().min(1),
  method: z.string().min(1),
  tier: z.enum(['free', 'basic', 'professional', 'enterprise', 'partner']).optional(),
})

/**
 * Schema for rate limit config
 */
export const rateLimitConfigSchema = z.object({
  scopeType: z.enum(['api_key', 'user', 'ip', 'global']),
  scopeId: z.string().optional(),
  limits: z.array(z.object({
    windowSeconds: z.number().positive(),
    maxRequests: z.number().positive(),
  })),
  policy: z.enum(['block', 'throttle', 'queue']).optional(),
  priority: z.number().int().optional(),
})

/**
 * Schema for custom rule
 */
export const customRuleSchema = z.object({
  scopeType: z.enum(['endpoint', 'ip_range', 'user_group', 'api_key_tier']),
  scopeValue: z.string().min(1),
  limits: z.array(z.object({
    windowSeconds: z.number().positive(),
    maxRequests: z.number().positive(),
  })),
  priority: z.number().int().min(0).max(100).optional(),
})

/**
 * Schema for throttle config
 */
export const throttleConfigSchema = z.object({
  enabled: z.boolean().optional(),
  maxConcurrent: z.number().positive().optional(),
  maxQueueSize: z.number().positive().optional(),
  queueTimeoutSeconds: z.number().positive().optional(),
  initialDelayMs: z.number().nonnegative().optional(),
  maxDelayMs: z.number().positive().optional(),
  backoffMultiplier: z.number().positive().optional(),
  jitterEnabled: z.boolean().optional(),
  jitterPercent: z.number().min(0).max(100).optional(),
})

// ============================================================================
// Default Limits
// ============================================================================

/**
 * Default rate limits by tier
 */
export const DEFAULT_RATE_LIMITS: Record<RateLimitTier, RateLimitWindow[]> = {
  free: [
    { windowSeconds: 60, maxRequests: 60 },
    { windowSeconds: 3600, maxRequests: 1000 },
    { windowSeconds: 86400, maxRequests: 10000 },
  ],
  basic: [
    { windowSeconds: 60, maxRequests: 300 },
    { windowSeconds: 3600, maxRequests: 10000 },
    { windowSeconds: 86400, maxRequests: 100000 },
  ],
  professional: [
    { windowSeconds: 60, maxRequests: 1000 },
    { windowSeconds: 3600, maxRequests: 50000 },
    { windowSeconds: 86400, maxRequests: 500000 },
  ],
  enterprise: [
    { windowSeconds: 60, maxRequests: 5000 },
    { windowSeconds: 3600, maxRequests: 200000 },
    { windowSeconds: 86400, maxRequests: 2000000 },
  ],
  partner: [
    { windowSeconds: 60, maxRequests: 10000 },
    { windowSeconds: 3600, maxRequests: 500000 },
    { windowSeconds: 86400, maxRequests: 5000000 },
  ],
}

/**
 * Endpoint-specific overrides
 */
export const ENDPOINT_RATE_LIMITS: Record<string, RateLimitWindow[]> = {
  '/api/v1/alerts': [
    { windowSeconds: 60, maxRequests: 60 },
    { windowSeconds: 3600, maxRequests: 1000 },
  ],
  '/api/v1/outages/report': [
    { windowSeconds: 60, maxRequests: 10 },
    { windowSeconds: 3600, maxRequests: 100 },
  ],
  '/api/v1/webhooks': [
    { windowSeconds: 60, maxRequests: 30 },
    { windowSeconds: 3600, maxRequests: 500 },
  ],
}

// ============================================================================
// In-Memory Rate Limit Store
// ============================================================================

/**
 * In-memory rate limit store (for demonstration)
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, RateLimitBucket>()

/**
 * Gets current count from store
 */
function getFromStore(key: string, windowSeconds: number): RateLimitBucket | null {
  const fullKey = `${key}:${windowSeconds}`
  const bucket = rateLimitStore.get(fullKey)
  
  if (!bucket) return null
  
  const now = Date.now()
  const windowStart = now - windowSeconds * 1000
  
  if (new Date(bucket.resetAt).getTime() < windowStart) {
    // Window has expired, reset
    return null
  }
  
  return bucket
}

/**
 * Increments counter in store
 */
function incrementStore(key: string, windowSeconds: number, limit: number): RateLimitBucket {
  const fullKey = `${key}:${windowSeconds}`
  const now = Date.now()
  const resetAt = new Date(now + windowSeconds * 1000).toISOString()
  
  const existing = rateLimitStore.get(fullKey)
  
  if (existing) {
    existing.current++
    existing.resetAt = resetAt
    rateLimitStore.set(fullKey, existing)
    return existing
  }
  
  const newBucket: RateLimitBucket = {
    key: fullKey,
    limit,
    windowSeconds,
    current: 1,
    resetAt,
  }
  
  rateLimitStore.set(fullKey, newBucket)
  return newBucket
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets rate limit display name
 */
export function getRateLimitDisplayName(tier: RateLimitTier): string {
  const names: Record<RateLimitTier, string> = {
    free: 'Free',
    basic: 'Basic',
    professional: 'Professional',
    enterprise: 'Enterprise',
    partner: 'Partner',
  }
  return names[tier]
}

/**
 * Gets window display text
 */
export function getWindowDisplayText(windowSeconds: number): string {
  if (windowSeconds < 60) {
    return `${windowSeconds}s`
  }
  if (windowSeconds < 3600) {
    return `${Math.floor(windowSeconds / 60)}m`
  }
  if (windowSeconds < 86400) {
    return `${Math.floor(windowSeconds / 3600)}h`
  }
  return `${Math.floor(windowSeconds / 86400)}d`
}

/**
 * Calculates retry after seconds
 */
export function calculateRetryAfter(resetAt: string): number {
  const now = Date.now()
  const reset = new Date(resetAt).getTime()
  return Math.ceil((reset - now) / 1000)
}

/**
 * Gets client identifier from request
 */
export function getClientIdentifier(
  headers: Record<string, string>,
  options?: {
    apiKey?: string
    userId?: string
    ip?: string
  }
): { identifier: string; type: 'api_key' | 'user' | 'ip' } {
  // Priority: api_key > user_id > ip
  if (options?.apiKey) {
    return { identifier: `apikey:${options.apiKey}`, type: 'api_key' }
  }
  
  if (options?.userId) {
    return { identifier: `user:${options.userId}`, type: 'user' }
  }
  
  // Extract IP from headers (consider X-Forwarded-For for proxies)
  const ip = headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             headers['x-real-ip'] ||
             headers['cf-connecting-ip'] ||
             options?.ip ||
             'unknown'
  
  return { identifier: `ip:${ip}`, type: 'ip' }
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Checks rate limit for a request
 */
export async function checkRateLimit(
  input: z.infer<typeof rateLimitCheckSchema>
): Promise<RateLimitResult> {
  const validationResult = rateLimitCheckSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const { key, keyType, endpoint, method, tier = 'free' } = input
  
  // Get applicable limits
  const limits = getApplicableLimits(endpoint, tier)
  
  // Check each limit
  let blocked = false
  let remaining = Number.MAX_SAFE_INTEGER
  let resetAt = new Date(Date.now() + 3600000).toISOString()
  
  for (const limit of limits) {
    const bucket = getFromStore(key, limit.windowSeconds)
    
    if (bucket) {
      const current = bucket.current
      const allowed = current < limit.maxRequests
      
      if (!allowed) {
        blocked = true
        remaining = 0
        resetAt = bucket.resetAt
      } else if (current < remaining) {
        remaining = limit.maxRequests - current
      }
    } else {
      remaining = Math.min(remaining, limit.maxRequests)
    }
  }
  
  if (!blocked) {
    // Increment counters
    for (const limit of limits) {
      incrementStore(key, limit.windowSeconds, limit.maxRequests)
    }
  }
  
  return {
    allowed: !blocked,
    limit: limits[0]?.maxRequests || 0,
    remaining: blocked ? 0 : remaining,
    resetAt,
    retryAfter: blocked ? calculateRetryAfter(resetAt) : undefined,
  }
}

/**
 * Gets applicable rate limits for an endpoint and tier
 */
export function getApplicableLimits(
  endpoint: string,
  tier: RateLimitTier
): RateLimitWindow[] {
  // Check for endpoint-specific overrides
  for (const [path, limits] of Object.entries(ENDPOINT_RATE_LIMITS)) {
    if (endpoint.startsWith(path)) {
      return limits
    }
  }
  
  // Return tier default
  return DEFAULT_RATE_LIMITS[tier]
}

/**
 * Records a rate limit violation
 */
export async function recordRateLimitViolation(
  input: Omit<RateLimitViolation, 'id' | 'timestamp'>
): Promise<RateLimitViolation> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('rate_limit_violations')
    .insert({
      key: input.key,
      key_type: input.keyType,
      endpoint: input.endpoint,
      method: input.method,
      limits_exceeded: input.limitsExceeded,
      action: input.action,
      request_headers: input.requestHeaders,
      request_body: input.requestBody,
      timestamp: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error recording violation:', error)
  }

  return {
    id: data?.id || `violation_${Date.now()}`,
    ...input,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Gets rate limit violations
 */
export async function getRateLimitViolations(
  options?: {
    key?: string
    keyType?: RateLimitViolation['keyType']
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<RateLimitViolation[]> {
  const supabase = createClient()

  let query = supabase
    .from('rate_limit_violations')
    .select('*')
    .order('timestamp', { ascending: false })

  if (options?.key) {
    query = query.eq('key', options.key)
  }

  if (options?.keyType) {
    query = query.eq('key_type', options.keyType)
  }

  if (options?.startDate) {
    query = query.gte('timestamp', options.startDate)
  }

  if (options?.endDate) {
    query = query.lte('timestamp', options.endDate)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching violations:', error)
    return []
  }

  return (data || []).map(d => ({
    id: d.id,
    key: d.key,
    keyType: d.key_type,
    endpoint: d.endpoint,
    method: d.method,
    limitsExceeded: d.limits_exceeded,
    action: d.action,
    requestHeaders: d.request_headers,
    requestBody: d.request_body,
    timestamp: d.timestamp,
  }))
}

/**
 * Creates a custom rate limit rule
 */
export async function createCustomRule(
  input: z.infer<typeof customRuleSchema>
): Promise<CustomRateLimitRule> {
  const validationResult = customRuleSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('custom_rate_limit_rules')
    .insert({
      scope_type: input.scopeType,
      scope_value: input.scopeValue,
      limits: input.limits,
      priority: input.priority ?? 50,
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating custom rule:', error)
    throw new Error(`Failed to create rule: ${error.message}`)
  }

  return {
    id: data.id as string,
    scopeType: data.scope_type as string,
    scopeValue: data.scope_value as number,
    limits: data.limits,
    priority: data.priority as number,
    enabled: data.enabled as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Gets custom rate limit rules
 */
export async function getCustomRules(
  options?: {
    scopeType?: CustomRateLimitRule['scopeType']
    scopeValue?: string
    enabled?: boolean
  }
): Promise<CustomRateLimitRule[]> {
  const supabase = createClient()

  let query = supabase
    .from('custom_rate_limit_rules')
    .select('*')
    .order('priority', { ascending: false })

  if (options?.scopeType) {
    query = query.eq('scope_type', options.scopeType)
  }

  if (options?.scopeValue) {
    query = query.eq('scope_value', options.scopeValue)
  }

  if (options?.enabled !== undefined) {
    query = query.eq('enabled', options.enabled)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching custom rules:', error)
    return []
  }

  return (data || []).map(d => ({
    id: d.id,
    scopeType: d.scope_type,
    scopeValue: d.scope_value,
    limits: d.limits,
    priority: d.priority,
    enabled: d.enabled,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }))
}

/**
 * Updates a custom rate limit rule
 */
export async function updateCustomRule(
  ruleId: string,
  updates: Partial<CustomRateLimitRule>
): Promise<CustomRateLimitRule> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.scopeValue !== undefined) updateData.scope_value = updates.scopeValue
  if (updates.limits !== undefined) updateData.limits = updates.limits
  if (updates.priority !== undefined) updateData.priority = updates.priority
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled

  const { data, error } = await supabase
    .from('custom_rate_limit_rules')
    .update(updateData)
    .eq('id', ruleId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating custom rule:', error)
    throw new Error(`Failed to update rule: ${error.message}`)
  }

  return {
    id: data.id as string,
    scopeType: data.scope_type as string,
    scopeValue: data.scope_value as number,
    limits: data.limits,
    priority: data.priority as number,
    enabled: data.enabled as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Deletes a custom rate limit rule
 */
export async function deleteCustomRule(ruleId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('custom_rate_limit_rules')
    .delete()
    .eq('id', ruleId)

  if (error) {
    console.error('Error deleting custom rule:', error)
    throw new Error(`Failed to delete rule: ${error.message}`)
  }

  return true
}

/**
 * Configures throttling for a request
 */
export async function configureThrottle(
  apiKeyId: string,
  config: z.infer<typeof throttleConfigSchema>
): Promise<ThrottleConfig> {
  const validationResult = throttleConfigSchema.safeParse(config)
  if (!validationResult.success) {
    throw new Error(`Invalid config: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('throttle_configs')
    .upsert({
      api_key_id: apiKeyId,
      enabled: config.enabled ?? true,
      max_concurrent: config.maxConcurrent ?? 10,
      max_queue_size: config.maxQueueSize ?? 100,
      queue_timeout_seconds: config.queueTimeoutSeconds ?? 30,
      initial_delay_ms: config.initialDelayMs ?? 100,
      max_delay_ms: config.maxDelayMs ?? 5000,
      backoff_multiplier: config.backoffMultiplier ?? 2,
      jitter_enabled: config.jitterEnabled ?? true,
      jitter_percent: config.jitterPercent ?? 10,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error configuring throttle:', error)
    throw new Error(`Failed to configure throttle: ${error.message}`)
  }

  return {
    enabled: data.enabled as boolean,
    maxConcurrent: data.max_concurrent as number,
    maxQueueSize: data.max_queue_size as number,
    queueTimeoutSeconds: data.queue_timeout_seconds,
    initialDelayMs: data.initial_delay_ms,
    maxDelayMs: data.max_delay_ms,
    backoffMultiplier: data.backoff_multiplier,
    jitterEnabled: data.jitter_enabled as boolean,
    jitterPercent: data.jitter_percent as number,
  }
}

/**
 * Gets throttle configuration
 */
export async function getThrottleConfig(
  apiKeyId: string
): Promise<ThrottleConfig | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('throttle_configs')
    .select('*')
    .eq('api_key_id', apiKeyId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching throttle config:', error)
    return null
  }

  if (!data) {
    // Return default config
    return {
      enabled: true,
      maxConcurrent: 10,
      maxQueueSize: 100,
      queueTimeoutSeconds: 30,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      jitterEnabled: true,
      jitterPercent: 10,
    }
  }

  return {
    enabled: data.enabled as boolean,
    maxConcurrent: data.max_concurrent as number,
    maxQueueSize: data.max_queue_size as number,
    queueTimeoutSeconds: data.queue_timeout_seconds,
    initialDelayMs: data.initial_delay_ms,
    maxDelayMs: data.max_delay_ms,
    backoffMultiplier: data.backoff_multiplier,
    jitterEnabled: data.jitter_enabled as boolean,
    jitterPercent: data.jitter_percent as number,
  }
}

/**
 * Gets rate limit analytics
 */
export async function getRateLimitAnalytics(
  periodDays: number = 7
): Promise<RateLimitAnalytics> {
  const supabase = createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  // Get violations
  const { data: violations } = await supabase
    .from('rate_limit_violations')
    .select('*')
    .gte('timestamp', startDate.toISOString())

  // Calculate totals
  const totalBlocked = violations?.filter(v => v.action === 'blocked').length || 0
  const totalThrottled = violations?.filter(v => v.action === 'throttled').length || 0
  const totalRequests = totalBlocked + totalThrottled + 100000 // Approximation

  // Calculate by tier
  const byTier: RateLimitAnalytics['byTier'] = {
    free: { total: 0, blocked: 0, throttled: 0 },
    basic: { total: 0, blocked: 0, throttled: 0 },
    professional: { total: 0, blocked: 0, throttled: 0 },
    enterprise: { total: 0, blocked: 0, throttled: 0 },
    partner: { total: 0, blocked: 0, throttled: 0 },
  }

  // Calculate by endpoint
  const byEndpoint: RateLimitAnalytics['byEndpoint'] = {}

  // Calculate by key type
  const byKeyType = {
    api_key: { total: 0, blocked: 0 },
    user: { total: 0, blocked: 0 },
    ip: { total: 0, blocked: 0 },
  }

  for (const violation of violations || []) {
    const tier = 'free' // Would need to join with api_keys table
    if (byTier[tier]) {
      byTier[tier].blocked++
    }

    if (byKeyType[violation.key_type]) {
      byKeyType[violation.key_type].blocked++
    }
  }

  return {
    totalRequests,
    totalBlocked,
    totalThrottled,
    blockRate: totalRequests > 0 ? totalBlocked / totalRequests : 0,
    throttleRate: totalRequests > 0 ? totalThrottled / totalRequests : 0,
    byTier,
    byEndpoint,
    byKeyType,
    timeSeries: [],
    periodStart: startDate.toISOString(),
    periodEnd: new Date().toISOString(),
  }
}

/**
 * Resets rate limit for a key
 */
export async function resetRateLimit(
  key: string,
  windows?: number[]
): Promise<boolean> {
  const windowsToReset = windows || [60, 3600, 86400]

  for (const windowSeconds of windowsToReset) {
    const fullKey = `${key}:${windowSeconds}`
    rateLimitStore.delete(fullKey)
  }

  return true
}

/**
 * Gets current rate limit status for a key
 */
export async function getRateLimitStatus(
  key: string,
  tier: RateLimitTier = 'free'
): Promise<{
  windows: Array<{
    windowSeconds: number
    current: number
    limit: number
    remaining: number
    resetAt: string
  }>
}> {
  const limits = getApplicableLimits('/api', tier)

  const windows = limits.map(limit => {
    const bucket = getFromStore(key, limit.windowSeconds)
    const current = bucket?.current || 0
    const remaining = Math.max(0, limit.maxRequests - current)

    return {
      windowSeconds: limit.windowSeconds,
      current,
      limit: limit.maxRequests,
      remaining,
      resetAt: bucket?.resetAt || new Date(Date.now() + limit.windowSeconds * 1000).toISOString(),
    }
  })

  return { windows }
}

/**
 * Creates a rate limit configuration
 */
export async function createRateLimitConfig(
  input: z.infer<typeof rateLimitConfigSchema>
): Promise<RateLimitConfig> {
  const validationResult = rateLimitConfigSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('rate_limit_configs')
    .insert({
      scope_type: input.scopeType,
      scope_id: input.scopeId,
      limits: input.limits,
      policy: input.policy || 'block',
      priority: input.priority || 50,
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating config:', error)
    throw new Error(`Failed to create config: ${error.message}`)
  }

  return {
    id: data.id as string,
    scopeType: data.scope_type as string,
    scopeId: data.scope_id as string,
    limits: data.limits,
    policy: data.policy,
    priority: data.priority as number,
    enabled: data.enabled as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Gets rate limit configurations
 */
export async function getRateLimitConfigs(
  options?: {
    scopeType?: RateLimitConfig['scopeType']
    scopeId?: string
    enabled?: boolean
  }
): Promise<RateLimitConfig[]> {
  const supabase = createClient()

  let query = supabase
    .from('rate_limit_configs')
    .select('*')
    .order('priority', { ascending: false })

  if (options?.scopeType) {
    query = query.eq('scope_type', options.scopeType)
  }

  if (options?.scopeId) {
    query = query.eq('scope_id', options.scopeId)
  }

  if (options?.enabled !== undefined) {
    query = query.eq('enabled', options.enabled)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching configs:', error)
    return []
  }

  return (data || []).map(d => ({
    id: d.id,
    scopeType: d.scope_type,
    scopeId: d.scope_id,
    limits: d.limits,
    policy: d.policy,
    priority: d.priority,
    enabled: d.enabled,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }))
}

/**
 * Updates a rate limit configuration
 */
export async function updateRateLimitConfig(
  configId: string,
  updates: Partial<RateLimitConfig>
): Promise<RateLimitConfig> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.limits) updateData.limits = updates.limits
  if (updates.policy) updateData.policy = updates.policy
  if (updates.priority !== undefined) updateData.priority = updates.priority
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled

  const { data, error } = await supabase
    .from('rate_limit_configs')
    .update(updateData)
    .eq('id', configId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating config:', error)
    throw new Error(`Failed to update config: ${error.message}`)
  }

  return {
    id: data.id as string,
    scopeType: data.scope_type as string,
    scopeId: data.scope_id as string,
    limits: data.limits,
    policy: data.policy,
    priority: data.priority as number,
    enabled: data.enabled as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Deletes a rate limit configuration
 */
export async function deleteRateLimitConfig(configId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('rate_limit_configs')
    .delete()
    .eq('id', configId)

  if (error) {
    console.error('Error deleting config:', error)
    throw new Error(`Failed to delete config: ${error.message}`)
  }

  return true
}
