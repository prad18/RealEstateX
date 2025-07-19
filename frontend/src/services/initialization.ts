import { setVaultManager, getAdminSigner } from './contracts';

let isVaultManagerSet = false;

export async function initializeContracts() {
  if (isVaultManagerSet) {
    console.log('VaultManager already initialized');
    return;
  }

  try {
    console.log('Initializing VaultManager...');
    const adminSigner = getAdminSigner();
    const vaultManagerAddress = "0x4c1a40E5ba4E64436a77734f05Bc363fDf68ce9b";
    
    await setVaultManager(vaultManagerAddress, adminSigner);
    isVaultManagerSet = true;
    console.log('✅ VaultManager initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize VaultManager:', error);
    throw error;
  }
}