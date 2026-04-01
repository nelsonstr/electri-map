// Incident Types for Support System

// Incident severity types for API routes
export type incident_severity =
  | 'low'
  | 'minor'
  | 'major'
  | 'critical';

export type IncidentSeverity = incident_severity;

// Incident type for emergency incidents
export type IncidentType =
  | 'power_outage'
  | 'service_request'
  | 'maintenance'
  | 'incident'
  | 'safety_hazard'
  | 'weather_alert'
  | 'infrastructure_issue';

export type incident_type = IncidentType;

// Incident status types for API routes
export type incident_status =
  | 'detected'
  | 'investigating'
  | 'triaging'
  | 'responding'
  | 'resolved'
  | 'closed'
  | 'false_alarm';

export type IncidentStatus = incident_status;

export interface IncidentLocation {
  latitude: number;
  longitude: number;
  affected_area_radius_km?: number;
  address?: string;
  neighborhood?: string;
  city?: string;
  municipality?: string;
  district?: string;
  priority?: 'trivial' | 'minor' | 'major' | 'critical';
  category_id?: string;
  asset_id?: string;
  asset_location_lat?: number;
  asset_location_lng?: number;
}

export interface AffectedArea {
  name: string;
  latitude: number;
  longitude: number;
  radius_km: number;
}

export interface ExternalAgency {
  name: string;
  contact_person?: string;
  contact_phone?: string;
  contacted_at?: string;
  status?: string;
}

export interface IncidentFormData {
  title: string;
  description: string;
  incident_type: string;
  severity: IncidentSeverity;
  location: IncidentLocation;
  affected_customers?: number;
  affected_areas?: AffectedArea[];
  is_multi_area?: boolean;
  detected_at?: string;
  source?: string;
  initial_assessment?: string;
  priority?: 'trivial' | 'minor' | 'major' | 'critical';
  category_id?: string;
  estimated_restoration?: string;
  actual_restoration?: string;
  root_cause?: string;
  resolution_summary?: string;
  internal_notes?: string;
  public_updates?: any[];
  media_urls?: any[];
  reported_by?: string;
  reporter_name?: string;
  reporter_phone?: string;
  reporter_email?: string;
  auto_escalate?: boolean;
}

export interface Incident {
  id: string;
  incident_number: string;
  incident_type: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  root_cause?: string;
  resolution_summary?: string;
  location: IncidentLocation;
  affected_customers: number;
  is_multi_area: boolean;
  affected_areas: AffectedArea[];
  assigned_department?: string;
  assigned_team?: string;
  incident_commander?: string;
  current_escalation_level?: string;
  escalation_history: EscalationEntry[];
  service_request_ids: string[];
  work_order_ids: string[];
  external_agencies_notified: ExternalAgency[];
  external_incident_ref?: string;
  detected_at: string;
  investigated_at?: string;
  responded_at?: string;
  resolved_at?: string;
  closed_at?: string;
  post_incident_review?: string;
  lessons_learned?: string;
  created_at: string;
  updated_at: string;
}

export interface EscalationEntry {
  level: string;
  escalated_at: string;
  escalated_to: string;
  reason: string;
  acknowledged: boolean;
  acknowledged_at?: string;
}

export interface IncidentListParams {
  status?: IncidentStatus[];
  severity?: IncidentSeverity[];
  assigned_department?: string;
  incident_commander?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface IncidentStats {
  total_incidents: number;
  active_incidents: number;
  by_severity: Record<IncidentSeverity, number>;
  by_status: Record<IncidentStatus, number>;
  average_resolution_time_hours: number;
  critical_active: number;
  major_active: number;
}

export interface IncidentUpdateData {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  assigned_department?: string;
  assigned_team?: string;
  incident_commander?: string;
  root_cause?: string;
  resolution_summary?: string;
  external_agencies_notified?: ExternalAgency[];
}

export interface IncidentCommandData {
  incident_commander: string;
  assigned_team?: string;
}

export interface PostIncidentData {
  post_incident_review: string;
  lessons_learned: string;
  recommendations: string[];
}

export type IncidentFilter = {
  search?: string;
  status?: IncidentStatus[];
  severity?: IncidentSeverity[];
  date_from?: string;
  date_to?: string;
  assigned_department?: string;
};

// Re-export IncidentType for use in other modules
export { IncidentType };

// Emergency incident input types
export interface CreateIncidentInput {
  title: string;
  description: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  location: IncidentLocation;
  reportingUserId?: string | null;
  source?: string;
  notes?: string;
}

export interface UpdateIncidentInput {
  id: string;
  title?: string;
  description?: string;
  incidentType?: IncidentType;
  severity?: IncidentSeverity;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  status?: IncidentStatus;
  location?: IncidentLocation;
  incidentCommander?: string;
  assignedTeam?: string;
  agenciesInvolved?: ExternalAgency[];
  resourcesRequired?: string;
  affectedPopulation?: number;
  estimatedDamage?: string;
  notes?: string;
  root_cause?: string;
}

export interface IncidentFilters {
  status?: IncidentStatus[];
  severity?: IncidentSeverity[];
  incidentType?: IncidentType[];
  activeOnly?: boolean;
  agencyId?: string;
  incidentCommanderId?: string;
  limit?: number;
  offset?: number;
  dateFrom?: Date;
  dateTo?: Date;
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}
