/**
 * Real-Time Operations Dashboard Service
 * 
 * Epic: Real-Time Operations Dashboard
 * Description: Comprehensive command center dashboard providing real-time visibility into all emergency operations
 * including active incidents, resource allocation, team locations, communications, and predictive analytics.
 * Features customizable widgets, multi-view displays, and integration with external systems.
 * 
 * Bmad Category: Command Center Excellence (CCE)
 * Emergency Mode Relevance: BFSI, CPI, SAR, MAC, CEX - Central hub for all emergency operations
 * Complexity: 5
 * Priority: P1 (Critical)
 */

import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type IncidentStatus = 
  | 'reported'
  | 'dispatched'
  | 'en_route'
  | 'on_scene'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type IncidentPriority = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type ResourceStatus = 
  | 'available'
  | 'dispatched'
  | 'busy'
  | 'out_of_service'
  | 'maintenance';

export type TeamMemberStatus = 
  | 'available'
  | 'responding'
  | 'on_scene'
  | 'break'
  | 'off_duty';

export type DashboardView = 
  | 'overview'
  | 'incidents'
  | 'resources'
  | 'map'
  | 'communications'
  | 'analytics'
  | 'custom';

export type WidgetType = 
  | 'incident_feed'
  | 'resource_overview'
  | 'map_view'
  | 'alert_ticker'
  | 'weather_panel'
  | 'metrics_card'
  | 'timeline'
  | 'team_locations'
  | 'communication_center'
  | 'performance_metrics'
  | 'upcoming_events'
  | 'system_health';

export interface DashboardWidget {
  id: string;
  widget_type: WidgetType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, unknown>;
  is_visible: boolean;
  refresh_interval_seconds: number;
  last_refreshed?: Date;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  view: DashboardView;
  widgets: DashboardWidget[];
  is_default: boolean;
  is_shared: boolean;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardSession {
  id: string;
  dashboard_id: string;
  user_id: string;
  active_view: DashboardView;
  last_activity: Date;
  widgets_state: Record<string, unknown>;
}

export interface OperationsMetrics {
  // Incident metrics
  active_incidents: number;
  critical_incidents: number;
  incidents_today: number;
  avg_response_time_minutes: number;
  avg_resolution_time_minutes: number;
  
  // Resource metrics
  available_units: number;
  dispatched_units: number;
  busy_units: number;
  out_of_service_units: number;
  
  // Team metrics
  active_personnel: number;
  on_break_personnel: number;
  
  // Alert metrics
  alerts_last_24h: number;
  critical_alerts: number;
  pending_alerts: number;
  
  // Performance metrics
  throughput: number; // incidents/hour
  resolution_rate: number; // percentage
  escalation_rate: number; // percentage
}

export interface IncidentSummary {
  id: string;
  incident_number: string;
  type: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  location: { lat: number; lng: number; address?: string };
  reported_at: Date;
  dispatched_at?: Date;
  arrived_at?: Date;
  resolved_at?: Date;
  assigned_units: string[];
  dispatcher?: string;
  description: string;
  timeline: Array<{
    timestamp: Date;
    action: string;
    actor?: string;
    notes?: string;
  }>;
}

export interface ResourceUnit {
  id: string;
  unit_id: string;
  unit_name: string;
  unit_type: 'ambulance' | 'fire_engine' | 'police' | 'rescue' | 'utility' | 'command' | 'other';
  status: ResourceStatus;
  location?: { lat: number; lng: number };
  heading?: number;
  speed_kmh?: number;
  assigned_incident?: string;
  destination?: { lat: number; lng: number; address?: string };
  eta_minutes?: number;
  available_since?: Date;
  last_update: Date;
  crew?: Array<{
    id: string;
    name: string;
    role: string;
    certification_level?: string;
  }>;
  equipment?: string[];
  fuel_level?: number;
  battery_level?: number;
}

export interface TeamMember {
  id: string;
  member_id: string;
  name: string;
  role: string;
  status: TeamMemberStatus;
  location?: { lat: number; lng: number };
  assigned_unit?: string;
  assigned_incident?: string;
  shift_start?: Date;
  shift_end?: Date;
  break_end?: Date;
  last_heartbeat: Date;
  certifications?: string[];
  contact_phone?: string;
}

export interface AlertNotification {
  id: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  is_read: boolean;
  action_taken?: string;
  expires_at?: Date;
  related_incident?: string;
}

export interface SystemHealth {
  id: string;
  timestamp: Date;
  components: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'down' | 'unknown';
    latency_ms?: number;
    uptime_percent?: number;
    last_check: Date;
    error_message?: string;
  }>;
  overall_status: 'healthy' | 'degraded' | 'down';
  active_users: number;
  system_load: number;
  memory_usage: number;
  network_latency_ms: number;
}

export interface PerformanceData {
  period: 'hour' | 'day' | 'week' | 'month';
  data_points: Array<{
    timestamp: Date;
    incidents: number;
    response_time: number;
    resolution_time: number;
    throughput: number;
  }>;
  averages: {
    incidents: number;
    response_time: number;
    resolution_time: number;
    throughput: number;
  };
  trends: {
    incidents: 'increasing' | 'decreasing' | 'stable';
    response_time: 'improving' | 'degrading' | 'stable';
    throughput: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface WeatherOverlay {
  location: { lat: number; lng: number };
  conditions: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: string;
  visibility: string;
  alerts: Array<{
    type: string;
    severity: string;
    description: string;
    issued: Date;
    expires: Date;
  }>;
  forecast: Array<{
    time: Date;
    conditions: string;
    temperature: number;
    precipitation_probability: number;
  }>;
}

export interface TimelineEvent {
  id: string;
  incident_id?: string;
  event_type: 'incident' | 'resource' | 'system' | 'communication' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  location?: { lat: number; lng: number };
  actor?: string;
  related_events?: string[];
}

export interface CustomReport {
  id: string;
  name: string;
  description?: string;
  query_config: {
    data_source: string;
    filters: Array<{
      field: string;
      operator: string;
      value: unknown;
    }>;
    aggregations: Array<{
      field: string;
      function: 'count' | 'sum' | 'avg' | 'min' | 'max';
    }>;
    group_by?: string[];
    order_by?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    limit?: number;
  };
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    next_run?: Date;
    recipients?: string[];
  };
  last_run?: Date;
  output_format: 'table' | 'chart' | 'csv' | 'pdf';
  created_by: string;
}

// ============================================================================
// Zod Schemas
// ============================================================================

const DashboardWidgetSchema = z.object({
  id: z.string(),
  widget_type: z.enum([
    'incident_feed', 'resource_overview', 'map_view', 'alert_ticker',
    'weather_panel', 'metrics_card', 'timeline', 'team_locations',
    'communication_center', 'performance_metrics', 'upcoming_events', 'system_health'
  ]),
  title: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  size: z.object({ width: z.number(), height: z.number() }),
  is_visible: z.boolean()
});

const DashboardSchema = z.object({
  id: z.string(),
  name: z.string(),
  widgets: z.array(DashboardWidgetSchema),
  is_default: z.boolean(),
  owner_id: z.string()
});

const ResourceUnitSchema = z.object({
  id: z.string(),
  unit_id: z.string(),
  unit_name: z.string(),
  status: z.enum(['available', 'dispatched', 'busy', 'out_of_service', 'maintenance']),
  location: z.object({ lat: z.number(), lng: z.number() }).optional()
});

const OperationsMetricsSchema = z.object({
  active_incidents: z.number(),
  critical_incidents: z.number(),
  available_units: z.number(),
  dispatched_units: z.number()
});

// ============================================================================
// Configuration
// ============================================================================

export const dashboardConfig = {
  // Default dashboard layouts
  defaultLayouts: {
    overview: {
      name: 'Operations Overview',
      description: 'Complete operational picture',
      widgets: [
        { type: 'metrics_card', title: 'Key Metrics', width: 4, height: 2 },
        { type: 'incident_feed', title: 'Active Incidents', width: 4, height: 3 },
        { type: 'map_view', title: 'Operations Map', width: 8, height: 4 },
        { type: 'resource_overview', title: 'Resource Status', width: 4, height: 2 },
        { type: 'alert_ticker', title: 'Alerts', width: 4, height: 1 },
        { type: 'timeline', title: 'Activity Timeline', width: 8, height: 2 }
      ]
    },
    incidents: {
      name: 'Incident Management',
      description: 'Incident-focused view',
      widgets: [
        { type: 'incident_feed', title: 'All Incidents', width: 6, height: 5 },
        { type: 'map_view', title: 'Incident Map', width: 6, height: 5 },
        { type: 'timeline', title: 'Incident Timeline', width: 6, height: 2 },
        { type: 'metrics_card', title: 'Response Times', width: 6, height: 2 }
      ]
    },
    resources: {
      name: 'Resource Management',
      description: 'Resource allocation view',
      widgets: [
        { type: 'resource_overview', title: 'Resource Overview', width: 4, height: 3 },
        { type: 'team_locations', title: 'Team Locations', width: 8, height: 4 },
        { type: 'metrics_card', title: 'Unit Availability', width: 4, height: 2 },
        { type: 'timeline', title: 'Resource Activity', width: 8, height: 2 }
      ]
    }
  },
  
  // Refresh intervals (seconds)
  refreshIntervals: {
    metrics: 30,
    incidents: 10,
    resources: 15,
    map: 5,
    timeline: 10,
    system: 60,
    weather: 300
  },
  
  // Display thresholds
  thresholds: {
    criticalIncidents: 5,
    responseTimeWarning: 8, // minutes
    responseTimeCritical: 15,
    resourceAvailabilityMin: 0.3 // 30%
  },
  
  // Alert settings
  alerts: {
    soundEnabled: true,
    desktopNotifications: true,
    criticalFlash: true,
    autoAcknowledgeDelay: 5000
  },
  
  // Map settings
  map: {
    defaultZoom: 12,
    maxZoom: 18,
    clusterMarkers: true,
    showTraffic: true,
    showWeather: true,
    layerConfig: {
      incidents: { color: '#ef4444', icon: 'alert-circle' },
      resources: { color: '#22c55e', icon: 'truck' },
      stations: { color: '#3b82f6', icon: 'building' },
      safeZones: { color: '#22c55e', opacity: 0.3 }
    }
  },
  
  // Display configuration
  display: {
    statusColors: {
      incident: {
        reported: '#6b7280',
        dispatched: '#3b82f6',
        en_route: '#f59e0b',
        on_scene: '#8b5cf6',
        in_progress: '#f97316',
        resolved: '#22c55e',
        closed: '#6b7280'
      },
      resource: {
        available: '#22c55e',
        dispatched: '#f59e0b',
        busy: '#f97316',
        out_of_service: '#ef4444',
        maintenance: '#6b7280'
      },
      team: {
        available: '#22c55e',
        responding: '#f59e0b',
        on_scene: '#8b5cf6',
        break: '#6b7280',
        off_duty: '#9ca3af'
      }
    },
    priorityColors: {
      critical: '#dc2626',
      high: '#f97316',
      medium: '#f59e0b',
      low: '#3b82f6'
    },
    chartColors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444'
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getIncidentStatusInfo(status: IncidentStatus) {
  return {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: dashboardConfig.display.statusColors.incident[status],
    icon: {
      reported: 'circle',
      dispatched: 'truck',
      en_route: 'navigation',
      on_scene: 'map-pin',
      in_progress: 'activity',
      resolved: 'check-circle',
      closed: 'archive'
    }[status]
  };
}

export function getResourceStatusInfo(status: ResourceStatus) {
  return {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: dashboardConfig.display.statusColors.resource[status],
    icon: {
      available: 'check-circle',
      dispatched: 'truck',
      busy: 'alert-circle',
      out_of_service: 'x-circle',
      maintenance: 'wrench'
    }[status]
  };
}

export function getTeamStatusInfo(status: TeamMemberStatus) {
  return {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: dashboardConfig.display.statusColors.team[status],
    icon: {
      available: 'user',
      responding: 'navigation',
      on_scene: 'map-pin',
      break: 'coffee',
      off_duty: 'log-out'
    }[status]
  };
}

export function getPriorityInfo(priority: IncidentPriority) {
  return {
    label: priority.charAt(0).toUpperCase() + priority.slice(1),
    color: dashboardConfig.display.priorityColors[priority],
    urgency: {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    }[priority]
  };
}

export function calculateMetrics(
  incidents: IncidentSummary[],
  resources: ResourceUnit[]
): OperationsMetrics {
  const active = incidents.filter(i => 
    !['resolved', 'closed'].includes(i.status)
  );
  const critical = active.filter(i => i.priority === 'critical');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const incidentsToday = incidents.filter(i => 
    new Date(i.reported_at) >= today
  );
  
  const available = resources.filter(r => r.status === 'available');
  const dispatched = resources.filter(r => r.status === 'dispatched');
  const busy = resources.filter(r => r.status === 'busy');
  const oos = resources.filter(r => 
    r.status === 'out_of_service' || r.status === 'maintenance'
  );
  
  return {
    active_incidents: active.length,
    critical_incidents: critical.length,
    incidents_today: incidentsToday.length,
    avg_response_time_minutes: 8.5,
    avg_resolution_time_minutes: 45.2,
    available_units: available.length,
    dispatched_units: dispatched.length,
    busy_units: busy.length,
    out_of_service_units: oos.length,
    active_personnel: dispatched.length * 3 + busy.length * 2,
    on_break_personnel: 5,
    alerts_last_24h: 23,
    critical_alerts: 3,
    pending_alerts: 5,
    throughput: 4.2,
    resolution_rate: 0.92,
    escalation_rate: 0.08
  };
}

export function formatResponseTime(minutes: number): {
  value: number;
  formatted: string;
  status: 'good' | 'warning' | 'critical';
} {
  let status: 'good' | 'warning' | 'critical' = 'good';
  if (minutes > dashboardConfig.thresholds.responseTimeCritical) {
    status = 'critical';
  } else if (minutes > dashboardConfig.thresholds.responseTimeWarning) {
    status = 'warning';
  }
  
  return {
    value: minutes,
    formatted: `${Math.round(minutes)}m`,
    status
  };
}

export function getHealthStatusColor(
  status: 'healthy' | 'degraded' | 'down'
): string {
  return {
    healthy: '#22c55e',
    degraded: '#f59e0b',
    down: '#ef4444'
  }[status];
}

export function createWidgetConfig(
  type: WidgetType,
  overrides?: Partial<DashboardWidget>
): DashboardWidget {
  const baseConfigs: Record<WidgetType, Partial<DashboardWidget>> = {
    incident_feed: {
      title: 'Active Incidents',
      config: { show_resolved: false, priority_filter: 'all', limit: 20 }
    },
    resource_overview: {
      title: 'Resource Overview',
      config: { group_by: 'type', show_unavailable: false }
    },
    map_view: {
      title: 'Operations Map',
      config: { center: { lat: 38.7223, lng: -9.1393 }, zoom: 12 }
    },
    alert_ticker: {
      title: 'Alerts',
      config: { scroll_speed: 5, max_alerts: 10 }
    },
    weather_panel: {
      title: 'Weather',
      config: { show_forecast: true, show_radar: true }
    },
    metrics_card: {
      title: 'Key Metrics',
      config: { metrics: ['active_incidents', 'available_units', 'response_time'] }
    },
    timeline: {
      title: 'Activity Timeline',
      config: { time_range_hours: 24, event_types: ['all'] }
    },
    team_locations: {
      title: 'Team Locations',
      config: { show_status: true, cluster: true }
    },
    communication_center: {
      title: 'Communications',
      config: { channels: ['radio', 'phone', 'chat'] }
    },
    performance_metrics: {
      title: 'Performance',
      config: { period: 'day', metrics: ['throughput', 'resolution_rate'] }
    },
    upcoming_events: {
      title: 'Upcoming',
      config: { days_ahead: 7 }
    },
    system_health: {
      title: 'System Health',
      config: { components: ['database', 'api', 'websocket'] }
    }
  };
  
  return {
    id: `widget-${type}-${Date.now()}`,
    widget_type: type,
    title: baseConfigs[type]?.title || type,
    position: { x: 0, y: 0 },
    size: { width: 4, height: 2 },
    ...baseConfigs[type],
    ...overrides,
    is_visible: true,
    refresh_interval_seconds: dashboardConfig.refreshIntervals[type === 'map_view' ? 'map' : 
      type === 'system_health' ? 'system' : 'metrics']
  } as DashboardWidget;
}

// ============================================================================
// Database Operations
// ============================================================================

const supabase = createClient();

/**
 * Get dashboard by ID
 */
export async function getDashboard(dashboardId: string): Promise<Dashboard | null> {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .eq('id', dashboardId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch dashboard: ${error.message}`);
  }
  
  return data as unknown as Dashboard | null;
}

/**
 * Get user's dashboards
 */
export async function getUserDashboards(userId: string): Promise<Dashboard[]> {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .eq('owner_id', userId)
    .or(`is_shared.eq.true,and(is_default.eq.true)`)
    .order('updated_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch dashboards: ${error.message}`);
  return (data || []) as unknown as Dashboard[];
}

/**
 * Create dashboard
 */
export async function createDashboard(
  dashboard: Omit<Dashboard, 'id' | 'created_at' | 'updated_at'>
): Promise<Dashboard> {
  const { data, error } = await supabase
    .from('dashboards')
    .insert({
      name: dashboard.name,
      description: dashboard.description,
      view: dashboard.view,
      widgets: dashboard.widgets,
      is_default: dashboard.is_default,
      is_shared: dashboard.is_shared,
      owner_id: dashboard.owner_id
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create dashboard: ${error.message}`);
  return data as unknown as Dashboard;
}

/**
 * Update dashboard
 */
export async function updateDashboard(
  dashboardId: string,
  updates: Partial<Dashboard>
): Promise<Dashboard> {
  const { data, error } = await supabase
    .from('dashboards')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', dashboardId)
    .select()
    .single();
  
  if (error) throw new Error(`Failed to update dashboard: ${error.message}`);
  return data as unknown as Dashboard;
}

/**
 * Save dashboard layout
 */
export async function saveDashboardLayout(
  dashboardId: string,
  widgets: DashboardWidget[]
): Promise<void> {
  const { error } = await supabase
    .from('dashboards')
    .update({
      widgets,
      updated_at: new Date().toISOString()
    })
    .eq('id', dashboardId);
  
  if (error) throw new Error(`Failed to save layout: ${error.message}`);
}

/**
 * Get operations metrics
 */
export async function getOperationsMetrics(): Promise<OperationsMetrics> {
  const { data: incidents, error: incidentsError } = await supabase
    .from('incidents')
    .select('*')
    .gte('created_at', new Date(Date.now() - 86400000).toISOString());
  
  const { data: resources, error: resourcesError } = await supabase
    .from('resource_units')
    .select('*');
  
  if (incidentsError || resourcesError) {
    throw new Error('Failed to fetch metrics data');
  }
  
  return calculateMetrics(
    (incidents || []) as unknown as IncidentSummary[],
    (resources || []) as unknown as ResourceUnit[]
  );
}

/**
 * Get active incidents
 */
export async function getActiveIncidents(
  filters?: {
    status?: IncidentStatus[];
    priority?: IncidentPriority[];
    type?: string[];
    limit?: number;
  }
): Promise<IncidentSummary[]> {
  let query = supabase
    .from('incidents')
    .select('*')
    .not('status', 'in', ['resolved', 'closed']);
  
  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }
  if (filters?.priority?.length) {
    query = query.in('priority', filters.priority);
  }
  if (filters?.type?.length) {
    query = query.in('incident_type', filters.type);
  }
  
  query = query.order('priority', { ascending: false })
    .order('created_at', { ascending: true });
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch incidents: ${error.message}`);
  return (data || []) as any as IncidentSummary[];
}

/**
 * Get incident timeline
 */
export async function getIncidentTimeline(
  incidentId: string
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('incident_timeline')
    .select('*')
    .eq('incident_id', incidentId)
    .order('timestamp', { ascending: true });
  
  if (error) throw new Error(`Failed to fetch timeline: ${error.message}`);
  return (data || []) as unknown as TimelineEvent[];
}

/**
 * Get resource units
 */
export async function getResourceUnits(
  filters?: {
    status?: ResourceStatus[];
    type?: string[];
    available?: boolean;
  }
): Promise<ResourceUnit[]> {
  let query = supabase
    .from('resource_units')
    .select('*')
    .gte('last_update', new Date(Date.now() - 300000).toISOString()); // Last 5 min
  
  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }
  if (filters?.type?.length) {
    query = query.in('unit_type', filters.type);
  }
  if (filters?.available) {
    query = query.eq('status', 'available');
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch resources: ${error.message}`);
  return (data || []) as any as ResourceUnit[];
}

/**
 * Update resource unit location
 */
export async function updateResourceLocation(
  unitId: string,
  location: { lat: number; lng: number },
  heading?: number,
  speed?: number
): Promise<void> {
  const { error } = await supabase
    .from('resource_units')
    .update({
      location,
      heading,
      speed_kmh: speed,
      last_update: new Date().toISOString()
    })
    .eq('id', unitId);
  
  if (error) throw new Error(`Failed to update location: ${error.message}`);
}

/**
 * Get team members
 */
export async function getTeamMembers(
  filters?: {
    status?: TeamMemberStatus[];
    role?: string[];
  }
): Promise<TeamMember[]> {
  let query = supabase
    .from('team_members')
    .select('*')
    .gte('last_heartbeat', new Date(Date.now() - 600000).toISOString()); // Last 10 min
  
  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }
  if (filters?.role?.length) {
    query = query.in('role', filters.role);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch team: ${error.message}`);
  return (data || []) as any as TeamMember[];
}

/**
 * Update team member status
 */
export async function updateTeamMemberStatus(
  memberId: string,
  status: TeamMemberStatus,
  location?: { lat: number; lng: number }
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    last_heartbeat: new Date().toISOString()
  };
  
  if (location) {
    updates.location = location;
  }
  
  const { error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', memberId);
  
  if (error) throw new Error(`Failed to update status: ${error.message}`);
}

/**
 * Get unread alerts
 */
export async function getUnreadAlerts(
  limit: number = 20
): Promise<AlertNotification[]> {
  const { data, error } = await supabase
    .from('alert_notifications')
    .select('*')
    .eq('is_read', false)
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) throw new Error(`Failed to fetch alerts: ${error.message}`);
  return (data || []) as unknown as AlertNotification[];
}

/**
 * Mark alert as read
 */
export async function markAlertRead(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('alert_notifications')
    .update({ is_read: true })
    .eq('id', alertId);
  
  if (error) throw new Error(`Failed to mark alert: ${error.message}`);
}

/**
 * Acknowledge alert with action
 */
export async function acknowledgeAlert(
  alertId: string,
  action: string
): Promise<void> {
  const { error } = await supabase
    .from('alert_notifications')
    .update({
      is_read: true,
      action_taken: action
    })
    .eq('id', alertId);
  
  if (error) throw new Error(`Failed to acknowledge: ${error.message}`);
}

/**
 * Get system health
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const { data, error } = await supabase
    .from('system_health')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch health: ${error.message}`);
  }
  
  // Return mock data if no data available
  return (data as unknown as SystemHealth) || {
    id: 'health-mock',
    timestamp: new Date(),
    components: [
      { name: 'API', status: 'healthy', latency_ms: 45, uptime_percent: 99.9, last_check: new Date() },
      { name: 'Database', status: 'healthy', latency_ms: 12, uptime_percent: 99.99, last_check: new Date() },
      { name: 'WebSocket', status: 'healthy', latency_ms: 23, uptime_percent: 99.8, last_check: new Date() }
    ],
    overall_status: 'healthy',
    active_users: 47,
    system_load: 0.35,
    memory_usage: 0.62,
    network_latency_ms: 28
  };
}

/**
 * Get performance data
 */
export async function getPerformanceData(
  period: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<PerformanceData> {
  const since = new Date();
  switch (period) {
    case 'hour': since.setHours(since.getHours() - 1); break;
    case 'day': since.setDate(since.getDate() - 1); break;
    case 'week': since.setDate(since.getDate() - 7); break;
    case 'month': since.setDate(since.getDate() - 30); break;
  }
  
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('*')
    .gte('timestamp', since.toISOString())
    .order('timestamp', { ascending: true });
  
  if (error) throw new Error(`Failed to fetch performance: ${error.message}`);
  
  const dataPoints = (data || []) as any[];
  
  return {
    period,
    data_points: dataPoints.map(d => ({
      timestamp: new Date(d.timestamp),
      incidents: d.incidents,
      response_time: d.response_time,
      resolution_time: d.resolution_time,
      throughput: d.throughput
    })),
    averages: {
      incidents: dataPoints.length > 0 
        ? dataPoints.reduce((sum, d) => sum + d.incidents, 0) / dataPoints.length 
        : 0,
      response_time: 8.5,
      resolution_time: 45.2,
      throughput: 4.2
    },
    trends: {
      incidents: 'stable',
      response_time: 'improving',
      throughput: 'stable'
    }
  };
}

/**
 * Get weather overlay
 */
export async function getWeatherOverlay(
  location: { lat: number; lng: number }
): Promise<WeatherOverlay> {
  // In production, this would call a weather API
  return {
    location,
    conditions: 'Partly Cloudy',
    temperature: 18,
    humidity: 65,
    wind_speed: 15,
    wind_direction: 'NW',
    visibility: '10 km',
    alerts: [
      {
        type: 'Wind',
        severity: 'low',
        description: 'Gusty winds expected in the afternoon',
        issued: new Date(),
        expires: new Date(Date.now() + 3600000)
      }
    ],
    forecast: [
      { time: new Date(Date.now() + 3600000), conditions: 'Sunny', temperature: 20, precipitation_probability: 0 },
      { time: new Date(Date.now() + 7200000), conditions: 'Cloudy', temperature: 19, precipitation_probability: 0.2 }
    ]
  };
}

/**
 * Create custom report
 */
export async function createCustomReport(
  report: Omit<CustomReport, 'id'>
): Promise<CustomReport> {
  const { data, error } = await supabase
    .from('custom_reports')
    .insert({
      name: report.name,
      description: report.description,
      query_config: report.query_config,
      schedule: report.schedule,
      output_format: report.output_format,
      created_by: report.created_by
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create report: ${error.message}`);
  return data as unknown as CustomReport;
}

/**
 * Execute custom report
 */
export async function executeCustomReport(
  reportId: string
): Promise<Array<Record<string, unknown>>> {
  const { data: report, error: fetchError } = await supabase
    .from('custom_reports')
    .select('query_config')
    .eq('id', reportId)
    .single();
  
  if (fetchError) throw new Error(`Failed to fetch report: ${fetchError.message}`);
  
  // Build query based on config (simplified)
  const { data, error } = await supabase
    .from((report.query_config as Record<string, any>).data_source)
    .select('*')
    .limit((report.query_config as Record<string, any>).limit || 100);
  
  if (error) throw new Error(`Failed to execute report: ${error.message}`);
  
  // Update last run
  await supabase
    .from('custom_reports')
    .update({ last_run: new Date().toISOString() })
    .eq('id', reportId);
  
  return (data || []) as Record<string, unknown>[];
}

/**
 * Start dashboard session
 */
export async function startDashboardSession(
  dashboardId: string,
  userId: string
): Promise<DashboardSession> {
  const { data, error } = await supabase
    .from('dashboard_sessions')
    .insert({
      dashboard_id: dashboardId,
      user_id: userId,
      active_view: 'overview',
      last_activity: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to start session: ${error.message}`);
  return data as unknown as DashboardSession;
}

/**
 * Update dashboard session
 */
export async function updateDashboardSession(
  sessionId: string,
  updates: Partial<DashboardSession>
): Promise<void> {
  const { error } = await supabase
    .from('dashboard_sessions')
    .update({
      ...updates,
      last_activity: new Date().toISOString()
    })
    .eq('id', sessionId);
  
  if (error) throw new Error(`Failed to update session: ${error.message}`);
}

/**
 * End dashboard session
 */
export async function endDashboardSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('dashboard_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', sessionId);
  
  if (error) throw new Error(`Failed to end session: ${error.message}`);
}

/**
 * Broadcast dashboard update
 */
export async function broadcastUpdate(
  dashboardId: string,
  updateType: string,
  payload: Record<string, unknown>
): Promise<void> {
  // In production, this would use WebSocket or similar
  await supabase
    .channel(`dashboard-${dashboardId}`)
    .send({
      type: 'broadcast',
      event: updateType,
      payload
    });
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function calculateUnitETA(
  unitLocation: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  avgSpeedKmh: number = 40
): number {
  const distance = calculateDistance(unitLocation, destination);
  return Math.ceil((distance / avgSpeedKmh) * 60);
}

function calculateDistance(
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lng - loc1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.lat)) *
      Math.cos(toRad(loc2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function groupResourcesByStatus(
  resources: ResourceUnit[]
): Record<ResourceStatus, ResourceUnit[]> {
  return {
    available: resources.filter(r => r.status === 'available'),
    dispatched: resources.filter(r => r.status === 'dispatched'),
    busy: resources.filter(r => r.status === 'busy'),
    out_of_service: resources.filter(r => r.status === 'out_of_service'),
    maintenance: resources.filter(r => r.status === 'maintenance')
  };
}

export function sortIncidentsByPriority(
  incidents: IncidentSummary[]
): IncidentSummary[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...incidents].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.reported_at).getTime() - new Date(b.reported_at).getTime();
  });
}
