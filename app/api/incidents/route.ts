import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Incident, IncidentFormData, IncidentListParams, IncidentStats } from '@/types/incident';
import { incident_status, incident_severity } from '@/types/incident';

// GET - List incidents with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const status = searchParams.get('status');
    const severity = searchParams.get('severity') as incident_severity | null;
    const categoryId = searchParams.get('category_id');
    const assignedDepartment = searchParams.get('assigned_department');
    const assignedTeam = searchParams.get('assigned_team');
    const assignedTo = searchParams.get('assigned_to');
    const isResolved = searchParams.get('is_resolved');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '10'; // km
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('incidents')
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
    if (severity) {
      query = query.eq('severity', severity);
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
    if (isResolved !== null && isResolved !== '') {
      query = query.eq('is_resolved', isResolved === 'true');
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,incident_number.ilike.%${search}%`);
    }
    
    // Location-based filtering
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusKm = parseFloat(radius);
      
      // Approximate bounding box for the radius search
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180));
      
      query = query
        .gte('latitude', latNum - latDelta)
        .lte('latitude', latNum + latDelta)
        .gte('longitude', lngNum - lngDelta)
        .lte('longitude', lngNum + lngDelta);
    }
    
    const { data: incidents, error, count } = await query;
    
    if (error) {
      console.error('Error fetching incidents:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: incidents,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

// POST - Create new incident
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: IncidentFormData = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.severity) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: title, description, and severity are required' 
      }, { status: 400 });
    }
    
    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // Auto-assign priority based on severity
    const priorityMap: Record<incident_severity, 'trivial' | 'minor' | 'major' | 'critical'> = {
      'low': 'trivial',
      'minor': 'minor',
      'major': 'major',
      'critical': 'critical'
    };
    
    const priority = body.priority || priorityMap[body.severity];
    
    // Insert the incident
    const { data: incidentData, error: incidentError } = await supabase
      .from('incidents')
      .insert({
        title: body.title,
        description: body.description,
        severity: body.severity,
        category_id: body.category_id,
        priority: priority,
        location: {
          latitude: body.location?.latitude,
          longitude: body.location?.longitude,
          address: body.location?.address,
          asset_id: body.location?.asset_id,
          asset_location_lat: body.location?.asset_location_lat,
          asset_location_lng: body.location?.asset_location_lng
        },
        affected_customers: body.affected_customers || 0,
        estimated_restoration: body.estimated_restoration,
        actual_restoration: body.actual_restoration,
        root_cause: body.root_cause,
        resolution_summary: body.resolution_summary,
        internal_notes: body.internal_notes,
        public_updates: body.public_updates || [],
        media_urls: body.media_urls || [],
        reported_by: body.reported_by || user?.id,
        reporter_name: body.reporter_name,
        reporter_phone: body.reporter_phone,
        reporter_email: body.reporter_email,
        status: 'identified'
      })
      .select()
      .single();
    
    if (incidentError) {
      console.error('Error creating incident:', incidentError);
      return NextResponse.json({ success: false, error: incidentError.message }, { status: 500 });
    }
    
    // Auto-escalate critical incidents
    if (body.severity === 'critical' && body.auto_escalate !== false) {
      // Trigger escalation via database function
      await supabase.rpc('trigger_escalation', {
        p_entity_type: 'incident',
        p_entity_id: incidentData.id,
        p_trigger_type: 'severity_based',
        p_trigger_reason: `Critical severity incident requires immediate attention`
      });
    }
    
    // Fetch complete incident with relations
    const { data: completeIncident } = await supabase
      .from('incidents')
      .select(`
        *,
        service_categories(id, name, parent_id)
      `)
      .eq('id', incidentData.id)
      .single();
    
    return NextResponse.json({
      success: true,
      data: completeIncident,
      message: 'Incident created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ success: false, error: 'Failed to create incident' }, { status: 500 });
  }
}
