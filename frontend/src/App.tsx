import React, { useState, useEffect } from 'react';
import { WagmiProvider, useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wallet';
import { Dashboard } from './components/dashboard/Dashboard';
import LandingPage from './components/LandingPage';

const queryClient = new QueryClient();

function AppContent() {
  const { isConnected } = useAccount();
  const [showDashboard, setShowDashboard] = useState(false);

  const handleGetStarted = () => {
    if (isConnected) {
      setShowDashboard(true);
    }
  };

  // Automatically show the dashboard when the wallet connects.
  useEffect(() => {
    if (isConnected) {
      setShowDashboard(true);
    }
  }, [isConnected]);

  // This function will be called by the "Back to Home" button.
  const handleDisconnect = () => {
    setShowDashboard(false);
  };

  if (showDashboard && isConnected) {
    // Pass the handleDisconnect function to the Dashboard component.
    return <Dashboard onDisconnect={handleDisconnect} />;
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;