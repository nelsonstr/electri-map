import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { MaintenanceSchedule, MaintenanceFormData, WorkOrder, WorkOrderFormData, MaintenanceListParams, WorkOrderListParams } from '@/types/maintenance';
import { maintenance_schedule_status, work_order_status, maintenance_type } from '@/types/maintenance';

// GET - List maintenance schedules and work orders
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const resourceType = searchParams.get('resource_type') || 'schedules'; // 'schedules' or 'work_orders'
    const status = searchParams.get('status');
    const maintenanceType = searchParams.get('maintenance_type') as maintenance_type | null;
    const categoryId = searchParams.get('category_id');
    const assignedDepartment = searchParams.get('assigned_department');
    const assignedTeam = searchParams.get('assigned_team');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (resourceType === 'work_orders') {
      // Query work orders
      let query = supabase
        .from('maintenance_work_orders')
        .select(`
          *,
          service_categories!inner(id, name, parent_id),
          assigned_department_data!inner(id, name),
          assigned_team_data!inner(id, name),
          assigned_to_user!inner(id, full_name, email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (status) {
        const statuses = status.split(',');
        query = query.in('status', statuses);
      }
      if (maintenanceType) {
        query = query.eq('work_order_type', maintenanceType);
      }
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      if (assignedDepartment) {
        query = query.eq('assigned_department', assignedDepartment);
      }
      if (assignedTeam) {
        query = query.eq('assigned_team', assignedTeam);
      }
      if (dateFrom) {
        query = query.gte('scheduled_start', dateFrom);
      }
      if (dateTo) {
        query = query.lte('scheduled_end', dateTo);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,work_order_number.ilike.%${search}%`);
      }
      
      const { data: workOrders, error, count } = await query;
      
      if (error) {
        console.error('Error fetching work orders:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: workOrders,
        total: count,
        limit,
        offset,
        resource_type: 'work_orders'
      });
    } else {
      // Query maintenance schedules
      let query = supabase
        .from('maintenance_schedules')
        .select(`
          *,
          service_categories!inner(id, name, parent_id)
        `)
        .order('next_scheduled_date', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (status) {
        const statuses = status.split(',');
        query = query.in('status', statuses);
      }
      if (maintenanceType) {
        query = query.eq('maintenance_type', maintenanceType);
      }
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      if (assignedDepartment) {
        query = query.eq('assigned_department', assignedDepartment);
      }
      if (dateFrom) {
        query = query.gte('next_scheduled_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('next_scheduled_date', dateTo);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,schedule_number.ilike.%${search}%`);
      }
      
      const { data: schedules, error, count } = await query;
      
      if (error) {
        console.error('Error fetching maintenance schedules:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: schedules,
        total: count,
        limit,
        offset,
        resource_type: 'schedules'
      });
    }
  } catch (error) {
    console.error('Error fetching maintenance data:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch maintenance data' }, { status: 500 });
  }
}

// POST - Create new maintenance schedule or work order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const resourceType = body.resource_type || 'schedule'; // 'schedule' or 'work_order'
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (resourceType === 'work_order') {
      // Create work order
      const workOrderData: WorkOrderFormData = body;
      
      if (!workOrderData.title || !workOrderData.description) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required fields: title and description are required' 
        }, { status: 400 });
      }
      
      const { data: workOrder, error } = await supabase
        .from('maintenance_work_orders')
        .insert({
          title: workOrderData.title,
          description: workOrderData.description,
          work_order_type: workOrderData.work_order_type || 'maintenance',
          priority: workOrderData.priority || 'minor',
          category_id: workOrderData.category_id,
          location: workOrderData.location,
          source_type: workOrderData.source_type,
          source_id: workOrderData.source_id,
          scheduled_start: workOrderData.scheduled_start,
          scheduled_end: workOrderData.scheduled_end,
          estimated_cost: workOrderData.estimated_cost,
          internal_notes: workOrderData.internal_notes,
          public_notes: workOrderData.public_notes,
          created_by: user?.id,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating work order:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: workOrder,
        message: 'Work order created successfully'
      }, { status: 201 });
      
    } else {
      // Create maintenance schedule
      const scheduleData: MaintenanceFormData = body;
      
      if (!scheduleData.name || !scheduleData.maintenance_type || !scheduleData.next_scheduled_date) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required fields: name, maintenance_type, and next_scheduled_date are required' 
        }, { status: 400 });
      }
      
      const { data: schedule, error } = await supabase
        .from('maintenance_schedules')
        .insert({
          name: scheduleData.name,
          description: scheduleData.description,
          maintenance_type: scheduleData.maintenance_type,
          category_id: scheduleData.category_id,
          location: scheduleData.location,
          frequency: scheduleData.frequency,
          next_scheduled_date: scheduleData.next_scheduled_date,
          estimated_duration: scheduleData.estimated_duration_hours,
          required_skills: scheduleData.required_skills,
          required_equipment: scheduleData.required_equipment,
          special_instructions: scheduleData.special_instructions,
          safety_requirements: scheduleData.safety_requirements,
          trigger_conditions: scheduleData.trigger_conditions,
          status: 'scheduled'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating maintenance schedule:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: schedule,
        message: 'Maintenance schedule created successfully'
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating maintenance data:', error);
    return NextResponse.json({ success: false, error: 'Failed to create maintenance data' }, { status: 500 });
  }
}
