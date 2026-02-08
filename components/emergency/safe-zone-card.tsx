/**
 * Safe Zone Card Component - ER-002: Safe Zone Locator
 * 
 * Displays individual safe zone information with services, distance, and navigation.
 */

"use client"

import type { SafeZone } from "@/lib/services/emergency/safe-zone-service"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTranslations } from "next-intl"
import {
  MapPin,
  Navigation,
  Power,
  Droplets,
  Home,
  Phone,
  Clock,
  Users,
  Shield,
  Zap,
  Wifi,
} from "lucide-react"
import {
  SAFE_ZONE_CATEGORIES,
  formatDistance,
  formatTravelTime,
  getSafetyRatingColor,
  getCapacityPercentage,
  getCapacityStatus,
  isSafeZoneOpen,
  countAvailableServices,
} from "@/types/safe-zone"

interface SafeZoneCardProps {
  safeZone: SafeZone
  onSelect?: (zone: SafeZone) => void
  onNavigate?: (zone: SafeZone) => void
  isSelected?: boolean
}

/**
 * Safe Zone Card Component
 */
export function SafeZoneCard({
  safeZone,
  onSelect,
  onNavigate,
  isSelected = false,
}: SafeZoneCardProps) {
  const t = useTranslations("safeZone")

  const category = SAFE_ZONE_CATEGORIES[safeZone.category]
  const isOpen = isSafeZoneOpen(safeZone)
  const capacityPercentage = getCapacityPercentage(safeZone)
  const availableServices = countAvailableServices(safeZone.services)

  return (
    <Card
      className={`w-full transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-primary shadow-lg"
          : "hover:shadow-md"
      }`}
      role="article"
      aria-label={`${safeZone.name} - ${category?.label || safeZone.category}`}
    >
      {/* Header */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              {category?.icon || "🏪"}
            </span>
            <div>
              <CardTitle className="text-lg font-semibold leading-tight">
                {safeZone.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {category?.label || safeZone.category}
              </p>
            </div>
          </div>
          
          {/* Safety Rating Badge */}
          <Badge
            style={{
              backgroundColor: getSafetyRatingColor(safeZone.safetyRating),
            }}
            className="text-white font-medium"
          >
            <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
            {safeZone.safetyRating}/5
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        {/* Location & Distance */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{safeZone.address}</span>
        </div>

        {safeZone.distance !== undefined && (
          <div className="flex items-center gap-2 text-sm mb-3">
            <Navigation className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="font-medium">
              {formatDistance(safeZone.distance)}
            </span>
            {safeZone.estimatedTravelTime !== undefined && (
              <span className="text-muted-foreground">
                ({formatTravelTime(safeZone.estimatedTravelTime)})
              </span>
            )}
          </div>
        )}

        {/* Open/Closed Status */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={isOpen ? "default" : "secondary"}>
            <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
            {isOpen ? t("openNow") : t("closed")}
          </Badge>
          
          {safeZone.roadAccessible && (
            <Badge variant="outline">
              <Navigation className="w-3 h-3 mr-1" aria-hidden="true" />
              {t("roadAccessible")}
            </Badge>
          )}
        </div>

        <Separator className="my-3" />

        {/* Services Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3" role="list" aria-label={t("availableServices")}>
          {safeZone.services.hasPower && (
            <ServiceBadge
              icon={<Power className="w-3 h-3" aria-hidden="true" />}
              label={t("services.power")}
              role="listitem"
            />
          )}
          {safeZone.services.hasWater && (
            <ServiceBadge
              icon={<Droplets className="w-3 h-3" aria-hidden="true" />}
              label={t("services.water")}
              role="listitem"
            />
          )}
          {safeZone.services.hasShelter && (
            <ServiceBadge
              icon={<Home className="w-3 h-3" aria-hidden="true" />}
              label={t("services.shelter")}
              role="listitem"
            />
          )}
          {safeZone.services.hasMedical && (
            <ServiceBadge
              icon={<Zap className="w-3 h-3" aria-hidden="true" />}
              label={t("services.medical")}
              role="listitem"
            />
          )}
          {safeZone.services.hasCommunication && (
            <ServiceBadge
              icon={<Wifi className="w-3 h-3" aria-hidden="true" />}
              label={t("services.communication")}
              role="listitem"
            />
          )}
          {safeZone.services.hasFood && (
            <ServiceBadge
              icon={<Users className="w-3 h-3" aria-hidden="true" />}
              label={t("services.food")}
              role="listitem"
            />
          )}
        </div>

        {/* Capacity Info */}
        {capacityPercentage !== null && safeZone.capacity && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" aria-hidden="true" />
                {t("capacity")}
              </span>
              <span className="font-medium">
                {getCapacityStatus(capacityPercentage)}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  capacityPercentage >= 80
                    ? "bg-yellow-500"
                    : capacityPercentage >= 100
                    ? "bg-red-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                role="progressbar"
                aria-valuenow={capacityPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Capacity: ${capacityPercentage}%`}
              />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 flex gap-2">
        {/* Select/Details Button */}
        {onSelect && (
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => onSelect(safeZone)}
            aria-pressed={isSelected}
          >
            {isSelected ? t("selected") : t("viewDetails")}
          </Button>
        )}
        
        {/* Navigate Button */}
        {onNavigate && (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onNavigate(safeZone)}
          >
            <Navigation className="w-4 h-4 mr-1" aria-hidden="true" />
            {t("navigate")}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

/**
 * Service Badge Subcomponent
 */
function ServiceBadge({
  icon,
  label,
  role,
}: {
  icon: React.ReactNode
  label: string
  role?: string
}) {
  return (
    <div
      className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md"
      role={role}
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}

export default SafeZoneCard
