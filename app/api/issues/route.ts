import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Issue, IssueFormData, IssueStats } from '@/types/civic-issue';
import { issueCategory, issuePriority } from '@/types/civic-issue';

// GET - List issues with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const category = searchParams.get('category') as issueCategory | null;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority') as issuePriority | null;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '5'; // km
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('issues')
      .select(`
        *,
        media_attachments (*),
        issue_verifications (count),
        issue_comments (count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      const statuses = status.split(',');
      query = query.in('status', statuses);
    }
    if (priority) {
      query = query.eq('priority', priority);
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
    
    const { data: issues, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: issues,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch issues' }, { status: 500 });
  }
}

// POST - Create new issue
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: IssueFormData = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.category || !body.location) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Insert the issue
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority || 'medium',
        latitude: body.location.latitude,
        longitude: body.location.longitude,
        address: body.location.address,
        neighborhood: body.location.neighborhood,
        city: body.location.city,
        reporter_name: body.reporter_name,
        reporter_phone: body.reporter_phone,
        status: 'submitted'
      })
      .select()
      .single();
    
    if (issueError) {
      return NextResponse.json({ success: false, error: issueError.message }, { status: 500 });
    }
    
    // Upload media if present
    if (body.media_files && body.media_files.length > 0) {
      const mediaRecords = [];
      
      for (const file of body.media_files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${issue.id}/${Date.now()}-${file.name}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('issue-media')
          .upload(filePath, file);
        
        if (uploadError) {
          console.error('Media upload error:', uploadError);
          continue;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('issue-media')
          .getPublicUrl(filePath);
        
        mediaRecords.push({
          issue_id: issue.id,
          type: file.type.startsWith('video/') ? 'video' : 'photo',
          url: publicUrl,
          uploaded_by: null // Anonymous report
        });
      }
      
      // Insert media records
      if (mediaRecords.length > 0) {
        await supabase.from('media_attachments').insert(mediaRecords);
      }
    }
    
    // Fetch complete issue with relations
    const { data: completeIssue } = await supabase
      .from('issues')
      .select(`
        *,
        media_attachments (*)
      `)
      .eq('id', issue.id)
      .single();
    
    return NextResponse.json({
      success: true,
      data: completeIssue,
      message: 'Issue reported successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ success: false, error: 'Failed to create issue' }, { status: 500 });
  }
}
