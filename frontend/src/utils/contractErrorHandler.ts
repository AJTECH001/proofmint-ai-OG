import { ethers } from 'ethers';

export interface ContractError {
  type: 'CONNECTION_ERROR' | 'CONTRACT_NOT_FOUND' | 'METHOD_NOT_FOUND' | 'INSUFFICIENT_FUNDS' | 'UNKNOWN_ERROR';
  message: string;
  originalError?: any;
  suggestions?: string[];
}

/**
 * Parse and categorize contract errors for better user experience
 */
export function parseContractError(error: any): ContractError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // Connection errors
  if (errorMessage.includes('missing revert data') || errorMessage.includes('CALL_EXCEPTION')) {
    return {
      type: 'CONTRACT_NOT_FOUND',
      message: 'Contract not found or method does not exist',
      originalError: error,
      suggestions: [
        'Verify the contract address is correct',
        'Check if you\'re connected to the right network (0G Testnet)',
        'Ensure the contract has been deployed',
        'Verify the ABI matches the deployed contract'
      ]
    };
  }
  
  // Network connection issues
  if (errorMessage.includes('network error') || errorMessage.includes('timeout')) {
    return {
      type: 'CONNECTION_ERROR',
      message: 'Network connection error',
      originalError: error,
      suggestions: [
        'Check your internet connection',
        'Verify the RPC endpoint is accessible',
        'Try switching to a different RPC endpoint',
        'Check if the 0G network is experiencing issues'
      ]
    };
  }
  
  // Insufficient funds
  if (errorMessage.includes('insufficient funds')) {
    return {
      type: 'INSUFFICIENT_FUNDS',
      message: 'Insufficient funds for transaction',
      originalError: error,
      suggestions: [
        'Add more tokens to your wallet',
        'Get testnet tokens from the 0G faucet',
        'Reduce the gas limit or gas price'
      ]
    };
  }
  
  // Method not found
  if (errorMessage.includes('function') && errorMessage.includes('not found')) {
    return {
      type: 'METHOD_NOT_FOUND',
      message: 'Contract method not found',
      originalError: error,
      suggestions: [
        'Check if the contract ABI is up to date',
        'Verify the method name spelling',
        'Ensure the contract version supports this method'
      ]
    };
  }
  
  // Default unknown error
  return {
    type: 'UNKNOWN_ERROR',
    message: errorMessage,
    originalError: error,
    suggestions: [
      'Check the browser console for more details',
      'Try refreshing the page',
      'Verify your wallet connection'
    ]
  };
}

/**
 * Check if the current network connection is healthy
 */
export async function checkNetworkHealth(): Promise<{
  isHealthy: boolean;
  chainId?: number;
  blockNumber?: number;
  error?: string;
}> {
  try {
    if (typeof window.ethereum === 'undefined') {
      return {
        isHealthy: false,
        error: 'No Web3 provider detected. Please install MetaMask or another Web3 wallet.'
      };
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Test basic connectivity
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    return {
      isHealthy: true,
      chainId: Number(network.chainId),
      blockNumber: Number(blockNumber)
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Network check failed'
    };
  }
}

/**
 * Validate contract address and check if it exists
 */
export async function validateContractAddress(address: string): Promise<{
  isValid: boolean;
  exists: boolean;
  error?: string;
}> {
  try {
    if (!ethers.isAddress(address)) {
      return {
        isValid: false,
        exists: false,
        error: 'Invalid Ethereum address format'
      };
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const code = await provider.getCode(address);
    
    // If code is '0x', the address doesn't contain a contract
    const hasContract = code !== '0x';
    
    return {
      isValid: true,
      exists: hasContract,
      error: hasContract ? undefined : 'No contract found at this address'
    };
  } catch (error) {
    return {
      isValid: false,
      exists: false,
      error: error instanceof Error ? error.message : 'Contract validation failed'
    };
  }
}

/**
 * Get user-friendly error message for display
 */
export function getDisplayError(error: ContractError): string {
  switch (error.type) {
    case 'CONTRACT_NOT_FOUND':
      return 'Smart contract not accessible. Please check your network connection and contract settings.';
    case 'CONNECTION_ERROR':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'INSUFFICIENT_FUNDS':
      return 'Not enough tokens in your wallet to complete this transaction.';
    case 'METHOD_NOT_FOUND':
      return 'Contract method not found. The smart contract may need to be updated.';
    default:
      return 'An unexpected error occurred. Please try again or contact support.';
  }
}