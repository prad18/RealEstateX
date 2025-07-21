import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default location: Monument Circle, Indianapolis
const DEFAULT_LOCATION = {
  lat: 39.7684,
  lon: -86.1581,
  address: 'Monument Circle, Indianapolis, IN, USA',
};

// Custom marker icon for better visibility
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

// --- LOGIC & API (Originals Preserved) ---

const rateLimiter = {
  lastRequestTime: 0,
  async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1100; // 1.1 seconds to be safe

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
};

async function geocodeAddress(address: string): Promise<LocationData> {
  if (!address.trim()) throw new Error('Address cannot be empty');
  await rateLimiter.waitForRateLimit();
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;
  const response = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'RealEstateX-LocationPicker/1.0' } });
  if (!response.ok) throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
  const data = await response.json();
  if (!data || data.length === 0) throw new Error('No location found for this address');
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), address: data[0].display_name };
}

async function reverseGeocode(lat: number, lon: number): Promise<LocationData> {
  if (isNaN(lat) || isNaN(lon)) throw new Error('Invalid coordinates provided');
  await rateLimiter.waitForRateLimit();
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
  const response = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'RealEstateX-LocationPicker/1.0' } });
  if (!response.ok) throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText}`);
  const data = await response.json();
  if (!data || !data.display_name) throw new Error('No address found for these coordinates');
  return { lat, lon, address: data.display_name };
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
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return <Marker position={markerPosition} icon={markerIcon} draggable eventHandlers={{ dragend: (e: any) => { const { lat, lng } = e.target.getLatLng(); onMarkerDrag({ lat, lon: lng }); } }} />;
}

// --- COMPONENT (Styled) ---

export interface LocationPickerProps {
  onChange?: (location: LocationData) => void;
  initialLocation?: Partial<LocationData>;
  className?: string;
}

export function LocationPicker({ onChange, initialLocation, className = '' }: LocationPickerProps) {
  // State and logic are preserved
  const [lat, setLat] = useState<number>(initialLocation?.lat ?? DEFAULT_LOCATION.lat);
  const [lon, setLon] = useState<number>(initialLocation?.lon ?? DEFAULT_LOCATION.lon);
  const [address, setAddress] = useState<string>(initialLocation?.address ?? DEFAULT_LOCATION.address);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingFromAPI = useRef<boolean>(false);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);
  useEffect(() => { if (onChange && lat && lon && address) onChange({ lat, lon, address }); }, [lat, lon, address, onChange]);

  const clearDebounce = () => { if (debounceTimer.current) { clearTimeout(debounceTimer.current); debounceTimer.current = null; } };

  const handleAddressChange = async (newAddress: string) => {
    if (!newAddress.trim() || isUpdatingFromAPI.current) return;
    setError('');
    setLoading(true);
    try {
      const result = await geocodeAddress(newAddress);
      isUpdatingFromAPI.current = true;
      setLat(result.lat);
      setLon(result.lon);
      setAddress(result.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find location');
    } finally {
      setLoading(false);
      isUpdatingFromAPI.current = false;
    }
  };

  const handleCoordinateChange = (newLat: number, newLon: number) => {
    if (isUpdatingFromAPI.current) return;
    setLat(newLat);
    setLon(newLon);
    setError('');
    clearDebounce();
    debounceTimer.current = setTimeout(async () => {
      if (isNaN(newLat) || isNaN(newLon) || newLat === 0 || newLon === 0) return;
      setLoading(true);
      try {
        const result = await reverseGeocode(newLat, newLon);
        isUpdatingFromAPI.current = true;
        setAddress(result.address);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get address');
      } finally {
        setLoading(false);
        isUpdatingFromAPI.current = false;
      }
    }, 1000);
  };

  const handleMapInteraction = async (newLat: number, newLon: number) => {
    if (isUpdatingFromAPI.current) return;
    clearDebounce();
    setLat(newLat);
    setLon(newLon);
    setError('');
    setLoading(true);
    try {
      const result = await reverseGeocode(newLat, newLon);
      isUpdatingFromAPI.current = true;
      setAddress(result.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get address');
    } finally {
      setLoading(false);
      isUpdatingFromAPI.current = false;
    }
  };

  // Reusable style for all inputs
  const inputStyle = "w-full px-4 py-3 glass rounded-xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-60";

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Address Input Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Property Address</label>
        <input
          type="text"
          className={inputStyle}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddressChange(address); } }}
          onBlur={() => handleAddressChange(address)}
          disabled={loading}
          placeholder="Enter full address and press Enter"
        />
      </div>

      {/* Coordinates Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Latitude</label>
          <input
            type="number"
            className={inputStyle}
            value={lat || ''}
            step="0.000001"
            onChange={(e) => handleCoordinateChange(parseFloat(e.target.value) || 0, lon)}
            disabled={loading}
            placeholder="39.7684"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Longitude</label>
          <input
            type="number"
            className={inputStyle}
            value={lon || ''}
            step="0.000001"
            onChange={(e) => handleCoordinateChange(lat, parseFloat(e.target.value) || 0)}
            disabled={loading}
            placeholder="-86.1581"
          />
        </div>
      </div>

      {/* Interactive Map Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Interactive Map</label>
        <div className="h-80 rounded-2xl overflow-hidden border border-white/20 shadow-lg">
          <MapContainer center={[lat, lon]} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} key={`map-${lat}-${lon}`}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapCenterUpdater center={[lat, lon]} />
            <MapEvents
              onMapClick={({ lat: clickLat, lng: clickLng }) => handleMapInteraction(clickLat, clickLng)}
              markerPosition={[lat, lon]}
              onMarkerDrag={({ lat: dragLat, lon: dragLon }) => handleMapInteraction(dragLat, dragLon)}
            />
          </MapContainer>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="flex items-center justify-center space-x-3 glass rounded-xl p-4 border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-indigo-600/10">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-blue-300">Loading location data...</span>
        </div>
      )}
      
      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-600/10 animate-shake">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Current Location Summary */}
      {lat && lon && address && !loading && !error && (
        <div className="glass rounded-xl p-4 border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-600/10">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-300">Location Selected</h4>
              <p className="text-xs text-green-400/80 mt-1">
                <strong>Coordinates:</strong> {lat.toFixed(6)}, {lon.toFixed(6)}
              </p>
              <p className="text-xs text-green-400/80">
                <strong>Address:</strong> {address}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;