import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { type Chain } from 'viem'

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'c37b3f1dd046a74b00a0387774c88579'

// 2. Create wagmiConfig
const metadata = {
  name: 'RealEstateX',
  description: 'Real Estate Tokenization Platform on BlockDAG',
  url: 'https://realestateX.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 3. Define the BlockDAG Testnet chain
export const blockdagTestnet = {
  id: 1043,
  name: 'BlockDAG Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BDAG',
    symbol: 'BDAG',
  },
  rpcUrls: {
    default: { http: ['https://test-rpc.primordial.bdagscan.com/'] },
  },
  blockExplorers: {
    default: { name: 'BDAGScan', url: 'https://primordial.bdagscan.com/' },
  },
} as const satisfies Chain

const chains = [blockdagTestnet] as const

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: false, // Set to true if using server-side rendering
})

// 4. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  enableOnramp: true
})