import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getActiveMortgagedProperties, repay } from '@/services/contracts';

interface RepayProps {
  onBackToDashboard: () => void;
}

export const Repay: React.FC<RepayProps> = ({ onBackToDashboard }) => {
    const { address } = useAccount();
    const [activeTokens, setActiveTokens] = useState<Array<{ tokenId: bigint; value: number }>>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedToken, setSelectedToken] = useState<bigint | null>(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [lastRepaidToken, setLastRepaidToken] = useState<bigint | null>(null);

    const processAndSetTokens = (tokens: Array<{ Id: BigInt; value: number }>) => {
        const uniqueTokensMap = new Map();
        tokens.forEach(token => {
            uniqueTokensMap.set(token.Id.toString(), {
                tokenId: token.Id,
                value: token.value,
            });
        });
        setActiveTokens(Array.from(uniqueTokensMap.values()));
    };

    useEffect(() => {
        const fetchActiveTokens = async () => {
            if (!address) return;
            setLoading(true);
            try {
                const tokens = await getActiveMortgagedProperties(address);
                processAndSetTokens(tokens);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch mortgaged properties');
            } finally {
                setLoading(false);
            }
        };
        fetchActiveTokens();
    }, [address]);

    const handleRepay = async () => {
        if (!address || !selectedToken) return;
        
        setProcessing(true);
        setError(null);
        setSuccess(false);

        try {
            const tokenToRepay = activeTokens.find(token => token.tokenId === selectedToken);
            if (!tokenToRepay) {
                throw new Error("Could not find the selected token's details.");
            }

            // ✨ FIX: Use Math.floor() on the value before converting to BigInt
            const amount = BigInt(Math.floor(tokenToRepay.value));
            
            const tx = await repay(Number(selectedToken), amount, address);
            await tx.wait();
            setSuccess(true);
            setLastRepaidToken(selectedToken);
            
            const updatedTokens = await getActiveMortgagedProperties(address);
            processAndSetTokens(updatedTokens);
            
            setSelectedToken(null);
        } catch (err: any) {
            setError(err.message || 'Failed to process repayment');
        } finally {
            setProcessing(false);
        }
    };

    if (!address) {
        return (
            <div className="glass rounded-xl p-6 text-center border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-600/10">
                <p className="text-red-300 font-semibold">Please connect your wallet to view and repay mortgages.</p>
            </div>
        );
    }

    const selectedTokenValue = selectedToken ? activeTokens.find(t => t.tokenId === selectedToken)?.value : 0;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    Repay Mortgage
                </h1>
                <button onClick={onBackToDashboard} className="btn-secondary">
                    Back to Dashboard
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 space-y-4">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-300">Loading your mortgaged properties...</p>
                </div>
            ) : activeTokens.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                    <p className="text-gray-300 font-semibold text-lg">You have no active mortgages to repay.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            1. Select Property Token to Repay
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {activeTokens.map((tokenObj) => (
                                <button
                                    key={tokenObj.tokenId.toString()}
                                    onClick={() => setSelectedToken(tokenObj.tokenId)}
                                    className={`interactive-card glass-dark p-4 rounded-2xl border text-left transition-all duration-300 ${
                                        selectedToken === tokenObj.tokenId
                                            ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-glow'
                                            : 'border-white/10 hover:border-blue-500/50'
                                    }`}
                                >
                                    <p className="font-bold text-white text-xl">Token #{tokenObj.tokenId.toString()}</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Debt: ${tokenObj.value.toLocaleString()}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedToken && (
                        <div className="animate-fade-in glass-dark p-6 rounded-2xl border border-white/10">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                2. Confirm Repayment
                            </label>
                            <p className="text-white">
                                You are about to repay <strong className="text-green-400">${selectedTokenValue?.toLocaleString()}</strong> for Property NFT <strong className="text-blue-400">#{selectedToken.toString()}</strong>.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleRepay}
                        disabled={processing || !selectedToken}
                        className="w-full btn-primary text-lg py-4"
                    >
                        {processing ? 'Processing Repayment...' : 'Repay Full Amount'}
                    </button>

                    {success && lastRepaidToken && (
                        <div className="glass rounded-xl p-4 border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-600/10 animate-scale-in">
                            <p className="text-green-300 text-center font-semibold">
                                🎉 Successfully repaid mortgage for Token #{lastRepaidToken.toString()}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="glass rounded-xl p-4 border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-600/10 animate-shake">
                            <p className="text-red-300 text-center">{error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};