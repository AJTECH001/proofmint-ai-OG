import dotenv from 'dotenv';

dotenv.config();

export interface ZeroGConfig {
  rpcUrl: string;
  indexerRpc: string;
  privateKey: string;
  kvNodeUrl: string;
  flowContract?: string;
  segmentNumber?: number;
  expectedReplicas?: number;
}

export const zeroGConfig: ZeroGConfig = {
  rpcUrl: process.env.ZERO_G_RPC_URL || 'https://evmrpc-testnet.0g.ai/',
  indexerRpc: process.env.ZERO_G_INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai',
  privateKey: process.env.ZERO_G_PRIVATE_KEY || '',
  kvNodeUrl: process.env.ZERO_G_KV_NODE_URL || 'http://3.101.147.150:6789',
  flowContract: process.env.ZERO_G_FLOW_CONTRACT || '0x', // Configure your flow contract address
  segmentNumber: parseInt(process.env.ZERO_G_SEGMENT_NUMBER || '1'),
  expectedReplicas: parseInt(process.env.ZERO_G_EXPECTED_REPLICAS || '3')
};

export const validateZeroGConfig = (): void => {
  if (!zeroGConfig.rpcUrl) {
    throw new Error('ZERO_G_RPC_URL is required');
  }
  
  if (!zeroGConfig.indexerRpc) {
    throw new Error('ZERO_G_INDEXER_RPC is required');
  }
  
  if (!zeroGConfig.privateKey || zeroGConfig.privateKey === 'your_private_key_here') {
    console.warn('⚠️  ZERO_G_PRIVATE_KEY is not configured properly. Upload operations will not work.');
    console.warn('📝 Please set a valid private key with 0G testnet tokens in your .env file');
    console.warn('💡 You can get testnet tokens from the 0G faucet');
    // Don't throw error to allow server to start for read-only operations
  }
  
  if (!zeroGConfig.kvNodeUrl) {
    throw new Error('ZERO_G_KV_NODE_URL is required');
  }
};