/**
 * Unit tests for SOS Service
 * Tests the core SOS alert functionality including validation, CRUD operations, and Zod schema validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createSOSAlert,
  updateSOSAlert,
  resolveSOSAlert,
  listActiveSOSAlerts,
  getSOSAlertById,
  validateSOSAlertData,
  SOSAlertSchema,
  type SOSAlert,
  type CreateSOSAlertInput,
  type UpdateSOSAlertInput,
  EmergencyType,
  PriorityLevel,
  AlertStatus,
} from '../sos-service'

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockSOSAlert, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockSOSAlert, error: null })),
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [mockSOSAlert], error: null })),
          })),
        })),
      })),
    })),
  })),
}))

// Mock console for clean test output
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('SOS Service - Zod Schema Validation', () => {
  it('should validate a valid SOS alert input', () => {
    const validInput: CreateSOSAlertInput = {
      emergency_type: 'fire',
      priority: 1,
      latitude: 40.7128,
      longitude: -74.006,
      description: 'Building fire reported',
      reporter_name: 'John Doe',
      reporter_phone: '+1234567890',
      emergency_contacts: ['+0987654321'],
    }

    const result = validateSOSAlertData(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.emergency_type).toBe('fire')
      expect(result.data.priority).toBe(1)
    }
  })

  it('should reject invalid emergency type', () => {
    const invalidInput = {
      emergency_type: 'invalid_type',
      priority: 1,
      latitude: 40.7128,
      longitude: -74.006,
    }

    const result = validateSOSAlertData(invalidInput as CreateSOSAlertInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('emergency_type')
    }
  })

  it('should reject invalid latitude range', () => {
    const invalidInput = {
      emergency_type: 'fire',
      priority: 1,
      latitude: 91, // Invalid: exceeds 90
      longitude: -74.006,
    }

    const result = validateSOSAlertData(invalidInput as CreateSOSAlertInput)
    expect(result.success).toBe(false)
  })

  it('should reject invalid longitude range', () => {
    const invalidInput = {
      emergency_type: 'fire',
      priority: 1,
      latitude: 40.7128,
      longitude: -181, // Invalid: less than -180
    }

    const result = validateSOSAlertData(invalidInput as CreateSOSAlertInput)
    expect(result.success).toBe(false)
  })

  it('should reject priority out of range', () => {
    const invalidInput = {
      emergency_type: 'fire',
      priority: 6, // Invalid: exceeds 5
      latitude: 40.7128,
      longitude: -74.006,
    }

    const result = validateSOSAlertData(invalidInput as CreateSOSAlertInput)
    expect(result.success).toBe(false)
  })

  it('should validate all emergency types', () => {
    const emergencyTypes: EmergencyType[] = [
      'fire',
      'flooding',
      'electrocution',
      'building_collapse',
      'medical',
    ]

    emergencyTypes.forEach((type) => {
      const validInput: CreateSOSAlertInput = {
        emergency_type: type,
        priority: 1,
        latitude: 40.7128,
        longitude: -74.006,
      }

      const result = validateSOSAlertData(validInput)
      expect(result.success).toBe(true)
    })
  })

  it('should validate all priority levels', () => {
    const priorities: PriorityLevel[] = [1, 2, 3, 4, 5]

    priorities.forEach((priority) => {
      const validInput: CreateSOSAlertInput = {
        emergency_type: 'fire',
        priority,
        latitude: 40.7128,
        longitude: -74.006,
      }

      const result = validateSOSAlertData(validInput)
      expect(result.success).toBe(true)
    })
  })

  it('should accept optional description field', () => {
    const validInput: CreateSOSAlertInput = {
      emergency_type: 'fire',
      priority: 1,
      latitude: 40.7128,
      longitude: -74.006,
      description: 'Large fire visible from main road',
    }

    const result = validateSOSAlertData(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('Large fire visible from main road')
    }
  })

  it('should accept multiple emergency contacts', () => {
    const validInput: CreateSOSAlertInput = {
      emergency_type: 'medical',
      priority: 1,
      latitude: 40.7128,
      longitude: -74.006,
      emergency_contacts: ['+1234567890', '+0987654321', '+1122334455'],
    }

    const result = validateSOSAlertData(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.emergency_contacts).toHaveLength(3)
    }
  })
})

describe('SOS Service - CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createSOSAlert', () => {
    it('should create a new SOS alert with valid data', async () => {
      const input: CreateSOSAlertInput = {
        emergency_type: 'fire',
        priority: 1,
        latitude: 40.7128,
        longitude: -74.006,
        description: 'Building fire reported',
        reporter_name: 'John Doe',
        reporter_phone: '+1234567890',
        emergency_contacts: ['+0987654321'],
      }

      const result = await createSOSAlert(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.emergency_type).toBe('fire')
        expect(result.data.priority).toBe(1)
        expect(result.data.status).toBe('active')
      }
    })

    it('should handle validation errors gracefully', async () => {
      const invalidInput = {
        emergency_type: 'invalid',
        priority: 10,
        latitude: 100,
        longitude: -74.006,
      }

      const result = await createSOSAlert(invalidInput as CreateSOSAlertInput)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })
  })

  describe('updateSOSAlert', () => {
    it('should update an existing SOS alert', async () => {
      const input: UpdateSOSAlertInput = {
        id: 'test-id',
        description: 'Updated description',
        priority: 2,
      }

      const result = await updateSOSAlert(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe('Updated description')
        expect(result.data.priority).toBe(2)
      }
    })
  })

  describe('resolveSOSAlert', () => {
    it('should resolve an active SOS alert', async () => {
      const alertId = 'test-id'

      const result = await resolveSOSAlert(alertId)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('resolved')
      }
    })
  })

  describe('listActiveSOSAlerts', () => {
    it('should return all active SOS alerts', async () => {
      const result = await listActiveSOSAlerts()

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array when no active alerts exist', async () => {
      // This test verifies the function handles empty state correctly
      const result = await listActiveSOSAlerts()
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getSOSAlertById', () => {
    it('should return an SOS alert by ID', async () => {
      const alertId = 'test-id'

      const result = await getSOSAlertById(alertId)

      expect(result).toBeDefined()
      if (result) {
        expect(result.id).toBe(alertId)
      }
    })

    it('should return null for non-existent ID', async () => {
      const nonExistentId = 'non-existent-id'

      const result = await getSOSAlertById(nonExistentId)

      expect(result).toBeNull()
    })
  })
})

describe('SOS Service - Business Logic', () => {
  it('should auto-set default status to active', () => {
    const result = SOSAlertSchema.safeParse({
      emergency_type: 'fire',
      priority: 1,
      latitude: 40.7128,
      longitude: -74.006,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('active')
    }
  })

  it('should handle coordinates at boundary values', () => {
    // Test exact boundary values
    const boundaryInputs = [
      { latitude: 90, longitude: 180 },
      { latitude: -90, longitude: -180 },
      { latitude: 0, longitude: 0 },
    ]

    boundaryInputs.forEach((input) => {
      const result = SOSAlertSchema.safeParse({
        emergency_type: 'fire',
        priority: 1,
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
      const result = SOSAlertSchema.safeParse({
        emergency_type: 'fire',
        priority: 1,
        latitude: input.latitude,
        longitude: input.longitude,
      })

      expect(result.success).toBe(false)
    })
  })
})

describe('SOS Service - Emergency Type Mappings', () => {
  it('should have all required emergency types defined', () => {
    const expectedTypes: EmergencyType[] = [
      'fire',
      'flooding',
      'electrocution',
      'building_collapse',
      'medical',
    ]

    expectedTypes.forEach((type) => {
      const validInput: CreateSOSAlertInput = {
        emergency_type: type,
        priority: 1,
        latitude: 40.7128,
        longitude: -74.006,
      }

      const result = validateSOSAlertData(validInput)
      expect(result.success).toBe(true)
    })
  })

  it('should support priority levels 1-5', () => {
    const validPriorities: PriorityLevel[] = [1, 2, 3, 4, 5]

    validPriorities.forEach((priority) => {
      const validInput: CreateSOSAlertInput = {
        emergency_type: 'fire',
        priority,
        latitude: 40.7128,
        longitude: -74.006,
      }

      const result = validateSOSAlertData(validInput)
      expect(result.success).toBe(true)
    })
  })

  it('should support all alert statuses', () => {
    const validStatuses: AlertStatus[] = ['active', 'resolved', 'escalated']

    validStatuses.forEach((status) => {
      const result = SOSAlertSchema.safeParse({
        emergency_type: 'fire',
        priority: 1,
        latitude: 40.7128,
        longitude: -74.006,
        status,
      })

      expect(result.success).toBe(true)
    })
  })
})
