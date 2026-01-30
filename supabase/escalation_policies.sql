-- RLS Policies for Backoffice Escalation

-- Enable RLS on relevant tables
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;

-- 1. Policies for service_requests
-- Citizens can view their own requests
CREATE POLICY "Citizens can view own service requests" 
ON service_requests FOR SELECT 
USING (auth.uid() = requester_id);

-- Officers and Admins can view ALL service requests
CREATE POLICY "Officers and Admins can view all service requests" 
ON service_requests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('officer', 'admin')
  )
);

-- Officers and Admins can update service requests (for resolution/escalation)
CREATE POLICY "Officers and Admins can update service requests" 
ON service_requests FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('officer', 'admin')
  )
);

-- 2. Policies for incidents
-- Incidents are visible to all authenticated users (assuming public safety info)
CREATE POLICY "Unified incident visibility" 
ON incidents FOR SELECT 
USING (true);

-- Only Officers and Admins can update incidents
CREATE POLICY "Officers and Admins can update incidents" 
ON incidents FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('officer', 'admin')
  )
);

-- 3. Policies for escalation_rules
-- Only Officers and Admins can view/manage escalation rules
CREATE POLICY "Officers and Admins can manage escalation rules" 
ON escalation_rules FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('officer', 'admin')
  )
);
