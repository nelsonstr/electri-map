import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Smart meter type
 */
export type SmartMeterType = 
  | 'electricity'
  | 'gas'
  | 'water'
  | 'heat'
  | 'solar_production'
  | 'battery_storage'
  | 'ev_charger'
  | 'combined'

/**
 * Smart meter status
 */
export type SmartMeterStatus = 
  | 'online'
  | 'offline'
  | 'warning'
  | 'error'
  | 'maintenance'
  | 'pending_installation'

/**
 * Meter reading type
 */
export type MeterReadingType = 
  | 'instantaneous'
  | 'interval'
  | 'daily_total'
  | 'monthly_total'
  | 'demand_peak'

/**
 * Smart meter data interval
 */
export type DataInterval = '1min' | '5min' | '15min' | '30min' | '1hour' | '1day' | '1month'

/**
 * Smart meter
 */
export interface SmartMeter {
  id: string
  meterId: string
  userId?: string
  locationId?: string
  
  // Meter info
  type: SmartMeterType
  manufacturer?: string
  model?: string
  serialNumber?: string
  firmwareVersion?: string
  
  // Connection
  protocol: 'dlms' | 'modbus' | 'mbus' | 'zigbee' | 'wifi' | 'cellular' | 'lora'
  connectionStatus: SmartMeterStatus
  lastSeenAt?: string
  ipAddress?: string
  
  // Status
  batteryLevel?: number
  signalStrength?: number
  
  // Timestamps
  installedAt?: string
  lastReadingAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * Meter reading
 */
export interface MeterReading {
  id: string
  meterId: string
  
  // Reading info
  type: MeterReadingType
  interval: DataInterval
  
  // Values
  activeEnergykWh?: number // Import
  reactiveEnergykVarh?: number
  activePowerkW?: number
  reactivePowerkVar?: number
  apparentPowerkVA?: number
  powerFactor?: number
  voltageV?: number
  currentA?: number
  frequencyHz?: number
  
  // Demand
  demandkW?: number
  peakDemandkW?: number
  
  // Quality
  powerQualityScore?: number // 0-100
  outageCount?: number
  outageDuration?: number // seconds
  
  // Timestamp
  readingAt: string
  intervalStart?: string
  intervalEnd?: string
  
  // Raw data
  rawData?: Record<string, unknown>
  
  createdAt: string
}

/**
 * Energy consumption data
 */
export interface EnergyConsumption {
  meterId: string
  period: {
    start: string
    end: string
    interval: DataInterval
  }
  
  // Consumption
  totalConsumptionkWh: number
  peakDemandkW: number
  averageDemandkW: number
  
  // Breakdown
  byTimeOfDay?: Array<{
    period: 'peak' | 'off_peak' | 'mid_peak'
    consumptionkWh: number
    cost?: number
  }>
  
  byDayOfWeek?: Array<{
    day: number // 0-6
    consumptionkWh: number
  }>
  
  // Comparison
  previousPeriodComparison?: {
    changePercent: number
    trend: 'increase' | 'decrease' | 'stable'
  }
  
  // Projections
  projectedMonthlykWh?: number
}

/**
 * Power quality data
 */
export interface PowerQualityData {
  meterId: string
  timestamp: string
  
  // Voltage
  voltageL1V?: number
  voltageL2V?: number
  voltageL3V?: number
  averageVoltageV?: number
  
  // Current
  currentL1A?: number
  currentL2A?: number
  currentL3A?: number
  averageCurrentA?: number
  
  // Power
  activePowerkW?: number
  reactivePowerkVar?: number
  apparentPowerkVA?: number
  powerFactor?: number
  frequencyHz?: number
  
  // THD (Total Harmonic Distortion)
  thdPercent?: number
  
  // Outage
  outageCount?: number
  outageDuration?: number
  
  // Events
  sagCount?: number
  swellCount?: number
  interruptionCount?: number
  
  // Quality score
  overallScore: number // 0-100
}

/**
 * Solar production data
 */
export interface SolarProduction {
  meterId: string
  period: {
    start: string
    end: string
    interval: DataInterval
  }
  
  // Production
  totalProductionkWh: number
  peakProductionkW: number
  averageProductionkW: number
  
  // Efficiency
  efficiencyPercent?: number
  performanceRatio?: number
  
  // Weather impact
  expectedProductionkWh?: number
  actualProductionkWh?: number
  productionVariancePercent?: number
  
  // System info
  panelCapacitykWp?: number
  inverterCapacitykVA?: number
  orientation?: string
  tiltAngle?: number
}

/**
 * Net metering data
 */
export interface NetMeteringData {
  meterId: string
  billingPeriod: {
    start: string
    end: string
  }
  
  // Import/Export
  importedkWh: number
  exportedkWh: number
  netkWh: number
  
  // Credit
  creditGenerated: number
  creditUsed: number
  creditCarriedForward: number
  
  // Rates
  importRate?: number
  exportRate?: number
}

/**
 * Outage event
 */
export interface MeterOutageEvent {
  id: string
  meterId: string
  
  // Event info
  type: 'outage' | 'sag' | 'swell' | 'interruption' | 'fluctuation'
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  
  // Timing
  startedAt: string
  endedAt?: string
  duration?: number // seconds
  
  // Impact
  customersAffected?: number
  areaAffected?: string
  
  // Restoration
  restoredAt?: string
  restorationMethod?: string
  
  // Cause
  cause?: string
  equipmentFailed?: string
  
  // Verification
  verified: boolean
  verifiedBy?: string
  
  createdAt: string
}

/**
 * Demand response event
 */
export interface DemandResponseEvent {
  id: string
  utilityId?: string
  
  // Event info
  name: string
  description?: string
  type: 'curtailment' | 'load_shifting' | 'emergency' | 'price_response'
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  
  // Timing
  startAt: string
  endAt: string
  duration: number // minutes
  
  // Targets
  targetReductionkW?: number
  actualReductionkW?: number
  participatingCustomers?: number
  
  // Incentives
  incentiveRate?: number
  totalIncentivePaid?: number
  
  // Alerts
  alertsEnabled: boolean
  alertSentAt?: string
  
  createdAt: string
}

/**
 * Create meter input
 */
export interface CreateMeterInput {
  type: SmartMeterType
  manufacturer?: string
  model?: string
  serialNumber?: string
  firmwareVersion?: string
  protocol: 'dlms' | 'modbus' | 'mbus' | 'zigbee' | 'wifi' | 'cellular' | 'lora'
  locationId?: string
}

/**
 * Record reading input
 */
export interface RecordReadingInput {
  type: MeterReadingType
  interval: DataInterval
  activeEnergykWh?: number
  reactiveEnergykVarh?: number
  activePowerkW?: number
  reactivePowerkVar?: number
  apparentPowerkVA?: number
  powerFactor?: number
  voltageV?: number
  currentA?: number
  frequencyHz?: number
  demandkW?: number
  peakDemandkW?: number
  outageCount?: number
  outageDuration?: number
  rawData?: Record<string, unknown>
}

/**
 * Query consumption input
 */
export interface QueryConsumptionInput {
  startDate: string
  endDate: string
  interval?: DataInterval
  compareToPrevious?: boolean
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating meter
 */
export const createMeterSchema = z.object({
  type: z.enum(['electricity', 'gas', 'water', 'heat', 'solar_production', 'battery_storage', 'ev_charger', 'combined']),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  firmwareVersion: z.string().optional(),
  protocol: z.enum(['dlms', 'modbus', 'mbus', 'zigbee', 'wifi', 'cellular', 'lora']),
  locationId: z.string().optional(),
})

/**
 * Schema for recording reading
 */
export const recordReadingSchema = z.object({
  type: z.enum(['instantaneous', 'interval', 'daily_total', 'monthly_total', 'demand_peak']),
  interval: z.enum(['1min', '5min', '15min', '30min', '1hour', '1day', '1month']),
  activeEnergykWh: z.number().nonnegative().optional(),
  reactiveEnergykVarh: z.number().nonnegative().optional(),
  activePowerkW: z.number().nonnegative().optional(),
  reactivePowerkVar: z.number().optional(),
  apparentPowerkVA: z.number().nonnegative().optional(),
  powerFactor: z.number().min(-1).max(1).optional(),
  voltageV: z.number().positive().optional(),
  currentA: z.number().nonnegative().optional(),
  frequencyHz: z.number().positive().optional(),
  demandkW: z.number().nonnegative().optional(),
  peakDemandkW: z.number().nonnegative().optional(),
  outageCount: z.number().int().nonnegative().optional(),
  outageDuration: z.number().nonnegative().optional(),
  rawData: z.record(z.unknown()).optional(),
})

/**
 * Schema for querying consumption
 */
export const queryConsumptionSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  interval: z.enum(['1min', '5min', '15min', '30min', '1hour', '1day', '1month']).default('1day'),
  compareToPrevious: z.boolean().default(false),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for meter type
 */
export function getSmartMeterTypeDisplayName(type: SmartMeterType): string {
  const names: Record<SmartMeterType, string> = {
    electricity: 'Electricity Meter',
    gas: 'Gas Meter',
    water: 'Water Meter',
    heat: 'Heat Meter',
    solar_production: 'Solar Production Meter',
    battery_storage: 'Battery Storage Meter',
    ev_charger: 'EV Charger Meter',
    combined: 'Combined Utility Meter',
  }
  return names[type]
}

/**
 * Gets display name for meter status
 */
export function getSmartMeterStatusDisplayName(status: SmartMeterStatus): string {
  const names: Record<SmartMeterStatus, string> = {
    online: 'Online',
    offline: 'Offline',
    warning: 'Warning',
    error: 'Error',
    maintenance: 'Maintenance',
    pending_installation: 'Pending Installation',
  }
  return names[status]
}

/**
 * Gets color for meter status
 */
export function getSmartMeterStatusColor(status: SmartMeterStatus): string {
  const colors: Record<SmartMeterStatus, string> = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    maintenance: 'bg-blue-500',
    pending_installation: 'bg-orange-500',
  }
  return colors[status]
}

/**
 * Calculates power from voltage and current
 */
export function calculatePower(voltage: number, current: number, powerFactor?: number): number {
  const pf = powerFactor || 1
  return voltage * current * pf / 1000 // kW
}

/**
 * Calculates energy from power and time
 */
export function calculateEnergy(powerkW: number, durationMinutes: number): number {
  return powerkW * durationMinutes / 60
}

/**
 * Determines time-of-use period
 */
export function getTimeOfUsePeriod(
  hour: number,
  tariffSchedule?: Record<string, { peak: number[]; offPeak: number[]; midPeak: number[] }>
): 'peak' | 'off_peak' | 'mid_peak' {
  // Default TOU schedule (can be customized per utility)
  const defaultSchedule: Record<string, { peak: number[]; offPeak: number[]; midPeak: number[] }> = {
    weekday: {
      peak: [17, 18, 19, 20, 21],
      offPeak: [0, 1, 2, 3, 4, 5, 6, 7],
      midPeak: [9, 10, 11, 12, 13, 14, 15, 16],
    },
    weekend: {
      peak: [],
      offPeak: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
      midPeak: [],
    },
  }

  const schedule = tariffSchedule || defaultSchedule
  const dayType = new Date().getDay() === 0 || new Date().getDay() === 6 ? 'weekend' : 'weekday'
  const daySchedule = schedule[dayType as keyof typeof schedule]

  if (daySchedule.peak.includes(hour)) return 'peak'
  if (daySchedule.offPeak.includes(hour)) return 'off_peak'
  return 'mid_peak'
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Registers a new smart meter
 */
export async function registerMeter(
  userId: string,
  input: CreateMeterInput
): Promise<SmartMeter> {
  const validationResult = createMeterSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid meter: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Generate unique meter ID
  const meterId = `meter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('smart_meters')
    .insert({
      meter_id: meterId,
      user_id: userId,
      type: input.type,
      manufacturer: input.manufacturer || null,
      model: input.model || null,
      serial_number: input.serialNumber || null,
      firmware_version: input.firmwareVersion || null,
      protocol: input.protocol,
      connection_status: 'pending_installation',
      location_id: input.locationId || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating meter:', error)
    throw new Error(`Failed to create meter: ${error.message}`)
  }

  return mapMeterFromDB(data)
}

/**
 * Gets meter by ID
 */
export async function getMeter(meterId: string): Promise<SmartMeter | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('smart_meters')
    .select('*')
    .eq('meter_id', meterId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching meter:', error)
    return null
  }

  if (!data) return null
  return mapMeterFromDB(data)
}

/**
 * Gets user meters
 */
export async function getUserMeters(
  userId: string,
  type?: SmartMeterType
): Promise<SmartMeter[]> {
  const supabase = createClient()

  let query = supabase
    .from('smart_meters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching meters:', error)
    return []
  }

  return (data || []).map(mapMeterFromDB)
}

/**
 * Updates meter status
 */
export async function updateMeterStatus(
  meterId: string,
  status: SmartMeterStatus,
  additionalData?: {
    batteryLevel?: number
    signalStrength?: number
    firmwareVersion?: string
  }
): Promise<SmartMeter> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    connection_status: status,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (additionalData) {
    if (additionalData.batteryLevel !== undefined) updateData.battery_level = additionalData.batteryLevel
    if (additionalData.signalStrength !== undefined) updateData.signal_strength = additionalData.signalStrength
    if (additionalData.firmwareVersion) updateData.firmware_version = additionalData.firmwareVersion
  }

  const { data, error } = await supabase
    .from('smart_meters')
    .update(updateData)
    .eq('meter_id', meterId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating meter status:', error)
    throw new Error(`Failed to update status: ${error.message}`)
  }

  return mapMeterFromDB(data)
}

/**
 * Records a meter reading
 */
export async function recordMeterReading(
  meterId: string,
  input: RecordReadingInput
): Promise<MeterReading> {
  const validationResult = recordReadingSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid reading: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('meter_readings')
    .insert({
      meter_id: meterId,
      type: input.type,
      interval: input.interval,
      active_energy_kwh: input.activeEnergykWh || null,
      reactive_energy_kvarh: input.reactiveEnergykVarh || null,
      active_power_kw: input.activePowerkW || null,
      reactive_power_kvar: input.reactivePowerkVar || null,
      apparent_power_kva: input.apparentPowerkVA || null,
      power_factor: input.powerFactor || null,
      voltage_v: input.voltageV || null,
      current_a: input.currentA || null,
      frequency_hz: input.frequencyHz || null,
      demand_kw: input.demandkW || null,
      peak_demand_kw: input.peakDemandkW || null,
      outage_count: input.outageCount || null,
      outage_duration: input.outageDuration || null,
      raw_data: input.rawData || null,
      reading_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error recording reading:', error)
    throw new Error(`Failed to record reading: ${error.message}`)
  }

  // Update meter's last reading time
  await supabase
    .from('smart_meters')
    .update({ last_reading_at: new Date().toISOString() })
    .eq('meter_id', meterId)

  return mapReadingFromDB(data)
}

/**
 * Gets meter reading history
 */
export async function getMeterReadingHistory(
  meterId: string,
  options?: {
    startDate?: string
    endDate?: string
    type?: MeterReadingType
    limit?: number
  }
): Promise<MeterReading[]> {
  const supabase = createClient()

  let query = supabase
    .from('meter_readings')
    .select('*')
    .eq('meter_id', meterId)
    .order('reading_at', { ascending: false })

  if (options?.startDate) {
    query = query.gte('reading_at', options.startDate)
  }

  if (options?.endDate) {
    query = query.lte('reading_at', options.endDate)
  }

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching readings:', error)
    return []
  }

  return (data || []).map(mapReadingFromDB)
}

/**
 * Gets latest meter reading
 */
export async function getLatestMeterReading(meterId: string): Promise<MeterReading | null> {
  const readings = await getMeterReadingHistory(meterId, { limit: 1 })
  return readings[0] || null
}

/**
 * Gets energy consumption data
 */
export async function getEnergyConsumption(
  meterId: string,
  input: QueryConsumptionInput
): Promise<EnergyConsumption> {
  const validationResult = queryConsumptionSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid query: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('meter_readings')
    .select('*')
    .eq('meter_id', meterId)
    .gte('reading_at', input.startDate)
    .lte('reading_at', input.endDate)
    .eq('type', 'interval')
    .order('reading_at', { ascending: true })

  if (error) {
    console.error('Error fetching consumption data:', error)
    throw new Error(`Failed to fetch data: ${error.message}`)
  }

  // Calculate totals
  let totalConsumption = 0
  let peakDemand = 0
  let readingsCount = 0

  for (const reading of data || []) {
    if (reading.active_energy_kwh) {
      totalConsumption += reading.active_energy_kwh as number
    }
    if (reading.demand_kw && (reading.demand_kw as number) > peakDemand) {
      peakDemand = reading.demand_kw as number
    }
    readingsCount++
  }

  const averageDemand = readingsCount > 0 ? totalConsumption / readingsCount : 0

  // Get previous period for comparison
  let previousPeriodComparison = undefined
  if (input.compareToPrevious) {
    const startDate = new Date(input.startDate)
    const endDate = new Date(input.endDate)
    const duration = endDate.getTime() - startDate.getTime()
    const prevStart = new Date(startDate.getTime() - duration)
    const prevEnd = new Date(endDate.getTime() - duration)

    const { data: prevData } = await supabase
      .from('meter_readings')
      .select('active_energy_kwh')
      .eq('meter_id', meterId)
      .gte('reading_at', prevStart.toISOString())
      .lte('reading_at', prevEnd.toISOString())
      .eq('type', 'interval')

    let prevTotal = 0
    for (const reading of prevData || []) {
      if (reading.active_energy_kwh) {
        prevTotal += reading.active_energy_kwh as number
      }
    }

    if (prevTotal > 0) {
      const changePercent = ((totalConsumption - prevTotal) / prevTotal) * 100
      previousPeriodComparison = {
        changePercent: Math.round(changePercent * 100) / 100,
        trend: (changePercent > 5 ? 'increase' : changePercent < -5 ? 'decrease' : 'stable') as 'increase' | 'decrease' | 'stable',
      }
    }
  }

  return {
    meterId,
    period: {
      start: input.startDate,
      end: input.endDate,
      interval: input.interval as DataInterval,
    },
    totalConsumptionkWh: Math.round(totalConsumption * 100) / 100,
    peakDemandkW: peakDemand,
    averageDemandkW: Math.round(averageDemand * 100) / 100,
    previousPeriodComparison,
  }
}

/**
 * Gets power quality data
 */
export async function getPowerQualityData(
  meterId: string,
  timestamp?: string
): Promise<PowerQualityData | null> {
  const supabase = createClient()

  let query = supabase
    .from('meter_readings')
    .select('*')
    .eq('meter_id', meterId)
    .order('reading_at', { ascending: false })

  if (timestamp) {
    query = query.eq('reading_at', timestamp)
  }

  const { data, error } = await query.limit(1)

  if (error) {
    console.error('Error fetching power quality:', error)
    return null
  }

  if (!data || data.length as number === 0) return null

  const reading = data[0]

  // Calculate quality score based on various factors
  let score = 100
  const issues: string[] = []

  // Voltage check (assume nominal 230V)
  const voltage = (reading.voltage_v as number) || 0
  if (voltage > 253 || voltage < 207) {
    score -= 20
    issues.push('voltage_out_of_range')
  }

  // Power factor check
  const pf = (reading.power_factor as number) || 1
  if (pf < 0.9) {
    score -= Math.round((0.9 - pf) * 100)
    issues.push('low_power_factor')
  }

  // Frequency check (assume nominal 50Hz)
  const freq = (reading.frequency_hz as number) || 50
  if (freq > 50.5 || freq < 49.5) {
    score -= 10
    issues.push('frequency_deviation')
  }

  return {
    meterId,
    timestamp: reading.reading_at as string,
    voltageL1V: reading.voltage_v as number | undefined,
    averageVoltageV: reading.voltage_v as number | undefined,
    currentL1A: reading.current_a as number | undefined,
    averageCurrentA: reading.current_a as number | undefined,
    activePowerkW: reading.active_power_kw as number | undefined,
    reactivePowerkVar: reading.reactive_power_kvar as number | undefined,
    apparentPowerkVA: reading.apparent_power_kva as number | undefined,
    powerFactor: reading.power_factor as number | undefined,
    frequencyHz: reading.frequency_hz as number | undefined,
    outageCount: reading.outage_count as number | undefined,
    outageDuration: reading.outage_duration as number | undefined,
    overallScore: Math.max(0, Math.min(100, score)),
  }
}

/**
 * Gets solar production data
 */
export async function getSolarProduction(
  meterId: string,
  startDate: string,
  endDate: string,
  interval: DataInterval = '1day'
): Promise<SolarProduction> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('meter_readings')
    .select('*')
    .eq('meter_id', meterId)
    .gte('reading_at', startDate)
    .lte('reading_at', endDate)
    .order('reading_at', { ascending: true })

  if (error) {
    console.error('Error fetching solar data:', error)
    throw new Error(`Failed to fetch data: ${error.message}`)
  }

  let totalProduction = 0
  let peakProduction = 0

  for (const reading of data || []) {
    if (reading.active_energy_kwh) {
      totalProduction += reading.active_energy_kwh as number
    }
    if (reading.active_power_kw && (reading.active_power_kw as number) > peakProduction) {
      peakProduction = reading.active_power_kw as number
    }
  }

  // Get expected production (simplified calculation)
  // In production, would use weather data and historical performance
  const expectedProduction = totalProduction * 1.1 // Assume 10% underperformance

  return {
    meterId,
    period: {
      start: startDate,
      end: endDate,
      interval,
    },
    totalProductionkWh: Math.round(totalProduction * 100) / 100,
    peakProductionkW: peakProduction,
    averageProductionkW: data?.length ? totalProduction / data.length as number : 0,
    expectedProductionkWh: Math.round(expectedProduction * 100) / 100,
    actualProductionkWh: Math.round(totalProduction * 100) / 100,
    productionVariancePercent: Math.round(((totalProduction - expectedProduction) / expectedProduction) * 100),
  }
}

/**
 * Gets net metering data
 */
export async function getNetMeteringData(
  meterId: string,
  billingPeriodStart: string,
  billingPeriodEnd: string
): Promise<NetMeteringData> {
  const supabase = createClient()

  // Get import readings
  const { data: importData } = await supabase
    .from('meter_readings')
    .select('active_energy_kwh')
    .eq('meter_id', meterId)
    .gte('reading_at', billingPeriodStart)
    .lte('reading_at', billingPeriodEnd)
    .eq('type', 'daily_total')

  // Get export readings (for solar meters)
  const { data: exportData } = await supabase
    .from('meter_readings')
    .select('active_energy_kwh')
    .eq('meter_id', meterId)
    .gte('reading_at', billingPeriodStart)
    .lte('reading_at', billingPeriodEnd)
    .eq('type', 'daily_total')

  let imported = 0
  let exported = 0

  for (const reading of importData || []) {
    if (reading.active_energy_kwh && (reading.active_energy_kwh as number) > 0) {
      imported += reading.active_energy_kwh as number
    }
  }

  for (const reading of exportData || []) {
    if (reading.active_energy_kwh && (reading.active_energy_kwh as number) < 0) {
      exported += Math.abs(reading.active_energy_kwh as number)
    }
  }

  const net = imported - exported

  return {
    meterId,
    billingPeriod: {
      start: billingPeriodStart,
      end: billingPeriodEnd,
    },
    importedkWh: Math.round(imported * 100) / 100,
    exportedkWh: Math.round(exported * 100) / 100,
    netkWh: Math.round(net * 100) / 100,
    creditGenerated: Math.round(exported * 100) / 100,
    creditUsed: 0,
    creditCarriedForward: Math.round(Math.max(0, exported - 0) * 100) / 100,
  }
}

/**
 * Gets outage events for meter
 */
export async function getMeterOutageEvents(
  meterId: string,
  options?: {
    startDate?: string
    endDate?: string
    severity?: MeterOutageEvent['severity']
  }
): Promise<MeterOutageEvent[]> {
  const supabase = createClient()

  let query = supabase
    .from('meter_outage_events')
    .select('*')
    .eq('meter_id', meterId)
    .order('started_at', { ascending: false })

  if (options?.startDate) {
    query = query.gte('started_at', options.startDate)
  }

  if (options?.endDate) {
    query = query.lte('started_at', options.endDate)
  }

  if (options?.severity) {
    query = query.eq('severity', options.severity)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching outages:', error)
    return []
  }

  return (data || []).map(mapOutageEventFromDB)
}

/**
 * Gets demand response events
 */
export async function getDemandResponseEvents(
  options?: {
    status?: DemandResponseEvent['status']
    startDate?: string
    endDate?: string
  }
): Promise<DemandResponseEvent[]> {
  const supabase = createClient()

  let query = supabase
    .from('demand_response_events')
    .select('*')
    .order('start_at', { ascending: true })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.startDate) {
    query = query.gte('start_at', options.startDate)
  }

  if (options?.endDate) {
    query = query.lte('end_at', options.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching DR events:', error)
    return []
  }

  return (data || []).map(mapDREventFromDB)
}

/**
 * Gets electricity bill estimate
 */
export async function getElectricityBillEstimate(
  meterId: string,
  billingPeriodStart: string,
  billingPeriodEnd: string
): Promise<{
  consumptionkWh: number
  peakConsumptionkWh: number
  offPeakConsumptionkWh: number
  demandkW: number
  estimatedCost: number
  breakdown: Array<{ item: string; cost: number }>
}> {
  const consumption = await getEnergyConsumption(meterId, {
    startDate: billingPeriodStart,
    endDate: billingPeriodEnd,
    interval: '1day',
  })

  // Simplified rate calculation (in production, would use actual tariff)
  const rates = {
    peakRate: 0.25, // $/kWh
    offPeakRate: 0.12, // $/kWh
    demandRate: 10, // $/kW
    serviceCharge: 15, // $/month
    taxesPercent: 10,
  }

  // Calculate by time of day
  const peakConsumption = consumption.totalConsumptionkWh * 0.4 // Estimate
  const offPeakConsumption = consumption.totalConsumptionkWh * 0.6 // Estimate

  const energyCost = (peakConsumption * rates.peakRate) + (offPeakConsumption * rates.offPeakRate)
  const demandCost = consumption.peakDemandkW * rates.demandRate
  const subtotal = energyCost + demandCost + rates.serviceCharge
  const taxes = subtotal * (rates.taxesPercent / 100)
  const estimatedCost = subtotal + taxes

  return {
    consumptionkWh: consumption.totalConsumptionkWh,
    peakConsumptionkWh: Math.round(peakConsumption * 100) / 100,
    offPeakConsumptionkWh: Math.round(offPeakConsumption * 100) / 100,
    demandkW: consumption.peakDemandkW,
    estimatedCost: Math.round(estimatedCost * 100) / 100,
    breakdown: [
      { item: 'Peak Energy', cost: Math.round(peakConsumption * rates.peakRate * 100) / 100 },
      { item: 'Off-Peak Energy', cost: Math.round(offPeakConsumption * rates.offPeakRate * 100) / 100 },
      { item: 'Demand Charge', cost: Math.round(demandCost * 100) / 100 },
      { item: 'Service Charge', cost: rates.serviceCharge },
      { item: 'Taxes', cost: Math.round(taxes * 100) / 100 },
    ],
  }
}

/**
 * Gets all meter statistics
 */
export async function getMeterStatistics(
  meterId: string,
  days: number = 30
): Promise<{
  totalConsumption: number
  peakDemand: number
  averageDailyConsumption: number
  outageCount: number
  totalOutageDuration: number
  powerQualityScore: number
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const consumption = await getEnergyConsumption(meterId, {
    startDate: startDate.toISOString(),
    endDate: new Date().toISOString(),
  })

  const outages = await getMeterOutageEvents(meterId, {
    startDate: startDate.toISOString(),
  })

  const latestQuality = await getPowerQualityData(meterId)

  const totalOutageDuration = outages.reduce((sum, o) => sum + (o.duration || 0), 0)

  return {
    totalConsumption: consumption.totalConsumptionkWh,
    peakDemand: consumption.peakDemandkW,
    averageDailyConsumption: consumption.totalConsumptionkWh / days,
    outageCount: outages.length,
    totalOutageDuration,
    powerQualityScore: latestQuality?.overallScore || 0,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to SmartMeter
 */
function mapMeterFromDB(data: Record<string, unknown>): SmartMeter {
  return {
    id: data.id as string,
    meterId: data.meter_id as string,
    userId: data.user_id as string | undefined,
    locationId: data.location_id as string | undefined,
    type: data.type as SmartMeterType,
    manufacturer: data.manufacturer as string | undefined,
    model: data.model as string | undefined,
    serialNumber: data.serial_number as string | undefined,
    firmwareVersion: data.firmware_version as string | undefined,
    protocol: data.protocol as SmartMeter['protocol'],
    connectionStatus: data.connection_status as SmartMeterStatus,
    lastSeenAt: data.last_seen_at as string | undefined,
    ipAddress: data.ip_address as string | undefined,
    batteryLevel: data.battery_level as number | undefined,
    signalStrength: data.signal_strength as number | undefined,
    installedAt: data.installed_at as string | undefined,
    lastReadingAt: data.last_reading_at as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to MeterReading
 */
function mapReadingFromDB(data: Record<string, unknown>): MeterReading {
  return {
    id: data.id as string,
    meterId: data.meter_id as string,
    type: data.type as MeterReadingType,
    interval: data.interval as DataInterval,
    activeEnergykWh: data.active_energy_kwh as number | undefined,
    reactiveEnergykVarh: data.reactive_energy_kvarh as number | undefined,
    activePowerkW: data.active_power_kw as number | undefined,
    reactivePowerkVar: data.reactive_power_kvar as number | undefined,
    apparentPowerkVA: data.apparent_power_kva as number | undefined,
    powerFactor: data.power_factor as number | undefined,
    voltageV: data.voltage_v as number | undefined,
    currentA: data.current_a as number | undefined,
    frequencyHz: data.frequency_hz as number | undefined,
    demandkW: data.demand_kw as number | undefined,
    peakDemandkW: data.peak_demand_kw as number | undefined,
    outageCount: data.outage_count as number | undefined,
    outageDuration: data.outage_duration as number | undefined,
    rawData: data.raw_data as Record<string, unknown> | undefined,
    readingAt: data.reading_at as string,
    createdAt: data.created_at as string,
  }
}

/**
 * Maps database record to MeterOutageEvent
 */
function mapOutageEventFromDB(data: Record<string, unknown>): MeterOutageEvent {
  return {
    id: data.id as string,
    meterId: data.meter_id as string,
    type: data.type as MeterOutageEvent['type'],
    severity: data.severity as MeterOutageEvent['severity'],
    startedAt: data.started_at as string,
    endedAt: data.ended_at as string | undefined,
    duration: data.duration as number | undefined,
    customersAffected: data.customers_affected as number | undefined,
    areaAffected: data.area_affected as string | undefined,
    restoredAt: data.restored_at as string | undefined,
    restorationMethod: data.restoration_method as string | undefined,
    cause: data.cause as string | undefined,
    equipmentFailed: data.equipment_failed as string | undefined,
    verified: data.verified as boolean,
    verifiedBy: data.verified_by as string | undefined,
    createdAt: data.created_at as string,
  }
}

/**
 * Maps database record to DemandResponseEvent
 */
function mapDREventFromDB(data: Record<string, unknown>): DemandResponseEvent {
  return {
    id: data.id as string,
    utilityId: data.utility_id as string | undefined,
    name: data.name as string,
    description: data.description as string | undefined,
    type: data.type as DemandResponseEvent['type'],
    status: data.status as DemandResponseEvent['status'],
    startAt: data.start_at as string,
    endAt: data.end_at as string,
    duration: data.duration as number,
    targetReductionkW: data.target_reduction_kw as number | undefined,
    actualReductionkW: data.actual_reduction_kw as number | undefined,
    participatingCustomers: data.participating_customers as number | undefined,
    incentiveRate: data.incentive_rate as number | undefined,
    totalIncentivePaid: data.total_incentive_paid as number | undefined,
    alertsEnabled: data.alerts_enabled as boolean,
    alertSentAt: data.alert_sent_at as string | undefined,
    createdAt: data.created_at as string,
  }
}

/**
 * Maps database record to SolarProduction
 */
function mapSolarProductionFromDB(data: Record<string, unknown>): SolarProduction {
  return {
    meterId: data.meter_id as string,
    period: {
      start: data.period_start as string,
      end: data.period_end as string,
      interval: data.interval as DataInterval,
    },
    totalProductionkWh: data.total_production_kwh as number,
    peakProductionkW: data.peak_production_kw as number,
    averageProductionkW: data.average_production_kw as number,
    efficiencyPercent: data.efficiency_percent as number | undefined,
    performanceRatio: data.performance_ratio as number | undefined,
    expectedProductionkWh: data.expected_production_kwh as unknown as number | undefined,
    actualProductionkWh: data.actual_production_kwh as unknown as number | undefined,
    productionVariancePercent: data.production_variance_percent as unknown as number | undefined,
    panelCapacitykWp: data.panel_capacity_kwp as unknown as number | undefined,
    inverterCapacitykVA: data.inverter_capacity_kva as unknown as number | undefined,
    orientation: data.orientation as unknown as string | undefined,
    tiltAngle: data.tilt_angle as unknown as number | undefined,
  }
}
