import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useConnect, useDisconnect } from 'wagmi';
import { apiService } from '../services/api';
import type { WalletConnection } from '../types';

export const useWallet = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const walletConnection: WalletConnection = {
    address: address || '',
    isConnected,
  };

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && isConnected) {
      setIsAuthenticated(true);
    }
  }, [isConnected]);

  const authenticateWallet = async () => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a message for signing
      const message = `Sign this message to authenticate with RealEstateX.\n\nAddress: ${address}\nTimestamp: ${Date.now()}`;
      
      // Sign the message
      const signature = await signMessageAsync({ message });

      // Send to backend for verification
      const response = await apiService.connectWallet(address, signature);

      // Store token
      localStorage.setItem('access_token', response.access_token);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      const connector = connectors[0]; // Use the first available connector
      if (connector) {
        connect({ connector });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    disconnect();
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
  };

  return {
    walletConnection,
    isAuthenticated,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    authenticateWallet,
  };
};
