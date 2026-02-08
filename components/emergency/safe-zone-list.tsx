/**
 * Safe Zone List Component - ER-002: Safe Zone Locator
 * 
 * Displays a list of nearby safe zones with filtering and sorting options.
 */

"use client"

import type { SafeZone, SafeZoneFilters, SafeZoneSortOption, SafeZoneCategory } from "@/lib/services/emergency/safe-zone-service"
import { useState, useCallback, useMemo } from "react"
import { useTranslations } from "next-intl"
import { SafeZoneCard } from "./safe-zone-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  Filter,
  SortAsc,
  SortDesc,
  MapPin,
  Power,
  Droplets,
  Navigation,
  RefreshCw,
  List,
  Map,
  X,
} from "lucide-react"
import { SAFE_ZONE_CATEGORIES } from "@/types/safe-zone"

interface SafeZoneListProps {
  safeZones: SafeZone[]
  onSelectZone?: (zone: SafeZone) => void
  onNavigate?: (zone: SafeZone) => void
  selectedZoneId?: string
  userLatitude?: number
  userLongitude?: number
  isLoading?: boolean
  onRefresh?: () => void
  className?: string
}

/**
 * Safe Zone List Component with filters and sorting
 */
export function SafeZoneList({
  safeZones,
  onSelectZone,
  onNavigate,
  selectedZoneId,
  userLatitude,
  userLongitude,
  isLoading = false,
  onRefresh,
  className,
}: SafeZoneListProps) {
  const t = useTranslations("safeZone")

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SafeZoneFilters>({})
  const [sortBy, setSortBy] = useState<SafeZoneSortOption>("distance")
  const [maxDistance, setMaxDistance] = useState<number>(50)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof SafeZoneFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === undefined ? undefined : value,
    }))
  }, [])

  // Handle category toggle
  const handleCategoryToggle = useCallback((category: SafeZoneCategory) => {
    setFilters((prev) => {
      const currentCategories = prev.categories || []
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category]
      return {
        ...prev,
        categories: newCategories.length > 0 ? newCategories : undefined,
      }
    })
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({})
    setMaxDistance(50)
  }, [])

  // Has active filters
  const hasActiveFilters = useMemo(() => {
    return (
      filters.hasPower !== undefined ||
      filters.hasWater !== undefined ||
      filters.roadAccessible !== undefined ||
      (filters.categories && filters.categories.length > 0) ||
      maxDistance < 50
    )
  }, [filters, maxDistance])

  // Filter and sort zones
  const filteredAndSortedZones = useMemo(() => {
    let result = [...safeZones]

    // Filter by distance
    result = result.filter((zone) => (zone.distance || 0) <= maxDistance)

    // Apply filters
    if (filters.hasPower !== undefined) {
      result = result.filter((zone) => zone.services.hasPower === filters.hasPower)
    }
    if (filters.hasWater !== undefined) {
      result = result.filter((zone) => zone.services.hasWater === filters.hasWater)
    }
    if (filters.roadAccessible !== undefined) {
      result = result.filter((zone) => zone.roadAccessible === filters.roadAccessible)
    }
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter((zone) => filters.categories!.includes(zone.category))
    }

    // Sort
    switch (sortBy) {
      case "distance":
        result.sort((a, b) => (a.distance || 0) - (b.distance || 0))
        break
      case "safetyRating":
        result.sort((a, b) => b.safetyRating - a.safetyRating)
        break
      case "services":
        result.sort((a, b) => {
          const aCount = Object.values(a.services).filter(Boolean).length
          const bCount = Object.values(b.services).filter(Boolean).length
          return bCount - aCount
        })
        break
      case "capacity":
        result.sort((a, b) => (b.capacity || 0) - (a.capacity || 0))
        break
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return result
  }, [safeZones, filters, sortBy, maxDistance])

  // Stats
  const stats = useMemo(() => {
    const total = safeZones.length
    const withPower = safeZones.filter((z) => z.services.hasPower).length
    const withWater = safeZones.filter((z) => z.services.hasWater).length
    const roadAccessible = safeZones.filter((z) => z.roadAccessible).length
    return { total, withPower, withWater, roadAccessible }
  }, [safeZones])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" aria-hidden="true" />
              {t("title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedZones.length} {t("nearby")}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex border rounded-md overflow-hidden" role="group" aria-label="View mode">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
              >
                <Map className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
              </Button>
            )}

            {/* Filter Toggle */}
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
            >
              <Filter className="w-4 h-4 mr-1" aria-hidden="true" />
              {t("filters")}
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  !
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="outline" className="gap-1">
            <MapPin className="w-3 h-3" aria-hidden="true" />
            {stats.total} {t("totalZones")}
          </Badge>
          {stats.withPower > 0 && (
            <Badge variant="outline" className="gap-1">
              <Power className="w-3 h-3" aria-hidden="true" />
              {stats.withPower} {t("withPower")}
            </Badge>
          )}
          {stats.withWater > 0 && (
            <Badge variant="outline" className="gap-1">
              <Droplets className="w-3 h-3" aria-hidden="true" />
              {stats.withWater} {t("withWater")}
            </Badge>
          )}
          {stats.roadAccessible > 0 && (
            <Badge variant="outline" className="gap-1">
              <Navigation className="w-3 h-3" aria-hidden="true" />
              {stats.roadAccessible} {t("roadAccessible")}
            </Badge>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 border-b bg-muted/30 space-y-4 animate-in slide-in-from-top-2">
          {/* Service Filters */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t("services")}</h3>
            <div className="flex flex-wrap gap-2">
              <FilterCheckbox
                label={t("hasPower")}
                checked={filters.hasPower || false}
                onChange={(checked) => handleFilterChange("hasPower", checked ? true : undefined)}
              />
              <FilterCheckbox
                label={t("hasWater")}
                checked={filters.hasWater || false}
                onChange={(checked) => handleFilterChange("hasWater", checked ? true : undefined)}
              />
              <FilterCheckbox
                label={t("roadAccessible")}
                checked={filters.roadAccessible || false}
                onChange={(checked) => handleFilterChange("roadAccessible", checked ? true : undefined)}
              />
            </div>
          </div>

          {/* Category Filters */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t("category")}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SAFE_ZONE_CATEGORIES).map(([key, config]) => (
                <Button
                  key={key}
                  variant={filters.categories?.includes(key as SafeZoneCategory) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryToggle(key as SafeZoneCategory)}
                  className="gap-1"
                >
                  <span aria-hidden="true">{config.icon}</span>
                  {config.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Distance Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">{t("maxDistance")}</h3>
              <span className="text-sm text-muted-foreground">
                {maxDistance} km
              </span>
            </div>
            <Slider
              value={[maxDistance]}
              onValueChange={([value]) => setMaxDistance(value)}
              min={1}
              max={50}
              step={1}
              aria-label="Maximum distance"
            />
          </div>

          {/* Sort Options */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t("sortBy")}</h3>
            <div className="flex flex-wrap gap-2">
              {(["distance", "safetyRating", "services", "capacity", "name"] as SafeZoneSortOption[]).map(
                (option) => (
                  <Button
                    key={option}
                    variant={sortBy === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(option)}
                    className="gap-1"
                  >
                    {sortBy === option && (
                      <SortAsc className="w-3 h-3" aria-hidden="true" />
                    )}
                    {t(`sortOptions.${option}`)}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
              <X className="w-4 h-4 mr-1" aria-hidden="true" />
              {t("clearFilters")}
            </Button>
          )}
        </div>
      )}

      <Separator />

      {/* Results */}
      <div
        className={`flex-1 overflow-y-auto p-4 ${
          viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4 content-start" : "space-y-3"
        }`}
        role="region"
        aria-label={t("results")}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">{t("loading")}</span>
          </div>
        ) : filteredAndSortedZones.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
            <p className="text-muted-foreground">{t("noResults")}</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters}>
                {t("clearFilters")}
              </Button>
            )}
          </div>
        ) : (
          filteredAndSortedZones.map((zone) => (
            <SafeZoneCard
              key={zone.id}
              safeZone={zone}
              onSelect={onSelectZone}
              onNavigate={onNavigate}
              isSelected={selectedZoneId === zone.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

/**
 * Filter Checkbox Button Component
 */
function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Button
      variant={checked ? "default" : "outline"}
      size="sm"
      onClick={() => onChange(!checked)}
      className="gap-1"
      role="checkbox"
      aria-checked={checked}
    >
      <div className={`w-3 h-3 rounded border flex items-center justify-center ${
        checked ? "bg-primary-foreground" : "bg-transparent"
      }`}>
        {checked && <span className="text-primary text-xs">✓</span>}
      </div>
      {label}
    </Button>
  )
}

export default SafeZoneList
