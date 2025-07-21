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
    address: "0x44Df877FE3e1121fA2Dfbaa4a3D5bEaE5a031a15",
    abi: VerifiedPropertyNFT.output.abi,
  },
  homedToken: {
    address: "0x6Fa1baFB83D83f94D6a42787533382abe3Db2f53",
    abi: HOMEDToken.output.abi,
  },
  vaultManager: {
    address: "0x4c1a40E5ba4E64436a77734f05Bc363fDf68ce9b",
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
export async function setPropertyVerified(tokenId:number , status:boolean) {
    // ALWAYS use admin signer for verification - this is a privileged action
    const adminSigner = getAdminSigner();
    const contract = await getContractInstance('propertyNft', adminSigner);
    
    console.log('🔧 DEBUG setPropertyVerified - Using admin signer');
    console.log('🔧 DEBUG setPropertyVerified - Admin address:', await adminSigner.getAddress());
    
    const tx = await contract.setVerified(tokenId , status); // Note: Original function was setVerfied, might be a typo for setVerified
    return tx.wait();
}

//Function to get the approval from the user ;
export async function giveApproval(tokenId : number,signer?:any)
{
  const vaultAddress:string="0x4c1a40E5ba4E64436a77734f05Bc363fDf68ce9b";
   const contracts = await getContractInstance('propertyNft',signer);
   const tx = await contracts.approve(vaultAddress , tokenId);
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
  return tx; // .wait() might not be needed for a read-only call. Consider removing for efficiency.
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
   const count= tx.toString();
   return count;
}

//Function to get the token ids that a person owns;
export async function getnextTokenid(){
  const contracts = await getContractInstance('homedToken');
  const tx = await contracts.nextTokenId();
  return parseInt(tx);
} 

// Function to get the Property NFT token IDs that a person owns
export async function getTokenIds(address: string): Promise<number[]> {
  try {
    const contract = await getContractInstance('propertyNft');
    
    // Use the getTokenIdsByOwner function from the VerifiedPropertyNFT contract
    const tokenIds = await contract.getTokenIdsByOwner(address);
    
    // Convert BigNumber array to number array
    const propertyTokenIds = tokenIds.map((id: any) => parseInt(id.toString()));
    
    return propertyTokenIds;
  } catch (error) {
    console.error('Error fetching user property token IDs:', error);
    throw new Error('Failed to fetch user property token IDs');
  }
}

//Fuction to Repay the loan and get the property back;
export async function repay(
  tokenID: number,
  amount: bigint,
  address: string,
  signer?: any,
) {
  const balance = await balanceof(address); // balance is a bigint in ethers v6

  if (amount > balance) {
    throw new Error("Insufficient funds");
  }

  const contract = await getContractInstance("vaultManager", signer);
  const tx = await contract.repayAndCloseVault(tokenID, amount);
  return tx;
}

/**
 * Returns a list of NFT token IDs currently mortgaged (active) by the user.
 */
export async function getActiveMortgagedProperties(userAddress: string, signer?: any) {
  const contract = await getContractInstance('vaultManager', signer);
  const PropertyContract = await getContractInstance('propertyNft');
  const allVaults: bigint[] = await contract.getUserVaults(userAddress);
  console.log("All vaults:", allVaults);
  const activeTokenIds: Array<{Id : BigInt , value : number}> = [];
  for (const tokenId of allVaults) {
    const vault = await contract.vaults(tokenId);
    console.log(`Vault for token ${tokenId}:`, vault);
    if (vault.active) {
      const {ipfsHash , valuation , verification} = await PropertyContract.getProperty(tokenId); 
      const seventy = Number(valuation) * 0.8;
      activeTokenIds.push({Id : tokenId, value: seventy});
    }
  }
  console.log("Active tokens:", activeTokenIds);
  return activeTokenIds;
}


   