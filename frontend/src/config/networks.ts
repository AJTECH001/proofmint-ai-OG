// Network configurations for different blockchains
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const NETWORKS: Record<string, NetworkConfig> = {
  // 0G Testnet
  '16601': {
    chainId: 16601,
    name: '0G Testnet',
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    blockExplorer: 'https://chainscan-newton.0g.ai',
    nativeCurrency: {
      name: '0G',
      symbol: '0G',
      decimals: 18,
    },
  },
  // Other networks can be added here
  '1': {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/your-project-id',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// Default network (0G Testnet)
export const DEFAULT_NETWORK = NETWORKS['16601'];

// Contract addresses by network
export const CONTRACT_ADDRESSES_BY_NETWORK: Record<string, Record<string, string>> = {
  '16601': {
    ProofMint: '0x1061757434Be9060b2B00569c21A67FaD5C57123',
  },
};

export const getNetworkConfig = (chainId: number): NetworkConfig | undefined => {
  return NETWORKS[chainId.toString()];
};

export const getContractAddress = (chainId: number, contractName: string): string | undefined => {
  return CONTRACT_ADDRESSES_BY_NETWORK[chainId.toString()]?.[contractName];
};

export const isSupported0GNetwork = (chainId: number): boolean => {
  return chainId === 16601;
};

// Helper function to add 0G network to wallet
export const add0GNetworkToWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${DEFAULT_NETWORK.chainId.toString(16)}`,
        chainName: DEFAULT_NETWORK.name,
        rpcUrls: [DEFAULT_NETWORK.rpcUrl],
        blockExplorerUrls: DEFAULT_NETWORK.blockExplorer ? [DEFAULT_NETWORK.blockExplorer] : undefined,
        nativeCurrency: DEFAULT_NETWORK.nativeCurrency,
      }],
    });
    return true;
  } catch (error) {
    console.error('Failed to add 0G network:', error);
    return false;
  }
};

// Helper function to switch to 0G network
export const switchTo0GNetwork = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${DEFAULT_NETWORK.chainId.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    // If the network is not added, add it first
    if (error.code === 4902) {
      return await add0GNetworkToWallet();
    }
    console.error('Failed to switch to 0G network:', error);
    return false;
  }
};