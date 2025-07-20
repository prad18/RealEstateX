import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_LOCATION = {
  lat: 39.7684,
  lon: -86.1581,
  address: '',
};

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

export interface LocationData {
  lat: number;
  lon: number;
  address: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number; address: string }> {
  await sleep(1100); // Nominatim rate limit
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Failed to geocode address');
  const data = await res.json();
  if (!data[0]) throw new Error('No results found');
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    address: data[0].display_name,
  };
}

async function reverseGeocode(lat: number, lon: number): Promise<{ lat: number; lon: number; address: string }> {
  await sleep(1100); // Nominatim rate limit
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Failed to reverse geocode');
  const data = await res.json();
  if (!data.display_name) throw new Error('No address found');
  return {
    lat: lat,
    lon: lon,
    address: data.display_name,
  };
}

interface MapEventsProps {
  onMapClick: (latlng: { lat: number; lng: number }) => void;
  markerPosition: [number, number];
  onMarkerDrag: (coords: { lat: number; lon: number }) => void;
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function MapEvents({ onMapClick, markerPosition, onMarkerDrag }: MapEventsProps) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      onMapClick(e.latlng);
    },
  });
  return (
    <Marker
      position={markerPosition}
      icon={markerIcon}
      draggable
      eventHandlers={{
        dragend: (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          onMarkerDrag({ lat, lon: lng });
        },
      }}
    />
  );
}

export interface LocationPickerProps {
  onChange?: (location: { lat: number; lon: number; address: string }) => void;
  initialLocation?: Partial<LocationData>;
  className?: string;
}

export function LocationPicker({ onChange, initialLocation, className = '' }: LocationPickerProps) {
  const [lat, setLat] = useState<number>(initialLocation?.lat || DEFAULT_LOCATION.lat);
  const [lon, setLon] = useState<number>(initialLocation?.lon || DEFAULT_LOCATION.lon);
  const [address, setAddress] = useState<string>(initialLocation?.address || DEFAULT_LOCATION.address);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const lastRequest = useRef<number>(0);
  const [hasUserInput, setHasUserInput] = useState<boolean>(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Synchronize with parent
  React.useEffect(() => {
    // Only call onChange if user has actually selected/entered a location
    if (hasUserInput && address.trim() && onChange) {
      onChange({ lat, lon, address });
    }
  }, [lat, lon, address, onChange, hasUserInput]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Address input handler
  const handleAddressBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (!value) return;
    
    setHasUserInput(true);
    setLoading(true);
    setError('');
    try {
      const now = Date.now();
      if (now - lastRequest.current < 1100) await sleep(1100 - (now - lastRequest.current));
      lastRequest.current = Date.now();
      const result = await geocodeAddress(value);
      setLat(result.lat);
      setLon(result.lon);
      setAddress(result.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Debounced reverse geocoding for lat/lon changes
  const debouncedReverseGeocode = async (newLat: number, newLon: number) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(async () => {
      if (!newLat || !newLon || isNaN(newLat) || isNaN(newLon)) return;
      
      setLoading(true);
      setError('');
      try {
        const now = Date.now();
        if (now - lastRequest.current < 1100) await sleep(1100 - (now - lastRequest.current));
        lastRequest.current = Date.now();
        const result = await reverseGeocode(newLat, newLon);
        setAddress(result.address);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, 1000); // Wait 1 second after user stops typing
  };

  // Lat/Lon input handler - now just updates state without API calls
  const handleLatLonChange = (newLat: number, newLon: number) => {
    setHasUserInput(true);
    setLat(newLat);
    setLon(newLon);
    
    // Only trigger reverse geocoding if both values are valid
    if (!isNaN(newLat) && !isNaN(newLon) && newLat !== 0 && newLon !== 0) {
      debouncedReverseGeocode(newLat, newLon);
    }
  };

  // Map click/drag handler
  const handleMapChange = async ({ lat, lon }: { lat: number; lon: number }) => {
    setHasUserInput(true);
    setLat(lat);
    setLon(lon);
    setLoading(true);
    setError('');
    try {
      const now = Date.now();
      if (now - lastRequest.current < 1100) await sleep(1100 - (now - lastRequest.current));
      lastRequest.current = Date.now();
      const result = await reverseGeocode(lat, lon);
      setAddress(result.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
          <input
            type="text"
            className="w-full px-4 py-3 glass rounded-xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
            value={address}
            onChange={e => setAddress(e.target.value)}
            onBlur={handleAddressBlur}
            disabled={loading}
            placeholder="Enter property address..."
          />
        </div>
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Latitude</label>
            <input
              type="number"
              className="w-full px-4 py-3 glass rounded-xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              value={lat || ''}
              step="0.0001"
              onChange={e => handleLatLonChange(Number(e.target.value) || 0, lon)}
              disabled={loading}
              placeholder="Latitude..."
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Longitude</label>
            <input
              type="number"
              className="w-full px-4 py-3 glass rounded-xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              value={lon || ''}
              step="0.0001"
              onChange={e => handleLatLonChange(lat, Number(e.target.value) || 0)}
              disabled={loading}
              placeholder="Longitude..."
            />
          </div>
        </div>
      </div>
      <div className="h-80 rounded-xl overflow-hidden border border-white/20 glass">
        <MapContainer
          center={[lat, lon]}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          key={`${lat}-${lon}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterUpdater center={[lat, lon]} />
          <MapEvents
            onMapClick={({ lat, lng }) => handleMapChange({ lat, lon: lng })}
            markerPosition={[lat, lon]}
            onMarkerDrag={handleMapChange}
          />
        </MapContainer>
      </div>
      {loading && <div className="text-blue-400 flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
        <span>Loading...</span>
      </div>}
      {error && <div className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
        {error}
      </div>}
    </div>
  );
}

export default LocationPicker;