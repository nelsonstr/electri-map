-- Add user_id and expires_at columns to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS user_id UUID, -- Nullable for now, represents anonymous user ID from client
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');

-- Create index for faster expiration queries
CREATE INDEX IF NOT EXISTS idx_locations_expires_at ON locations(expires_at);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);

-- Update RLS policies
-- 1. Allow updating own items (based on user_id)
CREATE POLICY "Users can update their own locations" 
ON locations FOR UPDATE
USING (user_id::text = current_setting('request.header.x-user-id', true));

-- 2. Allow deleting own items
CREATE POLICY "Users can delete their own locations" 
ON locations FOR DELETE
USING (user_id::text = current_setting('request.header.x-user-id', true));

-- Note: The above RLS policies rely on passing the user_id in a custom header 'x-user-id'
-- Since we are using anonymous auth via local storage, we might need to handle this 
-- via a secure API endpoint rather than direct RLS if we can't easily spoof the header safely.
-- For now, the API endpoint approach (in the Next.js API route) is safer than opening RLS 
-- to arbitrary header values which could be spoofed if not careful.
-- So we will stick to the API route handling the ownership check for now, 
-- but these columns are essential.
