'use client'

import { useState } from 'react'
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { AlertTriangle, Zap, Shield, X, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Custom marker icons for different emergency types
const SOSIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="sos-marker"></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

const IncidentIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="incident-marker"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

// Custom marker component
function EmergencyMarker({
  type,
  severity,
  onPopupClick,
}: {
  type: 'sos' | 'incident' | 'alert' | 'safe-zone'
  severity?: 'critical' | 'high' | 'medium' | 'low'
  onPopupClick?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const markerClasses = {
    sos: 'sos-marker',
    incident: 'incident-marker',
    alert: 'alert-marker',
    'safe-zone': 'safezone-marker',
  }

  return (
    <div className="relative">
      <div
        className={`
          ${markerClasses[type]}
          ${severity === 'critical' ? 'animate-pulse' : ''}
          w-10 h-10 rounded-full
          flex items-center justify-center
          cursor-pointer
          hover:scale-110
          transition-transform
        `}
        style={{
          background:
            type === 'sos'
              ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
              : type === 'incident'
              ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
              : type === 'alert'
              ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
              : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        }}
        onClick={onPopupClick}
      >
        {type === 'sos' && <AlertTriangle className="w-6 h-6 text-white" />}
        {type === 'incident' && <Zap className="w-6 h-6 text-white" />}
        {type === 'alert' && <AlertTriangle className="w-5 h-5 text-white" />}
        {type === 'safe-zone' && <Shield className="w-5 h-5 text-white" />}
      </div>
    </div>
  )
}

interface EmergencyMarkerClusterProps {
  markers: Array<{
    id: string
    type: 'sos' | 'incident' | 'alert' | 'safe-zone'
    latitude: number
    longitude: number
    title: string
    severity?: 'critical' | 'high' | 'medium' | 'low'
    icon?: string
    description?: string
  }>
  userLocation?: { latitude: number; longitude: number }
  onMarkerClick?: (marker: typeof markers[0]) => void
  filter?: {
    type?: string | 'all'
    severity?: string | 'all'
  }
}

export function EmergencyMarkerCluster({
  markers,
  userLocation,
  onMarkerClick,
  filter,
}: EmergencyMarkerClusterProps) {
  const filteredMarkers = markers.filter((marker) => {
    const typeMatch = filter?.type === 'all' || marker.type === filter.type
    const severityMatch =
      filter?.severity === 'all' || marker.severity === filter?.severity
    return typeMatch && severityMatch
  })

  if (filteredMarkers.length === 0) {
    return null
  }

  return filteredMarkers.map((marker) => (
    <Marker key={marker.id} position={[marker.latitude, marker.longitude]}>
      <EmergencyMarker
        type={marker.type}
        severity={marker.severity}
        onPopupClick={() => onMarkerClick?.(marker)}
      />
    </Marker>
  ))
}

export default EmergencyMarkerCluster
