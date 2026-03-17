"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Trash2, RefreshCw, AlertCircle, Clock, MapPin } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow, addHours, isPast } from "date-fns"

interface Location {
  id: string
  city: string | null
  country: string | null
  service_type: string
  created_at: string
  expires_at: string | null
  has_electricity: boolean
  comment: string | null
}

export function UserContributions() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const storedId = localStorage.getItem("electri_map_user_id")
    setUserId(storedId)
  }, [])

  const fetchUserLocations = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/locations?user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setLocations(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch locations", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: "renew" | "delete", id: string) => {
    if (!userId) return

    setActionLoading(id)
    try {
      if (action === "delete") {
        const res = await fetch(`/api/locations/manage?id=${id}&user_id=${userId}`, {
            method: "DELETE"
        })
        if (!res.ok) throw new Error("Failed to delete")
        
        setLocations(prev => prev.filter(l => l.id !== id))
        toast({ title: "Report deleted" })

      } else {
        const res = await fetch("/api/locations/manage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "renew", id, user_id: userId }),
        })
        
        if (!res.ok) throw new Error("Failed to renew")
        
        const data = await res.json()
        setLocations(prev => prev.map(l => l.id === id ? { ...l, expires_at: data.expires_at } : l))
        toast({ title: "Report renewed for 24 hours" })
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Action failed", 
        description: "Could not complete the request." 
      })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={fetchUserLocations}
          suppressHydrationWarning
        >
          <Clock className="h-5 w-5" />
          {/* Optional: Indicator dot if user has active items? */}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>My Contributions</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 h-full pb-10">
          {!userId ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>No user identity found.</p>
            </div>
          ) : loading ? (
             <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
              <p>You haven't reported any locations yet.</p>
              <p className="text-sm mt-1">Your reports will appear here.</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-120px)] pr-4">
              <div className="space-y-4">
                {locations.map((location) => {
                  // Calculate time remaining or expired status
                  // Default expiry is usually 24h if not set in older specific logic, but we assume DB has it now.
                  // If null, assume active indefinitely or handle gracefully.
                  const expiryDate = location.expires_at ? new Date(location.expires_at) : addHours(new Date(location.created_at), 24)
                  const isExpired = isPast(expiryDate)
                  
                  return (
                    <div key={location.id} className="border rounded-lg p-4 bg-card">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                             <MapPin className="h-4 w-4 text-muted-foreground" />
                             {location.city || "Unknown Location"}
                             {location.country && <span className="text-xs text-muted-foreground">({location.country})</span>}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {location.service_type} • {location.has_electricity ? "Working" : "Not Working"}
                          </p>
                        </div>
                        {isExpired && (
                           <span className="text-xs font-bold text-destructive border border-destructive px-2 py-0.5 rounded-full">
                             Expired
                           </span>
                        )}
                      </div>
                      
                      {location.comment && (
                        <p className="text-sm bg-muted/50 p-2 rounded-md mb-3 italic">
                          "{location.comment}"
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
                         <span>
                           Expires {formatDistanceToNow(expiryDate, { addSuffix: true })}
                         </span>
                         
                         <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 gap-1"
                              disabled={!!actionLoading}
                              onClick={() => handleAction("renew", location.id)}
                            >
                               {actionLoading === location.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3" />}
                               Renew (+24h)
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="h-8 px-2"
                              disabled={!!actionLoading}
                              onClick={() => handleAction("delete", location.id)}
                            >
                               {actionLoading === location.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3" />}
                            </Button>
                         </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
