/**
 * Regrid Property Data Service
 * Real property data API integration using Regrid API
 */

interface RegridPropertyData {
  headline: string;
  path: string;
  fields: {
    ogc_fid: number;
    geoid: string;
    parcelnumb: string;
    state_parcelnumb: string;
    usecode: string;
    usedesc: string;
    zoning: string;
    zoning_description: string;
    zoning_type: string;
    zoning_subtype: string;
    parvaltype: string;
    improvval: number;
    landval: number;
    parval: number;
    owner: string;
    mailadd: string;
    mail_city: string;
    mail_state2: string;
    mail_zip: string;
    address: string;
    saddno: string;
    saddstr: string;
    saddsttyp: string;
    scity: string;
    city: string;
    county: string;
    state2: string;
    szip: string;
    lat: string;
    lon: string;
    legaldesc: string;
    sqft: number;
    ll_gisacre: number;
    ll_gissqft: number;
    ll_bldg_footprint_sqft: number;
    ll_bldg_count: number;
    median_household_income: number;
    housing_affordability_index: number;
    population_density: number;
    [key: string]: any;
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
  ll_uuid: string;
}

interface RegridApiResponse {
  parcels: {
    features: Array<{
      properties: RegridPropertyData;
    }>;
  };
}

interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  area: number;
  propertyType: 'residential' | 'commercial' | 'plot';
  coordinates: {
    lat: number;
    lon: number;
  };
  owner: string;
  value: {
    land: number;
    improvement: number;
    total: number;
  };
  zoning: {
    code: string;
    description: string;
    type: string;
    subtype: string;
  };
  legal: {
    parcelNumber: string;
    stateParcelNumber: string;
    legalDescription: string;
  };
  demographics: {
    medianIncome: number;
    affordabilityIndex: number;
    populationDensity: number;
  };
}

interface ServiceConfig {
  apiKey: string;
  baseUrl: string;
}

export class RegridPropertyService {
  private config: ServiceConfig;
  private cache = new Map<string, PropertyDetails>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(config: ServiceConfig) {
    this.config = config;
    // Clean up old cache entries periodically
    setInterval(() => this.cleanupCache(), this.CACHE_DURATION);
  }

  private cleanupCache(): void {
    // Simple cache cleanup - in production, you'd track timestamps
    if (this.cache.size > 100) {
      this.cache.clear();
    }
  }

  /**
   * Get property details by coordinates
   */
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

  /**
   * Transform Regrid API data to our PropertyDetails format
   */
  private transformRegridData(regridData: RegridPropertyData): PropertyDetails {
    const fields = regridData.fields;
    
    return {
      address: fields.address || `${fields.saddno} ${fields.saddstr} ${fields.saddsttyp}`,
      city: fields.scity || fields.city,
      state: fields.state2,
      area: fields.sqft || fields.ll_gissqft || 0,
      propertyType: this.determinePropertyType(fields.usedesc, fields.zoning_type),
      coordinates: {
        lat: parseFloat(fields.lat),
        lon: parseFloat(fields.lon)
      },
      owner: fields.owner,
      value: {
        land: fields.landval || 0,
        improvement: fields.improvval || 0,
        total: fields.parval || 0
      },
      zoning: {
        code: fields.zoning || '',
        description: fields.zoning_description || '',
        type: fields.zoning_type || '',
        subtype: fields.zoning_subtype || ''
      },
      legal: {
        parcelNumber: fields.parcelnumb,
        stateParcelNumber: fields.state_parcelnumb,
        legalDescription: fields.legaldesc || ''
      },
      demographics: {
        medianIncome: fields.median_household_income || 0,
        affordabilityIndex: fields.housing_affordability_index || 0,
        populationDensity: fields.population_density || 0
      }
    };
  }

  /**
   * Determine property type from use description and zoning
   */
  private determinePropertyType(
    useDesc: string, 
    zoningType: string
  ): 'residential' | 'commercial' | 'plot' {
    const desc = (useDesc || '').toLowerCase();
    const zoning = (zoningType || '').toLowerCase();

    if (desc.includes('residential') || zoning.includes('residential')) {
      return 'residential';
    }
    
    if (desc.includes('commercial') || zoning.includes('commercial') || 
        desc.includes('business') || zoning.includes('business')) {
      return 'commercial';
    }
    
    if (desc.includes('vacant') || desc.includes('land') || 
        desc.includes('agricultural') || zoning.includes('agricultural')) {
      return 'plot';
    }

    // Default based on zoning if available
    if (zoning.includes('commercial')) return 'commercial';
    if (zoning.includes('residential')) return 'residential';
    
    return 'plot'; // Default fallback
  }

  /**
   * Get property valuation based on real data
   */
  async getPropertyValuation(
    lat: number,
    lon: number
  ): Promise<{
    success: boolean;
    data?: {
      estimatedValue: number;
      confidenceScore: number;
      pricePerSqFt: number;
      marketTrend: 'rising' | 'stable' | 'declining';
      factors: Array<{
        factor: string;
        impact: 'positive' | 'negative' | 'neutral';
        weight: number;
        description: string;
      }>;
      lastUpdated: string;
    };
    error?: string;
  }> {
    try {
      const propertyResult = await this.getPropertyByCoordinates(lat, lon);
      
      if (!propertyResult.success || !propertyResult.data) {
        return {
          success: false,
          error: propertyResult.error || 'Could not retrieve property data'
        };
      }

      const property = propertyResult.data;
      const factors = [];
      let estimatedValue = property.value.total;
      let confidenceScore = 70; // Base confidence

      // Use assessed value as base if available
      if (property.value.total > 0) {
        estimatedValue = property.value.total;
        confidenceScore += 20;
        factors.push({
          factor: 'Assessed Value',
          impact: 'positive' as const,
          weight: 30,
          description: 'Based on official property assessment'
        });
      } else {
        // Estimate based on area and local factors
        const pricePerSqFt = this.getEstimatedPricePerSqFt(property);
        estimatedValue = property.area * pricePerSqFt;
        factors.push({
          factor: 'Area-based Estimation',
          impact: 'neutral' as const,
          weight: 20,
          description: 'Estimated based on property area and location factors'
        });
      }

      // Demographics factor
      if (property.demographics.medianIncome > 0) {
        const incomeMultiplier = property.demographics.medianIncome / 50000; // Base $50k
        if (incomeMultiplier > 1.2) {
          factors.push({
            factor: 'High-Income Area',
            impact: 'positive' as const,
            weight: 15,
            description: `Area median income: $${property.demographics.medianIncome.toLocaleString()}`
          });
          estimatedValue *= 1.1;
        }
      }

      // Zoning factor
      if (property.zoning.type.toLowerCase().includes('commercial')) {
        factors.push({
          factor: 'Commercial Zoning',
          impact: 'positive' as const,
          weight: 10,
          description: 'Commercial zoning increases property value'
        });
        estimatedValue *= 1.15;
      }

      const pricePerSqFt = property.area > 0 ? estimatedValue / property.area : 0;

      return {
        success: true,
        data: {
          estimatedValue: Math.round(estimatedValue),
          confidenceScore: Math.min(confidenceScore, 95),
          pricePerSqFt: Math.round(pricePerSqFt),
          marketTrend: this.determineMarketTrend(property),
          factors,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Valuation failed'
      };
    }
  }

  /**
   * Get estimated price per square foot based on location and demographics
   */
  private getEstimatedPricePerSqFt(property: PropertyDetails): number {
    let basePricePerSqFt = 100; // Default base price

    // Adjust based on state (simplified for US properties)
    const stateMultipliers: Record<string, number> = {
      'CA': 500,
      'NY': 400,
      'FL': 200,
      'TX': 150,
      'IN': 120, // Indiana
      'OH': 110,
      'MI': 100
    };

    basePricePerSqFt = stateMultipliers[property.state] || 120;

    // Adjust based on median income
    if (property.demographics.medianIncome > 0) {
      const incomeMultiplier = Math.min(property.demographics.medianIncome / 50000, 3);
      basePricePerSqFt *= incomeMultiplier;
    }

    // Adjust based on property type
    if (property.propertyType === 'commercial') {
      basePricePerSqFt *= 1.3;
    } else if (property.propertyType === 'plot') {
      basePricePerSqFt *= 0.6;
    }

    return basePricePerSqFt;
  }

  /**
   * Determine market trend based on available data
   */
  private determineMarketTrend(property: PropertyDetails): 'rising' | 'stable' | 'declining' {
    // This is simplified - in a real implementation, you'd compare historical data
    if (property.demographics.affordabilityIndex > 90) {
      return 'rising';
    } else if (property.demographics.affordabilityIndex < 70) {
      return 'declining';
    }
    return 'stable';
  }

  /**
   * Get cached result
   */
  private getCachedResult(key: string): PropertyDetails | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // For now, return cached data (in a real app, you'd check timestamp)
    return cached;
  }

  /**
   * Cache result
   */
  private cacheResult(key: string, result: PropertyDetails): void {
    this.cache.set(key, result);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const regridService = new RegridPropertyService({
  apiKey: import.meta.env.VITE_REGRID_API_KEY || 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJyZWdyaWQuY29tIiwiaWF0IjoxNzUyNjU5OTY1LCJleHAiOjE3NTUyNTE5NjUsInUiOjU2MDk2OCwiZyI6MjMxNTMsImNhcCI6InBhOnRzOnBzOmJmOm1hOnR5OmVvOnpvOnNiIn0.ompsOyn--wJABGHgiuElZgi-QmzKhnc1axXrBp3ohC0',
  baseUrl: 'https://app.regrid.com/api/v2'
});
