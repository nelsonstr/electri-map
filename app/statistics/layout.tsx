import type React from "react"
import StatisticsClientEntry from "./client-entry"

export default function StatisticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <StatisticsClientEntry />
    </>
  )
}
