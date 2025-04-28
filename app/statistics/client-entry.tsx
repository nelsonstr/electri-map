"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import the statistics component with no SSR
const StatisticsApp = dynamic(() => import("@/components/statistics-app"), {
  ssr: false,
})

export default function StatisticsClientEntry() {
  const [mounted, setMounted] = useState(false)

  // Only render the app after the component has mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <StatisticsApp />
}
