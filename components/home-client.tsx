"use client"

import { Suspense } from "react"
import { useTranslations } from 'next-intl'
import NeighborPulseMap from "@/components/neighbor-pulse-map"
import AddLocationForm from "@/components/add-location-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Map as MapIcon, List, Activity } from "lucide-react"
import LocationsList from "@/components/locations-list"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/ui/page-header"

export default function HomeClient() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 md:py-16 space-y-12">
        <PageHeader 
          title={t('title')} 
          subtitle={t('subtitle')} 
          className="max-w-4xl mx-auto"
        />

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Tabs defaultValue="map" className="w-full space-y-8">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 shadow-inner rounded-full h-14">
                <TabsTrigger 
                  value="map" 
                  className="rounded-full h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md transition-all text-base font-medium"
                >
                  <MapIcon className="w-4 h-4 mr-2" />
                  {t('tabs.map')}
                </TabsTrigger>
                <TabsTrigger 
                  value="list" 
                  className="rounded-full h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md transition-all text-base font-medium"
                >
                  <List className="w-4 h-4 mr-2" />
                  {t('tabs.list')}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="map" className="space-y-8 animate-in fade-in-0 duration-500 slide-in-from-bottom-4">
              <div className="grid lg:grid-cols-2 gap-8">
                
                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden h-full">
                  <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b">
                     <div className="flex items-center gap-2">
                       <Activity className="w-5 h-5 text-green-500" />
                       <CardTitle>{t('cards.reportStatus.title')}</CardTitle>
                     </div>
                    <CardDescription>{t('cards.reportStatus.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <AddLocationForm />
                  </CardContent>
                </Card>
                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden rounded-3xl h-full flex flex-col min-h-[600px]">
                  <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b">
                     <div className="flex items-center gap-2">
                       <MapIcon className="w-5 h-5 text-blue-500" />
                       <CardTitle>{t('cards.liveMap.title')}</CardTitle>
                     </div>
                     <CardDescription>{t('cards.liveMap.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 relative">
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900/50">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      }
                    >
                      <NeighborPulseMap className="h-full w-full absolute inset-0" />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="list" className="animate-in fade-in-0 duration-500 slide-in-from-bottom-4">
              <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b">
                   <div className="flex items-center gap-2">
                     <List className="w-5 h-5 text-purple-500" />
                     <CardTitle>{t('cards.allLocations.title')}</CardTitle>
                   </div>
                  <CardDescription>{t('cards.allLocations.description')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    }
                  >
                    <LocationsList />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </main>
  )
}
