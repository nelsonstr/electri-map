/**
 * SLA Metrics Type Definitions
 *
 * Types for Service Level Agreement tracking and reporting
 */

/**
 * SLA metric for dashboard display
 */
export interface SLAMetric {
  id: string
  entity_type: string
  period: 'daily' | 'weekly' | 'monthly'
  total_items: number
  within_sla: number
  breached: number
  compliance_rate: number
  avg_response_time_minutes: number
  avg_resolution_time_minutes: number
}

/**
 * Input for creating SLA metric
 */
export interface SLAMetricInput {
  entityType: string
  period: 'daily' | 'weekly' | 'monthly'
  totalItems: number
  withinSla: number
  breached: number
  complianceRate?: number
  avgResponseTimeMinutes?: number
  avgResolutionTimeMinutes?: number
}

/**
 * SLA compliance summary
 */
export interface SLAComplianceSummary {
  overallCompliance: number
  byType: Record<string, { compliance: number; items: number; breached: number }>
  topBreachedTypes: Array<{
    type: string
    breachCount: number
    totalItems: number
  }>
}

/**
 * SLA configuration for entity types
 */
export interface SLAConfiguration {
  entityType: string
  resolutionDeadlineMinutes: number
  responseDeadlineMinutes: number
  priorityLevels: Array<{
    name: string
    targetMinutes: number
    color: string
  }>
}

/**
 * Escalation level configuration
 */
export interface EscalationLevel {
  level: number
  role: string
  notificationDelayMinutes: number
}

/**
 * SLA breach record
 */
export interface SLABreachRecord {
  id: string
  entityType: string
  entityId: string
  entityTitle: string
  deadline: string
  actualTimeAt: string
  severity: string
  priority: string
  createdAt: string
  resolvedAt?: string
}
