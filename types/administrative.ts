import { Feature } from 'geojson';

export type AdministrativeLevel = 'nuts1' | 'nuts2' | 'nuts3' | 'district' | 'concelho' | 'freguesia';

export interface ResponsibilityRole {
  title: string;              // e.g., "Regional Director", "Municipal Lead"
  levelId: AdministrativeLevel;
  assignedUserId?: string;    // UUID of the assigned user
  contactInfo?: string;
}

export interface BoundaryStats {
  totalLocations: number;     // Total monitored points in this region
  withElectricity: number;    // Points with confirmed electricity
  withoutElectricity: number; // Points currently without electricity (outage)
  percentageWithPower: number; // calculated field (0-100)
  activeAlerts: number;       // Number of active emergency alerts in this region
  lastSyncedAt: string;       // ISO string of last aggregation sync
}

export interface BoundaryWithResponsibility {
  id: string;                 // Boundary code (e.g., "PT11", "1106")
  name: string;               // Display name
  level: AdministrativeLevel;
  responsibility: ResponsibilityRole;
  stats?: BoundaryStats;
}

export interface CountryAdministrativeConfig {
  countryCode: string;        // ISO 2-letter code (e.g., "PT")
  name: string;
  hierarchy: {
    id: AdministrativeLevel;
    name: string;
    responsibilityTitle: string;
    zoomRange: [number, number]; // [minZoom, maxZoom]
  }[];
  dataSources: {
    type: 'geojson_url' | 'api';
    url: string;
    attribution?: string;
  };
}
