import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type TargetType = 'user' | 'group' | 'location' | 'segment' | 'radius' | 'polygon'

export type AlertStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low'

export type TargetingMode = 'inclusive' | 'exclusive' | 'balanced'

export interface TargetingRule {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'
  value: unknown
}

export interface GeographicTarget {
  type: 'radius' | 'polygon' | 'bounding_box'
  center?: {
    latitude: number
    longitude: number
  }
  radiusKm?: number
  coordinates?: Array<[number, number]> // [longitude, latitude] pairs
  bounds?: {
    northEast: { latitude: number; longitude: number }
    southWest: { latitude: number; longitude: number }
  }
}

export interface UserSegment {
  id: string
  name: string
  rules: TargetingRule[]
  targetingMode: TargetingMode
  estimatedSize?: number
}

export interface TargetedAlert {
  id: string
  
  // Content
  title: string
  body: string
  alertType: string
  priority: AlertPriority
  
  // Targeting Configuration
  targetType: TargetType
  targetIds?: string[]
  geographicTarget?: GeographicTarget
  segments?: UserSegment[]
  targetingRules?: TargetingRule[]
  targetingMode?: TargetingMode
  
  // Targeting Results
  targetedCount: number
  estimatedReach: number
  actualReach?: number
  
  // Scheduling
  scheduledAt?: string
  expiresAt?: string
  sentAt?: string
  completedAt?: string
  
  // Status
  status: AlertStatus
  
  // Settings
  requireAcknowledgment: boolean
  allowDuplicateTargeting: boolean
  
  // Metadata
  createdBy: string
  campaignId?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CreateTargetedAlertInput {
  title: string
  body: string
  alertType: string
  priority: AlertPriority
  targetType: TargetType
  targetIds?: string[]
  geographicTarget?: GeographicTarget
  segments?: UserSegment[]
  targetingRules?: TargetingRule[]
  targetingMode?: TargetingMode
  scheduledAt?: string
  expiresAt?: string
  requireAcknowledgment?: boolean
  allowDuplicateTargeting?: boolean
  campaignId?: string
}

export interface AlertDeliveryRecord {
  id: string
  alertId: string
  userId: string
  channel: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'acknowledged'
  sentAt?: string
  deliveredAt?: string
  acknowledgedAt?: string
}

// ============================================================================
// Targeting Rules Configuration
// ============================================================================

export const TARGETING_FIELDS = {
  demographics: {
    age: { label: 'Age', type: 'number' },
    gender: { label: 'Gender', type: 'select', options: ['male', 'female', 'other', 'prefer_not_to_say'] },
    language: { label: 'Preferred Language', type: 'string' },
    country: { label: 'Country', type: 'string' },
    region: { label: 'Region', type: 'string' },
    city: { label: 'City', type: 'string' },
  },
  user_behavior: {
    last_active: { label: 'Last Active', type: 'date' },
    login_count: { label: 'Login Count', type: 'number' },
    notification_response_rate: { label: 'Notification Response Rate', type: 'percentage' },
    alert_acknowledgment_rate: { label: 'Alert Acknowledgment Rate', type: 'percentage' },
  },
  alert_preferences: {
    alert_types: { label: 'Alert Types', type: 'array' },
    notification_channels: { label: 'Notification Channels', type: 'array' },
    quiet_hours_enabled: { label: 'Quiet Hours Enabled', type: 'boolean' },
    critical_alerts_only: { label: 'Critical Alerts Only', type: 'boolean' },
  },
  location: {
    home_location: { label: 'Home Location', type: 'location' },
    current_location: { label: 'Current Location', type: 'location' },
    within_radius: { label: 'Within Radius', type: 'location_radius' },
  },
  subscription: {
    subscription_tier: { label: 'Subscription Tier', type: 'select', options: ['free', 'premium', 'enterprise'] },
    subscription_status: { label: 'Subscription Status', type: 'select', options: ['active', 'cancelled', 'expired', 'past_due'] },
    subscribed_features: { label: 'Subscribed Features', type: 'array' },
  },
}

export const OPERATORS = {
  equals: { label: 'Equals', applicableTypes: ['string', 'number', 'boolean', 'select'] },
  not_equals: { label: 'Not Equals', applicableTypes: ['string', 'number', 'boolean', 'select'] },
  contains: { label: 'Contains', applicableTypes: ['string', 'array'] },
  greater_than: { label: 'Greater Than', applicableTypes: ['number', 'percentage', 'date'] },
  less_than: { label: 'Less Than', applicableTypes: ['number', 'percentage', 'date'] },
  between: { label: 'Between', applicableTypes: ['number', 'percentage', 'date'] },
  in: { label: 'In List', applicableTypes: ['string', 'number', 'array'] },
  not_in: { label: 'Not In List', applicableTypes: ['string', 'number', 'array'] },
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createTargetedAlertSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  alertType: z.string().min(1),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  targetType: z.enum(['user', 'group', 'location', 'segment', 'radius', 'polygon']),
  targetIds: z.array(z.string()).optional(),
  geographicTarget: z.object({
    type: z.enum(['radius', 'polygon', 'bounding_box']),
    center: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional(),
    radiusKm: z.number().positive().max(1000).optional(),
    coordinates: z.array(z.tuple([z.number(), z.number()])).optional(),
    bounds: z.object({
      northEast: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }),
      southWest: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }),
    }).optional(),
  }).optional(),
  segments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    rules: z.array(z.object({
      id: z.string(),
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'between', 'in', 'not_in']),
      value: z.unknown(),
    })),
    targetingMode: z.enum(['inclusive', 'exclusive', 'balanced']),
  })).optional(),
  targetingRules: z.array(z.object({
    id: z.string(),
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'between', 'in', 'not_in']),
    value: z.unknown(),
  })).optional(),
  targetingMode: z.enum(['inclusive', 'exclusive', 'balanced']).optional(),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  requireAcknowledgment: z.boolean().optional(),
  allowDuplicateTargeting: z.boolean().optional(),
  campaignId: z.string().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getTargetTypeDisplayName(type: TargetType): string {
  const names: Record<TargetType, string> = {
    user: 'Individual Users',
    group: 'User Groups',
    location: 'Location-Based',
    segment: 'User Segment',
    radius: 'Radius',
    polygon: 'Polygon',
  }
  return names[type]
}

export function getStatusDisplayName(status: AlertStatus): string {
  const names: Record<AlertStatus, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    sending: 'Sending',
    sent: 'Sent',
    cancelled: 'Cancelled',
  }
  return names[status]
}

export function getPriorityDisplayName(priority: AlertPriority): string {
  const names: Record<AlertPriority, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }
  return names[priority]
}

export function getOperatorDisplayName(operator: string): string {
  const names: Record<string, string> = {
    equals: 'Equals',
    not_equals: 'Not Equals',
    contains: 'Contains',
    greater_than: 'Greater Than',
    less_than: 'Less Than',
    between: 'Between',
    in: 'In List',
    not_in: 'Not In List',
  }
  return names[operator] || operator
}

export function calculateEstimatedReach(
  targetType: TargetType,
  targetIds?: string[],
  geographicTarget?: GeographicTarget,
  segments?: UserSegment[]
): number {
  // In production, this would query the database
  const estimates: Record<TargetType, () => number> = {
    user: () => (targetIds?.length || 0),
    group: () => (targetIds?.length || 0) * 50, // Assume average 50 users per group
    location: () => 5000, // Placeholder for location-based targeting
    segment: () => (segments?.reduce((sum, s) => sum + (s.estimatedSize || 100), 0) || 100),
    radius: () => {
      if (!geographicTarget?.radiusKm) return 1000
      // Rough estimate based on radius
      return Math.min(Math.round(geographicTarget.radiusKm * 500), 10000)
    },
    polygon: () => 2000, // Placeholder for polygon-based targeting
  }
  
  return estimates[targetType]() || 0
}

export function evaluateRule(
  userData: Record<string, unknown>,
  rule: TargetingRule
): boolean {
  const fieldValue = userData[rule.field]
  
  if (fieldValue === undefined || fieldValue === null) {
    return false
  }

  switch (rule.operator) {
    case 'equals':
      return fieldValue === rule.value
    case 'not_equals':
      return fieldValue !== rule.value
    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(rule.value as string)
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(rule.value)
      }
      return false
    case 'greater_than':
      return typeof fieldValue === 'number' && fieldValue > (rule.value as number)
    case 'less_than':
      return typeof fieldValue === 'number' && fieldValue < (rule.value as number)
    case 'between':
      if (Array.isArray(rule.value) && typeof fieldValue === 'number') {
        return fieldValue >= (rule.value[0] as number) && fieldValue <= (rule.value[1] as number)
      }
      return false
    case 'in':
      if (Array.isArray(rule.value)) {
        return rule.value.includes(fieldValue)
      }
      return false
    case 'not_in':
      if (Array.isArray(rule.value)) {
        return !rule.value.includes(fieldValue)
      }
      return true
    default:
      return false
  }
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createTargetedAlert(
  input: CreateTargetedAlertInput,
  userId: string
): Promise<TargetedAlert> {
  const validationResult = createTargetedAlertSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const alertId = `targeted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const estimatedReach = calculateEstimatedReach(
    input.targetType,
    input.targetIds,
    input.geographicTarget,
    input.segments
  )

  const alert: TargetedAlert = {
    id: alertId,
    title: input.title,
    body: input.body,
    alertType: input.alertType,
    priority: input.priority,
    targetType: input.targetType,
    targetIds: input.targetIds,
    geographicTarget: input.geographicTarget,
    segments: input.segments,
    targetingRules: input.targetingRules,
    targetingMode: input.targetingMode,
    targetedCount: 0,
    estimatedReach,
    scheduledAt: input.scheduledAt,
    expiresAt: input.expiresAt,
    status: input.scheduledAt ? 'scheduled' : 'draft',
    requireAcknowledgment: input.requireAcknowledgment || false,
    allowDuplicateTargeting: input.allowDuplicateTargeting || true,
    createdBy: userId,
    campaignId: input.campaignId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('targeted_alerts')
    .insert({
      id: alertId,
      title: input.title,
      body: input.body,
      alert_type: input.alertType,
      priority: input.priority,
      target_type: input.targetType,
      target_ids: input.targetIds,
      geographic_target: input.geographicTarget,
      segments: input.segments,
      targeting_rules: input.targetingRules,
      targeting_mode: input.targetingMode,
      targeted_count: 0,
      estimated_reach: estimatedReach,
      scheduled_at: input.scheduledAt,
      expires_at: input.expiresAt,
      status: input.scheduledAt ? 'scheduled' : 'draft',
      require_acknowledgment: input.requireAcknowledgment || false,
      allow_duplicate_targeting: input.allowDuplicateTargeting || true,
      created_by: userId,
      campaign_id: input.campaignId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating targeted alert:', error)
    throw new Error('Failed to create targeted alert')
  }

  // If scheduled, schedule the delivery
  if (input.scheduledAt) {
    await scheduleAlertDelivery(alertId, input.scheduledAt)
  }

  return alert
}

export async function getTargetedAlert(alertId: string): Promise<TargetedAlert | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('targeted_alerts')
    .select('*')
    .eq('id', alertId)
    .single()

  if (error || !data) {
    return null
  }

  return mapAlertFromDB(data)
}

export async function updateTargetedAlert(
  alertId: string,
  updates: Partial<CreateTargetedAlertInput>
): Promise<TargetedAlert> {
  const supabase = createClient()

  // Check if alert can be updated
  const alert = await getTargetedAlert(alertId)
  if (!alert) {
    throw new Error('Alert not found')
  }

  if (alert.status === 'sending' || alert.status === 'sent') {
    throw new Error('Cannot update alert that is already sending or sent')
  }

  const { error } = await supabase
    .from('targeted_alerts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)

  if (error) {
    console.error('Error updating targeted alert:', error)
    throw new Error('Failed to update targeted alert')
  }

  return getTargetedAlert(alertId) as Promise<TargetedAlert>
}

export async function estimateTargeting(alertId: string): Promise<{
  estimatedCount: number
  breakdown: Record<string, number>
}> {
  const alert = await getTargetedAlert(alertId)
  if (!alert) {
    throw new Error('Alert not found')
  }

  // Get matching users based on targeting criteria
  const matchingUsers = await queryMatchingUsers(alert)
  
  const breakdown: Record<string, number> = {
    total: matchingUsers.length,
  }

  return {
    estimatedCount: matchingUsers.length,
    breakdown,
  }
}

async function queryMatchingUsers(alert: TargetedAlert): Promise<string[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('users')
    .select('id, phone_number, push_token, email_verified, phone_verified')
  // Apply target type filters
  switch (alert.targetType) {
    case 'user':
      if (alert.targetIds && alert.targetIds.length > 0) {
        query = query.in('id', alert.targetIds)
      }
      break

    case 'group':
      if (alert.targetIds && alert.targetIds.length > 0) {
        const { data: groupMembers } = await supabase
          .from('user_group_members')
          .select('user_id')
          .in('group_id', alert.targetIds)

        const userIds = groupMembers?.map(m => m.user_id) || []
        if (userIds.length > 0) {
          query = query.in('id', userIds)
        } else {
          return []
        }
      }
      break

    case 'segment':
      if (alert.segments && alert.segments.length > 0) {
        for (const segment of alert.segments) {
          // Apply segment rules
          query = applySegmentFilters(query, segment)
        }
      }
      break

    case 'location':
      if (alert.geographicTarget?.type === 'radius') {
        // In production, use PostGIS for proper geospatial queries
        query = query
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
      }
      break
  }

  // Apply targeting rules if present
  if (alert.targetingRules && alert.targetingRules.length > 0) {
    for (const rule of alert.targetingRules) {
      query = applyTargetingRule(query, rule)
    }
  }

  const { data } = await query

  return (data || []).map((u: any) => u.id as string)
}

function applySegmentFilters(
  query: any,
  segment: UserSegment
): any {
  for (const rule of segment.rules) {
    query = applyTargetingRule(query, rule)
  }
  return query
}

function applyTargetingRule(
  query: any,
  rule: TargetingRule
): any {
  switch (rule.operator) {
    case 'equals':
      return query.eq(rule.field, rule.value as string | number | boolean | null)
    case 'not_equals':
      return query.neq(rule.field, rule.value as string | number | boolean | null)
    case 'greater_than':
      return query.gt(rule.field, rule.value as string | number)
    case 'less_than':
      return query.lt(rule.field, rule.value as string | number)
    case 'in':
      return query.in(rule.field, rule.value as unknown[])
    case 'not_in':
      return query.not(rule.field, 'in', rule.value as unknown[])
    default:
      return query
  }
}

export async function launchTargetedAlert(alertId: string): Promise<void> {
  const alert = await getTargetedAlert(alertId)
  if (!alert) {
    throw new Error('Alert not found')
  }

  if (alert.status === 'sending' || alert.status === 'sent') {
    throw new Error('Alert is already sending or has been sent')
  }

  const supabase = createClient()

  // Get matching users
  const userIds = await queryMatchingUsers(alert)

  if (userIds.length === 0) {
    await supabase
      .from('targeted_alerts')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
    throw new Error('No users match the targeting criteria')
  }

  // Update alert status to sending
  await supabase
    .from('targeted_alerts')
    .update({
      status: 'sending',
      targeted_count: userIds.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)

  // Create delivery records
  const deliveryRecords = userIds.map(userId => ({
    alert_id: alertId,
    user_id: userId,
    channel: 'push',
    status: 'pending',
    created_at: new Date().toISOString(),
  }))

  const { error: deliveryError } = await supabase
    .from('alert_delivery_records')
    .insert(deliveryRecords)

  if (deliveryError) {
    console.error('Error creating delivery records:', deliveryError)
  }

  // Trigger alert delivery (in production, this would be a job)
  await processAlertDelivery(alertId)
}

async function scheduleAlertDelivery(alertId: string, scheduledAt: string): Promise<void> {
  const supabase = createClient()

  // In production, use a job queue
  const { error } = await supabase
    .from('scheduled_alerts')
    .insert({
      alert_id: alertId,
      scheduled_at: scheduledAt,
      status: 'pending',
      created_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error scheduling alert:', error)
  }
}

async function processAlertDelivery(alertId: string): Promise<void> {
  const supabase = createClient()

  const alert = await getTargetedAlert(alertId)
  if (!alert) return

  // Get pending deliveries
  const { data: deliveries } = await supabase
    .from('alert_delivery_records')
    .select('*')
    .eq('alert_id', alertId)
    .eq('status', 'pending')
    .limit(1000)

  if (!deliveries || deliveries.length === 0) {
    // Mark alert as sent
    await supabase
      .from('targeted_alerts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        actual_reach: deliveries?.length || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
    return
  }

  // Process deliveries
  for (const delivery of deliveries) {
    // In production, send actual notification
    await supabase
      .from('alert_delivery_records')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', (delivery as any).id)
  }

  // Check if there are more deliveries to process
  const { count } = await supabase
    .from('alert_delivery_records')
    .select('*', { count: 'exact', head: true })
    .eq('alert_id', alertId)
    .eq('status', 'pending')

  if (count && count > 0) {
    // Continue processing
    await processAlertDelivery(alertId)
  } else {
    // Mark alert as sent
    await supabase
      .from('targeted_alerts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
  }
}

export async function acknowledgeDelivery(
  alertId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('alert_delivery_records')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
    })
    .eq('alert_id', alertId)
    .eq('user_id', userId)
}

export async function cancelTargetedAlert(alertId: string): Promise<void> {
  const supabase = createClient()

  const alert = await getTargetedAlert(alertId)
  if (!alert) {
    throw new Error('Alert not found')
  }

  if (alert.status === 'sent') {
    throw new Error('Cannot cancel an alert that has already been sent')
  }

  const { error } = await supabase
    .from('targeted_alerts')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)

  if (error) {
    console.error('Error cancelling alert:', error)
    throw new Error('Failed to cancel alert')
  }
}

export async function getTargetedAlerts(options?: {
  status?: AlertStatus
  createdBy?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}): Promise<TargetedAlert[]> {
  const supabase = createClient()

  let query = supabase
    .from('targeted_alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.createdBy) {
    query = query.eq('created_by', options.createdBy)
  }

  if (options?.fromDate) {
    query = query.gte('created_at', options.fromDate)
  }

  if (options?.toDate) {
    query = query.lte('created_at', options.toDate)
  }

  query = query
    .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching targeted alerts:', error)
    return []
  }

  return (data || []).map(mapAlertFromDB)
}

export async function getAlertAnalytics(alertId: string): Promise<{
  totalTargeted: number
  sent: number
  delivered: number
  acknowledged: number
  deliveryRate: number
  acknowledgmentRate: number
}> {
  const supabase = createClient()

  const { data: deliveries } = await supabase
    .from('alert_delivery_records')
    .select('status')
    .eq('alert_id', alertId)

  const stats = {
    totalTargeted: 0,
    sent: 0,
    delivered: 0,
    acknowledged: 0,
    deliveryRate: 0,
    acknowledgmentRate: 0,
  }

  if (!deliveries) return stats

  stats.totalTargeted = deliveries.length
  stats.sent = (deliveries as any[]).filter(d => ['sent', 'delivered', 'acknowledged'].includes(d.status)).length
  stats.delivered = (deliveries as any[]).filter(d => ['delivered', 'acknowledged'].includes(d.status)).length
  stats.acknowledged = (deliveries as any[]).filter(d => d.status === 'acknowledged').length

  stats.deliveryRate = stats.totalTargeted > 0 
    ? (stats.delivered / stats.totalTargeted) * 100 
    : 0

  stats.acknowledgmentRate = stats.totalTargeted > 0 
    ? (stats.acknowledged / stats.totalTargeted) * 100 
    : 0

  return stats
}

// ============================================================================
// User Segment Management
// ============================================================================

export async function createUserSegment(
  name: string,
  rules: TargetingRule[],
  targetingMode: TargetingMode = 'inclusive'
): Promise<UserSegment> {
  const supabase = createClient()

  const segmentId = `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Estimate segment size
  let estimatedSize = 0
  try {
    const sizeQuery = supabase.from('users').select('id', { count: 'exact', head: true })
    for (const rule of rules) {
      applyTargetingRule(sizeQuery, rule)
    }
    const { count } = await sizeQuery
    estimatedSize = count || 0
  } catch {
    estimatedSize = 100 // Fallback
  }

  const segment: UserSegment = {
    id: segmentId,
    name,
    rules,
    targetingMode,
    estimatedSize,
  }

  const { error } = await supabase
    .from('user_segments')
    .insert({
      id: segmentId,
      name,
      rules,
      targeting_mode: targetingMode,
      estimated_size: estimatedSize,
      created_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating user segment:', error)
    throw new Error('Failed to create user segment')
  }

  return segment
}

export async function getUserSegment(segmentId: string): Promise<UserSegment | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_segments')
    .select('*')
    .eq('id', segmentId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id as string,
    name: data.name as string,
    rules: data.rules as TargetingRule[],
    targetingMode: data.targeting_mode as TargetingMode,
    estimatedSize: (data.estimated_size as number) || 0,
  }
}

export async function getAllSegments(): Promise<UserSegment[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_segments')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching segments:', error)
    return []
  }

  return (data || []).map(d => ({
    id: d.id as string,
    name: d.name as string,
    rules: d.rules as TargetingRule[],
    targetingMode: d.targeting_mode as TargetingMode,
    estimatedSize: (d.estimated_size as number) || 0,
  }))
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapAlertFromDB(data: Record<string, unknown>): TargetedAlert {
  return {
    id: data.id as string,
    title: data.title as string,
    body: data.body as string,
    alertType: data.alert_type as string,
    priority: data.priority as AlertPriority,
    targetType: data.target_type as TargetType,
    targetIds: (data.target_ids as string[]) || undefined,
    geographicTarget: (data.geographic_target as GeographicTarget) || undefined,
    segments: (data.segments as UserSegment[]) || undefined,
    targetingRules: (data.targeting_rules as TargetingRule[]) || undefined,
    targetingMode: (data.targeting_mode as TargetingMode) || undefined,
    targetedCount: (data.targeted_count as number) || 0,
    estimatedReach: (data.estimated_reach as number) || 0,
    actualReach: data.actual_reach as number | undefined,
    scheduledAt: data.scheduled_at as string | undefined,
    expiresAt: data.expires_at as string | undefined,
    sentAt: data.sent_at as string | undefined,
    completedAt: data.completed_at as string | undefined,
    status: data.status as AlertStatus,
    requireAcknowledgment: (data.require_acknowledgment as boolean) || false,
    allowDuplicateTargeting: (data.allow_duplicate_targeting as boolean) || false,
    createdBy: data.created_by as string,
    campaignId: data.campaign_id as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
