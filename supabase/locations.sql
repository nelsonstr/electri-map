-- Create the locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  has_electricity BOOLEAN NOT NULL,
  comment TEXT,
  city TEXT,
  country TEXT,
  service_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to read locations (public map)
CREATE POLICY "Public locations are viewable by everyone" 
ON locations FOR SELECT 
USING (true);

-- Create a policy to allow anyone to insert locations (public reporting)
CREATE POLICY "Anyone can report a location" 
ON locations FOR INSERT 
WITH CHECK (true);

-- Create a policy for real-time subscription
ALTER PUBLICATION supabase_realtime ADD TABLE locations;
