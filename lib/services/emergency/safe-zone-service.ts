/**
 * Safe Zone Service - ER-002: Safe Zone Locator
 * 
 * Provides functionality to query and filter safe zones based on location and service availability.
 */

import type {
  SafeZone,
  SafeZoneFilters,
  SafeZoneSortOption,
  SafeZoneCategory,
  Coordinates,
} from "@/types/safe-zone"
import {
  calculateDistance,
  calculateTravelTime,
  countAvailableServices,
} from "@/types/safe-zone"

// ============================================================================
// Mock Data (for MVP - replace with actual API/database calls)
// ============================================================================

const MOCK_SAFE_ZONES: SafeZone[] = [
  {
    id: "sz-001",
    name: "Central Community Hospital",
    category: "hospital",
    location: { latitude: 38.7223, longitude: -9.1393 },
    address: "123 Main Street",
    city: "Lisbon",
    services: {
      hasPower: true,
      hasWater: true,
      hasShelter: true,
      hasMedical: true,
      hasCommunication: true,
      hasFood: true,
    },
    safetyRating: 5,
    roadAccessible: true,
    capacity: 200,
    currentOccupancy: 150,
    operatingHours: {
      open: "00:00",
      close: "23:59",
      is24Hours: true,
    },
    contact: {
      phone: "+351 21 123 4567",
      email: "info@centralhospital.pt",
    },
    lastVerified: new Date().toISOString(),
    address_full: "123 Main Street, Lisbon, Portugal",
  },
  {
    id: "sz-002",
    name: "Parque das Nações Shelter",
    category: "shelter",
    location: { latitude: 38.7755, longitude: -9.0982 },
    address: "456 Riverside Drive",
    city: "Lisbon",
    services: {
      hasPower: true,
      hasWater: true,
      hasShelter: true,
      hasMedical: false,
      hasCommunication: true,
      hasFood: true,
    },
    safetyRating: 4,
    roadAccessible: true,
    capacity: 100,
    currentOccupancy: 45,
    operatingHours: {
      open: "00:00",
      close: "23:59",
      is24Hours: true,
    },
    contact: {
      phone: "+351 21 234 5678",
    },
    lastVerified: new Date().toISOString(),
    address_full: "456 Riverside Drive, Lisbon, Portugal",
  },
  {
    id: "sz-003",
    name: "Santa Maria Police Station",
    category: "police-station",
    location: { latitude: 38.7359, longitude: -9.1334 },
    address: "789 Justice Avenue",
    city: "Lisbon",
    services: {
      hasPower: true,
      hasWater: true,
      hasShelter: true,
      hasMedical: false,
      hasCommunication: true,
      hasFood: false,
    },
    safetyRating: 5,
    roadAccessible: true,
    operatingHours: {
      open: "00:00",
      close: "23:59",
      is24Hours: true,
    },
    contact: {
      phone: "+351 21 345 6789",
    },
    lastVerified: new Date().toISOString(),
    address_full: "789 Justice Avenue, Lisbon, Portugal",
  },
  {
    id: "sz-004",
    name: "Alameda Fire Station",
    category: "fire-station",
    location: { latitude: 38.7102, longitude: -9.1478 },
    address: "321 Rescue Road",
    city: "Lisbon",
    services: {
      hasPower: true,
      hasWater: true,
      hasShelter: true,
      hasMedical: true,
      hasCommunication: true,
      hasFood: false,
    },
    safetyRating: 5,
    roadAccessible: true,
    operatingHours: {
      open: "00:00",
      close: "23:59",
      is24Hours: true,
    },
    contact: {
      phone: "+351 21 456 7890",
    },
    lastVerified: new Date().toISOString(),
    address_full: "321 Rescue Road, Lisbon, Portugal",
  },
  {
    id: "sz-005",
    name: "Baixa Community Center",
    category: "community-center",
    location: { latitude: 38.7078, longitude: -9.1336 },
    address: "555 Town Square",
    city: "Lisbon",
    services: {
      hasPower: true,
      hasWater: true,
      hasShelter: true,
      hasMedical: false,
      hasCommunication: true,
      hasFood: true,
    },
    safetyRating: 4,
    roadAccessible: true,
    capacity: 150,
    currentOccupancy: 60,
    operatingHours: {
      open: "08:00",
      close: "20:00",
      is24Hours: false,
    },
    contact: {
      phone: "+351 21 567 8901",
      email: "contact@baixacc.pt",
    },
    lastVerified: new Date().toISOString(),
    address_full: "555 Town Square, Lisbon, Portugal",
  },
  {
    id: "sz-006",
    name: "24/7 Convenience Store",
    category: "business",
    location: { latitude: 38.7289, longitude: -9.1278 },
    address: "888 Market Street",
    city: "Lisbon",
    services: {
      hasPower: true,
      hasWater: true,
      hasShelter: false,
      hasMedical: false,
      hasCommunication: true,
      hasFood: true,
    },
    safetyRating: 3,
    roadAccessible: true,
    operatingHours: {
      open: "00:00",
      close: "23:59",
      is24Hours: true,
    },
    contact: {
      phone: "+351 21 678 9012",
    },
    lastVerified: new Date().toISOString(),
    address_full: "888 Market Street, Lisbon, Portugal",
  },
  {
    id: "sz-007",
    name: "Estufa Fria Emergency Hub",
    category: "community-center",
    location: { latitude: 38.7169, longitude: -9.1546 },
    address: "Parque Eduardo VII",
    city: "Lisbon",
    services: {
      hasPower: true,
      hasWater: true,
      hasShelter: true,
      hasMedical: true,
      hasCommunication: true,
      hasFood: true,
    },
    safetyRating: 4,
    roadAccessible: true,
    capacity: 300,
    currentOccupancy: 120,
    operatingHours: {
      open: "00:00",
      close: "23:59",
      is24Hours: true,
    },
    contact: {
      phone: "+351 21 789 0123",
    },
    lastVerified: new Date().toISOString(),
    address_full: "Parque Eduardo VII, Lisbon, Portugal",
  },
  {
    id: "sz-008",
    name: "Cascais Municipal Shelter",
    category: "shelter",
    location: { latitude: 38.7223, longitude: -9.3979 },
    address: "12 Ocean View",
    city: "Cascais",
    services: {
      hasPower: true,
      hasWater: true,
      hasShelter: true,
      hasMedical: true,
      hasCommunication: true,
      hasFood: true,
    },
    safetyRating: 5,
    roadAccessible: true,
    capacity: 250,
    currentOccupancy: 180,
    operatingHours: {
      open: "00:00",
      close: "23:59",
      is24Hours: true,
    },
    contact: {
      phone: "+351 21 890 1234",
      email: "shelter@cascais.pt",
    },
    lastVerified: new Date().toISOString(),
    address_full: "12 Ocean View, Cascais, Portugal",
  },
]

// ============================================================================
// Service Functions
// ============================================================================

/**
 * List nearby safe zones based on location and filters
 * 
 * @param latitude - User's current latitude
 * @param longitude - User's current longitude
 * @param radiusKm - Search radius in kilometers
 * @param filters - Optional filters to apply
 * @param sortBy - Sort option for results
 * @returns Array of nearby safe zones with calculated distances
 */
export async function listNearbySafeZones(
  latitude: number,
  longitude: number,
  radiusKm: number = 50,
  filters?: SafeZoneFilters,
  sortBy: SafeZoneSortOption = "distance"
): Promise<SafeZone[]> {
  // In a real implementation, this would call an API or database
  // For MVP, we use mock data with client-side filtering
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  
  const userLocation: Coordinates = { latitude, longitude }
  
  // Calculate distances and filter zones
  let zones = MOCK_SAFE_ZONES.map((zone) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      zone.location.latitude,
      zone.location.longitude
    )
    
    const travelTime = calculateTravelTime(distance, "driving")
    
    return {
      ...zone,
      distance,
      estimatedTravelTime: travelTime,
    }
  })
  
  // Filter by radius
  zones = zones.filter((zone) => zone.distance <= radiusKm)
  
  // Apply filters
  if (filters) {
    if (filters.hasPower !== undefined) {
      zones = zones.filter((zone) => zone.services.hasPower === filters.hasPower)
    }
    
    if (filters.hasWater !== undefined) {
      zones = zones.filter((zone) => zone.services.hasWater === filters.hasWater)
    }
    
    if (filters.roadAccessible !== undefined) {
      zones = zones.filter((zone) => zone.roadAccessible === filters.roadAccessible)
    }
    
    if (filters.categories && filters.categories.length > 0) {
      zones = zones.filter((zone) => filters.categories!.includes(zone.category))
    }
    
    if (filters.minSafetyRating !== undefined) {
      zones = zones.filter((zone) => zone.safetyRating >= filters.minSafetyRating!)
    }
    
    if (filters.maxDistance !== undefined) {
      zones = zones.filter((zone) => zone.distance <= filters.maxDistance!)
    }
    
    if (filters.hasCapacity !== undefined) {
      zones = zones.filter((zone) => 
        filters.hasCapacity ? zone.capacity !== undefined : zone.capacity === undefined
      )
    }
  }
  
  // Sort zones based on selected option
  switch (sortBy) {
    case "distance":
      zones.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      break
    case "safetyRating":
      zones.sort((a, b) => b.safetyRating - a.safetyRating)
      break
    case "services":
      zones.sort((a, b) => countAvailableServices(b.services) - countAvailableServices(a.services))
      break
    case "capacity":
      zones.sort((a, b) => (b.capacity || 0) - (a.capacity || 0))
      break
    case "name":
      zones.sort((a, b) => a.name.localeCompare(b.name))
      break
  }
  
  return zones
}

/**
 * Get a single safe zone by ID
 * 
 * @param id - Safe zone ID
 * @returns Safe zone or undefined if not found
 */
export async function getSafeZoneById(id: string): Promise<SafeZone | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return MOCK_SAFE_ZONES.find((zone) => zone.id === id)
}

/**
 * Get safe zones by category
 * 
 * @param category - Safe zone category
 * @param latitude - User's current latitude
 * @param longitude - User's current longitude
 * @param radiusKm - Search radius in kilometers
 * @returns Array of safe zones in the specified category
 */
export async function getSafeZonesByCategory(
  category: SafeZoneCategory,
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<SafeZone[]> {
  return listNearbySafeZones(latitude, longitude, radiusKm, {
    categories: [category],
  })
}

/**
 * Get the nearest safe zone
 * 
 * @param latitude - User's current latitude
 * @param longitude - User's current longitude
 * @param filters - Optional filters
 * @returns Nearest safe zone
 */
export async function getNearestSafeZone(
  latitude: number,
  longitude: number,
  filters?: SafeZoneFilters
): Promise<SafeZone | null> {
  const zones = await listNearbySafeZones(latitude, longitude, 100, filters, "distance")
  return zones.length > 0 ? zones[0] : null
}

/**
 * Get all unique cities with safe zones
 * 
 * @returns Array of city names
 */
export async function getSafeZoneCities(): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  const cities = new Set(MOCK_SAFE_ZONES.map((zone) => zone.city))
  return Array.from(cities).sort()
}

/**
 * Get safe zone statistics
 * 
 * @param latitude - User's current latitude
 * @param longitude - User's current longitude
 * @param radiusKm - Search radius
 * @returns Statistics about nearby safe zones
 */
export async function getSafeZoneStats(
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<{
  total: number
  byCategory: Record<string, number>
  withPower: number
  withWater: number
  roadAccessible: number
  averageSafetyRating: number
}> {
  const zones = await listNearbySafeZones(latitude, longitude, radiusKm)
  
  const byCategory: Record<string, number> = {}
  let withPower = 0
  let withWater = 0
  let roadAccessible = 0
  let totalSafety = 0
  
  zones.forEach((zone) => {
    byCategory[zone.category] = (byCategory[zone.category] || 0) + 1
    if (zone.services.hasPower) withPower++
    if (zone.services.hasWater) withWater++
    if (zone.roadAccessible) roadAccessible++
    totalSafety += zone.safetyRating
  })
  
  return {
    total: zones.length,
    byCategory,
    withPower,
    withWater,
    roadAccessible,
    averageSafetyRating: zones.length > 0 ? totalSafety / zones.length : 0,
  }
}

// ============================================================================
// Database Query Functions (for future implementation)
// ============================================================================

/**
 * Query safe zones from database with PostGIS spatial queries
 * This is a template for future database implementation
 * 
 * @param latitude - User's current latitude
 * @param longitude - User's current longitude
 * @param radiusKm - Search radius in kilometers
 * @param filters - Optional filters
 * @returns Array of safe zones from database
 */
export async function querySafeZonesFromDatabase(
  latitude: number,
  longitude: number,
  radiusKm: number,
  filters?: SafeZoneFilters
): Promise<SafeZone[]> {
  // This is a template for future PostGIS implementation
  // Example PostGIS query:
  /*
  const query = `
    SELECT 
      sz.id,
      sz.name,
      sz.category,
      sz.latitude,
      sz.longitude,
      sz.address,
      sz.city,
      sz.has_power,
      sz.has_water,
      sz.has_shelter,
      sz.has_medical,
      sz.has_communication,
      sz.has_food,
      sz.safety_rating,
      sz.road_accessible,
      sz.capacity,
      sz.operating_hours,
      sz.contact_info,
      sz.last_verified,
      sz.notes,
      ST_Distance(
        ST_SetSRID(ST_MakePoint($1, $2), 4326),
        ST_SetSRID(ST_MakePoint(sz.longitude, sz.latitude), 4326)
      ) / 1000 as distance
    FROM safe_zones sz
    WHERE ST_DWithin(
      ST_SetSRID(ST_MakePoint($1, $2), 4326),
      ST_SetSRID(ST_MakePoint(sz.longitude, sz.latitude), 4326),
      $3 * 1000
    )
    ${filters?.hasPower !== undefined ? "AND sz.has_power = $4" : ""}
    ${filters?.hasWater !== undefined ? "AND sz.has_water = $5" : ""}
    ${filters?.roadAccessible !== undefined ? "AND sz.road_accessible = $6" : ""}
    ORDER BY distance ASC
  `
  */
  
  // For now, return mock data
  return listNearbySafeZones(latitude, longitude, radiusKm, filters)
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  SafeZone,
  SafeZoneFilters,
  SafeZoneSortOption,
  SafeZoneCategory,
  Coordinates,
}
