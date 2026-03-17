
-- 1. Create incidents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    description TEXT,
    is_sos BOOLEAN DEFAULT FALSE,
    notifications_sent BOOLEAN DEFAULT FALSE,
    emergency_services_dispatched BOOLEAN DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure is_sos column exists (if table was created elsewhere)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'is_sos') THEN
        ALTER TABLE public.incidents ADD COLUMN is_sos BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Create community_alerts table
CREATE TABLE IF NOT EXISTS public.community_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    instructions TEXT,
    severity VARCHAR(20) NOT NULL, -- informational, warning, critical
    alert_type VARCHAR(50) NOT NULL,
    location JSONB NOT NULL, -- {latitude: number, longitude: number}
    radius INTEGER NOT NULL, -- meters
    place_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_read BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS and add policies
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to incidents" ON public.incidents;
CREATE POLICY "Allow public read access to incidents" 
ON public.incidents FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow public read access to community_alerts" ON public.community_alerts;
CREATE POLICY "Allow public read access to community_alerts" 
ON public.community_alerts FOR SELECT 
USING (true);

-- 5. Seed a test alert near Lisbon (38.7223, -9.1393)
INSERT INTO public.community_alerts (
    alert_number, title, message, instructions, severity, alert_type, location, radius, place_name, expires_at
) VALUES (
    'ALT-TEST-001',
    'Weather Alert',
    'Heavy rain expected in the next 2 hours. Please stay indoors.',
    'Keep windows closed and avoid low-lying areas.',
    'warning',
    'weather',
    '{"latitude": 38.7223, "longitude": -9.1393}',
    5000,
    'Lisbon Center',
    NOW() + INTERVAL '1 day'
) ON CONFLICT (alert_number) DO NOTHING;
