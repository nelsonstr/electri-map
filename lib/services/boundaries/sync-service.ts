import { createClient } from '@/lib/supabase/client';
import { BoundaryStats, AdministrativeLevel } from '@/types/administrative';

export async function getStatsForBoundary(
  boundaryId: string
): Promise<BoundaryStats | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('boundary_stats')
    .select('*')
    .eq('boundary_id', boundaryId)
    .order('synced_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch boundary stats: ${error.message}`);
  }

  return {
    totalLocations: data.total_locations as number,
    withElectricity: data.with_electricity as number,
    withoutElectricity: (data.total_locations as number) - (data.with_electricity as number),
    percentageWithPower: (data.total_locations as number) > 0 
      ? ((data.with_electricity as number) / (data.total_locations as number)) * 100 
      : 100,
    activeAlerts: data.active_alerts as number,
    lastSyncedAt: data.synced_at as string
  };
}

/**
 * Aggregates marker data for a specific boundary.
 * This function would ideally be a Postgres Trigger or Edge Function,
 * but provided here as a service logic.
 */
export async function syncStatsAllBoundaries(
  countryCode: string,
  levelId: AdministrativeLevel
): Promise<void> {
  const supabase = createClient();
  
  // 1. Get all boundaries for this level
  const { data: boundaries, error: bError } = await supabase
    .from('boundary_responsibilities')
    .select('id, boundary_code, level_id')
    .eq('country_code', countryCode)
    .eq('level_id', levelId);

  if (bError) throw bError;

  // 2. For each boundary, calculate stats from the 'locations' table
  // This is a simplified version. In production, we use spatial joins (PostGIS).
  for (const boundary of boundaries) {
    // Note: This requires a mapping between locations and boundaries
    // Usually 'locations' table has a 'municipality_id' or similar,
    // or we do a ST_Contains query.
    
    // Placeholder for actual aggregation logic
    // const stats = await calculateStatsForArea(boundary.boundary_code);
    
    // 3. Upsert into boundary_stats
    /*
    await supabase.from('boundary_stats').upsert({
      boundary_id: boundary.id,
      total_locations: stats.total,
      with_electricity: stats.withPower,
      active_alerts: stats.alerts,
      synced_at: new Date().toISOString()
    });
    */
  }
}
