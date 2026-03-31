-- Migration: Add SMS/WhatsApp message columns to sos_alerts table
-- Date: 2026-03-28
-- Purpose: Enable tracking of SMS delivery status for emergency contact notifications

-- Add message_id column to track SMS/WhatsApp message IDs
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS message_id VARCHAR(255);

-- Add error_message column to track SMS delivery failures
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add contact_name and contact_phone for linking back to contacts table
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sos_alerts_user_id ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_message_id ON sos_alerts(message_id);

-- Update existing records to ensure they have a status
UPDATE sos_alerts SET status = 'sent' WHERE status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN sos_alerts.message_id IS 'SMS/WhatsApp message ID from Twilio or WhatsApp Business API';
COMMENT ON COLUMN sos_alerts.error_message IS 'Error message if SMS delivery failed';
COMMENT ON COLUMN sos_alerts.contact_name IS 'Name of contact this alert was sent to';
COMMENT ON COLUMN sos_alerts.contact_phone IS 'Phone number of contact this alert was sent to';
