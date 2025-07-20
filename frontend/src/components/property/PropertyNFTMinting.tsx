import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { mintPropertyNFT } from '@/services/contracts';

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
  lastUpdated: string;
}

interface PropertyNFTMintingProps {
  propertyDetails?: PropertyDetails;
  valuation?: PropertyValuation;
  assetIpfsHash?: string; // ADDED: hash for property deed
}

export const PropertyNFTMinting: React.FC<PropertyNFTMintingProps> = ({
  propertyDetails,
  valuation,
  assetIpfsHash,
}) => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [minting, setMinting] = useState(false);
  const [consentSigned, setConsentSigned] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const buttonText = "Sign Consent & Mint Property NFT";
  const buttonClassName = "w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors";

  const handleConsentAndMint = async () => {
    setError('');
    if (!address || !valuation || !propertyDetails) {
      setError("Missing wallet connection or property/valuation data.");
      return;
    }
    if (!assetIpfsHash) {
      setError("Missing property deed/document (IPFS hash). Please upload documents and complete verification.");
      return;
    }
    setMinting(true);
    setMintSuccess(false);
    try {
      const consentMessage = `I, ${address}, consent to mint an NFT for the property at ${propertyDetails.address} with a valuation of ${valuation.estimatedValue}`;
      const signature = await signMessageAsync({ message: consentMessage });
      if (!signature) throw new Error('Consent Signature Failed');
      setConsentSigned(true);

      // Now mint NFT using the actual IPFS hash!
      const result = await mintPropertyNFT(address, assetIpfsHash, valuation.estimatedValue);
      const transferEvent = result.logs?.find((log: any) =>
        log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      );
      const tokenId = transferEvent?.topics[3] ? parseInt(transferEvent.topics[3], 16) : 1;
      setMintedTokenId(tokenId);
      setMintSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Minting Failed');
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

  if (!propertyDetails || !valuation) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-center">
          Missing property or valuation data. Please complete verification first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Property Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Property Summary</h4>
        <div className="text-blue-800 text-sm space-y-1">
          <p><strong>Address:</strong> {propertyDetails.address}, {propertyDetails.city}, {propertyDetails.state}</p>
          <p><strong>Area:</strong> {propertyDetails.area.toLocaleString()} sq ft</p>
          <p><strong>Type:</strong> {propertyDetails.propertyType}</p>
          <p><strong>Estimated Value:</strong> ${valuation.estimatedValue.toLocaleString()}</p>
          <p><strong>Confidence:</strong> {valuation.confidenceScore}%</p>
          {assetIpfsHash && (
            <p className="break-all"><strong>IPFS:</strong> <a href={`https://gateway.pinata.cloud/ipfs/${assetIpfsHash}`} target="_blank" rel="noopener noreferrer">{assetIpfsHash}</a></p>
          )}
        </div>
      </div>

      {/* Minting Button */}
      <div className="space-y-3">
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
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-center">{error}</p>
        </div>
      )}

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
