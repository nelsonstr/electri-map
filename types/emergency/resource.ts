// Resource Types for Emergency Response System
// Phase 2: Resource Management

// ============================================================================
// Enums
// ============================================================================

export type ResourceType = 
  | 'personnel'    // Firefighters, EMTs, police officers
  | 'equipment'     // Fire extinguishers, medical supplies, tools
  | 'vehicle'       // Fire trucks, ambulances, patrol cars
  | 'heavy_equipment' // Bulldozers, cranes, helicopters
  | 'specialized'   // Hazmat suits, diving equipment, K9 units

export type ResourceStatus = 
  | 'available'     // Ready for deployment
  | 'deployed'      // Currently assigned to an incident
  | 'returning'     // Returning to base after deployment
  | 'maintenance'   // Under maintenance
  | 'out_of_service' // Temporarily unavailable
  | 'reserved'      // Pre-assigned to planned operation

// ============================================================================
// Main Resource Interface
// ============================================================================

export interface EmergencyResource {
  id: string
  resourceCode: string         // Human-readable ID (e.g., RES-2026-0001)
  name: string
  resourceType: ResourceType
  status: ResourceStatus
  
  // Location
  baseLocation: {
    address?: string
    city?: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  currentLocation?: {
    latitude: number
    longitude: number
    updatedAt: Date
  }
  
  // Assignment
  currentIncidentId?: string
  assignedTeam?: string
  
  // Personnel-specific
  personnelInfo?: {
    count: number
    skills: string[]
    certifications: string[]
    commander?: string
  }
  
  // Equipment-specific
  equipmentInfo?: {
    type: string
    capacity?: string
    fuelType?: string
  }
  
  // Vehicle-specific
  vehicleInfo?: {
    plateNumber: string
    vehicleType: string
    fuelLevel?: number
    mileage?: number
  }
  
  // Availability
  availableFrom?: Date
  
  // Contact
  contactInfo?: {
    phone?: string
    radio?: string
    email?: string
  }
  
  // Metadata
  agencyId: string
  agencyName: string
  tags: string[]
  
  // Audit
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateResourceInput {
  name: string
  resourceType: ResourceType
  baseLocation: {
    address?: string
    city?: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  agencyId: string
  agencyName: string
  personnelInfo?: {
    count: number
    skills: string[]
    certifications: string[]
    commander?: string
  }
  equipmentInfo?: {
    type: string
    capacity?: string
    fuelType?: string
  }
  vehicleInfo?: {
    plateNumber: string
    vehicleType: string
    fuelLevel?: number
    mileage?: number
  }
  contactInfo?: {
    phone?: string
    radio?: string
    email?: string
  }
  tags?: string[]
}

export interface UpdateResourceInput {
  id: string
  name?: string
  status?: ResourceStatus
  currentLocation?: {
    latitude: number
    longitude: number
  }
  currentIncidentId?: string
  assignedTeam?: string
  availableFrom?: Date
  contactInfo?: {
    phone?: string
    radio?: string
    email?: string
  }
  tags?: string[]
}

// ============================================================================
// Resource Allocation
// ============================================================================

export interface ResourceAllocation {
  id: string
  incidentId: string
  resourceId: string
  
  allocationType: 'primary' | 'support' | 'reserve'
  status: 'pending' | 'accepted' | 'en_route' | 'onsite' | 'returning'
  
  assignedAt: Date
  acceptedAt?: Date
  arrivedAt?: Date
  departedAt?: Date
  
  estimatedArrival?: Date
  actualArrival?: Date
  
  assignedBy: string
  notes?: string
  
  // Track resource during allocation
  route?: {
    origin: { lat: number; lng: number }
    destination: { lat: number; lng: number }
    distance?: number
    duration?: number
  }
}

// ============================================================================
// Query Types
// ============================================================================

export interface ResourceFilters {
  status?: ResourceStatus[]
  resourceType?: ResourceType[]
  agencyId?: string
  skills?: string[]
  boundingBox?: {
    north: number
    south: number
    east: number
    west: number
  }
  availableNow?: boolean
  search?: string
}

// ============================================================================
// Real-time Types
// ============================================================================

export type ResourceEventType = 
  | 'resource.created'
  | 'resource.updated'
  | 'resource.status_changed'
  | 'resource.location_updated'
  | 'resource.allocated'
