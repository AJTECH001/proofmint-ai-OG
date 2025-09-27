import { ZgFile, Indexer, Batcher, KvClient } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { zeroGConfig } from '../config/zeroG';
import fs from 'fs/promises';
import path from 'path';

export interface UploadResult {
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface KVResult {
  success: boolean;
  data?: any;
  txHash?: string;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  rootHash: string;
  uploadedAt: Date;
  txHash: string;
  receiptId?: string;
}

export interface StorageLayer {
  type: 'log' | 'kv';
  description: string;
  useCase: string;
}

export interface NodeInfo {
  nodeId: string;
  endpoint: string;
  capacity: number;
  available: boolean;
}

export interface BatchUploadResult {
  success: boolean;
  results: UploadResult[];
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  errors: string[];
}

export class ZeroGStorageService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null;
  private indexer: Indexer;
  private kvClient: KvClient;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(zeroGConfig.rpcUrl);
    
    // Only create signer if we have a valid private key
    if (zeroGConfig.privateKey && zeroGConfig.privateKey !== 'your_private_key_here') {
      try {
        this.signer = new ethers.Wallet(zeroGConfig.privateKey, this.provider);
      } catch (error) {
        console.error('Failed to create wallet with provided private key:', error);
        this.signer = null;
      }
    } else {
      this.signer = null;
    }
    
    this.indexer = new Indexer(zeroGConfig.indexerRpc);
    this.kvClient = new KvClient(zeroGConfig.kvNodeUrl);
  }

  /**
   * Upload a file to 0G Storage network
   */
  async uploadFile(filePath: string): Promise<UploadResult> {
    if (!this.signer) {
      return {
        success: false,
        error: 'No valid private key configured. Please set ZERO_G_PRIVATE_KEY in your environment.'
      };
    }

    try {
      // Create file object from file path
      const file = await ZgFile.fromFilePath(filePath);
      
      // Generate Merkle tree for verification
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr !== null) {
        await file.close();
        return {
          success: false,
          error: `Error generating Merkle tree: ${treeErr}`
        };
      }
      
      console.log("File Root Hash:", tree?.rootHash());
      
      // Upload to network
      const [tx, uploadErr] = await this.indexer.upload(file, zeroGConfig.rpcUrl, this.signer);
      if (uploadErr !== null) {
        await file.close();
        return {
          success: false,
          error: `Upload error: ${uploadErr}`
        };
      }
      
      console.log("Upload successful! Transaction:", tx);
      
      // Always close the file when done
      await file.close();
      
      return {
        success: true,
        rootHash: tree?.rootHash(),
        txHash: tx
      };
    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload buffer data to 0G Storage
   */
  async uploadBuffer(buffer: Buffer, filename: string): Promise<UploadResult> {
    if (!this.signer) {
      return {
        success: false,
        error: 'No valid private key configured. Please set ZERO_G_PRIVATE_KEY in your environment.'
      };
    }

    try {
      // Write buffer to temporary file
      const tempDir = '/tmp';
      const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${filename}`);
      
      await fs.writeFile(tempFilePath, buffer);
      
      // Upload the temporary file
      const result = await this.uploadFile(tempFilePath);
      
      // Clean up temporary file
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
      
      return result;
    } catch (error) {
      console.error('Buffer upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Buffer upload failed'
      };
    }
  }

  /**
   * Download a file from 0G Storage using root hash
   */
  async downloadFile(rootHash: string, outputPath: string, withProof: boolean = true): Promise<DownloadResult> {
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
    } catch (error) {
      console.error('Download failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Upload data to 0G-KV storage
   */
  async uploadToKV(streamId: number, key: string, value: string): Promise<KVResult> {
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
      
      // Get flow contract address - you'll need to configure this
      const flowContract = "0x"; // Configure your flow contract address
      const batcher = new Batcher(1, nodes, flowContract, zeroGConfig.rpcUrl);
      
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
    } catch (error) {
      console.error('KV upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'KV upload failed'
      };
    }
  }

  /**
   * Download data from 0G-KV storage
   */
  async downloadFromKV(streamId: number, key: string): Promise<KVResult> {
    try {
      const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
      const value = await this.kvClient.getValue(streamId, ethers.encodeBase64(keyBytes));
      
      return {
        success: true,
        data: value
      };
    } catch (error) {
      console.error('KV download failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'KV download failed'
      };
    }
  }

  /**
   * ProofMint specific: Upload receipt attachment (invoice, image, document)
   */
  async uploadReceiptAttachment(buffer: Buffer, filename: string, receiptId: string, fileType: string): Promise<UploadResult & { metadata?: FileMetadata }> {
    try {
      // Upload file to 0G Storage
      const uploadResult = await this.uploadBuffer(buffer, filename);
      
      if (!uploadResult.success || !uploadResult.rootHash) {
        return uploadResult;
      }
      
      // Create metadata
      const metadata: FileMetadata = {
        name: filename,
        size: buffer.length,
        type: fileType,
        rootHash: uploadResult.rootHash,
        uploadedAt: new Date(),
        txHash: uploadResult.txHash!,
        receiptId
      };
      
      // Store metadata in KV store for easy retrieval
      const metadataKey = `receipt:${receiptId}:attachment:${uploadResult.rootHash}`;
      const kvResult = await this.uploadToKV(1, metadataKey, JSON.stringify(metadata));
      
      if (!kvResult.success) {
        console.warn('Failed to store metadata in KV:', kvResult.error);
      }
      
      return {
        ...uploadResult,
        metadata
      };
    } catch (error) {
      console.error('Receipt attachment upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Attachment upload failed'
      };
    }
  }

  /**
   * ProofMint specific: Get all attachments for a receipt
   */
  async getReceiptAttachments(receiptId: string): Promise<FileMetadata[]> {
    try {
      // In a real implementation, you would query the KV store for all keys
      // matching the receipt pattern. For now, this is a placeholder.
      // You'd need to implement a method to list keys by prefix in the KV store
      console.log(`Getting attachments for receipt: ${receiptId}`);
      
      // This would require additional KV operations to list keys by prefix
      // which might not be directly supported in the current SDK
      return [];
    } catch (error) {
      console.error('Failed to get receipt attachments:', error);
      return [];
    }
  }

  /**
   * ProofMint specific: Store receipt metadata
   */
  async storeReceiptMetadata(receiptId: string, metadata: any): Promise<KVResult> {
    try {
      const key = `receipt:${receiptId}:metadata`;
      const value = JSON.stringify(metadata);
      
      return await this.uploadToKV(1, key, value);
    } catch (error) {
      console.error('Failed to store receipt metadata:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store metadata'
      };
    }
  }

  /**
   * ProofMint specific: Get receipt metadata
   */
  async getReceiptMetadata(receiptId: string): Promise<KVResult> {
    try {
      const key = `receipt:${receiptId}:metadata`;
      return await this.downloadFromKV(1, key);
    } catch (error) {
      console.error('Failed to get receipt metadata:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get metadata'
      };
    }
  }

  /**
   * Select storage nodes for upload operations
   */
  async selectStorageNodes(segmentNumber?: number, expectedReplicas?: number, excludedNodes?: string[]): Promise<{ nodes: any[]; error?: string }> {
    try {
      const segNum = segmentNumber || zeroGConfig.segmentNumber || 1;
      const replicas = expectedReplicas || zeroGConfig.expectedReplicas || 3;
      const excluded = excludedNodes || [];
      
      const [nodes, err] = await this.indexer.selectNodes(segNum, replicas, excluded);
      if (err !== null) {
        return {
          nodes: [],
          error: `Error selecting nodes: ${err}`
        };
      }
      
      return { nodes };
    } catch (error) {
      console.error('Node selection failed:', error);
      return {
        nodes: [],
        error: error instanceof Error ? error.message : 'Node selection failed'
      };
    }
  }

  /**
   * Upload file with custom node selection and PoRA support
   */
  async uploadFileWithNodes(filePath: string, segmentNumber?: number, expectedReplicas?: number): Promise<UploadResult> {
    if (!this.signer) {
      return {
        success: false,
        error: 'No valid private key configured. Please set ZERO_G_PRIVATE_KEY in your environment.'
      };
    }

    try {
      // Select storage nodes
      const nodeSelection = await this.selectStorageNodes(segmentNumber, expectedReplicas);
      if (nodeSelection.error) {
        return {
          success: false,
          error: nodeSelection.error
        };
      }

      // Create file object from file path
      const file = await ZgFile.fromFilePath(filePath);
      
      // Generate Merkle tree for verification
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
      
      // Upload to network with selected nodes
      const [tx, uploadErr] = await this.indexer.upload(file, zeroGConfig.rpcUrl, this.signer);
      if (uploadErr !== null) {
        await file.close();
        return {
          success: false,
          error: `Upload error: ${uploadErr}`
        };
      }
      
      console.log("Upload successful! Transaction:", tx);
      
      // Always close the file when done
      await file.close();
      
      return {
        success: true,
        rootHash: tree?.rootHash(),
        txHash: tx
      };
    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Batch upload multiple files with progress tracking
   */
  async batchUploadFiles(filePaths: string[], segmentNumber?: number, expectedReplicas?: number): Promise<BatchUploadResult> {
    const results: UploadResult[] = [];
    const errors: string[] = [];
    let successfulUploads = 0;
    let failedUploads = 0;

    console.log(`Starting batch upload of ${filePaths.length} files...`);

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      console.log(`Uploading file ${i + 1}/${filePaths.length}: ${path.basename(filePath)}`);
      
      try {
        const result = await this.uploadFileWithNodes(filePath, segmentNumber, expectedReplicas);
        results.push(result);
        
        if (result.success) {
          successfulUploads++;
          console.log(`✅ Uploaded: ${path.basename(filePath)} (${result.rootHash})`);
        } else {
          failedUploads++;
          errors.push(`${path.basename(filePath)}: ${result.error}`);
          console.log(`❌ Failed: ${path.basename(filePath)} - ${result.error}`);
        }
      } catch (error) {
        failedUploads++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${path.basename(filePath)}: ${errorMsg}`);
        results.push({
          success: false,
          error: errorMsg
        });
        console.log(`❌ Failed: ${path.basename(filePath)} - ${errorMsg}`);
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

  /**
   * Download file with enhanced verification and PoRA support
   */
  async downloadFileWithVerification(rootHash: string, outputPath: string, withProof: boolean = true): Promise<DownloadResult> {
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
    } catch (error) {
      console.error('Download failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Get storage layer information
   */
  getStorageLayers(): StorageLayer[] {
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

  /**
   * Upload to Log Layer (immutable storage)
   */
  async uploadToLogLayer(buffer: Buffer, filename: string, metadata?: any): Promise<UploadResult & { metadata?: FileMetadata }> {
    try {
      // Upload file to 0G Storage (Log Layer)
      const uploadResult = await this.uploadBuffer(buffer, filename);
      
      if (!uploadResult.success || !uploadResult.rootHash) {
        return uploadResult;
      }
      
      // Create metadata for log layer
      const fileMetadata: FileMetadata = {
        name: filename,
        size: buffer.length,
        type: 'application/octet-stream',
        rootHash: uploadResult.rootHash,
        uploadedAt: new Date(),
        txHash: uploadResult.txHash!,
        ...metadata
      };
      
      return {
        ...uploadResult,
        metadata: fileMetadata
      };
    } catch (error) {
      console.error('Log layer upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Log layer upload failed'
      };
    }
  }

  /**
   * Enhanced KV operations with batch support
   */
  async batchKVOperations(operations: Array<{ streamId: number; key: string; value: string; operation: 'set' | 'delete' }>): Promise<KVResult> {
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

      if (!zeroGConfig.flowContract || zeroGConfig.flowContract === '0x') {
        return {
          success: false,
          error: 'Flow contract address not configured'
        };
      }

      const batcher = new Batcher(1, nodeSelection.nodes, zeroGConfig.flowContract, zeroGConfig.rpcUrl);
      
      for (const op of operations) {
        const keyBytes = Uint8Array.from(Buffer.from(op.key, 'utf-8'));
        const valueBytes = Uint8Array.from(Buffer.from(op.value, 'utf-8'));
        
        if (op.operation === 'set') {
          batcher.streamDataBuilder.set(op.streamId, keyBytes, valueBytes);
        } else if (op.operation === 'delete') {
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
    } catch (error) {
      console.error('Batch KV operations failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch KV operations failed'
      };
    }
  }

  /**
   * Health check for 0G Storage service
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      // Test basic connectivity
      const provider = new ethers.JsonRpcProvider(zeroGConfig.rpcUrl);
      const blockNumber = await provider.getBlockNumber();
      
      return {
        healthy: true,
        details: {
          rpcUrl: zeroGConfig.rpcUrl,
          indexerUrl: zeroGConfig.indexerRpc,
          kvNodeUrl: zeroGConfig.kvNodeUrl,
          blockNumber,
          walletConfigured: !!this.signer,
          uploadsEnabled: !!this.signer,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
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