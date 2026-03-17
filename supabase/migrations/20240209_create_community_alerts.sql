-- Migration: Create community_alerts table
-- Date: 2024-02-09

-- Create enum types for alert status and priority if they don't exist
DO $$ BEGIN
  CREATE TYPE alert_status AS ENUM ('active', 'resolved', 'pending', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the community_alerts table
CREATE TABLE IF NOT EXISTS community_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status alert_status DEFAULT 'active',
  priority alert_priority DEFAULT 'medium',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  reported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  image_url TEXT,
  vote_count INTEGER DEFAULT 0
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_community_alerts_location ON community_alerts USING gist (latitude longitude);
CREATE INDEX IF NOT EXISTS idx_community_alerts_status ON community_alerts(status);
CREATE INDEX IF NOT EXISTS idx_community_alerts_category ON community_alerts(category);
CREATE INDEX IF NOT EXISTS idx_community_alerts_created_at ON community_alerts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE community_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Anyone can read alerts
CREATE POLICY IF NOT EXISTS "Anyone can read alerts" ON community_alerts
  FOR SELECT USING (true);

-- Authenticated users can create alerts
CREATE POLICY IF NOT EXISTS "Authenticated users can create alerts" ON community_alerts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own alerts
CREATE POLICY IF NOT EXISTS "Users can update own alerts" ON community_alerts
  FOR UPDATE USING (auth.uid() = reported_by OR auth.uid() = resolved_by);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE community_alerts;
