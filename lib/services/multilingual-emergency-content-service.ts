import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type SupportedLanguage = 
  | 'en' 
  | 'es' 
  | 'fr' 
  | 'de' 
  | 'pt' 
  | 'it' 
  | 'nl' 
  | 'pl' 
  | 'ru' 
  | 'zh' 
  | 'ja' 
  | 'ko' 
  | 'ar' 
  | 'hi'

export type ContentCategory = 
  | 'emergency_instructions' 
  | 'medical_guidance' 
  | 'safety_tips' 
  | 'evacuation_routes' 
  | 'shelter_locations' 
  | 'emergency_contacts' 
  | 'preparedness_guide' 
  | 'recovery_information'

export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived'

export interface LanguageContent {
  language: SupportedLanguage
  title: string
  body: string
  audioUrl?: string
  videoUrl?: string
  lastUpdated: string
}

export interface EmergencyContent {
  id: string
  
  // Reference
  contentKey: string
  category: ContentCategory
  
  // All language versions
  translations: Record<SupportedLanguage, LanguageContent>
  
  // Default language (usually English)
  defaultLanguage: SupportedLanguage
  
  // Status
  status: ContentStatus
  approvedBy?: string
  approvedAt?: string
  
  // Metadata
  tags: string[]
  relatedContent?: string[]
  
  // Criticality
  isCritical: boolean
  priorityOrder?: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CreateContentInput {
  contentKey: string
  category: ContentCategory
  translations: Array<{
    language: SupportedLanguage
    title: string
    body: string
    audioUrl?: string
    videoUrl?: string
  }>
  defaultLanguage?: SupportedLanguage
  tags?: string[]
  relatedContent?: string[]
  isCritical?: boolean
}

export interface UpdateTranslationInput {
  contentId: string
  language: SupportedLanguage
  title: string
  body: string
  audioUrl?: string
  videoUrl?: string
}

export interface SearchContentInput {
  query: string
  language?: SupportedLanguage
  category?: ContentCategory
  isCritical?: boolean
  tags?: string[]
}

// ============================================================================
// Language Configuration
// ============================================================================

export const LANGUAGE_CONFIG: Record<SupportedLanguage, {
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  code: string
  flag?: string
}> = {
  en: { name: 'English', nativeName: 'English', direction: 'ltr', code: 'en', flag: '🇬🇧' },
  es: { name: 'Spanish', nativeName: 'Español', direction: 'ltr', code: 'es', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', direction: 'ltr', code: 'fr', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', direction: 'ltr', code: 'de', flag: '🇩🇪' },
  pt: { name: 'Portuguese', nativeName: 'Português', direction: 'ltr', code: 'pt', flag: '🇵🇹' },
  it: { name: 'Italian', nativeName: 'Italiano', direction: 'ltr', code: 'it', flag: '🇮🇹' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr', code: 'nl', flag: '🇳🇱' },
  pl: { name: 'Polish', nativeName: 'Polski', direction: 'ltr', code: 'pl', flag: '🇵🇱' },
  ru: { name: 'Russian', nativeName: 'Русский', direction: 'ltr', code: 'ru', flag: '🇷🇺' },
  zh: { name: 'Chinese', nativeName: '中文', direction: 'ltr', code: 'zh', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', direction: 'ltr', code: 'ja', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', direction: 'ltr', code: 'ko', flag: '🇰🇷' },
  ar: { name: 'Arabic', nativeName: 'العربية', direction: 'rtl', code: 'ar', flag: '🇸🇦' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', code: 'hi', flag: '🇮🇳' },
}

export const CONTENT_CATEGORY_CONFIG: Record<ContentCategory, {
  label: string
  icon: string
  priority: number
}> = {
  emergency_instructions: { label: 'Emergency Instructions', icon: '🚨', priority: 1 },
  medical_guidance: { label: 'Medical Guidance', icon: '🏥', priority: 2 },
  safety_tips: { label: 'Safety Tips', icon: '🛡️', priority: 3 },
  evacuation_routes: { label: 'Evacuation Routes', icon: '🧭', priority: 4 },
  shelter_locations: { label: 'Shelter Locations', icon: '🏠', priority: 5 },
  emergency_contacts: { label: 'Emergency Contacts', icon: '📞', priority: 6 },
  preparedness_guide: { label: 'Preparedness Guide', icon: '📋', priority: 7 },
  recovery_information: { label: 'Recovery Information', icon: '🔧', priority: 8 },
}

export const CRITICAL_CONTENT_KEYS = [
  'sos_instructions',
  'medical_emergency',
  'fire_safety',
  'earthquake',
  'flood',
  'evacuation_notice',
  'shelter_in_place',
  'severe_weather',
  'first_aid',
  'emergency_numbers',
]

// ============================================================================
// Validation Schemas
// ============================================================================

export const createContentSchema = z.object({
  contentKey: z.string().min(1).max(100),
  category: z.enum([
    'emergency_instructions',
    'medical_guidance',
    'safety_tips',
    'evacuation_routes',
    'shelter_locations',
    'emergency_contacts',
    'preparedness_guide',
    'recovery_information',
  ]),
  translations: z.array(z.object({
    language: z.enum([
      'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi',
    ]),
    title: z.string().min(1).max(200),
    body: z.string().min(1),
    audioUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
  })),
  defaultLanguage: z.enum([
    'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi',
  ]).optional(),
  tags: z.array(z.string()).optional(),
  relatedContent: z.array(z.string()).optional(),
  isCritical: z.boolean().optional(),
})

export const updateTranslationSchema = z.object({
  contentId: z.string(),
  language: z.enum([
    'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi',
  ]),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  audioUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

export function getLanguageName(code: SupportedLanguage): string {
  return LANGUAGE_CONFIG[code]?.name || code
}

export function getLanguageNativeName(code: SupportedLanguage): string {
  return LANGUAGE_CONFIG[code]?.nativeName || code
}

export function getLanguageDirection(code: SupportedLanguage): 'ltr' | 'rtl' {
  return LANGUAGE_CONFIG[code]?.direction || 'ltr'
}

export function getLanguageFlag(code: SupportedLanguage): string {
  return LANGUAGE_CONFIG[code]?.flag || ''
}

export function getCategoryLabel(category: ContentCategory): string {
  return CONTENT_CATEGORY_CONFIG[category]?.label || category
}

export function getCategoryIcon(category: ContentCategory): string {
  return CONTENT_CATEGORY_CONFIG[category]?.icon || '📄'
}

export function getStatusDisplayName(status: ContentStatus): string {
  const names: Record<ContentStatus, string> = {
    draft: 'Draft',
    review: 'In Review',
    approved: 'Approved',
    published: 'Published',
    archived: 'Archived',
  }
  return names[status] || status
}

export function getContentInLanguage(
  content: EmergencyContent,
  language: SupportedLanguage
): LanguageContent | null {
  return content.translations[language] || null
}

export function getAvailableLanguages(
  content: EmergencyContent
): Array<{ code: SupportedLanguage; name: string; hasTranslation: boolean }> {
  return Object.keys(LANGUAGE_CONFIG).map(code => ({
    code: code as SupportedLanguage,
    name: LANGUAGE_CONFIG[code as SupportedLanguage].name,
    hasTranslation: !!content.translations[code as SupportedLanguage],
  }))
}

export function calculateTranslationProgress(content: EmergencyContent): {
  total: number
  completed: number
  percentage: number
  missingLanguages: SupportedLanguage[]
} {
  const total = Object.keys(LANGUAGE_CONFIG).length
  const completed = Object.values(content.translations).filter(t => t && t.title && t.body).length
  
  const missingLanguages = Object.keys(LANGUAGE_CONFIG)
    .filter(code => !content.translations[code as SupportedLanguage]?.title)
    .map(code => code as SupportedLanguage)

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    missingLanguages,
  }
}

export function autoTranslate(
  sourceText: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage
): string {
  // In production, this would call a translation API (Google Translate, DeepL, etc.)
  // For now, return placeholder
  console.log(`Translating from ${sourceLanguage} to ${targetLanguage}`)
  console.log(`Source: ${sourceText}`)
  
  // Placeholder - would be replaced with actual translation
  return `[${targetLanguage}] ${sourceText}`
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function createEmergencyContent(
  input: CreateContentInput,
  userId: string
): Promise<EmergencyContent> {
  const validationResult = createContentSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Build translations object
  const translations: Record<string, LanguageContent> = {}
  for (const translation of input.translations) {
    translations[translation.language] = {
      language: translation.language,
      title: translation.title,
      body: translation.body,
      audioUrl: translation.audioUrl,
      videoUrl: translation.videoUrl,
      lastUpdated: new Date().toISOString(),
    }
  }

  // Determine if critical
  const isCritical = input.isCritical || 
    CRITICAL_CONTENT_KEYS.some(key => input.contentKey.toLowerCase().includes(key))

  const content: EmergencyContent = {
    id: contentId,
    contentKey: input.contentKey,
    category: input.category,
    translations,
    defaultLanguage: input.defaultLanguage || 'en',
    status: 'draft',
    tags: input.tags || [],
    relatedContent: input.relatedContent,
    isCritical,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('emergency_content')
    .insert({
      id: contentId,
      content_key: input.contentKey,
      category: input.category,
      translations,
      default_language: input.defaultLanguage || 'en',
      status: 'draft',
      tags: input.tags || [],
      related_content: input.relatedContent,
      is_critical: isCritical,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error creating emergency content:', error)
    throw new Error('Failed to create emergency content')
  }

  return content
}

export async function getEmergencyContent(
  contentId: string
): Promise<EmergencyContent | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('emergency_content')
    .select('*')
    .eq('id', contentId)
    .single()

  if (error || !data) {
    return null
  }

  return mapContentFromDB(data)
}

export async function getContentByKey(
  contentKey: string
): Promise<EmergencyContent | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('emergency_content')
    .select('*')
    .eq('content_key', contentKey)
    .single()

  if (error || !data) {
    return null
  }

  return mapContentFromDB(data)
}

export async function updateTranslation(
  input: UpdateTranslationInput,
  userId: string
): Promise<EmergencyContent> {
  const validationResult = updateTranslationSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  const content = await getEmergencyContent(input.contentId)
  if (!content) {
    throw new Error('Content not found')
  }

  // Update translation
  const translations = { ...content.translations }
  translations[input.language] = {
    language: input.language,
    title: input.title,
    body: input.body,
    audioUrl: input.audioUrl,
    videoUrl: input.videoUrl,
    lastUpdated: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('emergency_content')
    .update({
      translations,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.contentId)

  if (error) {
    console.error('Error updating translation:', error)
    throw new Error('Failed to update translation')
  }

  return getEmergencyContent(input.contentId) as Promise<EmergencyContent>
}

export async function approveContent(
  contentId: string,
  approverId: string
): Promise<EmergencyContent> {
  const supabase = createClient()

  const { error } = await supabase
    .from('emergency_content')
    .update({
      status: 'approved',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentId)

  if (error) {
    console.error('Error approving content:', error)
    throw new Error('Failed to approve content')
  }

  return getEmergencyContent(contentId) as Promise<EmergencyContent>
}

export async function publishContent(contentId: string): Promise<EmergencyContent> {
  const supabase = createClient()

  const content = await getEmergencyContent(contentId)
  if (!content) {
    throw new Error('Content not found')
  }

  if (content.status !== 'approved') {
    throw new Error('Content must be approved before publishing')
  }

  const { error } = await supabase
    .from('emergency_content')
    .update({
      status: 'published',
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentId)

  if (error) {
    console.error('Error publishing content:', error)
    throw new Error('Failed to publish content')
  }

  return getEmergencyContent(contentId) as Promise<EmergencyContent>
}

export async function archiveContent(contentId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('emergency_content')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentId)

  if (error) {
    console.error('Error archiving content:', error)
    throw new Error('Failed to archive content')
  }
}

export async function searchContent(
  input: SearchContentInput
): Promise<EmergencyContent[]> {
  const supabase = createClient()

  let query = supabase
    .from('emergency_content')
    .select('*')
    .eq('status', 'published')

  if (input.language) {
    // Filter by language availability
    query = query.not(`translations->${input.language}`, 'is', 'null')
  }

  if (input.category) {
    query = query.eq('category', input.category)
  }

  if (input.isCritical !== undefined) {
    query = query.eq('is_critical', input.isCritical)
  }

  if (input.tags && input.tags.length > 0) {
    query = query.overlaps('tags', input.tags)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error searching content:', error)
    return []
  }

  // Filter by text search (client-side for now)
  let results = (data || []).map(mapContentFromDB)

  if (input.query) {
    const searchLower = input.query.toLowerCase()
    results = results.filter(content => {
      const searchIn = input.language || content.defaultLanguage
      const translation = content.translations[searchIn]
      if (translation) {
        return (
          translation.title.toLowerCase().includes(searchLower) ||
          translation.body.toLowerCase().includes(searchLower)
        )
      }
      return false
    })
  }

  // Sort critical content first
  results.sort((a, b) => {
    if (a.isCritical && !b.isCritical) return -1
    if (!a.isCritical && b.isCritical) return 1
    return 0
  })

  return results
}

export async function getContentByCategory(
  category: ContentCategory,
  language?: SupportedLanguage
): Promise<Array<EmergencyContent & { translation?: LanguageContent }>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('emergency_content')
    .select('*')
    .eq('category', category)
    .eq('status', 'published')
    .order('is_critical', { ascending: false })

  if (error) {
    console.error('Error fetching content by category:', error)
    return []
  }

  return (data || []).map(content => {
    const mapped = mapContentFromDB(content)
    return {
      ...mapped,
      translation: language ? mapped.translations[language] : undefined,
    }
  })
}

export async function getCriticalContent(
  language: SupportedLanguage
): Promise<Array<EmergencyContent & { translation: LanguageContent }>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('emergency_content')
    .select('*')
    .eq('is_critical', true)
    .eq('status', 'published')

  if (error) {
    console.error('Error fetching critical content:', error)
    return []
  }

  return (data || [])
    .map(content => {
      const mapped = mapContentFromDB(content)
      const translation = mapped.translations[language]
      if (!translation) return null
      return { ...mapped, translation }
    })
    .filter((item): item is EmergencyContent & { translation: LanguageContent } => item !== null)
}

export async function duplicateContent(
  contentId: string,
  newContentKey: string,
  userId: string
): Promise<EmergencyContent> {
  const original = await getEmergencyContent(contentId)
  if (!original) {
    throw new Error('Original content not found')
  }

  const translations = { ...original.translations }
  for (const lang of Object.keys(translations)) {
    translations[lang as SupportedLanguage] = {
      ...translations[lang as SupportedLanguage],
      lastUpdated: new Date().toISOString(),
    }
  }

  return createEmergencyContent(
    {
      contentKey: newContentKey,
      category: original.category,
      translations: [], // Will be set from the object
      defaultLanguage: original.defaultLanguage,
      tags: [...original.tags],
      relatedContent: original.relatedContent,
      isCritical: original.isCritical,
    },
    userId
  ).then(content => {
    // Update with translations
    const contentWithTranslations = { ...content, translations }
    return contentWithTranslations
  })
}

export async function getContentAnalytics(): Promise<{
  totalContent: number
  byCategory: Record<string, number>
  byStatus: Record<string, number>
  translationProgress: {
    language: string
    coverage: number
    missingCritical: string[]
  }[]
}> {
  const supabase = createClient()

  const { data } = await supabase
    .from('emergency_content')
    .select('*')

  if (!data || data.length as number === 0) {
    return {
      totalContent: 0,
      byCategory: {},
      byStatus: {},
      translationProgress: [],
    }
  }

  const byCategory: Record<string, number> = {}
  const byStatus: Record<string, number> = {}

  for (const content of data) {
    byCategory[content.category] = (byCategory[content.category] || 0) + 1
    byStatus[content.status] = (byStatus[content.status] || 0) + 1
  }

  // Calculate translation progress per language
  const translationProgress = Object.keys(LANGUAGE_CONFIG).map(lang => {
    const langCode = lang as SupportedLanguage
    let coverage = 0
    const missingCritical: string[] = []

    for (const content of data) {
      const hasTranslation = content.translations && content.translations[langCode]
      if (hasTranslation) {
        coverage++
      } else if (content.is_critical) {
        missingCritical.push(content.content_key)
      }
    }

    return {
      language: lang,
      coverage: Math.round((coverage / data.length as number) * 100),
      missingCritical,
    }
  })

  return {
    totalContent: data.length as number,
    byCategory,
    byStatus,
    translationProgress,
  }
}

export async function importContentTranslations(
  contentId: string,
  translations: Array<{ language: SupportedLanguage; title: string; body: string }>,
  userId: string
): Promise<EmergencyContent> {
  const content = await getEmergencyContent(contentId)
  if (!content) {
    throw new Error('Content not found')
  }

  const updatedTranslations = { ...content.translations }
  for (const translation of translations) {
    updatedTranslations[translation.language] = {
      language: translation.language,
      title: translation.title,
      body: translation.body,
      lastUpdated: new Date().toISOString(),
    }
  }

  const supabase = createClient()
  await supabase
    .from('emergency_content')
    .update({
      translations: updatedTranslations,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentId)

  return getEmergencyContent(contentId) as Promise<EmergencyContent>
}

export async function exportContent(
  contentId: string
): Promise<Record<SupportedLanguage, { title: string; body: string }>> {
  const content = await getEmergencyContent(contentId)
  if (!content) {
    throw new Error('Content not found')
  }

  const exportData: Record<string, { title: string; body: string }> = {}
  for (const [lang, translation] of Object.entries(content.translations)) {
    if (translation && translation.title && translation.body) {
      exportData[lang] = {
        title: translation.title,
        body: translation.body,
      }
    }
  }

  return exportData as Record<SupportedLanguage, { title: string; body: string }>
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapContentFromDB(data: Record<string, unknown>): EmergencyContent {
  return {
    id: data.id as string,
    contentKey: data.content_key as string,
    category: data.category as ContentCategory,
    translations: (data.translations as Record<string, LanguageContent>) || {},
    defaultLanguage: data.default_language as SupportedLanguage,
    status: data.status as ContentStatus,
    approvedBy: data.approved_by as string | undefined,
    approvedAt: data.approved_at as string | undefined,
    tags: (data.tags as string[]) || [],
    relatedContent: data.related_content as string[] | undefined,
    isCritical: data.is_critical as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
