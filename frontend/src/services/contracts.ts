import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from 'wagmi'
import { parseEther, formatEther, type Address } from 'viem'

// Contract ABIs (simplified for demo - you'd have full ABIs from your contracts)
const REAL_ESTATE_NFT_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' },
      { name: 'propertyValue', type: 'uint256' }
    ],
    name: 'mintProperty',
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

const HOMED_TOKEN_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Contract addresses (you'll deploy these to BlockDAG)
const CONTRACTS = {
  REAL_ESTATE_NFT: (import.meta.env.VITE_REAL_ESTATE_NFT_ADDRESS || '0x...') as Address,
  HOMED_TOKEN: (import.meta.env.VITE_HOMED_TOKEN_ADDRESS || '0x...') as Address,
}

export interface PropertyMetadata {
  name: string
  description: string
  image: string
  attributes: {
    address: string
    value: string
    documents: string[]
    verificationStatus: 'pending' | 'verified' | 'rejected'
  }
}

export interface PropertyToken {
  tokenId: bigint
  owner: Address
  tokenURI: string
  metadata?: PropertyMetadata
}

export class ContractService {
  /**
   * Mint a property NFT
   */
  static useMintProperty() {
    const { writeContract, data: hash, error, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
      hash,
    })

    const mintProperty = async (
      to: Address,
      tokenURI: string,
      propertyValue: bigint
    ) => {
      writeContract({
        address: CONTRACTS.REAL_ESTATE_NFT,
        abi: REAL_ESTATE_NFT_ABI,
        functionName: 'mintProperty',
        args: [to, tokenURI, propertyValue],
      })
    }

    return {
      mintProperty,
      hash,
      error,
      isPending,
      isConfirming,
      isSuccess,
    }
  }

  /**
   * Get property balance for an address
   */
  static usePropertyBalance(address?: Address) {
    const { data: balance, error, isLoading } = useReadContract({
      address: CONTRACTS.REAL_ESTATE_NFT,
      abi: REAL_ESTATE_NFT_ABI,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
    })

    return {
      balance: balance || 0n,
      error,
      isLoading,
    }
  }

  /**
   * Mint HOMED tokens
   */
  static useMintHomed() {
    const { writeContract, data: hash, error, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
      hash,
    })

    const mintHomed = async (to: Address, amount: bigint) => {
      writeContract({
        address: CONTRACTS.HOMED_TOKEN,
        abi: HOMED_TOKEN_ABI,
        functionName: 'mint',
        args: [to, amount],
      })
    }

    return {
      mintHomed,
      hash,
      error,
      isPending,
      isConfirming,
      isSuccess,
    }
  }

  /**
   * Get HOMED token balance
   */
  static useHomedBalance(address?: Address) {
    const { data: balance, error, isLoading } = useReadContract({
      address: CONTRACTS.HOMED_TOKEN,
      abi: HOMED_TOKEN_ABI,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
    })

    return {
      balance: balance || 0n,
      formattedBalance: balance ? formatEther(balance) : '0',
      error,
      isLoading,
    }
  }
}

// Utility functions
export const formatPropertyValue = (value: bigint) => {
  return `$${Number(formatEther(value)).toLocaleString()}`
}

export const parsePropertyValue = (value: string) => {
  return parseEther(value)
}
