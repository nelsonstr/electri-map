import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EscalationRule, EscalationHistory, EscalationRuleFormData, ManualEscalationRequest, EscalationListParams, EscalationRuleListParams } from '@/types/escalation';
import { escalation_status, escalation_trigger_type } from '@/types/escalation';

// GET - List escalation rules and history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const resourceType = searchParams.get('resource_type') || 'rules'; // 'rules' or 'history'
    const status = searchParams.get('status') as escalation_status | null;
    const triggerType = searchParams.get('trigger_type') as escalation_trigger_type | null;
    const entityType = searchParams.get('entity_type'); // 'service_request' or 'incident'
    const entityId = searchParams.get('entity_id');
    const escalationLevel = searchParams.get('escalation_level');
    const isActive = searchParams.get('is_active');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (resourceType === 'history') {
      // Query escalation history
      let query = supabase
        .from('escalation_history')
        .select(`
          *,
          escalation_rules!inner(
            id, name, entity_type, trigger_type, escalation_level,
            target_department, target_team, target_user_id
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (status) {
        const statuses = status.split(',');
        query = query.in('status', statuses);
      }
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      if (escalationLevel) {
        query = query.eq('to_level', parseInt(escalationLevel));
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }
      
      const { data: history, error, count } = await query;
      
      if (error) {
        console.error('Error fetching escalation history:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: history,
        total: count,
        limit,
        offset,
        resource_type: 'history'
      });
    } else {
      // Query escalation rules
      let query = supabase
        .from('escalation_rules')
        .select('*')
        .order('escalation_level', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (status) {
        // Filter rules by is_active
        query = query.eq('is_active', status === 'active');
      }
      if (triggerType) {
        query = query.eq('trigger_type', triggerType);
      }
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (escalationLevel) {
        query = query.eq('escalation_level', parseInt(escalationLevel));
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      const { data: rules, error, count } = await query;
      
      if (error) {
        console.error('Error fetching escalation rules:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: rules,
        total: count,
        limit,
        offset,
        resource_type: 'rules'
      });
    }
  } catch (error) {
    console.error('Error fetching escalations:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch escalations' }, { status: 500 });
  }
}

// POST - Create escalation rule or trigger manual escalation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const resourceType = body.resource_type || 'rule'; // 'rule' or 'manual'
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (resourceType === 'manual') {
      // Trigger manual escalation
      const escalationRequest: ManualEscalationRequest = body;
      
      if (!escalationRequest.entity_type || !escalationRequest.entity_id || !escalationRequest.target_level || !escalationRequest.reason) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required fields: entity_type, entity_id, target_level, and reason are required' 
        }, { status: 400 });
      }
      
      // Call database function to trigger escalation
      const { data: escalation, error } = await supabase
        .rpc('trigger_escalation', {
          p_entity_type: escalationRequest.entity_type,
          p_entity_id: escalationRequest.entity_id,
          p_trigger_type: 'manual',
          p_trigger_reason: escalationRequest.reason,
          p_triggered_by: user?.id,
          p_notify_channels: escalationRequest.notify_channels || ['email', 'in_app']
        });
      
      if (error) {
        console.error('Error triggering manual escalation:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: escalation,
        message: 'Escalation triggered successfully'
      }, { status: 201 });
      
    } else {
      // Create escalation rule
      const ruleData: EscalationRuleFormData = body;
      
      if (!ruleData.name || !ruleData.entity_type || !ruleData.trigger_type || !ruleData.escalation_level) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required fields: name, entity_type, trigger_type, and escalation_level are required' 
        }, { status: 400 });
      }
      
      const { data: rule, error } = await supabase
        .from('escalation_rules')
        .insert({
          name: ruleData.name,
          description: ruleData.description,
          entity_type: ruleData.entity_type,
          priority_levels: ruleData.priority_levels || [],
          trigger_type: ruleData.trigger_type,
          trigger_config: ruleData.trigger_config,
          escalation_level: ruleData.escalation_level,
          target_department: ruleData.target_department,
          target_team: ruleData.target_team,
          target_user_id: ruleData.target_user_id,
          notification_channels: ruleData.notification_channels || ['email', 'in_app'],
          auto_escalate: ruleData.auto_escalate ?? true,
          max_escalation_level: ruleData.max_escalation_level,
          is_active: ruleData.is_active ?? true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating escalation rule:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: rule,
        message: 'Escalation rule created successfully'
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating escalation:', error);
    return NextResponse.json({ success: false, error: 'Failed to create escalation' }, { status: 500 });
  }
}
