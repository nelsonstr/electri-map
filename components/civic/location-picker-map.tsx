"use client";

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import { LatLngExpression, icon, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Navigation, Search } from 'lucide-react';
import type { IssueLocation } from '@/types/civic-issue';
import { useToast } from '@/components/ui/use-toast';

// Fix for default marker icon in Leaflet with Webpack/Next.js
const createCustomIcon = (color: string = '#3b82f6') => {
  return divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const defaultIcon = createCustomIcon('#ef4444');
const selectedIcon = createCustomIcon('#22c55e');

interface LocationPickerMapProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  selectedLocation: IssueLocation | null;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

function LocationMarker({ 
  position, 
  onPositionChange,
  isSelected 
}: { 
  position: LatLngExpression | null;
  onPositionChange: (lat: number, lng: number) => void;
  isSelected: boolean;
}) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!position) return null;

  return (
    <Marker 
      position={position} 
      icon={isSelected ? selectedIcon : defaultIcon}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-medium">Selected Location</p>
          <p>Lat: {position[0].toFixed(6)}</p>
          <p>Lng: {position[1].toFixed(6)}</p>
        </div>
      </Popup>
    </Marker>
  );
}

function CurrentLocationMarker({ 
  onPositionChange 
}: { 
  onPositionChange: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation Error",
        description: "Geolocation is not supported by your browser",
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
        onPositionChange(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Geolocation Error",
          description: "Unable to retrieve your location. Please enable location services.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onPositionChange]);

  return (
    <>
      {position && (
        <Marker 
          position={position} 
          icon={createCustomIcon('#3b82f6')}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-medium">Your Current Location</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}

export function LocationPickerMap({
  onLocationSelect,
  selectedLocation,
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  height = '400px',
}: LocationPickerMapProps) {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Update position when selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      setPosition([selectedLocation.latitude, selectedLocation.longitude]);
      setAddress(selectedLocation.address || '');
    }
  }, [selectedLocation]);

  const handlePositionChange = useCallback((lat: number, lng: number) => {
    const newPosition: LatLngExpression = [lat, lng];
    setPosition(newPosition);
    
    // Reverse geocode to get address
    fetchAddress(lat, lng);
    onLocationSelect(lat, lng);
  }, [onLocationSelect]);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      if (data.address) {
        setAddress(data.address);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Use a geocoding service (simplified - would use Google Maps, OpenStreetMap, etc.)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        handlePositionChange(latNum, lngNum);
        setSearchQuery('');
      } else {
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "Location not found. Please try a different search term.",
        });
      }
    } catch (error) {
      console.error('Error searching location:', error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Error searching location. Please try again.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Current Location Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (navigator.geolocation) {
              setIsSearching(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  handlePositionChange(pos.coords.latitude, pos.coords.longitude);
                  setIsSearching(false);
                },
                () => {
                  setIsSearching(false);
                  toast({
                    variant: "destructive",
                    title: "Geolocation Error",
                    description: "Unable to get your location",
                  });
                }
              );
            }
          }}
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Current Location</span>
        </Button>
      </div>

      {/* Selected Address Display */}
      {address && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>{address}</span>
        </div>
      )}

      {/* Map */}
      <div 
        className="rounded-lg overflow-hidden border"
        style={{ height, minHeight: '300px' }}
      >
        <MapContainer
          center={position || center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            onPositionChange={handlePositionChange}
            isSelected={!!position}
          />
        </MapContainer>
      </div>

      {/* Instructions */}
      <p className="text-xs text-muted-foreground">
        Click on the map to pin the exact location of the issue. You can also use the search bar or your current location.
      </p>
    </div>
  );
}
