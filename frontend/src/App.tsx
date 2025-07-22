import React, { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wallet'
import { WalletConnect } from './components/wallet/WalletConnect'
import { Dashboard } from './components/dashboard/Dashboard'
import { useAccount } from 'wagmi'
import LandingPage from './components/LandingPage' // Adjust import path as needed

const queryClient = new QueryClient()

function AppContent() {
  const { isConnected } = useAccount()
  const [showDashboard, setShowDashboard] = useState(false)

  const handleGetStarted = () => {
    // Only proceed to dashboard if wallet is connected
    if (isConnected) {
      setShowDashboard(true)
    }
    // If not connected, the LandingPage component will handle showing wallet options
  }

  // Show dashboard only after user is connected and has clicked to proceed
  if (showDashboard && isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">RealEstateX</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowDashboard(false)}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  ← Back to Home
                </button>
                <WalletConnect />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Dashboard />
        </main>
      </div>
    )
  }

  // Show landing page (which handles wallet connection internally)
  return <LandingPage onGetStarted={handleGetStarted} />
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App