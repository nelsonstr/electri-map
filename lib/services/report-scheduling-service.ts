import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type ReportStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'

export type ReportType =
  | 'power_outage_summary'
  | 'restoration_progress'
  | 'community_activity'
  | 'alert_statistics'
  | 'user_engagement'
  | 'emergency_response'
  | 'custom'

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export type DeliveryFormat = 'pdf' | 'csv' | 'xlsx' | 'json'

export interface ReportSchedule {
  id: string
  name: string
  description?: string
  status: ReportStatus
  reportType: ReportType
  
  // Scheduling
  startDate: string
  endDate?: string
  timezone: string
  
  // Time
  scheduledTime: string // HH:mm format
  
  // Recurrence
  recurrence: RecurrenceType
  
  // Report Configuration
  reportConfig: {
    filters?: Record<string, unknown>
    columns?: string[]
    groupBy?: string[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    customQuery?: string
  }
  
  // Delivery
  deliveryConfig: {
    recipients: string[]
    format: DeliveryFormat
    includeCharts: boolean
    compressOutput: boolean
  }
  
  // Metadata
  createdBy: string
  lastRunAt?: string
  nextRunAt?: string
  totalRuns: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CreateReportScheduleInput {
  name: string
  description?: string
  reportType: ReportType
  startDate: string
  endDate?: string
  timezone: string
  scheduledTime: string
  recurrence: RecurrenceType
  reportConfig?: ReportSchedule['reportConfig']
  deliveryConfig: ReportSchedule['deliveryConfig']
}

export interface UpdateReportScheduleInput {
  name?: string
  description?: string
  reportType?: ReportType
  startDate?: string
  endDate?: string
  timezone?: string
  scheduledTime?: string
  recurrence?: RecurrenceType
  reportConfig?: ReportSchedule['reportConfig']
  deliveryConfig?: ReportSchedule['deliveryConfig']
  status?: ReportStatus
}

export interface ReportData {
  metadata: {
    reportName: string
    generatedAt: string
    dateRange: {
      start: string
      end: string
    }
    filters?: Record<string, unknown>
  }
  summary: Record<string, unknown>
  data: Array<Record<string, unknown>>
  charts?: Array<{
    type: string
    title: string
    data: Array<{
      label: string
      value: number
    }>
  }>
}

export interface ScheduleFilters {
  status?: ReportStatus
  reportType?: ReportType
  createdBy?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createReportScheduleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  reportType: z.enum([
    'power_outage_summary',
    'restoration_progress',
    'community_activity',
    'alert_statistics',
    'user_engagement',
    'emergency_response',
    'custom',
  ]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  timezone: z.string(),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  reportConfig: z.object({
    filters: z.record(z.unknown()).optional(),
    columns: z.array(z.string()).optional(),
    groupBy: z.array(z.string()).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    customQuery: z.string().optional(),
  }).optional(),
  deliveryConfig: z.object({
    recipients: z.array(z.string().email()),
    format: z.enum(['pdf', 'csv', 'xlsx', 'json']),
    includeCharts: z.boolean().default(true),
    compressOutput: z.boolean().default(false),
  }),
})

export const updateReportScheduleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  reportType: z.enum([
    'power_outage_summary',
    'restoration_progress',
    'community_activity',
    'alert_statistics',
    'user_engagement',
    'emergency_response',
    'custom',
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().optional(),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  reportConfig: z.object({
    filters: z.record(z.unknown()).optional(),
    columns: z.array(z.string()).optional(),
    groupBy: z.array(z.string()).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    customQuery: z.string().optional(),
  }).optional(),
  deliveryConfig: z.object({
    recipients: z.array(z.string().email()).optional(),
    format: z.enum(['pdf', 'csv', 'xlsx', 'json']).optional(),
    includeCharts: z.boolean().optional(),
    compressOutput: z.boolean().optional(),
  }).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getReportStatusDisplayName(status: ReportStatus): string {
  const names: Record<ReportStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return names[status]
}

export function getReportTypeDisplayName(type: ReportType): string {
  const names: Record<ReportType, string> = {
    power_outage_summary: 'Power Outage Summary',
    restoration_progress: 'Restoration Progress',
    community_activity: 'Community Activity',
    alert_statistics: 'Alert Statistics',
    user_engagement: 'User Engagement',
    emergency_response: 'Emergency Response',
    custom: 'Custom Report',
  }
  return names[type]
}

export function getRecurrenceTypeDisplayName(type: RecurrenceType): string {
  const names: Record<RecurrenceType, string> = {
    none: 'One Time',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  }
  return names[type]
}

export function calculateNextReportRun(
  schedule: ReportSchedule,
  fromDate?: Date
): Date | null {
  const now = fromDate || new Date()
  const startDate = new Date(schedule.startDate)
  
  if (schedule.status !== 'active') {
    return null
  }
  
  if (schedule.endDate && new Date(schedule.endDate) < now) {
    return null
  }
  
  const [hours, minutes] = schedule.scheduledTime.split(':').map(Number)
  
  let nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)
  
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1)
  }
  
  switch (schedule.recurrence) {
    case 'none':
      if (startDate > nextRun) {
        return startDate
      }
      return null
      
    case 'daily':
      return nextRun
      
    case 'weekly':
      return nextRun
      
    case 'monthly':
      nextRun.setDate(1)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
      return nextRun
      
    case 'quarterly':
      const currentMonth = nextRun.getMonth()
      const quarterStart = Math.floor(currentMonth / 3) * 3
      nextRun.setMonth(quarterStart)
      nextRun.setDate(1)
      
      if (nextRun <= now) {
        nextRun.setMonth(quarterStart + 3)
      }
      return nextRun
      
    case 'yearly':
      nextRun.setMonth(0)
      nextRun.setDate(1)
      if (nextRun <= now) {
        nextRun.setFullYear(nextRun.getFullYear() + 1)
      }
      return nextRun
      
    default:
      return nextRun
  }
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createReportSchedule(
  userId: string,
  input: CreateReportScheduleInput
): Promise<ReportSchedule> {
  const validationResult = createReportScheduleSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const id = `rpt_sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const schedule: ReportSchedule = {
    id,
    name: input.name,
    description: input.description,
    status: 'draft',
    reportType: input.reportType,
    startDate: input.startDate,
    endDate: input.endDate,
    timezone: input.timezone,
    scheduledTime: input.scheduledTime,
    recurrence: input.recurrence,
    reportConfig: input.reportConfig,
    deliveryConfig: input.deliveryConfig,
    createdBy: userId,
    totalRuns: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const nextRun = calculateNextReportRun(schedule)
  
  const { data, error } = await supabase
    .from('report_schedules')
    .insert({
      id,
      name: input.name,
      description: input.description,
      status: 'draft',
      report_type: input.reportType,
      start_date: input.startDate,
      end_date: input.endDate,
      timezone: input.timezone,
      scheduled_time: input.scheduledTime,
      recurrence: input.recurrence,
      report_config: input.reportConfig,
      delivery_config: input.deliveryConfig,
      created_by: userId,
      total_runs: 0,
      next_run_at: nextRun?.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating report schedule:', error)
    throw new Error('Failed to create report schedule')
  }

  return mapReportScheduleFromDB(data)
}

export async function updateReportSchedule(
  scheduleId: string,
  input: UpdateReportScheduleInput
): Promise<ReportSchedule> {
  const validationResult = updateReportScheduleSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
  }
  
  delete updateData.status

  const { data, error } = await supabase
    .from('report_schedules')
    .update(updateData)
    .eq('id', scheduleId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating report schedule:', error)
    throw new Error('Failed to update report schedule')
  }

  return mapReportScheduleFromDB(data)
}

export async function deleteReportSchedule(scheduleId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('report_schedules')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)

  if (error) {
    console.error('Error deleting report schedule:', error)
    throw new Error('Failed to delete report schedule')
  }
}

export async function getReportSchedule(
  scheduleId: string
): Promise<ReportSchedule | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('report_schedules')
    .select('*')
    .eq('id', scheduleId)
    .single()

  if (error || !data) {
    return null
  }

  return mapReportScheduleFromDB(data)
}

export async function getReportSchedules(
  filters?: ScheduleFilters
): Promise<ReportSchedule[]> {
  const supabase = createClient()

  let query = supabase
    .from('report_schedules')
    .select('*')
    .neq('status', 'cancelled')

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.reportType) {
    query = query.eq('report_type', filters.reportType)
  }

  if (filters?.createdBy) {
    query = query.eq('created_by', filters.createdBy)
  }

  if (filters?.fromDate) {
    query = query.gte('start_date', filters.fromDate)
  }

  if (filters?.toDate) {
    query = query.lte('end_date', filters.toDate)
  }

  query = query
    .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50) - 1)
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching report schedules:', error)
    return []
  }

  return (data || []).map(mapReportScheduleFromDB)
}

export async function activateReportSchedule(scheduleId: string): Promise<void> {
  const supabase = createClient()

  const { data: schedule } = await supabase
    .from('report_schedules')
    .select('*')
    .eq('id', scheduleId)
    .single()

  if (!schedule) {
    throw new Error('Report schedule not found')
  }

  const nextRun = calculateNextReportRun(mapReportScheduleFromDB(schedule))

  const { error } = await supabase
    .from('report_schedules')
    .update({
      status: 'active',
      next_run_at: nextRun?.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)

  if (error) {
    console.error('Error activating report schedule:', error)
    throw new Error('Failed to activate report schedule')
  }
}

export async function pauseReportSchedule(scheduleId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('report_schedules')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)

  if (error) {
    console.error('Error pausing report schedule:', error)
    throw new Error('Failed to pause report schedule')
  }
}

export async function getDueReportSchedules(): Promise<ReportSchedule[]> {
  const supabase = createClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('report_schedules')
    .select('*')
    .eq('status', 'active')
    .lte('start_date', now)
    .lte('next_run_at', now)
    .order('next_run_at', { ascending: true })

  if (error) {
    console.error('Error fetching due report schedules:', error)
    return []
  }

  return (data || []).map(mapReportScheduleFromDB)
}

export async function generateReport(
  schedule: ReportSchedule
): Promise<ReportData> {
  const endDate = new Date()
  const startDate = new Date()
  
  switch (schedule.recurrence) {
    case 'daily':
      startDate.setDate(startDate.getDate() - 1)
      break
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1)
      break
    case 'quarterly':
      startDate.setMonth(startDate.getMonth() - 3)
      break
    case 'yearly':
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    default:
      startDate.setDate(startDate.getDate() - 1)
  }

  const supabase = createClient()
  
  let reportData: ReportData = {
    metadata: {
      reportName: schedule.name,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      filters: schedule.reportConfig?.filters,
    },
    summary: {},
    data: [],
    charts: [],
  }

  switch (schedule.reportType) {
    case 'power_outage_summary':
      const { data: outageData } = await supabase
        .from('power_outages')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      reportData.summary = {
        totalOutages: outageData?.length || 0,
        resolvedOutages: outageData?.filter(o => o.status === 'resolved').length || 0,
        activeOutages: outageData?.filter(o => o.status === 'active').length || 0,
      }
      reportData.data = outageData || []
      break
      
    case 'restoration_progress':
      const { data: restorationData } = await supabase
        .from('restorations')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      reportData.summary = {
        totalRestorations: restorationData?.length || 0,
        completedRestorations: restorationData?.filter(r => r.status === 'completed').length || 0,
        pendingRestorations: restorationData?.filter(r => r.status === 'pending').length || 0,
      }
      reportData.data = restorationData || []
      break
      
    case 'community_activity':
      const { data: communityData } = await supabase
        .from('community_alerts')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      reportData.summary = {
        totalAlerts: communityData?.length || 0,
        verifiedReports: communityData?.filter(a => a.is_verified).length || 0,
        averageResponseTime: 'N/A',
      }
      reportData.data = communityData || []
      break
      
    default:
      reportData.data = []
  }

  return reportData
}

export async function deliverReport(
  schedule: ReportSchedule,
  reportData: ReportData
): Promise<void> {
  const supabase = createClient()
  
  // Log the delivery
  const { error } = await supabase.from('report_deliveries').insert({
    id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    schedule_id: schedule.id,
    delivered_at: new Date().toISOString(),
    recipients: schedule.deliveryConfig.recipients,
    format: schedule.deliveryConfig.format,
    status: 'delivered',
  })

  if (error) {
    console.error('Error logging report delivery:', error)
    throw new Error('Failed to log report delivery')
  }

  // In production, this would actually send emails with attachments
  console.log(`Report "${schedule.name}" delivered to ${schedule.deliveryConfig.recipients.join(', ')}`)
}

export async function recordReportRun(
  scheduleId: string,
  success: boolean
): Promise<void> {
  const supabase = createClient()

  const schedule = await getReportSchedule(scheduleId)
  if (!schedule) {
    throw new Error('Report schedule not found')
  }

  const nextRun = calculateNextReportRun(schedule, new Date())

  const { error } = await supabase
    .from('report_schedules')
    .update({
      last_run_at: new Date().toISOString(),
      total_runs: schedule.totalRuns + 1,
      next_run_at: nextRun?.toISOString() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)

  if (error) {
    console.error('Error recording report run:', error)
    throw new Error('Failed to record report run')
  }
}

export async function getReportHistory(
  scheduleId: string,
  limit: number = 50
): Promise<Array<{
  id: string
  deliveredAt: string
  recipients: string[]
  format: DeliveryFormat
  status: string
}>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('report_deliveries')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('delivered_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching report history:', error)
    return []
  }

  return (data || []).map(d => ({
    id: d.id,
    deliveredAt: d.delivered_at,
    recipients: d.recipients,
    format: d.format,
    status: d.status,
  }))
}

export async function cloneReportSchedule(
  scheduleId: string,
  userId: string,
  newName?: string
): Promise<ReportSchedule> {
  const original = await getReportSchedule(scheduleId)
  if (!original) {
    throw new Error('Report schedule not found')
  }

  return createReportSchedule(userId, {
    name: newName || `${original.name} (Copy)`,
    description: original.description,
    reportType: original.reportType,
    startDate: original.startDate,
    endDate: original.endDate,
    timezone: original.timezone,
    scheduledTime: original.scheduledTime,
    recurrence: original.recurrence,
    reportConfig: original.reportConfig,
    deliveryConfig: original.deliveryConfig,
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapReportScheduleFromDB(data: Record<string, unknown>): ReportSchedule {
  return {
    id: data.id,
    name: data.name,
    description: data.description as string | undefined,
    status: data.status as ReportStatus,
    reportType: data.report_type as ReportType,
    startDate: data.start_date,
    endDate: data.end_date as string | undefined,
    timezone: data.timezone,
    scheduledTime: data.scheduled_time,
    recurrence: data.recurrence as RecurrenceType,
    reportConfig: data.report_config as ReportSchedule['reportConfig'] | undefined,
    deliveryConfig: data.delivery_config as ReportSchedule['deliveryConfig'],
    createdBy: data.created_by,
    lastRunAt: data.last_run_at as string | undefined,
    nextRunAt: data.next_run_at as string | undefined,
    totalRuns: data.total_runs,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
