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
    const vaultManagerAddress = "0x0349750A807Edb66A86a47932afDEaD908ED8144";
    
    await setVaultManager(vaultManagerAddress, adminSigner);
    isVaultManagerSet = true;
    console.log('✅ VaultManager initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize VaultManager:', error);
    throw error;
  }
}