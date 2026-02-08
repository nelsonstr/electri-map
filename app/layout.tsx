import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NeighborPulse | Your Community's Living Pulse",
  description: "Real-time crowdsourced reporting of services, utilities, and infrastructure status in your area. Your Community's Living Pulse.",
  icons: {
    icon: '/ico2.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {  
  return (
    <html suppressHydrationWarning data-gramm="false">
      <body className={inter.className} suppressHydrationWarning data-gramm="false">
        {children}
      </body>
    </html>
  )
}
