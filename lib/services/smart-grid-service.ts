import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import {
  type SmartMeter,
  type SmartMeterStatus,
  type MeterReading,
} from './smart-meter-service'

// ============================================================================
// Types - IoT/Smart Grid
// ============================================================================

/**
 * IoT device type
 */
export type IoTDeviceType = 
  | 'smart_meter'
  | 'grid_sensor'
  | 'distribution_automation'
  | 'fault_detector'
  | 'voltage_monitor'
  | 'load_sensor'
  | 'switchgear'
  | 'recloser'
  | 'capacitor_bank'
  | 'transformer_monitor'
  | 'smart_thermostat'
  | 'smart_plug'
  | 'smart_lighting'
  | 'ev_charger'
  | 'solar_inverter'
  | 'battery_storage'
  | 'wind_turbine'
  | 'other'

/**
 * IoT device status
 */
export type IoTDeviceStatus = 
  | 'online'
  | 'offline'
  | 'warning'
  | 'error'
  | 'maintenance'
  | 'disabled'
  | 'pending_installation'

/**
 * Grid status
 */
export type GridStatus = 
  | 'normal'
  | 'stressed'
  | 'overloaded'
  | 'partial_outage'
  | 'widespread_outage'
  | 'restoring'
  | 'islanded'

/**
 * Grid component type
 */
export type GridComponentType = 
  | 'transmission_line'
  | 'distribution_line'
  | 'substation'
  | 'transformer'
  | 'switching_station'
  | 'generator'
  | 'renewable_source'
  | 'storage'
  | 'demand_response'

/**
 * Grid component status
 */
export type GridComponentStatus = 
  | 'operational'
  | 'degraded'
  | 'fault'
  | 'maintenance'
  | 'offline'

/**
 * Smart meter reading type
 */
export type MeterReadingType = 
  | 'instantaneous_power'
  | 'energy_consumption'
  | 'voltage'
  | 'current'
  | 'power_factor'
  | 'frequency'
  | 'demand_peak'
  | 'reactive_power'
  | 'total_harmonics'

/**
 * Smart home device type
 */
export type SmartHomeDeviceType = 
  | 'thermostat'
  | 'lighting'
  | 'plug'
  | 'switch'
  | 'sensor'
  | 'camera'
  | 'lock'
  | 'garage_door'
  | 'appliance'
  | 'ev_charger'
  | 'solar'
  | 'battery'
  | 'generator'

/**
 * Demand response event status
 */
export type DemandResponseStatus = 
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'failed'

/**
 * IoT device registration input
 */
export interface IoTDeviceRegistrationInput {
  // Device info
  deviceId: string
  type: IoTDeviceType
  manufacturer: string
  model: string
  firmwareVersion?: string
  
  // Location
  latitude: number
  longitude: number
  municipality: string
  parish?: string
  address?: string
  
  // Grid location
  gridSection?: string
  substationId?: string
  feederId?: string
  
  // Owner/operator
  ownerId?: string
  operatorId?: string
  
  // Communication
  protocol: 'mqtt' | 'http' | 'https' | 'coap' | 'modbus' | 'bacnet' | ' proprietary'
  endpoint?: string
  
  // Metadata
  metadata?: Record<string, unknown>
}

/**
 * IoT device
 */
export interface IoTDevice {
  id: string
  deviceId: string
  type: IoTDeviceType
  status: IoTDeviceStatus
  manufacturer: string
  model: string
  firmwareVersion?: string
  
  // Location
  latitude: number
  longitude: number
  municipality: string
  parish?: string
  address?: string
  
  // Grid location
  gridSection?: string
  substationId?: string
  feederId?: string
  
  // Owner/operator
  ownerId?: string
  operatorId?: string
  
  // Communication
  protocol: string
  endpoint?: string
  
  // Status info
  lastSeen?: string
  lastReading?: Record<string, unknown>
  batteryLevel?: number
  signalStrength?: number
  
  // Metadata
  metadata?: Record<string, unknown>
  
  // Timestamps
  registeredAt: string
  lastUpdated: string
  createdAt: string
  updatedAt: string
}

/**
 * IoT device reading
 */
export interface IoTDeviceReading {
  id: string
  deviceId: string
  
  // Reading type
  type: MeterReadingType | string
  value: number
  unit: string
  
  // Quality
  quality: 'good' | 'uncertain' | 'bad'
  
  // Timestamp
  timestamp: string
  
  // Additional data
  metadata?: Record<string, unknown>
  
  createdAt: string
}

/**
 * Smart meter data
 */
export interface SmartMeterData {
  id: string
  meterId: string
  
  // Customer info
  customerId?: string
  servicePointId?: string
  
  // Location
  latitude: number
  longitude: number
  municipality: string
  
  // Readings
  readings: {
    type: MeterReadingType
    value: number
    unit: string
    timestamp: string
  }[]
  
  // Status
  status: IoTDeviceStatus
  lastCommunication?: string
  
  // Alerts
  activeAlerts?: string[]
  
  // Interval data
  intervalData?: {
    startTime: string
    endTime: string
    consumption: number
    demand: number
  }[]
  
  createdAt: string
  updatedAt: string
}

/**
 * Grid component
 */
export interface GridComponent {
  id: string
  componentId: string
  type: GridComponentType
  name: string
  
  // Location
  latitude: number
  longitude: number
  municipality: string
  
  // Status
  status: GridComponentStatus
  
  // Capacity
  capacity?: number
  capacityUnit?: string
  currentLoad?: number
  
  // Ownership
  owner?: string
  operator?: string
  
  // Connectivity
  connectedComponents?: string[]
  
  // Metrics
  metrics?: {
    availability: number
    reliability: number
    efficiency: number
  }
  
  // Maintenance
  lastMaintenance?: string
  nextMaintenance?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Grid status
 */
export interface GridStatusData {
  id: string
  
  // Overall status
  status: GridStatus
  
  // Demand
  currentDemand: number
  peakDemand: number
  demandUnit: string
  
  // Generation
  totalGeneration: number
  renewableGeneration: number
  fossilGeneration: number
  
  // Capacity
  totalCapacity: number
  availableCapacity: number
  
  // Frequency
  frequency: number
  
  // Outages
  activeOutages: number
  customersAffected: number
  
  // Restoration
  estimatedRestoration?: string
  
  // Regional breakdown
  regions?: {
    name: string
    status: GridStatus
    demand: number
    generation: number
    outages: number
  }[]
  
  // Timestamps
  timestamp: string
  nextUpdate?: string
}

/**
 * Smart home device
 */
export interface SmartHomeDevice {
  id: string
  deviceId: string
  userId: string
  type: SmartHomeDeviceType
  name: string
  manufacturer: string
  model: string
  
  // Location
  latitude?: number
  longitude?: number
  locationDescription?: string
  
  // Status
  status: IoTDeviceStatus
  isControllable: boolean
  
  // State
  state?: Record<string, unknown>
  
  // Integration
  integration: 'matter' | 'zigbee' | 'zwave' | 'wifi' | 'bluetooth' | 'proprietary'
  hubId?: string
  
  // Energy
  energyConsumption?: number
  energyUnit?: string
  
  // Alerts
  alertsEnabled: boolean
  
  createdAt: string
  updatedAt: string
}

/**
 * Demand response event
 */
export interface DemandResponseEvent {
  id: string
  eventId: string
  
  // Event details
  name: string
  description?: string
  status: DemandResponseStatus
  
  // Timing
  startTime: string
  endTime: string
  duration: number // minutes
  
  // Target
  targetType: 'region' | 'customer_group' | 'individual'
  targetId: string
  
  // Actions
  action: 'reduce_load' | 'shift_load' | 'shed_load' | 'battery_discharge'
  targetReduction: number
  reductionUnit: string
  
  // Participation
  enrolledCustomers: number
  participatingCustomers: number
  achievedReduction: number
  
  // Incentives
  incentiveType: 'direct' | 'bill_credit' | 'reward_points'
  incentiveAmount?: number
  
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Validation Schemas - IoT/Smart Grid
// ============================================================================

/**
 * Schema for IoT device registration
 */
export const iotDeviceRegistrationSchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum([
    'smart_meter',
    'grid_sensor',
    'distribution_automation',
    'fault_detector',
    'voltage_monitor',
    'load_sensor',
    'switchgear',
    'recloser',
    'capacitor_bank',
    'transformer_monitor',
    'smart_thermostat',
    'smart_plug',
    'smart_lighting',
    'ev_charger',
    'solar_inverter',
    'battery_storage',
    'wind_turbine',
    'other',
  ]),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  firmwareVersion: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  municipality: z.string().min(1),
  parish: z.string().optional(),
  address: z.string().optional(),
  gridSection: z.string().optional(),
  substationId: z.string().optional(),
  feederId: z.string().optional(),
  ownerId: z.string().optional(),
  operatorId: z.string().optional(),
  protocol: z.enum(['mqtt', 'http', 'https', 'coap', 'modbus', 'bacnet', 'proprietary']),
  endpoint: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export interface GridRegionStatus {
  name: string
  status: GridStatus
  demand: number
  capacity: number
  customers: number
  generation: number
  outages: number
}

/**
 * Schema for IoT device reading
 */
export const iotDeviceReadingSchema = z.object({
  deviceId: z.string().min(1),
  type: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  quality: z.enum(['good', 'uncertain', 'bad']).default('good'),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Schema for demand response event
 */
export const demandResponseEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  targetType: z.enum(['region', 'customer_group', 'individual']),
  targetId: z.string().min(1),
  action: z.enum(['reduce_load', 'shift_load', 'shed_load', 'battery_discharge']),
  targetReduction: z.number().positive(),
  reductionUnit: z.string().default('kW'),
  incentiveType: z.enum(['direct', 'bill_credit', 'reward_points']),
  incentiveAmount: z.number().optional(),
})

/**
 * Schema for smart home device registration
 */
export const smartHomeDeviceSchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum([
    'thermostat',
    'lighting',
    'plug',
    'switch',
    'sensor',
    'camera',
    'lock',
    'garage_door',
    'appliance',
    'ev_charger',
    'solar',
    'battery',
    'generator',
  ]),
  name: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationDescription: z.string().optional(),
  integration: z.enum(['matter', 'zigbee', 'zwave', 'wifi', 'bluetooth', 'proprietary']),
  hubId: z.string().optional(),
  alertsEnabled: z.boolean().default(true),
})

// ============================================================================
// Helper Functions - IoT/Smart Grid
// ============================================================================

/**
 * Gets display name for IoT device type
 */
export function getIoTDeviceTypeName(type: IoTDeviceType): string {
  const names: Record<IoTDeviceType, string> = {
    smart_meter: 'Smart Meter',
    grid_sensor: 'Grid Sensor',
    distribution_automation: 'Distribution Automation',
    fault_detector: 'Fault Detector',
    voltage_monitor: 'Voltage Monitor',
    load_sensor: 'Load Sensor',
    switchgear: 'Switchgear',
    recloser: 'Recloser',
    capacitor_bank: 'Capacitor Bank',
    transformer_monitor: 'Transformer Monitor',
    smart_thermostat: 'Smart Thermostat',
    smart_plug: 'Smart Plug',
    smart_lighting: 'Smart Lighting',
    ev_charger: 'EV Charger',
    solar_inverter: 'Solar Inverter',
    battery_storage: 'Battery Storage',
    wind_turbine: 'Wind Turbine',
    other: 'Other Device',
  }
  return names[type]
}

/**
 * Gets grid status badge
 */
export function getGridStatusBadge(status: GridStatus): {
  label: string
  color: string
} {
  const badges: Record<GridStatus, { label: string; color: string }> = {
    normal: { label: 'Normal', color: 'bg-green-100 text-green-800' },
    stressed: { label: 'Stressed', color: 'bg-yellow-100 text-yellow-800' },
    overloaded: { label: 'Overloaded', color: 'bg-orange-100 text-orange-800' },
    partial_outage: { label: 'Partial Outage', color: 'bg-red-100 text-red-800' },
    widespread_outage: { label: 'Widespread Outage', color: 'bg-red-200 text-red-900' },
    restoring: { label: 'Restoring', color: 'bg-blue-100 text-blue-800' },
    islanded: { label: 'Isolated', color: 'bg-purple-100 text-purple-800' },
  }
  return badges[status]
}

/**
 * Gets device status badge
 */
export function getDeviceStatusBadge(status: IoTDeviceStatus): {
  label: string
  color: string
} {
  const badges: Record<IoTDeviceStatus, { label: string; color: string }> = {
    online: { label: 'Online', color: 'bg-green-100 text-green-800' },
    offline: { label: 'Offline', color: 'bg-gray-100 text-gray-800' },
    warning: { label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
    error: { label: 'Error', color: 'bg-red-100 text-red-800' },
    maintenance: { label: 'Maintenance', color: 'bg-blue-100 text-blue-800' },
    disabled: { label: 'Disabled', color: 'bg-gray-200 text-gray-600' },
    pending_installation: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  }
  return badges[status]
}

// ============================================================================
// Main Service Functions - IoT/Smart Grid
// ============================================================================

/**
 * Registers an IoT device
 */
export async function registerIoTDevice(
  input: z.infer<typeof iotDeviceRegistrationSchema>
): Promise<IoTDevice> {
  const validationResult = iotDeviceRegistrationSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid device registration: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('iot_devices')
    .insert({
      device_id: validatedInput.deviceId,
      type: validatedInput.type,
      status: 'online',
      manufacturer: validatedInput.manufacturer,
      model: validatedInput.model,
      firmware_version: validatedInput.firmwareVersion || null,
      latitude: validatedInput.latitude,
      longitude: validatedInput.longitude,
      municipality: validatedInput.municipality,
      parish: validatedInput.parish || null,
      address: validatedInput.address || null,
      grid_section: validatedInput.gridSection || null,
      substation_id: validatedInput.substationId || null,
      feeder_id: validatedInput.feederId || null,
      owner_id: validatedInput.ownerId || null,
      operator_id: validatedInput.operatorId || null,
      protocol: validatedInput.protocol,
      endpoint: validatedInput.endpoint || null,
      metadata: validatedInput.metadata || null,
      registered_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error registering IoT device:', error)
    throw new Error(`Failed to register device: ${error.message}`)
  }

  return mapIoTDeviceFromDB(data)
}

/**
 * Gets IoT devices by location
 */
export async function getIoTDevicesByLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  options?: {
    type?: IoTDeviceType[]
    status?: IoTDeviceStatus[]
  }
): Promise<IoTDevice[]> {
  const supabase = createClient()

  const latDelta = radiusKm / 111
  const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))

  let query = supabase
    .from('iot_devices')
    .select('*')
    .gte('latitude', latitude - latDelta)
    .lte('latitude', latitude + latDelta)
    .gte('longitude', longitude - lonDelta)
    .lte('longitude', longitude + lonDelta)

  if (options?.type && options.type.length > 0) {
    query = query.in('type', options.type)
  }

  if (options?.status && options.status.length > 0) {
    query = query.in('status', options.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching IoT devices:', error)
    return []
  }

  return (data || []).map(mapIoTDeviceFromDB)
}

/**
 * Gets IoT device by ID
 */
export async function getIoTDevice(deviceId: string): Promise<IoTDevice | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('iot_devices')
    .select('*')
    .eq('device_id', deviceId)
    .single()

  if (error) {
    console.error('Error fetching IoT device:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapIoTDeviceFromDB(data)
}

/**
 * Updates IoT device status
 */
export async function updateIoTDeviceStatus(
  deviceId: string,
  status: IoTDeviceStatus,
  reading?: Record<string, unknown>
): Promise<void> {
  const supabase = createClient()

  const updates: Record<string, unknown> = {
    status,
    last_seen: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (reading) {
    updates.last_reading = reading
  }

  await supabase
    .from('iot_devices')
    .update(updates)
    .eq('device_id', deviceId)
}

/**
 * Records IoT device reading
 */
export async function recordDeviceReading(
  input: z.infer<typeof iotDeviceReadingSchema>
): Promise<IoTDeviceReading> {
  const validationResult = iotDeviceReadingSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid device reading: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('iot_device_readings')
    .insert({
      device_id: validatedInput.deviceId,
      type: validatedInput.type,
      value: validatedInput.value,
      unit: validatedInput.unit,
      quality: validatedInput.quality,
      timestamp: validatedInput.timestamp || new Date().toISOString(),
      metadata: validatedInput.metadata || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error recording device reading:', error)
    throw new Error(`Failed to record reading: ${error.message}`)
  }

  return {
    id: data.id as string,
    deviceId: data.device_id as string,
    type: data.type as string,
    value: data.value as number,
    unit: data.unit as string,
    quality: data.quality as 'good' | 'uncertain' | 'bad',
    timestamp: (data.timestamp as string | undefined) || new Date().toISOString(),
    metadata: (data.metadata as Record<string, unknown>) || undefined,
    createdAt: data.created_at as string,
  }
}

/**
 * Gets smart meter data
 */
export async function getSmartMeterData(
  meterId: string
): Promise<SmartMeterData | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('smart_meters')
    .select('*')
    .eq('meter_id', meterId)
    .single()

  if (error) {
    console.error('Error fetching smart meter data:', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id as string,
    meterId: data.meter_id as string,
    customerId: data.customer_id as string | undefined,
    servicePointId: data.service_point_id as string | undefined,
    latitude: data.latitude as number,
    longitude: data.longitude as number,
    municipality: data.municipality as string,
    readings: ((data.readings as any[]) || []).map(r => ({
      type: r.type,
      value: r.value,
      unit: r.unit,
      timestamp: r.read_at
    })),
    status: data.status as SmartMeterStatus,
    lastCommunication: data.last_communication as string | undefined,
    activeAlerts: (data.active_alerts as string[]) || [],
    intervalData: ((data.interval_data as any[]) || []).map((d: any) => ({
      startTime: d.startTime,
      endTime: d.endTime,
      consumption: d.consumption,
      demand: d.demand
    })),
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Gets grid status
 */
export async function getGridStatus(
  region?: string
): Promise<GridStatusData | null> {
  const supabase = createClient()

  let query = supabase
    .from('grid_status')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)

  if (region) {
    query = query.eq('region', region)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching grid status:', error)
    return null
  }

  if (!data || data.length as number === 0) {
    return null
  }

  const status = data[0]
  return {
    id: status.id as string,
    status: status.status as GridStatus,
    currentDemand: status.current_demand as number,
    peakDemand: status.peak_demand as number,
    demandUnit: status.demand_unit as string,
    totalGeneration: status.total_generation as number,
    renewableGeneration: status.renewable_generation as number,
    fossilGeneration: status.fossil_generation as number,
    totalCapacity: status.total_capacity as number,
    availableCapacity: status.available_capacity as number,
    frequency: status.frequency as number,
    activeOutages: status.active_outages as number,
    customersAffected: status.customers_affected as number,
    estimatedRestoration: status.estimated_restoration as string | undefined,
    regions: (status.regions as GridRegionStatus[]) || [],
    timestamp: status.timestamp as string,
    nextUpdate: status.next_update as string | undefined,
  }
}

/**
 * Gets grid components by status
 */
export async function getGridComponents(
  options?: {
    municipality?: string
    type?: GridComponentType[]
    status?: GridComponentStatus[]
  }
): Promise<GridComponent[]> {
  const supabase = createClient()

  let query = supabase.from('grid_components').select('*')

  if (options?.municipality) {
    query = query.eq('municipality', options.municipality)
  }

  if (options?.type && options.type.length > 0) {
    query = query.in('type', options.type)
  }

  if (options?.status && options.status.length > 0) {
    query = query.in('status', options.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching grid components:', error)
    return []
  }

  return (data || []).map(component => ({
    id: component.id as string,
    componentId: component.component_id as string,
    type: component.type as GridComponentType,
    name: component.name as string,
    latitude: component.latitude as number,
    longitude: component.longitude as number,
    municipality: component.municipality as string,
    status: component.status as GridComponentStatus,
    location: component.location as string | undefined,
    installedAt: component.installed_at as string,
    lastInspected: component.last_inspected as string | undefined,
    nextMaintenace: component.next_maintenance as string | undefined,
    capacity: component.capacity as number | undefined,
    capacityUnit: component.capacity_unit as string | undefined,
    currentLoad: component.current_load as number | undefined,
    owner: component.owner as string | undefined,
    operator: component.operator as string | undefined,
    connectedComponents: (component.connected_components as string[]) || [],
    // Metrics
    metrics: (component.metrics as unknown as {
      availability: number
      reliability: number
      efficiency: number
    }) || {
      availability: 0,
      reliability: 0,
      efficiency: 0
    },
    // Connections
    connectedCustomers: component.connected_customers as number,
    lastMaintenance: component.last_maintenance as string | undefined,
    nextMaintenance: component.next_maintenance as string | undefined,
    createdAt: component.created_at as string,
    updatedAt: component.updated_at as string,
  }))
}

/**
 * Registers a smart home device
 */
export async function registerSmartHomeDevice(
  userId: string,
  input: z.infer<typeof smartHomeDeviceSchema>
): Promise<SmartHomeDevice> {
  const validationResult = smartHomeDeviceSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid device registration: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const { data, error } = await supabase
    .from('smart_home_devices')
    .insert({
      user_id: userId,
      device_id: validatedInput.deviceId,
      type: validatedInput.type,
      name: validatedInput.name,
      manufacturer: validatedInput.manufacturer,
      model: validatedInput.model,
      latitude: validatedInput.latitude || null,
      longitude: validatedInput.longitude || null,
      location_description: validatedInput.locationDescription || null,
      status: 'online',
      is_controllable: true,
      integration: validatedInput.integration,
      hub_id: validatedInput.hubId || null,
      alerts_enabled: validatedInput.alertsEnabled,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error registering smart home device:', error)
    throw new Error(`Failed to register device: ${error.message}`)
  }

  return {
    id: data.id as string,
    deviceId: data.device_id as string,
    userId: data.user_id as string,
    type: data.type as SmartHomeDeviceType,
    name: data.name as string,
    manufacturer: data.manufacturer as string,
    model: data.model as string,
    latitude: data.latitude as number | undefined,
    longitude: data.longitude as number | undefined,
    locationDescription: data.location_description as string | undefined,
    status: data.status as IoTDeviceStatus,
    isControllable: data.is_controllable as boolean,
    state: (data.state as Record<string, unknown>) || undefined,
    integration: data.integration as 'matter' | 'zigbee' | 'zwave' | 'wifi' | 'bluetooth' | 'proprietary',
    hubId: data.hub_id as string | undefined,
    energyConsumption: data.energy_consumption as number | undefined,
    energyUnit: data.energy_unit as string | undefined,
    alertsEnabled: data.alerts_enabled as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Gets user's smart home devices
 */
export async function getUserSmartHomeDevices(
  userId: string
): Promise<SmartHomeDevice[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('smart_home_devices')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching smart home devices:', error)
    return []
  }

  return (data || []).map(device => ({
    id: device.id as string,
    deviceId: device.device_id as string,
    userId: device.user_id as string,
    type: device.type as SmartHomeDeviceType,
    name: device.name as string,
    manufacturer: device.manufacturer as string,
    model: device.model as string,
    latitude: device.latitude as number | undefined,
    longitude: device.longitude as number | undefined,
    locationDescription: device.location_description as string | undefined,
    status: device.status as IoTDeviceStatus,
    isControllable: device.is_controllable as boolean,
    state: (device.state as Record<string, unknown>) || undefined,
    integration: device.integration as 'matter' | 'zigbee' | 'zwave' | 'wifi' | 'bluetooth' | 'proprietary',
    hubId: device.hub_id as string | undefined,
    energyConsumption: device.energy_consumption as number | undefined,
    energyUnit: device.energy_unit as string | undefined,
    alertsEnabled: device.alerts_enabled as boolean,
    createdAt: device.created_at as string,
    updatedAt: device.updated_at as string,
  }))
}

/**
 * Controls a smart home device
 */
export async function controlSmartHomeDevice(
  deviceId: string,
  action: string,
  parameters?: Record<string, unknown>
): Promise<void> {
  const supabase = createClient()

  // Log the control action
  const { error } = await supabase
    .from('smart_home_device_actions')
    .insert({
      device_id: deviceId,
      action,
      parameters: parameters || null,
      executed_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error controlling smart home device:', error)
    throw new Error(`Failed to control device: ${error.message}`)
  }

  // Update device state if applicable
  if (parameters) {
    await supabase
      .from('smart_home_devices')
      .update({
        state: parameters,
        updated_at: new Date().toISOString(),
      })
      .eq('device_id', deviceId)
  }
}

/**
 * Creates a demand response event
 */
export async function createDemandResponseEvent(
  input: z.infer<typeof demandResponseEventSchema>
): Promise<DemandResponseEvent> {
  const validationResult = demandResponseEventSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid event data: ${validationResult.error.message}`)
  }

  const validatedInput = validationResult.data
  const supabase = createClient()

  const eventId = `DR-${Date.now().toString(36).toUpperCase()}`
  const startTime = new Date(validatedInput.startTime)
  const endTime = new Date(validatedInput.endTime)
  const duration = (endTime.getTime() - startTime.getTime()) / 60000 // minutes

  const { data, error } = await supabase
    .from('demand_response_events')
    .insert({
      event_id: eventId,
      name: validatedInput.name,
      description: validatedInput.description || null,
      status: 'scheduled',
      start_time: validatedInput.startTime,
      end_time: validatedInput.endTime,
      duration,
      target_type: validatedInput.targetType,
      target_id: validatedInput.targetId,
      action: validatedInput.action,
      target_reduction: validatedInput.targetReduction,
      reduction_unit: validatedInput.reductionUnit,
      incentive_type: validatedInput.incentiveType,
      incentive_amount: validatedInput.incentiveAmount || null,
      enrolled_customers: 0,
      participating_customers: 0,
      achieved_reduction: 0,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating demand response event:', error)
    throw new Error(`Failed to create event: ${error.message}`)
  }

  return {
    id: data.id as string,
    eventId: data.event_id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    status: data.status as DemandResponseStatus,
    startTime: data.start_time as string,
    endTime: data.end_time as string,
    duration: data.duration as number,
    targetType: data.target_type as 'region' | 'customer_group' | 'individual',
    targetId: data.target_id as string,
    action: data.action as 'reduce_load' | 'shift_load' | 'shed_load' | 'battery_discharge',
    targetReduction: data.target_reduction as number,
    reductionUnit: data.reduction_unit as string,
    enrolledCustomers: (data.enrolled_customers as number) || 0,
    participatingCustomers: (data.participating_customers as number) || 0,
    achievedReduction: (data.achieved_reduction as number) || 0,
    incentiveType: data.incentive_type as 'direct' | 'bill_credit' | 'reward_points',
    incentiveAmount: data.incentive_amount as number | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Gets demand response events
 */
export async function getDemandResponseEvents(
  options?: {
    status?: DemandResponseStatus[]
    targetType?: string
    targetId?: string
  }
): Promise<DemandResponseEvent[]> {
  const supabase = createClient()

  let query = supabase
    .from('demand_response_events')
    .select('*')
    .order('start_time', { ascending: true })

  if (options?.status && options.status.length > 0) {
    query = query.in('status', options.status)
  }

  if (options?.targetType) {
    query = query.eq('target_type', options.targetType)
  }

  if (options?.targetId) {
    query = query.eq('target_id', options.targetId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching demand response events:', error)
    return []
  }

  return (data || []).map(event => ({
    id: event.id as string,
    eventId: event.event_id as string,
    name: event.name as string,
    description: event.description as string | undefined,
    status: event.status as DemandResponseStatus,
    startTime: event.start_time as string,
    endTime: event.end_time as string,
    duration: event.duration as number,
    targetType: event.target_type as 'region' | 'customer_group' | 'individual',
    targetId: event.target_id as string,
    action: event.action as 'reduce_load' | 'shift_load' | 'shed_load' | 'battery_discharge',
    targetReduction: event.target_reduction as number,
    reductionUnit: event.reduction_unit as string,
    enrolledCustomers: (event.enrolled_customers as number) || 0,
    participatingCustomers: (event.participating_customers as number) || 0,
    achievedReduction: (event.achieved_reduction as number) || 0,
    incentiveType: event.incentive_type as 'direct' | 'bill_credit' | 'reward_points',
    incentiveAmount: event.incentive_amount as number | undefined,
    createdAt: event.created_at as string,
    updatedAt: event.updated_at as string,
  }))
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to IoTDevice
 */
function mapIoTDeviceFromDB(data: Record<string, unknown>): IoTDevice {
  return {
    id: data.id as string,
    deviceId: data.device_id as string,
    type: data.type as IoTDeviceType,
    status: data.status as IoTDeviceStatus,
    manufacturer: data.manufacturer as string,
    model: data.model as string,
    firmwareVersion: data.firmware_version as string | undefined,
    latitude: data.latitude as number,
    longitude: data.longitude as number,
    municipality: data.municipality as string,
    parish: data.parish as string | undefined,
    address: data.address as string | undefined,
    gridSection: data.grid_section as string | undefined,
    substationId: data.substation_id as string | undefined,
    feederId: data.feeder_id as string | undefined,
    ownerId: data.owner_id as string | undefined,
    operatorId: data.operator_id as string | undefined,
    protocol: data.protocol as IoTDevice['protocol'],
    endpoint: data.endpoint as string | undefined,
    lastSeen: data.last_seen as string | undefined,
    lastReading: (data.last_reading as Record<string, unknown>) || undefined,
    batteryLevel: data.battery_level as number | undefined,
    signalStrength: data.signal_strength as number | undefined,
    metadata: (data.metadata as Record<string, unknown>) || undefined,
    registeredAt: data.registered_at as string,
    lastUpdated: (data.last_updated as string | undefined) || new Date().toISOString(),
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
