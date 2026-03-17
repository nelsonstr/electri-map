import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Contact relationship type
 */
export type ContactRelationship =
  | 'family'
  | 'friend'
  | 'neighbor'
  | 'colleague'
  | 'doctor'
  | 'caregiver'
  | 'other'

/**
 * Contact notification preference
 */
export type ContactNotificationPreference =
  | 'all_alerts'
  | 'critical_only'
  | 'sos_only'
  | 'none'

/**
 * Emergency contact status
 */
export type ContactStatus = 'active' | 'pending' | 'blocked' | 'declined'

/**
 * Emergency contact
 */
export interface EmergencyContact {
  id: string
  userId: string
  name: string
  phoneNumber: string
  email?: string
  relationship: ContactRelationship
  isPrimary: boolean
  notificationPreference: ContactNotificationPreference
  status: ContactStatus
  shareLocation: boolean
  shareHealthData: boolean
  notifyOnSOS: boolean
  notifyOnProximityAlert: boolean
  proximityRadius?: number // meters
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * Contact request (outgoing/incoming)
 */
export interface ContactRequest {
  id: string
  senderId: string
  receiverId: string
  senderName: string
  receiverName: string
  message?: string
  relationship: ContactRelationship
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  respondedAt?: string
}

/**
 * SOS alert to contacts
 */
export interface SOSAlert {
  id: string
  userId: string
  contactId: string
  contactName: string
  contactPhone: string
  message?: string
  location?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
  vitalSigns?: {
    heartRate?: number
    bloodPressure?: string
    oxygenSaturation?: number
  }
  status: 'sent' | 'delivered' | 'acknowledged' | 'failed'
  sentAt: string
  deliveredAt?: string
  acknowledgedAt?: string
}

/**
 * Contact group for organization
 */
export interface ContactGroup {
  id: string
  userId: string
  name: string
  description?: string
  icon?: string
  color?: string
  contactIds: string[]
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for emergency contact input
 */
export const emergencyContactInputSchema = z.object({
  name: z.string().min(1),
  phoneNumber: z.string().min(10).max(15),
  email: z.string().email().optional(),
  relationship: z.enum([
    'family',
    'friend',
    'neighbor',
    'colleague',
    'doctor',
    'caregiver',
    'other'
  ]),
  isPrimary: z.boolean().optional(),
  notificationPreference: z.enum([
    'all_alerts',
    'critical_only',
    'sos_only',
    'none'
  ]).optional(),
  shareLocation: z.boolean().optional(),
  shareHealthData: z.boolean().optional(),
  notifyOnSOS: z.boolean().optional(),
  notifyOnProximityAlert: z.boolean().optional(),
  proximityRadius: z.number().positive().max(50000).optional(),
  notes: z.string().optional(),
})

/**
 * Schema for contact group input
 */
export const contactGroupInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a new emergency contact
 */
export async function createEmergencyContact(
  userId: string,
  input: z.infer<typeof emergencyContactInputSchema>
): Promise<EmergencyContact> {
  const validationResult = emergencyContactInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid contact input: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  // If setting as primary, unset existing primary
  if (validatedInput.isPrimary) {
    await supabase
      .from('emergency_contacts')
      .update({ is_primary: false })
      .eq('user_id', userId)
      .eq('is_primary', true)
  }

  // Check for existing contact with same phone number
  const { data: existing } = await supabase
    .from('emergency_contacts')
    .select('id')
    .eq('user_id', userId)
    .eq('phone_number', validatedInput.phoneNumber)
    .single()

  if (existing) {
    throw new Error('Contact with this phone number already exists')
  }

  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      user_id: userId,
      name: validatedInput.name,
      phone_number: validatedInput.phoneNumber,
      email: validatedInput.email || null,
      relationship: validatedInput.relationship,
      is_primary: validatedInput.isPrimary || false,
      notification_preference: validatedInput.notificationPreference || 'all_alerts',
      status: 'active',
      share_location: validatedInput.shareLocation ?? true,
      share_health_data: validatedInput.shareHealthData ?? false,
      notify_on_sos: validatedInput.notifyOnSOS ?? true,
      notify_on_proximity_alert: validatedInput.notifyOnProximityAlert ?? false,
      proximity_radius: validatedInput.proximityRadius || null,
      notes: validatedInput.notes || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating emergency contact:', error)
    throw new Error(`Failed to create emergency contact: ${error.message}`)
  }

  return mapContactFromDB(data)
}

/**
 * Gets all emergency contacts for a user
 */
export async function getEmergencyContacts(
  userId: string,
  options?: {
    status?: ContactStatus
    includeInactive?: boolean
  }
): Promise<EmergencyContact[]> {
  const supabase = createClient()

  let query = supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)

  if (!options?.includeInactive) {
    query = query.eq('status', 'active')
  } else if (options?.status) {
    query = query.eq('status', options.status)
  }

  query = query.order('is_primary', { ascending: false })
    .order('name', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching emergency contacts:', error)
    return []
  }

  return data.map(mapContactFromDB)
}

/**
 * Gets a single emergency contact
 */
export async function getEmergencyContact(
  userId: string,
  contactId: string
): Promise<EmergencyContact | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', contactId)
    .single()

  if (error) {
    console.error('Error fetching emergency contact:', error)
    return null
  }

  return mapContactFromDB(data)
}

/**
 * Updates an emergency contact
 */
export async function updateEmergencyContact(
  userId: string,
  contactId: string,
  updates: Partial<z.infer<typeof emergencyContactInputSchema>>
): Promise<EmergencyContact> {
  const supabase = createClient()

  // If setting as primary, unset existing primary
  if (updates.isPrimary) {
    await supabase
      .from('emergency_contacts')
      .update({ is_primary: false })
      .eq('user_id', userId)
      .eq('is_primary', true)
  }

  const { data, error } = await supabase
    .from('emergency_contacts')
    .update({
      name: updates.name,
      phone_number: updates.phoneNumber,
      email: updates.email || null,
      relationship: updates.relationship,
      is_primary: updates.isPrimary,
      notification_preference: updates.notificationPreference,
      share_location: updates.shareLocation,
      share_health_data: updates.shareHealthData,
      notify_on_sos: updates.notifyOnSOS,
      notify_on_proximity_alert: updates.notifyOnProximityAlert,
      proximity_radius: updates.proximityRadius || null,
      notes: updates.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', contactId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating emergency contact:', error)
    throw new Error(`Failed to update emergency contact: ${error.message}`)
  }

  return mapContactFromDB(data)
}

/**
 * Deletes an emergency contact
 */
export async function deleteEmergencyContact(
  userId: string,
  contactId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('user_id', userId)
    .eq('id', contactId)

  if (error) {
    console.error('Error deleting emergency contact:', error)
    return false
  }

  return true
}

/**
 * Sets a contact as primary
 */
export async function setPrimaryContact(
  userId: string,
  contactId: string
): Promise<boolean> {
  const supabase = createClient()

  // Unset existing primary
  await supabase
    .from('emergency_contacts')
    .update({ is_primary: false })
    .eq('user_id', userId)
    .eq('is_primary', true)

  // Set new primary
  const { error } = await supabase
    .from('emergency_contacts')
    .update({ is_primary: true })
    .eq('user_id', userId)
    .eq('id', contactId)

  if (error) {
    console.error('Error setting primary contact:', error)
    return false
  }

  return true
}

/**
 * Gets primary emergency contact
 */
export async function getPrimaryContact(
  userId: string
): Promise<EmergencyContact | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .eq('status', 'active')
    .single()

  if (error) {
    console.error('Error fetching primary contact:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapContactFromDB(data)
}

/**
 * Gets contacts to notify for SOS
 */
export async function getSOSContacts(
  userId: string
): Promise<EmergencyContact[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('notify_on_sos', true)
    .order('is_primary', { ascending: false })

  if (error) {
    console.error('Error fetching SOS contacts:', error)
    return []
  }

  return data.map(mapContactFromDB)
}

// ============================================================================
// Contact Groups
// ============================================================================

/**
 * Creates a contact group
 */
export async function createContactGroup(
  userId: string,
  input: z.infer<typeof contactGroupInputSchema>
): Promise<ContactGroup> {
  const validationResult = contactGroupInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid group input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('contact_groups')
    .insert({
      user_id: userId,
      name: validationResult.data.name as string,
      description: validationResult.data.description as string || null,
      icon: validationResult.data.icon as string || null,
      color: validationResult.data.color as string || null,
      contact_ids: [],
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating contact group:', error)
    throw new Error(`Failed to create contact group: ${error.message}`)
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    name: data.name as string,
    description: data.description as string || undefined,
    icon: data.icon as string || undefined,
    color: data.color as string || undefined,
    contactIds: data.contact_ids as any[] || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Gets user's contact groups
 */
export async function getContactGroups(userId: string): Promise<ContactGroup[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('contact_groups')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching contact groups:', error)
    return []
  }

  return data.map(item => ({
    id: item.id,
    userId: item.user_id,
    name: item.name,
    description: item.description || undefined,
    icon: item.icon || undefined,
    color: item.color || undefined,
    contactIds: item.contact_ids || [],
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

/**
 * Adds a contact to a group
 */
export async function addContactToGroup(
  userId: string,
  groupId: string,
  contactId: string
): Promise<boolean> {
  const supabase = createClient()

  // Get current group
  const { data: group } = await supabase
    .from('contact_groups')
    .select('contact_ids')
    .eq('user_id', userId)
    .eq('id', groupId)
    .single()

  if (!group) {
    throw new Error('Group not found')
  }

  const contactIds = [...new Set([...group.contact_ids, contactId])]

  const { error } = await supabase
    .from('contact_groups')
    .update({
      contact_ids: contactIds,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', groupId)

  if (error) {
    console.error('Error adding contact to group:', error)
    return false
  }

  return true
}

/**
 * Removes a contact from a group
 */
export async function removeContactFromGroup(
  userId: string,
  groupId: string,
  contactId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data: group } = await supabase
    .from('contact_groups')
    .select('contact_ids')
    .eq('user_id', userId)
    .eq('id', groupId)
    .single()

  if (!group) {
    throw new Error('Group not found')
  }

  const contactIds = group.contact_ids.filter((id: string) => id !== contactId)

  const { error } = await supabase
    .from('contact_groups')
    .update({
      contact_ids: contactIds,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', groupId)

  if (error) {
    console.error('Error removing contact from group:', error)
    return false
  }

  return true
}

// ============================================================================
// Contact Requests
// ============================================================================

/**
 * Sends a contact request
 */
export async function sendContactRequest(
  senderId: string,
  receiverId: string,
  message?: string,
  relationship: ContactRelationship = 'other'
): Promise<ContactRequest> {
  const supabase = createClient()

  // Get sender info
  const { data: sender } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', senderId)
    .single()

  // Get receiver info
  const { data: receiver } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', receiverId)
    .single()

  if (!sender || !receiver) {
    throw new Error('User not found')
  }

  const { data, error } = await supabase
    .from('contact_requests')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      sender_name: sender.full_name,
      receiver_name: receiver.full_name,
      message: message || null,
      relationship,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error sending contact request:', error)
    throw new Error(`Failed to send contact request: ${error.message}`)
  }

  return {
    id: data.id as string,
    senderId: data.sender_id as string,
    receiverId: data.receiver_id as string,
    senderName: data.sender_name as string,
    receiverName: data.receiver_name as string,
    message: data.message as string || undefined,
    relationship: data.relationship,
    status: data.status as string,
    createdAt: data.created_at as string,
    respondedAt: data.responded_at as string || undefined,
  }
}

/**
 * Gets pending contact requests for a user
 */
export async function getPendingContactRequests(
  userId: string
): Promise<ContactRequest[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contact requests:', error)
    return []
  }

  return data.map(item => ({
    id: item.id,
    senderId: item.sender_id,
    receiverId: item.receiver_id,
    senderName: item.sender_name,
    receiverName: item.receiver_name,
    message: item.message || undefined,
    relationship: item.relationship,
    status: item.status,
    createdAt: item.created_at,
    respondedAt: item.responded_at || undefined,
  }))
}

/**
 * Responds to a contact request
 */
export async function respondToContactRequest(
  requestId: string,
  accept: boolean
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('contact_requests')
    .update({
      status: accept ? 'accepted' : 'declined',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) {
    console.error('Error responding to contact request:', error)
    return false
  }

  return true
}

// ============================================================================
// SOS Alerts
// ============================================================================

/**
 * Creates and sends SOS alerts to contacts
 */
export async function sendSOSAlerts(
  userId: string,
  options?: {
    message?: string
    location?: {
      latitude: number
      longitude: number
      accuracy?: number
    }
    vitalSigns?: {
      heartRate?: number
      bloodPressure?: string
      oxygenSaturation?: number
    }
  }
): Promise<SOSAlert[]> {
  const contacts = await getSOSContacts(userId)
  const supabase = createClient()

  const alerts: SOSAlert[] = []

  for (const contact of contacts) {
    // Create alert record
    const { data: alertData, error } = await supabase
      .from('sos_alerts')
      .insert({
        user_id: userId,
        contact_id: contact.id,
        message: options?.message || null,
        location: options?.location || null,
        vital_signs: options?.vitalSigns || null,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating SOS alert:', error)
      continue
    }

    // TODO: Integrate with SMS/WhatsApp service to actually send the alert
    // For now, just record it in the database

    alerts.push({
      id: alertData.id,
      userId: alertData.user_id,
      contactId: alertData.contact_id,
      contactName: contact.name,
      contactPhone: contact.phoneNumber,
      message: alertData.message || undefined,
      location: alertData.location || undefined,
      vitalSigns: alertData.vital_signs || undefined,
      status: alertData.status,
      sentAt: alertData.sent_at,
      deliveredAt: alertData.delivered_at || undefined,
      acknowledgedAt: alertData.acknowledged_at || undefined,
    })
  }

  return alerts
}

/**
 * Gets SOS alerts for a user
 */
export async function getSOSAlerts(
  userId: string,
  options?: {
    limit?: number
    status?: SOSAlert['status']
  }
): Promise<SOSAlert[]> {
  const supabase = createClient()

  let query = supabase
    .from('sos_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching SOS alerts:', error)
    return []
  }

  return data.map(item => ({
    id: item.id,
    userId: item.user_id,
    contactId: item.contact_id,
    contactName: '', // Would need to join with contacts table
    contactPhone: '', // Would need to join with contacts table
    message: item.message || undefined,
    location: item.location || undefined,
    vitalSigns: item.vital_signs || undefined,
    status: item.status,
    sentAt: item.sent_at,
    deliveredAt: item.delivered_at || undefined,
    acknowledgedAt: item.acknowledged_at || undefined,
  }))
}

/**
 * Acknowledges receipt of SOS alert
 */
export async function acknowledgeSOSAlert(
  alertId: string,
  contactId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('sos_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .eq('contact_id', contactId)

  if (error) {
    console.error('Error acknowledging SOS alert:', error)
    return false
  }

  return true
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to EmergencyContact type
 */
function mapContactFromDB(data: Record<string, unknown>): EmergencyContact {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    name: data.name as string,
    phoneNumber: data.phone_number,
    email: data.email as string | undefined,
    relationship: data.relationship as ContactRelationship,
    isPrimary: data.is_primary as boolean,
    notificationPreference: data.notification_preference as ContactNotificationPreference,
    status: data.status as ContactStatus,
    shareLocation: data.share_location,
    shareHealthData: data.share_health_data,
    notifyOnSOS: data.notify_on_sos,
    notifyOnProximityAlert: data.notify_on_proximity_alert,
    proximityRadius: data.proximity_radius as number | undefined,
    notes: data.notes as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Validates phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Basic validation - allows various formats with country code
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

/**
 * Gets relationship display name
 */
export function getRelationshipDisplayName(
  relationship: ContactRelationship
): string {
  const names: Record<ContactRelationship, string> = {
    family: 'Family Member',
    friend: 'Friend',
    neighbor: 'Neighbor',
    colleague: 'Colleague',
    doctor: 'Doctor/Medical Professional',
    caregiver: 'Caregiver',
    other: 'Other',
  }
  return names[relationship]
}
