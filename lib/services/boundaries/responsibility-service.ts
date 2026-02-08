import { createClient } from '@/lib/supabase/client';
import { ResponsibilityRole, AdministrativeLevel } from '@/types/administrative';

export interface BoundaryAssignment {
  id: string;
  country_code: string;
  level_id: string;
  boundary_code: string;
  boundary_name: string;
  responsibility_title: string;
  assigned_user_id: string | null;
}

export async function getResponsibilityForBoundary(
  countryCode: string,
  levelId: string,
  boundaryCode: string
): Promise<BoundaryAssignment | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('boundary_responsibilities')
    .select('*')
    .eq('country_code', countryCode)
    .eq('level_id', levelId)
    .eq('boundary_code', boundaryCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch responsibility: ${error.message}`);
  }

  return data as BoundaryAssignment;
}

export async function assignResponsibility(
  assignmentId: string,
  userId: string | null
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('boundary_responsibilities')
    .update({ assigned_user_id: userId })
    .eq('id', assignmentId);

  if (error) {
    throw new Error(`Failed to assign responsibility: ${error.message}`);
  }
}

export async function listResponsibilitiesForLevel(
  countryCode: string,
  levelId: string
): Promise<BoundaryAssignment[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('boundary_responsibilities')
    .select('*')
    .eq('country_code', countryCode)
    .eq('level_id', levelId);

  if (error) {
    throw new Error(`Failed to list responsibilities: ${error.message}`);
  }

  return (data || []) as BoundaryAssignment[];
}
