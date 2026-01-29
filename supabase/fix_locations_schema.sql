-- Fix for missing service_type column in locations table
-- Run this in the Supabase SQL Editor

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'locations' AND column_name = 'service_type') THEN
    ALTER TABLE locations ADD COLUMN service_type TEXT DEFAULT 'electrical';
  END IF;
END $$;
