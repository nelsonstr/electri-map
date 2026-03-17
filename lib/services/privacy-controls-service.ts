import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Privacy setting type
 */
export type PrivacySettingType =
  | 'profile_visibility'
  | 'location_sharing'
  | 'activity_status'
  | 'alert_notifications'
  | 'analytics_sharing'
  | 'data_retention'
  | 'third_party_sharing'
  | 'marketing_communications'
  | 'communication_preferences'
  | 'emergency_contact_visibility'

/**
 * Visibility level
 */
export type VisibilityLevel =
  | 'public'
  | 'contacts'
  | 'community'
  | 'verified_only'
  | 'authorities_only'
  | 'private'

/**
 * Data retention period
 */
export type DataRetentionPeriod =
  | '30_days'
  | '90_days'
  | '1_year'
  | '2_years'
  | '5_years'
  | 'forever'
  | 'custom'

/**
 * Privacy setting
 */
export interface PrivacySetting {
  id: string
  userId?: string
  
  // Setting type and value
  settingType: PrivacySettingType
  value: unknown
  
  // Visibility constraints
  visibilityLevel?: VisibilityLevel
  allowedRoles?: string[]
  allowedUserIds?: string[]
  
  // Expiration
  expiresAt?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Data export
 */
export interface DataExport {
  id: string
  
  // User
  userId: string
  
  // Export info
  dataTypes: Array<
    | 'profile'
    | 'alerts'
    | 'reports'
    | 'location_history'
    | 'communications'
    | 'preferences'
    | 'analytics'
    | 'emergency_contacts'
  >
  
  // Format
  format: 'json' | 'csv' | 'pdf'
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  
  // Download
  downloadUrl?: string

  
  // Size
  fileSize?: number
  
  // Timestamps
  requestedAt: string
  completedAt?: string
  expiresAt?: string
}

/**
 * Data deletion request
 */
export interface DataDeletionRequest {
  id: string
  
  // User
  userId: string
  
  // Request info
  reason?: string
  confirmationCode: string
  
  // Scope
  dataTypes: Array<
    | 'profile'
    | 'alerts'
    | 'reports'
    | 'location_history'
    | 'communications'
    | 'preferences'
    | 'analytics'
    | 'emergency_contacts'
    | 'all'
  >
  retainData?: string[]
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  
  // Scheduled
  scheduledAt: string
  completedAt?: string
  
  // Verification
  verifiedAt?: string
  verifiedBy?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Consent record
 */
export interface ConsentRecord {
  id: string
  
  // Consent info
  consentType: string
  consentVersion: string
  
  // User
  userId?: string
  anonymousId?: string
  
  // Status
  granted: boolean
  revokedAt?: string
  
  // Context
  source: 'web' | 'mobile' | 'api' | 'import'
  ipAddress?: string
  userAgent?: string
  
  // Scope
  scope?: string[]
  purpose?: string
  
  // Timestamps
  grantedAt: string
  updatedAt: string
}

/**
 * Privacy audit log
 */
export interface PrivacyAuditLog {
  id: string
  
  // Action
  action: 'view' | 'edit' | 'export' | 'delete' | 'share' | 'consent'
  
  // Target
  targetType: 'profile' | 'location' | 'alerts' | 'reports' | 'preferences' | 'data'
  targetId?: string
  
  // User
  userId?: string
  actorId?: string
  
  // Context
  ipAddress?: string
  userAgent?: string
  location?: string
  
  // Details
  description: string
  changes?: Record<string, unknown>
  
  // Timestamp
  timestamp: string
}

/**
 * Update privacy settings input
 */
export interface UpdatePrivacySettingsInput {
  settingType: PrivacySettingType
  value: unknown
  visibilityLevel?: VisibilityLevel
  allowedRoles?: string[]
  allowedUserIds?: string[]
  expiresAt?: string
}

/**
 * Create data export input
 */
export interface CreateDataExportInput {
  dataTypes: DataExport['dataTypes']
  format?: 'json' | 'csv' | 'pdf'
}

/**
 * Create deletion request input
 */
export interface CreateDeletionRequestInput {
  reason?: string
  dataTypes: DataDeletionRequest['dataTypes']
  retainData?: string[]
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for updating privacy settings
 */
export const updatePrivacySettingsSchema = z.object({
  settingType: z.enum([
    'profile_visibility',
    'location_sharing',
    'activity_status',
    'alert_notifications',
    'analytics_sharing',
    'data_retention',
    'third_party_sharing',
    'marketing_communications',
    'communication_preferences',
    'emergency_contact_visibility',
  ]),
  value: z.unknown(),
  visibilityLevel: z.enum([
    'public',
    'contacts',
    'community',
    'verified_only',
    'authorities_only',
    'private',
  ]).optional(),
  allowedRoles: z.array(z.string()).optional(),
  allowedUserIds: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
})

/**
 * Schema for consent
 */
export const consentSchema = z.object({
  consentType: z.string().min(1),
  consentVersion: z.string().min(1),
  granted: z.boolean(),
  scope: z.array(z.string()).optional(),
  purpose: z.string().optional(),
})

/**
 * Schema for data export
 */
export const createDataExportSchema = z.object({
  dataTypes: z.array(z.enum([
    'profile',
    'alerts',
    'reports',
    'location_history',
    'communications',
    'preferences',
    'analytics',
    'emergency_contacts',
  ])).min(1),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
})

/**
 * Schema for deletion request
 */
export const createDeletionRequestSchema = z.object({
  reason: z.string().max(1000).optional(),
  dataTypes: z.array(z.enum([
    'profile',
    'alerts',
    'reports',
    'location_history',
    'communications',
    'preferences',
    'analytics',
    'emergency_contacts',
    'all',
  ])).min(1),
  retainData: z.array(z.string()).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for visibility level
 */
export function getVisibilityLevelDisplayName(level: VisibilityLevel): string {
  const names: Record<VisibilityLevel, string> = {
    public: 'Public (Anyone)',
    contacts: 'Contacts Only',
    community: 'Community Members',
    verified_only: 'Verified Users',
    authorities_only: 'Authorities Only',
    private: 'Private (Only Me)',
  }
  return names[level]
}

/**
 * Gets display name for retention period
 */
export function getRetentionPeriodDisplayName(period: DataRetentionPeriod): string {
  const names: Record<DataRetentionPeriod, string> = {
    '30_days': '30 Days',
    '90_days': '90 Days',
    '1_year': '1 Year',
    '2_years': '2 Years',
    '5_years': '5 Years',
    forever: 'Forever',
    custom: 'Custom',
  }
  return names[period]
}

/**
 * Gets display name for privacy setting type
 */
export function getPrivacySettingTypeDisplayName(type: PrivacySettingType): string {
  const names: Record<PrivacySettingType, string> = {
    profile_visibility: 'Profile Visibility',
    location_sharing: 'Location Sharing',
    activity_status: 'Activity Status',
    alert_notifications: 'Alert Notifications',
    analytics_sharing: 'Analytics Sharing',
    data_retention: 'Data Retention',
    third_party_sharing: 'Third-Party Sharing',
    marketing_communications: 'Marketing Communications',
    communication_preferences: 'Communication Preferences',
    emergency_contact_visibility: 'Emergency Contact Visibility',
  }
  return names[type]
}

/**
 * Validates privacy setting value
 */
export function validatePrivacySettingValue(
  type: PrivacySettingType,
  value: unknown
): boolean {
  switch (type) {
    case 'profile_visibility':
    case 'location_sharing':
    case 'activity_status':
    case 'emergency_contact_visibility':
      return typeof value === 'string' && 
        ['public', 'contacts', 'community', 'verified_only', 'authorities_only', 'private'].includes(value as string)

    case 'alert_notifications':
    case 'analytics_sharing':
    case 'marketing_communications':
    case 'communication_preferences':
      return typeof value === 'object' && value !== null

    case 'data_retention':
      return typeof value === 'string' &&
        ['30_days', '90_days', '1_year', '2_years', '5_years', 'forever', 'custom'].includes(value as string)

    case 'third_party_sharing':
      return typeof value === 'boolean'

    default:
      return false
  }
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Gets user privacy settings
 */
export async function getPrivacySettings(
  userId: string
): Promise<PrivacySetting[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('setting_type')

  if (error) {
    console.error('Error fetching settings:', error)
    return []
  }

  return (data || []).map(mapSettingFromDB)
}

/**
 * Updates a privacy setting
 */
export async function updatePrivacySetting(
  userId: string,
  input: UpdatePrivacySettingsInput
): Promise<PrivacySetting> {
  const validationResult = updatePrivacySettingsSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid setting: ${validationResult.error.message}`)
  }

  // Validate value type
  if (!validatePrivacySettingValue(input.settingType, input.value)) {
    throw new Error(`Invalid value for setting type: ${input.settingType}`)
  }

  const supabase = createClient()

  // Check existing
  const { data: existing } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .eq('setting_type', input.settingType)
    .single()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    value: input.value,
  }

  if (input.visibilityLevel !== undefined) {
    updateData.visibility_level = input.visibilityLevel
  }
  if (input.allowedRoles !== undefined) {
    updateData.allowed_roles = input.allowedRoles
  }
  if (input.allowedUserIds !== undefined) {
    updateData.allowed_user_ids = input.allowedUserIds
  }
  if (input.expiresAt !== undefined) {
    updateData.expires_at = input.expiresAt
  }

  let data
  if (existing) {
    const { data: updated, error } = await supabase
      .from('privacy_settings')
      .update(updateData)
      .eq('id', (existing as { id: string }).id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating setting:', error)
      throw new Error(`Failed to update: ${error.message}`)
    }

    data = updated
  } else {
    const { data: created, error } = await supabase
      .from('privacy_settings')
      .insert({
        user_id: userId,
        setting_type: input.settingType,
        value: input.value,
        visibility_level: input.visibilityLevel,
        allowed_roles: input.allowedRoles || null,
        allowed_user_ids: input.allowedUserIds || null,
        expires_at: input.expiresAt || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating setting:', error)
      throw new Error(`Failed to create: ${error.message}`)
    }

    data = created
  }

  // Log audit
  await logPrivacyAction({
    action: 'edit',
    targetType: 'preferences',
    userId,
    description: `Updated privacy setting: ${input.settingType}`,
    changes: { settingType: input.settingType, value: input.value },
  })

  return mapSettingFromDB(data)
}

/**
 * Resets all privacy settings to defaults
 */
export async function resetPrivacySettings(userId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('privacy_settings')
    .delete()
    .eq('user_id', userId)

  // Log audit
  await logPrivacyAction({
    action: 'delete',
    targetType: 'preferences',
    userId,
    description: 'Reset all privacy settings to defaults',
  })
}

/**
 * Creates a data export request
 */
export async function createDataExport(
  userId: string,
  input: CreateDataExportInput
): Promise<DataExport> {
  const validationResult = createDataExportSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid export request: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('data_exports')
    .insert({
      id: exportId,
      user_id: userId,
      data_types: input.dataTypes,
      format: input.format || 'json',
      status: 'pending',
      requested_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating export:', error)
    throw new Error(`Failed to create export: ${error.message}`)
  }

  // Log audit
  await logPrivacyAction({
    action: 'export',
    targetType: 'data',
    userId,
    description: `Requested data export: ${input.dataTypes.join(', ')}`,
  })

  return {
    id: data.id as string,
    userId: data.user_id as string,
    dataTypes: data.data_types as DataExport['dataTypes'],
    format: data.format as DataExport['format'],
    status: data.status as DataExport['status'],
    progress: (data.progress as number) || undefined,
    downloadUrl: (data.download_url as string) || undefined,
    expiresAt: (data.expires_at as string) || undefined,
    fileSize: (data.file_size as number) || undefined,
    requestedAt: data.requested_at as string,
    completedAt: (data.completed_at as string) || undefined,
  }
}

/**
 * Gets data export status
 */
export async function getDataExportStatus(
  exportId: string,
  userId: string
): Promise<DataExport | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('data_exports')
    .select('*')
    .eq('id', exportId)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching export:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    dataTypes: data.data_types as DataExport['dataTypes'],
    format: data.format as DataExport['format'],
    status: data.status as DataExport['status'],
    progress: (data.progress as number) || undefined,
    downloadUrl: (data.download_url as string) || undefined,
    expiresAt: (data.expires_at as string) || undefined,
    fileSize: (data.file_size as number) || undefined,
    requestedAt: data.requested_at as string,
    completedAt: (data.completed_at as string) || undefined,
  }
}

/**
 * Gets all user data exports
 */
export async function getUserDataExports(
  userId: string
): Promise<DataExport[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('data_exports')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })

  if (error) {
    console.error('Error fetching exports:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id as string,
    userId: data.user_id as string,
    dataTypes: data.data_types as DataExport['dataTypes'],
    format: data.format as DataExport['format'],
    status: data.status as DataExport['status'],
    progress: (data.progress as number) || undefined,
    downloadUrl: (data.download_url as string) || undefined,
    expiresAt: (data.expires_at as string) || undefined,
    fileSize: (data.file_size as number) || undefined,
    requestedAt: data.requested_at as string,
    completedAt: (data.completed_at as string) || undefined,
  }))
}

/**
 * Creates a data deletion request
 */
export async function createDeletionRequest(
  userId: string,
  input: CreateDeletionRequestInput
): Promise<DataDeletionRequest> {
  const validationResult = createDeletionRequestSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid deletion request: ${validationResult.error}`)
  }

  const supabase = createClient()

  // Check for existing pending request
  const { data: existing } = await supabase
    .from('data_deletion_requests')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .single()

  if (existing) {
    throw new Error('You already have a pending deletion request')
  }

  const requestId = `deletion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase()
  const scheduledDate = new Date()
  scheduledDate.setDate(scheduledDate.getDate() + 30) // 30 days notice

  const { data, error } = await supabase
    .from('data_deletion_requests')
    .insert({
      id: requestId,
      user_id: userId,
      reason: input.reason || null,
      confirmation_code: confirmationCode,
      data_types: input.dataTypes,
      retain_data: input.retainData || null,
      status: 'pending',
      scheduled_at: scheduledDate.toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating deletion request:', error)
    throw new Error(`Failed to create request: ${error.message}`)
  }

  // Log audit
  await logPrivacyAction({
    action: 'delete',
    targetType: 'data',
    userId,
    description: `Requested data deletion: ${input.dataTypes.join(', ')}`,
  })

  return {
    id: data.id as string,
    userId: data.user_id as string,
    reason: (data.reason as string) || undefined,
    confirmationCode: data.confirmation_code as string,
    dataTypes: data.data_types as DataDeletionRequest['dataTypes'],
    retainData: (data.retain_data as string[]) || undefined,
    status: data.status as DataDeletionRequest['status'],
    scheduledAt: data.scheduled_at as string,
    completedAt: (data.completed_at as string) || undefined,
    verifiedAt: (data.verified_at as string) || undefined,
    verifiedBy: (data.verified_by as string) || undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Cancels a deletion request
 */
export async function cancelDeletionRequest(
  requestId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('data_deletion_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('user_id', userId)
    .eq('status', 'pending')

  if (error) {
    console.error('Error cancelling request:', error)
    throw new Error(`Failed to cancel: ${error.message}`)
  }
}

/**
 * Gets deletion request status
 */
export async function getDeletionRequestStatus(
  requestId: string,
  userId: string
): Promise<DataDeletionRequest | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('data_deletion_requests')
    .select('*')
    .eq('id', requestId)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching request:', error)
    return null
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    reason: (data.reason as string) || undefined,
    confirmationCode: data.confirmation_code as string,
    dataTypes: data.data_types as DataDeletionRequest['dataTypes'],
    retainData: (data.retain_data as string[]) || undefined,
    status: data.status as DataDeletionRequest['status'],
    scheduledAt: data.scheduled_at as string,
    completedAt: (data.completed_at as string) || undefined,
    verifiedAt: (data.verified_at as string) || undefined,
    verifiedBy: (data.verified_by as string) || undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Records consent
 */
export async function recordConsent(
  userId: string | undefined,
  input: {
    consentType: string
    consentVersion: string
    granted: boolean
    scope?: string[]
    purpose?: string
    ipAddress?: string
    userAgent?: string
  }
): Promise<ConsentRecord> {
  const validationResult = consentSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid consent: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('consent_records')
    .insert({
      id: consentId,
      consent_type: input.consentType,
      consent_version: input.consentVersion,
      user_id: userId || null,
      granted: input.granted,
      revoked_at: input.granted ? null : new Date().toISOString(),
      source: 'web',
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
      scope: input.scope || null,
      purpose: input.purpose || null,
      granted_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error recording consent:', error)
    throw new Error(`Failed to record consent: ${error.message}`)
  }

  return {
    id: data.id as string,
    consentType: data.consent_type as string,
    consentVersion: data.consent_version as string,
    userId: (data.user_id as string) || undefined,
    anonymousId: (data.anonymous_id as string) || undefined,
    granted: data.granted as boolean,
    revokedAt: (data.revoked_at as string) || undefined,
    source: data.source as "web" | "mobile" | "api" | "import",
    ipAddress: (data.ip_address as string) || undefined,
    userAgent: (data.user_agent as string) || undefined,
    scope: (data.scope as string[]) || undefined,
    purpose: (data.purpose as string) || undefined,
    grantedAt: data.granted_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Gets consent records for user
 */
export async function getUserConsents(
  userId: string
): Promise<ConsentRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('consent_records')
    .select('*')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false })

  if (error) {
    console.error('Error fetching consents:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id as string,
    consentType: data.consent_type as string,
    consentVersion: data.consent_version as string,
    userId: (data.user_id as string) || undefined,
    anonymousId: (data.anonymous_id as string) || undefined,
    granted: data.granted as boolean,
    revokedAt: (data.revoked_at as string) || undefined,
    source: data.source as "web" | "mobile" | "api" | "import",
    ipAddress: (data.ip_address as string) || undefined,
    userAgent: (data.user_agent as string) || undefined,
    scope: (data.scope as string[]) || undefined,
    purpose: (data.purpose as string) || undefined,
    grantedAt: data.granted_at as string,
    updatedAt: data.updated_at as string,
  }))
}

/**
 * Checks if user has given consent
 */
export async function hasConsent(
  userId: string | undefined,
  consentType: string
): Promise<boolean> {
  const supabase = createClient()

  let query = supabase
    .from('consent_records')
    .select('*')
    .eq('consent_type', consentType)
    .eq('granted', true)
    .is('revoked_at', null)
    .order('granted_at', { ascending: false })
    .limit(1)

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.is('user_id', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error checking consent:', error)
    return false
  }

  return (data || []).length > 0
}

/**
 * Gets privacy audit log
 */
export async function getPrivacyAuditLog(
  options?: {
    userId?: string
    action?: PrivacyAuditLog['action']
    targetType?: PrivacyAuditLog['targetType']
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<PrivacyAuditLog[]> {
  const supabase = createClient()

  let query = supabase
    .from('privacy_audit_log')
    .select('*')
    .order('timestamp', { ascending: false })

  if (options?.userId) {
    query = query.eq('user_id', options.userId)
  }

  if (options?.action) {
    query = query.eq('action', options.action)
  }

  if (options?.targetType) {
    query = query.eq('target_type', options.targetType)
  }

  if (options?.startDate) {
    query = query.gte('timestamp', options.startDate)
  }

  if (options?.endDate) {
    query = query.lte('timestamp', options.endDate)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching audit log:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id as string,
    action: data.action as PrivacyAuditLog['action'],
    targetType: data.target_type as PrivacyAuditLog['targetType'],
    targetId: (data.target_id as string) || undefined,
    userId: (data.user_id as string) || undefined,
    actorId: (data.actor_id as string) || undefined,
    ipAddress: (data.ip_address as string) || undefined,
    userAgent: (data.user_agent as string) || undefined,
    location: (data.location as string) || undefined,
    description: data.description as string,
    changes: (data.changes as Record<string, unknown>) || undefined,
    timestamp: data.timestamp as string,
  }))
}

/**
 * Gets data summary for user
 */
export async function getDataSummary(
  userId: string
): Promise<{
  profileData: boolean
  alertCount: number
  reportCount: number
  locationPoints: number
  communicationCount: number
  emergencyContacts: number
  oldestData: string
  newestData: string
}> {
  const supabase = createClient()

  // Get counts
  const [
    alertsResult,
    reportsResult,
    locationsResult,
    communicationsResult,
    contactsResult,
  ] = await Promise.all([
    supabase.from('user_alerts').select('created_at', { count: 'exact' }).eq('user_id', userId),
    supabase.from('community_reports').select('created_at', { count: 'exact' }).eq('reporter_id', userId),
    supabase.from('location_history').select('created_at', { count: 'exact' }).eq('user_id', userId),
    supabase.from('communications').select('created_at', { count: 'exact' }).eq('user_id', userId),
    supabase.from('emergency_contacts').select('id', { count: 'exact' }).eq('user_id', userId),
  ])

  // Get oldest and newest dates
  const oldestAlert = alertsResult.data?.[0]
  const newestAlert = alertsResult.data?.[alertsResult.data.length as number - 1]

  return {
    profileData: true, // Profile always exists for registered users
    alertCount: alertsResult.count || 0,
    reportCount: reportsResult.count || 0,
    locationPoints: locationsResult.count || 0,
    communicationCount: communicationsResult.count || 0,
    emergencyContacts: contactsResult.count || 0,
    oldestData: ((oldestAlert as any)?.created_at as string) || '',
    newestData: ((newestAlert as any)?.created_at as string) || '',
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Logs privacy action to audit log
 */
async function logPrivacyAction(
  action: {
    action: PrivacyAuditLog['action']
    targetType: PrivacyAuditLog['targetType']
    userId?: string
    actorId?: string
    description: string
    changes?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
    location?: string
  }
): Promise<void> {
  const supabase = createClient()

  /* eslint-enable @typescript-eslint/no-unused-vars */
  const { error } = await supabase
    .from('privacy_audit_log')
    .insert({
      action: action.action,
      target_type: action.targetType,
      user_id: action.userId,
      actor_id: action.actorId,
      description: action.description,
      changes: action.changes || null,
      ip_address: action.ipAddress || null,
      user_agent: action.userAgent || null,
      location: action.location || null,
      timestamp: new Date().toISOString(),
    })

  if (error) {
    console.error('Failed to log privacy action:', error)
  }
}

/**
 * Maps database record to PrivacySetting
 */
function mapSettingFromDB(data: Record<string, unknown>): PrivacySetting {
  return {
    id: data.id as string,
    userId: data.user_id as string | undefined,
    settingType: data.setting_type as PrivacySettingType,
    value: data.value as number,
    visibilityLevel: data.visibility_level as VisibilityLevel | undefined,
    allowedRoles: data.allowed_roles as string[] | undefined,
    allowedUserIds: data.allowed_user_ids as string[] | undefined,
    expiresAt: data.expires_at as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Deletes all user data (for account deletion)
 */
export async function deleteAllUserData(
  userId: string,
  retainData: string[] = []
): Promise<void> {
  const supabase = createClient()

  const tablesToDelete = [
    { name: 'user_alerts', condition: 'user_id', retain: retainData.includes('alerts') },
    { name: 'community_reports', condition: 'reporter_id', retain: retainData.includes('reports') },
    { name: 'location_history', condition: 'user_id', retain: retainData.includes('location_history') },
    { name: 'communications', condition: 'user_id', retain: retainData.includes('communications') },
    { name: 'user_preferences', condition: 'user_id', retain: retainData.includes('preferences') },
    { name: 'privacy_settings', condition: 'user_id', retain: retainData.includes('preferences') },
    { name: 'notification_preferences', condition: 'user_id', retain: retainData.includes('preferences') },
    { name: 'accessibility_settings', condition: 'user_id', retain: retainData.includes('preferences') },
    { name: 'consent_records', condition: 'user_id', retain: retainData.includes('all') },
  ]

  for (const table of tablesToDelete) {
    if (!table.retain) {
      const { error } = await supabase
        .from(table.name)
        .delete()
        .eq(table.condition, userId)

      if (error) {
        console.error(`Error deleting from ${table.name}:`, error)
      }
    }
  }

  // Log final deletion
  await logPrivacyAction({
    action: 'delete',
    targetType: 'data',
    userId,
    description: 'Completed data deletion',
  })
}
