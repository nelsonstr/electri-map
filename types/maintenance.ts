// Maintenance Types for Support System

export type MaintenanceType =
  | 'preventive'
  | 'predictive'
  | 'corrective'
  | 'emergency';

export type maintenance_type = MaintenanceType;
export type maintenanceType = MaintenanceType;

export type MaintenanceScheduleStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'delayed';

export type maintenance_schedule_status = MaintenanceScheduleStatus;

export type WorkOrderStatus =
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type work_order_status = WorkOrderStatus;

export type WorkOrderType =
  | 'maintenance'
  | 'repair'
  | 'emergency'
  | 'inspection';

export type workOrderType = WorkOrderType;

// Export WorkOrder interface
export interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  description?: string;
  work_order_type: WorkOrderType;
  status: WorkOrderStatus;
  priority: 'trivial' | 'minor' | 'major' | 'critical';
  is_emergency: boolean;
  category_id?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  source_type: string;
  source_id?: string;
  assigned_department?: string;
  assigned_team?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
  asset_id?: string;
  asset_location_lat?: number;
  asset_location_lng?: number;
}

export interface SensorThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  value: number;
  unit: string;
}

export interface MaintenanceFormData {
  name: string;
  description: string;
  maintenance_type: MaintenanceType;
  category_id?: string;
  location?: MaintenanceLocation;
  frequency?: string;
  next_scheduled_date: string;
  estimated_duration_hours?: number;
  required_skills?: string[];
  required_equipment?: string[];
  special_instructions?: string;
  safety_requirements?: string;
  trigger_conditions?: SensorThreshold[];
}

export interface MaintenanceSchedule {
  id: string;
  schedule_number: string;
  name: string;
  description?: string;
  maintenance_type: MaintenanceType;
  category_id?: string;
  asset_id?: string;
  asset_location_lat?: number;
  asset_location_lng?: number;
  status: MaintenanceScheduleStatus;
  frequency?: string;
  next_scheduled_date?: string;
  last_completed_date?: string;
  trigger_conditions?: SensorThreshold[];
  last_sensor_reading?: Record<string, unknown>;
  assigned_department?: string;
  assigned_team?: string;
  generated_work_order_id?: string;
  estimated_duration?: number;
  actual_duration?: number;
  required_skills: string[];
  required_equipment: string[];
  special_instructions?: string;
  safety_requirements?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface WorkOrderFormData {
  title: string;
  description: string;
  work_order_type: WorkOrderType;
  priority?: 'trivial' | 'minor' | 'major' | 'critical';
  category_id?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  source_type: string;
  source_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_cost?: number;
  internal_notes?: string;
  public_notes?: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  description?: string;
  work_order_type: WorkOrderType;
  status: WorkOrderStatus;
  priority: 'trivial' | 'minor' | 'major' | 'critical';
  is_emergency: boolean;
  category_id?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  source_type: string;
  source_id?: string;
  assigned_department?: string;
  assigned_team?: string;
  assigned_to?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  progress_percentage: number;
  completion_notes?: string;
  estimated_cost?: number;
  actual_cost?: number;
  incident_id?: string;
  service_request_id?: string;
  maintenance_schedule_id?: string;
  materials_used: MaterialUsage[];
  internal_notes?: string;
  public_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  completed_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface MaterialUsage {
  material_id: string;
  material_name: string;
  quantity: number;
  unit_of_measure: string;
}

export interface MaintenanceListParams {
  status?: MaintenanceScheduleStatus[];
  maintenance_type?: MaintenanceType[];
  category_id?: string;
  assigned_department?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface WorkOrderListParams {
  status?: WorkOrderStatus[];
  work_order_type?: WorkOrderType[];
  priority?: string[];
  category_id?: string;
  assigned_to?: string;
  assigned_department?: string;
  source_type?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface MaintenanceStats {
  total_schedules: number;
  upcoming_schedules: number;
  completed_this_month: number;
  overdue_schedules: number;
  by_type: Record<MaintenanceType, number>;
  by_status: Record<MaintenanceScheduleStatus, number>;
}

export interface WorkOrderStats {
  total_work_orders: number;
  active_work_orders: number;
  completed_this_week: number;
  overdue_work_orders: number;
  by_status: Record<WorkOrderStatus, number>;
  by_priority: Record<string, number>;
}

export interface MaintenanceUpdateData {
  status?: MaintenanceScheduleStatus;
  next_scheduled_date?: string;
  estimated_duration?: number;
  assigned_department?: string;
  assigned_team?: string;
  special_instructions?: string;
}

export interface WorkOrderUpdateData {
  status?: WorkOrderStatus;
  priority?: 'trivial' | 'minor' | 'major' | 'critical';
  assigned_to?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  progress_percentage?: number;
  completion_notes?: string;
  materials_used?: MaterialUsage[];
}

export interface WorkOrderAssignment {
  assigned_to: string;
  assigned_team?: string;
}

export type MaintenanceFilter = {
  search?: string;
  status?: MaintenanceScheduleStatus[];
  maintenance_type?: MaintenanceType[];
  date_from?: string;
  date_to?: string;
  assigned_department?: string;
};

export type WorkOrderFilter = {
  search?: string;
  status?: WorkOrderStatus[];
  work_order_type?: WorkOrderType[];
  priority?: string[];
  date_from?: string;
  date_to?: string;
  assigned_to?: string;
  assigned_department?: string;
};
