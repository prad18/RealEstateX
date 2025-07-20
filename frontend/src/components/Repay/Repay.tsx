import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getActiveMortgagedProperties, repay, balanceof } from '@/services/contracts';

export const Repay: React.FC = () => {
  const { address } = useAccount();
  const [activeTokens, setActiveTokens] = useState<bigint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<bigint | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch active mortgaged properties when component mounts or address changes
  useEffect(() => {
    const fetchActiveTokens = async () => {
      if (!address) return;
      setLoading(true);
      try {
        const tokens = await getActiveMortgagedProperties(address);
        // Deduplicate tokens (do not change any logic, just remove repeats)
        setActiveTokens(Array.from(new Set(tokens.map(t => t.toString()))).map(BigInt));
      } catch (err: any) {
        setError(err.message || 'Failed to fetch mortgaged properties');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveTokens();
  }, [address]);

  const handleRepay = async () => {
    if (!address || !selectedToken || !repayAmount) return;
    
    setProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const amount = BigInt(repayAmount);
      const tx = await repay(Number(selectedToken), amount, address);
      await tx.wait();
      setSuccess(true);
      
      // Refresh the list of active tokens
      const updatedTokens = await getActiveMortgagedProperties(address);
      setActiveTokens(Array.from(new Set(updatedTokens.map(t => t.toString()))).map(BigInt));
      
      // Reset form
      setSelectedToken(null);
      setRepayAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to process repayment');
    } finally {
      setProcessing(false);
    }
  };

  if (!address) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-center">
          Please connect your wallet to view and repay mortgages
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Repay Mortgage
        </h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your mortgaged properties...</p>
          </div>
        ) : activeTokens.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">You have no active mortgages to repay</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Token Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Property Token to Repay
              </label>
              <div className="grid grid-cols-2 gap-4">
                {activeTokens.map((tokenId) => (
                  <button
                    key={tokenId.toString()}
                    onClick={() => setSelectedToken(tokenId)}
                    className={`p-4 rounded-lg border ${
                      selectedToken === tokenId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-medium">Token #{tokenId.toString()}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            {selectedToken && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repayment Amount
                </label>
                <input
                  type="number"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount to repay"
                />
              </div>
            )}

            {/* Repay Button */}
            <button
              onClick={handleRepay}
              disabled={processing || !selectedToken || !repayAmount}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {processing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing Repayment...
                </div>
              ) : (
                'Repay Mortgage'
              )}
            </button>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-center">
                  🎉 Successfully repaid mortgage for Token #{selectedToken?.toString()}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-center">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
