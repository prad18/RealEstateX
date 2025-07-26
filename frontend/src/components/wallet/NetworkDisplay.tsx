import React from 'react'
import { useAccount, useChainId } from 'wagmi'

const NETWORK_NAMES: { [key: number]: string } = {
  1043: 'BlockDAG Testnet',
  11155111: 'Ethereum Sepolia'
}

const NETWORK_COLORS: { [key: number]: string } = {
  1043: 'bg-gradient-to-r from-purple-500 to-blue-500',
  11155111: 'bg-blue-400'
}

export const NetworkDisplay: React.FC = () => {
  const { isConnected } = useAccount()
  const chainId = useChainId()

  if (!isConnected || !chainId) {
    return null
  }

  const networkName = NETWORK_NAMES[chainId] || 'Unknown Network'
  const networkColor = NETWORK_COLORS[chainId] || 'bg-gray-500'

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${networkColor}`}></div>
      <span className="text-xs text-slate-400 font-medium">
        {networkName}
      </span>
    </div>
  )
}