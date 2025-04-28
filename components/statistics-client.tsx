"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Zap, ZapOff, MapPin } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

type Location = {
  id: string
  latitude: number
  longitude: number
  has_electricity: boolean
  comment: string | null
  created_at: string
}

type RegionStats = {
  name: string
  total: number
  withElectricity: number
  withoutElectricity: number
  percentage: number
}

export default function StatisticsClient() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regionStats, setRegionStats] = useState<RegionStats[]>([])
  const [overallStats, setOverallStats] = useState({
    total: 0,
    withElectricity: 0,
    withoutElectricity: 0,
    percentage: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase.from("locations").select("*")

        if (error) throw error

        setLocations(data || [])
        processStatistics(data || [])
        setLoading(false)
      } catch (err) {
        console.error("Error fetching locations:", err)
        setError("Failed to load statistics. Please try again later.")
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  const processStatistics = (locations: Location[]) => {
    // Calculate overall statistics
    const total = locations.length
    const withElectricity = locations.filter((loc) => loc.has_electricity).length
    const withoutElectricity = total - withElectricity
    const percentage = total > 0 ? (withElectricity / total) * 100 : 0

    setOverallStats({
      total,
      withElectricity,
      withoutElectricity,
      percentage,
    })

    // Group locations by region (simplified by rounding coordinates)
    const regions: Record<string, Location[]> = {}

    locations.forEach((location) => {
      // Round coordinates to create region groups (approximately city-level)
      const roundedLat = Math.round(location.latitude * 10) / 10
      const roundedLng = Math.round(location.longitude * 10) / 10
      const regionKey = `${roundedLat},${roundedLng}`

      if (!regions[regionKey]) {
        regions[regionKey] = []
      }

      regions[regionKey].push(location)
    })

    // Calculate statistics for each region
    const stats: RegionStats[] = Object.entries(regions).map(([key, locs]) => {
      const [lat, lng] = key.split(",").map(Number)
      const total = locs.length
      const withElectricity = locs.filter((loc) => loc.has_electricity).length
      const withoutElectricity = total - withElectricity
      const percentage = (withElectricity / total) * 100

      return {
        name: `Area around ${lat.toFixed(1)}, ${lng.toFixed(1)}`,
        total,
        withElectricity,
        withoutElectricity,
        percentage,
      }
    })

    // Sort regions by total reports
    stats.sort((a, b) => b.total - a.total)

    setRegionStats(stats)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-2">Electricity Statistics</h1>
      <p className="text-center text-muted-foreground mb-8">Analysis of electricity availability by region</p>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{overallStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-green-500 flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              With Electricity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{overallStats.withElectricity}</div>
            <div className="text-muted-foreground">{overallStats.percentage.toFixed(1)}% of total</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-red-500 flex items-center">
              <ZapOff className="mr-2 h-5 w-5" />
              Without Electricity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{overallStats.withoutElectricity}</div>
            <div className="text-muted-foreground">{(100 - overallStats.percentage).toFixed(1)}% of total</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="regions">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="regions">By Region</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="regions">
          <Card>
            <CardHeader>
              <CardTitle>Electricity Status by Region</CardTitle>
              <CardDescription>Regions with the most reports are shown first</CardDescription>
            </CardHeader>
            <CardContent>
              {regionStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              ) : (
                <div className="space-y-6">
                  {regionStats.map((region, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{region.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{region.total} reports</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Progress value={region.percentage} className="h-2" />
                        <span className="text-sm font-medium">{region.percentage.toFixed(1)}%</span>
                      </div>

                      <div className="grid grid-cols-2 text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span>{region.withElectricity} with electricity</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span>{region.withoutElectricity} without electricity</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Electricity Status Timeline</CardTitle>
              <CardDescription>Changes in electricity status over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Timeline visualization will be available in the next update
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
