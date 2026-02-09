import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Target types for alert targeting
 */
export type AlertTargetType =
  | 'geographic'     // By geographic area (radius, polygon)
  | 'administrative' // By administrative boundaries (freguesia, municipio)
  | 'group'          // By user groups
  | 'individual'     // Specific users
  | 'subscription'   // By alert subscriptions
  | 'radius'         // By distance from a point

/**
 * Geographic coordinate
 */
export interface GeoCoordinate {
  latitude: number
  longitude: number
}

/**
 * Circular geographic target
 */
export interface GeoRadiusTarget {
  center: GeoCoordinate
  radiusMeters: number
}

/**
 * Polygon geographic target
 */
export interface GeoPolygonTarget {
  coordinates: GeoCoordinate[]
}

/**
 * Administrative boundary target
 */
export interface AdministrativeBoundaryTarget {
  country?: string
  region?: string
  municipality?: string
  parish?: string  // Freguesia in Portugal
}

/**
 * Alert targeting criteria
 */
export interface AlertTargetCriteria {
  targetType: AlertTargetType
  geographicTarget?: GeoRadiusTarget | GeoPolygonTarget
  administrativeTarget?: AdministrativeBoundaryTarget
  userIds?: string[]
  userGroups?: string[]
  alertCategories?: string[]
  radiusTarget?: GeoRadiusTarget
}

/**
 * Targeted alert input
 */
export interface TargetedAlertInput {
  alertId?: string
  title: string
  body: string
  alertType: 'emergency' | 'weather' | 'fire' | 'flood' | 'power_outage' | 'medical' | 'security' | 'informational'
  priority: 'critical' | 'high' | 'normal' | 'low'
  targets: AlertTargetCriteria
  sourceLocation?: GeoCoordinate
  expiresAt?: string
  actionUrl?: string
  imageUrl?: string
  metadata?: Record<string, unknown>
}

/**
 * User notification preference for targeting
 */
export interface UserTargetingProfile {
  userId: string
  homeLocation?: GeoCoordinate
  workLocation?: GeoCoordinate
  subscribedCategories: string[]
  subscribedAreas: AdministrativeBoundaryTarget[]
  notificationChannels: string[]
  isActive: boolean
}

/**
 * Targeting result
 */
export interface TargetingResult {
  totalUsersTargeted: number
  usersByChannel: Record<string, string[]>
  geographicCoverage?: {
    centerPoint?: GeoCoordinate
    radiusMeters?: number
    municipalities: string[]
    parishes: string[]
  }
  administrativeCoverage?: {
    municipalities: string[]
    parishes: string[]
  }
  alertId: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for geo coordinate
 */
export const geoCoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

/**
 * Schema for geographic radius target
 */
export const geoRadiusTargetSchema = z.object({
  center: geoCoordinateSchema,
  radiusMeters: z.number().positive().max(100000), // Max 100km
})

/**
 * Schema for administrative boundary target
 */
export const administrativeBoundaryTargetSchema = z.object({
  country: z.string().optional(),
  region: z.string().optional(),
  municipality: z.string().optional(),
  parish: z.string().optional(),
})

/**
 * Schema for alert targeting criteria
 */
export const alertTargetCriteriaSchema = z.object({
  targetType: z.enum(['geographic', 'administrative', 'group', 'individual', 'subscription', 'radius']),
  geographicTarget: z.object({
    coordinates: z.array(geoCoordinateSchema).min(3),
  }).optional(),
  administrativeTarget: administrativeBoundaryTargetSchema.optional(),
  userIds: z.array(z.string().uuid()).optional(),
  userGroups: z.array(z.string()).optional(),
  alertCategories: z.array(z.string()).optional(),
  radiusTarget: geoRadiusTargetSchema.optional(),
})

/**
 * Schema for targeted alert input
 */
export const targetedAlertInputSchema = z.object({
  alertId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  alertType: z.enum(['emergency', 'weather', 'fire', 'flood', 'power_outage', 'medical', 'security', 'informational']),
  priority: z.enum(['critical', 'high', 'normal', 'low']),
  targets: alertTargetCriteriaSchema,
  sourceLocation: geoCoordinateSchema.optional(),
  expiresAt: z.string().datetime().optional(),
  actionUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
})

// ============================================================================
// Geospatial Helper Functions
// ============================================================================

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(point1: GeoCoordinate, point2: GeoCoordinate): number {
  const R = 6371000 // Earth's radius in meters
  const lat1 = (point1.latitude * Math.PI) / 180
  const lat2 = (point2.latitude * Math.PI) / 180
  const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180
  const deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Check if a point is within a polygon (Ray casting algorithm)
 */
export function isPointInPolygon(point: GeoCoordinate, polygon: GeoCoordinate[]): boolean {
  let inside = false
  const n = polygon.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].longitude
    const yi = polygon[i].latitude
    const xj = polygon[j].longitude
    const yj = polygon[j].latitude

    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi

    if (intersect) {
      inside = !inside
    }
  }

  return inside
}

/**
 * Check if a point is within a radius
 */
export function isPointInRadius(point: GeoCoordinate, center: GeoCoordinate, radiusMeters: number): boolean {
  return calculateDistance(point, center) <= radiusMeters
}

/**
 * Get bounding box for a radius search
 */
export function getBoundingBoxForRadius(center: GeoCoordinate, radiusMeters: number): {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
} {
  // Approximate degrees per meter
  const latDelta = (radiusMeters / 111320) // meters per degree latitude
  const lonDelta = (radiusMeters / (111320 * Math.cos((center.latitude * Math.PI) / 180)))

  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLon: center.longitude - lonDelta,
    maxLon: center.longitude + lonDelta,
  }
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a targeted alert and identifies affected users
 */
export async function createTargetedAlert(input: TargetedAlertInput): Promise<TargetingResult> {
  const validationResult = targetedAlertInputSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid targeted alert input: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  // Create the alert record
  const { data: alertData, error: alertError } = await supabase
    .from('targeted_alerts')
    .insert({
      title: validatedInput.title,
      body: validatedInput.body,
      alert_type: validatedInput.alertType,
      priority: validatedInput.priority,
      target_type: validatedInput.targets.targetType,
      target_criteria: validatedInput.targets as unknown as Record<string, unknown>,
      source_location: validatedInput.sourceLocation || null,
      expires_at: validatedInput.expiresAt || null,
      action_url: validatedInput.actionUrl || null,
      image_url: validatedInput.imageUrl || null,
      metadata: validatedInput.metadata || null,
      status: 'active',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (alertError) {
    throw new Error(`Failed to create targeted alert: ${alertError.message}`)
  }

  // Find affected users based on targeting criteria
  const affectedUsers = await findAffectedUsers(validatedInput.targets, validatedInput.sourceLocation)

  // Create alert targeting records
  const targetingRecords = affectedUsers.userIds.map(userId => ({
    alert_id: alertData.id,
    user_id: userId,
    created_at: new Date().toISOString(),
  }))

  if (targetingRecords.length > 0) {
    const { error: targetingError } = await supabase
      .from('alert_targeting')
      .insert(targetingRecords)

    if (targetingError) {
      console.error('Error creating alert targeting records:', targetingError)
    }
  }

  return {
    totalUsersTargeted: affectedUsers.userIds.length,
    usersByChannel: affectedUsers.usersByChannel,
    geographicCoverage: affectedUsers.geographicCoverage,
    administrativeCoverage: affectedUsers.administrativeCoverage,
    alertId: alertData.id,
  }
}

/**
 * Finds users affected by targeting criteria
 */
export async function findAffectedUsers(
  targets: AlertTargetCriteria,
  sourceLocation?: GeoCoordinate
): Promise<{
  userIds: string[]
  usersByChannel: Record<string, string[]>
  geographicCoverage?: {
    centerPoint?: GeoCoordinate
    radiusMeters?: number
    municipalities: string[]
    parishes: string[]
  }
  administrativeCoverage?: {
    municipalities: string[]
    parishes: string[]
  }
}> {
  const supabase = createClient()
  let query = supabase
    .from('user_profiles')
    .select(`
      id,
      home_location,
      work_location,
      subscribed_categories,
      subscribed_municipalities,
      subscribed_parishes,
      notification_preferences
    `)
    .eq('notification_preferences->push_enabled', true)
    .eq('is_active', true)

  const affectedUserIds: string[] = []
  const usersByChannel: Record<string, string[]> = {
    push: [],
    email: [],
    sms: [],
    in_app: [],
  }
  const municipalities = new Set<string>()
  const parishes = new Set<string>()

  switch (targets.targetType) {
    case 'geographic':
      if (targets.radiusTarget) {
        const bbox = getBoundingBoxForRadius(
          targets.radiusTarget.center,
          targets.radiusTarget.radiusMeters
        )

        // Get users in bounding box
        const { data: geoUsers } = await supabase
          .from('user_profiles')
          .select('id, home_location, notification_preferences')
          .eq('notification_preferences->push_enabled', true)
          .gte('home_location->latitude', bbox.minLat)
          .lte('home_location->latitude', bbox.maxLat)
          .gte('home_location->longitude', bbox.minLon)
          .lte('home_location->longitude', bbox.maxLon)

        // Filter by exact radius
        if (geoUsers) {
          for (const user of geoUsers) {
            if (user.home_location) {
              const distance = calculateDistance(
                targets.radiusTarget!.center,
                user.home_location
              )
              if (distance <= targets.radiusTarget!.radiusMeters) {
                affectedUserIds.push(user.id)
              }
            }
          }
        }
      } else if (targets.geographicTarget) {
        const polygon = targets.geographicTarget.coordinates
        const { data: polygonUsers } = await supabase
          .from('user_profiles')
          .select('id, home_location, notification_preferences')
          .eq('notification_preferences->push_enabled', true)

        if (polygonUsers) {
          for (const user of polygonUsers) {
            if (user.home_location) {
              if (isPointInPolygon(user.home_location, polygon)) {
                affectedUserIds.push(user.id)
              }
            }
          }
        }
      }
      break

    case 'administrative':
      if (targets.administrativeTarget) {
        if (targets.administrativeTarget.municipality) {
          municipalities.add(targets.administrativeTarget.municipality)
          query = query.eq('subscribed_municipalities', targets.administrativeTarget.municipality)
        }
        if (targets.administrativeTarget.parish) {
          parishes.add(targets.administrativeTarget.parish)
          query = query.eq('subscribed_parishes', targets.administrativeTarget.parish)
        }

        const { data: adminUsers } = await query
        for (const user of adminUsers || []) {
          affectedUserIds.push(user.id)
        }
      }
      break

    case 'individual':
      if (targets.userIds) {
        affectedUserIds.push(...targets.userIds)
      }
      break

    case 'group':
      // Would query user groups table
      if (targets.userGroups) {
        const { data: groupUsers } = await supabase
          .from('user_group_members')
          .select('user_id')
          .in('group_id', targets.userGroups)

        for (const user of groupUsers || []) {
          affectedUserIds.push(user.user_id)
        }
      }
      break

    case 'subscription':
      if (targets.alertCategories) {
        const { data: subscribedUsers } = await supabase
          .from('user_profiles')
          .select('id, subscribed_categories, notification_preferences')
          .eq('notification_preferences->push_enabled', true)

        for (const user of subscribedUsers || []) {
          const hasMatchingSubscription = targets.alertCategories!.some(
            cat => user.subscribed_categories?.includes(cat)
          )
          if (hasMatchingSubscription) {
            affectedUserIds.push(user.id)
          }
        }
      }
      break
  }

  // Get notification preferences for affected users
  if (affectedUserIds.length > 0) {
    const { data: userPrefs } = await supabase
      .from('user_profiles')
      .select('id, notification_preferences')
      .in('id', affectedUserIds)

    for (const user of userPrefs || []) {
      const prefs = user.notification_preferences as Record<string, unknown> || {}
      if (prefs.push_enabled) usersByChannel.push.push(user.id)
      if (prefs.email_enabled) usersByChannel.email.push(user.id)
      if (prefs.sms_enabled) usersByChannel.sms.push(user.id)
      if (prefs.in_app_enabled) usersByChannel.in_app.push(user.id)
    }
  }

  return {
    userIds: [...new Set(affectedUserIds)], // Remove duplicates
    usersByChannel,
    geographicCoverage: targets.radiusTarget ? {
      centerPoint: targets.radiusTarget.center,
      radiusMeters: targets.radiusTarget.radiusMeters,
      municipalities: Array.from(municipalities),
      parishes: Array.from(parishes),
    } : undefined,
    administrativeCoverage: {
      municipalities: Array.from(municipalities),
      parishes: Array.from(parishes),
    },
  }
}

/**
 * Gets active alerts for a user based on their location and subscriptions
 */
export async function getActiveAlertsForUser(
  userId: string,
  userLocation?: GeoCoordinate
): Promise<Array<{
  id: string
  title: string
  body: string
  alertType: string
  priority: string
  distanceMeters?: number
  createdAt: string
  expiresAt?: string
}>> {
  const supabase = createClient()

  // Get user's subscriptions and locations
  const { data: user } = await supabase
    .from('user_profiles')
    .select(`
      home_location,
      work_location,
      subscribed_categories,
      subscribed_municipalities,
      subscribed_parishes
    `)
    .eq('id', userId)
    .single()

  if (!user) {
    return []
  }

  // Build query for active alerts
  let query = supabase
    .from('targeted_alerts')
    .select('*')
    .eq('status', 'active')
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

  // Filter by user's subscribed categories
  if (user.subscribed_categories && user.subscribed_categories.length > 0) {
    query = query.in('target_criteria->alertCategories', user.subscribed_categories)
  }

  const { data: alerts } = await query.order('created_at', { ascending: false })

  const relevantAlerts: Array<{
    id: string
    title: string
    body: string
    alertType: string
    priority: string
    distanceMeters?: number
    createdAt: string
    expiresAt?: string
  }> = []

  for (const alert of alerts || []) {
    const targetCriteria = alert.target_criteria as unknown as AlertTargetCriteria
    
    // Check if user is in target area
    let isRelevant = false
    let distance: number | undefined

    if (targetCriteria.targetType === 'individual' && targetCriteria.userIds) {
      isRelevant = targetCriteria.userIds.includes(userId)
    } else if (targetCriteria.targetType === 'group') {
      // Would check user groups
      isRelevant = false
    } else if (targetCriteria.targetType === 'administrative') {
      if (targetCriteria.administrativeTarget?.municipality) {
        isRelevant = user.subscribed_municipalities?.includes(targetCriteria.administrativeTarget.municipality) || false
      }
      if (targetCriteria.administrativeTarget?.parish) {
        isRelevant = isRelevant || user.subscribed_parishes?.includes(targetCriteria.administrativeTarget.parish)
      }
    } else if (targetCriteria.targetType === 'radius' && targetCriteria.radiusTarget) {
      if (userLocation) {
        distance = calculateDistance(userLocation, targetCriteria.radiusTarget.center)
        isRelevant = distance <= targetCriteria.radiusTarget.radiusMeters
      } else if (user.home_location) {
        distance = calculateDistance(user.home_location, targetCriteria.radiusTarget.center)
        isRelevant = distance <= targetCriteria.radiusTarget.radiusMeters
      }
    } else if (targetCriteria.targetType === 'subscription') {
      if (targetCriteria.alertCategories && user.subscribed_categories) {
        isRelevant = targetCriteria.alertCategories.some(
          cat => user.subscribed_categories?.includes(cat)
        )
      }
    }

    if (isRelevant) {
      relevantAlerts.push({
        id: alert.id,
        title: alert.title,
        body: alert.body,
        alertType: alert.alert_type,
        priority: alert.priority,
        distanceMeters: distance,
        createdAt: alert.created_at,
        expiresAt: alert.expires_at || undefined,
      })
    }
  }

  return relevantAlerts
}

/**
 * Creates a radius-based alert from an incident location
 */
export async function createRadiusAlertFromIncident(
  incidentId: string,
  title: string,
  body: string,
  alertType: 'emergency' | 'weather' | 'fire' | 'flood' | 'power_outage' | 'medical' | 'security' | 'informational',
  priority: 'critical' | 'high' | 'normal' | 'low',
  centerLocation: GeoCoordinate,
  radiusMeters: number,
  expiresAt?: string
): Promise<TargetingResult> {
  return createTargetedAlert({
    title,
    body,
    alertType,
    priority,
    targets: {
      targetType: 'radius',
      radiusTarget: {
        center: centerLocation,
        radiusMeters,
      },
    },
    sourceLocation: centerLocation,
    expiresAt,
    metadata: {
      sourceIncidentId: incidentId,
      radiusMeters,
    },
  })
}

/**
 * Creates an administrative boundary alert
 */
export async function createAdministrativeAlert(
  title: string,
  body: string,
  alertType: 'emergency' | 'weather' | 'fire' | 'flood' | 'power_outage' | 'medical' | 'security' | 'informational',
  priority: 'critical' | 'high' | 'normal' | 'low',
  administrativeTarget: AdministrativeBoundaryTarget,
  expiresAt?: string
): Promise<TargetingResult> {
  return createTargetedAlert({
    title,
    body,
    alertType,
    priority,
    targets: {
      targetType: 'administrative',
      administrativeTarget,
    },
    expiresAt,
  })
}

/**
 * Gets alert statistics for a geographic area
 */
export async function getAlertStatsForArea(
  administrativeTarget: AdministrativeBoundaryTarget
): Promise<{
  totalAlerts: number
  alertsByType: Record<string, number>
  alertsByPriority: Record<string, number>
  recentAlerts: Array<{ id: string; title: string; alertType: string; priority: string; createdAt: string }>
}> {
  const supabase = createClient()

  let query = supabase
    .from('targeted_alerts')
    .select('*')
    .eq('status', 'active')

  if (administrativeTarget.municipality) {
    query = query.eq('target_criteria->administrativeTarget->municipality', administrativeTarget.municipality)
  }
  if (administratoryTarget.parish) {
    query = query.eq('target_criteria->administrativeTarget->parish', administrativeTarget.parish)
  }

  const { data: alerts } = await query.order('created_at', { ascending: false })

  const stats = {
    totalAlerts: alerts?.length || 0,
    alertsByType: {} as Record<string, number>,
    alertsByPriority: {} as Record<string, number>,
    recentAlerts: [] as Array<{ id: string; title: string; alertType: string; priority: string; createdAt: string }>,
  }

  for (const alert of alerts || []) {
    // Count by type
    stats.alertsByType[alert.alert_type] = (stats.alertsByType[alert.alert_type] || 0) + 1
    // Count by priority
    stats.alertsByPriority[alert.priority] = (stats.alertsByPriority[alert.priority] || 0) + 1
  }

  // Recent alerts (last 10)
  stats.recentAlerts = (alerts || []).slice(0, 10).map(a => ({
    id: a.id,
    title: a.title,
    alertType: a.alert_type,
    priority: a.priority,
    createdAt: a.created_at,
  }))

  return stats
}
