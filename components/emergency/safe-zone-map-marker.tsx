'use client'

import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet'
import { MapPin, Shield, ShieldCheck, Navigation, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/**
 * SafeZoneMapMarker Component
 *
 * Displays safe zones on the map with interactive markers.
 * Shows distance, safety level, and allows navigation to safe zones.
 */

export interface SafeZoneMarker {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number
  safetyLevel: 'safe' | 'moderate' | 'danger'
  type: 'shelter' | 'open_space' | 'gas_station' | 'school' | 'hospital'
  description?: string
  facilities?: string[]
}

interface SafeZoneMapMarkerProps {
  safeZones: SafeZoneMarker[]
  userLocation?: { latitude: number; longitude: number }
  onClick?: (safeZone: SafeZoneMarker) => void
  onNavigate?: (safeZone: SafeZoneMarker) => void
}

/**
 * Get safety level color and icon
 */
function getSafetyConfig(level: SafeZoneMarker['safetyLevel']) {
  const configs = {
    safe: {
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900',
      borderColor: 'border-green-300 dark:border-green-700',
    },
    moderate: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
    },
    danger: {
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900',
      borderColor: 'border-red-300 dark:border-red-700',
    },
  }
  return configs[level]
}

/**
 * Calculate distance between two coordinates (simplified for display)
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
  const dφ = ((lat2 - lat1) * Math.PI) / 180
  const dλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dφ / 2) * Math.sin(dφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) * Math.sin(dλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Component that handles map click to center on safe zone
 */
function SafeZoneMapController({
  safeZoneId,
  onCenter,
}: {
  safeZoneId?: string
  onCenter?: (safeZoneId: string) => void
}) {
  const handleClick = useMapEvents(({ lat, lng }) => {
    if (safeZoneId) {
      onCenter?.(safeZoneId)
    }
  })

  return <div>{children}</div>
}

/**
 * Main SafeZoneMapMarker component
 */
export function SafeZoneMapMarker({
  safeZones,
  userLocation,
  onClick,
  onNavigate,
}: SafeZoneMapMarkerProps) {
  const t = useTranslations('safeZones')
  const [selectedZone, setSelectedZone] = useState<SafeZoneMarker | null>(null)
  const [zoom, setZoom] = useState(13)

  // Calculate distances from user location
  const safeZonesWithDistance = safeZones.map((zone) => {
    let distance = 0
    if (userLocation) {
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        zone.latitude,
        zone.longitude
      )
    }
    return { ...zone, distance }
  }).sort((a, b) => a.distance - b.distance)

  const hasUserLocation = !!userLocation
  const nearestSafeZone = hasUserLocation
    ? safeZonesWithDistance.find(z => z.radius - z.distance >= 0) || safeZonesWithDistance[0]
    : null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t('safeZones')}</h3>
        {hasUserLocation && (
          <Badge variant="outline">
            {nearestSafeZone ? `${Math.round(nearestSafeZone.distance)}m away` : 'No nearby zones'}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {safeZonesWithDistance.map((zone, index) => {
          const config = getSafetyConfig(zone.safetyLevel)
          const distanceMeters = hasUserLocation ? zone.distance : 0
          const isVisible = hasUserLocation
            ? distanceMeters <= zone.radius
            : true

          return (
            <div
              key={zone.id}
              className={
                index === 0
                  ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                  : ''
              }
            >
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => {
                  setSelectedZone(zone)
                  onClick?.(zone)
                }}
              >
                <div className="flex items-center gap-2">
                  {index === 0 ? (
                    <Navigation className="h-4 w-4 text-blue-500" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  <span className="font-medium">{zone.name}</span>
                  {zone.type === 'shelter' && (
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                  )}
                  {zone.safetyLevel === 'safe' && (
                    <Shield className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={config.bgColor + ' ' + config.color}
                >
                  {zone.safetyLevel}
                </Badge>
              </Button>

              {zone.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {zone.description}
                </p>
              )}

              {zone.facilities && zone.facilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {zone.facilities.map((facility, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {facility}
                    </Badge>
                  ))}
                </div>
              )}

              {hasUserLocation && distanceMeters > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {distanceMeters > 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${Math.round(distanceMeters)}m`}
                  {distanceMeters > zone.radius && (
                    <span className="text-red-500 ml-1">
                      ({zone.radius}m radius)
                    </span>
                  )}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {hasUserLocation && !nearestSafeZone && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {t('noNearbyZones')}
          </p>
        </div>
      )}
    </div>
  )
}
