/**
 * Property Valuation Service for RealEstateX
 * Simulates property value estimation APIs
 */

export interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  pincode: string;
  propertyType: 'residential' | 'commercial' | 'plot';
  area: number; // in sq ft
  bedrooms?: number;
  bathrooms?: number;
  age?: number; // years
}

export interface MarketData {
  averagePricePerSqFt: number;
  recentSales: Array<{
    address: string;
    soldPrice: number;
    soldDate: string;
    area: number;
  }>;
  marketTrend: 'rising' | 'stable' | 'declining';
  confidenceScore: number; // 0-1
}

export interface ValuationResult {
  estimatedValue: number;
  valuationRange: {
    min: number;
    max: number;
  };
  pricePerSqFt: number;
  marketData: MarketData;
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
  confidenceLevel: 'high' | 'medium' | 'low';
  lastUpdated: number;
}

export interface MintCalculation {
  propertyValue: number;
  maxLoanToValue: number; // e.g., 0.8 for 80%
  maxMintAmount: number;
  requiredCollateralRatio: number; // e.g., 1.25 for 125%
  estimatedAPR: number;
  liquidationThreshold: number; // e.g., 1.1 for 110%
}

export class PropertyValuationService {
  private readonly LOAN_TO_VALUE_RATIO = 0.8; // 80%
  private readonly COLLATERAL_RATIO = 1.25; // 125%
  private readonly LIQUIDATION_THRESHOLD = 1.1; // 110%
  private readonly BASE_APR = 0.08; // 8%

  /**
   * Get property valuation estimate
   */
  async getPropertyValuation(propertyDetails: PropertyDetails): Promise<ValuationResult> {
    console.log('🏠 Fetching property valuation for:', propertyDetails.address);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const marketData = this.generateMarketData(propertyDetails);
    const baseValue = propertyDetails.area * marketData.averagePricePerSqFt;
    const adjustedValue = this.applyValuationFactors(baseValue, propertyDetails);

    const valuationRange = {
      min: adjustedValue * 0.9,
      max: adjustedValue * 1.1
    };

    return {
      estimatedValue: adjustedValue,
      valuationRange,
      pricePerSqFt: adjustedValue / propertyDetails.area,
      marketData,
      factors: this.getValuationFactors(propertyDetails),
      confidenceLevel: this.getConfidenceLevel(marketData.confidenceScore),
      lastUpdated: Date.now()
    };
  }

  /**
   * Calculate HOMED minting potential
   */
  calculateMintingPotential(propertyValue: number): MintCalculation {
    const maxMintAmount = propertyValue * this.LOAN_TO_VALUE_RATIO;
    
    return {
      propertyValue,
      maxLoanToValue: this.LOAN_TO_VALUE_RATIO,
      maxMintAmount,
      requiredCollateralRatio: this.COLLATERAL_RATIO,
      estimatedAPR: this.BASE_APR,
      liquidationThreshold: this.LIQUIDATION_THRESHOLD
    };
  }

  /**
   * Get multiple valuation estimates (for comparison)
   */
  async getMultipleEstimates(propertyDetails: PropertyDetails): Promise<{
    primary: ValuationResult;
    estimates: Array<{
      source: string;
      value: number;
      confidence: number;
    }>;
    consensus: number;
  }> {
    const primary = await this.getPropertyValuation(propertyDetails);
    
    // Mock multiple valuation sources
    const estimates = [
      {
        source: 'PropTiger API',
        value: primary.estimatedValue * (0.95 + Math.random() * 0.1),
        confidence: 0.85
      },
      {
        source: 'Housing.com API',
        value: primary.estimatedValue * (0.93 + Math.random() * 0.14),
        confidence: 0.78
      },
      {
        source: 'MagicBricks API',
        value: primary.estimatedValue * (0.97 + Math.random() * 0.06),
        confidence: 0.82
      }
    ];

    const consensus = estimates.reduce((sum, est) => sum + est.value, 0) / estimates.length;

    return {
      primary,
      estimates,
      consensus
    };
  }

  private generateMarketData(propertyDetails: PropertyDetails): MarketData {
    // Mock market data based on property location and type
    const basePricePerSqFt = this.getBasePricePerSqFt(propertyDetails);
    
    return {
      averagePricePerSqFt: basePricePerSqFt,
      recentSales: this.generateRecentSales(propertyDetails, basePricePerSqFt),
      marketTrend: this.getMarketTrend(),
      confidenceScore: 0.75 + Math.random() * 0.2 // 75-95%
    };
  }

  private getBasePricePerSqFt(propertyDetails: PropertyDetails): number {
    const cityMultipliers: Record<string, number> = {
      'mumbai': 15000,
      'delhi': 12000,
      'bangalore': 8000,
      'pune': 6000,
      'hyderabad': 5500,
      'chennai': 7000,
      'kolkata': 4500,
      'ahmedabad': 4000
    };

    const typeMultipliers = {
      'commercial': 1.5,
      'residential': 1.0,
      'plot': 0.7
    };

    const basePrice = cityMultipliers[propertyDetails.city.toLowerCase()] || 3000;
    const typeMultiplier = typeMultipliers[propertyDetails.propertyType];
    
    return basePrice * typeMultiplier * (0.9 + Math.random() * 0.2); // ±10% variation
  }

  private generateRecentSales(propertyDetails: PropertyDetails, pricePerSqFt: number) {
    return Array.from({ length: 5 }, (_, i) => ({
      address: `${propertyDetails.address.split(',')[0]} Area, Similar Property ${i + 1}`,
      soldPrice: (800 + Math.random() * 400) * pricePerSqFt, // Random area * price
      soldDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      area: 800 + Math.random() * 400 // Random area
    }));
  }

  private getMarketTrend(): 'rising' | 'stable' | 'declining' {
    const rand = Math.random();
    if (rand < 0.4) return 'rising';
    if (rand < 0.8) return 'stable';
    return 'declining';
  }

  private applyValuationFactors(baseValue: number, propertyDetails: PropertyDetails): number {
    let adjustedValue = baseValue;

    // Age factor
    if (propertyDetails.age) {
      if (propertyDetails.age < 5) adjustedValue *= 1.1; // New property premium
      else if (propertyDetails.age > 20) adjustedValue *= 0.9; // Older property discount
    }

    // Area factor
    if (propertyDetails.area > 2000) adjustedValue *= 1.05; // Large property premium
    if (propertyDetails.area < 500) adjustedValue *= 0.95; // Small property discount

    // Add random market variation (±15%)
    adjustedValue *= (0.85 + Math.random() * 0.3);

    return Math.round(adjustedValue);
  }

  private getValuationFactors(propertyDetails: PropertyDetails): Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }> {
    const factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }> = [
      {
        factor: 'Location',
        impact: 'positive',
        description: `${propertyDetails.city} is a high-demand market`
      },
      {
        factor: 'Property Type',
        impact: propertyDetails.propertyType === 'commercial' ? 'positive' : 'neutral',
        description: `${propertyDetails.propertyType} properties have good demand`
      }
    ];

    if (propertyDetails.age && propertyDetails.age < 5) {
      factors.push({
        factor: 'Property Age',
        impact: 'positive',
        description: 'Relatively new construction adds value'
      });
    }

    if (propertyDetails.area > 1500) {
      factors.push({
        factor: 'Size',
        impact: 'positive',
        description: 'Large properties command premium pricing'
      });
    }

    return factors;
  }

  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score > 0.85) return 'high';
    if (score > 0.65) return 'medium';
    return 'low';
  }

  /**
   * REAL API Integration Example (currently not implemented)
   */
  private async callRealEstateAPI(propertyDetails: PropertyDetails): Promise<number> {
    // Example: PropTiger API
    try {
      const response = await fetch('https://api.proptiger.com/v1/property/valuation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_PROPTIGER_API_KEY}`
        },
        body: JSON.stringify({
          address: propertyDetails.address,
          area: propertyDetails.area,
          propertyType: propertyDetails.propertyType,
          city: propertyDetails.city
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.estimatedValue;
    } catch (error) {
      console.error('Real estate API call failed:', error);
      // Fallback to mock data
      return this.generateMockValuation(propertyDetails);
    }
  }

  /**
   * Real Housing.com API integration (example)
   */
  private async callHousingAPI(propertyDetails: PropertyDetails): Promise<number> {
    try {
      const response = await fetch(`https://api.housing.com/v2/property-valuation?address=${encodeURIComponent(propertyDetails.address)}&area=${propertyDetails.area}`, {
        headers: {
          'X-API-Key': import.meta.env.VITE_HOUSING_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Housing API error: ${response.status}`);
      }

      const data = await response.json();
      return data.valuation.estimated_price;
    } catch (error) {
      console.error('Housing.com API call failed:', error);
      return this.generateMockValuation(propertyDetails);
    }
  }

  /**
   * To enable real API calls, modify getPropertyValuation:
   */
  async getPropertyValuationWithRealAPIs(propertyDetails: PropertyDetails): Promise<ValuationResult> {
    console.log('🏠 Fetching REAL property valuation for:', propertyDetails.address);

    try {
      // Call multiple real APIs in parallel
      const [propTigerValue, housingValue, magicBricksValue] = await Promise.all([
        this.callRealEstateAPI(propertyDetails),
        this.callHousingAPI(propertyDetails),
        this.callMagicBricksAPI(propertyDetails)
      ]);

      // Calculate consensus from real APIs
      const realEstimates = [propTigerValue, housingValue, magicBricksValue];
      const consensusValue = realEstimates.reduce((sum, val) => sum + val, 0) / realEstimates.length;

      return {
        estimatedValue: consensusValue,
        // ... rest of the response
      };
    } catch (error) {
      console.error('All real APIs failed, falling back to mock data:', error);
      return this.getPropertyValuation(propertyDetails); // Fallback to mock
    }
  }
}

// Export singleton instance
export const propertyValuationService = new PropertyValuationService();
