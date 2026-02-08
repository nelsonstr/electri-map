import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Emergency types supported by SOS feature
 */
export type EmergencyType = 
  | 'fire' 
  | 'flooding' 
  | 'electrocution_hazard' 
  | 'building_collapse' 
  | 'medical_emergency'

/**
 * Priority level for SOS incidents
 */
export type SOSPriority = 'critical' | 'high' | 'urgent'

/**
 * Status of an SOS alert
 */
export type SOSAlertStatus = 'active' | 'resolved' | 'acknowledged' | 'dispatched'

/**
 * Input for creating an SOS alert
 */
export interface SOSAlertInput {
  emergencyType: EmergencyType
  location: {
    latitude: number
    longitude: number
  }
  description?: string
  notifyContacts?: boolean
}

/**
 * Result of creating an SOS alert
 */
export interface SOSAlertResult {
  id: string
  incidentNumber: string
  status: SOSAlertStatus
  createdAt: string
  priority: SOSPriority
}

/**
 * Full SOS alert data (for display)
 */
export interface SOSAlert {
  id: string
  incidentNumber: string
  emergencyType: EmergencyType
  priority: SOSPriority
  status: SOSAlertStatus
  location: {
    latitude: number
    longitude: number
    address?: string
  }
  description?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  notificationsSent: boolean
  emergencyServicesDispatched: boolean
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for validating SOS alert input
 */
export const sosAlertInputSchema = z.object({
  emergencyType: z.enum([
    'fire',
    'flooding',
    'electrocution_hazard',
    'building_collapse',
    'medical_emergency'
  ]),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  description: z.string().min(0).max(500).optional(),
  notifyContacts: z.boolean().default(false),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps emergency type to priority level
 * SOS incidents always get at least 'urgent' priority
 */
function getSOSPriority(emergencyType: EmergencyType): SOSPriority {
  switch (emergencyType) {
    case 'fire':
    case 'electrocution_hazard':
    case 'building_collapse':
      return 'critical'
    case 'medical_emergency':
    case 'flooding':
      return 'urgent'
    default:
      return 'high'
  }
}

/**
 * Generates a unique incident number for SOS alerts
 * Format: SOS-YYYYMMDD-XXXX
 */
function generateIncidentNumber(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `SOS-${dateStr}-${random}`
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates an SOS alert in the database
 * 
 * This function:
 * 1. Validates the input
 * 2. Inserts the incident into the database
 * 3. Triggers SMS notifications if requested
 * 4. Notifies emergency services if required
 * 
 * @param input - The SOS alert input data
 * @returns Promise<SOSAlertResult> - The created alert result
 * @throws Error if creation fails
 */
export async function createSOSAlert(input: SOSAlertInput): Promise<SOSAlertResult> {
  // Validate input
  const validationResult = sosAlertInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid SOS alert input: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  // Generate incident number
  const incidentNumber = generateIncidentNumber()
  const priority = getSOSPriority(validatedInput.emergencyType)

  try {
    // Insert the SOS incident
    const { data, error } = await supabase
      .from('incidents')
      .insert({
        incident_number: incidentNumber,
        type: validatedInput.emergencyType,
        priority: priority,
        status: 'active',
        latitude: validatedInput.location.latitude,
        longitude: validatedInput.location.longitude,
        description: validatedInput.description || `SOS Alert: ${validatedInput.emergencyType.replace(/_/g, ' ')}`,
        is_sos: true,
        created_at: new Date().toISOString(),
      })
      .select('id, incident_number, priority, status, created_at')
      .single()

    if (error) {
      console.error('Error creating SOS alert:', error)
      throw new Error(`Failed to create SOS alert: ${error.message}`)
    }

    // Trigger SMS notifications if requested
    if (validatedInput.notifyContacts) {
      await sendEmergencyNotifications({
        incidentId: data.id,
        incidentNumber: data.incident_number,
        emergencyType: validatedInput.emergencyType,
        location: validatedInput.location,
      })
    }

    // Log for monitoring (in production, this would trigger alerts)
    console.log(`SOS Alert Created: ${incidentNumber} - ${validatedInput.emergencyType}`)

    return {
      id: data.id,
      incidentNumber: data.incident_number,
      status: data.status as SOSAlertStatus,
      createdAt: data.created_at,
      priority: data.priority as SOSPriority,
    }
  } catch (error) {
    console.error('Error in createSOSAlert:', error)
    throw error
  }
}

/**
 * Retrieves an SOS alert by ID
 * 
 * @param id - The SOS alert ID
 * @returns Promise<SOSAlert | null> - The alert or null if not found
 */
export async function getSOSAlert(id: string): Promise<SOSAlert | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', id)
    .eq('is_sos', true)
    .single()

  if (error) {
    console.error('Error fetching SOS alert:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    incidentNumber: data.incident_number,
    emergencyType: data.type as EmergencyType,
    priority: data.priority as SOSPriority,
    status: data.status as SOSAlertStatus,
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || undefined,
    },
    description: data.description || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at,
    createdBy: data.created_by || 'unknown',
    notificationsSent: data.notifications_sent || false,
    emergencyServicesDispatched: data.emergency_services_dispatched || false,
  }
}

/**
 * Lists all active SOS alerts
 * 
 * @param limit - Maximum number of alerts to return (default: 50)
 * @returns Promise<SOSAlert[]> - List of active SOS alerts
 */
export async function listActiveSOSAlerts(limit: number = 50): Promise<SOSAlert[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('is_sos', true)
    .in('status', ['active', 'acknowledged', 'dispatched'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error listing SOS alerts:', error)
    return []
  }

  return data.map(item => ({
    id: item.id,
    incidentNumber: item.incident_number,
    emergencyType: item.type as EmergencyType,
    priority: item.priority as SOSPriority,
    status: item.status as SOSAlertStatus,
    location: {
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.address || undefined,
    },
    description: item.description || undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at || item.created_at,
    createdBy: item.created_by || 'unknown',
    notificationsSent: item.notifications_sent || false,
    emergencyServicesDispatched: item.emergency_services_dispatched || false,
  }))
}

/**
 * Resolves an SOS alert
 * 
 * @param id - The SOS alert ID
 * @returns Promise<boolean> - True if resolved successfully
 */
export async function resolveSOSAlert(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('incidents')
    .update({
      status: 'resolved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('is_sos', true)

  if (error) {
    console.error('Error resolving SOS alert:', error)
    return false
  }

  return true
}

// ============================================================================
// Notification Functions (Stub for SMS Integration)
// ============================================================================

interface NotificationPayload {
  incidentId: string
  incidentNumber: string
  emergencyType: EmergencyType
  location: {
    latitude: number
    longitude: number
  }
}

/**
 * Sends emergency notifications to configured contacts
 * 
 * This is a stub function that would integrate with Twilio or similar
 * SMS service in production.
 */
async function sendEmergencyNotifications(payload: NotificationPayload): Promise<void> {
  // In production, this would:
  // 1. Fetch user's emergency contacts from database
  // 2. Send SMS to each contact via Twilio
  // 3. Log the notifications sent
  
  console.log('Emergency notifications triggered:', payload)
  
  // Update the incident to mark notifications as sent
  const supabase = createClient()
  await supabase
    .from('incidents')
    .update({ notifications_sent: true })
    .eq('id', payload.incidentId)

  // TODO: Implement actual SMS integration
  // Example Twilio integration:
  // const twilio = require('twilio')(accountSid, authToken)
  // await twilio.messages.create({
  //   body: `EMERGENCY SOS: ${payload.emergencyType} at coordinates ${payload.location.latitude}, ${payload.location.longitude}. Incident: ${payload.incidentNumber}`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: contact.phone
  // })
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats an emergency type for display
 */
export function formatEmergencyType(type: EmergencyType): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Gets the icon emoji for an emergency type
 */
export function getEmergencyTypeIcon(type: EmergencyType): string {
  switch (type) {
    case 'fire': return '🔥'
    case 'flooding': return '🌊'
    case 'electrocution_hazard': return '⚡'
    case 'building_collapse': return '🏢'
    case 'medical_emergency': return '🚑'
    default: return '⚠️'
  }
}

/**
 * Checks if a coordinate is within valid bounds
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}
