import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { type Chain } from 'viem'

// 1. Define the custom chain for BlockDAG Testnet
// Note: These values are placeholders. Please replace them with the official
// BlockDAG testnet details from their documentation.
export const blockdagTestnet = {
  id: 1043, // Replace with the actual Chain ID for BlockDAG Testnet
  name: 'BlockDAG Testnet',
  nativeCurrency: {
    name: 'BlockDAG',
    symbol: 'BDAG',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://test-rpc.primordial.bdagscan.com'] }, // Replace with the actual RPC URL
    public: { http: ['https://test-rpc.primordial.bdagscan.com'] }, // Replace with the actual RPC URL
  },
  blockExplorers: {
    default: { name: 'BlockDAG Explorer', url: 'https://primordial.bdagscan.com' }, // Replace with the actual explorer URL
  },
  testnet: true,
} as const satisfies Chain

// 2. Get projectId from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'c37b3f1dd046a74b00a0387774c88579'

// 3. Create wagmiConfig
const metadata = {
  name: 'RealEstateX on BlockDAG',
  description: 'Real Estate Tokenization Platform on BlockDAG',
  url: 'https://realestateX.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 4. Define supported chains - Now using BlockDAG Testnet
const chains = [blockdagTestnet] as const

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: false, // Set to true if using server-side rendering
})

// 5. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  enableOnramp: true
})
