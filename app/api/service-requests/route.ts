import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ServiceRequest, ServiceRequestFormData, ServiceRequestListParams, ServiceRequestStats } from '@/types/service-request';
import { request_status, service_priority } from '@/types/service-request';

// GET - List service requests with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority') as service_priority | null;
    const categoryId = searchParams.get('category_id');
    const assignedDepartment = searchParams.get('assigned_department');
    const assignedTeam = searchParams.get('assigned_team');
    const assignedTo = searchParams.get('assigned_to');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '5'; // km
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('service_requests')
      .select(`
        *,
        service_categories!inner(id, name, parent_id),
        assigned_department_data!inner(id, name),
        assigned_team_data!inner(id, name),
        assigned_to_user!inner(id, full_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (status) {
      const statuses = status.split(',');
      query = query.in('status', statuses);
    }
    if (priority) {
      query = query.eq('priority', priority);
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
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,request_number.ilike.%${search}%`);
    }
    
    // Location-based filtering
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusKm = parseFloat(radius);
      
      // Approximate bounding box for the radius search
      const latDelta = radiusKm / 111; // 1 degree latitude ≈ 111km
      const lngDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180));
      
      query = query
        .gte('latitude', latNum - latDelta)
        .lte('latitude', latNum + latDelta)
        .gte('longitude', lngNum - lngDelta)
        .lte('longitude', lngNum + lngDelta);
    }
    
    const { data: requests, error, count } = await query;
    
    if (error) {
      console.error('Error fetching service requests:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: requests,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch service requests' }, { status: 500 });
  }
}

// POST - Create new service request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: ServiceRequestFormData = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.intake_channel) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: title, description, and intake_channel are required' 
      }, { status: 400 });
    }
    
    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // Auto-categorize and assign priority if not provided
    let categoryId = body.category_id;
    let priority = body.priority || 'minor';
    
    // Insert the service request
    const { data: requestData, error: requestError } = await supabase
      .from('service_requests')
      .insert({
        title: body.title,
        description: body.description,
        category_id: categoryId,
        priority: priority,
        intake_channel: body.intake_channel,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        customer_id: body.customer_id || user?.id,
        location: {
          latitude: body.location?.latitude,
          longitude: body.location?.longitude,
          address: body.location?.address,
          neighborhood: body.location?.neighborhood,
          city: body.location?.city,
          asset_id: body.location?.asset_id,
          asset_location_lat: body.location?.asset_location_lat,
          asset_location_lng: body.location?.asset_location_lng
        },
        media_urls: body.media_urls || [],
        internal_notes: body.internal_notes,
        custom_fields: body.custom_fields,
        status: 'submitted'
      })
      .select()
      .single();
    
    if (requestError) {
      console.error('Error creating service request:', requestError);
      return NextResponse.json({ success: false, error: requestError.message }, { status: 500 });
    }
    
    // Log communication if provided
    if (body.communication) {
      await supabase.from('communication_logs').insert({
        entity_type: 'service_request',
        entity_id: requestData.id,
        channel: body.communication.channel,
        direction: body.communication.direction || 'inbound',
        subject: body.communication.subject,
        content: body.communication.content,
        sender: body.customer_email || body.customer_name,
        recipient: 'system',
        status: 'logged'
      });
    }
    
    // Fetch complete request with relations
    const { data: completeRequest } = await supabase
      .from('service_requests')
      .select(`
        *,
        service_categories(id, name, parent_id)
      `)
      .eq('id', requestData.id)
      .single();
    
    return NextResponse.json({
      success: true,
      data: completeRequest,
      message: 'Service request created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating service request:', error);
    return NextResponse.json({ success: false, error: 'Failed to create service request' }, { status: 500 });
  }
}
