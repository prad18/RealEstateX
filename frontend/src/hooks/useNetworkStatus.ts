import { useState, useEffect, useCallback } from 'react';
import { getRPCProvider } from '@/services/contracts';

type NetworkStatus = 'connected' | 'disconnected' | 'checking';

export const useNetworkStatus = (pollInterval: number = 10000) => {
  const [status, setStatus] = useState<NetworkStatus>('checking');

  const checkStatus = useCallback(async () => {
    setStatus('checking');
    try {
      const provider = getRPCProvider();
      await provider.getBlockNumber(); // A simple, lightweight check
      setStatus('connected');
    } catch (error) {
      console.warn('RPC connection check failed:', error);
      setStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    checkStatus(); // Initial check
    const intervalId = setInterval(checkStatus, pollInterval);
    return () => clearInterval(intervalId);
  }, [checkStatus, pollInterval]);

  return { status, checkStatus };
};