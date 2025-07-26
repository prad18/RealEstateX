import React from 'react'
import { useAccount } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { NetworkDisplay } from './NetworkDisplay'

export const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div 
        className="flex items-center space-x-3 glass-dark rounded-full px-4 py-2 border border-white/10"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
          <span className="text-sm font-medium text-slate-200">
            {formatAddress(address)}
          </span>
        </div>
        <div className="h-4 w-px bg-white/20"></div>
        <NetworkDisplay />
      </div>
    )
  }

  return (
    <button
      onClick={() => open()}
      className="btn-primary"
    >
      Connect Wallet
    </button>
  )
}