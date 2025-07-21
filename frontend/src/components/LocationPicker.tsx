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

// Rate limiting utility - respects Nominatim's 1 request/second limit
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

// Forward geocoding: Address → Coordinates
async function geocodeAddress(address: string): Promise<LocationData> {
  if (!address.trim()) throw new Error('Address cannot be empty');
  
  await rateLimiter.waitForRateLimit();
  
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;
  const response = await fetch(url, { 
    headers: { 
      'Accept-Language': 'en',
      'User-Agent': 'RealEstateX-LocationPicker/1.0'
    } 
  });
  
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data || data.length === 0) {
    throw new Error('No location found for this address');
  }
  
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    address: data[0].display_name,
  };
}

// Reverse geocoding: Coordinates → Address
async function reverseGeocode(lat: number, lon: number): Promise<LocationData> {
  if (isNaN(lat) || isNaN(lon)) {
    throw new Error('Invalid coordinates provided');
  }
  
  await rateLimiter.waitForRateLimit();
  
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
  const response = await fetch(url, { 
    headers: { 
      'Accept-Language': 'en',
      'User-Agent': 'RealEstateX-LocationPicker/1.0'
    } 
  });
  
  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data || !data.display_name) {
    throw new Error('No address found for these coordinates');
  }
  
  return {
    lat,
    lon,
    address: data.display_name,
  };
}

// Map components for handling user interactions
interface MapEventsProps {
  onMapClick: (latlng: { lat: number; lng: number }) => void;
  markerPosition: [number, number];
  onMarkerDrag: (coords: { lat: number; lon: number }) => void;
}

// Component to update map center when coordinates change
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Component to handle map clicks and marker dragging
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
  onChange?: (location: LocationData) => void;
  initialLocation?: Partial<LocationData>;
  className?: string;
}

export function LocationPicker({ 
  onChange, 
  initialLocation, 
  className = '' 
}: LocationPickerProps) {
  // State management
  const [lat, setLat] = useState<number>(initialLocation?.lat ?? DEFAULT_LOCATION.lat);
  const [lon, setLon] = useState<number>(initialLocation?.lon ?? DEFAULT_LOCATION.lon);
  const [address, setAddress] = useState<string>(initialLocation?.address ?? DEFAULT_LOCATION.address);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Refs for debouncing and controlling API calls
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingFromAPI = useRef<boolean>(false);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Notify parent component of changes
  useEffect(() => {
    if (onChange && lat && lon && address) {
      onChange({ lat, lon, address });
    }
  }, [lat, lon, address, onChange]);

  // Clear any pending debounced operations
  const clearDebounce = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  };

  // Method 1: Handle address input (forward geocoding)
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

  // Method 2: Handle coordinate input changes (reverse geocoding)
  const handleCoordinateChange = (newLat: number, newLon: number) => {
    if (isUpdatingFromAPI.current) return;
    
    setLat(newLat);
    setLon(newLon);
    setError('');

    // Debounce reverse geocoding to avoid too many API calls
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
    }, 1000); // Wait 1 second after user stops typing
  };

  // Method 3: Handle map interactions (click/drag)
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Address Input Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Property Address
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddressChange(address);
            }
          }}
          onBlur={() => handleAddressChange(address)}
          disabled={loading}
          placeholder="Enter full address (e.g., 123 Main St, Indianapolis, IN)"
        />
      </div>

      {/* Coordinates Input Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Latitude
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={lat || ''}
            step="0.000001"
            onChange={(e) => {
              const newLat = parseFloat(e.target.value) || 0;
              handleCoordinateChange(newLat, lon);
            }}
            disabled={loading}
            placeholder="39.7684"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Longitude
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={lon || ''}
            step="0.000001"
            onChange={(e) => {
              const newLon = parseFloat(e.target.value) || 0;
              handleCoordinateChange(lat, newLon);
            }}
            disabled={loading}
            placeholder="-86.1581"
          />
        </div>
      </div>

      {/* Interactive Map Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Interactive Map (Click to select location or drag the marker)
        </label>
        <div className="h-80 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
          <MapContainer
            center={[lat, lon]}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            key={`map-${lat}-${lon}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenterUpdater center={[lat, lon]} />
            <MapEvents
              onMapClick={({ lat: clickLat, lng: clickLng }) => 
                handleMapInteraction(clickLat, clickLng)
              }
              markerPosition={[lat, lon]}
              onMarkerDrag={({ lat: dragLat, lon: dragLon }) => 
                handleMapInteraction(dragLat, dragLon)
              }
            />
          </MapContainer>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="flex items-center justify-center space-x-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading location data...</span>
        </div>
      )}
      
      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Current Location Summary */}
      {lat && lon && address && !loading && !error && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800">Location Selected</h4>
              <p className="text-xs text-green-700 mt-1">
                <strong>Coordinates:</strong> {lat.toFixed(6)}, {lon.toFixed(6)}
              </p>
              <p className="text-xs text-green-700">
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