-- Reconciliation Migration - 20260209
-- Bridges the gap between public and emergency schemas for SOS and Community Alerts

-- 1. Enhance emergency.incidents to support SOS fields
DO $$ 
BEGIN
    -- Add is_sos if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'emergency' AND table_name = 'incidents' AND column_name = 'is_sos') THEN
        ALTER TABLE emergency.incidents ADD COLUMN is_sos BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add notifications_sent if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'emergency' AND table_name = 'incidents' AND column_name = 'notifications_sent') THEN
        ALTER TABLE emergency.incidents ADD COLUMN notifications_sent BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add emergency_services_dispatched if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'emergency' AND table_name = 'incidents' AND column_name = 'emergency_services_dispatched') THEN
        ALTER TABLE emergency.incidents ADD COLUMN emergency_services_dispatched BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add latitude and longitude to match public.incidents expectations in some services
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'emergency' AND table_name = 'incidents' AND column_name = 'latitude') THEN
        ALTER TABLE emergency.incidents ADD COLUMN latitude DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'emergency' AND table_name = 'incidents' AND column_name = 'longitude') THEN
        ALTER TABLE emergency.incidents ADD COLUMN longitude DOUBLE PRECISION;
    END IF;
END $$;

-- 2. Create trigger to sync location_point (PostGIS) with latitude/longitude
CREATE OR REPLACE FUNCTION emergency.sync_incident_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL) THEN
        NEW.location_point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSIF (NEW.location_point IS NOT NULL) THEN
        NEW.longitude := ST_X(NEW.location_point::geometry);
        NEW.latitude := ST_Y(NEW.location_point::geometry);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_incident_coordinates ON emergency.incidents;
CREATE TRIGGER trg_sync_incident_coordinates
BEFORE INSERT OR UPDATE ON emergency.incidents
FOR EACH ROW EXECUTE FUNCTION emergency.sync_incident_coordinates();

-- 3. Create views for Community Alerts and related tables in the emergency schema
-- This allows services that query without schema qualification to succeed if emergency is the default
CREATE OR REPLACE VIEW emergency.community_alerts AS SELECT * FROM public.community_alerts;
-- CREATE OR REPLACE VIEW emergency.alert_confirmations AS SELECT * FROM public.alert_confirmations;
-- CREATE OR REPLACE VIEW emergency.alert_comments AS SELECT * FROM public.alert_comments;
-- CREATE OR REPLACE VIEW emergency.alert_subscriptions AS SELECT * FROM public.alert_subscriptions;
-- CREATE OR REPLACE VIEW emergency.alert_votes AS SELECT * FROM public.alert_votes;
-- CREATE OR REPLACE VIEW emergency.user_alert_history AS SELECT * FROM public.user_alert_history;
-- CREATE OR REPLACE VIEW emergency.user_alert_reads AS SELECT * FROM public.user_alert_reads;
-- CREATE OR REPLACE VIEW emergency.user_alert_preferences AS SELECT * FROM public.user_alert_preferences;

-- 4. Grant access to these views
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA emergency TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA emergency TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA emergency TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA emergency TO anon;
