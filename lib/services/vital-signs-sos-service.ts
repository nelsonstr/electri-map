import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type SOSStatus = 'active' | 'acknowledged' | 'resolved' | 'cancelled' | 'escalated'

export type SOSPriority = 'critical' | 'high' | 'medium' | 'low'

export type VitalSignType =
  | 'heart_rate'
  | 'blood_pressure'
  | 'oxygen_saturation'
  | 'temperature'
  | 'respiratory_rate'
  | 'blood_glucose'
  | 'heart_rhythm'

export type VitalSignStatus = 'normal' | 'elevated' | 'high' | 'critical' | 'low' | 'hypoglycemic' | 'irregular'

export interface VitalSignsReading {
  id: string
  userId: string
  deviceId?: string
  type: VitalSignType
  value: number
  unit: string
  status: VitalSignStatus
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface VitalSignsSOS {
  id: string
  userId: string
  alertId?: string
  status: SOSStatus
  priority: SOSPriority

  // Triggering Vitals
  triggerReadings: VitalSignsReading[]
  primaryTrigger: VitalSignType

  // Location
  location?: {
    latitude: number
    longitude: number
    accuracy?: number
    address?: string
  }

  // Response
  assignedTo?: string
  responseNotes?: string
  resolvedAt?: string

  // Escalation
  escalationLevel: number
  escalatedAt?: string

  // Notifications
  notificationsSent: Array<{
    type: string
    recipient: string
    sentAt: string
    status: 'sent' | 'delivered' | 'failed'
  }>

  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CreateSOSInput {
  userId: string
  readings: Array<{
    type: VitalSignType
    value: number
    unit: string
    deviceId?: string
    metadata?: Record<string, unknown>
  }>
  location?: VitalSignsSOS['location']
}

export interface SOSFilters {
  status?: SOSStatus
  priority?: SOSPriority
  userId?: string
  assignedTo?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}

// ============================================================================
// Medical Alert Templates
// ============================================================================

export const MEDICAL_ALERT_TEMPLATES: Record<SOSPriority, MedicalAlertTemplate> = {
  critical: {
    title: 'CRITICAL MEDICAL EMERGENCY',
    message: 'A critical medical emergency has been detected. Help is on the way.',
    severity: 'critical',
    instructions: 'Call emergency services immediately and stay on the line.',
  },
  high: {
    title: 'URGENT MEDICAL ALERT',
    message: 'An urgent medical situation has been detected. Assistance has been notified.',
    severity: 'high',
    instructions: 'Monitor the situation and be prepared to assist.',
  },
  medium: {
    title: 'MEDICAL ALERT',
    message: 'A medical alert has been detected. Assistance has been dispatched.',
    severity: 'medium',
    instructions: 'Follow the provided instructions and wait for assistance.',
  },
  low: {
    title: 'HEALTH MONITORING ALERT',
    message: 'A health monitoring alert has been recorded. No immediate action required.',
    severity: 'low',
    instructions: 'Continue monitoring and update if the situation changes.',
  },
}

// ============================================================================
// Real-Time Configuration
// ============================================================================

export interface VitalSignsWebSocketConfig {
  channelId?: string
  autoAcknowledgeTime?: number // seconds before auto-ack
  autoResolveTime?: number // seconds before auto-resolve
  escalationInterval?: number // seconds between auto-escalations
}

export interface MedicalAlertTemplate {
  title: string
  message: string
  instructions?: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

// ============================================================================
// Vital Sign Thresholds (Medical Grade)
// ============================================================================

/**
 * Comprehensive vital sign thresholds based on medical guidelines
 */
export const VITAL_SIGN_THRESHOLDS: Record<VitalSignType, {
  unit: string
  normal: { min: number; max: number }
  elevated: { min: number; max: number }
  critical: { min: number; max: number }
  low: { min: number; max: number }
}> = {
  heart_rate: {
    unit: 'bpm',
    normal: { min: 60, max: 100 },
    elevated: { min: 100, max: 120 },
    critical: { min: 0, max: 40 }, // Bradycardia (<40) or tachycardia (>200)
    low: { min: 0, max: 40 }, // Bradycardia
  },
  blood_pressure: {
    unit: 'mmHg',
    normal: { min: 90, max: 140 }, // Systolic
    elevated: { min: 140, max: 180 }, // Hypertension Stage 1-2
    critical: { min: 0, max: 90 }, // Severe hypotension
  },
  oxygen_saturation: {
    unit: '%',
    normal: { min: 95, max: 100 },
    elevated: { min: 90, max: 95 }, // Not elevated, just normal range
    critical: { min: 85, max: 89 }, // Hypoxemia requiring attention
    low: { min: 80, max: 84 }, // Severe hypoxemia
  },
  temperature: {
    unit: '°C',
    normal: { min: 36.1, max: 37.8 },
    elevated: { min: 37.8, max: 39.0 }, // Low-grade fever
    critical: { min: 32.0, max: 35.0 }, // Hypothermia
  },
  respiratory_rate: {
    unit: 'breaths/min',
    normal: { min: 12, max: 20 },
    elevated: { min: 20, max: 30 }, // Tachypnea
    critical: { min: 0, max: 8 }, // Severe respiratory depression
  },
  blood_glucose: {
    unit: 'mg/dL',
    normal: { min: 70, max: 140 },
    elevated: { min: 140, max: 250 }, // Hyperglycemia
    critical: { min: 0, max: 60 }, // Hypoglycemia
    low: { min: 54, max: 59 }, // Mild hypoglycemia
  },
  heart_rhythm: {
    unit: 'bpm',
    normal: { min: 60, max: 100 },
    elevated: { min: 100, max: 150 }, // Sinus tachycardia
    critical: { min: 0, max: 40 }, // Severe bradycardia
  },
}

/**
 * Extended conditions for specific medical alerts
 */
export const EXTENDED_MEDICAL_CONDITIONS: Record<string, {
  threshold: number
  unit: string
  alertMessage: string
  recommendedAction: string
}> = {
  arrhythmia: {
    threshold: 120, // Heart rate variability
    unit: 'ms',
    alertMessage: 'Abnormal heart rhythm detected',
    recommendedAction: 'Seek immediate medical attention',
  },
  hypoxemia: {
    threshold: 90,
    unit: '%',
    alertMessage: 'Low oxygen levels detected',
    recommendedAction: 'Administer oxygen and monitor breathing',
  },
  hyperthermia: {
    threshold: 39,
    unit: '°C',
    alertMessage: 'High fever detected',
    recommendedAction: 'Administer antipyretics and cool body',
  },
  shock: {
    threshold: 60,
    unit: 'mmHg',
    alertMessage: 'Signs of shock detected',
    recommendedAction: 'Lay patient flat, elevate legs, provide fluids',
  },
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createSOSSchema = z.object({
  userId: z.string().uuid(),
  readings: z.array(z.object({
    type: z.enum([
      'heart_rate',
      'blood_pressure',
      'oxygen_saturation',
      'temperature',
      'respiratory_rate',
      'blood_glucose',
      'heart_rhythm',
    ]),
    value: z.number(),
    unit: z.string(),
    deviceId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })).min(1),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getVitalSignStatus(type: VitalSignType, value: number): VitalSignStatus {
  const thresholds = VITAL_SIGN_THRESHOLDS[type]
  
  if (value >= thresholds.critical.min && value <= thresholds.critical.max) {
    return 'critical'
  }
  if (value >= thresholds.elevated.min && value <= thresholds.elevated.max) {
    return 'high'
  }
  if (value >= thresholds.normal.min && value <= thresholds.normal.max) {
    return 'normal'
  }
  if (value < thresholds.normal.min) {
    return 'low'
  }
  return 'elevated'
}

export function getVitalSignDisplayName(type: VitalSignType): string {
  const names: Record<VitalSignType, string> = {
    heart_rate: 'Heart Rate',
    blood_pressure: 'Blood Pressure',
    oxygen_saturation: 'Oxygen Saturation',
    temperature: 'Temperature',
    respiratory_rate: 'Respiratory Rate',
    blood_glucose: 'Blood Glucose',
    heart_rhythm: 'Heart Rhythm',
  }
  return names[type]
}

export function getSOSStatusDisplayName(status: SOSStatus): string {
  const names: Record<SOSStatus, string> = {
    active: 'Active',
    acknowledged: 'Acknowledged',
    resolved: 'Resolved',
    cancelled: 'Cancelled',
    escalated: 'Escalated',
  }
  return names[status]
}

export function getSOSPriorityDisplayName(priority: SOSPriority): string {
  const names: Record<SOSPriority, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }
  return names[priority]
}

export function calculateSOSPriority(readings: Array<{
  type: VitalSignType
  value: number
}>): SOSPriority {
  for (const reading of readings) {
    const status = getVitalSignStatus(reading.type, reading.value)
    
    if (status === 'critical') {
      return 'critical'
    }
    if (status === 'high') {
      return 'high'
    }
  }
  
  for (const reading of readings) {
    const status = getVitalSignStatus(reading.type, reading.value)
    
    if (status === 'elevated') {
      return 'medium'
    }
  }
  
  return 'low'
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createVitalSignsSOS(
  input: CreateSOSInput
): Promise<VitalSignsSOS> {
  const validationResult = createSOSSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const sosId = `sos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Process readings and determine status
  const readings: VitalSignsReading[] = input.readings.map(reading => {
    const status = getVitalSignStatus(reading.type, reading.value)
    
    return {
      id: `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: input.userId,
      deviceId: reading.deviceId,
      type: reading.type,
      value: reading.value,
      unit: reading.unit,
      status,
      timestamp: new Date().toISOString(),
      metadata: reading.metadata,
    }
  })

  // Find primary trigger (most critical reading)
  const criticalReadings = readings.filter(r => r.status === 'critical')
  const highReadings = readings.filter(r => r.status === 'high')
  const elevatedReadings = readings.filter(r => r.status === 'elevated')
  
  let primaryTrigger: VitalSignType = readings[0]?.type || 'heart_rate'
  
  if (criticalReadings.length > 0) {
    primaryTrigger = criticalReadings[0].type
  } else if (highReadings.length > 0) {
    primaryTrigger = highReadings[0].type
  } else if (elevatedReadings.length > 0) {
    primaryTrigger = elevatedReadings[0].type
  }

  const priority = calculateSOSPriority(readings)

  const sos: VitalSignsSOS = {
    id: sosId,
    userId: input.userId,
    status: 'active',
    priority,
    triggerReadings: readings,
    primaryTrigger,
    location: input.location,
    escalationLevel: 0,
    notificationsSent: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Save readings to database
  const readingInserts = readings.map(r => ({
    id: r.id,
    sos_id: sosId,
    user_id: r.userId,
    device_id: r.deviceId,
    type: r.type,
    value: r.value,
    unit: r.unit,
    status: r.status,
    timestamp: r.timestamp,
    metadata: r.metadata,
  }))

  const { error: readingError } = await supabase
    .from('vital_sign_readings')
    .insert(readingInserts)

  if (readingError) {
    console.error('Error saving vital sign readings:', readingError)
  }

  // Save SOS to database
  const { data, error } = await supabase
    .from('vital_signs_sos')
    .insert({
      id: sosId,
      user_id: input.userId,
      status: 'active',
      priority,
      primary_trigger: primaryTrigger,
      location: input.location,
      escalation_level: 0,
      notifications_sent: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating SOS:', error)
    throw new Error('Failed to create SOS alert')
  }

  // Send notifications
  await sendSOSNotifications(sosId, input.userId, priority, input.location)

  return mapSOSFromDB(data, readings)
}

export async function getSOS(sosId: string): Promise<VitalSignsSOS | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vital_signs_sos')
    .select('*')
    .eq('id', sosId)
    .single()

  if (error || !data) {
    return null
  }

  // Fetch readings
  const { data: readingsData } = await supabase
    .from('vital_sign_readings')
    .select('*')
    .eq('sos_id', sosId)
    .order('timestamp', { ascending: false })

  return mapSOSFromDB(data, (readingsData || []).map(mapReadingFromDB))
}

export async function getSOSList(
  filters?: SOSFilters
): Promise<VitalSignsSOS[]> {
  const supabase = createClient()

  let query = supabase
    .from('vital_signs_sos')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority)
  }

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo)
  }

  if (filters?.fromDate) {
    query = query.gte('created_at', filters.fromDate)
  }

  if (filters?.toDate) {
    query = query.lte('created_at', filters.toDate)
  }

  query = query
    .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50) - 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching SOS list:', error)
    return []
  }

  const sosList: VitalSignsSOS[] = []
  
  for (const sos of (data || [])) {
    const { data: readingsData } = await supabase
      .from('vital_sign_readings')
      .select('*')
      .eq('sos_id', sos.id as string)
      .order('timestamp', { ascending: false })

    sosList.push(mapSOSFromDB(sos, (readingsData || []).map(mapReadingFromDB)))
  }

  return sosList
}

export async function acknowledgeSOS(
  sosId: string,
  responderId: string,
  notes?: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('vital_signs_sos')
    .update({
      status: 'acknowledged',
      assigned_to: responderId,
      response_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sosId)

  if (error) {
    console.error('Error acknowledging SOS:', error)
    throw new Error('Failed to acknowledge SOS')
  }
}

export async function resolveSOS(
  sosId: string,
  resolution: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('vital_signs_sos')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      response_notes: resolution,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sosId)

  if (error) {
    console.error('Error resolving SOS:', error)
    throw new Error('Failed to resolve SOS')
  }
}

export async function escalateSOS(
  sosId: string,
  newEscalationLevel: number
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('vital_signs_sos')
    .update({
      status: 'escalated',
      escalation_level: newEscalationLevel,
      escalated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sosId)

  if (error) {
    console.error('Error escalating SOS:', error)
    throw new Error('Failed to escalate SOS')
  }
}

export async function cancelSOS(sosId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('vital_signs_sos')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', sosId)

  if (error) {
    console.error('Error cancelling SOS:', error)
    throw new Error('Failed to cancel SOS')
  }
}

export async function getActiveSOSForUser(userId: string): Promise<VitalSignsSOS | null> {
  const sosList = await getSOSList({
    userId,
    status: 'active',
    limit: 1,
  })

  return sosList[0] || null
}

/**
 * Auto-resolve SOS after period of normal vitals
 */
export async function autoResolveSOS(
  sosId: string,
  resolvedPeriodSeconds: number = 300 // 5 minutes
): Promise<boolean> {
  const supabase = createClient()

  // Get current SOS status
  const sos = await getSOS(sosId)

  if (!sos) return false

  if (sos.status !== 'active') {
    console.log(`SOS ${sosId} is not active, skipping auto-resolve`)
    return false
  }

  // Check if SOS is eligible for auto-resolve
  const now = new Date()
  const elapsedSeconds = Math.floor((now.getTime() - new Date(sos.createdAt).getTime()) / 1000)

  if (elapsedSeconds < resolvedPeriodSeconds) {
    console.log(`SOS ${sosId} hasn't been active for ${resolvedPeriodSeconds} seconds, skipping auto-resolve`)
    return false
  }

  // Get recent readings to verify stable vitals
  const { data: recentReadings } = await supabase
    .from('vital_sign_readings')
    .select('value, status, type')
    .eq('user_id', sos.userId)
    .gte('timestamp', new Date(now.getTime() - 3 * 60 * 1000).toISOString()) // Last 3 minutes
    .order('timestamp', { ascending: true })

  // Check if most recent readings are normal
  const normalReadings = recentReadings?.filter(r =>
    r.status === 'normal'
  )?.length

  if (!normalReadings || normalReadings < recentReadings?.length * 0.7) {
    console.log(`SOS ${sosId}: Recent readings not stable, skipping auto-resolve`)
    return false
  }

  // Auto-resolve the SOS
  const { error } = await supabase
    .from('vital_signs_sos')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      response_notes: `Auto-resolved after ${resolvedPeriodSeconds} seconds of stable vitals`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sosId)

  if (error) {
    console.error('Error auto-resolving SOS:', error)
    return false
  }

  return true
}

/**
 * Get trending vital sign data
 */
export async function getVitalSignTrends(
  userId: string,
  type?: VitalSignType,
  hours: number = 24
): Promise<{
  current: VitalSignsReading[]
  average: Record<string, number>
  range: Record<string, { min: number; max: number }>
  trend: 'improving' | 'stable' | 'deteriorating'
}> {
  const supabase = createClient()

  const since = new Date()
  since.setHours(since.getHours() - hours)

  const { data: readings } = await supabase
    .from('vital_sign_readings')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', since.toISOString())
    .order('timestamp', { ascending: false })

  if (!readings || readings.length === 0) {
    return {
      current: [],
      average: {},
      range: {},
      trend: 'stable',
    }
  }

  // Group by type
  const grouped: Record<string, VitalSignsReading[]> = {}
  for (const reading of readings) {
    const type = reading.type || 'unknown'
    if (!grouped[type]) {
      grouped[type] = []
    }
    grouped[type].push(reading)
  }

  // Calculate averages and ranges
  const averages: Record<string, number> = {}
  const ranges: Record<string, { min: number; max: number }> = {}

  for (const [type, typeReadings] of Object.entries(grouped)) {
    const values = typeReadings.map(r => r.value)
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length
    averages[type] = Math.round(avg)

    ranges[type] = {
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  // Determine trend (compare current vs previous average)
  const recentAverage: Record<string, number> = {}
  const olderAverage: Record<string, number> = {}

  for (const [type, typeReadings] of Object.entries(grouped)) {
    const recent = typeReadings.slice(0, Math.floor(typeReadings.length * 0.2)) // Most recent 20%
    const older = typeReadings.slice(-Math.floor(typeReadings.length * 0.2)) // Oldest 20%

    recentAverage[type] = recentAverage[type] ||
      recent.reduce((sum, v) => sum + v.value, 0) / recent.length
    olderAverage[type] = olderAverage[type] ||
      older.reduce((sum, v) => sum + v.value, 0) / older.length
  }

  // Determine overall trend
  let trend: 'improving' | 'stable' | 'deteriorating' = 'stable'

  for (const [type, recentAvg] of Object.entries(recentAverage)) {
    const olderAvg = olderAverage[type] || recentAvg
    const diff = recentAvg - olderAvg

    if (Math.abs(diff) > 5) {
      if (diff < 0) {
        trend = 'improving'
      } else {
        trend = 'deteriorating'
      }
    }
  }

  return {
    current: readings,
    average: averages,
    range: ranges,
    trend,
  }
}

/**
 * Subscribe to vital signs real-time updates via Supabase real-time
 */
export function subscribeToVitalSignsUpdates(
  userId: string,
  type?: VitalSignType,
  callback: (
    reading: VitalSignsReading,
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  ) => void
): () => void {
  const supabase = createClient()

  const filter: Record<string, unknown> = {
    event: '*',
    schema: 'public',
    table: 'vital_sign_readings',
  }

  if (type) {
    filter.filter = { field: 'type', value: type }
  }

  const subscription = supabase
    .channel(`vital-signs-${userId}`)
    .on(
      'postgres_changes',
      filter,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          callback(payload.new as VitalSignsReading, 'INSERT')
        } else if (payload.eventType === 'UPDATE') {
          callback(payload.new as VitalSignsReading, 'UPDATE')
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(subscription)
  }
}

/**
 * Get SOS statistics for user
 */
export async function getSOSStatistics(
  userId: string,
  days?: number
): Promise<{
  totalSOS: number
  resolved: number
  active: number
  byPriority: Record<SOSPriority, number>
  byType: Record<VitalSignType, number>
  responseTimeAvg: number
}> {
  const supabase = createClient()

  const since = days
    ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    : undefined

  const { data: sosList } = await supabase
    .from('vital_signs_sos')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', since?.toISOString())

  const sos = sosList || []

  const totalSOS = sos.length
  const resolved = sos.filter(s => s.status === 'resolved').length
  const active = sos.filter(s => s.status === 'active').length

  const byPriority: Record<SOSPriority, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }
  const byType: Record<VitalSignType, number> = {
    heart_rate: 0,
    blood_pressure: 0,
    oxygen_saturation: 0,
    temperature: 0,
    respiratory_rate: 0,
    blood_glucose: 0,
    heart_rhythm: 0,
  }

  let totalResponseTime = 0
  let responseTimeCount = 0

  for (const sosItem of sos) {
    byPriority[sosItem.priority]++

    for (const reading of sosItem.triggerReadings) {
      byType[reading.type]++
    }

    // Calculate response time (simplified - in production use actual timestamps)
    if (sosItem.resolvedAt) {
      const resolvedTime = new Date(sosItem.resolvedAt).getTime()
      const createdAt = new Date(sosItem.createdAt).getTime()
      const responseTime = (resolvedTime - createdAt) / (1000 * 60) // minutes
      totalResponseTime += responseTime
      responseTimeCount++
    }
  }

  return {
    totalSOS,
    resolved,
    active,
    byPriority,
    byType,
    responseTimeAvg: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0,
  }
}

export async function recordVitalReading(
  userId: string,
  reading: Omit<VitalSignsReading, 'id' | 'userId' | 'timestamp' | 'status'>,
  options?: {
    checkTrends?: boolean
    autoTriggerSOS?: boolean
    checkExtendedConditions?: boolean
  }
): Promise<{
  reading: VitalSignsReading
  sosTriggered: boolean
  conditionsDetected: Array<{
    condition: string
    threshold: number
    alertMessage: string
    recommendedAction: string
  }>
}> {
  const supabase = createClient()

  const status = getVitalSignStatus(reading.type, reading.value)

  const readingRecord: VitalSignsReading = {
    ...reading,
    id: `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    status,
    timestamp: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('vital_sign_readings')
    .insert({
      id: readingRecord.id,
      user_id: userId,
      device_id: reading.deviceId,
      type: reading.type,
      value: reading.value,
      unit: reading.unit,
      status,
      timestamp: readingRecord.timestamp,
      metadata: reading.metadata,
    })

  if (error) {
    console.error('Error recording vital reading:', error)
  }

  // Check extended conditions if enabled
  const conditionsDetected: Array<{
    condition: string
    threshold: number
    alertMessage: string
    recommendedAction: string
  }> = []

  if (options?.checkExtendedConditions) {
    const typeMap: Record<string, VitalSignType> = {
      heart_rate: 'heart_rate',
      blood_pressure: 'blood_pressure',
      oxygen_saturation: 'oxygen_saturation',
      temperature: 'temperature',
    }

    for (const [condition, config] of Object.entries(EXTENDED_MEDICAL_CONDITIONS)) {
      const readingType = typeMap[condition]
      if (!readingType) continue

      const currentThreshold = VITAL_SIGN_THRESHOLDS[readingType][config.threshold < 90 ? 'critical' : 'low'].min
      if (reading.value <= config.threshold) {
        conditionsDetected.push({
          condition,
          threshold: config.threshold,
          alertMessage: config.alertMessage,
          recommendedAction: config.recommendedAction,
        })
      }
    }
  }

  // Check if this reading should trigger SOS
  let sosTriggered = false

  if (options?.autoTriggerSOS && (status === 'critical' || status === 'high')) {
    const activeSOS = await getActiveSOSForUser(userId)

    if (!activeSOS) {
      await createVitalSignsSOS({
        userId,
        readings: [{
          type: reading.type,
          value: reading.value,
          unit: reading.unit,
          deviceId: reading.deviceId,
          metadata: reading.metadata,
        }],
      })

      sosTriggered = true
    }
  }

  return { reading: readingRecord, sosTriggered, conditionsDetected }
}

export async function getUserVitalHistory(
  userId: string,
  type?: VitalSignType,
  limit: number = 100
): Promise<VitalSignsReading[]> {
  const supabase = createClient()

  let query = supabase
    .from('vital_sign_readings')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching vital history:', error)
    return []
  }

  return (data || []).map(mapReadingFromDB)
}

// ============================================================================
// Notification Functions
// ============================================================================

async function sendSOSNotifications(
  sosId: string,
  userId: string,
  priority: SOSPriority,
  location?: VitalSignsSOS['location']
): Promise<void> {
  const supabase = createClient()

  // Get user and emergency contacts
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  const { data: contacts } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)

  const notifications: Array<{
    type: string
    recipient: string
    sentAt: string
    status: 'sent' | 'delivered' | 'failed'
  }> = []

  // Send to emergency contacts
  if (contacts && contacts.length > 0) {
    for (const contact of contacts) {
      const notification = {
        type: 'sos_alert',
        recipient: contact.phone || contact.email,
        sentAt: new Date().toISOString(),
        status: 'sent' as const,
      }
      notifications.push(notification as any)
      
      // In production, this would actually send SMS/push notification
      console.log(`SOS alert sent to ${contact.name}: ${contact.phone || contact.email}`)
    }
  }

  // Send to emergency services if critical
  if (priority === 'critical') {
    const notification = {
      type: 'emergency_services',
      recipient: '112',
      sentAt: new Date().toISOString(),
      status: 'sent' as const,
    }
    notifications.push(notification)
    
    console.log('Emergency services alerted for critical SOS')
  }

  // Update SOS with notification records
  await supabase
    .from('vital_signs_sos')
    .update({
      notifications_sent: notifications,
    })
    .eq('id', sosId)
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapSOSFromDB(data: Record<string, unknown>, readings: VitalSignsReading[]): VitalSignsSOS {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    alertId: data.alert_id as string | undefined,
    status: data.status as SOSStatus,
    priority: data.priority as SOSPriority,
    triggerReadings: readings,
    primaryTrigger: data.primary_trigger as VitalSignType,
    location: (data.location as VitalSignsSOS['location']) || undefined,
    assignedTo: data.assigned_to as string | undefined,
    responseNotes: data.response_notes as string | undefined,
    resolvedAt: data.resolved_at as string | undefined,
    escalationLevel: (data.escalation_level as number) || 0,
    escalatedAt: data.escalated_at as string | undefined,
    notificationsSent: (data.notifications_sent as Array<{
      type: string
      recipient: string
      sentAt: string
      status: 'sent' | 'delivered' | 'failed'
    }>) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

function mapReadingFromDB(data: Record<string, unknown>): VitalSignsReading {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    deviceId: data.device_id as string | undefined,
    type: data.type as VitalSignType,
    value: data.value as number,
    unit: data.unit as string,
    status: data.status as VitalSignStatus,
    timestamp: data.timestamp as string,
    metadata: data.metadata as Record<string, unknown> | undefined,
  }
}
