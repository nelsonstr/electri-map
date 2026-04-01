// Resource Types for Support System

export type ResourceType =
  | 'personnel'
  | 'equipment'
  | 'vehicle'
  | 'material';

export type resource_type = ResourceType;
export type resourceType = ResourceType;

export type ResourceStatus =
  | 'available'
  | 'in_use'
  | 'maintenance'
  | 'out_of_service'
  | 'reserved';

export type resource_status = ResourceStatus;

export interface ResourceLocation {
  latitude?: number;
  longitude?: number;
  current_location?: string;
}

export interface ResourceFormData {
  resource_code: string;
  name: string;
  description?: string;
  resource_type: ResourceType;
  status?: ResourceStatus;
  user_id?: string;
  skills?: string[];
  certifications?: string[];
  serial_number?: string;
  model_number?: string;
  location?: ResourceLocation;
  capacity?: number;
  unit_of_measure?: string;
  assigned_team?: string;
  hourly_rate?: number;
  daily_rate?: number;
  purchase_cost?: number;
  purchase_date?: string;
  warranty_expiry?: string;
  available_from?: string;
  available_until?: string;
}

export interface Resource {
  id: string;
  resource_code: string;
  name: string;
  description?: string;
  resource_type: ResourceType;
  status: ResourceStatus;
  user_id?: string;
  skills: string[];
  certifications: string[];
  serial_number?: string;
  model_number?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  location: ResourceLocation;
  capacity?: number;
  unit_of_measure?: string;
  assigned_team?: string;
  hourly_rate?: number;
  daily_rate?: number;
  purchase_cost?: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_notes?: string;
  available_from?: string;
  available_until?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ResourceAllocationFormData {
  resource_id: string;
  allocation_type: 'service_request' | 'incident' | 'work_order' | 'maintenance';
  target_id: string;
  quantity?: number;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface ResourceAllocation {
  id: string;
  resource_id: string;
  allocation_type: string;
  target_id: string;
  quantity: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  actual_start_time?: string;
  actual_end_time?: string;
  notes?: string;
  allocated_by?: string;
  created_at: string;
  updated_at: string;
  released_at?: string;
  release_reason?: string;
}

export interface ResourceListParams {
  resource_type?: ResourceType[];
  status?: ResourceStatus[];
  assigned_team?: string;
  skills?: string[];
  lat?: number;
  lng?: number;
  radius_km?: number;
  available_from?: string;
  available_until?: string;
  limit?: number;
  offset?: number;
}

export interface ResourceAllocationParams {
  resource_type?: ResourceType[];
  allocation_type: string;
  target_id: string;
  start_time: string;
  end_time: string;
  required_skills?: string[];
  required_equipment?: string[];
  quantity?: number;
}

export interface ResourceStats {
  total_resources: number;
  available_resources: number;
  in_use_resources: number;
  under_maintenance: number;
  out_of_service: number;
  by_type: Record<ResourceType, number>;
  by_status: Record<ResourceStatus, number>;
}

export interface ResourceAllocationStats {
  active_allocations: number;
  pending_requests: number;
  resources_utilization_rate: number;
}

export interface ResourceUpdateData {
  name?: string;
  description?: string;
  status?: ResourceStatus;
  location?: ResourceLocation;
  skills?: string[];
  certifications?: string[];
  assigned_team?: string;
  available_from?: string;
  available_until?: string;
  hourly_rate?: number;
  daily_rate?: number;
}

export interface BulkResourceAllocation {
  resource_ids: string[];
  allocation_type: string;
  target_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface ResourceAvailability {
  resource_id: string;
  is_available: boolean;
  available_from?: string;
  available_until?: string;
  conflicting_allocations: ResourceAllocation[];
}

export type ResourceFilter = {
  search?: string;
  resource_type?: ResourceType[];
  status?: ResourceStatus[];
  assigned_team?: string;
  skills?: string[];
};

export type ResourceAllocationFilter = {
  resource_id?: string;
  allocation_type?: string;
  target_id?: string;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
};
