import { z } from "zod"

/**
 * Safe Zone Types - ER-002: Safe Zone Locator
 * 
 * Defines types for safe zone locations that users can find during emergencies.
 * Safe zones are locations with active services that provide shelter and safety.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Safe zone category types
 */
export type SafeZoneCategory = 
  | "hospital"
  | "shelter"
  | "police-station"
  | "fire-station"
  | "community-center"
  | "business"

/**
 * Service availability status
 */
export type ServiceStatus = "available" | "limited" | "unavailable" | "unknown"

/**
 * Safe zone location coordinates
 */
export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Services available at a safe zone
 */
export interface SafeZoneServices {
  hasPower: boolean
  hasWater: boolean
  hasShelter: boolean
  hasMedical: boolean
  hasCommunication: boolean
  hasFood: boolean
}

/**
 * Operating hours for a safe zone
 */
export interface OperatingHours {
  open: string // HH:mm format
  close: string // HH:mm format
  is24Hours: boolean
}

/**
 * Contact information for a safe zone
 */
export interface SafeZoneContact {
  phone?: string
  email?: string
  website?: string
}

/**
 * Core safe zone interface
 */
export interface SafeZone {
  id: string
  name: string
  category: SafeZoneCategory
  location: Coordinates
  address: string
  city: string
  services: SafeZoneServices
  safetyRating: number // 1-5 scale
  roadAccessible: boolean
  capacity?: number
  currentOccupancy?: number
  operatingHours: OperatingHours
  contact: SafeZoneContact
  lastVerified: string // ISO date string
  notes?: string
  distance?: number // Distance from user in km (calculated)
  estimatedTravelTime?: number // Estimated travel time in minutes (calculated)
}

// ============================================================================
// Filter and Sort Types
// ============================================================================

/**
 * Filter options for safe zones
 */
export interface SafeZoneFilters {
  hasPower?: boolean
  hasWater?: boolean
  roadAccessible?: boolean
  categories?: SafeZoneCategory[]
  minSafetyRating?: number
  maxDistance?: number
  hasCapacity?: boolean
}

/**
 * Sort options for safe zones
 */
export type SafeZoneSortOption = 
  | "distance"
  | "safetyRating"
  | "services"
  | "capacity"
  | "name"

// ============================================================================
// Validation Schemas (Zod)
// ============================================================================

/**
 * Schema for validating coordinates
 */
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
})

/**
 * Schema for validating service status
 */
export const serviceStatusSchema = z.enum([
  "available",
  "limited",
  "unavailable",
  "unknown",
])

/**
 * Schema for validating safe zone services
 */
export const safeZoneServicesSchema = z.object({
  hasPower: z.boolean(),
  hasWater: z.boolean(),
  hasShelter: z.boolean(),
  hasMedical: z.boolean(),
  hasCommunication: z.boolean(),
  hasFood: z.boolean(),
})

/**
 * Schema for validating operating hours
 */
export const operatingHoursSchema = z.object({
  open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  is24Hours: z.boolean(),
})

/**
 * Schema for validating safe zone contact
 */
export const safeZoneContactSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
})

/**
 * Schema for validating a complete safe zone
 */
export const safeZoneSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  category: z.enum([
    "hospital",
    "shelter",
    "police-station",
    "fire-station",
    "community-center",
    "business",
  ]),
  location: coordinatesSchema,
  address: z.string().min(1, "Address is required").max(500, "Address too long"),
  city: z.string().min(1, "City is required").max(100, "City too long"),
  services: safeZoneServicesSchema,
  safetyRating: z.number().min(1).max(5, "Safety rating must be between 1 and 5"),
  roadAccessible: z.boolean(),
  capacity: z.number().positive().optional(),
  currentOccupancy: z.number().nonnegative().optional(),
  operatingHours: operatingHoursSchema,
  contact: safeZoneContactSchema,
  lastVerified: z.string().datetime("Invalid ISO date format"),
  notes: z.string().max(1000, "Notes too long").optional(),
})

/**
 * Schema for validating safe zone filters
 */
export const safeZoneFiltersSchema = z.object({
  hasPower: z.boolean().optional(),
  hasWater: z.boolean().optional(),
  roadAccessible: z.boolean().optional(),
  categories: z.array(z.enum([
    "hospital",
    "shelter",
    "police-station",
    "fire-station",
    "community-center",
    "business",
  ])).optional(),
  minSafetyRating: z.number().min(1).max(5).optional(),
  maxDistance: z.number().positive().optional(),
  hasCapacity: z.boolean().optional(),
})

// ============================================================================
// Category Configuration
// ============================================================================

/**
 * Category configuration with labels and icons
 */
export const SAFE_ZONE_CATEGORIES: Record<SafeZoneCategory, { label: string; icon: string; description: string }> = {
  hospital: {
    label: "Hospital",
    icon: "🏥",
    description: "Medical facilities with healthcare services",
  },
  shelter: {
    label: "Shelter",
    icon: "🏠",
    description: "Emergency shelters for temporary housing",
  },
  "police-station": {
    label: "Police Station",
    icon: "🚔",
    description: "Police stations for safety and assistance",
  },
  "fire-station": {
    label: "Fire Station",
    icon: "🚒",
    description: "Fire stations for emergency response",
  },
  "community-center": {
    label: "Community Center",
    icon: "🏛️",
    description: "Community centers for gathering and support",
  },
  business: {
    label: "Open Business",
    icon: "🏪",
    description: "Businesses that are open and providing services",
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${km.toFixed(1)} km`
}

/**
 * Format travel time estimate
 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return `${hours}h ${mins}m`
}

/**
 * Calculate estimated travel time
 * @param distance - Distance in km
 * @param mode - Travel mode (walking, driving, cycling)
 * @returns Estimated travel time in minutes
 */
export function calculateTravelTime(
  distance: number,
  mode: "walking" | "driving" | "cycling" = "driving"
): number {
  // Average speeds in km/h
  const speeds = {
    walking: 5,
    driving: 40,
    cycling: 15,
  }
  return (distance / speeds[mode]) * 60
}

/**
 * Get safety rating color
 */
export function getSafetyRatingColor(rating: number): string {
  if (rating >= 4) return "#22c55e" // green-500
  if (rating >= 3) return "#84cc16" // lime-500
  if (rating >= 2) return "#eab308" // yellow-500
  return "#f97316" // orange-500
}

/**
 * Get safety rating label
 */
export function getSafetyRatingLabel(rating: number): string {
  if (rating >= 4) return "High Safety"
  if (rating >= 3) return "Moderate Safety"
  if (rating >= 2) return "Caution"
  return "Use Caution"
}

/**
 * Check if a safe zone is currently open
 */
export function isSafeZoneOpen(zone: SafeZone): boolean {
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  
  if (zone.operatingHours.is24Hours) return true
  
  return (
    currentTime >= zone.operatingHours.open &&
    currentTime <= zone.operatingHours.close
  )
}

/**
 * Get available capacity percentage
 */
export function getCapacityPercentage(zone: SafeZone): number | null {
  if (!zone.capacity || zone.currentOccupancy === undefined) return null
  return Math.round((zone.currentOccupancy / zone.capacity) * 100)
}

/**
 * Get capacity status label
 */
export function getCapacityStatus(percentage: number): string {
  if (percentage === null) return "Unknown capacity"
  if (percentage >= 100) return "At capacity"
  if (percentage >= 80) return "Filling up"
  if (percentage >= 50) return "Half full"
  return "Available"
}

/**
 * Generate navigation URL for a safe zone
 */
export function getNavigationUrl(zone: SafeZone, userLat?: number, userLon?: number): string {
  const destination = `${zone.location.latitude},${zone.location.longitude}`
  
  if (userLat && userLon) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${destination}&travelmode=driving`
  }
  
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone.name)}&query_place_id=${destination}`
}

/**
 * Count available services
 */
export function countAvailableServices(services: SafeZoneServices): number {
  return Object.values(services).filter(Boolean).length
}

/**
 * Get service status badge color
 */
export function getServiceStatusColor(status: ServiceStatus): string {
  const colors = {
    available: "bg-green-100 text-green-800",
    limited: "bg-yellow-100 text-yellow-800",
    unavailable: "bg-red-100 text-red-800",
    unknown: "bg-gray-100 text-gray-800",
  }
  return colors[status]
}

