import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Communication channel type
export type CommunicationChannel = 
  | 'email'
  | 'sms'
  | 'push'
  | 'phone'
  | 'in_app'
  | 'webhook'
  | 'social'
  | 'chat';

// Communication direction
export type CommunicationDirection = 'inbound' | 'outbound';

// Communication status
export type CommunicationStatus = 
  | 'logged'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'bounced'
  | 'unsubscribed';

// Communication log interface
export interface CommunicationLog {
  id: string;
  entity_type: string; // 'service_request' | 'incident' | 'work_order'
  entity_id: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  subject?: string;
  content: string;
  sender: string;
  sender_name?: string;
  recipient: string;
  recipient_name?: string;
  status: CommunicationStatus;
  metadata?: Record<string, unknown>;
  external_id?: string; // ID from external service (e.g., email provider)
  error_message?: string;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
}

// Communication form data
export interface CommunicationFormData {
  entity_type: string;
  entity_id: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  subject?: string;
  content: string;
  sender?: string;
  sender_name?: string;
  recipient: string;
  recipient_name?: string;
  metadata?: Record<string, unknown>;
}

// GET - List communication logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const channel = searchParams.get('channel') as CommunicationChannel | null;
    const direction = searchParams.get('direction') as CommunicationDirection | null;
    const status = searchParams.get('status') as CommunicationStatus | null;
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('communication_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (entityId) {
      query = query.eq('entity_id', entityId);
    }
    if (channel) {
      query = query.eq('channel', channel);
    }
    if (direction) {
      query = query.eq('direction', direction);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }
    if (search) {
      query = query.or(`content.ilike.%${search}%,subject.ilike.%${search}%,sender.ilike.%${search}%,recipient.ilike.%${search}%`);
    }
    
    const { data: communications, error, count } = await query;
    
    if (error) {
      console.error('Error fetching communication logs:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: communications,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching communication logs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch communication logs' }, { status: 500 });
  }
}

// POST - Log new communication
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CommunicationFormData = await request.json();
    
    // Validate required fields
    if (!body.entity_type || !body.entity_id || !body.channel || !body.direction || !body.content || !body.recipient) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: entity_type, entity_id, channel, direction, content, and recipient are required' 
      }, { status: 400 });
    }
    
    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // Insert the communication log
    const { data: communication, error } = await supabase
      .from('communication_logs')
      .insert({
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        channel: body.channel,
        direction: body.direction,
        subject: body.subject,
        content: body.content,
        sender: body.sender || user?.email || 'system',
        sender_name: body.sender_name,
        recipient: body.recipient,
        recipient_name: body.recipient_name,
        status: 'logged',
        metadata: body.metadata
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error logging communication:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: communication,
      message: 'Communication logged successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error logging communication:', error);
    return NextResponse.json({ success: false, error: 'Failed to log communication' }, { status: 500 });
  }
}
