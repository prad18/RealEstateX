# 🔧 RealEstateX Services Documentation

## Table of Contents
- [Service Architecture](#service-architecture)
- [Web3 Service](#web3-service)
- [IPFS Service](#ipfs-service)
- [Property Valuation Service](#property-valuation-service)
- [Verification Service](#verification-service)
- [Authentication Service](#authentication-service)
- [API Integration Guide](#api-integration-guide)

## Service Architecture

The RealEstateX frontend follows a service-oriented architecture where business logic is separated from UI components. Each service handles a specific domain of functionality and provides a clean API for components to use.

### Design Principles

1. **Separation of Concerns**: Each service handles one specific area of functionality
2. **Dependency Injection**: Services can be configured with different implementations
3. **Error Handling**: Consistent error handling and reporting across all services
4. **Caching**: Intelligent caching to improve performance and reduce API calls
5. **Type Safety**: Full TypeScript support with strict typing

### Service Hierarchy

```
Services Layer
├── Core Services (Infrastructure)
│   ├── Web3Service          # Blockchain interactions
│   ├── IPFSService          # Decentralized storage
│   └── AuthService          # User authentication
├── Business Services (Domain Logic)
│   ├── VerificationService  # Property verification
│   ├── PropertyValuation    # Property pricing
│   └── TransactionService   # Blockchain transactions
└── Integration Services (External APIs)
    ├── PropertyDataService  # Property database APIs
    ├── GeolocationService   # Location services
    └── NotificationService  # Push notifications
```

## Web3 Service

The Web3Service handles all blockchain interactions including wallet connection, smart contract calls, and transaction management.

### Core Functionality

```typescript
// services/web3Service.ts

interface Web3Config {
  chainId: number;
  rpcUrl: string;
  contracts: {
    realEstateNFT: string;
    stablecoin: string;
  };
}

interface TransactionResult {
  hash: string;
  blockNumber?: number;
  gasUsed?: bigint;
  status: 'pending' | 'confirmed' | 'failed';
}

export class Web3Service {
  private config: Web3Config;
  private client: any; // Web3 client instance
  
  constructor(config: Web3Config) {
    this.config = config;
    this.initializeClient();
  }
  
  /**
   * Initialize Web3 client with configuration
   */
  private initializeClient(): void {
    this.client = createPublicClient({
      chain: blockDagTestnet,
      transport: http(this.config.rpcUrl)
    });
  }
  
  /**
   * Connect user wallet and return account information
   */
  async connectWallet(): Promise<{
    address: string;
    chainId: number;
    balance: string;
  }> {
    try {
      const accounts = await window.ethereum?.request({
        method: 'eth_requestAccounts'
      });
      
      if (!accounts?.length) {
        throw new Error('No accounts found');
      }
      
      const address = accounts[0];
      const chainId = await this.getChainId();
      const balance = await this.getBalance(address);
      
      return { address, chainId, balance };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw new Error('Failed to connect wallet');
    }
  }
  
  /**
   * Get account balance in ETH
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.client.getBalance({ address });
      return formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }
  
  /**
   * Switch to correct network if needed
   */
  async switchNetwork(): Promise<boolean> {
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${this.config.chainId.toString(16)}` }]
      });
      return true;
    } catch (error) {
      console.error('Network switch failed:', error);
      return false;
    }
  }
  
  /**
   * Execute a contract write operation
   */
  async executeContractWrite(
    contractAddress: string,
    abi: any[],
    functionName: string,
    args: any[] = [],
    value?: bigint
  ): Promise<TransactionResult> {
    try {
      const hash = await this.client.writeContract({
        address: contractAddress,
        abi,
        functionName,
        args,
        value
      });
      
      return {
        hash,
        status: 'pending'
      };
    } catch (error) {
      console.error('Contract write failed:', error);
      throw new Error(`Contract execution failed: ${error}`);
    }
  }
  
  /**
   * Read from contract (view functions)
   */
  async executeContractRead(
    contractAddress: string,
    abi: any[],
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    try {
      return await this.client.readContract({
        address: contractAddress,
        abi,
        functionName,
        args
      });
    } catch (error) {
      console.error('Contract read failed:', error);
      throw new Error(`Contract read failed: ${error}`);
    }
  }
  
  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash: string): Promise<TransactionResult> {
    try {
      const receipt = await this.client.waitForTransactionReceipt({
        hash,
        timeout: 60000 // 1 minute timeout
      });
      
      return {
        hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };
    } catch (error) {
      console.error('Transaction wait failed:', error);
      return {
        hash,
        status: 'failed'
      };
    }
  }
  
  /**
   * Get current chain ID
   */
  private async getChainId(): Promise<number> {
    const chainId = await this.client.getChainId();
    return chainId;
  }
}

// Singleton instance
export const web3Service = new Web3Service({
  chainId: 1043,
  rpcUrl: import.meta.env.VITE_BLOCKDAG_RPC_URL || 'https://rpc.blockdag.network',
  contracts: {
    realEstateNFT: import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '',
    stablecoin: import.meta.env.VITE_STABLECOIN_CONTRACT_ADDRESS || ''
  }
});
```

### Usage Examples

```typescript
// Component using Web3Service
import { web3Service } from '@/services/web3Service';
import { useAccount, useBalance } from 'wagmi';

function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  
  const handleConnect = async () => {
    try {
      const wallet = await web3Service.connectWallet();
      console.log('Connected wallet:', wallet);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };
  
  const handleSwitchNetwork = async () => {
    const success = await web3Service.switchNetwork();
    if (success) {
      console.log('Network switched successfully');
    }
  };
  
  return (
    <div>
      {isConnected ? (
        <div>
          <p>Address: {address}</p>
          <p>Balance: {balance?.formatted} {balance?.symbol}</p>
        </div>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## IPFS Service

The IPFSService handles decentralized file storage using IPFS via Pinata gateway.

### Core Implementation

```typescript
// services/ipfs.ts

interface IPFSConfig {
  pinataJWT: string;
  gatewayUrl: string;
  apiUrl: string;
}

interface UploadResult {
  hash: string;
  url: string;
  size: number;
  name: string;
}

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export class IPFSService {
  private config: IPFSConfig;
  private uploadCache = new Map<string, UploadResult>();
  
  constructor(config: IPFSConfig) {
    this.config = config;
  }
  
  /**
   * Upload file to IPFS via Pinata
   */
  async uploadFile(file: File, metadata?: Record<string, any>): Promise<UploadResult> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(file);
      if (this.uploadCache.has(cacheKey)) {
        return this.uploadCache.get(cacheKey)!;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata if provided
      if (metadata) {
        formData.append('pinataMetadata', JSON.stringify({
          name: file.name,
          ...metadata
        }));
      }
      
      const response = await fetch(`${this.config.apiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.pinataJWT}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data: PinataResponse = await response.json();
      
      const result: UploadResult = {
        hash: data.IpfsHash,
        url: `${this.config.gatewayUrl}/ipfs/${data.IpfsHash}`,
        size: data.PinSize,
        name: file.name
      };
      
      // Cache result
      this.uploadCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }
  
  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data: any, filename?: string): Promise<UploadResult> {
    try {
      const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const file = new File([jsonBlob], filename || 'data.json', {
        type: 'application/json'
      });
      
      return await this.uploadFile(file);
    } catch (error) {
      console.error('JSON upload failed:', error);
      throw new Error(`Failed to upload JSON: ${error}`);
    }
  }
  
  /**
   * Retrieve file from IPFS
   */
  async retrieveFile(hash: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.config.gatewayUrl}/ipfs/${hash}`);
      
      if (!response.ok) {
        throw new Error(`Retrieval failed: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('IPFS retrieval failed:', error);
      throw new Error(`Failed to retrieve file: ${error}`);
    }
  }
  
  /**
   * Get file metadata from Pinata
   */
  async getFileMetadata(hash: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/data/pinList?hashContains=${hash}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.pinataJWT}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Metadata fetch failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.rows[0] || null;
    } catch (error) {
      console.error('Metadata fetch failed:', error);
      return null;
    }
  }
  
  /**
   * Generate URL for IPFS file
   */
  generateUrl(hash: string): string {
    return `${this.config.gatewayUrl}/ipfs/${hash}`;
  }
  
  /**
   * Validate IPFS hash format
   */
  validateHash(hash: string): boolean {
    // Basic IPFS hash validation (simplified)
    return /^Qm[a-zA-Z0-9]{44}$/.test(hash) || /^bafy[a-z0-9]{55}$/.test(hash);
  }
  
  /**
   * Generate cache key for file
   */
  private generateCacheKey(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }
  
  /**
   * Clear upload cache
   */
  clearCache(): void {
    this.uploadCache.clear();
  }
}

// Singleton instance
export const ipfsService = new IPFSService({
  pinataJWT: import.meta.env.VITE_PINATA_JWT || '',
  gatewayUrl: import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud',
  apiUrl: 'https://api.pinata.cloud'
});
```

### Usage Examples

```typescript
// Document upload component
import { ipfsService } from '@/services/ipfs';

function DocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  
  const handleFileUpload = async (files: File[]) => {
    setUploading(true);
    
    try {
      const uploads = await Promise.all(
        files.map(file => 
          ipfsService.uploadFile(file, {
            category: 'property-document',
            uploadedAt: new Date().toISOString()
          })
        )
      );
      
      setUploadedFiles(prev => [...prev, ...uploads]);
      console.log('Files uploaded:', uploads);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            handleFileUpload(Array.from(e.target.files));
          }
        }}
      />
      
      {uploading && <div>Uploading files...</div>}
      
      <div>
        {uploadedFiles.map(file => (
          <div key={file.hash}>
            <span>{file.name}</span>
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              View File
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Regrid Service

The RegridService provides integration with the Regrid API for accessing real estate property data from government records. This service enables property lookup by coordinates, data transformation, and property valuation generation.

### Core Implementation

```typescript
// services/regridService.ts

interface ServiceConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

export class RegridPropertyService {
  private config: ServiceConfig;
  private cache = new Map<string, PropertyDetails>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor(config: ServiceConfig) {
    this.config = config;
  }

  /**
   * Get property details by coordinates
   */
  async getPropertyByCoordinates(
    lat: number,
    lon: number,
    radius: number = 100
  ): Promise<{
    success: boolean;
    data?: PropertyDetails;
    error?: string;
  }> {
    try {
      // Check cache first
      const cacheKey = `${lat}_${lon}_${radius}`;
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await fetch(
        `${this.config.baseUrl}/parcels/point?lat=${lat}&lon=${lon}&radius=${radius}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: RegridApiResponse = await response.json();
      
      if (!data.parcels?.features?.length) {
        return {
          success: false,
          error: 'No property found at these coordinates'
        };
      }

      const propertyData = data.parcels.features[0].properties;
      const propertyDetails = this.transformRegridData(propertyData);

      // Cache the result
      this.cacheResult(cacheKey, propertyDetails);

      return { success: true, data: propertyDetails };
    } catch (error) {
      console.error('Regrid API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate property valuation based on Regrid data
   */
  async getPropertyValuation(lat: number, lon: number): Promise<{
    success: boolean;
    data?: PropertyValuation;
    error?: string;
  }> {
    try {
      const propertyResult = await this.getPropertyByCoordinates(lat, lon);
      
      if (!propertyResult.success || !propertyResult.data) {
        return {
          success: false,
          error: 'Property data required for valuation'
        };
      }

      const property = propertyResult.data;
      const valuation = this.generateValuation(property);
      
      return { success: true, data: valuation };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Valuation failed'
      };
    }
  }
}

// Service instance
export const regridService = new RegridPropertyService({
  baseUrl: 'https://api.regrid.com/api/v1',
  apiKey: process.env.VITE_REGRID_API_KEY || '',
  timeout: 10000
});
```

### Supported Counties

The Regrid API currently supports property data for **7 counties**:

- **Marion County, Indiana** - Indianapolis metro area
- **Dallas County, Texas** - Dallas metro area  
- **Wilson County, Tennessee** - Nashville metro area
- **Durham County, North Carolina** - Research Triangle
- **Fillmore County, Nebraska** - Rural Nebraska
- **Clark County, Wisconsin** - Central Wisconsin
- **Gurabo Municipio, Puerto Rico** - Puerto Rico territory

### Data Transformation

The service transforms Regrid API data into standardized PropertyDetails format:

```typescript
private transformRegridData(regridData: RegridPropertyData): PropertyDetails {
  const mainAddress = regridData.addresses?.[0];
  const ownership = regridData.enhanced_ownership?.[0];
  
  return {
    address: this.buildFullAddress(regridData, mainAddress),
    city: mainAddress?.a_city || regridData.fields?.a_city || '',
    state: mainAddress?.a_state2 || regridData.fields?.a_state2 || '',
    area: regridData.fields?.ll_gissqft || regridData.fields?.ll_bldg_footprint_sqft || 0,
    propertyType: this.determinePropertyType(
      regridData.fields?.lbcs_activity || '',
      regridData.fields?.lbcs_structure || ''
    ),
    coordinates: {
      lat: parseFloat(mainAddress?.a_lat || '0'),
      lon: parseFloat(mainAddress?.a_lon || '0')
    },
    owner: ownership?.eo_owner || regridData.fields?.owner || 'Unknown',
    value: {
      land: regridData.fields?.ll_land_val || 0,
      improvement: regridData.fields?.ll_imprv_val || 0,
      total: regridData.fields?.ll_assessed_val || 0
    },
    zoning: {
      code: regridData.fields?.zoning || '',
      description: regridData.fields?.zoning_description || '',
      type: regridData.fields?.lbcs_activity || '',
      subtype: regridData.fields?.lbcs_structure || ''
    },
    legal: {
      parcelNumber: regridData.fields?.parcelnumb || regridData.ll_uuid || '',
      stateParcelNumber: regridData.fields?.state_parcelnumb || '',
      legalDescription: regridData.fields?.legal_description || ''
    },
    demographics: {
      medianIncome: regridData.fields?.median_household_income || 0,
      affordabilityIndex: regridData.fields?.housing_affordability_index || 0,
      populationDensity: regridData.fields?.population_density || 0
    }
  };
}
```

### Integration with LocationPicker

```typescript
import { LocationPicker } from '@/components/LocationPicker';
import { regridService } from '@/services/regridService';

function PropertyLookupForm() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [properties, setProperties] = useState<PropertyDetails[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleLocationChange = async (newLocation: LocationData) => {
    setLocation(newLocation);
    setLoading(true);
    
    try {
      const result = await regridService.getPropertyByCoordinates(
        newLocation.latitude,
        newLocation.longitude,
        100 // 100m radius
      );
      
      if (result.success && result.data) {
        setProperties([result.data]);
      } else {
        setProperties([]);
        console.warn('No property found at this location');
      }
    } catch (error) {
      console.error('Property lookup failed:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <LocationPicker 
        onLocationChange={handleLocationChange}
        addressPlaceholder="Enter property address for lookup..."
      />
      
      {loading && <div>Searching for properties...</div>}
      
      {properties.length > 0 && (
        <div className="space-y-4">
          <h3>Property Found:</h3>
          {properties.map((property, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h4 className="font-semibold">{property.address}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Owner: {property.owner}</div>
                <div>Type: {property.propertyType}</div>
                <div>Area: {property.area.toLocaleString()} sq ft</div>
                <div>Assessed Value: ${property.value.total.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Usage Examples

```typescript
// Basic property lookup
const lookupProperty = async () => {
  const result = await regridService.getPropertyByCoordinates(39.7684, -86.1581, 100);
  
  if (result.success && result.data) {
    console.log('Property found:', result.data);
  } else {
    console.error('Property lookup failed:', result.error);
  }
};

// Property valuation
const getValuation = async () => {
  const result = await regridService.getPropertyValuation(39.7684, -86.1581);
  
  if (result.success && result.data) {
    const valuation = result.data;
    console.log(`Estimated Value: $${valuation.estimatedValue.toLocaleString()}`);
    console.log(`Confidence: ${valuation.confidenceScore}%`);
    console.log(`Market Trend: ${valuation.marketTrend}`);
  }
};
```

## Property Valuation Service

The PropertyValuationService provides AI-powered property valuation using multiple data sources and algorithms.

### Core Implementation

```typescript
// services/propertyValuation.ts

interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  area: number; // in square feet
  propertyType: 'residential' | 'commercial' | 'plot';
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  amenities?: string[];
}

interface ValuationResult {
  estimatedValue: number;
  confidenceScore: number; // 0-100
  pricePerSqFt: number;
  marketTrend: 'rising' | 'stable' | 'declining';
  comparableProperties: ComparableProperty[];
  factors: ValuationFactor[];
  lastUpdated: string;
}

interface ComparableProperty {
  address: string;
  soldPrice: number;
  soldDate: string;
  area: number;
  distance: number; // in km
  similarityScore: number; // 0-100
}

interface ValuationFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-100
  description: string;
}

interface MarketData {
  averagePricePerSqFt: number;
  priceAppreciation: number; // yearly %
  salesVolume: number;
  daysOnMarket: number;
}

export class PropertyValuationService {
  private cache = new Map<string, ValuationResult>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  /**
   * Get comprehensive property valuation
   */
  async getPropertyValuation(property: PropertyDetails): Promise<ValuationResult> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(property);
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Gather market data
      const marketData = await this.getMarketData(property.city, property.state);
      
      // Find comparable properties
      const comparables = await this.findComparableProperties(property);
      
      // Calculate base valuation
      const baseValuation = this.calculateBaseValuation(property, marketData);
      
      // Apply adjustment factors
      const adjustedValuation = this.applyAdjustmentFactors(
        baseValuation,
        property,
        comparables
      );
      
      // Generate final result
      const result: ValuationResult = {
        estimatedValue: Math.round(adjustedValuation.value),
        confidenceScore: adjustedValuation.confidence,
        pricePerSqFt: Math.round(adjustedValuation.value / property.area),
        marketTrend: this.determineMarketTrend(marketData),
        comparableProperties: comparables,
        factors: adjustedValuation.factors,
        lastUpdated: new Date().toISOString()
      };
      
      // Cache result
      this.cacheResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Property valuation failed:', error);
      throw new Error(`Valuation failed: ${error}`);
    }
  }
  
  /**
   * Get market data for location
   */
  private async getMarketData(city: string, state: string): Promise<MarketData> {
    // In production, this would call real estate APIs
    // For now, return simulated data based on location
    
    const locationFactors = this.getLocationFactors(city, state);
    
    return {
      averagePricePerSqFt: locationFactors.basePricePerSqFt,
      priceAppreciation: locationFactors.appreciation,
      salesVolume: Math.floor(Math.random() * 100) + 50,
      daysOnMarket: Math.floor(Math.random() * 60) + 30
    };
  }
  
  /**
   * Find comparable properties
   */
  private async findComparableProperties(
    property: PropertyDetails
  ): Promise<ComparableProperty[]> {
    // Simulate finding comparable properties
    // In production, this would query real estate databases
    
    const comparables: ComparableProperty[] = [];
    const basePrice = this.getLocationFactors(property.city, property.state).basePricePerSqFt;
    
    for (let i = 0; i < 5; i++) {
      const areaVariation = 0.8 + (Math.random() * 0.4); // ±20% area
      const priceVariation = 0.9 + (Math.random() * 0.2); // ±10% price
      
      comparables.push({
        address: `${100 + i} Sample Street, ${property.city}`,
        soldPrice: Math.round(property.area * areaVariation * basePrice * priceVariation),
        soldDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        area: Math.round(property.area * areaVariation),
        distance: Math.random() * 2, // within 2km
        similarityScore: Math.floor(75 + Math.random() * 20) // 75-95%
      });
    }
    
    return comparables.sort((a, b) => b.similarityScore - a.similarityScore);
  }
  
  /**
   * Calculate base property valuation
   */
  private calculateBaseValuation(
    property: PropertyDetails,
    marketData: MarketData
  ): { value: number; confidence: number } {
    let baseValue = property.area * marketData.averagePricePerSqFt;
    let confidence = 70; // Base confidence
    
    // Adjust for property type
    switch (property.propertyType) {
      case 'commercial':
        baseValue *= 1.2;
        confidence += 5;
        break;
      case 'plot':
        baseValue *= 0.6;
        confidence -= 10;
        break;
      default:
        // residential - no adjustment
        break;
    }
    
    return { value: baseValue, confidence };
  }
  
  /**
   * Apply adjustment factors to valuation
   */
  private applyAdjustmentFactors(
    baseValuation: { value: number; confidence: number },
    property: PropertyDetails,
    comparables: ComparableProperty[]
  ): { value: number; confidence: number; factors: ValuationFactor[] } {
    let adjustedValue = baseValuation.value;
    let confidence = baseValuation.confidence;
    const factors: ValuationFactor[] = [];
    
    // Location premium/discount
    const locationFactor = this.getLocationFactors(property.city, property.state);
    if (locationFactor.premium !== 1) {
      const adjustment = (locationFactor.premium - 1) * 100;
      adjustedValue *= locationFactor.premium;
      factors.push({
        factor: 'Location Premium',
        impact: adjustment > 0 ? 'positive' : 'negative',
        weight: Math.abs(adjustment),
        description: `${property.city} location ${adjustment > 0 ? 'premium' : 'discount'}`
      });
    }
    
    // Property age factor
    if (property.yearBuilt) {
      const age = new Date().getFullYear() - property.yearBuilt;
      if (age < 5) {
        adjustedValue *= 1.1;
        confidence += 5;
        factors.push({
          factor: 'New Construction',
          impact: 'positive',
          weight: 10,
          description: 'Property is less than 5 years old'
        });
      } else if (age > 30) {
        adjustedValue *= 0.9;
        confidence -= 5;
        factors.push({
          factor: 'Property Age',
          impact: 'negative',
          weight: 10,
          description: 'Property is over 30 years old'
        });
      }
    }
    
    // Comparable properties adjustment
    if (comparables.length > 0) {
      const avgComparablePrice = comparables.reduce(
        (sum, comp) => sum + (comp.soldPrice / comp.area),
        0
      ) / comparables.length;
      
      const currentPricePerSqFt = adjustedValue / property.area;
      const comparableAdjustment = avgComparablePrice / currentPricePerSqFt;
      
      if (Math.abs(comparableAdjustment - 1) > 0.1) {
        adjustedValue *= (1 + (comparableAdjustment - 1) * 0.3); // 30% weight to comparables
        factors.push({
          factor: 'Comparable Sales',
          impact: comparableAdjustment > 1 ? 'positive' : 'negative',
          weight: Math.abs((comparableAdjustment - 1) * 30),
          description: `Based on ${comparables.length} recent comparable sales`
        });
      }
      
      confidence += Math.min(comparables.length * 2, 10); // Up to 10 points for comparables
    }
    
    // Amenities factor
    if (property.amenities && property.amenities.length > 0) {
      const amenityBonus = property.amenities.length * 0.02; // 2% per amenity
      adjustedValue *= (1 + amenityBonus);
      factors.push({
        factor: 'Amenities',
        impact: 'positive',
        weight: amenityBonus * 100,
        description: `${property.amenities.length} premium amenities`
      });
    }
    
    return {
      value: adjustedValue,
      confidence: Math.min(confidence, 95), // Cap at 95%
      factors
    };
  }
  
  /**
   * Get location-specific factors
   */
  private getLocationFactors(city: string, state: string): {
    basePricePerSqFt: number;
    premium: number;
    appreciation: number;
  } {
    // Simulated location data - in production, use real market data
    const locationData: Record<string, any> = {
      'mumbai': { basePricePerSqFt: 15000, premium: 1.5, appreciation: 8 },
      'delhi': { basePricePerSqFt: 12000, premium: 1.3, appreciation: 7 },
      'bangalore': { basePricePerSqFt: 8000, premium: 1.2, appreciation: 10 },
      'hyderabad': { basePricePerSqFt: 6000, premium: 1.0, appreciation: 12 },
      'pune': { basePricePerSqFt: 7000, premium: 1.1, appreciation: 9 },
      'default': { basePricePerSqFt: 5000, premium: 1.0, appreciation: 6 }
    };
    
    const key = city.toLowerCase();
    return locationData[key] || locationData['default'];
  }
  
  /**
   * Determine market trend
   */
  private determineMarketTrend(marketData: MarketData): 'rising' | 'stable' | 'declining' {
    if (marketData.priceAppreciation > 8) return 'rising';
    if (marketData.priceAppreciation < 3) return 'declining';
    return 'stable';
  }
  
  /**
   * Generate cache key for property
   */
  private generateCacheKey(property: PropertyDetails): string {
    return `${property.address}_${property.area}_${property.propertyType}`;
  }
  
  /**
   * Get cached valuation result
   */
  private getCachedResult(key: string): ValuationResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - new Date(cached.lastUpdated).getTime();
    if (age > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }
  
  /**
   * Cache valuation result
   */
  private cacheResult(key: string, result: ValuationResult): void {
    this.cache.set(key, result);
  }
}

// Singleton instance
export const propertyValuationService = new PropertyValuationService();
```

### Usage Examples

```typescript
// Property valuation component
import { propertyValuationService } from '@/services/propertyValuation';

function PropertyValuation() {
  const [property, setProperty] = useState<PropertyDetails>({
    address: '',
    city: '',
    state: '',
    area: 0,
    propertyType: 'residential'
  });
  
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleGetValuation = async () => {
    if (!property.address || !property.area) return;
    
    setLoading(true);
    try {
      const result = await propertyValuationService.getPropertyValuation(property);
      setValuation(result);
    } catch (error) {
      console.error('Valuation failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {/* Property form */}
      <form onSubmit={(e) => { e.preventDefault(); handleGetValuation(); }}>
        <input
          value={property.address}
          onChange={(e) => setProperty(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Property address"
        />
        <input
          type="number"
          value={property.area}
          onChange={(e) => setProperty(prev => ({ ...prev, area: parseInt(e.target.value) }))}
          placeholder="Area (sq ft)"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Getting Valuation...' : 'Get Valuation'}
        </button>
      </form>
      
      {/* Valuation results */}
      {valuation && (
        <div>
          <h3>Property Valuation Results</h3>
          <div>
            <strong>Estimated Value:</strong> 
            ₹{valuation.estimatedValue.toLocaleString()}
          </div>
          <div>
            <strong>Price per sq ft:</strong> 
            ₹{valuation.pricePerSqFt.toLocaleString()}
          </div>
          <div>
            <strong>Confidence:</strong> {valuation.confidenceScore}%
          </div>
          <div>
            <strong>Market Trend:</strong> {valuation.marketTrend}
          </div>
          
          {/* Factors affecting valuation */}
          <div>
            <h4>Valuation Factors:</h4>
            {valuation.factors.map((factor, index) => (
              <div key={index}>
                <span>{factor.factor}</span>
                <span className={factor.impact === 'positive' ? 'text-green-600' : 'text-red-600'}>
                  {factor.impact === 'positive' ? '+' : '-'}{factor.weight}%
                </span>
                <span>{factor.description}</span>
              </div>
            ))}
          </div>
          
          {/* Comparable properties */}
          <div>
            <h4>Comparable Properties:</h4>
            {valuation.comparableProperties.map((comp, index) => (
              <div key={index}>
                <div>{comp.address}</div>
                <div>Sold: ₹{comp.soldPrice.toLocaleString()} ({comp.soldDate})</div>
                <div>Similarity: {comp.similarityScore}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Regrid Service

The RegridService provides real estate data integration using the Regrid API for property information and government records lookup. Currently supports 7 counties with comprehensive property data access.

### Core Implementation

```typescript
// services/regridService.ts

interface PropertyData {
  parcel_id: string;
  address: string;
  owner_name?: string;
  property_type?: string;
  land_use?: string;
  year_built?: number;
  total_assessed_value?: number;
  land_value?: number;
  improvement_value?: number;
  tax_amount?: number;
  lot_size?: number;
  building_area?: number;
  bedrooms?: number;
  bathrooms?: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  last_sale?: {
    date: string;
    price: number;
  };
}

interface PropertyValuation {
  estimated_value: number;
  confidence_score: number;
  value_per_sqft: number;
  market_trend: 'rising' | 'stable' | 'declining';
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }>;
  comparable_sales: Array<{
    address: string;
    sale_price: number;
    sale_date: string;
    distance_km: number;
    similarity_score: number;
  }>;
  generated_at: string;
}

class RegridService {
  private apiKey: string;
  private baseUrl = 'https://app.regrid.com/api/v1';
  
  constructor() {
    this.apiKey = import.meta.env.VITE_REGRID_API_KEY;
    if (!this.apiKey) {
      console.warn('Regrid API key not found. Property lookup will be limited.');
    }
  }
  
  /**
   * Get property data by coordinates with radius search
   */
  async getPropertyByCoordinates(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 0.1
  ): Promise<PropertyData[]> {
    // Implementation details...
  }
  
  /**
   * Generate property valuation using Regrid data and market analysis
   */
  async getPropertyValuation(property: PropertyData): Promise<PropertyValuation> {
    // Implementation details...
  }
}
```

### Supported Counties

The Regrid service currently supports property lookup in the following 7 counties:

1. **Marion County, Indiana** - Indianapolis metro area
2. **Dallas County, Texas** - Dallas metro area  
3. **Wilson County, Tennessee** - Nashville metro area
4. **Durham County, North Carolina** - Research Triangle area
5. **Fillmore County, Nebraska** - Rural agricultural area
6. **Clark County, Wisconsin** - Small town/rural area
7. **Gurabo Municipio, Puerto Rico** - Caribbean territory

### Key Features

**Property Data Lookup:**
- Government records integration
- Property ownership information
- Tax assessment data
- Building characteristics
- Historical sale records
- Coordinate-based search with radius support

**Valuation Generation:**
- Market-based property estimation
- Comparable sales analysis
- Location and property type factors
- Confidence scoring (0-100%)
- Market trend analysis

**API Integration:**
- RESTful API with JSON responses
- Rate limiting and error handling
- Caching for performance optimization
- Fallback behavior for unsupported areas

### Usage Examples

#### Basic Property Lookup

```typescript
import { RegridService } from '@/services/regridService';

async function lookupProperty() {
  const regridService = new RegridService();
  
  try {
    // Search for properties near coordinates (Marion County, IN example)
    const properties = await regridService.getPropertyByCoordinates(
      39.7684, // Indianapolis latitude
      -86.1581, // Indianapolis longitude
      0.5       // 500m radius
    );
    
    if (properties.length > 0) {
      console.log('Found properties:', properties);
      
      // Get valuation for first property
      const valuation = await regridService.getPropertyValuation(properties[0]);
      console.log('Property valuation:', valuation);
    } else {
      console.log('No properties found in this area');
    }
  } catch (error) {
    console.error('Property lookup failed:', error);
  }
}
```

#### Integration with Location Picker

```typescript
import { LocationPicker } from '@/components/LocationPicker';
import { RegridService } from '@/services/regridService';

function PropertyLookupForm() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(false);
  
  const regridService = new RegridService();
  
  const handleLocationChange = async (newLocation: LocationData) => {
    setLocation(newLocation);
    setLoading(true);
    
    try {
      const foundProperties = await regridService.getPropertyByCoordinates(
        newLocation.latitude,
        newLocation.longitude,
        0.1 // 100m radius
      );
      setProperties(foundProperties);
    } catch (error) {
      console.error('Property lookup failed:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <LocationPicker 
        onLocationChange={handleLocationChange}
        addressPlaceholder="Enter property address for lookup..."
      />
      
      {loading && <div>Searching for properties...</div>}
      
      {properties.length > 0 && (
        <div className="space-y-4">
          <h3>Found {properties.length} properties:</h3>
          {properties.map((property, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h4 className="font-semibold">{property.address}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Owner: {property.owner_name || 'N/A'}</div>
                <div>Type: {property.property_type || 'N/A'}</div>
                <div>Year Built: {property.year_built || 'N/A'}</div>
                <div>Assessed Value: ${property.total_assessed_value?.toLocaleString() || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Property Valuation with Market Analysis

```typescript
async function getDetailedValuation(property: PropertyData) {
  const regridService = new RegridService();
  
  try {
    const valuation = await regridService.getPropertyValuation(property);
    
    console.log(`Property Value: $${valuation.estimated_value.toLocaleString()}`);
    console.log(`Confidence: ${valuation.confidence_score}%`);
    console.log(`Price per sqft: $${valuation.value_per_sqft}`);
    console.log(`Market Trend: ${valuation.market_trend}`);
    
    // Display valuation factors
    valuation.factors.forEach(factor => {
      console.log(`${factor.factor}: ${factor.impact} (${factor.weight}%)`);
    });
    
    // Display comparable sales
    valuation.comparable_sales.forEach(comp => {
      console.log(`Comp: ${comp.address} - $${comp.sale_price.toLocaleString()}`);
    });
    
    return valuation;
  } catch (error) {
    console.error('Valuation failed:', error);
    throw error;
  }
}
```

### Configuration

Add the Regrid API key to your environment variables:

```env
# .env file
VITE_REGRID_API_KEY=your_regrid_api_key_here
```

### Error Handling

The service includes comprehensive error handling for common scenarios:

- **Invalid coordinates**: Returns empty array with warning
- **Unsupported county**: Provides helpful message about supported areas
- **API rate limiting**: Implements retry logic with exponential backoff
- **Network errors**: Graceful degradation with cached data when available
- **Invalid API key**: Clear error messages for authentication issues

### Integration with Property Registration

The Regrid service integrates seamlessly with the property registration workflow:

1. **Location Selection**: User selects location using LocationPicker
2. **Property Lookup**: Regrid API searches for properties at coordinates
3. **Data Pre-fill**: Found property data pre-fills registration form
4. **Valuation**: Automatic property valuation for tokenization
5. **Verification**: Property data used in verification process

## API Integration Guide

### Replacing Mock Services with Real APIs

The current implementation uses simulated data for demonstration. Here's how to integrate real property data APIs:

#### 1. Property Data APIs

```typescript
// Real API integration example
class RealPropertyDataService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async getPropertyDetails(address: string) {
    const response = await fetch(`https://api.proptiger.com/property?address=${encodeURIComponent(address)}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Property data fetch failed');
    }
    
    return await response.json();
  }
  
  async getComparableSales(location: string, propertyType: string) {
    // Implementation for real comparable sales data
  }
  
  async getMarketTrends(city: string) {
    // Implementation for real market trend data
  }
}
```

#### 2. Geolocation APIs

```typescript
// Google Maps integration
class GeolocationService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async geocodeAddress(address: string) {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
    );
    
    const data = await response.json();
    return data.results[0]?.geometry.location;
  }
  
  async getLocationInfo(lat: number, lng: number) {
    // Get neighborhood, amenities, etc.
  }
}
```

#### 3. Market Data APIs

```typescript
// Real estate market data integration
class MarketDataService {
  async getRegionalPricing(city: string, propertyType: string) {
    // Integration with Housing.com, 99acres, or similar APIs
  }
  
  async getPriceHistory(propertyId: string) {
    // Historical pricing data
  }
  
  async getInvestmentMetrics(location: string) {
    // ROI, rental yields, etc.
  }
}
```

This services documentation provides a comprehensive overview of the RealEstateX service layer architecture. Each service is designed to be modular, testable, and easily replaceable with real API integrations when moving to production.
