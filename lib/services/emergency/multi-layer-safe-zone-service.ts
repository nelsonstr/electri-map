/**
 * Multi-Layer Safe Zone Network Service
 * 
 * Epic: Multi-Layer Safe Zone Network
 * Description: Intelligent safe zone system that includes physical shelters, community gathering
 * points, emergency response stations, and AR navigation to guide users to safety during
 * emergencies with real-time capacity and status updates.
 * 
 * Bmad Category: Emergency Infrastructure (ES-INF)
 * Emergency Mode Relevance: BFSI, CPI, MAC - Critical for evacuation coordination
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type SafeZoneType = 
  | 'emergency_shelter'
  | 'community_gathering_point'
  | 'first_response_station'
  | 'medical_station'
  | 'hydration_center'
  | 'charging_station'
  | 'pet_friendly_zone'
  | 'accessibility_zone'
  | 'staging_area'
  | 'evacuation_route_waypoint';

export type SafeZoneStatus = 
  | 'active'
  | 'capacity_warning'
  | 'capacity_critical'
  | 'temporarily_closed'
  | 'permanently_closed'
  | 'under_maintenance';

export type SafeZoneAmenity = 
  | 'medical_supplies'
  | 'first_aid_kit'
  | 'defibrillator'
  | 'water'
  | 'food'
  | 'power_outlets'
  | 'wi_fi'
  | 'medical_personnel'
  | 'security'
  | 'accessibility_features'
  | 'pet_supplies'
  | 'restrooms'
  | 'sleeping_area'
  | 'information_desk'
  | 'transportation_connections'
  | 'accessible_restroom'
  | 'ground_floor_access';

export type AccessMode = 
  | 'pedestrian'
  | 'vehicle'
  | 'wheelchair'
  | 'bicycle'
  | 'public_transit';

export type NavigationMode = 
  | 'standard'
  | 'ar_realtime'
  | 'voice_guided'
  | 'text_directions'
  | 'emergency_lights';

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
}

export interface SafeZone {
  id: string;
  name: string;
  description?: string;
  type: SafeZoneType;
  status: SafeZoneStatus;
  location: GeoLocation;
  address?: string;
  jurisdiction?: string;
  capacity_total: number;
  capacity_current: number;
  amenities: SafeZoneAmenity[];
  access_modes: AccessMode[];
  opening_hours?: string;
  contact_phone?: string;
  contact_email?: string;
  manager_id?: string;
  last_inspection_at?: Date;
  rating?: number;
  created_at: Date;
  updated_at: Date;
}

export interface SafeZoneRoute {
  id: string;
  safe_zone_id: string;
  user_id?: string;
  navigation_mode: NavigationMode;
  start_location: GeoLocation;
  end_location: GeoLocation;
  route_polyline?: string;
  estimated_duration_minutes: number;
  estimated_distance_km: number;
  safety_score: number;
  hazards: string[];
  waypoints: GeoLocation[];
  created_at: Date;
}

export interface SafeZoneCapacityHistory {
  safe_zone_id: string;
  timestamp: Date;
  capacity_total: number;
  capacity_current: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface SafeZoneReview {
  id: string;
  safe_zone_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  categories: {
    cleanliness?: number;
    safety?: number;
    amenities?: number;
    accessibility?: number;
    staff_helpfulness?: number;
  };
  created_at: Date;
}

export interface SafeZoneAlert {
  id: string;
  safe_zone_id: string;
  alert_type: 'capacity_change' | 'status_change' | 'emergency' | 'weather' | 'maintenance';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  valid_from: Date;
  valid_until?: Date;
  is_active: boolean;
  created_at: Date;
}

export interface SafeZoneAccessibility {
  wheelchair_accessible: boolean;
  ramp_available: boolean;
  elevator_available: boolean;
  accessible_parking: boolean;
  accessible_restroom: boolean;
  hearing_assistance: boolean;
  visual_assistance: boolean;
  service_animal_friendly: boolean;
  ground_floor_access: boolean;
  'wide doorways': boolean;
}

export interface CommunitySafeZoneGroup {
  id: string;
  name: string;
  description?: string;
  zone_type: 'neighborhood' | 'district' | 'city';
  coordinator_id: string;
  member_count: number;
  safe_zone_ids: string[];
  primary_contact?: string;
  emergency_contact?: string;
  is_active: boolean;
  created_at: Date;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const GeoLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
  altitude: z.number().optional()
});

const SafeZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum([
    'emergency_shelter',
    'community_gathering_point',
    'first_response_station',
    'medical_station',
    'hydration_center',
    'charging_station',
    'pet_friendly_zone',
    'accessibility_zone',
    'staging_area',
    'evacuation_route_waypoint'
  ]),
  status: z.enum([
    'active',
    'capacity_warning',
    'capacity_critical',
    'temporarily_closed',
    'permanently_closed',
    'under_maintenance'
  ]),
  location: GeoLocationSchema,
  address: z.string().optional(),
  jurisdiction: z.string().optional(),
  capacity_total: z.number().positive(),
  capacity_current: z.number().min(0),
  amenities: z.array(z.string()),
  access_modes: z.array(z.string()),
  opening_hours: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional(),
  rating: z.number().min(0).max(5).optional()
});

const SafeZoneRouteSchema = z.object({
  id: z.string(),
  safe_zone_id: z.string(),
  navigation_mode: z.enum([
    'standard',
    'ar_realtime',
    'voice_guided',
    'text_directions',
    'emergency_lights'
  ]),
  estimated_duration_minutes: z.number().positive(),
  estimated_distance_km: z.number().positive(),
  safety_score: z.number().min(0).max(100),
  hazards: z.array(z.string())
});

// ============================================================================
// Configuration
// ============================================================================

export const safeZoneConfig = {
  // Safe zone type configuration
  typeConfig: {
    emergency_shelter: {
      color: '#ef4444',
      icon: 'home',
      label: 'Emergency Shelter',
      priority: 1,
      defaultCapacity: 100,
      requiredAmenities: ['water', 'food', 'restrooms', 'sleeping_area']
    },
    community_gathering_point: {
      color: '#3b82f6',
      icon: 'users',
      label: 'Community Gathering Point',
      priority: 2,
      defaultCapacity: 50,
      requiredAmenities: ['water', 'information_desk']
    },
    first_response_station: {
      color: '#f59e0b',
      icon: 'shield',
      label: 'First Response Station',
      priority: 0,
      defaultCapacity: 10,
      requiredAmenities: ['first_aid_kit', 'defibrillator', 'security']
    },
    medical_station: {
      color: '#10b981',
      icon: 'heart-pulse',
      label: 'Medical Station',
      priority: 0,
      defaultCapacity: 20,
      requiredAmenities: ['medical_supplies', 'medical_personnel']
    },
    hydration_center: {
      color: '#06b6d4',
      icon: 'droplet',
      label: 'Hydration Center',
      priority: 2,
      defaultCapacity: 30,
      requiredAmenities: ['water', 'power_outlets']
    },
    charging_station: {
      color: '#8b5cf6',
      icon: 'battery-charging',
      label: 'Charging Station',
      priority: 3,
      defaultCapacity: 25,
      requiredAmenities: ['power_outlets', 'wi_fi']
    },
    pet_friendly_zone: {
      color: '#ec4899',
      icon: 'dog',
      label: 'Pet Friendly Zone',
      priority: 3,
      defaultCapacity: 20,
      requiredAmenities: ['pet_supplies', 'water', 'restrooms']
    },
    accessibility_zone: {
      color: '#6366f1',
      icon: 'accessibility',
      label: 'Accessibility Zone',
      priority: 1,
      defaultCapacity: 15,
      requiredAmenities: ['accessibility_features', 'accessible_restroom', 'ground_floor_access']
    },
    staging_area: {
      color: '#84cc16',
      icon: 'truck',
      label: 'Staging Area',
      priority: 2,
      defaultCapacity: 50,
      requiredAmenities: ['water', 'restrooms', 'transportation_connections']
    },
    evacuation_route_waypoint: {
      color: '#14b8a6',
      icon: 'map-pin',
      label: 'Evacuation Waypoint',
      priority: 4,
      defaultCapacity: 0,
      requiredAmenities: ['information_desk']
    }
  },
  
  // Capacity thresholds
  capacityThresholds: {
    warning: 0.7, // 70% capacity
    critical: 0.9 // 90% capacity
  },
  
  // Navigation settings
  navigation: {
    maxRouteDurationMinutes: 120,
    minSafetyScore: 50,
    waypointIntervalMeters: 500,
    arUpdateIntervalSeconds: 2
  },
  
  // Display configuration
  display: {
    statusColors: {
      active: '#10b981',
      capacity_warning: '#f59e0b',
      capacity_critical: '#ef4444',
      temporarily_closed: '#6b7280',
      permanently_closed: '#374151',
      under_maintenance: '#3b82f6'
    },
    amenityIcons: {
      medical_supplies: 'briefcase-medical',
      first_aid_kit: 'first-aid',
      defibrillator: 'heart-pulse',
      water: 'droplet',
      food: 'utensils',
      power_outlets: 'plug',
      wi_fi: 'wifi',
      medical_personnel: 'user-md',
      security: 'shield',
      accessibility_features: 'accessibility',
      pet_supplies: 'dog',
      restrooms: 'restroom',
      sleeping_area: 'bed',
      information_desk: 'info',
      transportation_connections: 'bus'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function calculateCapacityPercentage(current: number, total: number): number {
  return Math.round((current / total) * 100);
}

export function getCapacityStatus(
  current: number,
  total: number
): 'active' | 'capacity_warning' | 'capacity_critical' {
  const percentage = calculateCapacityPercentage(current, total);
  const { capacityThresholds } = safeZoneConfig;
  
  if (percentage >= capacityThresholds.critical * 100) {
    return 'capacity_critical';
  }
  if (percentage >= capacityThresholds.warning * 100) {
    return 'capacity_warning';
  }
  return 'active';
}

export function getSafeZoneTypeInfo(type: SafeZoneType) {
  return safeZoneConfig.typeConfig[type];
}

export function getAmenityDisplayInfo(amenity: SafeZoneAmenity) {
  const amenityInfo: Record<SafeZoneAmenity, { icon: string; label: string; category: string }> = {
    medical_supplies: { icon: 'briefcase-medical', label: 'Medical Supplies', category: 'Medical' },
    first_aid_kit: { icon: 'first-aid', label: 'First Aid Kit', category: 'Medical' },
    defibrillator: { icon: 'heart-pulse', label: 'Defibrillator', category: 'Medical' },
    water: { icon: 'droplet', label: 'Water', category: 'Basic Needs' },
    food: { icon: 'utensils', label: 'Food', category: 'Basic Needs' },
    power_outlets: { icon: 'plug', label: 'Power Outlets', category: 'Comfort' },
    wi_fi: { icon: 'wifi', label: 'Wi-Fi', category: 'Comfort' },
    medical_personnel: { icon: 'user-md', label: 'Medical Personnel', category: 'Medical' },
    security: { icon: 'shield', label: 'Security', category: 'Safety' },
    accessibility_features: { icon: 'accessibility', label: 'Accessibility Features', category: 'Accessibility' },
    pet_supplies: { icon: 'dog', label: 'Pet Supplies', category: 'Specialized' },
    restrooms: { icon: 'restroom', label: 'Restrooms', category: 'Basic Needs' },
    sleeping_area: { icon: 'bed', label: 'Sleeping Area', category: 'Comfort' },
    information_desk: { icon: 'info', label: 'Information Desk', category: 'Information' },
    transportation_connections: { icon: 'bus', label: 'Transportation Connections', category: 'Transportation' },
    accessible_restroom: { icon: 'restroom', label: 'Accessible Restroom', category: 'Accessibility' },
    ground_floor_access: { icon: 'door-open', label: 'Ground Floor Access', category: 'Accessibility' }
  };
  
  return amenityInfo[amenity];
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  return `${hours}h ${remainingMins}m`;
}

export function isSafeZoneOpen(zone: SafeZone): boolean {
  if (!zone.opening_hours) return true; // Assume 24/7 if not specified
  
  // Simple check for now - ideally parse opening_hours string
  return true;
}

export function calculateDistance(
  loc1: GeoLocation,
  loc2: GeoLocation
): number {
  const R = 6371000; // Earth's radius in meters
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

export function sortSafeZonesByDistance(
  zones: SafeZone[],
  userLocation: GeoLocation
): SafeZone[] {
  return [...zones].sort((a, b) => {
    const distA = calculateDistance(userLocation, a.location);
    const distB = calculateDistance(userLocation, b.location);
    return distA - distB;
  });
}

export function filterSafeZonesByType(
  zones: SafeZone[],
  types: SafeZoneType[]
): SafeZone[] {
  return zones.filter(zone => types.includes(zone.type));
}

export function filterSafeZonesByAmenity(
  zones: SafeZone[],
  amenities: SafeZoneAmenity[]
): SafeZone[] {
  return zones.filter(zone =>
    amenities.every(amenity => zone.amenities.includes(amenity))
  );
}

export function filterSafeZonesByAccessMode(
  zones: SafeZone[],
  modes: AccessMode[]
): SafeZone[] {
  return zones.filter(zone =>
    modes.some(mode => zone.access_modes.includes(mode))
  );
}

export function getAccessibilityInfo(
  amenities: SafeZoneAmenity[]
): Partial<SafeZoneAccessibility> {
  return {
    wheelchair_accessible: amenities.includes('accessibility_features'),
    accessible_restroom: amenities.includes('accessible_restroom'),
    ground_floor_access: amenities.includes('ground_floor_access'),
    service_animal_friendly: amenities.includes('pet_supplies'),
    hearing_assistance: amenities.some(a => 
      ['wi_fi', 'information_desk'].includes(a)
    ),
    visual_assistance: amenities.some(a => 
      ['wi_fi', 'information_desk'].includes(a)
    )
  };
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Create a new safe zone
 */
export async function createSafeZone(
  zone: Omit<SafeZone, 'id' | 'created_at' | 'updated_at'>
): Promise<SafeZone> {
  const { data, error } = await supabase
    .from('safe_zones')
    .insert({
      name: zone.name,
      description: zone.description,
      type: zone.type,
      status: zone.status,
      location: zone.location,
      address: zone.address,
      jurisdiction: zone.jurisdiction,
      capacity_total: zone.capacity_total,
      capacity_current: zone.capacity_current,
      amenities: zone.amenities,
      access_modes: zone.access_modes,
      opening_hours: zone.opening_hours,
      contact_phone: zone.contact_phone,
      contact_email: zone.contact_email,
      manager_id: zone.manager_id
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create safe zone: ${error.message}`);
  
  return data as unknown as SafeZone;
}

/**
 * Get safe zone by ID
 */
export async function getSafeZoneById(zoneId: string): Promise<SafeZone | null> {
  const { data, error } = await supabase
    .from('safe_zones')
    .select('*')
    .eq('id', zoneId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch safe zone: ${error.message}`);
  }
  
  return data as unknown as SafeZone | null;
}

/**
 * Get safe zones within radius of location
 */
export async function getSafeZonesNearby(
  location: GeoLocation,
  radiusKm: number = 10,
  types?: SafeZoneType[]
): Promise<SafeZone[]> {
  // PostgreSQL PostGIS query for bounding box
  const minLat = location.lat - (radiusKm / 111);
  const maxLat = location.lat + (radiusKm / 111);
  const minLng = location.lng - (radiusKm / (111 * Math.cos(toRad(location.lat))));
  const maxLng = location.lng + (radiusKm / (111 * Math.cos(toRad(location.lat))));
  
  let query = supabase
    .from('safe_zones')
    .select('*')
    .gte('location->lat', minLat)
    .lte('location->lat', maxLat)
    .gte('location->lng', minLng)
    .lte('location->lng', maxLng)
    .in('status', ['active', 'capacity_warning', 'capacity_critical']);
  
  if (types && types.length > 0) {
    query = query.in('type', types);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch nearby safe zones: ${error.message}`);
  
  // Filter by actual distance
  return ((data || []) as unknown as SafeZone[]).filter(zone => {
    const distance = calculateDistance(location, zone.location);
    return distance <= radiusKm * 1000;
  });
}

/**
 * Update safe zone capacity
 */
export async function updateSafeZoneCapacity(
  zoneId: string,
  newCurrent: number
): Promise<void> {
  // Get current capacity
  const { data: zone } = await supabase
    .from('safe_zones')
    .select('capacity_total, capacity_current')
    .eq('id', zoneId)
    .single();
  
  if (!zone) throw new Error('Safe zone not found');

  const safeZone = zone as unknown as { capacity_total: number; capacity_current: number };
  
  // Determine new status based on capacity
  const newStatus = getCapacityStatus(newCurrent, safeZone.capacity_total);
  
  const { error } = await supabase
    .from('safe_zones')
    .update({
      capacity_current: newCurrent,
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', zoneId);
  
  if (error) throw new Error(`Failed to update capacity: ${error.message}`);
  
  // Record capacity history
  await supabase
    .from('safe_zone_capacity_history')
    .insert({
      safe_zone_id: zoneId,
      capacity_total: zone.capacity_total,
      capacity_current: newCurrent,
      timestamp: new Date().toISOString()
    });
}

/**
 * Update safe zone status
 */
export async function updateSafeZoneStatus(
  zoneId: string,
  status: SafeZoneStatus,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('safe_zones')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', zoneId);
  
  if (error) throw new Error(`Failed to update status: ${error.message}`);
  
  // Create alert if status change is significant
  if (['temporarily_closed', 'capacity_critical'].includes(status)) {
    await createSafeZoneAlert(zoneId, 'status_change', 
      status === 'temporarily_closed' ? 'warning' : 'critical',
      reason || `Safe zone status changed to ${status}`
    );
  }
}

/**
 * Add safe zone review
 */
export async function addSafeZoneReview(
  review: Omit<SafeZoneReview, 'id' | 'created_at'>
): Promise<SafeZoneReview> {
  const { data, error } = await supabase
    .from('safe_zone_reviews')
    .insert({
      safe_zone_id: review.safe_zone_id,
      user_id: review.user_id,
      rating: review.rating,
      comment: review.comment,
      categories: review.categories
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to add review: ${error.message}`);
  
  // Update average rating
  await updateSafeZoneRating(review.safe_zone_id);
  
  return data;
}

/**
 * Update average rating for safe zone
 */
async function updateSafeZoneRating(zoneId: string): Promise<void> {
  const { data } = await supabase
    .from('safe_zone_reviews')
    .select('rating')
    .eq('safe_zone_id', zoneId);
  
  const reviews = (data || []) as unknown as { rating: number }[];
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  
  await supabase
    .from('safe_zones')
    .update({ rating: avgRating })
    .eq('id', zoneId);
}

/**
 * Create safe zone alert
 */
async function createSafeZoneAlert(
  zoneId: string,
  alertType: SafeZoneAlert['alert_type'],
  severity: SafeZoneAlert['severity'],
  message: string
): Promise<void> {
  await supabase
    .from('safe_zone_alerts')
    .insert({
      safe_zone_id: zoneId,
      alert_type: alertType,
      severity,
      message,
      is_active: true
    });
}

/**
 * Get active alerts for safe zone
 */
export async function getSafeZoneAlerts(
  zoneId: string
): Promise<SafeZoneAlert[]> {
  const { data, error } = await supabase
    .from('safe_zone_alerts')
    .select('*')
    .eq('safe_zone_id', zoneId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch alerts: ${error.message}`);
  
  return data || [];
}

/**
 * Create navigation route to safe zone
 */
export async function createNavigationRoute(
  userId: string,
  safeZoneId: string,
  navigationMode: NavigationMode,
  startLocation: GeoLocation
): Promise<SafeZoneRoute> {
  const { data: zoneData } = await supabase
    .from('safe_zones')
    .select('*')
    .eq('id', safeZoneId)
    .single();
  
  if (!zoneData) throw new Error('Safe zone not found');
  const zone = zoneData as unknown as SafeZone;
  
  const distance = calculateDistance(startLocation, zone.location);
  const durationMinutes = (distance / 80) * 60; // Assume 80m/min walking speed
  
  // Calculate safety score based on hazards (simplified)
  let safetyScore = 100;
  const hazards: string[] = [];
  
  if (zone.status !== 'active') {
    safetyScore -= 30;
    hazards.push('Safe zone may have limited services');
  }
  
  if (calculateCapacityPercentage(zone.capacity_current, zone.capacity_total) >= 90) {
    safetyScore -= 10;
    hazards.push('High occupancy expected');
  }
  
  const route: SafeZoneRoute = {
    id: `route_${Date.now()}`,
    safe_zone_id: safeZoneId,
    user_id: userId,
    navigation_mode: navigationMode,
    start_location: startLocation,
    end_location: zone.location,
    estimated_duration_minutes: Math.round(durationMinutes),
    estimated_distance_km: distance / 1000,
    safety_score: Math.max(0, safetyScore),
    hazards,
    waypoints: [],
    created_at: new Date()
  };
  
  // Store route
  const { error } = await supabase
    .from('safe_zone_routes')
    .insert({
      safe_zone_id: route.safe_zone_id,
      user_id: route.user_id,
      navigation_mode: route.navigation_mode,
      start_location: route.start_location,
      end_location: route.end_location,
      estimated_duration_minutes: route.estimated_duration_minutes,
      estimated_distance_km: route.estimated_distance_km,
      safety_score: route.safety_score,
      hazards: route.hazards
    });
  
  if (error) throw new Error(`Failed to create route: ${error.message}`);
  
  return route;
}

/**
 * Get capacity history for safe zone
 */
export async function getCapacityHistory(
  zoneId: string,
  hoursBack: number = 24
): Promise<SafeZoneCapacityHistory[]> {
  const { data, error } = await supabase
    .from('safe_zone_capacity_history')
    .select('*')
    .eq('safe_zone_id', zoneId)
    .gte('timestamp', new Date(Date.now() - hoursBack * 3600000).toISOString())
    .order('timestamp', { ascending: true });
  
  if (error) throw new Error(`Failed to fetch capacity history: ${error.message}`);
  
  // Calculate trend for each entry
  return ((data || []) as unknown as SafeZoneCapacityHistory[]).map((entry, index, arr) => {
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    
    if (index > 0) {
      const prev = arr[index - 1];
      const change = entry.capacity_current - prev.capacity_current;
      if (change > 2) trend = 'increasing';
      else if (change < -2) trend = 'decreasing';
    }
    
    return {
      safe_zone_id: entry.safe_zone_id,
      timestamp: new Date(entry.timestamp),
      capacity_total: entry.capacity_total,
      capacity_current: entry.capacity_current,
      trend
    };
  });
}

/**
 * Register user check-in at safe zone
 */
export async function checkInToSafeZone(
  userId: string,
  zoneId: string
): Promise<void> {
  // Get current capacity
  const { data: zone } = await supabase
    .from('safe_zones')
    .select('capacity_current, capacity_total')
    .eq('id', zoneId)
    .single();
  
  if (!zone) throw new Error('Safe zone not found');

  const safeZone = zone as unknown as { capacity_current: number; capacity_total: number };
  
  const newCurrent = safeZone.capacity_current + 1;
  
  await supabase
    .from('safe_zone_checkins')
    .insert({
      user_id: userId,
      safe_zone_id: zoneId,
      checkin_time: new Date().toISOString()
    });
  
  // Update capacity
  await updateSafeZoneCapacity(zoneId, newCurrent);
}

/**
 * Register user check-out from safe zone
 */
export async function checkOutFromSafeZone(
  userId: string,
  zoneId: string
): Promise<void> {
  // Get current capacity
  const { data: zone } = await supabase
    .from('safe_zones')
    .select('capacity_current')
    .eq('id', zoneId)
    .single();
  
  if (!zone) throw new Error('Safe zone not found');

  const safeZone = zone as unknown as { capacity_current: number };
  
  const newCurrent = Math.max(0, safeZone.capacity_current - 1);
  
  await supabase
    .from('safe_zone_checkouts')
    .insert({
      user_id: userId,
      safe_zone_id: zoneId,
      checkout_time: new Date().toISOString()
    });
  
  // Update capacity
  await updateSafeZoneCapacity(zoneId, newCurrent);
}

/**
 * Get user's check-in history
 */
export async function getUserCheckInHistory(
  userId: string,
  limit: number = 30
): Promise<{ zone: SafeZone; checkin_time: Date; checkout_time?: Date }[]> {
  const { data: checkins, error } = await supabase
    .from('safe_zone_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('checkin_time', { ascending: false })
    .limit(limit);
  
  if (error) throw new Error(`Failed to fetch check-in history: ${error.message}`);
  
  const results: { zone: SafeZone; checkin_time: Date; checkout_time?: Date }[] = [];
  
  for (const checkin of (checkins || []) as unknown as { safe_zone_id: string; checkin_time: string }[]) {
    const { data: zoneData } = await supabase
      .from('safe_zones')
      .select('*')
      .eq('id', checkin.safe_zone_id)
      .single();
    
    const zone = zoneData as unknown as SafeZone;
    
    if (zone) {
      const { data: checkout } = await supabase
        .from('safe_zone_checkouts')
        .select('checkout_time')
        .eq('user_id', userId)
        .eq('safe_zone_id', checkin.safe_zone_id)
        .gte('checkout_time', checkin.checkin_time)
        .lte('checkout_time', new Date(new Date(checkin.checkin_time).getTime() + 86400000).toISOString())
        .single();
      
      results.push({
        zone,
        checkin_time: new Date(checkin.checkin_time),
        checkout_time: checkout ? new Date(checkout.checkout_time) : undefined
      });
    }
  }
  
  return results;
}

/**
 * Get all active safe zones (public dashboard)
 */
export async function getActiveSafeZones(
  types?: SafeZoneType[]
): Promise<SafeZone[]> {
  let query = supabase
    .from('safe_zones')
    .select('*')
    .in('status', ['active', 'capacity_warning', 'capacity_critical'])
    .order('type', { ascending: true });
  
  if (types && types.length > 0) {
    query = query.in('type', types);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch active safe zones: ${error.message}`);
  
  return data || [];
}

/**
 * Create community safe zone group
 */
export async function createCommunityGroup(
  group: Omit<CommunitySafeZoneGroup, 'id' | 'created_at'>
): Promise<CommunitySafeZoneGroup> {
  const { data, error } = await supabase
    .from('community_safe_zone_groups')
    .insert({
      name: group.name,
      description: group.description,
      zone_type: group.zone_type,
      coordinator_id: group.coordinator_id,
      member_count: group.member_count,
      safe_zone_ids: group.safe_zone_ids,
      primary_contact: group.primary_contact,
      emergency_contact: group.emergency_contact,
      is_active: group.is_active
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create community group: ${error.message}`);
  
  return data as unknown as CommunitySafeZoneGroup;
}

/**
 * Get user's community groups
 */
export async function getUserCommunityGroups(
  userId: string
): Promise<CommunitySafeZoneGroup[]> {
  const { data, error } = await supabase
    .from('community_safe_zone_groups')
    .select('*')
    .eq('coordinator_id', userId)
    .eq('is_active', true);
  
  if (error) throw new Error(`Failed to fetch community groups: ${error.message}`);
  
  return (data || []) as unknown as CommunitySafeZoneGroup[];
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getStatusDisplayInfo(status: SafeZoneStatus) {
  const statusInfo: Record<SafeZoneStatus, { label: string; color: string; icon: string }> = {
    active: { label: 'Open', color: '#10b981', icon: 'check-circle' },
    capacity_warning: { label: 'High Capacity', color: '#f59e0b', icon: 'alert-triangle' },
    capacity_critical: { label: 'Near Capacity', color: '#ef4444', icon: 'alert-octagon' },
    temporarily_closed: { label: 'Temporarily Closed', color: '#6b7280', icon: 'x-circle' },
    permanently_closed: { label: 'Closed', color: '#374151', icon: 'ban' },
    under_maintenance: { label: 'Under Maintenance', color: '#3b82f6', icon: 'tool' }
  };
  
  return statusInfo[status];
}

export function formatCapacity(current: number, total: number): string {
  const percentage = calculateCapacityPercentage(current, total);
  return `${current}/${total} (${percentage}%)`;
}

export function getAccessibilityBadge(amenities: SafeZoneAmenity[]): {
  icon: string;
  label: string;
  color: string;
} | null {
  if (amenities.includes('accessibility_features') && 
      amenities.includes('accessible_restroom') &&
      amenities.includes('ground_floor_access')) {
    return {
      icon: 'accessibility',
      label: 'Fully Accessible',
      color: '#6366f1'
    };
  }
  
  if (amenities.includes('accessibility_features')) {
    return {
      icon: 'wheelchair',
      label: 'Wheelchair Accessible',
      color: '#3b82f6'
    };
  }
  
  return null;
}
