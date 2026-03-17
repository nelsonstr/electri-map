'use client';

import { useEffect, useState } from 'react';
import { GeoJSON, useMap, Tooltip } from 'react-leaflet';
import { getBoundariesForLevel, getLevelForZoom } from '@/lib/services/boundaries/boundary-service';
import { getStatsForBoundary } from '@/lib/services/boundaries/sync-service';
import { getResponsibilityForBoundary } from '@/lib/services/boundaries/responsibility-service';
import { AdministrativeLevel, BoundaryStats, ResponsibilityRole } from '@/types/administrative';
import L from 'leaflet';

export function BoundaryLayer() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [level, setLevel] = useState<AdministrativeLevel | null>(getLevelForZoom(zoom));
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [boundaryDetails, setBoundaryDetails] = useState<Record<string, { stats?: BoundaryStats, responsibility?: any }>>({});

  useEffect(() => {
    const handleZoom = () => {
      const newZoom = map.getZoom();
      setZoom(newZoom);
      const newLevel = getLevelForZoom(newZoom);
      if (newLevel) setLevel(newLevel);
    };

    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  useEffect(() => {
    if (!level) {
      setGeoData(null);
      return;
    }

    async function fetchBoundaries() {
      try {
        const data = await getBoundariesForLevel('PT', level);
        if (!data || !data.features) {
          setGeoData(null);
          return;
        }
        setGeoData(data);
        
        // Fetch stats for visible boundaries
        const details: Record<string, any> = {};
        for (const feature of data.features) {
          const id = feature.id as string || feature.properties?.id;
          if (id) {
            const [stats, resp] = await Promise.all([
              getStatsForBoundary(id),
              getResponsibilityForBoundary('PT', level as string, id)
            ]);
            details[id] = { stats, responsibility: resp };
          }
        }
        setBoundaryDetails(details);
      } catch (err) {
        console.error('Failed to load boundaries:', err);
      }
    }

    fetchBoundaries();
  }, [level]);

  const getStyle = (feature: any) => {
    const id = feature.id || feature.properties?.id;
    const stats = boundaryDetails[id]?.stats;
    const power = stats?.percentageWithPower ?? 100;

    let color = '#22c55e'; // Green (Healthy)
    if (power < 100 && power >= 80) color = '#eab308'; // Yellow (Warning)
    if (power < 80) color = '#ef4444'; // Red (Critical)

    return {
      fillColor: color,
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.3
    };
  };

  if (!geoData) return null;

  return (
    <GeoJSON 
      data={geoData} 
      pathOptions={getStyle}
      onEachFeature={(feature, layer) => {
        const id = feature.id || feature.properties?.id;
        const name = feature.properties?.name || 'Unknown Region';
        const details = boundaryDetails[id];
        
        const tooltipContent = `
          <div class="p-2">
            <h4 class="font-bold text-sm mb-1">${name}</h4>
            <p class="text-xs text-muted-foreground">${details?.responsibility?.responsibility_title || 'No lead assigned'}</p>
            <hr class="my-1" />
            <p class="text-xs">Power: <strong>${Math.round(details?.stats?.percentageWithPower ?? 100)}%</strong></p>
            <p class="text-xs">Alerts: <strong>${details?.stats?.activeAlerts ?? 0}</strong></p>
          </div>
        `;
        
        layer.bindTooltip(tooltipContent, { sticky: true });
      }}
    />
  );
}
