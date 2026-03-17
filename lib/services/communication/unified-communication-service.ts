/**
 * Unified Communication Platform Service
 * 
 * Epic: Unified Communication Platform
 * Description: Integrated voice, text, and video communication platform for emergency responders
 * with group channels, direct messaging, priority override, encryption, recording, transcription,
 * and integration with radio systems.
 * 
 * Bmad Category: Inter-Agency Coordination (IAC)
 * Emergency Mode Relevance: BFSI, CPI, SAR, MAC - Critical for multi-agency coordination
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type ChannelType = 
  | 'voice'
  | 'video'
  | 'text'
  | 'radio'
  | 'group'
  | 'emergency'
  | 'broadcast';

export type ChannelStatus = 
  | 'active'
  | 'inactive'
  | 'maintenance'
  | 'offline';

export type MessageType = 
  | 'text'
  | 'voice'
  | 'video'
  | 'image'
  | 'file'
  | 'location'
  | 'system'
  | 'emergency';

export type MessageStatus = 
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type CallStatus = 
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'on_hold'
  | 'ended'
  | 'failed';

export type ParticipantStatus = 
  | 'invited'
  | 'joining'
  | 'connected'
  | 'leave_requested'
  | 'left'
  | 'disconnected';

export type RadioChannel = 
  | 'fire_primary'
  | 'fire_tactical'
  | 'police_primary'
  | 'police_tactical'
  | 'ems_primary'
  | 'ems_tactical'
  | 'dispatch'
  | 'interop_1'
  | 'interop_2'
  | 'interop_3'
  | 'interop_4'
  | 'command'
  | 'air_to_ground';

export type RecordingType = 
  | 'voice_call'
  | 'video_call'
  | 'radio_transmission'
  | 'channel_recording'
  | 'conference';

export type TranscriptStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'redacted';

export interface Channel {
  id: string;
  channel_id: string;
  name: string;
  description?: string;
  type: ChannelType;
  status: ChannelStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  max_participants?: number;
  is_encrypted: boolean;
  priority_level: number;
  parent_channel_id?: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: Date;
  last_active?: Date;
  notifications_enabled: boolean;
  is_muted: boolean;
  permissions: string[];
}

export interface Message {
  id: string;
  message_id: string;
  channel_id: string;
  sender_id: string;
  type: MessageType;
  content: string;
  attachments?: Array<{
    id: string;
    type: 'image' | 'file' | 'audio' | 'video';
    url: string;
    name: string;
    size_bytes: number;
    mime_type: string;
  }>;
  location?: { lat: number; lng: number; address?: string };
  reply_to?: string;
  status: MessageStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
  sent_at: Date;
  delivered_at?: Date;
  read_at?: Date;
  edited_at?: Date;
  deleted_at?: Date;
  metadata?: Record<string, unknown>;
  transcription?: string;
}

export interface Conversation {
  id: string;
  conversation_id: string;
  participants: string[];
  type: 'direct' | 'group';
  subject?: string;
  created_by: string;
  created_at: Date;
  last_message_at?: Date;
  is_archived: boolean;
  is_pinned: boolean;
  unread_count: number;
  metadata?: Record<string, unknown>;
}

export interface Participant {
  id: string;
  participant_id: string;
  call_id: string;
  user_id: string;
  device_id: string;
  status: ParticipantStatus;
  joined_at?: Date;
  left_at?: Date;
  audio_enabled: boolean;
  video_enabled: boolean;
  screen_sharing: boolean;
  is_recording: boolean;
  connection_quality: number; // 0-1
  network_latency_ms?: number;
  jitter_ms?: number;
  packet_loss_percent?: number;
}

export interface Call {
  id: string;
  call_id: string;
  channel_id?: string;
  conversation_id?: string;
  type: 'voice' | 'video' | 'conference' | 'radio';
  status: CallStatus;
  initiated_by: string;
  started_at?: Date;
  ended_at?: Date;
  duration_seconds?: number;
  recording_enabled: boolean;
  recording_url?: string;
  transcription_status: TranscriptStatus;
  encryption_key_id?: string;
  metadata?: Record<string, unknown>;
}

export interface RadioTransmission {
  id: string;
  transmission_id: string;
  radio_channel: RadioChannel;
  unit_id: string;
  user_id: string;
  start_time: Date;
  end_time?: Date;
  duration_seconds?: number;
  recording_url?: string;
  transcription?: string;
  transcription_status: TranscriptStatus;
  gps_location?: { lat: number; lng: number };
  transmission_type: 'voice' | 'data' | 'alert' | 'status';
  content?: string;
  is_emergency: boolean;
  is_priority: boolean;
}

export interface Recording {
  id: string;
  recording_id: string;
  type: RecordingType;
  call_id?: string;
  channel_id?: string;
  radio_transmission_id?: string;
  start_time: Date;
  end_time?: Date;
  duration_seconds?: number;
  file_url: string;
  file_size_bytes: number;
  format: string;
  encryption_key_id?: string;
  retention_days: number;
  expires_at: Date;
  metadata?: Record<string, unknown>;
}

export interface Transcript {
  id: string;
  transcript_id: string;
  recording_id: string;
  language: string;
  status: TranscriptStatus;
  text: string;
  segments?: Array<{
    start_time: number;
    end_time: number;
    speaker_id?: string;
    text: string;
    confidence: number;
  }>;
  keywords?: string[];
  created_at: Date;
  completed_at?: Date;
  redacted_segments?: Array<{
    start_time: number;
    end_time: number;
    reason: string;
  }>;
}

export interface PushToTalk {
  id: string;
  ptt_id: string;
  user_id: string;
  device_id: string;
  channel_id?: string;
  radio_channel?: RadioChannel;
  is_active: boolean;
  started_at?: Date;
  duration_seconds?: number;
  status: 'idle' | 'connecting' | 'transmitting' | 'error';
}

export interface Contact {
  id: string;
  contact_id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  extension?: string;
  radio_id?: string;
  organization?: string;
  role?: string;
  availability_status: 'available' | 'busy' | 'away' | 'offline';
  last_seen?: Date;
  priority: number;
  is_emergency_contact: boolean;
  notes?: string;
}

export interface NotificationPreferences {
  user_id: string;
  channel_id?: string;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  desktop_notifications: boolean;
  mobile_notifications: boolean;
  do_not_disturb: boolean;
  do_not_disturb_hours?: { start: number; end: number };
  priority_override: boolean;
  emergency_alerts_only: boolean;
}

export interface EncryptionKey {
  id: string;
  key_id: string;
  channel_id?: string;
  user_id?: string;
  public_key: string;
  algorithm: 'AES-256-GCM' | 'RSA-OAEP';
  created_at: Date;
  expires_at: Date;
  is_active: boolean;
}

export interface CallQuality {
  call_id: string;
  participant_id: string;
  timestamp: Date;
  bandwidth_kbps: number;
  latency_ms: number;
  jitter_ms: number;
  packet_loss_percent: number;
  audio_quality: number; // 0-5 MOS
  video_quality: number; // 0-5 MOS
  connection_type: 'wifi' | 'cellular' | 'ethernet' | 'radio';
  signal_strength?: number;
}

export interface ChannelActivity {
  channel_id: string;
  timestamp: Date;
  active_participants: number;
  messages_in_last_hour: number;
  calls_in_last_hour: number;
  avg_response_time_ms: number;
  system_load_percent: number;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const ChannelSchema = z.object({
  id: z.string(),
  channel_id: z.string(),
  name: z.string(),
  type: z.enum(['voice', 'video', 'text', 'radio', 'group', 'emergency', 'broadcast']),
  status: z.enum(['active', 'inactive', 'maintenance', 'offline'])
});

const MessageSchema = z.object({
  id: z.string(),
  message_id: z.string(),
  channel_id: z.string(),
  type: z.enum(['text', 'voice', 'video', 'image', 'file', 'location', 'system', 'emergency']),
  content: z.string(),
  status: z.enum(['sending', 'sent', 'delivered', 'read', 'failed'])
});

const CallSchema = z.object({
  id: z.string(),
  call_id: z.string(),
  type: z.enum(['voice', 'video', 'conference', 'radio']),
  status: z.enum(['ringing', 'connecting', 'connected', 'on_hold', 'ended', 'failed'])
});

// ============================================================================
// Configuration
// ============================================================================

export const communicationConfig = {
  // Channel settings
  channels: {
    max_participants_default: 50,
    max_participants_emergency: 100,
    max_message_length: 10000,
    max_attachment_size_mb: 100,
    retention_days_default: 90,
    retention_days_emergency: 365
  },
  
  // Call settings
  calls: {
    max_duration_hours: 4,
    max_participants_video: 10,
    max_participants_voice: 50,
    ring_timeout_seconds: 30,
    reconnect_attempts: 3,
    reconnect_delay_seconds: 5
  },
  
  // Recording settings
  recording: {
    enabled: true,
    format: 'webm',
    audio_bitrate_kbps: 128,
    video_bitrate_mbps: 2,
    retention_days: 90,
    retention_days_emergency: 365
  },
  
  // Transcription settings
  transcription: {
    enabled: true,
    languages: ['en', 'pt', 'es', 'fr', 'de'],
    speaker_detection: true,
    word_timestamps: true,
    real_time: true,
    profanity_filter: true,
    custom_vocabulary: ['emergency', 'incident', 'dispatch', 'units']
  },
  
  // Radio settings
  radio: {
    channels: ['fire_primary', 'fire_tactical', 'police_primary', 'police_tactical', 'ems_primary', 'dispatch'],
    tx_delay_ms: 100,
    hang_time_ms: 200,
    emergency_reset_time_seconds: 30,
    ptt_idle_timeout_seconds: 60
  },
  
  // Encryption settings
  encryption: {
    algorithm: 'AES-256-GCM',
    key_rotation_days: 30,
    end_to_end: true
  },
  
  // Priority settings
  priority: {
    levels: {
      emergency: { level: 100, color: '#dc2626', sound: 'emergency' },
      urgent: { level: 80, color: '#f97316', sound: 'urgent' },
      high: { level: 60, color: '#eab308', sound: 'high' },
      normal: { level: 40, color: '#22c55e', sound: 'normal' },
      low: { level: 20, color: '#6b7280', sound: 'low' }
    },
    interrupt_enabled: true,
    interrupt_max_depth: 3
  },
  
  // Display configuration
  display: {
    channelIcons: {
      voice: 'mic',
      video: 'video',
      text: 'message-square',
      radio: 'radio',
      group: 'users',
      emergency: 'alert-circle',
      broadcast: 'broadcast'
    },
    statusColors: {
      active: '#22c55e',
      inactive: '#6b7280',
      maintenance: '#f59e0b',
      offline: '#ef4444'
    },
    messageTypeIcons: {
      text: 'type',
      voice: 'mic',
      video: 'video',
      image: 'image',
      file: 'file',
      location: 'map-pin',
      system: 'info',
      emergency: 'alert-triangle'
    },
    callStatusIcons: {
      ringing: 'phone-call',
      connecting: 'loader',
      connected: 'phone',
      on_hold: 'pause',
      ended: 'phone-off',
      failed: 'alert-circle'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getChannelTypeInfo(type: ChannelType) {
  return {
    label: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
    icon: communicationConfig.display.channelIcons[type],
    maxParticipants: type === 'emergency' 
      ? communicationConfig.channels.max_participants_emergency 
      : communicationConfig.channels.max_participants_default
  };
}

export function getMessageStatusInfo(status: MessageStatus) {
  const icons = {
    sending: 'loader',
    sent: 'check',
    delivered: 'check-circle',
    read: 'eye',
    failed: 'alert-circle'
  };
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    icon: icons[status],
    color: status === 'failed' ? '#ef4444' : '#22c55e'
  };
}

export function getCallStatusInfo(status: CallStatus) {
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
    icon: communicationConfig.display.callStatusIcons[status],
    color: {
      ringing: '#22c55e',
      connecting: '#f59e0b',
      connected: '#22c55e',
      on_hold: '#6b7280',
      ended: '#6b7280',
      failed: '#ef4444'
    }[status]
  };
}

export function getPriorityInfo(priority: Message['priority']) {
  const level = communicationConfig.priority.levels[priority];
  return {
    ...level,
    label: priority.charAt(0).toUpperCase() + priority.slice(1)
  };
}

export function getRadioChannelInfo(channel: RadioChannel) {
  const channels: Record<RadioChannel, { label: string; frequency?: string; color: string }> = {
    fire_primary: { label: 'Fire Primary', frequency: '154.280', color: '#ef4444' },
    fire_tactical: { label: 'Fire Tactical', frequency: '154.295', color: '#f97316' },
    police_primary: { label: 'Police Primary', frequency: '155.475', color: '#3b82f6' },
    police_tactical: { label: 'Police Tactical', frequency: '155.490', color: '#8b5cf6' },
    ems_primary: { label: 'EMS Primary', frequency: '155.340', color: '#22c55e' },
    ems_tactical: { label: 'EMS Tactical', frequency: '155.355', color: '#10b981' },
    dispatch: { label: 'Dispatch', frequency: '155.400', color: '#6b7280' },
    interop_1: { label: 'Interop 1', frequency: '151.1375', color: '#0891b2' },
    interop_2: { label: 'Interop 2', frequency: '151.1675', color: '#0d9488' },
    interop_3: { label: 'Interop 3', frequency: '151.1975', color: '#14b8a6' },
    interop_4: { label: 'Interop 4', frequency: '153.695', color: '#5eead4' },
    command: { label: 'Command', frequency: '155.640', color: '#dc2626' },
    air_to_ground: { label: 'Air-to-Ground', frequency: '167.925', color: '#fcd34d' }
  };
  return channels[channel];
}

export function formatCallDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function calculateCallQuality(cq: CallQuality): { score: number; rating: string } {
  // Simple quality score calculation
  const audioWeight = 0.4;
  const videoWeight = 0.3;
  const latencyWeight = 0.2;
  const packetLossWeight = 0.1;
  
  let score = 0;
  score += (cq.audio_quality / 5) * audioWeight * 100;
  score += (cq.video_quality / 5) * videoWeight * 100;
  
  // Latency penalty
  if (cq.latency_ms < 150) score += latencyWeight * 100;
  else if (cq.latency_ms < 300) score += latencyWeight * 70;
  else score += latencyWeight * 30;
  
  // Packet loss penalty
  if (cq.packet_loss_percent < 1) score += packetLossWeight * 100;
  else if (cq.packet_loss_percent < 3) score += packetLossWeight * 70;
  else score += packetLossWeight * 30;
  
  let rating = 'Poor';
  if (score >= 90) rating = 'Excellent';
  else if (score >= 75) rating = 'Good';
  else if (score >= 60) rating = 'Fair';
  else if (score >= 40) rating = 'Poor';
  
  return { score: Math.round(score), rating };
}

export function shouldInterruptCall(priority: number): boolean {
  return priority >= 80 && communicationConfig.priority.interrupt_enabled;
}

export function getEncryptionLevel(channelType: ChannelType): boolean {
  return ['emergency', 'broadcast', 'radio'].includes(channelType);
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Create channel
 */
export async function createChannel(
  channel: Omit<Channel, 'id' | 'channel_id' | 'created_at' | 'updated_at'>
): Promise<Channel> {
  const { data, error } = await supabase
    .from('channels')
    .insert({
      channel_id: `ch-${Date.now()}`,
      name: channel.name,
      description: channel.description,
      type: channel.type,
      status: channel.status,
      created_by: channel.created_by,
      max_participants: channel.max_participants,
      is_encrypted: channel.is_encrypted,
      priority_level: channel.priority_level,
      parent_channel_id: channel.parent_channel_id,
      metadata: channel.metadata
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create channel: ${error.message}`);
  
  // Set up channel members table
  await supabase.from('channel_members').insert({
    channel_id: data.id,
    user_id: channel.created_by,
    role: 'admin',
    joined_at: new Date().toISOString(),
    notifications_enabled: true,
    is_muted: false,
    permissions: ['send', 'receive', 'admin']
  });
  
  return data;
}

/**
 * Get channel
 */
export async function getChannel(channelId: string): Promise<Channel | null> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch channel: ${error.message}`);
  }
  return data;
}

/**
 * Get user channels
 */
export async function getUserChannels(userId: string): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channel_members')
    .select(`
      channel_id,
      role,
      joined_at,
      notifications_enabled,
      channels:channels (*)
    `)
    .eq('user_id', userId);
  
  if (error) throw new Error(`Failed to fetch channels: ${error.message}`);
  
  return (data || []).map(d => d.channels).filter(Boolean);
}

/**
 * Update channel status
 */
export async function updateChannelStatus(
  channelId: string,
  status: ChannelStatus
): Promise<void> {
  const { error } = await supabase
    .from('channels')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', channelId);
  
  if (error) throw new Error(`Failed to update channel: ${error.message}`);
}

/**
 * Send message
 */
export async function sendMessage(
  message: Omit<Message, 'id' | 'message_id' | 'sent_at' | 'status'>
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      message_id: `msg-${Date.now()}`,
      channel_id: message.channel_id,
      sender_id: message.sender_id,
      type: message.type,
      content: message.content,
      attachments: message.attachments,
      location: message.location,
      reply_to: message.reply_to,
      priority: message.priority,
      metadata: message.metadata
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to send message: ${error.message}`);
  
  // Update last_message_at on channel
  await supabase
    .from('channels')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', message.channel_id);
  
  return data;
}

/**
 * Get messages
 */
export async function getMessages(
  channelId: string,
  limit: number = 100,
  before?: Date
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('sent_at', { ascending: false })
    .limit(limit);
  
  if (before) {
    query = query.lt('sent_at', before.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch messages: ${error.message}`);
  return data || [];
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({
      status: 'read',
      read_at: new Date().toISOString()
    })
    .eq('id', messageId);
  
  if (error) throw new Error(`Failed to mark read: ${error.message}`);
  
  // Update unread count
  await supabase.rpc('decrement_unread_count', { 
    message_id_param: messageId,
    user_id_param: userId 
  });
}

/**
 * Start call
 */
export async function startCall(
  call: Omit<Call, 'id' | 'call_id' | 'started_at' | 'status'>
): Promise<Call> {
  const { data, error } = await supabase
    .from('calls')
    .insert({
      call_id: `call-${Date.now()}`,
      channel_id: call.channel_id,
      conversation_id: call.conversation_id,
      type: call.type,
      status: 'ringing',
      initiated_by: call.initiated_by,
      recording_enabled: call.recording_enabled,
      transcription_status: 'pending',
      encryption_key_id: call.encryption_key_id,
      metadata: call.metadata
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to start call: ${error.message}`);
  return data;
}

/**
 * Join call
 */
export async function joinCall(
  callId: string,
  participant: Omit<Participant, 'id' | 'participant_id' | 'joined_at'>
): Promise<Participant> {
  // Update call status
  await supabase
    .from('calls')
    .update({
      status: 'connecting',
      started_at: new Date().toISOString()
    })
    .eq('id', callId);
  
  const { data, error } = await supabase
    .from('call_participants')
    .insert({
      participant_id: `part-${Date.now()}`,
      call_id: callId,
      user_id: participant.user_id,
      device_id: participant.device_id,
      status: 'joining',
      audio_enabled: participant.audio_enabled,
      video_enabled: participant.video_enabled,
      screen_sharing: participant.screen_sharing,
      is_recording: participant.is_recording
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to join call: ${error.message}`);
  return data;
}

/**
 * End call
 */
export async function endCall(callId: string): Promise<void> {
  const { error } = await supabase
    .from('calls')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString()
    })
    .eq('id', callId);
  
  if (error) throw new Error(`Failed to end call: ${error.message}`);
  
  // Update all participants
  await supabase
    .from('call_participants')
    .update({
      status: 'left',
      left_at: new Date().toISOString()
    })
    .eq('call_id', callId);
  
  // Start transcription if enabled
  await supabase
    .from('calls')
    .update({ transcription_status: 'pending' })
    .eq('id', callId);
}

/**
 * Start recording
 */
export async function startRecording(
  callId: string,
  recordingType: RecordingType
): Promise<Recording> {
  const { data, error } = await supabase
    .from('recordings')
    .insert({
      recording_id: `rec-${Date.now()}`,
      type: recordingType,
      call_id: callId,
      start_time: new Date().toISOString(),
      format: communicationConfig.recording.format,
      file_size_bytes: 0,
      retention_days: communicationConfig.recording.retention_days,
      expires_at: new Date(Date.now() + communicationConfig.recording.retention_days * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to start recording: ${error.message}`);
  return data;
}

/**
 * Stop recording
 */
export async function stopRecording(recordingId: string, fileUrl: string): Promise<void> {
  const duration = Date.now() - new Date().getTime(); // Would calculate actual duration
  
  const { error } = await supabase
    .from('recordings')
    .update({
      end_time: new Date().toISOString(),
      file_url: fileUrl,
      duration_seconds: duration
    })
    .eq('id', recordingId);
  
  if (error) throw new Error(`Failed to stop recording: ${error.message}`);
}

/**
 * Transcribe recording
 */
export async function transcribeRecording(recordingId: string): Promise<Transcript> {
  const { data, error } = await supabase
    .from('transcripts')
    .insert({
      transcript_id: `trans-${Date.now()}`,
      recording_id: recordingId,
      language: 'en',
      status: 'processing',
      text: ''
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to start transcription: ${error.message}`);
  
  // In production, would trigger async transcription service
  return data;
}

/**
 * Get transcription
 */
export async function getTranscription(recordingId: string): Promise<Transcript | null> {
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('recording_id', recordingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  }
  return data;
}

/**
 * Send radio transmission
 */
export async function sendRadioTransmission(
  transmission: Omit<RadioTransmission, 'id' | 'transmission_id' | 'start_time'>
): Promise<RadioTransmission> {
  const { data, error } = await supabase
    .from('radio_transmissions')
    .insert({
      transmission_id: `rt-${Date.now()}`,
      radio_channel: transmission.radio_channel,
      unit_id: transmission.unit_id,
      user_id: transmission.user_id,
      gps_location: transmission.gps_location,
      transmission_type: transmission.transmission_type,
      content: transmission.content,
      is_emergency: transmission.is_emergency,
      is_priority: transmission.is_priority,
      transcription_status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to send transmission: ${error.message}`);
  return data;
}

/**
 * End radio transmission
 */
export async function endRadioTransmission(transmissionId: string): Promise<void> {
  const { error } = await supabase
    .from('radio_transmissions')
    .update({
      end_time: new Date().toISOString(),
      duration_seconds: 0 // Would calculate actual duration
    })
    .eq('id', transmissionId);
  
  if (error) throw new Error(`Failed to end transmission: ${error.message}`);
}

/**
 * Start push-to-talk
 */
export async function startPushToTalk(
  ptt: Omit<PushToTalk, 'id' | 'ptt_id' | 'is_active' | 'started_at'>
): Promise<PushToTalk> {
  const { data, error } = await supabase
    .from('push_to_talk')
    .insert({
      ptt_id: `ptt-${Date.now()}`,
      user_id: ptt.user_id,
      device_id: ptt.device_id,
      channel_id: ptt.channel_id,
      radio_channel: ptt.radio_channel,
      status: 'transmitting'
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to start PTT: ${error.message}`);
  return data;
}

/**
 * End push-to-talk
 */
export async function endPushToTalk(pttId: string): Promise<void> {
  const { error } = await supabase
    .from('push_to_talk')
    .update({
      is_active: false,
      status: 'idle',
      duration_seconds: 5 // Would calculate actual duration
    })
    .eq('id', pttId);
  
  if (error) throw new Error(`Failed to end PTT: ${error.message}`);
}

/**
 * Create conversation
 */
export async function createConversation(
  conversation: Omit<Conversation, 'id' | 'conversation_id' | 'created_at' | 'unread_count'>
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      conversation_id: `conv-${Date.now()}`,
      participants: conversation.participants,
      type: conversation.type,
      subject: conversation.subject,
      created_by: conversation.created_by
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  
  // Add participants
  await supabase.from('conversation_participants').insert(
    conversation.participants.map(userId => ({
      conversation_id: data.id,
      user_id: userId,
      joined_at: new Date().toISOString(),
      unread_count: 0
    }))
  );
  
  return data;
}

/**
 * Get conversations
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      unread_count,
      conversations:conversations (*)
    `)
    .eq('user_id', userId);
  
  if (error) throw new Error(`Failed to fetch conversations: ${error.message}`);
  
  return (data || [])
    .map(d => ({
      ...d.conversations,
      unread_count: d.unread_count
    }))
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = a.last_message_at || a.created_at;
      const bTime = b.last_message_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
}

/**
 * Get contacts
 */
export async function getContacts(userId: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch contacts: ${error.message}`);
  return data || [];
}

/**
 * Add contact
 */
export async function addContact(contact: Omit<Contact, 'id' | 'contact_id'>): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      contact_id: `contact-${Date.now()}`,
      user_id: contact.user_id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      extension: contact.extension,
      radio_id: contact.radio_id,
      organization: contact.organization,
      role: contact.role,
      availability_status: 'offline',
      priority: contact.priority,
      is_emergency_contact: contact.is_emergency_contact,
      notes: contact.notes
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to add contact: ${error.message}`);
  return data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    });
  
  if (error) throw new Error(`Failed to update preferences: ${error.message}`);
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(
  userId: string,
  channelId?: string
): Promise<NotificationPreferences | null> {
  let query = supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId);
  
  if (channelId) {
    query = query.eq('channel_id', channelId).is('channel_id', null);
  }
  
  const { data, error } = await query.maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch preferences: ${error.message}`);
  }
  return data;
}

/**
 * Generate encryption key
 */
export async function generateEncryptionKey(
  channelId?: string,
  userId?: string
): Promise<EncryptionKey> {
  const { data, error } = await supabase
    .from('encryption_keys')
    .insert({
      key_id: `key-${Date.now()}`,
      channel_id: channelId,
      user_id: userId,
      public_key: '', // Would be actual public key
      algorithm: communicationConfig.encryption.algorithm,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + communicationConfig.encryption.key_rotation_days * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to generate key: ${error.message}`);
  return data;
}

/**
 * Record call quality
 */
export async function recordCallQuality(quality: Omit<CallQuality, 'id' | 'timestamp'>): Promise<void> {
  const { error } = await supabase
    .from('call_quality_metrics')
    .insert({
      call_id: quality.call_id,
      participant_id: quality.participant_id,
      timestamp: new Date().toISOString(),
      bandwidth_kbps: quality.bandwidth_kbps,
      latency_ms: quality.latency_ms,
      jitter_ms: quality.jitter_ms,
      packet_loss_percent: quality.packet_loss_percent,
      audio_quality: quality.audio_quality,
      video_quality: quality.video_quality,
      connection_type: quality.connection_type,
      signal_strength: quality.signal_strength
    });
  
  if (error) console.error('Failed to record quality:', error.message);
}

/**
 * Get channel activity
 */
export async function getChannelActivity(
  channelId: string
): Promise<ChannelActivity | null> {
  const { data, error } = await supabase
    .from('channel_analytics')
    .select('*')
    .eq('channel_id', channelId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch activity: ${error.message}`);
  }
  return data;
}

/**
 * Mute channel
 */
export async function muteChannel(channelId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('channel_members')
    .update({ is_muted: true })
    .eq('channel_id', channelId)
    .eq('user_id', userId);
  
  if (error) throw new Error(`Failed to mute: ${error.message}`);
}

/**
 * Unmute channel
 */
export async function unmuteChannel(channelId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('channel_members')
    .update({ is_muted: false })
    .eq('channel_id', channelId)
    .eq('user_id', userId);
  
  if (error) throw new Error(`Failed to unmute: ${error.message}`);
}

/**
 * Archive conversation
 */
export async function archiveConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({
      is_archived: true,
      last_message_at: new Date().toISOString()
    })
    .eq('id', conversationId);
  
  if (error) throw new Error(`Failed to archive: ${error.message}`);
}

/**
 * Delete message
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({
      deleted_at: new Date().toISOString(),
      content: '[deleted]'
    })
    .eq('id', messageId);
  
  if (error) throw new Error(`Failed to delete: ${error.message}`);
}

/**
 * Pin conversation
 */
export async function pinConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ is_pinned: true })
    .eq('id', conversationId);
  
  if (error) throw new Error(`Failed to pin: ${error.message}`);
}

/**
 * Emergency override - interrupt all calls
 */
export async function emergencyOverride(
  initiatorId: string,
  reason: string
): Promise<{ affected_calls: number; affected_channels: number }> {
  // End all active calls
  const { data: calls } = await supabase
    .from('calls')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('status', 'connected')
    .select();
  
  // Update channel priorities
  await supabase
    .from('channels')
    .update({ priority_level: 100 })
    .in('type', ['emergency', 'broadcast']);
  
  // Send system alert
  await supabase.from('messages').insert({
    message_id: `msg-${Date.now()}`,
    channel_id: 'system',
    sender_id: initiatorId,
    type: 'system',
    content: `EMERGENCY OVERRIDE: ${reason}`,
    status: 'sent',
    priority: 'emergency'
  });
  
  return {
    affected_calls: calls?.length || 0,
    affected_channels: 0 // Would count affected channels
  };
}
