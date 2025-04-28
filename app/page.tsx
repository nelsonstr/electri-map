export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-4">Electricity Status Map</h1>
        <p className="text-lg text-muted-foreground mb-8">Loading application...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  )
}
