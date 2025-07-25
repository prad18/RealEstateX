# 📖 RealEstateX Frontend Documentation

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Services Documentation](#services-documentation)
- [Components Documentation](#components-documentation)
- [Configuration](#configuration)
- [Development Guidelines](#development-guidelines)

## Architecture Overview

The RealEstateX frontend follows a modern React architecture with clear separation of concerns:

```
src/
├── components/          # React UI components
├── services/           # Business logic services  
├── config/             # Configuration files
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript definitions
└── assets/             # Static assets
```

### Design Patterns Used

1. **Service Layer Pattern**: Business logic separated into service classes
2. **Custom Hooks Pattern**: Reusable stateful logic
3. **Compound Components**: Complex UI components broken into smaller parts
4. **Provider Pattern**: Context for global state management

## Services Documentation

### 🔍 Verification Service

**File**: `src/services/verificationService.ts`

The verification service implements a sophisticated hybrid verification system that combines AI analysis with mandatory human review.

#### Key Classes

```typescript
class EnhancedHybridVerificationService {
  // Core verification workflow
  submitForVerification(propertyId, ipfsHashes, propertyDetails)
  
  // Manual review simulation (demo)
  simulateManualReview(propertyId, approved, reviewerNotes, finalValue)
  
  // Status tracking
  getVerificationStatus(propertyId)
  getVerificationAnalytics(propertyId)
}
```

#### Verification Phases

1. **Document Upload** (Completed automatically)
   - Validates uploaded documents
   - Stores IPFS hashes
   - Initializes verification record

2. **Oracle Analysis** (AI-powered)
   - Document confidence scoring
   - Cross-verification between documents
   - Market analysis integration
   - Risk flag generation

3. **Risk Assessment** (Algorithm-based)
   - Overall risk calculation (Low/Medium/High/Critical)
   - Compliance checks (KYC, Legal Title, Regulatory)
   - Market analysis (Price deviation, Liquidity scoring)
   - Risk factor identification

4. **Manual Review** (Human-required)
   - Queued for human expert review
   - Priority-based assignment
   - Expected completion time tracking
   - No automated bypass possible

5. **Final Decision** (Human-only)
   - Human reviewer makes final approval/rejection
   - Final property value assignment
   - Detailed reasoning required
   - Audit trail maintenance

#### Data Structures

```typescript
interface VerificationResult {
  propertyId: string
  status: 'uploading' | 'oracle_analysis' | 'manual_review' | 'approved' | 'rejected'
  oracleResult?: OracleResult
  manualReview?: ManualReview
  finalApproval: boolean
  finalValue: number
  completedAt?: number
}

interface EnhancedVerificationResult extends VerificationResult {
  phases: VerificationPhase[]
  riskAssessment?: RiskAssessment
  reviewerQueue: {
    assignedAt: number
    expectedCompletionTime: number
    priority: 'standard' | 'urgent' | 'critical'
  }
}
```

#### Usage Example

```typescript
// Submit property for verification
const propertyId = await verificationService.submitForVerification(
  'property_123',
  ['QmHash1', 'QmHash2'],
  {
    address: '123 Main St, Mumbai',
    estimatedValue: 5000000,
    ownerName: 'John Doe'
  }
)

// Check verification status
const status = verificationService.getVerificationStatus(propertyId)

// Simulate manual review (demo only)
await verificationService.simulateManualReview(
  propertyId,
  true, // approved
  'All documents verified successfully',
  5200000 // final value
)
```

### 💰 Property Valuation Service

**File**: `src/services/propertyValuation.ts`

Handles property value estimation using multiple data sources and market analysis.

#### Key Features

- **Multi-source valuation**: Simulates multiple property API sources
- **Market trend analysis**: Rising, stable, or declining market detection
- **Location-based pricing**: City-specific price multipliers
- **Confidence scoring**: Reliability assessment of valuations
- **Minting potential**: Calculates maximum $HOMED mintable amount

#### Core Methods

```typescript
class PropertyValuationService {
  // Main valuation method
  async getPropertyValuation(propertyDetails: PropertyDetails): Promise<ValuationResult>
  
  // Multiple estimate comparison
  async getMultipleEstimates(propertyDetails: PropertyDetails)
  
  // Minting calculation
  calculateMintingPotential(propertyValue: number): MintCalculation
}
```

#### Valuation Algorithm

1. **Base Price Calculation**
   ```typescript
   const baseValue = propertyDetails.area * marketData.averagePricePerSqFt
   ```

2. **City-based Multipliers**
   ```typescript
   const cityMultipliers = {
     'mumbai': 15000,     // ₹15,000/sq ft
     'delhi': 12000,      // ₹12,000/sq ft
     'bangalore': 8000,   // ₹8,000/sq ft
     'pune': 6000         // ₹6,000/sq ft
   }
   ```

3. **Property Type Adjustments**
   ```typescript
   const typeMultipliers = {
     'commercial': 1.5,   // 50% premium
     'residential': 1.0,  // Base rate
     'plot': 0.7         // 30% discount
   }
   ```

4. **Market Factors**
   - Recent sales comparison
   - Market trend impact
   - Location desirability
   - Property age depreciation

#### Usage Example

```typescript
const propertyDetails = {
  address: '123 Main St, Mumbai',
  city: 'Mumbai',
  state: 'Maharashtra',
  propertyType: 'residential',
  area: 1000, // sq ft
  bedrooms: 3,
  bathrooms: 2,
  age: 5
}

const valuation = await propertyValuationService.getPropertyValuation(propertyDetails)
console.log(`Estimated value: ₹${valuation.estimatedValue.toLocaleString()}`)

const mintingPotential = propertyValuationService.calculateMintingPotential(valuation.estimatedValue)
console.log(`Max mintable $HOMED: ₹${mintingPotential.maxMintAmount.toLocaleString()}`)
```

### 🔗 Web3 Service

**File**: `src/services/web3Service.ts`

Manages all blockchain interactions and smart contract operations.

#### Key Features

- **Property NFT management**: Minting and tracking property tokens
- **$HOMED token operations**: Balance tracking and minting
- **User portfolio**: Property and token management
- **Transaction handling**: Smart contract interactions

#### Core Methods

```typescript
class Web3Service {
  // Property management
  async registerProperty(propertyData: PropertyData): Promise<string>
  async getUserProperties(userAddress: string): Promise<PropertyData[]>
  
  // Token operations
  async getTokenBalance(userAddress: string): Promise<TokenBalance>
  async mintHomedTokens(propertyId: string, amount: number): Promise<string>
  
  // NFT operations
  async mintPropertyNFT(propertyData: PropertyData): Promise<string>
}
```

#### Data Structures

```typescript
interface PropertyData {
  id: string
  title: string
  address: string
  value: number
  verificationStatus: 'pending' | 'verified' | 'rejected'
  documents: Array<{ type: string; hash: string }>
  createdAt: Date
  tokenId?: string
}

interface TokenBalance {
  homedBalance: string
  propertyCount: number
  totalValue: number
}
```

### 📁 IPFS Service

**File**: `src/services/ipfs.ts`

Handles decentralized file storage using Pinata as the IPFS gateway.

#### Key Features

- **File upload**: Single and multiple file uploads
- **JSON storage**: Metadata and structured data storage
- **File retrieval**: Download files from IPFS
- **Progress tracking**: Upload progress monitoring

#### Core Methods

```typescript
class IPFSService {
  // File operations
  async uploadFile(file: File): Promise<IPFSUploadResult>
  async uploadFiles(files: File[]): Promise<IPFSUploadResult[]>
  async uploadJSON(data: any, filename?: string): Promise<IPFSUploadResult>
  
  // Retrieval operations
  async getFile(hash: string): Promise<string>
  async getJSON(hash: string): Promise<any>
}
```

#### Usage Example

```typescript
// Upload single file
const file = new File(['content'], 'document.pdf', { type: 'application/pdf' })
const result = await ipfsService.uploadFile(file)
console.log(`File uploaded: ${result.hash}`)

// Upload JSON metadata
const metadata = {
  propertyId: 'prop_123',
  documents: ['hash1', 'hash2'],
  timestamp: Date.now()
}
const jsonResult = await ipfsService.uploadJSON(metadata, 'property-metadata.json')
```

## Components Documentation

### 🎛️ Dashboard Component

**File**: `src/components/dashboard/Dashboard.tsx`

The main application interface that orchestrates the entire user workflow.

#### Key Features

- **Multi-flow management**: Handles upload → register → verify workflow
- **Asset overview**: Displays user's property NFTs and $HOMED balance
- **Navigation**: Step-by-step progress tracking
- **Real-time updates**: Live data refresh

#### Component State

```typescript
const [currentFlow, setCurrentFlow] = useState<'dashboard' | 'upload' | 'register' | 'verify'>('dashboard')
const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ file: File; ipfs_hash: string }>>([])
const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(null)
```

#### Flow Management

1. **Dashboard View** (default)
   - Asset summary cards
   - Quick action buttons
   - Property list display

2. **Upload Flow**
   - Document upload component
   - IPFS integration
   - Progress tracking

3. **Registration Flow**
   - Property details form
   - Valuation display
   - Consent signing

4. **Verification Flow**
   - Status tracking
   - Phase progress
   - Manual review simulation

### 🏠 Property Registration Component

**File**: `src/components/property/PropertyRegistration.tsx`

Comprehensive property registration form with valuation and consent management.

#### Key Features

- **Multi-step form**: Property details → Valuation → Consent
- **Real-time valuation**: Integrated property pricing
- **Message signing**: User consent verification
- **Error handling**: Comprehensive validation

#### Component Phases

1. **Form Phase**
   ```typescript
   // Property details collection
   const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
     address: '',
     city: '',
     state: '',
     propertyType: 'residential',
     area: 0
   })
   ```

2. **Valuation Phase**
   ```typescript
   // Get property valuation
   const valuationResult = await propertyValuationService.getPropertyValuation(propertyDetails)
   const mintCalculation = propertyValuationService.calculateMintingPotential(valuationResult.estimatedValue)
   ```

3. **Consent Phase**
   ```typescript
   // Sign consent message
   const signature = await signMessageAsync({ message: consentMessage })
   ```

#### Usage Flow

```typescript
<PropertyRegistration
  uploadedDocuments={uploadedDocuments}
  onRegistrationComplete={(propertyId) => {
    setCurrentPropertyId(propertyId)
    setCurrentFlow('verify')
  }}
/>
```

### 🔍 Verification Status Component

**File**: `src/components/verification/VerificationStatus.tsx`

Real-time verification progress tracking with detailed phase information.

#### Key Features

- **Phase visualization**: 5-step progress indicator
- **Risk assessment display**: Detailed risk analysis
- **Queue information**: Manual review queue status
- **Demo controls**: Manual review simulation

#### Component Structure

```typescript
const VerificationStatus: React.FC<{
  propertyId: string
  onVerificationUpdate?: (result: VerificationResult) => void
}> = ({ propertyId, onVerificationUpdate }) => {
  // Real-time status polling
  useEffect(() => {
    const interval = setInterval(fetchVerificationStatus, 5000)
    return () => clearInterval(interval)
  }, [propertyId])
}
```

#### Visual Elements

1. **Progress Steps**
   - Document Upload ✅
   - Oracle Analysis 🤖
   - Risk Assessment ⚠️
   - Manual Review 👤
   - Final Decision 🔒

2. **Risk Assessment Panel**
   - Overall risk level (Low/Medium/High/Critical)
   - Risk factors list
   - Compliance check results
   - Market analysis data

3. **Manual Review Queue**
   - Priority level display
   - Expected completion time
   - Queue position (if applicable)

### 📁 Document Upload Component

**File**: `src/components/upload/DocumentUpload.tsx`

Drag-and-drop file upload interface with IPFS integration.

#### Key Features

- **Drag & drop**: Intuitive file selection
- **Multiple formats**: PDF, PNG, JPG, JPEG support
- **Progress tracking**: Real-time upload progress
- **IPFS integration**: Automatic hash generation

#### Component Flow

```typescript
const onDrop = useCallback(async (acceptedFiles: File[]) => {
  const uploadedFiles: Array<{ file: File; ipfs_hash: string }> = []
  
  for (const file of acceptedFiles) {
    const result = await ipfsService.uploadFile(file)
    uploadedFiles.push({ file, ipfs_hash: result.hash })
  }
  
  onUploadComplete?.(uploadedFiles)
}, [onUploadComplete])
```

#### Upload States

```typescript
interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  ipfs_hash?: string
  error?: string
}
```

### 🔌 Wallet Components

**File**: `src/components/wallet/WalletConnect.tsx`

Web3 wallet integration using wagmi and Web3Modal.

#### Key Features

- **Multi-wallet support**: MetaMask, WalletConnect, etc.
- **Network validation**: BlockDAG testnet verification
- **Connection state**: Real-time connection status
- **Error handling**: Network and connection errors

#### Configuration

```typescript
// Wallet configuration
const config = createConfig({
  chains: [blockDAGTestnet],
  transports: {
    [blockDAGTestnet.id]: http(blockDAGTestnet.rpcUrls.default.http[0])
  },
  connectors: [
    walletConnect({ projectId: 'your-project-id' }),
    metaMask(),
    injected()
  ]
})
```

## Configuration

### Environment Variables

```env
# IPFS Configuration
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud

# Blockchain Configuration
VITE_BLOCKDAG_RPC_URL=https://rpc.blockdag.network
VITE_BLOCKDAG_CHAIN_ID=1043

# Optional: Real Estate API Keys
VITE_PROPTIGER_API_KEY=your_api_key
VITE_HOUSING_API_KEY=your_api_key
VITE_MAGICBRICKS_API_KEY=your_api_key
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Tailwind Configuration

```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      }
    }
  },
  plugins: []
}
```

## Development Guidelines

### Code Style

1. **TypeScript**: All components and services must be typed
2. **ESLint**: Follow configured linting rules
3. **Prettier**: Consistent code formatting
4. **Naming**: Use camelCase for variables, PascalCase for components

### Component Guidelines

1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Always define props interfaces
3. **Error Boundaries**: Implement error handling
4. **Accessibility**: Include proper ARIA labels

### Service Guidelines

1. **Error Handling**: All async operations must handle errors
2. **Type Safety**: Return types must be explicitly defined
3. **Documentation**: JSDoc comments for public methods
4. **Testing**: Unit tests for business logic

### Git Workflow

1. **Branch Naming**: `feature/component-name` or `fix/issue-description`
2. **Commit Messages**: Follow conventional commits format
3. **Pull Requests**: Include description and testing notes
4. **Code Review**: All code must be reviewed before merge

### Testing Strategy

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete user workflows
4. **Mock Data**: Use realistic test scenarios

This documentation provides a comprehensive overview of the RealEstateX frontend codebase. For specific implementation details, refer to the individual component files and their inline documentation.
