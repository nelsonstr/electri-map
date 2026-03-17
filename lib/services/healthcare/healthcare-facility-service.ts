/**
 * Healthcare Facility Integration Service
 * 
 * Epic: Healthcare Facility Integration
 * Description: Integration with healthcare facilities for real-time capacity sharing, bed management,
 * resource coordination, patient transfer protocols, and emergency medical services coordination.
 * 
 * Bmad Category: Healthcare Integration Network (HIN)
 * Emergency Mode Relevance: BFSI, CPI, SAR, MAC - Essential for emergency medical response coordination
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type FacilityType = 
  | 'hospital'
  | 'clinic'
  | 'urgent_care'
  | 'pharmacy'
  | 'fire_station'
  | 'ems_base'
  | 'public_health'
  | 'specialty';

export type FacilityStatus = 
  | 'operational'
  | 'limited'
  | 'overwhelmed'
  | 'closed'
  | 'under_maintenance';

export type BedType = 
  | 'icu'
  | 'icu_covid'
  | 'icu_pediatric'
  | 'nicu'
  | 'pediatric'
  | 'medical_surgical'
  | 'emergency'
  | 'operating_room'
  | 'recovery'
  | 'isolation'
  | 'psychiatric'
  | 'rehabilitation'
  | 'maternity';

export type ResourceType = 
  | 'ventilator'
  | 'monitor'
  | 'defibrillator'
  | 'oxygen'
  | 'medication'
  | 'blood_supply'
  | 'ppe'
  | 'ambulance'
  | 'stretcher'
  | 'wheelchair';

export type PatientStatus = 
  | 'stable'
  | 'critical'
  | 'critical_stable'
  | 'critical_unstable'
  | 'expectant'
  | 'deceased';

export type TransferPriority = 
  | 'immediate'
  | 'urgent'
  | 'routine'
  | 'scheduled';

export type TransferMode = 
  | 'ground'
  | 'air'
  | 'mixed';

export type TransportStatus = 
  | 'pending'
  | 'dispatched'
  | 'en_route'
  | 'arrived'
  | 'loading'
  | 'transit'
  | 'delivered'
  | 'available';

export interface Facility {
  id: string;
  facility_id: string;
  name: string;
  type: FacilityType;
  status: FacilityStatus;
  address: string;
  location: { lat: number; lng: number };
  contact: {
    phone: string;
    fax?: string;
    email?: string;
  };
  operating_hours?: {
    open: string;
    close: string;
    timezone: string;
  };
  capabilities: string[];
  services: string[];
  certifications: string[];
  administrative?: {
    region: string;
    health_authority: string;
    license_number: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface BedCapacity {
  id: string;
  capacity_id: string;
  facility_id: string;
  bed_type: BedType;
  total_beds: number;
  occupied_beds: number;
  reserved_beds: number;
  available_beds: number;
  pending_discharges: number;
  last_updated: Date;
}

export interface ResourceInventory {
  id: string;
  inventory_id: string;
  facility_id: string;
  resource_type: ResourceType;
  resource_name: string;
  quantity_total: number;
  quantity_available: number;
  quantity_reserved: number;
  unit: string;
  expiration_date?: Date;
  last_updated: Date;
  min_threshold?: number;
  critical_threshold?: number;
}

export interface Staff {
  id: string;
  staff_id: string;
  facility_id: string;
  name: string;
  role: 'physician' | 'nurse' | 'paramedic' | 'technician' | 'administrator' | 'support';
  specialty?: string;
  certifications: string[];
  availability_status: 'available' | 'busy' | 'break' | 'off_duty';
  current_assignment?: string;
  shift_start?: Date;
  shift_end?: Date;
  contact?: {
    phone?: string;
    radio_channel?: string;
  };
}

export interface Patient {
  id: string;
  patient_id: string;
  facility_id?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  gender?: string;
  medical_record_number?: string;
  diagnosis?: string[];
  status: PatientStatus;
  triage_level?: number;
  admission_date?: Date;
  estimated_discharge?: Date;
  needs: {
    ventilation: boolean;
    isolation: boolean;
    mobility: 'ambulatory' | 'wheelchair' | 'stretcher';
    equipment?: string[];
  };
  insurance?: {
    provider: string;
    policy_number: string;
  };
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface TransferRequest {
  id: string;
  transfer_id: string;
  patient_id: string;
  origin_facility_id: string;
  destination_facility_id: string;
  priority: TransferPriority;
  status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed' | 'cancelled';
  transfer_mode: TransferMode;
  requested_by: string;
  requested_at: Date;
  scheduled_departure?: Date;
  estimated_arrival?: Date;
  actual_departure?: Date;
  actual_arrival?: Date;
  reason: string;
  clinical_summary: string;
  special_requirements: string[];
  escorts: number;
  medical_requirements: string[];
  equipment_required: string[];
  receiving_facility_notified: boolean;
  origin_facility_notified: boolean;
  notes?: string;
}

export interface TransportUnit {
  id: string;
  unit_id: string;
  facility_id: string;
  unit_type: 'ground' | 'air' | 'boat';
  identifier: string;
  status: TransportStatus;
  crew: string[];
  current_location?: { lat: number; lng: number };
  heading?: number;
  available_at?: Date;
  capabilities: string[];
  equipment: string[];
  fuel_level?: number;
  mileage?: number;
  last_service?: Date;
}

export interface CapacityUpdate {
  id: string;
  update_id: string;
  facility_id: string;
  timestamp: Date;
  bed_updates: Array<{
    bed_type: BedType;
    total: number;
    occupied: number;
    available: number;
  }>;
  er_wait_time?: number;
  incoming_patients: number;
  outgoing_transports: number;
  staffing_level: number;
  status_override?: FacilityStatus;
}

export interface CoordinationRequest {
  id: string;
  request_id: string;
  requesting_agency: string;
  request_type: 'resource' | 'personnel' | 'patient_transfer' | 'information' | 'evacuation';
  priority: TransferPriority;
  status: 'pending' | 'approved' | 'denied' | 'in_progress' | 'completed';
  description: string;
  required_resources?: string[];
  patient_needs?: string;
  location?: { lat: number; lng: number };
  deadline?: Date;
  created_at: Date;
  completed_at?: Date;
  response?: {
    status: string;
    available_resources?: string[];
    eta?: Date;
    notes?: string;
  };
}

export interface HIEConnection {
  id: string;
  connection_id: string;
  facility_id: string;
  health_information_exchange: string;
  status: 'active' | 'inactive' | 'error';
  endpoint_url: string;
  authentication_type: 'oauth' | 'api_key' | 'certificates';
  last_sync?: Date;
  metrics: {
    queries_count: number;
    queries_success: number;
    avg_response_time_ms: number;
  };
}

export interface AlertThreshold {
  id: string;
  threshold_id: string;
  facility_id: string;
  metric: 'occupancy_rate' | 'er_wait_time' | 'icu_availability' | 'staffing_level';
  warning_threshold: number;
  critical_threshold: number;
  alert_enabled: boolean;
  notification_contacts: string[];
}

export interface FacilityMetrics {
  facility_id: string;
  period: { start: Date; end: Date };
  // Capacity metrics
  avg_occupancy_rate: number;
  peak_occupancy_rate: number;
  bed_days_available: number;
  bed_days_used: number;
  // ER metrics
  avg_er_wait_time_minutes: number;
  er_visits: number;
  er_left_without_being_seen: number;
  // Transfer metrics
  transfer_requests: number;
  transfers_completed: number;
  avg_transfer_time_minutes: number;
  // Staffing metrics
  staff_hours_total: number;
  staff_hours_overtime: number;
  staff_availability_rate: number;
  // Resource metrics
  resource_usage_rate: number;
  critical_shortages: number;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const FacilitySchema = z.object({
  id: z.string(),
  facility_id: z.string(),
  name: z.string(),
  type: z.enum(['hospital', 'clinic', 'urgent_care', 'pharmacy', 'fire_station', 'ems_base', 'public_health', 'specialty']),
  status: z.enum(['operational', 'limited', 'overwhelmed', 'closed', 'under_maintenance'])
});

const BedCapacitySchema = z.object({
  id: z.string(),
  facility_id: z.string(),
  bed_type: z.enum(['icu', 'icu_covid', 'icu_pediatric', 'nicu', 'pediatric', 'medical_surgical', 'emergency', 'operating_room', 'recovery', 'isolation', 'psychiatric', 'rehabilitation', 'maternity']),
  total_beds: z.number(),
  occupied_beds: z.number(),
  available_beds: z.number()
});

const TransferRequestSchema = z.object({
  id: z.string(),
  transfer_id: z.string(),
  priority: z.enum(['immediate', 'urgent', 'routine', 'scheduled']),
  status: z.enum(['pending', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled'])
});

// ============================================================================
// Configuration
// ============================================================================

export const healthcareConfig = {
  // Capacity thresholds
  capacity: {
    warning_occupancy_rate: 0.80,
    critical_occupancy_rate: 0.90,
    warning_er_wait_minutes: 120,
    critical_er_wait_minutes: 240,
    min_icu_reserve: 2,
    min_ed_reserve: 4
  },
  
  // Transfer settings
  transfers: {
    max_approval_time_minutes: 15,
    auto_escalate_after_minutes: 30,
    priority_time_multiplier: {
      immediate: 1.0,
      urgent: 2.0,
      routine: 4.0,
      scheduled: 8.0
    }
  },
  
  // Alert settings
  alerts: {
    enabled: true,
    escalation_chain: ['dispatch', 'supervisor', 'manager', 'director'],
    reminder_interval_minutes: 15,
    critical_alert_retry_minutes: 5
  },
  
  // HIE settings
  hie: {
    timeout_seconds: 30,
    retry_count: 3,
    cache_records_minutes: 60
  },
  
  // Display configuration
  display: {
    statusColors: {
      operational: '#22c55e',
      limited: '#f59e0b',
      overwhelmed: '#ef4444',
      closed: '#6b7280',
      under_maintenance: '#3b82f6'
    },
    bedTypeLabels: {
      icu: 'ICU',
      icu_covid: 'COVID ICU',
      icu_pediatric: 'PICU',
      nicu: 'NICU',
      pediatric: 'Pediatrics',
      medical_surgical: 'Med/Surg',
      emergency: 'Emergency',
      operating_room: 'OR',
      recovery: 'Recovery',
      isolation: 'Isolation',
      psychiatric: 'Psychiatric',
      rehabilitation: 'Rehab',
      maternity: 'Maternity'
    },
    priorityColors: {
      immediate: '#dc2626',
      urgent: '#f97316',
      routine: '#3b82f6',
      scheduled: '#6b7280'
    },
    transportStatusIcons: {
      pending: 'clock',
      dispatched: 'navigation',
      en_route: 'navigation',
      arrived: 'map-pin',
      loading: 'package',
      transit: 'truck',
      delivered: 'check-circle',
      available: 'check-circle'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getFacilityStatusInfo(status: FacilityStatus) {
  return {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: healthcareConfig.display.statusColors[status],
    icon: {
      operational: 'check-circle',
      limited: 'alert-triangle',
      overwhelmed: 'alert-octagon',
      closed: 'x-circle',
      under_maintenance: 'tool'
    }[status]
  };
}

export function getBedTypeLabel(bedType: BedType): string {
  return healthcareConfig.display.bedTypeLabels[bedType];
}

export function getPriorityInfo(priority: TransferPriority) {
  return {
    label: priority.charAt(0).toUpperCase() + priority.slice(1),
    color: healthcareConfig.display.priorityColors[priority],
    timeMultiplier: healthcareConfig.transfers.priority_time_multiplier[priority]
  };
}

export function getTransportStatusInfo(status: TransportStatus) {
  return {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: healthcareConfig.display.transportStatusIcons[status],
    color: {
      pending: '#6b7280',
      dispatched: '#3b82f6',
      en_route: '#22c55e',
      arrived: '#8b5cf6',
      loading: '#f59e0b',
      transit: '#06b6d4',
      delivered: '#22c55e',
      available: '#22c55e'
    }[status]
  };
}

export function calculateOccupancyRate(capacity: BedCapacity): number {
  return capacity.total_beds > 0 
    ? (capacity.occupied_beds / capacity.total_beds) 
    : 0;
}

export function calculateAvailableCapacity(capacity: BedCapacity): number {
  return capacity.available_beds - capacity.reserved_beds;
}

export function formatWaitTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function getResourceStatus(
  available: number,
  total: number,
  minThreshold?: number,
  criticalThreshold?: number
): 'normal' | 'warning' | 'critical' | 'out_of_stock' {
  const rate = total > 0 ? available / total : 0;
  
  if (available === 0) return 'out_of_stock';
  if (criticalThreshold && available <= criticalThreshold) return 'critical';
  if (minThreshold && available <= minThreshold) return 'warning';
  return 'normal';
}

export function shouldTriggerAlert(threshold: AlertThreshold, currentValue: number): boolean {
  if (!threshold.alert_enabled) return false;
  
  if (currentValue >= threshold.critical_threshold) {
    return true;
  }
  if (currentValue >= threshold.warning_threshold) {
    return true;
  }
  return false;
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Get facility
 */
export async function getFacility(facilityId: string): Promise<Facility | null> {
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', facilityId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch facility: ${error.message}`);
  }
  return data;
}

/**
 * Get facilities
 */
export async function getFacilities(
  filters?: {
    type?: FacilityType[];
    status?: FacilityStatus[];
    region?: string;
  }
): Promise<Facility[]> {
  let query = supabase.from('facilities').select('*');
  
  if (filters?.type?.length) {
    query = query.in('type', filters.type);
  }
  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }
  if (filters?.region) {
    query = query.eq('administrative->>region', filters.region);
  }
  
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch facilities: ${error.message}`);
  return data || [];
}

/**
 * Update facility status
 */
export async function updateFacilityStatus(
  facilityId: string,
  status: FacilityStatus,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('facilities')
    .update({
      status,
      updated_at: new Date().toISOString(),
      custom_fields: { status_reason: reason }
    })
    .eq('id', facilityId);
  
  if (error) throw new Error(`Failed to update status: ${error.message}`);
  
  // Create capacity update record
  await recordCapacityUpdate(facilityId, status);
}

/**
 * Get bed capacity
 */
export async function getBedCapacity(
  facilityId: string
): Promise<BedCapacity[]> {
  const { data, error } = await supabase
    .from('bed_capacity')
    .select('*')
    .eq('facility_id', facilityId)
    .order('bed_type');
  
  if (error) throw new Error(`Failed to fetch capacity: ${error.message}`);
  return data || [];
}

/**
 * Update bed capacity
 */
export async function updateBedCapacity(
  facilityId: string,
  updates: Array<{ bed_type: BedType; occupied_beds?: number; reserved_beds?: number }>
): Promise<void> {
  for (const update of updates) {
    const { error } = await supabase
      .from('bed_capacity')
      .update({
        occupied_beds: update.occupied_beds,
        reserved_beds: update.reserved_beds,
        last_updated: new Date().toISOString()
      })
      .eq('facility_id', facilityId)
      .eq('bed_type', update.bed_type);
    
    if (error) throw new Error(`Failed to update capacity: ${error.message}`);
  }
}

/**
 * Record capacity update
 */
async function recordCapacityUpdate(
  facilityId: string,
  status?: FacilityStatus
): Promise<void> {
  const { data: beds } = await supabase
    .from('bed_capacity')
    .select('bed_type, total_beds, occupied_beds, available_beds')
    .eq('facility_id', facilityId);
  
  await supabase.from('capacity_updates').insert({
    update_id: `update-${Date.now()}`,
    facility_id: facilityId,
    timestamp: new Date().toISOString(),
    bed_updates: beds || [],
    status_override: status
  });
}

/**
 * Get available beds
 */
export async function getAvailableBeds(
  bedType: BedType,
  region?: string,
  minQuantity: number = 1
): Promise<Array<Facility & { available_beds: number }>> {
  let query = supabase
    .from('bed_capacity')
    .select(`
      facility_id,
      available_beds,
      facilities:facilities (
        id, facility_id, name, type, status, location, contact
      )
    `)
    .eq('bed_type', bedType)
    .gte('available_beds', minQuantity);
  
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch available beds: ${error.message}`);
  
  return (data || [])
    .filter(d => d.facilities && d.facilities.status === 'operational')
    .map(d => ({
      ...d.facilities,
      available_beds: d.available_beds
    }))
    .sort((a, b) => b.available_beds - a.available_beds);
}

/**
 * Get resource inventory
 */
export async function getResourceInventory(
  facilityId: string
): Promise<ResourceInventory[]> {
  const { data, error } = await supabase
    .from('resource_inventory')
    .select('*')
    .eq('facility_id', facilityId)
    .order('resource_type');
  
  if (error) throw new Error(`Failed to fetch inventory: ${error.message}`);
  return data || [];
}

/**
 * Update resource inventory
 */
export async function updateResourceInventory(
  inventoryId: string,
  updates: Partial<ResourceInventory>
): Promise<void> {
  const { error } = await supabase
    .from('resource_inventory')
    .update({
      ...updates,
      last_updated: new Date().toISOString()
    })
    .eq('id', inventoryId);
  
  if (error) throw new Error(`Failed to update inventory: ${error.message}`);
}

/**
 * Get available resources
 */
export async function getAvailableResources(
  resourceType: ResourceType,
  region?: string,
  minQuantity: number = 1
): Promise<Array<Facility & { available: number; total: number }>> {
  const { data, error } = await supabase
    .from('resource_inventory')
    .select(`
      facility_id,
      quantity_available,
      quantity_total,
      facilities:facilities (
        id, facility_id, name, type, status, location
      )
    `)
    .eq('resource_type', resourceType)
    .gte('quantity_available', minQuantity);
  
  if (error) throw new Error(`Failed to fetch resources: ${error.message}`);
  
  return (data || [])
    .filter(d => d.facilities?.status === 'operational')
    .map(d => ({
      ...d.facilities,
      available: d.quantity_available,
      total: d.quantity_total
    }));
}

/**
 * Create transfer request
 */
export async function createTransferRequest(
  request: Omit<TransferRequest, 'id' | 'transfer_id' | 'requested_at' | 'status'>
): Promise<TransferRequest> {
  const { data, error } = await supabase
    .from('transfer_requests')
    .insert({
      transfer_id: `transfer-${Date.now()}`,
      ...request,
      requested_at: new Date().toISOString(),
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create transfer: ${error.message}`);
  
  // Notify receiving facility
  await notifyFacility(request.destination_facility_id, 'transfer_request', {
    transfer_id: data.id,
    priority: request.priority,
    patient_needs: request.special_requirements
  });
  
  return data;
}

/**
 * Approve transfer request
 */
export async function approveTransfer(
  transferId: string,
  approvedBy: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('transfer_requests')
    .update({
      status: 'approved',
      response: {
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        notes
      }
    })
    .eq('id', transferId);
  
  if (error) throw new Error(`Failed to approve: ${error.message}`);
  
  // Update bed availability at destination
  const { data: transfer } = await supabase
    .from('transfer_requests')
    .select('destination_facility_id')
    .eq('id', transferId)
    .single();
  
  if (transfer) {
    await reserveBed(transfer.destination_facility_id, 'medical_surgical', 1);
  }
}

/**
 * Reject transfer request
 */
export async function rejectTransfer(
  transferId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('transfer_requests')
    .update({
      status: 'rejected',
      response: {
        rejected_at: new Date().toISOString(),
        reason
      }
    })
    .eq('id', transferId);
  
  if (error) throw new Error(`Failed to reject: ${error.message}`);
}

/**
 * Update transfer status
 */
export async function updateTransferStatus(
  transferId: string,
  status: TransferRequest['status'],
  additionalInfo?: {
    actual_departure?: Date;
    actual_arrival?: Date;
    notes?: string;
  }
): Promise<void> {
  const updates: Record<string, unknown> = { status };
  
  if (additionalInfo) {
    if (additionalInfo.actual_departure) updates.actual_departure = additionalInfo.actual_departure;
    if (additionalInfo.actual_arrival) updates.actual_arrival = additionalInfo.actual_arrival;
    if (additionalInfo.notes) updates.notes = additionalInfo.notes;
  }
  
  const { error } = await supabase
    .from('transfer_requests')
    .update(updates)
    .eq('id', transferId);
  
  if (error) throw new Error(`Failed to update: ${error.message}`);
  
  // If completed, release reserved bed
  if (status === 'completed') {
    const { data: transfer } = await supabase
      .from('transfer_requests')
      .select('origin_facility_id, destination_facility_id')
      .eq('id', transferId)
      .single();
    
    if (transfer) {
      await releaseBed(transfer.destination_facility_id, 'medical_surgical', 1);
    }
  }
}

/**
 * Get pending transfers
 */
export async function getPendingTransfers(
  facilityId?: string,
  priority?: TransferPriority
): Promise<TransferRequest[]> {
  let query = supabase
    .from('transfer_requests')
    .select('*')
    .eq('status', 'pending')
    .order('priority')
    .order('requested_at', { ascending: true });
  
  if (facilityId) {
    query = query.eq('origin_facility_id', facilityId);
  }
  if (priority) {
    query = query.eq('priority', priority);
  }
  
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch transfers: ${error.message}`);
  return data || [];
}

/**
 * Reserve bed
 */
export async function reserveBed(
  facilityId: string,
  bedType: BedType,
  quantity: number
): Promise<void> {
  const { error } = await supabase.rpc('reserve_bed', {
    facility_id_param: facilityId,
    bed_type_param: bedType,
    quantity_param: quantity
  });
  
  if (error) throw new Error(`Failed to reserve bed: ${error.message}`);
}

/**
 * Release bed
 */
export async function releaseBed(
  facilityId: string,
  bedType: BedType,
  quantity: number
): Promise<void> {
  const { error } = await supabase.rpc('release_bed', {
    facility_id_param: facilityId,
    bed_type_param: bedType,
    quantity_param: quantity
  });
  
  if (error) throw new Error(`Failed to release bed: ${error.message}`);
}

/**
 * Get transport units
 */
export async function getTransportUnits(
  facilityId?: string,
  status?: TransportStatus
): Promise<TransportUnit[]> {
  let query = supabase.from('transport_units').select('*');
  
  if (facilityId) {
    query = query.eq('facility_id', facilityId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch units: ${error.message}`);
  return data || [];
}

/**
 * Dispatch transport unit
 */
export async function dispatchTransport(
  unitId: string,
  destinationId: string,
  transferId?: string
): Promise<void> {
  const { error } = await supabase
    .from('transport_units')
    .update({
      status: 'dispatched',
      available_at: null
    })
    .eq('id', unitId);
  
  if (error) throw new Error(`Failed to dispatch: ${error.message}`);
  
  // Update transfer status
  if (transferId) {
    await updateTransferStatus(transferId, 'in_transit');
  }
}

/**
 * Update transport location
 */
export async function updateTransportLocation(
  unitId: string,
  location: { lat: number; lng: number },
  heading?: number
): Promise<void> {
  const { error } = await supabase
    .from('transport_units')
    .update({
      current_location: location,
      heading
    })
    .eq('id', unitId);
  
  if (error) throw new Error(`Failed to update location: ${error.message}`);
}

/**
 * Create coordination request
 */
export async function createCoordinationRequest(
  request: Omit<CoordinationRequest, 'id' | 'request_id' | 'created_at' | 'status'>
): Promise<CoordinationRequest> {
  const { data, error } = await supabase
    .from('coordination_requests')
    .insert({
      request_id: `coord-${Date.now()}`,
      ...request,
      created_at: new Date().toISOString(),
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create request: ${error.message}`);
  
  // Alert relevant facilities
  await alertFacilities(request.request_type, request.priority, request.description);
  
  return data;
}

/**
 * Respond to coordination request
 */
export async function respondToCoordinationRequest(
  requestId: string,
  facilityId: string,
  response: CoordinationRequest['response']
): Promise<void> {
  const { error } = await supabase
    .from('coordination_requests')
    .update({
      response: {
        ...response,
        responding_facility_id: facilityId,
        responded_at: new Date().toISOString()
      },
      status: response.status === 'approved' ? 'approved' : 'denied'
    })
    .eq('id', requestId);
  
  if (error) throw new Error(`Failed to respond: ${error.message}`);
}

/**
 * Get facility metrics
 */
export async function getFacilityMetrics(
  facilityId: string,
  startDate: Date,
  endDate: Date
): Promise<FacilityMetrics> {
  const { data, error } = await supabase
    .from('facility_metrics')
    .select('*')
    .eq('facility_id', facilityId)
    .gte('period->>start', startDate.toISOString())
    .lte('period->>end', endDate.toISOString())
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }
  
  return data || {
    facility_id: facilityId,
    period: { start: startDate, end: endDate },
    avg_occupancy_rate: 0,
    peak_occupancy_rate: 0,
    bed_days_available: 0,
    bed_days_used: 0,
    avg_er_wait_time_minutes: 0,
    er_visits: 0,
    er_left_without_being_seen: 0,
    transfer_requests: 0,
    transfers_completed: 0,
    avg_transfer_time_minutes: 0,
    staff_hours_total: 0,
    staff_hours_overtime: 0,
    staff_availability_rate: 0,
    resource_usage_rate: 0,
    critical_shortages: 0
  };
}

/**
 * Get staff
 */
export async function getStaff(
  facilityId: string,
  availability?: Staff['availability_status']
): Promise<Staff[]> {
  let query = supabase
    .from('staff')
    .select('*')
    .eq('facility_id', facilityId);
  
  if (availability) {
    query = query.eq('availability_status', availability);
  }
  
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch staff: ${error.message}`);
  return data || [];
}

/**
 * Update staff availability
 */
export async function updateStaffAvailability(
  staffId: string,
  status: Staff['availability_status']
): Promise<void> {
  const { error } = await supabase
    .from('staff')
    .update({ availability_status: status })
    .eq('id', staffId);
  
  if (error) throw new Error(`Failed to update: ${error.message}`);
}

/**
 * Search patient (HIE)
 */
export async function searchPatientHIE(
  facilityId: string,
  query: { name?: string; dob?: string; mrn?: string }
): Promise<unknown[]> {
  const { data, error } = await supabase
    .from('hie_connections')
    .select('*')
    .eq('facility_id', facilityId)
    .eq('status', 'active');
  
  if (error || !data?.length) {
    return [];
  }
  
  // In production, would query HIE endpoint
  return [];
}

/**
 * Get alert thresholds
 */
export async function getAlertThresholds(
  facilityId: string
): Promise<AlertThreshold[]> {
  const { data, error } = await supabase
    .from('alert_thresholds')
    .select('*')
    .eq('facility_id', facilityId);
  
  if (error) throw new Error(`Failed to fetch thresholds: ${error.message}`);
  return data || [];
}

/**
 * Update alert threshold
 */
export async function updateAlertThreshold(
  thresholdId: string,
  updates: Partial<AlertThreshold>
): Promise<void> {
  const { error } = await supabase
    .from('alert_thresholds')
    .update(updates)
    .eq('id', thresholdId);
  
  if (error) throw new Error(`Failed to update: ${error.message}`);
}

/**
 * Notify facility
 */
async function notifyFacility(
  facilityId: string,
  type: string,
  payload: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('facility_notifications')
    .insert({
      notification_id: `notif-${Date.now()}`,
      facility_id: facilityId,
      type,
      payload,
      created_at: new Date().toISOString()
    });
  
  if (error) console.error('Failed to notify:', error.message);
}

/**
 * Alert facilities
 */
async function alertFacilities(
  requestType: CoordinationRequest['request_type'],
  priority: TransferPriority,
  message: string
): Promise<void> {
  // In production, would send alerts to relevant facilities
  console.log(`Alerting facilities: ${requestType} - ${priority} - ${message}`);
}

/**
 * Get aggregated regional capacity
 */
export async function getRegionalCapacity(
  region: string,
  bedType?: BedType
): Promise<{
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  facilities_operational: number;
  facilities_limited: number;
  facilities_overwhelmed: number;
}> {
  const { data: facilities } = await supabase
    .from('facilities')
    .select('id, status')
    .eq('administrative->>region', region);
  
  const facilityIds = facilities?.map(f => f.id) || [];
  
  let query = supabase
    .from('bed_capacity')
    .select('total_beds, occupied_beds, available_beds')
    .in('facility_id', facilityIds);
  
  if (bedType) {
    query = query.eq('bed_type', bedType);
  }
  
  const { data: capacities, error } = await query;
  if (error) throw new Error(`Failed to fetch regional: ${error.message}`);
  
  const totals = capacities?.reduce((acc, c) => ({
    total_beds: acc.total_beds + c.total_beds,
    occupied_beds: acc.occupied_beds + c.occupied_beds,
    available_beds: acc.available_beds + c.available_beds
  }), { total_beds: 0, occupied_beds: 0, available_beds: 0 }) || { total_beds: 0, occupied_beds: 0, available_beds: 0 };
  
  return {
    ...totals,
    facilities_operational: facilities?.filter(f => f.status === 'operational').length || 0,
    facilities_limited: facilities?.filter(f => f.status === 'limited').length || 0,
    facilities_overwhelmed: facilities?.filter(f => f.status === 'overwhelmed').length || 0
  };
}

/**
 * Escalate transfer request
 */
export async function escalateTransfer(
  transferId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('transfer_requests')
    .update({
      escalation: {
        escalated_at: new Date().toISOString(),
        reason,
        level: 1
      }
    })
    .eq('id', transferId);
  
  if (error) throw new Error(`Failed to escalate: ${error.message}`);
  
  // Send critical alert
  await alertFacilities('patient_transfer', 'immediate', `Transfer ${transferId} escalated: ${reason}`);
}
