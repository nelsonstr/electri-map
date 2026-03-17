import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * IoT device type
 */
export type IoTDeviceType = 
  | 'smart_thermostat'
  | 'smart_light'
  | 'smart_switch'
  | 'smart_plug'
  | 'smart_sensor'
  | 'smart_camera'
  | 'smart_lock'
  | 'smart_doorbell'
  | 'smart_smoke_detector'
  | 'smart_co_detector'
  | 'smart_water_sensor'
  | 'smart_weather_station'
  | 'smart_grid_sensor'
  | 'smart_meter'
  | 'smart_transformer_monitor'
  | 'smart_outage_detector'
  | 'smart_breaker'
  | 'ev_charger'
  | 'solar_inverter'
  | 'battery_storage'
  | 'wind_turbine_monitor'
  | 'generator'
  | 'ups'
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
  | 'pending_pairing'
  | 'paired'

/**
 * IoT protocol type
 */
export type IoTProtocol = 
  | 'wifi'
  | 'zigbee'
  | 'zwave'
  | 'bluetooth'
  | 'bluetooth_le'
  | 'thread'
  | 'matter'
  | 'mqtt'
  | 'coap'
  | 'modbus'
  | 'bacnet'
  | 'opc_ua'
  | 'cellular'
  | 'lorawan'
  | 'satellite'
  | 'proprietary'

/**
 * IoT device capability
 */
export type IoTCapability = 
  | 'on_off'
  | 'dimmer'
  | 'color_control'
  | 'temperature_control'
  | 'humidity_sensing'
  | 'motion_sensing'
  | 'light_sensing'
  | 'power_monitoring'
  | 'energy_monitoring'
  | 'voltage_sensing'
  | 'current_sensing'
  | 'frequency_sensing'
  | 'power_factor_sensing'
  | 'outage_detection'
  | 'power_quality_monitoring'
  | 'remote_control'
  | 'firmware_update'
  | 'scene_control'
  | 'scheduling'
  | 'automation'
  | 'alert_notification'
  | 'voice_control'

/**
 * IoT device
 */
export interface IoTDevice {
  id: string
  
  // Identification
  deviceId: string
  userId?: string
  locationId?: string
  
  // Device info
  name: string
  type: IoTDeviceType
  manufacturer?: string
  model?: string
  serialNumber?: string
  firmwareVersion?: string
  
  // Connection
  protocol: IoTProtocol
  connectionStatus: IoTDeviceStatus
  lastSeenAt?: string
  ipAddress?: string
  macAddress?: string
  
  // Capabilities
  capabilities: IoTCapability[]
  
  // Status
  batteryLevel?: number
  signalStrength?: number // RSSI in dBm
  uptime?: number // seconds
  
  // State
  state?: Record<string, unknown>
  lastStateChangeAt?: string
  
  // Metadata
  metadata?: Record<string, unknown>
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * IoT device telemetry data
 */
export interface IoTTelemetry {
  id: string
  deviceId: string
  
  // Timestamp
  timestamp: string
  
  // Power metrics
  powerWatts?: number
  voltage?: number
  current?: number
  frequency?: number
  powerFactor?: number
  energykWh?: number
  
  // Environmental
  temperature?: number
  humidity?: number
  
  // Status
  status: IoTDeviceStatus
  
  // Raw data
  data?: Record<string, unknown>
  
  createdAt: string
}

/**
 * IoT device alert
 */
export interface IoTAlert {
  id: string
  deviceId: string
  
  // Alert info
  type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  
  // Data
  data?: Record<string, unknown>
  
  // Status
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolved: boolean
  resolvedAt?: string
  
  // Timestamps
  createdAt: string
}

/**
 * IoT automation rule
 */
export interface IoTAutomation {
  id: string
  userId?: string
  locationId?: string
  
  // Rule info
  name: string
  description?: string
  enabled: boolean
  
  // Trigger
  trigger: {
    type: 'device_state' | 'time' | 'schedule' | 'event' | 'webhook' | 'geofence'
    deviceId?: string
    deviceState?: Record<string, unknown>
    schedule?: string
    event?: string
    webhookUrl?: string
  }
  
  // Conditions
  conditions?: Array<{
    type: 'device_state' | 'time' | 'expression'
    deviceId?: string
    deviceState?: Record<string, unknown>
    expression?: string
  }>
  
  // Actions
  actions: Array<{
    type: 'device_command' | 'notification' | 'webhook' | 'delay' | 'scene'
    deviceId?: string
    command?: Record<string, unknown>
    message?: string
    webhookUrl?: string
    delayMs?: number
    sceneId?: string
  }>
  
  // Execution
  lastExecutedAt?: string
  executionCount: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * IoT device group/room
 */
export interface IoTDeviceGroup {
  id: string
  userId?: string
  locationId?: string
  
  name: string
  description?: string
  icon?: string
  
  deviceIds: string[]
  
  // Automation
  scenes?: Array<{
    id: string
    name: string
    state: Record<string, unknown>
  }>
  
  // Schedules
  schedules?: Array<{
    id: string
    name: string
    cron: string
    enabled: boolean
    sceneId?: string
  }>
  
  createdAt: string
  updatedAt: string
}

/**
 * Create device input
 */
export interface CreateDeviceInput {
  name: string
  type: IoTDeviceType
  manufacturer?: string
  model?: string
  serialNumber?: string
  firmwareVersion?: string
  protocol: IoTProtocol
  capabilities: IoTCapability[]
  metadata?: Record<string, unknown>
}

/**
 * Update device input
 */
export interface UpdateDeviceInput {
  name?: string
  firmwareVersion?: string
  capabilities?: IoTCapability[]
  metadata?: Record<string, unknown>
  state?: Record<string, unknown>
}

/**
 * Send command input
 */
export interface SendCommandInput {
  command: string
  params?: Record<string, unknown>
  timeout?: number // milliseconds
}

/**
 * Create automation input
 */
export interface CreateAutomationInput {
  name: string
  description?: string
  trigger: IoTAutomation['trigger']
  conditions?: IoTAutomation['conditions']
  actions: IoTAutomation['actions']
}

/**
 * Create device group input
 */
export interface CreateDeviceGroupInput {
  name: string
  description?: string
  icon?: string
  deviceIds?: string[]
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating device
 */
export const createDeviceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'smart_thermostat', 'smart_light', 'smart_switch', 'smart_plug', 'smart_sensor',
    'smart_camera', 'smart_lock', 'smart_doorbell', 'smart_smoke_detector',
    'smart_co_detector', 'smart_water_sensor', 'smart_weather_station',
    'smart_grid_sensor', 'smart_meter', 'smart_transformer_monitor',
    'smart_outage_detector', 'smart_breaker', 'ev_charger', 'solar_inverter',
    'battery_storage', 'wind_turbine_monitor', 'generator', 'ups', 'other'
  ]),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  firmwareVersion: z.string().optional(),
  protocol: z.enum([
    'wifi', 'zigbee', 'zwave', 'bluetooth', 'bluetooth_le', 'thread', 'matter',
    'mqtt', 'coap', 'modbus', 'bacnet', 'opc_ua', 'cellular', 'lorawan',
    'satellite', 'proprietary'
  ]),
  capabilities: z.array(z.enum([
    'on_off', 'dimmer', 'color_control', 'temperature_control', 'humidity_sensing',
    'motion_sensing', 'light_sensing', 'power_monitoring', 'energy_monitoring',
    'voltage_sensing', 'current_sensing', 'frequency_sensing', 'power_factor_sensing',
    'outage_detection', 'power_quality_monitoring', 'remote_control', 'firmware_update',
    'scene_control', 'scheduling', 'automation', 'alert_notification', 'voice_control'
  ])).min(1),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Schema for updating device
 */
export const updateDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  firmwareVersion: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  state: z.record(z.unknown()).optional(),
})

/**
 * Schema for sending command
 */
export const sendCommandSchema = z.object({
  command: z.string().min(1),
  params: z.record(z.unknown()).optional(),
  timeout: z.number().positive().max(30000).optional(),
})

/**
 * Schema for creating automation
 */
export const createAutomationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trigger: z.object({
    type: z.enum(['device_state', 'time', 'schedule', 'event', 'webhook', 'geofence']),
    deviceId: z.string().optional(),
    deviceState: z.record(z.unknown()).optional(),
    schedule: z.string().optional(),
    event: z.string().optional(),
    webhookUrl: z.string().url().optional(),
  }),
  conditions: z.array(z.object({
    type: z.enum(['device_state', 'time', 'expression']),
    deviceId: z.string().optional(),
    deviceState: z.record(z.unknown()).optional(),
    expression: z.string().optional(),
  })).optional(),
  actions: z.array(z.object({
    type: z.enum(['device_command', 'notification', 'webhook', 'delay', 'scene']),
    deviceId: z.string().optional(),
    command: z.record(z.unknown()).optional(),
    message: z.string().optional(),
    webhookUrl: z.string().url().optional(),
    delayMs: z.number().positive().optional(),
    sceneId: z.string().optional(),
  })).min(1),
})

/**
 * Schema for creating device group
 */
export const createDeviceGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  deviceIds: z.array(z.string()).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for device type
 */
export function getIoTDeviceTypeDisplayName(type: IoTDeviceType): string {
  const names: Record<IoTDeviceType, string> = {
    smart_thermostat: 'Smart Thermostat',
    smart_light: 'Smart Light',
    smart_switch: 'Smart Switch',
    smart_plug: 'Smart Plug',
    smart_sensor: 'Smart Sensor',
    smart_camera: 'Smart Camera',
    smart_lock: 'Smart Lock',
    smart_doorbell: 'Smart Doorbell',
    smart_smoke_detector: 'Smart Smoke Detector',
    smart_co_detector: 'Smart CO Detector',
    smart_water_sensor: 'Smart Water Sensor',
    smart_weather_station: 'Smart Weather Station',
    smart_grid_sensor: 'Smart Grid Sensor',
    smart_meter: 'Smart Meter',
    smart_transformer_monitor: 'Smart Transformer Monitor',
    smart_outage_detector: 'Smart Outage Detector',
    smart_breaker: 'Smart Breaker',
    ev_charger: 'EV Charger',
    solar_inverter: 'Solar Inverter',
    battery_storage: 'Battery Storage',
    wind_turbine_monitor: 'Wind Turbine Monitor',
    generator: 'Generator',
    ups: 'UPS',
    other: 'Other Device',
  }
  return names[type]
}

/**
 * Gets display name for protocol
 */
export function getIoTProtocolDisplayName(protocol: IoTProtocol): string {
  const names: Record<IoTProtocol, string> = {
    wifi: 'WiFi',
    zigbee: 'Zigbee',
    zwave: 'Z-Wave',
    bluetooth: 'Bluetooth',
    bluetooth_le: 'Bluetooth LE',
    thread: 'Thread',
    matter: 'Matter',
    mqtt: 'MQTT',
    coap: 'CoAP',
    modbus: 'Modbus',
    bacnet: 'BACnet',
    opc_ua: 'OPC-UA',
    cellular: 'Cellular',
    lorawan: 'LoRaWAN',
    satellite: 'Satellite',
    proprietary: 'Proprietary',
  }
  return names[protocol]
}

/**
 * Gets display name for device status
 */
export function getIoTDeviceStatusDisplayName(status: IoTDeviceStatus): string {
  const names: Record<IoTDeviceStatus, string> = {
    online: 'Online',
    offline: 'Offline',
    warning: 'Warning',
    error: 'Error',
    maintenance: 'Maintenance',
    pending_pairing: 'Pending Pairing',
    paired: 'Paired',
  }
  return names[status]
}

/**
 * Gets color for device status
 */
export function getIoTDeviceStatusColor(status: IoTDeviceStatus): string {
  const colors: Record<IoTDeviceStatus, string> = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    maintenance: 'bg-blue-500',
    pending_pairing: 'bg-orange-500',
    paired: 'bg-green-400',
  }
  return colors[status]
}

/**
 * Checks if device is power-related
 */
export function isPowerDevice(type: IoTDeviceType): boolean {
  const powerDevices: IoTDeviceType[] = [
    'smart_meter', 'smart_grid_sensor', 'smart_transformer_monitor',
    'smart_outage_detector', 'smart_breaker', 'ev_charger',
    'solar_inverter', 'battery_storage', 'wind_turbine_monitor',
    'generator', 'ups',
  ]
  return powerDevices.includes(type)
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Registers a new IoT device
 */
export async function registerDevice(
  userId: string,
  input: CreateDeviceInput
): Promise<IoTDevice> {
  const validationResult = createDeviceSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid device: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Generate unique device ID
  const deviceId = `iot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('iot_devices')
    .insert({
      device_id: deviceId,
      user_id: userId,
      name: input.name,
      type: input.type,
      manufacturer: input.manufacturer || null,
      model: input.model || null,
      serial_number: input.serialNumber || null,
      firmware_version: input.firmwareVersion || null,
      protocol: input.protocol,
      capabilities: input.capabilities,
      connection_status: 'pending_pairing',
      metadata: input.metadata || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating device:', error)
    throw new Error(`Failed to create device: ${error.message}`)
  }

  return mapDeviceFromDB(data)
}

/**
 * Updates device information
 */
export async function updateDevice(
  deviceId: string,
  input: UpdateDeviceInput
): Promise<IoTDevice> {
  const validationResult = updateDeviceSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid update: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name) updateData.name = input.name
  if (input.firmwareVersion) updateData.firmware_version = input.firmwareVersion
  if (input.capabilities) updateData.capabilities = input.capabilities
  if (input.metadata) updateData.metadata = input.metadata
  if (input.state) {
    updateData.state = input.state
    updateData.last_state_change_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('iot_devices')
    .update(updateData)
    .eq('device_id', deviceId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating device:', error)
    throw new Error(`Failed to update device: ${error.message}`)
  }

  return mapDeviceFromDB(data)
}

/**
 * Gets device by ID
 */
export async function getDevice(deviceId: string): Promise<IoTDevice | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('iot_devices')
    .select('*')
    .eq('device_id', deviceId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching device:', error)
    return null
  }

  if (!data) return null
  return mapDeviceFromDB(data)
}

/**
 * Gets user devices
 */
export async function getUserDevices(
  userId: string,
  options?: {
    type?: IoTDeviceType
    status?: IoTDeviceStatus
    connectedOnly?: boolean
  }
): Promise<IoTDevice[]> {
  const supabase = createClient()

  let query = supabase
    .from('iot_devices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.status) {
    query = query.eq('connection_status', options.status)
  }

  if (options?.connectedOnly) {
    query = query.in('connection_status', ['online', 'warning'])
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching devices:', error)
    return []
  }

  return (data || []).map(mapDeviceFromDB)
}

/**
 * Deletes device
 */
export async function deleteDevice(deviceId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('iot_devices')
    .delete()
    .eq('device_id', deviceId)

  if (error) {
    console.error('Error deleting device:', error)
    throw new Error(`Failed to delete device: ${error.message}`)
  }
}

/**
 * Updates device connection status (called by device or gateway)
 */
export async function updateDeviceStatus(
  deviceId: string,
  status: IoTDeviceStatus,
  additionalData?: {
    ipAddress?: string
    signalStrength?: number
    batteryLevel?: number
    firmwareVersion?: string
  }
): Promise<IoTDevice> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    connection_status: status,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (additionalData) {
    if (additionalData.ipAddress) updateData.ip_address = additionalData.ipAddress
    if (additionalData.signalStrength !== undefined) updateData.signal_strength = additionalData.signalStrength
    if (additionalData.batteryLevel !== undefined) updateData.battery_level = additionalData.batteryLevel
    if (additionalData.firmwareVersion) updateData.firmware_version = additionalData.firmwareVersion
  }

  const { data, error } = await supabase
    .from('iot_devices')
    .update(updateData)
    .eq('device_id', deviceId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating device status:', error)
    throw new Error(`Failed to update status: ${error.message}`)
  }

  return mapDeviceFromDB(data)
}

/**
 * Sends command to device
 */
export async function sendDeviceCommand(
  deviceId: string,
  input: SendCommandInput
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  const validationResult = sendCommandSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid command: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // In production, this would send command via MQTT, WebSocket, or other protocol
  // For demo, we simulate command execution
  
  // Log command in database
  const { data: commandLog, error: logError } = await supabase
    .from('iot_command_logs')
    .insert({
      device_id: deviceId,
      command: input.command,
      params: input.params || null,
      status: 'pending',
    })
    .select('*')
    .single()

  if (logError) {
    console.error('Error logging command:', logError)
    throw new Error(`Failed to send command: ${logError.message}`)
  }

  // Simulate command execution (in production, would communicate with device)
  const success = true
  const result = success ? { acknowledged: true, timestamp: new Date().toISOString() } : undefined

  // Update command status
  await supabase
    .from('iot_command_logs')
    .update({
      status: success ? 'delivered' : 'failed',
      result: result || null,
      executed_at: new Date().toISOString(),
    })
    .eq('id', commandLog.id)

  return { success, result }
}

/**
 * Records device telemetry
 */
export async function recordTelemetry(
  deviceId: string,
  data: Partial<IoTTelemetry>
): Promise<IoTTelemetry> {
  const supabase = createClient()

  const { data: telemetry, error } = await supabase
    .from('iot_telemetry')
    .insert({
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      power_watts: data.powerWatts || null,
      voltage: data.voltage as number || null,
      current: data.current as number || null,
      frequency: data.frequency as number || null,
      power_factor: data.powerFactor || null,
      energy_kwh: data.energykWh || null,
      temperature: data.temperature as number || null,
      humidity: data.humidity as number || null,
      status: data.status as string || 'online',
      data: data.data || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error recording telemetry:', error)
    throw new Error(`Failed to record telemetry: ${error.message}`)
  }

  return {
    id: telemetry.id,
    deviceId: telemetry.device_id,
    timestamp: telemetry.timestamp,
    powerWatts: telemetry.power_watts || undefined,
    voltage: telemetry.voltage || undefined,
    current: telemetry.current || undefined,
    frequency: telemetry.frequency || undefined,
    powerFactor: telemetry.power_factor || undefined,
    energykWh: telemetry.energy_kwh || undefined,
    temperature: telemetry.temperature || undefined,
    humidity: telemetry.humidity || undefined,
    status: telemetry.status,
    data: telemetry.data || undefined,
    createdAt: telemetry.created_at,
  }
}

/**
 * Gets device telemetry history
 */
export async function getDeviceTelemetryHistory(
  deviceId: string,
  options?: {
    startTime?: string
    endTime?: string
    limit?: number
  }
): Promise<IoTTelemetry[]> {
  const supabase = createClient()

  let query = supabase
    .from('iot_telemetry')
    .select('*')
    .eq('device_id', deviceId)
    .order('timestamp', { ascending: false })

  if (options?.startTime) {
    query = query.gte('timestamp', options.startTime)
  }

  if (options?.endTime) {
    query = query.lte('timestamp', options.endTime)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching telemetry:', error)
    return []
  }

  return (data || []).map(t => ({
    id: t.id,
    deviceId: t.device_id,
    timestamp: t.timestamp,
    powerWatts: t.power_watts || undefined,
    voltage: t.voltage || undefined,
    current: t.current || undefined,
    frequency: t.frequency || undefined,
    powerFactor: t.power_factor || undefined,
    energykWh: t.energy_kwh || undefined,
    temperature: t.temperature || undefined,
    humidity: t.humidity || undefined,
    status: t.status,
    data: t.data || undefined,
    createdAt: t.created_at,
  }))
}

/**
 * Gets latest telemetry for device
 */
export async function getLatestTelemetry(deviceId: string): Promise<IoTTelemetry | null> {
  const history = await getDeviceTelemetryHistory(deviceId, { limit: 1 })
  return history[0] || null
}

/**
 * Creates IoT automation
 */
export async function createAutomation(
  userId: string,
  input: CreateAutomationInput
): Promise<IoTAutomation> {
  const validationResult = createAutomationSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid automation: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('iot_automations')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description || null,
      enabled: true,
      trigger: input.trigger,
      conditions: input.conditions || null,
      actions: input.actions,
      execution_count: 0,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating automation:', error)
    throw new Error(`Failed to create automation: ${error.message}`)
  }

  return mapAutomationFromDB(data)
}

/**
 * Gets user automations
 */
export async function getUserAutomations(userId: string): Promise<IoTAutomation[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('iot_automations')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching automations:', error)
    return []
  }

  return (data || []).map(mapAutomationFromDB)
}

/**
 * Updates automation
 */
export async function updateAutomation(
  automationId: string,
  updates: Partial<CreateAutomationInput> & { enabled?: boolean }
): Promise<IoTAutomation> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled
  if (updates.trigger) updateData.trigger = updates.trigger
  if (updates.conditions) updateData.conditions = updates.conditions
  if (updates.actions) updateData.actions = updates.actions

  const { data, error } = await supabase
    .from('iot_automations')
    .update(updateData)
    .eq('id', automationId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating automation:', error)
    throw new Error(`Failed to update automation: ${error.message}`)
  }

  return mapAutomationFromDB(data)
}

/**
 * Deletes automation
 */
export async function deleteAutomation(automationId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('iot_automations')
    .delete()
    .eq('id', automationId)

  if (error) {
    console.error('Error deleting automation:', error)
    throw new Error(`Failed to delete automation: ${error.message}`)
  }
}

/**
 * Creates device group
 */
export async function createDeviceGroup(
  userId: string,
  input: CreateDeviceGroupInput
): Promise<IoTDeviceGroup> {
  const validationResult = createDeviceGroupSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid group: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('iot_device_groups')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description || null,
      icon: input.icon || null,
      device_ids: input.deviceIds || [],
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating group:', error)
    throw new Error(`Failed to create group: ${error.message}`)
  }

  return mapDeviceGroupFromDB(data)
}

/**
 * Gets user device groups
 */
export async function getUserDeviceGroups(userId: string): Promise<IoTDeviceGroup[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('iot_device_groups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching groups:', error)
    return []
  }

  return (data || []).map(mapDeviceGroupFromDB)
}

/**
 * Gets power device statistics
 */
export async function getPowerDeviceStatistics(
  userId: string,
  days: number = 30
): Promise<{
  totalPowerConsumption: number
  peakPowerDemand: number
  averagePower: number
  totalOutageDuration: number // seconds
  powerQualityIssues: number
  deviceUptime: number // percentage
}> {
  const supabase = createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get power devices
  const powerDevices = await getUserDevices(userId, { type: 'smart_meter' })

  let totalPowerConsumption = 0
  let peakPowerDemand = 0
  let totalOutageDuration = 0
  let powerQualityIssues = 0
  let uptimeMeasurements = 0
  let totalUptime = 0

  for (const device of powerDevices) {
    // Get telemetry for this device
    const { data: telemetry } = await supabase
      .from('iot_telemetry')
      .select('*')
      .eq('device_id', device.deviceId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    for (const t of telemetry || []) {
      // Sum energy consumption
      if (t.energy_kwh) {
        totalPowerConsumption += t.energy_kwh
      }

      // Track peak demand
      if (t.power_watts && t.power_watts > peakPowerDemand) {
        peakPowerDemand = t.power_watts
      }

      // Track power quality issues
      if (t.status === 'error' || t.status === 'warning') {
        powerQualityIssues++
      }

      // Calculate uptime
      uptimeMeasurements++
      if (t.status === 'online' || t.status === 'warning') {
        totalUptime++
      }
    }

    // Get outage events
    const { data: alerts } = await supabase
      .from('iot_alerts')
      .select('created_at, resolved_at')
      .eq('device_id', device.deviceId)
      .eq('type', 'outage')
      .gte('created_at', startDate.toISOString())

    for (const alert of alerts || []) {
      const start = new Date(alert.created_at)
      const end = alert.resolved_at ? new Date(alert.resolved_at) : new Date()
      totalOutageDuration += (end.getTime() - start.getTime()) / 1000
    }
  }

  // Calculate averages
  const averagePower = powerDevices.length > 0
    ? totalPowerConsumption / days / 24 // kW average over period
    : 0

  const deviceUptime = uptimeMeasurements > 0
    ? Math.round((totalUptime / uptimeMeasurements) * 100)
    : 100

  return {
    totalPowerConsumption: Math.round(totalPowerConsumption * 100) / 100,
    peakPowerDemand,
    averagePower: Math.round(averagePower * 100) / 100,
    totalOutageDuration: Math.round(totalOutageDuration),
    powerQualityIssues,
    deviceUptime,
  }
}

/**
 * Discovers nearby IoT devices (for pairing)
 */
export async function discoverDevices(
  protocol: IoTProtocol,
  location?: { latitude: number; longitude: number }
): Promise<Array<{ deviceId: string; name: string; type: IoTDeviceType; signalStrength: number }>> {
  // In production, this would use protocol-specific discovery
  // For demo, return empty list
  return []
}

/**
 * Pairs a discovered device
 */
export async function pairDevice(
  userId: string,
  deviceId: string,
  name: string
): Promise<IoTDevice> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('iot_devices')
    .update({
      user_id: userId,
      name,
      connection_status: 'paired',
      paired_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('device_id', deviceId)
    .select('*')
    .single()

  if (error) {
    console.error('Error pairing device:', error)
    throw new Error(`Failed to pair device: ${error.message}`)
  }

  return mapDeviceFromDB(data)
}

/**
 * Unpairs a device
 */
export async function unpairDevice(deviceId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('iot_devices')
    .update({
      user_id: null,
      location_id: null,
      connection_status: 'offline',
      updated_at: new Date().toISOString(),
    })
    .eq('device_id', deviceId)

  if (error) {
    console.error('Error unpairing device:', error)
    throw new Error(`Failed to unpair device: ${error.message}`)
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to IoTDevice
 */
function mapDeviceFromDB(data: Record<string, unknown>): IoTDevice {
  return {
    id: data.id as string,
    deviceId: data.device_id as string,
    userId: data.user_id as string | undefined,
    locationId: data.location_id as string | undefined,
    name: data.name as string,
    type: data.type as IoTDeviceType,
    manufacturer: data.manufacturer as string | undefined,
    model: data.model as string | undefined,
    serialNumber: data.serial_number as string | undefined,
    firmwareVersion: data.firmware_version as string | undefined,
    protocol: data.protocol as IoTProtocol,
    connectionStatus: data.connection_status as IoTDeviceStatus,
    lastSeenAt: data.last_seen_at as string | undefined,
    ipAddress: data.ip_address as string | undefined,
    macAddress: data.mac_address as string | undefined,
    capabilities: data.capabilities as IoTCapability[],
    batteryLevel: data.battery_level as number | undefined,
    signalStrength: data.signal_strength as number | undefined,
    uptime: data.uptime as number | undefined,
    state: data.state as Record<string, unknown> | undefined,
    lastStateChangeAt: data.last_state_change_at as string | undefined,
    metadata: data.metadata as Record<string, unknown> | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to IoTAutomation
 */
function mapAutomationFromDB(data: Record<string, unknown>): IoTAutomation {
  return {
    id: data.id as string,
    userId: data.user_id as string | undefined,
    locationId: data.location_id as string | undefined,
    name: data.name as string,
    description: data.description as string | undefined,
    enabled: data.enabled as boolean,
    trigger: data.trigger as IoTAutomation['trigger'],
    conditions: data.conditions as IoTAutomation['conditions'] | undefined,
    actions: data.actions as IoTAutomation['actions'],
    lastExecutedAt: data.last_executed_at as string | undefined,
    executionCount: data.execution_count as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to IoTDeviceGroup
 */
function mapDeviceGroupFromDB(data: Record<string, unknown>): IoTDeviceGroup {
  return {
    id: data.id as string,
    userId: data.user_id as string | undefined,
    locationId: data.location_id as string | undefined,
    name: data.name as string,
    description: data.description as string | undefined,
    icon: data.icon as string | undefined,
    deviceIds: data.device_ids as string[],
    scenes: data.scenes as IoTDeviceGroup['scenes'] | undefined,
    schedules: data.schedules as IoTDeviceGroup['schedules'] | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
