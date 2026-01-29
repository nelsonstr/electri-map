// Incident Types for Support System

export type IncidentSeverity = 
  | 'low'
  | 'minor'
  | 'major'
  | 'critical';

export type IncidentStatus = 
  | 'detected'
  | 'investigating'
  | 'triaging'
  | 'responding'
  | 'resolved'
  | 'closed'
  | 'false_alarm';

export interface IncidentLocation {
  latitude: number;
  longitude: number;
  affected_area_radius_km?: number;
  address?: string;
  neighborhood?: string;
  city?: string;
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
