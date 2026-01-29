"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix Leaflet icon issues
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface LocationPickerMapProps {
  initialPosition: [number, number]
  onPositionChange: (position: [number, number]) => void
  zoom?: number
  showMarker?: boolean
}

// Draggable marker component
function DraggableMarker({
  position,
  setPosition,
  zoom = 13
}: {
  position: [number, number]
  setPosition: (position: [number, number]) => void
  zoom?: number
}) {
  const map = useMapEvents({
    click(e) {
      try {
        setPosition([e.latlng.lat, e.latlng.lng])
      } catch (error) {
        console.error("Error setting position:", error)
      }
    },
  })

  useEffect(() => {
    try {
      // If zoom is provided and different, update it
      const currentZoom = map.getZoom()
      if (zoom && currentZoom !== zoom) {
         map.setView(position, zoom)
      } else {
         map.setView(position)
      }
    } catch (error) {
      console.error("Error setting map view:", error)
    }
  }, [position, map, zoom])

  return (
    <Marker
      position={position}
      icon={DefaultIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const position = marker.getLatLng()
          setPosition([position.lat, position.lng])
        },
      }}
    />
  )
}

export default function LocationPickerMap({ initialPosition, onPositionChange, zoom = 13, showMarker = true }: LocationPickerMapProps) {
  const [position, setPosition] = useState<[number, number]>(initialPosition)

  useEffect(() => {
    onPositionChange(position)
  }, [position, onPositionChange])

  return (
    <>
      <style jsx global>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
        }
      `}</style>
      <MapContainer center={position} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showMarker && <DraggableMarker position={position} setPosition={setPosition} zoom={zoom} />}
      </MapContainer>
    </>
  )
}
