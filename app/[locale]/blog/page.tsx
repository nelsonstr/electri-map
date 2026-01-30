"use client"

import React from "react"
import { useTranslations } from 'next-intl'
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

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

export default function BlogPage() {
    const t = useTranslations('blog')
    
    const postKeys = ['lighting', 'preserveFoodWater', 'stayInformed', 'conserveBattery', 'backupPower', 'stayComfortable', 'medicalNeeds']

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="container mx-auto px-4 py-16 md:py-24">
                <PageHeader 
                  title={t('title')} 
                  subtitle={t('subtitle')} 
                />

                <motion.div 
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    {postKeys.map((key, index) => (
                        <motion.div key={key} variants={item} className={index === 0 ? "md:col-span-2 lg:col-span-2" : ""}>
                            <Card className={`h-full border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col ${index === 0 ? "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900 border-2 border-primary/10" : "bg-white dark:bg-slate-900"}`}>
                                <div className={`relative ${index === 0 ? "h-64" : "h-48"} bg-slate-200 dark:bg-slate-800 animate-pulse`}>
                                   {/* Placeholder for blog image - using a gradient pattern for now */}
                                   <div className={`absolute inset-0 bg-gradient-to-br ${index === 0 ? "from-blue-500/20 to-purple-500/20" : "from-slate-500/10 to-slate-400/10"}`} />
                                   <div className="absolute top-4 left-4">
                                       <Badge variant="secondary" className="bg-white/90 dark:bg-black/50 backdrop-blur-md">
                                           Guide
                                       </Badge>
                                   </div>
                                </div>
                                <CardHeader>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>Oct {10 + index}, 2025</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{3 + (index % 5)} min read</span>
                                        </div>
                                    </div>
                                    <CardTitle className={`leading-tight ${index === 0 ? "text-2xl md:text-3xl" : "text-xl"}`}>
                                        {t(`posts.${key}.title`)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className={`text-muted-foreground ${index === 0 ? "text-lg" : "text-base line-clamp-3"}`}>
                                        {t(`posts.${key}.excerpt`)}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Link href={`/blog/${t(`posts.${key}.slug`)}`} className="w-full">
                                        <div className="flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all group">
                                            {t('readMore')} 
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </main>
    )
} 
