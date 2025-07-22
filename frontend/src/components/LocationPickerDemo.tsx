import { useState } from 'react';
import { LocationPicker } from './property/LocationPicker';
import type { LocationData } from './property/LocationPicker';

export function LocationPickerDemo() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  const handleLocationChange = (location: LocationData) => {
    setSelectedLocation(location);
    console.log('Location updated:', location);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏠 Fully Synchronized Geolocation Picker
        </h1>
        <p className="text-lg text-gray-600">
          Use any of the three methods below to select a property location:
        </p>
        <div className="mt-4 space-y-2 text-sm text-gray-500">
          <p>✅ 1. Type a full address in the address bar</p>
          <p>✅ 2. Enter coordinates manually in the lat/lon fields</p>
          <p>✅ 3. Click on the map or drag the marker</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <LocationPicker
          onChange={handleLocationChange}
          initialLocation={{
            lat: 39.7684,
            lon: -86.1581,
            address: 'Monument Circle, Indianapolis, IN, USA'
          }}
          className="w-full"
        />
      </div>

      {selectedLocation && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Selected Location Data
          </h2>
          <div className="bg-white rounded border p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(selectedLocation, null, 2)}
            </pre>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <h3 className="font-medium text-blue-900">Latitude</h3>
              <p className="text-blue-700">{selectedLocation.lat.toFixed(6)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <h3 className="font-medium text-green-900">Longitude</h3>
              <p className="text-green-700">{selectedLocation.lon.toFixed(6)}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <h3 className="font-medium text-purple-900">Address</h3>
              <p className="text-purple-700 break-words">{selectedLocation.address}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Real-time Synchronization
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              All three input methods (address bar, coordinates, and map) are fully synchronized. 
              Changes in one will automatically update the others via forward and reverse geocoding 
              using OpenStreetMap's Nominatim API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocationPickerDemo;
