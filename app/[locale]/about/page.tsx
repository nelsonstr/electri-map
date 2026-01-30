"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { motion } from "framer-motion"
import { Shield, Activity, Users, Zap, Radio, Database, Bell, Map as MapIcon, HeartHandshake } from "lucide-react"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function AboutPage() {
  const t = useTranslations('about')

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-16 md:py-24 space-y-16">
        
        <PageHeader 
          title={t('title')} 
          subtitle={t('description')} 
        />

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          <motion.div variants={item}>
            <Card className="h-full border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:translate-y-[-4px] transition-transform duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                  <Activity className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{t('mission.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{t('mission.content')}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="h-full border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:translate-y-[-4px] transition-transform duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                  <MapIcon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{t('howItWorks.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{t('howItWorks.content')}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="h-full border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:translate-y-[-4px] transition-transform duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{t('privacy.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{t('privacy.content')}</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
            <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  <span>Community Driven</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">{t('getInvolved.title')}</h2>
                <p className="text-lg text-muted-foreground">{t('getInvolved.content')}</p>
                <ul className="grid gap-3">
                  {[
                    t('getInvolved.items.report'),
                    t('getInvolved.items.share'),
                    t('getInvolved.items.feedback'),
                    t('getInvolved.items.volunteer')
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted-foreground">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-64 md:h-full min-h-[300px] rounded-2xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                 <HeartHandshake className="h-32 w-32 text-indigo-300 dark:text-indigo-700/50" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">{t('futureUpdates.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('futureUpdates.description')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             {[
               { icon: Bell, key: 'plannedMaintenance', color: 'text-amber-500' },
               { icon: Radio, key: 'iotIntegration', color: 'text-cyan-500' },
               { icon: Database, key: 'historicalData', color: 'text-rose-500' },
               { icon: Zap, key: 'aiPrediction', color: 'text-yellow-500' },
             ].map(({ icon: Icon, key, color }) => (
               <Card key={key} className="border-none bg-slate-100 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                 <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                   <Icon className={`h-8 w-8 ${color}`} />
                   <p className="font-medium">{t(`futureUpdates.items.${key}`)}</p>
                 </CardContent>
               </Card>
             ))}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
