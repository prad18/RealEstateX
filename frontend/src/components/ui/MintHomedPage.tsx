import React, { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { openvault, getTokenIds, giveApproval, setPropertyVerified } from '@/services/contracts';

// --- INTERFACES & PROPS ---
interface MintHomedPageProps {
  onMintSuccess: (tokenId: number) => void;
  onMintError: (error: string) => void;
  onCancel: () => void; // To go back to the dashboard
}

export const MintHomedPage: React.FC<MintHomedPageProps> = ({
  onMintSuccess,
  onMintError,
}) => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [step, setStep] = useState<'selectToken' | 'consent' | 'signing' | 'minting'>('selectToken');
  const [consentChecked, setConsentChecked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userTokenIds, setUserTokenIds] = useState<number[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      const fetchTokenIds = async () => {
        setLoadingTokens(true);
        try {
          const ids = await getTokenIds(address);
          setUserTokenIds(ids);
        } catch (error) {
          console.error("Failed to fetch token IDs:", error);
          onMintError("Could not fetch your property NFTs.");
        } finally {
          setLoadingTokens(false);
        }
      };
      fetchTokenIds();
    }
  }, [isConnected, address, onMintError]);

  const handleTokenSelect = (tokenId: number) => {
    setSelectedTokenId(tokenId);
    setStep('consent');
  };

  const handleMintProcess = async () => {
    if (!consentChecked || !selectedTokenId || !address) {
      onMintError("Consent not given or token not selected.");
      return;
    }
    setIsProcessing(true);
    try {
      setStep('signing');
      const consentMessage = `I, ${address}, consent to open a vault for the property NFT with Token ID #${selectedTokenId}. I understand this action requires multiple transactions and gas fees.`;
      await signMessageAsync({ message: consentMessage });

      setStep('minting');
      await setPropertyVerified(selectedTokenId, true);
      await giveApproval(selectedTokenId);
      await openvault(selectedTokenId);

      onMintSuccess(selectedTokenId); // Notify parent on success
    } catch (error: any) {
      let friendlyError = 'An unexpected error occurred.';
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) { friendlyError = 'Transaction was rejected in your wallet.'; } 
      else if (error.message?.includes('insufficient funds')) { friendlyError = 'You have insufficient funds for gas fees.'; }
      else if (error.reason) { friendlyError = `Transaction failed: ${error.reason}`; }
      onMintError(friendlyError);
      setStep('consent');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    // This is now a standard div, not a modal
    <div className="w-full">
      <div className="flex items-start justify-between mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          🏠 Open Property Vault
        </h2>
      </div>

      {/* Renders the same steps as the popup */}
      <div className="px-8 overflow-y-auto flex-grow">
        {step === 'selectToken' && (
          <div className="animate-fade-in">
            <h3 className="font-semibold text-white mb-4">Select a Property NFT to Use</h3>
            {loadingTokens ? (
              <div className="flex items-center justify-center py-12 space-x-3"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span className="text-gray-300">Loading your properties...</span></div>
            ) : userTokenIds.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {userTokenIds.map(id => (
                  <button key={id} onClick={() => handleTokenSelect(id)} className="interactive-card glass-dark rounded-2xl p-4 text-center magnetic-hover group">
                    <span className="text-sm font-medium text-gray-400 group-hover:text-blue-300 transition-colors">Token ID</span>
                    <p className="text-3xl font-bold text-white mt-1">#{id}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="glass rounded-xl p-6 text-center border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-600/10">
                <p className="text-yellow-300 font-semibold">No Property NFTs Found</p>
                <p className="text-sm text-yellow-400/80 mt-2">You must own a verified property NFT to open a vault.</p>
              </div>
            )}
          </div>
        )}

        {step === 'consent' && selectedTokenId && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-dark p-6 rounded-2xl border border-white/10"><h4 className="font-semibold text-white text-lg mb-3">Vault Details</h4><div className="text-gray-300 space-y-2"><p><strong>Property NFT to be used:</strong> <span className="font-bold text-blue-400">Token ID #{selectedTokenId}</span></p><p><strong>Action:</strong> Open a new vault to enable minting of $HOMED stablecoins against this NFT.</p></div></div>
            <div className="glass rounded-xl p-6 border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-600/10"><h4 className="font-semibold text-yellow-300 text-lg mb-3">⚠️ Please Acknowledge</h4><ul className="text-yellow-400/80 text-sm space-y-2 list-disc list-inside"><li>This process involves multiple transactions.</li><li>You will need to sign a consent message and approve transactions.</li><li>Ensure you have enough funds for gas fees.</li></ul></div>
            <div className="flex items-center space-x-3 pt-2"><input type="checkbox" id="consent" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} className="h-5 w-5 bg-white/10 text-blue-500 focus:ring-blue-500/50 border-gray-500 rounded" /><label htmlFor="consent" className="text-sm text-gray-300">I understand and consent to open a vault for this property.</label></div>
            <div className="pt-6 border-t border-white/10 flex justify-end"><button onClick={handleMintProcess} disabled={!consentChecked || isProcessing} className="btn-primary px-8 py-3">{isProcessing ? 'Processing...' : 'Confirm & Open Vault'}</button></div>
          </div>
        )}
        
        {(step === 'signing' || step === 'minting') && (
          <div className="text-center py-12 animate-fade-in"><div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div><h3 className="text-2xl font-semibold text-white mb-2">{step === 'signing' ? 'Awaiting Signature' : 'Processing on Blockchain'}</h3><p className="text-gray-300">{step === 'signing' ? 'Please sign the consent message in your wallet...' : 'Opening vault, this may take a moment...'}</p></div>
        )}
      </div>
    </div>
  );
};