import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Resource, ResourceFormData, ResourceAllocation, ResourceAllocationFormData, ResourceListParams, ResourceAllocationParams } from '@/types/resource';
import { resource_status, resource_type } from '@/types/resource';

// GET - List resources and allocations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const resourceType = searchParams.get('resource_type') || 'resources'; // 'resources' or 'allocations'
    const status = searchParams.get('status') as resource_status | null;
    const typeFilter = searchParams.get('type') as resource_type | null;
    const assignedTeam = searchParams.get('assigned_team');
    const skills = searchParams.get('skills');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '10'; // km
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (resourceType === 'allocations') {
      // Query resource allocations
      let query = supabase
        .from('resource_allocations')
        .select(`
          *,
          resources!inner(
            id, resource_code, name, resource_type, status,
            assigned_team_data!inner(id, name)
          )
        `)
        .order('start_time', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (isActive !== null && isActive !== '') {
        query = query.eq('is_active', isActive === 'true');
      }
      if (dateFrom) {
        query = query.gte('start_time', dateFrom);
      }
      if (dateTo) {
        query = query.lte('end_time', dateTo);
      }
      
      const { data: allocations, error, count } = await query;
      
      if (error) {
        console.error('Error fetching resource allocations:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: allocations,
        total: count,
        limit,
        offset,
        resource_type: 'allocations'
      });
    } else {
      // Query resources
      let query = supabase
        .from('resources')
        .select(`
          *,
          assigned_team_data!inner(id, name),
          user:user_id(id, full_name, email)
        `)
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (status) {
        const statuses = status.split(',');
        query = query.in('status', statuses);
      }
      if (typeFilter) {
        query = query.eq('resource_type', typeFilter);
      }
      if (assignedTeam) {
        query = query.eq('assigned_team', assignedTeam);
      }
      if (skills) {
        const skillList = skills.split(',');
        query = query.overlaps('skills', skillList);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,resource_code.ilike.%${search}%`);
      }
      
      // Location-based filtering
      if (lat && lng) {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const radiusKm = parseFloat(radius);
        
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180));
        
        query = query
          .gte('location_latitude', latNum - latDelta)
          .lte('location_latitude', latNum + latDelta)
          .gte('location_longitude', lngNum - lngDelta)
          .lte('location_longitude', lngNum + lngDelta);
      }
      
      const { data: resources, error, count } = await query;
      
      if (error) {
        console.error('Error fetching resources:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: resources,
        total: count,
        limit,
        offset,
        resource_type: 'resources'
      });
    }
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch resources' }, { status: 500 });
  }
}

// POST - Create new resource or allocation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const resourceType = body.resource_type || 'resource'; // 'resource' or 'allocation'
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (resourceType === 'allocation') {
      // Create resource allocation
      const allocationData: ResourceAllocationFormData = body;
      
      if (!allocationData.resource_id || !allocationData.target_id || !allocationData.start_time || !allocationData.end_time) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required fields: resource_id, target_id, start_time, and end_time are required' 
        }, { status: 400 });
      }
      
      // Check if resource is available
      const { data: existingAllocations } = await supabase
        .from('resource_allocations')
        .select('*')
        .eq('resource_id', allocationData.resource_id)
        .eq('is_active', true)
        .or(`and(start_time.lte.${allocationData.end_time},end_time.gte.${allocationData.start_time})`);
      
      if (existingAllocations && existingAllocations.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Resource is already allocated for the specified time period' 
        }, { status: 409 });
      }
      
      const { data: allocation, error } = await supabase
        .from('resource_allocations')
        .insert({
          resource_id: allocationData.resource_id,
          allocation_type: allocationData.allocation_type,
          target_id: allocationData.target_id,
          quantity: allocationData.quantity || 1,
          start_time: allocationData.start_time,
          end_time: allocationData.end_time,
          notes: allocationData.notes,
          allocated_by: user?.id,
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating resource allocation:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      // Update resource status to in_use
      await supabase
        .from('resources')
        .update({ status: 'in_use' })
        .eq('id', allocationData.resource_id);
      
      return NextResponse.json({
        success: true,
        data: allocation,
        message: 'Resource allocation created successfully'
      }, { status: 201 });
      
    } else {
      // Create resource
      const resourceData: ResourceFormData = body;
      
      if (!resourceData.resource_code || !resourceData.name || !resourceData.resource_type) {
        return NextResponse.json({ 
          success: false, 
          error: 'Missing required fields: resource_code, name, and resource_type are required' 
        }, { status: 400 });
      }
      
      const { data: resource, error } = await supabase
        .from('resources')
        .insert({
          resource_code: resourceData.resource_code,
          name: resourceData.name,
          description: resourceData.description,
          resource_type: resourceData.resource_type,
          status: resourceData.status || 'available',
          user_id: resourceData.user_id,
          skills: resourceData.skills || [],
          certifications: resourceData.certifications || [],
          serial_number: resourceData.serial_number,
          model_number: resourceData.model_number,
          location: resourceData.location,
          capacity: resourceData.capacity,
          unit_of_measure: resourceData.unit_of_measure,
          assigned_team: resourceData.assigned_team,
          hourly_rate: resourceData.hourly_rate,
          daily_rate: resourceData.daily_rate,
          purchase_cost: resourceData.purchase_cost,
          purchase_date: resourceData.purchase_date,
          warranty_expiry: resourceData.warranty_expiry,
          available_from: resourceData.available_from,
          available_until: resourceData.available_until
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating resource:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: resource,
        message: 'Resource created successfully'
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json({ success: false, error: 'Failed to create resource' }, { status: 500 });
  }
}
