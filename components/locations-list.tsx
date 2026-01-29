"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Zap, ZapOff, Loader2, MapPin, Wifi, Droplets, Smartphone, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

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

export default function LocationsList() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase.from("locations").select("*").order("created_at", { ascending: false })

        if (error) throw error

        // Data already includes city and country from database
        const locationsData = (data || []) as Location[]
        // Sort by created_at descending (most recent first)
        locationsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setLocations(locationsData)
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
      .channel("locations-list-changes")
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
            // New record includes city and country
            setLocations((prev) => [newLocation, ...prev])
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredLocations = locations.filter(
    (location) =>
      location.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      !searchTerm,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

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
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Search by location or comment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <div className="absolute left-3 top-2.5 text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
        </div>
      </div>

      {filteredLocations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No locations found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLocations.map((location) => (
            <div key={location.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">

                  {/* Dynamic Status Badge */}
                  {(() => {
                    const isWorking = location.has_electricity
                    const type = location.service_type || "electrical"
                    
                    // Icon mapping
                    const getIcon = (type: string) => {
                       switch(type) {
                         case 'water': return <Droplets className="h-3 w-3 mr-1" />
                         case 'communication': return <Wifi className="h-3 w-3 mr-1" />
                         case 'mobile': return <Smartphone className="h-3 w-3 mr-1" />
                         case 'road-block': return <AlertTriangle className="h-3 w-3 mr-1" />
                         default: return isWorking ? <Zap className="h-3 w-3 mr-1" /> : <ZapOff className="h-3 w-3 mr-1" />
                       }
                    }

                    const getLabel = (type: string, working: boolean) => {
                      if (working) return "Service Working"
                      
                      switch(type) {
                        case 'water': return "Water Issue"
                        case 'communication': return "Internet/Comm Issue"
                        case 'mobile': return "Mobile Network Issue"
                        case 'road-block': return "Road Blockage"
                        default: return "Power Outage"
                      }
                    }
                    
                    return (
                      <Badge className={isWorking ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"}>
                        {getIcon(type)}
                        {getLabel(type, isWorking)}
                      </Badge>
                    )
                  })()}
                  
                  {/* Service Type Badge (if not electrical) */}
                  {location.service_type && location.service_type !== "electrical" && (
                    <Badge variant="outline" className="capitalize text-[10px] h-5 px-2 text-muted-foreground border-slate-300 dark:border-slate-700">
                      {location.service_type.replace("-", " ")}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(location.created_at))} ago
                </span>
              </div>

              {location.comment && <p className="text-sm mb-3">{location.comment}</p>}

              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="font-medium">
                  {location.city}, {location.country}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
