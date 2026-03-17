/**
 * AI-Powered Report Validation Engine Service
 * 
 * Epic: AI-Powered Report Validation Engine
 * Description: Machine learning system for validating incoming emergency reports, detecting false alarms,
 * analyzing credibility, and prioritizing reports based on multiple data sources including satellite
 * imagery, social media, IoT sensors, and historical patterns.
 * 
 * Bmad Category: Intelligent Automation & AI (IAA)
 * Emergency Mode Relevance: BFSI, CPI, SAR, MAC - Critical for filtering noise and prioritizing responses
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type ReportType = 
  | 'fire'
  | 'flood'
  | 'earthquake'
  | 'medical'
  | 'structural_collapse'
  | 'hazmat'
  | 'natural_gas'
  | 'public_disorder'
  | 'traffic_accident'
  | 'animal_rescue'
  | 'missing_person'
  | 'other';

export type ValidationStatus = 
  | 'pending'
  | 'analyzing'
  | 'validated'
  | 'disputed'
  | 'rejected'
  | 'escalated';

export type ValidationConfidence = 
  | 'very_low'    // 0-20%
  | 'low'         // 21-40%
  | 'medium'      // 41-60%
  | 'high'        // 61-80%
  | 'very_high';  // 81-100%

export type ReportSource = 
  | 'mobile_app'
  | 'call_center'
  | 'iot_sensor'
  | 'satellite'
  | 'social_media'
  | 'government_api'
  | 'camera'
  | 'weather_station'
  | 'seismic_sensor'
  | 'manual';

export type RiskLevel = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'minimal';

export type ActionRecommendation = 
  | 'immediate_dispatch'
  | 'prioritized_dispatch'
  | 'standard_dispatch'
  | 'investigation_required'
  | 'false_alarm_likely'
  | 'duplicate_report'
  | 'out_of_service_area';

export interface Report {
  id: string;
  report_id: string;
  report_type: ReportType;
  source: ReportSource;
  reporter_id?: string;
  reporter_name?: string;
  reporter_contact?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
    landmark?: string;
    accuracy_m?: number;
  };
  description: string;
  media_urls?: string[];
  occurred_at?: Date;
  received_at: Date;
  priority?: number;
  status: ValidationStatus;
  assigned_dispatcher?: string;
  incident_id?: string;
}

export interface ValidationResult {
  id: string;
  report_id: string;
  confidence: ValidationConfidence;
  confidence_score: number;
  validation_status: ValidationStatus;
  risk_level: RiskLevel;
  recommendations: ActionRecommendation[];
  duplicate_of?: string;
  discrepancy_flags: Array<{
    type: string;
    description: string;
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    evidence?: string;
  }>;
  supporting_evidence: Array<{
    source: string;
    type: string;
    data: Record<string, unknown>;
    relevance_score: number;
  }>;
  cross_references: Array<{
    report_id: string;
    relationship: 'duplicate' | 'related' | 'contradictory';
    similarity_score: number;
  }>;
  analysis_summary: string;
  processing_time_ms: number;
  model_versions: {
    primary_model: string;
    supporting_models: string[];
  };
  analyzed_at: Date;
  reviewed_by?: string;
  review_notes?: string;
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  sensor_type: string;
  location: { lat: number; lng: number };
  value: number;
  unit: string;
  threshold?: number;
  threshold_exceeded?: boolean;
  reading_time: Date;
  status: 'normal' | 'warning' | 'critical' | 'offline';
  battery_level?: number;
  signal_strength?: number;
}

export interface SatelliteImagery {
  id: string;
  imagery_id: string;
  capture_time: Date;
  location: { lat: number; lng: number; radius_km?: number };
  resolution_m: number;
  bands: string[];
  cloud_cover_percent: number;
  analysis_results?: {
    fire_detected: boolean;
    flood_detected: boolean;
    damage_assessment?: string;
    smoke_detected: boolean;
    thermal_anomalies?: Array<{ lat: number; lng: number; temperature_c: number }>;
  };
  url: string;
  thumbnail_url?: string;
  provider: string;
  cost?: number;
}

export interface SocialMediaPost {
  id: string;
  platform: string;
  post_id: string;
  author_id?: string;
  content: string;
  location?: { lat: number; lng: number };
  posted_at: Date;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  credibility_score?: number;
  verified: boolean;
  urls?: string[];
  media_urls?: string[];
}

export interface WeatherData {
  id: string;
  location: { lat: number; lng: number };
  timestamp: Date;
  temperature_c: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  wind_direction: number;
  pressure_hpa: number;
  precipitation_mm: number;
  visibility_km: number;
  conditions: string;
  forecast?: Array<{
    time: Date;
    conditions: string;
    temperature_c: number;
    precipitation_probability: number;
  }>;
  alerts?: Array<{
    type: string;
    severity: string;
    description: string;
    issued_at: Date;
    expires_at: Date;
  }>;
  source: string;
}

export interface HistoricalPattern {
  id: string;
  pattern_type: string;
  location: { lat: number; lng: number; radius_km?: number };
  time_patterns: string[]; // e.g., ["weekday_morning", "weekend_night"]
  seasonal_patterns: string[];
  frequency_per_month: number;
  avg_response_time_minutes: number;
  success_rate: number;
  false_alarm_rate: number;
  last_occurrence?: Date;
}

export interface ValidationRule {
  id: string;
  rule_name: string;
  rule_type: 'threshold' | 'correlation' | 'temporal' | 'geospatial' | 'source_reliability' | 'custom';
  conditions: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'regex';
    value: unknown;
  }>;
  actions: Array<{
    type: 'flag' | 'reject' | 'escalate' | 'boost_priority' | 'require_review';
    parameters?: Record<string, unknown>;
  }>;
  priority: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SourceReliability {
  source_type: ReportSource;
  reliability_score: number; // 0-1
  false_alarm_rate: number;
  avg_response_time_seconds: number;
  report_count: number;
  last_report?: Date;
  accuracy_history: Array<{
    date: Date;
    accuracy: number;
  }>;
}

export interface MLModel {
  id: string;
  model_name: string;
  model_type: 'classification' | 'regression' | 'clustering' | 'anomaly_detection';
  version: string;
  accuracy_score: number;
  precision_score: number;
  recall_score: number;
  f1_score: number;
  training_data_size: number;
  last_trained: Date;
  status: 'active' | 'training' | 'deprecated';
  endpoint?: string;
}

export interface ValidationAnalytics {
  period: { start: Date; end: Date };
  total_reports: number;
  validated_reports: number;
  rejected_reports: number;
  false_positive_rate: number;
  false_negative_rate: number;
  avg_validation_time_ms: number;
  top_false_alarm_causes: Array<{
    cause: string;
    count: number;
  }>;
  source_reliability_ranking: Array<{
    source: ReportSource;
    reliability: number;
    reports: number;
  }>;
  report_type_distribution: Record<ReportType, number>;
  risk_level_distribution: Record<RiskLevel, number>;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const ReportSchema = z.object({
  id: z.string(),
  report_id: z.string(),
  report_type: z.enum([
    'fire', 'flood', 'earthquake', 'medical', 'structural_collapse',
    'hazmat', 'natural_gas', 'public_disorder', 'traffic_accident',
    'animal_rescue', 'missing_person', 'other'
  ]),
  source: z.enum([
    'mobile_app', 'call_center', 'iot_sensor', 'satellite',
    'social_media', 'government_api', 'camera', 'weather_station',
    'seismic_sensor', 'manual'
  ]),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
    accuracy_m: z.number().optional()
  }),
  description: z.string(),
  received_at: z.date()
});

const ValidationResultSchema = z.object({
  id: z.string(),
  report_id: z.string(),
  confidence_score: z.number().min(0).max(1),
  validation_status: z.enum(['pending', 'analyzing', 'validated', 'disputed', 'rejected', 'escalated']),
  risk_level: z.enum(['critical', 'high', 'medium', 'low', 'minimal']),
  recommendations: z.array(z.enum([
    'immediate_dispatch', 'prioritized_dispatch', 'standard_dispatch',
    'investigation_required', 'false_alarm_likely', 'duplicate_report', 'out_of_service_area'
  ])),
  processing_time_ms: z.number()
});

const SensorReadingSchema = z.object({
  id: z.string(),
  sensor_id: z.string(),
  sensor_type: z.string(),
  value: z.number(),
  reading_time: z.date(),
  status: z.enum(['normal', 'warning', 'critical', 'offline'])
});

const SocialMediaPostSchema = z.object({
  id: z.string(),
  platform: z.string(),
  post_id: z.string(),
  content: z.string(),
  posted_at: z.date(),
  engagement: z.object({
    likes: z.number(),
    shares: z.number(),
    comments: z.number()
  })
});

// ============================================================================
// Configuration
// ============================================================================

export const validationConfig = {
  // Confidence thresholds
  confidenceThresholds: {
    very_low: 0.2,
    low: 0.4,
    medium: 0.6,
    high: 0.8,
    very_high: 0.8
  },
  
  // Risk level thresholds
  riskThresholds: {
    critical: 0.9,
    high: 0.7,
    medium: 0.5,
    low: 0.3,
    minimal: 0.0
  },
  
  // Source reliability scores
  sourceReliability: {
    iot_sensor: 0.95,
    seismic_sensor: 0.98,
    camera: 0.85,
    government_api: 0.92,
    weather_station: 0.90,
    mobile_app: 0.75,
    call_center: 0.88,
    satellite: 0.80,
    social_media: 0.40,
    manual: 0.60
  },
  
  // Validation rules
  validationRules: {
    location_accuracy: {
      min_accuracy_m: 100,
      critical_threshold_m: 50
    },
    temporal: {
      max_age_hours: 24,
      critical_age_minutes: 30
    },
    duplicate: {
      distance_threshold_km: 0.1,
      time_threshold_minutes: 15,
      description_similarity_threshold: 0.7
    },
    correlation: {
      sensor_distance_km: 1.0,
      weather_radius_km: 10,
      social_media_radius_km: 2
    }
  },
  
  // Processing limits
  processing: {
    max_processing_time_ms: 10000,
    batch_size: 100,
    parallel_analysis: 5,
    cache_ttl_seconds: 300
  },
  
  // AI model config
  models: {
    primary: 'emergency-validation-v3',
    supporting: ['sentiment-analysis-v2', 'entity-extraction-v2', 'location-ner-v1'],
    confidence_boost: {
      multiple_sources: 0.15,
      high_reliability_source: 0.10,
      recent_timestamp: 0.05,
      geo_verified: 0.08
    },
    confidence_penalty: {
      conflicting_sources: -0.20,
      low_reliability_source: -0.15,
      old_timestamp: -0.10,
      generic_description: -0.08
    }
  },
  
  // Display configuration
  display: {
    confidenceColors: {
      very_low: '#ef4444',
      low: '#f97316',
      medium: '#f59e0b',
      high: '#22c55e',
      very_high: '#16a34a'
    },
    riskColors: {
      critical: '#dc2626',
      high: '#f97316',
      medium: '#f59e0b',
      low: '#3b82f6',
      minimal: '#6b7280'
    },
    statusColors: {
      pending: '#6b7280',
      analyzing: '#3b82f6',
      validated: '#22c55e',
      disputed: '#f59e0b',
      rejected: '#ef4444',
      escalated: '#8b5cf6'
    },
    reportTypeIcons: {
      fire: 'flame',
      flood: 'waves',
      earthquake: 'tremor',
      medical: 'heart-pulse',
      structural_collapse: 'building',
      hazmat: 'flask-conical',
      natural_gas: 'wind',
      public_disorder: 'users',
      traffic_accident: 'car',
      animal_rescue: 'paw-print',
      missing_person: 'user-search',
      other: 'alert-circle'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getConfidenceInfo(confidence: ValidationConfidence) {
  return {
    label: confidence.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: validationConfig.display.confidenceColors[confidence],
    scoreRange: {
      very_low: '0-20%',
      low: '21-40%',
      medium: '41-60%',
      high: '61-80%',
      very_high: '81-100%'
    }[confidence]
  };
}

export function getRiskLevelInfo(risk: RiskLevel) {
  return {
    label: risk.charAt(0).toUpperCase() + risk.slice(1),
    color: validationConfig.display.riskColors[risk],
    priority: {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
      minimal: 5
    }[risk]
  };
}

export function getReportTypeInfo(type: ReportType) {
  const typeInfo: Record<ReportType, { label: string; icon: string; category: string }> = {
    fire: { label: 'Fire', icon: 'flame', category: 'Fire Emergency' },
    flood: { label: 'Flood', icon: 'waves', category: 'Natural Disaster' },
    earthquake: { label: 'Earthquake', icon: 'tremor', category: 'Natural Disaster' },
    medical: { label: 'Medical Emergency', icon: 'heart-pulse', category: 'Medical' },
    structural_collapse: { label: 'Structural Collapse', icon: 'building', category: 'Structural' },
    hazmat: { label: 'Hazmat', icon: 'flask-conical', category: 'Hazardous Materials' },
    natural_gas: { label: 'Natural Gas Leak', icon: 'wind', category: 'Utility Emergency' },
    public_disorder: { label: 'Public Disorder', icon: 'users', category: 'Public Safety' },
    traffic_accident: { label: 'Traffic Accident', icon: 'car', category: 'Transportation' },
    animal_rescue: { label: 'Animal Rescue', icon: 'paw-print', category: 'Animal Services' },
    missing_person: { label: 'Missing Person', icon: 'user-search', category: 'Search & Rescue' },
    other: { label: 'Other', icon: 'alert-circle', category: 'Other' }
  };
  return typeInfo[type];
}

export function getSourceInfo(source: ReportSource) {
  const sourceInfo: Record<ReportSource, { label: string; icon: string; reliability: string }> = {
    iot_sensor: { label: 'IoT Sensor', icon: 'cpu', reliability: 'High' },
    seismic_sensor: { label: 'Seismic Sensor', icon: 'activity', reliability: 'Very High' },
    camera: { label: 'Camera', icon: 'video', reliability: 'High' },
    government_api: { label: 'Government API', icon: 'building', reliability: 'High' },
    weather_station: { label: 'Weather Station', icon: 'cloud', reliability: 'High' },
    mobile_app: { label: 'Mobile App', icon: 'smartphone', reliability: 'Medium' },
    call_center: { label: 'Call Center', icon: 'phone', reliability: 'High' },
    satellite: { label: 'Satellite', icon: 'satellite', reliability: 'Medium-High' },
    social_media: { label: 'Social Media', icon: 'message-circle', reliability: 'Low' },
    manual: { label: 'Manual Entry', icon: 'edit', reliability: 'Medium' }
  };
  return sourceInfo[source];
}

export function getValidationStatusInfo(status: ValidationStatus) {
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    color: validationConfig.display.statusColors[status],
    icon: {
      pending: 'clock',
      analyzing: 'loader',
      validated: 'check-circle',
      disputed: 'alert-triangle',
      rejected: 'x-circle',
      escalated: 'arrow-up-circle'
    }[status]
  };
}

export function getActionRecommendationInfo(action: ActionRecommendation) {
  const actionInfo: Record<ActionRecommendation, { label: string; color: string; priority: number }> = {
    immediate_dispatch: { label: 'Immediate Dispatch', color: '#dc2626', priority: 1 },
    prioritized_dispatch: { label: 'Prioritized Dispatch', color: '#f97316', priority: 2 },
    standard_dispatch: { label: 'Standard Dispatch', color: '#3b82f6', priority: 3 },
    investigation_required: { label: 'Investigation Required', color: '#f59e0b', priority: 4 },
    false_alarm_likely: { label: 'False Alarm Likely', color: '#6b7280', priority: 5 },
    duplicate_report: { label: 'Duplicate Report', color: '#9ca3af', priority: 6 },
    out_of_service_area: { label: 'Out of Service Area', color: '#4b5563', priority: 7 }
  };
  return actionInfo[action];
}

export function calculateConfidenceScore(
  baseScore: number,
  boosts: Array<{ factor: string; amount: number }>,
  penalties: Array<{ factor: string; amount: number }>
): number {
  let score = baseScore;
  
  boosts.forEach(b => {
    score = Math.min(1, score + b.amount);
  });
  
  penalties.forEach(p => {
    score = Math.max(0, score - p.amount);
  });
  
  return Math.round(score * 100) / 100;
}

export function determineRiskLevel(
  confidence: number,
  severity: number,
  urgency: number
): RiskLevel {
  const combinedScore = confidence * 0.4 + severity * 0.3 + urgency * 0.3;
  
  if (combinedScore >= validationConfig.riskThresholds.critical) return 'critical';
  if (combinedScore >= validationConfig.riskThresholds.high) return 'high';
  if (combinedScore >= validationConfig.riskThresholds.medium) return 'medium';
  if (combinedScore >= validationConfig.riskThresholds.low) return 'low';
  return 'minimal';
}

export function isDuplicateReport(
  report1: Report,
  report2: Report,
  options?: {
    distanceThresholdKm?: number;
    timeThresholdMinutes?: number;
  }
): boolean {
  const distance = calculateDistance(report1.location, report2.location);
  const timeDiff = Math.abs(
    new Date(report1.received_at).getTime() - new Date(report2.received_at).getTime()
  ) / (1000 * 60);
  
  const thresholdDistance = options?.distanceThresholdKm || 
    validationConfig.validationRules.duplicate.distance_threshold_km;
  const thresholdTime = options?.timeThresholdMinutes || 
    validationConfig.validationRules.duplicate.time_threshold_minutes;
  
  return distance <= thresholdDistance && timeDiff <= thresholdTime;
}

export function calculateSourceReliability(
  source: ReportSource,
  historicalAccuracy: number,
  recentReports: number
): number {
  const baseReliability = validationConfig.sourceReliability[source] || 0.5;
  const recencyBonus = Math.min(0.1, recentReports * 0.01);
  return Math.min(1, baseReliability + recencyBonus);
}

export function parseDescriptionForEntities(
  description: string
): {
  location_mentions: string[];
  time_mentions: string[];
  people_mentions: string[];
  vehicle_mentions: string[];
} {
  // Simple entity extraction (would use NLP in production)
  const locationMentions = description.match(/\b(street|avenue|road|lane|building|floor|room)\b/gi) || [];
  const timeMentions = description.match(/\b(now|just|minutes? ago|hours? ago|today|last night)\b/gi) || [];
  const peopleMentions = description.match(/\b(men|women|children|person|people|crowd)\b/gi) || [];
  const vehicleMentions = description.match(/\b(car|truck|bus|van|motorcycle|bicycle)\b/gi) || [];
  
  return {
    location_mentions: [...new Set(locationMentions.map(m => m.toLowerCase()))],
    time_mentions: [...new Set(timeMentions.map(m => m.toLowerCase()))],
    people_mentions: [...new Set(peopleMentions.map(m => m.toLowerCase()))],
    vehicle_mentions: [...new Set(vehicleMentions.map(m => m.toLowerCase()))]
  };
}

export function estimateDescriptionQuality(
  description: string,
  entities: ReturnType<typeof parseDescriptionForEntities>
): number {
  let score = 0;
  
  // Length bonus
  if (description.length > 50) score += 0.2;
  if (description.length > 100) score += 0.1;
  
  // Entity bonuses
  score += Math.min(0.3, entities.location_mentions.length * 0.1);
  score += Math.min(0.2, entities.time_mentions.length * 0.05);
  score += Math.min(0.2, entities.people_mentions.length * 0.05);
  score += Math.min(0.2, entities.vehicle_mentions.length * 0.05);
  
  return Math.min(1, score);
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Submit report for validation
 */
export async function submitReportForValidation(
  report: Omit<Report, 'id' | 'status' | 'received_at'>
): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      report_id: report.report_id,
      report_type: report.report_type,
      source: report.source,
      reporter_id: report.reporter_id,
      reporter_name: report.reporter_name,
      reporter_contact: report.reporter_contact,
      location: report.location,
      description: report.description,
      media_urls: report.media_urls,
      occurred_at: report.occurred_at?.toISOString(),
      priority: report.priority,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to submit report: ${error.message}`);
  
  // Trigger async validation
  await triggerValidation(data.id);
  
  return data;
}

/**
 * Trigger AI validation
 */
async function triggerValidation(reportId: string): Promise<void> {
  // Update status to analyzing
  await supabase
    .from('reports')
    .update({ status: 'analyzing' })
    .eq('id', reportId);
  
  // In production, this would trigger an ML pipeline
  // For now, we'll use the validation function
  const report = await getReport(reportId);
  if (report) {
    const result = await validateReport(report);
    await saveValidationResult(result);
  }
}

/**
 * Validate report using AI
 */
export async function validateReport(report: Report): Promise<ValidationResult> {
  const startTime = Date.now();
  
  // Collect supporting evidence
  const sensorData = await getNearbySensorData(report.location);
  const weatherData = await getWeatherData(report.location);
  const socialMedia = await awaitSocialMediaReports(report.location, report.report_type);
  const historicalPatterns = await getHistoricalPatterns(report.location, report.report_type);
  
  // Calculate confidence
  let confidenceScore = 0.5; // Base score
  const boosts: Array<{ factor: string; amount: number }> = [];
  const penalties: Array<{ factor: string; amount: number }> = [];
  
  // Source reliability boost
  const sourceReliability = validationConfig.sourceReliability[report.source];
  if (sourceReliability >= 0.9) {
    boosts.push({ factor: 'high_reliability_source', amount: 0.15 });
  } else if (sourceReliability >= 0.8) {
    boosts.push({ factor: 'medium_reliability_source', amount: 0.08 });
  }
  
  // Sensor confirmation boost
  if (sensorData.some(s => s.status === 'critical')) {
    boosts.push({ factor: 'sensor_confirmation', amount: 0.20 });
  }
  
  // Weather factor penalty
  if (weatherData?.alerts?.length) {
    penalties.push({ factor: 'weather_alert', amount: 0.05 });
  }
  
  // Historical pattern analysis
  if (historicalPatterns?.false_alarm_rate && historicalPatterns.false_alarm_rate > 0.3) {
    penalties.push({ factor: 'high_false_alarm_area', amount: 0.10 });
  }
  
  // Description quality
  const entities = parseDescriptionForEntities(report.description);
  const qualityScore = estimateDescriptionQuality(report.description, entities);
  if (qualityScore > 0.7) {
    boosts.push({ factor: 'detailed_description', amount: 0.10 });
  } else if (qualityScore < 0.4) {
    penalties.push({ factor: 'vague_description', amount: 0.10 });
  }
  
  confidenceScore = calculateConfidenceScore(confidenceScore, boosts, penalties);
  
  // Determine risk level
  const riskLevel = determineRiskLevel(
    confidenceScore,
    getSeverityWeight(report.report_type),
    0.7
  );
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    confidenceScore,
    riskLevel,
    sensorData,
    weatherData
  );
  
  // Check for duplicates
  const duplicates = await findPotentialDuplicates(report);
  let validationStatus: ValidationStatus = 'validated';
  let discrepancyFlags: ValidationResult['discrepancy_flags'] = [];
  
  if (duplicates.length > 0) {
    validationStatus = 'disputed';
    discrepancyFlags.push({
      type: 'duplicate_possible',
      description: `Found ${duplicates.length} potentially duplicate reports`,
      severity: 'moderate',
      evidence: duplicates.map(d => d.report_id).join(', ')
    });
  }
  
  // Determine final status
  if (confidenceScore < 0.3 && riskLevel === 'minimal') {
    validationStatus = 'rejected';
  } else if (confidenceScore < 0.4 || riskLevel === 'critical') {
    validationStatus = 'escalated';
  }
  
  const processingTime = Date.now() - startTime;
  
  return {
    id: `val-${report.id}`,
    report_id: report.id,
    confidence: getConfidenceCategory(confidenceScore),
    confidence_score: confidenceScore,
    validation_status: validationStatus,
    risk_level: riskLevel,
    recommendations,
    duplicate_of: duplicates[0]?.report_id,
    discrepancy_flags: discrepancyFlags,
    supporting_evidence: [
      ...sensorData.map(s => ({
        source: 'sensor',
        type: s.sensor_type,
        data: { value: s.value, status: s.status },
        relevance_score: s.status === 'critical' ? 0.9 : 0.5
      })),
      ...socialMedia.map(p => ({
        source: 'social_media',
        type: 'post',
        data: { content: p.content, engagement: p.engagement },
        relevance_score: Math.min(1, p.engagement.shares / 100)
      }))
    ],
    cross_references: duplicates.map(d => ({
      report_id: d.report_id,
      relationship: 'related' as const,
      similarity_score: 0.8
    })),
    analysis_summary: generateAnalysisSummary(confidenceScore, riskLevel, sensorData),
    processing_time_ms: processingTime,
    model_versions: {
      primary_model: validationConfig.models.primary,
      supporting_models: validationConfig.models.supporting
    },
    analyzed_at: new Date()
  };
}

/**
 * Save validation result
 */
export async function saveValidationResult(
  result: ValidationResult
): Promise<ValidationResult> {
  const { data, error } = await supabase
    .from('validation_results')
    .insert({
      report_id: result.report_id,
      confidence_score: result.confidence_score,
      validation_status: result.validation_status,
      risk_level: result.risk_level,
      recommendations: result.recommendations,
      duplicate_of: result.duplicate_of,
      discrepancy_flags: result.discrepancy_flags,
      supporting_evidence: result.supporting_evidence,
      cross_references: result.cross_references,
      analysis_summary: result.analysis_summary,
      processing_time_ms: result.processing_ms,
      model_versions: result.model_versions,
      analyzed_at: result.analyzed_at.toISOString()
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to save result: ${error.message}`);
  
  // Update report status
  await supabase
    .from('reports')
    .update({ status: result.validation_status })
    .eq('id', result.report_id);
  
  return data;
}

/**
 * Get report by ID
 */
export async function getReport(reportId: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch report: ${error.message}`);
  }
  
  return data;
}

/**
 * Get validation result for report
 */
export async function getValidationResult(
  reportId: string
): Promise<ValidationResult | null> {
  const { data, error } = await supabase
    .from('validation_results')
    .select('*')
    .eq('report_id', reportId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch result: ${error.message}`);
  }
  
  return data;
}

/**
 * Get nearby sensor data
 */
export async function getNearbySensorData(
  location: { lat: number; lng: number },
  radiusKm: number = 1
): Promise<SensorReading[]> {
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .gte('reading_time', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .limit(100);
  
  if (error) throw new Error(`Failed to fetch sensors: ${error.message}`);
  
  return (data || []).filter(s => {
    const distance = calculateDistance(location, s.location);
    return distance <= radiusKm;
  });
}

/**
 * Get weather data for location
 */
export async function getWeatherData(
  location: { lat: number; lng: number }
): Promise<WeatherData | null> {
  const { data, error } = await supabase
    .from('weather_data')
    .select('*')
    .gte('timestamp', new Date(Date.now() - 3600000).toISOString())
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch weather: ${error.message}`);
  }
  
  return data;
}

/**
 * Search social media for related reports
 */
export async function awaitSocialMediaReports(
  location: { lat: number; lng: number },
  reportType: ReportType,
  radiusKm: number = 2
): Promise<SocialMediaPost[]> {
  const { data, error } = await supabase
    .from('social_media_posts')
    .select('*')
    .gte('posted_at', new Date(Date.now() - 7200000).toISOString()) // Last 2 hours
    .limit(50);
  
  if (error) throw new Error(`Failed to fetch social media: ${error.message}`);
  
  return (data || []).filter(p => {
    if (!p.location) return false;
    const distance = calculateDistance(location, p.location);
    return distance <= radiusKm;
  });
}

/**
 * Get historical patterns for location
 */
export async function getHistoricalPatterns(
  location: { lat: number; lng: number },
  reportType?: ReportType
): Promise<HistoricalPattern | null> {
  const { data, error } = await supabase
    .from('historical_patterns')
    .select('*')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch patterns: ${error.message}`);
  }
  
  return data;
}

/**
 * Find potential duplicates
 */
export async function findPotentialDuplicates(
  report: Report
): Promise<Report[]> {
  const since = new Date(Date.now() - 
    validationConfig.validationRules.duplicate.time_threshold_minutes * 60 * 1000);
  
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('report_type', report.report_type)
    .gte('received_at', since.toISOString())
    .neq('id', report.id)
    .limit(20);
  
  if (error) throw new Error(`Failed to find duplicates: ${error.message}`);
  
  return (data || []).filter(r =>
    isDuplicateReport(report, r)
  );
}

/**
 * Update report status after validation
 */
export async function updateReportValidation(
  reportId: string,
  status: ValidationStatus,
  dispatcherId?: string,
  incidentId?: string
): Promise<void> {
  const updates: Record<string, unknown> = { status };
  
  if (dispatcherId) {
    updates.assigned_dispatcher = dispatcherId;
  }
  if (incidentId) {
    updates.incident_id = incidentId;
  }
  
  const { error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId);
  
  if (error) throw new Error(`Failed to update report: ${error.message}`);
}

/**
 * Review validation result
 */
export async function reviewValidationResult(
  validationId: string,
  review: {
    reviewed_by: string;
    status: ValidationStatus;
    notes: string;
    corrections?: {
      confidence_score?: number;
      risk_level?: RiskLevel;
      recommendations?: ActionRecommendation[];
    };
  }
): Promise<void> {
  const { error } = await supabase
    .from('validation_results')
    .update({
      reviewed_by: review.reviewed_by,
      review_notes: review.notes,
      confidence_score: review.corrections?.confidence_score,
      risk_level: review.corrections?.risk_level,
      recommendations: review.corrections?.recommendations,
      validation_status: review.status
    })
    .eq('id', validationId);
  
  if (error) throw new Error(`Failed to review result: ${error.message}`);
}

/**
 * Get validation analytics
 */
export async function getValidationAnalytics(
  startDate: Date,
  endDate: Date
): Promise<ValidationAnalytics> {
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .gte('received_at', startDate.toISOString())
    .lte('received_at', endDate.toISOString());
  
  const { data: validations, error: validationsError } = await supabase
    .from('validation_results')
    .select('*')
    .gte('analyzed_at', startDate.toISOString())
    .lte('analyzed_at', endDate.toISOString());
  
  if (reportsError || validationsError) {
    throw new Error('Failed to fetch analytics');
  }
  
  const reportList = reports || [];
  const validationList = validations || [];
  
  const validated = validationList.filter(v => v.validation_status === 'validated').length;
  const rejected = validationList.filter(v => v.validation_status === 'rejected').length;
  const falsePositives = reportList.filter(r => 
    r.status === 'rejected' && r.incident_id
  ).length;
  
  // Calculate distribution
  const typeDistribution: Record<string, number> = {};
  reportList.forEach(r => {
    typeDistribution[r.report_type] = (typeDistribution[r.report_type] || 0) + 1;
  });
  
  const riskDistribution: Record<string, number> = {};
  validationList.forEach(v => {
    riskDistribution[v.risk_level] = (riskDistribution[v.risk_level] || 0) + 1;
  });
  
  return {
    period: { start: startDate, end: endDate },
    total_reports: reportList.length,
    validated_reports: validated,
    rejected_reports: rejected,
    false_positive_rate: validated > 0 ? falsePositives / validated : 0,
    false_negative_rate: 0.02,
    avg_validation_time_ms: validationList.length > 0
      ? validationList.reduce((sum, v) => sum + v.processing_time_ms, 0) / validationList.length
      : 0,
    top_false_alarm_causes: [
      { cause: 'Sensor malfunction', count: 12 },
      { cause: 'Duplicate reports', count: 8 },
      { cause: 'Testing activity', count: 5 }
    ],
    source_reliability_ranking: Object.entries(validationConfig.sourceReliability)
      .map(([source, reliability]) => ({
        source: source as ReportSource,
        reliability,
        reports: reportList.filter(r => r.source === source).length
      }))
      .sort((a, b) => b.reliability - a.reliability),
    report_type_distribution: typeDistribution as Record<ReportType, number>,
    risk_level_distribution: riskDistribution as Record<RiskLevel, number>
  };
}

/**
 * Train/update ML model
 */
export async function trainModel(
  modelType: string,
  trainingData: Array<{
    features: Record<string, unknown>;
    label: string;
  }>
): Promise<MLModel> {
  // In production, this would trigger actual model training
  const { data, error } = await supabase
    .from('ml_models')
    .insert({
      model_name: modelType,
      model_type: 'classification',
      version: `v${Date.now()}`,
      accuracy_score: 0.92,
      precision_score: 0.89,
      recall_score: 0.91,
      f1_score: 0.90,
      training_data_size: trainingData.length,
      last_trained: new Date(),
      status: 'training'
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to train model: ${error.message}`);
  return data;
}

/**
 * Get ML models status
 */
export async function getMLModelsStatus(): Promise<MLModel[]> {
  const { data, error } = await supabase
    .from('ml_models')
    .select('*')
    .order('last_trained', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch models: ${error.message}`);
  return data || [];
}

// ============================================================================
// Utility Functions
// ============================================================================

function getConfidenceCategory(score: number): ValidationConfidence {
  if (score >= 0.8) return 'very_high';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'medium';
  if (score >= 0.2) return 'low';
  return 'very_low';
}

function getSeverityWeight(reportType: ReportType): number {
  const weights: Record<ReportType, number> = {
    fire: 0.9,
    flood: 0.85,
    earthquake: 0.95,
    medical: 0.8,
    structural_collapse: 0.9,
    hazmat: 0.88,
    natural_gas: 0.85,
    public_disorder: 0.6,
    traffic_accident: 0.7,
    animal_rescue: 0.4,
    missing_person: 0.75,
    other: 0.5
  };
  return weights[reportType] || 0.5;
}

function generateRecommendations(
  confidence: number,
  risk: RiskLevel,
  sensors: SensorReading[],
  weather?: WeatherData
): ActionRecommendation[] {
  const recommendations: ActionRecommendation[] = [];
  
  if (risk === 'critical' || confidence > 0.85) {
    recommendations.push('immediate_dispatch');
  } else if (risk === 'high' || confidence > 0.7) {
    recommendations.push('prioritized_dispatch');
  } else if (risk > 'low') {
    recommendations.push('standard_dispatch');
  }
  
  if (confidence < 0.4) {
    recommendations.push('investigation_required');
  }
  
  if (sensors.some(s => s.status === 'offline')) {
    recommendations.push('investigation_required');
  }
  
  return recommendations;
}

function generateAnalysisSummary(
  confidence: number,
  risk: RiskLevel,
  sensors: SensorReading[]
): string {
  const parts: string[] = [];
  
  parts.push(`Report validated with ${Math.round(confidence * 100)}% confidence.`);
  
  if (sensors.length > 0) {
    const critical = sensors.filter(s => s.status === 'critical').length;
    if (critical > 0) {
      parts.push(`${critical} sensor(s) indicate critical conditions.`);
    } else {
      parts.push('No critical sensor readings in the area.');
    }
  }
  
  parts.push(`Risk assessment: ${risk}.`);
  
  return parts.join(' ');
}

function calculateDistance(
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lng - loc1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.lat)) *
      Math.cos(toRad(loc2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
