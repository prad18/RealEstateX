import React from 'react'
import { useAccount, useChainId } from 'wagmi'

export const FaucetLink: React.FC = () => {
  const { isConnected } = useAccount()
  const chainId = useChainId()

  // Only show faucet link for BlockDAG testnet
  if (!isConnected || chainId !== 1043) {
    return null
  }

  const handleFaucetClick = () => {
    window.open('https://primordial.bdagscan.com/faucet', '_blank')
  }

  return (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-blue-900">Need test BDAG?</h4>
          <p className="text-xs text-blue-700">Get free testnet tokens from the faucet</p>
        </div>
        <button
          onClick={handleFaucetClick}
          className="px-3 py-1 text-xs font-medium text-blue-600 bg-white border border-blue-300 rounded hover:bg-blue-50 transition-colors"
        >
          Get BDAG
        </button>
      </div>
    </div>
  )
}
