import { ZeroGStorageConfig, DEFAULT_0G_CONFIG } from '../services/ZeroGStorageService';

// Environment variables for 0G Storage configuration
const ZERO_G_STORAGE_CONFIG: ZeroGStorageConfig = {
  rpcUrl: import.meta.env.VITE_ZERO_G_RPC_URL || DEFAULT_0G_CONFIG.rpcUrl,
  indexerUrl: import.meta.env.VITE_ZERO_G_INDEXER_URL || DEFAULT_0G_CONFIG.indexerUrl,
  privateKey: import.meta.env.VITE_ZERO_G_PRIVATE_KEY || '',
  gasLimit: import.meta.env.VITE_ZERO_G_GAS_LIMIT ? parseInt(import.meta.env.VITE_ZERO_G_GAS_LIMIT) : DEFAULT_0G_CONFIG.gasLimit,
  gasPrice: import.meta.env.VITE_ZERO_G_GAS_PRICE ? parseInt(import.meta.env.VITE_ZERO_G_GAS_PRICE) : DEFAULT_0G_CONFIG.gasPrice,
};

// Validation function
export const validateZeroGConfig = (): boolean => {
  if (!ZERO_G_STORAGE_CONFIG.rpcUrl) {
    console.error('0G Storage RPC URL is not configured');
    return false;
  }

  if (!ZERO_G_STORAGE_CONFIG.indexerUrl) {
    console.error('0G Storage Indexer URL is not configured');
    return false;
  }

  // Private key is optional for read-only operations
  if (!ZERO_G_STORAGE_CONFIG.privateKey) {
    console.warn('0G Storage private key is not configured - upload operations will not work');
  }

  return true;
};

export { ZERO_G_STORAGE_CONFIG };

// Development vs Production configurations
export const getZeroGConfig = (useUserKey?: string): ZeroGStorageConfig => {
  return {
    ...ZERO_G_STORAGE_CONFIG,
    // Allow override of private key for user-specific operations
    privateKey: useUserKey || ZERO_G_STORAGE_CONFIG.privateKey
  };
};