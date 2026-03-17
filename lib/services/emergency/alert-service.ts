/**
 * Alert Service
 * ER-003: Community Alert System
 * 
 * Service for managing community alerts, user preferences, and alert history.
 */

import { createClient } from '@/lib/supabase/client'
import type {
  CommunityAlert,
  CommunityAlertFilters,
  UserAlertPreferences,
  UserAlertPreferencesInput,
  AlertSortOptions,
  AlertCountBySeverity,
  UnreadAlertCount,
  CommunityAlertSeverity,
} from '@/types/community-alert'
import { userAlertPreferencesInputSchema } from '@/types/community-alert'
import { z } from 'zod'

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ALERT_RADIUS = 5000 // 5km default
const MIN_ALERT_RADIUS = 500 // 500m minimum
const MAX_ALERT_RADIUS = 10000 // 10km maximum

// Severity order for sorting (most severe first)
const SEVERITY_ORDER: Record<CommunityAlertSeverity, number> = {
  critical: 0,
  warning: 1,
  informational: 2,
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Transform database row to CommunityAlert
 */
function transformToCommunityAlert(row: Record<string, unknown>): CommunityAlert {
  return {
    id: row.id as string,
    alertNumber: row.alert_number as string,
    title: row.title as string,
    message: row.message as string,
    instructions: row.instructions as string | undefined,
    severity: row.severity as CommunityAlertSeverity,
    alertType: row.alert_type as string,
    location: {
      latitude: (row.location as { latitude: number }).latitude,
      longitude: (row.location as { longitude: number }).longitude,
    },
    radius: row.radius as number,
    placeName: row.place_name as string | undefined,
    createdAt: new Date(row.created_at as string),
    expiresAt: new Date(row.expires_at as string),
    isRead: (row.is_read as boolean) || false,
    isAcknowledged: (row.is_acknowledged as boolean) || false,
  }
}

/**
 * Transform database row to UserAlertPreferences
 */
function transformToUserPreferences(
  row: Record<string, unknown>
): UserAlertPreferences {
  return {
    userId: row.user_id as string,
    location: row.location
      ? {
          latitude: (row.location as { latitude: number }).latitude,
          longitude: (row.location as { longitude: number }).longitude,
        }
      : undefined,
    alertRadius: (row.alert_radius as number) || DEFAULT_ALERT_RADIUS,
    enabledSeverities: (row.enabled_severities as CommunityAlertSeverity[]) || [
      'informational',
      'warning',
      'critical',
    ],
    channels: {
      push: (row.channel_push as boolean) ?? true,
      sms: (row.channel_sms as boolean) ?? false,
      email: (row.channel_email as boolean) ?? false,
    },
    quietHours: row.quiet_hours
      ? (row.quiet_hours as {
          enabled: boolean
          start: string
          end: string
          timezone: string
        })
      : undefined,
    smsOptIn: {
      enabled: (row.sms_opt_in_enabled as boolean) ?? false,
      phoneNumber: row.sms_opt_in_phone as string | undefined,
      verified: (row.sms_opt_in_verified as boolean) ?? false,
    },
    criticalAlertsOverride: (row.critical_alerts_override as boolean) ?? false,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

// ============================================================================
// Alert Service Class
// ============================================================================

export class AlertService {
  private static instance: AlertService | null = null

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService()
    }
    return AlertService.instance
  }

  private _supabase: ReturnType<typeof createClient> | null = null

  private get supabase(): ReturnType<typeof createClient> {
    if (!this._supabase) {
      this._supabase = createClient()
    }
    return this._supabase!
  }

  // ========================================================================
  // Public Alert Operations
  // ========================================================================

  /**
   * Get all active community alerts within user's alert radius
   */
  async getNearbyAlerts(
    latitude: number,
    longitude: number,
    radius: number = DEFAULT_ALERT_RADIUS,
    filters?: CommunityAlertFilters,
    sortOptions?: AlertSortOptions
  ): Promise<CommunityAlert[]> {
    // DEBUG: Log environment check
    // console.log('[DEBUG] getNearbyAlerts - Environment check: supabaseUrl=' + 
    //   (process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING') + ', supabaseAnonKey=' + 
    //   (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING'))

    // DEBUG: Log Supabase client status
    // console.log('[DEBUG] getNearbyAlerts - Supabase client exists: ' + !!this.supabase)

    // Ensure radius is within bounds
    const boundedRadius = Math.max(MIN_ALERT_RADIUS, Math.min(MAX_ALERT_RADIUS, radius))

    // DEBUG: Log input parameters
    // console.log('[DEBUG] getNearbyAlerts - Inputs: lat=' + latitude + ', lng=' + longitude + ', radius=' + boundedRadius + ', hasFilters=' + !!filters)

    // Build query with PostGIS for spatial filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.supabase
      .from('community_alerts')
      .select('*')
      .eq('is_active', true)
      .lte('created_at', new Date().toISOString())
      .gte('expires_at', new Date().toISOString())

    // DEBUG: Log initial query state
    // console.log('[DEBUG] getNearbyAlerts - Initial query built: ' + (query ? 'success' : 'NULL'))

    // Apply severity filter if provided
    try {
      if (filters?.severity && filters.severity.length > 0) {
        query = query.in('severity', filters.severity)
      }

      // Apply alert type filter if provided
      // DEBUG: Log before alert type filter
      // console.log('[DEBUG] getNearbyAlerts - Before alertType filter: query exists=' + !!query)
      if (filters?.alertType && filters.alertType.length > 0) {
        // console.log('[DEBUG] getNearbyAlerts - Applying alertType filter: ' + JSON.stringify(filters.alertType))
        query = query.in('alert_type', filters.alertType)
        // console.log('[DEBUG] getNearbyAlerts - After alertType filter: query exists=' + !!query)
      }

      // Apply read status filter if provided
      if (filters?.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead)
      }

      // Apply date filters
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString())
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString())
      }
    } catch (filterError) {
      // console.log('[DEBUG] getNearbyAlerts - Filter error: ' + (filterError as Error).message)
      console.error('Filter application error:', filterError)
      throw new Error('Failed to apply filters: ' + (filterError as Error).message)
    }

    // DEBUG: Log query before execution
    // console.log('[DEBUG] getNearbyAlerts - Before query execution')

    // Declare data outside try block so it's accessible later
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] | null = null
    
    try {
      const { data: queryData, error } = await query
      data = queryData

      // DEBUG: Log query result
      // console.log('[DEBUG] getNearbyAlerts - Query result: error=' + (error ? error.message : 'null') + ', data.length=' + (data ? data.length : 0))

      if (error) {
        console.error('Error fetching nearby alerts (full error):', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Failed to fetch nearby alerts: ${error.message}`)
      }
    } catch (queryError) {
      // console.log('[DEBUG] getNearbyAlerts - Query execution error: ' + (queryError as Error).message)
      throw new Error(`Failed to fetch nearby alerts: ${(queryError as Error).message}`)
    }

    // console.log('[DEBUG] getNearbyAlerts - Alert fetching result: ' + (data?.length || 0) + ' alerts found')

    if (!data || data.length === 0) {
      // console.log('[DEBUG] getNearbyAlerts - No data returned')
      return []
    }

    // Filter and sort alerts on client side for PostGIS alternatives
    let alerts: CommunityAlert[] = data
      .map((row) => {
        const alert = transformToCommunityAlert(row)
        // Calculate distance
        alert.distance = calculateDistance(
          latitude,
          longitude,
          alert.location.latitude,
          alert.location.longitude
        )
        return alert
      })
      .filter((alert) => alert.distance <= boundedRadius)

    // Apply max distance filter if specified
    if (filters?.maxDistance) {
      alerts = alerts.filter((alert) => alert.distance! <= filters.maxDistance!)
    }

    // Sort results
    if (sortOptions) {
      alerts.sort((a, b) => {
        switch (sortOptions.field) {
          case 'distance':
            return sortOptions.direction === 'asc'
              ? (a.distance || 0) - (b.distance || 0)
              : (b.distance || 0) - (a.distance || 0)
          case 'severity':
            return sortOptions.direction === 'asc'
              ? SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
              : SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]
          case 'date':
            return sortOptions.direction === 'asc'
              ? a.createdAt.getTime() - b.createdAt.getTime()
              : b.createdAt.getTime() - a.createdAt.getTime()
          default:
            return 0
        }
      })
    } else {
      // Default sort by distance
      alerts.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    return alerts
  }

  /**
   * Get a single alert by ID
   */
  async getAlertById(alertId: string): Promise<CommunityAlert | null> {
    const { data, error } = await this.supabase
      .from('community_alerts')
      .select('*')
      .eq('id', alertId)
      .single()

    if (error) {
      console.error('Error fetching alert:', error)
      throw new Error('Failed to fetch alert')
    }

    if (!data) {
      return null
    }

    return transformToCommunityAlert(data)
  }

  /**
   * Get unread alert count by severity
   */
  async getUnreadAlertCount(
    latitude: number,
    longitude: number,
    radius: number = DEFAULT_ALERT_RADIUS
  ): Promise<UnreadAlertCount> {
    const alerts = await this.getNearbyAlerts(latitude, longitude, radius, {
      isRead: false,
    })

    const bySeverity: AlertCountBySeverity = {
      informational: 0,
      warning: 0,
      critical: 0,
    }

    for (const alert of alerts) {
      bySeverity[alert.severity]++
    }

    return {
      total: alerts.length,
      bySeverity,
    }
  }

  /**
   * Mark an alert as read
   */
  async markAlertAsRead(alertId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_alert_history')
      .upsert(
        {
          alert_id: alertId,
          user_id: userId,
          action: 'viewed',
          timestamp: new Date().toISOString(),
        },
        { onConflict: 'alert_id,user_id,action' }
      )

    if (error) {
      console.error('Error marking alert as read:', error)
      throw new Error('Failed to mark alert as read')
    }

    // Update the alert's is_read status for this user
    const { error: updateError } = await this.supabase
      .from('user_alert_reads')
      .upsert(
        {
          alert_id: alertId,
          user_id: userId,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'alert_id,user_id' }
      )

    if (updateError) {
      console.error('Error updating user alert read status:', updateError)
      throw new Error('Failed to update alert read status')
    }
  }

  /**
   * Acknowledge a critical alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_alert_history')
      .upsert(
        {
          alert_id: alertId,
          user_id: userId,
          action: 'acknowledged',
          timestamp: new Date().toISOString(),
        },
        { onConflict: 'alert_id,user_id,action' }
      )

    if (error) {
      console.error('Error acknowledging alert:', error)
      throw new Error('Failed to acknowledge alert')
    }
  }

  /**
   * Get alert history for a user
   */
  async getAlertHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ alerts: CommunityAlert[]; total: number }> {
    // First get the history entries
    const { data: historyData, error: historyError } = await this.supabase
      .from('user_alert_history')
      .select('alert_id, action, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (historyError) {
      console.error('Error fetching alert history:', historyError)
      throw new Error('Failed to fetch alert history')
    }

    if (!historyData || historyData.length === 0) {
      return { alerts: [], total: 0 }
    }

    // Get unique alert IDs
    const alertIds = [...new Set(historyData.map((entry) => entry.alert_id))]

    // Fetch the alert details
    const { data: alertsData, error: alertsError } = await this.supabase
      .from('community_alerts')
      .select('*')
      .in('id', alertIds)
      .order('created_at', { ascending: false })

    if (alertsError) {
      console.error('Error fetching alerts for history:', alertsError)
      throw new Error('Failed to fetch alerts for history')
    }

    const alerts = alertsData?.map((row) => transformToCommunityAlert(row)) || []

    // Get total count
    const { count } = await this.supabase
      .from('user_alert_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return {
      alerts,
      total: count || 0,
    }
  }

  // ========================================================================
  // User Preferences Operations
  // ========================================================================

  /**
   * Get user alert preferences
   */
  async getUserPreferences(userId: string): Promise<UserAlertPreferences> {
    const { data, error } = await this.supabase
      .from('user_alert_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, return default
        return this.getDefaultPreferences(userId)
      }
      console.error('Error fetching user preferences:', error)
      throw new Error('Failed to fetch user preferences')
    }

    return transformToUserPreferences(data)
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(userId: string): UserAlertPreferences {
    return {
      userId,
      alertRadius: DEFAULT_ALERT_RADIUS,
      enabledSeverities: ['informational', 'warning', 'critical'],
      channels: {
        push: true,
        sms: false,
        email: false,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
        timezone: 'UTC',
      },
      smsOptIn: {
        enabled: false,
        verified: false,
      },
      criticalAlertsOverride: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  /**
   * Update user alert preferences
   */
  async updateUserPreferences(
    userId: string,
    input: UserAlertPreferencesInput
  ): Promise<UserAlertPreferences> {
    // Validate input
    const validationResult = userAlertPreferencesInputSchema.safeParse(input)
    if (!validationResult.success) {
      throw new Error(
        `Invalid preferences: ${validationResult.error.errors.map((e) => e.message).join(', ')}`
      )
    }

    // Get current preferences to merge
    const currentPrefs = await this.getUserPreferences(userId)

    // Merge updates
    const updatedPrefs: Partial<UserAlertPreferences> = {
      ...currentPrefs,
      updatedAt: new Date(),
    }

    if (input.location) {
      updatedPrefs.location = input.location
    }
    if (input.alertRadius !== undefined) {
      updatedPrefs.alertRadius = Math.max(
        MIN_ALERT_RADIUS,
        Math.min(MAX_ALERT_RADIUS, input.alertRadius)
      )
    }
    if (input.enabledSeverities) {
      updatedPrefs.enabledSeverities = input.enabledSeverities
    }
    if (input.channels) {
      updatedPrefs.channels = { ...updatedPrefs.channels, ...input.channels }
    }
    if (input.quietHours) {
      updatedPrefs.quietHours = input.quietHours
    }
    if (input.smsOptIn) {
      updatedPrefs.smsOptIn = {
        ...updatedPrefs.smsOptIn,
        ...input.smsOptIn,
      }
    }
    if (input.criticalAlertsOverride !== undefined) {
      updatedPrefs.criticalAlertsOverride = input.criticalAlertsOverride
    }

    // Save to database
    const { data, error } = await this.supabase
      .from('user_alert_preferences')
      .upsert({
        user_id: userId,
        location: updatedPrefs.location,
        alert_radius: updatedPrefs.alertRadius,
        enabled_severities: updatedPrefs.enabledSeverities,
        channel_push: updatedPrefs.channels.push,
        channel_sms: updatedPrefs.channels.sms,
        channel_email: updatedPrefs.channels.email,
        quiet_hours: updatedPrefs.quietHours,
        sms_opt_in_enabled: updatedPrefs.smsOptIn.enabled,
        sms_opt_in_phone: updatedPrefs.smsOptIn.phoneNumber,
        sms_opt_in_verified: updatedPrefs.smsOptIn.verified,
        critical_alerts_override: updatedPrefs.criticalAlertsOverride,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      throw new Error('Failed to update user preferences')
    }

    return transformToUserPreferences(data)
  }

  /**
   * Check if within quiet hours
   */
  async isWithinQuietHours(userId: string): Promise<boolean> {
    const prefs = await this.getUserPreferences(userId)

    if (!prefs.quietHours?.enabled) {
      return false
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const { start, end } = prefs.quietHours

    if (start <= end) {
      // Normal case: quiet hours within same day
      return currentTime >= start && currentTime <= end
    } else {
      // Overnight: quiet hours span midnight
      return currentTime >= start || currentTime <= end
    }
  }

  /**
   * Check if should send notification for alert
   */
  async shouldNotifyForAlert(
    userId: string,
    severity: CommunityAlertSeverity
  ): Promise<boolean> {
    const prefs = await this.getUserPreferences(userId)

    // Check if severity is enabled
    if (!prefs.enabledSeverities.includes(severity)) {
      return false
    }

    // Critical alerts always notify (unless user explicitly disabled)
    if (severity === 'critical' && prefs.criticalAlertsOverride) {
      return true
    }

    // Check quiet hours for non-critical alerts
    if (prefs.quietHours?.enabled) {
      const withinQuietHours = await this.isWithinQuietHours(userId)
      if (withinQuietHours) {
        return false
      }
    }

    return true
  }

  // ========================================================================
  // SMS Stub Operations (for future Twilio integration)
  // ========================================================================

  /**
   * Send SMS notification stub
   * TODO: Implement actual Twilio integration
   */
  async sendSMSNotification(
    phoneNumber: string,
    alert: CommunityAlert
  ): Promise<{ success: boolean; messageId?: string }> {
    // Stub implementation - would use Twilio in production
    console.log(`[SMS Stub] Sending SMS to ${phoneNumber}: ${alert.title}`)

    // Simulate SMS sending
    return {
      success: true,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  /**
   * Verify phone number for SMS
   * TODO: Implement actual verification flow
   */
  async verifyPhoneNumber(
    userId: string,
    phoneNumber: string,
    code: string
  ): Promise<boolean> {
    // Stub implementation
    console.log(`[SMS Stub] Verifying phone ${phoneNumber} with code ${code}`)

    // Simulate verification
    return code === '123456' // Demo code
  }

  /**
   * Send SMS verification code
   */
  async sendVerificationCode(phoneNumber: string): Promise<boolean> {
    // Stub implementation
    console.log(`[SMS Stub] Sending verification code to ${phoneNumber}`)
    return true
  }
}

// Note: Do not instantiate AlertService at module level as it uses client-side Supabase
// Create instances in components/hooks where needed
