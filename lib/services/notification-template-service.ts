import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type TemplateStatus = 'draft' | 'active' | 'inactive' | 'archived'

export type TemplateCategory =
  | 'emergency'
  | 'power_outage'
  | 'restoration'
  | 'community_alert'
  | 'safety_tip'
  | 'system_notification'
  | 'marketing'

export type DeliveryChannel = 'push' | 'email' | 'sms' | 'in_app' | 'all'

export interface NotificationTemplate {
  id: string
  name: string
  description?: string
  category: TemplateCategory
  status: TemplateStatus
  
  // Content
  subject?: string
  body: string
  htmlBody?: string
  
  // Delivery
  channels: DeliveryChannel[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  
  // Localization
  language: string
  translations?: Record<string, {
    subject?: string
    body: string
    htmlBody?: string
  }>
  
  // Variables
  variables?: string[]
  
  // Metadata
  createdBy: string
  updatedBy?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateInput {
  name: string
  description?: string
  category: TemplateCategory
  subject?: string
  body: string
  htmlBody?: string
  channels: DeliveryChannel[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  language: string
  translations?: Record<string, {
    subject?: string
    body: string
    htmlBody?: string
  }>
  variables?: string[]
}

export interface UpdateTemplateInput {
  name?: string
  description?: string
  category?: TemplateCategory
  status?: TemplateStatus
  subject?: string
  body?: string
  htmlBody?: string
  channels?: DeliveryChannel[]
  priority?: 'low' | 'medium' | 'high' | 'critical'
  translations?: Record<string, {
    subject?: string
    body: string
    htmlBody?: string
  }>
  variables?: string[]
}

export interface RenderTemplateInput {
  templateId: string
  language?: string
  variables: Record<string, string | number | boolean>
}

export interface TemplateStatistics {
  totalTemplates: number
  activeTemplates: number
  templatesByCategory: Record<TemplateCategory, number>
  mostUsedTemplates: Array<{
    templateId: string
    name: string
    usageCount: number
  }>
}

// ============================================================================
// Validation Schemas

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  category: z.enum([
    'emergency',
    'power_outage',
    'restoration',
    'community_alert',
    'safety_tip',
    'system_notification',
    'marketing',
  ]),
  subject: z.string().max(200).optional(),
  body: z.string().min(1),
  htmlBody: z.string().optional(),
  channels: z.array(z.enum(['push', 'email', 'sms', 'in_app', 'all'])),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  language: z.string().length(2).default('en'),
  translations: z.record(z.object({
    subject: z.string().optional(),
    body: z.string(),
    htmlBody: z.string().optional(),
  })).optional(),
  variables: z.array(z.string()).optional(),
})

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  category: z.enum([
    'emergency',
    'power_outage',
    'restoration',
    'community_alert',
    'safety_tip',
    'system_notification',
    'marketing',
  ]).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).optional(),
  htmlBody: z.string().optional(),
  channels: z.array(z.enum(['push', 'email', 'sms', 'in_app', 'all'])).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  translations: z.record(z.object({
    subject: z.string().optional(),
    body: z.string(),
    htmlBody: z.string().optional(),
  })).optional(),
  variables: z.array(z.string()).optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getTemplateStatusDisplayName(status: TemplateStatus): string {
  const names: Record<TemplateStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    inactive: 'Inactive',
    archived: 'Archived',
  }
  return names[status]
}

export function getTemplateCategoryDisplayName(category: TemplateCategory): string {
  const names: Record<TemplateCategory, string> = {
    emergency: 'Emergency Alert',
    power_outage: 'Power Outage',
    restoration: 'Restoration Update',
    community_alert: 'Community Alert',
    safety_tip: 'Safety Tip',
    system_notification: 'System Notification',
    marketing: 'Marketing',
  }
  return names[category]
}

export function getDeliveryChannelDisplayName(channel: DeliveryChannel): string {
  const names: Record<DeliveryChannel, string> = {
    push: 'Push Notification',
    email: 'Email',
    sms: 'SMS',
    in_app: 'In-App',
    all: 'All Channels',
  }
  return names[channel]
}

export function extractVariables(template: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const variables: Set<string> = new Set()
  let match

  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1].trim())
  }

  return Array.from(variables)
}

export function renderTemplate(
  template: string,
  variables: Record<string, string | number | boolean>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const trimmedKey = key.trim()
    const value = variables[trimmedKey]
    return value !== undefined ? String(value) : `{{${trimmedKey}}}`
  })
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createTemplate(
  userId: string,
  input: CreateTemplateInput
): Promise<NotificationTemplate> {
  const validationResult = createTemplateSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const extractedVars = extractVariables(input.body)
  if (input.subject) {
    extractedVars.push(...extractVariables(input.subject))
  }

  const id = `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('notification_templates')
    .insert({
      id,
      name: input.name,
      description: input.description,
      category: input.category,
      status: 'draft',
      subject: input.subject,
      body: input.body,
      html_body: input.htmlBody,
      channels: input.channels,
      priority: input.priority,
      language: input.language,
      translations: input.translations,
      variables: extractedVars,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating template:', error)
    throw new Error('Failed to create template')
  }

  return mapTemplateFromDB(data)
}

export async function updateTemplate(
  templateId: string,
  userId: string,
  input: UpdateTemplateInput
): Promise<NotificationTemplate> {
  const validationResult = updateTemplateSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    ...input,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }

  if (input.body) {
    const extractedVars = extractVariables(input.body)
    if (input.subject) {
      extractedVars.push(...extractVariables(input.subject))
    }
    updateData.variables = extractedVars
  }

  const { data, error } = await supabase
    .from('notification_templates')
    .update(updateData)
    .eq('id', templateId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating template:', error)
    throw new Error('Failed to update template')
  }

  return mapTemplateFromDB(data)
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notification_templates')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)

  if (error) {
    console.error('Error deleting template:', error)
    throw new Error('Failed to delete template')
  }
}

export async function getTemplate(templateId: string): Promise<NotificationTemplate | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error || !data) {
    return null
  }

  return mapTemplateFromDB(data)
}

export async function getTemplates(
  filters?: {
    category?: TemplateCategory
    status?: TemplateStatus
    language?: string
  },
  limit: number = 50,
  offset: number = 0
): Promise<NotificationTemplate[]> {
  const supabase = createClient()

  let query = supabase
    .from('notification_templates')
    .select('*')
    .eq('status', 'active')

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.language) {
    query = query.eq('language', filters.language)
  }

  query = query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching templates:', error)
    return []
  }

  return (data || []).map(mapTemplateFromDB)
}

export async function getTemplateByName(
  name: string
): Promise<NotificationTemplate | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('name', name)
    .eq('status', 'active')
    .single()

  if (error || !data) {
    return null
  }

  return mapTemplateFromDB(data)
}

export async function renderNotificationTemplate(
  input: RenderTemplateInput
): Promise<{
  subject?: string
  body: string
  htmlBody?: string
}> {
  const template = await getTemplate(input.templateId)
  if (!template) {
    throw new Error('Template not found')
  }

  const translation = input.language && template.translations?.[input.language]
  const useTranslation = translation && template.language !== input.language

  const subject = useTranslation && translation.subject
    ? renderTemplate(translation.subject, input.variables)
    : template.subject
    ? renderTemplate(template.subject, input.variables)
    : undefined

  const body = useTranslation
    ? renderTemplate(translation.body, input.variables)
    : renderTemplate(template.body, input.variables)

  const htmlBody = useTranslation && translation.htmlBody
    ? renderTemplate(translation.htmlBody, input.variables)
    : template.htmlBody
    ? renderTemplate(template.htmlBody, input.variables)
    : undefined

  return { subject, body, htmlBody }
}

export async function activateTemplate(templateId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notification_templates')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)

  if (error) {
    console.error('Error activating template:', error)
    throw new Error('Failed to activate template')
  }
}

export async function deactivateTemplate(templateId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notification_templates')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)

  if (error) {
    console.error('Error deactivating template:', error)
    throw new Error('Failed to deactivate template')
  }
}

export async function duplicateTemplate(
  templateId: string,
  userId: string,
  newName?: string
): Promise<NotificationTemplate> {
  const original = await getTemplate(templateId)
  if (!original) {
    throw new Error('Template not found')
  }

  return createTemplate(userId, {
    name: newName || `${original.name} (Copy)`,
    description: original.description,
    category: original.category,
    subject: original.subject,
    body: original.body,
    htmlBody: original.htmlBody,
    channels: original.channels,
    priority: original.priority,
    language: original.language,
    translations: original.translations,
    variables: original.variables,
  })
}

export async function getTemplateStatistics(): Promise<TemplateStatistics> {
  const supabase = createClient()

  const { data } = await supabase
    .from('notification_templates')
    .select('*')

  const templates: NotificationTemplate[] = (data || []).map(mapTemplateFromDB)

  if (!templates || templates.length === 0) {
    return {
      totalTemplates: 0,
      activeTemplates: 0,
      templatesByCategory: {
        emergency: 0,
        power_outage: 0,
        restoration: 0,
        community_alert: 0,
        safety_tip: 0,
        system_notification: 0,
        marketing: 0,
      },
      mostUsedTemplates: [],
    }
  }

  const templatesByCategory = (templates || []).reduce<Record<TemplateCategory, number>>((acc, t) => {
    const category = t.category as TemplateCategory
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {
    emergency: 0,
    power_outage: 0,
    restoration: 0,
    community_alert: 0,
    safety_tip: 0,
    system_notification: 0,
    marketing: 0,
  })

  // Get usage data (simulated for now since group_by is not available)
  const { data: logs } = await supabase
    .from('notification_logs')
    .select('template_id')

  const usageCounts: Record<string, number> = {}
  if (logs) {
    for (const log of logs) {
      if (log.template_id) {
        usageCounts[log.template_id as string] = (usageCounts[log.template_id as string] || 0) + 1
      }
    }
  }

  const mostUsedTemplates = Object.entries(usageCounts)
    .map(([templateId, count]) => ({
      templateId,
      name: templates.find(t => t.id === templateId)?.name || 'Unknown',
      usageCount: count,
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10)

  return {
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.status === 'active').length,
    templatesByCategory,
    mostUsedTemplates,
  }
}

export async function searchTemplates(
  query: string,
  limit: number = 20
): Promise<NotificationTemplate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('status', 'active')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching templates:', error)
    return []
  }

  return (data || []).map(mapTemplateFromDB)
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapTemplateFromDB(data: Record<string, unknown>): NotificationTemplate {
  return {
    id: data.id as string,
    name: data.name as string,
    description: (data.description as string) || undefined,
    category: data.category as TemplateCategory,
    status: data.status as TemplateStatus,
    subject: (data.subject as string) || undefined,
    body: data.body as string,
    htmlBody: (data.html_body as string) || undefined,
    channels: data.channels as DeliveryChannel[],
    priority: data.priority as 'low' | 'medium' | 'high' | 'critical',
    language: data.language as string,
    translations: (data.translations as Record<string, {
      subject?: string
      body: string
      htmlBody?: string
    }>) || undefined,
    variables: (data.variables as string[]) || undefined,
    createdBy: data.created_by as string,
    updatedBy: (data.updated_by as string) || undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
