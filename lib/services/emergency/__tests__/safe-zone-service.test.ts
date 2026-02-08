import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateDistance,
  filterSafeZones,
  sortSafeZones,
  SafeZoneFilters,
  safeZoneSchema,
  validateSafeZone,
  calculateSafetyScore,
  getCategoryIcon,
  formatDistance
} from '../safe-zone';

// Mock safe zones for testing
const mockSafeZones = [
  {
    id: '1',
    name: 'Central Hospital',
    category: 'hospital' as const,
    latitude: 38.7223,
    longitude: -9.1393,
    status: 'open' as const,
    services: {
      power: true,
      water: true,
      medical: true,
      food: false,
      shelter: true,
      communication: true
    },
    roadAccessible: true,
    safetyRating: 4.5,
    capacity: 200,
    currentOccupancy: 150,
    contact: '+351 123 456 789',
    address: '123 Main Street, Lisbon',
    description: 'Central hospital with emergency services',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Community Shelter',
    category: 'shelter' as const,
    latitude: 38.7300,
    longitude: -9.1450,
    status: 'limited' as const,
    services: {
      power: true,
      water: true,
      medical: false,
      food: true,
      shelter: true,
      communication: true
    },
    roadAccessible: true,
    safetyRating: 4.0,
    capacity: 100,
    currentOccupancy: 80,
    contact: '+351 987 654 321',
    address: '456 Park Avenue, Lisbon',
    description: 'Community shelter with basic amenities',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Fire Station',
    category: 'fireStation' as const,
    latitude: 38.7150,
    longitude: -9.1300,
    status: 'open' as const,
    services: {
      power: true,
      water: true,
      medical: true,
      food: false,
      shelter: false,
      communication: true
    },
    roadAccessible: true,
    safetyRating: 5.0,
    capacity: 50,
    currentOccupancy: 25,
    contact: '+351 112',
    address: '789 Emergency Road, Lisbon',
    description: 'Fire station with emergency response',
    lastUpdated: new Date().toISOString()
  }
];

describe('Safe Zone Utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points using Haversine formula', () => {
      // Lisbon coordinates
      const lat1 = 38.7223;
      const lon1 = -9.1393;
      // Near Lisbon coordinates
      const lat2 = 38.7300;
      const lon2 = -9.1450;

      const distance = calculateDistance(lat1, lon1, lat2, lon2);

      // Should return distance in kilometers (approximately 1km)
      expect(distance).toBeGreaterThan(0.5);
      expect(distance).toBeLessThan(2);
    });

    it('should return 0 for same coordinates', () => {
      const lat = 38.7223;
      const lon = -9.1393;

      const distance = calculateDistance(lat, lon, lat, lon);

      expect(distance).toBe(0);
    });

    it('should handle negative coordinates correctly', () => {
      // São Paulo coordinates
      const lat1 = -23.5505;
      const lon1 = -46.6333;
      // Rio de Janeiro coordinates
      const lat2 = -22.9068;
      const lon2 = -43.1729;

      const distance = calculateDistance(lat1, lon1, lat2, lon2);

      // Distance should be approximately 430km
      expect(distance).toBeGreaterThan(400);
      expect(distance).toBeLessThan(500);
    });

    it('should handle equator crossing', () => {
      // Quito, Ecuador (near equator)
      const lat1 = -0.1807;
      const lon1 = -78.4678;
      // Nairobi, Kenya
      const lat2 = -1.2921;
      const lon2 = 36.8219;

      const distance = calculateDistance(lat1, lon1, lat2, lon2);

      // Distance should be approximately 12,000km
      expect(distance).toBeGreaterThan(11000);
      expect(distance).toBeLessThan(13000);
    });
  });

  describe('formatDistance', () => {
    it('should format meters for short distances', () => {
      expect(formatDistance(50)).toBe('50 m');
      expect(formatDistance(500)).toBe('500 m');
      expect(formatDistance(999)).toBe('999 m');
    });

    it('should format kilometers for longer distances', () => {
      expect(formatDistance(1000)).toBe('1.0 km');
      expect(formatDistance(1500)).toBe('1.5 km');
      expect(formatDistance(10000)).toBe('10.0 km');
    });

    it('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0 m');
    });
  });

  describe('calculateSafetyScore', () => {
    it('should calculate higher score for more services', () => {
      const zoneWithAllServices = {
        services: {
          power: true,
          water: true,
          medical: true,
          food: true,
          shelter: true,
          communication: true
        },
        roadAccessible: true,
        safetyRating: 5.0
      };

      const zoneWithFewServices = {
        services: {
          power: true,
          water: false,
          medical: false,
          food: false,
          shelter: false,
          communication: false
        },
        roadAccessible: true,
        safetyRating: 3.0
      };

      const scoreAll = calculateSafetyScore(zoneWithAllServices);
      const scoreFew = calculateSafetyScore(zoneWithFewServices);

      expect(scoreAll).toBeGreaterThan(scoreFew);
    });

    it('should give bonus for road accessibility', () => {
      const accessible = {
        services: { power: true, water: true, medical: false, food: false, shelter: false, communication: false },
        roadAccessible: true,
        safetyRating: 4.0
      };

      const notAccessible = {
        services: { power: true, water: true, medical: false, food: false, shelter: false, communication: false },
        roadAccessible: false,
        safetyRating: 4.0
      };

      const scoreAccessible = calculateSafetyScore(accessible);
      const scoreNotAccessible = calculateSafetyScore(notAccessible);

      expect(scoreAccessible).toBeGreaterThan(scoreNotAccessible);
    });
  });

  describe('getCategoryIcon', () => {
    it('should return correct icon for each category', () => {
      expect(getCategoryIcon('hospital')).toBe('🏥');
      expect(getCategoryIcon('shelter')).toBe('🏠');
      expect(getCategoryIcon('communityCenter')).toBe('🏛️');
      expect(getCategoryIcon('fireStation')).toBe('🚒');
      expect(getCategoryIcon('policeStation')).toBe('🚔');
      expect(getCategoryIcon('openBusiness')).toBe('🏪');
    });
  });
});

describe('Safe Zone Filtering', () => {
  describe('filterSafeZones', () => {
    it('should filter by hasPower filter', () => {
      const filters: SafeZoneFilters = { hasPower: true };
      const result = filterSafeZones(mockSafeZones, filters);

      expect(result.length).toBe(3);
      expect(result.every(z => z.services.power)).toBe(true);
    });

    it('should filter by hasWater filter', () => {
      const filters: SafeZoneFilters = { hasWater: true };
      const result = filterSafeZones(mockSafeZones, filters);

      expect(result.length).toBe(3);
      expect(result.every(z => z.services.water)).toBe(true);
    });

    it('should filter by roadAccessible filter', () => {
      const filters: SafeZoneFilters = { roadAccessible: true };
      const result = filterSafeZones(mockSafeZones, filters);

      expect(result.length).toBe(3);
      expect(result.every(z => z.roadAccessible)).toBe(true);
    });

    it('should filter by category', () => {
      const filters: SafeZoneFilters = { category: 'hospital' };
      const result = filterSafeZones(mockSafeZones, filters);

      expect(result.length).toBe(1);
      expect(result[0].category).toBe('hospital');
    });

    it('should filter by multiple criteria', () => {
      const filters: SafeZoneFilters = {
        hasPower: true,
        hasWater: true,
        roadAccessible: true
      };
      const result = filterSafeZones(mockSafeZones, filters);

      expect(result.length).toBe(3);
      expect(result.every(z => z.services.power && z.services.water && z.roadAccessible)).toBe(true);
    });

    it('should filter by status', () => {
      const filters: SafeZoneFilters = { status: 'open' };
      const result = filterSafeZones(mockSafeZones, filters);

      expect(result.length).toBe(2);
      expect(result.every(z => z.status === 'open')).toBe(true);
    });

    it('should filter by max distance', () => {
      const filters: SafeZoneFilters = { maxDistance: 0.5 };
      const result = filterSafeZones(mockSafeZones, filters, { lat: 38.7223, lng: -9.1393 });

      expect(result.length).toBeLessThan(mockSafeZones.length);
      result.forEach(zone => {
        const distance = calculateDistance(38.7223, -9.1393, zone.latitude, zone.longitude);
        expect(distance).toBeLessThanOrEqual(0.5);
      });
    });

    it('should return empty array when no zones match', () => {
      const noPowerZones = mockSafeZones.map(z => ({
        ...z,
        services: { ...z.services, power: false }
      }));
      const filters: SafeZoneFilters = { hasPower: true };
      const result = filterSafeZones(noPowerZones, filters);

      expect(result.length).toBe(0);
    });
  });
});

describe('Safe Zone Sorting', () => {
  describe('sortSafeZones', () => {
    it('should sort by distance from origin', () => {
      const origin = { lat: 38.7223, lng: -9.1393 };
      const result = sortSafeZones(mockSafeZones, 'distance', origin);

      expect(result.length).toBe(3);
      // First zone should be closest
      const firstDistance = calculateDistance(origin.lat, origin.lng, result[0].latitude, result[0].longitude);
      const secondDistance = calculateDistance(origin.lat, origin.lng, result[1].latitude, result[1].longitude);
      expect(firstDistance).toBeLessThanOrEqual(secondDistance);
    });

    it('should sort by safety rating descending', () => {
      const result = sortSafeZones(mockSafeZones, 'rating');

      expect(result.length).toBe(3);
      expect(result[0].safetyRating).toBeGreaterThanOrEqual(result[1].safetyRating);
      expect(result[1].safetyRating).toBeGreaterThanOrEqual(result[2].safetyRating);
    });

    it('should sort by services count descending', () => {
      const result = sortSafeZones(mockSafeZones, 'services');

      expect(result.length).toBe(3);
      const firstCount = Object.values(result[0].services).filter(Boolean).length;
      const secondCount = Object.values(result[1].services).filter(Boolean).length;
      expect(firstCount).toBeGreaterThanOrEqual(secondCount);
    });

    it('should use provided origin for distance sorting', () => {
      const origin = { lat: 38.7150, lng: -9.1300 }; // Near fire station
      const result = sortSafeZones(mockSafeZones, 'distance', origin);

      expect(result[0].id).toBe('3'); // Fire station should be first (closest)
    });
  });
});

describe('Safe Zone Validation', () => {
  describe('safeZoneSchema', () => {
    it('should validate a correct safe zone', () => {
      const validZone = {
        id: 'test-1',
        name: 'Test Shelter',
        category: 'shelter',
        latitude: 38.7223,
        longitude: -9.1393,
        status: 'open',
        services: {
          power: true,
          water: true,
          medical: false,
          food: true,
          shelter: true,
          communication: true
        },
        roadAccessible: true,
        safetyRating: 4.5,
        capacity: 100,
        currentOccupancy: 50,
        contact: '+351 123 456 789',
        address: '123 Test Street',
        description: 'A test shelter',
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      const result = safeZoneSchema.safeParse(validZone);
      expect(result.success).toBe(true);
    });

    it('should reject invalid latitude', () => {
      const invalidZone = {
        id: 'test-1',
        name: 'Test Shelter',
        category: 'shelter',
        latitude: 91, // Invalid: greater than 90
        longitude: -9.1393,
        status: 'open',
        services: {
          power: true,
          water: true,
          medical: false,
          food: true,
          shelter: true,
          communication: true
        },
        roadAccessible: true,
        safetyRating: 4.5,
        capacity: 100,
        currentOccupancy: 50,
        contact: '+351 123 456 789',
        address: '123 Test Street',
        description: 'A test shelter',
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      const result = safeZoneSchema.safeParse(invalidZone);
      expect(result.success).toBe(false);
    });

    it('should reject invalid longitude', () => {
      const invalidZone = {
        id: 'test-1',
        name: 'Test Shelter',
        category: 'shelter',
        latitude: 38.7223,
        longitude: -181, // Invalid: less than -180
        status: 'open',
        services: {
          power: true,
          water: true,
          medical: false,
          food: true,
          shelter: true,
          communication: true
        },
        roadAccessible: true,
        safetyRating: 4.5,
        capacity: 100,
        currentOccupancy: 50,
        contact: '+351 123 456 789',
        address: '123 Test Street',
        description: 'A test shelter',
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      const result = safeZoneSchema.safeParse(invalidZone);
      expect(result.success).toBe(false);
    });

    it('should reject negative safety rating', () => {
      const invalidZone = {
        id: 'test-1',
        name: 'Test Shelter',
        category: 'shelter',
        latitude: 38.7223,
        longitude: -9.1393,
        status: 'open',
        services: {
          power: true,
          water: true,
          medical: false,
          food: true,
          shelter: true,
          communication: true
        },
        roadAccessible: true,
        safetyRating: -1, // Invalid: negative
        capacity: 100,
        currentOccupancy: 50,
        contact: '+351 123 456 789',
        address: '123 Test Street',
        description: 'A test shelter',
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      const result = safeZoneSchema.safeParse(invalidZone);
      expect(result.success).toBe(false);
    });

    it('should reject safety rating greater than 5', () => {
      const invalidZone = {
        id: 'test-1',
        name: 'Test Shelter',
        category: 'shelter',
        latitude: 38.7223,
        longitude: -9.1393,
        status: 'open',
        services: {
          power: true,
          water: true,
          medical: false,
          food: true,
          shelter: true,
          communication: true
        },
        roadAccessible: true,
        safetyRating: 6, // Invalid: greater than 5
        capacity: 100,
        currentOccupancy: 50,
        contact: '+351 123 456 789',
        address: '123 Test Street',
        description: 'A test shelter',
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      const result = safeZoneSchema.safeParse(invalidZone);
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const invalidZone = {
        id: 'test-1',
        name: 'Test Shelter',
        category: 'invalidCategory', // Invalid category
        latitude: 38.7223,
        longitude: -9.1393,
        status: 'open',
        services: {
          power: true,
          water: true,
          medical: false,
          food: true,
          shelter: true,
          communication: true
        },
        roadAccessible: true,
        safetyRating: 4.5,
        capacity: 100,
        currentOccupancy: 50,
        contact: '+351 123 456 789',
        address: '123 Test Street',
        description: 'A test shelter',
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      const result = safeZoneSchema.safeParse(invalidZone);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidZone = {
        id: 'test-1',
        name: 'Test Shelter',
        category: 'shelter',
        latitude: 38.7223,
        longitude: -9.1393,
        status: 'invalidStatus', // Invalid status
        services: {
          power: true,
          water: true,
          medical: false,
          food: true,
          shelter: true,
          communication: true
        },
        roadAccessible: true,
        safetyRating: 4.5,
        capacity: 100,
        currentOccupancy: 50,
        contact: '+351 123 456 789',
        address: '123 Test Street',
        description: 'A test shelter',
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      const result = safeZoneSchema.safeParse(invalidZone);
      expect(result.success).toBe(false);
    });
  });

  describe('validateSafeZone', () => {
    it('should return true for valid zone', () => {
      const validZone = {
        id: 'test-1',
        name: 'Test Shelter',
        category: 'shelter' as const,
        latitude: 38.7223,
        longitude: -9.1393,
        status: 'open' as const,
        services: {
          power: true,
          water: true,
          medical: false,
          food: true,
          shelter: true,
          communication: true
        },
        roadAccessible: true,
        safetyRating: 4.5,
        capacity: 100,
        currentOccupancy: 50,
        contact: '+351 123 456 789',
        address: '123 Test Street',
        description: 'A test shelter',
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      const result = validateSafeZone(validZone);
      expect(result.valid).toBe(true);
    });

    it('should return false and errors for invalid zone', () => {
      const invalidZone = {
        id: 'test-1',
        name: 'Test Shelter',
        category: 'shelter' as const,
        latitude: 100, // Invalid
        longitude: -9.1393,
        status: 'open' as const,
        services: {
          power: true,
          water: true,
          medical: false,
          food: true,
          shelter: true,
          communication: true
        },
        roadAccessible: true,
        safetyRating: 4.5,
        capacity: 100,
        currentOccupancy: 50,
        contact: '+351 123 456 789',
        address: '123 Test Street',
        description: 'A test shelter',
        lastUpdated: '2024-01-01T00:00:00Z'
      };

      const result = validateSafeZone(invalidZone);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });
});

describe('Integration Tests', () => {
  it('should filter and sort safe zones correctly', () => {
    const filters: SafeZoneFilters = { hasPower: true, hasWater: true };
    const origin = { lat: 38.7223, lng: -9.1393 };

    // First filter
    const filtered = filterSafeZones(mockSafeZones, filters);
    // Then sort by distance
    const sorted = sortSafeZones(filtered, 'distance', origin);

    expect(sorted.length).toBe(3);
    expect(sorted.every(z => z.services.power && z.services.water)).toBe(true);
    
    // Verify sorted by distance
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = calculateDistance(origin.lat, origin.lng, sorted[i].latitude, sorted[i].longitude);
      const next = calculateDistance(origin.lat, origin.lng, sorted[i + 1].latitude, sorted[i + 1].longitude);
      expect(current).toBeLessThanOrEqual(next);
    }
  });

  it('should find nearest safe zone with specific services', () => {
    const origin = { lat: 38.7223, lng: -9.1393 };
    
    // Find zones with medical services, sorted by distance
    const filters: SafeZoneFilters = { hasWater: true, category: 'hospital' };
    const filtered = filterSafeZones(mockSafeZones, filters);
    const sorted = sortSafeZones(filtered, 'distance', origin);

    if (sorted.length > 0) {
      expect(sorted[0].services.medical).toBe(true);
      const distance = calculateDistance(origin.lat, origin.lng, sorted[0].latitude, sorted[0].longitude);
      expect(distance).toBeLessThanOrEqual(
        calculateDistance(origin.lat, origin.lng, sorted[1]?.latitude || 0, sorted[1]?.longitude || 0)
      );
    }
  });
});
