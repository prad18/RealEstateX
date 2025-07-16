// User and Authentication Types
export interface User {
  id: string;
  wallet_address: string;
  verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Property and Document Types
export interface Property {
  id: string;
  user_id: string;
  title: string;
  address: string;
  estimated_value: number;
  current_value: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  documents: Document[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  property_id: string;
  document_type: 'sale_deed' | 'pan_card' | 'property_tax' | 'other';
  file_name: string;
  ipfs_hash: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  uploaded_at: string;
}

// Minting and Token Types
export interface MintConsent {
  property_id: string;
  property_value: number;
  consent_signature: string;
  token_amount: number;
}

export interface TokenBalance {
  homed_balance: number;
  collateral_value: number;
  health_factor: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface VerificationStatus {
  user_id: string;
  is_verified: boolean;
  pending_documents: number;
  verified_documents: number;
  rejected_documents: number;
}

// Wallet Types
export interface WalletConnection {
  address: string;
  isConnected: boolean;
  chainId?: number;
}

// Upload Types
export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  ipfs_hash?: string;
  error?: string;
}
