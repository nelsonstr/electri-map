// @ts-nocheck
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Zap, ZapOff, Locate, Search, Loader2, Plus, Wifi, Droplets, Smartphone, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import * as L from "leaflet"

// Fix Leaflet icon issues
const DefaultIcon = (hasElectricity: boolean, serviceType: string = "electrical") => {
  let iconSvg = ""
  let bgColor = hasElectricity ? "bg-green-500" : "bg-red-500"
  
  // Custom icons based on service type
  if (serviceType === "communication") {
     iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>'
  } else if (serviceType === "water") {
     iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.74 5.88a6 6 0 0 1-8.49 8.49A6 6 0 0 1 5.26 9.53L12 2.69z"></path></svg>'
  } else if (serviceType === "mobile") {
     iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'
  } else if (serviceType === "road-block") {
     iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
  } else {
     // Default electrical
     iconSvg = hasElectricity 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path><path d="M2 2l20 20"></path></svg>'
  }

  return L.divIcon({
    className: "custom-div-icon",
    html: `<div class="marker-pin ${bgColor} w-6 h-6 rounded-full flex items-center justify-center text-white">
      ${iconSvg}
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

// Component to handle map location control
function LocationControl() {
  const map = useMap()
  const [locating, setLocating] = useState(false)

  const handleLocate = () => {
    setLocating(true)

    try {
      map.locate({
        setView: true,
        maxZoom: 8,
        timeout: 10000,
        enableHighAccuracy: false,
      })

      // Add event listeners for location events
      const onLocationFound = (e: any) => {
        setLocating(false)
        // You could add a marker at the user's location if desired
      }

      const onLocationError = (e: any) => {
        setLocating(false)
        console.log("Location error:", e.message)
        // Alert the user that location couldn't be found
        alert("Could not find your location. Please use the search or navigate manually.")
      }

      map.once("locationfound", onLocationFound)
      map.once("locationerror", onLocationError)

      // Clean up event listeners after timeout
      setTimeout(() => {
        map.off("locationfound", onLocationFound)
        map.off("locationerror", onLocationError)
        setLocating(false)
      }, 10000)
    } catch (error) {
      console.log("Geolocation exception:", error)
      setLocating(false)
      alert("Location services are not available. Please use the search or navigate manually.")
    }
  }

  useEffect(() => {
    handleLocate()
  }, [])

  return (
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control leaflet-bar">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 bg-background"
          onClick={handleLocate}
          disabled={locating}
          title="Go to my location"
        >
          {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Locate className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  )
}

// Component to handle search
function SearchControl() {
  const map = useMap()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const { toast } = useToast()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Use Nominatim for geocoding (free and doesn't require API key)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "ElectricityStatusMap/1.0",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        map.setView([Number.parseFloat(lat), Number.parseFloat(lon)], 13)
      } else {
        toast({
          variant: "destructive",
          title: "Location not found",
          description: "Could not find the location you searched for. Please try a different search term.",
        })
      }
    } catch (error) {
      console.error("Error searching location:", error)
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "There was a problem with the search. Please try again later.",
      })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div
      style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1000, width: "300px", maxWidth: "calc(100% - 20px)" }}
    >
      <div className="leaflet-control">
        {/* <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-background"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-0 top-0 h-full"
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </form> */}
      </div>
    </div>
  )
}

// Quick Report Button
function QuickReportControl() {
  const map = useMap()
  const [open, setOpen] = useState(false)
  const [hasElectricity, setHasElectricity] = useState<boolean | null>(null)
  const [serviceType, setServiceType] = useState<string>("electrical")
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Get current map center when dialog opens
  useEffect(() => {
    if (open) {
      const center = map.getCenter()
      setCurrentPosition([center.lat, center.lng])
    }
  }, [open, map])

  const handleSubmit = async () => {
    if (hasElectricity === null || !currentPosition) return

    setLoading(true)
    try {
      // Get city and country before storage
      const locationInfo = await getLocationInfo(currentPosition[0], currentPosition[1])

      const { error } = await supabase.from("locations").insert({
        latitude: currentPosition[0],
        longitude: currentPosition[1],
        has_electricity: hasElectricity,
        service_type: serviceType,
        comment: comment || null,
        city: locationInfo.city,
        country: locationInfo.country,
      })

      if (error) throw error

      toast({
        title: "Status reported successfully",
        description: "Thank you for contributing to the services status map!",
      })

      // No page reload; realtime subscription will append new report
      // debugger removed

      setOpen(false)
      setHasElectricity(null)
      setServiceType("electrical")
      setComment("")
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        variant: "destructive",
        title: "Error reporting status",
        description: "There was a problem submitting your report. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="leaflet-bottom leaflet-right" style={{ zIndex: 1000, margin: "20px" }}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="rounded-full h-14 w-14 shadow-lg" size="icon">
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Report</DialogTitle>
            <DialogDescription>Report service status at the current map location</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={hasElectricity === true ? "default" : "outline"}
                className={`h-16 ${hasElectricity === true ? "bg-green-500 hover:bg-green-600" : ""}`}
                onClick={() => setHasElectricity(true)}
              >
                <div className="flex flex-col items-center">
                  <Zap className="h-6 w-6 mb-1" />
                  <span>Service Working</span>
                </div>
              </Button>

              <Button
                type="button"
                variant={hasElectricity === false ? "destructive" : "outline"}
                className="h-16"
                onClick={() => setHasElectricity(false)}
              >
                <div className="flex flex-col items-center">
                  <ZapOff className="h-6 w-6 mb-1" />
                  <span>Report Issue</span>
                </div>
              </Button>
            </div>

            <div className="grid grid-cols-5 gap-1">
               <Button
                  type="button"
                  variant={serviceType === "electrical" ? "default" : "outline"}
                  className="h-14 p-1 flex flex-col gap-1"
                  onClick={() => setServiceType("electrical")}
                  title="Electrical"
                >
                  <Zap className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={serviceType === "communication" ? "default" : "outline"}
                  className="h-14 p-1 flex flex-col gap-1"
                  onClick={() => setServiceType("communication")}
                  title="Communication"
                >
                  <Wifi className="h-4 w-4" />
                </Button>
                 <Button
                  type="button"
                  variant={serviceType === "water" ? "default" : "outline"}
                  className="h-14 p-1 flex flex-col gap-1"
                  onClick={() => setServiceType("water")}
                  title="Water"
                >
                  <Droplets className="h-4 w-4" />
                </Button>
                 <Button
                  type="button"
                  variant={serviceType === "mobile" ? "default" : "outline"}
                  className="h-14 p-1 flex flex-col gap-1"
                  onClick={() => setServiceType("mobile")}
                  title="Mobile"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
                 <Button
                  type="button"
                  variant={serviceType === "road-block" ? "default" : "outline"}
                  className="h-14 p-1 flex flex-col gap-1"
                  onClick={() => setServiceType("road-block")}
                  title="Road Block"
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
            </div>

            <div>
              <Textarea
                placeholder="Add any additional information about the service status... (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {currentPosition ? (
                <span>
                  Reporting at: {currentPosition[0].toFixed(6)}, {currentPosition[1].toFixed(6)}
                </span>
              ) : (
                <span>Loading location...</span>
              )}
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={hasElectricity === null || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Component to recenter map when position changes
function RecenterMap({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView(position, 10)
  }, [position, map])
  return null
}

type Location = {
  id: string
  latitude: number
  longitude: number
  has_electricity: boolean
  comment: string | null
  created_at: string
  city?: string
  country?: string
  service_type?: string
}

// Reverse-geocode coordinates to nearest city and country using Nominatim
const getLocationInfo = async (latitude: number, longitude: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
    )
    if (!response.ok) throw new Error(`Reverse geocode failed: ${response.status}`)
    const data = await response.json()
    const address = data.address || {}
    const city = address.city || address.town || address.village || address.county || 'Unknown location'
    const country = address.country || 'Unknown region'
    return { city, country }
  } catch {
    return { city: 'Unknown location', country: 'Unknown region' }
  }
}

export default function ElectricityMap() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState<[number, number] | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get user location once on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          setPosition([latitude, longitude])
        },
        (error) => {
          console.error("Geolocation error:", error.message)
          setError("Could not access your location.")
        },
        { timeout: 10000, enableHighAccuracy: false }
      )
    } else {
      setError("Geolocation not supported by your browser.")
    }

    // Fetch locations from last 24 hours from Supabase
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from("locations")
          .select("*")
          .gte("created_at", threshold.toISOString())
          .order("created_at", { ascending: true })

        if (error) throw error

        setLocations((data || []) as Location[])
        setLoading(false)
      } catch (err) {
        console.error("Error fetching locations:", err)
        setError("Failed to load locations. Please try again later.")
        setLoading(false)
      }
    }

    fetchLocations()

    // Set up real-time subscription
    const channel = supabase
      .channel("locations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "locations",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newLocation = payload.new as Location
            if (new Date(newLocation.created_at).getTime() >= threshold.getTime()) {
              const info = await getLocationInfo(newLocation.latitude, newLocation.longitude)
              const enriched = { ...newLocation, ...info }
              setLocations((prev) => [...prev, enriched])
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <style jsx global>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
          z-index: 1;
        }
        .custom-div-icon {
          background: transparent;
          border: none;
        }
      `}</style>
      {/* Show loader until position is available */}
      {!position && <div>Loading map...</div>}
      {position && (
        <MapContainer center={position} zoom={10} style={{ height: "100%", width: "100%" }}>
          <RecenterMap position={position} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationControl />
          <SearchControl />
          <QuickReportControl />

          {locations.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={DefaultIcon(location.has_electricity, location.service_type)}
            >
              <Popup>
                <div className="p-1">
                  <div className="flex items-center gap-2 mb-2">
                    {location.has_electricity ? (
                      <Badge className="bg-green-500">
                         Working
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                         Issue Reported
                      </Badge>
                    )}
                    {location.service_type && (
                      <Badge variant="outline" className="ml-1 capitalize">
                        {location.service_type}
                      </Badge>
                    )}
                  </div>

                  {location.comment && <p className="text-sm mb-2">{location.comment}</p>}

                  <div className="text-xs mb-1">
                    <strong>Location:</strong> {location.city}, {location.country}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Reported {formatDistanceToNow(new Date(location.created_at))} ago
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </>
  )
}
