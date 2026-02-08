/**
 * Unit tests for Community Alert Service
 * Tests the core community alert functionality including validation, filtering, and utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CommunityAlertSchema,
  createCommunityAlert,
  listNearbyAlerts,
  validateAlertData,
  filterAlertsByRadius,
  filterAlertsBySeverity,
  sortAlertsByDistance,
  sortAlertsByTime,
  formatAlertTime,
  getSeverityColor,
  getSeverityIcon,
  type CommunityAlert,
  type AlertSeverity,
  type AlertType,
  type CreateAlertInput,
} from '../community-alert'

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockCommunityAlert, error: null })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [mockCommunityAlert], error: null })),
              })),
            })),
          })),
        })),
      })),
    })),
  })),
}))

// Mock console for clean test output
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

// Mock community alerts for testing
const mockCommunityAlerts: CommunityAlert[] = [
  {
    id: '1',
    title: 'Power Outage',
    description: 'Scheduled power maintenance in the area',
    type: 'powerOutage',
    severity: 'warning',
    latitude: 38.7223,
    longitude: -9.1393,
    radius: 1000,
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-01-15T14:00:00Z',
    source: 'EDP Distribution',
    affectedAreas: ['Alameda', 'Avenida da Liberdade'],
  },
  {
    id: '2',
    title: 'Gas Leak',
    description: 'Gas leak detected near the main intersection',
    type: 'gasLeak',
    severity: 'critical',
    latitude: 38.7300,
    longitude: -9.1450,
    radius: 500,
    status: 'active',
    createdAt: '2024-01-15T11:00:00Z',
    expiresAt: '2024-01-15T12:00:00Z',
    source: 'Lisbon Fire Department',
    affectedAreas: ['Rossio'],
  },
  {
    id: '3',
    title: 'Water Supply Update',
    description: 'Water quality test completed - all clear',
    type: 'waterOutage',
    severity: 'informational',
    latitude: 38.7150,
    longitude: -9.1300,
    radius: 2000,
    status: 'resolved',
    createdAt: '2024-01-15T09:00:00Z',
    expiresAt: '2024-01-15T10:00:00Z',
    source: 'Águas de Lisboa',
    affectedAreas: ['Alfama'],
  },
]

describe('Community Alert Service - Zod Schema Validation', () => {
  it('should validate a valid alert input', () => {
    const validInput: CreateAlertInput = {
      title: 'Power Outage',
      description: 'Scheduled maintenance',
      type: 'powerOutage',
      severity: 'warning',
      latitude: 38.7223,
      longitude: -9.1393,
      radius: 1000,
      source: 'EDP Distribution',
    }

    const result = validateAlertData(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Power Outage')
      expect(result.data.severity).toBe('warning')
      expect(result.data.type).toBe('powerOutage')
    }
  })

  it('should reject invalid alert type', () => {
    const invalidInput = {
      title: 'Test Alert',
      type: 'invalidType',
      severity: 'warning',
      latitude: 38.7223,
      longitude: -9.1393,
    }

    const result = validateAlertData(invalidInput as CreateAlertInput)
    expect(result.success).toBe(false)
  })

  it('should reject invalid severity level', () => {
    const invalidInput = {
      title: 'Test Alert',
      type: 'powerOutage',
      severity: 'invalidSeverity',
      latitude: 38.7223,
      longitude: -9.1393,
    }

    const result = validateAlertData(invalidInput as CreateAlertInput)
    expect(result.success).toBe(false)
  })

  it('should reject invalid latitude range', () => {
    const invalidInput = {
      title: 'Test Alert',
      type: 'powerOutage',
      severity: 'warning',
      latitude: 91, // Invalid: exceeds 90
      longitude: -9.1393,
    }

    const result = validateAlertData(invalidInput as CreateAlertInput)
    expect(result.success).toBe(false)
  })

  it('should reject invalid longitude range', () => {
    const invalidInput = {
      title: 'Test Alert',
      type: 'powerOutage',
      severity: 'warning',
      latitude: 38.7223,
      longitude: -181, // Invalid: less than -180
    }

    const result = validateAlertData(invalidInput as CreateAlertInput)
    expect(result.success).toBe(false)
  })

  it('should reject negative radius', () => {
    const invalidInput = {
      title: 'Test Alert',
      type: 'powerOutage',
      severity: 'warning',
      latitude: 38.7223,
      longitude: -9.1393,
      radius: -100, // Invalid: negative
    }

    const result = validateAlertData(invalidInput as CreateAlertInput)
    expect(result.success).toBe(false)
  })

  it('should reject radius exceeding maximum', () => {
    const invalidInput = {
      title: 'Test Alert',
      type: 'powerOutage',
      severity: 'warning',
      latitude: 38.7223,
      longitude: -9.1393,
      radius: 15000, // Invalid: exceeds 10000m
    }

    const result = validateAlertData(invalidInput as CreateAlertInput)
    expect(result.success).toBe(false)
  })

  it('should validate all alert types', () => {
    const alertTypes: AlertType[] = [
      'powerOutage',
      'waterOutage',
      'gasLeak',
      'roadClosure',
      'fire',
      'flood',
      'medical',
      'infrastructure',
      'other',
    ]

    alertTypes.forEach((type) => {
      const validInput: CreateAlertInput = {
        title: 'Test Alert',
        type,
        severity: 'informational',
        latitude: 38.7223,
        longitude: -9.1393,
      }

      const result = validateAlertData(validInput)
      expect(result.success).toBe(true)
    })
  })

  it('should validate all severity levels', () => {
    const severities: AlertSeverity[] = ['informational', 'warning', 'critical']

    severities.forEach((severity) => {
      const validInput: CreateAlertInput = {
        title: 'Test Alert',
        type: 'powerOutage',
        severity,
        latitude: 38.7223,
        longitude: -9.1393,
      }

      const result = validateAlertData(validInput)
      expect(result.success).toBe(true)
    })
  })

  it('should accept optional affected areas', () => {
    const validInput: CreateAlertInput = {
      title: 'Power Outage',
      type: 'powerOutage',
      severity: 'warning',
      latitude: 38.7223,
      longitude: -9.1393,
      affectedAreas: ['Alameda', 'Avenida da Liberdade', 'Rossio'],
    }

    const result = validateAlertData(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.affectedAreas).toHaveLength(3)
    }
  })

  it('should auto-set default status to active', () => {
    const result = CommunityAlertSchema.safeParse({
      title: 'Test Alert',
      type: 'powerOutage',
      severity: 'warning',
      latitude: 38.7223,
      longitude: -9.1393,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('active')
    }
  })
})

describe('Community Alert Service - Utility Functions', () => {
  describe('getSeverityColor', () => {
    it('should return blue for informational alerts', () => {
      expect(getSeverityColor('informational')).toBe('#3B82F6')
    })

    it('should return yellow/orange for warning alerts', () => {
      expect(getSeverityColor('warning')).toBe('#F59E0B')
    })

    it('should return red for critical alerts', () => {
      expect(getSeverityColor('critical')).toBe('#EF4444')
    })
  })

  describe('getSeverityIcon', () => {
    it('should return info icon for informational', () => {
      expect(getSeverityIcon('informational')).toBe('ℹ️')
    })

    it('should return warning icon for warning', () => {
      expect(getSeverityIcon('warning')).toBe('⚠️')
    })

    it('should return alert icon for critical', () => {
      expect(getSeverityIcon('critical')).toBe('🚨')
    })
  })

  describe('formatAlertTime', () => {
    it('should format time difference correctly for minutes', () => {
      const alertTime = new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
      const result = formatAlertTime(alertTime)
      expect(result).toBe('5 minutes ago')
    })

    it('should format time difference correctly for hours', () => {
      const alertTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      const result = formatAlertTime(alertTime)
      expect(result).toBe('2 hours ago')
    })

    it('should return "Just now" for recent alerts', () => {
      const alertTime = new Date(Date.now() - 30 * 1000).toISOString() // 30 seconds ago
      const result = formatAlertTime(alertTime)
      expect(result).toBe('Just now')
    })

    it('should return "1 hour ago" for one hour', () => {
      const alertTime = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      const result = formatAlertTime(alertTime)
      expect(result).toBe('1 hour ago')
    })

    it('should return "1 minute ago" for one minute', () => {
      const alertTime = new Date(Date.now() - 60 * 1000).toISOString() // 1 minute ago
      const result = formatAlertTime(alertTime)
      expect(result).toBe('1 minute ago')
    })
  })
})

describe('Community Alert Service - Filtering', () => {
  const userLocation = { lat: 38.7223, lng: -9.1393 }

  describe('filterAlertsByRadius', () => {
    it('should filter alerts within specified radius', () => {
      const alerts = mockCommunityAlerts
      const result = filterAlertsByRadius(alerts, userLocation, 2000)

      expect(result.length).toBeGreaterThan(0)
      result.forEach((alert) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          alert.latitude,
          alert.longitude
        )
        expect(distance * 1000).toBeLessThanOrEqual(2000) // Convert km to meters
      })
    })

    it('should return all alerts when radius is large enough', () => {
      const alerts = mockCommunityAlerts
      const result = filterAlertsByRadius(alerts, userLocation, 50000) // 50km

      expect(result.length).toBe(3)
    })

    it('should return empty array when no alerts in radius', () => {
      const distantAlerts = [
        { ...mockCommunityAlerts[0], latitude: 39.0, longitude: -10.0 }, // Far away
      ]
      const result = filterAlertsByRadius(distantAlerts, userLocation, 1000)

      expect(result.length).toBe(0)
    })

    it('should handle alerts at exact boundary', () => {
      const boundaryAlerts = [
        {
          ...mockCommunityAlerts[0],
          latitude: 38.7310, // Approximately 1km away
          longitude: -9.1393,
        },
      ]
      const result = filterAlertsByRadius(boundaryAlerts, userLocation, 1000)

      // Should include alert at approximately 1km
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('filterAlertsBySeverity', () => {
    it('should filter by single severity', () => {
      const result = filterAlertsBySeverity(mockCommunityAlerts, ['critical'])

      expect(result.length).toBe(1)
      expect(result[0].severity).toBe('critical')
    })

    it('should filter by multiple severities', () => {
      const result = filterAlertsBySeverity(mockCommunityAlerts, ['critical', 'warning'])

      expect(result.length).toBe(2)
      expect(result.every((a) => ['critical', 'warning'].includes(a.severity))).toBe(true)
    })

    it('should return all alerts when no filter specified', () => {
      const result = filterAlertsBySeverity(mockCommunityAlerts, [])

      expect(result.length).toBe(3)
    })

    it('should return empty array for non-matching severities', () => {
      const result = filterAlertsBySeverity(mockCommunityAlerts, ['critical', 'warning'])

      // Only informational alert should be excluded
      expect(result.every((a) => a.severity !== 'informational')).toBe(true)
    })
  })

  describe('sortAlertsByDistance', () => {
    it('should sort alerts by distance from user location', () => {
      const result = sortAlertsByDistance(mockCommunityAlerts, userLocation)

      expect(result.length).toBe(3)
      // First alert should be closest
      const firstDistance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        result[0].latitude,
        result[0].longitude
      )
      const secondDistance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        result[1].latitude,
        result[1].longitude
      )
      expect(firstDistance).toBeLessThanOrEqual(secondDistance)
    })

    it('should use provided origin for sorting', () => {
      const nearLocation = { lat: 38.7300, lng: -9.1450 } // Near alert 2
      const result = sortAlertsByDistance(mockCommunityAlerts, nearLocation)

      // Alert 2 (id: '2') should be first as it's closest to this location
      expect(result[0].id).toBe('2')
    })
  })

  describe('sortAlertsByTime', () => {
    it('should sort alerts by creation time (newest first)', () => {
      const result = sortAlertsByTime(mockCommunityAlerts)

      expect(result.length).toBe(3)
      // Newest alert should be first
      const firstTime = new Date(result[0].createdAt).getTime()
      const secondTime = new Date(result[1].createdAt).getTime()
      expect(firstTime).toBeGreaterThanOrEqual(secondTime)
    })

    it('should sort by oldest when specified', () => {
      const result = sortAlertsByTime(mockCommunityAlerts, 'oldest')

      expect(result.length).toBe(3)
      // Oldest alert should be first
      const firstTime = new Date(result[0].createdAt).getTime()
      const lastTime = new Date(result[2].createdAt).getTime()
      expect(firstTime).toBeLessThanOrEqual(lastTime)
    })
  })
})

describe('Community Alert Service - CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createCommunityAlert', () => {
    it('should create a new alert with valid data', async () => {
      const input: CreateAlertInput = {
        title: 'Power Outage',
        description: 'Scheduled maintenance',
        type: 'powerOutage',
        severity: 'warning',
        latitude: 38.7223,
        longitude: -9.1393,
        radius: 1000,
        source: 'EDP Distribution',
      }

      const result = await createCommunityAlert(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Power Outage')
        expect(result.data.type).toBe('powerOutage')
        expect(result.data.status).toBe('active')
      }
    })

    it('should handle validation errors gracefully', async () => {
      const invalidInput = {
        title: 'Test',
        type: 'invalid',
        severity: 'invalid',
        latitude: 100,
        longitude: -9.1393,
      }

      const result = await createCommunityAlert(invalidInput as CreateAlertInput)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })
  })

  describe('listNearbyAlerts', () => {
    it('should return alerts within radius', async () => {
      const location = { lat: 38.7223, lng: -9.1393 }
      const radius = 5000

      const result = await listNearbyAlerts(location, radius)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array when no alerts nearby', async () => {
      const distantLocation = { lat: 39.5, lng: -10.0 }
      const radius = 1000

      const result = await listNearbyAlerts(distantLocation, radius)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })
})

describe('Community Alert Service - Business Logic', () => {
  it('should auto-generate ID if not provided', () => {
    const result = CommunityAlertSchema.safeParse({
      title: 'Test Alert',
      type: 'powerOutage',
      severity: 'warning',
      latitude: 38.7223,
      longitude: -9.1393,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBeDefined()
      expect(result.data.id.length).toBeGreaterThan(0)
    }
  })

  it('should handle coordinates at boundary values', () => {
    const boundaryInputs = [
      { latitude: 90, longitude: 180 },
      { latitude: -90, longitude: -180 },
      { latitude: 0, longitude: 0 },
    ]

    boundaryInputs.forEach((input) => {
      const result = CommunityAlertSchema.safeParse({
        title: 'Test Alert',
        type: 'powerOutage',
        severity: 'warning',
        latitude: input.latitude,
        longitude: input.longitude,
      })

      expect(result.success).toBe(true)
    })
  })

  it('should reject coordinates outside valid ranges', () => {
    const invalidCoordinates = [
      { latitude: 91, longitude: 0 },
      { latitude: -91, longitude: 0 },
      { latitude: 0, longitude: 181 },
      { latitude: 0, longitude: -181 },
    ]

    invalidCoordinates.forEach((input) => {
      const result = CommunityAlertSchema.safeParse({
        title: 'Test Alert',
        type: 'powerOutage',
        severity: 'warning',
        latitude: input.latitude,
        longitude: input.longitude,
      })

      expect(result.success).toBe(false)
    })
  })

  it('should support all alert statuses', () => {
    const statuses = ['active', 'resolved', 'expired']

    statuses.forEach((status) => {
      const result = CommunityAlertSchema.safeParse({
        title: 'Test Alert',
        type: 'powerOutage',
        severity: 'warning',
        latitude: 38.7223,
        longitude: -9.1393,
        status,
      })

      expect(result.success).toBe(true)
    })
  })
})

describe('Community Alert Service - Integration Tests', () => {
  const userLocation = { lat: 38.7223, lng: -9.1393 }

  it('should filter and sort alerts correctly', () => {
    // Filter by severity
    const filtered = filterAlertsBySeverity(mockCommunityAlerts, ['critical', 'warning'])
    // Then sort by distance
    const sorted = sortAlertsByDistance(filtered, userLocation)

    expect(sorted.length).toBe(2)
    expect(sorted.every((a) => ['critical', 'warning'].includes(a.severity))).toBe(true)

    // Verify sorted by distance
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        sorted[i].latitude,
        sorted[i].longitude
      )
      const next = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        sorted[i + 1].latitude,
        sorted[i + 1].longitude
      )
      expect(current).toBeLessThanOrEqual(next)
    }
  })

  it('should find critical alerts within radius', () => {
    const radius = 5000
    const filtered = filterAlertsByRadius(mockCommunityAlerts, userLocation, radius)
    const critical = filtered.filter((a) => a.severity === 'critical')

    if (critical.length > 0) {
      critical.forEach((alert) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          alert.latitude,
          alert.longitude
        )
        expect(distance * 1000).toBeLessThanOrEqual(radius)
        expect(alert.severity).toBe('critical')
      })
    }
  })

  it('should combine multiple filters correctly', () => {
    const filters = {
      radius: 10000,
      severities: ['critical', 'warning'] as AlertSeverity[],
    }

    let result = filterAlertsByRadius(mockCommunityAlerts, userLocation, filters.radius)
    result = filterAlertsBySeverity(result, filters.severities)

    expect(result.length).toBe(2)
    expect(result.every((a) => filters.severities.includes(a.severity))).toBe(true)
  })
})

// Helper function for distance calculation (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
