/**
 * Safe Zone Sheet Component - ER-002: Safe Zone Locator
 * 
 * Slide-over panel for displaying safe zone details.
 */

"use client"

import type { SafeZone } from "@/lib/services/emergency/safe-zone-service"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  Users,
  Shield,
  Power,
  Droplets,
  Home,
  Zap,
  Wifi,
  Utensils,
  Car,
  Info,
  ExternalLink,
  X,
  Star,
} from "lucide-react"
import {
  SAFE_ZONE_CATEGORIES,
  formatDistance,
  formatTravelTime,
  getSafetyRatingColor,
  isSafeZoneOpen,
  getCapacityPercentage,
  getCapacityStatus,
  countAvailableServices,
} from "@/types/safe-zone"

interface SafeZoneSheetProps {
  safeZone: SafeZone | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate?: (zone: SafeZone) => void
  onCall?: (zone: SafeZone) => void
}

const CATEGORY_SERVICES = {
  hospital: [
    { key: "hasPower", label: "Power", icon: Power },
    { key: "hasWater", label: "Water", icon: Droplets },
    { key: "hasMedical", label: "Medical", icon: Zap },
  ],
  shelter: [
    { key: "hasPower", label: "Power", icon: Power },
    { key: "hasWater", label: "Water", icon: Droplets },
    { key: "hasShelter", label: "Shelter", icon: Home },
    { key: "hasFood", label: "Food", icon: Utensils },
  ],
  "community-center": [
    { key: "hasPower", label: "Power", icon: Power },
    { key: "hasWater", label: "Water", icon: Droplets },
    { key: "hasShelter", label: "Shelter", icon: Home },
    { key: "hasCommunication", label: "WiFi", icon: Wifi },
  ],
  "police-station": [
    { key: "hasPower", label: "Power", icon: Power },
    { key: "hasWater", label: "Water", icon: Droplets },
    { key: "hasCommunication", label: "Communication", icon: Phone },
  ],
  "fire-station": [
    { key: "hasPower", label: "Power", icon: Power },
    { key: "hasWater", label: "Water", icon: Droplets },
    { key: "hasMedical", label: "Medical", icon: Zap },
  ],
  business: [
    { key: "hasPower", label: "Power", icon: Power },
    { key: "hasWater", label: "Water", icon: Droplets },
    { key: "hasFood", label: "Food", icon: Utensils },
  ],
} as const

/**
 * Safe Zone Sheet Component - Slide-over panel
 */
export function SafeZoneSheet({
  safeZone,
  open,
  onOpenChange,
  onNavigate,
  onCall,
}: SafeZoneSheetProps) {
  const t = useTranslations("safeZone")
  const [isNavigating, setIsNavigating] = useState(false)

  // Handle navigation
  const handleNavigate = () => {
    if (safeZone && onNavigate) {
      setIsNavigating(true)
      onNavigate(safeZone)
      setTimeout(() => setIsNavigating(false), 1000)
    }
  }

  // Handle call
  const handleCall = () => {
    if (safeZone && onCall) {
      onCall(safeZone)
    } else if (safeZone?.phone) {
      window.open(`tel:${safeZone.phone}`, "_blank")
    }
  }

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false)
      }
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!safeZone) return null

  const category = SAFE_ZONE_CATEGORIES[safeZone.category]
  const isOpen = isSafeZoneOpen(safeZone)
  const operatingHours = safeZone.operatingHours ? `${safeZone.operatingHours.open} - ${safeZone.operatingHours.close}` : null
  const services = CATEGORY_SERVICES[safeZone.category as keyof typeof CATEGORY_SERVICES] || []
  const availableServices = countAvailableServices(safeZone.services)
  const capacityPercentage = safeZone.capacity ? getCapacityPercentage(safeZone) : null

  // Generate navigation URL for external maps
  const getNavigationUrl = () => {
    const coords = `${safeZone.latitude},${safeZone.longitude}`
    return `https://www.google.com/maps/dir/?api=1&destination=${coords}`
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[400px] overflow-y-auto"
        aria-describedby="safe-zone-description"
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">
                {category?.icon || "🏪"}
              </span>
              <div>
                <SheetTitle className="text-xl">{safeZone.name}</SheetTitle>
                <SheetDescription id="safe-zone-description">
                  {category?.label || safeZone.category}
                </SheetDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              aria-label={t("close")}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </SheetHeader>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            style={{ backgroundColor: getSafetyRatingColor(safeZone.safetyRating) }}
            className="text-white"
          >
            <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
            {t("safetyRating")}: {safeZone.safetyRating}/5
          </Badge>
          <Badge variant={isOpen ? "default" : "secondary"}>
            <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
            {isOpen ? t("openNow") : t("closed")}
          </Badge>
          {safeZone.roadAccessible && (
            <Badge variant="outline">
              <Car className="w-3 h-3 mr-1" aria-hidden="true" />
              {t("roadAccessible")}
            </Badge>
          )}
        </div>

        {/* Location Info */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium">{safeZone.address}</p>
              {safeZone.distance !== undefined && (
                <p className="text-sm text-muted-foreground">
                  {formatDistance(safeZone.distance)}
                  {safeZone.estimatedTravelTime && (
                    <span> ({formatTravelTime(safeZone.estimatedTravelTime)})</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Operating Hours */}
          {operatingHours && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium">{t("hours")}</p>
                <p className="text-sm text-muted-foreground">{operatingHours}</p>
              </div>
            </div>
          )}

          {/* Phone */}
          {safeZone.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium">{t("phone")}</p>
                <a
                  href={`tel:${safeZone.phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {safeZone.phone}
                </a>
              </div>
            </div>
          )}

          {/* Capacity */}
          {capacityPercentage !== null && safeZone.capacity && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{t("capacity")}</p>
                  <span className="text-sm">{getCapacityStatus(capacityPercentage)}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      capacityPercentage >= 80
                        ? "bg-yellow-500"
                        : capacityPercentage >= 100
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {safeZone.capacity.current}/{safeZone.capacity.max} {t("people")}
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Services */}
        <div className="mb-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Power className="w-4 h-4" aria-hidden="true" />
            {t("availableServices")}
            <Badge variant="secondary" className="ml-auto">
              {availableServices}/6
            </Badge>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(services.length > 0 ? services : [
              { key: "hasPower", label: t("services.power"), icon: Power },
              { key: "hasWater", label: t("services.water"), icon: Droplets },
              { key: "hasShelter", label: t("services.shelter"), icon: Home },
              { key: "hasMedical", label: t("services.medical"), icon: Zap },
              { key: "hasCommunication", label: t("services.communication"), icon: Wifi },
              { key: "hasFood", label: t("services.food"), icon: Utensils },
            ]).map((service) => {
              const available = safeZone.services[service.key as keyof typeof safeZone.services]
              return (
                <div
                  key={service.key}
                  className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                    available
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <service.icon className="w-4 h-4" aria-hidden="true" />
                  <span>{service.label}</span>
                  {available && (
                    <Star className="w-3 h-3 ml-auto text-primary" aria-hidden="true" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Description */}
        {safeZone.description && (
          <>
            <Separator className="my-4" />
            <div className="mb-6">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" aria-hidden="true" />
                {t("description")}
              </h3>
              <p className="text-sm text-muted-foreground">{safeZone.description}</p>
            </div>
          </>
        )}

        {/* Last Updated */}
        {safeZone.lastUpdated && (
          <p className="text-xs text-muted-foreground text-center mb-4">
            {t("lastUpdated")}: {new Date(safeZone.lastUpdated).toLocaleString()}
          </p>
        )}

        <Separator className="my-4" />

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Navigate Button */}
          {onNavigate && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleNavigate}
              disabled={isNavigating}
            >
              <Navigation className="w-4 h-4 mr-2" aria-hidden="true" />
              {isNavigating ? t("openingMaps") : t("navigate")}
              <ExternalLink className="w-3 h-3 ml-2" aria-hidden="true" />
            </Button>
          )}

          {/* Call Button */}
          {(onCall || safeZone.phone) && (
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleCall}
            >
              <Phone className="w-4 h-4 mr-2" aria-hidden="true" />
              {t("call")}
            </Button>
          )}

          {/* Alternate Navigate */}
          {!onNavigate && safeZone && (
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => window.open(getNavigationUrl(), "_blank")}
            >
              <Navigation className="w-4 h-4 mr-2" aria-hidden="true" />
              {t("openInMaps")}
              <ExternalLink className="w-3 h-3 ml-2" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Accessibility Note */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          {t("dataMayBeInaccurate")}
        </p>
      </SheetContent>
    </Sheet>
  )
}

export default SafeZoneSheet
