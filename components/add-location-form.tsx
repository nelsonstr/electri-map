"use client"
import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Loader2, MapPin, Zap, ZapOff, Wifi, Droplets, Smartphone, AlertTriangle, Flame } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const LocationPickerMap = dynamic(() => import("./location-picker-map"), {
  loading: () => <div className="h-[300px] w-full bg-muted animate-pulse rounded-md" />,
  ssr: false,
})

const formSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  has_electricity: z.boolean(),
  service_type: z.array(z.enum(["electrical", "communication", "water", "mobile", "road-block", "gas"])).min(1, {
    message: "You must select at least one service type.",
  }),
  comment: z
    .string()
    .max(500, {
      message: "Comment must not be longer than 500 characters",
    })
    .optional(),
  user_id: z.string().optional(),
})

const serviceTypeIcons = {
  electrical: Zap,
  communication: Wifi,
  water: Droplets,
  mobile: Smartphone,
  "road-block": AlertTriangle,
  gas: Flame
} as const;

export default function AddLocationForm() {
  const t = useTranslations('form')
  const [loading, setLoading] = useState(false)
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Generate or retrieve anonymous user ID
  useEffect(() => {
    let userId = localStorage.getItem('electri_map_user_id')
    if (!userId) {
      userId = crypto.randomUUID()
      localStorage.setItem('electri_map_user_id', userId)
    }
    form.setValue('user_id', userId)
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      has_electricity: false,
      service_type: ["electrical"],
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

  // Function to handle geolocation request
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
      })
      return
    }

    setLoading(true) // Re-using loading state or we could add a specific one for location
    toast({ description: "Requesting location access..." })

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        form.setValue("latitude", latitude)
        form.setValue("longitude", longitude)
        setMapPosition([latitude, longitude])
        setLoading(false)
        toast({ title: "Location updated" })
      },
      (error) => {
        console.log("Geolocation error:", error.message)
        setLoading(false)
        let errorMessage = "Could not access your location."
        if (error.code === 1) errorMessage = "Location permission denied. Please enable it in settings."
        else if (error.code === 2) errorMessage = "Location unavailable."
        else if (error.code === 3) errorMessage = "Location request timed out."
        
        toast({
          variant: "destructive",
          title: "Location error",
          description: errorMessage,
        })
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }



  const isSubmittingRef = useRef(false)

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Prevent duplicate submissions via rapid clicks
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

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

      const inserts = values.service_type.map((type) => ({
        latitude: values.latitude,
        longitude: values.longitude,
        has_electricity: values.has_electricity,
        service_type: type,
        comment: values.comment || null,
        city: locationInfo.city,
        country: locationInfo.country,
        user_id: values.user_id,
      }))

      const { error } = await supabase.from("locations").insert(inserts)

      if (error) throw error
      
      // Record successful submission timestamp
      recentSubmissions.push(now)
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recentSubmissions))

      const count = inserts.length
      toast({
        title: count > 1 ? `${count} reports submitted successfully` : "Status reported successfully",
        description: "Thank you for contributing to the services status map!",
        variant: "default",
        className: "bg-green-500 text-white border-none"
      })

      form.reset({
        has_electricity: values.has_electricity,
        service_type: ["electrical"],
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
      isSubmittingRef.current = false
    }
  }

  // Update form values when map position changes
  const handleMapPositionChange = (position: [number, number]) => {
    form.setValue("latitude", position[0])
    form.setValue("longitude", position[1])
    setMapPosition(position)
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
                  {t("statusSection.serviceWorking")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("statusSection.serviceWorkingDesc")}</p>
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
                  {t("statusSection.reportIssue")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("statusSection.reportIssueDesc")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Type Selection */}
        <div className="space-y-3">
          <FormLabel>{t("serviceTypeSection.title")}</FormLabel>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "electrical", icon: Zap, label: t("serviceTypeSection.electrical") },
              { id: "communication", icon: Wifi, label: t("serviceTypeSection.communication") },
              { id: "water", icon: Droplets, label: t("serviceTypeSection.water") },
              { id: "mobile", icon: Smartphone, label: t("serviceTypeSection.mobile") },
              { id: "road-block", icon: AlertTriangle, label: t("serviceTypeSection.roadBlock") },
              { id: "gas", icon: Flame, label: "Gas" } // Using string temporarily if translation missing
            ].map((service) => {
              const isSelected = form.watch("service_type").includes(service.id as any);
              return (
                <Button
                  key={service.id}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className={`h-20 flex flex-col gap-1 ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
                  onClick={() => {
                    const current = form.getValues("service_type");
                    const updated = current.includes(service.id as any)
                      ? current.filter((t) => t !== service.id)
                      : [...current, service.id as any];
                    // Ensure at least one is selected? zod validation handles submit, but let's allow deselect all in UI for flexibility
                    form.setValue("service_type", updated as any, { shouldValidate: true });
                  }}
                >
                  <service.icon className="h-5 w-5" />
                  <span className="text-xs">{service.label}</span>
                </Button>
              );
            })}
          </div>
          <FormMessage>
            {form.formState.errors.service_type?.message}
          </FormMessage>
        </div>
{/* Comment field */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium uppercase tracking-wide text-muted-foreground ml-1">{t('commentSection.title')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('commentSection.placeholder')}
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
              {t('submitting')}
            </>
          ) : (
            <>
              {form.watch("has_electricity") ? t('submitWorking') : t('submitIssue')}
            </>
          )}
        </Button>
        
        {/* Location Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-sm font-medium uppercase tracking-wide text-muted-foreground ml-1">
              {t('locationSection.title')}
            </FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={detectLocation}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
              )}
              {t('locationSection.useCurrentLocation')}
            </Button>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 h-[300px]">
            {/* Map is always visible now */}
            {/* Map is always visible now */}
            <div className="absolute inset-0 z-0">
               <LocationPickerMap
                initialPosition={mapPosition || [38.736946, -9.142685]} // Default to Lisbon if unknown
                onPositionChange={handleMapPositionChange}
                zoom={13}
                showMarker={true}
               />
            </div>

            {/* Hint for Map */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-black/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border text-xs font-medium z-[400] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
               {t('locationSection.dragMarkerHint')}
            </div>
          </div>
        </div>

        
      </form>
    </Form>
  )
}
