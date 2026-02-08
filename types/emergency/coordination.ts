// Coordination Types for Emergency Response System
// Phase 3: Multi-Agency Coordination

// ============================================================================
// Enums
// ============================================================================

export type AgencyType = 
  | 'fire'            // Fire department (Bombeiros)
  | 'medical'         // EMS / Ambulance services
  | 'police'         // Police / Law enforcement
  | 'civil_protection' // Civil Protection (Proteção Civil)
  | 'military'        // Military forces
  | 'coast_guard'     // Maritime rescue
  | 'mountain_rescue' // Mountain rescue
  | 'red_cross'       // Red Cross / Humanitarian
  | 'customs'         // Customs and border control
  | 'environmental'   // Environmental agency
  | 'transport'       // Transportation authority
  | 'health'          // Public health authority
  | 'utility'         // Utility companies
  | 'municipal'       // Municipal services
  | 'other'           // Other agencies

export type AgencyStatus = 
  | 'active'      // Active and available
  | 'deployed'   // Currently deployed to incidents
  | 'standby'    // Ready but not actively engaged
  | 'unavailable' // Temporarily unavailable
  | 'inactive'   // Not currently participating

export type CoordinationRole = 
  | 'lead'             // Lead agency for coordination
  | 'support'           // Supporting agency
  | 'primary'           // Primary responder
  | 'secondary'        // Secondary responder
  | 'observer'         // Observing/ready to assist

export type CommunicationType = 
  | 'radio'      // Radio communication
  | 'phone'      // Phone call
  | 'email'      // Email
  | ' briefing' // In-person/videoconference briefing
  | 'direct'     // Direct face-to-face
  | 'status'     // Status update
  | 'request'    // Resource request
  | 'assignment' // Task assignment
  | 'alert'      // Alert/warning

// ============================================================================
// Agency Interface
// ============================================================================

export interface Agency {
  id: string
  agencyCode: string         // Human-readable code (e.g., BV-FARO)
  name: string
  nameShort?: string         // Abbreviated name
  type: AgencyType
  
  // Jurisdiction
  jurisdiction?: {
    city?: string
    district?: string
    region?: string
    coverage?: string
  }
  
  // Contact
  contactInfo: {
    emergencyPhone?: string
    dispatchPhone?: string
    email?: string
    website?: string
    radioChannel?: string
  }
  
  // Location
  headquarters?: {
    address?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  
  // Capabilities
  capabilities: string[]
  specializations: string[]
  
  // Resources
  resourceCount?: number
  vehicleCount?: number
  
  // Status
  status: AgencyStatus
  availableResources?: number
  
  // Integration
  externalIds?: {
    siresp?: string        // SIRESP integration
    anpc?: string          // ANPC (Proteção Civil) ID
  }
  
  // Metadata
  logo?: string
  website?: string
  
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Communication Log
// ============================================================================

export interface CommunicationLog {
  id: string
  incidentId: string
  
  // Communication Details
  communicationType: CommunicationType
  direction: 'incoming' | 'outgoing' | 'internal'
  
  // Parties
  from: {
    agencyId?: string
    agencyName?: string
    personId?: string
    personName?: string
    role?: string
    phone?: string
    radioCallSign?: string
  }
  to: {
    agencyId?: string
    agencyName?: string
    personId?: string
    personName?: string
    role?: string
    phone?: string
    radioCallSign?: string
  }[]
  
  // Content
  subject?: string
  summary: string
  details?: string
  
  // Timing
  loggedAt: Date
  occurredAt?: Date
  
  // Status
  acknowledged: boolean
  acknowledgedAt?: Date
  acknowledgedBy?: string
  
  // Priority
  priority: 'low' | 'normal' | 'high' | 'critical'
  
  // References
  relatedIncidentIds?: string[]
  relatedCommunicationIds?: string[]
  
  // Attachments
  attachments?: {
    type: 'audio' | 'image' | 'document'
    url: string
    name: string
  }[]
  
  // Audit
  loggedBy: string
  loggedByName: string
}

// ============================================================================
// Joint Operations Center (JOC)
// ============================================================================

export interface JointOperationsCenter {
  id: string
  incidentId: string
  
  // Status
  status: 'forming' | 'active' | 'deactivating' | 'closed'
  activatedAt: Date
  closedAt?: Date
  
  // Location
  location?: {
    name?: string
    address?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  
  // Leadership
  incidentCommander: {
    agencyId: string
    agencyName: string
    personId: string
    personName: string
  }
  deputyCommander?: {
    agencyId: string
    agencyName: string
    personId: string
    personName: string
  }
  
  // Participating Agencies
  participatingAgencies: {
    agencyId: string
    agencyName: string
    role: CoordinationRole
    liaisonOfficer?: {
      name: string
      phone?: string
      radioCallSign?: string
    }
    personnelCount?: number
  }[]
  
  // Sections
  sections?: {
    operations: { chief: string; agencies: string[] }
    planning: { chief: string; agencies: string[] }
    logistics: { chief: string; agencies: string[] }
    finance: { chief: string; agencies: string[] }
    information: { chief: string; agencies: string[] }
  }
  
  // Schedules
  briefings?: {
    time: string
    frequency: 'hourly' | '2hour' | '4hour' | 'daily'
    nextBriefingAt?: Date
  }
  
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Mutual Aid Request
// ============================================================================

export interface MutualAidRequest {
  id: string
  requestNumber: string
  
  // Request Details
  requestingIncidentId: string
  requestingAgencyId: string
  requestingAgencyName: string
  
  // Requested Support
  requestedAgencyType?: AgencyType
  requestedAgencyId?: string
  requestedResources: {
    type: string
    quantity: number
    capabilities?: string[]
    estimatedArrival?: Date
  }[]
  
  // Status
  status: 'pending' | 'approved' | 'denied' | 'in_progress' | 'completed' | 'cancelled'
  
  // Timeline
  requestedAt: Date
  respondedAt?: Date
  deployedAt?: Date
  returnedAt?: Date
  
  // Response
  respondingAgencyId?: string
  respondingAgencyName?: string
  responseNotes?: string
  
  // Authorization
  authorizedBy?: string
  authorizationLevel?: string
  
  // Cost
  estimatedCost?: number
  actualCost?: number
  costRecovery?: boolean
  
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Resource Request (for coordination)
// ============================================================================

export interface ResourceRequest {
  id: string
  incidentId: string
  requestNumber: string
  
  // Request Details
  requestType: 'personnel' | 'equipment' | 'vehicle' | 'specialized' | 'other'
  resourceType: string
  quantity: number
  priority: 'routine' | 'urgent' | 'critical'
  
  // Specific Requirements
  requirements?: {
    skills?: string[]
    certifications?: string[]
    equipment?: string[]
    capabilities?: string[]
  }
  
  // Status
  status: 'pending' | 'approved' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'denied'
  
  // Fulfillment
  fulfilledQuantity?: number
  fulfillmentNotes?: string
  
  // Source
  sourceType: 'internal' | 'mutual_aid' | 'contractor' | 'government' | 'other'
  sourceAgencyId?: string
  sourceAgencyName?: string
  
  // Timeline
  requestedAt: Date
  neededBy?: Date
  fulfilledAt?: Date
  
  // Approval
  approvedBy?: string
  approvedAt?: Date
  denialReason?: string
  
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Query Types
// ============================================================================

export interface AgencyFilters {
  type?: AgencyType[]
  status?: AgencyStatus[]
  district?: string
  region?: string
  capabilities?: string[]
}

export interface CommunicationFilters {
  incidentId?: string
  agencyId?: string
  communicationType?: CommunicationType[]
  dateFrom?: Date
  dateTo?: Date
  priority?: ('low' | 'normal' | 'high' | 'critical')[]
}

// ============================================================================
// Real-time Types
// ============================================================================

export type CoordinationEventType = 
  | 'agency.created'
  | 'agency.updated'
  | 'agency.status_changed'
  | 'communication.logged'
  | 'joc.activated'
  | 'joc.updated'
  | 'joc.closed'
  | 'aid_request.created'
  | 'aid_request.updated'
