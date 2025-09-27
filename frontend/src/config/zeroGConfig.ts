import { ZeroGStorageService } from '../services/ZeroGStorageService';

// Backend API configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const ZERO_G_API_URL = `${BACKEND_URL}/api/storage`;

// Create service instance
export const zeroGStorageService = new ZeroGStorageService(ZERO_G_API_URL);

// Validation function
export const validateZeroGConfig = async (): Promise<boolean> => {
  try {
    const health = await zeroGStorageService.healthCheck();
    if (!health.healthy) {
      console.error('0G Storage service is not healthy:', health.details);
      return false;
    }
    console.log('✅ 0G Storage service is healthy');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to 0G Storage service:', error);
    return false;
  }
};

// Configuration object for easy access
export const ZERO_G_CONFIG = {
  backendUrl: BACKEND_URL,
  apiUrl: ZERO_G_API_URL,
  service: zeroGStorageService
};