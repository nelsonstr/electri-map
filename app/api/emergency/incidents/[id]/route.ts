// Single Incident API Route
// Phase 1: Core Infrastructure
// GET, PATCH, DELETE operations for a single incident

import { NextRequest, NextResponse } from 'next/server'
import { 
  getIncidentById, 
  updateIncident,
  addTimelineEvent,
  assignIncidentCommander,
  addAgencyToIncident
} from '@/lib/services/emergency/incident-service'
import type { UpdateIncidentInput } from '@/types/emergency'

// ============================================================================
// GET /api/emergency/incidents/[id]
// Get incident by ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const incident = await getIncidentById(id)
    
    if (!incident) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: incident
    })
  } catch (error) {
    console.error('Error getting incident:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get incident' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/emergency/incidents/[id]
// Update incident
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Verify incident exists
    const existingIncident = await getIncidentById(id)
    
    if (!existingIncident) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      )
    }
    
    // Build update input with all optional fields
    const updateInput = {
      id,
      title: body.title,
      description: body.description,
      incidentType: body.incidentType,
      severity: body.severity,
      status: body.status,
      priority: body.priority,
    } as any

    // Location update
    if (body.location) {
      updateInput.location = {
        latitude: body.location.latitude,
        longitude: body.location.longitude,
        address: body.location.address,
        city: body.location.city,
        municipality: body.location.municipality,
        district: body.location.district,
        neighborhood: body.location.neighborhood,
      }
    }

    // Assignment fields
    if (body.incidentCommanderId) updateInput.incidentCommander = body.incidentCommanderId
    if (body.assignedUnitId) updateInput.assignedTeam = body.assignedUnitId

    // Agency coordination
    if (body.agenciesInvolved) updateInput.external_agencies_notified = body.agenciesInvolved

    // Resource tracking
    if (body.resourcesRequired) updateInput.resourcesRequired = body.resourcesRequired

    // Impact metrics
    if (body.affectedPopulation) updateInput.affected_customers = body.affectedPopulation
    if (body.estimatedDamage) updateInput.resolution_summary = body.estimatedDamage

    // Notes
    if (body.notes) updateInput.root_cause = body.notes
    
    const updatedIncident = await updateIncident(updateInput)
    
    return NextResponse.json({
      success: true,
      data: updatedIncident
    })
  } catch (error) {
    console.error('Error updating incident:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update incident' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/emergency/incidents/[id]
// Delete incident (soft delete - only by authorized personnel)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const reason = searchParams.get('reason') || 'No reason provided'
    
    // Verify incident exists
    const existingIncident = await getIncidentById(id)
    
    if (!existingIncident) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      )
    }
    
    // Soft delete by setting status to closed and adding audit note
    const updatedIncident = await updateIncident({
      id,
      status: 'closed',
      root_cause: `Incident deleted. Reason: ${reason}`,
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedIncident.id,
        status: 'closed',
        message: 'Incident has been closed'
      }
    })
  } catch (error) {
    console.error('Error deleting incident:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete incident' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/emergency/incidents/[id]/timeline
// Add timeline event to incident
// ============================================================================

export async function POSTTimeline(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate required fields
    if (!body.type || !body.title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title' },
        { status: 400 }
      )
    }
    
    const updatedIncident = await addTimelineEvent(id, {
      type: body.type,
      title: body.title,
      description: body.description,
      data: body.data,
      userId: body.userId,
      userName: body.userName
    })
    
    return NextResponse.json({
      success: true,
      data: updatedIncident
    })
  } catch (error) {
    console.error('Error adding timeline event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add timeline event' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/emergency/incidents/[id]/commander
// Assign incident commander
// ============================================================================

export async function POSTCommander(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (!body.commanderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: commanderId' },
        { status: 400 }
      )
    }
    
    const updatedIncident = await assignIncidentCommander(id, body.commanderId)
    
    return NextResponse.json({
      success: true,
      data: updatedIncident
    })
  } catch (error) {
    console.error('Error assigning commander:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to assign commander' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/emergency/incidents/[id]/agency
// Add agency to incident
// ============================================================================

export async function POSTAgency(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (!body.agencyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: agencyId' },
        { status: 400 }
      )
    }
    
    const updatedIncident = await addAgencyToIncident(id, body.agencyId)
    
    return NextResponse.json({
      success: true,
      data: updatedIncident
    })
  } catch (error) {
    console.error('Error adding agency:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add agency' },
      { status: 500 }
    )
  }
}
