import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { verificationService } from '@/services/verificationService';
import { ipfsService } from '@/services/ipfs';
import type { IPFSUploadResult } from '@/services/ipfs';
import { PropertyNFTMinting } from './PropertyNFTMinting';

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
interface PropertyRegistrationProps {
  uploadedDocuments: Array<{ file: File; ipfs_hash: string }>;
  onRegistrationComplete: (propertyId: string) => void;
  propertyDetails: PropertyDetails;
  valuation?: PropertyValuation;
}

export const PropertyRegistration: React.FC<PropertyRegistrationProps> = ({
  uploadedDocuments,
  onRegistrationComplete,
  propertyDetails,
  valuation,
}) => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Step: upload -> property -> consent -> review
  const [step, setStep] = useState<'upload' | 'property' | 'consent' | 'review'>('upload');
  const [propertyDoc, setPropertyDoc] = useState<{ file: File; ipfs_hash: string } | null>(null);
  const [idDoc, setIdDoc] = useState<{ file: File; ipfs_hash: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showNFTMint, setShowNFTMint] = useState(false);
  const [consentSigned, setConsentSigned] = useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [verificationError, setVerificationError] = React.useState('');
  const [verified, setVerified] = React.useState(false);

  // Move useEffect to top level and make it conditional internally
  React.useEffect(() => {
    // Only run verification when on review step with consent signed and not already verifying/verified
    if (step === 'review' && consentSigned && !verifying && !verified && !verificationError) {
      (async () => {
        setVerifying(true);
        setVerificationError('');
        try {
          const formData = new FormData();
          if (propertyDoc?.file) formData.append('title', propertyDoc.file);
          if (idDoc?.file) formData.append('id', idDoc.file);

          // If your backend is NOT at the same origin, set full URL here!
          const resp = await fetch('http://127.0.0.1:8000/verify', {
            method: 'POST',
            body: formData,
          });

          const data = await resp.json();

          if (resp.ok && data.match === true) {
            setVerified(true);
          } else {
            setVerificationError(data.error || 'Document verification failed.');
          }
        } catch (err) {
          setVerificationError('Verification request failed.');
        } finally {
          setVerifying(false);
        }
      })();
    }
  }, [step, consentSigned, verifying, verified, verificationError, propertyDoc?.file, idDoc?.file]);

  // --- IPFS UPLOAD HANDLERS ---
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setDoc: React.Dispatch<React.SetStateAction<{ file: File; ipfs_hash: string } | null>>
  ) => {
    setError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsLoading(true);
    try {
      const ipfs: IPFSUploadResult = await ipfsService.uploadFile(file);
      setDoc({ file, ipfs_hash: ipfs.hash });
    } catch (err) {
      setError('IPFS upload failed');
      setDoc(null);
    }
    setIsLoading(false);
  };

  // Continue after both uploads
  const handleContinue = () => {
    if (propertyDoc && idDoc) setStep('property');
    else setError('Please upload both Property Document and ID Proof');
  };

  // Consent step
  const handleSignConsent = async () => {
    if (!address || !propertyDetails) return;
    setIsLoading(true);
    setError('');
    try {
      const consentMessage = `I confirm that I am the legal owner of the property at ${propertyDetails.address} and consent to tokenize this property on the blockchain. Wallet: ${address}`;
      const signature = await signMessageAsync({ message: consentMessage });
      if (signature) {
        setConsentSigned(true);
        setStep('review');
      }
    } catch (err) {
      setError('Failed to sign consent message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRegistration = async () => {
    if (!propertyDetails || !address || !consentSigned) return;
    setIsLoading(true);
    setError('');
    try {
      const propertyId = `prop_${propertyDetails.coordinates.lat}_${propertyDetails.coordinates.lon}_${address.slice(2, 8)}`;
      const documentHashes = [propertyDoc!, idDoc!].map(doc => doc.ipfs_hash);
      await verificationService.submitForVerification(
        propertyId,
        documentHashes,
        {
          address: propertyDetails.address,
          estimatedValue: propertyDetails.value.total || 0,
          ownerName: propertyDetails.owner
        }
      );
      onRegistrationComplete(propertyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Steps ---

  if (step === 'upload') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
        <h2 className="text-xl font-semibold mb-4">Upload Required Documents</h2>
        <div>
          <h3 className="font-medium mb-2">1. Upload Property Document</h3>
          <input
            type="file"
            accept="application/pdf,image/*"
            disabled={isLoading}
            onChange={e => handleFileUpload(e, setPropertyDoc)}
          />
          {propertyDoc && (
            <p className="text-green-700 mt-2 break-all">
              Property Document uploaded ✅<br />
              IPFS: <a href={`https://gateway.pinata.cloud/ipfs/${propertyDoc.ipfs_hash}`} target="_blank" rel="noopener noreferrer">{propertyDoc.ipfs_hash}</a>
            </p>
          )}
        </div>
        <div>
          <h3 className="font-medium mb-2">2. Upload ID Proof</h3>
          <input
            type="file"
            accept="application/pdf,image/*"
            disabled={isLoading}
            onChange={e => handleFileUpload(e, setIdDoc)}
          />
          {idDoc && (
            <p className="text-green-700 mt-2 break-all">
              ID Proof uploaded ✅<br />
              IPFS: <a href={`https://gateway.pinata.cloud/ipfs/${idDoc.ipfs_hash}`} target="_blank" rel="noopener noreferrer">{idDoc.ipfs_hash}</a>
            </p>
          )}
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        <button
          onClick={handleContinue}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-4"
        >
          Continue
        </button>
      </div>
    );
  }

  if (step === 'property') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Verify Property Information</h2>
        <div className="mb-6">
          <div><strong>Address:</strong> {propertyDetails.address}</div>
          <div><strong>City:</strong> {propertyDetails.city}, {propertyDetails.state}</div>
          <div><strong>Type:</strong> {propertyDetails.propertyType}</div>
          <div><strong>Area:</strong> {propertyDetails.area.toLocaleString()} sq ft</div>
          <div><strong>Owner:</strong> {propertyDetails.owner}</div>
          <div><strong>Coordinates:</strong> {propertyDetails.coordinates.lat.toFixed(6)}, {propertyDetails.coordinates.lon.toFixed(6)}</div>
          <div><strong>Assessed Value:</strong> {propertyDetails.value.total > 0 ? `$${propertyDetails.value.total.toLocaleString()}` : 'Not assessed'}</div>
          <div>
            <strong>Uploaded Documents:</strong>
            {propertyDoc ? " Property Document ✅" : ""}
            {idDoc ? ", ID Proof ✅" : ""}
          </div>
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"><p className="text-red-800">{error}</p></div>}
        <div className="flex gap-4">
          <button
            onClick={() => setStep('upload')}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Back to Upload
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
 
  // Final review page after consent is signed.
  if (step === 'review' && consentSigned) {
    // Loading spinner while verifying
    if (verifying) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></span>
          <p className="text-blue-800 text-center font-semibold">Verifying your documents…</p>
        </div>
      );
    }

    // Error UI if verification fails
    if (verificationError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center">
          <p className="text-red-800 text-center font-semibold">{verificationError}</p>
          <p className="text-gray-500 text-center text-sm mt-2">
            Please check the uploaded documents and try again.
          </p>
        </div>
      );
    }

    // Only allow minting after verification
    if (verified) {
      const assetIpfsHash = propertyDoc ? propertyDoc.ipfs_hash : undefined;
      return (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Property Details</h2>
          <div className="mb-6">
            <div><strong>Address:</strong> {propertyDetails.address}</div>
            <div><strong>City:</strong> {propertyDetails.city}, {propertyDetails.state}</div>
            <div><strong>Type:</strong> {propertyDetails.propertyType}</div>
            <div><strong>Area:</strong> {propertyDetails.area.toLocaleString()} sq ft</div>
            <div><strong>Owner:</strong> {propertyDetails.owner}</div>
            <div><strong>Coordinates:</strong> {propertyDetails.coordinates.lat.toFixed(6)}, {propertyDetails.coordinates.lon.toFixed(6)}</div>
            <div><strong>Assessed Value:</strong> {propertyDetails.value.total > 0 ? `$${propertyDetails.value.total.toLocaleString()}` : 'Not assessed'}</div>
            <div><strong>Documents:</strong> 2 files uploaded</div>
          </div>
          <div className="flex justify-end">
            {!showNFTMint ? (
              <button
                onClick={() => setShowNFTMint(true)}
                disabled={isLoading}
                className="bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-blue-800 disabled:opacity-50 transition-colors text-lg"
              >
                {isLoading ? 'Minting...' : 'Mint Property NFT'}
              </button>
            ) : (
              <div className="w-full">
                <PropertyNFTMinting
                  propertyDetails={propertyDetails}
                  valuation={valuation}
                  assetIpfsHash={assetIpfsHash}
                  // Add more props if needed
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Fallback (should never show)
    return null;
  }

  return null;
};