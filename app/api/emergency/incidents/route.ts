// Emergency Incidents API Routes
// Phase 1: Core Infrastructure
// RESTful API for incident management

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  createIncident, 
  listIncidents, 
  getIncidentById, 
  updateIncident,
  getActiveIncidentsCount,
  searchIncidents
} from '@/lib/services/emergency/incident-service'
import type { CreateIncidentInput, UpdateIncidentInput, IncidentFilters } from '@/types/emergency'

// ============================================================================
// GET /api/emergency/incidents
// List incidents with optional filters
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse filters from query params
    const filters: IncidentFilters = {}
    
    // Status filter
    const status = searchParams.get('status')
    if (status) {
      filters.status = status.split(',') as Array<'detected' | 'investigating' | 'responding' | 'contained' | 'resolved' | 'closed'>
    }
    
    // Severity filter
    const severity = searchParams.get('severity')
    if (severity) {
      filters.severity = severity.split(',') as Array<'critical' | 'major' | 'moderate' | 'minor' | 'low'>
    }
    
    // Incident type filter
    const incidentType = searchParams.get('type')
    if (incidentType) {
      filters.incidentType = incidentType.split(',') as any[]
    }
    
    // Active only
    const activeOnly = searchParams.get('active')
    if (activeOnly === 'true') {
      filters.activeOnly = true
    }
    
    // Agency filter
    const agencyId = searchParams.get('agencyId')
    if (agencyId) {
      filters.agencyId = agencyId
    }
    
    // Commander filter
    const commanderId = searchParams.get('commanderId')
    if (commanderId) {
      filters.incidentCommanderId = commanderId
    }
    
    // Pagination
    const limit = searchParams.get('limit')
    filters.limit = limit ? parseInt(limit, 10) : 50
    
    const offset = searchParams.get('offset')
    filters.offset = offset ? parseInt(offset, 10) : 0
    
    // Date range
    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom)
    }
    
    const dateTo = searchParams.get('dateTo')
    if (dateTo) {
      filters.dateTo = new Date(dateTo)
    }
    
    // Bounding box
    const north = searchParams.get('north')
    const south = searchParams.get('south')
    const east = searchParams.get('east')
    const west = searchParams.get('west')
    
    if (north && south && east && west) {
      filters.boundingBox = {
        north: parseFloat(north),
        south: parseFloat(south),
        east: parseFloat(east),
        west: parseFloat(west)
      }
    }
    
    // Get incidents
    const incidents = await listIncidents(filters)
    
    return NextResponse.json({
      success: true,
      data: incidents,
      meta: {
        count: incidents.length,
        limit: filters.limit,
        offset: filters.offset
      }
    })
  } catch (error) {
    console.error('Error listing incidents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list incidents' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/emergency/incidents
// Create a new incident
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.incidentType || !body.severity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, incidentType, severity' },
        { status: 400 }
      )
    }
    
    // Validate location
    if (!body.location || !body.location.latitude || !body.location.longitude) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: location with latitude and longitude' },
        { status: 400 }
      )
    }
    
    // Build create input
    const createInput: CreateIncidentInput = {
      title: body.title,
      description: body.description || '',
      incidentType: body.incidentType as IncidentType,
      severity: body.severity,
      priority: body.priority || 'normal',
      location: {
        latitude: body.location.latitude,
        longitude: body.location.longitude,
        address: body.location.address,
        city: body.location.city,
        municipality: body.location.municipality,
        district: body.location.district
      },
      reportingUserId: body.reportingUserId || null,
      source: body.source,
      notes: body.notes
    }
    
    // Create incident
    const incident = await createIncident(createInput)
    
    return NextResponse.json(
      { success: true, data: incident },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating incident:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create incident' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET /api/emergency/incidents/stats
// Get active incidents statistics
// ============================================================================

export async function GETStats(request: NextRequest) {
  try {
    const stats = await getActiveIncidentsCount()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error getting incident stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get incident statistics' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET /api/emergency/incidents/search?q=query
// Search incidents
// ============================================================================

export async function GETSearch(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    
    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }
    
    const incidents = await searchIncidents(query)
    
    return NextResponse.json({
      success: true,
      data: incidents,
      meta: { count: incidents.length }
    })
  } catch (error) {
    console.error('Error searching incidents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search incidents' },
      { status: 500 }
    )
  }
}
