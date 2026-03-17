import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type ScheduleStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface AlertSchedule {
  id: string
  name: string
  description?: string
  status: ScheduleStatus
  
  // Scheduling
  startDate: string
  endDate?: string
  timezone: string
  
  // Time
  scheduledTime: string // HH:mm format
  
  // Recurrence
  recurrence: RecurrenceType
  recurrencePattern?: {
    daysOfWeek?: DayOfWeek[]
    dayOfMonth?: number
    interval?: number
    customPattern?: string
  }
  
  // Alert Configuration
  alertConfig: {
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    message: string
    targetAudience?: {
      locations?: string[]
      groups?: string[]
      userSegments?: string[]
    }
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

export interface CreateScheduleInput {
  name: string
  description?: string
  startDate: string
  endDate?: string
  timezone: string
  scheduledTime: string
  recurrence: RecurrenceType
  recurrencePattern?: AlertSchedule['recurrencePattern']
  alertConfig: AlertSchedule['alertConfig']
}

export interface UpdateScheduleInput {
  name?: string
  description?: string
  startDate?: string
  endDate?: string
  timezone?: string
  scheduledTime?: string
  recurrence?: RecurrenceType
  recurrencePattern?: AlertSchedule['recurrencePattern']
  alertConfig?: AlertSchedule['alertConfig']
  status?: ScheduleStatus
}

export interface ScheduleFilters {
  status?: ScheduleStatus
  recurrence?: RecurrenceType
  createdBy?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}

export interface ScheduleStatistics {
  totalSchedules: number
  activeSchedules: number
  pausedSchedules: number
  totalRunsToday: number
  upcomingAlerts: Array<{
    scheduleId: string
    name: string
    scheduledFor: string
  }>
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createScheduleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  timezone: z.string(),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']),
  recurrencePattern: z.object({
    daysOfWeek: z.array(z.enum([
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    ])).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    interval: z.number().min(1).optional(),
    customPattern: z.string().optional(),
  }).optional(),
  alertConfig: z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    title: z.string().max(200),
    message: z.string(),
    targetAudience: z.object({
      locations: z.array(z.string()).optional(),
      groups: z.array(z.string()).optional(),
      userSegments: z.array(z.string()).optional(),
    }).optional(),
  }),
})

export const updateScheduleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().optional(),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']).optional(),
  recurrencePattern: z.object({
    daysOfWeek: z.array(z.enum([
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    ])).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    interval: z.number().min(1).optional(),
    customPattern: z.string().optional(),
  }).optional(),
  alertConfig: z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    title: z.string().max(200),
    message: z.string(),
    targetAudience: z.object({
      locations: z.array(z.string()).optional(),
      groups: z.array(z.string()).optional(),
      userSegments: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getScheduleStatusDisplayName(status: ScheduleStatus): string {
  const names: Record<ScheduleStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return names[status]
}

export function getRecurrenceTypeDisplayName(type: RecurrenceType): string {
  const names: Record<RecurrenceType, string> = {
    none: 'One Time',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    custom: 'Custom',
  }
  return names[type]
}

export function calculateNextRun(
  schedule: AlertSchedule,
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
      // Every day - already handled by incrementing by 1 day
      return nextRun
      
    case 'weekly':
      const days = schedule.recurrencePattern?.daysOfWeek || []
      if (days.length === 0) return null
      
      while (true) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const currentDay = dayNames[nextRun.getDay()]
        
        if (days.includes(currentDay as DayOfWeek)) {
          return nextRun
        }
        
        nextRun.setDate(nextRun.getDate() + 1)
      }
      
    case 'monthly':
      const dayOfMonth = schedule.recurrencePattern?.dayOfMonth || 1
      nextRun.setDate(dayOfMonth)
      
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
      
      return nextRun
      
    case 'yearly':
      nextRun.setMonth(0)
      nextRun.setDate(1)
      const yearlyDay = schedule.recurrencePattern?.dayOfMonth || 1
      nextRun.setDate(yearlyDay)
      
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

export async function createSchedule(
  userId: string,
  input: CreateScheduleInput
): Promise<AlertSchedule> {
  const validationResult = createScheduleSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const id = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const schedule: AlertSchedule = {
    id,
    name: input.name,
    description: input.description,
    status: 'draft',
    startDate: input.startDate,
    endDate: input.endDate,
    timezone: input.timezone,
    scheduledTime: input.scheduledTime,
    recurrence: input.recurrence,
    recurrencePattern: input.recurrencePattern,
    alertConfig: input.alertConfig,
    createdBy: userId,
    totalRuns: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const nextRun = calculateNextRun(schedule)
  
  const { data, error } = await supabase
    .from('alert_schedules')
    .insert({
      id,
      name: input.name,
      description: input.description,
      status: 'draft',
      start_date: input.startDate,
      end_date: input.endDate,
      timezone: input.timezone,
      scheduled_time: input.scheduledTime,
      recurrence: input.recurrence,
      recurrence_pattern: input.recurrencePattern,
      alert_config: input.alertConfig,
      created_by: userId,
      total_runs: 0,
      next_run_at: nextRun?.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating schedule:', error)
    throw new Error('Failed to create schedule')
  }

  return mapScheduleFromDB(data)
}

export async function updateSchedule(
  scheduleId: string,
  input: UpdateScheduleInput
): Promise<AlertSchedule> {
  const validationResult = updateScheduleSchema.safeParse(input)
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
    .from('alert_schedules')
    .update(updateData)
    .eq('id', scheduleId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating schedule:', error)
    throw new Error('Failed to update schedule')
  }

  return mapScheduleFromDB(data)
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('alert_schedules')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)

  if (error) {
    console.error('Error deleting schedule:', error)
    throw new Error('Failed to delete schedule')
  }
}

export async function getSchedule(scheduleId: string): Promise<AlertSchedule | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('alert_schedules')
    .select('*')
    .eq('id', scheduleId)
    .single()

  if (error || !data) {
    return null
  }

  return mapScheduleFromDB(data)
}

export async function getSchedules(
  filters?: ScheduleFilters
): Promise<AlertSchedule[]> {
  const supabase = createClient()

  let query = supabase
    .from('alert_schedules')
    .select('*')
    .neq('status', 'cancelled')

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.recurrence) {
    query = query.eq('recurrence', filters.recurrence)
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
    console.error('Error fetching schedules:', error)
    return []
  }

  return (data || []).map(mapScheduleFromDB)
}

export async function activateSchedule(scheduleId: string): Promise<void> {
  const supabase = createClient()

  const { data: schedule } = await supabase
    .from('alert_schedules')
    .select('*')
    .eq('id', scheduleId)
    .single()

  if (!schedule) {
    throw new Error('Schedule not found')
  }

  const nextRun = calculateNextRun(mapScheduleFromDB(schedule))

  const { error } = await supabase
    .from('alert_schedules')
    .update({
      status: 'active',
      next_run_at: nextRun?.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)

  if (error) {
    console.error('Error activating schedule:', error)
    throw new Error('Failed to activate schedule')
  }
}

export async function pauseSchedule(scheduleId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('alert_schedules')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)

  if (error) {
    console.error('Error pausing schedule:', error)
    throw new Error('Failed to pause schedule')
  }
}

export async function getDueSchedules(): Promise<AlertSchedule[]> {
  const supabase = createClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('alert_schedules')
    .select('*')
    .eq('status', 'active')
    .lte('start_date', now)
    .lte('next_run_at', now)
    .order('next_run_at', { ascending: true })

  if (error) {
    console.error('Error fetching due schedules:', error)
    return []
  }

  return (data || []).map(mapScheduleFromDB)
}

export async function recordScheduleRun(
  scheduleId: string,
  alertId: string
): Promise<void> {
  const supabase = createClient()

  const schedule = await getSchedule(scheduleId)
  if (!schedule) {
    throw new Error('Schedule not found')
  }

  const nextRun = calculateNextRun(schedule, new Date())

  const { error } = await supabase
    .from('alert_schedules')
    .update({
      last_run_at: new Date().toISOString(),
      total_runs: schedule.totalRuns + 1,
      next_run_at: nextRun?.toISOString() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)

  if (error) {
    console.error('Error recording schedule run:', error)
    throw new Error('Failed to record schedule run')
  }

  // Log the run
  await supabase.from('alert_schedule_runs').insert({
    id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    schedule_id: scheduleId,
    alert_id: alertId,
    run_at: new Date().toISOString(),
    status: 'success',
  })
}

export async function getScheduleHistory(
  scheduleId: string,
  limit: number = 50
): Promise<Array<{
  id: string
  runAt: string
  status: string
  alertId?: string
}>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('alert_schedule_runs')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('run_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching schedule history:', error)
    return []
  }

  return (data || []).map(d => ({
    id: d.id,
    runAt: d.run_at,
    status: d.status,
    alertId: d.alert_id,
  }))
}

export async function getScheduleStatistics(): Promise<ScheduleStatistics> {
  const supabase = createClient()

  const { data: schedules } = await supabase
    .from('alert_schedules')
    .select('*')
    .neq('status', 'cancelled')

  if (!schedules || schedules.length === 0) {
    return {
      totalSchedules: 0,
      activeSchedules: 0,
      pausedSchedules: 0,
      totalRunsToday: 0,
      upcomingAlerts: [],
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: runsToday } = await supabase
    .from('alert_schedule_runs')
    .select('*')
    .gte('run_at', today.toISOString())
    .lt('run_at', tomorrow.toISOString())

  const { data: upcoming } = await supabase
    .from('alert_schedules')
    .select('id, name, next_run_at')
    .eq('status', 'active')
    .lte('start_date', new Date().toISOString())
    .not('next_run_at', 'is', null)
    .order('next_run_at', { ascending: true })
    .limit(10)

  return {
    totalSchedules: schedules.length,
    activeSchedules: schedules.filter(s => s.status === 'active').length,
    pausedSchedules: schedules.filter(s => s.status === 'paused').length,
    totalRunsToday: (runsToday || []).length,
    upcomingAlerts: (upcoming || []).map(u => ({
      scheduleId: u.id,
      name: u.name,
      scheduledFor: u.next_run_at,
    })),
  }
}

export async function cloneSchedule(
  scheduleId: string,
  userId: string,
  newName?: string
): Promise<AlertSchedule> {
  const original = await getSchedule(scheduleId)
  if (!original) {
    throw new Error('Schedule not found')
  }

  return createSchedule(userId, {
    name: newName || `${original.name} (Copy)`,
    description: original.description,
    startDate: original.startDate,
    endDate: original.endDate,
    timezone: original.timezone,
    scheduledTime: original.scheduledTime,
    recurrence: original.recurrence,
    recurrencePattern: original.recurrencePattern,
    alertConfig: original.alertConfig,
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapScheduleFromDB(data: Record<string, unknown>): AlertSchedule {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    status: data.status as ScheduleStatus,
    startDate: data.start_date as string,
    endDate: data.end_date as string | undefined,
    timezone: data.timezone,
    scheduledTime: data.scheduled_time,
    recurrence: data.recurrence as RecurrenceType,
    recurrencePattern: data.recurrence_pattern as AlertSchedule['recurrencePattern'] | undefined,
    alertConfig: data.alert_config as AlertSchedule['alertConfig'],
    createdBy: data.created_by,
    lastRunAt: data.last_run_at as string | undefined,
    nextRunAt: data.next_run_at as string | undefined,
    totalRuns: data.total_runs,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
