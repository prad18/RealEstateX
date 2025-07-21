# 🗺️ Fully Synchronized Geolocation Picker

A powerful React component built with Leaflet and OpenStreetMap that provides **three synchronized methods** for selecting property locations in your real estate application.

## ✨ Features

- **🏠 Three Input Methods**: Address bar, coordinate inputs, and interactive map
- **🔄 Real-time Synchronization**: All inputs stay perfectly synchronized
- **🌍 OpenStreetMap Integration**: Uses Nominatim API for geocoding
- **⚡ Smart Rate Limiting**: Respects API rate limits (1 request/second)
- **🎨 Tailwind CSS Styling**: Clean, responsive design
- **🛡️ Error Handling**: Comprehensive error handling and loading states
- **📱 Mobile Friendly**: Responsive design works on all screen sizes

## 🚀 Usage

### Basic Implementation

```tsx
import { LocationPicker } from '@/components/LocationPicker';
import type { LocationData } from '@/components/LocationPicker';

function MyComponent() {
  const handleLocationChange = (location: LocationData) => {
    console.log('Selected location:', location);
    // Handle the location data: { lat, lon, address }
  };

  return (
    <LocationPicker
      onChange={handleLocationChange}
      initialLocation={{
        lat: 39.7684,
        lon: -86.1581,
        address: 'Monument Circle, Indianapolis, IN, USA'
      }}
      className="w-full"
    />
  );
}
```

### With Real Estate Property Registration

```tsx
import { LocationPicker } from '@/components/LocationPicker';
import type { LocationData } from '@/components/LocationPicker';

function PropertyRegistration() {
  const [propertyLocation, setPropertyLocation] = useState<LocationData | null>(null);

  const handleLocationSelect = (location: LocationData) => {
    setPropertyLocation(location);
    
    // Update your property details
    updatePropertyDetails({
      coordinates: {
        lat: location.lat,
        lon: location.lon
      },
      address: location.address
    });
  };

  return (
    <div className="space-y-6">
      <h2>Select Property Location</h2>
      <LocationPicker
        onChange={handleLocationSelect}
        initialLocation={{
          lat: 39.7684,
          lon: -86.1581,
          address: ''
        }}
      />
      
      {propertyLocation && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3>Selected Property Location:</h3>
          <p><strong>Address:</strong> {propertyLocation.address}</p>
          <p><strong>Coordinates:</strong> {propertyLocation.lat.toFixed(6)}, {propertyLocation.lon.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
}
```

## 🎯 Three Synchronized Input Methods

### 1. Address Input Bar
- Type any address and press Enter or click outside
- Automatically geocodes and updates coordinates + map marker
- Example: "123 Main Street, Indianapolis, IN"

### 2. Coordinate Inputs
- Enter latitude and longitude manually
- Real-time reverse geocoding updates address field
- Debounced to avoid excessive API calls

### 3. Interactive Map
- Click anywhere on the map to drop a pin
- Drag the marker to reposition
- Instantly updates coordinates and reverse geocodes address

## 🔧 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onChange` | `(location: LocationData) => void` | No | - | Callback fired when location changes |
| `initialLocation` | `Partial<LocationData>` | No | Monument Circle, Indianapolis | Initial location to display |
| `className` | `string` | No | `''` | Additional CSS classes |

## 📊 LocationData Interface

```typescript
interface LocationData {
  lat: number;      // Latitude coordinate
  lon: number;      // Longitude coordinate  
  address: string;  // Full formatted address
}
```

## 🛠️ Technical Details

### Dependencies Required
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0"
}
```

### Rate Limiting
- Respects Nominatim's 1 request/second limit
- Smart debouncing for coordinate inputs (1 second delay)
- Immediate processing for address input and map clicks

### Error Handling
- Network failure handling
- Invalid coordinate validation
- Address not found scenarios
- User-friendly error messages

### Performance Optimizations
- Debounced coordinate input processing
- API request deduplication
- Efficient map re-rendering
- Cleanup of timers and resources

## 🎨 Styling

The component uses Tailwind CSS classes for styling. Key style features:

- **Responsive Grid**: Adapts to different screen sizes
- **Focus States**: Clear visual feedback for form interactions  
- **Loading States**: Animated spinner during API calls
- **Error States**: Red error messages with icons
- **Success States**: Green confirmation with location summary

## 🌐 API Integration

Uses **OpenStreetMap Nominatim API** for:
- **Forward Geocoding**: Address → Coordinates
- **Reverse Geocoding**: Coordinates → Address

API endpoints:
- Search: `https://nominatim.openstreetmap.org/search`
- Reverse: `https://nominatim.openstreetmap.org/reverse`

## 🚨 Important Notes

1. **Rate Limiting**: Nominatim has a 1 request/second limit - the component handles this automatically
2. **HTTPS Required**: Some browsers require HTTPS for location services
3. **Internet Required**: Component needs internet access for geocoding services
4. **User-Agent**: Consider adding a proper User-Agent header for production use

## 🔮 Future Enhancements

- [ ] Support for custom map tile providers
- [ ] Autocomplete suggestions for address input
- [ ] Saved locations/favorites
- [ ] Geolocation API integration ("Use My Location" button)
- [ ] Custom marker icons
- [ ] Multiple marker support
- [ ] Address validation with property databases

## 📝 Example Output

When a location is selected, the `onChange` callback receives:

```json
{
  "lat": 39.768623,
  "lon": -86.158068,
  "address": "Monument Circle, Indianapolis, Marion County, Indiana, 46204, United States"
}
```

This data can be directly used in your property registration, search, or mapping features.
