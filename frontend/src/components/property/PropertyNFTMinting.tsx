import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { mintPropertyNFT } from '@/services/contracts';

// --- INTERFACES ---
interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  area: number;
  propertyType: 'residential' | 'commercial' | 'plot';
  coordinates: { lat: number; lon: number };
  owner: string;
  value: { land: number; improvement: number; total: number };
  zoning: { code: string; description: string; type: string; subtype: string };
  legal: { parcelNumber: string; stateParcelNumber: string; legalDescription: string };
  demographics: { medianIncome: number; affordabilityIndex: number; populationDensity: number };
}

interface PropertyValuation {
  estimatedValue: number;
  confidenceScore: number;
  marketTrend: 'rising' | 'stable' | 'declining';
  lastUpdated: string;
}

interface PropertyNFTMintingProps {
  propertyDetails?: PropertyDetails;
  valuation?: PropertyValuation;
  assetIpfsHash?: string;
  onMintSuccess?: (tokenId: number) => void;
  onBackToDashboard?: () => void;
}

export const PropertyNFTMinting: React.FC<PropertyNFTMintingProps> = ({
  propertyDetails,
  valuation,
  assetIpfsHash,
  onMintSuccess,
  onBackToDashboard,
}) => {
  // --- STATE AND HANDLERS (Originals Preserved) ---
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');

  const handleConsentAndMint = async () => {
    setError('');
    if (!address || !valuation || !propertyDetails) {
      setError("Missing wallet connection or property/valuation data.");
      return;
    }
    if (!assetIpfsHash) {
      setError("Missing property document IPFS hash.");
      return;
    }
    setMinting(true);
    try {
      const consentMessage = `I, ${address}, consent to mint an NFT for the property at ${propertyDetails.address} with a valuation of ${valuation.estimatedValue}`;
      const signature = await signMessageAsync({ message: consentMessage });
      if (!signature) throw new Error('Consent Signature Failed');

      const result = await mintPropertyNFT(address, assetIpfsHash, valuation.estimatedValue);
      const transferEvent = result.logs?.find((log: any) =>
        log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      );
      const tokenId = transferEvent?.topics[3] ? parseInt(transferEvent.topics[3], 16) : 1;
      
      if (onMintSuccess) {
        onMintSuccess(tokenId);
      }

    } catch (err: any) {
      setError(err.message || 'Minting Failed');
    } finally {
      setMinting(false);
    }
  };

  // --- RENDER LOGIC (Styled) ---

  if (!address || !propertyDetails || !valuation) {
    return (
      <div className="glass rounded-xl p-4 border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-600/10">
        <p className="text-red-300 text-center font-medium">
          Please connect wallet and ensure property data is loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Property Summary */}
      <div className="glass-dark p-6 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="text-xl font-semibold text-white">Minting Summary</h4>
          {/* ✨ ADDED: Back to Dashboard Button */}
          {onBackToDashboard && (
              <button onClick={onBackToDashboard} className="btn-secondary text-sm">
                  Back to Dashboard
              </button>
          )}
        </div>        <div className="text-gray-300 text-sm space-y-2">
          <p><strong>Address:</strong> {propertyDetails.address}</p>
          <p><strong>Value:</strong> ${valuation.estimatedValue.toLocaleString()}</p>
          {assetIpfsHash && (
            <p className="break-all">
              <strong>Document Hash:</strong> 
              <a href={`https://gateway.pinata.cloud/ipfs/${assetIpfsHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">
                {assetIpfsHash}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Minting Button */}
      <div className="space-y-3">
        <button
          onClick={handleConsentAndMint}
          disabled={minting}
          className="w-full btn-primary text-lg py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-60"
        >
          {minting ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Awaiting Signature & Minting...</span>
            </div>
          ) : (
            "Sign Consent & Mint NFT"
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-600/10 animate-shake">
            <p className="text-red-300 text-center font-medium">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="glass rounded-xl p-3">
        <p className="text-gray-400 text-xs text-center">
          🔒 This will require two wallet confirmations (signing and minting) and will incur gas fees.
        </p>
      </div>
    </div>
  );
};