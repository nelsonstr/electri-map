/**
 * Universal Emergency Alert Gateway Service
 * 
 * Epic: Universal Emergency Alert Gateway
 * Description: Integration gateway for all emergency alert sources including national emergency
 * alert systems (PEPP, EAS, WEA), public warning systems, IoT sensors, social media monitoring,
 * and custom alert integrations with standardized output formats.
 * 
 * Bmad Category: Integrated Alerting Architecture (IAA)
 * Emergency Mode Relevance: BFSI, CPI, SAR, MAC - Essential for comprehensive alert aggregation
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type AlertSource = 
  | 'pepp'        // PT Civil Protection
  | 'eas'         // Emergency Alert System (US)
  | 'wea'         // Wireless Emergency Alerts
  | 'cap'         // Common Alerting Protocol
  | 'iot_sensor'  // IoT device alerts
  | 'social'      // Social media monitoring
  | 'weather_api' // Weather service alerts
  | 'seismic'     // Seismic monitoring
  | 'flood'       // Flood monitoring systems
  | 'fire'        // Fire detection systems
  | 'custom'      // Custom integrations
  | 'internal';   // Internal system alerts

export type AlertSeverity = 
  | 'extreme'     // Immediate threat to life
  | 'severe'      // Significant threat
  | 'moderate'    // Possible threat
  | 'minor'       // Minimal threat
  | 'info';       // Informational

export type AlertCategory = 
  | 'met'         // Meteorological
  | 'geo'         // Geophysical
  | 'safety'      // General emergency
  | 'security'    // Security/terrorism
  | 'rescue'      // Rescue/medical
  | 'fire'        // Fire
  | 'health'      // Public health
  | 'transport'   // Transportation
  | 'infra'       // Infrastructure
  | 'environment' // Environmental
  | 'cbrne'       // Chemical, Biological, Radiological, Nuclear, Explosive
  | 'other';

export type AlertStatus = 
  | 'actual'      // Real event
  | 'exercise'     // Test/exercise
  | 'system'      // System test
  | 'test';       // Test alert

export type AlertScope = 
  | 'public'      // General public
  | 'restricted'  // Limited audience
  | 'private';    // Specific recipients

export type IntegrationStatus = 
  | 'active'
  | 'inactive'
  | 'error'
  | 'maintenance'
  | 'pending';

export type TransformStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface Alert {
  id: string;
  alert_id: string;
  source: AlertSource;
  source_id?: string;
  external_id?: string;
  status: AlertStatus;
  message_type: 'alert' | 'update' | 'cancel' | 'ack' | 'error';
  category: AlertCategory;
  severity: AlertSeverity;
  urgency: 'immediate' | 'expected' | 'future' | 'past' | 'unknown';
  certainty: 'observed' | 'likely' | 'possible' | 'unlikely' | 'unknown';
  scope: AlertScope;
  
  // Content
  headline: string;
  event: string;
  description?: string;
  instruction?: string;
  web?: string;
  contact?: string;
  
  // Location
  areas: Array<{
    area_desc: string;
    polygon?: string;
    circle?: { center: { lat: number; lng: number }; radius: number };
    geocode?: Record<string, string>;
  }>;
  
  // Timing
  sent: Date;
  effective?: Date;
  expires?: Date;
  expires_at?: Date;
  
  // Source info
  source_name?: string;
  sender?: string;
  
  // References
  references?: Array<{
    source: AlertSource;
    alert_id: string;
    sent: Date;
  }>;
  
  // Metadata
  language?: string;
  custom_fields?: Record<string, unknown>;
  processed_at?: Date;
  transformation_status?: TransformStatus;
  
  // Distribution
  distributed: boolean;
  distributed_at?: Date;
  recipients?: number;
}

export interface AlertFilter {
  source?: AlertSource[];
  category?: AlertCategory[];
  severity?: AlertSeverity[];
  area?: { lat: number; lng: number; radiusKm: number };
  active_only?: boolean;
  from_date?: Date;
  to_date?: Date;
  limit?: number;
  offset?: number;
}

export interface Integration {
  id: string;
  integration_id: string;
  name: string;
  type: AlertSource;
  status: IntegrationStatus;
  configuration: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  last_activity?: Date;
  error_message?: string;
  metrics: {
    alerts_received: number;
    alerts_processed: number;
    alerts_failed: number;
    avg_processing_time_ms: number;
    uptime_percent: number;
  };
}

export interface AlertTransform {
  id: string;
  transform_id: string;
  source: AlertSource;
  target_format: 'cap' | 'internal' | 'custom';
  version: string;
  rules: Array<{
    id: string;
    name: string;
    condition: string;
    transformation: string;
    priority: number;
    enabled: boolean;
  }>;
  created_at: Date;
  updated_at: Date;
  status: 'active' | 'inactive';
}

export interface AlertRoutingRule {
  id: string;
  rule_id: string;
  name: string;
  priority: number;
  enabled: boolean;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'regex' | 'in' | 'range' | 'exists';
    value: unknown;
  }>;
  actions: Array<{
    type: 'forward' | 'transform' | 'enrich' | 'filter' | 'escalate' | 'notify';
    target?: string;
    parameters?: Record<string, unknown>;
  }>;
  created_at: Date;
  updated_at: Date;
  last_triggered?: Date;
  trigger_count: number;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const AlertSchema = z.object({
  id: z.string(),
  alert_id: z.string(),
  source: z.enum(['pepp', 'eas', 'wea', 'cap', 'iot_sensor', 'social', 'weather_api', 'seismic', 'flood', 'fire', 'custom', 'internal']),
  category: z.enum(['met', 'geo', 'safety', 'security', 'rescue', 'fire', 'health', 'transport', 'infra', 'environment', 'cbrne', 'other']),
  severity: z.enum(['extreme', 'severe', 'moderate', 'minor', 'info']),
  headline: z.string(),
  event: z.string()
});

const IntegrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['pepp', 'eas', 'wea', 'cap', 'iot_sensor', 'social', 'weather_api', 'seismic', 'flood', 'fire', 'custom', 'internal']),
  status: z.enum(['active', 'inactive', 'error', 'maintenance', 'pending'])
});

// ============================================================================
// Configuration
// ============================================================================

export const alertGatewayConfig = {
  // Alert processing
  processing: {
    max_queue_size: 10000,
    processing_timeout_ms: 5000,
    retry_count: 3,
    retry_delay_ms: 1000,
    parallel_processing: true,
    max_parallel: 10
  },
  
  // Alert routing
  routing: {
    default_severity: 'info',
    escalation_time_minutes: 15,
    max_escalation_depth: 3,
    notify_on_routing: true
  },
  
  // Source configurations
  sources: {
    pepp: {
      api_url: 'https://api.proteccaocivil.pt/alerts',
      poll_interval_seconds: 60,
      authentication: 'api_key',
      format: 'cap'
    },
    eas: {
      api_url: 'https://alerts.fema.gov/cap',
      poll_interval_seconds: 30,
      authentication: 'none',
      format: 'cap'
    },
    weather_api: {
      api_url: 'https://api.weather.gov/alerts',
      poll_interval_seconds: 300,
      authentication: 'api_key',
      format: 'cap'
    },
    seismic: {
      api_url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
      poll_interval_seconds: 60,
      authentication: 'none',
      format: 'custom'
    },
    iot_sensor: {
      protocol: 'mqtt',
      broker_url: 'mqtt://sensors.example.com',
      topic_prefix: 'alerts/',
      quality_of_service: 2
    }
  },
  
  // Transformation rules
  transformation: {
    enabled: true,
    cache_ttl_seconds: 3600,
    validation_strict_mode: true
  },
  
  // Display configuration
  display: {
    severityColors: {
      extreme: '#dc2626',
      severe: '#f97316',
      moderate: '#eab308',
      minor: '#3b82f6',
      info: '#6b7280'
    },
    categoryLabels: {
      met: 'Weather',
      geo: 'Geophysical',
      safety: 'Emergency',
      security: 'Security',
      rescue: 'Rescue',
      fire: 'Fire',
      health: 'Health',
      transport: 'Transportation',
      infra: 'Infrastructure',
      environment: 'Environment',
      cbrne: 'CBRNE',
      other: 'Other'
    },
    sourceIcons: {
      pepp: 'shield',
      eas: 'alert-triangle',
      wea: 'smartphone',
      cap: 'file-text',
      iot_sensor: 'cpu',
      social: 'message-circle',
      weather_api: 'cloud',
      seismic: 'activity',
      flood: 'waves',
      fire: 'flame',
      custom: 'plug',
      internal: 'database'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getSeverityInfo(severity: AlertSeverity) {
  return {
    label: severity.charAt(0).toUpperCase() + severity.slice(1),
    color: alertGatewayConfig.display.severityColors[severity],
    priority: {
      extreme: 100,
      severe: 80,
      moderate: 60,
      minor: 40,
      info: 20
    }[severity]
  };
}

export function getCategoryInfo(category: AlertCategory) {
  return {
    label: alertGatewayConfig.display.categoryLabels[category],
    icon: {
      met: 'cloud',
      geo: 'activity',
      safety: 'alert-circle',
      security: 'shield',
      rescue: 'heart-pulse',
      fire: 'flame',
      health: 'thermometer',
      transport: 'truck',
      infra: 'building',
      environment: 'leaf',
      cbrne: 'flask-conical',
      other: 'help-circle'
    }[category]
  };
}

export function getSourceInfo(source: AlertSource) {
  return {
    label: source.toUpperCase(),
    icon: alertGatewayConfig.display.sourceIcons[source]
  };
}

export function isAlertActive(alert: Alert): boolean {
  if (!alert.expires_at) return true;
  return new Date(alert.expires_at) > new Date();
}

export function calculateAlertPriority(alert: Alert): number {
  const severityPriority = {
    extreme: 100,
    severe: 80,
    moderate: 60,
    minor: 40,
    info: 20
  }[alert.severity];
  
  const urgencyMultiplier = {
    immediate: 1.5,
    expected: 1.2,
    future: 1.0,
    past: 0.5,
    unknown: 0.8
  }[alert.urgency];
  
  return Math.round(severityPriority * urgencyMultiplier);
}

export function formatAlertForDisplay(alert: Alert): string {
  const severity = getSeverityInfo(alert.severity);
  const category = getCategoryInfo(alert.category);
  
  return `[${severity.label}] ${alert.event} - ${alert.headline}`;
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Receive alert from source
 */
export async function receiveAlert(
  source: AlertSource,
  data: Record<string, unknown>
): Promise<Alert> {
  // Transform to internal format
  const transformed = await transformAlert(source, data);
  
  // Save to database
  const { data: alert, error } = await supabase
    .from('alerts')
    .insert({
      alert_id: `alert-${Date.now()}`,
      source,
      status: 'actual',
      message_type: 'alert',
      category: transformed.category,
      severity: transformed.severity,
      urgency: transformed.urgency,
      certainty: transformed.certainty || 'unknown',
      scope: transformed.scope || 'public',
      headline: transformed.headline,
      event: transformed.event,
      description: transformed.description,
      instruction: transformed.instruction,
      areas: transformed.areas,
      sent: new Date().toISOString(),
      expires_at: transformed.expires_at,
      source_name: transformed.source_name,
      distributed: false,
      transformation_status: 'completed',
      custom_fields: transformed.custom_fields
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to receive alert: ${error.message}`);
  
  // Update integration metrics
  await updateIntegrationMetrics(source, 'received');
  
  // Apply routing rules
  await applyRoutingRules(alert);
  
  return alert;
}

/**
 * Transform alert from source format
 */
async function transformAlert(
  source: AlertSource,
  data: Record<string, unknown>
): Promise<Partial<Alert>> {
  // In production, would use transformation rules
  return {
    category: data.category as AlertCategory || 'safety',
    severity: data.severity as AlertSeverity || 'info',
    urgency: 'immediate',
    headline: data.headline as string || data.event as string,
    event: data.event as string,
    description: data.description as string,
    instruction: data.instruction as string,
    areas: data.areas || [],
    expires_at: data.expires_at ? new Date(data.expires_at as string) : undefined,
    source_name: data.source_name as string,
    custom_fields: data
  };
}

/**
 * Apply routing rules
 */
async function applyRoutingRules(alert: Alert): Promise<void> {
  const { data: rules } = await supabase
    .from('alert_routing_rules')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: false });
  
  for (const rule of rules || []) {
    if (evaluateRule(rule, alert)) {
      await executeAction(rule.actions, alert);
      await supabase
        .from('alert_routing_rules')
        .update({
          last_triggered: new Date().toISOString(),
          trigger_count: rule.trigger_count + 1
        })
        .eq('id', rule.id);
    }
  }
}

/**
 * Evaluate routing rule
 */
function evaluateRule(
  rule: AlertRoutingRule,
  alert: Alert
): boolean {
  for (const condition of rule.conditions) {
    const value = (alert as Record<string, unknown>)[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        if (value !== condition.value) return false;
        break;
      case 'contains':
        if (!String(value).includes(condition.value as string)) return false;
        break;
      case 'regex':
        if (!new RegExp(condition.value as string).test(String(value))) return false;
        break;
      case 'in':
        if (!(condition.value as unknown[]).includes(value)) return false;
        break;
    }
  }
  return true;
}

/**
 * Execute routing action
 */
async function executeAction(
  actions: AlertRoutingRule['actions'],
  alert: Alert
): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case 'notify':
        // Would trigger notification
        break;
      case 'forward':
        // Would forward to target
        break;
      case 'escalate':
        // Would escalate alert
        break;
    }
  }
}

/**
 * Get alerts
 */
export async function getAlerts(
  filter?: AlertFilter
): Promise<Alert[]> {
  let query = supabase
    .from('alerts')
    .select('*')
    .order('sent', { ascending: false });
  
  if (filter?.source?.length) {
    query = query.in('source', filter.source);
  }
  if (filter?.category?.length) {
    query = query.in('category', filter.category);
  }
  if (filter?.severity?.length) {
    query = query.in('severity', filter.severity);
  }
  if (filter?.active_only) {
    query = query.gt('expires_at', new Date().toISOString());
  }
  if (filter?.from_date) {
    query = query.gte('sent', filter.from_date.toISOString());
  }
  if (filter?.to_date) {
    query = query.lte('sent', filter.to_date.toISOString());
  }
  if (filter?.limit) {
    query = query.limit(filter.limit);
  }
  
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch alerts: ${error.message}`);
  return data || [];
}

/**
 * Get active alerts
 */
export async function getActiveAlerts(
  area?: { lat: number; lng: number; radiusKm: number }
): Promise<Alert[]> {
  let query = supabase
    .from('alerts')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('severity', { ascending: false })
    .order('sent', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch alerts: ${error.message}`);
  
  // Filter by area if specified
  if (area) {
    return (data || []).filter(alert => {
      return alert.areas.some(a => {
        // Simplified area check
        return true;
      });
    });
  }
  
  return data || [];
}

/**
 * Get alert by ID
 */
export async function getAlert(alertId: string): Promise<Alert | null> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('id', alertId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch alert: ${error.message}`);
  }
  return data;
}

/**
 * Cancel alert
 */
export async function cancelAlert(
  alertId: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({
      message_type: 'cancel',
      distributed: false,
      custom_fields: { cancellation_reason: reason }
    })
    .eq('id', alertId);
  
  if (error) throw new Error(`Failed to cancel alert: ${error.message}`);
}

/**
 * Update alert
 */
export async function updateAlert(
  alertId: string,
  updates: Partial<Alert>
): Promise<Alert> {
  const { data, error } = await supabase
    .from('alerts')
    .update({
      ...updates,
      message_type: 'update',
      distributed: false
    })
    .eq('id', alertId)
    .select()
    .single();
  
  if (error) throw new Error(`Failed to update alert: ${error.message}`);
  return data;
}

/**
 * Distribute alert
 */
export async function distributeAlert(
  alertId: string
): Promise<{ recipients: number; channels: string[] }> {
  const { error } = await supabase
    .from('alerts')
    .update({
      distributed: true,
      distributed_at: new Date().toISOString(),
      recipients: 0 // Would calculate actual count
    })
    .eq('id', alertId);
  
  if (error) throw new Error(`Failed to distribute alert: ${error.message}`);
  
  return {
    recipients: 0,
    channels: []
  };
}