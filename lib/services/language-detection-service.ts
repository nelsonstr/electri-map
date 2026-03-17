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

export interface DetectedLanguage {
  language: SupportedLanguage
  confidence: number
  isReliable: boolean
}

export interface LanguagePreference {
  userId: string
  preferredLanguage: SupportedLanguage
  fallbackLanguage: SupportedLanguage
  autoDetectEnabled: boolean
  lastUpdated: string
}

export interface UserLanguageHistory {
  id: string
  userId: string
  detectedLanguage: SupportedLanguage
  confidence: number
  contentType: 'text' | 'voice' | 'browser' | 'manual'
  content?: string
  timestamp: string
}

export interface DetectLanguageInput {
  text: string
  contentType?: 'text' | 'voice' | 'browser'
  userId?: string
}

// ============================================================================
// Language Configuration
// ============================================================================

export const LANGUAGE_CONFIG: Record<SupportedLanguage, {
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  code: string
  script?: string
  countries: string[]
}> = {
  en: { name: 'English', nativeName: 'English', direction: 'ltr', code: 'en', countries: ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'ZA'] },
  es: { name: 'Spanish', nativeName: 'Español', direction: 'ltr', code: 'es', countries: ['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'US'] },
  fr: { name: 'French', nativeName: 'Français', direction: 'ltr', code: 'fr', countries: ['FR', 'BE', 'CA', 'CH', 'LU', 'MC'] },
  de: { name: 'German', nativeName: 'Deutsch', direction: 'ltr', code: 'de', countries: ['DE', 'AT', 'CH', 'LU', 'LI'] },
  pt: { name: 'Portuguese', nativeName: 'Português', direction: 'ltr', code: 'pt', countries: ['PT', 'BR', 'MO', 'AO', 'MZ'] },
  it: { name: 'Italian', nativeName: 'Italiano', direction: 'ltr', code: 'it', countries: ['IT', 'CH', 'SM', 'VA'] },
  nl: { name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr', code: 'nl', countries: ['NL', 'BE', 'SR'] },
  pl: { name: 'Polish', nativeName: 'Polski', direction: 'ltr', code: 'pl', countries: ['PL'] },
  ru: { name: 'Russian', nativeName: 'Русский', direction: 'ltr', code: 'ru', script: 'Cyrillic', countries: ['RU', 'BY', 'KZ', 'KG'] },
  zh: { name: 'Chinese', nativeName: '中文', direction: 'ltr', code: 'zh', script: 'CJK', countries: ['CN', 'TW', 'HK', 'SG', 'MY'] },
  ja: { name: 'Japanese', nativeName: '日本語', direction: 'ltr', code: 'ja', script: 'CJK', countries: ['JP'] },
  ko: { name: 'Korean', nativeName: '한국어', direction: 'ltr', code: 'ko', script: 'Hangul', countries: ['KR', 'KP'] },
  ar: { name: 'Arabic', nativeName: 'العربية', direction: 'rtl', code: 'ar', script: 'Arabic', countries: ['SA', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MA', 'OM', 'PS', 'SY', 'TN', 'AE', 'YE', 'MR', 'DJ', 'SO', 'KM'] },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', code: 'hi', script: 'Devanagari', countries: ['IN'] },
}

// Common phrases for language detection
const LANGUAGE_INDICATORS: Record<SupportedLanguage, string[]> = {
  en: ['the', 'is', 'are', 'was', 'were', 'have', 'has', 'will', 'can', 'help', 'emergency', 'please', 'thank', 'sorry', 'hello', 'goodbye'],
  es: ['el', 'la', 'es', 'son', 'está', 'estedisponible', 'ayuda', 'emergencia', 'por favor', 'gracias', 'hola', 'adiós', 'ayúdame', 'socorro'],
  fr: ['le', 'la', 'les', 'est', 'sont', 'aide', 'urgence', 's\'il vous plaît', 'merci', 'bonjour', 'au revoir', 'secours'],
  de: ['der', 'die', 'das', 'ist', 'sind', 'hilfe', 'notfall', 'bitte', 'danke', 'hallo', 'tschüss', 'rettung'],
  pt: ['o', 'a', 'é', 'são', 'ajuda', 'emergência', 'por favor', 'obrigado', 'olá', 'tchau', 'socorro'],
  it: ['il', 'la', 'è', 'sono', 'aiuto', 'emergenza', 'per favore', 'grazie', 'ciao', 'arrivederci', 'soccorso'],
  nl: ['de', 'het', 'is', 'zijn', 'hulp', 'noodgeval', 'alsjeblieft', 'dank', 'hallo', 'dag', 'hulp'],
  pl: ['i', 'jest', 'są', 'pomoc', ' nagłówek', 'proszę', 'dziękuję', 'cześć', 'pomocy', 'ratunku'],
  ru: ['и', 'в', 'не', 'на', 'это', 'помощь', 'чрезвычайная ситуация', 'пожалуйста', 'спасибо', 'здравствуйте', 'помогите'],
  zh: ['的', '是', '在', '帮助', '紧急', '请', '谢谢', '你好', '再见', '救命', '帮助我'],
  ja: ['の', 'は', 'です', '帮助', '緊急', 'お願いします', 'ありがとう', 'こんにちは', '助けて', '救命'],
  ko: ['의', '는', '입니다', '도움', '긴급', '부탁합니다', '감사합니다', '안녕하세요', '도와줘', '구조해줘'],
  ar: ['في', 'هو', 'هي', 'على', 'إلى', 'مساعدة', 'طوارئ', 'من فضلك', 'شكرا', 'مرحبا', 'وداعا', 'ساعدني'],
  hi: ['का', 'है', 'हैं', 'में', 'की', 'और', 'सहायता', 'आपातकालीन', 'कृपया', 'धन्यवाद', 'नमस्ते', 'मदद'],
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const detectLanguageSchema = z.object({
  text: z.string().min(1),
  contentType: z.enum(['text', 'voice', 'browser']).optional(),
  userId: z.string().optional(),
})

export const updateLanguagePreferenceSchema = z.object({
  userId: z.string(),
  preferredLanguage: z.enum([
    'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi',
  ]),
  fallbackLanguage: z.enum([
    'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi',
  ]),
  autoDetectEnabled: z.boolean(),
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

export function getLanguageScript(code: SupportedLanguage): string {
  return LANGUAGE_CONFIG[code]?.script || 'Latin'
}

export function getLanguageCountries(code: SupportedLanguage): string[] {
  return LANGUAGE_CONFIG[code]?.countries || []
}

export function isRTLLanguage(code: SupportedLanguage): boolean {
  return LANGUAGE_CONFIG[code]?.direction === 'rtl'
}

export function getDefaultFallbackLanguage(): SupportedLanguage {
  return 'en'
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function detectLanguage(
  input: DetectLanguageInput
): Promise<DetectedLanguage> {
  const validationResult = detectLanguageSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid input: ${validationResult.error.message}`)
  }

  const { text } = input

  // Clean and normalize text
  const normalizedText = text.toLowerCase().trim()

  // Count matches for each language
  const languageScores: Record<SupportedLanguage, number> = {} as Record<SupportedLanguage, number>
  let totalMatches = 0

  for (const [lang, indicators] of Object.entries(LANGUAGE_INDICATORS)) {
    const langCode = lang as SupportedLanguage
    languageScores[langCode] = 0

    for (const indicator of indicators) {
      const regex = new RegExp(`\\b${indicator}\\b`, 'gi')
      const matches = normalizedText.match(regex)
      if (matches) {
        languageScores[langCode] += matches.length
        totalMatches += matches.length
      }
    }
  }

  // Calculate percentages
  const languagePercentages: Record<SupportedLanguage, number> = {} as Record<SupportedLanguage, number>
  
  for (const [lang, score] of Object.entries(languageScores)) {
    languagePercentages[lang as SupportedLanguage] = totalMatches > 0 
      ? (score / totalMatches) * 100 
      : 0
  }

  // Find the best match
  let bestMatch: SupportedLanguage = 'en'
  let bestScore = 0

  for (const [lang, percentage] of Object.entries(languagePercentages)) {
    if (percentage > bestScore) {
      bestScore = percentage
      bestMatch = lang as SupportedLanguage
    }
  }

  // If no clear match, try character-based detection for scripts
  if (bestScore === 0) {
    const scriptDetection = detectScript(text)
    if (scriptDetection) {
      bestMatch = scriptDetection
      bestScore = 50
    }
  }

  const confidence = Math.min(95, 40 + (bestScore * 0.6))
  const isReliable = confidence >= 70 || bestScore >= 3

  const result: DetectedLanguage = {
    language: bestMatch,
    confidence: Math.round(confidence),
    isReliable,
  }

  // Save to history if userId provided
  if (input.userId) {
    await saveLanguageDetection({
      userId: input.userId,
      detectedLanguage: result.language,
      confidence: result.confidence,
      contentType: input.contentType || 'text',
      content: input.text.substring(0, 500),
    })
  }

  return result
}

function detectScript(text: string): SupportedLanguage | null {
  // Check for Arabic script
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar'
  }
  
  // Check for Chinese characters
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return 'zh'
  }
  
  // Check for Japanese
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return 'ja'
  }
  
  // Check for Korean
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) {
    return 'ko'
  }
  
  // Check for Hindi/Devanagari
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi'
  }
  
  // Check for Cyrillic (Russian)
  if (/[\u0400-\u04FF]/.test(text)) {
    return 'ru'
  }

  return null
}

export async function getUserLanguagePreference(
  userId: string
): Promise<LanguagePreference | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_language_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    userId: data.user_id as string,
    preferredLanguage: data.preferred_language as SupportedLanguage,
    fallbackLanguage: data.fallback_language as SupportedLanguage,
    autoDetectEnabled: data.auto_detect_enabled as boolean,
    lastUpdated: data.updated_at as string,
  }
}

export async function setUserLanguagePreference(
  userId: string,
  preferredLanguage: SupportedLanguage,
  options?: {
    fallbackLanguage?: SupportedLanguage
    autoDetectEnabled?: boolean
  }
): Promise<LanguagePreference> {
  const supabase = createClient()

  const existing = await getUserLanguagePreference(userId)

  const preference: LanguagePreference = {
    userId,
    preferredLanguage,
    fallbackLanguage: options?.fallbackLanguage || existing?.fallbackLanguage || 'en',
    autoDetectEnabled: options?.autoDetectEnabled ?? existing?.autoDetectEnabled ?? true,
    lastUpdated: new Date().toISOString(),
  }

  if (existing) {
    await supabase
      .from('user_language_preferences')
      .update({
        preferred_language: preferredLanguage,
        fallback_language: preference.fallbackLanguage,
        auto_detect_enabled: preference.autoDetectEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  } else {
    await supabase
      .from('user_language_preferences')
      .insert({
        user_id: userId,
        preferred_language: preferredLanguage,
        fallback_language: preference.fallbackLanguage,
        auto_detect_enabled: preference.autoDetectEnabled,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
  }

  return preference
}

export async function getEffectiveLanguage(
  userId: string,
  detectedText?: string
): Promise<SupportedLanguage> {
  const preference = await getUserLanguagePreference(userId)

  // If user has a preference and auto-detect is disabled
  if (preference && !preference.autoDetectEnabled) {
    return preference.preferredLanguage
  }

  // If auto-detect is enabled and text is provided
  if (detectedText && preference?.autoDetectEnabled) {
    const detection = await detectLanguage({ text: detectedText, userId })
    
    // Only use detected language if reliable
    if (detection.isReliable) {
      return detection.language
    }
  }

  // Fall back to user preference or default
  return preference?.preferredLanguage || 'en'
}

export async function getLanguageHistory(
  userId: string,
  limit?: number
): Promise<UserLanguageHistory[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('language_detection_history')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit || 50)

  if (error) {
    console.error('Error fetching language history:', error)
    return []
  }

  return (data || []).map(d => ({
    id: d.id,
    userId: d.user_id,
    detectedLanguage: d.detected_language as SupportedLanguage,
    confidence: d.confidence,
    contentType: d.content_type,
    content: d.content,
    timestamp: d.timestamp,
  }))
}

export async function getLanguageStats(
  userId: string
): Promise<{
  primaryLanguage: SupportedLanguage
  totalDetections: number
  languageBreakdown: Array<{ language: SupportedLanguage; count: number; percentage: number }>
  autoDetectEnabled: boolean
  lastDetection: string | null
}> {
  const history = await getLanguageHistory(userId, 1000)
  const preference = await getUserLanguagePreference(userId)

  if (history.length === 0) {
    return {
      primaryLanguage: preference?.preferredLanguage || 'en',
      totalDetections: 0,
      languageBreakdown: [],
      autoDetectEnabled: preference?.autoDetectEnabled ?? true,
      lastDetection: null,
    }
  }

  // Count detections per language
  const languageCounts: Record<string, number> = {}
  for (const entry of history) {
    languageCounts[entry.detectedLanguage] = (languageCounts[entry.detectedLanguage] || 0) + 1
  }

  // Sort by count
  const sortedLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])

  const total = history.length
  const languageBreakdown = sortedLanguages.map(([lang, count]) => ({
    language: lang as SupportedLanguage,
    count,
    percentage: Math.round((count / total) * 100),
  }))

  return {
    primaryLanguage: sortedLanguages[0]?.[0] as SupportedLanguage || 'en',
    totalDetections: total,
    languageBreakdown,
    autoDetectEnabled: preference?.autoDetectEnabled ?? true,
    lastDetection: history[0]?.timestamp || null,
  }
}

async function saveLanguageDetection(
  detection: Omit<UserLanguageHistory, 'id'>
): Promise<void> {
  const supabase = createClient()

  const id = `langhist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  await supabase
    .from('language_detection_history')
    .insert({
      id,
      user_id: detection.userId,
      detected_language: detection.detectedLanguage,
      confidence: detection.confidence,
      content_type: detection.contentType,
      content: detection.content,
      timestamp: detection.timestamp || new Date().toISOString(),
    })
}

export async function clearLanguageHistory(userId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('language_detection_history')
    .delete()
    .eq('user_id', userId)
}

export function detectLanguageFromBrowser(): SupportedLanguage {
  if (typeof navigator === 'undefined') {
    return 'en'
  }

  // Get browser language
  const browserLang = navigator.language || 'en'
  
  // Parse language code
  const langCode = browserLang.split('-')[0].toLowerCase()

  // Map to supported languages
  const languageMapping: Record<string, SupportedLanguage> = {
    'en': 'en',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'pt': 'pt',
    'it': 'it',
    'nl': 'nl',
    'pl': 'pl',
    'ru': 'ru',
    'zh': 'zh',
    'ja': 'ja',
    'ko': 'ko',
    'ar': 'ar',
    'hi': 'hi',
  }

  return languageMapping[langCode] || 'en'
}

export async function translateContent(
  content: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage
): Promise<string> {
  // In production, this would call a translation API
  // For now, return placeholder
  console.log(`Translating from ${sourceLanguage} to ${targetLanguage}`)
  console.log(`Content: ${content.substring(0, 100)}...`)
  
  return `[${targetLanguage.toUpperCase()}] ${content}`
}

export async function batchDetectLanguage(
  texts: string[]
): Promise<DetectedLanguage[]> {
  const results: DetectedLanguage[] = []
  
  for (const text of texts) {
    const detection = await detectLanguage({ text })
    results.push(detection)
  }

  return results
}

export async function getMostUsedLanguage(
  userId: string
): Promise<SupportedLanguage> {
  const stats = await getLanguageStats(userId)
  
  if (stats.languageBreakdown.length > 0) {
    return stats.languageBreakdown[0].language
  }
  
  const preference = await getUserLanguagePreference(userId)
  return preference?.preferredLanguage || 'en'
}

export function suggestLanguage(
  detectedLanguage: SupportedLanguage,
  userPreference?: SupportedLanguage
): SupportedLanguage {
  // If user has a strong preference, suggest that
  if (userPreference) {
    // Check if detected language is in the same language family
    const languageFamilies: Record<string, SupportedLanguage[]> = {
      Romance: ['es', 'fr', 'it', 'pt', 'ro'],
      Germanic: ['en', 'de', 'nl', 'sv', 'da', 'no'],
      Slavic: ['ru', 'pl', 'cs', 'uk', 'bg'],
      EastAsian: ['zh', 'ja', 'ko', 'vi'],
    }

    for (const [, family] of Object.entries(languageFamilies)) {
      if (family.includes(detectedLanguage) && family.includes(userPreference)) {
        return userPreference
      }
    }
  }

  // Otherwise, use detected language
  return detectedLanguage
}
