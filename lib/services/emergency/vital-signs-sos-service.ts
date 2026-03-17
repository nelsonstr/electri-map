/**
 * Vital Signs SOS Service
 * 
 * Epic: Emergency SOS Mode with Vital Signs Integration
 * Description: Advanced SOS button that can transmit user vital signs from connected wearables
 * (heart rate, location, movement patterns) to emergency services when activated,
 * enabling responders to understand victim condition before arrival.
 * 
 * Bmad Category: Emergency Protocol Innovation (ES-PI)
 * Emergency Mode Relevance: BFSI, CPI, SAR - Critical for firefighter and rescue operations
 * Complexity: 4
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type VitalSignType = 
  | 'heart_rate'
  | 'blood_oxygen'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'respiratory_rate'
  | 'body_temperature'
  | 'movement_intensity'
  | 'fall_detection'
  | 'gps_coordinates'
  | 'gps_accuracy'
  | 'gps_altitude'
  | 'activity_status';

export type SOSStatus = 
  | 'activated'
  | 'transmitting'
  | 'received_by_dispatch'
  | ' responders_dispatched'
  | 'responders_en_route'
  | 'responders_on_scene'
  | 'situation_assessed'
  | 'contained'
  | 'resolved'
  | 'cancelled'
  | 'expired';

export type SOSPriority = 'critical' | 'high' | 'medium' | 'low';

export type DeviceType = 
  | 'smartwatch'
  | 'fitness_tracker'
  | 'medical_device'
  | 'smartphone'
  | 'iot_sensor'
  | 'connected_car'
  | 'home_medical_device';

export type AlertChannel = 
  | 'sms'
  | 'voice_call'
  | 'push_notification'
  | 'email'
  | 'direct_dispatch'
  | 'radio'
  | 'satellite';

export interface VitalSignReading {
  type: VitalSignType;
  value: number;
  unit: string;
  timestamp: Date;
  device_id: string;
  confidence: number; // 0-1, confidence in reading accuracy
}

export interface VitalSignsSnapshot {
  user_id: string;
  session_id: string;
  readings: VitalSignReading[];
  average_heart_rate?: number;
  average_blood_oxygen?: number;
  movement_status: 'active' | 'stationary' | 'fall_detected' | 'no_movement';
  battery_level?: number;
  location?: { lat: number; lng: number; accuracy: number };
  captured_at: Date;
}

export interface WearableDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_type: DeviceType;
  manufacturer: string;
  model: string;
  capabilities: VitalSignType[];
  is_primary: boolean;
  battery_level?: number;
  last_sync_at?: Date;
  is_online: boolean;
  connection_type: 'bluetooth' | 'wifi' | 'cellular' | 'satellite';
}

export interface SOSActivation {
  id: string;
  user_id: string;
  session_id: string;
  status: SOSStatus;
  priority: SOSPriority;
  activated_at: Date;
  last_update_at: Date;
  location?: { lat: number; lng: number; accuracy: number };
  initial_vital_snapshot?: VitalSignsSnapshot;
  current_vital_snapshot?: VitalSignsSnapshot;
  vital_trend: 'improving' | 'stable' | 'deteriorating' | 'critical';
  responders_dispatched?: number;
  estimated_arrival_minutes?: number;
  notes?: string;
  resolved_at?: Date;
  cancellation_reason?: string;
}

export interface DispatchCenter {
  id: string;
  name: string;
  jurisdiction_area: string;
  contact_number: string;
  capabilities: string[];
  is_active: boolean;
  average_response_time_minutes?: number;
}

export interface EmergencyResponder {
  id: string;
  name: string;
  type: 'firefighter' | 'paramedic' | 'police' | 'hazmat' | 'search_and_rescue';
  unit_id: string;
  dispatch_center_id: string;
  is_available: boolean;
  current_location?: { lat: number; lng: number };
  estimated_time_to_scene?: number;
}

export interface SOSAlertHistory {
  id: string;
  sos_activation_id: string;
  channel: AlertChannel;
  recipient_id?: string;
  recipient_contact?: string;
  sent_at: Date;
  delivered_at?: Date;
  acknowledged_at?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'acknowledged' | 'failed' | 'expired';
  error_message?: string;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const VitalSignReadingSchema = z.object({
  type: z.enum([
    'heart_rate',
    'blood_oxygen',
    'blood_pressure_systolic',
    'blood_pressure_diastolic',
    'respiratory_rate',
    'body_temperature',
    'movement_intensity',
    'fall_detection',
    'gps_coordinates',
    'gps_accuracy',
    'gps_altitude',
    'activity_status'
  ]),
  value: z.number(),
  unit: z.string(),
  timestamp: z.date(),
  device_id: z.string(),
  confidence: z.number().min(0).max(1)
});

const VitalSignsSnapshotSchema = z.object({
  user_id: z.string(),
  session_id: z.string(),
  readings: z.array(VitalSignReadingSchema),
  average_heart_rate: z.number().optional(),
  average_blood_oxygen: z.number().optional(),
  movement_status: z.enum(['active', 'stationary', 'fall_detected', 'no_movement']),
  battery_level: z.number().min(0).max(100).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number()
  }).optional(),
  captured_at: z.date()
});

const WearableDeviceSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  device_name: z.string(),
  device_type: z.enum([
    'smartwatch',
    'fitness_tracker',
    'medical_device',
    'smartphone',
    'iot_sensor',
    'connected_car',
    'home_medical_device'
  ]),
  manufacturer: z.string(),
  model: z.string(),
  capabilities: z.array(z.string()),
  is_primary: z.boolean(),
  battery_level: z.number().min(0).max(100).optional(),
  last_sync_at: z.date().optional(),
  is_online: z.boolean(),
  connection_type: z.enum(['bluetooth', 'wifi', 'cellular', 'satellite'])
});

const SOSActivationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  session_id: z.string(),
  status: z.enum([
    'activated',
    'transmitting',
    'received_by_dispatch',
    'responders_dispatched',
    'responders_en_route',
    'responders_on_scene',
    'situation_assessed',
    'contained',
    'resolved',
    'cancelled',
    'expired'
  ]),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  activated_at: z.date(),
  last_update_at: z.date(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number()
  }).optional(),
  vital_trend: z.enum(['improving', 'stable', 'deteriorating', 'critical']),
  responders_dispatched: z.number().optional(),
  estimated_arrival_minutes: z.number().optional(),
  notes: z.string().optional(),
  resolved_at: z.date().optional(),
  cancellation_reason: z.string().optional()
});

// ============================================================================
// Configuration
// ============================================================================

export const vitalSignsConfig = {
  // Vital sign thresholds for priority determination
  thresholds: {
    heartRate: {
      criticalHigh: 130,
      criticalLow: 40,
      warningHigh: 100,
      warningLow: 50
    },
    bloodOxygen: {
      critical: 90,
      warning: 94
    },
    movementStatus: {
      fallDetected: true,
      noMovement: true
    }
  },
  
  // SOS transmission settings
  transmission: {
    intervalSeconds: 30,
    maxRetries: 3,
    timeoutSeconds: 60,
    heartbeatIntervalSeconds: 15
  },
  
  // Priority determination rules
  priorityRules: {
    autoCritical: [
      'fall_detection',
      'blood_oxygen_critical',
      'heart_rate_critical',
      'no_movement'
    ],
    autoHigh: [
      'blood_oxygen_warning',
      'heart_rate_warning',
      'movement_intensity_high'
    ]
  },
  
  // Display configuration
  display: {
    vitalSignCategories: [
      {
        name: 'Cardiovascular',
        color: '#ef4444',
        icon: 'heart',
        signs: ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic']
      },
      {
        name: 'Respiratory',
        color: '#3b82f6',
        icon: 'wind',
        signs: ['blood_oxygen', 'respiratory_rate']
      },
      {
        name: 'Temperature',
        color: '#f59e0b',
        icon: 'thermometer',
        signs: ['body_temperature']
      },
      {
        name: 'Movement',
        color: '#10b981',
        icon: 'activity',
        signs: ['movement_intensity', 'fall_detection', 'activity_status']
      }
    ],
    statusColors: {
      activated: '#ef4444',
      transmitting: '#f59e0b',
      received_by_dispatch: '#3b82f6',
      responders_dispatched: '#8b5cf6',
      responders_en_route: '#6366f1',
      responders_on_scene: '#14b8a6',
      situation_assessed: '#22c55e',
      contained: '#84cc16',
      resolved: '#10b981',
      cancelled: '#6b7280',
      expired: '#9ca3af'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function calculateSOSPriority(
  vitalSnapshot: VitalSignsSnapshot,
  userHistory: { avgHeartRate: number; avgBloodOxygen: number }
): SOSPriority {
  const { thresholds } = vitalSignsConfig;
  
  // Check for critical conditions
  const heartRate = vitalSnapshot.average_heart_rate;
  const bloodOxygen = vitalSnapshot.average_blood_oxygen;
  
  if (heartRate !== undefined) {
    if (heartRate >= thresholds.heartRate.criticalHigh || heartRate <= thresholds.heartRate.criticalLow) {
      return 'critical';
    }
    if (heartRate >= thresholds.heartRate.warningHigh || heartRate <= thresholds.heartRate.warningLow) {
      return 'high';
    }
  }
  
  if (bloodOxygen !== undefined) {
    if (bloodOxygen <= thresholds.bloodOxygen.critical) {
      return 'critical';
    }
    if (bloodOxygen <= thresholds.bloodOxygen.warning) {
      return 'high';
    }
  }
  
  if (vitalSnapshot.movement_status === 'fall_detected' || vitalSnapshot.movement_status === 'no_movement') {
    return 'critical';
  }
  
  // Default based on deviation from user history
  if (heartRate !== undefined && userHistory.avgHeartRate !== undefined) {
    const deviation = Math.abs(heartRate - userHistory.avgHeartRate) / userHistory.avgHeartRate;
    if (deviation > 0.3) return 'high';
    if (deviation > 0.15) return 'medium';
  }
  
  return 'low';
}

export function calculateVitalTrend(
  initialSnapshot: VitalSignsSnapshot,
  currentSnapshot: VitalSignsSnapshot
): 'improving' | 'stable' | 'deteriorating' | 'critical' {
  const initialHR = initialSnapshot.average_heart_rate || 0;
  const currentHR = currentSnapshot.average_heart_rate || 0;
  const initialO2 = initialSnapshot.average_blood_oxygen || 100;
  const currentO2 = currentSnapshot.average_blood_oxygen || 100;
  
  // Check for critical deterioration
  if (currentSnapshot.movement_status === 'no_movement' || 
      currentSnapshot.movement_status === 'fall_detected') {
    return 'critical';
  }
  
  if (currentO2 < 90 || currentHR > 130 || currentHR < 40) {
    return 'critical';
  }
  
  // Calculate trends
  const hrChange = (currentHR - initialHR) / initialHR;
  const o2Change = currentO2 - initialO2;
  
  // Significant improvement
  if (o2Change > 5 && hrChange < -0.1) return 'improving';
  
  // Significant deterioration
  if (o2Change < -5 || hrChange > 0.3) return 'deteriorating';
  
  // Stable
  if (Math.abs(hrChange) < 0.15 && Math.abs(o2Change) < 3) return 'stable';
  
  return 'stable';
}

export function formatVitalValue(value: number, type: VitalSignType): string {
  switch (type) {
    case 'heart_rate':
      return `${Math.round(value)} bpm`;
    case 'blood_oxygen':
      return `${Math.round(value)}%`;
    case 'blood_pressure_systolic':
    case 'blood_pressure_diastolic':
      return `${Math.round(value)} mmHg`;
    case 'respiratory_rate':
      return `${Math.round(value)} rpm`;
    case 'body_temperature':
      return `${value.toFixed(1)}°C`;
    case 'movement_intensity':
      return `${Math.round(value)}%`;
    case 'fall_detection':
      return value === 1 ? 'FALL DETECTED' : 'Normal';
    case 'activity_status':
      return value.toString();
    default:
      return `${value}`;
  }
}

export function getVitalStatusColor(value: number, type: VitalSignType): string {
  const { thresholds } = vitalSignsConfig;
  
  switch (type) {
    case 'heart_rate':
      if (value >= thresholds.heartRate.criticalHigh || value <= thresholds.heartRate.criticalLow) return '#ef4444';
      if (value >= thresholds.heartRate.warningHigh || value <= thresholds.heartRate.warningLow) return '#f59e0b';
      return '#10b981';
    case 'blood_oxygen':
      if (value <= thresholds.bloodOxygen.critical) return '#ef4444';
      if (value <= thresholds.bloodOxygen.warning) return '#f59e0b';
      return '#10b981';
    default:
      return '#6b7280';
  }
}

export function formatSOSDuration(startTime: Date, endTime?: Date): string {
  const end = endTime || new Date();
  const diffMs = end.getTime() - startTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  }
  return `${diffMins}m`;
}

export function getStatusDisplayInfo(status: SOSStatus) {
  const statusInfo: Record<SOSStatus, { label: string; color: string; icon: string }> = {
    activated: { label: 'SOS Activated', color: '#ef4444', icon: 'sos' },
    transmitting: { label: 'Transmitting Data', color: '#f59e0b', icon: 'transmit' },
    received_by_dispatch: { label: 'Received by Dispatch', color: '#3b82f6', icon: 'dispatch' },
    responders_dispatched: { label: 'Responders Dispatched', color: '#8b5cf6', icon: 'dispatch_car' },
    responders_en_route: { label: 'En Route', color: '#6366f1', icon: 'navigation' },
    responders_on_scene: { label: 'On Scene', color: '#14b8a6', icon: 'location' },
    situation_assessed: { label: 'Situation Assessed', color: '#22c55e', icon: 'check' },
    contained: { label: 'Contained', color: '#84cc16', icon: 'shield' },
    resolved: { label: 'Resolved', color: '#10b981', icon: 'check_circle' },
    cancelled: { label: 'Cancelled', color: '#6b7280', icon: 'x' },
    expired: { label: 'Expired', color: '#9ca3af', icon: 'clock' }
  };
  
  return statusInfo[status];
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Register a new wearable device for a user
 */
export async function registerDevice(device: Omit<WearableDevice, 'id'>): Promise<WearableDevice> {
  const { data, error } = await supabase
    .from('wearable_devices')
    .insert({
      user_id: device.user_id,
      device_name: device.device_name,
      device_type: device.device_type,
      manufacturer: device.manufacturer,
      model: device.model,
      capabilities: device.capabilities,
      is_primary: device.is_primary,
      battery_level: device.battery_level,
      last_sync_at: device.last_sync_at?.toISOString(),
      is_online: device.is_online,
      connection_type: device.connection_type
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to register device: ${error.message}`);
  
  return data;
}

/**
 * Get all wearable devices for a user
 */
export async function getUserDevices(userId: string): Promise<WearableDevice[]> {
  const { data, error } = await supabase
    .from('wearable_devices')
    .select('*')
    .eq('user_id', userId)
    .eq('is_online', true)
    .order('is_primary', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch devices: ${error.message}`);
  
  return data || [];
}

/**
 * Update device status (online/offline, battery level)
 */
export async function updateDeviceStatus(
  deviceId: string,
  updates: { is_online?: boolean; battery_level?: number; last_sync_at?: Date }
): Promise<void> {
  const { error } = await supabase
    .from('wearable_devices')
    .update({
      ...updates,
      last_sync_at: updates.last_sync_at?.toISOString()
    })
    .eq('id', deviceId);
  
  if (error) throw new Error(`Failed to update device: ${error.message}`);
}

/**
 * Sync vital signs from a device
 */
export async function syncVitalSigns(
  userId: string,
  deviceId: string,
  readings: Omit<VitalSignReading, 'device_id'>[]
): Promise<void> {
  const records = readings.map(reading => ({
    user_id: userId,
    device_id: deviceId,
    vital_type: reading.type,
    vital_value: reading.value,
    unit: reading.unit,
    reading_timestamp: reading.timestamp.toISOString(),
    confidence: reading.confidence
  }));
  
  const { error } = await supabase
    .from('vital_sign_readings')
    .insert(records);
  
  if (error) throw new Error(`Failed to sync vital signs: ${error.message}`);
}

/**
 * Get recent vital signs for a user
 */
export async function getRecentVitalSigns(
  userId: string,
  deviceId?: string,
  minutesBack: number = 60
): Promise<VitalSignReading[]> {
  let query = supabase
    .from('vital_sign_readings')
    .select('*')
    .eq('user_id', userId)
    .gte('reading_timestamp', new Date(Date.now() - minutesBack * 60000).toISOString())
    .order('reading_timestamp', { ascending: false });
  
  if (deviceId) {
    query = query.eq('device_id', deviceId);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch vital signs: ${error.message}`);
  
  return (data || []).map(reading => ({
    type: reading.vital_type as VitalSignType,
    value: reading.vital_value,
    unit: reading.unit,
    timestamp: new Date(reading.reading_timestamp),
    device_id: reading.device_id,
    confidence: reading.confidence
  }));
}

/**
 * Create a vital signs snapshot for SOS transmission
 */
export async function createVitalSnapshot(
  userId: string,
  sessionId: string
): Promise<VitalSignsSnapshot> {
  const readings = await getRecentVitalSigns(userId, undefined, 5);
  
  // Calculate averages
  const heartRateReadings = readings.filter(r => r.type === 'heart_rate');
  const avgHeartRate = heartRateReadings.length > 0
    ? heartRateReadings.reduce((sum, r) => sum + r.value, 0) / heartRateReadings.length
    : undefined;
  
  const o2Readings = readings.filter(r => r.type === 'blood_oxygen');
  const avgBloodOxygen = o2Readings.length > 0
    ? o2Readings.reduce((sum, r) => sum + r.value, 0) / o2Readings.length
    : undefined;
  
  // Determine movement status
  const fallReading = readings.find(r => r.type === 'fall_detection');
  const movementStatus = fallReading?.value === 1 
    ? 'fall_detected' 
    : readings.some(r => r.type === 'movement_intensity' && r.value > 0)
      ? 'active'
      : readings.some(r => r.type === 'movement_intensity' && r.value === 0)
        ? 'stationary'
        : 'no_movement';
  
  // Get location from GPS readings
  const gpsReading = readings.find(r => r.type === 'gps_coordinates');
  const gpsAccuracy = readings.find(r => r.type === 'gps_accuracy');
  
  const snapshot: VitalSignsSnapshot = {
    user_id: userId,
    session_id: sessionId,
    readings,
    average_heart_rate: avgHeartRate,
    average_blood_oxygen: avgBloodOxygen,
    movement_status: movementStatus as 'active' | 'stationary' | 'fall_detected' | 'no_movement',
    captured_at: new Date()
  };
  
  if (gpsReading) {
    snapshot.location = {
      lat: gpsReading.value,
      lng: gpsAccuracy?.value || 0,
      accuracy: gpsAccuracy?.value || 0
    };
  }
  
  // Store snapshot
  const { error } = await supabase
    .from('vital_sign_snapshots')
    .insert({
      user_id: userId,
      session_id: sessionId,
      snapshot_data: snapshot,
      captured_at: snapshot.captured_at.toISOString()
    });
  
  if (error) throw new Error(`Failed to store snapshot: ${error.message}`);
  
  return snapshot;
}

/**
 * Activate SOS with vital signs transmission
 */
export async function activateSOS(
  userId: string,
  location?: { lat: number; lng: number; accuracy: number }
): Promise<SOSActivation> {
  const sessionId = `sos_${userId}_${Date.now()}`;
  
  // Create vital snapshot
  const vitalSnapshot = await createVitalSnapshot(userId, sessionId);
  
  // Get user's historical averages for priority calculation
  const historicalReadings = await getRecentVitalSigns(userId, undefined, 1440); // Last 24 hours
  const avgHR = historicalReadings.filter(r => r.type === 'heart_rate');
  const userHistory = {
    avgHeartRate: avgHR.length > 0
      ? avgHR.reduce((sum, r) => sum + r.value, 0) / avgHR.length
      : 75, // Default assumption
    avgBloodOxygen: 97 // Default assumption
  };
  
  // Calculate priority
  const priority = calculateSOSPriority(vitalSnapshot, userHistory);
  
  // Create SOS activation record
  const activation: SOSActivation = {
    id: sessionId,
    user_id: userId,
    session_id: sessionId,
    status: 'activated',
    priority,
    activated_at: new Date(),
    last_update_at: new Date(),
    location,
    initial_vital_snapshot: vitalSnapshot,
    current_vital_snapshot: vitalSnapshot,
    vital_trend: 'stable'
  };
  
  // Store activation
  const { error } = await supabase
    .from('sos_activations')
    .insert({
      id: activation.id,
      user_id: activation.user_id,
      session_id: activation.session_id,
      status: activation.status,
      priority: activation.priority,
      activated_at: activation.activated_at.toISOString(),
      last_update_at: activation.last_update_at.toISOString(),
      location: location ? JSON.stringify(location) : null,
      initial_snapshot_id: vitalSnapshot,
      vital_trend: activation.vital_trend
    });
  
  if (error) throw new Error(`Failed to activate SOS: ${error.message}`);
  
  // Trigger dispatch notification
  await notifyDispatchCenters(activation);
  
  return activation;
}

/**
 * Update SOS status
 */
export async function updateSOSStatus(
  activationId: string,
  updates: Partial<SOSActivation>
): Promise<void> {
  const { error } = await supabase
    .from('sos_activations')
    .update({
      ...updates,
      last_update_at: new Date().toISOString()
    })
    .eq('id', activationId);
  
  if (error) throw new Error(`Failed to update SOS status: ${error.message}`);
}

/**
 * Update vital signs during active SOS
 */
export async function updateSOSVitals(
  activationId: string,
  vitalSnapshot: VitalSignsSnapshot
): Promise<void> {
  // Get initial snapshot to calculate trend
  const { data: activation } = await supabase
    .from('sos_activations')
    .select('*')
    .eq('id', activationId)
    .single();
  
  if (!activation) throw new Error('SOS activation not found');
  
  const initialSnapshot = activation.initial_snapshot_data as VitalSignsSnapshot;
  const vitalTrend = calculateVitalTrend(initialSnapshot, vitalSnapshot);
  
  // Update
  await supabase
    .from('sos_activations')
    .update({
      current_snapshot_data: vitalSnapshot,
      vital_trend: vitalTrend,
      last_update_at: new Date().toISOString()
    })
    .eq('id', activationId);
  
  // Notify dispatch of trend change if critical
  if (vitalTrend === 'critical' || vitalTrend === 'deteriorating') {
    await notifyDispatchOfTrendChange(activationId, vitalTrend);
  }
}

/**
 * Cancel SOS activation
 */
export async function cancelSOS(
  activationId: string,
  reason: string
): Promise<void> {
  await updateSOSStatus(activationId, {
    status: 'cancelled',
    cancellation_reason: reason,
    resolved_at: new Date()
  });
}

/**
 * Get active SOS for a user
 */
export async function getActiveSOS(userId: string): Promise<SOSActivation | null> {
  const { data, error } = await supabase
    .from('sos_activations')
    .select('*')
    .eq('user_id', userId)
    .in('status', [
      'activated',
      'transmitting',
      'received_by_dispatch',
      'responders_dispatched',
      'responders_en_route',
      'responders_on_scene',
      'situation_assessed'
    ])
    .order('activated_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch active SOS: ${error.message}`);
  }
  
  return data || null;
}

/**
 * Get all active SOS incidents for dispatch
 */
export async function getActiveSOSIncidents(): Promise<SOSActivation[]> {
  const { data, error } = await supabase
    .from('sos_activations')
    .select('*')
    .in('status', [
      'activated',
      'transmitting',
      'received_by_dispatch',
      'responders_dispatched',
      'responders_en_route',
      'responders_on_scene'
    ])
    .order('activated_at', { ascending: true });
  
  if (error) throw new Error(`Failed to fetch active SOS incidents: ${error.message}`);
  
  return data || [];
}

/**
 * Notify dispatch centers of SOS activation
 */
async function notifyDispatchCenters(activation: SOSActivation): Promise<void> {
  const { data: dispatchCenters } = await supabase
    .from('dispatch_centers')
    .select('*')
    .eq('is_active', true);
  
  if (!dispatchCenters || dispatchCenters.length === 0) {
    // Use default dispatch
    await createSOSAlert(activation, 'direct_dispatch', undefined);
    return;
  }
  
  // Find nearest dispatch center based on location
  const userLocation = activation.location;
  if (userLocation) {
    dispatchCenters.sort((a, b) => {
      const distA = calculateDistance(
        userLocation.lat, userLocation.lng,
        a.latitude || 0, a.longitude || 0
      );
      const distB = calculateDistance(
        userLocation.lat, userLocation.lng,
        b.latitude || 0, b.longitude || 0
      );
      return distA - distB;
    });
  }
  
  // Notify nearest dispatch center
  const nearest = dispatchCenters[0];
  await createSOSAlert(activation, 'direct_dispatch', nearest.id);
}

/**
 * Create SOS alert record
 */
async function createSOSAlert(
  activation: SOSActivation,
  channel: AlertChannel,
  recipientId?: string
): Promise<SOSAlertHistory> {
  const { data, error } = await supabase
    .from('sos_alerts')
    .insert({
      sos_activation_id: activation.id,
      channel,
      recipient_id: recipientId,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create SOS alert: ${error.message}`);
  
  return data;
}

/**
 * Notify dispatch of vital sign trend change
 */
async function notifyDispatchOfTrendChange(
  activationId: string,
  trend: 'improving' | 'stable' | 'deteriorating' | 'critical'
): Promise<void> {
  await supabase
    .from('sos_alerts')
    .insert({
      sos_activation_id: activationId,
      channel: 'direct_dispatch',
      status: 'pending',
      notes: `Vital sign trend changed to: ${trend}`
    });
}

/**
 * Get vital sign trends for a user
 */
export async function getVitalTrends(
  userId: string,
  hoursBack: number = 24
): Promise<{ timestamp: Date; heartRate: number; bloodOxygen: number }[]> {
  const { data, error } = await supabase
    .from('vital_sign_readings')
    .select('vital_type, vital_value, reading_timestamp')
    .eq('user_id', userId)
    .gte('reading_timestamp', new Date(Date.now() - hoursBack * 3600000).toISOString())
    .order('reading_timestamp', { ascending: true });
  
  if (error) throw new Error(`Failed to fetch vital trends: ${error.message}`);
  
  // Aggregate by 5-minute intervals
  const intervals: Record<string, { heartRate: number[]; bloodOxygen: number[] }> = {};
  
  (data || []).forEach(reading => {
    const interval = Math.floor(new Date(reading.reading_timestamp).getTime() / 300000) * 300000;
    if (!intervals[interval]) {
      intervals[interval] = { heartRate: [], bloodOxygen: [] };
    }
    if (reading.vital_type === 'heart_rate') {
      intervals[interval].heartRate.push(reading.vital_value);
    } else if (reading.vital_type === 'blood_oxygen') {
      intervals[interval].bloodOxygen.push(reading.vital_value);
    }
  });
  
  return Object.entries(intervals).map(([timestamp, values]) => ({
    timestamp: new Date(parseInt(timestamp)),
    heartRate: values.heartRate.length > 0
      ? values.heartRate.reduce((a, b) => a + b, 0) / values.heartRate.length
      : 0,
    bloodOxygen: values.bloodOxygen.length > 0
      ? values.bloodOxygen.reduce((a, b) => a + b, 0) / values.bloodOxygen.length
      : 0
  }));
}

/**
 * Calculate distance between two coordinates (in km)
 */
function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Assign responder to SOS
 */
export async function assignResponder(
  activationId: string,
  responderId: string
): Promise<void> {
  const { error } = await supabase
    .from('sos_responders')
    .insert({
      sos_activation_id: activationId,
      responder_id: responderId,
      assigned_at: new Date().toISOString()
    });
  
  if (error) throw new Error(`Failed to assign responder: ${error.message}`);
  
  await updateSOSStatus(activationId, {
    status: 'responders_dispatched',
    responders_dispatched: 1
  });
}

/**
 * Get user alert history for vital signs
 */
export async function getSOSHistory(
  userId: string,
  limit: number = 30
): Promise<SOSActivation[]> {
  const { data, error } = await supabase
    .from('sos_activations')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['resolved', 'cancelled', 'expired'])
    .order('activated_at', { ascending: false })
    .limit(limit);
  
  if (error) throw new Error(`Failed to fetch SOS history: ${error.message}`);
  
  return data || [];
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getWearableDeviceDisplayInfo(device: WearableDevice) {
  const deviceInfo: Record<DeviceType, { icon: string; color: string }> = {
    smartwatch: { icon: 'watch', color: '#3b82f6' },
    fitness_tracker: { icon: 'activity', color: '#10b981' },
    medical_device: { icon: 'heart-pulse', color: '#ef4444' },
    smartphone: { icon: 'smartphone', color: '#6b7280' },
    iot_sensor: { icon: 'cpu', color: '#8b5cf6' },
    connected_car: { icon: 'car', color: '#f59e0b' },
    home_medical_device: { icon: 'home', color: '#ec4899' }
  };
  
  return deviceInfo[device.device_type] || { icon: 'device', color: '#6b7280' };
}

export function getDeviceStatusBadge(isOnline: boolean, batteryLevel?: number) {
  if (!isOnline) {
    return { text: 'Offline', color: '#6b7280' };
  }
  if (batteryLevel === undefined) {
    return { text: 'Online', color: '#10b981' };
  }
  if (batteryLevel > 50) {
    return { text: `${batteryLevel}%`, color: '#10b981' };
  }
  if (batteryLevel > 20) {
    return { text: `${batteryLevel}%`, color: '#f59e0b' };
  }
  return { text: `${batteryLevel}%`, color: '#ef4444' };
}
