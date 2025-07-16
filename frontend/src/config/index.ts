export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  
  // Wallet Configuration
  walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  
  // IPFS Configuration
  ipfsGateway: import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
  
  // App Configuration
  appName: 'RealEstateX',
  appDescription: 'Real-World Asset Stablecoin Platform',
  
  // Supported file types for document upload
  supportedFileTypes: {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg'],
  },
  
  // Maximum file size (10MB)
  maxFileSize: 10 * 1024 * 1024,
  
  // Maximum number of files per upload
  maxFiles: 10,
  
  // Token configuration
  tokenSymbol: 'HOMED',
  tokenName: 'Home Dollar',
  
  // Health factor thresholds
  healthFactorWarning: 1.5,
  healthFactorDanger: 1.2,
  
  // Supported chains
  supportedChains: ['mainnet', 'sepolia'],
} as const;

export type AppConfig = typeof config;
