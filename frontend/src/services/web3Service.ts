/**
 * Web3 Service for RealEstateX
 * Handles property registration, token minting, and other Web3 operations
 */
import { getContractInstance, getTokenIds } from './contracts';
import { ipfsService } from './ipfs';

export interface PropertyData {
  id: string;
  title: string;
  address: string;
  value: number;
  ipfsHash: string;
  documents: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
}

export interface TokenBalance {
  homedBalance: string;
  propertyCount: number;
  collateralValue: number;
  healthFactor: number;
}

export interface MintRequest {
  propertyId: string;
  requestedAmount: number;
  collateralRatio: number;
}

export class Web3Service {
  private properties: PropertyData[] = [];
  private mockBalance: TokenBalance = {
    homedBalance: '0',
    propertyCount: 0,
    collateralValue: 0,
    healthFactor: 0
  };

  /**
   * Register a new property (mock implementation)
   */
  async registerProperty(data: Omit<PropertyData, 'id' | 'createdAt'>): Promise<PropertyData> {
    const property: PropertyData = {
      ...data,
      id: `prop_${Date.now()}`,
      createdAt: new Date()
    };
    
    this.properties.push(property);
    this.updateMockBalance();
    
    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🏠 Property registered:', property);
    return property;
  }

  /**
   * Get user's properties
   */
  async getUserProperties(address: string): Promise<PropertyData[]> {
    try {
      const contract = await getContractInstance('propertyNft');
      const tokenIds = await getTokenIds(address);

      if (!tokenIds || tokenIds.length === 0) {
        return [];
      }

      const properties: PropertyData[] = await Promise.all(
        tokenIds.map(async (tokenId: number) => {
          const { ipfsHash, valuation, verified } = await contract.getProperty(tokenId);
          
          let metadata = {
            title: `Property #${tokenId}`,
            address: 'Metadata not available',
            documents: [],
            timestamp: new Date().toISOString()
          };

          try {
            const ipfsData = await ipfsService.getJSON(ipfsHash);
            metadata = {
              title: ipfsData.title || `Property #${tokenId}`,
              address: ipfsData.address || 'Address not found',
              documents: ipfsData.documents || [],
              timestamp: ipfsData.timestamp || new Date().toISOString()
            };
          } catch (e) {
            console.error(`Could not fetch metadata for token ${tokenId} from IPFS. Using on-chain data as fallback.`, e);
          }

          return {
            id: tokenId.toString(),
            title: metadata.title,
            address: metadata.address,
            value: Number(valuation),
            ipfsHash: ipfsHash,
            documents: metadata.documents,
            verificationStatus: verified ? 'verified' : 'pending',
            createdAt: new Date(metadata.timestamp),
          };
        })
      );

      return properties;
    } catch (error) {
      console.error('Failed to fetch user properties from blockchain:', error);
      return [];
    }
  }

  /**
   * Mint HOMED tokens (mock implementation)
   */
  async mintHomed(request: MintRequest): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Simulate validation
      const property = this.properties.find(p => p.id === request.propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      if (property.verificationStatus !== 'verified') {
        throw new Error('Property must be verified before minting');
      }

      // Simulate minting
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const currentBalance = parseFloat(this.mockBalance.homedBalance);
      this.mockBalance.homedBalance = (currentBalance + request.requestedAmount).toString();
      
      console.log('💰 HOMED tokens minted:', request.requestedAmount);
      
      return {
        success: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Minting failed'
      };
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(_address: string): Promise<TokenBalance> {
    // Mock implementation
    return this.mockBalance;
  }

  /**
   * Verify property documents (mock implementation)
   */
  async verifyProperty(propertyId: string, verified: boolean): Promise<void> {
    const property = this.properties.find(p => p.id === propertyId);
    if (property) {
      property.verificationStatus = verified ? 'verified' : 'rejected';
      this.updateMockBalance();
      console.log('✅ Property verification updated:', propertyId, verified);
    }
  }

  /**
   * Get property by ID
   */
  async getProperty(propertyId: string): Promise<PropertyData | null> {
    return this.properties.find(p => p.id === propertyId) || null;
  }

  /**
   * Update mock balance based on properties
   */
  private updateMockBalance(): void {
    const verifiedProperties = this.properties.filter(p => p.verificationStatus === 'verified');
    const totalValue = verifiedProperties.reduce((sum, prop) => sum + prop.value, 0);
    
    this.mockBalance = {
      ...this.mockBalance,
      propertyCount: verifiedProperties.length,
      collateralValue: totalValue,
      healthFactor: totalValue > 0 ? (totalValue / (parseFloat(this.mockBalance.homedBalance) || 1)) : 0
    };
  }

  /**
   * Simulate blockchain transaction
   */
  private async simulateTransaction(operation: string): Promise<string> {
    console.log(`🔄 Simulating ${operation} transaction...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    console.log(`✅ Transaction completed: ${txHash}`);
    return txHash;
  }
}

// Export singleton instance
export const web3Service = new Web3Service();
