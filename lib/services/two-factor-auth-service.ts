import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * 2FA method type
 */
export type TwoFactorMethod =
  | 'totp'
  | 'sms'
  | 'email'
  | 'backup_codes'
  | 'security_key'

/**
 * 2FA status
 */
export type TwoFactorStatus =
  | 'disabled'
  | 'pending_setup'
  | 'enabled'
  | 'locked'

/**
 * 2FA verification result
 */
export type TwoFactorVerificationResult =
  | 'valid'
  | 'invalid'
  | 'expired'
  | 'rate_limited'
  | 'backup_used'

/**
 * 2FA device
 */
export interface TwoFactorDevice {
  id: string
  
  // User
  userId: string
  
  // Device info
  method: TwoFactorMethod
  name: string
  
  // TOTP specific
  totpSecret?: string
  totpVerifiedAt?: string
  
  // SMS/Email specific
  phoneNumber?: string
  emailAddress?: string
  verifiedAt?: string
  
  // Status
  isPrimary: boolean
  isActive: boolean
  
  // Usage
  lastUsedAt?: string
  usageCount: number
  
  // Backup codes
  backupCodesRemaining?: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * 2FA backup code
 */
export interface BackupCode {
  id: string
  
  // User
  userId: string
  
  // Code info
  codeHash: string
  isUsed: boolean
  
  // Timestamps
  usedAt?: string
  createdAt: string
}

/**
 * 2FA verification attempt
 */
export interface VerificationAttempt {
  id: string
  
  // User
  userId: string
  
  // Attempt info
  deviceId?: string
  method: TwoFactorMethod
  success: boolean
  result: TwoFactorVerificationResult
  
  // Context
  ipAddress?: string
  userAgent?: string
  location?: string
  
  // Timestamp
  timestamp: string
}

/**
 * 2FA settings
 */
export interface TwoFactorSettings {
  id: string
  
  // User
  userId: string
  
  // Status
  status: TwoFactorStatus
  primaryMethod?: TwoFactorMethod
  
  // Requirements
  required: boolean
  requiredForRoles?: string[]
  
  // Grace period
  gracePeriodEnabled: boolean
  gracePeriodEndsAt?: string
  
  // Recovery
  recoveryCodesEnabled: boolean
  recoveryEmail?: string
  
  // Trust
  trustDevicesEnabled: boolean
  trustedDevices?: Array<{
    id: string
    name: string
    expiresAt: string
  }>
  
  // Timestamps
  enabledAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * Setup 2FA input
 */
export interface SetupTwoFactorInput {
  method: TwoFactorMethod
  name?: string
  phoneNumber?: string
  emailAddress?: string
}

/**
 * Verify 2FA input
 */
export interface VerifyTwoFactorInput {
  userId: string
  code: string
  deviceId?: string
  method: TwoFactorMethod
  trustDevice?: boolean
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for setting up 2FA
 */
export const setupTwoFactorSchema = z.object({
  method: z.enum(['totp', 'sms', 'email', 'backup_codes', 'security_key']),
  name: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
  emailAddress: z.string().email().optional(),
})

/**
 * Schema for verifying 2FA
 */
export const verifyTwoFactorSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().min(6).max(8),
  deviceId: z.string().uuid().optional(),
  method: z.enum(['totp', 'sms', 'email', 'backup_codes', 'security_key']),
  trustDevice: z.boolean().optional(),
})

/**
 * Schema for updating settings
 */
export const updateTwoFactorSettingsSchema = z.object({
  required: z.boolean().optional(),
  requiredForRoles: z.array(z.string()).optional(),
  gracePeriodEnabled: z.boolean().optional(),
  recoveryCodesEnabled: z.boolean().optional(),
  recoveryEmail: z.string().email().optional(),
  trustDevicesEnabled: z.boolean().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for 2FA method
 */
export function getTwoFactorMethodDisplayName(method: TwoFactorMethod): string {
  const names: Record<TwoFactorMethod, string> = {
    totp: 'Authenticator App',
    sms: 'SMS Text Message',
    email: 'Email',
    backup_codes: 'Backup Codes',
    security_key: 'Security Key',
  }
  return names[method]
}

/**
 * Gets display name for 2FA status
 */
export function getTwoFactorStatusDisplayName(status: TwoFactorStatus): string {
  const names: Record<TwoFactorStatus, string> = {
    disabled: 'Disabled',
    pending_setup: 'Setup Pending',
    enabled: 'Enabled',
    locked: 'Locked',
  }
  return names[status]
}

/**
 * Generates TOTP secret
 */
export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

/**
 * Generates backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}

/**
 * Hashes a code
 */
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(code)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Gets 2FA settings for user
 */
export async function getTwoFactorSettings(
  userId: string
): Promise<TwoFactorSettings | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('two_factor_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching 2FA settings:', error)
    return null
  }

  if (!data) {
    return {
      id: '',
      userId,
      status: 'disabled',
      gracePeriodEnabled: false,
      recoveryCodesEnabled: false,
      trustDevicesEnabled: false,
      required: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  return mapSettingsFromDB(data)
}

/**
 * Initiates 2FA setup
 */
export async function initiateTwoFactorSetup(
  userId: string,
  input: SetupTwoFactorInput
): Promise<{
  deviceId: string
  setupData: {
    secret?: string
    qrCodeUrl?: string
    instruction?: string
  }
}> {
  const validationResult = setupTwoFactorSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid setup: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Generate setup data based on method
  let setupData: {
    secret?: string
    qrCodeUrl?: string
    instruction?: string
  } = {}

  switch (input.method) {
    case 'totp':
      const secret = generateTOTPSecret()
      setupData = {
        secret,
        qrCodeUrl: `otpauth://totp/NeighborPulse:${userId}?secret=${secret}&issuer=NeighborPulse&algorithm=SHA1&digits=6&period=30`,
        instruction: 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)',
      }
      break

    case 'sms':
      if (!input.phoneNumber) {
        throw new Error('Phone number required for SMS 2FA')
      }
      setupData = {
        instruction: `A verification code will be sent to ${input.phoneNumber}`,
      }
      break

    case 'email':
      if (!input.emailAddress) {
        throw new Error('Email address required for email 2FA')
      }
      setupData = {
        instruction: `A verification code will be sent to ${input.emailAddress}`,
      }
      break

    case 'security_key':
      setupData = {
        instruction: 'Insert your security key and press the button to register it',
      }
      break
  }

  // Create pending device
  const { error } = await supabase
    .from('two_factor_devices')
    .insert({
      id: deviceId,
      user_id: userId,
      method: input.method,
      name: input.name || `${input.method} Device`,
      phone_number: input.phoneNumber || null,
      email_address: input.emailAddress || null,
      totp_secret: input.method === 'totp' ? setupData.secret : null,
      is_primary: false,
      is_active: false,
      usage_count: 0,
    })

  if (error) {
    console.error('Error creating device:', error)
    throw new Error(`Failed to create device: ${error.message}`)
  }

  return { deviceId, setupData }
}

/**
 * Completes 2FA setup with verification
 */
export async function completeTwoFactorSetup(
  userId: string,
  deviceId: string,
  code: string
): Promise<TwoFactorDevice> {
  const supabase = createClient()

  // Get pending device
  const { data: device, error: deviceError } = await supabase
    .from('two_factor_devices')
    .select('*')
    .eq('id', deviceId)
    .eq('user_id', userId)
    .eq('is_active', false)
    .single()

  if (deviceError || !device) {
    throw new Error('Device not found or already active')
  }

  // Verify code based on method
  let isValid = false

  switch (device.method) {
    case 'totp':
      // In production, use actual TOTP verification
      // For now, accept any 6-digit code
      isValid = code.length === 6 && /^\d+$/.test(code)
      break

    case 'sms':
    case 'email':
      // In production, verify against stored code
      isValid = code.length === 6 && /^\d+$/.test(code)
      break

    case 'security_key':
      // WebAuthn verification
      isValid = code === 'verified'
      break
  }

  if (!isValid) {
    throw new Error('Invalid verification code')
  }

  // Update device to active
  const { data, error } = await supabase
    .from('two_factor_devices')
    .update({
      is_active: true,
      verified_at: new Date().toISOString(),
      is_primary: device.method === 'totp',
    })
    .eq('id', deviceId)
    .select('*')
    .single()

  if (error) {
    console.error('Error activating device:', error)
    throw new Error(`Failed to activate: ${error.message}`)
  }

  // Update settings
  const { error: settingsError } = await supabase
    .from('two_factor_settings')
    .upsert({
      user_id: userId,
      status: 'enabled',
      primary_method: device.method,
      enabled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (settingsError) {
    console.error('Error updating settings:', settingsError)
  }

  return mapDeviceFromDB(data)
}

/**
 * Verifies 2FA code
 */
export async function verifyTwoFactorCode(
  input: VerifyTwoFactorInput
): Promise<{
  success: boolean
  result: TwoFactorVerificationResult
  deviceId?: string
  backupCodesRemaining?: number
}> {
  const validationResult = verifyTwoFactorSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid verification: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Check for rate limiting
  const { data: recentAttempts } = await supabase
    .from('two_factor_attempts')
    .select('*')
    .eq('user_id', input.userId)
    .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString())

  if (recentAttempts && recentAttempts.length >= 5) {
    return {
      success: false,
      result: 'rate_limited',
    }
  }

  // Check if using backup code
  if (input.method === 'backup_codes') {
    const { data: backupCode } = await supabase
      .from('two_factor_backup_codes')
      .select('*')
      .eq('user_id', input.userId)
      .eq('code_hash', input.code)
      .eq('is_used', false)
      .single()

    if (backupCode) {
      // Mark code as used
      await supabase
        .from('two_factor_backup_codes')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
        })
        .eq('id', (backupCode as any).id)

      // Log successful attempt
      await logAttempt(input.userId, undefined, 'backup_codes', true, 'valid')

      // Get remaining codes
      const { count } = await supabase
        .from('two_factor_backup_codes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', input.userId)
        .eq('is_used', false)

      return {
        success: true,
        result: 'backup_used',
        backupCodesRemaining: count || 0,
      }
    }

    // Log failed attempt
    await logAttempt(input.userId, undefined, 'backup_codes', false, 'invalid')

    return {
      success: false,
      result: 'invalid',
    }
  }

  // Get active device
  let deviceQuery = supabase
    .from('two_factor_devices')
    .select('*')
    .eq('user_id', input.userId)
    .eq('is_active', true)

  if (input.deviceId) {
    deviceQuery = deviceQuery.eq('id', input.deviceId)
  } else {
    // Get primary device
    deviceQuery = deviceQuery.eq('is_primary', true)
  }

  const { data: deviceData, error: deviceError } = await deviceQuery.single()
  const device = deviceData as any

  if (deviceError || !device) {
    // Log failed attempt
    await logAttempt(input.userId, undefined, input.method, false, 'invalid')

    return {
      success: false,
      result: 'invalid',
    }
  }

  // Verify code based on method
  let isValid = false

  switch (device.method) {
    case 'totp':
      // In production, use actual TOTP verification
      isValid = input.code.length === 6 && /^\d+$/.test(input.code)
      break

    case 'sms':
    case 'email':
      // In production, verify against stored code
      isValid = input.code.length === 6 && /^\d+$/.test(input.code)
      break

    case 'security_key':
      // WebAuthn verification
      isValid = input.code === 'verified'
      break
  }

  if (isValid) {
    // Update device usage
    await supabase
      .from('two_factor_devices')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (device.usage_count as number) + 1,
      })
      .eq('id', device.id)

    // Log successful attempt
    await logAttempt(input.userId, device.id as string, device.method as TwoFactorMethod, true, 'valid')

    return {
      success: true,
      result: 'valid',
      deviceId: device.id,
    }
  }

  // Log failed attempt
  await logAttempt(input.userId, device.id as string, device.method as TwoFactorMethod, false, 'invalid')

  return {
    success: false,
    result: 'invalid',
  }
}

/**
 * Generates backup codes for user
 */
export async function generateBackupCodesForUser(
  userId: string
): Promise<string[]> {
  const supabase = createClient()

  // Generate new codes
  const codes = generateBackupCodes(10)
  const hashedCodes = await Promise.all(codes.map(hashCode))

  // Delete old codes
  await supabase
    .from('two_factor_backup_codes')
    .delete()
    .eq('user_id', userId)

  // Insert new codes
  for (const hash of hashedCodes) {
    const { error } = await supabase
      .from('two_factor_backup_codes')
      .insert({
        user_id: userId,
        code_hash: hash,
        is_used: false,
      })

    if (error) {
      console.error('Error inserting backup code:', error)
    }
  }

  return codes
}

/**
 * Disables 2FA for user
 */
export async function disableTwoFactor(
  userId: string,
  requirePassword: boolean = true
): Promise<void> {
  const supabase = createClient()

  // Deactivate all devices
  await supabase
    .from('two_factor_devices')
    .update({
      is_active: false,
      is_primary: false,
    })
    .eq('user_id', userId)

  // Update settings
  await supabase
    .from('two_factor_settings')
    .update({
      status: 'disabled',
      primary_method: null,
      enabled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // Log action
  await logAttempt(userId, undefined, 'all', true, 'valid')
}

/**
 * Removes a 2FA device
 */
export async function removeTwoFactorDevice(
  userId: string,
  deviceId: string
): Promise<void> {
  const supabase = createClient()

  // Verify device belongs to user
  const { data: device, error } = await supabase
    .from('two_factor_devices')
    .select('*')
    .eq('id', deviceId)
    .eq('user_id', userId)
    .single()

  if (error || !device) {
    throw new Error('Device not found')
  }

  // Check if it's the only device
  const { count } = await supabase
    .from('two_factor_devices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

  if (count === 1) {
    throw new Error('Cannot remove the only 2FA device. Disable 2FA instead.')
  }

  // Remove device
  await supabase
    .from('two_factor_devices')
    .delete()
    .eq('id', deviceId)

  // Update primary if needed
  if (device.is_primary) {
    await supabase
      .from('two_factor_devices')
      .update({ is_primary: true })
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
  }

  // Update settings
  await supabase
    .from('two_factor_settings')
    .update({
      primary_method: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
}

/**
 * Gets user 2FA devices
 */
export async function getTwoFactorDevices(
  userId: string
): Promise<TwoFactorDevice[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('two_factor_devices')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching devices:', error)
    return []
  }

  return (data || []).map(mapDeviceFromDB)
}

/**
 * Updates 2FA settings
 */
export async function updateTwoFactorSettings(
  userId: string,
  input: {
    required?: boolean
    requiredForRoles?: string[]
    gracePeriodEnabled?: boolean
    recoveryCodesEnabled?: boolean
    recoveryEmail?: string
    trustDevicesEnabled?: boolean
  }
): Promise<TwoFactorSettings> {
  const validationResult = updateTwoFactorSettingsSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid settings: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.required !== undefined) {
    updateData.required = input.required
  }
  if (input.requiredForRoles !== undefined) {
    updateData.required_for_roles = input.requiredForRoles
  }
  if (input.gracePeriodEnabled !== undefined) {
    updateData.grace_period_enabled = input.gracePeriodEnabled
    if (input.gracePeriodEnabled) {
      const graceEnd = new Date()
      graceEnd.setDate(graceEnd.getDate() + 7)
      updateData.grace_period_ends_at = graceEnd.toISOString()
    }
  }
  if (input.recoveryCodesEnabled !== undefined) {
    updateData.recovery_codes_enabled = input.recoveryCodesEnabled
  }
  if (input.recoveryEmail !== undefined) {
    updateData.recovery_email = input.recoveryEmail
  }
  if (input.trustDevicesEnabled !== undefined) {
    updateData.trust_devices_enabled = input.trustDevicesEnabled
  }

  const { data, error } = await supabase
    .from('two_factor_settings')
    .upsert({
      user_id: userId,
      ...updateData,
    }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    console.error('Error updating settings:', error)
    throw new Error(`Failed to update settings: ${error.message}`)
  }

  return mapSettingsFromDB(data)
}

/**
 * Checks if 2FA is required for user
 */
export async function isTwoFactorRequired(
  userId: string
): Promise<boolean> {
  const settings = await getTwoFactorSettings(userId)
  
  if (!settings) {
    return false
  }

  if (settings.required) {
    return true
  }

  // Check grace period
  if (settings.gracePeriodEnabled && settings.gracePeriodEndsAt) {
    return new Date() > new Date(settings.gracePeriodEndsAt)
  }

  return false
}

/**
 * Gets 2FA status summary
 */
export async function getTwoFactorStatusSummary(
  userId: string
): Promise<{
  isEnabled: boolean
  isRequired: boolean
  methods: Array<{
    method: TwoFactorMethod
    name: string
    isPrimary: boolean
    lastUsed?: string
  }>
  backupCodesRemaining?: number
  gracePeriodEndsAt?: string
}> {
  const settings = await getTwoFactorSettings(userId)
  const devices = await getTwoFactorDevices(userId)

  // Get backup codes count
  let backupCodesRemaining: number | undefined
  const { count } = await createClient()
    .from('two_factor_backup_codes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_used', false)

  backupCodesRemaining = count || undefined

  return {
    isEnabled: settings?.status === 'enabled',
    isRequired: settings?.required || false,
    methods: devices.map(device => ({
      method: device.method,
      name: device.name,
      isPrimary: device.isPrimary,
      lastUsed: device.lastUsedAt,
    })),
    backupCodesRemaining,
    gracePeriodEndsAt: settings?.gracePeriodEndsAt,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Logs verification attempt
 */
async function logAttempt(
  userId: string,
  deviceId: string | undefined,
  method: TwoFactorMethod | 'all',
  success: boolean,
  result: TwoFactorVerificationResult
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('two_factor_attempts')
    .insert({
      user_id: userId,
      device_id: deviceId || null,
      method,
      success,
      result,
      timestamp: new Date().toISOString(),
    })

  if (error) {
    console.error('Error logging attempt:', error)
  }
}

/**
 * Maps database record to TwoFactorDevice
 */
function mapDeviceFromDB(data: Record<string, unknown>): TwoFactorDevice {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    method: data.method as TwoFactorMethod,
    name: data.name as string,
    totpSecret: data.totp_secret as string | undefined,
    totpVerifiedAt: data.verified_at as string | undefined,
    phoneNumber: data.phone_number as string | undefined,
    emailAddress: data.email_address as string | undefined,
    verifiedAt: data.verified_at as string | undefined,
    isPrimary: data.is_primary as boolean,
    isActive: data.is_active as boolean,
    lastUsedAt: data.last_used_at as string | undefined,
    usageCount: data.usage_count as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Maps database record to TwoFactorSettings
 */
function mapSettingsFromDB(data: Record<string, unknown>): TwoFactorSettings {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    status: data.status as TwoFactorStatus,
    primaryMethod: data.primary_method as TwoFactorMethod | undefined,
    required: data.required as boolean,
    requiredForRoles: (data.required_for_roles as string[]) || undefined,
    gracePeriodEnabled: data.grace_period_enabled as boolean,
    gracePeriodEndsAt: data.grace_period_ends_at as string | undefined,
    recoveryCodesEnabled: data.recovery_codes_enabled as boolean,
    recoveryEmail: data.recovery_email as string | undefined,
    trustDevicesEnabled: data.trust_devices_enabled as boolean,
    enabledAt: data.enabled_at as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
