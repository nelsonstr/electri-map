"use client"

import { Suspense } from "react"
import ElectricityMap from "@/components/electricity-map"
import AddLocationForm from "@/components/add-location-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import LocationsList from "@/components/locations-list"

export default function ElectricityApp() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-2">Electricity Status Map</h1>
        <p className="text-center text-muted-foreground mb-8">Track and share electricity availability in your area</p>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Live Map</CardTitle>
                <CardDescription>View electricity status across different locations</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] w-full relative">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    }
                  >
                    <ElectricityMap />
                  </Suspense>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Your Status</CardTitle>
                <CardDescription>Share your current electricity status to help others</CardDescription>
              </CardHeader>
              <CardContent>
                <AddLocationForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>All Locations</CardTitle>
                <CardDescription>View all reported electricity statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  }
                >
                  <LocationsList />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
