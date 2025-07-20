import React, { useState } from 'react';
import { regridService } from '@/services/regridService';
import { PropertyRegistration } from '@/components/property/PropertyRegistration';
import { LocationPicker, type LocationData } from './LocationPicker'; // Assuming LocationPicker is in this path

// Interface for property details, combining fields from both versions
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

// Interface for property valuation, combining fields from both versions
interface PropertyValuation {
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
}

export const CoordinatePropertyLookup: React.FC = () => {
  // State management from the new, more stylized version
  const [location, setLocation] = useState<LocationData>({
    lat: 39.7684,
    lon: -86.1581,
    address: 'Monument Circle, Indianapolis, IN, USA'
  });
  const [radius, setRadius] = useState('100');
  
  // Core state from original and new versions
  const [propertyData, setPropertyData] = useState<PropertyDetails | null>(null);
  const [valuation, setValuation] = useState<PropertyValuation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'property' | 'valuation' | 'register'>('input');

  // State for the original registration flow
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ file: File; ipfs_hash: string }>>([]);

  // Handler for property lookup using LocationPicker
  const handleLookup = async () => {
    if (!location.lat || !location.lon) {
      setError('Please select a valid location');
      return;
    }

    setLoading(true);
    setError(null);
    setRegistrationSuccess(null); // Clear success message on new lookup

    try {
      const lat = location.lat;
      const lon = location.lon;
      const radiusNum = parseInt(radius);

      const result = await regridService.getPropertyByCoordinates(lat, lon, radiusNum);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch property data');
      }

      setPropertyData(result.data!);
      setStep('property');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handler for getting property valuation
  const handleGetValuation = async () => {
    if (!propertyData) return;

    setLoading(true);
    setError(null);

    try {
      const result = await regridService.getPropertyValuation(
        propertyData.coordinates.lat,
        propertyData.coordinates.lon
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to get valuation');
      }

      setValuation(result.data!);
      setStep('valuation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Valuation failed');
    } finally {
      setLoading(false);
    }
  };

  // Preserved handlers for the original registration flow
  const handleRegisterClick = () => {
    setStep('register');
  };

  const handleRegistrationComplete = (propertyId: string) => {
    setRegistrationSuccess(`✅ Property registered on-chain! Property ID: ${propertyId}`);
    // Reset to the beginning of the flow
    setPropertyData(null);
    setValuation(null);
    setError(null);
    setStep('input');
  };

  // Reset handler that clears all states
  const handleReset = () => {
    setPropertyData(null);
    setValuation(null);
    setError(null);
    setStep('input');
    setLocation({
      lat: 39.7684,
      lon: -86.1581,
      address: 'Monument Circle, Indianapolis, IN, USA'
    });
    setRadius('100');
    setRegistrationSuccess(null);
  };

  // Helper functions for styling from the new version
  const getMarketTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return 'text-green-400';
      case 'declining': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  // === UI Steps ===

  if (step === 'input') {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <div className="card-glass animate-fade-in-down">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Real Property Lookup
              </h1>
              <p className="text-gray-300 mt-2">
                Discover property data using precise geolocation
              </p>
            </div>
            <div className="gradient-border w-16 h-16">
              <div className="gradient-border-content w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 mb-6 border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-indigo-600/10">
            <div className="flex items-center space-x-3 mb-3">
               <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              <h3 className="font-semibold text-white">Using Real Property Data</h3>
            </div>
            <p className="text-gray-300 text-sm">
              This system uses the Regrid API to fetch real property data. 
              Select a location to look up actual property information from government records.
            </p>
          </div>

          <div className="space-y-6">
            <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                📍 Select Property Location
              </label>
              <LocationPicker
                onChange={setLocation}
                initialLocation={location}
                className="border border-gray-200 rounded-lg p-4"
              />
            </div>

            <div className="max-w-xs animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Search Radius (meters)
              </label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-3 glass rounded-xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              />
            </div>
            
            {/* Displaying registration success message from original flow */}
            {registrationSuccess && (
                <div className="glass rounded-xl p-4 border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-600/10 animate-scale-in">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-green-300">{registrationSuccess}</p>
                </div>
                </div>
            )}

            {error && (
              <div className="glass rounded-xl p-4 border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-600/10 animate-shake">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLookup}
              disabled={loading || !location.lat || !location.lon}
              className="w-full btn-primary text-lg py-4 animate-fade-in-up disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ animationDelay: "0.4s" }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Looking up property...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  <span>Lookup Property</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'property' && propertyData) {
    return (
      <div className="max-w-6xl mx-auto p-6 animate-fade-in">
        <div className="card-glass animate-fade-in-down">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Property Details
              </h1>
              <p className="text-gray-300 mt-2">
                Comprehensive property information from government records
              </p>
            </div>
            <button onClick={handleReset} className="btn-secondary flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              <span>Back to Search</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="interactive-card glass-dark rounded-2xl p-6 magnetic-hover animate-fade-in-up" style={{ animationDelay: "0.1s" }} >
              <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
              <div className="space-y-4">
                  <div className="glass rounded-lg p-3 border border-white/10">
                    <span className="font-medium text-gray-300">Address:</span>
                    <div className="text-white mt-1">{propertyData.address}</div>
                    <div className="text-gray-400">{propertyData.city}, {propertyData.state}</div>
                  </div>
                  <div className="glass rounded-lg p-3 border border-white/10">
                      <span className="font-medium text-gray-300">Owner:</span>
                      <div className="text-white mt-1">{propertyData.owner}</div>
                  </div>
                   <div className="glass rounded-lg p-3 border border-white/10">
                      <span className="font-medium text-gray-300">Property Type:</span>
                      <div className="text-white mt-1 capitalize">{propertyData.propertyType}</div>
                  </div>
                  <div className="glass rounded-lg p-3 border border-white/10">
                      <span className="font-medium text-gray-300">Area:</span>
                      <div className="text-white mt-1">{propertyData.area.toLocaleString()} sq ft</div>
                  </div>
              </div>
            </div>
            {/* Assessed Values */}
            <div className="interactive-card glass-dark rounded-2xl p-6 magnetic-hover animate-fade-in-up" style={{ animationDelay: "0.2s" }} >
              <h2 className="text-xl font-semibold text-white mb-4">Assessed Values</h2>
               <div className="space-y-4">
                  <div className="glass rounded-lg p-3 border border-white/10">
                      <span className="font-medium text-gray-300">Land Value:</span>
                      <div className="text-white mt-1 text-lg font-semibold">
                          {propertyData.value.land > 0 ? `$${propertyData.value.land.toLocaleString()}`: "Not assessed"}
                      </div>
                  </div>
                  <div className="glass rounded-lg p-3 border border-white/10">
                      <span className="font-medium text-gray-300">Improvement Value:</span>
                      <div className="text-white mt-1 text-lg font-semibold">
                          {propertyData.value.improvement > 0 ? `$${propertyData.value.improvement.toLocaleString()}` : "Not assessed"}
                      </div>
                  </div>
                  <div className="glass rounded-lg p-4 border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-600/10">
                      <span className="font-medium text-gray-300">Total Assessed Value:</span>
                      <div className="text-2xl font-bold text-green-400 mt-2">
                           {propertyData.value.total > 0 ? `$${propertyData.value.total.toLocaleString()}` : 'Not assessed'}
                      </div>
                  </div>
               </div>
            </div>
          </div>
          
          {propertyData.legal.legalDescription && (
            <div className="mt-8 card-glass animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                <h2 className="text-xl font-semibold text-white mb-4">Legal Description</h2>
                <div className="glass rounded-lg p-4 border border-white/10">
                    <p className="text-gray-300 leading-relaxed">{propertyData.legal.legalDescription}</p>
                </div>
            </div>
          )}

          <div className="mt-8 flex gap-4 animate-fade-in-up" style={{ animationDelay: "0.6s" }} >
            <button onClick={handleGetValuation} disabled={loading} className="flex-1 btn-primary text-lg py-4">
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Getting Valuation...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                    <span>Get Property Valuation</span>
                </div>
              )}
            </button>
          </div>

          {error && (
             <div className="mt-6 glass rounded-xl p-4 border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-600/10 animate-shake">
                <p className="text-red-300">{error}</p>
             </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'valuation' && valuation && propertyData) {
    return (
      <div className="max-w-6xl mx-auto p-6 animate-fade-in">
        <div className="card-glass animate-fade-in-down">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Property Valuation</h1>
                    <p className="text-gray-300 mt-2">AI-powered market analysis and property insights</p>
                </div>
                <button onClick={handleReset} className="btn-secondary flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>New Search</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="interactive-card glass-dark rounded-2xl p-6 magnetic-hover animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                    <h2 className="text-xl font-semibold text-white mb-4">Valuation Summary</h2>
                    <div className="space-y-4 text-center">
                        <div>
                            <span className="text-sm text-gray-400">Estimated Market Value</span>
                            <div className="text-4xl font-bold text-green-400 mt-2">
                                ${valuation.estimatedValue.toLocaleString()}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass rounded-lg p-4 border border-white/10">
                                <span className="text-sm text-gray-400">Price per Sq Ft</span>
                                <div className="text-xl font-semibold text-white mt-1">${valuation.pricePerSqFt.toLocaleString()}</div>
                            </div>
                            <div className="glass rounded-lg p-4 border border-white/10">
                                <span className="text-sm text-gray-400">Confidence Score</span>
                                <div className="text-xl font-semibold text-white mt-1">{valuation.confidenceScore}%</div>
                            </div>
                        </div>
                         <div className="glass rounded-lg p-4 border border-white/10">
                            <span className="text-sm text-gray-400">Market Trend</span>
                            <div className={`text-xl font-semibold capitalize mt-1 ${getMarketTrendColor(valuation.marketTrend)}`}>
                                {valuation.marketTrend}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="interactive-card glass-dark rounded-2xl p-6 magnetic-hover animate-fade-in-up" style={{ animationDelay: "0.2s" }} >
                    <h2 className="text-xl font-semibold text-white mb-4">Property Summary</h2>
                     <div className="space-y-4">
                        <div className="glass rounded-lg p-3 border border-white/10">
                            <span className="font-medium text-gray-300">Address:</span>
                            <div className="text-white mt-1">{propertyData.address}</div>
                        </div>
                        <div className="glass rounded-lg p-3 border border-white/10">
                            <span className="font-medium text-gray-300">Area:</span>
                            <div className="text-white mt-1">{propertyData.area.toLocaleString()} sq ft</div>
                        </div>
                         <div className="glass rounded-lg p-3 border border-white/10">
                            <span className="font-medium text-gray-300">Property Type:</span>
                            <div className="text-white mt-1 capitalize">{propertyData.propertyType}</div>
                        </div>
                        <div className="glass rounded-lg p-3 border border-white/10">
                            <span className="font-medium text-gray-300">Assessed Value:</span>
                             <div className="text-white mt-1">
                                {propertyData.value.total > 0 ? `$${propertyData.value.total.toLocaleString()}` : 'Not assessed'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 card-glass animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <h2 className="text-xl font-semibold text-white mb-4">Valuation Factors</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {valuation.factors.map((factor, index) => (
                        <div key={index} className="interactive-card glass-dark rounded-xl p-4 magnetic-hover">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-white mb-1">{factor.factor}</div>
                                    <div className="text-sm text-gray-400">{factor.description}</div>
                                </div>
                                <div className="text-right ml-4">
                                    <div className={`font-bold text-lg ${getImpactColor(factor.impact)}`}>
                                        {factor.impact === 'positive' ? '+' : factor.impact === 'negative' ? '-' : ''}
                                        {factor.weight}%
                                    </div>
                                    <div className={`text-xs font-medium capitalize ${getImpactColor(factor.impact)}`}>
                                        {factor.impact}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-6 text-xs text-gray-500">
                Last updated: {new Date(valuation.lastUpdated).toLocaleString()}
            </div>

            {/* Preserving the original "Register" button and functionality */}
            <div className="mt-8 flex justify-center animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
                <button
                    className="w-full max-w-md btn-primary text-lg py-4"
                    onClick={handleRegisterClick}
                >
                    Register this property on Blockchain
                </button>
            </div>
        </div>
      </div>
    );
  }

  // Preserving the original registration step, wrapped in the new UI style
  if (step === 'register' && propertyData) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <div className="card-glass animate-fade-in-down p-8">
            <PropertyRegistration
              uploadedDocuments={uploadedDocs}
              onRegistrationComplete={handleRegistrationComplete}
            />
        </div>
        <div className="mt-6 flex justify-center">
            <button
                onClick={handleReset}
                className="btn-secondary"
            >
                ← Back to Lookup
            </button>
        </div>
      </div>
    );
  }

  return null;
};