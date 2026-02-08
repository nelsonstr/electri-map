-- Emergency Response System Database Schema
-- Phase 1: Core Infrastructure
-- Migration: 20260207_emergency_schema

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Incident Types
CREATE TYPE incident_type AS ENUM (
  'fire',
  'medical',
  'flood',
  'earthquake',
  'landslide',
  'storm',
  'hazmat',
  'search_rescue',
  'traffic',
  'structural_collapse',
  'mass_casualty',
  'civil_unrest',
  'terrorist',
  'public_health',
  'utility_outage',
  'other'
);

-- Incident Severity
CREATE TYPE incident_severity AS ENUM (
  'critical',
  'major',
  'moderate',
  'minor',
  'low'
);

-- Incident Status
CREATE TYPE incident_status AS ENUM (
  'detected',
  'investigating',
  'responding',
  'contained',
  'resolved',
  'closed'
);

-- Incident Priority
CREATE TYPE incident_priority AS ENUM (
  'emergency',
  'urgent',
  'high',
  'normal',
  'low'
);

-- Resource Types
CREATE TYPE resource_type AS ENUM (
  'personnel',
  'equipment',
  'vehicle',
  'heavy_equipment',
  'specialized'
);

-- Resource Status
CREATE TYPE resource_status AS ENUM (
  'available',
  'deployed',
  'returning',
  'maintenance',
  'out_of_service',
  'reserved'
);

-- Alert Types
CREATE TYPE alert_type AS ENUM (
  'warning',
  'watch',
  'advisory',
  'emergency',
  'evacuation',
  'all_clear'
);

-- Alert Severity
CREATE TYPE alert_severity AS ENUM (
  'extreme',
  'severe',
  'moderate',
  'minor',
  'info'
);

-- Alert Status
CREATE TYPE alert_status AS ENUM (
  'draft',
  'pending',
  'sent',
  'acknowledged',
  'expired',
  'cancelled'
);

-- Alert Channels
CREATE TYPE alert_channel AS ENUM (
  'sms',
  'push',
  'email',
  'siren',
  'tv',
  'radio',
  'social',
  'in_app'
);

-- Agency Types
CREATE TYPE agency_type AS ENUM (
  'fire',
  'medical',
  'police',
  'civil_protection',
  'military',
  'coast_guard',
  'mountain_rescue',
  'red_cross',
  'customs',
  'environmental',
  'transport',
  'health',
  'utility',
  'municipal',
  'other'
);

-- Agency Status
CREATE TYPE agency_status AS ENUM (
  'active',
  'deployed',
  'standby',
  'unavailable',
  'inactive'
);

-- ============================================================================
-- TABLES: Incidents
-- ============================================================================

CREATE TABLE emergency.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  incident_type incident_type NOT NULL,
  severity incident_severity NOT NULL,
  status incident_status NOT NULL DEFAULT 'detected',
  priority incident_priority NOT NULL DEFAULT 'normal',
  
  -- Location
  location_point GEOMETRY(POINT, 4326),
  location_address TEXT,
  location_city TEXT,
  location_municipality TEXT,
  location_district TEXT,
  
  -- Timeline
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reported_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  contained_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- Personnel
  reporting_user_id UUID REFERENCES auth.users(id),
  incident_commander_id UUID REFERENCES auth.users(id),
  
  -- Assignment
  assigned_unit_id UUID,
  agencies_involved UUID[] DEFAULT '{}',
  
  -- Resources
  resources_allocated INTEGER DEFAULT 0,
  resources_required INTEGER DEFAULT 0,
  
  -- Impact Assessment
  affected_area_sqm DECIMAL(12,2),
  affected_population INTEGER,
  estimated_damage DECIMAL(15,2),
  
  -- Weather Conditions
  weather_conditions JSONB,
  
  -- Timeline Events
  timeline JSONB DEFAULT '[]'::jsonb,
  
  -- Status History
  status_history JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  source VARCHAR(100),
  external_reference_id VARCHAR(255),
  notes TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for incidents
CREATE INDEX idx_incidents_number ON emergency.incidents(incident_number);
CREATE INDEX idx_incidents_status ON emergency.incidents(status);
CREATE INDEX idx_incidents_severity ON emergency.incidents(severity);
CREATE INDEX idx_incidents_type ON emergency.incidents(incident_type);
CREATE INDEX idx_incidents_location ON emergency.incidents USING GIST(location_point);
CREATE INDEX idx_incidents_detected_at ON emergency.incidents(detected_at DESC);
CREATE INDEX idx_incidents_commander ON emergency.incidents(incident_commander_id);
CREATE INDEX idx_incidents_active ON emergency.incidents(status, detected_at DESC)
  WHERE status NOT IN ('closed', 'resolved');

-- ============================================================================
-- TABLES: Resources
-- ============================================================================

CREATE TABLE emergency.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  resource_type resource_type NOT NULL,
  status resource_status NOT NULL DEFAULT 'available',
  
  -- Location
  base_location_point GEOMETRY(POINT, 4326),
  base_location_address TEXT,
  base_location_city TEXT,
  current_location_point GEOMETRY(POINT, 4326),
  current_location_updated_at TIMESTAMPTZ,
  
  -- Assignment
  current_incident_id UUID REFERENCES emergency.incidents(id),
  assigned_team VARCHAR(100),
  
  -- Personnel-specific
  personnel_count INTEGER,
  personnel_skills TEXT[] DEFAULT '{}',
  personnel_certifications TEXT[] DEFAULT '{}',
  personnel_commander VARCHAR(255),
  
  -- Equipment-specific
  equipment_type VARCHAR(100),
  equipment_capacity VARCHAR(100),
  equipment_fuel_type VARCHAR(50),
  
  -- Vehicle-specific
  vehicle_plate_number VARCHAR(50),
  vehicle_type VARCHAR(100),
  vehicle_fuel_level DECIMAL(5,2),
  vehicle_mileage INTEGER,
  
  -- Availability
  available_from TIMESTAMPTZ,
  
  -- Contact
  contact_phone VARCHAR(50),
  contact_radio VARCHAR(50),
  contact_email VARCHAR(255),
  
  -- Organization
  agency_id UUID,
  agency_name VARCHAR(255) NOT NULL,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for resources
CREATE INDEX idx_resources_code ON emergency.resources(resource_code);
CREATE INDEX idx_resources_status ON emergency.resources(status);
CREATE INDEX idx_resources_type ON emergency.resources(resource_type);
CREATE INDEX idx_resources_agency ON emergency.resources(agency_id);
CREATE INDEX idx_resources_location ON emergency.resources USING GIST(current_location_point);
CREATE INDEX idx_resources_incident ON emergency.resources(current_incident_id);
CREATE INDEX idx_resources_skills ON emergency.resources USING GIN(personnel_skills);

-- ============================================================================
-- TABLES: Resource Allocations
-- ============================================================================

CREATE TABLE emergency.resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES emergency.incidents(id),
  resource_id UUID NOT NULL REFERENCES emergency.resources(id),
  
  allocation_type VARCHAR(20) NOT NULL DEFAULT 'primary',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- Timeline
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  departed_at TIMESTAMPTZ,
  
  -- Route
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  
  -- Assignment
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  -- Route Information
  route_origin_lat DECIMAL(10,8),
  route_origin_lng DECIMAL(11,8),
  route_dest_lat DECIMAL(10,8),
  route_dest_lng DECIMAL(11,8),
  route_distance_meters INTEGER,
  route_duration_seconds INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(incident_id, resource_id)
);

-- Indexes for allocations
CREATE INDEX idx_allocations_incident ON emergency.resource_allocations(incident_id);
CREATE INDEX idx_allocations_resource ON emergency.resource_allocations(resource_id);
CREATE INDEX idx_allocations_status ON emergency.resource_allocations(status);

-- ============================================================================
-- TABLES: Alerts
-- ============================================================================

CREATE TABLE emergency.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  instructions TEXT,
  
  -- Classification
  alert_type alert_type NOT NULL,
  severity alert_severity NOT NULL,
  status alert_status NOT NULL DEFAULT 'draft',
  
  -- Related Incident
  incident_id UUID REFERENCES emergency.incidents(id),
  incident_type VARCHAR(100),
  
  -- Targeting
  target_areas GEOMETRY(MULTIPOLYGON, 4326),
  target_radius_meters INTEGER,
  affected_population INTEGER,
  
  -- Timing
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Delivery
  channels alert_channel[] DEFAULT '{}',
  channel_status JSONB DEFAULT '{}'::jsonb,
  
  -- Localization
  language VARCHAR(10) NOT NULL DEFAULT 'pt',
  translations JSONB DEFAULT '{}'::jsonb,
  
  -- Creator
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  approved_by UUID REFERENCES auth.users(id),
  approved_by_name VARCHAR(255),
  
  -- Geographic Reference
  reference_lat DECIMAL(10,8),
  reference_lng DECIMAL(11,8),
  reference_place_name VARCHAR(255),
  
  -- Metadata
  cap_identifier VARCHAR(255),
  source VARCHAR(100),
  references UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for alerts
CREATE INDEX idx_alerts_number ON emergency.alerts(alert_number);
CREATE INDEX idx_alerts_status ON emergency.alerts(status);
CREATE INDEX idx_alerts_type ON emergency.alerts(alert_type);
CREATE INDEX idx_alerts_severity ON emergency.alerts(severity);
CREATE INDEX idx_alerts_incident ON emergency.alerts(incident_id);
CREATE INDEX idx_alerts_issued ON emergency.alerts(issued_at DESC);
CREATE INDEX idx_alerts_active ON emergency.alerts(status, expires_at)
  WHERE status = 'sent';

-- ============================================================================
-- TABLES: Citizen Alert Subscriptions
-- ============================================================================

CREATE TABLE emergency.citizen_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Contact
  phone VARCHAR(50),
  email VARCHAR(255),
  push_token TEXT,
  
  -- Location-based
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_radius_meters INTEGER DEFAULT 5000,
  
  -- Address-based
  municipality VARCHAR(255),
  district VARCHAR(255),
  postal_code VARCHAR(20),
  
  -- Preferences
  alert_types alert_type[] DEFAULT ARRAY['warning', 'watch', 'advisory', 'evacuation']::alert_type[],
  alert_severities alert_severity[] DEFAULT ARRAY['extreme', 'severe', 'moderate']::alert_severity[],
  
  -- Status
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  unsubscribed BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================================================
-- TABLES: Agencies
-- ============================================================================

CREATE TABLE emergency.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_short VARCHAR(100),
  agency_type agency_type NOT NULL,
  
  -- Jurisdiction
  jurisdiction_city VARCHAR(255),
  jurisdiction_district VARCHAR(255),
  jurisdiction_region VARCHAR(255),
  
  -- Contact
  emergency_phone VARCHAR(50),
  dispatch_phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  radio_channel VARCHAR(50),
  
  -- Location
  hq_address TEXT,
  hq_lat DECIMAL(10,8),
  hq_lng DECIMAL(11,8),
  
  -- Capabilities
  capabilities TEXT[] DEFAULT '{}',
  specializations TEXT[] DEFAULT '{}',
  
  -- Counts
  resource_count INTEGER DEFAULT 0,
  vehicle_count INTEGER DEFAULT 0,
  
  -- Status
  status agency_status NOT NULL DEFAULT 'active',
  available_resources INTEGER DEFAULT 0,
  
  -- Integration
  siresp_id VARCHAR(100),
  anpc_id VARCHAR(100),
  
  logo_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for agencies
CREATE INDEX idx_agencies_code ON emergency.agencies(agency_code);
CREATE INDEX idx_agencies_type ON emergency.agencies(agency_type);
CREATE INDEX idx_agencies_status ON emergency.agencies(status);
CREATE INDEX idx_agencies_location ON emergency.agencies USING GIST(ST_SetSRID(ST_MakePoint(hq_lng, hq_lat), 4326));

-- ============================================================================
-- TABLES: Communication Logs
-- ============================================================================

CREATE TABLE emergency.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES emergency.incidents(id),
  
  -- Communication
  communication_type VARCHAR(50) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  
  -- Parties
  from_agency_id UUID REFERENCES emergency.agencies(id),
  from_agency_name VARCHAR(255),
  from_person_id UUID REFERENCES auth.users(id),
  from_person_name VARCHAR(255),
  from_role VARCHAR(100),
  from_phone VARCHAR(50),
  from_radio_callsign VARCHAR(50),
  
  to_agency_id UUID REFERENCES emergency.agencies(id),
  to_agency_name VARCHAR(255),
  to_person_id UUID REFERENCES auth.users(id),
  to_person_name VARCHAR(255),
  to_role VARCHAR(100),
  to_phone VARCHAR(50),
  to_radio_callsign VARCHAR(50),
  
  -- Content
  subject VARCHAR(500),
  summary TEXT NOT NULL,
  details TEXT,
  
  -- Timing
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  occurred_at TIMESTAMPTZ,
  
  -- Status
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  
  -- Priority
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  
  -- References
  related_incident_ids UUID[] DEFAULT '{}',
  related_communication_ids UUID[] DEFAULT '{}',
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Audit
  logged_by UUID REFERENCES auth.users(id),
  logged_by_name VARCHAR(255),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for communication logs
CREATE INDEX idx_comm_logs_incident ON emergency.communication_logs(incident_id);
CREATE INDEX idx_comm_logs_type ON emergency.communication_logs(communication_type);
CREATE INDEX idx_comm_logs_priority ON emergency.communication_logs(priority);
CREATE INDEX idx_comm_logs_time ON emergency.communication_logs(logged_at DESC);
CREATE INDEX idx_comm_logs_agency ON emergency.communication_logs(from_agency_id, to_agency_id);

-- ============================================================================
-- TABLES: Joint Operations Centers (JOC)
-- ============================================================================

CREATE TABLE emergency.joint_operations_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES emergency.incidents(id),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'forming',
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  
  -- Location
  location_name VARCHAR(255),
  location_address TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  
  -- Leadership
  commander_agency_id UUID REFERENCES emergency.agencies(id),
  commander_agency_name VARCHAR(255),
  commander_person_id UUID REFERENCES auth.users(id),
  commander_person_name VARCHAR(255) NOT NULL,
  
  deputy_commander_agency_id UUID REFERENCES emergency.agencies(id),
  deputy_commander_agency_name VARCHAR(255),
  deputy_commander_person_id UUID REFERENCES auth.users(id),
  deputy_commander_person_name VARCHAR(255),
  
  -- Sections
  sections JSONB DEFAULT '{}'::jsonb,
  
  -- Schedule
  briefing_frequency VARCHAR(20) DEFAULT 'hourly',
  next_briefing_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLES: Mutual Aid Requests
-- ============================================================================

CREATE TABLE emergency.mutual_aid_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  
  requesting_incident_id UUID NOT NULL REFERENCES emergency.incidents(id),
  requesting_agency_id UUID REFERENCES emergency.agencies(id),
  requesting_agency_name VARCHAR(255) NOT NULL,
  
  -- Requested Support
  requested_agency_type agency_type,
  requested_agency_id UUID REFERENCES emergency.agencies(id),
  requested_resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- Timeline
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  
  -- Response
  responding_agency_id UUID REFERENCES emergency.agencies(id),
  responding_agency_name VARCHAR(255),
  response_notes TEXT,
  
  -- Authorization
  authorized_by UUID REFERENCES auth.users(id),
  authorization_level VARCHAR(100),
  
  -- Cost
  estimated_cost DECIMAL(15,2),
  actual_cost DECIMAL(15,2),
  cost_recovery BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for mutual aid requests
CREATE INDEX idx_aid_requests_incident ON emergency.mutual_aid_requests(requesting_incident_id);
CREATE INDEX idx_aid_requests_status ON emergency.mutual_aid_requests(status);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate incident number
CREATE OR REPLACE FUNCTION emergency.generate_incident_number()
RETURNS VARCHAR(50) AS $$
BEGIN
  RETURN 'INC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate resource code
CREATE OR REPLACE FUNCTION emergency.generate_resource_code()
RETURNS VARCHAR(50) AS $$
BEGIN
  RETURN 'RES-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
         LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate alert number
CREATE OR REPLACE FUNCTION emergency.generate_alert_number()
RETURNS VARCHAR(50) AS $$
BEGIN
  RETURN 'ALT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate mutual aid request number
CREATE OR REPLACE FUNCTION emergency.generate_aid_request_number()
RETURNS VARCHAR(50) AS $$
BEGIN
  return 'AID-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION emergency.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON emergency.incidents
  FOR EACH ROW EXECUTE FUNCTION emergency.update_updated_at();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON emergency.resources
  FOR EACH ROW EXECUTE FUNCTION emergency.update_updated_at();

CREATE TRIGGER update_allocations_updated_at
  BEFORE UPDATE ON emergency.resource_allocations
  FOR EACH ROW EXECUTE FUNCTION emergency.update_updated_at();

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON emergency.alerts
  FOR EACH ROW EXECUTE FUNCTION emergency.update_updated_at();

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON emergency.agencies
  FOR EACH ROW EXECUTE FUNCTION emergency.update_updated_at();

CREATE TRIGGER update_joc_updated_at
  BEFORE UPDATE ON emergency.joint_operations_centers
  FOR EACH ROW EXECUTE FUNCTION emergency.update_updated_at();

CREATE TRIGGER update_aid_requests_updated_at
  BEFORE UPDATE ON emergency.mutual_aid_requests
  FOR EACH ROW EXECUTE FUNCTION emergency.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE emergency.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency.resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency.citizen_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency.joint_operations_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency.mutual_aid_requests ENABLE ROW LEVEL SECURITY;

-- Policies (to be refined based on specific access requirements)
CREATE POLICY "Allow authenticated users to view incidents" ON emergency.incidents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view resources" ON emergency.resources
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view alerts" ON emergency.alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to manage their own subscriptions" ON emergency.citizen_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- REAL-TIME SUBSCRIPTIONS
-- ============================================================================

-- Enable real-time for emergency tables
ALTER PUBLICATION supabase_realtime ADD TABLE emergency.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE emergency.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE emergency.resource_allocations;

-- ============================================================================
-- COMPLETE
-- ============================================================================
