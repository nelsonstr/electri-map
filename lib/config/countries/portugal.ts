import { CountryAdministrativeConfig } from '@/types/administrative';

export const portugalConfig: CountryAdministrativeConfig = {
  countryCode: 'PT',
  name: 'Portugal',
  hierarchy: [
    {
      id: 'nuts1',
      name: 'NUTS 1',
      responsibilityTitle: 'Regional Director',
      zoomRange: [0, 5]
    },
    {
      id: 'nuts2',
      name: 'NUTS 2',
      responsibilityTitle: 'Zone Coordinator',
      zoomRange: [6, 7]
    },
    {
      id: 'nuts3',
      name: 'NUTS 3',
      responsibilityTitle: 'Area Manager',
      zoomRange: [8, 9]
    },
    {
      id: 'district',
      name: 'District',
      responsibilityTitle: 'District Supervisor',
      zoomRange: [8, 9] // Overlaps with NUTS 3, usually toggleable or chosen by context
    },
    {
      id: 'concelho',
      name: 'Municipality',
      responsibilityTitle: 'Municipal Lead',
      zoomRange: [10, 11]
    },
    {
      id: 'freguesia',
      name: 'Parish',
      responsibilityTitle: 'Parish Coordinator',
      zoomRange: [12, 14]
    }
  ],
  dataSources: {
    type: 'api',
    url: 'https://json.geoapi.pt/', // Dynamic Portuguese GeoAPI
    attribution: 'Dados: GeoAPI.pt / DGT / INE'
  }
};
