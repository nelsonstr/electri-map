import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface WazeAlert {
  uuid: string;
  type: string;
  subtype?: string;
  location: {
    x: number;
    y: number;
  };
  street?: string;
  city?: string;
  reportDescription?: string;
  startTime?: string;
  streetName?: string;
}

interface IncidentRecord {
  incident_number: string;
  external_incident_ref: string;
  title: string;
  description: string;
  incident_type: string;
  severity: 'low' | 'minor' | 'major' | 'critical';
  status: 'detected' | 'investigating' | 'resolved' | 'closed';
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  detected_at: string;
  source: 'waze' | 'google_maps';
}

/**
 * Fetches alerts from Waze Feed
 */
async function fetchWazeAlerts(): Promise<WazeAlert[]> {
  const wazeFeedUrl = process.env.WAZE_FEED_URL;
  
  if (!wazeFeedUrl) {
    console.warn('WAZE_FEED_URL is not defined. Skipping Waze fetch.');
    return [];
  }

  try {
    const response = await fetch(wazeFeedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Waze feed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.alerts || [];
  } catch (error) {
    console.error('Error fetching Waze alerts:', error);
    return [];
  }
}

/**
 * Fetches alerts from Google Maps (Placeholder)
 * Use this to integrate with Google Maps Routes/Traffic API if available
 */
async function fetchGoogleMapsAlerts(): Promise<any[]> {
  // Placeholder implementation
  console.log('Fetching Google Maps alerts (Placeholder)...');
  return [];
}

/**
 * Maps a Waze alert to our internal Incident schema
 */
function mapWazeToIncident(alert: WazeAlert): IncidentRecord {
  return {
    incident_number: `WAZE-${alert.uuid.substring(0, 8)}`,
    external_incident_ref: alert.uuid,
    title: alert.subtype ? `Waze Alert: ${alert.subtype}` : `Waze Alert: ${alert.type}`,
    description: alert.reportDescription || `Reported ${alert.type} on ${alert.street || 'unknown street'}`,
    incident_type: alert.type,
    severity: 'minor', // Default severity, logic can be enhanced
    status: 'detected',
    latitude: alert.location.y,
    longitude: alert.location.x,
    address: alert.street,
    city: alert.city,
    detected_at: new Date(alert.startTime || Date.now()).toISOString(),
    source: 'waze',
  };
}

/**
 * Syncs road blocks from external sources to the database
 */
export async function syncRoadBlocks() {
  console.log('Starting Road Block Sync...');
  
  // 1. Fetch Data
  const [wazeAlerts, mapsAlerts] = await Promise.all([
    fetchWazeAlerts(),
    fetchGoogleMapsAlerts()
  ]);

  console.log(`Fetched ${wazeAlerts.length} Waze alerts and ${mapsAlerts.length} Google Maps alerts.`);

  // 2. Map to Internal Schema
  const incidentsToUpsert: IncidentRecord[] = [
    ...wazeAlerts.map(mapWazeToIncident),
    // ... mapGoogleMapsToIncident(mapsAlerts)
  ];

  if (incidentsToUpsert.length === 0) {
    console.log('No incidents to sync.');
    return;
  }

  // 3. Upsert into Database
  // We use external_incident_ref as the unique key to avoid duplicates
  // Note: We need to ensure logic handles updates vs new inserts correctly
  
  let successCount = 0;
  let errorCount = 0;

  for (const incident of incidentsToUpsert) {
    // Check if exists
    const { data: existing } = await supabase
      .from('incidents')
      .select('id, status')
      .eq('external_incident_ref', incident.external_incident_ref)
      .single();

    if (existing) {
        // Update existing if needed (e.g. if status changed or position updated)
        // For now, we assume if it's still in the feed, it's still active.
        const { error } = await supabase
            .from('incidents')
            .update({
                updated_at: new Date().toISOString(),
                // could update location or description if changed
            })
            .eq('id', existing.id);
        
         if (error) {
            console.error(`Failed to update incident ${incident.external_incident_ref}: `, error);
            errorCount++;
         } else {
            successCount++;
         }

    } else {
        // Insert new
        const { error } = await supabase
            .from('incidents')
            .insert({
                incident_number: incident.incident_number,
                external_incident_ref: incident.external_incident_ref,
                title: incident.title,
                description: incident.description,
                incident_type: incident.incident_type,
                severity: incident.severity,
                status: incident.status,
                latitude: incident.latitude,
                longitude: incident.longitude,
                address: incident.address,
                city: incident.city,
                detected_at: incident.detected_at,
                assigned_department: null, // Logic to auto-assign could go here
                // source_type: incident.source // Column does not exist, relying on external_incident_ref/incident_number
            });

        if (error) {
            console.error(`Failed to insert incident ${incident.external_incident_ref}: `, error);
            errorCount++;
        } else {
            successCount++;
        }
    }
  }

  console.log(`Sync complete. Success: ${successCount}, Errors: ${errorCount}`);
  
  // 4. (Optional) Cleanup
  // Logic to close incidents that are no longer in the feed could be added here.
}
