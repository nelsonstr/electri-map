import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Account provider type
 */
export type AccountProvider =
  | 'google'
  | 'facebook'
  | 'apple'
  | 'twitter'
  | 'github'
  | 'linkedin'
  | 'microsoft'
  | 'email'

/**
 * Account link status
 */
export type AccountLinkStatus =
  | 'pending'
  | 'verified'
  | 'active'
  | 'inactive'
  | 'error'
  | 'revoked'

/**
 * Account link
 */
export interface AccountLink {
  id: string
  
  // User
  userId: string
  
  // Provider
  provider: AccountProvider
  providerId: string
  providerEmail?: string
  providerName?: string
  
  // Status
  status: AccountLinkStatus
  
  // Verification
  verifiedAt?: string
  verificationToken?: string
  verificationExpiresAt?: string
  
  // Tokens
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: string
  
  // Metadata
  providerMetadata?: Record<string, unknown>
  
  // Usage
  lastUsedAt?: string
  usageCount: number
  
  // Errors
  lastError?: string
  errorCount: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * Account linking request
 */
export interface AccountLinkingRequest {
  id: string
  
  // User
  userId?: string
  anonymousId?: string
  
  // Provider
  provider: AccountProvider
  providerToken: string
  providerRefreshToken?: string
  
  // Status
  status: 'pending' | 'completed' | 'failed'
  
  // Error details
  errorCode?: string
  errorMessage?: string
  
  // Timestamps
  createdAt: string
  completedAt?: string
  expiresAt: string
}

/**
 * Link account input
 */
export interface LinkAccountInput {
  userId: string
  provider: AccountProvider
  providerToken: string
  providerRefreshToken?: string
  providerEmail?: string
  providerName?: string
}

/**
 * Unlink account input
 */
export interface UnlinkAccountInput {
  userId: string
  provider: AccountProvider
  reason?: string
}

/**
 * Provider user info
 */
export interface ProviderUserInfo {
  id: string
  email?: string
  name?: string
  avatar?: string
  locale?: string
  timezone?: string
}

/**
 * Account linking settings
 */
export interface AccountLinkingSettings {
  id: string
  
  // User
  userId: string
  
  // Settings
  allowNewLinks: boolean
  requireVerification: boolean
  preferredProvider?: AccountProvider
  
  // Notifications
  notifyOnNewLink: boolean
  notifyOnUnlink: boolean
  
  // Security
  requirePasswordForUnlink: boolean
  maxLinkedAccounts: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for linking account
 */
export const linkAccountSchema = z.object({
  userId: z.string().uuid(),
  provider: z.enum(['google', 'facebook', 'apple', 'twitter', 'github', 'linkedin', 'microsoft', 'email']),
  providerToken: z.string().min(1),
  providerRefreshToken: z.string().optional(),
  providerEmail: z.string().email().optional(),
  providerName: z.string().max(200).optional(),
})

/**
 * Schema for unlinking account
 */
export const unlinkAccountSchema = z.object({
  userId: z.string().uuid(),
  provider: z.enum(['google', 'facebook', 'apple', 'twitter', 'github', 'linkedin', 'microsoft', 'email']),
  reason: z.string().max(500).optional(),
})

/**
 * Schema for verifying link
 */
export const verifyLinkSchema = z.object({
  userId: z.string().uuid(),
  provider: z.enum(['google', 'facebook', 'apple', 'twitter', 'github', 'linkedin', 'microsoft', 'email']),
  verificationToken: z.string().min(1),
})

/**
 * Schema for updating settings
 */
export const updateLinkingSettingsSchema = z.object({
  allowNewLinks: z.boolean().optional(),
  requireVerification: z.boolean().optional(),
  preferredProvider: z.enum(['google', 'facebook', 'apple', 'twitter', 'github', 'linkedin', 'microsoft', 'email']).optional(),
  notifyOnNewLink: z.boolean().optional(),
  notifyOnUnlink: z.boolean().optional(),
  requirePasswordForUnlink: z.boolean().optional(),
  maxLinkedAccounts: z.number().min(1).max(20).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for provider
 */
export function getProviderDisplayName(provider: AccountProvider): string {
  const names: Record<AccountProvider, string> = {
    google: 'Google',
    facebook: 'Facebook',
    apple: 'Apple',
    twitter: 'X (Twitter)',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    microsoft: 'Microsoft',
    email: 'Email',
  }
  return names[provider]
}

/**
 * Gets display name for status
 */
export function getStatusDisplayName(status: AccountLinkStatus): string {
  const names: Record<AccountLinkStatus, string> = {
    pending: 'Pending Verification',
    verified: 'Verified',
    active: 'Active',
    inactive: 'Inactive',
    error: 'Error',
    revoked: 'Revoked',
  }
  return names[status]
}

/**
 * Gets provider icon
 */
export function getProviderIcon(provider: AccountProvider): string {
  const icons: Record<AccountProvider, string> = {
    google: 'google',
    facebook: 'facebook',
    apple: 'apple',
    twitter: 'twitter',
    github: 'github',
    linkedin: 'linkedin',
    microsoft: 'microsoft',
    email: 'email',
  }
  return icons[provider]
}

/**
 * Gets provider color
 */
export function getProviderColor(provider: AccountProvider): string {
  const colors: Record<AccountProvider, string> = {
    google: '#4285F4',
    facebook: '#1877F2',
    apple: '#000000',
    twitter: '#1DA1F2',
    github: '#333333',
    linkedin: '#0A66C2',
    microsoft: '#00A4EF',
    email: '#6B7280',
  }
  return colors[provider]
}

/**
 * Generates verification token
 */
export function generateVerificationToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Gets provider endpoint for token validation
 */
export function getProviderTokenEndpoint(provider: AccountProvider): string {
  const endpoints: Record<AccountProvider, string> = {
    google: 'https://oauth2.googleapis.com/tokeninfo',
    facebook: 'https://graph.facebook.com/me',
    apple: 'https://appleid.apple.com/auth/token',
    twitter: 'https://api.twitter.com/2/users/me',
    github: 'https://api.github.com/user',
    linkedin: 'https://api.linkedin.com/v2/me',
    microsoft: 'https://graph.microsoft.com/v1.0/me',
    email: '',
  }
  return endpoints[provider]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Links an account to user
 */
export async function linkAccount(
  input: LinkAccountInput
): Promise<AccountLink> {
  const validationResult = linkAccountSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid link request: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Check if already linked
  const { data: existingLink } = await supabase
    .from('account_links')
    .select('*')
    .eq('user_id', input.userId)
    .eq('provider', input.provider)
    .eq('provider_id', input.providerId)
    .single()

  if (existingLink) {
    // Re-link existing
    const { data: relinked, error } = await supabase
      .from('account_links')
      .update({
        status: 'active',
        access_token: input.providerToken,
        refresh_token: input.providerRefreshToken || null,
        provider_email: input.providerEmail || null,
        provider_name: input.providerName || null,
        last_error: null,
        error_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingLink.id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to re-link: ${error.message}`)
    }

    return mapLinkFromDB(relinked)
  }

  // Check max linked accounts
  const { count: linkCount } = await supabase
    .from('account_links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', input.userId)
    .in('status', ['active', 'verified', 'pending'])

  const { data: settings } = await supabase
    .from('account_linking_settings')
    .select('max_linked_accounts')
    .eq('user_id', input.userId)
    .single()

  const maxAccounts = settings?.max_linked_accounts || 5

  if (linkCount && linkCount >= maxAccounts) {
    throw new Error(`Maximum linked accounts (${maxAccounts}) reached`)
  }

  // Generate verification token
  const verificationToken = generateVerificationToken()
  const verificationExpires = new Date()
  verificationExpires.setHours(verificationExpires.getHours() + 24)

  // Create new link
  const linkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('account_links')
    .insert({
      id: linkId,
      user_id: input.userId,
      provider: input.provider,
      provider_id: input.providerId,
      provider_email: input.providerEmail || null,
      provider_name: input.providerName || null,
      status: 'pending',
      verification_token: verificationToken,
      verification_expires_at: verificationExpires.toISOString(),
      access_token: input.providerToken,
      refresh_token: input.providerRefreshToken || null,
      usage_count: 0,
      error_count: 0,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating link:', error)
    throw new Error(`Failed to link account: ${error.message}`)
  }

  return mapLinkFromDB(data)
}

/**
 * Verifies account link
 */
export async function verifyAccountLink(
  userId: string,
  provider: AccountProvider,
  verificationToken: string
): Promise<AccountLink> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('account_links')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('verification_token', verificationToken)
    .eq('status', 'pending')
    .single()

  if (error || !data) {
    throw new Error('Invalid or expired verification token')
  }

  // Check expiration
  if (new Date(data.verification_expires_at as string) < new Date()) {
    throw new Error('Verification token expired')
  }

  const { data: updated, error: updateError } = await supabase
    .from('account_links')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      verification_token: null,
      verification_expires_at: null,
    })
    .eq('id', data.id as string)
    .select('*')
    .single()

  if (updateError) {
    throw new Error(`Failed to verify: ${updateError.message}`)
  }

  return mapLinkFromDB(updated)
}

/**
 * Unlinks an account
 */
export async function unlinkAccount(
  input: UnlinkAccountInput
): Promise<void> {
  const validationResult = unlinkAccountSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid unlink request: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Check if this is the only link
  const { count: linkCount } = await supabase
    .from('account_links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', input.userId)
    .in('status', ['active', 'verified', 'pending'])

  // Get user email/password auth
  const { data: hasPassword } = await supabase
    .from('auth_users')
    .select('id')
    .eq('id', input.userId)
    .not('encrypted_password', 'is', null)
    .single()

  if (linkCount === 1 && !hasPassword) {
    throw new Error('Cannot unlink the only authentication method')
  }

  const { error } = await supabase
    .from('account_links')
    .delete()
    .eq('user_id', input.userId)
    .eq('provider', input.provider)

  if (error) {
    throw new Error(`Failed to unlink: ${error.message}`)
  }
}

/**
 * Gets linked accounts for user
 */
export async function getLinkedAccounts(
  userId: string,
  activeOnly: boolean = false
): Promise<AccountLink[]> {
  const supabase = createClient()

  let query = supabase
    .from('account_links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (activeOnly) {
    query = query.in('status', ['active', 'verified'])
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching links:', error)
    return []
  }

  return (data || []).map(mapLinkFromDB)
}

/**
 * Gets a specific linked account
 */
export async function getLinkedAccount(
  userId: string,
  provider: AccountProvider
): Promise<AccountLink | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('account_links')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .in('status', ['active', 'verified', 'pending'])
    .single()

  if (error) {
    return null
  }

  return mapLinkFromDB(data)
}

/**
 * Checks if account is linked
 */
export async function isAccountLinked(
  userId: string,
  provider: AccountProvider
): Promise<boolean> {
  const link = await getLinkedAccount(userId, provider)
  return link !== null && link.status !== 'revoked'
}

/**
 * Updates account link tokens
 */
export async function updateAccountLinkTokens(
  linkId: string,
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number
): Promise<void> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    access_token: accessToken,
    updated_at: new Date().toISOString(),
  }

  if (refreshToken) {
    updateData.refresh_token = refreshToken
  }

  if (expiresIn) {
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)
    updateData.token_expires_at = expiresAt.toISOString()
  }

  await supabase
    .from('account_links')
    .update(updateData)
    .eq('id', linkId)
}

/**
 * Records account link usage
 */
export async function recordLinkUsage(
  linkId: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('account_links')
    .update({
      last_used_at: new Date().toISOString(),
      usage_count: supabase.raw('usage_count + 1'),
    })
    .eq('id', linkId)
}

/**
 * Records link error
 */
export async function recordLinkError(
  linkId: string,
  error: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('account_links')
    .update({
      last_error: error,
      error_count: supabase.raw('error_count + 1'),
      status: 'error',
      updated_at: new Date().toISOString(),
    })
    .eq('id', linkId)
}

/**
 * Gets linking settings for user
 */
export async function getLinkingSettings(
  userId: string
): Promise<AccountLinkingSettings> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('account_linking_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return {
      id: '',
      userId,
      allowNewLinks: true,
      requireVerification: true,
      notifyOnNewLink: true,
      notifyOnUnlink: true,
      requirePasswordForUnlink: false,
      maxLinkedAccounts: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    allowNewLinks: data.allow_new_links as any[],
    requireVerification: data.require_verification,
    preferredProvider: data.preferred_provider as AccountProvider | undefined,
    notifyOnNewLink: data.notify_on_new_link,
    notifyOnUnlink: data.notify_on_unlink,
    requirePasswordForUnlink: data.require_password_for_unlink,
    maxLinkedAccounts: data.max_linked_accounts,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Updates linking settings
 */
export async function updateLinkingSettings(
  userId: string,
  input: z.infer<typeof updateLinkingSettingsSchema>
): Promise<AccountLinkingSettings> {
  const validationResult = updateLinkingSettingsSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid settings: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  Object.entries(input).forEach(([key, value]) => {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    updateData[dbKey] = value
  })

  const { data, error } = await supabase
    .from('account_linking_settings')
    .upsert({
      user_id: userId,
      ...updateData,
    }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`)
  }

  return {
    id: data.id as string,
    userId: data.user_id as string,
    allowNewLinks: data.allow_new_links as any[],
    requireVerification: data.require_verification,
    preferredProvider: data.preferred_provider as AccountProvider | undefined,
    notifyOnNewLink: data.notify_on_new_link,
    notifyOnUnlink: data.notify_on_unlink,
    requirePasswordForUnlink: data.require_password_for_unlink,
    maxLinkedAccounts: data.max_linked_accounts,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * Gets link statistics
 */
export async function getLinkStatistics(
  userId: string
): Promise<{
  totalLinks: number
  activeLinks: number
  providers: Array<{
    provider: AccountProvider
    status: AccountLinkStatus
    lastUsed?: string
  }>
  oldestLink?: string
  newestLink?: string
}> {
  const links = await getLinkedAccounts(userId, false)

  const activeLinks = links.filter(l => l.status === 'active' || l.status === 'verified')

  const sortedLinks = [...links].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return {
    totalLinks: links.length,
    activeLinks: activeLinks.length,
    providers: links.map(l => ({
      provider: l.provider,
      status: l.status,
      lastUsed: l.lastUsedAt,
    })),
    oldestLink: sortedLinks[0]?.createdAt,
    newestLink: sortedLinks[sortedLinks.length - 1]?.createdAt,
  }
}

/**
 * Re-authenticates with provider
 */
export async function reauthenticateWithProvider(
  userId: string,
  provider: AccountProvider
): Promise<{
  authUrl: string
  state: string
}> {
  // Generate state for CSRF protection
  const state = generateVerificationToken()
  
  // Store state for verification
  await createClient()
    .from('account_linking_requests')
    .insert({
      id: `req_${Date.now()}`,
      user_id: userId,
      provider,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    .catch(console.error)

  // Generate auth URL based on provider
  const authUrls: Record<AccountProvider, string> = {
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_ID&redirect_uri=YOUR_URI&response_type=code&scope=profile%20email&state=${state}`,
    facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_ID&redirect_uri=YOUR_URI&state=${state}`,
    apple: `https://appleid.apple.com/auth/authorize?client_id=YOUR_ID&redirect_uri=YOUR_URI&response_type=code&scope=name%20email&state=${state}`,
    twitter: `https://twitter.com/i/oauth2/authorize?client_id=YOUR_ID&redirect_uri=YOUR_URI&response_type=code&scope=tweet.read%20users.read&state=${state}`,
    github: `https://github.com/login/oauth/authorize?client_id=YOUR_ID&redirect_uri=YOUR_URI&response_type=code&scope=read:user%20user:email&state=${state}`,
    linkedin: `https://www.linkedin.com/oauth/v2/authorization?client_id=YOUR_ID&redirect_uri=YOUR_URI&response_type=code&scope=r_liteprofile%20r_emailaddress&state=${state}`,
    microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_ID&redirect_uri=YOUR_URI&response_type=code&scope=User.Read&state=${state}`,
    email: '',
  }

  return {
    authUrl: authUrls[provider],
    state,
  }
}

/**
 * Removes all linked accounts
 */
export async function removeAllLinkedAccounts(
  userId: string,
  reason: string = 'User requested'
): Promise<number> {
  const supabase = createClient()

  // Check if user has password auth
  const { data: hasPassword } = await supabase
    .from('auth_users')
    .select('id')
    .eq('id', userId)
    .not('encrypted_password', 'is', null)
    .single()

  if (!hasPassword) {
    throw new Error('Cannot remove all links without password authentication')
  }

  const { count, error } = await supabase
    .from('account_links')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to remove links: ${error.message}`)
  }

  return count || 0
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to AccountLink
 */
function mapLinkFromDB(data: Record<string, unknown>): AccountLink {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    provider: data.provider as AccountProvider,
    providerId: data.provider_id as string,
    providerEmail: data.provider_email as string | undefined,
    providerName: data.provider_name as string | undefined,
    status: data.status as AccountLinkStatus,
    verifiedAt: data.verified_at as string | undefined,
    verificationToken: data.verification_token as string | undefined,
    verificationExpiresAt: data.verification_expires_at as string | undefined,
    accessToken: data.access_token as string | undefined,
    refreshToken: data.refresh_token as string | undefined,
    tokenExpiresAt: data.token_expires_at as string | undefined,
    providerMetadata: data.provider_metadata as Record<string, unknown> | undefined,
    lastUsedAt: data.last_used_at as string | undefined,
    usageCount: data.usage_count as number,
    lastError: data.last_error as string | undefined,
    errorCount: data.error_count as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
