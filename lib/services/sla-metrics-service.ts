/**
 * SLA Metrics Service
 *
 * Service for tracking and calculating SLA compliance for service requests
 * and incident escalations.
 */

import { createClient } from '@/lib/supabase/server'
import type { SLAMetric, SLAMetricInput } from '@/types/sla'

// ============================================================================
// Constants
// ============================================================================

/**
 * Default SLA times by entity type (in minutes)
 */
const DEFAULT_SLA_TIMES: Record<string, number> = {
  service_request: 1440,      // 24 hours for service requests
  incident: 60,                // 1 hour for incidents
  maintenance: 2880,           // 48 hours for maintenance
}

/**
 * Response time targets by severity
 */
const RESPONSE_TIME_TARGETS: Record<string, Record<string, number>> = {
  service_request: {
    low: 60,     // 1 hour
    medium: 240, // 4 hours
    high: 600,   // 10 hours
    critical: 180, // 3 hours
  },
  incident: {
    low: 30,     // 30 minutes
    medium: 60,  // 1 hour
    high: 120,   // 2 hours
    critical: 30, // 30 minutes (immediate)
  },
  maintenance: {
    low: 480,    // 8 hours
    medium: 960, // 16 hours
    high: 1440,  // 24 hours
    critical: 240, // 4 hours
  },
}

// ============================================================================
// Database Schema Helpers
// ============================================================================

/**
 * Ensure SLA columns exist on service_requests table
 */
export async function ensureServiceRequestSLAColumns(): Promise<void> {
  const supabase = createClient()

  // Add SLA columns if they don't exist
  await supabase.rpc('add_service_request_sla_columns', {
    p_table_name: 'service_requests',
    p_columns: ['sla_resolution_deadline', 'sla_response_deadline', 'current_escalation_level'],
  })
}

/**
 * Ensure incident SLA columns exist
 */
export async function ensureIncidentSLAColumns(): Promise<void> {
  const supabase = createClient()

  // Add SLA columns to incidents table
  await supabase.rpc('add_incident_sla_columns', {
    p_table_name: 'incidents',
    p_columns: ['sla_resolution_deadline', 'sla_response_deadline', 'current_escalation_level'],
  })
}

/**
 * Ensure work_order SLA columns exist
 */
export async function ensureWorkOrderSLAColumns(): Promise<void> {
  const supabase = createClient()

  // Add SLA columns to work_orders table
  await supabase.rpc('add_work_order_sla_columns', {
    p_table_name: 'work_orders',
    p_columns: ['sla_target_completion', 'sla_resolution_deadline', 'escalation_level'],
  })
}

/**
 * Bulk update SLA deadlines for service requests
 */
export async function updateServiceRequestSLADeadlines(
  inputs: Array<{ id: string; priority: string }>
): Promise<void> {
  const supabase = createClient()

  for (const input of inputs) {
    const slaTime = DEFAULT_SLA_TIMES.service_request
    const deadline = new Date()
    deadline.setMinutes(deadline.getMinutes() + slaTime)

    const { error } = await supabase
      .from('service_requests')
      .update({
        sla_resolution_deadline: deadline.toISOString(),
      })
      .eq('id', input.id)

    if (error) {
      console.error(`Failed to update SLA deadline for ${input.id}:`, error)
    }
  }
}

/**
 * Bulk update SLA deadlines for incidents
 */
export async function updateIncidentSLADeadlines(
  inputs: Array<{ id: string; severity: string }>
): Promise<void> {
  const supabase = createClient()

  for (const input of inputs) {
    const slaTime = DEFAULT_SLA_TIMES.incident
    const deadline = new Date()
    deadline.setMinutes(deadline.getMinutes() + slaTime)

    const { error } = await supabase
      .from('incidents')
      .update({
        sla_resolution_deadline: deadline.toISOString(),
      })
      .eq('id', input.id)

    if (error) {
      console.error(`Failed to update SLA deadline for ${input.id}:`, error)
    }
  }
}

// ============================================================================
// SLA Metric Calculations
// ============================================================================

/**
 * Calculate SLA compliance metrics for a given period
 */
export async function calculateSLAMetrics(
  entityType: string,
  period: 'daily' | 'weekly' | 'monthly',
  startDate?: Date,
  endDate?: Date
): Promise<SLAMetric[]> {
  const supabase = createClient()

  const query = supabase
    .from(entityType === 'service_request' ? 'service_requests' : 'incidents')
    .select('*')
    .gte('created_at', startDate?.toISOString() || new Date(Date.now() - 7 * 86400000).toISOString())

  const { data, error } = await query

  if (error) {
    console.error(`Failed to fetch ${entityType} for SLA metrics:`, error)
    return []
  }

  const items = data || []
  const now = new Date()

  const metrics: Array<{
    id: string
    entity_type: string
    period: string
    total_items: number
    within_sla: number
    breached: number
    compliance_rate: number
    avg_response_time_minutes: number
    avg_resolution_time_minutes: number
  }> = []

  // Default SLA time for this entity type
  const defaultSlaTime = DEFAULT_SLA_TIMES[entityType] || 1440

  for (const item of items) {
    const itemTime = new Date(item.created_at || item.detected_at)
    const responseDeadline = item.sla_response_deadline
      ? new Date(item.sla_response_deadline)
      : new Date(itemTime.getTime() + DEFAULT_RESPONSE_TIME[entityType] || 60 * 60 * 1000)
    const resolutionDeadline = item.sla_resolution_deadline
      ? new Date(item.sla_resolution_deadline)
      : new Date(itemTime.getTime() + defaultSlaTime * 60 * 1000)

    const isWithinSla = item.status === 'resolved' || new Date(item.updated_at || item.created_at) <= resolutionDeadline
    const isBreached = item.status !== 'resolved' && new Date(item.updated_at || item.created_at) > resolutionDeadline

    const responseTime = responseDeadline && item.updated_at
      ? (new Date(item.updated_at).getTime() - responseDeadline.getTime()) / (1000 * 60)
      : 0

    metrics.push({
      id: `${entityType}-${item.id}-${Date.now()}`,
      entity_type: entityType,
      period,
      total_items: 1,
      within_sla: isWithinSla ? 1 : 0,
      breached: isBreached ? 1 : 0,
      compliance_rate: isWithinSla ? 100 : 0,
      avg_response_time_minutes: Math.max(0, responseTime),
      avg_resolution_time_minutes: 0,
    })
  }

  // Aggregate by entity type
  const aggregated: Record<string, SLAMetric> = {}

  for (const metric of metrics) {
    if (!aggregated[metric.entity_type]) {
      aggregated[metric.entity_type] = {
        ...metric,
        total_items: 0,
        within_sla: 0,
        breached: 0,
      }
    }
    aggregated[metric.entity_type].total_items += metric.total_items
    aggregated[metric.entity_type].within_sla += metric.within_sla
    aggregated[metric.entity_type].breached += metric.breached
    aggregated[metric.entity_type].avg_response_time_minutes =
      (aggregated[metric.entity_type].avg_response_time_minutes * aggregated[metric.entity_type].total_items + metric.avg_response_time_minutes) /
      (aggregated[metric.entity_type].total_items + 1)
  }

  return Object.values(aggregated)
}

/**
 * Get SLA metrics for dashboard
 */
export async function getSLAMetricsForDashboard(): Promise<SLAMetric[]> {
  const [serviceRequestMetrics, incidentMetrics] = await Promise.all([
    calculateSLAMetrics('service_request', 'daily'),
    calculateSLAMetrics('incident', 'daily'),
  ])

  return [...serviceRequestMetrics, ...incidentMetrics]
}

/**
 * Get SLA compliance summary
 */
export async function getSLAComplianceSummary(): Promise<{
  overallCompliance: number
  byType: Record<string, { compliance: number; items: number; breached: number }>
  topBreachedTypes: Array<{ type: string; breachCount: number; totalItems: number }>
}> {
  const supabase = createClient()

  // Fetch all service requests and incidents
  const { data: serviceRequests } = await supabase
    .from('service_requests')
    .select('*')
    .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())

  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())

  const allItems = [...(serviceRequests || []), ...(incidents || [])]

  // Calculate metrics
  const withinSla = allItems.filter(
    (item) =>
      item.status === 'resolved' ||
      (item.sla_resolution_deadline &&
        new Date(item.updated_at || item.created_at) <= new Date(item.sla_resolution_deadline))
  ).length

  const breached = allItems.filter(
    (item) =>
      item.status !== 'resolved' &&
      item.sla_resolution_deadline &&
      new Date(item.updated_at || item.created_at) > new Date(item.sla_resolution_deadline)
  ).length

  const total = allItems.length
  const overallCompliance = total > 0 ? Math.round((withinSla / total) * 100) : 100

  // Group by type
  const byType: Record<string, { compliance: number; items: number; breached: number }> = {}

  for (const item of allItems) {
    const type = item.entity_type || (item.incident_type || 'other')
    if (!byType[type]) {
      byType[type] = { compliance: 0, items: 0, breached: 0 }
    }
    byType[type].items++
    if (item.status === 'resolved') {
      byType[type].compliance++
    } else if (item.sla_resolution_deadline && new Date(item.updated_at) > new Date(item.sla_resolution_deadline)) {
      byType[type].breached++
    }
  }

  // Get top breached types
  const topBreachedTypes = Object.entries(byType)
    .map(([type, data]) => ({
      type,
      breachCount: data.breached,
      totalItems: data.items,
    }))
    .filter((t) => t.breachCount > 0)
    .sort((a, b) => b.breachCount - a.breachCount)
    .slice(0, 5)

  return {
    overallCompliance,
    byType,
    topBreachedTypes,
  }
}

// ============================================================================
// Response Time Targets
// ============================================================================

/**
 * Get response time target for given entity type and priority
 */
export function getResponseTimeTarget(
  entityType: string,
  priority: 'low' | 'medium' | 'high' | 'critical'
): number {
  const targets = RESPONSE_TIME_TARGETS[entityType]
  return targets?.[priority] || 60 // default 1 hour
}

/**
 * Check if an item is within SLA
 */
export function isWithinSLA(
  item: {
    created_at: string
    sla_resolution_deadline?: string
    status: string
    updated_at?: string
  }
): boolean {
  const createdAt = new Date(item.created_at)
  const now = new Date(item.updated_at || item.created_at)

  if (!item.sla_resolution_deadline) {
    return true // No SLA deadline defined
  }

  const deadline = new Date(item.sla_resolution_deadline)
  return now <= deadline
}

/**
 * Get remaining SLA time in minutes
 */
export function getRemainingSLATime(
  item: {
    sla_resolution_deadline: string
    updated_at?: string
  }
): number {
  const now = new Date(item.updated_at || new Date())
  const deadline = new Date(item.sla_resolution_deadline)
  const diffMs = deadline.getTime() - now.getTime()
  return Math.max(0, diffMs / (1000 * 60)) // Convert to minutes
}
