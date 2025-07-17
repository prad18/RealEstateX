# 🗺️ LocationPicker Component Documentation

## Overview

The LocationPicker component is a sophisticated interactive geolocation interface that provides three synchronized input methods for property location selection. It combines modern mapping technology with user-friendly input methods to create a seamless location selection experience.

## Component Architecture

```typescript
/**
 * @fileoverview Interactive LocationPicker Component
 * @module components/LocationPicker
 * 
 * Provides three synchronized input methods:
 * 1. Address input with forward geocoding
 * 2. Latitude/longitude inputs with reverse geocoding  
 * 3. Interactive map with click/drag functionality
 * 
 * All inputs remain synchronized in real-time using debounced API calls
 * and intelligent state management.
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
```

## Interface Definitions

```typescript
interface LocationPickerProps {
  /** Callback fired when location changes through any input method */
  onLocationChange: (location: LocationData) => void;
  
  /** Initial location to display on component mount */
  initialLocation?: Partial<LocationData>;
  
  /** Placeholder text for the address input field */
  addressPlaceholder?: string;
  
  /** Additional CSS classes for styling */
  className?: string;
  
  /** Disable specific input methods */
  disabled?: {
    address?: boolean;      // Disable address input
    coordinates?: boolean;  // Disable lat/lon inputs
    map?: boolean;         // Disable map interactions
  };
}

interface LocationData {
  address: string;     // Full formatted address
  latitude: number;    // Decimal degrees latitude
  longitude: number;   // Decimal degrees longitude
  city?: string;       // Extracted city name
  state?: string;      // Extracted state/province
  country?: string;    // Extracted country
  postcode?: string;   // Extracted postal code
}
```

## Core Features

### 🔄 **Real-Time Synchronization**
All three input methods (address, coordinates, map) remain perfectly synchronized:
- Typing an address automatically updates coordinates and map position
- Entering coordinates updates the address and moves map marker
- Clicking/dragging the map updates both address and coordinate fields

### 🌍 **Forward Geocoding**
Converts addresses to coordinates using the Nominatim API:
```typescript
async function geocodeAddress(address: string): Promise<LocationResult> {
  await sleep(1100); // Respect 1-second rate limit
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  // Returns coordinates and formatted address
}
```

### 📍 **Reverse Geocoding**
Converts coordinates to human-readable addresses:
```typescript
async function reverseGeocode(lat: number, lon: number): Promise<LocationResult> {
  await sleep(1100); // Respect 1-second rate limit
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  // Returns formatted address from coordinates
}
```

### 🗺️ **Interactive Leaflet Map**
Full-featured map interface with:
- OpenStreetMap tile layers for global coverage
- Draggable markers for precise positioning
- Click-to-place functionality
- Responsive zoom controls
- Mobile touch support

## Technical Implementation

### 🔄 **Debounced Input Handling**
Prevents excessive API calls during user input:
```typescript
const [inputDebounceTimer, setInputDebounceTimer] = useState<NodeJS.Timeout | null>(null);

const handleAddressChange = (value: string) => {
  setAddress(value);
  
  if (inputDebounceTimer) clearTimeout(inputDebounceTimer);
  
  const timer = setTimeout(() => {
    if (value.trim()) {
      handleAddressGeocode(value);
    }
  }, 1000);
  
  setInputDebounceTimer(timer);
};
```

### ⚡ **Rate Limiting**
Built-in protection for Nominatim API (1 request per second):
```typescript
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Applied to all geocoding requests
await sleep(1100); // 1.1 second delay for safety
```

### 🎯 **Precise Coordinate Handling**
Supports high-precision coordinate input:
```typescript
const handleCoordinateChange = (lat: string, lon: string) => {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  
  if (!isNaN(latNum) && !isNaN(lonNum)) {
    // Update map position
    setMapCenter([latNum, lonNum]);
    // Trigger reverse geocoding
    handleCoordinateGeocode(latNum, lonNum);
  }
};
```

## Usage Examples

### Basic Implementation
```tsx
import { LocationPicker } from '@/components/LocationPicker';

function PropertyRegistrationForm() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  
  const handleLocationChange = (location: LocationData) => {
    setSelectedLocation(location);
    console.log('New location selected:', location);
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Select Property Location</h3>
      <LocationPicker
        onLocationChange={handleLocationChange}
        addressPlaceholder="Enter the property address..."
        className="w-full"
      />
      
      {selectedLocation && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium">Selected Location:</h4>
          <p><strong>Address:</strong> {selectedLocation.address}</p>
          <p><strong>Coordinates:</strong> {selectedLocation.latitude}, {selectedLocation.longitude}</p>
        </div>
      )}
    </div>
  );
}
```

### With Initial Location
```tsx
<LocationPicker
  onLocationChange={handleLocationChange}
  initialLocation={{
    address: "123 Main St, New York, NY",
    latitude: 40.7128,
    longitude: -74.0060
  }}
  addressPlaceholder="Enter property address..."
/>
```

### With Disabled Features
```tsx
<LocationPicker
  onLocationChange={handleLocationChange}
  disabled={{
    map: false,        // Keep map enabled
    address: false,    // Keep address input enabled
    coordinates: true  // Disable coordinate inputs
  }}
/>
```

### Integration with Property Services
```tsx
import { LocationPicker } from '@/components/LocationPicker';
import { regridService } from '@/services/regridService';

function PropertyLookupForm() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [propertyData, setPropertyData] = useState(null);
  
  const handleLocationChange = async (newLocation: LocationData) => {
    setLocation(newLocation);
    
    // Use location for property lookup
    try {
      const result = await regridService.getPropertyByCoordinates(
        newLocation.latitude,
        newLocation.longitude,
        100 // 100 meter radius
      );
      
      if (result.success) {
        setPropertyData(result.data);
      }
    } catch (error) {
      console.error('Property lookup failed:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <LocationPicker onLocationChange={handleLocationChange} />
      {propertyData && (
        <PropertyDataDisplay data={propertyData} />
      )}
    </div>
  );
}
```

## Map Configuration

### Default Marker Icon
```typescript
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});
```

### Map Event Handling
```typescript
function MapEvents({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}
```

### Dynamic Map Centering
```typescript
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}
```

## Error Handling

### Geocoding Error Recovery
```typescript
const handleAddressGeocode = async (address: string) => {
  try {
    setIsGeocoding(true);
    const result = await geocodeAddress(address);
    setLatitude(result.lat.toString());
    setLongitude(result.lon.toString());
    setMapCenter([result.lat, result.lon]);
    setError(null);
  } catch (err) {
    console.error('Geocoding failed:', err);
    setError('Could not find location. Please check the address.');
  } finally {
    setIsGeocoding(false);
  }
};
```

### Network Error Handling
```typescript
const handleCoordinateGeocode = async (lat: number, lon: number) => {
  try {
    const result = await reverseGeocode(lat, lon);
    setAddress(result.address);
    onLocationChange({
      address: result.address,
      latitude: lat,
      longitude: lon
    });
  } catch (err) {
    console.error('Reverse geocoding failed:', err);
    // Continue with coordinates only
    onLocationChange({
      address: `${lat}, ${lon}`,
      latitude: lat,
      longitude: lon
    });
  }
};
```

## Performance Optimizations

### 🚀 **Debounced API Calls**
- Prevents excessive requests during rapid user input
- 1-second delay before triggering geocoding requests
- Automatic cleanup of pending timers on component unmount

### 💾 **Intelligent State Management**
- Coordinates updated immediately for responsive UI
- Address updates only after successful geocoding
- Map position updates smoothly with coordinate changes

### 🔄 **Async Loading States**
- Visual feedback during geocoding operations
- Error states for failed API requests
- Graceful degradation when geocoding fails

## API Dependencies

### 🌍 **Nominatim Geocoding API**
- **Provider**: OpenStreetMap Foundation
- **Rate Limit**: 1 request per second
- **Cost**: Free
- **Coverage**: Global
- **Features**: Forward and reverse geocoding

### 🗺️ **OpenStreetMap Tiles**
- **Provider**: OpenStreetMap Foundation  
- **Cost**: Free
- **Coverage**: Global
- **Features**: High-quality map tiles
- **Attribution**: Required (automatically included)

### 📦 **React-Leaflet Library**
- **Version**: Latest compatible
- **Purpose**: React bindings for Leaflet maps
- **Features**: Component-based map interface
- **License**: Open source

## Styling and Customization

### CSS Classes
```css
.location-picker {
  /* Container styling */
}

.location-picker__address-input {
  /* Address input field styling */
}

.location-picker__coordinate-inputs {
  /* Coordinate input fields styling */
}

.location-picker__map {
  /* Map container styling */
  height: 300px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
```

### Responsive Design
The component is fully responsive and works on:
- Desktop computers (mouse interaction)
- Tablets (touch interaction)
- Mobile phones (touch with zoom controls)

## Integration Examples

### Property Registration Workflow
```tsx
// In PropertyRegistration component
import { LocationPicker } from '@/components/LocationPicker';

export const PropertyRegistration = () => {
  const [propertyLocation, setPropertyLocation] = useState<LocationData | null>(null);
  
  return (
    <div className="space-y-6">
      {/* Step 1: Location Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Property Location</h3>
        <LocationPicker
          onLocationChange={setPropertyLocation}
          addressPlaceholder="Enter your property address..."
        />
      </div>
      
      {/* Step 2: Continue with property data */}
      {propertyLocation && (
        <PropertyDetailsForm location={propertyLocation} />
      )}
    </div>
  );
};
```

### Coordinate Property Lookup Integration
```tsx
// Enhanced CoordinatePropertyLookup with LocationPicker
import { LocationPicker } from '@/components/LocationPicker';

export const CoordinatePropertyLookup = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  
  const handleLocationChange = async (location: LocationData) => {
    setSelectedLocation(location);
    // Automatically trigger property lookup
    await handlePropertyLookup(location.latitude, location.longitude);
  };
  
  return (
    <div className="space-y-6">
      <LocationPicker 
        onLocationChange={handleLocationChange}
        addressPlaceholder="Enter property address or coordinates..."
      />
      
      <SearchRadiusSelector radius={radius} onChange={setRadius} />
      
      {selectedLocation && (
        <PropertyDataDisplay data={propertyData} />
      )}
    </div>
  );
};
```

## Best Practices

### 🎯 **User Experience**
1. **Provide Clear Placeholders**: Use descriptive placeholder text
2. **Show Loading States**: Indicate when geocoding is in progress
3. **Handle Errors Gracefully**: Display helpful error messages
4. **Responsive Design**: Ensure mobile compatibility

### ⚡ **Performance**
1. **Debounce Input**: Prevent excessive API calls
2. **Respect Rate Limits**: Follow Nominatim guidelines
3. **Cache Results**: Avoid duplicate requests where possible
4. **Optimize Re-renders**: Use React.memo for expensive operations

### 🔒 **Error Handling**
1. **Network Failures**: Graceful degradation
2. **Invalid Addresses**: Clear user feedback
3. **API Limits**: Respect rate limiting
4. **Invalid Coordinates**: Validation and sanitization

## Component Lifecycle

### Mounting
1. Initialize with default location (Indianapolis, IN)
2. Apply any provided `initialLocation` props
3. Set up map with OpenStreetMap tiles
4. Configure marker icon and event handlers

### Updates
1. Debounce address input changes
2. Update map center on coordinate changes
3. Trigger geocoding for address/coordinate updates
4. Synchronize all input methods

### Unmounting
1. Clear any pending debounce timers
2. Clean up map resources
3. Cancel in-flight geocoding requests

This LocationPicker component provides a complete, production-ready solution for interactive location selection in the RealEstateX platform, combining ease of use with powerful functionality.
