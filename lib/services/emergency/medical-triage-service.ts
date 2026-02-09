import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Medical emergency categories for triage
 */
export type MedicalEmergencyCategory =
  | 'cardiac'
  | 'respiratory'
  | 'neurological'
  | 'trauma'
  | 'poisoning'
  | 'environmental'
  | 'OBGYN'
  | 'psychiatric'
  | 'general'

/**
 * Triage priority levels (ESI-based)
 */
export type TriagePriority =
  | 'immediate'    // Level 1 - Life-threatening, immediate attention
  | 'urgent'        // Level 2 - Serious but stable
  | 'delayed'       // Level 3 - Non-urgent, can wait
  | 'minimal'       // Level 4 - Minor injuries
  | 'expectant'     // Level 5 - Deceased or unsalvageable

/**
 * Consciousness levels
 */
export type ConsciousnessLevel =
  | 'alert'
  | 'responsive_to_voice'
  | 'responsive_to_pain'
  | 'unresponsive'

/**
 * Breathing status
 */
export type BreathingStatus =
  | 'normal'
  | 'labored'
  | 'absent'
  | 'gasping'

/**
 * Pain scale (1-10)
 */
export type PainLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

/**
 * Input for medical triage assessment
 */
export interface MedicalTriageInput {
  userId: string
  emergencyId?: string
  chiefComplaint: string
  category: MedicalEmergencyCategory
  vitals?: {
    heartRate?: number
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    oxygenSaturation?: number
    respiratoryRate?: number
    temperature?: number
  }
  consciousness?: ConsciousnessLevel
  breathing?: BreathingStatus
  painLevel?: PainLevel
  isConscious: boolean
  isBreathing: boolean
  hasChestPain: boolean
  hasDifficultyBreathing: boolean
  isBleeding: boolean
  hasAllergies: boolean
  medications?: string
  medicalHistory?: string
  notes?: string
}

/**
 * Triage assessment result
 */
export interface TriageAssessment {
  priority: TriagePriority
  category: MedicalEmergencyCategory
  recommendedActions: string[]
  esiLevel: number  // Emergency Severity Index (1-5)
  estimatedWaitTime: string
  warnings: string[]
  dispatchRecommendations: string[]
}

/**
 * Full triage record (for display)
 */
export interface MedicalTriageRecord {
  id: string
  userId: string
  emergencyId?: string
  chiefComplaint: string
  category: MedicalEmergencyCategory
  vitals?: {
    heartRate?: number
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    oxygenSaturation?: number
    respiratoryRate?: number
    temperature?: number
  }
  consciousness: ConsciousnessLevel
  breathing: BreathingStatus
  painLevel?: PainLevel
  isConscious: boolean
  isBreathing: boolean
  hasChestPain: boolean
  hasDifficultyBreathing: boolean
  isBleeding: boolean
  hasAllergies: boolean
  medications?: string
  medicalHistory?: string
  notes?: string
  assessment: TriageAssessment
  triageCompleted: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for medical triage input
 */
export const medicalTriageInputSchema = z.object({
  userId: z.string().uuid(),
  emergencyId: z.string().uuid().optional(),
  chiefComplaint: z.string().min(10).max(500),
  category: z.enum([
    'cardiac',
    'respiratory',
    'neurological',
    'trauma',
    'poisoning',
    'environmental',
    'OBGYN',
    'psychiatric',
    'general'
  ]),
  vitals: z.object({
    heartRate: z.number().min(20).max(250).optional(),
    bloodPressureSystolic: z.number().min(60).max(250).optional(),
    bloodPressureDiastolic: z.number().min(30).max(150).optional(),
    oxygenSaturation: z.number().min(0).max(100).optional(),
    respiratoryRate: z.number().min(0).max(60).optional(),
    temperature: z.number().min(32).max(43).optional(),
  }).optional(),
  consciousness: z.enum([
    'alert',
    'responsive_to_voice',
    'responsive_to_pain',
    'unresponsive'
  ]).default('alert'),
  breathing: z.enum([
    'normal',
    'labored',
    'absent',
    'gasping'
  ]).default('normal'),
  painLevel: z.number().min(1).max(10).optional(),
  isConscious: z.boolean(),
  isBreathing: z.boolean(),
  hasChestPain: z.boolean(),
  hasDifficultyBreathing: z.boolean(),
  isBleeding: z.boolean(),
  hasAllergies: z.boolean(),
  medications: z.string().max(1000).optional(),
  medicalHistory: z.string().max(2000).optional(),
  notes: z.string().max(1000).optional(),
})

// ============================================================================
// Triage Logic
// ============================================================================

/**
 * Determines triage priority based on vital signs and symptoms
 */
export function assessTriagePriority(input: MedicalTriageInput): TriageAssessment {
  let esiLevel = 3 // Default to Level 3 (urgent)
  const warnings: string[] = []
  const recommendedActions: string[] = []
  const dispatchRecommendations: string[] = []

  // Immediate life threats (ESI Level 1)
  if (!input.isConscious || !input.isBreathing || input.breathing === 'absent' || input.breathing === 'gasping') {
    esiLevel = 1
    warnings.push('CRITICAL: Patient not conscious or not breathing')
    recommendedActions.push('Call 112 immediately')
    recommendedActions.push('Begin CPR if trained')
    recommendedActions.push('Prepare for potential AED use')
    dispatchRecommendations.push('ALS (Advanced Life Support) required')
    dispatchRecommendations.push('Paramedics and EMTs')
  }
  
  // Cardiac symptoms (ESI Level 1-2)
  if (input.hasChestPain) {
    if (input.vitals?.heartRate && (input.vitals.heartRate > 120 || input.vitals.heartRate < 40)) {
      esiLevel = Math.min(esiLevel, 1)
      warnings.push('CRITICAL: Chest pain with abnormal heart rate')
    } else {
      esiLevel = Math.min(esiLevel, 2)
      warnings.push('Chest pain detected')
    }
    recommendedActions.push('Keep patient calm and still')
    recommendedActions.push('Administer aspirin if available and not contraindicated')
    recommendedActions.push('Monitor vitals continuously')
    dispatchRecommendations.push('Cardiac-equipped ambulance')
  }

  // Breathing difficulties (ESI Level 1-2)
  if (input.hasDifficultyBreathing || input.breathing === 'labored') {
    if (input.vitals?.oxygenSaturation && input.vitals.oxygenSaturation < 90) {
      esiLevel = Math.min(esiLevel, 1)
      warnings.push('CRITICAL: Low oxygen saturation')
    } else if (input.vitals?.oxygenSaturation && input.vitals.oxygenSaturation < 95) {
      esiLevel = Math.min(esiLevel, 2)
      warnings.push('Low oxygen saturation')
    } else {
      esiLevel = Math.min(esiLevel, 2)
    }
    recommendedActions.push('Position patient comfortably (semi-Fowler if breathing difficulty)')
    recommendedActions.push('Administer oxygen if available')
    dispatchRecommendations.push('Respiratory support required')
  }

  // High pain level (ESI Level 2-3)
  if (input.painLevel && input.painLevel >= 8) {
    esiLevel = Math.min(esiLevel, 2)
    warnings.push(`High pain level: ${input.painLevel}/10`)
    recommendedActions.push('Assess pain location and characteristics')
    recommendedActions.push('Do not administer medication without professional guidance')
  }

  // Abnormal vitals
  if (input.vitals) {
    if (input.vitals.heartRate && (input.vitals.heartRate > 130 || input.vitals.heartRate < 30)) {
      esiLevel = Math.min(esiLevel, 2)
      warnings.push(`Abnormal heart rate: ${input.vitals.heartRate} bpm`)
    }
    if (input.vitals.bloodPressureSystolic && (input.vitals.bloodPressureSystolic > 180 || input.vitals.bloodPressureSystolic < 70)) {
      esiLevel = Math.min(esiLevel, 2)
      warnings.push(`Abnormal blood pressure: ${input.vitals.bloodPressureSystolic}/${input.vitals.bloodPressureDiastolic} mmHg`)
    }
    if (input.vitals.oxygenSaturation && input.vitals.oxygenSaturation < 94) {
      esiLevel = Math.min(esiLevel, 2)
      warnings.push(`Low oxygen saturation: ${input.vitals.oxygenSaturation}%`)
    }
    if (input.vitals.respiratoryRate && (input.vitals.respiratoryRate > 30 || input.vitals.respiratoryRate < 8)) {
      esiLevel = Math.min(esiLevel, 2)
      warnings.push(`Abnormal respiratory rate: ${input.vitals.respiratoryRate}/min`)
    }
    if (input.vitals.temperature && (input.vitals.temperature > 39 || input.vitals.temperature < 35)) {
      esiLevel = Math.min(esiLevel, 2)
      warnings.push(`Abnormal temperature: ${input.vitals.temperature}°C`)
    }
  }

  // Bleeding (ESI Level 2-3)
  if (input.isBleeding) {
    esiLevel = Math.min(esiLevel, 2)
    warnings.push('Active bleeding')
    recommendedActions.push('Apply direct pressure to wound')
    recommendedActions.push('Elevate injured area if possible')
    recommendedActions.push('Do not remove embedded objects')
  }

  // Neurological symptoms (ESI Level 2)
  if (input.category === 'neurological') {
    esiLevel = Math.min(esiLevel, 2)
    warnings.push('Neurological symptoms')
    recommendedActions.push('Check for FAST signs (Face, Arms, Speech, Time)')
    recommendedActions.push('Monitor level of consciousness')
    dispatchRecommendations.push('Neurological assessment required')
  }

  // Trauma (ESI Level 2-3)
  if (input.category === 'trauma') {
    if (input.consciousness !== 'alert') {
      esiLevel = Math.min(esiLevel, 2)
      warnings.push('Altered consciousness with trauma')
    }
    dispatchRecommendations.push('Trauma team activation if severe')
  }

  // Poisoning (ESI Level 2)
  if (input.category === 'poisoning') {
    esiLevel = Math.min(esiLevel, 2)
    warnings.push('Potential poisoning')
    recommendedActions.push('Identify substance if possible')
    recommendedActions.push('Do not induce vomiting unless directed')
    dispatchRecommendations.push('Poison control consultation')
  }

  // Psychiatric (ESI Level 3-4)
  if (input.category === 'psychiatric') {
    esiLevel = Math.max(esiLevel, 3)
    if (input.consciousness === 'unresponsive') {
      esiLevel = 1
      warnings.push('Psychiatric emergency with unresponsiveness')
    }
    dispatchRecommendations.push('Crisis intervention team')
  }

  // Map ESI level to priority
  const priorityMap: Record<number, TriagePriority> = {
    1: 'immediate',
    2: 'urgent',
    3: 'delayed',
    4: 'minimal',
    5: 'expectant',
  }

  // Calculate estimated wait time
  let estimatedWaitTime: string
  switch (priorityMap[esiLevel]) {
    case 'immediate':
      estimatedWaitTime = '0 minutes - Immediate'
      break
    case 'urgent':
      estimatedWaitTime = '< 15 minutes'
      break
    case 'delayed':
      estimatedWaitTime = '< 1 hour'
      break
    case 'minimal':
      estimatedWaitTime = '< 2 hours'
      break
    case 'expectant':
      estimatedWaitTime = 'N/A - Deceased'
      break
    default:
      estimatedWaitTime = 'To be determined'
  }

  // Default actions if none specified
  if (recommendedActions.length === 0) {
    recommendedActions.push('Monitor patient condition')
    recommendedActions.push('Keep patient comfortable')
    recommendedActions.push('Be prepared to reassess')
  }

  return {
    priority: priorityMap[esiLevel] || 'delayed',
    category: input.category,
    recommendedActions,
    esiLevel,
    estimatedWaitTime,
    warnings,
    dispatchRecommendations,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the display name for a medical category
 */
export function getMedicalCategoryDisplayName(category: MedicalEmergencyCategory): string {
  const names: Record<MedicalEmergencyCategory, string> = {
    cardiac: 'Cardiac Emergency',
    respiratory: 'Respiratory Emergency',
    neurological: 'Neurological Emergency',
    trauma: 'Trauma/Injury',
    poisoning: 'Poisoning/Overdose',
    environmental: 'Environmental Emergency',
    OBGYN: 'OBGYN Emergency',
    psychiatric: 'Psychiatric Emergency',
    general: 'General Medical Emergency',
  }
  return names[category]
}

/**
 * Gets the icon for a medical category
 */
export function getMedicalCategoryIcon(category: MedicalEmergencyCategory): string {
  const icons: Record<MedicalEmergencyCategory, string> = {
    cardiac: '❤️',
    respiratory: '🫁',
    neurological: '🧠',
    trauma: '🩹',
    poisoning: '☠️',
    environmental: '🌡️',
    OBGYN: '👶',
    psychiatric: '🧘',
    general: '🩺',
  }
  return icons[category]
}

/**
 * Gets the icon for triage priority
 */
export function getTriagePriorityIcon(priority: TriagePriority): string {
  const icons: Record<TriagePriority, string> = {
    immediate: '🔴',
    urgent: '🟠',
    delayed: '🟡',
    minimal: '🟢',
    expectant: '⚫',
  }
  return icons[priority]
}

/**
 * Gets the color class for triage priority
 */
export function getTriagePriorityColor(priority: TriagePriority): string {
  const colors: Record<TriagePriority, string> = {
    immediate: 'text-red-600 bg-red-100',
    urgent: 'text-orange-600 bg-orange-100',
    delayed: 'text-yellow-600 bg-yellow-100',
    minimal: 'text-green-600 bg-green-100',
    expectant: 'text-gray-600 bg-gray-100',
  }
  return colors[priority]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Performs medical triage assessment
 */
export async function performMedicalTriage(input: MedicalTriageInput): Promise<MedicalTriageRecord> {
  const validationResult = medicalTriageInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid triage input: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  // Perform assessment
  const assessment = assessTriagePriority(validatedInput)

  try {
    const { data, error } = await supabase
      .from('medical_triage')
      .insert({
        user_id: validatedInput.userId,
        emergency_id: validatedInput.emergencyId || null,
        chief_complaint: validatedInput.chiefComplaint,
        category: validatedInput.category,
        vitals: validatedInput.vitals || null,
        consciousness: validatedInput.consciousness,
        breathing: validatedInput.breathing,
        pain_level: validatedInput.painLevel || null,
        is_conscious: validatedInput.isConscious,
        is_breathing: validatedInput.isBreathing,
        has_chest_pain: validatedInput.hasChestPain,
        has_difficulty_breathing: validatedInput.hasDifficultyBreathing,
        is_bleeding: validatedInput.isBleeding,
        has_allergies: validatedInput.hasAllergies,
        medications: validatedInput.medications || null,
        medical_history: validatedInput.medicalHistory || null,
        notes: validatedInput.notes || null,
        assessment: {
          priority: assessment.priority,
          category: assessment.category,
          recommendedActions: assessment.recommendedActions,
          esiLevel: assessment.esiLevel,
          estimatedWaitTime: assessment.estimatedWaitTime,
          warnings: assessment.warnings,
          dispatchRecommendations: assessment.dispatchRecommendations,
        },
        triage_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating medical triage:', error)
      throw new Error(`Failed to create triage assessment: ${error.message}`)
    }

    // If emergency ID is provided, update the incident with triage info
    if (validatedInput.emergencyId) {
      await supabase
        .from('incidents')
        .update({ 
          triage_id: data.id,
          priority: assessment.priority === 'immediate' ? 'critical' : 
                   assessment.priority === 'urgent' ? 'urgent' : 'high'
        })
        .eq('id', validatedInput.emergencyId)
    }

    return {
      id: data.id,
      userId: data.user_id,
      emergencyId: data.emergency_id || undefined,
      chiefComplaint: data.chief_complaint,
      category: data.category as MedicalEmergencyCategory,
      vitals: data.vitals,
      consciousness: data.consciousness as ConsciousnessLevel,
      breathing: data.breathing as BreathingStatus,
      painLevel: data.pain_level || undefined,
      isConscious: data.is_conscious,
      isBreathing: data.is_breathing,
      hasChestPain: data.has_chest_pain,
      hasDifficultyBreathing: data.has_difficulty_breathing,
      isBleeding: data.is_bleeding,
      hasAllergies: data.has_allergies,
      medications: data.medications || undefined,
      medicalHistory: data.medical_history || undefined,
      notes: data.notes || undefined,
      assessment: data.assessment as TriageAssessment,
      triageCompleted: data.triage_completed,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error('Error in performMedicalTriage:', error)
    throw error
  }
}

/**
 * Retrieves triage record by ID
 */
export async function getMedicalTriage(id: string): Promise<MedicalTriageRecord | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('medical_triage')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching medical triage:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    emergencyId: data.emergency_id || undefined,
    chiefComplaint: data.chief_complaint,
    category: data.category as MedicalEmergencyCategory,
    vitals: data.vitals,
    consciousness: data.consciousness as ConsciousnessLevel,
    breathing: data.breathing as BreathingStatus,
    painLevel: data.pain_level || undefined,
    isConscious: data.is_conscious,
    isBreathing: data.is_breathing,
    hasChestPain: data.has_chest_pain,
    hasDifficultyBreathing: data.has_difficulty_breathing,
    isBleeding: data.is_bleeding,
    hasAllergies: data.has_allergies,
    medications: data.medications || undefined,
    medicalHistory: data.medical_history || undefined,
    notes: data.notes || undefined,
    assessment: data.assessment as TriageAssessment,
    triageCompleted: data.triage_completed,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Retrieves triage records for an emergency
 */
export async function getTriageForEmergency(emergencyId: string): Promise<MedicalTriageRecord | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('medical_triage')
    .select('*')
    .eq('emergency_id', emergencyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching triage for emergency:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    emergencyId: data.emergency_id || undefined,
    chiefComplaint: data.chief_complaint,
    category: data.category as MedicalEmergencyCategory,
    vitals: data.vitals,
    consciousness: data.consciousness as ConsciousnessLevel,
    breathing: data.breathing as BreathingStatus,
    painLevel: data.pain_level || undefined,
    isConscious: data.is_conscious,
    isBreathing: data.is_breathing,
    hasChestPain: data.has_chest_pain,
    hasDifficultyBreathing: data.has_difficulty_breathing,
    isBleeding: data.is_bleeding,
    hasAllergies: data.has_allergies,
    medications: data.medications || undefined,
    medicalHistory: data.medical_history || undefined,
    notes: data.notes || undefined,
    assessment: data.assessment as TriageAssessment,
    triageCompleted: data.triage_completed,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Lists triage history for a user
 */
export async function listTriageHistory(
  userId: string,
  limit: number = 20
): Promise<MedicalTriageRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('medical_triage')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error listing triage history:', error)
    return []
  }

  return data.map(item => ({
    id: item.id,
    userId: item.user_id,
    emergencyId: item.emergency_id || undefined,
    chiefComplaint: item.chief_complaint,
    category: item.category as MedicalEmergencyCategory,
    vitals: item.vitals,
    consciousness: item.consciousness as ConsciousnessLevel,
    breathing: item.breathing as BreathingStatus,
    painLevel: item.pain_level || undefined,
    isConscious: item.is_conscious,
    isBreathing: item.is_breathing,
    hasChestPain: item.has_chest_pain,
    hasDifficultyBreathing: item.has_difficulty_breathing,
    isBleeding: item.is_bleeding,
    hasAllergies: item.has_allergies,
    medications: item.medications || undefined,
    medicalHistory: item.medical_history || undefined,
    notes: item.notes || undefined,
    assessment: item.assessment as TriageAssessment,
    triageCompleted: item.triage_completed,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

/**
 * Creates triage with SOS alert linkage
 */
export async function createTriageWithSOS(
  input: MedicalTriageInput
): Promise<{ triage: MedicalTriageRecord; sosResult: { id: string; incidentNumber: string } }> {
  const supabase = createClient()

  // First create the SOS alert if not provided
  let emergencyId = input.emergencyId
  if (!emergencyId) {
    const { data: sosData, error: sosError } = await supabase
      .from('incidents')
      .insert({
        incident_number: `MED-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString().slice(2, 6)}`,
        type: 'medical_emergency',
        priority: 'critical',
        status: 'active',
        latitude: 0,
        longitude: 0,
        description: `Medical Emergency: ${input.chiefComplaint}`,
        is_sos: true,
        created_at: new Date().toISOString(),
      })
      .select('id, incident_number')
      .single()

    if (sosError) {
      throw new Error(`Failed to create SOS alert for triage: ${sosError.message}`)
    }

    emergencyId = sosData.id
  }

  // Now perform the triage
  const triage = await performMedicalTriage({
    ...input,
    emergencyId,
  })

  return {
    triage,
    sosResult: {
      id: emergencyId,
      incidentNumber: sosData?.incident_number || '',
    },
  }
}
