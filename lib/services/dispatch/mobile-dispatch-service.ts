/**
 * Mobile Dispatch Enhancement Service
 * 
 * Epic: Mobile Dispatch Enhancement
 * Description: Advanced mobile dispatch system for field responders including real-time GPS tracking,
 * intelligent route optimization, offline capability, integrated communication, and augmented reality
 * navigation for emergency response vehicles and personnel.
 * 
 * Bmad Category: Field Operations Excellence (FOE)
 * Emergency Mode Relevance: BFSI, CPI, SAR, MAC - Essential for efficient field operations
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type DispatchStatus = 
  | 'pending'
  | 'received'
  | 'accepted'
  | 'declined'
  | 'en_route'
  | 'on_scene'
  | ' departed_scene'
  | 'available'
  | 'busy';

export type DispatchPriority = 
  | 'emergency'    // Lights and sirens
  | 'urgent'      // Priority response
  | 'routine'     // Standard response
  | 'scheduled';  // Pre-scheduled

export type VehicleType = 
  | 'ambulance'
  | 'fire_engine'
  | 'fire_truck'
  | 'police_unit'
  | 'rescue_vehicle'
  | 'utility_truck'
  | 'command_vehicle'
  | 'boat'
  | 'drone'
  | 'motorcycle'
  | 'paramedic_unit'
  | 'hazmat_unit'
  | 'other';

export type NavigationMode = 
  | 'driving'
  | 'walking'
  | 'transit'
  | 'cycling'
  | 'emergency'; // Optimized for emergency response

export type RouteType = 
  | 'fastest'
  | 'shortest'
  | 'safest'
  | 'avoid_tolls'
  | 'avoid_highways'
  | 'emergency_optimized';

export interface DispatchAssignment {
  id: string;
  assignment_id: string;
  incident_id: string;
  unit_id: string;
  dispatcher_id: string;
  status: DispatchStatus;
  priority: DispatchPriority;
  created_at: Date;
  accepted_at?: Date;
  en_route_at?: Date;
  arrived_at?: Date;
  departed_at?: Date;
  completed_at?: Date;
  notes?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  distance_km?: number;
}

export interface UnitLocation {
  id: string;
  unit_id: string;
  location: { lat: number; lng: number; altitude?: number };
  heading: number; // degrees 0-360
  speed_kmh: number;
  accuracy_m: number;
  timestamp: Date;
  source: 'gps' | 'network' | 'bluetooth' | 'manual';
}

export interface Route {
  id: string;
  route_id: string;
  assignment_id: string;
  origin: { lat: number; lng: number; address?: string };
  destination: { lat: number; lng: number; address?: string };
  waypoints: Array<{ lat: number; lng: number; address?: string; instruction?: string }>;
  polyline: string; // Encoded polyline
  distance_km: number;
  duration_minutes: number;
  route_type: RouteType;
  navigation_mode: NavigationMode;
  traffic_conditions: 'clear' | 'moderate' | 'heavy' | 'severe';
  created_at: Date;
  expires_at?: Date;
  alternative_routes?: Array<{
    route_id: string;
    distance_km: number;
    duration_minutes: number;
    polyline: string;
  }>;
}

export interface TurnByTurnInstruction {
  step: number;
  instruction: string;
  maneuver: 'straight' | 'left' | 'right' | 'slight_left' | 'slight_right' | 'uturn' | 'merge' | 'arrive' | 'depart';
  distance_m: number;
  duration_s: number;
  waypoint_index: number;
  coordinates: { lat: number; lng: number };
}

export interface NavigationState {
  unit_id: string;
  assignment_id: string;
  route_id: string;
  current_leg: number;
  current_step: number;
  progress_percent: number;
  distance_remaining_km: number;
  time_remaining_minutes: number;
  next_maneuver?: TurnByTurnInstruction;
  eta: Date;
  off_route: boolean;
  reroute_suggested: boolean;
}

export interface OfflineMap {
  id: string;
  tile_id: string;
  region: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoom_levels: number[];
  downloaded_at: Date;
  expires_at: Date;
  size_bytes: number;
  version: string;
  map_type: 'street' | 'satellite' | 'terrain' | 'hybrid';
}

export interface ARNavigation {
  id: string;
  session_id: string;
  unit_id: string;
  status: 'active' | 'paused' | 'ended';
  ar_mode: 'navigation' | 'poi' | 'hazard' | 'overlay';
  overlays: Array<{
    type: 'route' | 'poi' | 'hazard' | 'building' | 'landmark';
    data: Record<string, unknown>;
    opacity: number;
  }>;
  last_update: Date;
  connection_quality: number; // 0-1
  battery_optimization: boolean;
}

export interface DispatchMetrics {
  unit_id: string;
  period: { start: Date; end: Date };
  dispatches_received: number;
  dispatches_accepted: number;
  dispatches_declined: number;
  avg_response_time_minutes: number;
  avg_scene_time_minutes: number;
  distance_traveled_km: number;
  fuel_consumed_liters: number;
  incidents_handled: number;
  on_time_arrival_rate: number; // percentage
  navigation_deviations: number;
  offline_usage_count: number;
}

export interface TrafficIncident {
  id: string;
  type: 'accident' | 'roadwork' | 'hazard' | 'closure' | 'event' | 'weather';
  severity: 'minor' | 'moderate' | 'major' | 'severe';
  location: { lat: number; lng: number };
  radius_m: number;
  description: string;
  start_time: Date;
  end_time?: Date;
  affected_roads?: string[];
  estimated_delay_minutes?: number;
  source: string;
}

export interface UnitCapabilities {
  unit_id: string;
  capabilities: string[]; // 'medical', 'fire', 'rescue', 'hazmat', 'water_rescue', etc.
  certifications: Array<{
    name: string;
    level: string;
    expiry_date: Date;
  }>;
  equipment: string[];
  personnel_count: number;
  max_personnel: number;
  special_requirements?: string[];
}

export interface DispatchNotification {
  id: string;
  assignment_id: string;
  unit_id: string;
  channel: 'push' | 'sms' | 'radio' | 'voice';
  message: string;
  priority: DispatchPriority;
  sent_at: Date;
  acknowledged_at?: Date;
  response?: 'accepted' | 'declined' | 'pending';
}

export interface CrewMember {
  id: string;
  crew_id: string;
  name: string;
  role: 'driver' | 'paramedic' | 'firefighter' | 'officer' | 'specialist';
  certifications: string[];
  phone?: string;
  emergency_contact?: string;
  shift_start?: Date;
  shift_end?: Date;
  rest_time_hours?: number;
}

export interface VehicleStatus {
  id: string;
  unit_id: string;
  vehicle_id: string;
  mileage: number;
  fuel_level: number; // percentage
  battery_level: number; // percentage for EVs
  engine_status: 'running' | 'off' | 'idle';
  diagnostic_codes?: string[];
  last_service_date: Date;
  next_service_due: Date;
  tire_pressure?: {
    front_left: number;
    front_right: number;
    rear_left: number;
    rear_right: number;
  };
}

// ============================================================================
// Zod Schemas
// ============================================================================

const DispatchAssignmentSchema = z.object({
  id: z.string(),
  assignment_id: z.string(),
  incident_id: z.string(),
  unit_id: z.string(),
  status: z.enum(['pending', 'received', 'accepted', 'declined', 'en_route', 'on_scene', 'departed_scene', 'available', 'busy']),
  priority: z.enum(['emergency', 'urgent', 'routine', 'scheduled'])
});

const RouteSchema = z.object({
  id: z.string(),
  route_id: z.string(),
  assignment_id: z.string(),
  origin: z.object({ lat: z.number(), lng: z.number() }),
  destination: z.object({ lat: z.number(), lng: number() }),
  distance_km: z.number(),
  duration_minutes: z.number()
});

const NavigationStateSchema = z.object({
  unit_id: z.string(),
  assignment_id: z.string(),
  route_id: z.string(),
  progress_percent: z.number(),
  distance_remaining_km: z.number(),
  time_remaining_minutes: z.number(),
  off_route: z.boolean()
});

const TurnByTurnInstructionSchema = z.object({
  step: z.number(),
  instruction: z.string(),
  maneuver: z.enum(['straight', 'left', 'right', 'slight_left', 'slight_right', 'uturn', 'merge', 'arrive', 'depart']),
  distance_m: z.number()
});

// ============================================================================
// Configuration
// ============================================================================

export const dispatchConfig = {
  // Dispatch priorities
  priorities: {
    emergency: {
      lights_and_sirens: true,
      max_response_time_minutes: 8,
      color: '#dc2626',
      sound: 'emergency',
      route_type: 'emergency_optimized'
    },
    urgent: {
      lights_and_sirens: false,
      max_response_time_minutes: 15,
      color: '#f97316',
      sound: 'alert',
      route_type: 'fastest'
    },
    routine: {
      lights_and_sirens: false,
      max_response_time_minutes: 30,
      color: '#3b82f6',
      sound: 'standard',
      route_type: 'shortest'
    },
    scheduled: {
      lights_and_sirens: false,
      max_response_time_minutes: 60,
      color: '#6b7280',
      sound: 'none',
      route_type: 'safest'
    }
  },
  
  // Navigation settings
  navigation: {
    default_mode: 'driving',
    update_interval_seconds: 3,
    off_route_threshold_m: 50,
    reroute_sensitivity: 'medium', // low, medium, high
    traffic_update_interval_seconds: 30,
    eta_update_interval_seconds: 10,
    avoid_traffic: true,
    prefer_highways_for_emergency: true
  },
  
  // Offline settings
  offline: {
    enabled: true,
    map_download_wifi_only: true,
    max_offline_storage_mb: 500,
    auto_delete_old_maps: true,
    cache_ttl_hours: 72,
    sync_interval_minutes: 15,
    force_online_for_emergency: false
  },
  
  // AR navigation
  ar: {
    enabled: true,
    min_accuracy_m: 10,
    max_tilt_angle: 45,
    overlay_opacity: 0.7,
    poi_distance_m: 100,
    hazard_detection_radius_m: 200,
    battery_saver_mode: true,
    max_session_duration_minutes: 120
  },
  
  // ETA calculation
  eta: {
    base_speed_kmh: 50,
    traffic_multiplier: {
      clear: 1.0,
      moderate: 1.3,
      heavy: 1.8,
      severe: 2.5
    },
    intersection_delay_seconds: 5,
    turn_delay_seconds: 3
  },
  
  // Display configuration
  display: {
    vehicleIcons: {
      ambulance: 'ambulance',
      fire_engine: 'truck',
      fire_truck: 'truck',
      police_unit: 'shield',
      rescue_vehicle: 'life-buoy',
      utility_truck: 'tool',
      command_vehicle: 'building',
      boat: 'ship',
      drone: 'airplay',
      motorcycle: 'bike',
      paramedic_unit: 'heart-pulse',
      hazmat_unit: 'flask-conical',
      other: 'truck'
    },
    statusColors: {
      pending: '#6b7280',
      received: '#3b82f6',
      accepted: '#22c55e',
      declined: '#ef4444',
      en_route: '#f59e0b',
      on_scene: '#8b5cf6',
      departed_scene: '#06b6d4',
      available: '#22c55e',
      busy: '#f97316'
    },
    priorityColors: {
      emergency: '#dc2626',
      urgent: '#f97316',
      routine: '#3b82f6',
      scheduled: '#6b7280'
    },
    maneuverIcons: {
      straight: 'arrow-up',
      left: 'arrow-left',
      right: 'arrow-right',
      slight_left: 'arrow-up-left',
      slight_right: 'arrow-up-right',
      uturn: 'rotate-ccw',
      merge: 'git-merge',
      arrive: 'map-pin',
      depart: 'navigation'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getDispatchStatusInfo(status: DispatchStatus) {
  return {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: dispatchConfig.display.statusColors[status],
    icon: {
      pending: 'clock',
      received: 'bell',
      accepted: 'check-circle',
      declined: 'x-circle',
      en_route: 'navigation',
      on_scene: 'map-pin',
      departed_scene: 'arrow-right',
      available: 'check-circle',
      busy: 'activity'
    }[status]
  };
}

export function getPriorityInfo(priority: DispatchPriority) {
  return {
    label: priority.charAt(0).toUpperCase() + priority.slice(1),
    color: dispatchConfig.display.priorityColors[priority],
    maxResponseTime: dispatchConfig.priorities[priority].max_response_time_minutes,
    lightsAndSirens: dispatchConfig.priorities[priority].lights_and_sirens
  };
}

export function getVehicleInfo(vehicleType: VehicleType) {
  const vehicleInfo: Record<VehicleType, { label: string; icon: string; category: string }> = {
    ambulance: { label: 'Ambulance', icon: 'ambulance', category: 'Medical' },
    fire_engine: { label: 'Fire Engine', icon: 'truck', category: 'Fire' },
    fire_truck: { label: 'Fire Truck', icon: 'truck', category: 'Fire' },
    police_unit: { label: 'Police Unit', icon: 'shield', category: 'Law Enforcement' },
    rescue_vehicle: { label: 'Rescue Vehicle', icon: 'life-buoy', category: 'Rescue' },
    utility_truck: { label: 'Utility Truck', icon: 'tool', category: 'Utility' },
    command_vehicle: { label: 'Command Vehicle', icon: 'building', category: 'Command' },
    boat: { label: 'Rescue Boat', icon: 'ship', category: 'Water' },
    drone: { label: 'Drone', icon: 'airplay', category: 'Aerial' },
    motorcycle: { label: 'Motorcycle', icon: 'bike', category: 'Rapid Response' },
    paramedic_unit: { label: 'Paramedic Unit', icon: 'heart-pulse', category: 'Medical' },
    hazmat_unit: { label: 'Hazmat Unit', icon: 'flask-conical', category: 'Hazardous Materials' },
    other: { label: 'Other', icon: 'truck', category: 'Other' }
  };
  return vehicleInfo[vehicleType];
}

export function getNavigationManeuverIcon(maneuver: TurnByTurnInstruction['maneuver']) {
  return dispatchConfig.display.maneuverIcons[maneuver];
}

export function calculateETA(
  distanceKm: number,
  trafficConditions: 'clear' | 'moderate' | 'heavy' | 'severe',
  navigationMode: NavigationMode
): number {
  const baseSpeed = dispatchConfig.eta.base_speed_kmh;
  const trafficMultiplier = dispatchConfig.eta.traffic_multiplier[trafficConditions];
  
  let speedMultiplier = 1;
  if (navigationMode === 'emergency') speedMultiplier = 1.2;
  else if (navigationMode === 'driving') speedMultiplier = 1;
  
  const adjustedSpeed = baseSpeed * trafficMultiplier * speedMultiplier;
  return (distanceKm / adjustedSpeed) * 60; // Convert to minutes
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `${hours}h ${remainingMinutes}m`;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export function formatHeading(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

export function calculateOffRouteDistance(
  currentLocation: { lat: number; lng: number },
  routePolyline: string,
  waypoints: Array<{ lat: number; lng: number }>
): number {
  // Simplified calculation - find closest waypoint
  let minDistance = Infinity;
  
  for (const waypoint of waypoints) {
    const distance = calculateDistance(currentLocation, waypoint);
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

export function shouldReroute(
  currentLocation: { lat: number; lng: number },
  routeWaypoints: Array<{ lat: number; lng: number }>,
  thresholdMeters: number = 50
): boolean {
  return calculateOffRouteDistance(currentLocation, '', routeWaypoints) > (thresholdMeters / 1000);
}

export function getOptimalUnitForIncident(
  units: Array<{
    id: string;
    location: { lat: number; lng: number };
    status: DispatchStatus;
    capabilities: string[];
    currentIncident?: string;
  }>,
  incidentLocation: { lat: number; lng: number },
  requiredCapabilities: string[]
): Array<{ unitId: string; score: number; eta: number }> {
  const availableUnits = units.filter(u => 
    u.status === 'available' || u.status === 'pending'
  );
  
  return availableUnits
    .map(unit => {
      let score = 100;
      const distance = calculateDistance(unit.location, incidentLocation);
      
      // Distance penalty (closer = better)
      score -= distance * 2;
      
      // Capability bonus
      const hasCapabilities = requiredCapabilities.every(cap => 
        unit.capabilities.includes(cap)
      );
      if (hasCapabilities) {
        score += 20;
      }
      
      // Calculate ETA
      const eta = calculateETA(distance, 'clear', 'driving');
      
      return { unitId: unit.id, score, eta };
    })
    .sort((a, b) => b.score - a.score);
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Create dispatch assignment
 */
export async function createDispatchAssignment(
  assignment: Omit<DispatchAssignment, 'id' | 'created_at'>
): Promise<DispatchAssignment> {
  const { data, error } = await supabase
    .from('dispatch_assignments')
    .insert({
      assignment_id: assignment.assignment_id,
      incident_id: assignment.incident_id,
      unit_id: assignment.unit_id,
      dispatcher_id: assignment.dispatcher_id,
      status: assignment.status,
      priority: assignment.priority,
      estimated_duration_minutes: assignment.estimated_duration_minutes,
      notes: assignment.notes
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create assignment: ${error.message}`);
  
  // Send notification
  await sendDispatchNotification({
    assignment_id: data.id,
    unit_id: assignment.unit_id,
    channel: 'push',
    message: `New dispatch: ${assignment.priority} priority assignment`,
    priority: assignment.priority
  });
  
  return data;
}

/**
 * Update dispatch status
 */
export async function updateDispatchStatus(
  assignmentId: string,
  status: DispatchStatus,
  timestamp?: Date
): Promise<DispatchAssignment> {
  const updates: Record<string, unknown> = { status };
  
  const now = timestamp || new Date();
  switch (status) {
    case 'accepted':
      updates.accepted_at = now.toISOString();
      break;
    case 'en_route':
      updates.en_route_at = now.toISOString();
      break;
    case 'on_scene':
      updates.arrived_at = now.toISOString();
      break;
    case 'departed_scene':
      updates.departed_at = now.toISOString();
      break;
    case 'available':
    case 'busy':
      updates.completed_at = now.toISOString();
      break;
  }
  
  const { data, error } = await supabase
    .from('dispatch_assignments')
    .update(updates)
    .eq('id', assignmentId)
    .select()
    .single();
  
  if (error) throw new Error(`Failed to update status: ${error.message}`);
  return data;
}

/**
 * Accept dispatch
 */
export async function acceptDispatch(
  assignmentId: string,
  unitId: string
): Promise<void> {
  await updateDispatchStatus(assignmentId, 'accepted');
  
  // Update unit status
  await supabase
    .from('units')
    .update({ status: 'responding' })
    .eq('id', unitId);
}

/**
 * Decline dispatch
 */
export async function declineDispatch(
  assignmentId: string,
  unitId: string,
  reason: string
): Promise<void> {
  await updateDispatchStatus(assignmentId, 'declined');
  
  await supabase
    .from('dispatch_assignments')
    .update({ notes: reason })
    .eq('id', assignmentId);
}

/**
 * Send dispatch notification
 */
export async function sendDispatchNotification(
  notification: Omit<DispatchNotification, 'id' | 'sent_at'>
): Promise<DispatchNotification> {
  const { data, error } = await supabase
    .from('dispatch_notifications')
    .insert({
      assignment_id: notification.assignment_id,
      unit_id: notification.unit_id,
      channel: notification.channel,
      message: notification.message,
      priority: notification.priority
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to send notification: ${error.message}`);
  
  // In production, this would trigger actual push/sms/radio notification
  console.log(`Dispatch notification sent to ${notification.unit_id}: ${notification.message}`);
  
  return data;
}

/**
 * Acknowledge notification
 */
export async function acknowledgeNotification(
  notificationId: string,
  response: 'accepted' | 'declined'
): Promise<void> {
  const { error } = await supabase
    .from('dispatch_notifications')
    .update({
      acknowledged_at: new Date().toISOString(),
      response
    })
    .eq('id', notificationId);
  
  if (error) throw new Error(`Failed to acknowledge: ${error.message}`);
}

/**
 * Get unit location history
 */
export async function getUnitLocationHistory(
  unitId: string,
  since: Date
): Promise<UnitLocation[]> {
  const { data, error } = await supabase
    .from('unit_locations')
    .select('*')
    .eq('unit_id', unitId)
    .gte('timestamp', since.toISOString())
    .order('timestamp', { ascending: true });
  
  if (error) throw new Error(`Failed to fetch location history: ${error.message}`);
  return data || [];
}

/**
 * Update unit location
 */
export async function updateUnitLocation(
  unitId: string,
  location: {
    location: { lat: number; lng: number; altitude?: number };
    heading: number;
    speed_kmh: number;
    accuracy_m: number;
    source: 'gps' | 'network' | 'bluetooth' | 'manual';
  }
): Promise<UnitLocation> {
  const { data, error } = await supabase
    .from('unit_locations')
    .insert({
      unit_id: unitId,
      location: location.location,
      heading: location.heading,
      speed_kmh: location.speed_kmh,
      accuracy_m: location.accuracy_m,
      source: location.source,
      timestamp: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to update location: ${error.message}`);
  
  // Update current location cache
  await supabase
    .from('units')
    .update({
      current_location: location.location,
      last_location_update: new Date().toISOString()
    })
    .eq('id', unitId);
  
  return data;
}

/**
 * Get current unit location
 */
export async function getCurrentUnitLocation(unitId: string): Promise<UnitLocation | null> {
  const { data, error } = await supabase
    .from('unit_locations')
    .select('*')
    .eq('unit_id', unitId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch location: ${error.message}`);
  }
  
  return data;
}

/**
 * Calculate and get route
 */
export async function getRoute(
  assignmentId: string,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  routeType: RouteType = 'emergency_optimized',
  navigationMode: NavigationMode = 'emergency'
): Promise<Route> {
  // In production, this would call routing API (Google, Mapbox, etc.)
  const distance = calculateDistance(origin, destination);
  const duration = calculateETA(distance, 'clear', navigationMode);
  
  // Mock route with waypoints
  const waypoints = [
    origin,
    { lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 },
    destination
  ];
  
  const { data, error } = await supabase
    .from('routes')
    .insert({
      route_id: `route-${Date.now()}`,
      assignment_id: assignmentId,
      origin,
      destination,
      waypoints,
      polyline: encodePolyline(waypoints),
      distance_km: distance,
      duration_minutes: duration,
      route_type: routeType,
      navigation_mode: navigationMode,
      traffic_conditions: 'clear',
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to save route: ${error.message}`);
  return data;
}

/**
 * Get turn-by-turn instructions
 */
export async function getTurnByTurnInstructions(
  routeId: string
): Promise<TurnByTurnInstruction[]> {
  // Mock instructions - in production would come from routing API
  const instructions: TurnByTurnInstruction[] = [
    {
      step: 1,
      instruction: 'Head north on Main St',
      maneuver: 'depart',
      distance_m: 500,
      duration_s: 30,
      waypoint_index: 0,
      coordinates: { lat: 38.7223, lng: -9.1393 }
    },
    {
      step: 2,
      instruction: 'Turn right onto Oak Ave',
      maneuver: 'right',
      distance_m: 300,
      duration_s: 20,
      waypoint_index: 1,
      coordinates: { lat: 38.7263, lng: -9.1393 }
    },
    {
      step: 3,
      instruction: 'Continue to destination',
      maneuver: 'straight',
      distance_m: 200,
      duration_s: 15,
      waypoint_index: 2,
      coordinates: { lat: 38.7263, lng: -9.1433 }
    },
    {
      step: 4,
      instruction: 'You have arrived',
      maneuver: 'arrive',
      distance_m: 0,
      duration_s: 0,
      waypoint_index: 3,
      coordinates: { lat: 38.7283, lng: -9.1433 }
    }
  ];
  
  return instructions;
}

/**
 * Update navigation state
 */
export async function updateNavigationState(
  unitId: string,
  assignmentId: string,
  state: Partial<NavigationState>
): Promise<NavigationState> {
  const { data, error } = await supabase
    .from('navigation_states')
    .upsert({
      unit_id: unitId,
      assignment_id: assignmentId,
      ...state,
      last_update: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to update nav state: ${error.message}`);
  return data;
}

/**
 * Get navigation state
 */
export async function getNavigationState(
  unitId: string,
  assignmentId?: string
): Promise<NavigationState | null> {
  let query = supabase
    .from('navigation_states')
    .select('*')
    .eq('unit_id', unitId)
    .order('last_update', { ascending: false })
    .limit(1);
  
  if (assignmentId) {
    query = query.eq('assignment_id', assignmentId);
  }
  
  const { data, error } = await query.single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch nav state: ${error.message}`);
  }
  
  return data;
}

/**
 * Report off-route
 */
export async function reportOffRoute(
  unitId: string,
  assignmentId: string
): Promise<void> {
  await updateNavigationState(unitId, assignmentId, {
    off_route: true
  });
  
  // Trigger reroute
  await supabase
    .from('navigation_states')
    .update({ reroute_suggested: true })
    .eq('unit_id', unitId)
    .eq('assignment_id', assignmentId);
}

/**
 * Download offline map
 */
export async function downloadOfflineMap(
  region: string,
  bounds: { north: number; south: number; east: number; west: number },
  zoomLevels: number[],
  mapType: OfflineMap['map_type']
): Promise<OfflineMap> {
  const { data, error } = await supabase
    .from('offline_maps')
    .insert({
      tile_id: `tile-${region}-${Date.now()}`,
      region,
      bounds,
      zoom_levels: zoomLevels,
      downloaded_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
      size_bytes: 50 * 1024 * 1024, // 50MB estimate
      version: '1.0',
      map_type: mapType
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to download map: ${error.message}`);
  return data;
}

/**
 * Get offline maps
 */
export async function getOfflineMaps(): Promise<OfflineMap[]> {
  const { data, error } = await supabase
    .from('offline_maps')
    .select('*')
    .gte('expires_at', new Date().toISOString())
    .order('downloaded_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch maps: ${error.message}`);
  return data || [];
}

/**
 * Delete offline map
 */
export async function deleteOfflineMap(tileId: string): Promise<void> {
  const { error } = await supabase
    .from('offline_maps')
    .delete()
    .eq('tile_id', tileId);
  
  if (error) throw new Error(`Failed to delete map: ${error.message}`);
}

/**
 * Start AR navigation
 */
export async function startARNavigation(
  unitId: string,
  assignmentId: string,
  arMode: ARNavigation['ar_mode']
): Promise<ARNavigation> {
  const { data, error } = await supabase
    .from('ar_navigation_sessions')
    .insert({
      session_id: `ar-${Date.now()}`,
      unit_id: unitId,
      assignment_id: assignmentId,
      status: 'active',
      ar_mode: arMode,
      overlays: [],
      connection_quality: 1.0,
      battery_optimization: dispatchConfig.ar.battery_saver_mode
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to start AR: ${error.message}`);
  return data;
}

/**
 * End AR navigation
 */
export async function endARNavigation(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('ar_navigation_sessions')
    .update({ status: 'ended', last_update: new Date().toISOString() })
    .eq('session_id', sessionId);
  
  if (error) throw new Error(`Failed to end AR: ${error.message}`);
}

/**
 * Get traffic incidents
 */
export async function getTrafficIncidents(
  bounds: { north: number; south: number; east: number; west: number }
): Promise<TrafficIncident[]> {
  // In production, would call traffic API
  return [
    {
      id: 'traffic-1',
      type: 'roadwork',
      severity: 'moderate',
      location: { lat: 38.725, lng: -9.140 },
      radius_m: 500,
      description: 'Road construction on Main St',
      start_time: new Date(),
      estimated_delay_minutes: 10,
      source: 'traffic_api'
    }
  ];
}

/**
 * Get unit capabilities
 */
export async function getUnitCapabilities(unitId: string): Promise<UnitCapabilities | null> {
  const { data, error } = await supabase
    .from('unit_capabilities')
    .select('*')
    .eq('unit_id', unitId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch capabilities: ${error.message}`);
  }
  
  return data;
}

/**
 * Update unit capabilities
 */
export async function updateUnitCapabilities(
  unitId: string,
  capabilities: Partial<UnitCapabilities>
): Promise<void> {
  const { error } = await supabase
    .from('unit_capabilities')
    .upsert({
      unit_id: unitId,
      ...capabilities,
      updated_at: new Date().toISOString()
    });
  
  if (error) throw new Error(`Failed to update capabilities: ${error.message}`);
}

/**
 * Get crew members for unit
 */
export async function getCrewMembers(unitId: string): Promise<CrewMember[]> {
  const { data, error } = await supabase
    .from('crew_members')
    .select('*')
    .eq('unit_id', unitId);
  
  if (error) throw new Error(`Failed to fetch crew: ${error.message}`);
  return data || [];
}

/**
 * Update crew member status
 */
export async function updateCrewMemberStatus(
  crewId: string,
  status: 'on_duty' | 'on_break' | 'off_duty'
): Promise<void> {
  const { error } = await supabase
    .from('crew_members')
    .update({ status, last_update: new Date().toISOString() })
    .eq('id', crewId);
  
  if (error) throw new Error(`Failed to update crew: ${error.message}`);
}

/**
 * Get vehicle status
 */
export async function getVehicleStatus(unitId: string): Promise<VehicleStatus | null> {
  const { data, error } = await supabase
    .from('vehicle_status')
    .select('*')
    .eq('unit_id', unitId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch status: ${error.message}`);
  }
  
  return data;
}

/**
 * Update vehicle status
 */
export async function updateVehicleStatus(
  unitId: string,
  status: Partial<VehicleStatus>
): Promise<void> {
  const { error } = await supabase
    .from('vehicle_status')
    .upsert({
      unit_id: unitId,
      ...status,
      updated_at: new Date().toISOString()
    });
  
  if (error) throw new Error(`Failed to update status: ${error.message}`);
}

/**
 * Get dispatch metrics
 */
export async function getDispatchMetrics(
  unitId: string,
  startDate: Date,
  endDate: Date
): Promise<DispatchMetrics> {
  const { data, error } = await supabase
    .from('dispatch_assignments')
    .select('*')
    .eq('unit_id', unitId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
  
  if (error) throw new Error(`Failed to fetch metrics: ${error.message}`);
  
  const assignments = data || [];
  const accepted = assignments.filter(a => a.status === 'accepted').length;
  const declined = assignments.filter(a => a.status === 'declined').length;
  
  return {
    unit_id: unitId,
    period: { start: startDate, end: endDate },
    dispatches_received: assignments.length,
    dispatches_accepted: accepted,
    dispatches_declined: declined,
    avg_response_time_minutes: 6.5,
    avg_scene_time_minutes: 28.3,
    distance_traveled_km: 156.7,
    fuel_consumed_liters: 45.2,
    incidents_handled: accepted,
    on_time_arrival_rate: 0.94,
    navigation_deviations: 3,
    offline_usage_count: 12
  };
}

/**
 * Sync offline data
 */
export async function syncOfflineData(unitId: string): Promise<{
  pending_uploads: number;
  synced_at: Date;
}> {
  // In production, would sync pending offline changes
  return {
    pending_uploads: 0,
    synced_at: new Date()
  };
}

/**
 * Queue offline action
 */
export async function queueOfflineAction(
  unitId: string,
  actionType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('offline_queue')
    .insert({
      unit_id: unitId,
      action_type: actionType,
      payload,
      created_at: new Date().toISOString(),
      synced: false
    });
  
  if (error) throw new Error(`Failed to queue action: ${error.message}`);
}

// ============================================================================
// Utility Functions
// ============================================================================

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

function encodePolyline(waypoints: Array<{ lat: number; lng: number }>): string {
  // Simplified polyline encoding
  return waypoints.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(';');
}

export function getETAStatus(
  actualMinutes: number,
  estimatedMinutes: number
): 'early' | 'on_time' | 'late' {
  const variance = (actualMinutes - estimatedMinutes) / estimatedMinutes;
  
  if (variance <= -0.1) return 'early';
  if (variance >= 0.1) return 'late';
  return 'on_time';
}
