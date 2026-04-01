// Service Request Types for Support System

export type ServiceRequestStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'pending_material'
  | 'pending_approval'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'closed';

export type request_status = ServiceRequestStatus;

export type ServicePriority =
  | 'trivial'
  | 'minor'
  | 'major'
  | 'critical';

export type IntakeChannel =
  | 'web'
  | 'mobile'
  | 'phone'
  | 'kiosk'
  | 'api'
  | 'email'
  | 'social_media'
  | 'walk_in';

export interface ServiceRequestLocation {
  latitude: number;
  longitude: number;
  address?: string;
  neighborhood?: string;
  city?: string;
  asset_id?: string;
  asset_location_lat?: number;
  asset_location_lng?: number;
}

export interface ServiceRequestFormData {
  title: string;
  description: string;
  category_id: string;
  subcategory_id?: string;
  location: ServiceRequestLocation;
  priority?: ServicePriority;
  intake_channel: IntakeChannel;
  requester_name: string;
  requester_email?: string;
  requester_phone?: string;
  is_anonymous?: boolean;
  media_files?: File[];
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_id?: string;
  asset_id?: string;
  asset_location_lat?: number;
  asset_location_lng?: number;
  media_urls?: string[];
  internal_notes?: string;
  custom_fields?: Record<string, unknown>;
  communication?: {
    channel: string;
    direction?: 'inbound' | 'outbound';
    subject?: string;
    content: string;
  };
}

export interface ServiceRequest {
  id: string;
  request_number: string;
  intake_channel: IntakeChannel;
  title: string;
  description: string;
  category_id?: string;
  subcategory_id?: string;
  location: ServiceRequestLocation;
  priority: ServicePriority;
  status: ServiceRequestStatus;
  requester_id?: string;
  requester_name: string;
  requester_email?: string;
  requester_phone?: string;
  assigned_department?: string;
  assigned_team?: string;
  assigned_to?: string;
  sla_id?: string;
  sla_response_deadline?: string;
  sla_resolution_deadline?: string;
  actual_response_at?: string;
  actual_resolution_at?: string;
  current_escalation_level?: string;
  escalated_at?: string;
  escalated_by?: string;
  related_incident_id?: string;
  related_issue_id?: string;
  work_order_id?: string;
  customer_impact: number;
  is_anonymous: boolean;
  is_recurring: boolean;
  recurring_parent_id?: string;
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
  started_at?: string;
  completed_at?: string;
  closed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface ServiceRequestListParams {
  status?: ServiceRequestStatus[];
  priority?: ServicePriority[];
  category_id?: string;
  assigned_department?: string;
  assigned_to?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Add lowercase aliases for API routes
export type service_priority = ServicePriority;
export type service_request_status = ServiceRequestStatus;

export interface ServiceRequestStats {
  total_requests: number;
  by_status: Record<ServiceRequestStatus, number>;
  by_priority: Record<ServicePriority, number>;
  average_response_time_hours: number;
  average_resolution_time_hours: number;
  sla_compliance_rate: number;
  open_requests: number;
  overdue_requests: number;
}

export interface ServiceRequestUpdateData {
  status?: ServiceRequestStatus;
  priority?: ServicePriority;
  assigned_to?: string;
  assigned_department?: string;
  notes?: string;
}

export interface ServiceRequestAssignment {
  assigned_to: string;
  assigned_department?: string;
  assigned_team?: string;
}

export interface BulkServiceRequestUpdate {
  ids: string[];
  updates: ServiceRequestUpdateData;
}

export interface ServiceRequestFilter {
  search?: string;
  status?: ServiceRequestStatus[];
  priority?: ServicePriority[];
  category_id?: string;
  date_from?: string;
  date_to?: string;
  assigned_to?: string;
  assigned_department?: string;
}
