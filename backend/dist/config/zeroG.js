"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateZeroGConfig = exports.zeroGConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.zeroGConfig = {
    rpcUrl: process.env.ZERO_G_RPC_URL || 'https://evmrpc-testnet.0g.ai/',
    indexerRpc: process.env.ZERO_G_INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai',
    privateKey: process.env.ZERO_G_PRIVATE_KEY || '',
    kvNodeUrl: process.env.ZERO_G_KV_NODE_URL || 'http://3.101.147.150:6789',
    flowContract: process.env.ZERO_G_FLOW_CONTRACT || '0x',
    segmentNumber: parseInt(process.env.ZERO_G_SEGMENT_NUMBER || '1'),
    expectedReplicas: parseInt(process.env.ZERO_G_EXPECTED_REPLICAS || '3')
};
const validateZeroGConfig = () => {
    if (!exports.zeroGConfig.rpcUrl) {
        throw new Error('ZERO_G_RPC_URL is required');
    }
    if (!exports.zeroGConfig.indexerRpc) {
        throw new Error('ZERO_G_INDEXER_RPC is required');
    }
    if (!exports.zeroGConfig.privateKey || exports.zeroGConfig.privateKey === 'your_private_key_here') {
        console.warn('⚠️  ZERO_G_PRIVATE_KEY is not configured properly. Upload operations will not work.');
        console.warn('📝 Please set a valid private key with 0G testnet tokens in your .env file');
        console.warn('💡 You can get testnet tokens from the 0G faucet');
    }
    if (!exports.zeroGConfig.kvNodeUrl) {
        throw new Error('ZERO_G_KV_NODE_URL is required');
    }
};
exports.validateZeroGConfig = validateZeroGConfig;
//# sourceMappingURL=zeroG.js.map