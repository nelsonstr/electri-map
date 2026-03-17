/**
 * Accessible Emergency Alert System Service
 * 
 * Epic: Accessible Emergency Alert System
 * Description: Comprehensive accessibility features ensuring all users, including those with visual,
 * hearing, motor, or cognitive impairments, can receive and respond to emergency alerts through
 * multiple modalities including vibration patterns, high-contrast visuals, audio alerts, and
 * cognitively simple instructions.
 * 
 * Bmad Category: Accessibility & Inclusion (AI)
 * Emergency Mode Relevance: BFSI, CPI, CEX - Critical for inclusive emergency response
 * Complexity: 4
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type AccessibilityMode = 
  | 'visual'
  | 'hearing'
  | 'motor'
  | 'cognitive'
  | 'combined';

export type AlertModality = 
  | 'visual'
  | 'auditory'
  | 'vibration'
  | 'haptic'
  | 'text_to_speech'
  | 'sign_language_video'
  | 'braille_display'
  | 'tactile'
  | 'color_blind_optimized';

export type VisualAccessibilityFeature = 
  | 'high_contrast'
  | 'large_text'
  | 'ultra_large_text'
  | 'screen_reader_optimized'
  | 'voice_over_compatible'
  | 'color_blind_modes'
  | 'reduced_motion'
  | 'dark_mode'
  | 'light_mode'
  | 'custom_colors';

export type HearingAccessibilityFeature = 
  | 'captions'
  | 'transcript'
  | 'visual_alerts'
  | 'vibration_alerts'
  | 'flashing_alerts'
  | 'hearing_loop_compatible'
  | 'captions_live'
  | 'sign_language_interpreter';

export type MotorAccessibilityFeature = 
  | 'voice_control'
  | 'switch_control'
  | 'eye_tracking'
  | 'single_tap'
  | 'double_tap'
  | 'long_press'
  | 'shake_to_alert'
  | 'head_gestures'
  | 'adjustable_sensitivity';

export type CognitiveAccessibilityFeature = 
  | 'simple_language'
  | 'pictogram_support'
  | 'step_by_step_instructions'
  | 'countdown_timers'
  | 'progress_indicators'
  | 'calm_notifications'
  | 'predictive_suggestions'
  | 'familiar_layouts';

export type AlertPriority = 
  | 'emergency'
  | 'warning'
  | 'information'
  | 'test';

export type UserAlertPreference = {
  id: string;
  user_id: string;
  modality: AlertModality;
  priority_threshold: AlertPriority;
  is_enabled: boolean;
  custom_settings?: Record<string, unknown>;
};

export interface AccessibleAlert {
  id: string;
  alert_id: string;
  title: string;
  message: string;
  priority: AlertPriority;
  timestamp: Date;
  modalities_delivered: AlertModality[];
  accessibility_mode: AccessibilityMode;
  translations?: Record<string, { title: string; message: string }>;
  pictograms?: string[];
  video_resources?: {
    sign_language?: string;
    audio_description?: string;
  };
}

export interface AccessibilityProfile {
  id: string;
  user_id: string;
  profile_name: string;
  is_default: boolean;
  visual_features: VisualAccessibilityFeature[];
  hearing_features: HearingAccessibilityFeature[];
  motor_features: MotorAccessibilityFeature[];
  cognitive_features: CognitiveAccessibilityFeature[];
  preferred_modalities: AlertModality[];
  emergency_contact_id?: string;
  assistant_device_ids?: string[];
}

export interface AlertFeedback {
  id: string;
  alert_id: string;
  user_id: string;
  was_perceived: boolean;
  was_understood: boolean;
  was_actionable: boolean;
  modality_used?: AlertModality;
  time_to_perceive_seconds?: number;
  time_to_understand_seconds?: number;
  time_to_act_seconds?: number;
  difficulties?: string[];
  suggestions?: string[];
  created_at: Date;
}

export interface AssistiveDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'hearing_aid' | 'cochlear_implant' | 'vibration_device' | 
               'braille_display' | 'screen_reader' | 'switch_device' |
               'voice_assistant' | 'eye_tracker' | 'other';
  capabilities: AlertModality[];
  is_paired: boolean;
  last_sync_at?: Date;
  battery_level?: number;
}

export interface AccessibilitySettings {
  visual: {
    fontSize: 'normal' | 'large' | 'extra_large';
    highContrast: boolean;
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    reduceMotion: boolean;
    screenReader: boolean;
    customColors?: { background: string; text: string; accent: string };
  };
  hearing: {
    captions: boolean;
    captionsSize: 'normal' | 'large' | 'extra_large';
    vibrationAlerts: boolean;
    flashingAlerts: boolean;
    hearingAidCompatible: boolean;
  };
  motor: {
    voiceControl: boolean;
    switchControl: boolean;
    touchSensitivity: 'normal' | 'low' | 'high';
    gestureControls: string[];
    autoAnswer: boolean;
  };
  cognitive: {
    simpleLanguage: boolean;
    pictograms: boolean;
    stepByStepMode: boolean;
    calmNotifications: boolean;
    predictableLayout: boolean;
  };
}

// ============================================================================
// Zod Schemas
// ============================================================================

const VisualAccessibilitySettingsSchema = z.object({
  fontSize: z.enum(['normal', 'large', 'extra_large']),
  highContrast: z.boolean(),
  colorBlindMode: z.enum(['none', 'protanopia', 'deuteranopia', 'tritanopia']),
  reduceMotion: z.boolean(),
  screenReader: z.boolean(),
  customColors: z.object({
    background: z.string(),
    text: z.string(),
    accent: z.string()
  }).optional()
});

const HearingAccessibilitySettingsSchema = z.object({
  captions: z.boolean(),
  captionsSize: z.enum(['normal', 'large', 'extra_large']),
  vibrationAlerts: z.boolean(),
  flashingAlerts: z.boolean(),
  hearingAidCompatible: z.boolean()
});

const MotorAccessibilitySettingsSchema = z.object({
  voiceControl: z.boolean(),
  switchControl: z.boolean(),
  touchSensitivity: z.enum(['normal', 'low', 'high']),
  gestureControls: z.array(z.string()),
  autoAnswer: z.boolean()
});

const CognitiveAccessibilitySettingsSchema = z.object({
  simpleLanguage: z.boolean(),
  pictograms: z.boolean(),
  stepByStepMode: z.boolean(),
  calmNotifications: z.boolean(),
  predictableLayout: z.boolean()
});

const AccessibilitySettingsSchema = z.object({
  visual: VisualAccessibilitySettingsSchema,
  hearing: HearingAccessibilitySettingsSchema,
  motor: MotorAccessibilitySettingsSchema,
  cognitive: CognitiveAccessibilitySettingsSchema
});

// ============================================================================
// Configuration
// ============================================================================

export const accessibilityConfig = {
  // Alert modality configuration
  modalityConfig: {
    visual: {
      priority: 1,
      supported_features: ['high_contrast', 'large_text', 'screen_reader_optimized'],
      fallbacks: ['auditory', 'vibration']
    },
    auditory: {
      priority: 2,
      supported_features: ['volume_control', 'frequency_adjustment'],
      fallbacks: ['visual', 'vibration']
    },
    vibration: {
      priority: 3,
      supported_features: ['pattern_customization', 'intensity_adjustment'],
      fallbacks: ['visual', 'auditory']
    },
    haptic: {
      priority: 4,
      supported_features: ['force_feedback', 'spatial_haptics'],
      fallbacks: ['vibration', 'visual']
    },
    text_to_speech: {
      priority: 5,
      supported_features: ['voice_selection', 'speed_adjustment', 'pause_control'],
      fallbacks: ['visual', 'captions']
    },
    sign_language_video: {
      priority: 6,
      supported_features: ['avatar_signing', 'human_interpreter'],
      fallbacks: ['captions', 'text_to_speech']
    },
    braille_display: {
      priority: 7,
      supported_features: ['grade_2_braille', 'computer_braille'],
      fallbacks: ['text_to_speech', 'audio_description']
    },
    tactile: {
      priority: 8,
      supported_features: ['texture_patterns', 'raised_graphics'],
      fallbacks: ['vibration', 'audio_description']
    },
    color_blind_optimized: {
      priority: 9,
      supported_features: ['pattern_icons', 'high_contrast_borders'],
      fallbacks: ['text_labels', 'audio_description']
    }
  },
  
  // Vibration pattern definitions for emergencies
  vibrationPatterns: {
    emergency: {
      pattern: [500, 200, 500, 200, 500, 200, 500],
      repeat: 3,
      description: 'Urgent: 3 short-long-short sequences'
    },
    warning: {
      pattern: [300, 150, 300, 150, 300],
      repeat: 2,
      description: 'Warning: 2 short sequences'
    },
    information: {
      pattern: [200, 100, 200],
      repeat: 1,
      description: 'Info: Single short sequence'
    },
    sos: {
      pattern: [1000, 500, 1000, 500, 1000],
      repeat: 5,
      description: 'SOS: Long-short-long-short-long'
    }
  },
  
  // Color-blind optimized palettes
  colorBlindPalettes: {
    default: {
      emergency: '#e63946',
      warning: '#f4a261',
      information: '#2a9d8f',
      success: '#06d6a0',
      neutral: '#6c757d'
    },
    protanopia: {
      emergency: '#d62828',
      warning: '#fcbf49',
      information: '#0077b6',
      success: '#55a630',
      neutral: '#6c757d'
    },
    deuteranopia: {
      emergency: '#d62828',
      warning: '#ffb703',
      information: '#023e8a',
      success: '#70e000',
      neutral: '#6c757d'
    },
    tritanopia: {
      emergency: '#9b2226',
      warning: '#ffbe0b',
      information: '#3a0ca3',
      success: '#4cc9f0',
      neutral: '#6c757d'
    }
  },
  
  // Emergency alert templates for different accessibility needs
  alertTemplates: {
    visual: {
      icon: 'eye',
      highContrastIcon: 'eye',
      flashRate: 0.5 // Hz
    },
    auditory: {
      frequency: 2000,
      volume: 100,
      duration: 5
    },
    cognitive: {
      maxWords: 20,
      usePictograms: true,
      stepsCount: 3
    }
  },
  
  // Display configuration
  display: {
    modalityIcons: {
      visual: 'eye',
      auditory: 'volume-2',
      vibration: 'smartphone',
      haptic: 'finger-print',
      text_to_speech: 'mic',
      sign_language_video: 'hands',
      braille_display: 'type',
      tactile: 'touch',
      color_blind_optimized: 'palette'
    },
    featureCategories: {
      visual: 'Visual',
      hearing: 'Hearing',
      motor: 'Motor',
      cognitive: 'Cognitive'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getModalityDisplayInfo(modality: AlertModality) {
  const modalityInfo: Record<AlertModality, { icon: string; label: string; description: string }> = {
    visual: { icon: 'eye', label: 'Visual', description: 'Alerts displayed on screen with high contrast options' },
    auditory: { icon: 'volume-2', label: 'Auditory', description: 'Sound-based alerts with frequency adjustments' },
    vibration: { icon: 'smartphone', label: 'Vibration', description: 'Haptic feedback with customizable patterns' },
    haptic: { icon: 'finger-print', label: 'Haptic', description: 'Advanced tactile feedback for precise alerts' },
    text_to_speech: { icon: 'mic', label: 'Text-to-Speech', description: 'Voice reading of alert content' },
    sign_language_video: { icon: 'hands', label: 'Sign Language', description: 'Video with sign language interpretation' },
    braille_display: { icon: 'type', label: 'Braille', description: 'Braille output for tactile readers' },
    tactile: { icon: 'touch', label: 'Tactile', description: 'Texture-based identification' },
    color_blind_optimized: { icon: 'palette', label: 'Color-Blind Optimized', description: 'High-contrast patterns and symbols' }
  };
  
  return modalityInfo[modality];
}

export function getVisualFeatureDisplayInfo(feature: VisualAccessibilityFeature) {
  const featureInfo: Record<VisualAccessibilityFeature, { icon: string; label: string }> = {
    high_contrast: { icon: 'contrast', label: 'High Contrast' },
    large_text: { icon: 'type', label: 'Large Text' },
    ultra_large_text: { icon: 'type', label: 'Ultra Large Text' },
    screen_reader_optimized: { icon: 'mic', label: 'Screen Reader Optimized' },
    voice_over_compatible: { icon: 'mic', label: 'VoiceOver Compatible' },
    color_blind_modes: { icon: 'palette', label: 'Color Blind Modes' },
    reduced_motion: { icon: 'activity', label: 'Reduced Motion' },
    dark_mode: { icon: 'moon', label: 'Dark Mode' },
    light_mode: { icon: 'sun', label: 'Light Mode' },
    custom_colors: { icon: 'palette', label: 'Custom Colors' }
  };
  
  return featureInfo[feature];
}

export function getHearingFeatureDisplayInfo(feature: HearingAccessibilityFeature) {
  const featureInfo: Record<HearingAccessibilityFeature, { icon: string; label: string }> = {
    captions: { icon: 'captions', label: 'Captions' },
    transcript: { icon: 'file-text', label: 'Transcript' },
    visual_alerts: { icon: 'eye', label: 'Visual Alerts' },
    vibration_alerts: { icon: 'smartphone', label: 'Vibration Alerts' },
    flashing_alerts: { icon: 'flash', label: 'Flashing Alerts' },
    hearing_loop_compatible: { icon: 'hearing', label: 'Hearing Loop Compatible' },
    captions_live: { icon: 'captions', label: 'Live Captions' },
    sign_language_interpreter: { icon: 'hands', label: 'Sign Language Interpreter' }
  };
  
  return featureInfo[feature];
}

export function getMotorFeatureDisplayInfo(feature: MotorAccessibilityFeature) {
  const featureInfo: Record<MotorAccessibilityFeature, { icon: string; label: string }> = {
    voice_control: { icon: 'mic', label: 'Voice Control' },
    switch_control: { icon: 'toggle-left', label: 'Switch Control' },
    eye_tracking: { icon: 'eye', label: 'Eye Tracking' },
    single_tap: { icon: 'pointer', label: 'Single Tap' },
    double_tap: { icon: 'mouse-pointer-2', label: 'Double Tap' },
    long_press: { icon: 'clock', label: 'Long Press' },
    shake_to_alert: { icon: 'shake', label: 'Shake to Alert' },
    head_gestures: { icon: 'user', label: 'Head Gestures' },
    adjustable_sensitivity: { icon: 'sliders', label: 'Adjustable Sensitivity' }
  };
  
  return featureInfo[feature];
}

export function getCognitiveFeatureDisplayInfo(feature: CognitiveAccessibilityFeature) {
  const featureInfo: Record<CognitiveAccessibilityFeature, { icon: string; label: string }> = {
    simple_language: { icon: 'file-text', label: 'Simple Language' },
    pictogram_support: { icon: 'image', label: 'Pictogram Support' },
    step_by_step_instructions: { icon: 'list-ordered', label: 'Step-by-Step Instructions' },
    countdown_timers: { icon: 'clock', label: 'Countdown Timers' },
    progress_indicators: { icon: 'progress', label: 'Progress Indicators' },
    calm_notifications: { icon: 'bell-off', label: 'Calm Notifications' },
    predictive_suggestions: { icon: 'sparkles', label: 'Predictive Suggestions' },
    familiar_layouts: { icon: 'layout', label: 'Familiar Layouts' }
  };
  
  return featureInfo[feature];
}

export function getColorForColorBlindMode(
  baseColor: string,
  mode: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'none'
): string {
  const palettes = accessibilityConfig.colorBlindPalettes;
  
  // Map base colors to palette equivalents
  if (baseColor === '#ef4444' || baseColor === '#e63946' || baseColor === '#d62828') {
    return palettes[mode === 'none' ? 'default' : mode].emergency;
  }
  if (baseColor === '#f59e0b' || baseColor === '#f4a261' || baseColor === '#fcbf49') {
    return palettes[mode === 'none' ? 'default' : mode].warning;
  }
  if (baseColor === '#3b82f6' || baseColor === '#2a9d8f' || baseColor === '#0077b6') {
    return palettes[mode === 'none' ? 'default' : mode].information;
  }
  if (baseColor === '#10b981' || baseColor === '#06d6a0' || baseColor === '#55a630') {
    return palettes[mode === 'none' ? 'default' : mode].success;
  }
  
  return palettes[mode === 'none' ? 'default' : mode].neutral;
}

export function generateVibrationPattern(
  priority: AlertPriority,
  customPattern?: number[]
): number[] {
  const patterns = accessibilityConfig.vibrationPatterns;
  
  if (customPattern) {
    return customPattern;
  }
  
  return patterns[priority]?.pattern || patterns.information.pattern;
}

export function formatAlertForCognitiveAccess(
  message: string,
  settings: { usePictograms: boolean; maxWords: number; simpleLanguage: boolean }
): { text: string; pictograms?: string[] } {
  let processedMessage = message;
  const pictograms: string[] = [];
  
  // Simple language substitution
  if (settings.simpleLanguage) {
    const replacements: Record<string, string> = {
      'evacuate': 'leave safely',
      'shelter': 'safe place',
      'immediately': 'right now',
      'emergency': 'danger',
      'warning': 'alert',
      'evacuation': 'safe leaving',
      'remain': 'stay',
      'caution': 'be careful'
    };
    
    Object.entries(replacements).forEach(([word, replacement]) => {
      processedMessage = processedMessage.replace(new RegExp(word, 'gi'), replacement);
    });
  }
  
  // Extract key terms for pictograms
  const pictogramKeywords = ['fire', 'water', 'danger', 'safe', 'help', 'exit', 'shelter'];
  pictogramKeywords.forEach(keyword => {
    if (processedMessage.toLowerCase().includes(keyword)) {
      pictograms.push(keyword);
    }
  });
  
  // Truncate if too long
  const words = processedMessage.split(' ');
  if (words.length > settings.maxWords) {
    processedMessage = words.slice(0, settings.maxWords).join(' ') + '...';
  }
  
  return {
    text: processedMessage,
    pictograms: settings.usePictograms ? pictograms : undefined
  };
}

export function getAccessibilityModeFromProfile(profile: AccessibilityProfile): AccessibilityMode {
  const visualCount = profile.visual_features.length;
  const hearingCount = profile.hearing_features.length;
  const motorCount = profile.motor_features.length;
  const cognitiveCount = profile.cognitive_features.length;
  
  const maxCount = Math.max(visualCount, hearingCount, motorCount, cognitiveCount);
  
  if (visualCount === maxCount && visualCount > 0) return 'visual';
  if (hearingCount === maxCount && hearingCount > 0) return 'hearing';
  if (motorCount === maxCount && motorCount > 0) return 'motor';
  if (cognitiveCount === maxCount && cognitiveCount > 0) return 'cognitive';
  
  return 'combined';
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Get user's accessibility profile
 */
export async function getAccessibilityProfile(
  userId: string
): Promise<AccessibilityProfile | null> {
  const { data, error } = await supabase
    .from('accessibility_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch accessibility profile: ${error.message}`);
  }
  
  return data;
}

/**
 * Create or update accessibility profile
 */
export async function saveAccessibilityProfile(
  profile: Omit<AccessibilityProfile, 'id'>
): Promise<AccessibilityProfile> {
  // Check if default profile exists
  const { data: existing } = await supabase
    .from('accessibility_profiles')
    .select('id')
    .eq('user_id', profile.user_id)
    .eq('is_default', true)
    .single();
  
  if (existing) {
    const { data, error } = await supabase
      .from('accessibility_profiles')
      .update({
        profile_name: profile.profile_name,
        visual_features: profile.visual_features,
        hearing_features: profile.hearing_features,
        motor_features: profile.motor_features,
        cognitive_features: profile.cognitive_features,
        preferred_modalities: profile.preferred_modalities,
        emergency_contact_id: profile.emergency_contact_id,
        assistant_device_ids: profile.assistant_device_ids
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update profile: ${error.message}`);
    return data;
  }
  
  const { data, error } = await supabase
    .from('accessibility_profiles')
    .insert({
      user_id: profile.user_id,
      profile_name: profile.profile_name,
      is_default: true,
      visual_features: profile.visual_features,
      hearing_features: profile.hearing_features,
      motor_features: profile.motor_features,
      cognitive_features: profile.cognitive_features,
      preferred_modalities: profile.preferred_modalities,
      emergency_contact_id: profile.emergency_contact_id,
      assistant_device_ids: profile.assistant_device_ids
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create profile: ${error.message}`);
  return data;
}

/**
 * Get user's alert preferences
 */
export async function getAlertPreferences(
  userId: string
): Promise<UserAlertPreference[]> {
  const { data, error } = await supabase
    .from('user_alert_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('is_enabled', true);
  
  if (error) throw new Error(`Failed to fetch preferences: ${error.message}`);
  
  return data || [];
}

/**
 * Update alert preference
 */
export async function updateAlertPreference(
  preference: Omit<UserAlertPreference, 'id'>
): Promise<UserAlertPreference> {
  // Check if exists
  const { data: existing } = await supabase
    .from('user_alert_preferences')
    .select('id')
    .eq('user_id', preference.user_id)
    .eq('modality', preference.modality)
    .single();
  
  if (existing) {
    const { data, error } = await supabase
      .from('user_alert_preferences')
      .update({
        priority_threshold: preference.priority_threshold,
        is_enabled: preference.is_enabled,
        custom_settings: preference.custom_settings
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update preference: ${error.message}`);
    return data;
  }
  
  const { data, error } = await supabase
    .from('user_alert_preferences')
    .insert({
      user_id: preference.user_id,
      modality: preference.modality,
      priority_threshold: preference.priority_threshold,
      is_enabled: preference.is_enabled,
      custom_settings: preference.custom_settings
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create preference: ${error.message}`);
  return data;
}

/**
 * Register assistive device
 */
export async function registerAssistiveDevice(
  device: Omit<AssistiveDevice, 'id'>
): Promise<AssistiveDevice> {
  const { data, error } = await supabase
    .from('assistive_devices')
    .insert({
      user_id: device.user_id,
      device_name: device.device_name,
      device_type: device.device_type,
      capabilities: device.capabilities,
      is_paired: device.is_paired
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to register device: ${error.message}`);
  return data;
}

/**
 * Get user's assistive devices
 */
export async function getAssistiveDevices(
  userId: string
): Promise<AssistiveDevice[]> {
  const { data, error } = await supabase
    .from('assistive_devices')
    .select('*')
    .eq('user_id', userId)
    .eq('is_paired', true);
  
  if (error) throw new Error(`Failed to fetch devices: ${error.message}`);
  
  return data || [];
}

/**
 * Record alert feedback
 */
export async function recordAlertFeedback(
  feedback: Omit<AlertFeedback, 'id' | 'created_at'>
): Promise<AlertFeedback> {
  const { data, error } = await supabase
    .from('alert_feedback')
    .insert({
      alert_id: feedback.alert_id,
      user_id: feedback.user_id,
      was_perceived: feedback.was_perceived,
      was_understood: feedback.was_understood,
      was_actionable: feedback.was_actionable,
      modality_used: feedback.modality_used,
      time_to_perceive_seconds: feedback.time_to_perceive_seconds,
      time_to_understand_seconds: feedback.time_to_understand_seconds,
      time_to_act_seconds: feedback.time_to_act_seconds,
      difficulties: feedback.difficulties,
      suggestions: feedback.suggestions
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to record feedback: ${error.message}`);
  return data;
}

/**
 * Get alert accessibility metrics
 */
export async function getAccessibilityMetrics(
  alertId: string
): Promise<{
  total_recipients: number;
  modalities_delivered: Record<AlertModality, number>;
  perception_rate: number;
  comprehension_rate: number;
  action_rate: number;
  avg_perception_time: number;
  avg_comprehension_time: number;
  avg_action_time: number;
}> {
  const { data: feedback } = await supabase
    .from('alert_feedback')
    .select('*')
    .eq('alert_id', alertId);
  
  if (!feedback || feedback.length === 0) {
    return {
      total_recipients: 0,
      modalities_delivered: {} as Record<AlertModality, number>,
      perception_rate: 0,
      comprehension_rate: 0,
      action_rate: 0,
      avg_perception_time: 0,
      avg_comprehension_time: 0,
      avg_action_time: 0
    };
  }
  
  const perceptionCount = feedback.filter(f => f.was_perceived).length;
  const comprehensionCount = feedback.filter(f => f.was_understood).length;
  const actionCount = feedback.filter(f => f.was_actionable).length;
  
  const avgPerception = feedback
    .filter(f => f.time_to_perceive_seconds)
    .reduce((sum, f) => sum + (f.time_to_perceive_seconds || 0), 0) /
    feedback.filter(f => f.time_to_perceive_seconds).length || 0;
  
  const avgComprehension = feedback
    .filter(f => f.time_to_understand_seconds)
    .reduce((sum, f) => sum + (f.time_to_understand_seconds || 0), 0) /
    feedback.filter(f => f.time_to_understand_seconds).length || 0;
  
  const avgAction = feedback
    .filter(f => f.time_to_act_seconds)
    .reduce((sum, f) => sum + (f.time_to_act_seconds || 0), 0) /
    feedback.filter(f => f.time_to_act_seconds).length || 0;
  
  // Count modalities
  const modalitiesDelivered: Record<string, number> = {};
  feedback.forEach(f => {
    if (f.modality_used) {
      modalitiesDelivered[f.modality_used] = (modalitiesDelivered[f.modality_used] || 0) + 1;
    }
  });
  
  return {
    total_recipients: feedback.length,
    modalities_delivered: modalitiesDelivered as Record<AlertModality, number>,
    perception_rate: perceptionCount / feedback.length,
    comprehension_rate: comprehensionCount / feedback.length,
    action_rate: actionCount / feedback.length,
    avg_perception_time: avgPerception,
    avg_comprehension_time: avgComprehension,
    avg_action_time: avgAction
  };
}

/**
 * Create accessible alert
 */
export async function createAccessibleAlert(
  alert: Omit<AccessibleAlert, 'id'>
): Promise<AccessibleAlert> {
  const { data, error } = await supabase
    .from('accessible_alerts')
    .insert({
      alert_id: alert.alert_id,
      title: alert.title,
      message: alert.message,
      priority: alert.priority,
      timestamp: alert.timestamp.toISOString(),
      modalities_delivered: alert.modalities_delivered,
      accessibility_mode: alert.accessibility_mode,
      translations: alert.translations,
      pictograms: alert.pictograms,
      video_resources: alert.video_resources
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create accessible alert: ${error.message}`);
  return data;
}

/**
 * Get accessibility settings for user
 */
export async function getAccessibilitySettings(
  userId: string
): Promise<AccessibilitySettings> {
  const { data, error } = await supabase
    .from('accessibility_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch settings: ${error.message}`);
  }
  
  if (data) {
    return {
      visual: {
        fontSize: data.visual_font_size || 'normal',
        highContrast: data.visual_high_contrast || false,
        colorBlindMode: data.visual_color_blind_mode || 'none',
        reduceMotion: data.visual_reduce_motion || false,
        screenReader: data.visual_screen_reader || false
      },
      hearing: {
        captions: data.hearing_captions || false,
        captionsSize: data.hearing_captions_size || 'normal',
        vibrationAlerts: data.hearing_vibration_alerts || false,
        flashingAlerts: data.hearing_flashing_alerts || false,
        hearingAidCompatible: data.hearing_aid_compatible || false
      },
      motor: {
        voiceControl: data.motor_voice_control || false,
        switchControl: data.motor_switch_control || false,
        touchSensitivity: data.motor_touch_sensitivity || 'normal',
        gestureControls: data.motor_gesture_controls || [],
        autoAnswer: data.motor_auto_answer || false
      },
      cognitive: {
        simpleLanguage: data.cognitive_simple_language || false,
        pictograms: data.cognitive_pictograms || false,
        stepByStepMode: data.cognitive_step_by_step || false,
        calmNotifications: data.cognitive_calm_notifications || false,
        predictableLayout: data.cognitive_predictable_layout || false
      }
    };
  }
  
  // Default settings
  return {
    visual: {
      fontSize: 'normal',
      highContrast: false,
      colorBlindMode: 'none',
      reduceMotion: false,
      screenReader: false
    },
    hearing: {
      captions: false,
      captionsSize: 'normal',
      vibrationAlerts: false,
      flashingAlerts: false,
      hearingAidCompatible: false
    },
    motor: {
      voiceControl: false,
      switchControl: false,
      touchSensitivity: 'normal',
      gestureControls: [],
      autoAnswer: false
    },
    cognitive: {
      simpleLanguage: false,
      pictograms: false,
      stepByStepMode: false,
      calmNotifications: false,
      predictableLayout: false
    }
  };
}

/**
 * Update accessibility settings
 */
export async function updateAccessibilitySettings(
  userId: string,
  settings: Partial<AccessibilitySettings>
): Promise<void> {
  const updateData: Record<string, unknown> = { user_id: userId };
  
  if (settings.visual) {
    updateData.visual_font_size = settings.visual.fontSize;
    updateData.visual_high_contrast = settings.visual.highContrast;
    updateData.visual_color_blind_mode = settings.visual.colorBlindMode;
    updateData.visual_reduce_motion = settings.visual.reduceMotion;
    updateData.visual_screen_reader = settings.visual.screenReader;
    if (settings.visual.customColors) {
      updateData.visual_custom_colors = settings.visual.customColors;
    }
  }
  
  if (settings.hearing) {
    updateData.hearing_captions = settings.hearing.captions;
    updateData.hearing_captions_size = settings.hearing.captionsSize;
    updateData.hearing_vibration_alerts = settings.hearing.vibrationAlerts;
    updateData.hearing_flashing_alerts = settings.hearing.flashingAlerts;
    updateData.hearing_aid_compatible = settings.hearing.hearingAidCompatible;
  }
  
  if (settings.motor) {
    updateData.motor_voice_control = settings.motor.voiceControl;
    updateData.motor_switch_control = settings.motor.switchControl;
    updateData.motor_touch_sensitivity = settings.motor.touchSensitivity;
    updateData.motor_gesture_controls = settings.motor.gestureControls;
    updateData.motor_auto_answer = settings.motor.autoAnswer;
  }
  
  if (settings.cognitive) {
    updateData.cognitive_simple_language = settings.cognitive.simpleLanguage;
    updateData.cognitive_pictograms = settings.cognitive.pictograms;
    updateData.cognitive_step_by_step = settings.cognitive.stepByStepMode;
    updateData.cognitive_calm_notifications = settings.cognitive.calmNotifications;
    updateData.cognitive_predictable_layout = settings.cognitive.predictableLayout;
  }
  
  const { error } = await supabase
    .from('accessibility_settings')
    .upsert(updateData);
  
  if (error) throw new Error(`Failed to update settings: ${error.message}`);
}

/**
 * Get users needing specific modality alerts
 */
export async function getUsersByAccessibilityNeed(
  modality: AlertModality
): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_alert_preferences')
    .select('user_id')
    .eq('modality', modality)
    .eq('is_enabled', true);
  
  if (error) throw new Error(`Failed to fetch users: ${error.message}`);
  
  return (data || []).map(d => d.user_id);
}

/**
 * Sync with paired assistive device
 */
export async function syncAssistiveDevice(
  deviceId: string,
  status: { battery_level?: number }
): Promise<void> {
  const { error } = await supabase
    .from('assistive_devices')
    .update({
      last_sync_at: new Date().toISOString(),
      battery_level: status.battery_level
    })
    .eq('id', deviceId);
  
  if (error) throw new Error(`Failed to sync device: ${error.message}`);
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getPriorityLabel(priority: AlertPriority): string {
  const labels: Record<AlertPriority, string> = {
    emergency: 'Emergency',
    warning: 'Warning',
    information: 'Information',
    test: 'Test'
  };
  return labels[priority];
}

export function getPriorityColor(priority: AlertPriority): string {
  const colors: Record<AlertPriority, string> = {
    emergency: '#ef4444',
    warning: '#f59e0b',
    information: '#3b82f6',
    test: '#6b7280'
  };
  return colors[priority];
}

export function getAccessibilityModeLabel(mode: AccessibilityMode): string {
  const labels: Record<AccessibilityMode, string> = {
    visual: 'Visual Assistance',
    hearing: 'Hearing Assistance',
    motor: 'Motor Assistance',
    cognitive: 'Cognitive Assistance',
    combined: 'Combined Assistance'
  };
  return labels[mode];
}

export function getFeatureCountByCategory(profile: AccessibilityProfile): Record<string, number> {
  return {
    visual: profile.visual_features.length,
    hearing: profile.hearing_features.length,
    motor: profile.motor_features.length,
    cognitive: profile.cognitive_features.length
  };
}
