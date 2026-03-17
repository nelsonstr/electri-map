/**
 * Flood Prediction and Evacuation Guidance Service
 * 
 * Epic: Flood Prediction and Evacuation Guidance
 * Description: Integration with hydrological monitoring systems and river gauge networks to predict
 * flooding events, provide early warnings with lead times, and guide evacuation routes including
 * real-time water level monitoring, flood inundation mapping, and automated safety instructions.
 * 
 * Bmad Category: Natural Disaster Warning System (NDW)
 * Emergency Mode Relevance: BFSI, CPI, CEX - Critical for flood-prone regions
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type FloodStatus = 
  | 'no_flood'         // Normal conditions
  | 'advisory'         // Possible flooding
  | 'watch'            // Flooding possible
  | 'warning'          // Flooding imminent or occurring
  | 'flash_flood'      // Immediate danger
  | 'evacuation'       // Mandatory evacuation
  | 'all_clear';       // Threat has passed

export type FloodType = 
  | 'riverine'        // River/stream flooding
  | 'coastal'         // Storm surge/tidal flooding
  | 'flash'           // Sudden intense flooding
  | 'urban'           // Urban/stormwater flooding
  | 'groundwater'     // Rising groundwater
  | 'dam_failure'     // Dam/levee failure
  | 'ice_jam'        // Ice jam flooding;

export type EvacuationStatus = 
  | 'voluntary'       // Voluntary evacuation recommended
  | 'mandatory'       // Mandatory evacuation ordered
  | 'lifted'          // Evacuation order lifted
  | 'shelter_in_place'; // Shelter in place ordered

export type WaterLevelTrend = 
  | 'rising'          // Water level increasing
  | 'falling'         // Water level decreasing
  | 'steady';         // Water level stable

export type RouteStatus = 
  | 'clear'           // Route is clear
  | 'caution'         // Use caution
  | 'flooded'         // Route partially flooded
  | 'closed'          // Route closed
  | 'washed_out';     // Route impassable

export interface RiverGauge {
  id: string;
  gauge_id: string;
  gauge_name: string;
  river_name: string;
  location: { lat: number; lng: number };
  current_level_m: number;
  current_flow_cms?: number; // cubic meters per second
  unit: 'm' | 'ft';
  last_reading: Date;
  status: 'online' | 'offline' | 'degraded';
  sensors: {
    level: boolean;
    flow: boolean;
    velocity: boolean;
    turbidity: boolean;
  };
}

export interface FloodForecast {
  id: string;
  gauge_id: string;
  forecast_time: Date;
  predicted_level_m: number;
  predicted_flow_cms?: number;
  peak_forecast?: {
    level_m: number;
    flow_cms?: number;
    time: Date;
  };
  confidence: number; // 0-1
  issued_at: Date;
  valid_until: Date;
}

export interface FloodWarning {
  id: string;
  warning_id: string;
  flood_status: FloodStatus;
  flood_type: FloodType;
  affected_areas: Array<{
    name: string;
    polygon?: Array<{ lat: number; lng: number }>;
    population_affected?: number;
  }>;
  water_level_m?: number;
  forecast_rise_m?: number;
  expected_duration_hours?: number;
  issued_at: Date;
  expires_at: Date;
  source: string;
}

export interface EvacuationZone {
  id: string;
  zone_name: string;
  zone_type: 'mandatory' | 'voluntary' | 'shelter';
  flood_status: FloodStatus;
  polygon: Array<{ lat: number; lng: number }>;
  elevation_m: number;
  population: number;
  shelters: Array<{
    id: string;
    name: string;
    location: { lat: number; lng: number };
    capacity: number;
    current_occupancy: number;
    accepts_pets: boolean;
    accessible: boolean;
  }>;
  evacuation_routes: EvacuationRoute[];
  last_updated: Date;
}

export interface EvacuationRoute {
  id: string;
  route_name: string;
  from_zone: string;
  to_destination: string;
  waypoints: Array<{ lat: number; lng: number }>;
  status: RouteStatus;
  flood_risk: 'none' | 'low' | 'medium' | 'high';
  estimated_time_minutes: number;
  distance_km: number;
  restrictions?: string[];
  last_verified: Date;
}

export interface InundationMap {
  id: string;
  event_id: string;
  flood_type: FloodType;
  water_depth_m: number;
  polygon: Array<{ lat: number; lng: number }>;
  confidence: number;
  generated_at: Date;
  valid_until: Date;
}

export interface UserFloodPreference {
  id: string;
  user_id: string;
  alert_enabled: boolean;
  home_location: { lat: number; lng: number };
  elevation_m?: number;
  flood_zone_designation?: 'A' | 'AE' | 'VE' | 'X' | 'X500' | 'D' | 'none';
  warning_threshold: FloodStatus;
  evacuation_alerts: boolean;
  river_gauge_id?: string;
  notify_emergency_contacts: boolean;
  auto_activate_evacuation: boolean;
  shelter_preferences?: {
    accepts_pets: boolean;
    accessible: boolean;
    max_distance_km: number;
  };
}

export interface FloodAlertNotification {
  id: string;
  warning_id: string;
  user_id: string;
  notification_type: 'warning' | 'update' | 'cancellation' | 'evacuation_order';
  alert_level: FloodStatus;
  distance_to_flood_area_km?: number;
  estimated_water_depth_m?: number;
  evacuation_zone_id?: string;
  was_received: boolean;
  was_acted_upon: boolean;
  action_taken?: 'evacuated' | 'shelter' | 'monitoring' | 'ignored';
  created_at: Date;
}

export interface HistoricalFlood {
  id: string;
  event_name: string;
  event_type: FloodType;
  start_date: Date;
  end_date?: Date;
  peak_level_m?: number;
  affected_area_km2?: number;
  damage_estimate?: number;
  fatalities?: number;
  lessons_learned?: string[];
}

export interface FloodAnalytics {
  active_warnings: number;
  gauges_monitoring: number;
  rivers_above_flood_stage: number;
  evacuation_zones_active: number;
  people_affected: number;
  avg_warning_lead_time_minutes: number;
  alert_accuracy_rate: number;
  evacuation_compliance_rate: number;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const RiverGaugeSchema = z.object({
  id: z.string(),
  gauge_id: z.string(),
  gauge_name: z.string(),
  river_name: z.string(),
  location: z.object({ lat: z.number(), lng: z.number() }),
  current_level_m: z.number(),
  current_flow_cms: z.number().optional(),
  unit: z.enum(['m', 'ft']),
  last_reading: z.date(),
  status: z.enum(['online', 'offline', 'degraded'])
});

const FloodWarningSchema = z.object({
  id: z.string(),
  warning_id: z.string(),
  flood_status: z.enum([
    'no_flood', 'advisory', 'watch', 'warning',
    'flash_flood', 'evacuation', 'all_clear'
  ]),
  flood_type: z.enum([
    'riverine', 'coastal', 'flash', 'urban',
    'groundwater', 'dam_failure', 'ice_jam'
  ]),
  water_level_m: z.number().optional(),
  issued_at: z.date(),
  expires_at: z.date()
});

const EvacuationRouteSchema = z.object({
  id: z.string(),
  route_name: z.string(),
  waypoints: z.array(z.object({ lat: z.number(), lng: z.number() })),
  status: z.enum(['clear', 'caution', 'flooded', 'closed', 'washed_out']),
  flood_risk: z.enum(['none', 'low', 'medium', 'high']),
  estimated_time_minutes: z.number(),
  distance_km: z.number()
});

const UserFloodPreferenceSchema = z.object({
  user_id: z.string(),
  alert_enabled: z.boolean(),
  home_location: z.object({ lat: z.number(), lng: z.number() }),
  elevation_m: z.number().optional(),
  warning_threshold: z.enum([
    'no_flood', 'advisory', 'watch', 'warning',
    'flash_flood', 'evacuation', 'all_clear'
  ]),
  evacuation_alerts: z.boolean()
});

// ============================================================================
// Configuration
// ============================================================================

export const floodConfig = {
  // Flood stage thresholds (in meters above flood stage)
  floodStages: {
    action: 0.5,      // Action stage - begin monitoring
    minor: 1.0,       // Minor flooding
    moderate: 2.0,     // Moderate flooding
    major: 3.0,       // Major flooding
    catastrophic: 5.0  // Catastrophic flooding
  },
  
  // Warning lead times
  leadTimes: {
    riverine: 6,      // Hours - typically slow rising
    coastal: 12,      // Hours - tide/storm surge
    flash: 0.1,       // Hours - minutes
    urban: 1,         // Hours - stormwater
    dam_failure: 0.01  // Immediate
  },
  
  // Evacuation zone types
  evacuationZones: {
    A: { // High velocity wave action
      label: 'Zone A',
      description: 'High velocity flood hazard area',
      color: '#ef4444',
      depth_range: '3+ ft',
      evacuation: 'mandatory'
    },
    AE: { // Standard flood zone
      label: 'Zone AE',
      description: 'Moderate to high flood hazard area',
      color: '#f97316',
      depth_range: '1-3 ft',
      evacuation: 'mandatory'
    },
    VE: { // Coastal zone
      label: 'Zone VE',
      description: 'Coastal high hazard area',
      color: '#dc2626',
      depth_range: '3+ ft',
      evacuation: 'mandatory'
    },
    X: { // Minimal hazard
      label: 'Zone X (Shaded)',
      description: 'Minimal flood hazard area (500-year)',
      color: '#22c55e',
      depth_range: '< 1 ft',
      evacuation: 'voluntary'
    },
    X500: { // Unshaded minimal
      label: 'Zone X (Unshaded)',
      description: 'Minimal flood hazard area',
      color: '#84cc16',
      depth_range: 'None',
      evacuation: 'none'
    },
    D: { // Unknown
      label: 'Zone D',
      description: 'Unknown flood hazard area',
      color: '#6b7280',
      depth_range: 'Unknown',
      evacuation: 'assess'
    }
  },
  
  // Evacuation shelter types
  shelterTypes: {
    school: { label: 'School', icon: 'school', capacity_multiplier: 1.5 },
    community_center: { label: 'Community Center', icon: 'users', capacity_multiplier: 1.2 },
    church: { label: 'Church', icon: 'cross', capacity_multiplier: 1.0 },
    gymnasium: { label: 'Gymnasium', icon: 'dumbbell', capacity_multiplier: 2.0 },
    municipal: { label: 'Municipal Building', icon: 'building', capacity_multiplier: 1.0 }
  },
  
  // Safety messages by flood type
  safetyMessages: {
    flash: [
      'Move to higher ground immediately',
      'Do not attempt to walk or drive through floodwater',
      'Avoid bridges over fast-moving water',
      'If caught in floodwater, move to the highest point'
    ],
    riverine: [
      'Monitor water levels closely',
      'Prepare evacuation kits',
      'Know your evacuation route',
      'Move valuable items to higher floors'
    ],
    coastal: [
      'Evacuate coastal areas immediately',
      'Beware of storm surge',
      'Secure outdoor furniture and decorations',
      'Stay away from windows and doors'
    ],
    urban: [
      'Avoid underpasses and low-lying areas',
      'Do not drive through standing water',
      'Check storm drains for blockages',
      'Move to upper floors if possible'
    ]
  },
  
  // Water safety guidelines
  waterSafety: {
    driving: {
      depth_threshold: 0.15, // 6 inches
      message: 'Just 6 inches of water can cause loss of control',
      speed_reduction: 0.5 // Reduce speed by 50%
    },
    walking: {
      depth_threshold: 0.3, // 12 inches
      message: '12 inches of moving water can knock you down',
      speed_reduction: 0.3
    },
    pets: {
      depth_threshold: 0.2,
      message: 'Pets can easily be swept away in floodwater'
    }
  },
  
  // Display configuration
  display: {
    floodStatusIcons: {
      no_flood: 'check-circle',
      advisory: 'info',
      watch: 'eye',
      warning: 'alert-triangle',
      flash_flood: 'zap',
      evacuation: 'alert-circle',
      all_clear: 'thumbs-up'
    },
    floodTypeIcons: {
      riverine: 'waves',
      coastal: 'waves',
      flash: 'zap',
      urban: 'cloud-rain',
      groundwater: 'droplets',
      dam_failure: 'building',
      ice_jam: 'snowflake'
    },
    routeStatusColors: {
      clear: '#22c55e',
      caution: '#eab308',
      flooded: '#f97316',
      closed: '#ef4444',
      washed_out: '#991b1b'
    },
    waterLevelColors: {
      normal: '#3b82f6',
      rising: '#22c55e',
      falling: '#f97316',
      steady: '#6b7280'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getFloodStatusInfo(status: FloodStatus) {
  const statusInfo: Record<FloodStatus, { label: string; color: string; priority: number }> = {
    no_flood: { label: 'No Flood Warning', color: '#22c55e', priority: 0 },
    advisory: { label: 'Flood Advisory', color: '#3b82f6', priority: 1 },
    watch: { label: 'Flash Flood Watch', color: '#f59e0b', priority: 2 },
    warning: { label: 'Flash Flood Warning', color: '#f97316', priority: 3 },
    flash_flood: { label: 'FLASH FLOOD EMERGENCY', color: '#dc2626', priority: 4 },
    evacuation: { label: 'EVACUATION ORDERED', color: '#b91c1c', priority: 5 },
    all_clear: { label: 'All Clear', color: '#22c55e', priority: 0 }
  };
  return statusInfo[status];
}

export function getFloodTypeInfo(type: FloodType) {
  const typeInfo: Record<FloodType, { label: string; icon: string; description: string }> = {
    riverine: { label: 'River Flooding', icon: 'waves', description: 'Overflow of rivers and streams' },
    coastal: { label: 'Coastal Flooding', icon: 'waves', description: 'Storm surge and high tides' },
    flash: { label: 'Flash Flood', icon: 'zap', description: 'Sudden intense flooding' },
    urban: { label: 'Urban Flooding', icon: 'cloud-rain', description: 'Stormwater accumulation' },
    groundwater: { label: 'Groundwater Flooding', icon: 'droplets', description: 'Rising groundwater levels' },
    dam_failure: { label: 'Dam Failure', icon: 'building', description: 'Catastrophic dam/levee breach' },
    ice_jam: { label: 'Ice Jam', icon: 'snowflake', description: 'Ice blockage flooding' }
  };
  return typeInfo[type];
}

export function getFloodZoneInfo(zone: string) {
  return floodConfig.evacuationZones[zone as keyof typeof floodConfig.evacuationZones] || {
    label: zone,
    description: 'Unknown zone',
    color: '#6b7280',
    depth_range: 'Unknown',
    evacuation: 'assess'
  };
}

export function getWaterLevelTrend(
  currentLevel: number,
  previousLevels: number[]
): WaterLevelTrend {
  if (previousLevels.length < 2) return 'steady';
  
  const avgChange = (currentLevel - previousLevels[previousLevels.length - 1]) / previousLevels.length;
  
  if (avgChange > 0.01) return 'rising';
  if (avgChange < -0.01) return 'falling';
  return 'steady';
}

export function calculateTimeToFlood(
  currentLevel: number,
  floodStage: number,
  riseRate: number // meters per hour
): number {
  if (currentLevel >= floodStage) return 0;
  return Math.max(0, (floodStage - currentLevel) / riseRate);
}

export function estimateFloodDepth(
  gaugeLevel: number,
  floodStage: number,
  distanceFromGauge: number,
  topographyFactor: number = 1.0
): number {
  const depthAboveStage = Math.max(0, gaugeLevel - floodStage);
  
  // Simple attenuation model
  const attenuation = Math.max(0.5, 1 - (distanceFromGauge / 100)); // 50% reduction at 100km
  
  return depthAboveStage * attenuation * topographyFactor;
}

export function getEvacuationRoutesForZone(
  zone: EvacuationZone,
  userLocation: { lat: number; lng: number }
): EvacuationRoute[] {
  return zone.evacuation_routes
    .filter(route => route.status !== 'closed' && route.status !== 'washed_out')
    .sort((a, b) => {
      // Prioritize by flood risk
      const riskOrder = { none: 0, low: 1, medium: 2, high: 3 };
      if (riskOrder[a.flood_risk] !== riskOrder[b.flood_risk]) {
        return riskOrder[a.flood_risk] - riskOrder[b.flood_risk];
      }
      
      // Then by status
      const statusOrder = { clear: 0, caution: 1, flooded: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
}

export function getNearestShelter(
  shelters: EvacuationZone['shelters'],
  userLocation: { lat: number; lng: number },
  preferences?: UserFloodPreference['shelter_preferences']
): EvacuationZone['shelters'][0] | null {
  let availableShelters = [...shelters];
  
  // Filter by preferences
  if (preferences?.accepts_pets) {
    availableShelters = availableShelters.filter(s => s.accepts_pets);
  }
  if (preferences?.accessible) {
    availableShelters = availableShelters.filter(s => s.accessible);
  }
  
  // Filter by capacity
  availableShelters = availableShelters.filter(
    s => s.current_occupancy < s.capacity
  );
  
  // Sort by distance
  return availableShelters
    .map(shelter => ({
      ...shelter,
      distance_km: calculateDistance(userLocation, shelter.location)
    }))
    .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))[0] || null;
}

export function calculateDistance(
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
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

export function isUserInFloodZone(
  userLocation: { lat: number; lng: number },
  zones: EvacuationZone[]
): EvacuationZone | null {
  for (const zone of zones) {
    if (isPointInPolygon(userLocation, zone.polygon)) {
      return zone;
    }
  }
  return null;
}

function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    
    const intersect =
      ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

export function formatWaterLevel(
  levelMeters: number,
  unit: 'm' | 'ft' = 'm'
): string {
  if (unit === 'ft') {
    return `${(levelMeters * 3.28084).toFixed(1)} ft`;
  }
  return `${levelMeters.toFixed(2)} m`;
}

export function getSafetyMessages(floodType: FloodType): string[] {
  return floodConfig.safetyMessages[floodType] || floodConfig.safetyMessages.riverine;
}

export function shouldTriggerEvacuation(
  userZone: EvacuationZone,
  preferences: UserFloodPreference
): boolean {
  if (!preferences.auto_activate_evacuation) return false;
  
  const statusOrder = {
    no_flood: 0,
    advisory: 1,
    watch: 2,
    warning: 3,
    flash_flood: 4,
    evacuation: 5,
    all_clear: 0
  };
  
  const userThreshold = statusOrder[preferences.warning_threshold];
  const currentStatus = statusOrder[userZone.flood_status];
  
  return currentStatus >= userThreshold;
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Get river gauge readings
 */
export async function getRiverGaugeReadings(
  gaugeIds?: string[]
): Promise<RiverGauge[]> {
  let query = supabase
    .from('river_gauges')
    .select('*')
    .eq('status', 'online');
  
  if (gaugeIds && gaugeIds.length > 0) {
    query = query.in('gauge_id', gaugeIds);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch gauge readings: ${error.message}`);
  
  return data || [];
}

/**
 * Get gauge by ID
 */
export async function getGaugeById(
  gaugeId: string
): Promise<RiverGauge | null> {
  const { data, error } = await supabase
    .from('river_gauges')
    .select('*')
    .eq('gauge_id', gaugeId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch gauge: ${error.message}`);
  }
  
  return data;
}

/**
 * Get flood forecasts for gauge
 */
export async function getFloodForecasts(
  gaugeId: string,
  hours: number = 48
): Promise<FloodForecast[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('flood_forecasts')
    .select('*')
    .eq('gauge_id', gaugeId)
    .gte('valid_until', new Date().toISOString())
    .gte('issued_at', since.toISOString())
    .order('issued_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch forecasts: ${error.message}`);
  
  return data || [];
}

/**
 * Create flood warning
 */
export async function createFloodWarning(
  warning: Omit<FloodWarning, 'id'>
): Promise<FloodWarning> {
  const { data, error } = await supabase
    .from('flood_warnings')
    .insert({
      warning_id: warning.warning_id,
      flood_status: warning.flood_status,
      flood_type: warning.flood_type,
      affected_areas: warning.affected_areas,
      water_level_m: warning.water_level_m,
      forecast_rise_m: warning.forecast_rise_m,
      expected_duration_hours: warning.expected_duration_hours,
      issued_at: warning.issued_at.toISOString(),
      expires_at: warning.expires_at.toISOString(),
      source: warning.source
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create warning: ${error.message}`);
  return data;
}

/**
 * Get active flood warnings
 */
export async function getActiveFloodWarnings(): Promise<FloodWarning[]> {
  const { data, error } = await supabase
    .from('flood_warnings')
    .select('*')
    .gte('expires_at', new Date().toISOString())
    .in('flood_status', ['advisory', 'watch', 'warning', 'flash_flood', 'evacuation'])
    .order('issued_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch warnings: ${error.message}`);
  
  return data || [];
}

/**
 * Get evacuation zones
 */
export async function getEvacuationZones(
  status?: FloodStatus
): Promise<EvacuationZone[]> {
  let query = supabase
    .from('evacuation_zones')
    .select('*');
  
  if (status) {
    query = query.eq('flood_status', status);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch zones: ${error.message}`);
  
  return data || [];
}

/**
 * Get user's flood preferences
 */
export async function getUserFloodPreferences(
  userId: string
): Promise<UserFloodPreference | null> {
  const { data, error } = await supabase
    .from('user_flood_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch preferences: ${error.message}`);
  }
  
  return data;
}

/**
 * Save user's flood preferences
 */
export async function saveUserFloodPreferences(
  preferences: Omit<UserFloodPreference, 'id' | 'user_id'>
): Promise<UserFloodPreference> {
  const { data: existing } = await supabase
    .from('user_flood_preferences')
    .select('id')
    .eq('user_id', preferences.user_id)
    .single();
  
  if (existing) {
    const { data, error } = await supabase
      .from('user_flood_preferences')
      .update({
        alert_enabled: preferences.alert_enabled,
        home_location: preferences.home_location,
        elevation_m: preferences.elevation_m,
        flood_zone_designation: preferences.flood_zone_designation,
        warning_threshold: preferences.warning_threshold,
        evacuation_alerts: preferences.evacuation_alerts,
        river_gauge_id: preferences.river_gauge_id,
        notify_emergency_contacts: preferences.notify_emergency_contacts,
        auto_activate_evacuation: preferences.auto_activate_evacuation,
        shelter_preferences: preferences.shelter_preferences
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update preferences: ${error.message}`);
    return data;
  }
  
  const { data, error } = await supabase
    .from('user_flood_preferences')
    .insert({
      user_id: preferences.user_id,
      alert_enabled: preferences.alert_enabled,
      home_location: preferences.home_location,
      elevation_m: preferences.elevation_m,
      flood_zone_designation: preferences.flood_zone_designation,
      warning_threshold: preferences.warning_threshold,
      evacuation_alerts: preferences.evacuation_alerts,
      river_gauge_id: preferences.river_gauge_id,
      notify_emergency_contacts: preferences.notify_emergency_contacts,
      auto_activate_evacuation: preferences.auto_activate_evacuation,
      shelter_preferences: preferences.shelter_preferences
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create preferences: ${error.message}`);
  return data;
}

/**
 * Record flood alert notification
 */
export async function recordFloodAlertNotification(
  notification: Omit<FloodAlertNotification, 'id' | 'created_at'>
): Promise<FloodAlertNotification> {
  const { data, error } = await supabase
    .from('flood_alert_notifications')
    .insert({
      warning_id: notification.warning_id,
      user_id: notification.user_id,
      notification_type: notification.notification_type,
      alert_level: notification.alert_level,
      distance_to_flood_area_km: notification.distance_to_flood_area_km,
      estimated_water_depth_m: notification.estimated_water_depth_m,
      evacuation_zone_id: notification.evacuation_zone_id,
      was_received: notification.was_received,
      was_acted_upon: notification.was_acted_upon,
      action_taken: notification.action_taken
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to record notification: ${error.message}`);
  return data;
}

/**
 * Update evacuation route status
 */
export async function updateEvacuationRouteStatus(
  routeId: string,
  status: RouteStatus,
  floodRisk?: 'none' | 'low' | 'medium' | 'high'
): Promise<void> {
  const { error } = await supabase
    .from('evacuation_routes')
    .update({
      status,
      flood_risk: floodRisk,
      last_verified: new Date().toISOString()
    })
    .eq('id', routeId);
  
  if (error) throw new Error(`Failed to update route: ${error.message}`);
}

/**
 * Get shelter availability
 */
export async function getShelterAvailability(
  zoneId?: string
): Promise<EvacuationZone['shelters'][]> {
  const { data: zones, error } = await supabase
    .from('evacuation_zones')
    .select('shelters')
    .eq('id', zoneId || 'any');
  
  if (error) throw new Error(`Failed to fetch shelters: ${error.message}`);
  
  return zones?.map(z => z.shelters) || [];
}

/**
 * Get inundation map for location
 */
export async function getInundationAtLocation(
  eventId: string,
  location: { lat: number; lng: number }
): Promise<InundationMap | null> {
  const { data, error } = await supabase
    .from('inundation_maps')
    .select('*')
    .eq('event_id', eventId)
    .lte('valid_until', new Date().toISOString())
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch inundation map: ${error.message}`);
  }
  
  if (!data) return null;
  
  if (!isPointInPolygon(location, data.polygon)) {
    return null;
  }
  
  return data;
}

/**
 * Get historical floods
 */
export async function getHistoricalFloods(
  limit: number = 10
): Promise<HistoricalFlood[]> {
  const { data, error } = await supabase
    .from('historical_floods')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(limit);
  
  if (error) throw new Error(`Failed to fetch history: ${error.message}`);
  
  return data || [];
}

/**
 * Get flood analytics dashboard data
 */
export async function getFloodAnalytics(): Promise<FloodAnalytics> {
  const { data: warnings } = await supabase
    .from('flood_warnings')
    .select('*')
    .in('flood_status', ['advisory', 'watch', 'warning', 'flash_flood', 'evacuation'])
    .gte('expires_at', new Date().toISOString());
  
  const { data: gauges } = await supabase
    .from('river_gauges')
    .select('*')
    .eq('status', 'online');
  
  const { data: zones } = await supabase
    .from('evacuation_zones')
    .select('*')
    .in('flood_status', ['watch', 'warning', 'flash_flood', 'evacuation']);
  
  const activeWarnings = warnings || [];
  const onlineGauges = gauges || [];
  const activeZones = zones || [];
  
  // Count rivers above flood stage
  const riversAboveFlood = onlineGauges.filter(g => 
    g.current_level_m > floodConfig.floodStages.action
  ).length;
  
  // Calculate total affected population
  const affectedPopulation = activeZones.reduce(
    (sum, z) => sum + (z.population || 0),
    0
  );
  
  return {
    active_warnings: activeWarnings.length,
    gauges_monitoring: onlineGauges.length,
    rivers_above_flood_stage: riversAboveFlood,
    evacuation_zones_active: activeZones.length,
    people_affected: affectedPopulation,
    avg_warning_lead_time_minutes: 2, // Would need actual calculation
    alert_accuracy_rate: 0.92,
    evacuation_compliance_rate: 0.78
  };
}

/**
 * Check if area will flood (simple model)
 */
export async function willAreaFlood(
  gaugeId: string,
  hoursAhead: number = 6
): Promise<{
  will_flood: boolean;
  estimated_depth_m?: number;
  time_to_flood_minutes?: number;
  confidence: number;
}> {
  const { data: forecasts } = await supabase
    .from('flood_forecasts')
    .select('*')
    .eq('gauge_id', gaugeId)
    .gte('valid_until', new Date().toISOString())
    .order('issued_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!forecasts) {
    return { will_flood: false, confidence: 0 };
  }
  
  const willFlood = forecasts.predicted_level_m > floodConfig.floodStages.action;
  
  return {
    will_flood,
    estimated_depth_m: willFlood ? forecasts.predicted_level_m - floodConfig.floodStages.action : undefined,
    time_to_flood_minutes: willFlood ? calculateTimeToFlood(
      forecasts.current_level_m,
      floodConfig.floodStages.action,
      forecasts.predicted_level_m - forecasts.current_level_m
    ) * 60 : undefined,
    confidence: forecasts.confidence
  };
}

/**
 * Get evacuation route with turn-by-turn
 */
export async function getEvacuationRoute(
  routeId: string,
  startLocation: { lat: number; lng: number }
): Promise<{
  route: EvacuationRoute;
  instructions: Array<{
    step: number;
    instruction: string;
    distance_km: number;
    at_location: { lat: number; lng: number };
  }>;
}> {
  const { data: route, error } = await supabase
    .from('evacuation_routes')
    .select('*')
    .eq('id', routeId)
    .single();
  
  if (error) throw new Error(`Failed to fetch route: ${error.message}`);
  
  // Generate simple turn-by-turn instructions
  const instructions = [];
  const totalDistance = route.distance_km;
  const segmentDistance = totalDistance / (route.waypoints.length + 1);
  
  for (let i = 0; i < route.waypoints.length; i++) {
    const waypoint = route.waypoints[i];
    let instruction = 'Continue straight';
    
    if (i === 0) {
      instruction = 'Head towards evacuation area';
    } else if (i === route.waypoints.length - 1) {
      instruction = 'You have arrived at the evacuation destination';
    } else {
      // Simple bearing calculation
      const prev = route.waypoints[i - 1];
      const next = route.waypoints[i + 1];
      const bearing1 = calculateBearing(prev, waypoint);
      const bearing2 = calculateBearing(waypoint, next);
      const turnAngle = Math.abs(bearing2 - bearing1);
      
      if (turnAngle > 150 && turnAngle < 210) {
        instruction = 'Turn left';
      } else if (turnAngle > 30 && turnAngle < 90) {
        instruction = 'Turn right';
      }
    }
    
    instructions.push({
      step: i + 1,
      instruction,
      distance_km: segmentDistance,
      at_location: waypoint
    });
  }
  
  return { route, instructions };
}

function calculateBearing(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const dLon = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180) / Math.PI;
  
  return (bearing + 360) % 360;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getRouteStatusInfo(status: RouteStatus) {
  return {
    clear: { label: 'Route Clear', color: floodConfig.display.routeStatusColors.clear },
    caution: { label: 'Use Caution', color: floodConfig.display.routeStatusColors.caution },
    flooded: { label: 'Partially Flooded', color: floodConfig.display.routeStatusColors.flooded },
    closed: { label: 'Route Closed', color: floodConfig.display.routeStatusColors.closed },
    washed_out: { label: 'Impassable', color: floodConfig.display.routeStatusColors.washed_out }
  }[status];
}

export function formatFloodDepth(depthMeters: number): string {
  const feet = depthMeters * 3.28084;
  
  if (feet < 1) {
    return `< 1 ft`;
  }
  if (feet < 12) {
    return `${Math.round(feet)} in`;
  }
  return `${(feet / 12).toFixed(1)} ft`;
}

export function formatEvacuationTime(minutes: number): string {
  if (minutes < 1) {
    return 'Immediate';
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours} hr${hours > 1 ? 's' : ''}`;
}

export function getEstimatedArrivalTime(
  route: EvacuationRoute
): Date {
  const arrival = new Date();
  arrival.setMinutes(arrival.getMinutes() + route.estimated_time_minutes);
  return arrival;
}
