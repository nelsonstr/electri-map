/**
 * Earthquake Early Warning Service
 * 
 * Epic: Earthquake Early Warning Integration
 * Description: Integration with national and international seismic monitoring networks to provide
 * early warnings before tremors reach populated areas, including ShakeAlert-style P-wave detection,
 * seismic intensity forecasting, and automated safety instructions.
 * 
 * Bmad Category: Natural Disaster Warning System (NDW)
 * Emergency Mode Relevance: BFSI, CPI, CEX - Critical for earthquake-prone regions
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type EarthquakeStatus = 
  | 'pending'      // Earthquake detected, analysis in progress
  | 'confirmed'    // Earthquake confirmed by multiple sensors
  | 'updated'      // Updated magnitude/parameters
  | 'cancelled'    // False alarm or cancelled
  | 'final';       // Final assessment complete

export type SeismicAlertLevel = 
  | 'watch'        // Possible seismic activity
  | 'warning'      // Earthquake imminent
  | 'emergency'    // Severe earthquake expected
  | 'all_clear';   // Threat has passed

export type SeismicWaveType = 
  | 'P'            // Primary wave (fast, non-damaging)
  | 'S'            // Secondary wave (slower, damaging)
  | 'Surface';     // Surface wave (slowest, most damaging)

export type BuildingVulnerability = 
  | 'high'         // Unreinforced masonry, soft-story
  | 'moderate'     // Older concrete, mid-rise
  | 'low'          // Modern steel/concrete
  | 'unknown';

export type SafetyActionType = 
  | 'drop_cover_hold'
  | 'evacuate'
  | 'stay_indoors'
  | 'move_away_windows'
  | 'secure_heavy_objects'
  | 'check_utilities'
  | 'expect_aftershocks';

export interface EarthquakeEvent {
  id: string;
  earthquake_id: string; // External ID from seismic network
  magnitude: number;
  magnitude_type: 'ML' | 'Ms' | 'Mb' | 'Mw'; // Local, Surface, Body, Moment
  epicenter: {
    latitude: number;
    longitude: number;
    depth_km: number;
    location_name?: string;
  };
  origin_time: Date;
  status: EarthquakeStatus;
  contributing_stations: number;
  confidence_score: number;
  created_at: Date;
  updated_at?: Date;
}

export interface SeismicStation {
  id: string;
  station_code: string;
  station_name: string;
  network: string;
  location: { lat: number; lng: number };
  status: 'online' | 'offline' | 'degraded';
  last_reading?: Date;
  sensitivity: 'high' | 'medium' | 'low';
  distance_km: number;
  arrival_times?: {
    P_wave?: Date;
    S_wave?: Date;
    surface_wave?: Date;
  };
}

export interface EarlyWarning {
  id: string;
  earthquake_id: string;
  warning_area: {
    polygon: Array<{ lat: number; lng: number }>;
    affected_radius_km: number;
  };
  alert_level: SeismicAlertLevel;
  estimated_intensity: number; // Modified Mercalli Intensity (1-12)
  estimated_shaking_duration_seconds: number;
  seconds_before_arrival: number;
  safety_actions: SafetyInstruction[];
  generated_at: Date;
  expires_at?: Date;
}

export interface SafetyInstruction {
  id: string;
  action_type: SafetyActionType;
  instruction: string;
  target_area: 'indoors' | 'outdoors' | 'both';
  priority: 'critical' | 'recommended' | 'optional';
  icon?: string;
  audio_clip_url?: string;
  duration_seconds?: number;
}

export interface ShakeMap {
  id: string;
  earthquake_id: string;
  grid_points: Array<{
    lat: number;
    lng: number;
    intensity: number;
    pga_percent_g: number; // Peak Ground Acceleration
    pgv_cm_s: number;     // Peak Ground Velocity
    duration_seconds: number;
  }>;
  created_at: Date;
  version: number;
}

export interface UserEarthquakePreference {
  id: string;
  user_id: string;
  alert_enabled: boolean;
  minimum_magnitude: number;
  alert_level_threshold: SeismicAlertLevel;
  indoor_location?: {
    floor: number;
    building_type: BuildingVulnerability;
    room_type?: string;
  };
  outdoor_location?: {
    zone_type: 'urban' | 'suburban' | 'rural' | 'open';
    proximity_to_structures?: number;
  };
  receive_shake_alerts: boolean;
  receive_aftershock_alerts: boolean;
  notify_emergency_contacts: boolean;
  auto_record_video: boolean;
}

export interface EarthquakeAlertNotification {
  id: string;
  earthquake_id: string;
  user_id: string;
  notification_type: 'warning' | 'update' | 'cancellation' | 'all_clear';
  alert_level: SeismicAlertLevel;
  seconds_before_shaking: number;
  estimated_intensity: number;
  was_perceived: boolean;
  perception_time?: Date;
  created_at: Date;
}

export interface EarthquakeAnalytics {
  total_alerts_sent: number;
  earthquakes_detected: number;
  average_warning_time_seconds: number;
  alert_accuracy_rate: number; // How often alerts matched actual shaking
  user_response_rate: number;
  most_common_intensity: number;
  peak_intensity_recorded: number;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const EarthquakeEventSchema = z.object({
  id: z.string(),
  earthquake_id: z.string(),
  magnitude: z.number().min(0).max(10),
  magnitude_type: z.enum(['ML', 'Ms', 'Mb', 'Mw']),
  epicenter: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    depth_km: z.number().min(0),
    location_name: z.string().optional()
  }),
  origin_time: z.date(),
  status: z.enum(['pending', 'confirmed', 'updated', 'cancelled', 'final']),
  contributing_stations: z.number().min(0),
  confidence_score: z.number().min(0).max(1)
});

const EarlyWarningSchema = z.object({
  id: z.string(),
  earthquake_id: z.string(),
  alert_level: z.enum(['watch', 'warning', 'emergency', 'all_clear']),
  estimated_intensity: z.number().min(1).max(12),
  seconds_before_arrival: z.number().min(0),
  generated_at: z.date()
});

const UserEarthquakePreferenceSchema = z.object({
  user_id: z.string(),
  alert_enabled: z.boolean(),
  minimum_magnitude: z.number().min(0),
  alert_level_threshold: z.enum(['watch', 'warning', 'emergency', 'all_clear']),
  receive_shake_alerts: z.boolean(),
  receive_aftershock_alerts: z.boolean()
});

// ============================================================================
// Configuration
// ============================================================================

export const earthquakeConfig = {
  // Magnitude thresholds
  magnitudeThresholds: {
    felt: 3.0,        // Generally felt
    damaging: 4.5,   // Can cause damage
    destructive: 5.5, // Significant damage
    major: 6.5,      // Major earthquake
    great: 7.5       // Great earthquake
  },
  
  // Intensity thresholds (Modified Mercalli Intensity)
  intensityLevels: {
    I: { label: 'Not Felt', threshold: 1, color: '#22c55e', actions: [] },
    II: { label: 'Weak', threshold: 2, color: '#84cc16', actions: [] },
    III: { label: 'Weak', threshold: 3, color: '#a3e635', actions: ['feel_vibration'] },
    IV: { label: 'Light', threshold: 4, color: '#eab308', actions: ['rattle_objects'] },
    V: { label: 'Moderate', threshold: 5, color: '#f59e0b', actions: ['awaken_many', 'fall_items'] },
    VI: { label: 'Strong', threshold: 6, color: '#f97316', actions: ['difficult_walk', 'furniture_moves'] },
    VII: { label: 'Very Strong', threshold: 7, color: '#ea580c', actions: ['difficult_stand', 'damage_chimneys'] },
    VIII: { label: 'Severe', threshold: 8, color: '#dc2626', actions: ['difficult_drive', 'partial_wall_collapse'] },
    IX: { label: 'Violent', threshold: 9, color: '#b91c1c', actions: ['structural_damage', 'utilities_fail'] },
    X: { label: 'Extreme', threshold: 10, color: '#991b1b', actions: ['building_damage', 'rails_bend'] },
    XI: { label: 'Extreme', threshold: 11, color: '#7f1d1d', actions: ['few_structures_remain', 'bridges_destroy'] },
    XII: { label: 'Extreme', threshold: 12, color: '#450a0a', actions: ['total_destruction', 'objects_thrown'] }
  },
  
  // P-wave speed (km/s) - varies by region
  pWaveSpeed: {
    shallow: 6.0,
    intermediate: 7.5,
    deep: 8.5
  },
  
  // S-wave to P-wave ratio (for intensity estimation)
  sToPRatio: 1.78,
  
  // Safety instructions by intensity
  safetyInstructions: {
    drop_cover_hold: {
      instruction: 'DROP to your hands and knees. COVER your head and neck under a sturdy table. HOLD ON until the shaking stops.',
      icon: 'person-fall',
      priority: 'critical'
    },
    evacuate: {
      instruction: 'Evacuate the building calmly. Do not use elevators. Go to the nearest safe exit.',
      icon: 'footprints',
      priority: 'critical'
    },
    stay_indoors: {
      instruction: 'Stay indoors. Move away from windows, mirrors, and heavy objects that could fall.',
      icon: 'home',
      priority: 'recommended'
    },
    move_away_windows: {
      instruction: 'Move away from windows, glass doors, and items that could fall.',
      icon: 'window',
      priority: 'recommended'
    },
    secure_heavy_objects: {
      instruction: 'Secure heavy furniture, appliances, and hanging objects that could fall during shaking.',
      icon: 'lock',
      priority: 'optional'
    },
    check_utilities: {
      instruction: 'After shaking stops, check for gas leaks, damaged electrical lines, and water leaks.',
      icon: 'alert-triangle',
      priority: 'recommended'
    },
    expect_aftershocks: {
      instruction: 'Expect aftershocks. Be prepared to Drop, Cover, and Hold again if needed.',
      icon: 'activity',
      priority: 'recommended'
    }
  },
  
  // Alert level thresholds
  alertThresholds: {
    watch: { magnitude: 3.0, intensity: 4 },
    warning: { magnitude: 4.5, intensity: 5 },
    emergency: { magnitude: 5.5, intensity: 6 }
  },
  
  // Seismic network stations
  networkConfig: {
    minStationsForConfirmation: 3,
    maxStationsForAccuracy: 10,
    stationTimeoutMinutes: 5,
    dataQualityThreshold: 0.7
  },
  
  // Display configuration
  display: {
    magnitudeTypeLabels: {
      ML: 'Local Magnitude',
      Ms: 'Surface Wave Magnitude',
      Mb: 'Body Wave Magnitude',
      Mw: 'Moment Magnitude'
    },
    intensityLabels: {
      I: 'Not Felt',
      II: 'Weak',
      III: 'Weak',
      IV: 'Light',
      V: 'Moderate',
      VI: 'Strong',
      VII: 'Very Strong',
      VIII: 'Severe',
      IX: 'Violent',
      X: 'Extreme',
      XI: 'Extreme',
      XII: 'Extreme'
    },
    alertLevelIcons: {
      watch: 'eye',
      warning: 'alert-triangle',
      emergency: 'siren',
      all_clear: 'check-circle'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getEarthquakeStatusInfo(status: EarthquakeStatus) {
  const statusInfo: Record<EarthquakeStatus, { label: string; color: string }> = {
    pending: { label: 'Analysis Pending', color: '#f59e0b' },
    confirmed: { label: 'Confirmed', color: '#3b82f6' },
    updated: { label: 'Updated', color: '#8b5cf6' },
    cancelled: { label: 'Cancelled', color: '#6b7280' },
    final: { label: 'Final', color: '#10b981' }
  };
  return statusInfo[status];
}

export function getAlertLevelInfo(level: SeismicAlertLevel) {
  const levelInfo: Record<SeismicAlertLevel, { label: string; color: string; icon: string }> = {
    watch: { label: 'Earthquake Watch', color: '#f59e0b', icon: 'eye' },
    warning: { label: 'Earthquake Warning', color: '#f97316', icon: 'alert-triangle' },
    emergency: { label: 'Earthquake Emergency', color: '#ef4444', icon: 'siren' },
    all_clear: { label: 'All Clear', color: '#22c55e', icon: 'check-circle' }
  };
  return levelInfo[level];
}

export function calculateWarningTime(
  distanceKm: number,
  depthKm: number,
  pWaveSpeedKmPerSec: number = 6.0
): number {
  // Calculate epicentral distance
  const epicentralDistance = Math.sqrt(distanceKm * distanceKm + depthKm * depthKm);
  
  // Time for P-wave to reach location
  const pWaveArrivalTime = epicentralDistance / pWaveSpeedKmPerSec;
  
  // S-wave arrives later (approximately 1.78x slower than P-wave)
  // We want to warn before S-wave arrives
  const sWaveArrivalTime = epicentralDistance * 1.78 / pWaveSpeedKmPerSec;
  
  // Warning time is the difference between S and P wave arrival
  return Math.max(0, sWaveArrivalTime - pWaveArrivalTime);
}

export function estimateIntensity(
  magnitude: number,
  distanceKm: number,
  depthKm: number
): number {
  // Simplified intensity estimation using modified Mercalli
  const epicentralDistance = Math.sqrt(distanceKm * distanceKm + depthKm * depthKm);
  
  // Using a simplified attenuation relationship
  // Intensity decreases with distance and increases with magnitude
  const distanceEffect = 3.0 * Math.log10(epicentralDistance / 10 + 1);
  const magnitudeEffect = 1.5 * magnitude;
  
  let intensity = magnitudeEffect - distanceEffect;
  
  // Adjust for depth (deeper = less intensity at surface)
  if (depthKm > 70) {
    intensity -= 1;
  }
  if (depthKm > 300) {
    intensity -= 2;
  }
  
  // Clamp to valid range
  return Math.max(1, Math.min(12, Math.round(intensity)));
}

export function estimateShakingDuration(
  magnitude: number,
  distanceKm: number
): number {
  // Duration increases with magnitude and decreases with distance
  const baseDuration = Math.pow(10, (magnitude - 4) / 2);
  const distanceFactor = Math.max(0.5, 1 - (distanceKm / 500));
  
  return Math.round(baseDuration * distanceFactor * 10);
}

export function getSafetyActionsForIntensity(intensity: number): SafetyActionType[] {
  const actions: SafetyActionType[] = [];
  
  // Always recommend drop-cover-hold for intensities that cause movement
  if (intensity >= 5) {
    actions.push('drop_cover_hold');
  }
  
  if (intensity >= 6) {
    actions.push('stay_indoors');
    actions.push('move_away_windows');
  }
  
  if (intensity >= 7) {
    actions.push('evacuate');
  }
  
  if (intensity >= 5) {
    actions.push('expect_aftershocks');
  }
  
  if (intensity >= 6) {
    actions.push('check_utilities');
  }
  
  return actions;
}

export function formatSafetyInstruction(actionType: SafetyActionType): SafetyInstruction {
  const template = earthquakeConfig.safetyInstructions[actionType];
  
  return {
    id: actionType,
    action_type: actionType,
    instruction: template.instruction,
    priority: template.priority as 'critical' | 'recommended' | 'optional',
    icon: template.icon,
    duration_seconds: actionType === 'drop_cover_hold' ? 60 : undefined
  };
}

export function getIntensityColor(intensity: number): string {
  if (intensity <= 3) return '#22c55e';
  if (intensity <= 5) return '#eab308';
  if (intensity <= 6) return '#f97316';
  if (intensity <= 8) return '#dc2626';
  return '#991b1b';
}

export function getMagnitudeCategory(magnitude: number): {
  label: string;
  color: string;
  description: string;
} {
  if (magnitude < 3) {
    return { label: 'Micro', color: '#22c55e', description: 'Not felt' };
  }
  if (magnitude < 4) {
    return { label: 'Minor', color: '#84cc16', description: 'Felt by some' };
  }
  if (magnitude < 5) {
    return { label: 'Light', color: '#eab308', description: 'Felt by many' };
  }
  if (magnitude < 6) {
    return { label: 'Moderate', color: '#f59e0b', description: 'Some damage' };
  }
  if (magnitude < 7) {
    return { label: 'Strong', color: '#f97316', description: 'Significant damage' };
  }
  if (magnitude < 8) {
    return { label: 'Major', color: '#ea580c', description: 'Serious damage' };
  }
  return { label: 'Great', color: '#dc2626', description: 'Severe damage' };
}

export function calculateDistanceFromEpicenter(
  userLocation: { lat: number; lng: number },
  epicenter: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(epicenter.latitude - userLocation.lat);
  const dLon = toRad(epicenter.longitude - userLocation.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(userLocation.lat)) *
      Math.cos(toRad(epicenter.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function shouldAlertUser(
  preferences: UserEarthquakePreference,
  earthquake: EarthquakeEvent,
  userDistanceKm: number,
  estimatedIntensity: number
): boolean {
  if (!preferences.alert_enabled) return false;
  
  if (earthquake.magnitude < preferences.minimum_magnitude) return false;
  
  const alertThreshold = earthquakeConfig.alertThresholds[preferences.alert_level_threshold];
  
  if (estimatedIntensity < alertThreshold.intensity) return false;
  
  return true;
}

export function getNearestStations(
  stations: SeismicStation[],
  epicenter: { lat: number; lng: number },
  limit: number = 5
): SeismicStation[] {
  return [...stations]
    .map(station => ({
      ...station,
      distance_km: calculateDistanceFromEpicenter(
        { lat: station.location.lat, lng: station.location.lng },
        epicenter
      )
    }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Create earthquake event from external API
 */
export async function createEarthquakeEvent(
  event: Omit<EarthquakeEvent, 'id' | 'created_at'>
): Promise<EarthquakeEvent> {
  const { data, error } = await supabase
    .from('earthquake_events')
    .insert({
      earthquake_id: event.earthquake_id,
      magnitude: event.magnitude,
      magnitude_type: event.magnitude_type,
      epicenter: event.epicenter,
      origin_time: event.origin_time.toISOString(),
      status: event.status,
      contributing_stations: event.contributing_stations,
      confidence_score: event.confidence_score
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create earthquake event: ${error.message}`);
  
  return data;
}

/**
 * Get earthquake event by ID
 */
export async function getEarthquakeEvent(
  eventId: string
): Promise<EarthquakeEvent | null> {
  const { data, error } = await supabase
    .from('earthquake_events')
    .select('*')
    .eq('id', eventId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch earthquake event: ${error.message}`);
  }
  
  return data;
}

/**
 * Update earthquake event status
 */
export async function updateEarthquakeStatus(
  eventId: string,
  status: EarthquakeStatus,
  updates?: Partial<EarthquakeEvent>
): Promise<void> {
  const { error } = await supabase
    .from('earthquake_events')
    .update({
      status,
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', eventId);
  
  if (error) throw new Error(`Failed to update earthquake status: ${error.message}`);
}

/**
 * Create early warning
 */
export async function createEarlyWarning(
  warning: Omit<EarlyWarning, 'id' | 'generated_at'>
): Promise<EarlyWarning> {
  const { data, error } = await supabase
    .from('early_warnings')
    .insert({
      earthquake_id: warning.earthquake_id,
      warning_area: warning.warning_area,
      alert_level: warning.alert_level,
      estimated_intensity: warning.estimated_intensity,
      estimated_shaking_duration_seconds: warning.estimated_shaking_duration_seconds,
      seconds_before_arrival: warning.seconds_before_arrival,
      safety_actions: warning.safety_actions,
      expires_at: warning.expires_at?.toISOString()
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create early warning: ${error.message}`);
  
  return data;
}

/**
 * Get early warnings for earthquake
 */
export async function getEarlyWarnings(
  earthquakeId: string
): Promise<EarlyWarning[]> {
  const { data, error } = await supabase
    .from('early_warnings')
    .select('*')
    .eq('earthquake_id', earthquakeId)
    .order('generated_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch early warnings: ${error.message}`);
  
  return data || [];
}

/**
 * Get user's earthquake preferences
 */
export async function getUserEarthquakePreferences(
  userId: string
): Promise<UserEarthquakePreference | null> {
  const { data, error } = await supabase
    .from('user_earthquake_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch preferences: ${error.message}`);
  }
  
  return data;
}

/**
 * Save user's earthquake preferences
 */
export async function saveUserEarthquakePreferences(
  preferences: Omit<UserEarthquakePreference, 'id' | 'user_id'>
): Promise<UserEarthquakePreference> {
  const { data: existing } = await supabase
    .from('user_earthquake_preferences')
    .select('id')
    .eq('user_id', preferences.user_id)
    .single();
  
  if (existing) {
    const { data, error } = await supabase
      .from('user_earthquake_preferences')
      .update({
        alert_enabled: preferences.alert_enabled,
        minimum_magnitude: preferences.minimum_magnitude,
        alert_level_threshold: preferences.alert_level_threshold,
        indoor_location: preferences.indoor_location,
        outdoor_location: preferences.outdoor_location,
        receive_shake_alerts: preferences.receive_shake_alerts,
        receive_aftershock_alerts: preferences.receive_aftershock_alerts,
        notify_emergency_contacts: preferences.notify_emergency_contacts,
        auto_record_video: preferences.auto_record_video
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update preferences: ${error.message}`);
    return data;
  }
  
  const { data, error } = await supabase
    .from('user_earthquake_preferences')
    .insert({
      user_id: preferences.user_id,
      alert_enabled: preferences.alert_enabled,
      minimum_magnitude: preferences.minimum_magnitude,
      alert_level_threshold: preferences.alert_level_threshold,
      indoor_location: preferences.indoor_location,
      outdoor_location: preferences.outdoor_location,
      receive_shake_alerts: preferences.receive_shake_alerts,
      receive_aftershock_alerts: preferences.receive_aftershock_alerts,
      notify_emergency_contacts: preferences.notify_emergency_contacts,
      auto_record_video: preferences.auto_record_video
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create preferences: ${error.message}`);
  return data;
}

/**
 * Record alert notification sent
 */
export async function recordAlertNotification(
  notification: Omit<EarthquakeAlertNotification, 'id' | 'created_at'>
): Promise<EarthquakeAlertNotification> {
  const { data, error } = await supabase
    .from('earthquake_alert_notifications')
    .insert({
      earthquake_id: notification.earthquake_id,
      user_id: notification.user_id,
      notification_type: notification.notification_type,
      alert_level: notification.alert_level,
      seconds_before_shaking: notification.seconds_before_shaking,
      estimated_intensity: notification.estimated_intensity,
      was_perceived: notification.was_perceived,
      perception_time: notification.perception_time?.toISOString()
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to record notification: ${error.message}`);
  return data;
}

/**
 * Get nearby seismic stations
 */
export async function getNearbySeismicStations(
  location: { lat: number; lng: number },
  radiusKm: number = 200
): Promise<SeismicStation[]> {
  const minLat = location.lat - (radiusKm / 111);
  const maxLat = location.lat + (radiusKm / 111);
  const minLng = location.lng - (radiusKm / (111 * Math.cos(toRad(location.lat))));
  const maxLng = location.lng + (radiusKm / (111 * Math.cos(toRad(location.lat))));
  
  const { data, error } = await supabase
    .from('seismic_stations')
    .select('*')
    .gte('location->lat', minLat)
    .lte('location->lat', maxLat)
    .gte('location->lng', minLng)
    .lte('location->lng', maxLng);
  
  if (error) throw new Error(`Failed to fetch stations: ${error.message}`);
  
  return (data || []).map(station => ({
    ...station,
    distance_km: calculateDistanceFromEpicenter(
      { lat: station.location.lat, lng: station.location.lng },
      location
    )
  }));
}

/**
 * Get recent earthquakes
 */
export async function getRecentEarthquakes(
  hours: number = 24,
  minMagnitude: number = 3.0
): Promise<EarthquakeEvent[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('earthquake_events')
    .select('*')
    .gte('origin_time', since.toISOString())
    .gte('magnitude', minMagnitude)
    .in('status', ['confirmed', 'final'])
    .order('origin_time', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch recent earthquakes: ${error.message}`);
  
  return data || [];
}

/**
 * Get earthquake analytics
 */
export async function getEarthquakeAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<EarthquakeAnalytics> {
  let query = supabase
    .from('earthquake_alert_notifications')
    .select('earthquake_id, alert_level, seconds_before_shaking, was_perceived');
  
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }
  
  const { data: notifications, error } = await query;
  
  if (error) throw new Error(`Failed to fetch analytics: ${error.message}`);
  
  const { data: events } = await supabase
    .from('earthquake_events')
    .select('id, magnitude, estimated_intensity')
    .in('status', ['confirmed', 'final']);
  
  if (error) throw new Error(`Failed to fetch events: ${error.message}`);
  
  const perceivedCount = notifications?.filter(n => n.was_perceived).length || 0;
  const totalNotifications = notifications?.length || 0;
  
  const avgWarningTime = notifications?.reduce(
    (sum, n) => sum + (n.seconds_before_shaking || 0),
    0
  ) / (totalNotifications || 1);
  
  return {
    total_alerts_sent: totalNotifications,
    earthquakes_detected: events?.length || 0,
    average_warning_time_seconds: Math.round(avgWarningTime),
    alert_accuracy_rate: totalNotifications > 0 ? perceivedCount / totalNotifications : 0,
    user_response_rate: 0, // Would need user action tracking
    most_common_intensity: 5,
    peak_intensity_recorded: Math.max(...(events?.map(e => e.estimated_intensity || 0) || [0]))
  };
}

/**
 * Record earthquake perception
 */
export async function recordEarthquakePerception(
  notificationId: string,
  perceptionTime: Date
): Promise<void> {
  const { error } = await supabase
    .from('earthquake_alert_notifications')
    .update({
      was_perceived: true,
      perception_time: perceptionTime.toISOString()
    })
    .eq('id', notificationId);
  
  if (error) throw new Error(`Failed to record perception: ${error.message}`);
}

/**
 * Create/update shake map
 */
export async function saveShakeMap(
  shakeMap: Omit<ShakeMap, 'id' | 'created_at'>
): Promise<ShakeMap> {
  const { data, error } = await supabase
    .from('shake_maps')
    .upsert({
      earthquake_id: shakeMap.earthquake_id,
      grid_points: shakeMap.grid_points,
      version: shakeMap.version
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to save shake map: ${error.message}`);
  return data;
}

/**
 * Get shake intensity at location
 */
export async function getShakeIntensityAtLocation(
  earthquakeId: string,
  location: { lat: number; lng: number }
): Promise<number | null> {
  const { data, error } = await supabase
    .from('shake_maps')
    .select('grid_points')
    .eq('earthquake_id', earthquakeId)
    .order('version', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch shake map: ${error.message}`);
  }
  
  if (!data) return null;
  
  // Find nearest grid point
  let nearestPoint = null;
  let minDistance = Infinity;
  
  for (const point of data.grid_points) {
    const distance = calculateDistanceFromEpicenter(location, { lat: point.lat, lng: point.lng });
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  }
  
  return nearestPoint?.intensity || null;
}

/**
 * Create aftershock warning
 */
export async function createAftershockWarning(
  mainEventId: string,
  aftershock: EarthquakeEvent
): Promise<void> {
  const { error } = await supabase
    .from('aftershock_warnings')
    .insert({
      main_event_id: mainEventId,
      aftershock_id: aftershock.earthquake_id,
      magnitude: aftershock.magnitude,
      epicenter: aftershock.epicenter,
      origin_time: aftershock.origin_time.toISOString()
    });
  
  if (error) throw new Error(`Failed to create aftershock warning: ${error.message}`);
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getMagnitudeTypeLabel(type: 'ML' | 'Ms' | 'Mb' | 'Mw'): string {
  return earthquakeConfig.display.magnitudeTypeLabels[type];
}

export function getIntensityLabel(intensity: number): string {
  const labels: Record<number, string> = {
    1: 'Not Felt',
    2: 'Weak',
    3: 'Weak',
    4: 'Light',
    5: 'Moderate',
    6: 'Strong',
    7: 'Very Strong',
    8: 'Severe',
    9: 'Violent',
    10: 'Extreme',
    11: 'Extreme',
    12: 'Extreme'
  };
  return labels[intensity] || 'Unknown';
}

export function formatWarningTime(seconds: number): string {
  if (seconds < 5) {
    return `< 5 seconds`;
  }
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  }
  if (seconds < 120) {
    return `~1 minute`;
  }
  return `${Math.round(seconds / 60)} seconds`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 10) {
    return `${seconds} seconds`;
  }
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''}`;
}
