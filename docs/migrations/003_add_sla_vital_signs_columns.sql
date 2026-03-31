-- =============================================================================
-- Migration 003: Add SLA and Vital Signs Tracking Columns
-- =============================================================================
-- Date: 2026-03-31
-- Purpose: Add SLA deadlines and vital signs tracking columns to existing tables
--
-- Features Added:
--   1. SLA columns for service_requests and incidents
--   2. Vital signs readings tracking table
--   3. SOS alerts extended tracking
-- =============================================================================

-- =============================================================================
-- Part 1: Add SLA Columns to service_requests
-- =============================================================================

-- Add SLA deadline columns to service_requests table
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS sla_resolution_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS sla_response_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS current_escalation_level INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN service_requests.sla_resolution_deadline IS 'Deadline for completing the service request';
COMMENT ON COLUMN service_requests.sla_response_deadline IS 'Deadline for initial response to the service request';
COMMENT ON COLUMN service_requests.current_escalation_level IS 'Current escalation level (1-4). NULL means not escalated.';

-- Create index for SLA deadline queries
CREATE INDEX IF NOT EXISTS idx_service_requests_sla_deadline
ON service_requests(sla_resolution_deadline)
WHERE sla_resolution_deadline IS NOT NULL;

-- =============================================================================
-- Part 2: Add SLA Columns to incidents table
-- =============================================================================

-- Add SLA deadline columns to incidents table
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS sla_resolution_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS sla_response_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS current_escalation_level INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN incidents.sla_resolution_deadline IS 'Deadline for resolving the incident';
COMMENT ON COLUMN incidents.sla_response_deadline IS 'Deadline for initial response to the incident';
COMMENT ON COLUMN incidents.current_escalation_level IS 'Current escalation level (1-4). NULL means not escalated.';

-- Create index for incident SLA deadline queries
CREATE INDEX IF NOT EXISTS idx_incidents_sla_deadline
ON incidents(sla_resolution_deadline)
WHERE sla_resolution_deadline IS NOT NULL;

-- =============================================================================
-- Part 3: Add Vital Signs Readings Table
-- =============================================================================

-- Create vital_sign_readings table for tracking vital signs data
CREATE TABLE IF NOT EXISTS vital_sign_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sos_id UUID REFERENCES vital_signs_sos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id VARCHAR(255),
  type VARCHAR(50) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for vital signs readings
CREATE INDEX IF NOT EXISTS idx_vital_sign_readings_user_id ON vital_sign_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_vital_sign_readings_type ON vital_sign_readings(type);
CREATE INDEX IF NOT EXISTS idx_vital_sign_readings_sos_id ON vital_sign_readings(sos_id);
CREATE INDEX IF NOT EXISTS idx_vital_sign_readings_timestamp ON vital_sign_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vital_sign_readings_status ON vital_sign_readings(status);

-- Add comments for vital signs readings table
COMMENT ON TABLE vital_sign_readings IS 'Vital signs readings from connected devices and manual entries';
COMMENT ON COLUMN vital_sign_readings.id IS 'Unique identifier for the vital sign reading';
COMMENT ON COLUMN vital_sign_readings.sos_id IS 'Reference to SOS alert if this reading triggered an alert';
COMMENT ON COLUMN vital_sign_readings.user_id IS 'User who the reading belongs to';
COMMENT ON COLUMN vital_sign_readings.device_id IS 'Connected device that captured this reading (e.g., Fitbit, Apple Watch)';
COMMENT ON COLUMN vital_sign_readings.type IS 'Type of vital sign: heart_rate, blood_pressure, oxygen_saturation, temperature, respiratory_rate, blood_glucose, heart_rhythm';
COMMENT ON COLUMN vital_sign_readings.value IS 'Measured value of the vital sign';
COMMENT ON COLUMN vital_sign_readings.unit IS 'Unit of measurement (e.g., bpm, mmHg, %, °C, breaths/min, mg/dL)';
COMMENT ON COLUMN vital_sign_readings.status IS 'Calculated status: normal, elevated, high, critical, low, hypoglycemic, irregular';
COMMENT ON COLUMN vital_sign_readings.timestamp IS 'Timestamp when the reading was recorded';
COMMENT ON COLUMN vital_sign_readings.metadata IS 'Additional metadata about the reading';

-- =============================================================================
-- Part 4: Add Vital Signs SOS Tracking Columns
-- =============================================================================

-- Add SOS-specific columns to vital_signs_sos table
ALTER TABLE vital_signs_sos
ADD COLUMN IF NOT EXISTS primary_trigger VARCHAR(50),
ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS response_notes TEXT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notifications_sent JSONB DEFAULT '[]';

-- Add comments for vital signs SOS table
COMMENT ON COLUMN vital_signs_sos.primary_trigger IS 'Primary vital sign type that triggered the SOS alert';
COMMENT ON COLUMN vital_signs_sos.escalation_level IS 'Current escalation level (0 = not escalated, 1-4 = escalated)';
COMMENT ON COLUMN vital_signs_sos.escalated_at IS 'Timestamp when SOS was escalated to next level';
COMMENT ON COLUMN vital_signs_sos.assigned_to IS 'Responder/user assigned to handle this SOS';
COMMENT ON COLUMN vital_signs_sos.response_notes IS 'Notes from responders about the incident';
COMMENT ON COLUMN vital_signs_sos.resolved_at IS 'Timestamp when SOS was resolved';
COMMENT ON COLUMN vital_signs_sos.notifications_sent IS 'Array of notification records sent for this SOS';

-- =============================================================================
-- Part 5: Add Emergency Alerts Table
-- =============================================================================

-- Create emergency_alerts table for tracking alert notifications
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  instructions TEXT,
  severity VARCHAR(20) DEFAULT 'informational',
  location POINT,
  location_address TEXT,
  radius INTEGER DEFAULT 5000,
  place_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  is_read BOOLEAN DEFAULT FALSE,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create index for active alerts
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_active
ON emergency_alerts(is_active, created_at DESC);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_location
ON emergency_alerts USING gist(location)
WHERE location IS NOT NULL;

-- =============================================================================
-- Part 6: Create Alert Read Tracking Table
-- =============================================================================

-- Create user_alert_reads table for tracking which users have read which alerts
CREATE TABLE IF NOT EXISTS user_alert_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(alert_id, user_id)
);

-- Create index for unread alert counts
CREATE INDEX IF NOT EXISTS idx_user_alert_reads_unread
ON user_alert_reads(alert_id)
WHERE user_id NOT IN (
  SELECT user_id FROM user_alert_reads
  WHERE alert_id = user_alert_reads.alert_id
);

-- =============================================================================
-- Part 7: Add User Alert Preferences Table
-- =============================================================================

-- Create user_alert_preferences table for storing user notification settings
CREATE TABLE IF NOT EXISTS user_alert_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  location JSONB,
  alert_radius INTEGER DEFAULT 5000,
  enabled_severities VARCHAR(255) DEFAULT '["informational", "warning", "critical"]',
  channel_push BOOLEAN DEFAULT TRUE,
  channel_sms BOOLEAN DEFAULT FALSE,
  channel_email BOOLEAN DEFAULT FALSE,
  quiet_hours JSONB,
  sms_opt_in_enabled BOOLEAN DEFAULT FALSE,
  sms_opt_in_phone VARCHAR(20),
  sms_opt_in_verified BOOLEAN DEFAULT FALSE,
  critical_alerts_override BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for user preferences lookup
CREATE INDEX IF NOT EXISTS idx_user_alert_preferences_user_id
ON user_alert_preferences(user_id);

-- =============================================================================
-- Part 8: Create Work Orders Table (for maintenance scheduling)
-- =============================================================================

-- Create work_orders table for tracking maintenance work orders
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  sla_target_completion TIMESTAMPTZ,
  sla_resolution_deadline TIMESTAMPTZ,
  escalation_level INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_unit_id VARCHAR(255),
  location JSONB,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for work orders
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority, status);
CREATE INDEX IF NOT EXISTS idx_work_orders_sla_deadline ON work_orders(sla_resolution_deadline)
  WHERE sla_resolution_deadline IS NOT NULL;

-- =============================================================================
-- Part 9: Create Crews Table
-- =============================================================================

-- Create crews table for tracking emergency response crews
CREATE TABLE IF NOT EXISTS crews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  location JSONB,
  available BOOLEAN DEFAULT TRUE,
  capacity INTEGER DEFAULT 5,
  current_count INTEGER DEFAULT 0,
  equipment JSONB DEFAULT '{}',
  supervisor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for crew lookup
CREATE INDEX IF NOT EXISTS idx_crews_type_status ON crews(type, status);

-- =============================================================================
-- Part 10: Create Escalation History Table
-- =============================================================================

-- Create escalation_history table for tracking escalation events
CREATE TABLE IF NOT EXISTS escalation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_title TEXT,
  previous_level INTEGER,
  new_level INTEGER NOT NULL,
  reason TEXT,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  triggered_by VARCHAR(100),
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(100)
);

-- Create index for escalation tracking
CREATE INDEX IF NOT EXISTS idx_escalation_history_entity ON escalation_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_escalation_history_level ON escalation_history(new_level, triggered_at DESC);

-- =============================================================================
-- Part 11: Add Spatial Index for Incident Locations
-- =============================================================================

-- Add PostGIS geometry column for incidents if not using PostGIS points
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS location_point POINT;

-- Create spatial index for incident locations
CREATE INDEX IF NOT EXISTS idx_incidents_location_point ON incidents USING GIST (location_point);

-- =============================================================================
-- Part 12: Create Notification Logs Table
-- =============================================================================

-- Create notification_logs table for tracking all notifications sent
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type VARCHAR(50) NOT NULL,
  recipient_type VARCHAR(20),
  recipient_id VARCHAR(255) NOT NULL,
  recipient_value VARCHAR(255) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  gateway VARCHAR(50),
  message_id VARCHAR(255),
  cost NUMERIC,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- Create indexes for notification tracking
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient_type, recipient_value);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_gateway ON notification_logs(gateway);

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- All tables and columns have been added successfully.
-- Run this migration once to add all missing columns and tables.
-- For incremental updates, use the appropriate section for your needs.
--
