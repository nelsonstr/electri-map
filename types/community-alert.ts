/**
 * Community Alert Types
 * ER-003: Community Alert System
 * 
 * Types for user-facing community alerts, preferences, and push notifications.
 */

import { z } from 'zod'

// ============================================================================
// Enums (extending existing emergency alert types)
// ============================================================================

/**
 * Simplified severity levels for community alerts
 * Maps to the more detailed AlertSeverity in emergency types
 */
export type CommunityAlertSeverity = 
  | 'informational'  // General information
  | 'warning'        // Potential danger
  | 'critical'       // Immediate action required

/**
 * Alert channel types for community notifications
 */
export type CommunityAlertChannel = 
  | 'push'           // Push notification (web)
  | 'sms'            // SMS (stub for future)
  | 'email'          // Email (stub for future)

/**
 * Sort options for alert list
 */
export type AlertSortOption = 
  | 'distance'       // Sort by distance from user
  | 'severity'       // Sort by severity level
  | 'date'           // Sort by date (newest first)

// ============================================================================
// Core Community Alert Interface
// ============================================================================

/**
 * Community alert for user-facing notifications
 */
export interface CommunityAlert {
  id: string
  alertNumber: string
  
  // Alert content
  title: string
  message: string
  instructions?: string
  
  // Severity and type
  severity: CommunityAlertSeverity
  alertType: string
  
  // Location
  location: {
    latitude: number
    longitude: number
  }
  radius: number  // Alert coverage radius in meters
  placeName?: string
  
  // Timing
  createdAt: Date
  expiresAt: Date
  
  // Distance from user's location (calculated when fetching)
  distance?: number
  
  // Status
  isRead: boolean
  isAcknowledged: boolean
}

// ============================================================================
// User Alert Preferences
// ============================================================================

/**
 * User alert preferences configuration
 */
export interface UserAlertPreferences {
  userId: string
  
  // Location for alert filtering
  location?: {
    latitude: number
    longitude: number
  }
  alertRadius: number  // meters (500m - 10km)
  
  // Severity filters
  enabledSeverities: CommunityAlertSeverity[]
  
  // Channel preferences
  channels: {
    push: boolean
    sms: boolean
    email: boolean
  }
  
  // Quiet hours (local time)
  quietHours?: {
    enabled: boolean
    start: string  // HH:mm format
    end: string    // HH:mm format
    timezone: string
  }
  
  // Critical alert SMS opt-in
  smsOptIn: {
    enabled: boolean
    phoneNumber?: string
    verified: boolean
  }
  
  // Quiet hours for critical alerts
  criticalAlertsOverride: boolean
  
  createdAt: Date
  updatedAt: Date
}

/**
 * Input for creating/updating user alert preferences
 */
export interface UserAlertPreferencesInput {
  location?: {
    latitude: number
    longitude: number
  }
  alertRadius?: number
  enabledSeverities?: CommunityAlertSeverity[]
  channels?: {
    push?: boolean
    sms?: boolean
    email?: boolean
  }
  quietHours?: {
    enabled: boolean
    start: string
    end: string
    timezone?: string
  }
  smsOptIn?: {
    enabled?: boolean
    phoneNumber?: string
  }
  criticalAlertsOverride?: boolean
}

// ============================================================================
// Push Notification Types
// ============================================================================

/**
 * Push notification subscription
 */
export interface PushSubscription {
  id: string
  userId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  browser: string
  isActive: boolean
  createdAt: Date
  lastUsedAt?: Date
}

/**
 * Web Push API payload
 */
export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: {
    alertId?: string
    url?: string
    type?: string
  }
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  requireInteraction?: boolean
  silent?: boolean
}

// ============================================================================
// Query and Filter Types
// ============================================================================

/**
 * Filters for querying community alerts
 */
export interface CommunityAlertFilters {
  severity?: CommunityAlertSeverity[]
  alertType?: string[]
  isRead?: boolean
  dateFrom?: Date
  dateTo?: Date
  activeNow?: boolean
  maxDistance?: number
}

/**
 * Options for sorting alert results
 */
export interface AlertSortOptions {
  field: AlertSortOption
  direction: 'asc' | 'desc'
}

// ============================================================================
// Alert History
// ============================================================================

/**
 * Alert history entry for tracking user interactions
 */
export interface AlertHistoryEntry {
  id: string
  alertId: string
  userId: string
  action: 'received' | 'viewed' | 'dismissed' | 'acknowledged' | 'shared'
  timestamp: Date
  metadata?: Record<string, unknown>
}

// ============================================================================
// Notification Permission Types
// ============================================================================

/**
 * Notification permission status
 */
export type NotificationPermission = 
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported'

/**
 * Result of requesting notification permission
 */
export interface NotificationPermissionResult {
  permission: NotificationPermission
  canRequest: boolean
  reason?: string
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

/**
 * Schema for validating alert radius (500m - 10km)
 */
export const alertRadiusSchema = z.number()
  .min(500, 'Alert radius must be at least 500 meters')
  .max(10000, 'Alert radius cannot exceed 10 kilometers')

/**
 * Schema for validating phone number format
 */
export const phoneNumberSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')

/**
 * Schema for validating quiet hours time (HH:mm)
 */
export const timeSchema = z.string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format')

/**
 * Schema for validating user alert preferences input
 */
export const userAlertPreferencesInputSchema = z.object({
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  alertRadius: alertRadiusSchema.optional(),
  enabledSeverities: z.array(z.enum(['informational', 'warning', 'critical'])).optional(),
  channels: z.object({
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    email: z.boolean().optional(),
  }).optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: timeSchema,
    end: timeSchema,
    timezone: z.string().optional(),
  }).optional(),
  smsOptIn: z.object({
    enabled: z.boolean().optional(),
    phoneNumber: phoneNumberSchema.optional(),
  }).optional(),
  criticalAlertsOverride: z.boolean().optional(),
})

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Alert count by severity for badge display
 */
export interface AlertCountBySeverity {
  informational: number
  warning: number
  critical: number
}

/**
 * Total unread alert count
 */
export interface UnreadAlertCount {
  total: number
  bySeverity: AlertCountBySeverity
}

/**
 * Configuration for VAPID keys (for Web Push)
 */
export interface VapidConfig {
  publicKey: string
  privateKey: string
  subject: string
}
