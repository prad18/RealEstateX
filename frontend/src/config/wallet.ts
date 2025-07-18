import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { sepolia } from 'viem/chains'

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'c37b3f1dd046a74b00a0387774c88579'

// 2. Create wagmiConfig
const metadata = {
  name: 'RealEstateX',
  description: 'Real Estate Tokenization Platform on Ethereum Sepolia',
  url: 'https://realestateX.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 3. Define supported chains - Only Ethereum Sepolia Testnet
const chains = [sepolia] as const

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
