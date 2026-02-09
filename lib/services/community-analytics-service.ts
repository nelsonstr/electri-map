import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Time period for analytics
 */
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'

/**
 * Alert type
 */
export type AlertAnalyticsType =
  | 'sos'
  | 'medical'
  | 'community_alert'
  | 'targeted_alert'
  | 'professional_alert'
  | 'outage'
  | 'restoration'

/**
 * Engagement metric
 */
export type EngagementMetric =
  | 'views'
  | 'clicks'
  | 'shares'
  | 'confirmations'
  | 'comments'
  | 'reactions'

/**
 * Analytics summary
 */
export interface AnalyticsSummary {
  period: AnalyticsPeriod
  startDate: string
  endDate: string
  
  // Engagement metrics
  totalAlerts: number
  activeUsers: number
  averageResponseTime: number
  confirmationRate: number
  
  // Alert breakdown
  alertsByType: Record<AlertAnalyticsType, number>
  
  // Geographic distribution
  topLocations: LocationMetric[]
  
  // Trends
  trendDirection: 'up' | 'down' | 'stable'
  trendPercentage: number
}

/**
 * Location metric
 */
export interface LocationMetric {
  municipality?: string
  parish?: string
  latitude?: number
  longitude?: number
  value: number
  percentage?: number
}

/**
 * User engagement metrics
 */
export interface UserEngagementMetrics {
  userId: string
  
  // Activity
  alertsTriggered: number
  alertsReceived: number
  alertsConfirmed: number
  commentsMade: number
  postsCreated: number
  
  // Time
  lastActiveAt: string
  totalActiveDays: number
  streak: number
  
  // Contributions
  verifiedReports: number
  helpfulVotes: number
  impactScore: number
}

/**
 * Community health metrics
 */
export interface CommunityHealthMetrics {
  municipality?: string
  period: AnalyticsPeriod
  
  // Activity
  totalAlerts: number
  resolvedAlerts: number
  averageResolutionTime: number
  
  // Participation
  activeUsers: number
  newUsers: number
  returningUsers: number
  
  // Quality
  verificationRate: number
  falseAlertRate: number
  userSatisfactionScore: number
  
  // Safety indicators
  criticalAlerts: number
  responseTimeP50: number
  responseTimeP95: number
}

/**
 * Alert trend data
 */
export interface AlertTrendPoint {
  timestamp: string
  count: number
  type?: AlertAnalyticsType
}

/**
 * Top contributor
 */
export interface TopContributor {
  userId: string
  displayName?: string
  avatarUrl?: string
  
  contributions: number
  verifiedReports: number
  impactScore: number
  rank: number
}

/**
 * Geographic heat map point
 */
export interface HeatMapPoint {
  latitude: number
  longitude: number
  intensity: number
  count?: number
}

/**
 * Analytics filter options
 */
export interface AnalyticsFilterOptions {
  municipality?: string
  parish?: string
  alertTypes?: AlertAnalyticsType[]
  period?: AnalyticsPeriod
  startDate?: string
  endDate?: string
}

/**
 * Date range
 */
export interface DateRange {
  start: Date
  end: Date
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for analytics filters
 */
export const analyticsFilterSchema = z.object({
  municipality: z.string().optional(),
  parish: z.string().optional(),
  alertTypes: z.array(z.enum([
    'sos', 'medical', 'community_alert', 'targeted_alert',
    'professional_alert', 'outage', 'restoration'
  ])).optional(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'all']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for alert type
 */
export function getAlertTypeDisplayName(type: AlertAnalyticsType): string {
  const names: Record<AlertAnalyticsType, string> = {
    sos: 'SOS Alerts',
    medical: 'Medical Alerts',
    community_alert: 'Community Alerts',
    targeted_alert: 'Targeted Alerts',
    professional_alert: 'Professional Alerts',
    outage: 'Outage Alerts',
    restoration: 'Restoration Updates',
  }
  return names[type]
}

/**
 * Gets display name for engagement metric
 */
export function getEngagementMetricDisplayName(metric: EngagementMetric): string {
  const names: Record<EngagementMetric, string> = {
    views: 'Views',
    clicks: 'Clicks',
    shares: 'Shares',
    confirmations: 'Confirmations',
    comments: 'Comments',
    reactions: 'Reactions',
  }
  return names[metric]
}

/**
 * Calculates trend direction
 */
export function calculateTrendDirection(
  current: number,
  previous: number
): 'up' | 'down' | 'stable' {
  if (previous === 0) return 'up'
  const change = ((current - previous) / previous) * 100
  if (change > 5) return 'up'
  if (change < -5) return 'down'
  return 'stable'
}

/**
 * Calculates percentage change
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Gets analytics summary for a period
 */
export async function getAnalyticsSummary(
  options?: AnalyticsFilterOptions
): Promise<AnalyticsSummary> {
  const supabase = createClient()

  const period = options?.period || 'month'
  const dateRange = getDateRangeForPeriod(period)

  // Get total alerts
  let alertQuery = supabase
    .from('alerts')
    .select('id, alert_type, created_at', { count: 'exact' })
    .gte('created_at', dateRange.start.toISOString())

  if (options?.municipality) {
    alertQuery = alertQuery.eq('municipality', options.municipality)
  }

  if (options?.alertTypes && options.alertTypes.length > 0) {
    alertQuery = alertQuery.in('alert_type', options.alertTypes)
  }

  const { count: totalAlerts, data: alerts } = await alertQuery

  // Get active users
  let userQuery = supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .gte('last_active_at', dateRange.start.toISOString())

  if (options?.municipality) {
    userQuery = userQuery.eq('municipality', options.municipality)
  }

  const { count: activeUsers } = await userQuery

  // Get alerts by type
  const alertsByType: Record<AlertAnalyticsType, number> = {
    sos: 0,
    medical: 0,
    community_alert: 0,
    targeted_alert: 0,
    professional_alert: 0,
    outage: 0,
    restoration: 0,
  }

  for (const alert of alerts || []) {
    const type = mapAlertType(alert.alert_type)
    if (type && alertsByType[type] !== undefined) {
      alertsByType[type]++
    }
  }

  // Get top locations
  const topLocations = await getTopLocations(dateRange, options?.municipality)

  // Calculate trend
  const previousDateRange = getPreviousPeriod(dateRange.start, dateRange.end, period)
  const previousCount = await getAlertCountForDateRange(previousDateRange, options)

  const trendDirection = calculateTrendDirection(totalAlerts || 0, previousCount)
  const trendPercentage = calculatePercentageChange(totalAlerts || 0, previousCount)

  // Calculate average response time
  const averageResponseTime = await calculateAverageResponseTime(dateRange, options?.municipality)

  // Calculate confirmation rate
  const confirmationRate = await calculateConfirmationRate(dateRange, options?.municipality)

  return {
    period,
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
    totalAlerts: totalAlerts || 0,
    activeUsers: activeUsers || 0,
    averageResponseTime,
    confirmationRate,
    alertsByType,
    topLocations,
    trendDirection,
    trendPercentage,
  }
}

/**
 * Gets user engagement metrics
 */
export async function getUserEngagementMetrics(
  userId: string
): Promise<UserEngagementMetrics> {
  const supabase = createClient()

  const { data: user } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user) {
    throw new Error('User not found')
  }

  // Get alerts triggered
  const { count: alertsTriggered } = await supabase
    .from('alerts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  // Get alerts received (community alerts user subscribed to)
  const { count: alertsReceived } = await supabase
    .from('alert_subscriptions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  // Get confirmations
  const { count: alertsConfirmed } = await supabase
    .from('alert_confirmations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  // Get comments
  const { count: commentsMade } = await supabase
    .from('alert_comments')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  // Get posts (if neighborhood groups exist)
  const { count: postsCreated } = await supabase
    .from('group_posts')
    .select('*', { count: 'exact' })
    .eq('author_id', userId)

  // Calculate active days and streak
  const activeDays = await calculateActiveDays(userId)
  const streak = await calculateStreak(userId)

  // Get verified reports
  const { count: verifiedReports } = await supabase
    .from('community_alerts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('verification_status', 'verified')

  // Get helpful votes
  const { count: helpfulVotes } = await supabase
    .from('alert_votes')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_helpful', true)

  // Calculate impact score
  const impactScore = calculateImpactScore({
    alertsTriggered: alertsTriggered || 0,
    alertsConfirmed: alertsConfirmed || 0,
    commentsMade: commentsMade || 0,
    verifiedReports: verifiedReports || 0,
    helpfulVotes: helpfulVotes || 0,
  })

  return {
    userId,
    alertsTriggered: alertsTriggered || 0,
    alertsReceived: alertsReceived || 0,
    alertsConfirmed: alertsConfirmed || 0,
    commentsMade: commentsMade || 0,
    postsCreated: postsCreated || 0,
    lastActiveAt: user.last_active_at || user.created_at,
    totalActiveDays: activeDays,
    streak,
    verifiedReports: verifiedReports || 0,
    helpfulVotes: helpfulVotes || 0,
    impactScore,
  }
}

/**
 * Gets community health metrics
 */
export async function getCommunityHealthMetrics(
  municipality?: string
): Promise<CommunityHealthMetrics> {
  const supabase = createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const today = new Date()

  // Total alerts
  let totalQuery = supabase
    .from('alerts')
    .select('id, status, created_at', { count: 'exact' })
    .gte('created_at', thirtyDaysAgo.toISOString())

  if (municipality) {
    totalQuery = totalQuery.eq('municipality', municipality)
  }

  const { count: totalAlerts } = await totalQuery

  // Resolved alerts
  let resolvedQuery = supabase
    .from('alerts')
    .select('id, resolved_at, created_at', { count: 'exact' })
    .gte('created_at', thirtyDaysAgo.toISOString())
    .not('resolved_at', 'is', null)

  if (municipality) {
    resolvedQuery = resolvedQuery.eq('municipality', municipality)
  }

  const { count: resolvedAlerts } = await resolvedQuery

  // Active users
  let usersQuery = supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .gte('last_active_at', thirtyDaysAgo.toISOString())

  if (municipality) {
    usersQuery = usersQuery.eq('municipality', municipality)
  }

  const { count: activeUsers } = await usersQuery

  // New users
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Calculation resolution time
  const averageResolutionTime = await calculateAverageResolutionTime(thirtyDaysAgo, municipality)

  // Verification rate
  const verificationRate = await calculateVerificationRate(thirtyDaysAgo, municipality)

  // False alert rate
  const falseAlertRate = await calculateFalseAlertRate(thirtyDaysAgo, municipality)

  // Critical alerts
  let criticalQuery = supabase
    .from('alerts')
    .select('id', { count: 'exact' })
    .gte('created_at', thirtyDaysAgo.toISOString())
    .in('severity', ['critical', 'high'])

  if (municipality) {
    criticalQuery = criticalQuery.eq('municipality', municipality)
  }

  const { count: criticalAlerts } = await criticalQuery

  // Response times
  const responseTimeP50 = await calculateResponseTimePercentile(50, thirtyDaysAgo, municipality)
  const responseTimeP95 = await calculateResponseTimePercentile(95, thirtyDaysAgo, municipality)

  return {
    municipality,
    period: 'month',
    totalAlerts: totalAlerts || 0,
    resolvedAlerts: resolvedAlerts || 0,
    averageResolutionTime,
    activeUsers: activeUsers || 0,
    newUsers: newUsers || 0,
    returningUsers: (activeUsers || 0) - (newUsers || 0),
    verificationRate,
    falseAlertRate,
    userSatisfactionScore: 4.2, // Placeholder
    criticalAlerts: criticalAlerts || 0,
    responseTimeP50,
    responseTimeP95,
  }
}

/**
 * Gets alert trends over time
 */
export async function getAlertTrends(
  options?: AnalyticsFilterOptions
): Promise<AlertTrendPoint[]> {
  const supabase = createClient()

  const period = options?.period || 'week'
  const dateRange = getDateRangeForPeriod(period)

  let query = supabase
    .from('alerts')
    .select('created_at, alert_type')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())

  if (options?.municipality) {
    query = query.eq('municipality', options.municipality)
  }

  if (options?.alertTypes && options.alertTypes.length > 0) {
    const types = options.alertTypes.map(t => t.replace('_', '-'))
    query = query.in('alert_type', types)
  }

  const { data: alerts } = await query

  // Group by day
  const trendMap = new Map<string, { count: number; type?: string }>()

  for (const alert of alerts || []) {
    const date = new Date(alert.created_at).toISOString().split('T')[0]
    const existing = trendMap.get(date) || { count: 0 }
    existing.count++
    existing.type = alert.alert_type
    trendMap.set(date, existing)
  }

  return Array.from(trendMap.entries())
    .map(([timestamp, { count }]) => ({
      timestamp,
      count,
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

/**
 * Gets top contributors
 */
export async function getTopContributors(
  municipality?: string,
  limit: number = 10
): Promise<TopContributor[]> {
  const supabase = createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get users with their contribution counts
  let query = supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      avatar_url,
      community_alerts!inner(id, verification_status),
      alert_confirmations!inner(id),
      alert_comments!inner(id)
    `)
    .gte('community_alerts.created_at', thirtyDaysAgo.toISOString())
    .not('community_alerts.verification_status', 'eq', 'dismissed')

  if (municipality) {
    query = query.eq('municipality', municipality)
  }

  const { data: users } = await query

  if (!users || users.length === 0) {
    return []
  }

  // Calculate scores and rank
  const contributors = users.map(user => {
    const verifiedReports = user.community_alerts?.filter(
      (a: Record<string, unknown>) => a.verification_status === 'verified'
    ).length || 0

    const totalReports = user.community_alerts?.length || 0
    const confirmations = user.alert_confirmations?.length || 0
    const comments = user.alert_comments?.length || 0

    const contributions = totalReports + confirmations + comments
    const impactScore = (verifiedReports * 10) + confirmations + (comments * 0.5)

    return {
      userId: user.id,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      contributions,
      verifiedReports,
      impactScore,
      rank: 0,
    }
  })
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, limit)
    .map((c, i) => ({ ...c, rank: i + 1 }))

  return contributors
}

/**
 * Gets heat map data for alerts
 */
export async function getAlertHeatMap(
  options?: AnalyticsFilterOptions
): Promise<HeatMapPoint[]> {
  const supabase = createClient()

  const period = options?.period || 'month'
  const dateRange = getDateRangeForPeriod(period)

  let query = supabase
    .from('alerts')
    .select('latitude, longitude')
    .gte('created_at', dateRange.start.toISOString())
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (options?.municipality) {
    query = query.eq('municipality', options.municipality)
  }

  const { data: alerts } = await query

  // Aggregate into heat map points
  const pointMap = new Map<string, { lat: number; lng: number; count: number }>()

  for (const alert of alerts || []) {
    if (alert.latitude && alert.longitude) {
      // Round to ~100m grid
      const lat = Math.round(alert.latitude * 10) / 10
      const lng = Math.round(alert.longitude * 10) / 10
      const key = `${lat},${lng}`
      
      const existing = pointMap.get(key) || { lat, lng, count: 0 }
      existing.count++
      pointMap.set(key, existing)
    }
  }

  // Find max for normalization
  const maxCount = Math.max(...Array.from(pointMap.values()).map(p => p.count))

  return Array.from(pointMap.values()).map(point => ({
    latitude: point.lat,
    longitude: point.lng,
    intensity: maxCount > 0 ? point.count / maxCount : 0,
    count: point.count,
  }))
}

/**
 * Gets comparison data between periods
 */
export async function getPeriodComparison(
  currentPeriod: AnalyticsPeriod,
  previousPeriod: AnalyticsPeriod,
  municipality?: string
): Promise<{
  current: AnalyticsSummary
  previous: AnalyticsSummary
  changes: Record<string, number>
}> {
  const currentOptions: AnalyticsFilterOptions = {
    municipality,
    period: currentPeriod,
  }

  const previousOptions: AnalyticsFilterOptions = {
    municipality,
    period: previousPeriod,
  }

  const [current, previous] = await Promise.all([
    getAnalyticsSummary(currentOptions),
    getAnalyticsSummary(previousOptions),
  ])

  const changes: Record<string, number> = {
    totalAlerts: calculatePercentageChange(current.totalAlerts, previous.totalAlerts),
    activeUsers: calculatePercentageChange(current.activeUsers, previous.activeUsers),
    confirmationRate: calculatePercentageChange(current.confirmationRate, previous.confirmationRate),
    averageResponseTime: calculatePercentageChange(
      current.averageResponseTime,
      previous.averageResponseTime
    ),
  }

  // Add type-specific changes
  for (const type of Object.keys(current.alertsByType) as AlertAnalyticsType[]) {
    changes[`${type}Alerts`] = calculatePercentageChange(
      current.alertsByType[type],
      previous.alertsByType[type]
    )
  }

  return { current, previous, changes }
}

/**
 * Exports analytics data
 */
export async function exportAnalyticsData(
  options?: AnalyticsFilterOptions
): Promise<{
  summary: AnalyticsSummary
  trends: AlertTrendPoint[]
  topContributors: TopContributor[]
  heatMap: HeatMapPoint[]
}> {
  const [summary, trends, topContributors, heatMap] = await Promise.all([
    getAnalyticsSummary(options),
    getAlertTrends(options),
    getTopContributors(options?.municipality),
    getAlertHeatMap(options),
  ])

  return { summary, trends, topContributors, heatMap }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets date range for period
 */
function getDateRangeForPeriod(period: AnalyticsPeriod): DateRange {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case 'day':
      start.setDate(start.getDate() - 1)
      break
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'quarter':
      start.setMonth(start.getMonth() - 3)
      break
    case 'year':
      start.setFullYear(start.getFullYear() - 1)
      break
    case 'all':
      start.setFullYear(2020)
      break
  }

  return { start, end }
}

/**
 * Gets previous period
 */
function getPreviousPeriod(
  start: Date,
  end: Date,
  period: AnalyticsPeriod
): DateRange {
  const duration = end.getTime() - start.getTime()
  const previousEnd = new Date(start)
  const previousStart = new Date(start.getTime() - duration)

  return { start: previousStart, end: previousEnd }
}

/**
 * Gets alert count for date range
 */
async function getAlertCountForDateRange(
  dateRange: DateRange,
  options?: AnalyticsFilterOptions
): Promise<number> {
  const supabase = createClient()

  let query = supabase
    .from('alerts')
    .select('id', { count: 'exact' })
    .gte('created_at', dateRange.start.toISOString())
    .lt('created_at', dateRange.end.toISOString())

  if (options?.municipality) {
    query = query.eq('municipality', options.municipality)
  }

  const { count } = await query
  return count || 0
}

/**
 * Gets top locations
 */
async function getTopLocations(
  dateRange: DateRange,
  municipality?: string
): Promise<LocationMetric[]> {
  const supabase = createClient()

  let query = supabase
    .from('alerts')
    .select('municipality, parish, latitude, longitude, id')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())
    .not('municipality', 'is', null)

  if (municipality) {
    query = query.eq('municipality', municipality)
  }

  const { data: alerts } = await query

  // Aggregate by municipality
  const locationMap = new Map<string, LocationMetric>()

  for (const alert of alerts || []) {
    const key = alert.municipality || 'unknown'
    const existing = locationMap.get(key) || {
      municipality: alert.municipality,
      parish: alert.parish,
      latitude: alert.latitude || undefined,
      longitude: alert.longitude || undefined,
      value: 0,
    }
    existing.value++
    locationMap.set(key, existing)
  }

  const total = Array.from(locationMap.values()).reduce((sum, l) => sum + l.value, 0)

  return Array.from(locationMap.values())
    .map(location => ({
      ...location,
      percentage: total > 0 ? Math.round((location.value / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
}

/**
 * Maps alert type to analytics type
 */
function mapAlertType(alertType: string): AlertAnalyticsType | null {
  const mapping: Record<string, AlertAnalyticsType> = {
    sos: 'sos',
    medical: 'medical',
    community_alert: 'community_alert',
    targeted_alert: 'targeted_alert',
    professional_alert: 'professional_alert',
    outage: 'outage',
    restoration: 'restoration',
  }
  return mapping[alertType] || null
}

/**
 * Calculates average response time
 */
async function calculateAverageResponseTime(
  dateRange: DateRange,
  municipality?: string
): Promise<number> {
  const supabase = createClient()

  let query = supabase
    .from('alerts')
    .select('created_at, acknowledged_at')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())
    .not('acknowledged_at', 'is', null)

  if (municipality) {
    query = query.eq('municipality', municipality)
  }

  const { data: alerts } = await query

  if (!alerts || alerts.length === 0) {
    return 0
  }

  let totalTime = 0
  let count = 0

  for (const alert of alerts) {
    if (alert.acknowledged_at) {
      const created = new Date(alert.created_at).getTime()
      const acknowledged = new Date(alert.acknowledged_at).getTime()
      totalTime += acknowledged - created
      count++
    }
  }

  return count > 0 ? totalTime / count / 60000 : 0 // Return in minutes
}

/**
 * Calculates confirmation rate
 */
async function calculateConfirmationRate(
  dateRange: DateRange,
  municipality?: string
): Promise<number> {
  const supabase = createClient()

  let alertQuery = supabase
    .from('alerts')
    .select('id')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())

  if (municipality) {
    alertQuery = alertQuery.eq('municipality', municipality)
  }

  const { count: totalAlerts } = await alertQuery

  if (!totalAlerts) {
    return 0
  }

  let confirmations = 0

  const { data: alerts } = await alertQuery

  if (alerts) {
    const alertIds = alerts.map(a => a.id)

    const { count } = await supabase
      .from('alert_confirmations')
      .select('id', { count: 'exact' })
      .in('alert_id', alertIds)

    confirmations = count || 0
  }

  return Math.round((confirmations / totalAlerts) * 100)
}

/**
 * Calculates active days
 */
async function calculateActiveDays(userId: string): Promise<number> {
  const supabase = createClient()

  const { data: activities } = await supabase
    .from('user_activities')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(365)

  if (!activities || activities.length === 0) {
    return 0
  }

  const uniqueDays = new Set<string>()
  for (const activity of activities) {
    uniqueDays.add(new Date(activity.created_at).toISOString().split('T')[0])
  }

  return uniqueDays.size
}

/**
 * Calculates streak
 */
async function calculateStreak(userId: string): Promise<number> {
  const supabase = createClient()

  const { data: activities } = await supabase
    .from('user_activities')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (!activities || activities.length === 0) {
    return 0
  }

  let streak = 0
  let currentDate = new Date().toISOString().split('T')[0]

  for (const activity of activities) {
    const activityDate = new Date(activity.created_at).toISOString().split('T')[0]
    
    if (activityDate === currentDate || activityDate === new Date(Date.now() - streak * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) {
      if (activityDate === currentDate) {
        streak++
        currentDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    } else {
      break
    }
  }

  return streak
}

/**
 * Calculates impact score
 */
function calculateImpactScore(metrics: {
  alertsTriggered: number
  alertsConfirmed: number
  commentsMade: number
  verifiedReports: number
  helpfulVotes: number
}): number {
  const weights = {
    alertsTriggered: 5,
    alertsConfirmed: 2,
    commentsMade: 1,
    verifiedReports: 10,
    helpfulVotes: 3,
  }

  return (
    metrics.alertsTriggered * weights.alertsTriggered +
    metrics.alertsConfirmed * weights.alertsConfirmed +
    metrics.commentsMade * weights.commentsMade +
    metrics.verifiedReports * weights.verifiedReports +
    metrics.helpfulVotes * weights.helpfulVotes
  )
}

/**
 * Calculates average resolution time
 */
async function calculateAverageResolutionTime(
  dateRange: Date,
  municipality?: string
): Promise<number> {
  const supabase = createClient()

  let query = supabase
    .from('alerts')
    .select('created_at, resolved_at')
    .gte('created_at', dateRange.toISOString())
    .not('resolved_at', 'is', null)

  if (municipality) {
    query = query.eq('municipality', municipality)
  }

  const { data: alerts } = await query

  if (!alerts || alerts.length === 0) {
    return 0
  }

  let totalTime = 0
  let count = 0

  for (const alert of alerts) {
    if (alert.resolved_at) {
      const created = new Date(alert.created_at).getTime()
      const resolved = new Date(alert.resolved_at).getTime()
      totalTime += resolved - created
      count++
    }
  }

  return count > 0 ? totalTime / count / 60000 : 0
}

/**
 * Calculates verification rate
 */
async function calculateVerificationRate(
  dateRange: Date,
  municipality?: string
): Promise<number> {
  const supabase = createClient()

  let totalQuery = supabase
    .from('community_alerts')
    .select('id', { count: 'exact' })
    .gte('created_at', dateRange.toISOString())

  let verifiedQuery = supabase
    .from('community_alerts')
    .select('id', { count: 'exact' })
    .gte('created_at', dateRange.toISOString())
    .eq('verification_status', 'verified')

  if (municipality) {
    totalQuery = totalQuery.eq('municipality', municipality)
    verifiedQuery = verifiedQuery.eq('municipality', municipality)
  }

  const [{ count: total }, { count: verified }] = await Promise.all([totalQuery, verifiedQuery])

  if (!total || total === 0) {
    return 0
  }

  return Math.round(((verified || 0) / total) * 100)
}

/**
 * Calculates false alert rate
 */
async function calculateFalseAlertRate(
  dateRange: Date,
  municipality?: string
): Promise<number> {
  const supabase = createClient()

  let totalQuery = supabase
    .from('community_alerts')
    .select('id', { count: 'exact' })
    .gte('created_at', dateRange.toISOString())

  let dismissedQuery = supabase
    .from('community_alerts')
    .select('id', { count: 'exact' })
    .gte('created_at', dateRange.toISOString())
    .eq('verification_status', 'dismissed')

  if (municipality) {
    totalQuery = totalQuery.eq('municipality', municipality)
    dismissedQuery = dismissedQuery.eq('municipality', municipality)
  }

  const [{ count: total }, { count: dismissed }] = await Promise.all([totalQuery, dismissedQuery])

  if (!total || total === 0) {
    return 0
  }

  return Math.round(((dismissed || 0) / total) * 100)
}

/**
 * Calculates response time percentile
 */
async function calculateResponseTimePercentile(
  percentile: number,
  dateRange: Date,
  municipality?: string
): Promise<number> {
  const supabase = createClient()

  let query = supabase
    .from('alerts')
    .select('created_at, acknowledged_at')
    .gte('created_at', dateRange.toISOString())
    .not('acknowledged_at', 'is', null)

  if (municipality) {
    query = query.eq('municipality', municipality)
  }

  const { data: alerts } = await query

  if (!alerts || alerts.length === 0) {
    return 0
  }

  const responseTimes: number[] = []

  for (const alert of alerts) {
    if (alert.acknowledged_at) {
      const created = new Date(alert.created_at).getTime()
      const acknowledged = new Date(alert.acknowledged_at).getTime()
      responseTimes.push((acknowledged - created) / 60000)
    }
  }

  if (responseTimes.length === 0) {
    return 0
  }

  responseTimes.sort((a, b) => a - b)
  const index = Math.floor((percentile / 100) * responseTimes.length)
  
  return responseTimes[index]
}
