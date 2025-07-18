import {ethers, BrowserProvider} from 'ethers';
import VerifiedPropertyNFT from '../abi/VerifiedPropertyNFT_metadata.json';
import HOMEDToken from '../abi/HOMEDToken_metadata.json';
import VaultManager from '../abi/VaultManager_metadata.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const CONTRACTS = {
  propertyNft: {
    address: "0x359f25566A2Ec3F93E23571869b1b7930E2Da5f7",
    abi: VerifiedPropertyNFT.output.abi,
  },
  homedToken: {
    address: "0x8870F17a0Ecba1b9DD4866b576d41e237D0e3066",
    abi: HOMEDToken.output.abi,
  },
  vaultManager: {
    address: "0x9295A651C8Fe7aC4958740e44Df413CeA9281E64",
    abi: VaultManager.output.abi,
  }
};
 
// This function connects to the blockchain RPC endpoint via the local proxy.
export function getRPCProvider(){
  const projectId = import.meta.env.VITE_INFURA_PROJECT_ID;

  // Ensure the environment variable is set.
  if (!projectId) {
    throw new Error("VITE_INFURA_PROJECT_ID is not set in your .env.local file.");
  }

  // **FIX:** Construct the full, absolute URL to the local proxy endpoint.
  // Ethers.js requires a full URL, and window.location.origin provides it dynamically
  // (e.g., "http://localhost:5173").
  const rpcurl = `${window.location.origin}/api/v3/${projectId}`;
  
  return new ethers.JsonRpcProvider(rpcurl);
}

// This function creates a signer instance for the admin wallet.
export function getAdminSigner(){
  const provider = getRPCProvider(); // Get the provider
  const privatekey = import.meta.env.VITE_ADMIN_PRIVATE_KEY; // Get the private key from .env
  if(!privatekey) throw new Error("VITE_ADMIN_PRIVATE_KEY is not set in your .env.local file."); // Throw an error if the key is not found
  return new ethers.Wallet(privatekey , provider); // Return the admin wallet signer
}

// This function gets the provider from the user's browser wallet (e.g., MetaMask).
export function getUserProvider(){
  if(!window.ethereum) throw new Error("No Wallet Found. Please install MetaMask.");
  return new BrowserProvider(window.ethereum);
}

// This function gets a contract instance.
export async function getContractInstance(
  contractKey : keyof typeof CONTRACTS,
  signerorProvider?: any
) {
    const contract = CONTRACTS[contractKey];
    let provider;
    
    if(signerorProvider) {
      provider = signerorProvider;
    } else {
      const p = getUserProvider();
      provider = await p.getSigner();
    }
    
    return new ethers.Contract(contract.address , contract.abi , provider);
}

// --- Contract Interaction Functions ---

// Function 1: Mint a new property NFT.
export async function mintPropertyNFT(to: string, ipfsHash: string, valuation: number, signer?: any) {
    try {
        // Use admin signer as minting is typically a privileged action.
        const adminSigner = getAdminSigner();
        const contract = await getContractInstance('propertyNft', signer || adminSigner);
        
        const signerAddress = await adminSigner.getAddress();
        if (!adminSigner.provider) {
            throw new Error('Admin signer provider is not available');
        }
        // Get the current nonce to prevent transaction conflicts.
        const nonce = await adminSigner.provider.getTransactionCount(signerAddress, 'pending');
        
        console.log('Minting with admin signer:', signerAddress);
        console.log('Minting to:', to);
        console.log('IPFS Hash:', ipfsHash);
        console.log('Valuation:', valuation);
        console.log('Using nonce:', nonce);
        
        // Call the mint function on the contract.
        const tx = await contract.mint(to, ipfsHash, valuation, {
            nonce: nonce,
            gasLimit: 500000, // Set a generous gas limit
        });
        
        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
        
        return receipt;
        
    } catch (error: any) {
        console.error('Minting error details:', error);
        
        // Provide more user-friendly error messages.
        if (error.code === 'CALL_EXCEPTION') {
            if (error.reason) {
                throw new Error(`Contract error: ${error.reason}`);
            } else {
                throw new Error('Contract call failed. This might be an ownership issue - only the contract owner can mint NFTs.');
            }
        } else if (error.code === 'NONCE_EXPIRED') {
            throw new Error('Transaction nonce conflict. Please try again in a few seconds.');
        } else if (error.message?.includes('insufficient funds')) {
            throw new Error('Insufficient funds for gas fees.');
        } else if (error.message?.includes('nonce')) {
            throw new Error('Transaction nonce conflict. Please try again.');
        }
        
        throw error;
    }
}

// Function 2: Set the verification status of a property.
export async function setPropertyVerified(tokenId:number , status:boolean , signer?:any) {
    const contract = await getContractInstance('propertyNft' , signer);
    const tx = await contract.setVerfied(tokenId , status); // Note: Original function was setVerfied, might be a typo for setVerified
    return tx.wait();
}

// Function 3: Set the VaultManager address in the HOMEDToken contract.
export async function setVaultManager(address:string , signer ?:any) {
  const contracts = await getContractInstance('homedToken' , signer);
  const tx = await contracts.setVaultManager(address);
  return tx.wait();
}

// Function 4: Get the HOMEDToken balance of an address.
export async function balanceof(address:string , signer ?:any) {
  const contracts = await getContractInstance('homedToken' , signer);
  const tx = await contracts.balanceOf(address);
  return tx.wait(); // .wait() might not be needed for a read-only call. Consider removing for efficiency.
}

// Function 5: Open a vault for a given NFT to mint tokens.
export async function openvault(tokenId:number , signer?:any){
  const contracts = await getContractInstance('vaultManager' , signer);
  const tx = await contracts.openVault(tokenId);
  return tx.wait();
}

// Function 6: Get the number of properties (NFTs) owned by an address.
export async function getCountofProperty(address:string) {
   const contracts = await getContractInstance('propertyNft');
   const tx = await contracts.balanceOf(address);
   return tx.toString();
}
