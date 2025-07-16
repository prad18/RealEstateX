# 🏗️ RealEstateX Development Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Code Standards](#code-standards)
- [Component Development](#component-development)
- [Service Development](#service-development)
- [Testing Guidelines](#testing-guidelines)
- [Deployment Process](#deployment-process)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- VS Code (recommended)
- MetaMask or compatible Web3 wallet

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-org/RealEstateX.git
   cd RealEstateX/frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### Project Structure Deep Dive

```
src/
├── components/              # React components (UI layer)
│   ├── dashboard/          # Main dashboard and navigation
│   ├── property/           # Property management components
│   ├── upload/             # File upload components
│   ├── verification/       # Verification status and progress
│   └── wallet/             # Web3 wallet integration
├── services/               # Business logic layer
│   ├── web3Service.ts      # Blockchain interactions
│   ├── ipfs.ts             # IPFS file storage
│   ├── verificationService.ts # Property verification
│   └── propertyValuation.ts   # Property pricing
├── config/                 # Configuration files
│   └── wallet.ts           # Web3 wallet configuration
├── hooks/                  # Custom React hooks
├── utils/                  # Utility functions
├── types/                  # TypeScript type definitions
└── assets/                 # Static assets
```

## Development Environment

### VS Code Setup

**Recommended Extensions:**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json"
  ]
}
```

**Settings Configuration:**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "emmet.includeLanguages": {
    "typescript": "html"
  }
}
```

### Environment Variables

```env
# Required: IPFS Configuration
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud

# Required: Blockchain Configuration
VITE_BLOCKDAG_RPC_URL=https://rpc.blockdag.network
VITE_BLOCKDAG_CHAIN_ID=1043

# Optional: Real Estate API Keys
VITE_PROPTIGER_API_KEY=your_api_key
VITE_HOUSING_API_KEY=your_api_key
VITE_MAGICBRICKS_API_KEY=your_api_key

# Optional: Development
VITE_DEBUG_MODE=true
VITE_MOCK_DATA=true
```

## Code Standards

### TypeScript Guidelines

**1. Strict Type Safety**
```typescript
// ✅ Good: Explicit types
interface PropertyDetails {
  address: string;
  city: string;
  area: number;
  propertyType: 'residential' | 'commercial' | 'plot';
}

// ❌ Bad: Any types
const property: any = { /* ... */ };
```

**2. Interface Definitions**
```typescript
// ✅ Good: Clear interface naming
interface VerificationStatusProps {
  propertyId: string;
  onVerificationUpdate?: (result: VerificationResult) => void;
}

// ✅ Good: Proper export/import
export type { VerificationStatusProps };
```

**3. Generic Types**
```typescript
// ✅ Good: Reusable generic interfaces
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Usage
const response: ApiResponse<PropertyData[]> = await api.getProperties();
```

### React Component Guidelines

**1. Component Structure**
```typescript
/**
 * Component documentation with JSDoc
 */
interface ComponentProps {
  // Props with clear types and documentation
}

export const Component: React.FC<ComponentProps> = ({
  prop1,
  prop2
}) => {
  // Hooks at the top
  const [state, setState] = useState<StateType>(initialValue);
  
  // Event handlers
  const handleEvent = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Early returns for loading/error states
  if (loading) return <LoadingSpinner />;
  
  // Main render
  return (
    <div className="component-root">
      {/* JSX content */}
    </div>
  );
};
```

**2. Custom Hooks**
```typescript
// ✅ Good: Custom hook for reusable logic
export const useVerificationStatus = (propertyId: string) => {
  const [status, setStatus] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const result = verificationService.getVerificationStatus(propertyId);
        setStatus(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [propertyId]);
  
  return { status, loading, error };
};
```

### Service Layer Guidelines

**1. Service Class Structure**
```typescript
export class ServiceName {
  private readonly config: ServiceConfig;
  
  constructor(config: ServiceConfig) {
    this.config = config;
  }
  
  /**
   * Public method with JSDoc documentation
   * @param param - Parameter description
   * @returns Promise with return type
   */
  async publicMethod(param: ParamType): Promise<ReturnType> {
    try {
      const result = await this.privateMethod(param);
      return this.transformResult(result);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  private async privateMethod(param: ParamType): Promise<InternalType> {
    // Implementation
  }
  
  private handleError(error: unknown): void {
    console.error(`ServiceName error:`, error);
    // Error reporting logic
  }
}
```

**2. Error Handling**
```typescript
// ✅ Good: Comprehensive error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error instanceof NetworkError) {
    throw new Error('Network connection failed');
  } else if (error instanceof ValidationError) {
    throw new Error(`Validation failed: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
    throw new Error('An unexpected error occurred');
  }
}
```

### Styling Guidelines

**1. Tailwind CSS Best Practices**
```typescript
// ✅ Good: Logical grouping and responsive design
const buttonClasses = `
  inline-flex items-center justify-center
  px-4 py-2 
  text-sm font-medium text-white 
  bg-blue-600 hover:bg-blue-700 
  border border-transparent rounded-md 
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
`;

// ✅ Good: Conditional classes
const statusClasses = `
  px-2 py-1 rounded text-xs font-medium
  ${status === 'approved' ? 'bg-green-100 text-green-800' : 
    status === 'rejected' ? 'bg-red-100 text-red-800' : 
    'bg-yellow-100 text-yellow-800'}
`;
```

**2. Component Styling Patterns**
```typescript
// ✅ Good: Consistent spacing and layout
const CardComponent: React.FC = ({ children }) => (
  <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
    {children}
  </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ 
  label, 
  children 
}) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    {children}
  </div>
);
```

## Component Development

### Creating New Components

**1. Component Template**
```typescript
// components/example/ExampleComponent.tsx
import React, { useState, useEffect } from 'react';

/**
 * ExampleComponent handles [description]
 * 
 * @example
 * ```tsx
 * <ExampleComponent 
 *   prop1="value"
 *   onAction={(data) => console.log(data)}
 * />
 * ```
 */

interface ExampleComponentProps {
  /** Primary prop description */
  prop1: string;
  /** Optional prop with default */
  prop2?: number;
  /** Callback function */
  onAction?: (data: ActionData) => void;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  prop1,
  prop2 = 10,
  onAction
}) => {
  const [localState, setLocalState] = useState<StateType>(initialValue);
  
  useEffect(() => {
    // Component setup
  }, []);
  
  const handleUserAction = () => {
    const data = processAction(localState);
    onAction?.(data);
  };
  
  return (
    <div className="example-component">
      {/* Component JSX */}
    </div>
  );
};

// Export types if needed by parent components
export type { ExampleComponentProps };
```

**2. Testing New Components**
```typescript
// components/example/ExampleComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ExampleComponent } from './ExampleComponent';

describe('ExampleComponent', () => {
  it('renders with required props', () => {
    render(<ExampleComponent prop1="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
  
  it('calls onAction when user interacts', () => {
    const mockAction = jest.fn();
    render(<ExampleComponent prop1="test" onAction={mockAction} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockAction).toHaveBeenCalledWith(expectedData);
  });
});
```

### Component Integration

**1. State Management**
```typescript
// Using React Context for global state
const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  
  const value = {
    user,
    setUser,
    properties,
    setProperties
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for context usage
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
```

## Service Development

### Creating New Services

**1. Service Template**
```typescript
// services/exampleService.ts

/**
 * ExampleService handles [service description]
 * Provides methods for [primary functionality]
 */

interface ServiceConfig {
  apiUrl: string;
  timeout: number;
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ExampleService {
  private readonly config: ServiceConfig;
  private cache = new Map<string, any>();
  
  constructor(config: ServiceConfig) {
    this.config = config;
  }
  
  /**
   * Primary service method
   * @param param - Input parameter
   * @returns Promise with typed result
   */
  async performAction(param: InputType): Promise<ServiceResult<OutputType>> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(param);
      if (this.cache.has(cacheKey)) {
        return { success: true, data: this.cache.get(cacheKey) };
      }
      
      // Perform operation
      const result = await this.executeOperation(param);
      
      // Cache result
      this.cache.set(cacheKey, result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('ExampleService error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  private async executeOperation(param: InputType): Promise<OutputType> {
    // Implementation details
  }
  
  private getCacheKey(param: InputType): string {
    return `example_${JSON.stringify(param)}`;
  }
}

// Export singleton instance
export const exampleService = new ExampleService({
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000
});
```

**2. Service Integration**
```typescript
// Hook for service usage
export const useExampleService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const performAction = async (param: InputType) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await exampleService.performAction(param);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { performAction, loading, error };
};
```

## Testing Guidelines

### Unit Testing

**1. Component Testing**
```typescript
// Use React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('PropertyRegistration', () => {
  const mockProps = {
    uploadedDocuments: [
      { file: new File([''], 'test.pdf'), ipfs_hash: 'QmTest' }
    ],
    onRegistrationComplete: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders property form initially', () => {
    render(<PropertyRegistration {...mockProps} />);
    expect(screen.getByText('Property Registration')).toBeInTheDocument();
  });
  
  it('validates required fields', async () => {
    render(<PropertyRegistration {...mockProps} />);
    
    const submitButton = screen.getByText('Get Property Valuation');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please fill in property address and area')).toBeInTheDocument();
    });
  });
  
  it('completes registration flow', async () => {
    const user = userEvent.setup();
    render(<PropertyRegistration {...mockProps} />);
    
    // Fill form
    await user.type(screen.getByPlaceholderText('Enter complete property address'), '123 Test St');
    await user.type(screen.getByPlaceholderText('1000'), '1000');
    
    // Submit
    await user.click(screen.getByText('Get Property Valuation'));
    
    // Verify valuation step
    await waitFor(() => {
      expect(screen.getByText('Property Valuation Results')).toBeInTheDocument();
    });
  });
});
```

**2. Service Testing**
```typescript
// Mock external dependencies
jest.mock('@/services/ipfs', () => ({
  ipfsService: {
    uploadFile: jest.fn().mockResolvedValue({
      hash: 'QmMockHash',
      url: 'https://mock.ipfs.url'
    })
  }
}));

describe('VerificationService', () => {
  let service: EnhancedHybridVerificationService;
  
  beforeEach(() => {
    service = new EnhancedHybridVerificationService();
  });
  
  it('submits property for verification', async () => {
    const propertyId = await service.submitForVerification(
      'test_property',
      ['QmHash1', 'QmHash2'],
      {
        address: '123 Test St',
        estimatedValue: 1000000,
        ownerName: 'Test Owner'
      }
    );
    
    expect(propertyId).toBe('test_property');
    
    const status = service.getVerificationStatus(propertyId);
    expect(status).toBeTruthy();
    expect(status?.status).toBe('oracle_analysis');
  });
});
```

### Integration Testing

**1. End-to-End Workflows**
```typescript
// Test complete user workflows
describe('Property Registration Workflow', () => {
  it('completes full registration process', async () => {
    // Setup test environment
    const { user } = setupTest();
    
    // Navigate to registration
    await user.click(screen.getByText('Register Property'));
    
    // Upload documents
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText('Upload documents');
    await user.upload(fileInput, file);
    
    // Wait for upload completion
    await waitFor(() => {
      expect(screen.getByText('Upload complete')).toBeInTheDocument();
    });
    
    // Fill property details
    await user.type(screen.getByLabelText('Property Address'), '123 Test Street');
    await user.type(screen.getByLabelText('Area'), '1000');
    
    // Continue through workflow
    await user.click(screen.getByText('Get Property Valuation'));
    
    // Verify valuation results
    await waitFor(() => {
      expect(screen.getByText('Estimated Property Value')).toBeInTheDocument();
    });
    
    // Sign consent
    await user.click(screen.getByText('Sign Consent & Continue'));
    
    // Submit registration
    await user.click(screen.getByText('Submit Property Registration'));
    
    // Verify completion
    await waitFor(() => {
      expect(screen.getByText('Verification Status')).toBeInTheDocument();
    });
  });
});
```

## Deployment Process

### Build Configuration

**1. Production Build**
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint check
npm run lint
```

**2. Environment-Specific Builds**
```json
// package.json scripts
{
  "scripts": {
    "build:dev": "vite build --mode development",
    "build:staging": "vite build --mode staging", 
    "build:prod": "vite build --mode production"
  }
}
```

### Deployment Checklist

**Pre-deployment:**
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Lint checks clean (`npm run lint`)
- [ ] Environment variables configured
- [ ] Build successful (`npm run build`)
- [ ] Bundle size analysis (`npm run analyze`)

**Post-deployment:**
- [ ] Application loads correctly
- [ ] Wallet connection works
- [ ] IPFS upload functional
- [ ] Verification flow operational
- [ ] Error tracking active
- [ ] Performance monitoring enabled

### Production Considerations

**1. Performance Optimization**
```typescript
// Code splitting for large components
const PropertyRegistration = lazy(() => import('@/components/property/PropertyRegistration'));

// Memoization for expensive calculations
const MemoizedComponent = memo(ExpensiveComponent);

// Debounced API calls
const debouncedSearch = useMemo(
  () => debounce(searchFunction, 300),
  [searchFunction]
);
```

**2. Error Boundaries**
```typescript
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Send to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

This development guide provides comprehensive guidelines for building and maintaining the RealEstateX frontend application. Follow these patterns and practices to ensure code quality, maintainability, and team collaboration.
