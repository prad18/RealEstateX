import { useState, useEffect } from 'react';
import { WagmiProvider, useAccount, useDisconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wallet';
import { Dashboard } from './components/dashboard/Dashboard';
import LandingPage from './components/LandingPage';

const queryClient = new QueryClient();

function AppContent() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [showDashboard, setShowDashboard] = useState(false);

  const handleGetStarted = () => {
    if (isConnected) {
      setShowDashboard(true);
    }
  };

  useEffect(() => {
    if (isConnected) {
      setShowDashboard(true);
    }
  }, [isConnected]);
  
  // This function now handles full logout: disconnect wallet AND hide dashboard.
  const handleDisconnect = () => {
    disconnect();
    setShowDashboard(false);
  };

  if (showDashboard && isConnected) {
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