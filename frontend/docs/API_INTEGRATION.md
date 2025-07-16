# 🚀 RealEstateX API Integration Guide

## Table of Contents
- [Overview](#overview)
- [Current Mock Implementation](#current-mock-implementation)
- [Real API Integration](#real-api-integration)
- [Property Data APIs](#property-data-apis)
- [Blockchain Integration](#blockchain-integration)
- [External Services](#external-services)
- [Implementation Steps](#implementation-steps)

## Overview

RealEstateX currently uses simulated data and mock APIs for demonstration purposes. This guide provides comprehensive instructions for integrating real-world APIs and services to create a production-ready platform.

### Current Architecture

```
Frontend (React/TypeScript)
├── Mock Services (Current)
│   ├── Simulated Property Data
│   ├── Mock Valuation API
│   ├── Fake Verification Process
│   └── Demo Blockchain Calls
└── Real APIs (Integration Target)
    ├── Property Database APIs
    ├── Valuation Services
    ├── KYC/Verification APIs
    └── Blockchain Networks
```

### Integration Benefits

- **Real Data**: Access to actual property records and market data
- **Accurate Valuations**: Professional property assessment algorithms
- **Legal Compliance**: Proper KYC and document verification
- **Blockchain Integration**: Actual smart contract deployment and interactions

## Current Mock Implementation

### Mock Services Overview

The current implementation uses the following mock services:

#### 1. Property Valuation Service
```typescript
// Current: Simulated valuation
async getPropertyValuation(property: PropertyDetails): Promise<ValuationResult> {
  // Simulated market data
  const basePrice = this.getLocationFactors(property.city).basePricePerSqFt;
  const estimatedValue = property.area * basePrice;
  
  return {
    estimatedValue,
    confidenceScore: 85,
    // ... other simulated data
  };
}
```

#### 2. Verification Service
```typescript
// Current: Mock verification phases
async submitForVerification(propertyId: string): Promise<string> {
  // Simulated 5-phase verification
  // No real document analysis or legal verification
  return this.mockVerificationProcess(propertyId);
}
```

#### 3. Property Data
```typescript
// Current: Hardcoded location factors
private getLocationFactors(city: string) {
  const mockData = {
    'mumbai': { basePricePerSqFt: 15000 },
    'delhi': { basePricePerSqFt: 12000 },
    // ... simulated data
  };
  return mockData[city.toLowerCase()] || mockData.default;
}
```

## Real API Integration

### Phase 1: Property Data APIs

#### 1. Propstack API Integration

Propstack provides comprehensive Indian real estate data.

```typescript
// services/propertyDataService.ts

interface PropstackConfig {
  apiKey: string;
  baseUrl: string;
}

interface PropstackProperty {
  id: string;
  address: string;
  price: number;
  area: number;
  type: string;
  amenities: string[];
  coordinates: [number, number];
}

export class PropstackService {
  private config: PropstackConfig;
  
  constructor(config: PropstackConfig) {
    this.config = config;
  }
  
  /**
   * Search properties by location
   */
  async searchProperties(query: {
    location: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
  }): Promise<PropstackProperty[]> {
    try {
      const params = new URLSearchParams({
        location: query.location,
        api_key: this.config.apiKey,
        ...(query.propertyType && { type: query.propertyType }),
        ...(query.minPrice && { min_price: query.minPrice.toString() }),
        ...(query.maxPrice && { max_price: query.maxPrice.toString() }),
        ...(query.minArea && { min_area: query.minArea.toString() }),
        ...(query.maxArea && { max_area: query.maxArea.toString() })
      });
      
      const response = await fetch(`${this.config.baseUrl}/properties?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Propstack API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.properties || [];
    } catch (error) {
      console.error('Propstack search failed:', error);
      throw new Error(`Property search failed: ${error}`);
    }
  }
  
  /**
   * Get property details by ID
   */
  async getPropertyDetails(propertyId: string): Promise<PropstackProperty | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/properties/${propertyId}?api_key=${this.config.apiKey}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Propstack API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.property;
    } catch (error) {
      console.error('Property details fetch failed:', error);
      return null;
    }
  }
  
  /**
   * Get market trends for location
   */
  async getMarketTrends(location: string): Promise<{
    averagePrice: number;
    priceGrowth: number;
    inventory: number;
    absorption: number;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/market-trends?location=${encodeURIComponent(location)}&api_key=${this.config.apiKey}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Market trends API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.trends;
    } catch (error) {
      console.error('Market trends fetch failed:', error);
      throw error;
    }
  }
}

// Initialize service
export const propstackService = new PropstackService({
  apiKey: import.meta.env.VITE_PROPSTACK_API_KEY || '',
  baseUrl: 'https://api.propstack.com/v1'
});
```

#### 2. 99acres API Integration

```typescript
// services/99acresService.ts

export class AcresService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async getPropertyValuation(address: string, area: number): Promise<{
    estimatedPrice: number;
    priceRange: { min: number; max: number };
    pricePerSqFt: number;
    confidence: number;
  }> {
    try {
      const response = await fetch('https://api.99acres.com/valuation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address,
          area,
          property_type: 'residential'
        })
      });
      
      const data = await response.json();
      return data.valuation;
    } catch (error) {
      console.error('99acres valuation failed:', error);
      throw error;
    }
  }
  
  async getComparableProperties(
    location: string,
    propertyType: string,
    area: number
  ): Promise<Array<{
    address: string;
    price: number;
    area: number;
    soldDate: string;
    distance: number;
  }>> {
    // Implementation for comparable properties
    try {
      const response = await fetch('https://api.99acres.com/comparables', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location,
          property_type: propertyType,
          area_range: { min: area * 0.8, max: area * 1.2 }
        })
      });
      
      const data = await response.json();
      return data.comparables;
    } catch (error) {
      console.error('Comparables fetch failed:', error);
      return [];
    }
  }
}
```

#### 3. Enhanced Property Valuation Service

```typescript
// services/enhancedPropertyValuation.ts

import { propstackService } from './propertyDataService';
import { AcresService } from './99acresService';

export class EnhancedPropertyValuationService {
  private acresService: AcresService;
  
  constructor() {
    this.acresService = new AcresService(import.meta.env.VITE_99ACRES_API_KEY || '');
  }
  
  async getComprehensiveValuation(property: PropertyDetails): Promise<ValuationResult> {
    try {
      // Get data from multiple sources
      const [
        propstackData,
        acresValuation,
        marketTrends,
        comparables
      ] = await Promise.allSettled([
        propstackService.searchProperties({ location: property.address }),
        this.acresService.getPropertyValuation(property.address, property.area),
        propstackService.getMarketTrends(property.city),
        this.acresService.getComparableProperties(
          property.city,
          property.propertyType,
          property.area
        )
      ]);
      
      // Combine and analyze data
      const combinedValuation = this.combineValuationData({
        propstack: propstackData.status === 'fulfilled' ? propstackData.value : null,
        acres: acresValuation.status === 'fulfilled' ? acresValuation.value : null,
        trends: marketTrends.status === 'fulfilled' ? marketTrends.value : null,
        comparables: comparables.status === 'fulfilled' ? comparables.value : []
      });
      
      return this.generateFinalValuation(property, combinedValuation);
    } catch (error) {
      console.error('Enhanced valuation failed:', error);
      throw error;
    }
  }
  
  private combineValuationData(sources: {
    propstack: any;
    acres: any;
    trends: any;
    comparables: any[];
  }) {
    // Advanced algorithm to combine multiple data sources
    const valuations = [];
    
    if (sources.acres?.estimatedPrice) {
      valuations.push({
        value: sources.acres.estimatedPrice,
        confidence: sources.acres.confidence,
        source: '99acres'
      });
    }
    
    if (sources.propstack?.length > 0) {
      const avgPrice = sources.propstack.reduce((sum: number, prop: any) => 
        sum + prop.price, 0) / sources.propstack.length;
      valuations.push({
        value: avgPrice,
        confidence: 75,
        source: 'propstack'
      });
    }
    
    if (sources.comparables?.length > 0) {
      const avgComparable = sources.comparables.reduce((sum, comp) => 
        sum + comp.price, 0) / sources.comparables.length;
      valuations.push({
        value: avgComparable,
        confidence: 80,
        source: 'comparables'
      });
    }
    
    // Weighted average based on confidence scores
    const totalWeight = valuations.reduce((sum, val) => sum + val.confidence, 0);
    const weightedValue = valuations.reduce((sum, val) => 
      sum + (val.value * val.confidence), 0) / totalWeight;
    
    return {
      estimatedValue: weightedValue,
      confidence: Math.min(totalWeight / valuations.length, 95),
      sources: valuations,
      marketTrends: sources.trends
    };
  }
}
```

### Phase 2: Document Verification APIs

#### 1. DigiLocker Integration

```typescript
// services/digiLockerService.ts

export class DigiLockerService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.digilocker.gov.in/v2';
  }
  
  /**
   * Verify property documents using DigiLocker
   */
  async verifyPropertyDocument(
    documentType: 'title_deed' | 'sale_deed' | 'khata_certificate',
    documentNumber: string,
    ownerDetails: {
      name: string;
      aadhaar?: string;
      pan?: string;
    }
  ): Promise<{
    isValid: boolean;
    documentDetails: any;
    ownershipVerified: boolean;
    errors?: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/verify-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_type: documentType,
          document_number: documentNumber,
          owner_details: ownerDetails
        })
      });
      
      if (!response.ok) {
        throw new Error(`DigiLocker verification failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        isValid: data.status === 'valid',
        documentDetails: data.document,
        ownershipVerified: data.ownership_verified,
        errors: data.errors
      };
    } catch (error) {
      console.error('DigiLocker verification failed:', error);
      throw error;
    }
  }
  
  /**
   * Get property ownership history
   */
  async getOwnershipHistory(propertyId: string): Promise<Array<{
    owner: string;
    fromDate: string;
    toDate?: string;
    documentNumber: string;
    documentType: string;
  }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ownership-history/${propertyId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Ownership history fetch failed:', error);
      return [];
    }
  }
}
```

#### 2. KYC Verification Service

```typescript
// services/kycService.ts

export class KYCService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Verify user identity using Aadhaar
   */
  async verifyAadhaar(aadhaarNumber: string, otp: string): Promise<{
    verified: boolean;
    userDetails: {
      name: string;
      address: string;
      dob: string;
      gender: string;
    };
  }> {
    try {
      const response = await fetch('https://api.aadhaarapi.com/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aadhaar_number: aadhaarNumber,
          otp: otp
        })
      });
      
      const data = await response.json();
      return {
        verified: data.status === 'success',
        userDetails: data.user_details
      };
    } catch (error) {
      console.error('Aadhaar verification failed:', error);
      throw error;
    }
  }
  
  /**
   * Verify PAN card
   */
  async verifyPAN(panNumber: string, name: string): Promise<{
    verified: boolean;
    nameMatch: boolean;
    details: any;
  }> {
    try {
      const response = await fetch('https://api.panapi.com/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pan_number: panNumber,
          name: name
        })
      });
      
      const data = await response.json();
      return {
        verified: data.status === 'valid',
        nameMatch: data.name_match,
        details: data.details
      };
    } catch (error) {
      console.error('PAN verification failed:', error);
      throw error;
    }
  }
  
  /**
   * Perform comprehensive KYC check
   */
  async performKYC(userDetails: {
    name: string;
    aadhaar: string;
    pan: string;
    mobile: string;
    email: string;
  }): Promise<{
    kycStatus: 'approved' | 'rejected' | 'pending';
    score: number;
    verifications: {
      aadhaar: boolean;
      pan: boolean;
      mobile: boolean;
      email: boolean;
    };
    riskFlags: string[];
  }> {
    // Comprehensive KYC implementation
    const verifications = {
      aadhaar: false,
      pan: false,
      mobile: false,
      email: false
    };
    
    const riskFlags: string[] = [];
    let score = 0;
    
    try {
      // Perform all verifications
      // Implementation details...
      
      return {
        kycStatus: score >= 80 ? 'approved' : score >= 60 ? 'pending' : 'rejected',
        score,
        verifications,
        riskFlags
      };
    } catch (error) {
      console.error('KYC process failed:', error);
      throw error;
    }
  }
}
```

### Phase 3: Blockchain Integration

#### 1. Real Blockchain Network Setup

```typescript
// config/blockchain.ts

export const BLOCKCHAIN_NETWORKS = {
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: `https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_PROJECT_ID}`,
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  mumbai: {
    chainId: 80001,
    name: 'Polygon Mumbai Testnet',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  }
};

export const SMART_CONTRACTS = {
  polygon: {
    realEstateNFT: '0x1234567890123456789012345678901234567890',
    stablecoin: '0x0987654321098765432109876543210987654321',
    marketplace: '0x1111111111111111111111111111111111111111'
  },
  mumbai: {
    realEstateNFT: '0x2222222222222222222222222222222222222222',
    stablecoin: '0x3333333333333333333333333333333333333333',
    marketplace: '0x4444444444444444444444444444444444444444'
  }
};
```

#### 2. Smart Contract Integration

```typescript
// services/contractService.ts

import { Contract, ethers } from 'ethers';
import RealEstateNFTABI from '../contracts/RealEstateNFT.abi.json';
import StablecoinABI from '../contracts/HomedStablecoin.abi.json';

export class ContractService {
  private provider: ethers.Provider;
  private signer: ethers.Signer | null = null;
  private contracts: Map<string, Contract> = new Map();
  
  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  
  /**
   * Connect wallet and initialize signer
   */
  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    this.signer = await provider.getSigner();
    
    return accounts[0];
  }
  
  /**
   * Get or create contract instance
   */
  private getContract(address: string, abi: any[]): Contract {
    const key = `${address}_${this.signer?.address || 'readonly'}`;
    
    if (!this.contracts.has(key)) {
      const contract = new Contract(
        address,
        abi,
        this.signer || this.provider
      );
      this.contracts.set(key, contract);
    }
    
    return this.contracts.get(key)!;
  }
  
  /**
   * Mint property NFT
   */
  async mintPropertyNFT(
    contractAddress: string,
    to: string,
    propertyId: string,
    metadataURI: string,
    value: bigint
  ): Promise<{
    transactionHash: string;
    tokenId: bigint;
  }> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    
    const contract = this.getContract(contractAddress, RealEstateNFTABI);
    
    try {
      const tx = await contract.mintProperty(
        to,
        propertyId,
        metadataURI,
        value
      );
      
      const receipt = await tx.wait();
      
      // Extract token ID from events
      const mintEvent = receipt.logs.find((log: any) => 
        log.topics[0] === contract.interface.getEvent('PropertyMinted').topicHash
      );
      
      const parsedEvent = contract.interface.parseLog(mintEvent);
      const tokenId = parsedEvent.args.tokenId;
      
      return {
        transactionHash: receipt.hash,
        tokenId
      };
    } catch (error) {
      console.error('NFT minting failed:', error);
      throw new Error(`NFT minting failed: ${error}`);
    }
  }
  
  /**
   * Transfer property ownership
   */
  async transferProperty(
    contractAddress: string,
    from: string,
    to: string,
    tokenId: bigint
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    
    const contract = this.getContract(contractAddress, RealEstateNFTABI);
    
    try {
      const tx = await contract.transferFrom(from, to, tokenId);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Property transfer failed:', error);
      throw error;
    }
  }
  
  /**
   * Get property details from blockchain
   */
  async getPropertyDetails(
    contractAddress: string,
    tokenId: bigint
  ): Promise<{
    owner: string;
    propertyId: string;
    value: bigint;
    metadataURI: string;
    isActive: boolean;
  }> {
    const contract = this.getContract(contractAddress, RealEstateNFTABI);
    
    try {
      const [owner, propertyId, value, metadataURI, isActive] = await Promise.all([
        contract.ownerOf(tokenId),
        contract.getPropertyId(tokenId),
        contract.getPropertyValue(tokenId),
        contract.tokenURI(tokenId),
        contract.isPropertyActive(tokenId)
      ]);
      
      return {
        owner,
        propertyId,
        value,
        metadataURI,
        isActive
      };
    } catch (error) {
      console.error('Property details fetch failed:', error);
      throw error;
    }
  }
  
  /**
   * Fractional token operations
   */
  async createFractionalTokens(
    propertyTokenId: bigint,
    totalSupply: bigint,
    pricePerToken: bigint
  ): Promise<string> {
    // Implementation for fractional tokenization
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    
    // This would interact with a fractional ownership contract
    // Implementation details depend on the specific contract design
    
    return 'transaction_hash';
  }
}

// Singleton service
export const contractService = new ContractService(
  import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com'
);
```

### Phase 4: External Services Integration

#### 1. Legal Document Verification

```typescript
// services/legalVerificationService.ts

export class LegalVerificationService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Verify legal documents with government registrar
   */
  async verifyWithRegistrar(
    documentType: string,
    documentNumber: string,
    propertyDetails: any
  ): Promise<{
    verified: boolean;
    registrarResponse: any;
    legalStatus: 'clear' | 'disputed' | 'encumbered';
    issues?: string[];
  }> {
    try {
      // Integration with state registrar systems
      const response = await fetch('https://api.registrar.gov.in/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_type: documentType,
          document_number: documentNumber,
          property_details: propertyDetails
        })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Registrar verification failed:', error);
      throw error;
    }
  }
  
  /**
   * Check for legal disputes
   */
  async checkLegalDisputes(propertyId: string): Promise<{
    hasDisputes: boolean;
    disputes: Array<{
      caseNumber: string;
      court: string;
      status: string;
      filedDate: string;
    }>;
  }> {
    // Implementation for checking court records
    return { hasDisputes: false, disputes: [] };
  }
}
```

#### 2. Insurance Integration

```typescript
// services/insuranceService.ts

export class InsuranceService {
  async getPropertyInsuranceQuote(
    propertyDetails: PropertyDetails,
    coverageAmount: number
  ): Promise<{
    premium: number;
    coverage: {
      property: number;
      liability: number;
      naturalDisasters: boolean;
    };
    provider: string;
    policyTerms: string;
  }> {
    // Integration with insurance providers
    try {
      const response = await fetch('https://api.insuranceprovider.com/quote', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          property: propertyDetails,
          coverage_amount: coverageAmount
        })
      });
      
      const data = await response.json();
      return data.quote;
    } catch (error) {
      console.error('Insurance quote failed:', error);
      throw error;
    }
  }
}
```

## Implementation Steps

### Step 1: Environment Setup

```bash
# 1. Install additional dependencies
npm install ethers@6 @web3modal/wagmi wagmi viem

# 2. Set up environment variables
cp .env.example .env
```

```env
# Add real API keys to .env
VITE_PROPSTACK_API_KEY=your_propstack_key
VITE_99ACRES_API_KEY=your_99acres_key
VITE_DIGILOCKER_API_KEY=your_digilocker_key
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_INFURA_PROJECT_ID=your_infura_project_id

# Smart contract addresses (after deployment)
VITE_POLYGON_NFT_CONTRACT=0x...
VITE_POLYGON_STABLECOIN_CONTRACT=0x...
```

### Step 2: Replace Mock Services

```typescript
// Replace mock services gradually

// 1. Update property valuation service
// services/propertyValuation.ts
import { propstackService } from './propertyDataService';
import { AcresService } from './99acresService';

// Replace mock implementation with real API calls

// 2. Update verification service
// services/verificationService.ts
import { DigiLockerService } from './digiLockerService';
import { KYCService } from './kycService';

// Replace mock verification with real document verification

// 3. Update Web3 service
// services/web3Service.ts
import { contractService } from './contractService';

// Replace mock blockchain calls with real smart contract interactions
```

### Step 3: Smart Contract Deployment

```typescript
// Deploy smart contracts to testnet first
// scripts/deploy.ts

async function deployContracts() {
  const [deployer] = await ethers.getSigners();
  
  // Deploy Real Estate NFT contract
  const RealEstateNFT = await ethers.getContractFactory("RealEstateNFT");
  const nftContract = await RealEstateNFT.deploy();
  await nftContract.deployed();
  
  // Deploy Stablecoin contract
  const HomedStablecoin = await ethers.getContractFactory("HomedStablecoin");
  const stablecoin = await HomedStablecoin.deploy();
  await stablecoin.deployed();
  
  console.log("NFT Contract deployed to:", nftContract.address);
  console.log("Stablecoin deployed to:", stablecoin.address);
}
```

### Step 4: Testing Integration

```typescript
// Test real API integration
// tests/integration/apiIntegration.test.ts

describe('Real API Integration', () => {
  test('Property data retrieval', async () => {
    const properties = await propstackService.searchProperties({
      location: 'Mumbai, Maharashtra'
    });
    
    expect(properties).toBeDefined();
    expect(properties.length).toBeGreaterThan(0);
  });
  
  test('Property valuation', async () => {
    const valuation = await enhancedPropertyValuationService.getComprehensiveValuation({
      address: '123 Test Street, Mumbai',
      area: 1000,
      propertyType: 'residential',
      city: 'Mumbai',
      state: 'Maharashtra'
    });
    
    expect(valuation.estimatedValue).toBeGreaterThan(0);
    expect(valuation.confidenceScore).toBeGreaterThan(50);
  });
  
  test('Document verification', async () => {
    const verification = await digiLockerService.verifyPropertyDocument(
      'title_deed',
      'TEST123456',
      { name: 'Test Owner' }
    );
    
    expect(verification).toBeDefined();
  });
});
```

### Step 5: Production Deployment

```typescript
// Production deployment checklist

// 1. Environment configuration
// - Set production API keys
// - Configure mainnet RPC URLs
// - Deploy contracts to mainnet

// 2. Security measures
// - API key rotation
// - Rate limiting
// - Error monitoring
// - Audit smart contracts

// 3. Monitoring and logging
// - API usage tracking
// - Error reporting
// - Performance monitoring
// - User analytics
```

This comprehensive API integration guide provides the roadmap for transforming RealEstateX from a demo application to a production-ready platform with real-world data sources and blockchain integration.
