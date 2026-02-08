'use client'

/**
 * Alert List Component
 * ER-003: Community Alert System
 * 
 * Component for displaying a list of nearby alerts with filtering and sorting options.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { AlertService } from '@/lib/services/emergency/alert-service'
import type {
  CommunityAlert,
  CommunityAlertFilters,
  AlertSortOption,
  UnreadAlertCount,
} from '@/types/community-alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertNotification, AlertSeverityBadge } from './alert-notification'
import { Loader2, Bell, MapPin, Clock, Filter, SortAsc, SortDesc, RefreshCw } from 'lucide-react'

interface AlertListProps {
  userId: string
  initialLatitude?: number
  initialLongitude?: number
  initialRadius?: number
  onAlertClick?: (alert: CommunityAlert) => void
  onAlertViewOnMap?: (alert: CommunityAlert) => void
  showFilters?: boolean
  showSort?: boolean
  maxItems?: number
}

export function AlertList({
  userId,
  initialLatitude,
  initialLongitude,
  initialRadius = 5000,
  onAlertClick,
  onAlertViewOnMap,
  showFilters = true,
  showSort = true,
  maxItems,
}: AlertListProps) {
  const t = useTranslations('alerts.list')
  const tCommon = useTranslations('common')

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [alerts, setAlerts] = useState<CommunityAlert[]>([])
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(
    initialLatitude && initialLongitude
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : null
  )
  const [radius, setRadius] = useState(initialRadius)
  const [unreadCount, setUnreadCount] = useState<UnreadAlertCount>({
    total: 0,
    bySeverity: { informational: 0, warning: 0, critical: 0 },
  })

  // Filter state
  const [filters, setFilters] = useState<CommunityAlertFilters>({
    severity: ['informational', 'warning', 'critical'],
    isRead: undefined,
  })

  // Sort state
  const [sortBy, setSortBy] = useState<AlertSortOption>('distance')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Get user location
  useEffect(() => {
    if (userLocation) return

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.warn('Error getting location:', error)
        }
      )
    }
  }, [userLocation])

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!userLocation) return

    try {
      setIsLoading(true)
      const [alertsData, unreadData] = await Promise.all([
        AlertService.getInstance().getNearbyAlerts(
          userLocation.latitude,
          userLocation.longitude,
          radius,
          filters,
          { field: sortBy, direction: sortDirection }
        ),
        AlertService.getInstance().getUnreadAlertCount(
          userLocation.latitude,
          userLocation.longitude,
          radius
        ),
      ])

      setAlerts(maxItems ? alertsData.slice(0, maxItems) : alertsData)
      setUnreadCount(unreadData)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userLocation, radius, filters, sortBy, sortDirection, maxItems])

  // Refresh alerts
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAlerts()
    setIsRefreshing(false)
  }

  // Initial fetch and when dependencies change
  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Handle filter changes
  const handleSeverityFilter = useCallback((severity: string, checked: boolean) => {
    setFilters((prev) => {
      const severities = prev.severity || []
      if (checked && !severities.includes(severity as any)) {
        return { ...prev, severity: [...severities, severity as any] }
      } else if (!checked && severities.includes(severity as any)) {
        return { ...prev, severity: severities.filter((s) => s !== severity) }
      }
      return prev
    })
  }, [])

  // Handle mark as read
  const handleMarkAsRead = useCallback(
    async (alertId: string) => {
      await AlertService.getInstance().markAlertAsRead(alertId, userId)
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      )
      setUnreadCount((prev) => ({
        ...prev,
        total: prev.total - 1,
      }))
    },
    [userId]
  )

  // Toggle sort direction
  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }, [])

  // Format distance
  const formatDistance = (meters: number | undefined): string => {
    if (meters === undefined) return ''
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${Math.round(meters)} m`
  }

  // Group alerts by severity for empty state
  const hasActiveFilters = useMemo(
    () =>
      filters.severity?.length !== 3 ||
      filters.isRead !== undefined,
    [filters]
  )

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('title')}
            {unreadCount.total > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount.total}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label={t('refresh')}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>

        {/* Unread count summary */}
        {unreadCount.total > 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
            {unreadCount.bySeverity.critical > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <Badge variant="destructive" className="h-5">
                  {unreadCount.bySeverity.critical}
                </Badge>
                {t('critical')}
              </span>
            )}
            {unreadCount.bySeverity.warning > 0 && (
              <span className="flex items-center gap-1 text-yellow-600">
                <Badge variant="outline" className="h-5 border-yellow-500 text-yellow-600">
                  {unreadCount.bySeverity.warning}
                </Badge>
                {t('warning')}
              </span>
            )}
            {unreadCount.bySeverity.informational > 0 && (
              <span className="flex items-center gap-1 text-blue-600">
                <Badge className="h-5 bg-blue-500">{unreadCount.bySeverity.informational}</Badge>
                {t('informational')}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Filters and Sort */}
        {(showFilters || showSort) && (
          <div className="space-y-4 mb-4">
            {showFilters && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {t('filters.title')}
                </Label>
                <div className="flex flex-wrap gap-4">
                  {(['informational', 'warning', 'critical'] as const).map(
                    (severity) => (
                      <div key={severity} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-${severity}`}
                          checked={filters.severity?.includes(severity)}
                          onCheckedChange={(checked) =>
                            handleSeverityFilter(severity, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`filter-${severity}`}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <AlertSeverityBadge severity={severity} showLabel={false} size="sm" />
                          {t(`severity.${severity}`)}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {showSort && (
              <div className="flex items-center gap-3">
                <Label className="flex items-center gap-2">
                  {sortDirection === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                  {t('sort.label')}
                </Label>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as AlertSortOption)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">{t('sort.distance')}</SelectItem>
                    <SelectItem value="severity">{t('sort.severity')}</SelectItem>
                    <SelectItem value="date">{t('sort.date')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={toggleSortDirection}>
                  {sortDirection === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <Separator className="my-4" />

        {/* Alert List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t('empty.title')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasActiveFilters ? t('empty.filtersNoResults') : t('empty.noAlerts')}
            </p>
            {hasActiveFilters && (
              <Button
                variant="link"
                onClick={() =>
                  setFilters({ severity: ['informational', 'warning', 'critical'] })
                }
                className="mt-2"
              >
                {t('filters.clear')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertNotification
                key={alert.id}
                alert={alert}
                onDismiss={handleMarkAsRead}
                onViewDetails={onAlertClick}
                onViewOnMap={onAlertViewOnMap}
                autoDismiss={false}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact Alert List - for use in sidebars or panels
 */
interface CompactAlertListProps {
  userId: string
  latitude: number
  longitude: number
  maxItems?: number
  onAlertClick?: (alert: CommunityAlert) => void
}

export function CompactAlertList({
  userId,
  latitude,
  longitude,
  maxItems = 5,
  onAlertClick,
}: CompactAlertListProps) {
  const t = useTranslations('alerts.list')

  const [alerts, setAlerts] = useState<CommunityAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const data = await AlertService.getInstance().getNearbyAlerts(
          latitude,
          longitude,
          5000,
          { isRead: false },
          { field: 'severity', direction: 'asc' }
        )
        setAlerts(data.slice(0, maxItems))
      } catch (error) {
        console.error('Error fetching alerts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlerts()
  }, [latitude, longitude, maxItems])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {t('empty.noAlerts')}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => onAlertClick?.(alert)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onAlertClick?.(alert)
            }
          }}
        >
          <AlertSeverityBadge severity={alert.severity} showLabel={false} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{alert.title}</p>
            <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <MapPin className="h-3 w-3" />
            <span>{formatDistanceCompact(alert.distance)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatDistanceCompact(meters: number | undefined): string {
  if (meters === undefined) return ''
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`
  }
  return `${Math.round(meters)}m`
}
