/**
 * Push Notification Service
 * ER-003: Community Alert System
 * 
 * Service for managing web push notifications using the Web Push API.
 */

import { createClient } from '@/lib/supabase/client'
import type {
  PushSubscription,
  PushNotificationPayload,
  NotificationPermission,
  NotificationPermissionResult,
  CommunityAlert,
} from '@/types/community-alert'

// ============================================================================
// VAPID Configuration
// ============================================================================

// These should be environment variables in production
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:alerts@electri-map.com'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Check if service worker is supported
 */
function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator
}

/**
 * Check if push manager is supported
 */
function isPushManagerSupported(): boolean {
  return typeof window !== 'undefined' && 'PushManager' in window
}

// ============================================================================
// Push Notification Service Class
// ============================================================================

export class PushNotificationService {
  private _supabase: ReturnType<typeof createClient> | null = null
  private vapidKey: Uint8Array

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient()
    }
    return this._supabase
  }

  constructor() {
    this.vapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  }

  // ========================================================================
  // Permission Management
  // ========================================================================

  /**
   * Get current notification permission status
   */
  async getPermissionStatus(): Promise<NotificationPermissionResult> {
    if (typeof window === 'undefined') {
      return {
        permission: 'unsupported',
        canRequest: false,
        reason: 'Notifications not available on server',
      }
    }

    if (!('Notification' in window)) {
      return {
        permission: 'unsupported',
        canRequest: false,
        reason: 'Browser does not support notifications',
      }
    }

    const permission = Notification.permission as NotificationPermission

    return {
      permission,
      canRequest: permission === 'default',
      reason:
        permission === 'granted'
          ? 'Notifications are enabled'
          : permission === 'denied'
            ? 'Notifications are blocked'
            : 'User can be prompted',
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported'
    }

    try {
      const permission = await Notification.requestPermission()
      return permission as NotificationPermission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  /**
   * Open system notification settings
   * Note: This is browser-specific and may not work in all browsers
   */
  async openNotificationSettings(): Promise<void> {
    if (typeof window === 'undefined') return

    // Try to open browser notification settings
    if ('Notification' in window && 'requestPermission' in Notification) {
      // Some browsers support this, most don't
      // This is a best-effort approach
      console.info('Notification settings: Please enable notifications in your browser settings')
    }
  }

  // ========================================================================
  // Service Worker Registration
  // ========================================================================

  /**
   * Register the push notification service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!isServiceWorkerSupported()) {
      console.warn('Service worker is not supported')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register(
        '/sw/push-notification.js'
      )
      console.log('Service worker registered:', registration)
      return registration
    } catch (error) {
      console.error('Service worker registration failed:', error)
      return null
    }
  }

  /**
   * Get existing service worker registration
   */
  async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!isServiceWorkerSupported()) {
      return null
    }

    try {
      const registration =
        await navigator.serviceWorker.getRegistration('/sw/push-notification.js')
      return registration || null
    } catch (error) {
      console.error('Error getting service worker registration:', error)
      return null
    }
  }

  // ========================================================================
  // Subscription Management
  // ========================================================================

  /**
   * Subscribe user to push notifications
   */
  async subscribe(
    userId: string
  ): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
    // Check if supported
    if (!isServiceWorkerSupported() || !isPushManagerSupported()) {
      return {
        success: false,
        error: 'Push notifications are not supported in this browser',
      }
    }

    // Request permission first
    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      return {
        success: false,
        error: `Notification permission ${permission}`,
      }
    }

    try {
      // Register service worker
      const registration = await this.registerServiceWorker()
      if (!registration) {
        return {
          success: false,
          error: 'Failed to register service worker',
        }
      }

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        // Subscribe to push
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.vapidKey,
        })
      }

      // Get browser info
      const userAgent = navigator.userAgent
      const browser = this.detectBrowser(userAgent)

      // Save subscription to database
      const subscriptionData: Omit<PushSubscription, 'id'> = {
        userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.toJSON().keys?.p256dh || '',
          auth: subscription.toJSON().keys?.auth || '',
        },
        browser,
        isActive: true,
        createdAt: new Date(),
      }

      const { data, error } = await this.supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: userId,
            endpoint: subscriptionData.endpoint,
            key_p256dh: subscriptionData.keys.p256dh,
            key_auth: subscriptionData.keys.auth,
            browser: subscriptionData.browser,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,endpoint' }
        )
        .select()
        .single()

      if (error) {
        console.error('Error saving push subscription:', error)
        return {
          success: false,
          error: 'Failed to save subscription',
        }
      }

      return {
        success: true,
        subscription: {
          id: data.id,
          ...subscriptionData,
        },
      }
    } catch (error) {
      console.error('Error subscribing to push:', error)
      return {
        success: false,
        error: 'Failed to subscribe to push notifications',
      }
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribe(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const registration = await this.getServiceWorkerRegistration()
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
        }
      }

      // Update database
      const { error } = await this.supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', userId)

      if (error) {
        console.error('Error unsubscribing:', error)
        return { success: false, error: 'Failed to unsubscribe' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error unsubscribing:', error)
      return { success: false, error: 'Failed to unsubscribe' }
    }
  }

  /**
   * Check if user is subscribed to push notifications
   */
  async isSubscribed(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('push_subscriptions')
        .select('is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.error('Error checking subscription:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Error checking subscription:', error)
      return false
    }
  }

  /**
   * Get all active subscriptions for a user
   */
  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    try {
      const { data, error } = await this.supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching subscriptions:', error)
        return []
      }

      return (
        data?.map((row) => ({
          id: row.id,
          userId: row.user_id,
          endpoint: row.endpoint,
          keys: {
            p256dh: row.key_p256dh,
            auth: row.key_auth,
          },
          browser: row.browser,
          isActive: row.is_active,
          createdAt: new Date(row.created_at),
        })) || []
      )
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      return []
    }
  }

  // ========================================================================
  // Notification Sending
  // ========================================================================

  /**
   * Send a local notification (browser notification API)
   */
  async sendLocalNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission !== 'granted') {
      console.warn('Cannot send notification: permission not granted')
      return false
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/notification-icon.png',
        badge: payload.badge || '/icons/badge-icon.png',
        tag: payload.tag || payload.data?.alertId,
        data: payload.data,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
      })

      // Add action handlers if provided
      if (payload.actions) {
        notification.onclick = (event) => {
          const action = (event.target as HTMLElement)?.closest('button')?.value
          if (action && payload.data?.url) {
            window.location.href = payload.data.url
          }
          notification.close()
        }
      }

      return true
    } catch (error) {
      console.error('Error sending local notification:', error)
      return false
    }
  }

  /**
   * Convert CommunityAlert to PushNotificationPayload
   */
  alertToPayload(alert: CommunityAlert): PushNotificationPayload {
    const severityConfig = {
      informational: { icon: '/icons/alert-info.png', requireInteraction: false },
      warning: { icon: '/icons/alert-warning.png', requireInteraction: false },
      critical: { icon: '/icons/alert-critical.png', requireInteraction: true },
    }

    const config = severityConfig[alert.severity]

    return {
      title: alert.title,
      body: alert.message,
      icon: config.icon,
      tag: `alert-${alert.id}`,
      data: {
        alertId: alert.id,
        type: 'community-alert',
      },
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      requireInteraction: config.requireInteraction,
    }
  }

  /**
   * Show notification for a community alert
   */
  async showAlertNotification(alert: CommunityAlert): Promise<boolean> {
    const payload = this.alertToPayload(alert)
    return this.sendLocalNotification(payload)
  }

  /**
   * Send push notification via backend (for server-side sending)
   * Note: This would typically call a server API endpoint that uses web-push library
   */
  async sendPushNotification(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Call backend API to send push notification
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notification: payload,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.message || 'Failed to send notification' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error sending push notification:', error)
      return { success: false, error: 'Failed to send push notification' }
    }
  }

  /**
   * Broadcast notification to all subscribed users in an area
   * Note: This would typically be called from a server-side job
   */
  async broadcastToArea(
    latitude: number,
    longitude: number,
    radiusKm: number,
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; sentCount: number; error?: string }> {
    try {
      const response = await fetch('/api/push/broadcast-area', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          radiusKm,
          notification: payload,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, sentCount: 0, error: error.message || 'Failed to broadcast' }
      }

      const result = await response.json()
      return { success: true, sentCount: result.sentCount || 0 }
    } catch (error) {
      console.error('Error broadcasting notification:', error)
      return { success: false, sentCount: 0, error: 'Failed to broadcast notification' }
    }
  }

  // ========================================================================
  // Notification Event Handling
  // ========================================================================

  /**
   * Set up notification click handler
   * This should be called from the service worker or component
   */
  setupNotificationClickHandler(): void {
    if (typeof window === 'undefined') return

    navigator.serviceWorker?.ready.then((registration) => {
      registration.addEventListener('notificationclick', (event) => {
        event.notification.close()

        const action = event.action
        const data = event.notification.data

        if (action === 'dismiss') {
          // Just close the notification
          return
        }

        // Default action: open the app to the alert details
        const urlToOpen = data?.url || '/alerts'

        event.waitUntil(
          clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
              if (client.url.includes('/alerts') && 'focus' in client) {
                return client.focus()
              }
            }
            // Open a new window
            if (clients.openWindow) {
              return clients.openWindow(urlToOpen)
            }
          })
        )
      })
    })
  }

  /**
   * Handle incoming push notification (for service worker)
   */
  async handlePushEvent(
    event: PushEvent
  ): Promise<PushNotificationPayload | null> {
    try {
      const data = event.data?.json()

      if (!data) {
        console.warn('Push notification has no data')
        return null
      }

      return data as PushNotificationPayload
    } catch (error) {
      console.error('Error handling push event:', error)
      return null
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Detect browser from user agent
   */
  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  /**
   * Get VAPID public key for frontend
   */
  getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY
  }
}

// Note: Do not instantiate PushNotificationService at module level as it uses client-side Supabase
// Create instances in components/hooks where needed

// ============================================================================
// React Hook Helpers (for use in components)
// ============================================================================

/**
 * Hook-like function to check push notification support
 */
export function usePushSupport(): {
  isSupported: boolean
  permission: NotificationPermission
  canRequest: boolean
} {
  if (typeof window === 'undefined') {
    return { isSupported: false, permission: 'unsupported', canRequest: false }
  }

  const isSupported = 'Notification' in window && 'serviceWorker' in navigator
  const permission = (Notification.permission || 'default') as NotificationPermission
  const canRequest = permission === 'default'

  return { isSupported, permission, canRequest }
}
