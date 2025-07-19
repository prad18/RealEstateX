import React, { useState } from 'react';
import { regridService } from '@/services/regridService';
import { useAccount , useSignMessage } from 'wagmi';
import { mintPropertyNFT , setPropertyVerified } from '@/services/contracts';
import { MintPopup } from '@/components/ui/MintPopup'


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
  const [coordinates, setCoordinates] = useState({
    lat: '',
    lon: '',
    radius: '100'
  });
  
  const [showMintPopup, setShowMintPopup] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

  const [propertyData, setPropertyData] = useState<PropertyDetails | null>(null);
  const [valuation, setValuation] = useState<PropertyValuation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'property' | 'valuation'>('input');

  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [consentSigned , setConsentSigned] = useState(false);
  const [minting , setMinting] = useState(false);
  const [mintSuccess , setMintSuccess] = useState(false);
  const [mintError , setMintError] = useState<string | null>(null);
  const [vaultSuccessMessage, setVaultSuccessMessage] = useState<string | null>(null);
  
  const handleLookup = async () => {
    if (!coordinates.lat || !coordinates.lon) {
      setError('Please enter both latitude and longitude');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lat = parseFloat(coordinates.lat);
      const lon = parseFloat(coordinates.lon);
      const radius = parseInt(coordinates.radius);

      // Get property data
      const result = await regridService.getPropertyByCoordinates(lat, lon, radius);
      
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

  const handleReset = () => {
    setPropertyData(null);
    setValuation(null);
    setError(null);
    setStep('input');
    setCoordinates({ lat: '', lon: '', radius: '100' });
  };

  const getMarketTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleConsentAndMint = async () =>{
    if(!address || !valuation || !propertyData) return;
    setMintError(null);
    setMinting(true);
    setMintSuccess(false);
    try{
      const consetMessage = `I , ${address} , consent to mint an NFT for the property at ${propertyData.address} with a valuation of ${valuation.estimatedValue}`;
      console.log(address); // debug statement
      const signature = await signMessageAsync({message : consetMessage});
      if(!signature) throw new Error('Consent Signature Failed');
      setConsentSigned(true);
      const ipfsHash =  'Qma6e8dovN9UiaQ3PiDWWU5zEVr7h4h8E3xFtL3mkoD5aK'; // Placeholder IPFS hash
      const result = await mintPropertyNFT(address, ipfsHash, valuation.estimatedValue);
      const transferEvent = result.logs?.find((log: any) => log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef');
      const tokenId = transferEvent?.topics[3] ? parseInt(transferEvent.topics[3], 16) : null;
      setMintedTokenId(tokenId);
      setMintSuccess(true);
      if (tokenId !== null){
        await setPropertyVerified(tokenId , true);//we assume that this will always work;
      }

    } catch(err : any)
    {
       console.log(err.message);
       setMintError(err.message || 'Minting Failed');
    }
    finally{
      setMinting(false);
    }
  };

  // Handlers for the MintPopup (Open Vault) component
  const handleVaultSuccess = (tokenId: number) => {
    setShowMintPopup(false);
    setVaultSuccessMessage(`Successfully opened vault for Token ID #${tokenId}!`);
    setTimeout(() => setVaultSuccessMessage(null), 5000); // Clear message after 5 seconds
  };

  const handleVaultError = (error: string) => {
    setShowMintPopup(false);
    setMintError(error); // Reuse the existing error state to display the message
    setTimeout(() => setMintError(null), 5000);
  };
  
  if (step === 'input') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Real Property Lookup
          </h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Using Real Property Data</h3>
            <p className="text-blue-800 text-sm">
              This system now uses the Regrid API to fetch real property data. 
              Enter coordinates to look up actual property information from government records.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={coordinates.lat}
                  onChange={(e) => setCoordinates(prev => ({ ...prev, lat: e.target.value }))}
                  placeholder="39.7684"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={coordinates.lon}
                  onChange={(e) => setCoordinates(prev => ({ ...prev, lon: e.target.value }))}
                  placeholder="-86.1581"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Radius (meters)
                </label>
                <input
                  type="number"
                  value={coordinates.radius}
                  onChange={(e) => setCoordinates(prev => ({ ...prev, radius: e.target.value }))}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Sample Coordinates:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Monument Circle, Indianapolis:</strong><br />
                  Lat: 39.7684, Lon: -86.1581
                </div>
                <div>
                  <strong>Empire State Building, NYC:</strong><br />
                  Lat: 40.7484, Lon: -73.9857
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={handleLookup}
              disabled={loading || !coordinates.lat || !coordinates.lon}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Looking up property...' : 'Lookup Property'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'property' && propertyData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Property Details</h1>
            <button
              onClick={handleReset}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Search
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Address:</span>
                  <div className="text-gray-600">{propertyData.address}</div>
                  <div className="text-gray-600">{propertyData.city}, {propertyData.state}</div>
                </div>
                <div>
                  <span className="font-medium">Owner:</span>
                  <div className="text-gray-600">{propertyData.owner}</div>
                </div>
                <div>
                  <span className="font-medium">Property Type:</span>
                  <div className="text-gray-600 capitalize">{propertyData.propertyType}</div>
                </div>
                <div>
                  <span className="font-medium">Area:</span>
                  <div className="text-gray-600">{propertyData.area.toLocaleString()} sq ft</div>
                </div>
                <div>
                  <span className="font-medium">Coordinates:</span>
                  <div className="text-gray-600">
                    {propertyData.coordinates.lat.toFixed(6)}, {propertyData.coordinates.lon.toFixed(6)}
                  </div>
                </div>
              </div>
            </div>

            {/* Property Values */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Assessed Values</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Land Value:</span>
                  <div className="text-gray-600">
                    {propertyData.value.land > 0 ? `$${propertyData.value.land.toLocaleString()}` : 'Not assessed'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Improvement Value:</span>
                  <div className="text-gray-600">
                    {propertyData.value.improvement > 0 ? `$${propertyData.value.improvement.toLocaleString()}` : 'Not assessed'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Total Assessed Value:</span>
                  <div className="text-lg font-semibold text-green-600">
                    {propertyData.value.total > 0 ? `$${propertyData.value.total.toLocaleString()}` : 'Not assessed'}
                  </div>
                </div>
              </div>
            </div>

            {/* Zoning Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Zoning & Legal</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Zoning Code:</span>
                  <div className="text-gray-600">{propertyData.zoning.code}</div>
                </div>
                <div>
                  <span className="font-medium">Zoning Description:</span>
                  <div className="text-gray-600">{propertyData.zoning.description}</div>
                </div>
                <div>
                  <span className="font-medium">Zoning Type:</span>
                  <div className="text-gray-600">{propertyData.zoning.type}</div>
                </div>
                <div>
                  <span className="font-medium">Parcel Number:</span>
                  <div className="text-gray-600">{propertyData.legal.parcelNumber}</div>
                </div>
                <div>
                  <span className="font-medium">State Parcel Number:</span>
                  <div className="text-gray-600 text-sm">{propertyData.legal.stateParcelNumber}</div>
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Area Demographics</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Median Household Income:</span>
                  <div className="text-gray-600">
                    {propertyData.demographics.medianIncome > 0 
                      ? `$${propertyData.demographics.medianIncome.toLocaleString()}` 
                      : 'Not available'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Housing Affordability Index:</span>
                  <div className="text-gray-600">
                    {propertyData.demographics.affordabilityIndex > 0 
                      ? propertyData.demographics.affordabilityIndex 
                      : 'Not available'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Population Density:</span>
                  <div className="text-gray-600">
                    {propertyData.demographics.populationDensity > 0 
                      ? `${propertyData.demographics.populationDensity.toFixed(1)} per sq mi` 
                      : 'Not available'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Description */}
          {propertyData.legal.legalDescription && (
            <div className="mt-6 bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Legal Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {propertyData.legal.legalDescription}
              </p>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <button
              onClick={handleGetValuation}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Getting Valuation...' : 'Get Property Valuation'}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'valuation' && valuation && propertyData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Property Valuation</h1>
            <button
              onClick={handleReset}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← New Search
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Valuation Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Valuation Summary</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">Estimated Market Value</span>
                  <div className="text-3xl font-bold text-green-600">
                    ${valuation.estimatedValue.toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Price per Sq Ft</span>
                    <div className="text-lg font-semibold">
                      ${valuation.pricePerSqFt.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Confidence Score</span>
                    <div className="text-lg font-semibold">
                      {valuation.confidenceScore}%
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Market Trend</span>
                  <div className={`text-lg font-semibold capitalize ${getMarketTrendColor(valuation.marketTrend)}`}>
                    {valuation.marketTrend}
                  </div>
                </div>
              </div>
            </div>

            {/* Property Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Property Summary</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Address:</span>
                  <div className="text-gray-600">{propertyData.address}</div>
                </div>
                <div>
                  <span className="font-medium">Area:</span>
                  <div className="text-gray-600">{propertyData.area.toLocaleString()} sq ft</div>
                </div>
                <div>
                  <span className="font-medium">Property Type:</span>
                  <div className="text-gray-600 capitalize">{propertyData.propertyType}</div>
                </div>
                <div>
                  <span className="font-medium">Assessed Value:</span>
                  <div className="text-gray-600">
                    {propertyData.value.total > 0 
                      ? `$${propertyData.value.total.toLocaleString()}` 
                      : 'Not assessed'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Valuation Factors */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Valuation Factors</h2>
            <div className="space-y-4">
              {valuation.factors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{factor.factor}</div>
                    <div className="text-sm text-gray-600">{factor.description}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${getImpactColor(factor.impact)}`}>
                      {factor.impact === 'positive' ? '+' : factor.impact === 'negative' ? '-' : ''}
                      {factor.weight}%
                    </div>
                    <div className="text-xs text-gray-500 capitalize">{factor.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            Last updated: {new Date(valuation.lastUpdated).toLocaleString()}
          </div>
        </div>

        {/* Consent and Mint Button */}
        <div className='mt-8 flex flex-col items-center'>
          <button
            onClick={handleConsentAndMint}
            disabled={minting || !address}
            className="w-full max-w-md bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {minting ? 'Minting NFT...' : 'Sign Consent & Mint Property NFT'}
          </button>
          {mintSuccess && (
            <div className="mt-4 w-full max-w-md bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-center">
                Property NFT Successfully Minted!
                {mintedTokenId && <span className="block text-sm mt-1">Token ID: #{mintedTokenId}</span>}
              </p>
              <div className="flex justify-center mt-3">
                <button
                    onClick={() => setShowMintPopup(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                    🏠 Open Vault & Mint HOMED Tokens
                </button>
              </div>
            </div>
          )}
          {vaultSuccessMessage && (
             <div className="mt-4 w-full max-w-md bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-purple-800 text-center">{vaultSuccessMessage}</p>
            </div>
          )}
          {mintError && (
            <div className="mt-4 w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-4">
              <p className='text-red-800 text-center'>{mintError}</p>
            </div>
          )}
        </div>
        
        {/* Add MintPopup component at the end, before closing div */}
        {showMintPopup && propertyData && valuation && (
          <MintPopup
            isOpen={showMintPopup}
            onClose={() => setShowMintPopup(false)}
            propertyData={propertyData}
            valuation={valuation}
            onMintSuccess={handleVaultSuccess}
            onMintError={handleVaultError}
          />
        )}
      </div>
    );
  }

  return null;
};
