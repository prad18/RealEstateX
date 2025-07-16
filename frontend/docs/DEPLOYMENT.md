# 📋 RealEstateX Deployment Guide

## Table of Contents
- [Overview](#overview)
- [Development Environment](#development-environment)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Security Considerations](#security-considerations)

## Overview

This guide provides comprehensive instructions for deploying RealEstateX from development to production environments. The platform consists of a React frontend, Python backend, and blockchain smart contracts.

### Architecture Overview

```
Production Architecture
├── Frontend (React/TypeScript)
│   ├── Vite Build
│   ├── Static Assets
│   └── Environment Config
├── Backend (Python/FastAPI)
│   ├── Application Server
│   ├── Database
│   └── API Services
├── Blockchain
│   ├── Smart Contracts
│   ├── IPFS Network
│   └── Web3 Infrastructure
└── External Services
    ├── Property APIs
    ├── Verification Services
    └── Payment Gateways
```

## Development Environment

### Prerequisites

**Software Requirements:**
- Node.js 18+ and npm
- Python 3.9+
- Git
- Docker (optional)
- MetaMask or compatible Web3 wallet

**Development Tools:**
- VS Code with recommended extensions
- Postman for API testing
- Ganache for local blockchain testing
- Browser with Web3 support

### Local Setup

#### 1. Frontend Setup

```bash
# Clone repository
git clone https://github.com/your-org/RealEstateX.git
cd RealEstateX

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp env.example .env.local
```

**Frontend Environment Variables (.env.local):**
```env
# IPFS Configuration
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud

# Blockchain Configuration (Development)
VITE_BLOCKDAG_RPC_URL=http://localhost:8545
VITE_BLOCKDAG_CHAIN_ID=1337

# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Debug Mode
VITE_DEBUG_MODE=true
VITE_MOCK_DATA=true
```

```bash
# Start development server
npm run dev
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd ../backend

# Create virtual environment
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
```

**Backend Environment Variables (.env):**
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/realestatex
REDIS_URL=redis://localhost:6379

# JWT Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External API Keys
PROPSTACK_API_KEY=your_propstack_key
AADHAAR_API_KEY=your_aadhaar_key
PAN_API_KEY=your_pan_key

# Blockchain Configuration
WEB3_PROVIDER_URL=http://localhost:8545
PRIVATE_KEY=your_deployment_private_key

# IPFS Configuration
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

```bash
# Initialize database
alembic upgrade head

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Smart Contract Setup

```bash
# Install Hardhat and dependencies
cd ../contracts
npm install

# Compile contracts
npx hardhat compile

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Run tests
npx hardhat test
```

### Development Scripts

**Package.json Scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "analyze": "npm run build && npx vite-bundle-analyzer dist"
  }
}
```

## Production Deployment

### Frontend Deployment (Vercel/Netlify)

#### Vercel Deployment

**1. Vercel Configuration (vercel.json):**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "@api-base-url",
    "VITE_PINATA_JWT": "@pinata-jwt",
    "VITE_POLYGON_RPC_URL": "@polygon-rpc-url"
  }
}
```

**2. Environment Variables Setup:**
```bash
# Set production environment variables in Vercel dashboard
VITE_API_BASE_URL=https://api.realestatex.com
VITE_PINATA_JWT=your_production_pinata_jwt
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_POLYGON_CHAIN_ID=137
VITE_NFT_CONTRACT_ADDRESS=0x...
VITE_STABLECOIN_CONTRACT_ADDRESS=0x...
```

**3. Build Configuration:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['wagmi', 'viem', '@web3modal/wagmi'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast']
        }
      }
    }
  }
});
```

### Backend Deployment (AWS/Railway/Heroku)

#### AWS Deployment with Docker

**1. Dockerfile:**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**2. Docker Compose (docker-compose.prod.yml):**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=realestatex
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

**3. AWS ECS Task Definition:**
```json
{
  "family": "realestatex-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "realestatex-app",
      "image": "your-registry/realestatex-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://..."
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/realestatex",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Database Setup

#### PostgreSQL Configuration

**1. Production Database Schema:**
```sql
-- Database setup script
CREATE DATABASE realestatex;
CREATE USER realestatex_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE realestatex TO realestatex_user;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

**2. Migration Scripts:**
```bash
# Run database migrations
alembic upgrade head

# Create initial admin user
python scripts/create_admin.py

# Seed initial data
python scripts/seed_data.py
```

**3. Backup Configuration:**
```bash
#!/bin/bash
# backup.sh - Database backup script

DB_NAME="realestatex"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql s3://your-backup-bucket/db/

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

## Environment Configuration

### Production Environment Variables

**Frontend (.env.production):**
```env
# Production API endpoints
VITE_API_BASE_URL=https://api.realestatex.com
VITE_WS_URL=wss://api.realestatex.com/ws

# Blockchain Configuration
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_POLYGON_CHAIN_ID=137
VITE_INFURA_PROJECT_ID=your_infura_project_id

# Smart Contracts (Polygon Mainnet)
VITE_NFT_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
VITE_STABLECOIN_CONTRACT_ADDRESS=0x0987654321098765432109876543210987654321
VITE_MARKETPLACE_CONTRACT_ADDRESS=0x1111111111111111111111111111111111111111

# IPFS Configuration
VITE_PINATA_JWT=your_production_pinata_jwt
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud

# External Services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_ANALYTICS_ID=your_analytics_id

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_DEBUG_MODE=false
```

**Backend (.env.production):**
```env
# Application Configuration
ENV=production
DEBUG=false
SECRET_KEY=your-super-secure-secret-key-here
ALLOWED_ORIGINS=https://realestatex.com,https://app.realestatex.com

# Database Configuration
DATABASE_URL=postgresql://user:password@db.realestatex.com:5432/realestatex
REDIS_URL=redis://redis.realestatex.com:6379

# JWT Configuration
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# External API Configuration
PROPSTACK_API_KEY=your_production_propstack_key
AADHAAR_API_KEY=your_production_aadhaar_key
PAN_API_KEY=your_production_pan_key
DIGILOCKER_API_KEY=your_production_digilocker_key

# Blockchain Configuration
WEB3_PROVIDER_URL=https://polygon-rpc.com
POLYGON_CHAIN_ID=137
DEPLOYMENT_PRIVATE_KEY=your_secure_deployment_key

# IPFS Configuration
PINATA_API_KEY=your_production_pinata_api_key
PINATA_SECRET_KEY=your_production_pinata_secret_key

# Notification Services
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Monitoring and Logging
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=INFO
```

### Security Configuration

**1. SSL/TLS Setup (Nginx):**
```nginx
# nginx.conf
server {
    listen 80;
    server_name realestatex.com www.realestatex.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name realestatex.com www.realestatex.com;

    ssl_certificate /etc/nginx/ssl/realestatex.crt;
    ssl_certificate_key /etc/nginx/ssl/realestatex.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://app:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**2. CORS Configuration:**
```python
# backend/app/config/cors.py
from fastapi.middleware.cors import CORSMiddleware

def setup_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://realestatex.com",
            "https://app.realestatex.com",
            "https://www.realestatex.com"
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
        expose_headers=["*"]
    )
```

## Smart Contract Deployment

### Mainnet Deployment

**1. Hardhat Configuration (hardhat.config.js):**
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.DEPLOYMENT_PRIVATE_KEY],
      gasPrice: 30000000000, // 30 gwei
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: [process.env.DEPLOYMENT_PRIVATE_KEY],
      gasPrice: 1000000000, // 1 gwei
    }
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY
    }
  },
  gasReporter: {
    enabled: true,
    currency: 'USD'
  }
};
```

**2. Deployment Script (scripts/deploy-mainnet.js):**
```javascript
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting mainnet deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  // Deploy RealEstateNFT
  console.log("Deploying RealEstateNFT...");
  const RealEstateNFT = await ethers.getContractFactory("RealEstateNFT");
  const nftContract = await RealEstateNFT.deploy(
    "RealEstateX Property NFT",
    "REXNFT",
    "https://api.realestatex.com/metadata/"
  );
  
  await nftContract.deployed();
  console.log("RealEstateNFT deployed to:", nftContract.address);
  
  // Deploy HomedStablecoin
  console.log("Deploying HomedStablecoin...");
  const HomedStablecoin = await ethers.getContractFactory("HomedStablecoin");
  const stablecoin = await HomedStablecoin.deploy(
    "Homed Stablecoin",
    "HOMED",
    ethers.utils.parseUnits("1000000", 18) // 1M initial supply
  );
  
  await stablecoin.deployed();
  console.log("HomedStablecoin deployed to:", stablecoin.address);
  
  // Deploy Marketplace
  console.log("Deploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("PropertyMarketplace");
  const marketplace = await Marketplace.deploy(
    nftContract.address,
    stablecoin.address,
    250 // 2.5% platform fee
  );
  
  await marketplace.deployed();
  console.log("Marketplace deployed to:", marketplace.address);
  
  // Set marketplace as approved operator
  await nftContract.setApprovalForAll(marketplace.address, true);
  console.log("Marketplace approved as operator");
  
  // Verify contracts on Etherscan
  console.log("Verifying contracts...");
  
  try {
    await hre.run("verify:verify", {
      address: nftContract.address,
      constructorArguments: [
        "RealEstateX Property NFT",
        "REXNFT",
        "https://api.realestatex.com/metadata/"
      ],
    });
    console.log("RealEstateNFT verified");
  } catch (error) {
    console.log("RealEstateNFT verification failed:", error.message);
  }
  
  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      RealEstateNFT: nftContract.address,
      HomedStablecoin: stablecoin.address,
      Marketplace: marketplace.address
    },
    timestamp: new Date().toISOString()
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    './deployments/mainnet.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment completed successfully!");
  console.log("Deployment info saved to ./deployments/mainnet.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Contract Verification

```bash
# Verify contracts on Polygonscan
npx hardhat verify --network polygon 0x... "Constructor" "Arguments"

# Flatten contracts for manual verification
npx hardhat flatten contracts/RealEstateNFT.sol > flattened/RealEstateNFT.sol
```

## Monitoring and Maintenance

### Application Monitoring

**1. Error Tracking (Sentry):**
```typescript
// Frontend error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});

// Backend error tracking
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

**2. Performance Monitoring:**
```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    value: Math.round(metric.value),
    event_label: metric.id,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**3. Health Checks:**
```python
# Backend health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Check database connection
        await database.execute("SELECT 1")
        
        # Check Redis connection
        await redis.ping()
        
        # Check external API connectivity
        response = await httpx.get("https://api.propstack.com/health")
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow(),
            "checks": {
                "database": "ok",
                "redis": "ok",
                "external_apis": "ok"
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
```

### Backup and Recovery

**1. Database Backups:**
```bash
#!/bin/bash
# Automated backup script

# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to S3
aws s3 cp backup_*.sql s3://realestatex-backups/database/

# Smart contract data backup
python scripts/backup_blockchain_data.py
```

**2. Recovery Procedures:**
```bash
# Database recovery
psql $DATABASE_URL < backup_20231201_120000.sql

# Application deployment rollback
kubectl rollout undo deployment/realestatex-backend

# Frontend rollback (Vercel)
vercel rollback https://realestatex.com
```

## Security Considerations

### Security Checklist

**Application Security:**
- [ ] HTTPS enforced everywhere
- [ ] API rate limiting implemented
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS protection headers
- [ ] CSRF protection
- [ ] Secure session management
- [ ] Regular security audits

**Blockchain Security:**
- [ ] Smart contracts audited
- [ ] Private keys secured (HSM/KMS)
- [ ] Multi-signature wallets for admin functions
- [ ] Contract upgrade mechanisms
- [ ] Emergency pause functionality
- [ ] Gas optimization
- [ ] Reentrancy protection

**Infrastructure Security:**
- [ ] Network segmentation
- [ ] Access controls (IAM)
- [ ] Security groups/firewalls
- [ ] Regular security updates
- [ ] Encrypted data at rest
- [ ] Encrypted data in transit
- [ ] Log monitoring and alerting
- [ ] Backup encryption

### Security Incident Response

**Incident Response Plan:**
1. **Detection** - Automated monitoring alerts
2. **Assessment** - Severity evaluation
3. **Containment** - Isolate affected systems
4. **Eradication** - Remove threat and vulnerabilities
5. **Recovery** - Restore normal operations
6. **Lessons Learned** - Post-incident review

This deployment guide provides a comprehensive roadmap for taking RealEstateX from development to production. Follow these procedures to ensure a secure, scalable, and maintainable deployment.
