'use client'

/**
 * Alert Sheet Component
 * ER-003: Community Alert System
 *
 * Slide-over panel for displaying community alert details.
 */

import type { CommunityAlert } from '@/types/community-alert'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  MapPin,
  Navigation,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  X,
  ShieldAlert,
  Bell,
} from 'lucide-react'

interface AlertSheetProps {
  alert: CommunityAlert | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewOnMap?: (alert: CommunityAlert) => void
}

const SEVERITY_CONFIG = {
  informational: {
    icon: Info,
    color: '#3B82F6',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    labelKey: 'informational',
  },
  warning: {
    icon: AlertTriangle,
    color: '#F59E0B',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    borderColor: 'border-amber-200 dark:border-amber-800',
    labelKey: 'warning',
  },
  critical: {
    icon: AlertCircle,
    color: '#EF4444',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    labelKey: 'critical',
  },
} as const

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
  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

/**
 * Get severity label key
 */
function getSeverityLabelKey(severity: CommunityAlert['severity']): string {
  return `severity_${severity}`
}

/**
 * Alert Sheet Component - Slide-over panel
 */
export function AlertSheet({
  alert,
  open,
  onOpenChange,
  onViewOnMap,
}: AlertSheetProps) {
  const t = useTranslations('communityAlert')
  const tAlert = useTranslations('alerts')

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  if (!alert) return null

  const config = SEVERITY_CONFIG[alert.severity]
  const SeverityIcon = config.icon

  // Generate navigation URL for external maps
  const getNavigationUrl = () => {
    const coords = `${alert.latitude},${alert.longitude}`
    return `https://www.google.com/maps/dir/?api=1&destination=${coords}`
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[400px] overflow-y-auto"
        aria-describedby="alert-description"
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${config.bgColor}`}
                style={{ borderColor: config.color }}
              >
                <SeverityIcon
                  className="h-5 w-5"
                  style={{ color: config.color }}
                  aria-hidden="true"
                />
              </div>
              <div>
                <SheetTitle className="text-xl">{alert.title}</SheetTitle>
                <SheetDescription id="alert-description">
                  {t(`severity_${alert.severity}`)}
                </SheetDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              aria-label={tAlert('notification.dismiss')}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </SheetHeader>

        {/* Severity Badge */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            style={{
              backgroundColor: config.color,
              color: 'white',
            }}
          >
            <ShieldAlert className="w-3 h-3 mr-1" aria-hidden="true" />
            {t(`severity_${alert.severity}`)}
          </Badge>
          {alert.category && (
            <Badge variant="outline">{alert.category}</Badge>
          )}
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">{alert.message}</p>
        </div>

        {/* Instructions */}
        {alert.instructions && (
          <>
            <Separator className="my-4" />
            <div className="mb-6">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4" aria-hidden="true" />
                {t('instructions')}
              </h3>
              <p className="text-sm text-muted-foreground">{alert.instructions}</p>
            </div>
          </>
        )}

        <Separator className="my-4" />

        {/* Location Info */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium">{t('location')}</p>
              <p className="text-sm text-muted-foreground">
                {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
              </p>
              {alert.distance !== undefined && (
                <p className="text-sm text-muted-foreground">
                  {formatDistance(alert.distance)} away
                </p>
              )}
            </div>
          </div>

          {/* Radius */}
          {alert.radius && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium">{t('alertRadius')}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistance(alert.radius)}
                </p>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium">{t('reportedAt')}</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(alert.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Source */}
        {alert.source && (
          <>
            <div className="mb-6">
              <h3 className="font-medium mb-2">{t('source')}</h3>
              <p className="text-sm text-muted-foreground">{alert.source}</p>
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {onViewOnMap && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                onViewOnMap(alert)
                onOpenChange(false)
              }}
            >
              <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('viewOnMap')}
            </Button>
          )}

          {/* External Map Navigation */}
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => window.open(getNavigationUrl(), '_blank')}
          >
            <Navigation className="w-4 h-4 mr-2" aria-hidden="true" />
            {t('openInMaps')}
            <ExternalLink className="w-3 h-3 ml-2" aria-hidden="true" />
          </Button>
        </div>

        {/* Accessibility Note */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          {t('dataMayBeInaccurate')}
        </p>
      </SheetContent>
    </Sheet>
  )
}

export default AlertSheet
