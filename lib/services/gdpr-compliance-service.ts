import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * GDPR data subject request type
 */
export type GDPRRequestType =
  | 'access'
  | 'rectification'
  | 'erasure'
  | 'restriction'
  | 'portability'
  | 'objection'

/**
 * GDPR request status
 */
export type GDPRRequestStatus =
  | 'pending'
  | 'identity_verified'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'appealed'

/**
 * Data category for GDPR
 */
export type GDPRDataCategory =
  | 'profile'
  | 'location_history'
  | 'alerts'
  | 'reports'
  | 'communications'
  | 'preferences'
  | 'analytics'
  | 'emergency_contacts'
  | 'financial'
  | 'health'
  | 'biometric'

/**
 * GDPR data subject request
 */
export interface GDPRDataSubjectRequest {
  id: string
  
  // Request info
  requestType: GDPRRequestType
  referenceNumber: string
  
  // User
  userId?: string
  email: string
  fullName?: string
  
  // Request details
  dataCategories: GDPRDataCategory[]
  description?: string
  
  // Status
  status: GDPRRequestStatus
  priority: 'normal' | 'high' | 'urgent'
  
  // Verification
  identityVerified: boolean
  verifiedAt?: string
  verifiedBy?: string
  
  // Processing
  assignedTo?: string
  startedAt?: string
  completedAt?: string
  
  // Result
  result?: {
    data?: Record<string, unknown>
    message?: string
    fileUrl?: string
  }
  
  // Appeals
  appeals?: Array<{
    reason: string
    submittedAt: string
    reviewedBy?: string
    resolvedAt?: string
    outcome: 'upheld' | 'overturned'
  }>
  
  // Legal
  legalDeadline: string
  extended: boolean
  extensionReason?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Consent preference
 */
export interface ConsentPreference {
  id: string
  
  // Consent type
  consentType: string
  version: string
  
  // User
  userId?: string
  anonymousId?: string
  
  // Preferences
  granted: boolean
  grantedAt?: string
  revokedAt?: string
  
  // Granular consents
  granularConsents?: Record<string, boolean>
  
  // Purpose
  purpose?: string
  legalBasis?: string
  
  // Retention
  retentionPeriod?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Data processing activity
 */
export interface DataProcessingActivity {
  id: string
  
  // Activity info
  name: string
  description: string
  purpose: string
  
  // Data categories
  dataCategories: GDPRDataCategory[]
  
  // Data subjects
  dataSubjects: Array<'users' | 'employees' | 'contractors' | 'public'>
  
  // Legal basis
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests'
  legalBasisDetails?: string
  
  // Recipients
  recipients?: string[]
  thirdPartyTransfers?: string[]
  
  // Retention
  retentionPeriod: string
  retentionPolicy?: string
  
  // Security
  securityMeasures?: string[]
  
  // DPO
  dpoContact?: string
  
  // Status
  isActive: boolean
  lastReviewDate?: string
  nextReviewDate?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Data breach incident
 */
export interface DataBreachIncident {
  id: string
  
  // Incident info
  incidentType: 'unauthorized_access' | 'data_loss' | 'data_theft' | 'accidental_disclosure' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  // Discovery
  discoveredAt: string
  discoveredBy?: string
  
  // Description
  description: string
  affectedSystems?: string[]
  
  // Impact
  affectedDataCategories: GDPRDataCategory[]
  estimatedAffectedRecords?: number
  
  // Assessment
  riskAssessment?: {
    likelihood: 'unlikely' | 'possible' | 'likely' | 'highly_likely'
    impact: 'minimal' | 'minor' | 'significant' | 'severe'
    overallRisk: 'low' | 'medium' | 'high'
  }
  
  // Notification
  authorityNotified: boolean
  authorityNotifiedAt?: string
  authorityReference?: string
  individualsNotified: boolean
  individualsNotifiedAt?: string
  
  // Remediation
  containmentActions?: string[]
  remediationActions?: string[]
  
  // Status
  status: 'detected' | 'investigating' | 'contained' | 'resolved' | 'closed'
  resolvedAt?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Data protection impact assessment
 */
export interface DPIA {
  id: string
  
  // Assessment info
  name: string
  description: string
  project?: string
  
  // Dates
  assessmentDate: string
  reviewDate?: string
  
  // Data processing
  dataCategories: GDPRDataCategory[]
  processingMethods?: string[]
  recipients?: string[]
  
  // Necessity
  necessityJustification: string
  alternativesConsidered?: string[]
  
  // Risks
  risks: Array<{
    description: string
    likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'almost_certain'
    impact: 'minimal' | 'minor' | 'moderate' | 'major' | 'severe'
    riskLevel: 'low' | 'medium' | 'high'
    mitigation?: string
    residualRisk: 'low' | 'medium' | 'high'
  }>
  
  // Consultation
  dpoConsulted: boolean
  dpoComments?: string
  stakeholdersConsulted?: string[]
  
  // Outcome
  outcome: 'low_risk_proceed' | 'risk_mitigated' | 'high_risk_consult_authority' | 'stop_processing'
  approvalRequired?: string
  approvedBy?: string
  approvedAt?: string
  
  // Status
  isCompleted: boolean
  nextReviewDate?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Create GDPR request input
 */
export interface CreateGDPRRequestInput {
  requestType: GDPRRequestType
  email: string
  fullName?: string
  dataCategories: GDPRDataCategory[]
  description?: string
  priority?: 'normal' | 'high' | 'urgent'
}

/**
 * Process GDPR request input
 */
export interface ProcessGDPRRequestInput {
  status: GDPRRequestStatus
  result?: {
    data?: Record<string, unknown>
    message?: string
    fileUrl?: string
  }
  extendDeadline?: boolean
  extensionReason?: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating GDPR request
 */
export const createGDPRRequestSchema = z.object({
  requestType: z.enum([
    'access',
    'rectification',
    'erasure',
    'restriction',
    'portability',
    'objection',
  ]),
  email: z.string().email(),
  fullName: z.string().min(1).max(200).optional(),
  dataCategories: z.array(z.enum([
    'profile',
    'location_history',
    'alerts',
    'reports',
    'communications',
    'preferences',
    'analytics',
    'emergency_contacts',
    'financial',
    'health',
    'biometric',
  ])).min(1),
  description: z.string().max(2000).optional(),
  priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
})

/**
 * Schema for consent update
 */
export const updateConsentSchema = z.object({
  consentType: z.string().min(1),
  version: z.string().min(1),
  granted: z.boolean(),
  granularConsents: z.record(z.boolean()).optional(),
  purpose: z.string().optional(),
  legalBasis: z.string().optional(),
  retentionPeriod: z.string().optional(),
})

/**
 * Schema for breach incident
 */
export const createBreachIncidentSchema = z.object({
  incidentType: z.enum([
    'unauthorized_access',
    'data_loss',
    'data_theft',
    'accidental_disclosure',
    'other',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  discoveredAt: z.string().datetime(),
  description: z.string().min(50),
  affectedSystems: z.array(z.string()).optional(),
  affectedDataCategories: z.array(z.enum([
    'profile',
    'location_history',
    'alerts',
    'reports',
    'communications',
    'preferences',
    'analytics',
    'emergency_contacts',
    'financial',
    'health',
    'biometric',
  ])).min(1),
  estimatedAffectedRecords: z.number().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for GDPR request type
 */
export function getGDPRRequestTypeDisplayName(type: GDPRRequestType): string {
  const names: Record<GDPRRequestType, string> = {
    access: 'Right of Access',
    rectification: 'Right to Rectification',
    erasure: 'Right to Erasure',
    restriction: 'Right to Restriction',
    portability: 'Right to Portability',
    objection: 'Right to Object',
  }
  return names[type]
}

/**
 * Gets legal deadline in days
 */
export function getLegalDeadlineDays(requestType: GDPRRequestType): number {
  const deadlines: Record<GDPRRequestType, number> = {
    access: 30,
    rectification: 30,
    erasure: 30,
    restriction: 30,
    portability: 30,
    objection: 30,
  }
  return deadlines[requestType]
}

/**
 * Gets display name for data category
 */
export function getDataCategoryDisplayName(category: GDPRDataCategory): string {
  const names: Record<GDPRDataCategory, string> = {
    profile: 'Profile Data',
    location_history: 'Location History',
    alerts: 'Alerts Data',
    reports: 'Reports Data',
    communications: 'Communications',
    preferences: 'Preferences',
    analytics: 'Analytics Data',
    emergency_contacts: 'Emergency Contacts',
    financial: 'Financial Data',
    health: 'Health Data',
    biometric: 'Biometric Data',
  }
  return names[category]
}

/**
 * Calculates legal deadline date
 */
export function calculateLegalDeadline(
  requestType: GDPRRequestType,
  fromDate?: Date
): Date {
  const days = getLegalDeadlineDays(requestType)
  const baseDate = fromDate || new Date()
  const deadline = new Date(baseDate)
  deadline.setDate(deadline.getDate() + days)
  return deadline
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a GDPR data subject request
 */
export async function createGDPRRequest(
  input: CreateGDPRRequestInput
): Promise<GDPRDataSubjectRequest> {
  const validationResult = createGDPRRequestSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid request: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Generate reference number
  const referenceNumber = `GDPR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  // Calculate deadline
  const legalDeadline = calculateLegalDeadline(input.requestType)

  const requestId = `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('gdpr_requests')
    .insert({
      id: requestId,
      request_type: input.requestType,
      reference_number: referenceNumber,
      email: input.email,
      full_name: input.fullName || null,
      data_categories: input.dataCategories,
      description: input.description || null,
      status: 'pending',
      priority: input.priority || 'normal',
      identity_verified: false,
      legal_deadline: legalDeadline.toISOString(),
      extended: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating GDPR request:', error)
    throw new Error(`Failed to create request: ${error.message}`)
  }

  return mapRequestFromDB(data)
}

/**
 * Gets a GDPR request by ID
 */
export async function getGDPRRequest(
  requestId: string
): Promise<GDPRDataSubjectRequest | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('gdpr_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (error) {
    console.error('Error fetching request:', error)
    return null
  }

  return mapRequestFromDB(data)
}

/**
 * Gets a GDPR request by reference number
 */
export async function getGDPRRequestByReference(
  referenceNumber: string
): Promise<GDPRDataSubjectRequest | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('gdpr_requests')
    .select('*')
    .eq('reference_number', referenceNumber)
    .single()

  if (error) {
    console.error('Error fetching request:', error)
    return null
  }

  return mapRequestFromDB(data)
}

/**
 * Gets GDPR requests by email
 */
export async function getGDPRRequestsByEmail(
  email: string
): Promise<GDPRDataSubjectRequest[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('gdpr_requests')
    .select('*')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching requests:', error)
    return []
  }

  return (data || []).map(mapRequestFromDB)
}

/**
 * Verifies identity for GDPR request
 */
export async function verifyGDPRRequestIdentity(
  requestId: string,
  verifiedBy: string
): Promise<GDPRDataSubjectRequest> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('gdpr_requests')
    .update({
      identity_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
      status: 'identity_verified',
    })
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) {
    console.error('Error verifying identity:', error)
    throw new Error(`Failed to verify: ${error.message}`)
  }

  return mapRequestFromDB(data)
}

/**
 * Processes a GDPR request
 */
export async function processGDPRRequest(
  requestId: string,
  processorId: string,
  input: ProcessGDPRRequestInput
): Promise<GDPRDataSubjectRequest> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status: input.status,
    assigned_to: processorId,
    updated_at: new Date().toISOString(),
  }

  if (input.status === 'processing') {
    updateData.started_at = new Date().toISOString()
  }

  if (['completed', 'rejected'].includes(input.status)) {
    updateData.completed_at = new Date().toISOString()
    if (input.result) {
      updateData.result = input.result
    }
  }

  if (input.extendDeadline) {
    updateData.extended = true
    if (input.extensionReason) {
      updateData.extension_reason = input.extensionReason
    }
    // Extend by another 30 days
    const newDeadline = new Date()
    newDeadline.setDate(newDeadline.getDate() + 30)
    updateData.legal_deadline = newDeadline.toISOString()
  }

  const { data, error } = await supabase
    .from('gdpr_requests')
    .update(updateData)
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) {
    console.error('Error processing request:', error)
    throw new Error(`Failed to process: ${error.message}`)
  }

  return mapRequestFromDB(data)
}

/**
 * Submits appeal for GDPR request
 */
export async function submitGDPRAppeal(
  requestId: string,
  reason: string
): Promise<GDPRDataSubjectRequest> {
  const supabase = createClient()

  // Get current request
  const { data: current } = await supabase
    .from('gdpr_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!current) {
    throw new Error('Request not found')
  }

  const appeals = current.appeals || []
  appeals.push({
    reason,
    submittedAt: new Date().toISOString(),
  })

  const { data, error } = await supabase
    .from('gdpr_requests')
    .update({
      status: 'appealed',
      appeals,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) {
    console.error('Error submitting appeal:', error)
    throw new Error(`Failed to submit appeal: ${error.message}`)
  }

  return mapRequestFromDB(data)
}

/**
 * Gets all pending GDPR requests
 */
export async function getPendingGDPRRequests(
  options?: {
    priority?: GDPRDataSubjectRequest['priority']
    overdue?: boolean
    limit?: number
  }
): Promise<GDPRDataSubjectRequest[]> {
  const supabase = createClient()

  let query = supabase
    .from('gdpr_requests')
    .select('*')
    .in('status', ['pending', 'identity_verified', 'processing'])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (options?.priority) {
    query = query.eq('priority', options.priority)
  }

  if (options?.overdue) {
    query = query.lt('legal_deadline', new Date().toISOString())
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching requests:', error)
    return []
  }

  return (data || []).map(mapRequestFromDB)
}

/**
 * Updates consent preference
 */
export async function updateConsentPreference(
  userId: string | undefined,
  input: {
    consentType: string
    version: string
    granted: boolean
    granularConsents?: Record<string, boolean>
    purpose?: string
    legalBasis?: string
    retentionPeriod?: string
  }
): Promise<ConsentPreference> {
  const supabase = createClient()

  // Check existing
  const { data: existing } = await supabase
    .from('consent_preferences')
    .select('*')
    .eq('consent_type', input.consentType)
    .eq('user_id', userId || null)
    .single()

  const updateData: Record<string, unknown> = {
    granted: input.granted,
    updated_at: new Date().toISOString(),
  }

  if (input.granted) {
    updateData.granted_at = new Date().toISOString()
    updateData.revoked_at = null
  } else {
    updateData.revoked_at = new Date().toISOString()
  }

  if (input.granularConsents) {
    updateData.granular_consents = input.granularConsents
  }

  if (input.purpose) {
    updateData.purpose = input.purpose
  }

  if (input.legalBasis) {
    updateData.legal_basis = input.legalBasis
  }

  if (input.retentionPeriod) {
    updateData.retention_period = input.retentionPeriod
  }

  let data
  if (existing) {
    const { data: updated, error } = await supabase
      .from('consent_preferences')
      .update(updateData)
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating consent:', error)
      throw new Error(`Failed to update: ${error.message}`)
    }

    data = updated
  } else {
    const { data: created, error } = await supabase
      .from('consent_preferences')
      .insert({
        user_id: userId || null,
        consent_type: input.consentType,
        version: input.version,
        ...updateData,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating consent:', error)
      throw new Error(`Failed to create: ${error.message}`)
    }

    data = created
  }

  return {
    id: data.id as string,
    consentType: data.consent_type as string,
    version: data.version,
    userId: data.user_id as string || undefined,
    granted: data.granted,
    grantedAt: data.granted_at as string || undefined,
    revokedAt: data.revoked_at as string || undefined,
    granularConsents: data.granular_consents || undefined,
    purpose: data.purpose || undefined,
    legalBasis: data.legal_basis || undefined,
    retentionPeriod: data.retention_period || undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Gets user consent preferences
 */
export async function getUserConsentPreferences(
  userId: string
): Promise<ConsentPreference[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('consent_preferences')
    .select('*')
    .eq('user_id', userId)
    .order('consent_type')

  if (error) {
    console.error('Error fetching consents:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id as string,
    consentType: data.consent_type as string,
    version: data.version,
    userId: data.user_id as string || undefined,
    granted: data.granted,
    grantedAt: data.granted_at as string || undefined,
    revokedAt: data.revoked_at as string || undefined,
    granularConsents: data.granular_consents || undefined,
    purpose: data.purpose || undefined,
    legalBasis: data.legal_basis || undefined,
    retentionPeriod: data.retention_period || undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }))
}

/**
 * Creates a data breach incident
 */
export async function createDataBreachIncident(
  input: {
    incidentType: DataBreachIncident['incidentType']
    severity: DataBreachIncident['severity']
    discoveredAt: string
    description: string
    affectedSystems?: string[]
    affectedDataCategories: GDPRDataCategory[]
    estimatedAffectedRecords?: number
  },
  discoveredBy?: string
): Promise<DataBreachIncident> {
  const validationResult = createBreachIncidentSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid incident: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const incidentId = `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('data_breach_incidents')
    .insert({
      id: incidentId,
      incident_type: input.incidentType,
      severity: input.severity,
      discovered_at: input.discoveredAt,
      discovered_by: discoveredBy || null,
      description: input.description,
      affected_systems: input.affectedSystems || null,
      affected_data_categories: input.affectedDataCategories,
      estimated_affected_records: input.estimatedAffectedRecords || null,
      authority_notified: false,
      individuals_notified: false,
      status: 'detected',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating incident:', error)
    throw new Error(`Failed to create incident: ${error.message}`)
  }

  return {
    id: data.id as string,
    incidentType: data.incident_type as string,
    severity: data.severity as number,
    discoveredAt: data.discovered_at as string,
    discoveredBy: data.discovered_by || undefined,
    description: data.description as string,
    affectedSystems: data.affected_systems || undefined,
    affectedDataCategories: data.affected_data_categories as any[],
    estimatedAffectedRecords: data.estimated_affected_records || undefined,
    authorityNotified: data.authority_notified,
    individualsNotified: data.individuals_notified,
    status: data.status as string,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Reports breach to authority
 */
export async function reportBreachToAuthority(
  incidentId: string,
  authorityReference?: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('data_breach_incidents')
    .update({
      authority_notified: true,
      authority_notified_at: new Date().toISOString(),
      authority_reference: authorityReference || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', incidentId)
}

/**
 * Gets data processing activities
 */
export async function getDataProcessingActivities(
  activeOnly: boolean = true
): Promise<DataProcessingActivity[]> {
  const supabase = createClient()

  let query = supabase
    .from('data_processing_activities')
    .select('*')
    .order('name')

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching activities:', error)
    return []
  }

  return (data || []).map(data => ({
    id: data.id as string,
    name: data.name as string,
    description: data.description as string,
    purpose: data.purpose,
    dataCategories: data.data_categories as any[],
    dataSubjects: data.data_subjects,
    legalBasis: data.legal_basis,
    legalBasisDetails: data.legal_basis_details || undefined,
    recipients: data.recipients || undefined,
    thirdPartyTransfers: data.third_party_transfers || undefined,
    retentionPeriod: data.retention_period,
    retentionPolicy: data.retention_policy || undefined,
    securityMeasures: data.security_measures || undefined,
    dpoContact: data.dpo_contact || undefined,
    isActive: data.is_active as boolean,
    lastReviewDate: data.last_review_date as string || undefined,
    nextReviewDate: data.next_review_date as string || undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }))
}

/**
 * Creates a DPIA
 */
export async function createDPIA(
  input: {
    name: string
    description: string
    project?: string
    dataCategories: GDPRDataCategory[]
    processingMethods?: string[]
    recipients?: string[]
    necessityJustification: string
    alternativesConsidered?: string[]
    risks: Array<{
      description: string
      likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'almost_certain'
      impact: 'minimal' | 'minor' | 'moderate' | 'major' | 'severe'
      riskLevel: 'low' | 'medium' | 'high'
      mitigation?: string
      residualRisk: 'low' | 'medium' | 'high'
    }>
    dpoConsulted: boolean
    dpoComments?: string
    stakeholdersConsulted?: string[]
  }
): Promise<DPIA> {
  const supabase = createClient()

  const dpiaId = `dpia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('dpia_assessments')
    .insert({
      id: dpiaId,
      name: input.name,
      description: input.description,
      project: input.project || null,
      assessment_date: new Date().toISOString(),
      data_categories: input.dataCategories,
      processing_methods: input.processingMethods || null,
      recipients: input.recipients || null,
      necessity_justification: input.necessityJustification,
      alternatives_considered: input.alternativesConsidered || null,
      risks: input.risks,
      dpo_consulted: input.dpoConsulted,
      dpo_comments: input.dpoComments || null,
      stakeholders_consulted: input.stakeholdersConsulted || null,
      outcome: 'low_risk_proceed',
      is_completed: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating DPIA:', error)
    throw new Error(`Failed to create DPIA: ${error.message}`)
  }

  return mapDPIAFromDB(data)
}

/**
 * Gets DPIAs
 */
export async function getDPIAs(
  completedOnly?: boolean
): Promise<DPIA[]> {
  const supabase = createClient()

  let query = supabase
    .from('dpia_assessments')
    .select('*')
    .order('assessment_date', { ascending: false })

  if (completedOnly !== undefined) {
    query = query.eq('is_completed', completedOnly)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching DPIAs:', error)
    return []
  }

  return (data || []).map(mapDPIAFromDB)
}

/**
 * Gets GDPR compliance summary
 */
export async function getGDPRComplianceSummary(): Promise<{
  pendingRequests: number
  overdueRequests: number
  averageResponseTime: number
  breachIncidents: number
  activeProcessingActivities: number
  pendingDPIAs: number
  consentCoverage: number
}> {
  const supabase = createClient()

  const now = new Date().toISOString()

  // Get pending requests
  const { count: pendingCount } = await supabase
    .from('gdpr_requests')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'identity_verified', 'processing'])

  // Get overdue requests
  const { count: overdueCount } = await supabase
    .from('gdpr_requests')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'identity_verified', 'processing'])
    .lt('legal_deadline', now)

  // Get breach incidents
  const { count: breachCount } = await supabase
    .from('data_breach_incidents')
    .select('*', { count: 'exact', head: true })
    .not('status', 'eq', 'closed')

  // Get active processing activities
  const { count: activityCount } = await supabase
    .from('data_processing_activities')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Get pending DPIAs
  const { count: dpiaCount } = await supabase
    .from('dpia_assessments')
    .select('*', { count: 'exact', head: true })
    .eq('is_completed', false)

  return {
    pendingRequests: pendingCount || 0,
    overdueRequests: overdueCount || 0,
    averageResponseTime: 0, // Would need more complex query
    breachIncidents: breachCount || 0,
    activeProcessingActivities: activityCount || 0,
    pendingDPIAs: dpiaCount || 0,
    consentCoverage: 0, // Would need calculation
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to GDPR request
 */
function mapRequestFromDB(data: Record<string, unknown>): GDPRDataSubjectRequest {
  return {
    id: data.id as string,
    requestType: data.request_type as GDPRRequestType,
    referenceNumber: data.reference_number,
    userId: data.user_id as string | undefined,
    email: data.email as string,
    fullName: data.full_name as string | undefined,
    dataCategories: data.data_categories as GDPRDataCategory[],
    description: data.description as string | undefined,
    status: data.status as GDPRRequestStatus,
    priority: data.priority as 'normal' | 'high' | 'urgent',
    identityVerified: data.identity_verified as boolean,
    verifiedAt: data.verified_at as string | undefined,
    verifiedBy: data.verified_by as string | undefined,
    assignedTo: data.assigned_to as string | undefined,
    startedAt: data.started_at as string | undefined,
    completedAt: data.completed_at as string | undefined,
    result: data.result as GDPRDataSubjectRequest['result'] | undefined,
    appeals: data.appeals as GDPRDataSubjectRequest['appeals'] | undefined,
    legalDeadline: data.legal_deadline,
    extended: data.extended,
    extensionReason: data.extension_reason as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to DPIA
 */
function mapDPIAFromDB(data: Record<string, unknown>): DPIA {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string,
    project: data.project as string | undefined,
    assessmentDate: data.assessment_date as string,
    reviewDate: data.review_date as string | undefined,
    dataCategories: data.data_categories as GDPRDataCategory[],
    processingMethods: data.processing_methods as string[] | undefined,
    recipients: data.recipients as string[] | undefined,
    necessityJustification: data.necessity_justification,
    alternativesConsidered: data.alternatives_considered as string[] | undefined,
    risks: data.risks as DPIA['risks'],
    dpoConsulted: data.dpo_consulted,
    dpoComments: data.dpo_comments as string | undefined,
    stakeholdersConsulted: data.stakeholders_consulted as string[] | undefined,
    outcome: data.outcome as DPIA['outcome'],
    approvalRequired: data.approval_required as string | undefined,
    approvedBy: data.approved_by as string | undefined,
    approvedAt: data.approved_at as string | undefined,
    isCompleted: data.is_completed as boolean,
    nextReviewDate: data.next_review_date as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Exports user data for GDPR access request
 */
export async function exportUserDataForAccessRequest(
  userId: string,
  dataCategories: GDPRDataCategory[]
): Promise<Record<string, unknown>> {
  const supabase = createClient()

  const exportData: Record<string, unknown> = {
    exportDate: new Date().toISOString(),
    referenceNumber: `ACCESS-${Date.now()}`,
    dataCategories: dataCategories,
    data: {},
  }

  // Fetch data for each category
  if (dataCategories.includes('profile')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    exportData.data.profile = profile || null
  }

  if (dataCategories.includes('location_history')) {
    const { data: locations } = await supabase
      .from('location_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    exportData.data.location_history = locations || []
  }

  if (dataCategories.includes('alerts')) {
    const { data: alerts } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    exportData.data.alerts = alerts || []
  }

  if (dataCategories.includes('preferences')) {
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    exportData.data.preferences = preferences || null
  }

  return exportData
}
