import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { regridService } from '@/services/regridService';
import { verificationService } from '@/services/verificationService';
import { DocumentUpload } from '@/components/upload/DocumentUpload'; // Restored import

// Interfaces are consistent across both files
interface CoordinateInput {
  lat: string;
  lon: string;
  radius: string;
}

interface PropertyData {
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
    total: number;
  };
}

interface PropertyRegistrationProps {
  uploadedDocuments: Array<{ file: File; ipfs_hash: string }>;
  onRegistrationComplete: (propertyId: string) => void;
}

export const PropertyRegistration: React.FC<PropertyRegistrationProps> = ({
  uploadedDocuments,
  onRegistrationComplete,
}) => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // State combined from both files to support the full 4-step flow
  const [localUploadedDocs, setLocalUploadedDocs] = useState(uploadedDocuments || []);
  const [currentStep, setCurrentStep] = useState<'upload' | 'coordinates' | 'property' | 'consent'>('upload');
  const [coordinates, setCoordinates] = useState<CoordinateInput>({
    lat: '',
    lon: '',
    radius: '100',
  });
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [consentSigned, setConsentSigned] = useState(false);

  // Handler for the restored upload step
  const handleUploadComplete = (docs: Array<{ file: File; ipfs_hash: string }>) => {
    setLocalUploadedDocs(docs);
    setCurrentStep('coordinates');
  };

  const handleLookupProperty = async () => {
    if (!coordinates.lat || !coordinates.lon) {
      setError('Please enter both latitude and longitude');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const lat = parseFloat(coordinates.lat);
      const lon = parseFloat(coordinates.lon);
      const radius = parseInt(coordinates.radius);

      const result = await regridService.getPropertyByCoordinates(lat, lon, radius);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch property data');
      }

      const property = result.data!;
      setPropertyData({
        address: property.address,
        city: property.city,
        state: property.state,
        area: property.area,
        propertyType: property.propertyType,
        coordinates: property.coordinates,
        owner: property.owner,
        value: { total: property.value.total },
      });

      setCurrentStep('property');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignConsent = async () => {
    if (!address || !propertyData) return;

    setIsLoading(true);
    setError('');

    try {
      const consentMessage = `I confirm that I am the legal owner of the property at ${propertyData.address} and consent to tokenize this property on the blockchain. Wallet: ${address}`;

      const signature = await signMessageAsync({ message: consentMessage });

      if (signature) {
        setConsentSigned(true);
        setCurrentStep('consent');
      }
    } catch (err) {
      console.error("Consent signing error:", err);
      setError('Failed to sign consent message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRegistration = async () => {
    if (!propertyData || !address || !consentSigned) return;

    setIsLoading(true);
    setError('');

    try {
      const propertyId = `prop_${propertyData.coordinates.lat}_${propertyData.coordinates.lon}_${address.slice(2, 8)}`;
      
      // Using localUploadedDocs from state to ensure currently uploaded files are used
      const documentHashes = localUploadedDocs.map((doc) => doc.ipfs_hash);

      await verificationService.submitForVerification(
        propertyId,
        documentHashes,
        {
          address: propertyData.address,
          estimatedValue: propertyData.value.total || 0,
          ownerName: propertyData.owner,
        }
      );

      onRegistrationComplete(propertyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Restored 'upload' step with the new UI style
  if (currentStep === 'upload') {
    return (
      <div className="card-glass animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Upload Property Documents</h2>
            <p className="text-white/80 mt-2">
              Upload required documents for your property, stored securely on IPFS.
            </p>
          </div>
          <div className="floating">
              <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          </div>
        </div>
        <DocumentUpload onUploadComplete={handleUploadComplete} />
      </div>
    );
  }

  // 'coordinates' step with the new UI
  if (currentStep === 'coordinates') {
    return (
      <div className="card-glass animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Property Coordinates</h2>
            <p className="text-white/80 mt-2">
              Enter coordinates to fetch real estate data from government records.
            </p>
          </div>
          <div className="floating">
            <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: "0.1s" }} >
              <label className="block text-sm font-semibold text-white">Latitude *</label>
              <input type="number" step="any" value={coordinates.lat} onChange={(e) => setCoordinates((prev) => ({ ...prev, lat: e.target.value }))} placeholder="39.7684" className="input-glass w-full" />
            </div>
            <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: "0.2s" }} >
              <label className="block text-sm font-semibold text-white">Longitude *</label>
              <input type="number" step="any" value={coordinates.lon} onChange={(e) => setCoordinates((prev) => ({ ...prev, lon: e.target.value }))} placeholder="-86.1581" className="input-glass w-full" />
            </div>
            <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: "0.3s" }} >
              <label className="block text-sm font-semibold text-white">Search Radius (m)</label>
              <input type="number" value={coordinates.radius} onChange={(e) => setCoordinates((prev) => ({...prev, radius: e.target.value, }))} placeholder="100" className="input-glass w-full" />
            </div>
          </div>
          {error && (
            <div className="glass rounded-xl p-4 border border-red-400/30 bg-red-500/10 animate-shake">
                <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}
          <button onClick={handleLookupProperty} disabled={isLoading || !coordinates.lat || !coordinates.lon} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed animate-bounce-in" style={{ animationDelay: "0.5s" }} >
            {isLoading ? 'Looking up...' : 'Lookup Property Data'}
          </button>
        </div>
      </div>
    );
  }

  // 'property' verification step with the new UI
  if (currentStep === 'property' && propertyData) {
    return (
      <div className="card-glass animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Verify Property Information</h2>
            <p className="text-white/80 mt-2">
              Please verify the property information retrieved from government records.
            </p>
          </div>
           <div className="floating">
             <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" >
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
             </svg>
           </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="glass rounded-xl p-6 border border-white/20 animate-slide-in-left">
                <h3 className="text-lg font-semibold text-white mb-4">Property Details</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/70">Address</span>
                        <span className="text-white font-medium">{propertyData.address}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/70">Type</span>
                        <span className="text-white font-medium capitalize">{propertyData.propertyType}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-white/70">Owner</span>
                        <span className="text-white font-medium">{propertyData.owner}</span>
                    </div>
                </div>
            </div>
             <div className="glass rounded-xl p-6 border border-white/20 animate-slide-in-right">
                <h3 className="text-lg font-semibold text-white mb-4">Location & Value</h3>
                <div className="space-y-3 text-sm">
                     <div className="py-2 border-b border-white/10">
                        <span className="text-white/70 block mb-1">Coordinates</span>
                        <span className="text-white font-medium">{propertyData.coordinates.lat.toFixed(6)}, {propertyData.coordinates.lon.toFixed(6)}</span>
                    </div>
                    <div className="py-2">
                        <span className="text-white/70 block mb-1">Assessed Value</span>
                        <span className="text-2xl font-bold text-yellow-400">
                            {propertyData.value.total > 0 ? `$${propertyData.value.total.toLocaleString()}`: "Not assessed"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        {error && (
            <div className="glass rounded-xl p-4 border border-red-400/30 bg-red-500/10 mb-6 animate-shake">
                <p className="text-red-400 font-medium">{error}</p>
            </div>
        )}
        <div className="flex gap-4">
          <button onClick={() => setCurrentStep('coordinates')} className="btn-secondary flex-1">Back</button>
          <button onClick={handleSignConsent} disabled={isLoading} className="btn-success flex-1">
            {isLoading ? 'Signing...' : 'Sign Ownership Consent'}
          </button>
        </div>
      </div>
    );
  }
  
  // 'consent' and final submission step with the new UI
  if (currentStep === 'consent' && propertyData && consentSigned) {
    return (
      <div className="card-glass animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Submit Registration</h2>
            <p className="text-white/80 mt-2">
              Your ownership is verified. Ready to submit for blockchain registration.
            </p>
          </div>
        </div>
        <div className="glass rounded-xl p-6 border border-green-400/30 bg-green-500/10 mb-6 animate-bounce-in">
            <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Ownership Consent Signed</h3>
            <p className="text-green-300 text-sm">
                You have successfully signed the ownership consent for {propertyData.address}.
            </p>
        </div>
        <div className="glass rounded-xl p-6 border border-white/20 mb-6">
             <h3 className="text-lg font-semibold text-white mb-4">Registration Summary</h3>
             <div className="space-y-3 text-sm">
                 <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/70">Property</span>
                    <span className="text-white font-medium">{propertyData.address}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white/70">Documents</span>
                    <span className="text-white font-medium">{localUploadedDocs.length} files uploaded</span>
                 </div>
                 <div className="flex justify-between items-center py-2">
                    <span className="text-white/70">Verification</span>
                    <span className="text-white font-medium">Hybrid verification system</span>
                 </div>
             </div>
        </div>
        {error && (
            <div className="glass rounded-xl p-4 border border-red-400/30 bg-red-500/10 mb-6 animate-shake">
                <p className="text-red-400 font-medium">{error}</p>
            </div>
        )}
        <div className="flex gap-4">
          <button onClick={() => setCurrentStep('property')} className="btn-secondary flex-1">Back</button>
          <button onClick={handleSubmitRegistration} disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? 'Submitting...' : 'Submit Property Registration'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};