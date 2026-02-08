import { portugalConfig } from '@/lib/config/countries/portugal';
import { AdministrativeLevel } from '@/types/administrative';

export async function getBoundariesForLevel(
  countryCode: string,
  levelId: AdministrativeLevel
): Promise<GeoJSON.FeatureCollection> {
  // In a real implementation, this would fetch from GeoAPI PT or Eurostat
  // For Portugal, we typically use GeoAPI PT for Mun/Parishes and Eurostat for NUTS
  
  if (countryCode === 'PT') {
    const baseUrl = portugalConfig.dataSources.url;
    let endpoint = '';
    
    switch (levelId) {
      case 'concelho':
        endpoint = 'municipios';
        break;
      case 'freguesia':
        endpoint = 'freguesias';
        break;
      case 'nuts1':
      case 'nuts2':
      case 'nuts3':
        // These would typically come from Eurostat GISCO
        // For now, returning empty or fallback
        return { type: 'FeatureCollection', features: [] };
      default:
        return { type: 'FeatureCollection', features: [] };
    }

    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data as GeoJSON.FeatureCollection;
    } catch (error) {
      console.error('Error fetching boundaries:', error);
      throw error;
    }
  }

  return { type: 'FeatureCollection', features: [] };
}

export function getLevelForZoom(zoom: number, countryCode: string = 'PT'): AdministrativeLevel | null {
  const config = portugalConfig; // Logic should be generic eventually
  const level = config.hierarchy.find(h => zoom >= h.zoomRange[0] && zoom <= h.zoomRange[1]);
  return level ? level.id : null;
}
