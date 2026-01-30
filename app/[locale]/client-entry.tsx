"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import the actual app with no SSR
const HomeClient = dynamic(() => import("@/components/home-client"), {
  ssr: false,
})

export default function ClientEntry() {
  const [mounted, setMounted] = useState(false)

  // Only render the app after the component has mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <HomeClient />
}
