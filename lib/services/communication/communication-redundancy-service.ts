/**
 * Emergency Communication Redundancy Service
 * 
 * Epic: Emergency Communication Redundancy
 * Description: Multi-path communication system ensuring emergency alerts reach users through cellular,
 * WiFi, SMS, push notifications, satellite, mesh networks, and radio when primary channels fail.
 * Provides automatic failover, delivery confirmation, and status monitoring across all channels.
 * 
 * Bmad Category: Critical Infrastructure Resilience (CIR)
 * Emergency Mode Relevance: BFSI, CPI, SAR, MAC, CEX - Essential for all emergency modes
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type CommunicationChannel = 
  | 'cellular'     // Cellular data (4G/5G)
  | 'wifi'          // WiFi network
  | 'sms'           // SMS text messages
  | 'push'          // Push notifications
  | 'email'         // Email
  | 'satellite'     // Satellite communication
  | 'mesh'          // Mesh network (Bluetooth/WiFi-Direct)
  | 'radio'         // Radio communication
  | 'webhook'       // External webhook
  | 'webhook_critical'  // Critical webhook
  | 'pager'         // Pager/police radio
  | 'landline'      // Landline phone
  | 'satellite_phone'; // Satellite phone

export type ChannelStatus = 
  | 'available'
  | 'degraded'
  | 'unavailable'
  | 'testing'
  | 'disabled';

export type MessageStatus = 
  | 'pending'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'acknowledged';

export type PriorityLevel = 
  | 'critical'      // Immediate life safety
  | 'high'          // Urgent emergency
  | 'normal'        // Standard alert
  | 'low';          // Informational

export type FailoverStrategy = 
  | 'sequential'    // Try channels one by one
  | 'parallel'      // Try all channels simultaneously
  | 'hybrid'        // Parallel critical, sequential others
  | 'smart';        // AI-optimized channel selection

export interface ChannelConfig {
  id: string;
  channel: CommunicationChannel;
  name: string;
  status: ChannelStatus;
  priority: number;
  max_retries: number;
  retry_delay_ms: number;
  timeout_ms: number;
  cost_per_message?: number;
  avg_latency_ms?: number;
  reliability_score?: number; // 0-1
  supported_message_types: string[];
  geographic_limitations?: string[];
  last_tested: Date;
  last_failure?: Date;
  failure_reason?: string;
}

export interface CommunicationPath {
  id: string;
  user_id: string;
  channel: CommunicationChannel;
  destination: string; // phone, email, device token, etc.
  is_primary: boolean;
  priority: number;
  is_verified: boolean;
  verification_date?: Date;
  last_used?: Date;
  last_success?: Date;
  failure_count: number;
  total_attempts: number;
  metadata?: Record<string, unknown>;
}

export interface MessagePayload {
  id: string;
  message_id: string;
  channel: CommunicationChannel;
  priority: PriorityLevel;
  content: string;
  title?: string;
  action_url?: string;
  media_urls?: string[];
  metadata?: Record<string, unknown>;
  created_at: Date;
  expires_at?: Date;
}

export interface MessageDelivery {
  id: string;
  message_id: string;
  channel: CommunicationChannel;
  destination: string;
  status: MessageStatus;
  attempts: number;
  first_attempt: Date;
  last_attempt: Date;
  delivered_at?: Date;
  acknowledged_at?: Date;
  failure_reason?: string;
  cost?: number;
  metadata?: Record<string, unknown>;
}

export interface MessageBatch {
  id: string;
  batch_id: string;
  message: MessagePayload;
  recipients: Array<{
    user_id: string;
    paths: string[]; // CommunicationPath IDs
  }>;
  strategy: FailoverStrategy;
  started_at: Date;
  completed_at?: Date;
  total_recipients: number;
  delivered_count: number;
  failed_count: number;
  pending_count: number;
  status: 'in_progress' | 'completed' | 'partial' | 'failed';
}

export interface NetworkStatus {
  id: string;
  timestamp: Date;
  cellular: {
    status: ChannelStatus;
    signal_strength: number; // 0-4 bars
    network_type: '5G' | '4G' | '3G' | '2G' | 'none';
    connected: boolean;
    roaming: boolean;
  };
  wifi: {
    status: ChannelStatus;
    ssid?: string;
    signal_strength: number; // 0-100%
    connected: boolean;
    security_type?: string;
  };
  satellite: {
    status: ChannelStatus;
    signal_strength: number;
    connected: boolean;
    provider?: string;
  };
  mesh: {
    status: ChannelStatus;
    node_count: number;
    connected: boolean;
    neighbors: number;
  };
}

export interface DeliveryReceipt {
  id: string;
  message_id: string;
  user_id: string;
  channel: CommunicationChannel;
  received_at: Date;
  acknowledged: boolean;
  action_taken?: string;
  location?: { lat: number; lng: number };
  device_info?: {
    os: string;
    app_version: string;
    device_model: string;
  };
}

export interface ChannelHealthMetrics {
  channel: CommunicationChannel;
  period: 'hour' | 'day' | 'week' | 'month';
  total_messages: number;
  delivered_count: number;
  failed_count: number;
  avg_latency_ms: number;
  success_rate: number;
  reliability_score: number;
  peak_usage_time?: Date;
  peak_usage_count: number;
}

export interface MeshNetworkNode {
  id: string;
  node_id: string;
  device_id: string;
  user_id?: string;
  location: { lat: number; lng: number };
  status: 'active' | 'idle' | 'sleep' | 'offline';
  capabilities: string[];
  battery_level?: number;
  signal_strength: number;
  last_heartbeat: Date;
  neighbors: string[];
  message_count: number;
  hop_count: number;
}

export interface SatelliteGateway {
  id: string;
  gateway_id: string;
  provider: string;
  location: { lat: number; lng: number };
  status: 'online' | 'offline' | 'maintenance';
  capacity: number;
  current_load: number;
  supported_services: string[];
  last_health_check: Date;
}

export interface EmergencyContactRelay {
  id: string;
  relay_id: string;
  user_id: string;
  contact_name: string;
  contact_phone: string;
  relationship: string;
  is_authorized: boolean;
  relay_preferences: {
    forward_emergency: boolean;
    forward_updates: boolean;
    require_acknowledgment: boolean;
    max_messages_per_day: number;
  };
  last_forwarded?: Date;
  forward_count: number;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const ChannelConfigSchema = z.object({
  id: z.string(),
  channel: z.enum([
    'cellular', 'wifi', 'sms', 'push', 'email',
    'satellite', 'mesh', 'radio', 'webhook', 'webhook_critical',
    'pager', 'landline', 'satellite_phone'
  ]),
  status: z.enum(['available', 'degraded', 'unavailable', 'testing', 'disabled']),
  priority: z.number(),
  max_retries: z.number()
});

const CommunicationPathSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  channel: z.enum([
    'cellular', 'wifi', 'sms', 'push', 'email',
    'satellite', 'mesh', 'radio', 'webhook', 'webhook_critical',
    'pager', 'landline', 'satellite_phone'
  ]),
  destination: z.string(),
  is_primary: z.boolean(),
  priority: z.number(),
  is_verified: z.boolean()
});

const MessagePayloadSchema = z.object({
  id: z.string(),
  message_id: z.string(),
  channel: z.enum([
    'cellular', 'wifi', 'sms', 'push', 'email',
    'satellite', 'mesh', 'radio', 'webhook', 'webhook_critical',
    'pager', 'landline', 'satellite_phone'
  ]),
  priority: z.enum(['critical', 'high', 'normal', 'low']),
  content: z.string(),
  title: z.string().optional()
});

const DeliveryReceiptSchema = z.object({
  id: z.string(),
  message_id: z.string(),
  user_id: z.string(),
  channel: z.enum([
    'cellular', 'wifi', 'sms', 'push', 'email',
    'satellite', 'mesh', 'radio', 'webhook', 'webhook_critical',
    'pager', 'landline', 'satellite_phone'
  ]),
  received_at: z.date(),
  acknowledged: z.boolean()
});

// ============================================================================
// Configuration
// ============================================================================

export const communicationConfig = {
  // Channel priority by emergency level
  channelPriorities: {
    critical: {
      primary: ['push', 'sms', 'satellite', 'webhook_critical', 'pager'],
      secondary: ['cellular', 'email', 'landline', 'satellite_phone'],
      fallback: ['mesh', 'radio']
    },
    high: {
      primary: ['push', 'sms', 'cellular'],
      secondary: ['email', 'webhook', 'landline'],
      fallback: ['satellite', 'mesh']
    },
    normal: {
      primary: ['push', 'email'],
      secondary: ['sms', 'cellular'],
      fallback: ['wifi']
    },
    low: {
      primary: ['push', 'email'],
      secondary: [],
      fallback: []
    }
  },
  
  // Failover configuration
  failover: {
    max_concurrent_channels: 3,
    channel_switch_delay_ms: 500,
    max_retry_attempts: {
      critical: 5,
      high: 3,
      normal: 2,
      low: 1
    },
    retry_delays_ms: {
      initial: 1000,
      subsequent: 5000,
      max: 30000
    },
    timeout_ms: {
      push: 5000,
      sms: 10000,
      email: 15000,
      cellular: 8000,
      satellite: 30000,
      mesh: 15000,
      webhook: 10000,
      webhook_critical: 5000
    }
  },
  
  // Channel reliability scores (0-1)
  reliabilityScores: {
    push: 0.95,
    sms: 0.92,
    cellular: 0.88,
    wifi: 0.85,
    email: 0.80,
    satellite: 0.75,
    mesh: 0.70,
    radio: 0.95,
    pager: 0.98,
    landline: 0.99,
    webhook: 0.90,
    webhook_critical: 0.95,
    satellite_phone: 0.85
  },
  
  // Message limits
  limits: {
    sms_per_user_per_hour: 50,
    push_per_user_per_hour: 100,
    email_per_user_per_hour: 20,
    webhook_per_minute: 1000,
    satellite_per_day: 100
  },
  
  // Latency expectations (ms)
  latencyExpectations: {
    push: 2000,
    sms: 5000,
    cellular: 3000,
    wifi: 2000,
    email: 30000,
    satellite: 60000,
    mesh: 10000,
    radio: 5000,
    webhook: 5000,
    webhook_critical: 2000
  },
  
  // Mesh network config
  meshNetwork: {
    enabled: true,
    max_hops: 5,
    broadcast_radius_m: 100,
    heartbeat_interval_s: 30,
    message_ttl_minutes: 30,
    battery_threshold_percent: 20,
    data_preserve_percent: 50
  },
  
  // Satellite config
  satellite: {
    providers: ['iridium', 'globalstar', 'oneweb', 'starlink'],
    emergency_priority: true,
    message_size_limit_bytes: 1600, // ~200 chars
    connection_timeout_ms: 60000
  },
  
  // Display configuration
  display: {
    channelIcons: {
      cellular: 'signal',
      wifi: 'wifi',
      sms: 'message-square',
      push: 'bell',
      email: 'mail',
      satellite: 'satellite',
      mesh: 'network',
      radio: 'radio',
      webhook: 'link',
      pager: 'pager',
      landline: 'phone',
      satellite_phone: 'phone'
    },
    channelColors: {
      cellular: '#22c55e',
      wifi: '#3b82f6',
      sms: '#f97316',
      push: '#8b5cf6',
      email: '#64748b',
      satellite: '#0ea5e9',
      mesh: '#06b6d4',
      radio: '#ef4444',
      webhook: '#22c55e',
      webhook_critical: '#dc2626',
      pager: '#f59e0b',
      landline: '#6b7280',
      satellite_phone: '#0ea5e9'
    },
    statusColors: {
      available: '#22c55e',
      degraded: '#f59e0b',
      unavailable: '#ef4444',
      testing: '#3b82f6',
      disabled: '#6b7280'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getChannelInfo(channel: CommunicationChannel) {
  const channelInfo: Record<CommunicationChannel, { 
    label: string; 
    icon: string; 
    description: string;
    maxLength?: number;
  }> = {
    cellular: { 
      label: 'Cellular Data', 
      icon: communicationConfig.display.channelIcons.cellular,
      description: 'Mobile data connection'
    },
    wifi: { 
      label: 'WiFi', 
      icon: communicationConfig.display.channelIcons.wifi,
      description: 'Wireless network'
    },
    sms: { 
      label: 'SMS', 
      icon: communicationConfig.display.channelIcons.sms,
      description: 'Text message',
      maxLength: 160
    },
    push: { 
      label: 'Push Notification', 
      icon: communicationConfig.display.channelIcons.push,
      description: 'App notification'
    },
    email: { 
      label: 'Email', 
      icon: communicationConfig.display.channelIcons.email,
      description: 'Email message'
    },
    satellite: { 
      label: 'Satellite', 
      icon: communicationConfig.display.channelIcons.satellite,
      description: 'Satellite network'
    },
    mesh: { 
      label: 'Mesh Network', 
      icon: communicationConfig.display.channelIcons.mesh,
      description: 'Local mesh network'
    },
    radio: { 
      label: 'Radio', 
      icon: communicationConfig.display.channelIcons.radio,
      description: 'Radio communication'
    },
    webhook: { 
      label: 'Webhook', 
      icon: communicationConfig.display.channelIcons.webhook,
      description: 'External webhook'
    },
    webhook_critical: { 
      label: 'Critical Webhook', 
      icon: communicationConfig.display.channelIcons.webhook_critical,
      description: 'Critical webhook alert'
    },
    pager: { 
      label: 'Pager', 
      icon: communicationConfig.display.channelIcons.pager,
      description: 'Pager notification'
    },
    landline: { 
      label: 'Landline', 
      icon: communicationConfig.display.channelIcons.landline,
      description: 'Phone call'
    },
    satellite_phone: { 
      label: 'Satellite Phone', 
      icon: communicationConfig.display.channelIcons.satellite_phone,
      description: 'Satellite phone call'
    }
  };
  
  return channelInfo[channel];
}

export function getChannelStatusInfo(status: ChannelStatus) {
  const statusInfo: Record<ChannelStatus, { label: string; color: string }> = {
    available: { label: 'Available', color: communicationConfig.display.statusColors.available },
    degraded: { label: 'Degraded', color: communicationConfig.display.statusColors.degraded },
    unavailable: { label: 'Unavailable', color: communicationConfig.display.statusColors.unavailable },
    testing: { label: 'Testing', color: communicationConfig.display.statusColors.testing },
    disabled: { label: 'Disabled', color: communicationConfig.display.statusColors.disabled }
  };
  
  return statusInfo[status];
}

export function getDeliveryStatusInfo(status: MessageStatus) {
  const statusInfo: Record<MessageStatus, { label: string; color: string; icon: string }> = {
    pending: { label: 'Pending', color: '#6b7280', icon: 'clock' },
    sending: { label: 'Sending', color: '#3b82f6', icon: 'loader' },
    sent: { label: 'Sent', color: '#22c55e', icon: 'check-circle' },
    delivered: { label: 'Delivered', color: '#22c55e', icon: 'check-circle-2' },
    failed: { label: 'Failed', color: '#ef4444', icon: 'x-circle' },
    acknowledged: { label: 'Acknowledged', color: '#10b981', icon: 'thumbs-up' }
  };
  
  return statusInfo[status];
}

export function getPriorityLevelInfo(priority: PriorityLevel) {
  const priorityInfo: Record<PriorityLevel, { label: string; color: string; urgency: number }> = {
    critical: { label: 'Critical', color: '#dc2626', urgency: 100 },
    high: { label: 'High', color: '#f97316', urgency: 75 },
    normal: { label: 'Normal', color: '#3b82f6', urgency: 50 },
    low: { label: 'Low', color: '#6b7280', urgency: 25 }
  };
  
  return priorityInfo[priority];
}

export function getChannelsForPriority(
  priority: PriorityLevel,
  strategy: FailoverStrategy = 'smart'
): CommunicationChannel[][] {
  const channels = communicationConfig.channelPriorities[priority];
  
  switch (strategy) {
    case 'sequential':
      return [channels.primary, channels.secondary, channels.fallback];
    case 'parallel':
      return [channels.primary];
    case 'hybrid':
      return [channels.primary, [...channels.secondary, ...channels.fallback]];
    case 'smart':
    default:
      return [channels.primary, channels.secondary, channels.fallback];
  }
}

export function calculateChannelScore(
  channel: CommunicationChannel,
  networkStatus: Partial<NetworkStatus>,
  pathHistory: CommunicationPath
): number {
  let score = communicationConfig.reliabilityScores[channel] || 0.5;
  
  // Apply network status modifiers
  if (channel === 'cellular' && networkStatus.cellular) {
    const signalBonus = (networkStatus.cellular.signal_strength / 4) * 0.1;
    score = score * (1 + signalBonus);
  }
  
  if (channel === 'wifi' && networkStatus.wifi) {
    const signalBonus = (networkStatus.wifi.signal_strength / 100) * 0.1;
    score = score * (1 + signalBonus);
  }
  
  // Apply historical success rate
  if (pathHistory.total_attempts > 0) {
    const successRate = (pathHistory.total_attempts - pathHistory.failure_count) / pathHistory.total_attempts;
    score = score * 0.7 + successRate * 0.3;
  }
  
  return Math.min(1, Math.max(0, score));
}

export function estimateDeliveryTime(
  channel: CommunicationChannel,
  messageLength: number
): number {
  const baseLatency = communicationConfig.latencyExpectations[channel] || 10000;
  
  // Add time for longer messages
  const channelMaxLength = getChannelInfo(channel).maxLength;
  if (channelMaxLength && messageLength > channelMaxLength) {
    const chunks = Math.ceil(messageLength / channelMaxLength);
    return baseLatency * chunks;
  }
  
  return baseLatency;
}

export function shouldUseChannel(
  channel: CommunicationChannel,
  priority: PriorityLevel,
  networkStatus: Partial<NetworkStatus>
): boolean {
  const channelInfo = getChannelInfo(channel);
  if (!channelInfo) return false;
  
  // Check if channel is available
  const status = getChannelStatusForNetwork(channel, networkStatus);
  if (status === 'unavailable' || status === 'disabled') {
    return false;
  }
  
  // Check geographic limitations
  if (channel === 'satellite' && networkStatus.cellular?.roaming === false) {
    // Might have satellite available during cellular outage
    return true;
  }
  
  return true;
}

function getChannelStatusForNetwork(
  channel: CommunicationChannel,
  networkStatus: Partial<NetworkStatus>
): ChannelStatus {
  switch (channel) {
    case 'cellular':
      return networkStatus.cellular?.connected ? 'available' : 'unavailable';
    case 'wifi':
      return networkStatus.wifi?.connected ? 'available' : 'unavailable';
    case 'satellite':
      return networkStatus.satellite?.connected ? 'available' : 'unavailable';
    case 'mesh':
      return networkStatus.mesh?.connected ? 'available' : 'unavailable';
    default:
      return 'available';
  }
}

export function formatMessageForChannel(
  content: string,
  channel: CommunicationChannel,
  maxLength?: number
): string {
  const channelMaxLength = maxLength || getChannelInfo(channel).maxLength;
  
  if (!channelMaxLength) {
    return content;
  }
  
  if (content.length <= channelMaxLength) {
    return content;
  }
  
  // Truncate with ellipsis
  return content.substring(0, channelMaxLength - 3) + '...';
}

export function calculateBatchProgress(batch: MessageBatch): {
  percentage: number;
  status: string;
} {
  const progress = ((batch.delivered_count + batch.failed_count) / batch.total_recipients) * 100;
  
  let status = 'In Progress';
  if (batch.status === 'completed') status = 'Complete';
  else if (batch.status === 'partial') status = 'Partial';
  else if (batch.status === 'failed') status = 'Failed';
  
  return { percentage: Math.round(progress), status };
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Get user's communication paths
 */
export async function getUserCommunicationPaths(
  userId: string
): Promise<CommunicationPath[]> {
  const { data, error } = await supabase
    .from('communication_paths')
    .select('*')
    .eq('user_id', userId)
    .eq('is_verified', true)
    .order('priority', { ascending: true });
  
  if (error) throw new Error(`Failed to fetch paths: ${error.message}`);
  return data || [];
}

/**
 * Add communication path
 */
export async function addCommunicationPath(
  path: Omit<CommunicationPath, 'id' | 'failure_count' | 'total_attempts'>
): Promise<CommunicationPath> {
  const { data, error } = await supabase
    .from('communication_paths')
    .insert({
      user_id: path.user_id,
      channel: path.channel,
      destination: path.destination,
      is_primary: path.is_primary,
      priority: path.priority,
      is_verified: false,
      metadata: path.metadata
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to add path: ${error.message}`);
  return data;
}

/**
 * Verify communication path
 */
export async function verifyCommunicationPath(
  pathId: string
): Promise<void> {
  const { error } = await supabase
    .from('communication_paths')
    .update({
      is_verified: true,
      verification_date: new Date().toISOString()
    })
    .eq('id', pathId);
  
  if (error) throw new Error(`Failed to verify path: ${error.message}`);
}

/**
 * Send message through channel
 */
export async function sendMessage(
  payload: Omit<MessagePayload, 'id' | 'created_at'>
): Promise<MessagePayload> {
  const { data, error } = await supabase
    .from('message_payloads')
    .insert({
      message_id: payload.message_id,
      channel: payload.channel,
      priority: payload.priority,
      content: payload.content,
      title: payload.title,
      action_url: payload.action_url,
      media_urls: payload.media_urls,
      metadata: payload.metadata,
      expires_at: payload.expires_at?.toISOString()
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to send message: ${error.message}`);
  return data;
}

/**
 * Record message delivery
 */
export async function recordDelivery(
  delivery: Omit<MessageDelivery, 'id'>
): Promise<MessageDelivery> {
  const { data, error } = await supabase
    .from('message_deliveries')
    .insert({
      message_id: delivery.message_id,
      channel: delivery.channel,
      destination: delivery.destination,
      status: delivery.status,
      attempts: delivery.attempts,
      first_attempt: delivery.first_attempt.toISOString(),
      last_attempt: delivery.last_attempt.toISOString(),
      delivered_at: delivery.delivered_at?.toISOString(),
      acknowledged_at: delivery.acknowledged_at?.toISOString(),
      failure_reason: delivery.failure_reason,
      cost: delivery.cost,
      metadata: delivery.metadata
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to record delivery: ${error.message}`);
  return data;
}

/**
 * Update delivery status
 */
export async function updateDeliveryStatus(
  deliveryId: string,
  status: MessageStatus,
  updates?: Partial<MessageDelivery>
): Promise<void> {
  const updateData: Record<string, unknown> = { status };
  
  if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString();
  }
  if (status === 'acknowledged') {
    updateData.acknowledged_at = new Date().toISOString();
  }
  if (updates) {
    Object.assign(updateData, updates);
  }
  
  const { error } = await supabase
    .from('message_deliveries')
    .update(updateData)
    .eq('id', deliveryId);
  
  if (error) throw new Error(`Failed to update delivery: ${error.message}`);
}

/**
 * Record delivery receipt
 */
export async function recordDeliveryReceipt(
  receipt: Omit<DeliveryReceipt, 'id' | 'received_at'>
): Promise<void> {
  const { error } = await supabase
    .from('delivery_receipts')
    .insert({
      message_id: receipt.message_id,
      user_id: receipt.user_id,
      channel: receipt.channel,
      acknowledged: receipt.acknowledged,
      action_taken: receipt.action_taken,
      location: receipt.location,
      device_info: receipt.device_info
    });
  
  if (error) throw new Error(`Failed to record receipt: ${error.message}`);
}

/**
 * Create message batch
 */
export async function createMessageBatch(
  batch: Omit<MessageBatch, 'id' | 'started_at' | 'delivered_count' | 'failed_count' | 'pending_count' | 'status'>
): Promise<MessageBatch> {
  const { data, error } = await supabase
    .from('message_batches')
    .insert({
      batch_id: batch.batch_id,
      message: batch.message,
      recipients: batch.recipients,
      strategy: batch.strategy,
      total_recipients: batch.total_recipients,
      pending_count: batch.total_recipients
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create batch: ${error.message}`);
  return data;
}

/**
 * Update batch progress
 */
export async function updateBatchProgress(
  batchId: string,
  deliveredCount: number,
  failedCount: number
): Promise<void> {
  const pendingCount = await supabase
    .from('message_batches')
    .select('total_recipients')
    .eq('id', batchId)
    .single()
    .then(res => res.data?.total_recipients - deliveredCount - failedCount);
  
  const { error } = await supabase
    .from('message_batches')
    .update({
      delivered_count: deliveredCount,
      failed_count: failedCount,
      pending_count: pendingCount,
      status: pendingCount === 0 ? 'completed' : 'in_progress'
    })
    .eq('id', batchId);
  
  if (error) throw new Error(`Failed to update batch: ${error.message}`);
}

/**
 * Get channel configuration
 */
export async function getChannelConfig(
  channel?: CommunicationChannel
): Promise<ChannelConfig[]> {
  let query = supabase
    .from('channel_configs')
    .select('*');
  
  if (channel) {
    query = query.eq('channel', channel);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch channel config: ${error.message}`);
  return data || [];
}

/**
 * Update channel status
 */
export async function updateChannelStatus(
  channel: CommunicationChannel,
  status: ChannelStatus,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('channel_configs')
    .update({
      status,
      last_tested: new Date().toISOString(),
      failure_reason: reason
    })
    .eq('channel', channel);
  
  if (error) throw new Error(`Failed to update channel: ${error.message}`);
}

/**
 * Record network status
 */
export async function recordNetworkStatus(
  status: Omit<NetworkStatus, 'id' | 'timestamp'>
): Promise<NetworkStatus> {
  const { data, error } = await supabase
    .from('network_status')
    .insert({
      cellular: status.cellular,
      wifi: status.wifi,
      satellite: status.satellite,
      mesh: status.mesh
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to record status: ${error.message}`);
  return data;
}

/**
 * Get current network status
 */
export async function getCurrentNetworkStatus(): Promise<Partial<NetworkStatus>> {
  const { data, error } = await supabase
    .from('network_status')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch status: ${error.message}`);
  }
  
  return data || {};
}

/**
 * Get channel health metrics
 */
export async function getChannelHealthMetrics(
  channel: CommunicationChannel,
  period: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<ChannelHealthMetrics> {
  const since = new Date();
  switch (period) {
    case 'hour': since.setHours(since.getHours() - 1); break;
    case 'day': since.setDate(since.getDate() - 1); break;
    case 'week': since.setDate(since.getDate() - 7); break;
    case 'month': since.setDate(since.getDate() - 30); break;
  }
  
  const { data, error } = await supabase
    .from('message_deliveries')
    .select('status, last_attempt, attempts')
    .eq('channel', channel)
    .gte('last_attempt', since.toISOString());
  
  if (error) throw new Error(`Failed to fetch metrics: ${error.message}`);
  
  const deliveries = data || [];
  const delivered = deliveries.filter(d => d.status === 'delivered' || d.status === 'acknowledged').length;
  const failed = deliveries.filter(d => d.status === 'failed').length;
  
  return {
    channel,
    period,
    total_messages: deliveries.length,
    delivered_count: delivered,
    failed_count: failed,
    avg_latency_ms: communicationConfig.latencyExpectations[channel] || 5000,
    success_rate: deliveries.length > 0 ? delivered / deliveries.length : 0,
    reliability_score: communicationConfig.reliabilityScores[channel] || 0.5,
    peak_usage_count: Math.ceil(deliveries.length / (period === 'hour' ? 1 : period === 'day' ? 24 : period === 'week' ? 168 : 720))
  };
}

/**
 * Register mesh node
 */
export async function registerMeshNode(
  node: Omit<MeshNetworkNode, 'id'>
): Promise<MeshNetworkNode> {
  const { data, error } = await supabase
    .from('mesh_nodes')
    .insert({
      node_id: node.node_id,
      device_id: node.device_id,
      user_id: node.user_id,
      location: node.location,
      status: node.status,
      capabilities: node.capabilities,
      battery_level: node.battery_level,
      signal_strength: node.signal_strength,
      neighbors: node.neighbors,
      message_count: node.message_count,
      hop_count: node.hop_count
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to register node: ${error.message}`);
  return data;
}

/**
 * Update mesh node heartbeat
 */
export async function updateMeshHeartbeat(
  nodeId: string,
  status: MeshNetworkNode['status'],
  neighbors: string[],
  batteryLevel?: number
): Promise<void> {
  const { error } = await supabase
    .from('mesh_nodes')
    .update({
      status,
      neighbors,
      battery_level: batteryLevel,
      last_heartbeat: new Date().toISOString()
    })
    .eq('node_id', nodeId);
  
  if (error) throw new Error(`Failed to update heartbeat: ${error.message}`);
}

/**
 * Get mesh neighbors
 */
export async function getMeshNeighbors(
  nodeId: string,
  maxDistanceM: number = 100
): Promise<MeshNetworkNode[]> {
  const { data: currentNode } = await supabase
    .from('mesh_nodes')
    .select('location')
    .eq('node_id', nodeId)
    .single();
  
  if (!currentNode) return [];
  
  const { data, error } = await supabase
    .from('mesh_nodes')
    .select('*')
    .eq('status', 'active')
    .neq('node_id', nodeId);
  
  if (error) throw new Error(`Failed to fetch neighbors: ${error.message}`);
  
  // Filter by distance
  return (data || []).filter(node => {
    const distance = calculateDistance(currentNode.location, node.location);
    return distance <= maxDistanceM;
  });
}

/**
 * Send via mesh network
 */
export async function sendMeshMessage(
  fromNodeId: string,
  toNodeIds: string[],
  message: {
    id: string;
    type: 'emergency' | 'relay' | 'status';
    content: string;
    priority: PriorityLevel;
  },
  ttlMinutes: number = 30
): Promise<number> {
  // Record message
  const { data: messageRecord, error: msgError } = await supabase
    .from('mesh_messages')
    .insert({
      message_id: message.id,
      from_node: fromNodeId,
      to_nodes: toNodeIds,
      type: message.type,
      content: message.content,
      priority: message.priority,
      ttl_minutes: ttlMinutes,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (msgError) throw new Error(`Failed to record message: ${msgError.message}`);
  
  // Update sender stats
  await supabase
    .from('mesh_nodes')
    .update({
      message_count: supabase.rpc('increment', { column: 'message_count', node_id: fromNodeId })
    })
    .eq('node_id', fromNodeId);
  
  return toNodeIds.length;
}

/**
 * Add emergency contact relay
 */
export async function addEmergencyContactRelay(
  relay: Omit<EmergencyContactRelay, 'id' | 'relay_id' | 'forward_count'>
): Promise<EmergencyContactRelay> {
  const { data, error } = await supabase
    .from('emergency_contact_relays')
    .insert({
      user_id: relay.user_id,
      contact_name: relay.contact_name,
      contact_phone: relay.contact_phone,
      relationship: relay.relationship,
      is_authorized: relay.is_authorized,
      relay_preferences: relay.relay_preferences
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to add relay: ${error.message}`);
  return data;
}

/**
 * Forward message to relay contacts
 */
export async function forwardToRelays(
  messageId: string,
  userId: string,
  messageContent: string
): Promise<number> {
  const { data: relays, error } = await supabase
    .from('emergency_contact_relays')
    .select('*')
    .eq('user_id', userId)
    .eq('is_authorized', true)
    .eq('relay_preferences->forward_emergency', true);
  
  if (error) throw new Error(`Failed to fetch relays: ${error.message}`);
  
  let forwardedCount = 0;
  
  for (const relay of relays || []) {
    // Check message limit
    if (relay.forward_count >= relay.relay_preferences.max_messages_per_day) continue;
    
    // Send message (implementation depends on SMS service)
    await sendMessage({
      message_id: `${messageId}-relay-${relay.id}`,
      channel: 'sms',
      priority: 'critical',
      content: `URGENT from NeighborPulse: ${messageContent}`
    });
    
    // Update relay stats
    await supabase
      .from('emergency_contact_relays')
      .update({
        last_forwarded: new Date().toISOString(),
        forward_count: relay.forward_count + 1
      })
      .eq('id', relay.id);
    
    forwardedCount++;
  }
  
  return forwardedCount;
}

/**
 * Test channel connectivity
 */
export async function testChannel(
  channel: CommunicationChannel,
  destination: string
): Promise<{
  success: boolean;
  latency_ms?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Simulate channel test (actual implementation would test real connectivity)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const latency = Date.now() - startTime;
    
    // Update channel status
    await updateChannelStatus(channel, 'available');
    
    return { success: true, latency_ms: latency };
  } catch (error) {
    await updateChannelStatus(channel, 'degraded', error instanceof Error ? error.message : 'Unknown error');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get delivery analytics
 */
export async function getDeliveryAnalytics(
  messageId: string
): Promise<{
  totalChannels: number;
  delivered: number;
  failed: number;
  pending: number;
  avgDeliveryTime: number;
  channels: Array<{
    channel: CommunicationChannel;
    status: MessageStatus;
    deliveryTime?: number;
  }>;
}> {
  const { data, error } = await supabase
    .from('message_deliveries')
    .select('*')
    .eq('message_id', messageId);
  
  if (error) throw new Error(`Failed to fetch analytics: ${error.message}`);
  
  const deliveries = data || [];
  const delivered = deliveries.filter(d => d.status === 'delivered' || d.status === 'acknowledged');
  
  return {
    totalChannels: deliveries.length,
    delivered: delivered.length,
    failed: deliveries.filter(d => d.status === 'failed').length,
    pending: deliveries.filter(d => d.status === 'pending' || d.status === 'sending').length,
    avgDeliveryTime: delivered.length > 0
      ? delivered.reduce((sum, d) => {
          const deliveryTime = d.delivered_at 
            ? new Date(d.delivered_at).getTime() - new Date(d.first_attempt).getTime()
            : 0;
          return sum + deliveryTime;
        }, 0) / delivered.length
      : 0,
    channels: deliveries.map(d => ({
      channel: d.channel,
      status: d.status,
      deliveryTime: d.delivered_at
        ? new Date(d.delivered_at).getTime() - new Date(d.first_attempt).getTime()
        : undefined
    }))
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatReliability(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

export function getOptimalChannels(
  priority: PriorityLevel,
  networkStatus: Partial<NetworkStatus>,
  availablePaths: CommunicationPath[]
): Array<{ channel: CommunicationChannel; score: number }> {
  const channels = getChannelsForPriority(priority)[0] || [];
  
  return channels
    .map(channel => {
      const path = availablePaths.find(p => p.channel === channel);
      const score = calculateChannelScore(
        channel,
        networkStatus,
        path || { failure_count: 0, total_attempts: 0 }
      );
      return { channel, score };
    })
    .sort((a, b) => b.score - a.score);
}

function calculateDistance(
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lng - loc1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.lat)) *
      Math.cos(toRad(loc2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function shouldEscalateChannel(
  currentAttempts: number,
  priority: PriorityLevel
): boolean {
  const maxAttempts = communicationConfig.failover.max_retry_attempts[priority];
  return currentAttempts < maxAttempts;
}
