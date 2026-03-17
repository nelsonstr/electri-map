import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type TriageStatus = 'pending' | 'in_progress' | 'awaiting_resources' | 'transit' | 'completed' | 'cancelled'

export type TriagePriority = 'critical' | 'urgent' | 'semi_urgent' | 'routine' | 'low'

export type TriageLevel = 1 | 2 | 3 | 4 | 5

export type ChiefComplaint = 
  | 'chest_pain'
  | 'difficulty_breathing'
  | 'stroke_symptoms'
  | 'unconscious'
  | 'severe_bleeding'
  | 'fall_injury'
  | 'motor_vehicle_accident'
  | 'allergic_reaction'
  | 'burns'
  | 'poisoning'
  | 'psychiatric'
  | 'pregnancy'
  | 'fever'
  | 'pain'
  | 'injury'
  | 'illness'
  | 'other'

export type TransportDecision = 
  | 'emergency_transport'
  | 'urgent_transport'
  | 'routine_transport'
  | 'referral'
  | 'self_care'
  | 'no_transport'

export interface TriageQuestion {
  id: string
  category: string
  question: string
  answer?: string | boolean | number
  priority: number
  answeredAt?: string
}

export interface TriageAssessment {
  id: string
  patientId: string
  sosId?: string
  
  // Chief Complaint
  chiefComplaint: ChiefComplaint
  chiefComplaintOther?: string
  complaintDuration?: string
  
  // Vital Signs
  vitals?: {
    heartRate?: number
    bloodPressure?: {
      systolic: number
      diastolic: number
    }
    respiratoryRate?: number
    oxygenSaturation?: number
    temperature?: number
    painLevel?: number
  }
  
  // Triage Questions
  questions: TriageQuestion[]
  
  // Assessment
  assessedSymptoms: string[]
  suspectedConditions: Array<{
    condition: string
    probability: 'high' | 'medium' | 'low'
  }>
  
  // Glasgow Coma Scale (if applicable)
  glasgowComaScore?: {
    eye: 1 | 2 | 3 | 4
    verbal: 1 | 2 | 3 | 4 | 5
    motor: 1 | 2 | 3 | 4 | 5 | 6
    total: number
  }
  
  // Trauma Assessment (if applicable)
  traumaAssessment?: {
    mechanism: string
    injuries: Array<{
      location: string
      severity: 'minor' | 'moderate' | 'severe'
      description: string
    }>
    primarySurveyComplete: boolean
  }
  
  // Decision
  triageLevel: TriageLevel
  priority: TriagePriority
  transportDecision: TransportDecision
  recommendedFacility?: string
  
  // Resources
  resourcesRequired: Array<{
    type: string
    quantity: number
    priority: 'critical' | 'high' | 'medium' | 'low'
  }>
  
  // Provider
  assessedBy?: string
  assessmentNotes?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface CreateTriageInput {
  patientId: string
  sosId?: string
  chiefComplaint: ChiefComplaint
  chiefComplaintOther?: string
  complaintDuration?: string
  vitals?: TriageAssessment['vitals']
}

// ============================================================================
// Triage Protocol Configuration
// ============================================================================

export const TRIAGE_LEVELS: Record<TriageLevel, {
  label: string
  responseTime: string
  description: string
}> = {
  1: {
    label: 'Immediate',
    responseTime: '0 minutes',
    description: 'Life-threatening conditions requiring immediate intervention',
  },
  2: {
    label: 'Very Urgent',
    responseTime: '< 10 minutes',
    description: 'Potentially life-threatening conditions',
  },
  3: {
    label: 'Urgent',
    responseTime: '< 30 minutes',
    description: 'Serious conditions requiring prompt attention',
  },
  4: {
    label: 'Standard',
    responseTime: '< 90 minutes',
    description: 'Non-urgent conditions',
  },
  5: {
    label: 'Non-Urgent',
    responseTime: '< 120 minutes',
    description: 'Minor conditions that can wait',
  },
}

export const CHIEF_COMPLAINT_QUESTIONS: Record<ChiefComplaint, TriageQuestion[]> = {
  chest_pain: [
    { id: 'cp_1', category: 'Onset', question: 'When did the chest pain start?', priority: 1 },
    { id: 'cp_2', category: 'Character', question: 'Can you describe the pain (sharp, dull, pressure)?', priority: 1 },
    { id: 'cp_3', category: 'Radiation', question: 'Does the pain spread to your arms, jaw, or back?', priority: 1 },
    { id: 'cp_4', category: 'Severity', question: 'Rate your pain from 1-10', priority: 2 },
    { id: 'cp_5', category: 'Associated', question: 'Are you experiencing shortness of breath?', priority: 1 },
    { id: 'cp_6', category: 'Associated', question: 'Are you sweating or feeling nauseous?', priority: 2 },
    { id: 'cp_7', category: 'History', question: 'Do you have a history of heart disease?', priority: 2 },
    { id: 'cp_8', category: 'History', question: 'Are you taking heart medication?', priority: 2 },
  ],
  difficulty_breathing: [
    { id: 'db_1', category: 'Onset', question: 'When did the breathing difficulty start?', priority: 1 },
    { id: 'db_2', category: 'Character', question: 'Is it constant or does it come and go?', priority: 1 },
    { id: 'db_3', category: 'Severity', question: 'How severe is the breathing difficulty (mild/moderate/severe)?', priority: 1 },
    { id: 'db_4', category: 'Associated', question: 'Are you wheezing or making noise when breathing?', priority: 1 },
    { id: 'db_5', category: 'Associated', question: 'Do you have chest pain?', priority: 2 },
    { id: 'db_6', category: 'History', question: 'Do you have asthma or COPD?', priority: 2 },
    { id: 'db_7', category: 'History', question: 'Do you have allergies?', priority: 2 },
  ],
  stroke_symptoms: [
    { id: 'ss_1', category: 'Onset', question: 'When did the symptoms start?', priority: 1 },
    { id: 'ss_2', category: 'Symptoms', question: 'Is one side of the face drooping?', priority: 1 },
    { id: 'ss_3', category: 'Symptoms', question: 'Is one arm weak or numb?', priority: 1 },
    { id: 'ss_4', category: 'Symptoms', question: 'Is speech slurred or strange?', priority: 1 },
    { id: 'ss_5', category: 'Symptoms', question: 'Is there vision loss in one or both eyes?', priority: 1 },
    { id: 'ss_6', category: 'Symptoms', question: 'Is there severe headache with no known cause?', priority: 1 },
    { id: 'ss_7', category: 'History', question: 'Do you have high blood pressure?', priority: 2 },
    { id: 'ss_8', category: 'History', question: 'Do you take blood thinners?', priority: 2 },
  ],
  unconscious: [
    { id: 'uc_1', category: 'Response', question: 'Does the patient respond to voice?', priority: 1 },
    { id: 'uc_2', category: 'Response', question: 'Does the patient respond to pain?', priority: 1 },
    { id: 'uc_3', category: 'Breathing', question: 'Is the patient breathing normally?', priority: 1 },
    { id: 'uc_4', category: 'Pulse', question: 'Is there a pulse?', priority: 1 },
    { id: 'uc_5', category: 'Duration', question: 'How long has the patient been unconscious?', priority: 1 },
    { id: 'uc_6', category: 'History', question: 'Do you know what happened?', priority: 2 },
    { id: 'uc_7', category: 'History', question: 'Does the patient have any known medical conditions?', priority: 2 },
  ],
  severe_bleeding: [
    { id: 'sb_1', category: 'Location', question: 'Where is the bleeding located?', priority: 1 },
    { id: 'sb_2', category: 'Severity', question: 'Is the bleeding controlled?', priority: 1 },
    { id: 'sb_3', category: 'Volume', question: 'How much blood has been lost (estimate)?', priority: 1 },
    { id: 'sb_4', category: 'Type', question: 'Is it arterial (pulsing) or venous (steady)?', priority: 1 },
    { id: 'sb_5', category: 'Associated', question: 'Is there severe pain?', priority: 2 },
    { id: 'sb_6', category: 'History', question: 'Does the patient take blood thinners?', priority: 2 },
  ],
  fall_injury: [
    { id: 'fi_1', category: 'Height', question: 'How far did they fall?', priority: 1 },
    { id: 'fi_2', category: 'Surface', question: 'What did they land on?', priority: 1 },
    { id: 'fi_3', category: 'Head', question: 'Did they hit their head?', priority: 1 },
    { id: 'fi_4', category: 'Consciousness', question: 'Did they lose consciousness?', priority: 1 },
    { id: 'fi_5', category: 'Pain', question: 'Where is the pain?', priority: 1 },
    { id: 'fi_6', category: 'Movement', question: 'Can they move all extremities?', priority: 1 },
    { id: 'fi_7', category: 'History', question: 'Do they have osteoporosis?', priority: 2 },
  ],
  motor_vehicle_accident: [
    { id: 'mva_1', category: 'Type', question: 'What type of collision (rear-end, T-bone, rollover)?', priority: 1 },
    { id: 'mva_2', category: 'Speed', question: 'Estimated speed at impact?', priority: 1 },
    { id: 'mva_3', category: 'Restraint', question: 'Were seat belts worn?', priority: 1 },
    { id: 'mva_4', category: 'Airbags', question: 'Did airbags deploy?', priority: 1 },
    { id: 'mva_5', category: 'Extraction', question: 'Was the patient trapped in the vehicle?', priority: 1 },
    { id: 'mva_6', category: 'Patients', question: 'How many patients?', priority: 1 },
    { id: 'mva_7', category: 'Location', question: 'Are there any injuries visible?', priority: 2 },
  ],
  allergic_reaction: [
    { id: 'ar_1', category: 'Exposure', question: 'What caused the allergic reaction?', priority: 1 },
    { id: 'ar_2', category: 'Onset', question: 'When did symptoms start?', priority: 1 },
    { id: 'ar_3', category: 'Skin', question: 'Are there hives or rash?', priority: 1 },
    { id: 'ar_4', category: 'Breathing', question: 'Is there difficulty breathing?', priority: 1 },
    { id: 'ar_5', category: 'Swelling', question: 'Is there swelling of face/lips/tongue?', priority: 1 },
    { id: 'ar_6', category: 'History', question: 'Has this happened before?', priority: 2 },
    { id: 'ar_7', category: 'Treatment', question: 'Do you have an epinephrine auto-injector?', priority: 2 },
  ],
  burns: [
    { id: 'bu_1', category: 'Cause', question: 'What caused the burn (fire, liquid, chemical, electrical)?', priority: 1 },
    { id: 'bu_2', category: 'Extent', question: 'What percentage of body is burned (estimate)?', priority: 1 },
    { id: 'bu_3', category: 'Degree', question: 'What do the burns look like (red, blistered, white/charred)?', priority: 1 },
    { id: 'bu_4', category: 'Location', question: 'Are burns on face, hands, feet, or genitals?', priority: 1 },
    { id: 'bu_5', category: 'Inhalation', question: 'Was there smoke inhalation?', priority: 1 },
    { id: 'bu_6', category: 'Pain', question: 'How severe is the pain?', priority: 2 },
  ],
  poisoning: [
    { id: 'po_1', category: 'Substance', question: 'What was ingested?', priority: 1 },
    { id: 'po_2', category: 'Amount', question: 'How much was taken?', priority: 1 },
    { id: 'po_3', category: 'Time', question: 'When was it taken?', priority: 1 },
    { id: 'po_4', category: 'Weight', question: 'What is the patient\'s weight?', priority: 1 },
    { id: 'po_5', category: 'Symptoms', question: 'What symptoms are present?', priority: 1 },
    { id: 'po_6', category: 'Container', question: 'Do you have the container or substance?', priority: 2 },
  ],
  psychiatric: [
    { id: 'ps_1', category: 'Ideation', question: 'Does the patient have thoughts of harming themselves?', priority: 1 },
    { id: 'ps_2', category: 'Ideation', question: 'Does the patient have thoughts of harming others?', priority: 1 },
    { id: 'ps_3', category: 'Behavior', question: 'Is the patient agitated or violent?', priority: 1 },
    { id: 'ps_4', category: 'Hallucinations', question: 'Are there hallucinations?', priority: 1 },
    { id: 'ps_5', category: 'History', question: 'Does the patient have a psychiatric history?', priority: 2 },
    { id: 'ps_6', category: 'Treatment', question: 'Is the patient on medication?', priority: 2 },
  ],
  pregnancy: [
    { id: 'pr_1', category: 'Gestational', question: 'How far along is the pregnancy (weeks)?', priority: 1 },
    { id: 'pr_2', category: 'Symptoms', question: 'What symptoms are you experiencing?', priority: 1 },
    { id: 'pr_3', category: 'Contractions', question: 'Are you having contractions?', priority: 1 },
    { id: 'pr_4', category: 'Water', question: 'Has your water broken?', priority: 1 },
    { id: 'pr_5', category: 'Bleeding', question: 'Is there any bleeding?', priority: 1 },
    { id: 'pr_6', category: 'Movement', question: 'Can you feel the baby moving?', priority: 2 },
  ],
  fever: [
    { id: 'fe_1', category: 'Temperature', question: 'What is the temperature?', priority: 1 },
    { id: 'fe_2', category: 'Duration', question: 'How long has the fever lasted?', priority: 1 },
    { id: 'fe_3', category: 'Associated', question: 'What other symptoms are present?', priority: 1 },
    { id: 'fe_4', category: 'History', question: 'Are there any chronic conditions?', priority: 2 },
    { id: 'fe_5', category: 'Treatment', question: 'Has any medication been taken?', priority: 2 },
  ],
  pain: [
    { id: 'pa_1', category: 'Location', question: 'Where is the pain located?', priority: 1 },
    { id: 'pa_2', category: 'Onset', question: 'When did the pain start?', priority: 1 },
    { id: 'pa_3', category: 'Character', question: 'Can you describe the pain (sharp, dull, throbbing)?', priority: 1 },
    { id: 'pa_4', category: 'Severity', question: 'Rate the pain from 1-10', priority: 1 },
    { id: 'pa_5', category: 'Radiation', question: 'Does the pain spread anywhere?', priority: 1 },
    { id: 'pa_6', category: 'Relief', question: 'Does anything make the pain better or worse?', priority: 2 },
  ],
  injury: [
    { id: 'in_1', category: 'Location', question: 'Where is the injury?', priority: 1 },
    { id: 'in_2', category: 'Mechanism', question: 'How did the injury occur?', priority: 1 },
    { id: 'in_3', category: 'Severity', question: 'Can you move the affected area?', priority: 1 },
    { id: 'in_4', category: 'Deformity', question: 'Is there visible deformity?', priority: 1 },
    { id: 'in_5', category: 'Swelling', question: 'Is there swelling or bruising?', priority: 1 },
    { id: 'in_6', category: 'Function', question: 'Can you use the affected area normally?', priority: 2 },
  ],
  illness: [
    { id: 'il_1', category: 'Symptoms', question: 'What symptoms are you experiencing?', priority: 1 },
    { id: 'il_2', category: 'Duration', question: 'How long have you been sick?', priority: 1 },
    { id: 'il_3', category: 'Severity', question: 'How severe are the symptoms?', priority: 1 },
    { id: 'il_4', category: 'History', question: 'Do you have any chronic conditions?', priority: 2 },
    { id: 'il_5', category: 'Treatment', question: 'What treatments have you tried?', priority: 2 },
  ],
  other: [
    { id: 'ot_1', category: 'Complaint', question: 'What is the main problem?', priority: 1 },
    { id: 'ot_2', category: 'Duration', question: 'How long has this been going on?', priority: 1 },
    { id: 'ot_3', category: 'Symptoms', question: 'What other symptoms are present?', priority: 1 },
    { id: 'ot_4', category: 'History', question: 'Is there relevant medical history?', priority: 2 },
  ],
}

export const TRIAGE_PROTOCOL_QUESTIONS: TriageQuestion[] = [
  { id: 'gen_1', category: 'General', question: 'What is the patient\'s age?', priority: 1 },
  { id: 'gen_2', category: 'General', question: 'What is the patient\'s weight (approximate)?', priority: 2 },
  { id: 'gen_3', category: 'Allergies', question: 'Does the patient have any known allergies?', priority: 1 },
  { id: 'gen_4', category: 'Medications', question: 'Is the patient taking any medications?', priority: 2 },
  { id: 'gen_5', category: 'Medical History', question: 'Does the patient have any relevant medical history?', priority: 2 },
]

// ============================================================================
// Validation Schemas
// ============================================================================

export const createTriageSchema = z.object({
  patientId: z.string().uuid(),
  sosId: z.string().optional(),
  chiefComplaint: z.enum([
    'chest_pain',
    'difficulty_breathing',
    'stroke_symptoms',
    'unconscious',
    'severe_bleeding',
    'fall_injury',
    'motor_vehicle_accident',
    'allergic_reaction',
    'burns',
    'poisoning',
    'psychiatric',
    'pregnancy',
    'fever',
    'pain',
    'injury',
    'illness',
    'other',
  ]),
  chiefComplaintOther: z.string().optional(),
  complaintDuration: z.string().optional(),
  vitals: z.object({
    heartRate: z.number().optional(),
    bloodPressure: z.object({
      systolic: z.number(),
      diastolic: z.number(),
    }).optional(),
    respiratoryRate: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    temperature: z.number().optional(),
    painLevel: z.number().min(0).max(10).optional(),
  }).optional(),
})

export const answerQuestionSchema = z.object({
  triageId: z.string(),
  questionId: z.string(),
  answer: z.union([z.string(), z.boolean(), z.number()]),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getChiefComplaintDisplayName(complaint: ChiefComplaint): string {
  const names: Record<ChiefComplaint, string> = {
    chest_pain: 'Chest Pain',
    difficulty_breathing: 'Difficulty Breathing',
    stroke_symptoms: 'Stroke Symptoms',
    unconscious: 'Unconscious',
    severe_bleeding: 'Severe Bleeding',
    fall_injury: 'Fall Injury',
    motor_vehicle_accident: 'Motor Vehicle Accident',
    allergic_reaction: 'Allergic Reaction',
    burns: 'Burns',
    poisoning: 'Poisoning',
    psychiatric: 'Psychiatric Emergency',
    pregnancy: 'Pregnancy Related',
    fever: 'Fever',
    pain: 'Pain',
    injury: 'Injury',
    illness: 'Illness',
    other: 'Other',
  }
  return names[complaint]
}

export function getTriageLevelDisplayName(level: TriageLevel): string {
  return TRIAGE_LEVELS[level]?.label || 'Unknown'
}

export function getTriagePriorityDisplayName(priority: TriagePriority): string {
  const names: Record<TriagePriority, string> = {
    critical: 'Critical',
    urgent: 'Urgent',
    semi_urgent: 'Semi-Urgent',
    routine: 'Routine',
    low: 'Low',
  }
  return names[priority]
}

export function getTransportDecisionDisplayName(decision: TransportDecision): string {
  const names: Record<TransportDecision, string> = {
    emergency_transport: 'Emergency Transport',
    urgent_transport: 'Urgent Transport',
    routine_transport: 'Routine Transport',
    referral: 'Referral Required',
    self_care: 'Self-Care Instructions',
    no_transport: 'No Transport Required',
  }
  return names[decision]
}

export function calculateTriageLevel(
  chiefComplaint: ChiefComplaint,
  vitals: TriageAssessment['vitals'],
  answers: Array<{ id: string; answer: string | boolean | number }>
): TriageLevel {
  // Red flag conditions - immediate
  const redFlagConditions: Record<ChiefComplaint, boolean> = {
    chest_pain: true,
    difficulty_breathing: true,
    stroke_symptoms: true,
    unconscious: true,
    severe_bleeding: true,
    fall_injury: false,
    motor_vehicle_accident: false,
    allergic_reaction: true,
    burns: false,
    poisoning: true,
    psychiatric: false,
    pregnancy: false,
    fever: false,
    pain: false,
    injury: false,
    illness: false,
    other: false,
  }

  if (redFlagConditions[chiefComplaint]) {
    // Check vital signs for critical values
    if (vitals?.oxygenSaturation && vitals.oxygenSaturation < 90) {
      return 1
    }
    if (vitals?.heartRate && (vitals.heartRate < 40 || vitals.heartRate > 130)) {
      return 1
    }
    if (vitals?.bloodPressure) {
      if (vitals.bloodPressure.systolic < 80 || vitals.bloodPressure.systolic > 200) {
        return 1
      }
    }
    if (chiefComplaint === 'stroke_symptoms' || chiefComplaint === 'unconscious') {
      return 1
    }
    return 2
  }

  // Check for other urgent conditions
  const urgentConditions: ChiefComplaint[] = [
    'motor_vehicle_accident',
    'burns',
    'pregnancy',
  ]

  if (urgentConditions.includes(chiefComplaint)) {
    return 2
  }

  // Semi-urgent conditions
  const semiUrgentConditions: ChiefComplaint[] = [
    'fall_injury',
    'allergic_reaction',
    'psychiatric',
  ]

  if (semiUrgentConditions.includes(chiefComplaint)) {
    return 3
  }

  // Routine conditions
  const routineConditions: ChiefComplaint[] = [
    'fever',
    'pain',
    'injury',
    'illness',
  ]

  if (routineConditions.includes(chiefComplaint)) {
    return 4
  }

  return 5
}

export function calculateGlasgowComaScore(
  eye: 1 | 2 | 3 | 4,
  verbal: 1 | 2 | 3 | 4 | 5,
  motor: 1 | 2 | 3 | 4 | 5 | 6
): { total: number; category: 'mild' | 'moderate' | 'severe' } {
  const total = eye + verbal + motor
  
  let category: 'mild' | 'moderate' | 'severe'
  if (total >= 13) {
    category = 'mild'
  } else if (total >= 9) {
    category = 'moderate'
  } else {
    category = 'severe'
  }
  
  return { total, category }
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createTriageAssessment(
  input: CreateTriageInput
): Promise<TriageAssessment> {
  const validationResult = createTriageSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const assessmentId = `triage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Initialize questions based on chief complaint
  const complaintQuestions = CHIEF_COMPLAINT_QUESTIONS[input.chiefComplaint] || []
  const generalQuestions = TRIAGE_PROTOCOL_QUESTIONS

  const allQuestions: TriageQuestion[] = [
    ...complaintQuestions.map(q => ({ ...q, answeredAt: undefined })),
    ...generalQuestions.map(q => ({ ...q, answeredAt: undefined })),
  ]

  const assessment: TriageAssessment = {
    id: assessmentId,
    patientId: input.patientId,
    sosId: input.sosId,
    chiefComplaint: input.chiefComplaint,
    chiefComplaintOther: input.chiefComplaintOther,
    complaintDuration: input.complaintDuration,
    vitals: input.vitals,
    questions: allQuestions,
    assessedSymptoms: [],
    suspectedConditions: [],
    triageLevel: calculateTriageLevel(input.chiefComplaint, input.vitals, []),
    priority: 'routine',
    transportDecision: 'referral',
    resourcesRequired: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Update priority based on triage level
  const priorityMap: Record<TriageLevel, TriagePriority> = {
    1: 'critical',
    2: 'urgent',
    3: 'semi_urgent',
    4: 'routine',
    5: 'low',
  }
  assessment.priority = priorityMap[assessment.triageLevel]

  const { error } = await supabase
    .from('triage_assessments')
    .insert({
      id: assessmentId,
      patient_id: input.patientId,
      sos_id: input.sosId,
      chief_complaint: input.chiefComplaint,
      chief_complaint_other: input.chiefComplaintOther,
      complaint_duration: input.complaintDuration,
      vitals: input.vitals,
      questions: allQuestions,
      assessed_symptoms: [],
      suspected_conditions: [],
      triage_level: assessment.triageLevel,
      priority: assessment.priority,
      transport_decision: assessment.transportDecision,
      resources_required: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating triage assessment:', error)
    throw new Error('Failed to create triage assessment')
  }

  return assessment
}

export async function getTriage(assessmentId: string): Promise<TriageAssessment | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('triage_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single()

  if (error || !data) {
    return null
  }

  return mapTriageFromDB(data)
}

export async function answerTriageQuestion(
  triageId: string,
  questionId: string,
  answer: string | boolean | number
): Promise<TriageAssessment> {
  const supabase = createClient()

  // Get current assessment
  const { data: assessment, error: fetchError } = await supabase
    .from('triage_assessments')
    .select('*')
    .eq('id', triageId)
    .single()

  if (fetchError || !assessment) {
    throw new Error('Triage assessment not found')
  }

  // Update the answer
  const questions = (assessment.questions || []) as TriageQuestion[]
  const updatedQuestions = questions.map(q => {
    if (q.id === questionId) {
      return {
        ...q,
        answer,
        answeredAt: new Date().toISOString(),
      }
    }
    return q
  })

  // Check if all critical questions are answered
  const criticalQuestionsAnswered = updatedQuestions
    .filter(q => q.priority === 1)
    .every(q => q.answeredAt)

  // Update assessment
  const { error: updateError } = await supabase
    .from('triage_assessments')
    .update({
      questions: updatedQuestions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', triageId)

  if (updateError) {
    console.error('Error updating triage question:', updateError)
    throw new Error('Failed to update triage question')
  }

  return getTriage(triageId) as Promise<TriageAssessment>
}

export async function completeTriageAssessment(
  triageId: string,
  assessment: {
    assessedSymptoms: string[]
    suspectedConditions: Array<{ condition: string; probability: 'high' | 'medium' | 'low' }>
    transportDecision: TransportDecision
    recommendedFacility?: string
    resourcesRequired: Array<{ type: string; quantity: number; priority: 'critical' | 'high' | 'medium' | 'low' }>
    assessedBy?: string
    assessmentNotes?: string
    glasgowComaScore?: TriageAssessment['glasgowComaScore']
    traumaAssessment?: TriageAssessment['traumaAssessment']
  }
): Promise<TriageAssessment> {
  const supabase = createClient()

  // Get current assessment
  const current = await getTriage(triageId)
  if (!current) {
    throw new Error('Triage assessment not found')
  }

  // Calculate final triage level based on all answers
  const priorityAnswers = current.questions
    .filter(q => q.priority === 1 && q.answer !== undefined)
    .map(q => ({ id: q.id, answer: q.answer }))

  const triageLevel = calculateTriageLevel(
    current.chiefComplaint,
    current.vitals,
    priorityAnswers
  )

  const priorityMap: Record<TriageLevel, TriagePriority> = {
    1: 'critical',
    2: 'urgent',
    3: 'semi_urgent',
    4: 'routine',
    5: 'low',
  }

  const { error } = await supabase
    .from('triage_assessments')
    .update({
      assessed_symptoms: assessment.assessedSymptoms,
      suspected_conditions: assessment.suspectedConditions,
      triage_level: triageLevel,
      priority: priorityMap[triageLevel],
      transport_decision: assessment.transportDecision,
      recommended_facility: assessment.recommendedFacility,
      resources_required: assessment.resourcesRequired,
      assessed_by: assessment.assessedBy,
      assessment_notes: assessment.assessmentNotes,
      glasgow_coma_score: assessment.glasgowComaScore,
      trauma_assessment: assessment.traumaAssessment,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', triageId)

  if (error) {
    console.error('Error completing triage assessment:', error)
    throw new Error('Failed to complete triage assessment')
  }

  return getTriage(triageId) as Promise<TriageAssessment>
}

export async function updateTriageStatus(
  triageId: string,
  status: TriageStatus
): Promise<void> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('triage_assessments')
    .update(updateData)
    .eq('id', triageId)

  if (error) {
    console.error('Error updating triage status:', error)
    throw new Error('Failed to update triage status')
  }
}

export async function getPendingTriages(
  options?: {
    priority?: TriagePriority
    limit?: number
    offset?: number
  }
): Promise<TriageAssessment[]> {
  const supabase = createClient()

  let query = supabase
    .from('triage_assessments')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (options?.priority) {
    query = query.eq('priority', options.priority)
  }

  query = query
    .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching pending triages:', error)
    return []
  }

  return (data || []).map(mapTriageFromDB)
}

export async function getTriageStatistics(
  fromDate?: string,
  toDate?: string
): Promise<{
  totalAssessments: number
  byPriority: Record<TriagePriority, number>
  byTransportDecision: Record<TransportDecision, number>
  averageCompletionTime: number
  byChiefComplaint: Record<ChiefComplaint, number>
}> {
  const supabase = createClient()

  let query = supabase
    .from('triage_assessments')
    .select('*')

  if (fromDate) {
    query = query.gte('created_at', fromDate)
  }
  if (toDate) {
    query = query.lte('created_at', toDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching triage statistics:', error)
    return {
      totalAssessments: 0,
      byPriority: { critical: 0, urgent: 0, semi_urgent: 0, routine: 0, low: 0 },
      byTransportDecision: {
        emergency_transport: 0,
        urgent_transport: 0,
        routine_transport: 0,
        referral: 0,
        self_care: 0,
        no_transport: 0,
      },
      averageCompletionTime: 0,
      byChiefComplaint: {} as Record<ChiefComplaint, number>,
    }
  }

  const assessments = (data || []) as Array<{
    priority: TriagePriority
    transport_decision: TransportDecision
    chief_complaint: ChiefComplaint
    created_at: string
    completed_at: string | null
  }>

  const statistics = {
    totalAssessments: assessments.length,
    byPriority: { critical: 0, urgent: 0, semi_urgent: 0, routine: 0, low: 0 } as Record<TriagePriority, number>,
    byTransportDecision: {
      emergency_transport: 0,
      urgent_transport: 0,
      routine_transport: 0,
      referral: 0,
      self_care: 0,
      no_transport: 0,
    } as Record<TransportDecision, number>,
    averageCompletionTime: 0,
    byChiefComplaint: {} as Record<ChiefComplaint, number>,
  }

  let totalTime = 0
  let completedCount = 0

  for (const assessment of assessments) {
    statistics.byPriority[assessment.priority]++
    statistics.byTransportDecision[assessment.transport_decision]++
    statistics.byChiefComplaint[assessment.chief_complaint] = 
      (statistics.byChiefComplaint[assessment.chief_complaint] || 0) + 1

    if (assessment.completed_at) {
      const startTime = new Date(assessment.created_at).getTime()
      const endTime = new Date(assessment.completed_at).getTime()
      totalTime += (endTime - startTime) / 1000 / 60 // minutes
      completedCount++
    }
  }

  statistics.averageCompletionTime = completedCount > 0 
    ? totalTime / completedCount 
    : 0

  return statistics
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapTriageFromDB(data: Record<string, unknown>): TriageAssessment {
  return {
    id: data.id as string,
    patientId: data.patient_id as string,
    sosId: data.sos_id as string | undefined,
    chiefComplaint: data.chief_complaint as ChiefComplaint,
    chiefComplaintOther: data.chief_complaint_other as string | undefined,
    complaintDuration: data.complaint_duration as string | undefined,
    vitals: data.vitals as TriageAssessment['vitals'] | undefined,
    questions: (data.questions as TriageQuestion[]) || [],
    assessedSymptoms: (data.assessed_symptoms as string[]) || [],
    suspectedConditions: (data.suspected_conditions as Array<{
      condition: string
      probability: 'high' | 'medium' | 'low'
    }>) || [],
    glasgowComaScore: data.glasgow_coma_score as TriageAssessment['glasgowComaScore'] | undefined,
    traumaAssessment: data.trauma_assessment as TriageAssessment['traumaAssessment'] | undefined,
    triageLevel: data.triage_level as TriageLevel,
    priority: data.priority as TriagePriority,
    transportDecision: data.transport_decision as TransportDecision,
    recommendedFacility: data.recommended_facility as string | undefined,
    resourcesRequired: (data.resources_required as Array<{
      type: string
      quantity: number
      priority: 'critical' | 'high' | 'medium' | 'low'
    }>) || [],
    assessedBy: data.assessed_by as string | undefined,
    assessmentNotes: data.assessment_notes as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    completedAt: data.completed_at as string | undefined,
  }
}
