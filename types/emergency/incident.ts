// Emergency Incident Types for Electri-Map Emergency Response System
// Phase 1: Core Infrastructure

// ============================================================================
// Enums
// ============================================================================

export type IncidentSeverity = 
  | 'critical'  // Immediate threat to life, requires all available resources
  | 'major'     // Significant threat, requires immediate response
  | 'moderate'  // Localized emergency, requires response
  | 'minor'     // Limited impact, routine response
  | 'low'       // Minimal impact, scheduled response

export type IncidentStatus = 
  | 'detected'      // Initial detection, not yet verified
  | 'investigating'  // Being assessed by first responders
  | 'responding'     // Active response underway
  | 'contained'      // Partially under control
  | 'resolved'       // Emergency has been resolved
  | 'closed'         // Post-incident review complete

export type IncidentType = 
  | 'fire'                    // Structural or wildfire
  | 'medical'                 // Medical emergency
  | 'flood'                   // Flooding
  | 'earthquake'              // Seismic event
  | 'landslide'               // Landslide or rockslide
  | 'storm'                   // Severe weather
  | 'hazmat'                  // Hazardous materials
  | 'search_and_rescue'       // Missing person or rescue
  | 'transport_accident'      // Vehicle accident
  | 'civil       // Public_disturbance' order incident
  | 'infrastructure_failure'  // Utility or structural failure
  | 'other'                   // Other emergency type

export type IncidentPriority = 1 | 2 | 3 | 4 | 5

// ============================================================================
// Base Types
// ============================================================================

export interface Coordinates {
  latitude: number
  longitude: number
  altitude?: number
  accuracy?: number
}

export interface IncidentLocation {
  address?: string
  city?: string
  municipality?: string
  district?: string
  postalCode?: string
  country: string
  coordinates: Coordinates
  landmark?: string          // Reference point for responders
  accessInstructions?: string // How to access the location
}

export interface TimelineEvent {
  id: string
  timestamp: Date
  status: IncidentStatus
  description: string
  actorId: string
  actorName: string
  actorRole: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Main Incident Interface
// ============================================================================

export interface EmergencyIncident {
  id: string
  incidentNumber: string     // Human-readable ID (e.g., INC-2026-0001)
  
  // Core Information
  title: string
  description: string
  incidentType: IncidentType
  severity: IncidentSeverity
  status: IncidentStatus
  priority: IncidentPriority
  
  // Location
  location: IncidentLocation
  
  // Timeline
  detectedAt: Date
  acknowledgedAt?: Date
  firstResponseAt?: Date
  containedAt?: Date
  resolvedAt?: Date
  closedAt?: Date
  
  // Personnel
  incidentCommanderId?: string
  incidentCommanderName?: string
  primaryResponderId?: string
  reportingUserId: string
  reportingUserName: string
  
  // Related Information
  affectedPeople?: number     // Number of people affected
  injuries?: number
  fatalities?: number
  evacuated?: number         // Number evacuated
  
  // Damage Assessment
  damageEstimate?: number    // Currency value
  infrastructureAffected?: string[]
  
  // Resources
  resourcesAllocated: number
  resourcesRequired: number
  
  // Multi-Agency
  agenciesInvolved: string[]
  coordinationLevel?: 'local' | 'regional' | 'national'
  
  // External Integration
  externalIncidentId?: string // ID from external systems (112, etc.)
  weatherAlerts?: string[]     // Related weather alerts
  
  // Media
  mediaUrls?: string[]
  
  // Tags and Categorization
  tags: string[]
  
  // Audit
  createdAt: Date
  updatedAt: Date
  lastUpdatedBy: string
}

// ============================================================================
// Input Types (for creating/updating incidents)
// ============================================================================

export interface CreateIncidentInput {
  title: string
  description: string
  incidentType: IncidentType
  severity: IncidentSeverity
  location: IncidentLocation
  affectedPeople?: number
  reportingUserId: string
  reportingUserName: string
  externalIncidentId?: string
  tags?: string[]
}

export interface UpdateIncidentInput {
  id: string
  title?: string
  description?: string
  incidentType?: IncidentType
  severity?: IncidentSeverity
  status?: IncidentStatus
  location?: Partial<IncidentLocation>
  affectedPeople?: number
  injuries?: number
  fatalities?: number
  evacuated?: number
  damageEstimate?: number
  infrastructureAffected?: string[]
  incidentCommanderId?: string
  incidentCommanderName?: string
  primaryResponderId?: string
  tags?: string[]
  lastUpdatedBy: string
}

// ============================================================================
// Query/Filter Types
// ============================================================================

export interface IncidentFilters {
  status?: IncidentStatus[]
  severity?: IncidentSeverity[]
  incidentType?: IncidentType[]
  dateFrom?: Date
  dateTo?: Date
  assignedTo?: string
  agenciesInvolved?: string[]
  boundingBox?: {
    north: number
    south: number
    east: number
    west: number
  }
  search?: string
}

export interface IncidentStats {
  total: number
  byStatus: Record<IncidentStatus, number>
  bySeverity: Record<IncidentSeverity, number>
  byType: Record<IncidentType, number>
  averageResponseTime?: number
  averageResolutionTime?: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface IncidentListResponse {
  incidents: EmergencyIncident[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface IncidentDetailResponse {
  incident: EmergencyIncident
  timeline: TimelineEvent[]
  resources: IncidentResource[]
  agencies: IncidentAgency[]
}

export interface IncidentActionResponse {
  success: boolean
  incident: EmergencyIncident
  message?: string
}

// ============================================================================
// Related Types (for detail view)
// ============================================================================

export interface IncidentResource {
  resourceId: string
  resourceName: string
  resourceType: 'personnel' | 'equipment' | 'vehicle'
  status: 'en_route' | 'onsite' | 'returning' | 'available'
  assignedAt: Date
  estimatedArrival?: Date
}

export interface IncidentAgency {
  agencyId: string
  agencyName: string
  agencyCode: string
  coordinationStatus: 'pending' | 'acknowledged' | 'responding' | 'completed'
  leadContact?: string
  resourcesDeployed?: number
  notes?: string
}

// ============================================================================
// Real-time Subscription Types
// ============================================================================

export type IncidentEventType = 
  | 'incident.created'
  | 'incident.updated'
  | 'incident.status_changed'
  | 'incident.location_updated'
  | 'incident.resource_assigned'
  | 'incident.timeline_added'
  | 'incident.deleted'

export interface IncidentSubscriptionEvent {
  type: IncidentEventType
  incident: EmergencyIncident
  timestamp: Date
  actorId: string
  actorName: string
}

// ============================================================================
// Validation Schemas (Zod)
// ============================================================================

import { z } from 'zod'

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  accuracy: z.number().positive().optional(),
})

export const incidentLocationSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  municipality: z.string().optional(),
  district: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1),
  coordinates: coordinatesSchema,
  landmark: z.string().optional(),
  accessInstructions: z.string().optional(),
})

export const createIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  incidentType: z.enum([
    'fire', 'medical', 'flood', 'earthquake', 'landslide',
    'storm', 'hazmat', 'search_and_rescue', 'transport_accident',
    'civil_disturbance', 'infrastructure_failure', 'other',
  ]),
  severity: z.enum(['critical', 'major', 'moderate', 'minor', 'low']),
  location: incidentLocationSchema,
  affectedPeople: z.number().nonnegative().optional(),
  reportingUserId: z.string().uuid(),
  reportingUserName: z.string().min(1),
  externalIncidentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const updateIncidentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  incidentType: z.enum([
    'fire', 'medical', 'flood', 'earthquake', 'landslide',
    'storm', 'hazmat', 'search_and_rescue', 'transport_accident',
    'civil_disturbance', 'infrastructure_failure', 'other',
  ]).optional(),
  severity: z.enum(['critical', 'major', 'moderate', 'minor', 'low']).optional(),
  status: z.enum(['detected', 'investigating', 'responding', 'contained', 'resolved', 'closed']).optional(),
  location: incidentLocationSchema.partial().optional(),
  affectedPeople: z.number().nonnegative().optional(),
  injuries: z.number().nonnegative().optional(),
  fatalities: z.number().nonnegative().optional(),
  evacuated: z.number().nonnegative().optional(),
  damageEstimate: z.number().nonnegative().optional(),
  infrastructureAffected: z.array(z.string()).optional(),
  incidentCommanderId: z.string().uuid().optional(),
  incidentCommanderName: z.string().optional(),
  primaryResponderId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  lastUpdatedBy: z.string().uuid(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getIncidentPriority(severity: IncidentSeverity): IncidentPriority {
  const mapping: Record<IncidentSeverity, IncidentPriority> = {
    critical: 1,
    major: 2,
    moderate: 3,
    minor: 4,
    low: 5,
  }
  return mapping[severity]
}

export function getSeverityColor(severity: IncidentSeverity): string {
  const colors: Record<IncidentSeverity, string> = {
    critical: '#dc2626',  // Red
    major: '#ea580c',     // Orange
    moderate: '#ca8a04',  // Yellow
    minor: '#16a34a',     // Green
    low: '#0891b2',       // Cyan
  }
  return colors[severity]
}

export function getStatusColor(status: IncidentStatus): string {
  const colors: Record<IncidentStatus, string> = {
    detected: '#6b7280',      // Gray
    investigating: '#8b5cf6', // Purple
    responding: '#f59e0b',    // Amber
    contained: '#3b82f6',     // Blue
    resolved: '#10b981',      // Emerald
    closed: '#6b7280',        // Gray
  }
  return colors[status]
}

export function formatIncidentNumber(number: number, year: number = new Date().getFullYear()): string {
  return `INC-${year}-${number.toString().padStart(4, '0')}`
}
