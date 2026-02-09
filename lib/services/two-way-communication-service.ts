import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

/**
 * Message status
 */
export type MessageStatus =
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'pending'

/**
 * Message priority
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'critical'

/**
 * Conversation status
 */
export type ConversationStatus =
  | 'active'
  | 'closed'
  | 'resolved'
  | 'escalated'

/**
 * Message type
 */
export type MessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'location'
  | 'file'
  | 'system'

/**
 * Conversation participant type
 */
export type ParticipantType =
  | 'user'
  | 'dispatcher'
  | 'operator'
  | 'responder'
  | 'system'
  | 'bot'

/**
 * Message entry
 */
export interface Message {
  id: string
  conversationId: string
  
  // Content
  content: string
  type: MessageType
  mediaUrl?: string
  mediaThumbnail?: string
  mediaSize?: number
  mediaMimeType?: string
  
  // Metadata
  priority: MessagePriority
  metadata?: Record<string, unknown>
  
  // Sender
  senderId: string
  senderType: ParticipantType
  senderName?: string
  
  // Status
  status: MessageStatus
  statusHistory?: {
    status: MessageStatus
    timestamp: string
  }[]
  
  // Delivery
  deliveredAt?: string
  readAt?: string
  
  // Reference
  replyToId?: string
  
  createdAt: string
}

/**
 * Conversation entry
 */
export interface Conversation {
  id: string
  externalId?: string
  
  // Participants
  userId: string
  assignedOperatorId?: string
  
  // Subject
  subject: string
  category: string
  subcategory?: string
  
  // Status
  status: ConversationStatus
  priority: MessagePriority
  
  // Context
  alertId?: string
  incidentId?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  
  // Metrics
  messageCount: number
  unreadCount: number
  
  // Resolution
  resolvedAt?: string
  resolution?: string
  
  // Timestamps
  startedAt: string
  lastMessageAt: string
  closedAt?: string
  
  createdAt: string
  updatedAt: string
}

/**
 * Conversation participant
 */
export interface ConversationParticipant {
  id: string
  conversationId: string
  userId: string
  participantType: ParticipantType
  name?: string
  avatarUrl?: string
  isActive: boolean
  joinedAt: string
  leftAt?: string
}

/**
 * Typing indicator
 */
export interface TypingIndicator {
  conversationId: string
  userId: string
  participantType: ParticipantType
  isTyping: boolean
  updatedAt: string
}

/**
 * Message read receipt
 */
export interface ReadReceipt {
  messageId: string
  userId: string
  readAt: string
}

/**
 * Create message input
 */
export interface CreateMessageInput {
  conversationId: string
  content: string
  type?: MessageType
  mediaUrl?: string
  mediaThumbnail?: string
  mediaSize?: number
  mediaMimeType?: string
  priority?: MessagePriority
  replyToId?: string
  metadata?: Record<string, unknown>
}

/**
 * Create conversation input
 */
export interface CreateConversationInput {
  userId: string
  subject: string
  category: string
  subcategory?: string
  priority?: MessagePriority
  initialMessage?: string
  alertId?: string
  incidentId?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
}

/**
 * Conversation filter options
 */
export interface ConversationFilterOptions {
  status?: ConversationStatus[]
  priority?: MessagePriority[]
  category?: string
  assignedOperatorId?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  hasUnread?: boolean
  limit?: number
  offset?: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for creating a message
 */
export const createMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  type: z.enum(['text', 'image', 'audio', 'video', 'location', 'file', 'system']).optional(),
  mediaUrl: z.string().url().optional(),
  mediaThumbnail: z.string().url().optional(),
  mediaSize: z.number().positive().optional(),
  mediaMimeType: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  replyToId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Schema for creating a conversation
 */
export const createConversationSchema = z.object({
  userId: z.string().uuid(),
  subject: z.string().min(5).max(200),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  initialMessage: z.string().optional(),
  alertId: z.string().uuid().optional(),
  incidentId: z.string().uuid().optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }).optional(),
})

/**
 * Schema for conversation filter
 */
export const conversationFilterSchema = z.object({
  status: z.array(z.enum(['active', 'closed', 'resolved', 'escalated'])).optional(),
  priority: z.array(z.enum(['low', 'normal', 'high', 'critical'])).optional(),
  category: z.string().optional(),
  assignedOperatorId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  hasUnread: z.boolean().optional(),
  limit: z.number().positive().max(100).optional(),
  offset: z.number().nonnegative().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets display name for conversation status
 */
export function getConversationStatusDisplayName(status: ConversationStatus): string {
  const names: Record<ConversationStatus, string> = {
    active: 'Active',
    closed: 'Closed',
    resolved: 'Resolved',
    escalated: 'Escalated',
  }
  return names[status]
}

/**
 * Gets color for conversation status
 */
export function getConversationStatusColor(status: ConversationStatus): string {
  const colors: Record<ConversationStatus, string> = {
    active: 'bg-green-500',
    closed: 'bg-gray-500',
    resolved: 'bg-blue-500',
    escalated: 'bg-orange-500',
  }
  return colors[status]
}

/**
 * Gets display name for message priority
 */
export function getMessagePriorityDisplayName(priority: MessagePriority): string {
  const names: Record<MessagePriority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    critical: 'Critical',
  }
  return names[priority]
}

/**
 * Gets color for message priority
 */
export function getMessagePriorityColor(priority: MessagePriority): string {
  const colors: Record<MessagePriority, string> = {
    low: 'bg-gray-400',
    normal: 'bg-blue-500',
    high: 'bg-orange-500',
    critical: 'bg-red-600',
  }
  return colors[priority]
}

/**
 * Gets display name for participant type
 */
export function getParticipantTypeDisplayName(type: ParticipantType): string {
  const names: Record<ParticipantType, string> = {
    user: 'User',
    dispatcher: 'Dispatcher',
    operator: 'Operator',
    responder: 'Responder',
    system: 'System',
    bot: 'Bot',
  }
  return names[type]
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Creates a new conversation
 */
export async function createConversation(
  input: CreateConversationInput
): Promise<Conversation> {
  const validationResult = createConversationSchema.safeParse(input)
  if (!validationResult.success) {
    throw new Error(`Invalid conversation input: ${validationResult.error.message}`)
  }

  const supabase = createClient()

  // Create conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: input.userId,
      subject: input.subject,
      category: input.category,
      subcategory: input.subcategory || null,
      priority: input.priority || 'normal',
      status: 'active',
      alert_id: input.alertId || null,
      incident_id: input.incidentId || null,
      location: input.location || null,
      message_count: 0,
      unread_count: 0,
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    throw new Error(`Failed to create conversation: ${error.message}`)
  }

  // Add initial message if provided
  if (input.initialMessage) {
    await createMessage({
      conversationId: conversation.id,
      content: input.initialMessage,
      senderId: input.userId,
      senderType: 'user',
      type: 'text',
    })
  }

  return mapConversationFromDB(conversation)
}

/**
 * Gets a conversation by ID
 */
export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (error) {
    console.error('Error fetching conversation:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapConversationFromDB(data)
}

/**
 * Gets conversations with filters
 */
export async function getConversations(
  filters?: ConversationFilterOptions
): Promise<Conversation[]> {
  const supabase = createClient()

  let query = supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false })

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority)
  }

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.assignedOperatorId) {
    query = query.eq('assigned_operator_id', filters.assignedOperatorId)
  }

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters?.dateFrom) {
    query = query.gte('started_at', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('started_at', filters.dateTo)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  let conversations = (data || []).map(mapConversationFromDB)

  // Filter by unread if specified
  if (filters?.hasUnread) {
    conversations = conversations.filter(c => c.unreadCount > 0)
  }

  return conversations
}

/**
 * Gets user's active conversations
 */
export async function getUserConversations(
  userId: string,
  includeClosed: boolean = false
): Promise<Conversation[]> {
  const statuses = includeClosed
    ? ['active', 'closed', 'resolved', 'escalated']
    : ['active']

  return getConversations({
    status: statuses as ConversationStatus[],
    userId,
  })
}

/**
 * Gets operator's assigned conversations
 */
export async function getOperatorConversations(
  operatorId: string,
  status?: ConversationStatus[]
): Promise<Conversation[]> {
  return getConversations({
    status: status || ['active', 'escalated'],
    assignedOperatorId: operatorId,
  })
}

/**
 * Updates conversation status
 */
export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus,
  resolution?: string
): Promise<Conversation> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'resolved' || status === 'closed') {
    updateData.resolved_at = new Date().toISOString()
    updateData.closed_at = new Date().toISOString()
    updateData.resolution = resolution || null
  }

  const { data, error } = await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', conversationId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating conversation status:', error)
    throw new Error(`Failed to update conversation status: ${error.message}`)
  }

  return mapConversationFromDB(data)
}

/**
 * Assigns an operator to a conversation
 */
export async function assignOperator(
  conversationId: string,
  operatorId: string
): Promise<Conversation> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('conversations')
    .update({
      assigned_operator_id: operatorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .select('*')
    .single()

  if (error) {
    console.error('Error assigning operator:', error)
    throw new Error(`Failed to assign operator: ${error.message}`)
  }

  return mapConversationFromDB(data)
}

/**
 * Creates a message
 */
export async function createMessage(input: {
  conversationId: string
  content: string
  senderId: string
  senderType: ParticipantType
  senderName?: string
  type?: MessageType
  mediaUrl?: string
  mediaThumbnail?: string
  mediaSize?: number
  mediaMimeType?: string
  priority?: MessagePriority
  replyToId?: string
  metadata?: Record<string, unknown>
}): Promise<Message> {
  const supabase = createClient()

  // Create message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      content: input.content,
      type: input.type || 'text',
      media_url: input.mediaUrl || null,
      media_thumbnail: input.mediaThumbnail || null,
      media_size: input.mediaSize || null,
      media_mime_type: input.mediaMimeType || null,
      sender_id: input.senderId,
      sender_type: input.senderType,
      sender_name: input.senderName || null,
      priority: input.priority || 'normal',
      reply_to_id: input.replyToId || null,
      metadata: input.metadata || null,
      status: 'sent',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating message:', error)
    throw new Error(`Failed to create message: ${error.message}`)
  }

  // Update conversation
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      message_count: supabase.rpc('increment', { row_id: input.conversationId, column: 'message_count' }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.conversationId)

  return mapMessageFromDB(message)
}

/**
 * Gets messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  options?: {
    limit?: number
    before?: string
    after?: string
  }
): Promise<Message[]> {
  const supabase = createClient()

  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.before) {
    query = query.lt('created_at', options.before)
  }

  if (options?.after) {
    query = query.gt('created_at', options.after)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return (data || []).reverse().map(mapMessageFromDB)
}

/**
 * Marks messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
  readUntil?: string
): Promise<void> {
  const supabase = createClient()

  const now = new Date().toISOString()

  // Update message statuses
  let query = supabase
    .from('messages')
    .update({
      status: 'read',
      read_at: now,
    })
    .eq('conversation_id', conversationId)
    .eq('sender_id', userId) // Only mark others' messages as read
    .neq('status', 'read')

  if (readUntil) {
    query = query.lt('created_at', readUntil)
  }

  await query

  // Update unread count
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .neq('status', 'read')

  await supabase
    .from('conversations')
    .update({
      unread_count: count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
}

/**
 * Gets unread message count for a user
 */
export async function getUserUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()

  // Get all active conversations for user
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, unread_count')
    .eq('user_id', userId)
    .in('status', ['active', 'escalated'])

  return (conversations || []).reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
}

/**
 * Updates typing indicator
 */
export async function updateTypingIndicator(
  conversationId: string,
  userId: string,
  participantType: ParticipantType,
  isTyping: boolean
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('typing_indicators')
    .upsert({
      conversation_id: conversationId,
      user_id: userId,
      participant_type: participantType,
      is_typing: isTyping,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'conversation_id,user_id' })
}

/**
 * Gets active typers in a conversation
 */
export async function getActiveTypers(
  conversationId: string,
  excludeUserId?: string
): Promise<TypingIndicator[]> {
  const supabase = createClient()

  let query = supabase
    .from('typing_indicators')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_typing', true)

  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching typing indicators:', error)
    return []
  }

  return (data || []).map(item => ({
    conversationId: item.conversation_id,
    userId: item.user_id,
    participantType: item.participant_type,
    isTyping: item.is_typing,
    updatedAt: item.updated_at,
  }))
}

/**
 * Escalates a conversation
 */
export async function escalateConversation(
  conversationId: string,
  escalationTarget: string,
  reason: string
): Promise<Conversation> {
  const supabase = createClient()

  // Add system message about escalation
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: `Conversation escalated to ${escalationTarget}. Reason: ${reason}`,
      type: 'system',
      sender_id: 'system',
      sender_type: 'system',
      priority: 'high',
      status: 'sent',
    })

  // Update conversation
  const { data, error } = await supabase
    .from('conversations')
    .update({
      status: 'escalated',
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .select('*')
    .single()

  if (error) {
    console.error('Error escalating conversation:', error)
    throw new Error(`Failed to escalate conversation: ${error.message}`)
  }

  return mapConversationFromDB(data)
}

/**
 * Resolves a conversation
 */
export async function resolveConversation(
  conversationId: string,
  resolution: string
): Promise<Conversation> {
  return updateConversationStatus(conversationId, 'resolved', resolution)
}

/**
 * Closes a conversation
 */
export async function closeConversation(
  conversationId: string,
  resolution?: string
): Promise<Conversation> {
  return updateConversationStatus(conversationId, 'closed', resolution)
}

/**
 * Adds a participant to a conversation
 */
export async function addConversationParticipant(
  conversationId: string,
  userId: string,
  participantType: ParticipantType,
  name?: string
): Promise<ConversationParticipant> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      participant_type: participantType,
      name: name || null,
      is_active: true,
      joined_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error adding participant:', error)
    throw new Error(`Failed to add participant: ${error.message}`)
  }

  return {
    id: data.id,
    conversationId: data.conversation_id,
    userId: data.user_id,
    participantType: data.participant_type,
    name: data.name || undefined,
    avatarUrl: data.avatar_url || undefined,
    isActive: data.is_active,
    joinedAt: data.joined_at,
    leftAt: data.left_at || undefined,
  }
}

/**
 * Gets conversation statistics for an operator
 */
export async function getOperatorStats(
  operatorId: string
): Promise<{
  activeConversations: number
  escalatedConversations: number
  resolvedToday: number
  averageResolutionTime: number
}> {
  const supabase = createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: active } = await supabase
    .from('conversations')
    .select('id', { count: 'exact' })
    .eq('assigned_operator_id', operatorId)
    .eq('status', 'active')

  const { data: escalated } = await supabase
    .from('conversations')
    .select('id', { count: 'exact' })
    .eq('assigned_operator_id', operatorId)
    .eq('status', 'escalated')

  const { data: resolved } = await supabase
    .from('conversations')
    .select('resolved_at')
    .eq('assigned_operator_id', operatorId)
    .eq('status', 'resolved')
    .gte('resolved_at', today.toISOString())

  return {
    activeConversations: active?.length || 0,
    escalatedConversations: escalated?.length || 0,
    resolvedToday: resolved?.length || 0,
    averageResolutionTime: 0, // Would need more complex calculation
  }
}

/**
 * Searches conversations
 */
export async function searchConversations(
  query: string,
  options?: {
    status?: ConversationStatus[]
    category?: string
    limit?: number
  }
): Promise<Conversation[]> {
  const supabase = createClient()

  let dbQuery = supabase
    .from('conversations')
    .select('*')
    .or(`subject.ilike.%${query}%,id.ilike.%${query}%`)
    .order('last_message_at', { ascending: false })

  if (options?.status && options.status.length > 0) {
    dbQuery = dbQuery.in('status', options.status)
  }

  if (options?.category) {
    dbQuery = dbQuery.eq('category', options.category)
  }

  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error searching conversations:', error)
    return []
  }

  return (data || []).map(mapConversationFromDB)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database record to Conversation
 */
function mapConversationFromDB(data: Record<string, unknown>): Conversation {
  return {
    id: data.id,
    externalId: data.external_id as string | undefined,
    userId: data.user_id,
    assignedOperatorId: data.assigned_operator_id as string | undefined,
    subject: data.subject,
    category: data.category,
    subcategory: data.subcategory as string | undefined,
    status: data.status as ConversationStatus,
    priority: data.priority as MessagePriority,
    alertId: data.alert_id as string | undefined,
    incidentId: data.incident_id as string | undefined,
    location: data.location as { latitude: number; longitude: number; address?: string } | undefined,
    messageCount: data.message_count || 0,
    unreadCount: data.unread_count || 0,
    resolvedAt: data.resolved_at as string | undefined,
    resolution: data.resolution as string | undefined,
    startedAt: data.started_at,
    lastMessageAt: data.last_message_at,
    closedAt: data.closed_at as string | undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Maps database record to Message
 */
function mapMessageFromDB(data: Record<string, unknown>): Message {
  return {
    id: data.id,
    conversationId: data.conversation_id,
    content: data.content,
    type: data.type as MessageType,
    mediaUrl: data.media_url as string | undefined,
    mediaThumbnail: data.media_thumbnail as string | undefined,
    mediaSize: data.media_size as number | undefined,
    mediaMimeType: data.media_mime_type as string | undefined,
    priority: data.priority as MessagePriority,
    metadata: data.metadata as Record<string, unknown> | undefined,
    senderId: data.sender_id,
    senderType: data.sender_type as ParticipantType,
    senderName: data.sender_name as string | undefined,
    status: data.status as MessageStatus,
    statusHistory: data.status_history as Message['statusHistory'] | undefined,
    deliveredAt: data.delivered_at as string | undefined,
    readAt: data.read_at as string | undefined,
    replyToId: data.reply_to_id as string | undefined,
    createdAt: data.created_at,
  }
}
