-- Civic Issue Reporting Database Schema
-- Run this in Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- EXISTING ENUM TYPES (kept for backward compatibility)
-- ============================================================================

CREATE TYPE issue_category AS ENUM (
  'telecommunications',
  'road_damage',
  'electrical',
  'water_supply',
  'waste_management',
  'public_lighting',
  'traffic_signals',
  'sidewalks',
  'parks_recreation',
  'building_safety',
  'environmental',
  'other'
);

CREATE TYPE issue_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE issue_status AS ENUM (
  'submitted',
  'acknowledged',
  'in_progress',
  'pending_parts',
  'completed',
  'verified',
  'closed'
);

CREATE TYPE user_role AS ENUM (
  'citizen',
  'officer',
  'admin'
);

-- ============================================================================
-- NEW ENUM TYPES FOR SUPPORT SYSTEM
-- ============================================================================

-- Service request status
CREATE TYPE service_request_status AS ENUM (
  'new',
  'assigned',
  'in_progress',
  'pending_material',
  'pending_approval',
  'on_hold',
  'completed',
  'cancelled',
  'closed'
);

-- Service request priority (extended with more granular levels)
CREATE TYPE service_priority AS ENUM (
  'trivial',
  'minor',
  'major',
  'critical'
);

-- Incident severity classification
CREATE TYPE incident_severity AS ENUM (
  'low',
  'minor',
  'major',
  'critical'
);

-- Incident status
CREATE TYPE incident_status AS ENUM (
  'detected',
  'investigating',
  'triaging',
  'responding',
  'resolved',
  'closed',
  'false_alarm'
);

-- Work order status
CREATE TYPE work_order_status AS ENUM (
  'pending',
  'scheduled',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled'
);

-- Maintenance type
CREATE TYPE maintenance_type AS ENUM (
  'preventive',
  'predictive',
  'corrective',
  'emergency'
);

-- Maintenance schedule status
CREATE TYPE maintenance_schedule_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'delayed'
);

-- Resource type
CREATE TYPE resource_type AS ENUM (
  'personnel',
  'equipment',
  'vehicle',
  'material'
);

-- Resource availability status
CREATE TYPE resource_status AS ENUM (
  'available',
  'in_use',
  'maintenance',
  'out_of_service',
  'reserved'
);

-- Escalation trigger type
CREATE TYPE escalation_trigger_type AS ENUM (
  'time_based',
  'severity_based',
  'impact_based',
  'manual',
  'sla_breach'
);

-- Escalation level
CREATE TYPE escalation_level AS ENUM (
  'level_1',
  'level_2',
  'level_3',
  'level_4',
  'level_5',
  'emergency'
);

-- Communication channel type
CREATE TYPE communication_channel AS ENUM (
  'email',
  'sms',
  'push_notification',
  'phone',
  'in_app',
  'webhook'
);

-- Communication direction
CREATE TYPE communication_direction AS ENUM (
  'inbound',
  'outbound',
  'system'
);

-- SLA breach status
CREATE TYPE sla_breach_status AS ENUM (
  'pending',
  'warning',
  'breached',
  'extended'
);

-- Intake channel for service requests
CREATE TYPE intake_channel AS ENUM (
  'web',
  'mobile',
  'phone',
  'kiosk',
  'api',
  'email',
  'social_media',
  'walk_in'
);

-- ============================================================================
-- EXISTING TABLES (unchanged for backward compatibility)
-- ============================================================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role user_role DEFAULT 'citizen',
  department VARCHAR(100),
  notification_settings JSONB DEFAULT '{
    "email_notifications": true,
    "sms_notifications": false,
    "push_notifications": true,
    "status_updates": true,
    "nearby_reports": false
  }'::jsonb,
  language VARCHAR(10) DEFAULT 'en',
  accessibility_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  responsible_categories issue_category[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issues table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category issue_category NOT NULL,
  priority issue_priority NOT NULL,
  status issue_status DEFAULT 'submitted',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  neighborhood VARCHAR(255),
  city VARCHAR(255),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_name VARCHAR(255) NOT NULL,
  reporter_phone VARCHAR(50),
  assigned_department UUID REFERENCES departments(id),
  assigned_to UUID REFERENCES users(id),
  work_order_id VARCHAR(100),
  estimated_completion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_reporter ON issues(reporter_id);
CREATE INDEX idx_issues_location ON issues(latitude, longitude);
CREATE INDEX idx_issues_created ON issues(created_at DESC);
CREATE INDEX idx_issues_assigned_department ON issues(assigned_department);

-- Media attachments table
CREATE TABLE media_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('photo', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_media_issue ON media_attachments(issue_id);

-- Issue verifications table (crowdsourced)
CREATE TABLE issue_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  confirmed BOOLEAN NOT NULL,
  additional_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verifications_issue ON issue_verifications(issue_id);
CREATE INDEX idx_verifications_user ON issue_verifications(user_id);

-- Comments table
CREATE TABLE issue_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false,
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_issue ON issue_comments(issue_id);

-- Status history table (for tracking all changes)
CREATE TABLE issue_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  from_status issue_status,
  to_status issue_status NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_status_history_issue ON issue_status_history(issue_id);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Work orders integration table
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(100) UNIQUE NOT NULL,
  issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  department UUID REFERENCES departments(id),
  status VARCHAR(50),
  assigned_to VARCHAR(255),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_work_orders_external ON work_orders(external_id);
CREATE INDEX idx_work_orders_issue ON work_orders(issue_id);

-- ============================================================================
-- NEW TABLES FOR SUPPORT SYSTEM
-- ============================================================================

-- Service Categories table - hierarchical structure for 8 service categories
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES service_categories(id),
  icon VARCHAR(100),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_service_categories_parent ON service_categories(parent_category_id);
CREATE INDEX idx_service_categories_active ON service_categories(is_active);
CREATE INDEX idx_service_categories_code ON service_categories(code);

-- Service Requests table - enhanced request tracking with SLA and routing
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identification
  request_number VARCHAR(100) UNIQUE NOT NULL,
  intake_channel intake_channel NOT NULL,
  
  -- Content
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES service_categories(id),
  subcategory_id UUID REFERENCES service_categories(id),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  neighborhood VARCHAR(255),
  city VARCHAR(255),
  
  -- Priority and Status
  priority service_priority DEFAULT 'minor',
  status service_request_status DEFAULT 'new',
  
  -- Requester Info
  requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
  requester_name VARCHAR(255) NOT NULL,
  requester_email VARCHAR(255),
  requester_phone VARCHAR(50),
  
  -- Assignment
  assigned_department UUID REFERENCES departments(id),
  assigned_team UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  
  -- SLA Fields
  sla_id UUID REFERENCES sla_definitions(id),
  sla_response_deadline TIMESTAMP WITH TIME ZONE,
  sla_resolution_deadline TIMESTAMP WITH TIME ZONE,
  actual_response_at TIMESTAMP WITH TIME ZONE,
  actual_resolution_at TIMESTAMP WITH TIME ZONE,
  
  -- Escalation
  current_escalation_level escalation_level,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Related Records
  related_incident_id UUID, -- Will reference incidents table
  related_issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  work_order_id UUID, -- Will reference work_orders table
  
  -- Metadata
  customer_impact INTEGER DEFAULT 0, -- Number of affected customers
  is_anonymous BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurring_parent_id UUID, -- Reference to parent request for recurring issues
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

CREATE INDEX idx_service_requests_number ON service_requests(request_number);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_priority ON service_requests(priority);
CREATE INDEX idx_service_requests_category ON service_requests(category_id);
CREATE INDEX idx_service_requests_assigned_dept ON service_requests(assigned_department);
CREATE INDEX idx_service_requests_assigned_user ON service_requests(assigned_to);
CREATE INDEX idx_service_requests_location ON service_requests(latitude, longitude);
CREATE INDEX idx_service_requests_created ON service_requests(created_at DESC);
CREATE INDEX idx_service_requests_sla_deadline ON service_requests(sla_response_deadline, sla_resolution_deadline);
CREATE INDEX idx_service_requests_requester ON service_requests(requester_id);

-- Incidents table - incident lifecycle management with severity
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identification
  incident_number VARCHAR(100) UNIQUE NOT NULL,
  incident_type VARCHAR(100) NOT NULL,
  
  -- Classification
  severity incident_severity NOT NULL,
  status incident_status DEFAULT 'detected',
  
  -- Content
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  root_cause TEXT,
  resolution_summary TEXT,
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  affected_area_radius_km DECIMAL(10, 2),
  address TEXT,
  neighborhood VARCHAR(255),
  city VARCHAR(255),
  
  -- Impact
  affected_customers INTEGER DEFAULT 0,
  is_multi_area BOOLEAN DEFAULT false,
  affected_areas JSONB DEFAULT '[]'::jsonb,
  
  -- Assignment
  assigned_department UUID REFERENCES departments(id),
  assigned_team UUID REFERENCES users(id),
  incident_commander UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Escalation
  current_escalation_level escalation_level,
  escalation_history JSONB DEFAULT '[]'::jsonb,
  
  -- Related Records
  service_request_ids UUID[] DEFAULT '{}', -- Array of related service request IDs
  work_order_ids UUID[] DEFAULT '{}', -- Array of related work order IDs
  
  -- External Coordination
  external_agencies_notified JSONB DEFAULT '[]'::jsonb,
  external_incident_ref VARCHAR(255), -- Reference to external systems
  
  -- Timestamps
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  investigated_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Post-incident
  post_incident_review TEXT,
  lessons_learned TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_incidents_number ON incidents(incident_number);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_assigned_dept ON incidents(assigned_department);
CREATE INDEX idx_incidents_commander ON incidents(incident_commander);
CREATE INDEX idx_incidents_location ON incidents(latitude, longitude);
CREATE INDEX idx_incidents_detected ON incidents(detected_at DESC);
CREATE INDEX idx_incidents_severity_status ON incidents(severity, status);

-- Maintenance Schedule table - preventive and predictive maintenance
CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identification
  schedule_number VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  maintenance_type maintenance_type NOT NULL,
  
  -- Category
  category_id UUID REFERENCES service_categories(id),
  asset_id VARCHAR(255), -- Reference to asset management system
  asset_location_lat DECIMAL(10, 8),
  asset_location_lng DECIMAL(11, 8),
  
  -- Schedule Details
  status maintenance_schedule_status DEFAULT 'scheduled',
  frequency VARCHAR(100), -- e.g., 'monthly', 'quarterly', 'annually'
  next_scheduled_date TIMESTAMP WITH TIME ZONE,
  last_completed_date TIMESTAMP WITH TIME ZONE,
  
  -- Predictive Maintenance Data
  trigger_conditions JSONB DEFAULT '{}'::jsonb, -- Sensor thresholds, etc.
  last_sensor_reading JSONB,
  
  -- Assignment
  assigned_department UUID REFERENCES departments(id),
  assigned_team UUID REFERENCES users(id),
  
  -- Work Order Reference
  generated_work_order_id UUID, -- Reference to work_orders table
  
  -- Estimated Duration (hours)
  estimated_duration DECIMAL(8, 2),
  actual_duration DECIMAL(8, 2),
  
  -- Required Resources
  required_skills JSONB DEFAULT '[]'::jsonb,
  required_equipment JSONB DEFAULT '[]'::jsonb,
  
  -- Notes
  special_instructions TEXT,
  safety_requirements TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

CREATE INDEX idx_maintenance_schedules_number ON maintenance_schedules(schedule_number);
CREATE INDEX idx_maintenance_schedules_type ON maintenance_schedules(maintenance_type);
CREATE INDEX idx_maintenance_schedules_status ON maintenance_schedules(status);
CREATE INDEX idx_maintenance_schedules_next_date ON maintenance_schedules(next_scheduled_date);
CREATE INDEX idx_maintenance_schedules_category ON maintenance_schedules(category_id);
CREATE INDEX idx_maintenance_schedules_assigned_dept ON maintenance_schedules(assigned_department);

-- Work Orders table - generated maintenance/repair work orders
CREATE TABLE maintenance_work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identification
  work_order_number VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Type and Status
  work_order_type VARCHAR(50) NOT NULL, -- 'maintenance', 'repair', 'emergency', 'inspection'
  status work_order_status DEFAULT 'pending',
  
  -- Priority
  priority service_priority DEFAULT 'minor',
  is_emergency BOOLEAN DEFAULT false,
  
  -- Category
  category_id UUID REFERENCES service_categories(id),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  
  -- Source
  source_type VARCHAR(50), -- 'service_request', 'incident', 'maintenance_schedule', 'manual'
  source_id UUID, -- Reference to source record
  
  -- Assignment
  assigned_department UUID REFERENCES departments(id),
  assigned_team UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  
  -- Schedule
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  
  -- Progress
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  completion_notes TEXT,
  
  -- Cost
  estimated_cost DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  
  -- Related Records
  incident_id UUID, -- Reference to incidents table
  service_request_id UUID, -- Reference to service_requests table
  maintenance_schedule_id UUID, -- Reference to maintenance_schedules table
  
  -- Materials Used
  materials_used JSONB DEFAULT '[]'::jsonb,
  
  -- Notes
  internal_notes TEXT,
  public_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

CREATE INDEX idx_work_orders_number ON maintenance_work_orders(work_order_number);
CREATE INDEX idx_work_orders_status ON maintenance_work_orders(status);
CREATE INDEX idx_work_orders_priority ON maintenance_work_orders(priority);
CREATE INDEX idx_work_orders_type ON maintenance_work_orders(work_order_type);
CREATE INDEX idx_work_orders_assigned_user ON maintenance_work_orders(assigned_to);
CREATE INDEX idx_work_orders_assigned_dept ON maintenance_work_orders(assigned_department);
CREATE INDEX idx_work_orders_scheduled ON maintenance_work_orders(scheduled_start);
CREATE INDEX idx_work_orders_source ON maintenance_work_orders(source_type, source_id);

-- Resources table - personnel, equipment, and material tracking
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identification
  resource_code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Type
  resource_type resource_type NOT NULL,
  
  -- Status
  status resource_status DEFAULT 'available',
  
  -- Details based on type
  -- For personnel
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  -- For equipment/materials
  serial_number VARCHAR(255),
  model_number VARCHAR(255),
  purchase_date DATE,
  warranty_expiry DATE,
  -- Common
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  current_location TEXT,
  
  -- Capacity/Quantity
  capacity DECIMAL(10, 2), -- For vehicles: passengers, For materials: quantity
  unit_of_measure VARCHAR(50),
  
  -- Assignment
  assigned_team UUID REFERENCES users(id), -- Team responsible for this resource
  
  -- Cost
  hourly_rate DECIMAL(10, 2), -- For personnel/equipment rental
  daily_rate DECIMAL(10, 2),
  purchase_cost DECIMAL(12, 2),
  
  -- Maintenance
  last_maintenance_date TIMESTAMP WITH TIME ZONE,
  next_maintenance_date TIMESTAMP WITH TIME ZONE,
  maintenance_notes TEXT,
  
  -- Availability
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resources_code ON resources(resource_code);
CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_user ON resources(user_id);
CREATE INDEX idx_resources_team ON resources(assigned_team);

-- Resource Allocations table - assignment of resources to requests/incidents
CREATE TABLE resource_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Resource Reference
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  
  -- Allocation Target
  allocation_type VARCHAR(50) NOT NULL, -- 'service_request', 'incident', 'work_order', 'maintenance'
  target_id UUID NOT NULL, -- Reference to target record ID
  
  -- Assignment Details
  quantity DECIMAL(10, 2) DEFAULT 1,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  
  -- Assignment
  allocated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE,
  release_reason TEXT
);

CREATE INDEX idx_allocations_resource ON resource_allocations(resource_id);
CREATE INDEX idx_allocations_target ON resource_allocations(allocation_type, target_id);
CREATE INDEX idx_allocations_time ON resource_allocations(start_time, end_time);
CREATE INDEX idx_allocations_active ON resource_allocations(is_active);

-- Escalation Rules table - configurable escalation triggers and chains
CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Trigger Configuration
  trigger_type escalation_trigger_type NOT NULL,
  trigger_category_id UUID REFERENCES service_categories(id), -- NULL means all categories
  trigger_priority service_priority[], -- Array of priorities that trigger this rule
  trigger_severity incident_severity[], -- Array of severities that trigger this rule
  trigger_value INTEGER, -- Time in minutes for time-based triggers
  
  -- Escalation Configuration
  escalation_level escalation_level NOT NULL,
  escalate_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  escalate_to_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  escalate_to_team_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User group/team
  
  -- Behavior
  notify_original_owner BOOLEAN DEFAULT true,
  auto_assign BOOLEAN DEFAULT false,
  require_acknowledgment BOOLEAN DEFAULT false,
  acknowledgment_timeout_minutes INTEGER DEFAULT 30,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority_order INTEGER DEFAULT 0, -- Higher priority rules evaluated first
  
  -- Time Constraints
  valid_from TIME,
  valid_until TIME,
  valid_days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_escalation_rules_type ON escalation_rules(trigger_type);
CREATE INDEX idx_escalation_rules_category ON escalation_rules(trigger_category_id);
CREATE INDEX idx_escalation_rules_active ON escalation_rules(is_active);
CREATE INDEX idx_escalation_rules_priority ON escalation_rules(priority_order DESC);

-- Escalation History table - track escalations
CREATE TABLE escalation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- References
  entity_type VARCHAR(50) NOT NULL, -- 'service_request', 'incident'
  entity_id UUID NOT NULL,
  rule_id UUID REFERENCES escalation_rules(id) ON DELETE SET NULL,
  
  -- Escalation Details
  from_level VARCHAR(50),
  to_level escalation_level NOT NULL,
  trigger_type escalation_trigger_type NOT NULL,
  trigger_reason TEXT,
  
  -- Assignment Changes
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  from_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  to_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Timing
  time_to_escalate_minutes INTEGER,
  was_acknowledged BOOLEAN DEFAULT false,
  acknowledgment_time TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  escalated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_escalation_history_entity ON escalation_history(entity_type, entity_id);
CREATE INDEX idx_escalation_history_time ON escalation_history(created_at DESC);

-- Communication Logs table - all stakeholder communications
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- References
  entity_type VARCHAR(50) NOT NULL, -- 'service_request', 'incident', 'work_order'
  entity_id UUID NOT NULL,
  
  -- Communication Details
  channel communication_channel NOT NULL,
  direction communication_direction NOT NULL,
  
  -- Content
  subject TEXT,
  body TEXT,
  template_id VARCHAR(100), -- If generated from template
  template_variables JSONB DEFAULT '{}'::jsonb,
  
  -- Recipients
  from_address VARCHAR(255),
  to_addresses TEXT[], -- Array of recipient addresses
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  
  -- Delivery Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed, bounced
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  
  -- External Reference
  external_message_id VARCHAR(255), -- Provider's message ID
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_communication_logs_entity ON communication_logs(entity_type, entity_id);
CREATE INDEX idx_communication_logs_channel ON communication_logs(channel);
CREATE INDEX idx_communication_logs_status ON communication_logs(status);
CREATE INDEX idx_communication_logs_created ON communication_logs(created_at DESC);

-- SLA Definitions table - service level agreement configurations
CREATE TABLE sla_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Scope
  category_id UUID REFERENCES service_categories(id), -- NULL means default for all categories
  priority service_priority NOT NULL,
  is_default BOOLEAN DEFAULT false,
  
  -- Response Time (minutes)
  response_time_minutes INTEGER NOT NULL,
  
  -- Resolution Time (minutes)
  resolution_time_minutes INTEGER NOT NULL,
  
  -- Business Hours
  uses_business_hours BOOLEAN DEFAULT true,
  business_hours_start TIME DEFAULT '08:00:00',
  business_hours_end TIME DEFAULT '17:00:00',
  business_days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}', -- Mon-Fri
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Escalation Settings
  escalation_enabled BOOLEAN DEFAULT true,
  escalation_trigger_percentage INTEGER DEFAULT 75, -- Escalate at 75% of SLA time
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority_order INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sla_definitions_category ON sla_definitions(category_id);
CREATE INDEX idx_sla_definitions_priority ON sla_definitions(priority);
CREATE INDEX idx_sla_definitions_active ON sla_definitions(is_active);
CREATE INDEX idx_sla_definitions_default ON sla_definitions(is_default);

-- SLA Breach History table - track SLA breaches
CREATE TABLE sla_breach_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- References
  entity_type VARCHAR(50) NOT NULL, -- 'service_request', 'incident'
  entity_id UUID NOT NULL,
  sla_definition_id UUID REFERENCES sla_definitions(id) ON DELETE SET NULL,
  
  -- Breach Type
  breach_type VARCHAR(50) NOT NULL, -- 'response', 'resolution'
  
  -- Timing
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_time TIMESTAMP WITH TIME ZONE NOT NULL,
  breach_minutes INTEGER NOT NULL,
  
  -- Status
  status sla_breach_status DEFAULT 'pending',
  was_extended BOOLEAN DEFAULT false,
  extension_reason TEXT,
  
  -- Notifications
  warning_notified_at TIMESTAMP WITH TIME ZONE,
  breach_notified_at TIMESTAMP WITH TIME ZONE,
  
  -- Resolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sla_breach_entity ON sla_breach_history(entity_type, entity_id);
CREATE INDEX idx_sla_breach_status ON sla_breach_history(status);
CREATE INDEX idx_sla_breach_created ON sla_breach_history(created_at DESC);

-- Audit Log table - comprehensive audit trail
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Action Details
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete'
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  changed_fields JSONB, -- Array of field names that changed
  
  -- Actor
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_request ON audit_logs(request_id);

-- ============================================================================
-- EXISTING FUNCTIONS (unchanged for backward compatibility)
-- ============================================================================

-- Function to calculate response time
CREATE OR REPLACE FUNCTION calculate_response_time()
RETURNS TRIGGER AS $
DECLARE
  response_hours DECIMAL;
BEGIN
  IF NEW.acknowledged_at IS NOT NULL AND OLD.acknowledged_at IS NULL THEN
    NEW.actual_response_time_hours = EXTRACT(EPOCH FROM (NEW.acknowledged_at - NEW.created_at)) / 3600;
  END IF;
  IF NEW.completed_at IS NOT NULL THEN
    NEW.actual_completion_time_hours = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.created_at)) / 3600;
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_response_time_trigger
BEFORE UPDATE ON issues
FOR EACH ROW EXECUTE FUNCTION calculate_response_time();

-- ============================================================================
-- NEW FUNCTIONS AND TRIGGERS FOR SUPPORT SYSTEM
-- ============================================================================

-- Function to generate unique request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number = 'SR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
      LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Function to generate unique incident number
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.incident_number IS NULL THEN
    NEW.incident_number = 'INC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
      LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Function to generate unique work order number
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.work_order_number IS NULL THEN
    NEW.work_order_number = 'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
      LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Function to generate unique maintenance schedule number
CREATE OR REPLACE FUNCTION generate_maintenance_schedule_number()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.schedule_number IS NULL THEN
    NEW.schedule_number = 'MS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
      LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Function to calculate SLA deadline based on SLA definition
CREATE OR REPLACE FUNCTION calculate_sla_deadlines()
RETURNS TRIGGER AS $
DECLARE
  sla_record sla_definitions%ROWTYPE;
  response_deadline TIMESTAMP WITH TIME ZONE;
  resolution_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get SLA definition based on category and priority
  SELECT * INTO sla_record
  FROM sla_definitions
  WHERE (category_id = NEW.category_id OR (category_id IS NULL AND is_default))
    AND priority = NEW.priority
    AND is_active = true
  ORDER BY 
    CASE WHEN category_id IS NOT NULL THEN 0 ELSE 1 END,
    priority_order DESC
  LIMIT 1;
  
  IF FOUND THEN
    -- Calculate deadlines based on SLA settings
    IF sla_record.uses_business_hours THEN
      -- Business hours calculation (simplified - consider using a more sophisticated approach)
      response_deadline = NEW.created_at + (sla_record.response_time_minutes || ' minutes')::INTERVAL;
      resolution_deadline = NEW.created_at + (sla_record.resolution_time_minutes || ' minutes')::INTERVAL;
    ELSE
      response_deadline = NEW.created_at + (sla_record.response_time_minutes || ' minutes')::INTERVAL;
      resolution_deadline = NEW.created_at + (sla_record.resolution_time_minutes || ' minutes')::INTERVAL;
    END IF;
    
    NEW.sla_id = sla_record.id;
    NEW.sla_response_deadline = response_deadline;
    NEW.sla_resolution_deadline = resolution_deadline;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Function to check and create SLA breach
CREATE OR REPLACE FUNCTION check_sla_breach()
RETURNS TRIGGER AS $
DECLARE
  breach_record sla_breach_history%ROWTYPE;
BEGIN
  -- Check if response SLA is breached
  IF NEW.sla_response_deadline IS NOT NULL AND 
     NEW.actual_response_at IS NULL AND
     NOW() > NEW.sla_response_deadline THEN
    
    -- Check if breach record already exists
    SELECT * INTO breach_record
    FROM sla_breach_history
    WHERE entity_type = 'service_request'
      AND entity_id = NEW.id
      AND breach_type = 'response'
      AND status != 'breached';
    
    IF NOT FOUND THEN
      INSERT INTO sla_breach_history (
        entity_type, entity_id, breach_type, deadline, actual_time, breach_minutes, status
      ) VALUES (
        'service_request', NEW.id, 'response', NEW.sla_response_deadline, NOW(),
        EXTRACT(EPOCH FROM (NOW() - NEW.sla_response_deadline)) / 60,
        'breached'
      );
    END IF;
  END IF;
  
  -- Check if resolution SLA is breached
  IF NEW.sla_resolution_deadline IS NOT NULL AND 
     NEW.actual_resolution_at IS NULL AND
     NOW() > NEW.sla_resolution_deadline THEN
    
    SELECT * INTO breach_record
    FROM sla_breach_history
    WHERE entity_type = 'service_request'
      AND entity_id = NEW.id
      AND breach_type = 'resolution'
      AND status != 'breached';
    
    IF NOT FOUND THEN
      INSERT INTO sla_breach_history (
        entity_type, entity_id, breach_type, deadline, actual_time, breach_minutes, status
      ) VALUES (
        'service_request', NEW.id, 'resolution', NEW.sla_resolution_deadline, NOW(),
        EXTRACT(EPOCH FROM (NOW() - NEW.sla_resolution_deadline)) / 60,
        'breached'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Function to handle status changes and create audit log
CREATE OR REPLACE FUNCTION audit_status_change()
RETURNS TRIGGER AS $
DECLARE
  old_status_text TEXT;
  new_status_text TEXT;
  changed_fields JSONB;
BEGIN
  -- Determine which status field changed
  IF TG_TABLE_NAME = 'service_requests' THEN
    old_status_text := OLD.status::TEXT;
    new_status_text := NEW.status::TEXT;
    changed_fields := '["status"]'::JSONB;
  ELSIF TG_TABLE_NAME = 'incidents' THEN
    old_status_text := OLD.status::TEXT;
    new_status_text := NEW.status::TEXT;
    changed_fields := '["status"]'::JSONB;
  ELSIF TG_TABLE_NAME = 'maintenance_work_orders' THEN
    old_status_text := OLD.status::TEXT;
    new_status_text := NEW.status::TEXT;
    changed_fields := '["status"]'::JSONB;
  END IF;
  
  -- Create audit log entry
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    changed_fields,
    user_id,
    metadata
  ) VALUES (
    TG_TABLE_NAME::TEXT,
    COALESCE(NEW.id, OLD.id),
    'status_change',
    jsonb_build_object('status', old_status_text),
    jsonb_build_object('status', new_status_text),
    changed_fields,
    NEW.updated_by, -- Assumes updated_by field exists
    jsonb_build_object('trigger', 'status_change')
  );
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_support_timestamps()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  
  -- Set acknowledged_at when status changes to 'acknowledged' or 'assigned'
  IF TG_TABLE_NAME = 'service_requests' THEN
    IF NEW.status IN ('assigned', 'in_progress') AND OLD.status NOT IN ('assigned', 'in_progress') THEN
      NEW.acknowledged_at = NOW();
      NEW.actual_response_at = NOW();
    END IF;
    IF NEW.status = 'in_progress' AND OLD.status NOT IN ('in_progress', 'completed') THEN
      NEW.started_at = NOW();
    END IF;
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      NEW.completed_at = NOW();
      NEW.actual_resolution_at = NOW();
    END IF;
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
      NEW.closed_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Triggers for new tables
CREATE TRIGGER generate_service_request_number
  BEFORE INSERT ON service_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL)
  EXECUTE FUNCTION generate_request_number();

CREATE TRIGGER generate_incident_number
  BEFORE INSERT ON incidents
  FOR EACH ROW
  WHEN (NEW.incident_number IS NULL)
  EXECUTE FUNCTION generate_incident_number();

CREATE TRIGGER generate_work_order_number
  BEFORE INSERT ON maintenance_work_orders
  FOR EACH ROW
  WHEN (NEW.work_order_number IS NULL)
  EXECUTE FUNCTION generate_work_order_number();

CREATE TRIGGER generate_maintenance_schedule_number
  BEFORE INSERT ON maintenance_schedules
  FOR EACH ROW
  WHEN (NEW.schedule_number IS NULL)
  EXECUTE FUNCTION generate_maintenance_schedule_number();

CREATE TRIGGER calculate_service_request_sla
  BEFORE INSERT ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sla_deadlines();

CREATE TRIGGER check_service_request_sla_breach
  AFTER UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_sla_breach();

CREATE TRIGGER update_service_request_timestamps
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_support_timestamps();

CREATE TRIGGER update_incident_timestamps
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_support_timestamps();

CREATE TRIGGER update_work_order_timestamps
  BEFORE UPDATE ON maintenance_work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_support_timestamps();

CREATE TRIGGER update_maintenance_schedule_timestamps
  BEFORE UPDATE ON maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_support_timestamps();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default departments (if not exists)
INSERT INTO departments (name, code, description, responsible_categories) VALUES
('Public Works', 'PW', 'Infrastructure maintenance and repair', ARRAY['road_damage', 'sidewalks', 'public_lighting', 'traffic_signals']),
('Utilities', 'UTIL', 'Water, electricity, and gas services', ARRAY['water_supply', 'electrical']),
('Telecommunications', 'TELECOM', 'Internet and phone services', ARRAY['telecommunications']),
('Sanitation', 'SAN', 'Waste management and cleaning', ARRAY['waste_management']),
('Parks and Recreation', 'PARKS', 'Parks and recreational facilities', ARRAY['parks_recreation']),
('Building Safety', 'BLDG', 'Building code enforcement', ARRAY['building_safety']),
('Environmental Services', 'ENV', 'Environmental protection', ARRAY['environmental'])
ON CONFLICT (code) DO NOTHING;

-- Insert service categories (8 main categories with subcategories)
INSERT INTO service_categories (code, name, description, parent_category_id, icon, color, sort_order) VALUES
-- Level 1: Electrical Systems
('electrical', 'Electrical Systems', 'Power distribution, public lighting, and electrical infrastructure', NULL, 'zap', '#FFD700', 1),
('electrical.power', 'Power Distribution', 'Overhead/underground power lines, transformers', (SELECT id FROM service_categories WHERE code = 'electrical'), 'power', '#FFC107', 1),
('electrical.lighting', 'Public Lighting', 'Street lights, decorative lighting', (SELECT id FROM service_categories WHERE code = 'electrical'), 'lightbulb', '#FFA000', 2),
('electrical.substations', 'Substations', 'Substations and control equipment', (SELECT id FROM service_categories WHERE code = 'electrical'), 'cpu', '#FF8F00', 3),

-- Level 1: Telecommunications
('telecommunications', 'Telecommunications', 'Internet, phone, and data connectivity', NULL, 'wifi', '#2196F3', 2),
('telecommunications.fiber', 'Fiber Optics', 'Municipal fiber infrastructure', (SELECT id FROM service_categories WHERE code = 'telecommunications'), 'fiber', '#1976D2', 1),
('telecommunications.broadband', 'Broadband', 'Cable, DSL broadband services', (SELECT id FROM service_categories WHERE code = 'telecommunications'), 'signal', '#1565C0', 2),
('telecommunications.cellular', 'Cellular', 'Cell towers and small cells', (SELECT id FROM service_categories WHERE code = 'telecommunications'), 'antenna', '#0D47A1', 3),

-- Level 1: Road Networks
('road_networks', 'Road Networks', 'Roads, bridges, and transportation infrastructure', NULL, 'road', '#607D8B', 3),
('road_networks.pavement', 'Pavement', 'Potholes, cracks, road surface', (SELECT id FROM service_categories WHERE code = 'road_networks'), 'construction', '#546E7A', 1),
('road_networks.signage', 'Traffic Signage', 'Road signs and markers', (SELECT id FROM service_categories WHERE code = 'road_networks'), 'signpost', '#455A64', 2),
('road_networks.signals', 'Traffic Signals', 'Traffic lights and pedestrian signals', (SELECT id FROM service_categories WHERE code = 'road_networks'), 'traffic_light', '#37474F', 3),
('road_networks.sidewalks', 'Sidewalks', 'Pedestrian pathways', (SELECT id FROM service_categories WHERE code = 'road_networks'), 'footprints', '#263238', 4),

-- Level 1: Water & Sanitation
('water_sanitation', 'Water & Sanitation', 'Water supply, wastewater, and storm drainage', NULL, 'droplet', '#03A9F4', 4),
('water_sanitation.supply', 'Water Supply', 'Water mains, hydrants, meters', (SELECT id FROM service_categories WHERE code = 'water_sanitation'), 'water', '#0288D1', 1),
('water_sanitation.sewer', 'Sanitary Sewer', 'Sewer mains and lift stations', (SELECT id FROM service_categories WHERE code = 'water_sanitation'), 'sewer', '#0277BD', 2),
('water_sanitation.drainage', 'Storm Drainage', 'Catch basins and storm sewers', (SELECT id FROM service_categories WHERE code = 'water_sanitation'), 'drain', '#01579B', 3),

-- Level 1: Gas Distribution
('gas', 'Gas Distribution', 'Natural gas and propane infrastructure', NULL, 'flame', '#FF5722', 5),
('gas.pipeline', 'Pipeline', 'Gas transmission and distribution', (SELECT id FROM service_categories WHERE code = 'gas'), 'pipe', '#E64A19', 1),
('gas.meters', 'Metering', 'Gas meters and regulators', (SELECT id FROM service_categories WHERE code = 'gas'), 'gauge', '#D84315', 2),
('gas.leak', 'Leak Response', 'Gas leak emergency response', (SELECT id FROM service_categories WHERE code = 'gas'), 'warning', '#BF360C', 3),

-- Level 1: Public Buildings
('public_buildings', 'Public Buildings', 'Municipal buildings and facilities', NULL, 'building', '#9C27B0', 6),
('public_buildings.municipal', 'Municipal Buildings', 'City halls, police stations', (SELECT id FROM service_categories WHERE code = 'public_buildings'), 'city', '#7B1FA2', 1),
('public_buildings.recreation', 'Recreation Facilities', 'Parks, community centers', (SELECT id FROM service_categories WHERE code = 'public_buildings'), 'park', '#6A1B9A', 2),
('public_buildings.emergency', 'Emergency Facilities', 'Fire stations, shelters', (SELECT id FROM service_categories WHERE code = 'public_buildings'), 'shield', '#4A148C', 3),

-- Level 1: Waste Management
('waste', 'Waste Management', 'Collection, recycling, and disposal', NULL, 'trash', '#4CAF50', 7),
('waste.collection', 'Collection', 'Waste collection services', (SELECT id FROM service_categories WHERE code = 'waste'), 'truck', '#388E3C', 1),
('waste.recycling', 'Recycling', 'Recycling programs', (SELECT id FROM service_categories WHERE code = 'waste'), 'recycle', '#2E7D32', 2),
('waste.disposal', 'Disposal', 'Landfills and transfer stations', (SELECT id FROM service_categories WHERE code = 'waste'), 'dumpster', '#1B5E20', 3),

-- Level 1: Public Safety
('public_safety', 'Public Safety', 'Safety infrastructure and systems', NULL, 'shield', '#F44336', 8),
('public_safety.surveillance', 'Surveillance', 'Public safety cameras', (SELECT id FROM service_categories WHERE code = 'public_safety'), 'video', '#D32F2F', 1),
('public_safety.emergency', 'Emergency Systems', 'Alert systems and sirens', (SELECT id FROM service_categories WHERE code = 'public_safety'), 'siren', '#C62828', 2),
('public_safety.access', 'Access Control', 'Security systems and barriers', (SELECT id FROM service_categories WHERE code = 'public_safety'), 'lock', '#B71C1C', 3)
ON CONFLICT (code) DO NOTHING;

-- Insert default SLA definitions
INSERT INTO sla_definitions (name, description, category_id, priority, response_time_minutes, resolution_time_minutes, is_default, priority_order) VALUES
-- Critical priorities
('Critical - Default', 'Default SLA for critical issues', NULL, 'critical', 15, 240, false, 100),
('Critical - Electrical', 'SLA for critical electrical issues', (SELECT id FROM service_categories WHERE code = 'electrical'), 'critical', 30, 480, false, 100),
('Critical - Gas Leak', 'Emergency response for gas leaks', (SELECT id FROM service_categories WHERE code = 'gas.leak'), 'critical', 15, 120, false, 200),

-- Major priorities
('Major - Default', 'Default SLA for major issues', NULL, 'major', 60, 1440, false, 50),
('Major - Electrical', 'SLA for major electrical issues', (SELECT id FROM service_categories WHERE code = 'electrical'), 'major', 120, 2880, false, 50),
('Major - Road', 'SLA for major road issues', (SELECT id FROM service_categories WHERE code = 'road_networks'), 'major', 240, 4320, false, 50),

-- Minor priorities
('Minor - Default', 'Default SLA for minor issues', NULL, 'minor', 480, 10080, true, 10),
('Minor - Electrical', 'SLA for minor electrical issues', (SELECT id FROM service_categories WHERE code = 'electrical'), 'minor', 720, 10080, false, 10),

-- Trivial priorities
('Trivial - Default', 'Default SLA for trivial issues', NULL, 'trivial', 1440, 43200, false, 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS for new tables
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_breach_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Service Requests RLS
CREATE POLICY "Service requests are public read" ON service_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create service requests" ON service_requests FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'officer', 'admin') OR requester_id = auth.uid());
CREATE POLICY "Assigned users can update service requests" ON service_requests FOR UPDATE USING (
  auth.uid() = assigned_to OR 
  assigned_team IN (SELECT id FROM users WHERE department = (SELECT department FROM users WHERE id = auth.uid())) OR
  auth.role() IN ('officer', 'admin')
);

-- Incidents RLS
CREATE POLICY "Incidents are public read" ON incidents FOR SELECT USING (true);
CREATE POLICY "Officers can create incidents" ON incidents FOR INSERT WITH CHECK (auth.role() IN ('officer', 'admin'));
CREATE POLICY "Assigned users can update incidents" ON incidents FOR UPDATE USING (
  auth.uid() = incident_commander OR
  assigned_team IN (SELECT id FROM users WHERE department = (SELECT department FROM users WHERE id = auth.uid())) OR
  auth.role() IN ('officer', 'admin')
);

-- Maintenance Schedules RLS
CREATE POLICY "Maintenance schedules are internal read" ON maintenance_schedules FOR SELECT USING (auth.role() IN ('authenticated', 'officer', 'admin'));
CREATE POLICY "Officers can manage maintenance" ON maintenance_schedules FOR ALL USING (auth.role() IN ('officer', 'admin'));

-- Work Orders RLS
CREATE POLICY "Work orders are internal read" ON maintenance_work_orders FOR SELECT USING (auth.role() IN ('authenticated', 'officer', 'admin'));
CREATE POLICY "Assigned users can update work orders" ON maintenance_work_orders FOR UPDATE USING (
  auth.uid() = assigned_to OR
  auth.role() IN ('officer', 'admin')
);
CREATE POLICY "Officers can manage work orders" ON maintenance_work_orders FOR INSERT WITH CHECK (auth.role() IN ('officer', 'admin'));

-- Resources RLS
CREATE POLICY "Resources are internal read" ON resources FOR SELECT USING (auth.role() IN ('authenticated', 'officer', 'admin'));
CREATE POLICY "Officers can manage resources" ON resources FOR ALL USING (auth.role() IN ('officer', 'admin'));

-- Escalation Rules RLS
CREATE POLICY "Escalation rules admin only" ON escalation_rules FOR ALL USING (auth.role() = 'admin');

-- Communication Logs RLS
CREATE POLICY "Communication logs admin only" ON communication_logs FOR ALL USING (auth.role() = 'admin');

-- SLA Definitions RLS
CREATE POLICY "SLA definitions read for authenticated" ON sla_definitions FOR SELECT USING (auth.role() IN ('authenticated', 'officer', 'admin'));
CREATE POLICY "SLA definitions admin only" ON sla_definitions FOR ALL USING (auth.role() = 'admin');

-- Audit Logs RLS
CREATE POLICY "Audit logs admin only" ON audit_logs FOR ALL USING (auth.role() = 'admin');

-- ============================================================================
-- NOTE: Run this script in Supabase SQL Editor to create all tables
-- ============================================================================
