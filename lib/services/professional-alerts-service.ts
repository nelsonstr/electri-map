import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type ProfessionalAlertType = 
  | 'medical_emergency' 
  | 'fire_alarm' 
  | 'security_threat' 
  | 'hazmat_incident' 
  | 'utility_emergency' 
  | 'infrastructure_failure'
  | 'mass_casualty'
  | 'natural_disaster'
  | 'public_health'
  | 'transportation_emergency'

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'

export type ProfessionalAlertStatus = 
  | 'pending_verification' 
  | 'verified' 
  | 'dispatched' 
  | 'in_progress' 
  | 'resolved'
  | 'cancelled'

export type ProfessionalRole = 
  | 'emergency_medical_services'
  | 'fire_department'
  | 'police'
  | 'hazmat_team'
  | 'utility_company'
  | 'hospital'
  | 'search_and_rescue'
  | 'disaster_response'
  | 'public_health'
  | 'transportation'

export interface ProfessionalResponder {
  id: string
  userId: string
  organization: string
  role: ProfessionalRole
  certifications: string[]
  isActive: boolean
  currentLatitude?: number
  currentLongitude?: number
  availableForDispatch: boolean
  dispatchCount: number
  averageResponseTime?: number
  lastActiveAt?: string
  createdAt?: string
}

export interface ProfessionalAlert {
  id: string
  
  // Alert Information
  alertType: ProfessionalAlertType
  severity: AlertSeverity
  title: string
  description: string
  
  // Location
  incidentLatitude: number
  incidentLongitude: number
  incidentAddress?: string
  incidentLocation?: string
  affectedRadiusKm: number
  
  // Status
  status: ProfessionalAlertStatus
  verifiedBy?: string
  verifiedAt?: string
  
  // Dispatch Information
  dispatchedResponders: string[]
  dispatchedAt?: string
  
  // Resolution
  resolvedAt?: string
  resolution?: string
  
  // Metadata
  createdBy: string
  externalIncidentId?: string
  relatedAlerts?: string[]
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CreateProfessionalAlertInput {
  alertType: ProfessionalAlertType
  severity: AlertSeverity
  title: string
  description: string
  incidentLatitude: number
  incidentLongitude: number
  incidentAddress?: string
  incidentLocation?: string
  affectedRadiusKm?: number
  externalIncidentId?: string
}

export interface DispatchResponderInput {
  alertId: string
  responderIds: string[]
}

export interface UpdateAlertStatusInput {
  alertId: string
  status: ProfessionalAlertStatus
  resolution?: string
}

// ============================================================================
// Severity and Status Configuration
// ============================================================================

export const ALERT_SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    color: '#dc2626',
    priority: 1,
    responseTime: 5, // minutes
    requiresVerification: true,
  },
  high: {
    label: 'High',
    color: '#ea580c',
    priority: 2,
    responseTime: 15,
    requiresVerification: true,
  },
  medium: {
    label: 'Medium',
    color: '#ca8a04',
    priority: 3,
    responseTime: 30,
    requiresVerification: false,
  },
  low: {
    label: 'Low',
    color: '#16a34a',
    priority: 4,
    responseTime: 60,
    requiresVerification: false,
  },
}

export const ALERT_TYPE_CONFIG = {
  medical_emergency: {
    label: 'Medical Emergency',
    icon: '🚑',
    requiredRoles: ['emergency_medical_services', 'hospital'],
    defaultSeverity: 'high',
  },
  fire_alarm: {
    label: 'Fire Alarm',
    icon: '🔥',
    requiredRoles: ['fire_department', 'hazmat_team'],
    defaultSeverity: 'critical',
  },
  security_threat: {
    label: 'Security Threat',
    icon: '🚨',
    requiredRoles: ['police'],
    defaultSeverity: 'high',
  },
  hazmat_incident: {
    label: 'Hazmat Incident',
    icon: '☢️',
    requiredRoles: ['hazmat_team', 'fire_department'],
    defaultSeverity: 'critical',
  },
  utility_emergency: {
    label: 'Utility Emergency',
    icon: '⚡',
    requiredRoles: ['utility_company'],
    defaultSeverity: 'medium',
  },
  infrastructure_failure: {
    label: 'Infrastructure Failure',
    icon: '🏗️',
    requiredRoles: ['disaster_response'],
    defaultSeverity: 'medium',
  },
  mass_casualty: {
    label: 'Mass Casualty',
    icon: '⚠️',
    requiredRoles: ['emergency_medical_services', 'fire_department', 'hospital'],
    defaultSeverity: 'critical',
  },
  natural_disaster: {
    label: 'Natural Disaster',
    icon: '🌪️',
    requiredRoles: ['disaster_response', 'search_and_rescue'],
    defaultSeverity: 'critical',
  },
  public_health: {
    label: 'Public Health',
    icon: '🏥',
    requiredRoles: ['public_health', 'hospital'],
    defaultSeverity: 'high',
  },
  transportation_emergency: {
    label: 'Transportation Emergency',
    icon: '🚗',
    requiredRoles: ['transportation'],
    defaultSeverity: 'medium',
  },
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createProfessionalAlertSchema = z.object({
  alertType: z.enum([
    'medical_emergency',
    'fire_alarm',
    'security_threat',
    'hazmat_incident',
    'utility_emergency',
    'infrastructure_failure',
    'mass_casualty',
    'natural_disaster',
    'public_health',
    'transportation_emergency',
  ]),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  incidentLatitude: z.number().min(-90).max(90),
  incidentLongitude: z.number().min(-180).max(180),
  incidentAddress: z.string().optional(),
  incidentLocation: z.string().optional(),
  affectedRadiusKm: z.number().positive().max(50).optional(),
  externalIncidentId: z.string().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getSeverityDisplayName(severity: AlertSeverity): string {
  return ALERT_SEVERITY_CONFIG[severity]?.label || severity
}

export function getSeverityColor(severity: AlertSeverity): string {
  return ALERT_SEVERITY_CONFIG[severity]?.color || '#6b7280'
}

export function getAlertTypeDisplayName(type: ProfessionalAlertType): string {
  return ALERT_TYPE_CONFIG[type]?.label || type
}

export function getStatusDisplayName(status: ProfessionalAlertStatus): string {
  const names: Record<ProfessionalAlertStatus, string> = {
    pending_verification: 'Pending Verification',
    verified: 'Verified',
    dispatched: 'Dispatched',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    cancelled: 'Cancelled',
  }
  return names[status] || status
}

export function getRoleDisplayName(role: ProfessionalRole): string {
  const names: Record<ProfessionalRole, string> = {
    emergency_medical_services: 'Emergency Medical Services',
    fire_department: 'Fire Department',
    police: 'Police',
    hazmat_team: 'Hazmat Team',
    utility_company: 'Utility Company',
    hospital: 'Hospital',
    search_and_rescue: 'Search & Rescue',
    disaster_response: 'Disaster Response',
    public_health: 'Public Health',
    transportation: 'Transportation',
  }
  return names[role] || role
}

export function calculateDispatcherPriority(
  alert: ProfessionalAlert,
  responder: ProfessionalResponder
): number {
  let priority = 100

  // Severity affects priority
  const severityPriority = ALERT_SEVERITY_CONFIG[alert.severity]?.priority || 2
  priority -= severityPriority * 20

  // Check if responder's role matches required roles
  const requiredRoles = ALERT_TYPE_CONFIG[alert.alertType]?.requiredRoles || []
  if (requiredRoles.includes(responder.role)) {
    priority += 30
  }

  // Calculate distance (in production, use actual distance)
  if (responder.currentLatitude && responder.currentLongitude) {
    const distance = calculateDistance(
      responder.currentLatitude,
      responder.currentLongitude,
      alert.incidentLatitude,
      alert.incidentLongitude
    )
    // Closer responders get higher priority
    priority -= Math.min(distance / 10, 20)
  }

  // Active and available responders get priority
  if (responder.isActive && responder.availableForDispatch) {
    priority += 20
  }

  return Math.max(0, Math.min(100, priority))
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createProfessionalAlert(
  input: CreateProfessionalAlertInput,
  userId: string
): Promise<ProfessionalAlert> {
  const validationResult = createProfessionalAlertSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const alertId = `profalert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const alert: ProfessionalAlert = {
    id: alertId,
    alertType: input.alertType,
    severity: input.severity,
    title: input.title,
    description: input.description,
    incidentLatitude: input.incidentLatitude,
    incidentLongitude: input.incidentLongitude,
    incidentAddress: input.incidentAddress,
    incidentLocation: input.incidentLocation,
    affectedRadiusKm: input.affectedRadiusKm || 1,
    status: ALERT_SEVERITY_CONFIG[input.severity]?.requiresVerification 
      ? 'pending_verification' 
      : 'verified',
    dispatchedResponders: [],
    createdBy: userId,
    externalIncidentId: input.externalIncidentId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('professional_alerts')
    .insert({
      id: alertId,
      alert_type: input.alertType,
      severity: input.severity,
      title: input.title,
      description: input.description,
      incident_latitude: input.incidentLatitude,
      incident_longitude: input.incidentLongitude,
      incident_address: input.incidentAddress,
      incident_location: input.incidentLocation,
      affected_radius_km: input.affectedRadiusKm || 1,
      status: alert.status,
      dispatched_responders: [],
      created_by: userId,
      external_incident_id: input.externalIncidentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating professional alert:', error)
    throw new Error('Failed to create professional alert')
  }

  // If verification is required, notify supervisors
  if (alert.status === 'pending_verification') {
    await notifySupervisorsForVerification(alertId)
  } else {
    // Auto-dispatch if critical and verification not required
    if (input.severity === 'critical') {
      await autoDispatchResponders(alertId)
    }
  }

  return alert
}

export async function getProfessionalAlert(alertId: string): Promise<ProfessionalAlert | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('professional_alerts')
    .select('*')
    .eq('id', alertId)
    .single()

  if (error || !data) {
    return null
  }

  return mapAlertFromDB(data)
}

export async function updateAlertStatus(
  input: UpdateAlertStatusInput,
  userId: string
): Promise<ProfessionalAlert> {
  const supabase = createClient()

  const alert = await getProfessionalAlert(input.alertId)
  if (!alert) {
    throw new Error('Alert not found')
  }

  const updates: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  }

  if (input.status === 'verified') {
    updates.verified_by = userId
    updates.verified_at = new Date().toISOString()
  }

  if (input.status === 'resolved') {
    updates.resolved_at = new Date().toISOString()
    updates.resolution = input.resolution
  }

  const { error } = await supabase
    .from('professional_alerts')
    .update(updates)
    .eq('id', input.alertId)

  if (error) {
    console.error('Error updating alert status:', error)
    throw new Error('Failed to update alert status')
  }

  // Trigger auto-dispatch if verified and critical
  if (input.status === 'verified' && alert.severity === 'critical') {
    await autoDispatchResponders(input.alertId)
  }

  return getProfessionalAlert(input.alertId) as Promise<ProfessionalAlert>
}

export async function dispatchResponders(
  input: DispatchResponderInput,
  dispatcherId: string
): Promise<ProfessionalAlert> {
  const supabase = createClient()

  const alert = await getProfessionalAlert(input.alertId)
  if (!alert) {
    throw new Error('Alert not found')
  }

  if (alert.status === 'resolved' || alert.status === 'cancelled') {
    throw new Error('Cannot dispatch responders to a resolved or cancelled alert')
  }

  const { error } = await supabase
    .from('professional_alerts')
    .update({
      status: 'dispatched',
      dispatched_responders: input.responderIds,
      dispatched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.alertId)

  if (error) {
    console.error('Error dispatching responders:', error)
    throw new Error('Failed to dispatch responders')
  }

  // Notify dispatched responders
  await notifyDispatchedResponders(input.alertId, input.responderIds)

  // Update responder availability
  await updateResponderAvailability(input.responderIds, false)

  return getProfessionalAlert(input.alertId) as Promise<ProfessionalAlert>
}

async function autoDispatchResponders(alertId: string): Promise<void> {
  const alert = await getProfessionalAlert(alertId)
  if (!alert) return

  // Get required responder types
  const requiredRoles = ALERT_TYPE_CONFIG[alert.alertType]?.requiredRoles || []

  // Get available responders for required roles
  const availableResponders = await getAvailableResponders(
    requiredRoles as ProfessionalRole[]
  )

  if (availableResponders.length === 0) {
    console.log('No available responders for auto-dispatch')
    return
  }

  // Calculate priorities and sort
  const respondersWithPriority = availableResponders.map(responder => ({
    responder,
    priority: calculateDispatcherPriority(alert, responder),
  }))

  respondersWithPriority.sort((a, b) => b.priority - a.priority)

  // Select top responders (up to 3)
  const selectedResponderIds = respondersWithPriority
    .slice(0, 3)
    .map(r => r.responder.id)

  // Dispatch
  await dispatchResponders(
    { alertId, responderIds: selectedResponderIds },
    'system'
  )
}

async function getAvailableResponders(
  roles: ProfessionalRole[]
): Promise<ProfessionalResponder[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('professional_responders')
    .select('*')
    .in('role', roles)
    .eq('is_active', true)
    .eq('available_for_dispatch', true)

  return (data || []).map(r => ({
    id: r.id as string,
    userId: r.user_id as string,
    organization: r.organization as string,
    role: r.role as ProfessionalRole,
    certifications: r.certifications as string[],
    isActive: r.is_active as boolean,
    currentLatitude: (r.current_latitude as number) || undefined,
    currentLongitude: (r.current_longitude as number) || undefined,
    availableForDispatch: r.available_for_dispatch as boolean,
    dispatchCount: r.dispatch_count as number,
    averageResponseTime: (r.average_response_time as number) || undefined,
    lastActiveAt: (r.last_active_at as string) || undefined,
    createdAt: (r.created_at as string) || undefined,
  }))
}

async function notifySupervisorsForVerification(alertId: string): Promise<void> {
  const supabase = createClient()

  // Get supervisor users
  const { data: supervisors } = await supabase
    .from('users')
    .select('id, push_token, email')
    .eq('user_type', 'supervisor')
    .eq('notification_preferences->professional_alerts', true)

  // In production, send actual notifications
  console.log(`Notifying ${supervisors?.length || 0} supervisors for verification`)

  // Create notification records
  const notifications = supervisors?.map(supervisor => ({
    user_id: supervisor.id,
    type: 'professional_alert_verification',
    title: 'Alert Verification Required',
    body: 'A professional alert requires your verification',
    data: { alertId },
    created_at: new Date().toISOString(),
  }))

  if (notifications && notifications.length > 0) {
    await supabase.from('notifications').insert(notifications)
  }
}

async function notifyDispatchedResponders(
  alertId: string,
  responderIds: string[]
): Promise<void> {
  const supabase = createClient()

  // Get responder notification tokens
  const { data: responders } = await supabase
    .from('professional_responders')
    .select('user_id, push_token')
    .in('id', responderIds)

  // In production, send actual push notifications
  console.log(`Notifying ${responders?.length || 0} dispatched responders`)

  // Create notification records
  const alert = await getProfessionalAlert(alertId)
  const notifications = responders?.map(responder => ({
    user_id: responder.user_id,
    type: 'dispatch_notification',
    title: 'Dispatch Alert',
    body: `You have been dispatched to: ${alert?.title}`,
    data: { alertId, alertType: alert?.alertType },
    created_at: new Date().toISOString(),
  }))

  if (notifications && notifications.length > 0) {
    await supabase.from('notifications').insert(notifications)
  }
}

async function updateResponderAvailability(
  responderIds: string[],
  available: boolean
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('professional_responders')
    .update({
      available_for_dispatch: available,
      last_active_at: new Date().toISOString(),
    })
    .in('id', responderIds)
}

export async function responderAcknowledgeDispatch(
  alertId: string,
  responderId: string
): Promise<void> {
  const supabase = createClient()

  // Update responder's current location
  await supabase
    .from('professional_responders')
    .update({
      current_latitude: undefined,
      current_longitude: undefined,
    })
    .eq('id', responderId)

  // In production, update real-time location tracking
}

export async function updateResponderLocation(
  responderId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('professional_responders')
    .update({
      current_latitude: latitude,
      current_longitude: longitude,
      last_active_at: new Date().toISOString(),
    })
    .eq('id', responderId)
}

export async function getProfessionalAlerts(options?: {
  status?: ProfessionalAlertStatus
  alertType?: ProfessionalAlertType
  severity?: AlertSeverity
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}): Promise<ProfessionalAlert[]> {
  const supabase = createClient()

  let query = supabase
    .from('professional_alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.alertType) {
    query = query.eq('alert_type', options.alertType)
  }

  if (options?.severity) {
    query = query.eq('severity', options.severity)
  }

  if (options?.fromDate) {
    query = query.gte('created_at', options.fromDate)
  }

  if (options?.toDate) {
    query = query.lte('created_at', options.toDate)
  }

  query = query
    .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching professional alerts:', error)
    return []
  }

  return (data || []).map(mapAlertFromDB)
}

export async function getNearbyResponders(
  latitude: number,
  longitude: number,
  radiusKm: number,
  roles?: ProfessionalRole[]
): Promise<ProfessionalResponder[]> {
  const supabase = createClient()

  let query = supabase
    .from('professional_responders')
    .select('*')
    .eq('is_active', true)
    .eq('available_for_dispatch', true)

  if (roles && roles.length > 0) {
    query = query.in('role', roles)
  }

  const { data } = await query

  if (!data) return []

  // Filter by distance (in production, use PostGIS)
  const responders: ProfessionalResponder[] = []
  for (const responder of (data || []) as any[]) {
    if (responder.currentLatitude && responder.currentLongitude) {
      const distance = calculateDistance(
        latitude,
        longitude,
        responder.currentLatitude,
        responder.currentLongitude
      )
      if (distance <= radiusKm) {
        responders.push(responder as ProfessionalResponder)
      }
    }
  }

  return responders
}

export async function registerProfessionalResponder(
  userId: string,
  organization: string,
  role: ProfessionalRole,
  certifications: string[]
): Promise<ProfessionalResponder> {
  const supabase = createClient()

  const responderId = `responder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const responder: ProfessionalResponder = {
    id: responderId,
    userId,
    organization,
    role,
    certifications,
    isActive: true,
    availableForDispatch: true,
    dispatchCount: 0,
    createdAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('professional_responders')
    .insert({
      id: responderId,
      user_id: userId,
      organization,
      role,
      certifications,
      is_active: true,
      available_for_dispatch: true,
      dispatch_count: 0,
      created_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error registering professional responder:', error)
    throw new Error('Failed to register professional responder')
  }

  return responder
}

export async function getProfessionalAlertStats(options?: {
  fromDate?: string
  toDate?: string
}): Promise<{
  totalAlerts: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  bySeverity: Record<string, number>
  averageResolutionTime: number
  dispatchSuccessRate: number
}> {
  const supabase = createClient()

  let query = supabase
    .from('professional_alerts')
    .select('*')

  if (options?.fromDate) {
    query = query.gte('created_at', options.fromDate)
  }

  if (options?.toDate) {
    query = query.lte('created_at', options.toDate)
  }

  const { data } = await query

  const alerts = (data || []) as any[]

  if (alerts.length === 0) {
    return {
      totalAlerts: 0,
      byStatus: {},
      byType: {},
      bySeverity: {},
      averageResolutionTime: 0,
      dispatchSuccessRate: 0,
    }
  }

  const byStatus: Record<string, number> = {}
  const byType: Record<string, number> = {}
  const bySeverity: Record<string, number> = {}

  for (const alert of alerts) {
    const status = alert.status as string
    const type = alert.alert_type as string
    const severity = alert.severity as string
    
    byStatus[status] = (byStatus[status] || 0) + 1
    byType[type] = (byType[type] || 0) + 1
    bySeverity[severity] = (bySeverity[severity] || 0) + 1
  }

  // Calculate average resolution time
  const resolvedAlerts = alerts.filter(a => a.resolved_at)
  let averageResolutionTime = 0
  if (resolvedAlerts.length > 0) {
    const totalTime = resolvedAlerts.reduce((sum, alert) => {
      const created = new Date(alert.created_at as string).getTime()
      const resolved = new Date(alert.resolved_at as string).getTime()
      return sum + (resolved - created)
    }, 0)
    averageResolutionTime = totalTime / resolvedAlerts.length / (1000 * 60) // in minutes
  }

  // Calculate dispatch success rate
  const dispatchedAlerts = alerts.filter(a => a.dispatched_responders && a.dispatched_responders.length > 0)
  const dispatchSuccessRate = alerts.length > 0 
    ? (dispatchedAlerts.length / alerts.length) * 100 
    : 0

  return {
    totalAlerts: alerts.length,
    byStatus,
    byType,
    bySeverity,
    averageResolutionTime,
    dispatchSuccessRate,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapAlertFromDB(data: Record<string, unknown>): ProfessionalAlert {
  return {
    id: data.id as string,
    alertType: data.alert_type as ProfessionalAlertType,
    severity: data.severity as AlertSeverity,
    title: data.title as string,
    description: data.description as string,
    incidentLatitude: data.incident_latitude as number,
    incidentLongitude: data.incident_longitude as number,
    incidentAddress: data.incident_address as string | undefined,
    incidentLocation: data.incident_location as string | undefined,
    affectedRadiusKm: (data.affected_radius_km as number) || 1,
    status: data.status as ProfessionalAlertStatus,
    verifiedBy: (data.verified_by as string) || undefined,
    verifiedAt: (data.verified_at as string) || undefined,
    dispatchedResponders: (data.dispatched_responders as string[]) || [],
    dispatchedAt: (data.dispatched_at as string) || undefined,
    resolvedAt: (data.resolved_at as string) || undefined,
    resolution: (data.resolution as string) || undefined,
    createdBy: data.created_by as string,
    externalIncidentId: data.external_incident_id as string | undefined,
    relatedAlerts: data.related_alerts as string[] | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
