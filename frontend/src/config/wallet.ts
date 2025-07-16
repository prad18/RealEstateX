import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defineChain } from 'viem'

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'c37b3f1dd046a74b00a0387774c88579'

// 2. Define BlockDAG Testnet
const blockdagTestnet = defineChain({
  id: 1043,
  name: 'Primordial BlockDAG Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BDAG',
    symbol: 'BDAG',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.primordial.bdagscan.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BlockDAG Explorer',
      url: 'https://primordial.bdagscan.com',
    },
  },
  testnet: true,
})

// 3. Create wagmiConfig
const metadata = {
  name: 'RealEstateX',
  description: 'Real Estate Tokenization Platform on BlockDAG',
  url: 'https://realestateX.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 4. Define supported chains - Only BlockDAG Testnet
const chains = [blockdagTestnet] as const

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: false,
})

// 5. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  enableOnramp: true
})
