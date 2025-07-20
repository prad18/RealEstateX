import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { regridService } from '@/services/regridService';
import { verificationService } from '@/services/verificationService';
// Make sure you have this component!
import { DocumentUpload } from '@/components/upload/DocumentUpload';

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
  onRegistrationComplete
}) => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // ---- Additional for upload flow
  const [localUploadedDocs, setLocalUploadedDocs] = useState(uploadedDocuments || []);
  const [currentFlow, setCurrentFlow] = useState<'upload' | 'coordinates' | 'property' | 'consent'>('upload');
  // ---------------------------------

  const [coordinates, setCoordinates] = useState<CoordinateInput>({
    lat: '',
    lon: '',
    radius: '100'
  });

  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [consentSigned, setConsentSigned] = useState(false);

  const handleUploadComplete = (docs: Array<{ file: File; ipfs_hash: string }>) => {
    setLocalUploadedDocs(docs);
    setCurrentFlow('coordinates');
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
        value: { total: property.value.total }
      });

      setCurrentFlow('property');
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

      const signature = await signMessageAsync({
        message: consentMessage
      });

      if (signature) {
        setConsentSigned(true);
        setCurrentFlow('consent');
      }
    } catch (err) {
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
      // Generate property ID based on coordinates and owner
      const propertyId = `prop_${propertyData.coordinates.lat}_${propertyData.coordinates.lon}_${address.slice(2, 8)}`;

      // Get document hashes for verification
      const documentHashes = localUploadedDocs.map(doc => doc.ipfs_hash);

      // Submit for verification using the real property data
      await verificationService.submitForVerification(
        propertyId,
        documentHashes,
        {
          address: propertyData.address,
          estimatedValue: propertyData.value.total || 0,
          ownerName: propertyData.owner
        }
      );

      onRegistrationComplete(propertyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentFlow === 'upload') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Property Documents</h2>
        <p className="text-gray-600 mb-6">
          Please upload all required documents for your property. These will be stored securely on IPFS.
        </p>
        <DocumentUpload onUploadComplete={handleUploadComplete} />
      </div>
    );
  }

  if (currentFlow === 'coordinates') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Property Coordinates</h2>
        <p className="text-gray-600 mb-6">
          Enter the coordinates of your property to fetch real property data from government records.
        </p>

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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to find coordinates:</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Use Google Maps: Right-click on your property → Copy coordinates</li>
              <li>• Use GPS apps on your phone</li>
              <li>• Search online for "[your address] coordinates"</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={handleLookupProperty}
            disabled={isLoading || !coordinates.lat || !coordinates.lon}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Looking up property...' : 'Lookup Property Data'}
          </button>
        </div>
      </div>
    );
  }

  if (currentFlow === 'property' && propertyData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Verify Property Information</h2>
        <p className="text-gray-600 mb-6">
          Please verify the property information retrieved from government records:
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Property Details</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Address:</strong> {propertyData.address}</div>
              <div><strong>City:</strong> {propertyData.city}, {propertyData.state}</div>
              <div><strong>Property Type:</strong> {propertyData.propertyType}</div>
              <div><strong>Area:</strong> {propertyData.area.toLocaleString()} sq ft</div>
              <div><strong>Owner:</strong> {propertyData.owner}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Location & Value</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Coordinates:</strong> {propertyData.coordinates.lat.toFixed(6)}, {propertyData.coordinates.lon.toFixed(6)}</div>
              <div><strong>Assessed Value:</strong> {propertyData.value.total > 0 ? `$${propertyData.value.total.toLocaleString()}` : 'Not assessed'}</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => setCurrentFlow('coordinates')}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Back to Coordinates
          </button>
          <button
            onClick={handleSignConsent}
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Signing...' : 'Sign Ownership Consent'}
          </button>
        </div>
      </div>
    );
  }

  if (currentFlow === 'consent' && propertyData && consentSigned) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Submit Property Registration</h2>
        <p className="text-gray-600 mb-6">
          Your ownership has been verified. Ready to submit your property for blockchain registration and verification.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2">✅ Ownership Consent Signed</h3>
          <p className="text-green-700 text-sm">
            You have successfully signed the ownership consent for {propertyData.address}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Registration Summary</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Property:</strong> {propertyData.address}</div>
            <div><strong>Documents:</strong> {localUploadedDocs.length} files uploaded</div>
            <div><strong>Verification:</strong> Will be submitted to hybrid verification system</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => setCurrentFlow('property')}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Back to Property Details
          </button>
          <button
            onClick={handleSubmitRegistration}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Submitting...' : 'Submit Property Registration'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};
