// @ts-nocheck
"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import * as L from "leaflet"
import { useTranslations } from "next-intl"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Zap, ZapOff, Locate, Search, Loader2, Plus, Wifi, Droplets, Smartphone, AlertTriangle, Siren } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { useToast } from "@/components/ui/use-toast"
import { Shield, ShieldCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { SOSButton } from "@/components/emergency/sos-button"
import { SosAlertDialog } from "@/components/emergency/sos-alert-dialog"
import { SafeZoneSheet } from "@/components/emergency/safe-zone-sheet"
import { SafeZoneList } from "@/components/emergency/safe-zone-list"
import { listActiveSOSAlerts, type SOSAlert } from "@/lib/services/emergency/sos-service"
import { listNearbySafeZones, type SafeZone, type SafeZoneFilters, type SafeZoneSortOption } from "@/lib/services/emergency/safe-zone-service"
import type { CommunityAlert } from "@/types/community-alert"
import { AlertService } from "@/lib/services/emergency/alert-service"
import { AlertSheet } from "@/components/emergency/alert-sheet"
import { Info } from "lucide-react"
import { BoundaryLayer } from "@/components/map/boundary-layer"



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
  } else if (serviceType === "gas") {
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 22 3-7V5c0-1.1-.9-2-2-2s-2 .9-2 2v10l3 7Z"/><path d="M9 15.5a5 5 0 1 1 6 0"/></svg>'
  } else if (serviceType === "multi-issue") {
        bgColor = "bg-purple-600"
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
      } else if (serviceType === "multi-restoration") {
        bgColor = "bg-cyan-600"
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
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

// SOS Alert Icon with pulsing animation
const SOSIcon = (emergencyType: string, priority: number) => {
  // Color based on emergency type
  const getEmergencyColor = (type: string) => {
    const colors: Record<string, string> = {
      fire: "#ef4444",
      flooding: "#3b82f6",
      electrocution: "#f59e0b",
      building_collapse: "#6b7280",
      medical: "#dc2626",
    }
    return colors[type] || "#ef4444"
  }

  const color = getEmergencyColor(emergencyType)
  const pulseClass = priority <= 2 ? "sos-marker-critical" : "sos-marker-high"

  return L.divIcon({
    className: `sos-marker ${pulseClass}`,
    html: `<div class="sos-marker-container" style="--sos-color: ${color}">
      <div class="sos-marker-pulse"></div>
      <div class="sos-marker-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>
          <path d="M3 3h18"/>
          <path d="M12 15v5"/>
          <path d="M9 9l6 6"/>
          <path d="M15 9l-6 6"/>
        </svg>
      </div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

// Safe Zone Icon with calm, reassuring design
const SafeZoneIcon = (category: string, safetyRating: number) => {
  // Get icon based on category
  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      hospital: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v6"/><path d="M18 12a6 6 0 1 0-12 0c0-2 1.5-3.5 3.5-5 1 1.5 2.5 2 2.5 5Z"/><path d="M6 12a6 6 0 1 0 12 0c0 2-1.5 3.5-3.5 5-1-1.5-2.5-2-2.5-5Z"/></svg>',
      shelter: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      'police-station': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18v-8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8z"/><path d="M12 11V3"/><path d="M8 3h8"/></svg>',
      'fire-station': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 14-2-4-4-2 1-5 3-5 5 1.5 3.5-1 1 3.5 2 4z"/><path d="M5 21V3l3 3h8l-1 6"/></svg>',
      'community-center': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>',
      business: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M9 9h6v6H9z"/></svg>',
    }
    return icons[cat] || icons.business
  }

  // Color based on safety rating
  const getSafetyColor = (rating: number): string => {
    if (rating >= 4) return '#22c55e' // green-500
    if (rating >= 3) return '#84cc16' // lime-500
    if (rating >= 2) return '#eab308' // yellow-500
    return '#f97316' // orange-500
  }

  const color = getSafetyColor(safetyRating)
  const iconSvg = getCategoryIcon(category)

  return L.divIcon({
    className: 'safe-zone-marker',
    html: `<div class="safe-zone-marker-container" style="--safe-color: ${color}">
      <div class="safe-zone-marker-icon">
        ${iconSvg}
      </div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

// Helper function to get emergency type label
const getEmergencyTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    fire: "Fire",
    flooding: "Flooding",
    electrocution: "Electrocution Hazard",
    building_collapse: "Building Collapse",
    medical: "Medical Emergency",
  }
  return labels[type] || type
}

// Helper function to get priority label
const getPriorityLabel = (priority: number): string => {
  if (priority === 1) return "Critical"
  if (priority === 2) return "High"
  return "Medium"
}

// Helper function to get safe zone category icon
const getSafeZoneCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    hospital: "🏥",
    shelter: "🏠",
    "police-station": "🚒",
    "fire-station": "🚒",
    "community-center": "🏛️",
    business: "🏪",
  }
  return icons[category] || "🏪"
}

// Helper function to get safety rating color
const getSafetyRatingColor = (rating: number): string => {
  if (rating >= 4) return '#22c55e' // green-500
  if (rating >= 3) return '#84cc16' // lime-500
  if (rating >= 2) return '#eab308' // yellow-500
  return '#f97316' // orange-500
}

// Community Alert Icon
const CommunityAlertIcon = (severity: CommunityAlert['severity']) => {
  const getSeverityColor = (s: CommunityAlert['severity']): string => {
    const colors: Record<CommunityAlert['severity'], string> = {
      informational: '#3B82F6', // blue-500
      warning: '#F59E0B', // amber-500
      critical: '#EF4444', // red-500
    }
    return colors[s]
  }

  const getSeverityIcon = (s: CommunityAlert['severity']): string => {
    const icons: Record<CommunityAlert['severity'], string> = {
      informational: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      critical: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    }
    return icons[s]
  }

  const color = getSeverityColor(severity)
  const iconSvg = getSeverityIcon(severity)

  return L.divIcon({
    className: 'community-alert-marker',
    html: `<div class="community-alert-marker-container" style="--alert-color: ${color}">
      <div class="community-alert-marker-icon">
        ${iconSvg}
      </div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

// Helper to format distance
const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}

// Component to handle map location control
function LocationControl({ onLocationFoundCallback }: { onLocationFoundCallback?: (pos: [number, number]) => void }) {
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
        if (onLocationFoundCallback) {
            onLocationFoundCallback([e.latlng.lat, e.latlng.lng])
        }
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

// Removed useEffect triggering handleLocate on mount to avoid double-firing with parent component logic

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
            "User-Agent": "NeighborPulse/1.0",
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
  const t = useTranslations("map.quickReport")
  const tForm = useTranslations("form")

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
        description: "Thank you for contributing to the community status map!",
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
            <DialogTitle>{t("quickReport.title")}</DialogTitle>
            <DialogDescription>{t("quickReport.description")}</DialogDescription>
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
                  <span>{tForm("statusSection.serviceWorking")}</span>
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
                  <span>{tForm("statusSection.reportIssue")}</span>
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
                  title={tForm("serviceTypeSection.roadBlock")}
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
            </div>

            <div>
              <Textarea
                placeholder={t("quickReport.placeholder")}
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

interface NeighborPulseMapProps {
  className?: string
}

export default function NeighborPulseMap({ className }: NeighborPulseMapProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([])
  const [safeZones, setSafeZones] = useState<SafeZone[]>([])
  const [communityAlerts, setCommunityAlerts] = useState<CommunityAlert[]>([])
  const [alertFilters, setAlertFilters] = useState<{
    severities: CommunityAlert['severity'][]
    maxRadius: number
  }>({
    severities: ['informational', 'warning', 'critical'],
    maxRadius: 10000, // 10km default
  })
  const [safeZoneFilters, setSafeZoneFilters] = useState<SafeZoneFilters>({
    hasPower: undefined,
    hasWater: undefined,
    roadAccessible: undefined,
    categories: undefined,
  })
  const [safeZoneSortBy, setSafeZoneSortBy] = useState<SafeZoneSortOption>('distance')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [sosDialogOpen, setSosDialogOpen] = useState(false)
  const [selectedSafeZone, setSelectedSafeZone] = useState<SafeZone | null>(null)
  const [safeZoneSheetOpen, setSafeZoneSheetOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<CommunityAlert | null>(null)
  const [alertSheetOpen, setAlertSheetOpen] = useState(false)
  const [showSafeZones, setShowSafeZones] = useState(true)
  const [showCommunityAlerts, setShowCommunityAlerts] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations("map")
  const tRoot = useTranslations()

  // Fetch SOS alerts
  const fetchSOSAlerts = useCallback(async () => {
    try {
      const alerts = await listActiveSOSAlerts()
      setSosAlerts(alerts)
    } catch (err) {
      console.error("Error fetching SOS alerts:", err)
    }
  }, [])

  // Fetch safe zones
  const fetchSafeZones = useCallback(async () => {
    if (!position) return
    
    try {
      const zones = await listNearbySafeZones(
        position[0],
        position[1],
        50, // 50km radius
        safeZoneFilters,
        safeZoneSortBy
      )
      setSafeZones(zones)
    } catch (err) {
      console.error("Error fetching safe zones:", err)
    }
  }, [position, safeZoneFilters, safeZoneSortBy])

  // Fetch community alerts
  const fetchCommunityAlerts = useCallback(async () => {
    if (!position) return
    
    try {
      const alertService = new AlertService()
      const alerts = await alertService.getNearbyAlerts(
        position[0],
        position[1],
        alertFilters.maxRadius,
        alertFilters.severities
      )
      setCommunityAlerts(alerts)
    } catch (err) {
      console.error("Error fetching community alerts:", err)
    }
  }, [position, alertFilters])

  useEffect(() => {
    // Get user location once on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          setPosition([latitude, longitude])
        },
        (error) => {
          console.error("Geolocation error:", error.message)
           // Fallback to default location
           setPosition([37.7749, -122.4194])
        },
        { timeout: 10000, enableHighAccuracy: false }
      )
    } else {
       console.log("Geolocation not supported, using default location")
        // Default to a central location (e.g., San Francisco for demo purposes)
       setPosition([37.7749, -122.4194]) 
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
    fetchSOSAlerts()
    fetchSafeZones()
    fetchCommunityAlerts()

    // Set up real-time subscription for locations
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

    // Set up real-time subscription for SOS alerts
    const sosChannel = supabase
      .channel("sos-alerts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sos_alerts",
        },
        () => {
          // Refetch SOS alerts when changes occur
          fetchSOSAlerts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(sosChannel)
    }
  }, [supabase, fetchSOSAlerts, fetchSafeZones])

    // If error (e.g. location denied), we still want to show the map, just with a default view and maybe a toast 
    if (error && !position) {
         // Default location if we really can't get one and haven't set a fallback yet
         setPosition([37.7749, -122.4194])
         // We can clear the error so the map renders
         setError(null)
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
        .safe-zone-marker {
          background: transparent;
          border: none;
        }
        .safe-zone-marker-container {
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .safe-zone-marker-icon {
          position: relative;
          z-index: 1;
          width: 28px;
          height: 28px;
          background: var(--safe-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }
        @keyframes pulse-safe {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse-sos {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes pulse-critical {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes pulse-high {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
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

          <LocationControl onLocationFoundCallback={(pos) => setPosition(pos)} />
          <SearchControl />
          <QuickReportControl />
          <BoundaryLayer />
          
          {/* SOS Button floating on map */}
          <div className="leaflet-top leaflet-left" style={{ zIndex: 1000, margin: "10px" }}>
            <SOSButton onSOSClick={() => setSosDialogOpen(true)} />
          </div>

          {/* Safe Zone Toggle Button */}
          <div className="leaflet-top leaflet-left" style={{ zIndex: 1000, marginTop: "80px", marginLeft: "10px" }}>
            <Button
              variant={showSafeZones ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSafeZones(!showSafeZones)}
              className="flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              {showSafeZones ? tRoot("safeZone.hide") : tRoot("safeZone.show")}
            </Button>
          </div>

          {/* Community Alert Toggle Button */}
          <div className="leaflet-top leaflet-left" style={{ zIndex: 1000, marginTop: showSafeZones ? "120px" : "80px", marginLeft: "10px" }}>
            <Button
              variant={showCommunityAlerts ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCommunityAlerts(!showCommunityAlerts)}
              className="flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              {showCommunityAlerts ? tRoot("communityAlert.hide") : tRoot("communityAlert.show")}
              {communityAlerts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {communityAlerts.filter(a => a.severity === 'critical').length > 0 && (
                    <span className="mr-1 text-red-500">●</span>
                  )}
                  {communityAlerts.length}
                </Badge>
              )}
            </Button>
          </div>

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

          {/* SOS Alert Markers */}
          {sosAlerts.map((alert) => (
            <Marker
              key={alert.id}
              position={[alert.latitude, alert.longitude]}
              icon={SOSIcon(alert.emergency_type, alert.priority)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Siren className="h-3 w-3" />
                      SOS
                    </Badge>
                    <Badge variant="outline">
                      {getEmergencyTypeLabel(alert.emergency_type)}
                    </Badge>
                  </div>
                  
                  <Badge className={`mb-2 ${
                    alert.priority <= 2 
                      ? "bg-red-600" 
                      : alert.priority === 3 
                        ? "bg-orange-500" 
                        : "bg-yellow-500"
                  }`}>
                    {getPriorityLabel(alert.priority)} Priority
                  </Badge>

                  {alert.description && (
                    <p className="text-sm mb-2">{alert.description}</p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Reported {formatDistanceToNow(new Date(alert.created_at))} ago
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Safe Zone Markers */}
          {showSafeZones && safeZones.map((zone) => (
            <Marker
              key={zone.id}
              position={[zone.location.latitude, zone.location.longitude]}
              icon={SafeZoneIcon(zone.category, zone.safetyRating)}
              eventHandlers={{
                click: () => {
                  setSelectedSafeZone(zone)
                  setSafeZoneSheetOpen(true)
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl" aria-hidden="true">
                      {getSafeZoneCategoryIcon(zone.category)}
                    </span>
                    <span className="font-medium">{zone.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge style={{ backgroundColor: getSafetyRatingColor(zone.safetyRating) }}>
                      Safety: {zone.safetyRating}/5
                    </Badge>
                    {zone.roadAccessible && (
                      <Badge variant="outline">Road Accessible</Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    {zone.services.hasPower && <div>✓ Power available</div>}
                    {zone.services.hasWater && <div>✓ Water available</div>}
                    {zone.services.hasShelter && <div>✓ Shelter available</div>}
                  </div>
                  
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedSafeZone(zone)
                      setSafeZoneSheetOpen(true)
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Community Alert Markers */}
          {showCommunityAlerts && communityAlerts.map((alert) => (
            <React.Fragment key={alert.id}>
              <Marker
                position={[alert.latitude, alert.longitude]}
                icon={CommunityAlertIcon(alert.severity)}
                eventHandlers={{
                  click: () => {
                    setSelectedAlert(alert)
                    setAlertSheetOpen(true)
                  },
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      {alert.severity === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                      {alert.severity === 'warning' && <AlertCircle className="h-5 w-5 text-amber-500" />}
                      {alert.severity === 'informational' && <Info className="h-5 w-5 text-blue-500" />}
                      <span className={`font-semibold ${
                        alert.severity === 'critical' ? 'text-red-600' : 
                        alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                      }`}>
                        {alert.title}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>{tRoot("communityAlert.distance")}: {formatDistance(alert.distance || 0)}</p>
                      <p>{tRoot("communityAlert.severity")}: {tRoot(`communityAlert.severity.${alert.severity}`)}</p>
                      <p>{tRoot("communityAlert.reportedAt")}: {new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => {
                        setSelectedAlert(alert)
                        setAlertSheetOpen(true)
                      }}
                    >
                      {tRoot("communityAlert.viewDetails")}
                    </Button>
                  </div>
                </Popup>
              </Marker>
              {/* Alert Radius Circle */}
              <Circle
                center={[alert.latitude, alert.longitude]}
                radius={alert.radius}
                pathOptions={{
                  color: alert.severity === 'critical' ? '#ef4444' : 
                         alert.severity === 'warning' ? '#f59e0b' : '#3b82f6',
                  fillColor: alert.severity === 'critical' ? '#ef4444' : 
                             alert.severity === 'warning' ? '#f59e0b' : '#3b82f6',
                  fillOpacity: 0.05,
                  weight: 2,
                  dashArray: '5, 10',
                }}
              />
            </React.Fragment>
          ))}
        </MapContainer>
      )}
      
      {/* SOS Alert Dialog */}
      <SosAlertDialog 
        open={sosDialogOpen} 
        onOpenChange={setSosDialogOpen} 
        onAlertCreated={fetchSOSAlerts}
      />

      {/* Safe Zone Sheet */}
      <SafeZoneSheet
        safeZone={selectedSafeZone}
        userLatitude={position?.[0]}
        userLongitude={position?.[1]}
        open={safeZoneSheetOpen}
        onOpenChange={setSafeZoneSheetOpen}
      />

      {/* Alert Sheet */}
      <AlertSheet
        alert={selectedAlert}
        open={alertSheetOpen}
        onOpenChange={setAlertSheetOpen}
      />
    </>
  )
}
