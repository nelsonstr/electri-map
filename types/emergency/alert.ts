// Alert Types for Emergency Response System
// Phase 4: Alert System

// ============================================================================
// Enums
// ============================================================================

export type AlertType = 
  | 'warning'      // Potential danger, prepare for action
  | 'watch'        // Possible threat, stay informed
  | 'advisory'     // General safety information
  | 'emergency'    // Immediate action required
  | 'evacuation'   // Leave area immediately
  | 'all_clear'    // Danger has passed

export type AlertSeverity = 
  | 'extreme'      // Life-threatening
  | 'severe'       // Significant threat
  | 'moderate'     // Potential impact
  | 'minor'        // Limited impact
  | 'info'        // Informational only

export type AlertStatus = 
  | 'draft'        // Being prepared
  | 'pending'      // Ready to send, awaiting approval
  | 'sent'         // Successfully delivered
  | 'acknowledged' // Confirmed by recipients
  | 'expired'      // Alert period has passed
  | 'cancelled'     // Cancelled before expiration

export type AlertChannel = 
  | 'sms'          // SMS to mobile phones
  | 'push'         // Push notification
  | 'email'        // Email
  | 'siren'        // Outdoor warning sirens
  | 'tv'           // TV broadcast interrupt
  | 'radio'        // Radio broadcast
  | 'social'       // Social media
  | 'in_app'       // In-app notification

// ============================================================================
// Main Alert Interface
// ============================================================================

export interface EmergencyAlert {
  id: string
  alertNumber: string          // Human-readable ID (e.g., ALT-2026-0001)
  
  // Alert Content
  title: string
  message: string
  instructions?: string        // Specific actions for recipients
  
  // Classification
  alertType: AlertType
  severity: AlertSeverity
  status: AlertStatus
  
  // Related Incident
  incidentId?: string
  incidentType?: string
  
  // Targeting
  targetAreas: {
    type: 'polygon' | 'radius' | 'municipality' | 'district'
    geometry: {
      // For polygon: array of [lon, lat] coordinates
      // For radius: center point + radius in meters
      // For municipality/district: name string
    }
  }[]
  affectedPopulation?: number
  
  // Timing
  issuedAt: Date
  expiresAt: Date
  acknowledgedAt?: Date
  
  // Delivery
  channels: AlertChannel[]
  channelStatus: Record<AlertChannel, {
    status: 'pending' | 'sent' | 'failed'
    sentAt?: Date
    deliveryCount?: number
    failureReason?: string
  }>
  
  // Localization
  language: string
  translations?: Record<string, {
    title: string
    message: string
    instructions?: string
  }>
  
  // Creator
  createdBy: string
  createdByName: string
  approvedBy?: string
  approvedByName?: string
  
  // Geographic Reference
  referenceLocation?: {
    latitude: number
    longitude: number
    placeName?: string
  }
  
  // Metadata
  capIdentifier?: string       // CAP (Common Alerting Protocol) ID
  source?: string              // Source system
  references?: string[]        // IDs of related alerts
  
  // Audit
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateAlertInput {
  title: string
  message: string
  instructions?: string
  alertType: AlertType
  severity: AlertSeverity
  incidentId?: string
  targetAreas: {
    type: 'polygon' | 'radius' | 'municipality' | 'district'
    geometry: Record<string, unknown>
  }[]
  channels?: AlertChannel[]
  language?: string
  translations?: Record<string, {
    title: string
    message: string
    instructions?: string
  }>
  createdBy: string
  createdByName: string
  referenceLocation?: {
    latitude: number
    longitude: number
    placeName?: string
  }
}

export interface UpdateAlertInput {
  id: string
  title?: string
  message?: string
  instructions?: string
  alertType?: AlertType
  severity?: AlertSeverity
  status?: AlertStatus
  channels?: AlertChannel[]
  expiresAt?: Date
  translations?: Record<string, {
    title: string
    message: string
    instructions?: string
  }>
  updatedBy: string
}

// ============================================================================
// Alert Subscription (Citizen Opt-in)
// ============================================================================

export interface CitizenAlertSubscription {
  id: string
  userId: string
  
  // Contact
  phone?: string
  email?: string
  pushToken?: string
  
  // Location-based
  location?: {
    latitude: number
    longitude: number
    radius: number // meters
  }
  address?: {
    municipality?: string
    district?: string
    postalCode?: string
  }
  
  // Preferences
  alertTypes: AlertType[]
  alertSeverities: AlertSeverity[]
  
  // Status
  confirmed: boolean
  confirmedAt?: Date
  unsubscribed: boolean
  unsubscribedAt?: Date
  
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Query Types
// ============================================================================

export interface AlertFilters {
  status?: AlertStatus[]
  alertType?: AlertType[]
  severity?: AlertSeverity[]
  dateFrom?: Date
  dateTo?: Date
  activeNow?: boolean
  incidentId?: string
}

// ============================================================================
// Real-time Types
// ============================================================================

export type AlertEventType = 
  | 'alert.created'
  | 'alert.updated'
  | 'alert.sent'
  | 'alert.cancelled'
  | 'alert.expired'

// ============================================================================
// CAP Protocol Types (Common Alerting Protocol)
// ============================================================================

export interface CAPMessage {
  identifier: string
  sender: string
  sent: string
  status: 'actual' | 'test' | 'exercise'
  msgType: 'alert' | 'update' | 'cancel' | 'ack' | 'error'
  scope: 'public' | 'restricted' | 'private'
  
  info: CAPInfo[]
}

export interface CAPInfo {
  language: string
  category: ('geo' | 'met' | 'safety' | 'security' | 'fire' | 'health' | 'transport' | 'infra' | 'cbrne')[]
  event: string
  urgency: ('immediate' | 'expected' | 'future' | 'past' | 'unknown')[]
  severity: ('extreme' | 'severe' | 'moderate' | 'minor' | 'unknown')[]
  certainty: ('observed' | 'likely' | 'possible' | 'unlikely' | 'unknown')[]
  headline: string
  description: string
  instruction?: string
  
  area: CAPArea[]
  
  expires?: string
}

export interface CAPArea {
  areaDesc: string
  polygon?: string     // Comma-separated lat/lon pairs
  circle?: string      // Center lat/lon and radius
  altitude?: number
  ceiling?: number
}
