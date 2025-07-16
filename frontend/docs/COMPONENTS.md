# 📱 RealEstateX Component Library

## Table of Contents
- [Overview](#overview)
- [Core Components](#core-components)
- [UI Components](#ui-components)
- [Form Components](#form-components)
- [Layout Components](#layout-components)
- [Usage Examples](#usage-examples)

## Overview

The RealEstateX component library provides a comprehensive set of reusable React components built with TypeScript and Tailwind CSS. All components follow consistent design patterns and accessibility standards.

### Design System

**Color Palette:**
```css
/* Primary Colors */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Status Colors */
--success-500: #10b981;
--warning-500: #f59e0b;
--error-500: #ef4444;
--info-500: #06b6d4;
```

**Typography Scale:**
```css
/* Text Sizes */
text-xs: 0.75rem;     /* 12px */
text-sm: 0.875rem;    /* 14px */
text-base: 1rem;      /* 16px */
text-lg: 1.125rem;    /* 18px */
text-xl: 1.25rem;     /* 20px */
text-2xl: 1.5rem;     /* 24px */
text-3xl: 1.875rem;   /* 30px */
```

**Spacing System:**
```css
/* Spacing Units */
1: 0.25rem;   /* 4px */
2: 0.5rem;    /* 8px */
3: 0.75rem;   /* 12px */
4: 1rem;      /* 16px */
6: 1.5rem;    /* 24px */
8: 2rem;      /* 32px */
```

## Core Components

### Dashboard

The main application interface that orchestrates user workflows.

```typescript
interface DashboardProps {
  /** Optional initial flow to display */
  initialFlow?: 'upload' | 'register' | 'verify';
  /** Callback when flow changes */
  onFlowChange?: (flow: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  initialFlow,
  onFlowChange 
}) => {
  // Implementation details...
};
```

**Features:**
- Multi-step workflow management
- Progress tracking
- Dynamic content rendering
- Responsive design

**Usage Example:**
```tsx
import { Dashboard } from '@/components/dashboard/Dashboard';

function App() {
  return (
    <Dashboard 
      initialFlow="upload"
      onFlowChange={(flow) => console.log('Current flow:', flow)}
    />
  );
}
```

### PropertyRegistration

Three-step property registration component with valuation and consent signing.

```typescript
interface PropertyRegistrationProps {
  /** List of uploaded documents with IPFS hashes */
  uploadedDocuments: UploadedDocument[];
  /** Callback when registration is completed */
  onRegistrationComplete?: (propertyId: string) => void;
  /** Optional callback for step changes */
  onStepChange?: (step: number) => void;
}

interface UploadedDocument {
  file: File;
  ipfs_hash: string;
  type?: string;
}

export const PropertyRegistration: React.FC<PropertyRegistrationProps> = ({
  uploadedDocuments,
  onRegistrationComplete,
  onStepChange
}) => {
  // Implementation details...
};
```

**Step Flow:**
1. **Property Details Form** - Address, area, property type
2. **Valuation Review** - AI-generated property valuation
3. **Consent & Submission** - Digital signature and final submission

**Usage Example:**
```tsx
import { PropertyRegistration } from '@/components/property/PropertyRegistration';

function RegistrationPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  
  const handleComplete = (propertyId: string) => {
    console.log('Property registered:', propertyId);
    // Navigate to verification status
  };
  
  return (
    <PropertyRegistration
      uploadedDocuments={documents}
      onRegistrationComplete={handleComplete}
      onStepChange={(step) => updateProgress(step)}
    />
  );
}
```

### VerificationStatus

Real-time verification progress tracking with detailed phase information.

```typescript
interface VerificationStatusProps {
  /** Property ID to track verification for */
  propertyId: string;
  /** Polling interval in milliseconds (default: 5000) */
  pollInterval?: number;
  /** Callback when verification is completed */
  onVerificationComplete?: (result: VerificationResult) => void;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  propertyId,
  pollInterval = 5000,
  onVerificationComplete
}) => {
  // Implementation details...
};
```

**Verification Phases:**
1. **Document Analysis** - AI processing of uploaded documents
2. **Property Validation** - Cross-referencing with property records
3. **Oracle Analysis** - Advanced property assessment
4. **Risk Assessment** - Fraud detection and risk scoring
5. **Manual Review** - Human expert verification

**Usage Example:**
```tsx
import { VerificationStatus } from '@/components/verification/VerificationStatus';

function VerificationPage({ propertyId }: { propertyId: string }) {
  const handleComplete = (result: VerificationResult) => {
    if (result.approved) {
      toast.success('Property approved for tokenization!');
    } else {
      toast.error('Property verification failed');
    }
  };
  
  return (
    <VerificationStatus
      propertyId={propertyId}
      pollInterval={3000}
      onVerificationComplete={handleComplete}
    />
  );
}
```

### DocumentUpload

Drag-and-drop file upload component with IPFS integration.

```typescript
interface DocumentUploadProps {
  /** Callback when files are successfully uploaded */
  onUploadComplete?: (documents: UploadedDocument[]) => void;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Accepted file types */
  acceptedTypes?: string[];
  /** Maximum file size in bytes */
  maxFileSize?: number;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  maxFiles = 5,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxFileSize = 10 * 1024 * 1024 // 10MB
}) => {
  // Implementation details...
};
```

**Features:**
- Drag-and-drop interface
- File type validation
- Size limit enforcement
- Progress tracking
- IPFS upload integration
- Preview thumbnails

**Usage Example:**
```tsx
import { DocumentUpload } from '@/components/upload/DocumentUpload';

function UploadPage() {
  const handleUpload = (documents: UploadedDocument[]) => {
    console.log('Uploaded documents:', documents);
    setUploadedFiles(documents);
  };
  
  return (
    <DocumentUpload
      onUploadComplete={handleUpload}
      maxFiles={10}
      acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.png']}
      maxFileSize={50 * 1024 * 1024} // 50MB
    />
  );
}
```

## UI Components

### Button

Customizable button component with multiple variants and states.

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state */
  loading?: boolean;
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className,
  disabled,
  ...props
}) => {
  // Implementation details...
};
```

**Usage Examples:**
```tsx
import { Button } from '@/components/ui/Button';
import { Upload, Download, Check } from 'lucide-react';

// Basic buttons
<Button>Primary Button</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>

// With icons
<Button icon={<Upload size={16} />}>Upload Files</Button>
<Button icon={<Download size={16} />} iconPosition="right">Download</Button>

// Loading state
<Button loading>Processing...</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// Disabled state
<Button disabled>Disabled</Button>
```

### Input

Form input component with validation and error handling.

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Icon to display in input */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Input wrapper className */
  wrapperClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  wrapperClassName,
  className,
  ...props
}) => {
  // Implementation details...
};
```

**Usage Examples:**
```tsx
import { Input } from '@/components/ui/Input';
import { Search, User, Mail } from 'lucide-react';

// Basic input
<Input 
  label="Full Name"
  placeholder="Enter your full name"
  required
/>

// With validation error
<Input
  label="Email Address"
  type="email"
  error="Please enter a valid email address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With icons
<Input
  label="Search Properties"
  icon={<Search size={16} />}
  placeholder="Search by address or ID"
/>

// Helper text
<Input
  label="Property Area"
  type="number"
  helperText="Area in square feet"
  placeholder="1000"
/>
```

### Card

Container component for grouping related content.

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card title */
  title?: string;
  /** Card subtitle */
  subtitle?: string;
  /** Header actions */
  actions?: React.ReactNode;
  /** Whether to show border */
  bordered?: boolean;
  /** Whether to show shadow */
  shadow?: boolean;
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  bordered = true,
  shadow = true,
  padding = 'md',
  children,
  className,
  ...props
}) => {
  // Implementation details...
};
```

**Usage Examples:**
```tsx
import { Card } from '@/components/ui/Card';
import { MoreVertical } from 'lucide-react';

// Basic card
<Card title="Property Details">
  <p>Property information content...</p>
</Card>

// With subtitle and actions
<Card
  title="Verification Status"
  subtitle="Track your property verification progress"
  actions={
    <Button variant="ghost" size="sm" icon={<MoreVertical size={16} />} />
  }
>
  <VerificationProgress />
</Card>

// Custom styling
<Card 
  bordered={false}
  shadow={false}
  padding="lg"
  className="bg-gradient-to-r from-blue-50 to-indigo-50"
>
  <div>Custom styled content</div>
</Card>
```

### Badge

Small status indicator component.

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether badge has a dot indicator */
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className,
  ...props
}) => {
  // Implementation details...
};
```

**Usage Examples:**
```tsx
import { Badge } from '@/components/ui/Badge';

// Status badges
<Badge variant="success">Approved</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Rejected</Badge>

// With dot indicator
<Badge variant="success" dot>Active</Badge>

// Different sizes
<Badge size="sm">Small</Badge>
<Badge size="lg">Large</Badge>
```

### Progress

Progress bar component for showing completion status.

```typescript
interface ProgressProps {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Progress bar size */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** Whether to show percentage text */
  showValue?: boolean;
  /** Custom label */
  label?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showValue = false,
  label,
  ...props
}) => {
  // Implementation details...
};
```

**Usage Examples:**
```tsx
import { Progress } from '@/components/ui/Progress';

// Basic progress
<Progress value={75} />

// With label and value
<Progress 
  value={60}
  label="Verification Progress"
  showValue={true}
/>

// Different variants
<Progress value={100} variant="success" />
<Progress value={25} variant="warning" />
```

## Form Components

### FormField

Wrapper component for form inputs with consistent styling.

```typescript
interface FormFieldProps {
  /** Field label */
  label: string;
  /** Whether field is required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Field ID */
  id?: string;
  /** Form field content */
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  id,
  children
}) => {
  // Implementation details...
};
```

### Select

Dropdown select component with search functionality.

```typescript
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  /** Select options */
  options: SelectOption[];
  /** Current value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether select is searchable */
  searchable?: boolean;
  /** Whether select allows multiple values */
  multiple?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  searchable = false,
  multiple = false,
  loading = false,
  error
}) => {
  // Implementation details...
};
```

**Usage Examples:**
```tsx
import { Select } from '@/components/ui/Select';

const propertyTypes = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' }
];

<FormField label="Property Type" required>
  <Select
    options={propertyTypes}
    value={selectedType}
    onChange={setSelectedType}
    placeholder="Select property type"
  />
</FormField>
```

### FileInput

File upload input component with preview functionality.

```typescript
interface FileInputProps {
  /** Accepted file types */
  accept?: string;
  /** Whether multiple files allowed */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Change handler */
  onChange?: (files: File[]) => void;
  /** Whether to show file previews */
  showPreview?: boolean;
  /** Custom upload text */
  uploadText?: string;
}

export const FileInput: React.FC<FileInputProps> = ({
  accept,
  multiple = false,
  maxSize,
  onChange,
  showPreview = true,
  uploadText = 'Choose files or drag and drop'
}) => {
  // Implementation details...
};
```

## Layout Components

### Container

Responsive container component with max-width constraints.

```typescript
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Container size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to center content */
  center?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  size = 'lg',
  center = true,
  children,
  className,
  ...props
}) => {
  // Implementation details...
};
```

### Grid

CSS Grid layout component with responsive breakpoints.

```typescript
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns */
  cols?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  /** Gap between grid items */
  gap?: number;
  /** Auto-fit columns */
  autoFit?: boolean;
  /** Minimum column width for auto-fit */
  minColWidth?: string;
}

export const Grid: React.FC<GridProps> = ({
  cols = 1,
  gap = 4,
  autoFit = false,
  minColWidth = '250px',
  children,
  className,
  ...props
}) => {
  // Implementation details...
};
```

### Stack

Flexible container for stacking elements with consistent spacing.

```typescript
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stack direction */
  direction?: 'horizontal' | 'vertical';
  /** Spacing between items */
  spacing?: number;
  /** Alignment of items */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justification of items */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Whether to wrap items */
  wrap?: boolean;
}

export const Stack: React.FC<StackProps> = ({
  direction = 'vertical',
  spacing = 4,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  children,
  className,
  ...props
}) => {
  // Implementation details...
};
```

## Usage Examples

### Complete Form Example

```tsx
import { 
  FormField, 
  Input, 
  Select, 
  Button, 
  Card, 
  Stack 
} from '@/components/ui';

function PropertyForm() {
  const [formData, setFormData] = useState({
    address: '',
    area: '',
    type: '',
    price: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const propertyTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'plot', label: 'Plot/Land' }
  ];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation and submission logic
  };
  
  return (
    <Card title="Property Information" padding="lg">
      <form onSubmit={handleSubmit}>
        <Stack spacing={6}>
          <FormField 
            label="Property Address" 
            required
            error={errors.address}
          >
            <Input
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                address: e.target.value 
              }))}
              placeholder="Enter complete property address"
              error={errors.address}
            />
          </FormField>
          
          <Grid cols={{ sm: 1, md: 2 }} gap={6}>
            <FormField 
              label="Property Type" 
              required
              error={errors.type}
            >
              <Select
                options={propertyTypes}
                value={formData.type}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  type: value 
                }))}
                placeholder="Select property type"
                error={errors.type}
              />
            </FormField>
            
            <FormField 
              label="Area (sq ft)" 
              required
              error={errors.area}
            >
              <Input
                type="number"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  area: e.target.value 
                }))}
                placeholder="1000"
                error={errors.area}
              />
            </FormField>
          </Grid>
          
          <Stack direction="horizontal" justify="end" spacing={3}>
            <Button variant="outline">Cancel</Button>
            <Button type="submit">Continue</Button>
          </Stack>
        </Stack>
      </form>
    </Card>
  );
}
```

### Dashboard Layout Example

```tsx
import { 
  Container, 
  Grid, 
  Card, 
  Badge, 
  Progress,
  Stack 
} from '@/components/ui';

function DashboardLayout() {
  return (
    <Container size="xl">
      <Stack spacing={8}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Property Dashboard</h1>
          <Badge variant="success" dot>Online</Badge>
        </div>
        
        {/* Stats Grid */}
        <Grid cols={{ sm: 1, md: 2, lg: 4 }} gap={6}>
          <Card title="Total Properties" padding="md">
            <div className="text-2xl font-bold">24</div>
            <div className="text-sm text-gray-500">+3 this month</div>
          </Card>
          
          <Card title="Verified" padding="md">
            <div className="text-2xl font-bold text-green-600">18</div>
            <Progress value={75} variant="success" />
          </Card>
          
          <Card title="Pending" padding="md">
            <div className="text-2xl font-bold text-yellow-600">4</div>
            <Progress value={17} variant="warning" />
          </Card>
          
          <Card title="Total Value" padding="md">
            <div className="text-2xl font-bold">$2.4M</div>
            <div className="text-sm text-gray-500">Estimated</div>
          </Card>
        </Grid>
        
        {/* Main Content */}
        <Grid cols={{ sm: 1, lg: 3 }} gap={6}>
          <div className="lg:col-span-2">
            <PropertyList />
          </div>
          <div>
            <RecentActivity />
          </div>
        </Grid>
      </Stack>
    </Container>
  );
}
```

This component library provides a solid foundation for building consistent, accessible, and maintainable user interfaces in the RealEstateX application. All components are designed to work together seamlessly while allowing for customization when needed.
