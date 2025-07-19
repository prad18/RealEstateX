import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { mintPropertyNFT, getnextTokenid } from '@/services/contracts';

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
  value: {
    land: number;
    improvement: number;
    total: number;
  };
}

interface PropertyValuation {
  estimatedValue: number;
  confidenceScore: number;
  pricePerSqFt: number;
  marketTrend: 'rising' | 'stable' | 'declining';
  lastUpdated: string;
}

interface PropertyNFTMintingProps {
  propertyData?: PropertyData;
  valuation?: PropertyValuation;
  onMintSuccess: (tokenId: number) => void;
  onMintError: (error: string) => void;
  buttonText?: string;
  buttonClassName?: string;
  showMockOption?: boolean;
}

export const PropertyNFTMinting: React.FC<PropertyNFTMintingProps> = ({
  propertyData,
  valuation,
  onMintSuccess,
  onMintError,
  buttonText = "Sign Consent & Mint Property NFT",
  buttonClassName = "w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors",
  showMockOption = false
}) => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  // Keep original states from CoordinatePropertyLookup
  const [minting, setMinting] = useState(false);
  const [consentSigned, setConsentSigned] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

  // ORIGINAL CORE LOGIC - Keep exactly the same as CoordinatePropertyLookup
    const handleConsentAndMint = async () => {
        if (!address || !valuation || !propertyData) return;
        onMintError('');
        setMinting(true);
        setMintSuccess(false);

        try {
            const consentMessage = `I , ${address} , consent to mint an NFT for the property at ${propertyData.address} with a valuation of ${valuation.estimatedValue}`;
            const signature = await signMessageAsync({ message: consentMessage });
            if (!signature) throw new Error('Consent Signature Failed');
            setConsentSigned(true);
            const ipfsHash = 'Qma6e8dovN9UiaQ3PiDWWU5zEVr7h4h8E3xFtL3mkoD5aK';
            const result = await mintPropertyNFT(address, ipfsHash, valuation.estimatedValue);

            if (result) {
            const tokenId = await getnextTokenid();
            setMintedTokenId(tokenId - 1);
            setMintSuccess(true);
            onMintSuccess(tokenId - 1);
            }
        } catch (err: any) {
            onMintError(err.message || 'Minting Failed');
        } finally {
            setMinting(false);
        }
    };

    const handleMockMint = async () => {
    if (!address) return;
    onMintError('');
    setMinting(true);
    setMintSuccess(false);

    try {
        const consentMessage = `I, ${address}, consent to mint a test Property NFT with mock data for testing purposes.`;
        const signature = await signMessageAsync({ message: consentMessage });
        if (!signature) throw new Error('Consent Signature Failed');
        setConsentSigned(true);
        const ipfsHash = 'QmTempMockHash123456789';
        const result = await mintPropertyNFT(address, ipfsHash, 500000);

        if (result) {
        const tokenId = await getnextTokenid();
        setMintedTokenId(tokenId - 1);
        setMintSuccess(true);
        onMintSuccess(tokenId - 1);
        }
    } catch (err: any) {
        onMintError(err.message || 'Minting Failed');
    } finally {
        setMinting(false);
    }
    };

  if (!address) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-center">
          Please connect your wallet to mint Property NFTs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Property Summary (if provided) */}
      {propertyData && valuation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Property Summary</h4>
          <div className="text-blue-800 text-sm space-y-1">
            <p><strong>Address:</strong> {propertyData.address}, {propertyData.city}, {propertyData.state}</p>
            <p><strong>Area:</strong> {propertyData.area.toLocaleString()} sq ft</p>
            <p><strong>Type:</strong> {propertyData.propertyType}</p>
            <p><strong>Estimated Value:</strong> ${valuation.estimatedValue.toLocaleString()}</p>
            <p><strong>Confidence:</strong> {valuation.confidenceScore}%</p>
          </div>
        </div>
      )}

      {/* Minting Buttons */}
      <div className="space-y-3">
        {/* Real Property Mint Button - Uses ORIGINAL LOGIC */}
        {propertyData && valuation && (
          <button
            onClick={handleConsentAndMint}
            disabled={minting}
            className={buttonClassName}
          >
            {minting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Minting NFT...
              </div>
            ) : (
              buttonText
            )}
          </button>
        )}

        {/* Mock Data Mint Button */}
        {showMockOption && (
          <button
            onClick={handleMockMint}
            disabled={minting}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors border-2 border-green-300"
          >
            {minting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Minting Test NFT...
              </div>
            ) : (
              '🧪 Mint Test NFT (Mock Data)'
            )}
          </button>
        )}
      </div>

      {/* Success Message */}
      {mintSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-center">
            🎉 Property NFT Successfully Minted!
            {mintedTokenId && (
              <span className="block text-sm mt-1">Token ID: #{mintedTokenId}</span>
            )}
          </p>
        </div>
      )}

      {/* Consent Signed Message */}
      {consentSigned && !mintSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 text-sm text-center">
            ✅ Consent signed successfully
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border rounded-lg p-3">
        <p className="text-gray-600 text-xs text-center">
          🔒 This will require wallet signatures and gas fees.
        </p>
      </div>
    </div>
  );
};