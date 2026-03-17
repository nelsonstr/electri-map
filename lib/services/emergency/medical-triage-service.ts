/**
 * Medical Emergency Triage Service
 * 
 * Epic: Medical Emergency Triage Support
 * Description: AI-assisted triage system that guides users through initial medical emergency response,
 * providing real-time first aid guidance, symptom assessment, and connecting to appropriate emergency
 * services with priority based on severity.
 * 
 * Bmad Category: Medical Emergency Protocol (MEP)
 * Emergency Mode Relevance: BFSI, CPI, SAR - Critical for medical emergencies
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type TriageLevel = 
  | 'immediate'      // Red - Life-threatening, requires immediate attention
  | 'urgent'         // Orange - Serious but not immediately life-threatening
  | 'delayed'        // Yellow - Needs medical attention but can wait
  | 'minimal'         // Green - Minor injuries, self-care possible
  | 'psychological'   // Purple - Mental health support needed
  | 'deceased'        // Black - No signs of life, requires special handling;

export type SymptomCategory = 
  | 'cardiovascular'
  | 'respiratory'
  | 'neurological'
  | 'trauma'
  | 'environmental'
  | 'toxicological'
  | 'infectious'
  | 'allergic'
  | 'psychiatric'
  | 'pediatric'
  | 'geriatric'
  | 'obstetric'
  | 'general';

export type FirstAidActionType = 
  | 'assessment'
  | 'compression'
  | 'airway'
  | 'bleeding_control'
  | 'splinting'
  | 'cooling'
  | 'warming'
  | 'positioning'
  | 'medication_guidance'
  | 'monitoring'
  | 'evacuation_guidance'
  | 'call_emergency_services';

export type UserResponse = 
  | 'yes'
  | 'no'
  | 'unsure'
  | 'unknown'
  | 'unable_to_answer';

export interface SymptomAssessment {
  id: string;
  session_id: string;
  user_id?: string;
  reported_symptoms: string[];
  symptom_onset: Date;
  symptom_duration: string;
  pain_level: number; // 0-10
  consciousness_level: 'alert' | 'responsive_to_voice' | 'responsive_to_pain' | 'unresponsive';
  breathing_status: 'normal' | 'labored' | 'absent';
  bleeding_status: 'none' | 'minor' | 'severe';
  triage_level: TriageLevel;
  confidence_score: number;
  assessment_notes: string;
  recommended_actions: FirstAidInstruction[];
  emergency_services_dispatched: boolean;
  created_at: Date;
}

export interface FirstAidInstruction {
  id: string;
  action_type: FirstAidActionType;
  title: string;
  description: string;
  steps: string[];
  warnings: string[];
  duration_seconds?: number;
  equipment_needed?: string[];
  video_url?: string;
  image_url?: string;
  is_critical: boolean;
  priority_order: number;
}

export interface TriageQuestion {
  id: string;
  category: SymptomCategory;
  question: string;
  follow_up_questions?: {
    if_yes: string;
    if_unsure: string;
  }[];
  response_options: UserResponse[];
  triage_impact: Partial<Record<TriageLevel, number>>;
  criticality_indicator: boolean;
}

export interface TriageSession {
  id: string;
  user_id?: string;
  status: 'active' | 'completed' | 'escalated' | 'abandoned';
  current_question_id?: string;
  symptom_onset?: Date;
  pain_assessment?: number;
  consciousness_assessment?: string;
  breathing_assessment?: string;
  bleeding_assessment?: string;
  preliminary_triage?: TriageLevel;
  confidence_score?: number;
  started_at: Date;
  completed_at?: Date;
  escalation_reason?: string;
}

export interface TriageHistory {
  id: string;
  session_id: string;
  user_id?: string;
  triage_level: TriageLevel;
  symptoms_reported: string[];
  actions_taken: string[];
  outcome: 'resolved_self' | 'emergency_services' | 'medical_visit' | 'follow_up' | 'unknown';
  feedback_rating?: number;
  created_at: Date;
}

export interface MedicalFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'urgent_care' | 'pharmacy' | 'specialist';
  location: { lat: number; lng: number };
  address: string;
  phone: string;
  is_24_hours: boolean;
  capabilities: string[];
  current_wait_time_minutes?: number;
  accepts_emergency: boolean;
  trauma_level?: '1' | '2' | '3' | '4' | 'none';
  distance_km?: number;
}

export interface TriageAnalytics {
  total_sessions: number;
  triage_distribution: Record<TriageLevel, number>;
  average_session_duration_seconds: number;
  emergency_services_dispatched: number;
  user_satisfaction_score: number;
  common_symptoms: { symptom: string; count: number }[];
  response_time_metrics: {
    time_to_triage: number;
    time_to_action: number;
  };
}

// ============================================================================
// Zod Schemas
// ============================================================================

const TriageSessionSchema = z.object({
  id: z.string(),
  status: z.enum(['active', 'completed', 'escalated', 'abandoned']),
  preliminary_triage: z.enum([
    'immediate',
    'urgent',
    'delayed',
    'minimal',
    'psychological',
    'deceased'
  ]).optional(),
  confidence_score: z.number().min(0).max(1).optional()
});

const SymptomAssessmentSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  reported_symptoms: z.array(z.string()),
  symptom_onset: z.date(),
  symptom_duration: z.string(),
  pain_level: z.number().min(0).max(10),
  consciousness_level: z.enum([
    'alert',
    'responsive_to_voice',
    'responsive_to_pain',
    'unresponsive'
  ]),
  breathing_status: z.enum(['normal', 'labored', 'absent']),
  bleeding_status: z.enum(['none', 'minor', 'severe']),
  triage_level: z.enum([
    'immediate',
    'urgent',
    'delayed',
    'minimal',
    'psychological',
    'deceased'
  ]),
  confidence_score: z.number().min(0).max(1),
  emergency_services_dispatched: z.boolean()
});

const FirstAidInstructionSchema = z.object({
  id: z.string(),
  action_type: z.enum([
    'assessment',
    'compression',
    'airway',
    'bleeding_control',
    'splinting',
    'cooling',
    'warming',
    'positioning',
    'medication_guidance',
    'monitoring',
    'evacuation_guidance',
    'call_emergency_services'
  ]),
  title: z.string(),
  description: z.string(),
  steps: z.array(z.string()),
  warnings: z.array(z.string()),
  is_critical: z.boolean(),
  priority_order: z.number()
});

// ============================================================================
// Configuration
// ============================================================================

export const triageConfig = {
  // Triage level configuration
  triageLevels: {
    immediate: {
      color: '#ef4444',
      label: 'Immediate',
      priority: 1,
      description: 'Life-threatening emergency',
      response_time: '0 minutes',
      icon: 'alert-circle'
    },
    urgent: {
      color: '#f97316',
      label: 'Urgent',
      priority: 2,
      description: 'Serious but stable',
      response_time: '< 15 minutes',
      icon: 'clock'
    },
    delayed: {
      color: '#eab308',
      label: 'Delayed',
      priority: 3,
      description: 'Needs medical attention',
      response_time: '< 1 hour',
      icon: 'calendar'
    },
    minimal: {
      color: '#22c55e',
      label: 'Minimal',
      priority: 4,
      description: 'Minor injuries',
      response_time: 'Self-care possible',
      icon: 'check-circle'
    },
    psychological: {
      color: '#a855f7',
      label: 'Psychological Support',
      priority: 5,
      description: 'Mental health support needed',
      response_time: 'Varies',
      icon: 'brain'
    },
    deceased: {
      color: '#374151',
      label: 'Deceased',
      priority: 6,
      description: 'No signs of life',
      response_time: 'Special handling',
      icon: 'x-circle'
    }
  },
  
  // Pain level thresholds
  painThresholds: {
    mild: 3,
    moderate: 6,
    severe: 8
  },
  
  // Critical symptoms that always trigger immediate triage
  criticalSymptoms: [
    'chest_pain',
    'difficulty_breathing',
    'unconscious',
    'severe_bleeding',
    'stroke_symptoms',
    'allergic_reaction_severe',
    'burns_severe',
    'poisoning',
    'drowning',
    'electrocution',
    'fall_from_height',
    'vehicle_accident',
    'gunshot_wound',
    'stabbing',
    'amputation'
  ],
  
  // First aid instruction templates
  firstAidTemplates: {
    cpr: {
      title: 'CPR (Cardiopulmonary Resuscitation)',
      steps: [
        'Check for responsiveness by tapping and shouting',
        'Call emergency services immediately',
        'Check for breathing (no more than 10 seconds)',
        'Place hands on center of chest',
        'Push hard and fast (100-120 compressions per minute)',
        'Allow chest to fully recoil between compressions',
        'Continue until help arrives or person starts breathing'
      ],
      warnings: [
        'Only perform CPR if trained and confident',
        'Do not stop compressions for more than 10 seconds',
        'If automated defibrillator is available, use it immediately'
      ]
    },
    bleeding_control: {
      title: 'Control Severe Bleeding',
      steps: [
        'Protect yourself with gloves if available',
        'Apply direct pressure to the wound with a clean cloth',
        'If blood soaks through, add more cloth on top',
        'Maintain pressure for at least 15 minutes',
        'If possible, elevate the injured area above heart level',
        'If bleeding continues, apply pressure to pressure point'
      ],
      warnings: [
        'Do not remove objects embedded in wound',
        'Do not apply tourniquet unless absolutely necessary',
        'Watch for signs of shock'
      ]
    },
    choking: {
      title: 'Choking Response (Heimlich Maneuver)',
      steps: [
        'Ask "Are you choking?" and if they can speak or cough',
        'If unable to speak/cough, stand behind them',
        'Place fist just above their navel',
        'Grasp fist with other hand',
        'Give quick upward abdominal thrusts',
        'Repeat until object is expelled or person becomes unconscious'
      ],
      warnings: [
        'Do not slap person on back while standing',
        'If person becomes unconscious, lower to ground and begin CPR',
        'For infants, use back blows and chest thrusts instead'
      ]
    },
    shock_position: {
      title: 'Shock Recovery Position',
      steps: [
        'Lay person flat on their back',
        'Raise legs above heart level (about 12 inches)',
        'Do not raise legs if fractures are suspected',
        'Loosen tight clothing',
        'Keep person warm with blanket or coat',
        'Do not give food or drink',
        'Monitor breathing until help arrives'
      ],
      warnings: [
        'Do not move person if spinal injury is suspected',
        'Watch for changes in consciousness',
        'Be prepared to perform CPR if needed'
      ]
    },
    burn_treatment: {
      title: 'Burn Treatment',
      steps: [
        'Remove from source of burn immediately',
        'Cool burn with cool (not cold) running water for 10-20 minutes',
        'Do not use ice, butter, or toothpaste on burns',
        'Remove jewelry or tight clothing near burn',
        'Cover with clean, non-stick bandage or cloth',
        'Do not break blisters'
      ],
      warnings: [
        'For electrical burns, do not touch person until safe',
        'For chemical burns, continue rinsing for longer periods',
        'Seek immediate medical attention for severe burns'
      ]
    }
  },
  
  // Triage questions for symptom assessment
  triageQuestions: [
    {
      id: 'consciousness',
      category: 'general',
      question: 'Is the person conscious and responsive?',
      criticality_indicator: true,
      triage_impact: {
        immediate: -50,
        deceased: -100
      }
    },
    {
      id: 'breathing',
      category: 'respiratory',
      question: 'Is the person breathing normally?',
      criticality_indicator: true,
      triage_impact: {
        immediate: -60
      }
    },
    {
      id: 'chest_pain',
      category: 'cardiovascular',
      question: 'Is the person experiencing chest pain or discomfort?',
      criticality_indicator: true,
      triage_impact: {
        immediate: -40,
        urgent: -30
      }
    },
    {
      id: 'bleeding',
      category: 'trauma',
      question: 'Is there severe or uncontrolled bleeding?',
      criticality_indicator: true,
      triage_impact: {
        immediate: -50
      }
    },
    {
      id: 'consciousness_change',
      category: 'neurological',
      question: 'Has there been a change in consciousness or confusion?',
      criticality_indicator: true,
      triage_impact: {
        immediate: -30,
        urgent: -40
      }
    },
    {
      id: 'breathing_difficulty',
      category: 'respiratory',
      question: 'Is the person having difficulty breathing?',
      criticality_indicator: true,
      triage_impact: {
        immediate: -40,
        urgent: -30
      }
    }
  ],
  
  // Display configuration
  display: {
    symptomCategoryIcons: {
      cardiovascular: 'heart',
      respiratory: 'wind',
      neurological: 'brain',
      trauma: 'activity',
      environmental: 'sun',
      toxicological: 'flask-conical',
      infectious: 'virus',
      allergic: 'alert-triangle',
      psychiatric: 'brain',
      pediatric: 'baby',
      geriatric: 'user',
      obstetric: 'heart-pulse',
      general: 'stethoscope'
    },
    actionTypeIcons: {
      assessment: 'search',
      compression: 'hand',
      airway: 'wind',
      bleeding_control: 'droplet',
      splinting: 'minimize',
      cooling: 'snowflake',
      warming: 'flame',
      positioning: 'move',
      medication_guidance: 'pill',
      monitoring: 'eye',
      evacuation_guidance: 'map',
      call_emergency_services: 'phone'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getTriageLevelInfo(level: TriageLevel) {
  return triageConfig.triageLevels[level];
}

export function calculateInitialTriage(
  responses: Record<string, UserResponse>
): { level: TriageLevel; score: number } {
  let score = 0;
  
  // Critical questions
  if (responses.consciousness === 'no' || responses.consciousness === 'unable_to_answer') {
    score += 100;
  }
  
  if (responses.breathing === 'absent') {
    score += 100;
  } else if (responses.breathing === 'labored') {
    score += 50;
  }
  
  if (responses.chest_pain === 'yes') {
    score += 50;
  }
  
  if (responses.bleeding === 'severe') {
    score += 60;
  } else if (responses.bleeding === 'minor') {
    score += 20;
  }
  
  if (responses.consciousness_change === 'yes') {
    score += 40;
  }
  
  if (responses.breathing_difficulty === 'yes') {
    score += 40;
  }
  
  // Determine triage level based on score
  let level: TriageLevel;
  if (score >= 80) {
    level = 'immediate';
  } else if (score >= 50) {
    level = 'urgent';
  } else if (score >= 25) {
    level = 'delayed';
  } else {
    level = 'minimal';
  }
  
  return { level, score: Math.min(score, 100) };
}

export function getFirstAidInstructions(
  triageLevel: TriageLevel,
  symptoms: string[]
): FirstAidInstruction[] {
  const instructions: FirstAidInstruction[] = [];
  
  // Always include initial assessment for non-minimal cases
  if (triageLevel !== 'minimal') {
    instructions.push({
      id: 'initial_assessment',
      action_type: 'assessment',
      title: 'Initial Assessment',
      description: 'Quickly evaluate the situation before providing aid',
      steps: [
        'Ensure safety - check for dangers to yourself and victim',
        'Introduce yourself and ask for permission to help',
        'Quickly assess consciousness and breathing',
        'Call for emergency services if needed'
      ],
      warnings: [
        'Do not put yourself in danger',
        'Do not move victim unless absolutely necessary'
      ],
      is_critical: true,
      priority_order: 1
    });
  }
  
  // CPR instructions if unconscious/not breathing
  if (triageLevel === 'immediate') {
    const cpr = triageConfig.firstAidTemplates.cpr;
    instructions.push({
      id: 'cpr_instruction',
      action_type: 'compression',
      title: cpr.title,
      description: cpr.steps[0],
      steps: cpr.steps,
      warnings: cpr.warnings,
      is_critical: true,
      priority_order: 2
    });
    
    instructions.push({
      id: 'call_emergency',
      action_type: 'call_emergency_services',
      title: 'Call Emergency Services',
      description: 'Ensure professional medical help is on the way',
      steps: [
        'Call local emergency number immediately',
        'Provide exact location',
        'Describe the emergency',
        'Follow dispatcher instructions'
      ],
      warnings: [
        'Do not hang up until told to do so'
      ],
      is_critical: true,
      priority_order: 1
    });
  }
  
  // Bleeding control instructions
  if (symptoms.some(s => s.includes('bleeding') || s.includes('wound'))) {
    const bleeding = triageConfig.firstAidTemplates.bleeding_control;
    instructions.push({
      id: 'bleeding_control',
      action_type: 'bleeding_control',
      title: bleeding.title,
      description: bleeding.steps[0],
      steps: bleeding.steps,
      warnings: bleeding.warnings,
      is_critical: true,
      priority_order: 2
    });
  }
  
  // Choking instructions
  if (symptoms.some(s => s.includes('choking') || s.includes('airway'))) {
    const choking = triageConfig.firstAidTemplates.choking;
    instructions.push({
      id: 'choking_response',
      action_type: 'airway',
      title: choking.title,
      description: choking.steps[0],
      steps: choking.steps,
      warnings: choking.warnings,
      is_critical: true,
      priority_order: 2
    });
  }
  
  // Shock position
  if (triageLevel === 'immediate' || triageLevel === 'urgent') {
    const shock = triageConfig.firstAidTemplates.shock_position;
    instructions.push({
      id: 'shock_position',
      action_type: 'positioning',
      title: shock.title,
      description: shock.steps[0],
      steps: shock.steps,
      warnings: shock.warnings,
      is_critical: false,
      priority_order: 3
    });
  }
  
  // Burn treatment
  if (symptoms.some(s => s.includes('burn'))) {
    const burn = triageConfig.firstAidTemplates.burn_treatment;
    instructions.push({
      id: 'burn_treatment',
      action_type: 'cooling',
      title: burn.title,
      description: burn.steps[0],
      steps: burn.steps,
      warnings: burn.warnings,
      is_critical: true,
      priority_order: 2
    });
  }
  
  // Monitoring instruction for all
  instructions.push({
    id: 'monitoring',
    action_type: 'monitoring',
    title: 'Monitor Victim',
    description: 'Continuously monitor the person until help arrives',
    steps: [
      'Watch for changes in breathing',
      'Check consciousness level periodically',
      'Keep person comfortable and still',
      'Be prepared to perform CPR if needed'
    ],
    warnings: [
      'Do not leave victim alone',
      'Watch for improvements or deteriorations'
    ],
    is_critical: false,
    priority_order: instructions.length + 1
  });
  
  return instructions.sort((a, b) => a.priority_order - b.priority_order);
}

export function formatPainLevel(level: number): { label: string; color: string } {
  if (level <= 2) {
    return { label: 'Mild', color: '#22c55e' };
  }
  if (level <= 5) {
    return { label: 'Moderate', color: '#eab308' };
  }
  if (level <= 7) {
    return { label: 'Moderate-Severe', color: '#f97316' };
  }
  return { label: 'Severe', color: '#ef4444' };
}

export function getConsciousnessLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    alert: 'Alert and responsive',
    responsive_to_voice: 'Responds to voice',
    responsive_to_voice: 'Responds to pain only',
    unresponsive: 'Unresponsive'
  };
  return labels[level] || level;
}

export function isCriticalSymptom(symptom: string): boolean {
  return triageConfig.criticalSymptoms.some(
    critical => symptom.toLowerCase().includes(critical)
  );
}

export function prioritizeMedicalFacilities(
  facilities: MedicalFacility[],
  triageLevel: TriageLevel,
  userLocation: { lat: number; lng: number }
): MedicalFacility[] {
  return [...facilities]
    .filter(f => {
      if (triageLevel === 'immediate') {
        return f.accepts_emergency && f.trauma_level !== undefined;
      }
      return true;
    })
    .sort((a, b) => {
      // First, filter by capability
      const aScore = getFacilityScore(a, triageLevel);
      const bScore = getFacilityScore(b, triageLevel);
      
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      
      // Then sort by distance
      const aDist = a.distance_km || 0;
      const bDist = b.distance_km || 0;
      return aDist - bDist;
    });
}

function getFacilityScore(facility: MedicalFacility, triageLevel: TriageLevel): number {
  let score = 0;
  
  // Emergency capability
  if (facility.accepts_emergency) score += 50;
  
  // Trauma level (lower is better)
  if (facility.trauma_level) {
    score += (4 - parseInt(facility.trauma_level)) * 10;
  }
  
  // 24-hour availability
  if (facility.is_24_hours) score += 20;
  
  // Type match
  if (facility.type === 'hospital' && triageLevel === 'immediate') {
    score += 30;
  }
  
  return score;
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Create a new triage session
 */
export async function createTriageSession(
  session: Omit<TriageSession, 'id' | 'started_at'>
): Promise<TriageSession> {
  const { data, error } = await supabase
    .from('triage_sessions')
    .insert({
      user_id: session.user_id,
      status: session.status,
      symptom_onset: session.symptom_onset?.toISOString(),
      pain_assessment: session.pain_assessment,
      consciousness_assessment: session.consciousness_assessment,
      breathing_assessment: session.breathing_assessment,
      bleeding_assessment: session.bleeding_assessment
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create triage session: ${error.message}`);
  
  return data;
}

/**
 * Get triage session by ID
 */
export async function getTriageSession(
  sessionId: string
): Promise<TriageSession | null> {
  const { data, error } = await supabase
    .from('triage_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch triage session: ${error.message}`);
  }
  
  return data;
}

/**
 * Update triage session
 */
export async function updateTriageSession(
  sessionId: string,
  updates: Partial<TriageSession>
): Promise<void> {
  const { error } = await supabase
    .from('triage_sessions')
    .update({
      ...updates,
      completed_at: updates.completed_at?.toISOString()
    })
    .eq('id', sessionId);
  
  if (error) throw new Error(`Failed to update session: ${error.message}`);
}

/**
 * Create symptom assessment
 */
export async function createSymptomAssessment(
  assessment: Omit<SymptomAssessment, 'id' | 'created_at'>
): Promise<SymptomAssessment> {
  const { data, error } = await supabase
    .from('symptom_assessments')
    .insert({
      session_id: assessment.session_id,
      user_id: assessment.user_id,
      reported_symptoms: assessment.reported_symptoms,
      symptom_onset: assessment.symptom_onset.toISOString(),
      symptom_duration: assessment.symptom_duration,
      pain_level: assessment.pain_level,
      consciousness_level: assessment.consciousness_level,
      breathing_status: assessment.breathing_status,
      bleeding_status: assessment.bleeding_status,
      triage_level: assessment.triage_level,
      confidence_score: assessment.confidence_score,
      assessment_notes: assessment.assessment_notes,
      emergency_services_dispatched: assessment.emergency_services_dispatched
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create assessment: ${error.message}`);
  
  return data;
}

/**
 * Get medical facilities nearby
 */
export async function getNearbyMedicalFacilities(
  location: { lat: number; lng: number },
  radiusKm: number = 50,
  type?: MedicalFacility['type']
): Promise<MedicalFacility[]> {
  const minLat = location.lat - (radiusKm / 111);
  const maxLat = location.lat + (radiusKm / 111);
  const minLng = location.lng - (radiusKm / (111 * Math.cos(toRad(location.lat))));
  const maxLng = location.lng + (radiusKm / (111 * Math.cos(toRad(location.lat))));
  
  let query = supabase
    .from('medical_facilities')
    .select('*')
    .gte('location->lat', minLat)
    .lte('location->lat', maxLat)
    .gte('location->lng', minLng)
    .lte('location->lng', maxLng);
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch facilities: ${error.message}`);
  
  // Calculate distances and sort
  return (data || []).map(facility => ({
    ...facility,
    distance_km: calculateDistance(location, facility.location)
  })).sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
}

/**
 * Record triage outcome
 */
export async function recordTriageOutcome(
  outcome: Omit<TriageHistory, 'id' | 'created_at'>
): Promise<TriageHistory> {
  const { data, error } = await supabase
    .from('triage_history')
    .insert({
      session_id: outcome.session_id,
      user_id: outcome.user_id,
      triage_level: outcome.triage_level,
      symptoms_reported: outcome.symptoms_reported,
      actions_taken: outcome.actions_taken,
      outcome: outcome.outcome,
      feedback_rating: outcome.feedback_rating
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to record outcome: ${error.message}`);
  
  return data;
}

/**
 * Get user's triage history
 */
export async function getUserTriageHistory(
  userId: string,
  limit: number = 20
): Promise<TriageHistory[]> {
  const { data, error } = await supabase
    .from('triage_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw new Error(`Failed to fetch history: ${error.message}`);
  
  return data || [];
}

/**
 * Get triage analytics
 */
export async function getTriageAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<TriageAnalytics> {
  let query = supabase
    .from('symptom_assessments')
    .select('triage_level, emergency_services_dispatched, created_at');
  
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch analytics: ${error.message}`);
  
  const assessments = data || [];
  
  // Calculate distribution
  const distribution: Record<string, number> = {};
  assessments.forEach(a => {
    distribution[a.triage_level] = (distribution[a.triage_level] || 0) + 1;
  });
  
  // Count emergency dispatches
  const emergencyCount = assessments.filter(a => a.emergency_services_dispatched).length;
  
  return {
    total_sessions: assessments.length,
    triage_distribution: distribution as Record<TriageLevel, number>,
    average_session_duration_seconds: 0, // Would need session data
    emergency_services_dispatched: emergencyCount,
    user_satisfaction_score: 0, // Would need feedback data
    common_symptoms: [], // Would need aggregation
    response_time_metrics: {
      time_to_triage: 0,
      time_to_action: 0
    }
  };
}

/**
 * Dispatch emergency services
 */
export async function dispatchEmergencyServices(
  sessionId: string,
  location: { lat: number; lng: number },
  triageLevel: TriageLevel
): Promise<void> {
  // Update session status
  await updateTriageSession(sessionId, {
    status: 'escalated',
    escalation_reason: `Emergency services dispatched - ${triageLevel}`
  });
  
  // Create dispatch record
  const { error } = await supabase
    .from('emergency_dispatches')
    .insert({
      triage_session_id: sessionId,
      location: location,
      priority: triageLevel,
      dispatched_at: new Date().toISOString()
    });
  
  if (error) throw new Error(`Failed to dispatch: ${error.message}`);
}

/**
 * Get triage questions
 */
export async function getTriageQuestions(
  category?: SymptomCategory
): Promise<TriageQuestion[]> {
  let query = supabase
    .from('triage_questions')
    .select('*');
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch questions: ${error.message}`);
  
  return data || [];
}

/**
 * Save first aid instruction
 */
export async function saveFirstAidInstruction(
  instruction: FirstAidInstruction
): Promise<void> {
  const { error } = await supabase
    .from('first_aid_instructions')
    .upsert({
      id: instruction.id,
      action_type: instruction.action_type,
      title: instruction.title,
      description: instruction.description,
      steps: instruction.steps,
      warnings: instruction.warnings,
      duration_seconds: instruction.duration_seconds,
      equipment_needed: instruction.equipment_needed,
      video_url: instruction.video_url,
      image_url: instruction.image_url,
      is_critical: instruction.is_critical,
      priority_order: instruction.priority_order
    });
  
  if (error) throw new Error(`Failed to save instruction: ${error.message}`);
}

/**
 * Get user's ongoing sessions
 */
export async function getActiveUserSessions(
  userId: string
): Promise<TriageSession[]> {
  const { data, error } = await supabase
    .from('triage_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch sessions: ${error.message}`);
  
  return data || [];
}

// ============================================================================
// Utility Functions
// ============================================================================

export function calculateDistance(
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lng - loc1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getSymptomCategoryIcon(category: SymptomCategory): string {
  return triageConfig.display.symptomCategoryIcons[category] || 'stethoscope';
}

export function getActionTypeIcon(actionType: FirstAidActionType): string {
  return triageConfig.display.actionTypeIcons[actionType] || 'first-aid';
}

export function formatTriageDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function getTriageTimeEstimate(level: TriageLevel): string {
  return triageConfig.triageLevels[level]?.response_time || 'Varies';
}
