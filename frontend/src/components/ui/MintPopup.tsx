import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { openvault, getTokenIds, giveApproval, setPropertyVerified } from '@/services/contracts';
import { PropertyNFTMinting } from '@/components/property/PropertyNFTMinting';

// Define the props for the component
interface MintPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onMintSuccess: (tokenId: number) => void;
  onMintError: (error: string) => void;
  // This prop is the key to our logic. It will be a number if coming
  // from a specific property card, or null/undefined otherwise.
  preSelectedTokenId?: number | null;
}

export const MintPopup: React.FC<MintPopupProps> = ({
  isOpen,
  onClose,
  onMintSuccess,
  onMintError,
  preSelectedTokenId = null, // Default to null
}) => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // The 'step' state determines what UI to show.
  // We set the initial step based on whether a token was pre-selected.
  const [step, setStep] = useState<'selectToken' | 'consent' | 'signing' | 'minting'>(
    preSelectedTokenId ? 'consent' : 'selectToken'
  );
  
  const [consentChecked, setConsentChecked] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userTokenIds, setUserTokenIds] = useState<number[]>([]);
  
  // The currently selected token ID. Initialize with the pre-selected one if it exists.
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(preSelectedTokenId);
  const [loadingTokens, setLoadingTokens] = useState(false);

  // This effect runs when the popup opens and is in the 'selectToken' step.
  // It's responsible for fetching the list of all available property NFTs.
  useEffect(() => {
    // Only fetch if the popup is open, the user is connected, and we are in the selection step.
    if (isOpen && isConnected && address && step === 'selectToken') {
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
  }, [isOpen, isConnected, address, onMintError, step]);
  
  // This effect ensures that if the preSelectedTokenId changes while the popup is open,
  // the component state updates accordingly.
  useEffect(() => {
      setSelectedTokenId(preSelectedTokenId);
      setStep(preSelectedTokenId ? 'consent' : 'selectToken');
  }, [preSelectedTokenId]);


  // Resets the entire popup state when closed.
  const handleClose = () => {
    setStep(preSelectedTokenId ? 'consent' : 'selectToken');
    setConsentChecked(false);
    setSignature(null);
    setIsProcessing(false);
    // Don't reset selectedTokenId if it was pre-selected,
    // in case the user re-opens without closing completely.
    if (!preSelectedTokenId) {
        setSelectedTokenId(null);
    }
    setUserTokenIds([]);
    onClose();
  };

  // Handles moving from token selection to the consent screen.
  const handleTokenSelect = (tokenId: number) => {
    setSelectedTokenId(tokenId);
    setStep('consent');
  };

  // Handles the multi-step minting process after consent is given.
  const handleMintProcess = async () => {
    if (!consentChecked || !selectedTokenId || !address) {
      onMintError("Cannot proceed: Consent not given or token not selected.");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Sign the consent message
      setStep('signing');
      const consentMessage = `I, ${address}, consent to open a vault for the property NFT with Token ID #${selectedTokenId}. I understand this action requires multiple transactions and gas fees.`;
      const userSignature = await signMessageAsync({ message: consentMessage });
      setSignature(userSignature);

      // Step 2: Perform the minting transactions
      setStep('minting');
      
      // These are the three smart contract calls required to open the vault.
      // They must happen in this specific order.
      await setPropertyVerified(selectedTokenId, true);
      await giveApproval(selectedTokenId);
      await openvault(selectedTokenId);

      onMintSuccess(selectedTokenId);
      handleClose(); // Close the popup on success

    } catch (error: any) {
      let friendlyError = 'An unexpected error occurred. Please try again.';
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        friendlyError = 'Transaction was rejected in your wallet.';
      } else if (error.message?.includes('insufficient funds')) {
        friendlyError = 'You have insufficient funds for gas fees.';
      } else if (error.reason) {
        friendlyError = `Transaction failed: ${error.reason}`;
      }
      
      onMintError(friendlyError);
      setStep('consent'); // Go back to the consent step on failure

    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🏠 Open Property Vault</h2>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 text-xl disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* --- UI for Selecting a Token (Only shown if no token was pre-selected) --- */}
          {step === 'selectToken' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Select a Property NFT to Use</h3>
              {loadingTokens ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading your properties...</span>
                </div>
              ) : userTokenIds.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                  <p className="text-sm text-gray-500 mt-2">You can mint a new one from the dashboard.</p>
                </div>
              )}
            </div>
          )}

          {/* --- UI for Consent Screen --- */}
          {step === 'consent' && selectedTokenId && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Vault Details</h4>
                <div className="text-blue-700 text-sm space-y-1">
                  <p><strong>Property NFT to be used:</strong> Token ID #{selectedTokenId}</p>
                  <p><strong>Action:</strong> Open a new vault to enable minting of $HOMED stablecoins against this NFT.</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Please Acknowledge</h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>This process involves multiple transactions on the blockchain.</li>
                  <li>You will need to sign a consent message and approve transactions in your wallet.</li>
                  <li>Ensure you have enough funds to cover the required gas fees.</li>
                </ul>
              </div>
              <div className="flex items-start space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="consent" className="text-sm text-gray-700">
                  I understand and consent to open a vault for this property.
                </label>
              </div>
            </div>
          )}
          
          {/* --- UI for Processing Steps (Signing/Minting) --- */}
          {(step === 'signing' || step === 'minting') && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {step === 'signing' ? 'Awaiting Signature' : 'Processing on Blockchain'}
              </h3>
              <p className="text-gray-600">
                {step === 'signing' ? 'Please sign the consent message in your wallet...' : 'Opening vault, please wait...'}
              </p>
            </div>
          )}

          {/* --- Footer with Action Buttons --- */}
          <div className="flex justify-end mt-6 pt-4 border-t">
            {step === 'consent' && (
              <button
                onClick={handleMintProcess}
                disabled={!consentChecked || isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Confirm & Open Vault'}
              </button>
            )}
            {(step === 'selectToken') && (
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};