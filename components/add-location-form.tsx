"use client"
// @ts-nocheck

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Loader2, MapPin, Zap, ZapOff, Wifi, Droplets, Smartphone, AlertTriangle, Flame } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const LocationPickerMap = dynamic(() => import("./location-picker-map"), { ssr: false })

const formSchema = z.object({
  has_electricity: z.boolean().default(false),
  service_type: z.enum(["electrical", "communication", "water", "mobile", "road-block", "gas"]).default("electrical"),
  comment: z
    .string()
    .max(150, {
      message: "Comment must not be longer than 500 characters",
    })
    .optional(),
  latitude: z.number(),
  longitude: z.number(),
})

export default function AddLocationForm() {
  const [loading, setLoading] = useState(false)
  const [locationMethod, setLocationMethod] = useState<"auto" | "map">("map")
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      has_electricity: false,
      service_type: "electrical",
      comment: "",
      latitude: 0,
      longitude: 0,
    },
  })

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

  // Auto-detect user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          form.setValue("latitude", latitude)
          form.setValue("longitude", longitude)
          setMapPosition([latitude, longitude])
        },
        (error) => {
          console.log("Geolocation error:", error.message)
          toast({
            variant: "destructive",
            title: "Location error",
            description: "Could not access your location. You can select on the map.",
          })
        },
        { timeout: 10000, enableHighAccuracy: false }
      )
    }
  }, [form, toast])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Rate limiting: Check if user has submitted more than 2 times in the last 3 minutes
    const RATE_LIMIT_KEY = 'location_submissions'
    const MAX_SUBMISSIONS = 2
    const TIME_WINDOW_MS = 3 * 60 * 1000 // 3 minutes in milliseconds
    
    try {
      const now = Date.now()
      const submissionsJSON = localStorage.getItem(RATE_LIMIT_KEY)
      const submissions: number[] = submissionsJSON ? JSON.parse(submissionsJSON) : []
      
      // Filter out submissions older than 3 minutes
      const recentSubmissions = submissions.filter(timestamp => now - timestamp < TIME_WINDOW_MS)
      
      // Check if user has exceeded the rate limit
      if (recentSubmissions.length >= MAX_SUBMISSIONS) {
        const oldestSubmission = Math.min(...recentSubmissions)
        const waitTimeMs = TIME_WINDOW_MS - (now - oldestSubmission)
        const waitMinutes = Math.ceil(waitTimeMs / 60000)
        
        toast({
          variant: "destructive",
          title: "Rate limit exceeded",
          description: `You can only submit ${MAX_SUBMISSIONS} reports every 3 minutes. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before submitting again.`,
        })
        return
      }
      
      setLoading(true)
      
      const locationInfo = await getLocationInfo(values.latitude, values.longitude)

      const { error } = await supabase.from("locations").insert({
        latitude: values.latitude,
        longitude: values.longitude,
        has_electricity: values.has_electricity,
        service_type: values.service_type,
        comment: values.comment || null,
        city: locationInfo.city,
        country: locationInfo.country,
      })

      if (error) throw error
      
      // Record successful submission timestamp
      recentSubmissions.push(now)
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recentSubmissions))

      toast({
        title: "Status reported successfully",
        description: "Thank you for contributing to the services status map!",
      })

      form.reset({
        has_electricity: values.has_electricity,
        service_type: values.service_type,
        comment: "",
        latitude: values.latitude,
        longitude: values.longitude,
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        variant: "destructive",
        title: "Error reporting status",
        description: "There was a problem submitting your report. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update form values when map position changes
  const handleMapPositionChange = (position: [number, number]) => {
    form.setValue("latitude", position[0])
    form.setValue("longitude", position[1])
    setMapPosition(position)
  }

  const serviceTypeIcons = {
    electrical: Zap,
    communication: Wifi,
    water: Droplets,
    mobile: Smartphone,
    "road-block": AlertTriangle,
    gas: Flame
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-6">
          <div
            onClick={() => form.setValue("has_electricity", true)}
            className={`
              cursor-pointer relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ease-out
              ${form.watch("has_electricity")
                ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-emerald-200 dark:hover:border-emerald-900"}
            `}
          >
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className={`
                p-3 rounded-full transition-colors duration-300
                ${form.watch("has_electricity") ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}
              `}>
                <Zap className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className={`font-semibold ${form.watch("has_electricity") ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"}`}>
                  Service Working
                </h3>
                <p className="text-xs text-muted-foreground">Service is available and working</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => form.setValue("has_electricity", false)}
            className={`
              cursor-pointer relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ease-out
              ${!form.watch("has_electricity")
                ? "border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.3)]" 
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-rose-200 dark:hover:border-rose-900"}
            `}
          >
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-3">
               <div className={`
                p-3 rounded-full transition-colors duration-300
                ${!form.watch("has_electricity") ? "bg-rose-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}
              `}>
                <ZapOff className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className={`font-semibold ${!form.watch("has_electricity") ? "text-rose-700 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}>
                  Report Issue
                </h3>
                <p className="text-xs text-muted-foreground">Service outage or disruption</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Type Selection */}
        <div className="space-y-4">
          <FormLabel className="text-sm font-medium uppercase tracking-wide text-muted-foreground ml-1">
            Service Category
          </FormLabel>
          <div className="grid grid-cols-3 gap-3">
            {(["electrical", "communication", "water", "mobile", "road-block", "gas"] as const).map((type) => {
              const Icon = serviceTypeIcons[type]
              const isSelected = form.watch("service_type") === type
              const isActive = form.watch("has_electricity")
              
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => form.setValue("service_type", type)}
                  className={`
                    group flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                    ${isSelected 
                      ? isActive 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium shadow-sm"
                        : "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-medium shadow-sm"
                      : "border-transparent bg-slate-50 dark:bg-slate-900 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    }
                  `}
                >
                  <Icon className={`h-6 w-6 mb-2 transition-transform duration-200 ${isSelected ? "scale-110" : "group-hover:scale-110"}`} />
                  <span className="text-[10px] capitalize leading-tight">{type.replace("-", " ")}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Location Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-sm font-medium uppercase tracking-wide text-muted-foreground ml-1">
              Location
            </FormLabel>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              <button
                 type="button"
                 onClick={() => setLocationMethod("auto")}
                 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${locationMethod === "auto" ? "bg-white dark:bg-slate-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Auto-Detect
              </button>
              <button
                 type="button"
                 onClick={() => setLocationMethod("map")}
                 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${locationMethod === "map" ? "bg-white dark:bg-slate-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Select on Map
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 h-[300px]">
            {/* Map is always visible now */}
            <div className="absolute inset-0 z-0">
               {mapPosition && (
                 <LocationPickerMap 
                    initialPosition={mapPosition} 
                    onPositionChange={handleMapPositionChange} 
                    zoom={locationMethod === "auto" ? 18 : 13}
                    showMarker={locationMethod !== "auto"}
                 />
               )}
            </div>

            {/* Overlay for Auto-Detect Mode */}
            {locationMethod === "auto" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center animate-in fade-in duration-300 pointer-events-none">
                <div className="bg-white/85 dark:bg-slate-900/85 p-6 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 max-w-sm mx-4 transform transition-all pointer-events-auto">
                  <div className="bg-blue-500/10 p-3 rounded-full mb-3 w-fit mx-auto">
                    <MapPin className="h-6 w-6 text-blue-500" />
                  </div>
                  <h4 className="font-semibold mb-1">Using Current Location</h4>
                  {mapPosition ? (
                     <p className="text-xs text-muted-foreground font-mono bg-white/50 dark:bg-slate-950/50 px-2 py-1 rounded-md mt-1 mb-3">
                       {mapPosition[0].toFixed(6)}, {mapPosition[1].toFixed(6)}
                     </p>
                  ) : (
                    <div className="flex items-center justify-center gap-2 mt-2 mb-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Detecting coordinates...
                    </div>
                  )}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-xs w-full"
                    onClick={() => {
                       setMapPosition(null);
                       if (navigator.geolocation) {
                         navigator.geolocation.getCurrentPosition(
                           ({ coords: { latitude, longitude } }) => {
                             form.setValue("latitude", latitude)
                             form.setValue("longitude", longitude)
                             setMapPosition([latitude, longitude])
                             toast({ title: "Location updated" })
                           }
                         )
                       }
                    }}
                  >
                    Refresh Location
                  </Button>
                </div>
              </div>
            )}

            {/* Hint for Map Mode */}
            {locationMethod === "map" && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-black/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border text-xs font-medium z-[400] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  Drag marker to adjust
                </div>
            )}
          </div>
        </div>

        {/* Comment field */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium uppercase tracking-wide text-muted-foreground ml-1">Additional Details</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the issue or situation..."
                  className="resize-none min-h-[100px] rounded-xl border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-slate-600 focus:ring-slate-400/20"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-right text-xs">{field.value?.length || 0}/150</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={loading}
          className={`
            w-full h-14 text-lg font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]
            ${form.watch("has_electricity")
              ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/20 text-white" 
              : "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/20 text-white"}
          `}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting Report...
            </>
          ) : (
            <>
              {form.watch("has_electricity") ? "Confirm Service Working" : "Submit Issue Report"}
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
