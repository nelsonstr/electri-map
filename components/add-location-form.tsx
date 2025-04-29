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
import { Loader2, MapPin, Zap, ZapOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const LocationPickerMap = dynamic(() => import("./location-picker-map"), { ssr: false })

const formSchema = z.object({
  has_electricity: z.boolean().default(true),
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
      has_electricity: true,
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
    } else {
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
      })
    }
  }, [form, toast])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)

    try {
      const locationInfo = await getLocationInfo(values.latitude, values.longitude)

      const { error } = await supabase.from("locations").insert({
        latitude: values.latitude,
        longitude: values.longitude,
        has_electricity: values.has_electricity,
        comment: values.comment || null,
        city: locationInfo.city,
        country: locationInfo.country,
      })

      if (error) throw error

      toast({
        title: "Status reported successfully",
        description: "Thank you for contributing to the electricity status map!",
      })

      form.reset({
        has_electricity: true,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Electricity Status Selection */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant={form.watch("has_electricity") ? "default" : "outline"}
            className={`h-24 ${form.watch("has_electricity") ? "bg-green-500 hover:bg-green-600" : ""}`}
            onClick={() => form.setValue("has_electricity", true)}
          >
            <div className="flex flex-col items-center">
              <Zap className="h-8 w-8 mb-2" />
              <span>I have electricity</span>
            </div>
          </Button>

          <Button
            type="button"
            variant={!form.watch("has_electricity") ? "destructive" : "outline"}
            className="h-24"
            onClick={() => form.setValue("has_electricity", false)}
          >
            <div className="flex flex-col items-center">
              <ZapOff className="h-8 w-8 mb-2" />
              <span>No electricity</span>
            </div>
          </Button>
        </div>

        {/* Location Selection */}
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue="map" onValueChange={(value) => setLocationMethod(value as "auto" | "map")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="auto">Use My Location</TabsTrigger>
                <TabsTrigger value="map">Select on Map</TabsTrigger>
              </TabsList>

              <TabsContent value="auto" className="space-y-4">
                <div className="flex items-center justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (navigator.geolocation) {
                        try {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const { latitude, longitude } = position.coords
                              form.setValue("latitude", latitude)
                              form.setValue("longitude", longitude)
                              setMapPosition([latitude, longitude])
                              toast({
                                title: "Location updated",
                                description: "Your current location has been detected.",
                              })
                            },
                            (error) => {
                              console.log("Geolocation error:", error.message)
                              toast({
                                variant: "destructive",
                                title: "Location error",
                                description: "Could not get your location. Please use the map selection method.",
                              })
                            },
                            { timeout: 10000, enableHighAccuracy: false },
                          )
                        } catch (error) {
                          console.log("Geolocation exception:", error)
                          toast({
                            variant: "destructive",
                            title: "Location error",
                            description: "Could not access location services. Please use the map selection method.",
                          })
                        }
                      } else {
                        toast({
                          variant: "destructive",
                          title: "Location not supported",
                          description:
                            "Your browser does not support geolocation. Please use the map selection method.",
                        })
                      }
                    }}
                    className="w-full py-6"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Detect My Current Location
                  </Button>
                </div>

                {mapPosition && (
                  <div className="text-center text-sm text-muted-foreground">
                    Location detected: {mapPosition[0].toFixed(6)}, {mapPosition[1].toFixed(6)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="map">
                <div className="h-[300px] w-full mb-4 rounded-md overflow-hidden border">
                  {/* Render map only when position is available */}
                  {mapPosition && (
                    <LocationPickerMap initialPosition={mapPosition} onPositionChange={handleMapPositionChange} />
                  )}
                </div>
                <div className="text-center text-sm text-muted-foreground">Drag the marker to your exact location</div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground mt-2">
          If location detection doesn't work, you can manually select your location on the map.
        </div>

        {/* Hidden form fields for latitude and longitude */}
        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => <input type="hidden" {...field} value={field.value} />}
        />

        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => <input type="hidden" {...field} value={field.value} />}
        />

        {/* Comment field */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional information about the electricity status in your area..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Max 150 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Report Status
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
