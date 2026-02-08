'use client'

/**
 * Alert Notification Component
 * ER-003: Community Alert System
 * 
 * Toast-style notification component for displaying alerts with severity-based styling.
 */

import { useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import type { CommunityAlert } from '@/types/community-alert'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Info,
  AlertTriangle,
  AlertCircle,
  X,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react'

interface AlertNotificationProps {
  alert: CommunityAlert
  onDismiss?: (alertId: string) => void
  onViewDetails?: (alert: CommunityAlert) => void
  onViewOnMap?: (alert: CommunityAlert) => void
  autoDismiss?: boolean
  autoDismissDelay?: number // in milliseconds
}

/**
 * Get severity configuration for styling and icons
 */
function getSeverityConfig(severity: CommunityAlert['severity']) {
  const configs = {
    informational: {
      icon: Info,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      toastClass: 'border-l-4 border-l-blue-500',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      toastClass: 'border-l-4 border-l-yellow-500',
    },
    critical: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      toastClass: 'border-l-4 border-l-red-500 animate-pulse',
    },
  }
  return configs[severity]
}

/**
 * Format distance for display
 */
function formatDistance(meters: number | undefined): string {
  if (meters === undefined) return ''
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}

/**
 * Format time relative to now
 */
function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

/**
 * Dismiss toast handler
 */
function handleDismiss(alertId: string, onDismiss?: (alertId: string) => void) {
  toast.dismiss(`alert-${alertId}`)
  onDismiss?.(alertId)
}

/**
 * View details handler
 */
function handleViewDetails(
  alert: CommunityAlert,
  onViewDetails?: (alert: CommunityAlert) => void
) {
  toast.dismiss(`alert-${alert.id}`)
  onViewDetails?.(alert)
}

/**
 * View on map handler
 */
function handleViewOnMap(
  alert: CommunityAlert,
  onViewOnMap?: (alert: CommunityAlert) => void
) {
  toast.dismiss(`alert-${alert.id}`)
  onViewOnMap?.(alert)
}

/**
 * Show alert notification using Sonner toast
 */
export function showAlertNotification(
  alert: CommunityAlert,
  options?: {
    onDismiss?: (alertId: string) => void
    onViewDetails?: (alert: CommunityAlert) => void
    onViewOnMap?: (alert: CommunityAlert) => void
    autoDismiss?: boolean
    duration?: number
  }
) {
  const config = getSeverityConfig(alert.severity)
  const Icon = config.icon

  const toastId = `alert-${alert.id}`

  toast(toastId, {
    id: toastId,
    duration: options?.autoDismiss === false ? Infinity : options?.duration || 8000,
    description: (
      <AlertNotificationContent
        alert={alert}
        onDismiss={options?.onDismiss}
        onViewDetails={options?.onViewDetails}
        onViewOnMap={options?.onViewOnMap}
      />
    ),
    className: config.toastClass,
  })
}

/**
 * Alert notification content component
 */
function AlertNotificationContent({
  alert,
  onDismiss,
  onViewDetails,
  onViewOnMap,
}: AlertNotificationProps) {
  const t = useTranslations('alerts.notification')
  const config = getSeverityConfig(alert.severity)
  const Icon = config.icon

  return (
    <div className={`flex flex-col gap-3 p-3 ${config.bgColor} rounded-md`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
          <div className="font-semibold text-sm">{alert.title}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => handleDismiss(alert.id, onDismiss)}
          aria-label={t('dismiss')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Message */}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {alert.message}
      </p>

      {/* Meta info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {alert.distance !== undefined && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{formatDistance(alert.distance)}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatTime(alert.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => handleViewDetails(alert, onViewDetails)}
          >
            {t('viewDetails')}
          </Button>
        )}
        {onViewOnMap && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => handleViewOnMap(alert, onViewOnMap)}
          >
            <MapPin className="h-3 w-3 mr-1" />
            {t('viewOnMap')}
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Alert Notification Component (inline version)
 */
export function AlertNotification({
  alert,
  onDismiss,
  onViewDetails,
  onViewOnMap,
  autoDismiss = true,
  autoDismissDelay = 8000,
}: AlertNotificationProps) {
  const t = useTranslations('alerts.notification')
  const config = getSeverityConfig(alert.severity)
  const Icon = config.icon

  // Auto-dismiss effect
  useEffect(() => {
    if (!autoDismiss) return

    const timer = setTimeout(() => {
      handleDismiss(alert.id, onDismiss)
    }, autoDismissDelay)

    return () => clearTimeout(timer)
  }, [alert.id, autoDismiss, autoDismissDelay, onDismiss])

  return (
    <div
      className={`flex flex-col gap-3 p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
          <span className="font-semibold">{alert.title}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => onDismiss?.(alert.id)}
          aria-label={t('dismiss')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{alert.message}</p>

      {alert.instructions && (
        <p className="text-sm font-medium">{alert.instructions}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {alert.distance !== undefined && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{formatDistance(alert.distance)}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatTime(alert.createdAt)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(alert)}
          >
            {t('viewDetails')}
          </Button>
        )}
        {onViewOnMap && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewOnMap?.(alert)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {t('viewOnMap')}
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Alert Notification Group - for displaying multiple notifications
 */
interface AlertNotificationGroupProps {
  alerts: CommunityAlert[]
  onDismiss?: (alertId: string) => void
  onViewDetails?: (alert: CommunityAlert) => void
  onViewOnMap?: (alert: CommunityAlert) => void
  maxVisible?: number
}

export function AlertNotificationGroup({
  alerts,
  onDismiss,
  onViewDetails,
  onViewOnMap,
  maxVisible = 3,
}: AlertNotificationGroupProps) {
  const t = useTranslations('alerts.notification')

  // Sort by severity and time (most critical/recent first)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, informational: 2 }
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (severityDiff !== 0) return severityDiff
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const visibleAlerts = sortedAlerts.slice(0, maxVisible)
  const hiddenCount = sortedAlerts.length - maxVisible

  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-3" role="region" aria-label={t('notifications')}>
      {visibleAlerts.map((alert) => (
        <AlertNotification
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss}
          onViewDetails={onViewDetails}
          onViewOnMap={onViewOnMap}
        />
      ))}
      {hiddenCount > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          +{hiddenCount} more {hiddenCount === 1 ? 'alert' : 'alerts'}
        </p>
      )}
    </div>
  )
}

/**
 * Severity badge component
 */
export function AlertSeverityBadge({
  severity,
  showLabel = true,
  size = 'default',
}: {
  severity: CommunityAlert['severity']
  showLabel?: boolean
  size?: 'sm' | 'default'
}) {
  const t = useTranslations('alerts.severity')
  const config = getSeverityConfig(severity)
  const Icon = config.icon

  const sizeClasses = {
    sm: 'h-5 w-5 text-xs px-1.5 py-0.5',
    default: 'h-6 w-6 text-sm px-2 py-1',
  }

  const label = t(severity)

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${config.borderColor} ${config.bgColor} ${sizeClasses[size]}`}
    >
      <Icon className={`h-3 w-3 ${config.iconColor}`} />
      {showLabel && <span>{label}</span>}
    </span>
  )
}
