import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Weather condition type
 */
export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'light_rain'
  | 'rain'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'severe_thunderstorm'
  | 'hail'
  | 'snow'
  | 'heavy_snow'
  | 'blizzard'
  | 'ice'
  | 'sleet'
  | 'wind'
  | 'strong_wind'
  | 'extreme_wind'
  | 'heat'
  | 'cold'
  | 'extreme_cold'
  | 'dust'
  | 'sandstorm'
  | 'tornado'
  | 'hurricane'
  | 'tropical_storm'
  | 'flood'
  | 'flash_flood'

/**
 * Weather alert severity
 */
export type WeatherAlertSeverity = 'minor' | 'moderate' | 'severe' | 'extreme'

/**
 * Weather alert type
 */
export type WeatherAlertType =
  | 'heat_advisory'
  | 'cold_warning'
  | 'wind_advisory'
  | 'flood_warning'
  | 'flash_flood_warning'
  | 'thunderstorm_warning'
  | 'tornado_warning'
  | 'hurricane_warning'
  | 'tropical_storm_warning'
  | 'blizzard_warning'
  | 'snow_advisory'
  | 'ice_storm_warning'
  | 'fire_weather_red_flag'
  | 'air_quality_alert'
  | 'uv_alert'

/**
 * Forecast period
 */
export type ForecastPeriod = 'hourly' | 'daily' | 'weekly'

/**
 * Weather data from external API
 */
export interface WeatherData {
  location: {
    latitude: number
    longitude: number
    name?: string
    timezone?: string
  }
  
  current: {
    temperature: number
    feelsLike: number
    humidity: number
    pressure: number
    windSpeed: number
    windDirection: number
    visibility: number
    uvIndex: number
    condition: WeatherCondition
    conditionDescription: string
    iconCode: string
    timestamp: string
  }
  
  hourly?: Array<{
    temperature: number
    condition: WeatherCondition
    conditionDescription: string
    iconCode: string
    timestamp: string
    precipitation: number
    humidity: number
    windSpeed: number
  }>
  
  daily?: Array<{
    date: string
    high: number
    low: number
    condition: WeatherCondition
    conditionDescription: string
    iconCode: string
    precipitation: number
    precipitationProbability: number
    humidity: number
    windSpeed: number
    sunrise: string
    sunset: string
  }>
}

/**
 * Weather alert
 */
export interface WeatherAlert {
  id: string
  
  // Location
  latitude: number
  longitude: number
  radius: number // meters
  affectedAreas?: string[]
  
  // Alert info
  type: WeatherAlertType
  severity: WeatherAlertSeverity
  title: string
  description: string
  instruction?: string
  
  // Timing
  issuedAt: string
  expiresAt: string
  updatedAt?: string
  
  // Source
  source: string
  sourceId?: string
  
  // Status
  status: 'active' | 'expired' | 'cancelled' | 'updated'
  
  // Related
  relatedAlertId?: string
  
  // Timestamps
  createdAt: string
}

/**
 * Weather forecast
 */
export interface WeatherForecast {
  id: string
  location: {
    latitude: number
    longitude: number
  }
  
  period: ForecastPeriod
  
  data: Array<{
    timestamp: string
    temperature: number
    high?: number
    low?: number
    condition: WeatherCondition
    conditionDescription: string
    iconCode: string
    precipitation?: number
    precipitationProbability?: number
    humidity?: number
    windSpeed?: number
    windDirection?: number
    pressure?: number
    visibility?: number
    uvIndex?: number
    sunrise?: string
    sunset?: string
  }>
  
  source: string
  fetchedAt: string
  expiresAt: string
}

/**
 * Weather subscription
 */
export interface WeatherSubscription {
  id: string
  userId: string
  
  location: {
    latitude: number
    longitude: number
    name?: string
    radius: number
  }
  
  alertTypes: WeatherAlertType[]
  severityThreshold: WeatherAlertSeverity
  
  notifications: {
    push: boolean
    sms: boolean
    email: boolean
  }
  
  active: boolean
  
  createdAt: string
  updatedAt: string
}

/**
 * Historical weather
 */
export interface HistoricalWeather {
  date: string
  temperatureHigh: number
  temperatureLow: number
  precipitation: number
  precipitationType?: string
  snow?: number
  snowDepth?: number
  humidity: number
  windSpeed: number
  condition: WeatherCondition
  conditionDescription: string
}

/**
 * Weather statistics
 */
export interface WeatherStatistics {
  location: {
    latitude: number
    longitude: number
    name?: string
  }
  
  period: {
    start: string
    end: string
  }
  
  // Temperature
  averageTemperature: number
  maxTemperature: number
  minTemperature: number
  heatingDegreeDays: number
  coolingDegreeDays: number
  
  // Precipitation
  totalPrecipitation: number
  totalSnow?: number
  rainyDays: number
  snowyDays?: number
  
  // Extremes
  windiestDay: {
    date: string
    maxWindSpeed: number
  }
  wettestDay: {
    date: string
    precipitation: number
  }
  
  // Counts by condition
  conditionCounts: Record<WeatherCondition, number>
}

/**
 * Weather impact assessment
 */
export interface WeatherImpactAssessment {
  location: {
    latitude: number
    longitude: number
  }
  
  timestamp: string
  
  // Risk scores (0-100)
  overallRisk: number
  travelRisk: number
  outdoorActivityRisk: number
  healthRisk: number
  infrastructureRisk: number
  
  // Factors
  factors: Array<{
    type: WeatherCondition
    description: string
    severity: WeatherAlertSeverity
    riskScore: number
    mitigation?: string
  }>
  
  // Recommendations
  recommendations: Array<{
    category: 'travel' | 'health' | 'outdoor' | 'property'
    action: string
    priority: 'low' | 'medium' | 'high'
  }>
}

/**
 * Create subscription input
 */
export interface CreateSubscriptionInput {
  location: {
    latitude: number
    longitude: number
    name?: string
    radius?: number
  }
  alertTypes: WeatherAlertType[]
  severityThreshold?: WeatherAlertSeverity
  notifications?: {
    push?: boolean
    sms?: boolean
    email?: boolean
  }
}

/**
 * Weather API configuration
 */
export interface WeatherAPIConfig {
  provider: string
  apiKey: string
  baseUrl: string
  rateLimit: number // requests per minute
  timeout: number // milliseconds
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating subscription
 */
export const createSubscriptionSchema = z.object({
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    name: z.string().optional(),
    radius: z.number().positive().max(100000).default(10000),
  }),
  alertTypes: z.array(z.enum([
    'heat_advisory', 'cold_warning', 'wind_advisory', 'flood_warning',
    'flash_flood_warning', 'thunderstorm_warning', 'tornado_warning',
    'hurricane_warning', 'tropical_storm_warning', 'blizzard_warning',
    'snow_advisory', 'ice_storm_warning', 'fire_weather_red_flag',
    'air_quality_alert', 'uv_alert'
  ])).min(1),
  severityThreshold: z.enum(['minor', 'moderate', 'severe', 'extreme']).default('moderate'),
  notifications: z.object({
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
    email: z.boolean().default(false),
  }).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for weather condition
 */
export function getWeatherConditionDisplayName(condition: WeatherCondition): string {
  const names: Record<WeatherCondition, string> = {
    clear: 'Clear',
    partly_cloudy: 'Partly Cloudy',
    cloudy: 'Cloudy',
    overcast: 'Overcast',
    fog: 'Fog',
    drizzle: 'Drizzle',
    light_rain: 'Light Rain',
    rain: 'Rain',
    heavy_rain: 'Heavy Rain',
    thunderstorm: 'Thunderstorm',
    severe_thunderstorm: 'Severe Thunderstorm',
    hail: 'Hail',
    snow: 'Snow',
    heavy_snow: 'Heavy Snow',
    blizzard: 'Blizzard',
    ice: 'Ice',
    sleet: 'Sleet',
    wind: 'Wind',
    strong_wind: 'Strong Wind',
    extreme_wind: 'Extreme Wind',
    heat: 'Heat',
    cold: 'Cold',
    extreme_cold: 'Extreme Cold',
    dust: 'Dust',
    sandstorm: 'Sandstorm',
    tornado: 'Tornado',
    hurricane: 'Hurricane',
    tropical_storm: 'Tropical Storm',
    flood: 'Flood',
    flash_flood: 'Flash Flood',
  }
  return names[condition]
}

/**
 * Gets icon code for weather condition
 */
export function getWeatherIconCode(condition: WeatherCondition): string {
  const codes: Record<WeatherCondition, string> = {
    clear: '01d',
    partly_cloudy: '02d',
    cloudy: '03d',
    overcast: '04d',
    fog: '50d',
    drizzle: '09d',
    light_rain: '10d',
    rain: '10d',
    heavy_rain: '10d',
    thunderstorm: '11d',
    severe_thunderstorm: '11d',
    hail: '13d',
    snow: '13d',
    heavy_snow: '13d',
    blizzard: '13d',
    ice: '13d',
    sleet: '13d',
    wind: '50d',
    strong_wind: '50d',
    extreme_wind: '50d',
    heat: '00d',
    cold: '00d',
    extreme_cold: '00d',
    dust: '50d',
    sandstorm: '50d',
    tornado: '00d',
    hurricane: '00d',
    tropical_storm: '00d',
    flood: '00d',
    flash_flood: '00d',
  }
  return codes[condition]
}

/**
 * Gets display name for alert type
 */
export function getWeatherAlertTypeDisplayName(type: WeatherAlertType): string {
  const names: Record<WeatherAlertType, string> = {
    heat_advisory: 'Heat Advisory',
    cold_warning: 'Cold Warning',
    wind_advisory: 'Wind Advisory',
    flood_warning: 'Flood Warning',
    flash_flood_warning: 'Flash Flood Warning',
    thunderstorm_warning: 'Thunderstorm Warning',
    tornado_warning: 'Tornado Warning',
    hurricane_warning: 'Hurricane Warning',
    tropical_storm_warning: 'Tropical Storm Warning',
    blizzard_warning: 'Blizzard Warning',
    snow_advisory: 'Snow Advisory',
    ice_storm_warning: 'Ice Storm Warning',
    fire_weather_red_flag: 'Red Flag Warning',
    air_quality_alert: 'Air Quality Alert',
    uv_alert: 'UV Alert',
  }
  return names[type]
}

/**
 * Gets severity level
 */
export function getSeverityLevel(severity: WeatherAlertSeverity): number {
  const levels: Record<WeatherAlertSeverity, number> = {
    minor: 1,
    moderate: 2,
    severe: 3,
    extreme: 4,
  }
  return levels[severity]
}

/**
 * Checks if severity meets threshold
 */
export function meetsSeverityThreshold(
  severity: WeatherAlertSeverity,
  threshold: WeatherAlertSeverity
): boolean {
  return getSeverityLevel(severity) >= getSeverityLevel(threshold)
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Gets current weather (mock - would integrate with real API)
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  // In production, this would call an external weather API
  // For demo, return mock data
  return {
    location: {
      latitude,
      longitude,
      timezone: 'Europe/Lisbon',
    },
    current: {
      temperature: 22,
      feelsLike: 24,
      humidity: 65,
      pressure: 1013,
      windSpeed: 15,
      windDirection: 270,
      visibility: 10,
      uvIndex: 6,
      condition: 'clear',
      conditionDescription: 'Clear sky',
      iconCode: '01d',
      timestamp: new Date().toISOString(),
    },
    hourly: Array.from({ length: 24 }, (_, i) => ({
      temperature: 20 + Math.sin(i / 4) * 5,
      condition: 'clear' as WeatherCondition,
      conditionDescription: 'Clear',
      iconCode: '01d',
      timestamp: new Date(Date.now() + i * 3600000).toISOString(),
      precipitation: 0,
      humidity: 60 + i % 10,
      windSpeed: 10 + i % 5,
    })),
    daily: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      high: 25 + Math.random() * 5,
      low: 15 + Math.random() * 5,
      condition: 'clear' as WeatherCondition,
      conditionDescription: 'Sunny',
      iconCode: '01d',
      precipitation: Math.random() > 0.7 ? Math.random() * 10 : 0,
      precipitationProbability: Math.random() * 30,
      humidity: 50 + Math.random() * 20,
      windSpeed: 10 + Math.random() * 10,
      sunrise: '06:30',
      sunset: '20:00',
    })),
  }
}

/**
 * Gets weather forecast
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  period: ForecastPeriod = 'daily'
): Promise<WeatherForecast> {
  const weather = await getCurrentWeather(latitude, longitude)
  
  if (!weather) {
    throw new Error('Failed to fetch weather data')
  }

  const data = period === 'hourly' 
    ? weather.hourly?.map(h => ({
        timestamp: h.timestamp,
        temperature: h.temperature,
        condition: h.condition,
        conditionDescription: h.conditionDescription,
        iconCode: h.iconCode,
        precipitation: h.precipitation,
        humidity: h.humidity,
        windSpeed: h.windSpeed,
      })) || []
    : period === 'daily'
    ? weather.daily?.map(d => ({
        timestamp: d.date,
        temperature: (d.high! + d.low!) / 2,
        high: d.high,
        low: d.low,
        condition: d.condition,
        conditionDescription: d.conditionDescription,
        iconCode: d.iconCode,
        precipitation: d.precipitation,
        precipitationProbability: d.precipitationProbability,
        humidity: d.humidity,
        windSpeed: d.windSpeed,
        sunrise: d.sunrise,
        sunset: d.sunset,
      })) || []
    : []

  return {
    id: `forecast_${latitude}_${longitude}_${Date.now()}`,
    location: { latitude, longitude },
    period,
    data,
    source: 'internal',
    fetchedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  }
}

/**
 * Gets active weather alerts for location
 */
export async function getWeatherAlerts(
  latitude: number,
  longitude: number,
  radius: number = 50000
): Promise<WeatherAlert[]> {
  const supabase = createClient()

  // Get active alerts within radius
  const { data, error } = await supabase
    .from('weather_alerts')
    .select('*')
    .eq('status', 'active')
    .lte('expires_at', new Date().toISOString())
    .not('expires_at', 'lt', new Date().toISOString()) // Not expired

  if (error) {
    console.error('Error fetching weather alerts:', error)
    return []
  }

  // Filter by distance
  return ((data || []) as any[])
    .map(a => {
      const distance = calculateDistance(
        latitude, longitude,
        a.latitude, a.longitude
      )
      return { ...a, distance }
    })
    .filter(a => a.distance <= radius || a.radius >= radius)
    .sort((a, b) => getSeverityLevel(b.severity) - getSeverityLevel(a.severity))
    .slice(0, 10)
    .map(a => ({
      id: a.id,
      latitude: a.latitude,
      longitude: a.longitude,
      radius: a.radius,
      affectedAreas: a.affected_areas,
      type: a.type,
      severity: a.severity,
      title: a.title,
      description: a.description,
      instruction: a.instruction,
      issuedAt: a.issued_at,
      expiresAt: a.expires_at,
      updatedAt: a.updated_at,
      source: a.source,
      sourceId: a.source_id,
      status: a.status,
      relatedAlertId: a.related_alert_id,
      createdAt: a.created_at,
    }))
}

/**
 * Creates weather subscription
 */
export async function createWeatherSubscription(
  userId: string,
  input: CreateSubscriptionInput
): Promise<WeatherSubscription> {
  const validationResult = createSubscriptionSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid subscription: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('weather_subscriptions')
    .insert({
      user_id: userId,
      location: input.location,
      alert_types: input.alertTypes,
      severity_threshold: input.severityThreshold || 'moderate',
      notifications: {
        push: input.notifications?.push ?? true,
        sms: input.notifications?.sms ?? false,
        email: input.notifications?.email ?? false,
      },
      active: true,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating subscription:', error)
    throw new Error(`Failed to create subscription: ${error.message}`)
  }

  return mapSubscriptionFromDB(data)
}

/**
 * Gets user weather subscriptions
 */
export async function getWeatherSubscriptions(
  userId: string
): Promise<WeatherSubscription[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('weather_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching subscriptions:', error)
    return []
  }

  return (data || []).map(mapSubscriptionFromDB)
}

/**
 * Updates weather subscription
 */
export async function updateWeatherSubscription(
  subscriptionId: string,
  updates: Partial<CreateSubscriptionInput>
): Promise<WeatherSubscription> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.location) {
    updateData.location = updates.location
  }

  if (updates.alertTypes) {
    updateData.alert_types = updates.alertTypes
  }

  if (updates.severityThreshold) {
    updateData.severity_threshold = updates.severityThreshold
  }

  if (updates.notifications) {
    updateData.notifications = updates.notifications
  }

  const { data, error } = await supabase
    .from('weather_subscriptions')
    .update(updateData)
    .eq('id', subscriptionId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating subscription:', error)
    throw new Error(`Failed to update: ${error.message}`)
  }

  return mapSubscriptionFromDB(data)
}

/**
 * Deletes weather subscription
 */
export async function deleteWeatherSubscription(
  subscriptionId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('weather_subscriptions')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', subscriptionId)

  if (error) {
    console.error('Error deleting subscription:', error)
    throw new Error(`Failed to delete: ${error.message}`)
  }
}

/**
 * Gets weather impact assessment
 */
export async function getWeatherImpactAssessment(
  latitude: number,
  longitude: number
): Promise<WeatherImpactAssessment> {
  const weather = await getCurrentWeather(latitude, longitude)
  const alerts = await getWeatherAlerts(latitude, longitude, 25000)

  if (!weather) {
    throw new Error('Failed to fetch weather data')
  }

  // Calculate risk scores based on current conditions and alerts
  const factors: WeatherImpactAssessment['factors'] = []
  let overallRisk = 0
  let travelRisk = 0
  let outdoorRisk = 0
  let healthRisk = 0
  let infrastructureRisk = 0

  // Temperature risk
  const temp = weather.current.temperature
  if (temp > 35) {
    factors.push({
      type: 'heat',
      description: 'Extreme heat',
      severity: 'extreme',
      riskScore: 90,
      mitigation: 'Stay hydrated and avoid prolonged outdoor exposure',
    })
    healthRisk += 40
    outdoorRisk += 50
  } else if (temp > 30) {
    factors.push({
      type: 'heat',
      description: 'High heat',
      severity: 'severe',
      riskScore: 70,
      mitigation: 'Limit outdoor activities during peak hours',
    })
    healthRisk += 25
    outdoorRisk += 30
  } else if (temp < 0) {
    factors.push({
      type: 'cold',
      description: 'Below freezing temperatures',
      severity: 'severe',
      riskScore: 70,
      mitigation: 'Dress warmly and protect exposed skin',
    })
    healthRisk += 30
    outdoorRisk += 40
  } else if (temp < 5) {
    factors.push({
      type: 'cold',
      description: 'Cold temperatures',
      severity: 'moderate',
      riskScore: 40,
    })
    healthRisk += 15
    outdoorRisk += 20
  }

  // Wind risk
  const wind = weather.current.windSpeed
  if (wind > 50) {
    factors.push({
      type: 'extreme_wind',
      description: 'Dangerously strong winds',
      severity: 'extreme',
      riskScore: 85,
      mitigation: 'Secure loose objects and avoid travel',
    })
    travelRisk += 50
    infrastructureRisk += 40
    outdoorRisk += 60
  } else if (wind > 30) {
    factors.push({
      type: 'strong_wind',
      description: 'Strong winds',
      severity: 'severe',
      riskScore: 55,
    })
    travelRisk += 25
    infrastructureRisk += 20
    outdoorRisk += 30
  }

  // Alert-based risks
  for (const alert of alerts) {
    const severityScore = getSeverityLevel(alert.severity) * 20
    
    switch (alert.type) {
      case 'tornado_warning':
      case 'hurricane_warning':
        factors.push({
          type: 'hurricane',
          description: alert.title,
          severity: alert.severity,
          riskScore: 95,
          mitigation: alert.instruction,
        })
        overallRisk += 50
        travelRisk += 60
        infrastructureRisk += 70
        break
      case 'flash_flood_warning':
      case 'flood_warning':
        factors.push({
          type: 'flood',
          description: alert.title,
          severity: alert.severity,
          riskScore: 80,
          mitigation: alert.instruction,
        })
        travelRisk += 55
        infrastructureRisk += 45
        break
      case 'blizzard_warning':
      case 'snow_advisory':
        factors.push({
          type: 'blizzard',
          description: alert.title,
          severity: alert.severity,
          riskScore: 75,
          mitigation: alert.instruction,
        })
        travelRisk += 60
        outdoorRisk += 70
        break
      default:
        factors.push({
          type: 'severe_thunderstorm',
          description: alert.title,
          severity: alert.severity,
          riskScore: 50 + severityScore,
          mitigation: alert.instruction,
        })
        overallRisk += 20
        travelRisk += 25
    }
  }

  // Calculate overall risk (capped at 100)
  overallRisk = Math.min(100, Math.max(
    travelRisk * 0.3 + outdoorRisk * 0.25 + healthRisk * 0.25 + infrastructureRisk * 0.2,
    ...factors.map(f => f.riskScore)
  ))

  // Build recommendations
  const recommendations: WeatherImpactAssessment['recommendations'] = []

  if (travelRisk > 50) {
    recommendations.push({
      category: 'travel',
      action: 'Consider postponing non-essential travel',
      priority: travelRisk > 70 ? 'high' : 'medium',
    })
  }

  if (outdoorRisk > 50) {
    recommendations.push({
      category: 'outdoor',
      action: 'Limit outdoor activities',
      priority: outdoorRisk > 70 ? 'high' : 'medium',
    })
  }

  if (healthRisk > 40) {
    recommendations.push({
      category: 'health',
      action: 'Take precautions for health conditions',
      priority: healthRisk > 60 ? 'high' : 'medium',
    })
  }

  for (const factor of factors.slice(0, 2)) {
    if (factor.mitigation) {
      recommendations.push({
        category: 'travel',
        action: factor.mitigation,
        priority: factor.severity === 'extreme' ? 'high' : 'medium',
      })
    }
  }

  return {
    location: { latitude, longitude },
    timestamp: new Date().toISOString(),
    overallRisk,
    travelRisk: Math.min(100, travelRisk),
    outdoorActivityRisk: Math.min(100, outdoorRisk),
    healthRisk: Math.min(100, healthRisk),
    infrastructureRisk: Math.min(100, infrastructureRisk),
    factors,
    recommendations,
  }
}

/**
 * Gets historical weather
 */
export async function getHistoricalWeather(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<HistoricalWeather[]> {
  // In production, this would call an external API or database
  // For demo, generate mock data
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / 86400000)

  const weather: HistoricalWeather[] = []
  const conditions: WeatherCondition[] = ['clear', 'partly_cloudy', 'cloudy', 'rain', 'thunderstorm']

  for (let i = 0; i < days; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)

    const condition = conditions[Math.floor(Math.random() * conditions.length)]
    
    weather.push({
      date: date.toISOString().split('T')[0],
      temperatureHigh: 20 + Math.random() * 10,
      temperatureLow: 10 + Math.random() * 10,
      precipitation: condition === 'rain' || condition === 'thunderstorm'
        ? Math.random() * 20
        : 0,
      precipitationType: condition === 'rain' ? 'rain' : condition === 'thunderstorm' ? 'rain' : undefined,
      snow: condition === 'snow' ? Math.random() * 10 : 0,
      humidity: 40 + Math.random() * 40,
      windSpeed: 5 + Math.random() * 20,
      condition,
      conditionDescription: getWeatherConditionDisplayName(condition),
    })
  }

  return weather
}

/**
 * Gets weather statistics
 */
export async function getWeatherStatistics(
  latitude: number,
  longitude: number,
  days: number = 30
): Promise<WeatherStatistics> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const historical = await getHistoricalWeather(
    latitude, longitude,
    startDate.toISOString(),
    endDate.toISOString()
  )

  if (historical.length === 0) {
    return {
      location: { latitude, longitude },
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      averageTemperature: 0,
      maxTemperature: 0,
      minTemperature: 0,
      heatingDegreeDays: 0,
      coolingDegreeDays: 0,
      totalPrecipitation: 0,
      rainyDays: 0,
      conditionCounts: {} as Record<WeatherCondition, number>,
      windiestDay: { date: '', maxWindSpeed: 0 },
      wettestDay: { date: '', precipitation: 0 },
    }
  }

  // Calculate statistics
  const temperatures = historical.flatMap(d => [d.temperatureHigh, d.temperatureLow])
  const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length
  const maxTemp = Math.max(...temperatures)
  const minTemp = Math.min(...temperatures)

  // Degree days
  const baseTemp = 18
  const heatingDegreeDays = historical.reduce((sum, d) => {
    const avg = (d.temperatureHigh + d.temperatureLow) / 2
    return sum + Math.max(0, baseTemp - avg)
  }, 0)
  const coolingDegreeDays = historical.reduce((sum, d) => {
    const avg = (d.temperatureHigh + d.temperatureLow) / 2
    return sum + Math.max(0, avg - baseTemp)
  }, 0)

  // Precipitation
  const totalPrecipitation = historical.reduce((sum, d) => sum + d.precipitation, 0)
  const rainyDays = historical.filter(d => d.precipitation > 0).length
  const snowyDays = historical.filter(d => (d.snow || 0) > 0).length

  // Condition counts
  const conditionCounts = historical.reduce((counts, d) => {
    counts[d.condition] = (counts[d.condition] || 0) + 1
    return counts
  }, {} as Record<WeatherCondition, number>)

  // Extremes
  const windiestDay = historical.reduce((max, d) =>
    d.windSpeed > max.maxWindSpeed ? { date: d.date, maxWindSpeed: d.windSpeed } : max,
    { date: '', maxWindSpeed: 0 }
  )

  const wettestDay = historical.reduce((max, d) =>
    d.precipitation > max.precipitation ? { date: d.date, precipitation: d.precipitation } : max,
    { date: '', precipitation: 0 }
  )

  return {
    location: { latitude, longitude },
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    averageTemperature: Math.round(avgTemp * 10) / 10,
    maxTemperature: Math.round(maxTemp * 10) / 10,
    minTemperature: Math.round(minTemp * 10) / 10,
    heatingDegreeDays: Math.round(heatingDegreeDays),
    coolingDegreeDays: Math.round(coolingDegreeDays),
    totalPrecipitation: Math.round(totalPrecipitation * 10) / 10,
    totalSnow: Math.round(historical.reduce((sum, d) => sum + (d.snow || 0), 0) * 10) / 10,
    rainyDays,
    snowyDays,
    conditionCounts,
    windiestDay,
    wettestDay,
  }
}

/**
 * Gets weather for multiple locations (batch)
 */
export async function getBatchWeather(
  locations: Array<{ latitude: number; longitude: number }>
): Promise<Map<string, WeatherData>> {
  const results = new Map<string, WeatherData>()

  // Process in parallel (limited concurrency)
  const batchSize = 10
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize)
    const promises = batch.map(async loc => {
      const weather = await getCurrentWeather(loc.latitude, loc.longitude)
      const key = `${loc.latitude},${loc.longitude}`
      if (weather) {
        results.set(key, weather)
      }
    })
    await Promise.all(promises)
  }

  return results
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to WeatherSubscription
 */
function mapSubscriptionFromDB(data: Record<string, unknown>): WeatherSubscription {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    location: data.location as { latitude: number; longitude: number; name?: string; radius: number },
    alertTypes: data.alert_types as WeatherAlertType[],
    severityThreshold: data.severity_threshold as WeatherAlertSeverity,
    notifications: {
      push: (data.notifications as { push: boolean })?.push ?? false,
      sms: (data.notifications as { sms: boolean })?.sms ?? false,
      email: (data.notifications as { email: boolean })?.email ?? false,
    },
    active: data.active as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Calculates distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
