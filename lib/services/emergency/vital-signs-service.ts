import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Vital signs types that can be monitored
 */
export type VitalSignType = 
  | 'heart_rate'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'oxygen_saturation'
  | 'respiratory_rate'
  | 'temperature'
  | 'blood_glucose'

/**
 * Vital signs reading status
 */
export type VitalSignStatus = 'normal' | 'elevated' | 'high' | 'low' | 'critical'

/**
 * Device types for vital signs monitoring
 */
export type VitalSignDeviceType = 
  | 'smartwatch'
  | 'blood_pressure_monitor'
  | 'pulse_oximeter'
  | 'thermometer'
  | 'glucose_meter'
  | 'manual_entry'

/**
 * Input for recording vital signs
 */
export interface VitalSignsInput {
  userId: string
  emergencyId?: string
  readings: VitalSignReading[]
  deviceType?: VitalSignDeviceType
  deviceId?: string
  notes?: string
}

/**
 * Individual vital sign reading
 */
export interface VitalSignReading {
  type: VitalSignType
  value: number
  unit: string
  timestamp?: string
}

/**
 * Full vital signs record (for display)
 */
export interface VitalSignsRecord {
  id: string
  userId: string
  emergencyId?: string
  readings: VitalSignReading[]
  deviceType?: VitalSignDeviceType
  deviceId?: string
  notes?: string
  status: VitalSignStatus
  overallAssessment: string
  createdAt: string
  updatedAt: string
}

/**
 * Vital signs with SOS alert linkage
 */
export interface VitalSignsWithSOS {
  vitalSigns: VitalSignsRecord
  sosAlert?: {
    id: string
    incidentNumber: string
    status: string
    createdAt: string
  }
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for validating a single vital sign reading
 */
export const vitalSignReadingSchema = z.object({
  type: z.enum([
    'heart_rate',
    'blood_pressure_systolic',
    'blood_pressure_diastolic',
    'oxygen_saturation',
    'respiratory_rate',
    'temperature',
    'blood_glucose'
  ]),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string().optional(),
})

/**
 * Schema for validating vital signs input
 */
export const vitalSignsInputSchema = z.object({
  userId: z.string().uuid(),
  emergencyId: z.string().uuid().optional(),
  readings: z.array(vitalSignReadingSchema).min(1),
  deviceType: z.enum([
    'smartwatch',
    'blood_pressure_monitor',
    'pulse_oximeter',
    'thermometer',
    'glucose_meter',
    'manual_entry'
  ]).optional(),
  deviceId: z.string().optional(),
  notes: z.string().max(500).optional(),
})

// ============================================================================
// Vital Sign Thresholds
// ============================================================================

const VITAL_SIGN_THRESHOLDS: Record<VitalSignType, { 
  normal: [number, number]
  elevated: [number, number]
  critical: [number, number]
  unit: string
}> = {
  heart_rate: {
    normal: [60, 100],
    elevated: [50, 120],
    critical: [30, 150],
    unit: 'bpm'
  },
  blood_pressure_systolic: {
    normal: [90, 120],
    elevated: [80, 130],
    critical: [60, 180],
    unit: 'mmHg'
  },
  blood_pressure_diastolic: {
    normal: [60, 80],
    elevated: [50, 90],
    critical: [40, 120],
    unit: 'mmHg'
  },
  oxygen_saturation: {
    normal: [95, 100],
    elevated: [90, 95],
    critical: [0, 90],
    unit: '%'
  },
  respiratory_rate: {
    normal: [12, 20],
    elevated: [10, 24],
    critical: [5, 30],
    unit: 'breaths/min'
  },
  temperature: {
    normal: [36.1, 37.2],
    elevated: [35.5, 38.3],
    critical: [35.0, 39.5],
    unit: '°C'
  },
  blood_glucose: {
    normal: [70, 100],
    elevated: [60, 140],
    critical: [40, 200],
    unit: 'mg/dL'
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determines the status of a vital sign based on its value
 */
export function assessVitalSignStatus(type: VitalSignType, value: number): VitalSignStatus {
  const threshold = VITAL_SIGN_THRESHOLDS[type]
  if (!threshold) return 'normal'

  if (value >= threshold.normal[0] && value <= threshold.normal[1]) {
    return 'normal'
  }
  if (value >= threshold.elevated[0] && value <= threshold.elevated[1]) {
    return 'elevated'
  }
  if (value < threshold.critical[0] || value > threshold.critical[1]) {
    return 'critical'
  }
  return 'high' // Above normal but not critical
}

/**
 * Assesses overall vital signs status
 */
export function assessOverallStatus(readings: VitalSignReading[]): {
  status: VitalSignStatus
  assessment: string
} {
  if (readings.length === 0) {
    return { status: 'normal', assessment: 'No vital signs recorded' }
  }

  const statuses = readings.map(r => assessVitalSignStatus(r.type, r.value))
  const hasCritical = statuses.includes('critical')
  const hasHigh = statuses.includes('high')
  const hasLow = statuses.includes('low')
  const hasElevated = statuses.includes('elevated')

  if (hasCritical) {
    return { 
      status: 'critical', 
      assessment: 'Critical vital signs detected. Immediate medical attention required.' 
    }
  }
  if (hasHigh || hasLow) {
    return { 
      status: 'high', 
      assessment: 'Abnormal vital signs detected. Monitor closely.' 
    }
  }
  if (hasElevated) {
    return { 
      status: 'elevated', 
      assessment: 'Some vital signs slightly elevated. Continue monitoring.' 
    }
  }

  return { 
    status: 'normal', 
    assessment: 'All vital signs within normal range.' 
  }
}

/**
 * Gets the display name for a vital sign type
 */
export function getVitalSignDisplayName(type: VitalSignType): string {
  const names: Record<VitalSignType, string> = {
    heart_rate: 'Heart Rate',
    blood_pressure_systolic: 'Blood Pressure (Systolic)',
    blood_pressure_diastolic: 'Blood Pressure (Diastolic)',
    oxygen_saturation: 'Oxygen Saturation',
    respiratory_rate: 'Respiratory Rate',
    temperature: 'Temperature',
    blood_glucose: 'Blood Glucose',
  }
  return names[type]
}

/**
 * Gets the icon for a vital sign type
 */
export function getVitalSignIcon(type: VitalSignType): string {
  const icons: Record<VitalSignType, string> = {
    heart_rate: '❤️',
    blood_pressure_systolic: '💓',
    blood_pressure_diastolic: '💓',
    oxygen_saturation: '💨',
    respiratory_rate: '🌬️',
    temperature: '🌡️',
    blood_glucose: '🩸',
  }
  return icons[type]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Records vital signs in the database
 */
export async function recordVitalSigns(input: VitalSignsInput): Promise<VitalSignsRecord> {
  const validationResult = vitalSignsInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid vital signs input: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  // Assess overall status
  const { status, assessment } = assessOverallStatus(validatedInput.readings)

  try {
    const { data, error } = await supabase
      .from('vital_signs')
      .insert({
        user_id: validatedInput.userId,
        emergency_id: validatedInput.emergencyId || null,
        readings: validatedInput.readings,
        device_type: validatedInput.deviceType || null,
        device_id: validatedInput.deviceId || null,
        notes: validatedInput.notes || null,
        status,
        overall_assessment: assessment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error recording vital signs:', error)
      throw new Error(`Failed to record vital signs: ${error.message}`)
    }

    // If emergency ID is provided, update the incident with vital signs
    if (validatedInput.emergencyId) {
      await supabase
        .from('incidents')
        .update({ vital_signs_id: data.id })
        .eq('id', validatedInput.emergencyId)
    }

    return {
      id: data.id,
      userId: data.user_id,
      emergencyId: data.emergency_id || undefined,
      readings: data.readings,
      deviceType: data.device_type || undefined,
      deviceId: data.device_id || undefined,
      notes: data.notes || undefined,
      status: data.status as VitalSignStatus,
      overallAssessment: data.overall_assessment,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error('Error in recordVitalSigns:', error)
    throw error
  }
}

/**
 * Retrieves vital signs record by ID
 */
export async function getVitalSigns(id: string): Promise<VitalSignsRecord | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vital_signs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vital signs:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    emergencyId: data.emergency_id || undefined,
    readings: data.readings,
    deviceType: data.device_type || undefined,
    deviceId: data.device_id || undefined,
    notes: data.notes || undefined,
    status: data.status as VitalSignStatus,
    overallAssessment: data.overall_assessment,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Retrieves latest vital signs for a user
 */
export async function getLatestVitalSigns(userId: string): Promise<VitalSignsRecord | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vital_signs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching latest vital signs:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    emergencyId: data.emergency_id || undefined,
    readings: data.readings,
    deviceType: data.device_type || undefined,
    deviceId: data.device_id || undefined,
    notes: data.notes || undefined,
    status: data.status as VitalSignStatus,
    overallAssessment: data.overall_assessment,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Retrieves vital signs for an emergency
 */
export async function getVitalSignsForEmergency(emergencyId: string): Promise<VitalSignsRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vital_signs')
    .select('*')
    .eq('emergency_id', emergencyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching vital signs for emergency:', error)
    return []
  }

  return data.map(item => ({
    id: item.id,
    userId: item.user_id,
    emergencyId: item.emergency_id || undefined,
    readings: item.readings,
    deviceType: item.device_type || undefined,
    deviceId: item.device_id || undefined,
    notes: item.notes || undefined,
    status: item.status as VitalSignStatus,
    overallAssessment: item.overall_assessment,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

/**
 * Retrieves vital signs with linked SOS alert
 */
export async function getVitalSignsWithSOS(vitalSignsId: string): Promise<VitalSignsWithSOS | null> {
  const vitalSigns = await getVitalSigns(vitalSignsId)
  if (!vitalSigns) {
    return null
  }

  const result: VitalSignsWithSOS = {
    vitalSigns,
  }

  if (vitalSigns.emergencyId) {
    const supabase = createClient()
    const { data } = await supabase
      .from('incidents')
      .select('id, incident_number, status, created_at')
      .eq('id', vitalSigns.emergencyId)
      .single()

    if (data) {
      result.sosAlert = {
        id: data.id,
        incidentNumber: data.incident_number,
        status: data.status,
        createdAt: data.created_at,
      }
    }
  }

  return result
}

/**
 * Lists vital signs history for a user
 */
export async function listVitalSignsHistory(
  userId: string,
  limit: number = 20
): Promise<VitalSignsRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vital_signs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error listing vital signs history:', error)
    return []
  }

  return data.map(item => ({
    id: item.id,
    userId: item.user_id,
    emergencyId: item.emergency_id || undefined,
    readings: item.readings,
    deviceType: item.device_type || undefined,
    deviceId: item.device_id || undefined,
    notes: item.notes || undefined,
    status: item.status as VitalSignStatus,
    overallAssessment: item.overall_assessment,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

/**
 * Creates vital signs and links to SOS alert
 */
export async function createVitalSignsWithSOS(
  input: VitalSignsInput
): Promise<{ vitalSigns: VitalSignsRecord; sosResult: { id: string; incidentNumber: string } }> {
  const supabase = createClient()

  // First create the SOS alert if not provided
  let emergencyId = input.emergencyId
  if (!emergencyId) {
    // Create a placeholder incident for the vital signs
    const { data: sosData, error: sosError } = await supabase
      .from('incidents')
      .insert({
        incident_number: `VS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString().slice(2, 6)}`,
        type: 'medical_emergency',
        priority: 'critical',
        status: 'active',
        latitude: 0,
        longitude: 0,
        description: 'Vital Signs Monitoring Alert',
        is_sos: true,
        created_at: new Date().toISOString(),
      })
      .select('id, incident_number')
      .single()

    if (sosError) {
      throw new Error(`Failed to create SOS alert for vital signs: ${sosError.message}`)
    }

    emergencyId = sosData.id
  }

  // Now record the vital signs
  const vitalSigns = await recordVitalSigns({
    ...input,
    emergencyId,
  })

  return {
    vitalSigns,
    sosResult: {
      id: emergencyId,
      incidentNumber: sosData?.incident_number || '',
    },
  }
}
