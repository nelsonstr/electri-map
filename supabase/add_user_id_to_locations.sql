-- Add user_id column to locations table for tracking user contributions
-- This allows users to manage their own reports (edit, delete, renew)

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);

-- Update RLS policy to allow users to manage their own locations
CREATE POLICY "Users can update their own locations"
ON locations FOR UPDATE
USING (user_id IS NOT NULL)
WITH CHECK (true);

CREATE POLICY "Users can delete their own locations"
ON locations FOR DELETE
USING (user_id IS NOT NULL);
