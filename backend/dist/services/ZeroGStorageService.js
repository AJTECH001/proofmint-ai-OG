"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeroGStorageService = void 0;
const _0g_ts_sdk_1 = require("@0glabs/0g-ts-sdk");
const ethers_1 = require("ethers");
const zeroG_1 = require("../config/zeroG");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class ZeroGStorageService {
    provider;
    signer;
    indexer;
    kvClient;
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(zeroG_1.zeroGConfig.rpcUrl);
        if (zeroG_1.zeroGConfig.privateKey && zeroG_1.zeroGConfig.privateKey !== 'your_private_key_here') {
            try {
                this.signer = new ethers_1.ethers.Wallet(zeroG_1.zeroGConfig.privateKey, this.provider);
            }
            catch (error) {
                console.error('Failed to create wallet with provided private key:', error);
                this.signer = null;
            }
        }
        else {
            this.signer = null;
        }
        this.indexer = new _0g_ts_sdk_1.Indexer(zeroG_1.zeroGConfig.indexerRpc);
        this.kvClient = new _0g_ts_sdk_1.KvClient(zeroG_1.zeroGConfig.kvNodeUrl);
    }
    async uploadFile(filePath) {
        if (!this.signer) {
            return {
                success: false,
                error: 'No valid private key configured. Please set ZERO_G_PRIVATE_KEY in your environment.'
            };
        }
        try {
            const file = await _0g_ts_sdk_1.ZgFile.fromFilePath(filePath);
            const [tree, treeErr] = await file.merkleTree();
            if (treeErr !== null) {
                await file.close();
                return {
                    success: false,
                    error: `Error generating Merkle tree: ${treeErr}`
                };
            }
            console.log("File Root Hash:", tree?.rootHash());
            const [tx, uploadErr] = await this.indexer.upload(file, zeroG_1.zeroGConfig.rpcUrl, this.signer);
            if (uploadErr !== null) {
                await file.close();
                return {
                    success: false,
                    error: `Upload error: ${uploadErr}`
                };
            }
            console.log("Upload successful! Transaction:", tx);
            await file.close();
            return {
                success: true,
                rootHash: tree?.rootHash(),
                txHash: tx
            };
        }
        catch (error) {
            console.error('Upload failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed'
            };
        }
    }
    async uploadBuffer(buffer, filename) {
        if (!this.signer) {
            return {
                success: false,
                error: 'No valid private key configured. Please set ZERO_G_PRIVATE_KEY in your environment.'
            };
        }
        try {
            const tempDir = '/tmp';
            const tempFilePath = path_1.default.join(tempDir, `temp_${Date.now()}_${filename}`);
            await promises_1.default.writeFile(tempFilePath, buffer);
            const result = await this.uploadFile(tempFilePath);
            try {
                await promises_1.default.unlink(tempFilePath);
            }
            catch (cleanupError) {
                console.warn('Failed to cleanup temp file:', cleanupError);
            }
            return result;
        }
        catch (error) {
            console.error('Buffer upload failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Buffer upload failed'
            };
        }
    }
    async downloadFile(rootHash, outputPath, withProof = true) {
        try {
            const err = await this.indexer.download(rootHash, outputPath, withProof);
            if (err !== null) {
                return {
                    success: false,
                    error: `Download error: ${err}`
                };
            }
            console.log("Download successful!");
            return {
                success: true,
                filePath: outputPath
            };
        }
        catch (error) {
            console.error('Download failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Download failed'
            };
        }
    }
    async uploadToKV(streamId, key, value) {
        if (!this.signer) {
            return {
                success: false,
                error: 'No valid private key configured. Please set ZERO_G_PRIVATE_KEY in your environment.'
            };
        }
        try {
            const [nodes, err] = await this.indexer.selectNodes(1);
            if (err !== null) {
                return {
                    success: false,
                    error: `Error selecting nodes: ${err}`
                };
            }
            const flowContract = "0x";
            const batcher = new _0g_ts_sdk_1.Batcher(1, nodes, flowContract, zeroG_1.zeroGConfig.rpcUrl);
            const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
            const valueBytes = Uint8Array.from(Buffer.from(value, 'utf-8'));
            batcher.streamDataBuilder.set(streamId, keyBytes, valueBytes);
            const [tx, batchErr] = await batcher.exec();
            if (batchErr !== null) {
                return {
                    success: false,
                    error: `Batch execution error: ${batchErr}`
                };
            }
            console.log("KV upload successful! TX:", tx);
            return {
                success: true,
                txHash: tx
            };
        }
        catch (error) {
            console.error('KV upload failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'KV upload failed'
            };
        }
    }
    async downloadFromKV(streamId, key) {
        try {
            const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
            const value = await this.kvClient.getValue(streamId, ethers_1.ethers.encodeBase64(keyBytes));
            return {
                success: true,
                data: value
            };
        }
        catch (error) {
            console.error('KV download failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'KV download failed'
            };
        }
    }
    async uploadReceiptAttachment(buffer, filename, receiptId, fileType) {
        try {
            const uploadResult = await this.uploadBuffer(buffer, filename);
            if (!uploadResult.success || !uploadResult.rootHash) {
                return uploadResult;
            }
            const metadata = {
                name: filename,
                size: buffer.length,
                type: fileType,
                rootHash: uploadResult.rootHash,
                uploadedAt: new Date(),
                txHash: uploadResult.txHash,
                receiptId
            };
            const metadataKey = `receipt:${receiptId}:attachment:${uploadResult.rootHash}`;
            const kvResult = await this.uploadToKV(1, metadataKey, JSON.stringify(metadata));
            if (!kvResult.success) {
                console.warn('Failed to store metadata in KV:', kvResult.error);
            }
            return {
                ...uploadResult,
                metadata
            };
        }
        catch (error) {
            console.error('Receipt attachment upload failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Attachment upload failed'
            };
        }
    }
    async getReceiptAttachments(receiptId) {
        try {
            console.log(`Getting attachments for receipt: ${receiptId}`);
            return [];
        }
        catch (error) {
            console.error('Failed to get receipt attachments:', error);
            return [];
        }
    }
    async storeReceiptMetadata(receiptId, metadata) {
        try {
            const key = `receipt:${receiptId}:metadata`;
            const value = JSON.stringify(metadata);
            return await this.uploadToKV(1, key, value);
        }
        catch (error) {
            console.error('Failed to store receipt metadata:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to store metadata'
            };
        }
    }
    async getReceiptMetadata(receiptId) {
        try {
            const key = `receipt:${receiptId}:metadata`;
            return await this.downloadFromKV(1, key);
        }
        catch (error) {
            console.error('Failed to get receipt metadata:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get metadata'
            };
        }
    }
    async selectStorageNodes(segmentNumber, expectedReplicas, excludedNodes) {
        try {
            const segNum = segmentNumber || zeroG_1.zeroGConfig.segmentNumber || 1;
            const replicas = expectedReplicas || zeroG_1.zeroGConfig.expectedReplicas || 3;
            const excluded = excludedNodes || [];
            const [nodes, err] = await this.indexer.selectNodes(segNum, replicas, excluded);
            if (err !== null) {
                return {
                    nodes: [],
                    error: `Error selecting nodes: ${err}`
                };
            }
            return { nodes };
        }
        catch (error) {
            console.error('Node selection failed:', error);
            return {
                nodes: [],
                error: error instanceof Error ? error.message : 'Node selection failed'
            };
        }
    }
    async uploadFileWithNodes(filePath, segmentNumber, expectedReplicas) {
        if (!this.signer) {
            return {
                success: false,
                error: 'No valid private key configured. Please set ZERO_G_PRIVATE_KEY in your environment.'
            };
        }
        try {
            const nodeSelection = await this.selectStorageNodes(segmentNumber, expectedReplicas);
            if (nodeSelection.error) {
                return {
                    success: false,
                    error: nodeSelection.error
                };
            }
            const file = await _0g_ts_sdk_1.ZgFile.fromFilePath(filePath);
            const [tree, treeErr] = await file.merkleTree();
            if (treeErr !== null) {
                await file.close();
                return {
                    success: false,
                    error: `Error generating Merkle tree: ${treeErr}`
                };
            }
            console.log("File Root Hash:", tree?.rootHash());
            console.log("Selected Nodes:", nodeSelection.nodes.length);
            const [tx, uploadErr] = await this.indexer.upload(file, zeroG_1.zeroGConfig.rpcUrl, this.signer);
            if (uploadErr !== null) {
                await file.close();
                return {
                    success: false,
                    error: `Upload error: ${uploadErr}`
                };
            }
            console.log("Upload successful! Transaction:", tx);
            await file.close();
            return {
                success: true,
                rootHash: tree?.rootHash(),
                txHash: tx
            };
        }
        catch (error) {
            console.error('Upload failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed'
            };
        }
    }
    async batchUploadFiles(filePaths, segmentNumber, expectedReplicas) {
        const results = [];
        const errors = [];
        let successfulUploads = 0;
        let failedUploads = 0;
        console.log(`Starting batch upload of ${filePaths.length} files...`);
        for (let i = 0; i < filePaths.length; i++) {
            const filePath = filePaths[i];
            console.log(`Uploading file ${i + 1}/${filePaths.length}: ${path_1.default.basename(filePath)}`);
            try {
                const result = await this.uploadFileWithNodes(filePath, segmentNumber, expectedReplicas);
                results.push(result);
                if (result.success) {
                    successfulUploads++;
                    console.log(`✅ Uploaded: ${path_1.default.basename(filePath)} (${result.rootHash})`);
                }
                else {
                    failedUploads++;
                    errors.push(`${path_1.default.basename(filePath)}: ${result.error}`);
                    console.log(`❌ Failed: ${path_1.default.basename(filePath)} - ${result.error}`);
                }
            }
            catch (error) {
                failedUploads++;
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${path_1.default.basename(filePath)}: ${errorMsg}`);
                results.push({
                    success: false,
                    error: errorMsg
                });
                console.log(`❌ Failed: ${path_1.default.basename(filePath)} - ${errorMsg}`);
            }
        }
        console.log(`Batch upload completed: ${successfulUploads} successful, ${failedUploads} failed`);
        return {
            success: failedUploads === 0,
            results,
            totalFiles: filePaths.length,
            successfulUploads,
            failedUploads,
            errors
        };
    }
    async downloadFileWithVerification(rootHash, outputPath, withProof = true) {
        try {
            console.log(`Downloading file with root hash: ${rootHash}`);
            console.log(`Proof verification: ${withProof ? 'enabled' : 'disabled'}`);
            const err = await this.indexer.download(rootHash, outputPath, withProof);
            if (err !== null) {
                return {
                    success: false,
                    error: `Download error: ${err}`
                };
            }
            console.log("Download successful with verification!");
            return {
                success: true,
                filePath: outputPath
            };
        }
        catch (error) {
            console.error('Download failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Download failed'
            };
        }
    }
    getStorageLayers() {
        return [
            {
                type: 'log',
                description: 'Immutable storage for AI training data, archives, backups',
                useCase: 'ML datasets, video/image archives, blockchain history, large file storage'
            },
            {
                type: 'kv',
                description: 'Mutable storage for databases, dynamic content, state storage',
                useCase: 'On-chain databases, user profiles, game state, collaborative documents'
            }
        ];
    }
    async uploadToLogLayer(buffer, filename, metadata) {
        try {
            const uploadResult = await this.uploadBuffer(buffer, filename);
            if (!uploadResult.success || !uploadResult.rootHash) {
                return uploadResult;
            }
            const fileMetadata = {
                name: filename,
                size: buffer.length,
                type: 'application/octet-stream',
                rootHash: uploadResult.rootHash,
                uploadedAt: new Date(),
                txHash: uploadResult.txHash,
                ...metadata
            };
            return {
                ...uploadResult,
                metadata: fileMetadata
            };
        }
        catch (error) {
            console.error('Log layer upload failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Log layer upload failed'
            };
        }
    }
    async batchKVOperations(operations) {
        if (!this.signer) {
            return {
                success: false,
                error: 'No valid private key configured. Please set ZERO_G_PRIVATE_KEY in your environment.'
            };
        }
        try {
            const nodeSelection = await this.selectStorageNodes();
            if (nodeSelection.error) {
                return {
                    success: false,
                    error: nodeSelection.error
                };
            }
            if (!zeroG_1.zeroGConfig.flowContract || zeroG_1.zeroGConfig.flowContract === '0x') {
                return {
                    success: false,
                    error: 'Flow contract address not configured'
                };
            }
            const batcher = new _0g_ts_sdk_1.Batcher(1, nodeSelection.nodes, zeroG_1.zeroGConfig.flowContract, zeroG_1.zeroGConfig.rpcUrl);
            for (const op of operations) {
                const keyBytes = Uint8Array.from(Buffer.from(op.key, 'utf-8'));
                const valueBytes = Uint8Array.from(Buffer.from(op.value, 'utf-8'));
                if (op.operation === 'set') {
                    batcher.streamDataBuilder.set(op.streamId, keyBytes, valueBytes);
                }
                else if (op.operation === 'delete') {
                    batcher.streamDataBuilder.delete(op.streamId, keyBytes);
                }
            }
            const [tx, batchErr] = await batcher.exec();
            if (batchErr !== null) {
                return {
                    success: false,
                    error: `Batch execution error: ${batchErr}`
                };
            }
            console.log("Batch KV operations successful! TX:", tx);
            return {
                success: true,
                txHash: tx
            };
        }
        catch (error) {
            console.error('Batch KV operations failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Batch KV operations failed'
            };
        }
    }
    async healthCheck() {
        try {
            const provider = new ethers_1.ethers.JsonRpcProvider(zeroG_1.zeroGConfig.rpcUrl);
            const blockNumber = await provider.getBlockNumber();
            return {
                healthy: true,
                details: {
                    rpcUrl: zeroG_1.zeroGConfig.rpcUrl,
                    indexerUrl: zeroG_1.zeroGConfig.indexerRpc,
                    kvNodeUrl: zeroG_1.zeroGConfig.kvNodeUrl,
                    blockNumber,
                    walletConfigured: !!this.signer,
                    uploadsEnabled: !!this.signer,
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            return {
                healthy: false,
                details: {
                    error: error instanceof Error ? error.message : 'Health check failed',
                    walletConfigured: !!this.signer,
                    uploadsEnabled: false,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
}
exports.ZeroGStorageService = ZeroGStorageService;
//# sourceMappingURL=ZeroGStorageService.js.map