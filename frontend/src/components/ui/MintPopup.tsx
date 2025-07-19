import React, { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { openvault, getTokenIds , giveApproval , setPropertyVerified } from '@/services/contracts';

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

interface MintPopupProps {
  isOpen: boolean;
  onClose: () => void;
  propertyData: PropertyDetails;
  valuation: PropertyValuation;
  onMintSuccess: (tokenId: number) => void;
  onMintError: (error: string) => void;
}

export const MintPopup: React.FC<MintPopupProps> = ({
  isOpen,
  onClose,
  propertyData,
  valuation,
  onMintSuccess,
  onMintError
}) => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [step, setStep] = useState<'selectToken' | 'consent' | 'signing' | 'minting'>('selectToken');
  const [consentChecked, setConsentChecked] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const [userTokenIds, setUserTokenIds] = useState<number[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);

  useEffect(() => {
    if (isOpen && isConnected && address) {
      const fetchTokenIds = async () => {
        setLoadingTokens(true);
        try {
          const ids = await getTokenIds(address);
          setUserTokenIds(ids);
        } catch (error) {
          console.error("Failed to fetch token IDs:", error);
          onMintError("Could not fetch your property NFTs. Please try again.");
        } finally {
          setLoadingTokens(false);
        }
      };
      fetchTokenIds();
    }
  }, [isOpen, isConnected, address, onMintError]);

  const handleClose = () => {
    setStep('selectToken');
    setConsentChecked(false);
    setSignature(null);
    setMinting(false);
    setSelectedTokenId(null);
    setUserTokenIds([]);
    onClose();
  };

  const handleTokenSelect = (tokenId: number) => {
    setSelectedTokenId(tokenId);
    setStep('consent');
  };

  const handleConsent = async () => {
    console.log("Entering into the concest function");
    if (!consentChecked || !selectedTokenId) return;
    console.log("Sucessfully Passed the base case");
    setStep('signing');
    
    try {
    
      const consentMessage = `I, ${address}, consent to open a vault for the property NFT with Token ID #${selectedTokenId}.

Property Details:
- Address: ${propertyData.address}, ${propertyData.city}, ${propertyData.state}
- Valuation: $${valuation.estimatedValue.toLocaleString()}

I understand this will interact with the vault manager contract and may require gas fees.`;

      const userSignature = await signMessageAsync({ message: consentMessage });
      setSignature(userSignature);
      setStep('minting');
      console.log("Trying to mint the coins");
      await handleMint();
      
    } catch (error: any) {
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        onMintError('Signature was rejected by user');
      } else {
        onMintError('Failed to sign consent message');
      }
      setStep('consent');
    }
  };

  const handleMint = async () => {
    if (!selectedTokenId) return;
    setMinting(true);
    
    try {
      console.log('Getting into the miniting Process');
      await giveApproval(selectedTokenId);
      await setPropertyVerified(selectedTokenId , true);
      await openvault(selectedTokenId);
      onMintSuccess(selectedTokenId);
      handleClose();
      
    } catch (error: any) {
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        onMintError('Transaction was rejected by user');
      } else if (error.message?.includes('insufficient funds')) {
        onMintError('Insufficient funds for gas fees');
      } else {
        onMintError(error.message || 'Minting failed. Please try again.');
      }
      setStep('consent');
    } finally {
      setMinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              🏠 Open Property Vault
            </h2>
            <button
              onClick={handleClose}
              disabled={minting}
              className="text-gray-400 hover:text-gray-600 text-xl disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* Step: Select Token */}
          {step === 'selectToken' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Select a Property NFT to Use</h3>
              {loadingTokens ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading your properties...</span>
                </div>
              ) : userTokenIds.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {userTokenIds.map(id => (
                    <button 
                      key={id}
                      onClick={() => handleTokenSelect(id)}
                      className="p-4 border rounded-lg text-center hover:bg-blue-100 hover:border-blue-500 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-600">Token ID</span>
                      <p className="text-2xl font-bold text-blue-600">#{id}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border rounded-lg p-6 text-center">
                  <p className="text-gray-600">You do not own any Property NFTs to use for opening a vault.</p>
                  <p className="text-sm text-gray-500 mt-2">Mint a Property NFT first to proceed.</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Consent */}
          {step === 'consent' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  ⚠️ Important Information
                </h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• You are about to open a vault for Property NFT #{selectedTokenId}</li>
                  <li>• This will mint HOMED tokens based on the property's value.</li>
                  <li>• Gas fees will be required for the transaction</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Property Summary</h4>
                <div className="text-blue-700 text-sm space-y-1">
                  <p><strong>Address:</strong> {propertyData.address}</p>
                  <p><strong>City:</strong> {propertyData.city}, {propertyData.state}</p>
                  <p><strong>Estimated Value:</strong> ${valuation.estimatedValue.toLocaleString()}</p>
                  <p><strong>Selected Token ID:</strong> #{selectedTokenId}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="consent" className="text-sm text-gray-700">
                  I consent to open a vault for this property. 
                  I understand this will interact with the blockchain and requires gas fees.
                </label>
              </div>

              {/* Confirm Button - Shows only when checkbox is checked */}
              {consentChecked && isConnected && (
                <div className="mt-4">
                  <button
                    onClick={handleConsent}
                    disabled={minting}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Confirm & Proceed
                  </button>
                </div>
              )}

              {!isConnected && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">
                    Please connect your wallet to continue
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step: Signing */}
          {step === 'signing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Signing Consent</h3>
              <p className="text-gray-600">Please sign the consent message in your wallet...</p>
            </div>
          )}

          {/* Step: Minting */}
          {step === 'minting' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Opening Vault</h3>
              <p className="text-gray-600">Processing transaction...</p>
              {signature && (
                <p className="text-xs text-gray-500 mt-2 break-all">
                  Signature: {signature.slice(0, 20)}...
                </p>
              )}
            </div>
          )}

          {/* Footer - Cancel Button */}
          {(step === 'selectToken' || (step === 'consent' && !consentChecked)) && (
            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={handleClose}
                disabled={minting}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};