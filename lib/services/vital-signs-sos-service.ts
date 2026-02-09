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
// Vital Sign Thresholds
// ============================================================================

export const VITAL_SIGN_THRESHOLDS: Record<VitalSignType, {
  unit: string
  normal: { min: number; max: number }
  elevated: { min: number; max: number }
  critical: { min: number; max: number }
}> = {
  heart_rate: {
    unit: 'bpm',
    normal: { min: 60, max: 100 },
    elevated: { min: 100, max: 120 },
    critical: { min: 0, max: 40 },
  },
  blood_pressure: {
    unit: 'mmHg',
    normal: { min: 90, max: 120 },
    elevated: { min: 120, max: 140 },
    critical: { min: 0, max: 60 },
  },
  oxygen_saturation: {
    unit: '%',
    normal: { min: 95, max: 100 },
    elevated: { min: 90, max: 95 },
    critical: { min: 0, max: 85 },
  },
  temperature: {
    unit: '°C',
    normal: { min: 36.1, max: 37.2 },
    elevated: { min: 37.2, max: 39.0 },
    critical: { min: 35.0, max: 32.0 },
  },
  respiratory_rate: {
    unit: 'breaths/min',
    normal: { min: 12, max: 20 },
    elevated: { min: 20, max: 30 },
    critical: { min: 0, max: 8 },
  },
  blood_glucose: {
    unit: 'mg/dL',
    normal: { min: 70, max: 100 },
    elevated: { min: 180, max: 250 },
    critical: { min: 0, max: 54 },
  },
  heart_rhythm: {
    unit: 'bpm',
    normal: { min: 60, max: 100 },
    elevated: { min: 100, max: 150 },
    critical: { min: 0, max: 40 },
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
      .eq('sos_id', sos.id)
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

export async function recordVitalReading(
  userId: string,
  reading: Omit<VitalSignsReading, 'id' | 'userId' | 'timestamp' | 'status'>
): Promise<{ reading: VitalSignsReading; sosTriggered: boolean }> {
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

  // Check if this reading should trigger SOS
  let sosTriggered = false
  
  if (status === 'critical' || status === 'high') {
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

  return { reading: readingRecord, sosTriggered }
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
      notifications.push(notification)
      
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
    id: data.id,
    userId: data.user_id,
    alertId: data.alert_id as string | undefined,
    status: data.status as SOSStatus,
    priority: data.priority as SOSPriority,
    triggerReadings: readings,
    primaryTrigger: data.primary_trigger as VitalSignType,
    location: data.location as VitalSignsSOS['location'] | undefined,
    assignedTo: data.assigned_to as string | undefined,
    responseNotes: data.response_notes as string | undefined,
    resolvedAt: data.resolved_at as string | undefined,
    escalationLevel: data.escalation_level,
    escalatedAt: data.escalated_at as string | undefined,
    notificationsSent: (data.notifications_sent as Array<{
      type: string
      recipient: string
      sentAt: string
      status: 'sent' | 'delivered' | 'failed'
    }>) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

function mapReadingFromDB(data: Record<string, unknown>): VitalSignsReading {
  return {
    id: data.id,
    userId: data.user_id,
    deviceId: data.device_id as string | undefined,
    type: data.type as VitalSignType,
    value: data.value,
    unit: data.unit,
    status: data.status as VitalSignStatus,
    timestamp: data.timestamp,
    metadata: data.metadata as Record<string, unknown> | undefined,
  }
}
