import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export interface CommunityAnalytics {
  id: string
  groupId?: string
  
  // Time Period
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  startDate: string
  endDate: string
  
  // Engagement Metrics
  engagementScore: number
  activeMembers: number
  totalMembers: number
  newMembers: number
  returningMembers: number
  churnedMembers: number
  
  // Activity Metrics
  totalAlerts: number
  alertsByType: Record<string, number>
  alertsBySeverity: Record<string, number>
  averageResponseTime: number
  resolutionRate: number
  
  // Community Health
  memberSatisfaction: number
  participationRate: number
  contentQuality: number
  responseRate: number
  
  // Trends
  engagementTrend: 'up' | 'down' | 'stable'
  alertTrend: 'up' | 'down' | 'stable'
  growthTrend: 'up' | 'down' | 'stable'
  
  // Comparison
  comparedToPrevious: {
    engagementChange: number
    alertChange: number
    memberChange: number
  }
  
  // Top Content
  topAlerts: Array<{
    id: string
    title: string
    views: number
    engagement: number
  }>
  
  // Demographics
  memberActivity: {
    daily: number[]
    weekly: number[]
    hourly: number[]
  }
  
  createdAt: string
  updatedAt: string
}

export interface AnalyticsDashboard {
  id: string
  userId: string
  
  // Widgets
  widgets: AnalyticsWidget[]
  
  // Configuration
  refreshInterval: number
  dateRange: {
    preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
    start?: string
    end?: string
  }
  
  // Filters
  filters: {
    groups?: string[]
    alertTypes?: string[]
    severities?: string[]
    areas?: string[]
  }
  
  createdAt: string
  updatedAt: string
}

export interface AnalyticsWidget {
  id: string
  type: WidgetType
  title: string
  size: 'small' | 'medium' | 'large'
  position: {
    x: number
    y: number
  }
  config: Record<string, unknown>
}

export type WidgetType =
  | 'engagement_score'
  | 'active_members'
  | 'total_alerts'
  | 'resolution_rate'
  | 'alert_trend'
  | 'member_growth'
  | 'top_contributors'
  | 'alert_distribution'
  | 'response_time'
  | 'satisfaction_score'
  | 'heatmap'
  | 'funnel'

export interface CreateDashboardInput {
  userId: string
  widgets?: Partial<AnalyticsWidget>[]
  refreshInterval?: number
  dateRange?: AnalyticsDashboard['dateRange']
  filters?: AnalyticsDashboard['filters']
}

export interface UpdateDashboardInput {
  dashboardId: string
  widgets?: AnalyticsWidget[]
  refreshInterval?: number
  dateRange?: AnalyticsDashboard['dateRange']
  filters?: AnalyticsDashboard['filters']
}

export interface GenerateReportInput {
  groupId?: string
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  startDate: string
  endDate: string
  includeMetrics: string[]
  format?: 'json' | 'csv' | 'pdf'
}

// ============================================================================
// Status Configuration
// ============================================================================

export const WIDGET_TYPE_CONFIG: Record<WidgetType, {
  label: string
  icon: string
  description: string
  defaultSize: 'small' | 'medium' | 'large'
}> = {
  engagement_score: { label: 'Engagement Score', icon: '📊', description: 'Overall community engagement metric', defaultSize: 'small' },
  active_members: { label: 'Active Members', icon: '👥', description: 'Number of active members', defaultSize: 'small' },
  total_alerts: { label: 'Total Alerts', icon: '🔔', description: 'Total alerts in period', defaultSize: 'small' },
  resolution_rate: { label: 'Resolution Rate', icon: '✅', description: 'Percentage of resolved alerts', defaultSize: 'small' },
  alert_trend: { label: 'Alert Trend', icon: '📈', description: 'Alert volume over time', defaultSize: 'medium' },
  member_growth: { label: 'Member Growth', icon: '📈', description: 'Member growth over time', defaultSize: 'medium' },
  top_contributors: { label: 'Top Contributors', icon: '🏆', description: 'Top contributing members', defaultSize: 'medium' },
  alert_distribution: { label: 'Alert Distribution', icon: '📊', description: 'Alerts by type/severity', defaultSize: 'medium' },
  response_time: { label: 'Response Time', icon: '⏱️', description: 'Average response time', defaultSize: 'small' },
  satisfaction_score: { label: 'Satisfaction Score', icon: '😊', description: 'Member satisfaction metric', defaultSize: 'small' },
  heatmap: { label: 'Activity Heatmap', icon: '🗓️', description: 'Activity patterns over time', defaultSize: 'large' },
  funnel: { label: 'Engagement Funnel', icon: '🔻', description: 'User engagement funnel', defaultSize: 'medium' },
}

export const PERIOD_CONFIG: Record<string, {
  label: string
  days: number
}> = {
  daily: { label: 'Daily', days: 1 },
  weekly: { label: 'Weekly', days: 7 },
  monthly: { label: 'Monthly', days: 30 },
  quarterly: { label: 'Quarterly', days: 90 },
  yearly: { label: 'Yearly', days: 365 },
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createDashboardSchema = z.object({
  userId: z.string(),
  widgets: z.array(z.object({
    type: z.enum(['engagement_score', 'active_members', 'total_alerts', 'resolution_rate', 'alert_trend', 'member_growth', 'top_contributors', 'alert_distribution', 'response_time', 'satisfaction_score', 'heatmap', 'funnel']),
    title: z.string(),
    size: z.enum(['small', 'medium', 'large']).optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }).optional(),
    config: z.record(z.unknown()).optional(),
  })).optional(),
  refreshInterval: z.number().positive().optional(),
  dateRange: z.object({
    preset: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']),
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  filters: z.object({
    groups: z.array(z.string()).optional(),
    alertTypes: z.array(z.string()).optional(),
    severities: z.array(z.string()).optional(),
    areas: z.array(z.string()).optional(),
  }).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getWidgetTypeLabel(type: WidgetType): string {
  return WIDGET_TYPE_CONFIG[type]?.label || type
}

export function getWidgetTypeIcon(type: WidgetType): string {
  return WIDGET_TYPE_CONFIG[type]?.icon || '📊'
}

export function calculateEngagementScore(
  activeMembers: number,
  totalMembers: number,
  totalAlerts: number,
  resolutionRate: number,
  responseRate: number
): number {
  if (totalMembers === 0) return 0

  const participationRate = (activeMembers / totalMembers) * 100
  const engagement = (participationRate * 0.3) + (resolutionRate * 0.3) + (responseRate * 0.2) + (Math.min(totalAlerts / 100, 100) * 0.2)

  return Math.round(Math.min(engagement, 100))
}

export function getTrendDirection(value: number): 'up' | 'down' | 'stable' {
  if (value > 5) return 'up'
  if (value < -5) return 'down'
  return 'stable'
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`
  return `${Math.round(minutes / 1440)}d`
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function generateAnalytics(
  groupId?: string,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
  startDate?: string,
  endDate?: string
): Promise<CommunityAnalytics> {
  const supabase = createClient()

  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const end = endDate || new Date().toISOString()

  // Fetch alerts data
  let alertQuery = supabase
    .from('alerts')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)

  if (groupId) {
    alertQuery = alertQuery.eq('group_id', groupId)
  }

  const { data: alerts, error: alertError } = await alertQuery

  if (alertError) {
    console.error('Error fetching alerts:', alertError)
  }

  // Fetch members data
  let memberQuery = supabase
    .from('group_members')
    .select('*')

  if (groupId) {
    memberQuery = memberQuery.eq('group_id', groupId)
  }

  const { data: members, error: memberError } = await memberQuery

  if (memberError) {
    console.error('Error fetching members:', memberError)
  }

  const totalMembers = members?.length || 0
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const activeMembers = members?.filter(
    m => new Date(m.last_active_at) > weekAgo
  ).length || 0

  // Calculate metrics
  const alertsByType: Record<string, number> = {}
  const alertsBySeverity: Record<string, number> = {}

  for (const alert of alerts || []) {
    alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1
    alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1
  }

  const resolvedAlerts = (alerts || []).filter(a => a.status === 'resolved').length
  const resolutionRate = alerts?.length ? (resolvedAlerts / alerts.length) * 100 : 0

  // Calculate engagement score
  const engagementScore = calculateEngagementScore(
    activeMembers,
    totalMembers,
    alerts?.length || 0,
    resolutionRate,
    75 // Default response rate
  )

  const analytics: CommunityAnalytics = {
    id: `analytics_${Date.now()}`,
    groupId,
    period,
    startDate: start,
    endDate: end,
    engagementScore,
    activeMembers,
    totalMembers,
    newMembers: 0,
    returningMembers: 0,
    churnedMembers: 0,
    totalAlerts: alerts?.length || 0,
    alertsByType,
    alertsBySeverity,
    averageResponseTime: 30,
    resolutionRate,
    memberSatisfaction: 85,
    participationRate: totalMembers ? (activeMembers / totalMembers) * 100 : 0,
    contentQuality: 90,
    responseRate: 75,
    engagementTrend: 'stable',
    alertTrend: 'stable',
    growthTrend: 'stable',
    comparedToPrevious: {
      engagementChange: 0,
      alertChange: 0,
      memberChange: 0,
    },
    topAlerts: [],
    memberActivity: {
      daily: Array(7).fill(0),
      weekly: Array(4).fill(0),
      hourly: Array(24).fill(0),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Save analytics
  await supabase
    .from('community_analytics')
    .insert({
      id: analytics.id,
      group_id: groupId,
      period,
      start_date: start,
      end_date: end,
      engagement_score: engagementScore,
      active_members: activeMembers,
      total_members: totalMembers,
      total_alerts: alerts?.length || 0,
      alerts_by_type: alertsByType,
      alerts_by_severity: alertsBySeverity,
      resolution_rate: resolutionRate,
      participation_rate: analytics.participationRate,
      response_rate: 75,
      created_at: new Date().toISOString(),
    })

  return analytics
}

export async function getAnalytics(
  analyticsId: string
): Promise<CommunityAnalytics | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_analytics')
    .select('*')
    .eq('id', analyticsId)
    .single()

  if (error || !data) return null

  return mapAnalyticsFromDB(data)
}

export async function createDashboard(
  input: CreateDashboardInput
): Promise<AnalyticsDashboard> {
  const validationResult = createDashboardSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const dashboardId = `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Default widgets
  const defaultWidgets: AnalyticsWidget[] = [
    { id: 'w1', type: 'engagement_score', title: 'Engagement Score', size: 'small', position: { x: 0, y: 0 } },
    { id: 'w2', type: 'active_members', title: 'Active Members', size: 'small', position: { x: 1, y: 0 } },
    { id: 'w3', type: 'total_alerts', title: 'Total Alerts', size: 'small', position: { x: 2, y: 0 } },
    { id: 'w4', type: 'resolution_rate', title: 'Resolution Rate', size: 'small', position: { x: 3, y: 0 } },
    { id: 'w5', type: 'alert_trend', title: 'Alert Trend', size: 'medium', position: { x: 0, y: 1 } },
    { id: 'w6', type: 'member_growth', title: 'Member Growth', size: 'medium', position: { x: 2, y: 1 } },
  ]

  const dashboard: AnalyticsDashboard = {
    id: dashboardId,
    userId: input.userId,
    widgets: input.widgets?.map((w, i) => ({
      id: `w_${Date.now()}_${i}`,
      type: w.type!,
      title: w.title || getWidgetTypeLabel(w.type!),
      size: w.size || WIDGET_TYPE_CONFIG[w.type!]?.defaultSize || 'medium',
      position: w.position || { x: i % 4, y: Math.floor(i / 4) },
      config: w.config || {},
    })) || defaultWidgets,
    refreshInterval: input.refreshInterval || 300000,
    dateRange: input.dateRange || { preset: 'month' },
    filters: input.filters || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('analytics_dashboards')
    .insert({
      id: dashboardId,
      user_id: input.userId,
      widgets: dashboard.widgets,
      refresh_interval: dashboard.refreshInterval,
      date_range: dashboard.dateRange,
      filters: dashboard.filters,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating dashboard:', error)
    throw new Error('Failed to create dashboard')
  }

  return dashboard
}

export async function getDashboard(
  dashboardId: string
): Promise<AnalyticsDashboard | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('analytics_dashboards')
    .select('*')
    .eq('id', dashboardId)
    .single()

  if (error || !data) return null

  return mapDashboardFromDB(data)
}

export async function updateDashboard(
  input: UpdateDashboardInput
): Promise<AnalyticsDashboard> {
  const supabase = createClient()

  const dashboard = await getDashboard(input.dashboardId)
  if (!dashboard) {
    throw new Error('Dashboard not found')
  }

  const updates: Partial<AnalyticsDashboard> = { updatedAt: new Date().toISOString() }

  if (input.widgets) updates.widgets = input.widgets
  if (input.refreshInterval) updates.refreshInterval = input.refreshInterval
  if (input.dateRange) updates.dateRange = input.dateRange
  if (input.filters) updates.filters = input.filters

  const { error } = await supabase
    .from('analytics_dashboards')
    .update({
      widgets: updates.widgets,
      refresh_interval: updates.refreshInterval,
      date_range: updates.dateRange,
      filters: updates.filters,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.dashboardId)

  if (error) {
    console.error('Error updating dashboard:', error)
    throw new Error('Failed to update dashboard')
  }

  return getDashboard(input.dashboardId) as Promise<AnalyticsDashboard>
}

export async function getGroupAnalyticsHistory(
  groupId: string,
  limit: number = 30
): Promise<CommunityAnalytics[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_analytics')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching analytics history:', error)
    return []
  }

  return (data || []).map(mapAnalyticsFromDB)
}

export async function generateReport(
  input: GenerateReportInput
): Promise<{
  data: Record<string, unknown>
  format: string
  generatedAt: string
}> {
  const analytics = await generateAnalytics(input.groupId, input.period, input.startDate, input.endDate)

  const report: Record<string, unknown> = {
    period: {
      start: input.startDate,
      end: input.endDate,
      type: input.period,
    },
    summary: {
      engagementScore: analytics.engagementScore,
      activeMembers: analytics.activeMembers,
      totalAlerts: analytics.totalAlerts,
      resolutionRate: analytics.resolutionRate,
    },
  }

  // Include requested metrics
  for (const metric of input.includeMetrics) {
    if (metric in analytics) {
      report[metric] = (analytics as Record<string, unknown>)[metric]
    }
  }

  return {
    data: report,
    format: input.format || 'json',
    generatedAt: new Date().toISOString(),
  }
}

export async function trackEvent(
  eventType: string,
  eventData: Record<string, unknown>,
  userId?: string,
  groupId?: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('analytics_events')
    .insert({
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event_type: eventType,
      event_data: eventData,
      user_id: userId,
      group_id: groupId,
      created_at: new Date().toISOString(),
    })
}

export async function getRealTimeStats(): Promise<{
  activeUsers: number
  alertsToday: number
  pendingAlerts: number
  groupsActive: number
}> {
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const { count: alertsToday } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)

  const { count: pendingAlerts } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return {
    activeUsers: 0,
    alertsToday: alertsToday || 0,
    pendingAlerts: pendingAlerts || 0,
    groupsActive: 0,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapAnalyticsFromDB(data: Record<string, unknown>): CommunityAnalytics {
  return {
    id: data.id as string,
    groupId: data.group_id as string | undefined,
    period: data.period as 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: data.start_date as string,
    endDate: data.end_date as string,
    engagementScore: data.engagement_score,
    activeMembers: data.active_members,
    totalMembers: data.total_members,
    newMembers: data.new_members || 0,
    returningMembers: data.returning_members || 0,
    churnedMembers: data.churned_members || 0,
    totalAlerts: data.total_alerts,
    alertsByType: (data.alerts_by_type as Record<string, number>) || {},
    alertsBySeverity: (data.alerts_by_severity as Record<string, number>) || {},
    averageResponseTime: data.average_response_time || 30,
    resolutionRate: data.resolution_rate as number,
    memberSatisfaction: data.member_satisfaction as string || 85,
    participationRate: data.participation_rate as number,
    contentQuality: data.content_quality || 90,
    responseRate: data.response_rate as number || 75,
    engagementTrend: (data.engagement_trend as 'up' | 'down' | 'stable') || 'stable',
    alertTrend: (data.alert_trend as 'up' | 'down' | 'stable') || 'stable',
    growthTrend: (data.growth_trend as 'up' | 'down' | 'stable') || 'stable',
    comparedToPrevious: (data.compared_to_previous as { engagementChange: number; alertChange: number; memberChange: number }) || {
      engagementChange: 0,
      alertChange: 0,
      memberChange: 0,
    },
    topAlerts: (data.top_alerts as Array<{ id: string; title: string; views: number; engagement: number }>) || [],
    memberActivity: (data.member_activity as { daily: number[]; weekly: number[]; hourly: number[] }) || {
      daily: Array(7).fill(0),
      weekly: Array(4).fill(0),
      hourly: Array(24).fill(0),
    },
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

function mapDashboardFromDB(data: Record<string, unknown>): AnalyticsDashboard {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    widgets: (data.widgets as AnalyticsWidget[]) || [],
    refreshInterval: data.refresh_interval,
    dateRange: data.date_range as AnalyticsDashboard['dateRange'],
    filters: (data.filters as AnalyticsDashboard['filters']) || {},
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
