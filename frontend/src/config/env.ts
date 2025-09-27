// Environment configuration
export const config = {
  // Default to 0G Testnet if not specified
  rpcUrl: process.env.REACT_APP_RPC_URL || 'https://evmrpc-testnet.0g.ai',
  chainId: parseInt(process.env.REACT_APP_CHAIN_ID || '16601'),
  
  // Contract addresses
  contracts: {
    proofMint: process.env.REACT_APP_PROOF_MINT_ADDRESS || '0x1061757434Be9060b2B00569c21A67FaD5C57123',
  },
  
  // API endpoints
  api: {
    baseUrl: process.env.REACT_APP_API_URL || '',
  },
  
  // Feature flags
  features: {
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    enableNotifications: process.env.REACT_APP_ENABLE_NOTIFICATIONS !== 'false',
  }
};

export default config;