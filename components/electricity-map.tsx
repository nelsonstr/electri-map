"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Zap, ZapOff, Locate, Search, Loader2, Plus } from "lucide-react"
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
const DefaultIcon = (hasElectricity: boolean) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div class="marker-pin ${hasElectricity ? "bg-green-500" : "bg-red-500"} w-6 h-6 rounded-full flex items-center justify-center text-white">
      ${
        hasElectricity
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path><path d="M2 2l20 20"></path></svg>'
      }
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
      className="leaflet-top leaflet-left"
      style={{ zIndex: 1000, width: "300px", maxWidth: "calc(100% - 20px)", margin: "10px" }}
    >
      <div className="leaflet-control">
        <form onSubmit={handleSearch} className="flex gap-2">
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
        </form>
      </div>
    </div>
  )
}

// Quick Report Button
function QuickReportControl() {
  const map = useMap()
  const [open, setOpen] = useState(false)
  const [hasElectricity, setHasElectricity] = useState<boolean | null>(null)
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
      const { error } = await supabase.from("locations").insert({
        latitude: currentPosition[0],
        longitude: currentPosition[1],
        has_electricity: hasElectricity,
        comment: comment || null,
      })

      if (error) throw error

      toast({
        title: "Status reported successfully",
        description: "Thank you for contributing to the electricity status map!",
      })

      setOpen(false)
      setHasElectricity(null)
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
            <DialogDescription>Report electricity status at the current map location</DialogDescription>
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
                  <span>Has Electricity</span>
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
                  <span>No Electricity</span>
                </div>
              </Button>
            </div>

            <div>
              <Textarea
                placeholder="Add any additional information about the electricity status... (optional)"
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

type Location = {
  id: string
  latitude: number
  longitude: number
  has_electricity: boolean
  comment: string | null
  created_at: string
  city?: string
  country?: string
}

// Reverse-geocode coordinates to nearest city and country using Nominatim
const getLocationInfo = async (latitude: number, longitude: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
    )
    if (!response.ok) {
      throw new Error(`Reverse geocode failed: ${response.status}`)
    }
    const data = await response.json()
    const address = data.address || {}
    const city = address.city || address.town || address.village || address.county || 'Unknown location'
    const country = address.country || 'Unknown region'
    return { city, country }
  } catch (error) {
    console.error('Error fetching location info:', error)
    return { city: 'Unknown location', country: 'Unknown region' }
  }
}

// Helper to fetch country bounds from Nominatim for a given coordinate
async function fetchCountryBounds(latitude: number, longitude: number): Promise<[[number, number], [number, number]]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`
    )
    if (!res.ok) {
      throw new Error(`Bounds lookup failed: ${res.status}`)
    }
    const data = await res.json()
    const bbox = data.boundingbox as [string, string, string, string]
    const south = parseFloat(bbox[0])
    const north = parseFloat(bbox[1])
    const west = parseFloat(bbox[2])
    const east = parseFloat(bbox[3])
    return [[south, west], [north, east]]
  } catch (err) {
    console.error('Error fetching country bounds:', err)
    throw err
  }
}

export default function ElectricityMap() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState<[number, number]>([0, 0])
  const [countryBounds, setCountryBounds] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Default position (world view)
    const defaultPosition: [number, number] = [20, 0]
    setPosition(defaultPosition)

    // Try to get user's location and country
    if (navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setPosition([latitude, longitude])
          },
          (error) => {
            console.log("Geolocation error:", error.message)
            // Keep using the default position
          },
          { timeout: 10000, enableHighAccuracy: false },
        )
      } catch (error) {
        console.log("Geolocation exception:", error)
        // Keep using the default position
      }
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
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newLocation = payload.new as Location
            // Only include new reports if within last 24h
            if (new Date(newLocation.created_at).getTime() >= threshold.getTime()) {
              setLocations((prev) => [...prev, newLocation])
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
      {/* @ts-ignore: allow center and zoom props for MapContainer */}
      <MapContainer center={position} zoom={position[0] ? 10 : 2} style={{ height: "100%", width: "100%" }}>
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
            icon={DefaultIcon(location.has_electricity)}
          >
            <Popup>
              <div className="p-1">
                <div className="flex items-center gap-2 mb-2">
                  {location.has_electricity ? (
                    <Badge className="bg-green-500">
                      <Zap className="h-3 w-3 mr-1" /> Has Electricity
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <ZapOff className="h-3 w-3 mr-1" /> No Electricity
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
    </>
  )
}
