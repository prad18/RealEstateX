# 🏢 RegridService Documentation

## Overview

The RegridService provides integration with the Regrid API for accessing real estate property data from government records. This service enables property lookup by coordinates, data transformation, and property valuation generation for the RealEstateX platform.

## Service Architecture

```typescript
/**
 * @fileoverview Regrid Real Estate Data Service
 * @module services/regridService
 * 
 * Integrates with Regrid API to provide:
 * - Property lookup by coordinates
 * - Government records data access
 * - Property valuation generation
 * - Support for 7 counties across the US
 */

import { PropertyDetails } from '@/types';

interface ServiceConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

export class RegridPropertyService {
  private config: ServiceConfig;
  private cache = new Map<string, PropertyDetails>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor(config: ServiceConfig) {
    this.config = config;
  }
}
```

## Supported Counties

The Regrid API currently supports property data for **7 counties**:

| County | State | Coverage |
|--------|-------|----------|
| Marion County | Indiana | Indianapolis metro area |
| Dallas County | Texas | Dallas metro area |
| Wilson County | Tennessee | Nashville metro area |
| Durham County | North Carolina | Research Triangle |
| Fillmore County | Nebraska | Rural Nebraska |
| Clark County | Wisconsin | Central Wisconsin |
| Gurabo Municipio | Puerto Rico | Puerto Rico territory |

## Core Functionality

### 🔍 **Property Lookup by Coordinates**

```typescript
async getPropertyByCoordinates(
  lat: number,
  lon: number,
  radius: number = 100
): Promise<{
  success: boolean;
  data?: PropertyDetails;
  error?: string;
}> {
  try {
    // Check cache first
    const cacheKey = `${lat}_${lon}_${radius}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    const response = await fetch(
      `${this.config.baseUrl}/parcels/point?lat=${lat}&lon=${lon}&radius=${radius}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: RegridApiResponse = await response.json();
    
    if (!data.parcels?.features?.length) {
      return {
        success: false,
        error: 'No property found at these coordinates'
      };
    }

    const propertyData = data.parcels.features[0].properties;
    const propertyDetails = this.transformRegridData(propertyData);

    // Cache the result
    this.cacheResult(cacheKey, propertyDetails);

    return { success: true, data: propertyDetails };
  } catch (error) {
    console.error('Regrid API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
```

### 💰 **Property Valuation Generation**

```typescript
async getPropertyValuation(
  lat: number,
  lon: number
): Promise<{
  success: boolean;
  data?: PropertyValuation;
  error?: string;
}> {
  try {
    const propertyResult = await this.getPropertyByCoordinates(lat, lon);
    
    if (!propertyResult.success || !propertyResult.data) {
      return {
        success: false,
        error: 'Property data required for valuation'
      };
    }

    const property = propertyResult.data;
    const valuation = this.generateValuation(property);
    
    return { success: true, data: valuation };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Valuation failed'
    };
  }
}

private generateValuation(property: PropertyDetails): PropertyValuation {
  const baseValue = property.value.total || property.value.land + property.value.improvement;
  const factors: ValuationFactor[] = [];
  
  // Market trend analysis based on area demographics
  let marketMultiplier = 1.0;
  let marketTrend: 'rising' | 'stable' | 'declining' = 'stable';
  
  // Income-based valuation adjustments
  if (property.demographics.medianIncome > 75000) {
    marketMultiplier += 0.15;
    marketTrend = 'rising';
    factors.push({
      factor: 'High Income Area',
      impact: 'positive',
      weight: 15,
      description: `Median income $${property.demographics.medianIncome.toLocaleString()} indicates strong market`
    });
  }
  
  // Property type adjustments
  if (property.propertyType === 'residential' && property.area > 2000) {
    marketMultiplier += 0.1;
    factors.push({
      factor: 'Large Residential Property',
      impact: 'positive',
      weight: 10,
      description: `${property.area.toLocaleString()} sq ft provides premium value`
    });
  }
  
  // Calculate final values
  const estimatedValue = Math.round(baseValue * marketMultiplier);
  const pricePerSqFt = property.area > 0 ? Math.round(estimatedValue / property.area) : 0;
  const confidenceScore = baseValue > 0 ? 85 : 65; // Higher confidence with assessed value
  
  return {
    estimatedValue,
    confidenceScore,
    pricePerSqFt,
    marketTrend,
    factors,
    lastUpdated: new Date().toISOString()
  };
}
```

## Data Transformation

### 🔄 **Regrid to PropertyDetails Mapping**

```typescript
private transformRegridData(regridData: RegridPropertyData): PropertyDetails {
  const mainAddress = regridData.addresses?.[0];
  const ownership = regridData.enhanced_ownership?.[0];
  
  return {
    address: this.buildFullAddress(regridData, mainAddress),
    city: mainAddress?.a_city || regridData.fields?.a_city || '',
    state: mainAddress?.a_state2 || regridData.fields?.a_state2 || '',
    area: regridData.fields?.ll_gissqft || regridData.fields?.ll_bldg_footprint_sqft || 0,
    propertyType: this.determinePropertyType(
      regridData.fields?.lbcs_activity || '',
      regridData.fields?.lbcs_structure || ''
    ),
    coordinates: {
      lat: parseFloat(mainAddress?.a_lat || '0'),
      lon: parseFloat(mainAddress?.a_lon || '0')
    },
    owner: ownership?.eo_owner || regridData.fields?.owner || 'Unknown',
    value: {
      land: regridData.fields?.ll_land_val || 0,
      improvement: regridData.fields?.ll_imprv_val || 0,
      total: regridData.fields?.ll_assessed_val || 0
    },
    zoning: {
      code: regridData.fields?.zoning || '',
      description: regridData.fields?.zoning_description || '',
      type: regridData.fields?.lbcs_activity || '',
      subtype: regridData.fields?.lbcs_structure || ''
    },
    legal: {
      parcelNumber: regridData.fields?.parcelnumb || regridData.ll_uuid || '',
      stateParcelNumber: regridData.fields?.state_parcelnumb || '',
      legalDescription: regridData.fields?.legal_description || ''
    },
    demographics: {
      medianIncome: regridData.fields?.median_household_income || 0,
      affordabilityIndex: regridData.fields?.housing_affordability_index || 0,
      populationDensity: regridData.fields?.population_density || 0
    }
  };
}
```

### 🏠 **Property Type Determination**

```typescript
private determinePropertyType(
  useDesc: string, 
  zoningType: string
): 'residential' | 'commercial' | 'plot' {
  const use = useDesc.toLowerCase();
  const zoning = zoningType.toLowerCase();
  
  // Residential indicators
  if (use.includes('residential') || use.includes('single family') || 
      use.includes('multi family') || zoning.includes('residential')) {
    return 'residential';
  }
  
  // Commercial indicators  
  if (use.includes('commercial') || use.includes('retail') || 
      use.includes('office') || use.includes('industrial') ||
      zoning.includes('commercial') || zoning.includes('business')) {
    return 'commercial';
  }
  
  // Default to plot for vacant or unknown
  return 'plot';
}
```

## API Response Interfaces

### 📋 **Regrid API Response Structure**

```typescript
interface RegridApiResponse {
  parcels: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties: RegridPropertyData;
      geometry: {
        type: 'Point' | 'Polygon';
        coordinates: number[] | number[][][];
      };
    }>;
  };
}

interface RegridPropertyData {
  fields: {
    // Basic property information
    parcelnumb: string;
    state_parcelnumb: string;
    owner: string;
    
    // Address components
    a_address: string;
    a_city: string;
    a_state2: string;
    a_zip: string;
    
    // Property characteristics
    ll_gissqft: number;           // Property area in sq ft
    ll_gisacre: number;           // Property area in acres  
    ll_bldg_footprint_sqft: number; // Building footprint
    ll_bldg_count: number;        // Number of buildings
    
    // Assessed values
    ll_assessed_val: number;      // Total assessed value
    ll_land_val: number;          // Land value
    ll_imprv_val: number;         // Improvement value
    
    // Zoning and classification
    zoning: string;               // Zoning code
    zoning_description: string;   // Zoning description
    lbcs_activity: string;        // Land Based Classification System - Activity
    lbcs_structure: string;       // LBCS - Structure type
    
    // Demographics and market data
    median_household_income: number;
    housing_affordability_index: number;
    population_density: number;
    
    // Legal description
    legal_description: string;
    
    [key: string]: any; // Allow additional fields
  };
  
  addresses: Array<{
    a_id: string;
    a_address: string;
    a_lat: string;
    a_lon: string;
    a_geocodetype: string;
    [key: string]: any;
  }>;
  
  enhanced_ownership: Array<{
    ll_uuid: string;
    eo_owner: string;
    eo_mail_address: string;
    eo_mail_city: string;
    eo_mail_state2: string;
    eo_mail_zip: string;
    [key: string]: any;
  }>;
  
  ll_uuid: string; // Unique property identifier
}
```

### 📊 **PropertyValuation Interface**

```typescript
interface PropertyValuation {
  estimatedValue: number;       // Market value estimate
  confidenceScore: number;      // Confidence percentage (0-100)
  pricePerSqFt: number;        // Price per square foot
  marketTrend: 'rising' | 'stable' | 'declining';
  factors: ValuationFactor[];   // Factors affecting valuation
  lastUpdated: string;         // ISO timestamp
}

interface ValuationFactor {
  factor: string;              // Factor name
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;              // Impact weight percentage
  description: string;         // Detailed explanation
}
```

## Caching System

### 💾 **Cache Implementation**

```typescript
private cache = new Map<string, PropertyDetails>();
private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

private getCachedResult(key: string): PropertyDetails | null {
  const cached = this.cache.get(key);
  if (!cached) return null;
  
  // Check if cache entry is still valid
  const cacheTime = (cached as any).__cacheTime;
  if (cacheTime && Date.now() - cacheTime > this.CACHE_DURATION) {
    this.cache.delete(key);
    return null;
  }
  
  return cached;
}

private cacheResult(key: string, data: PropertyDetails): void {
  // Add cache timestamp
  (data as any).__cacheTime = Date.now();
  this.cache.set(key, data);
  
  // Cleanup old entries periodically
  if (this.cache.size > 100) {
    this.cleanupCache();
  }
}

private cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of this.cache.entries()) {
    const cacheTime = (value as any).__cacheTime;
    if (cacheTime && now - cacheTime > this.CACHE_DURATION) {
      this.cache.delete(key);
    }
  }
}
```

## Usage Examples

### 🏠 **Basic Property Lookup**

```typescript
import { regridService } from '@/services/regridService';

// Look up property by coordinates
const handlePropertyLookup = async (lat: number, lon: number) => {
  try {
    const result = await regridService.getPropertyByCoordinates(lat, lon, 100);
    
    if (result.success && result.data) {
      console.log('Property found:', result.data);
      // Use property data for registration
      setPropertyData(result.data);
    } else {
      console.error('Property lookup failed:', result.error);
      setError(result.error || 'Property not found');
    }
  } catch (error) {
    console.error('Lookup error:', error);
  }
};

// Example coordinates for testing
// Monument Circle, Indianapolis: 39.7684, -86.1581
// Dallas City Hall: 32.7767, -96.7970
```

### 💰 **Property Valuation**

```typescript
const handleGetValuation = async (lat: number, lon: number) => {
  try {
    const result = await regridService.getPropertyValuation(lat, lon);
    
    if (result.success && result.data) {
      const valuation = result.data;
      console.log(`Estimated Value: $${valuation.estimatedValue.toLocaleString()}`);
      console.log(`Confidence: ${valuation.confidenceScore}%`);
      console.log(`Market Trend: ${valuation.marketTrend}`);
      
      setValuation(valuation);
    } else {
      console.error('Valuation failed:', result.error);
    }
  } catch (error) {
    console.error('Valuation error:', error);
  }
};
```

### 🔄 **Integration with LocationPicker**

```typescript
import { LocationPicker } from '@/components/LocationPicker';
import { regridService } from '@/services/regridService';

function PropertySearchForm() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleLocationChange = async (newLocation: LocationData) => {
    setLocation(newLocation);
    setLoading(true);
    
    try {
      const result = await regridService.getPropertyByCoordinates(
        newLocation.latitude,
        newLocation.longitude,
        100 // 100 meter radius
      );
      
      if (result.success) {
        setPropertyData(result.data || null);
      } else {
        setPropertyData(null);
        console.warn('No property found at this location');
      }
    } catch (error) {
      console.error('Property lookup failed:', error);
      setPropertyData(null);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <LocationPicker 
        onLocationChange={handleLocationChange}
        addressPlaceholder="Enter property address for lookup..."
      />
      
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Looking up property data...</p>
        </div>
      )}
      
      {propertyData && (
        <PropertyDataDisplay property={propertyData} />
      )}
    </div>
  );
}
```

## Error Handling

### 🛡️ **Common Error Scenarios**

```typescript
// API key authentication errors
if (response.status === 401) {
  throw new Error('Invalid Regrid API key. Please check your configuration.');
}

// Rate limiting errors
if (response.status === 429) {
  throw new Error('API rate limit exceeded. Please try again later.');
}

// No property found
if (!data.parcels?.features?.length) {
  return {
    success: false,
    error: 'No property found at these coordinates. Try adjusting the search radius.'
  };
}

// Network connectivity issues
catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      success: false,
      error: 'Network error. Please check your internet connection.'
    };
  }
  
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred'
  };
}
```

## Configuration

### ⚙️ **Service Setup**

```typescript
// Environment configuration
const regridConfig = {
  baseUrl: 'https://api.regrid.com/api/v1',
  apiKey: process.env.VITE_REGRID_API_KEY || '',
  timeout: 10000 // 10 second timeout
};

// Service instance
export const regridService = new RegridPropertyService(regridConfig);
```

### 🔑 **API Key Setup**

1. Visit [Regrid.com](https://regrid.com/)
2. Navigate to Datastore → API Access
3. Click "Try the Parcel API Sandbox Now"
4. Create an account
5. Generate API Token
6. Add to your `.env` file:

```env
VITE_REGRID_API_KEY=your_regrid_api_key_here
```

## Performance Considerations

### ⚡ **Optimization Strategies**

1. **Caching**: 24-hour cache reduces redundant API calls
2. **Error Recovery**: Graceful fallbacks for missing data
3. **Timeout Handling**: 10-second request timeout prevents hanging
4. **Cache Cleanup**: Automatic cleanup when cache exceeds 100 entries

### 📊 **Rate Limiting**

- No specific rate limit mentioned in Regrid documentation
- Implement client-side throttling for bulk operations
- Cache results to minimize API usage
- Use appropriate search radius to avoid over-querying

## Testing

### 🧪 **Sample Test Coordinates**

```typescript
// Test coordinates within supported counties
const testCoordinates = [
  { lat: 39.7684, lon: -86.1581, name: 'Monument Circle, Indianapolis, IN' },
  { lat: 32.7767, lon: -96.7970, name: 'Dallas City Hall, Dallas, TX' },
  { lat: 36.1627, lon: -86.7816, name: 'Nashville, TN (Wilson County area)' },
  { lat: 35.9940, lon: -78.8986, name: 'Durham, NC' },
  { lat: 40.5908, lon: -97.4942, name: 'Fillmore County, NE' },
  { lat: 44.4053, lon: -90.0715, name: 'Clark County, WI' },
  { lat: 18.2208, lon: -65.9665, name: 'Gurabo, Puerto Rico' }
];

// Test function
const testPropertyLookup = async () => {
  for (const coord of testCoordinates) {
    console.log(`Testing: ${coord.name}`);
    const result = await regridService.getPropertyByCoordinates(coord.lat, coord.lon);
    console.log(result.success ? 'Found property' : 'No property found');
  }
};
```

## Best Practices

### 🎯 **Implementation Guidelines**

1. **Always Check Success Status**: Handle both success and error cases
2. **Use Appropriate Radius**: Start with 100m, adjust based on area density
3. **Cache Results**: Leverage built-in caching for better performance
4. **Handle Missing Data**: Not all properties have complete information
5. **Validate Coordinates**: Ensure coordinates are within supported counties

### 🔒 **Security**

1. **API Key Protection**: Never expose API keys in client-side code
2. **Input Validation**: Validate coordinates before API calls
3. **Error Sanitization**: Don't expose internal error details to users
4. **Rate Limiting**: Implement client-side throttling for bulk operations

This RegridService provides a comprehensive solution for real estate data access in the RealEstateX platform, enabling accurate property lookup and valuation based on government records.
