import axios from 'axios';

export interface ZeroGStorageConfig {
  rpcUrl: string;
  indexerUrl: string;
  privateKey: string;
  gasLimit?: number;
  gasPrice?: number;
}

export interface UploadResponse {
  success: boolean;
  rootHash?: string;
  transactionHash?: string;
  error?: string;
}

export interface DownloadResponse {
  success: boolean;
  data?: Blob;
  error?: string;
}

export interface KVWriteResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface KVReadResponse {
  success: boolean;
  data?: Record<string, string>;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  rootHash: string;
  uploadedAt: Date;
  transactionHash: string;
}

export class ZeroGStorageService {
  private config: ZeroGStorageConfig;

  constructor(config: ZeroGStorageConfig) {
    this.config = config;
  }

  /**
   * Upload a file to 0G Storage network
   */
  async uploadFile(file: File): Promise<UploadResponse> {
    try {
      // Convert File to FormData for upload
      const formData = new FormData();
      formData.append('file', file);

      // For now, we'll simulate the CLI upload process via HTTP API
      // In a production environment, you would either:
      // 1. Use the 0G Storage SDK/Client directly
      // 2. Make API calls to your backend that handles the CLI commands
      // 3. Use WebAssembly version of the client if available

      const response = await this.makeUploadRequest(formData, file.name);
      
      return {
        success: true,
        rootHash: response.rootHash,
        transactionHash: response.transactionHash
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
   * Download a file from 0G Storage using root hash
   */
  async downloadFile(rootHash: string, filename?: string): Promise<DownloadResponse> {
    try {
      const url = `${this.config.indexerUrl}/file?root=${rootHash}${filename ? `&name=${filename}` : ''}`;
      
      const response = await axios.get(url, {
        responseType: 'blob',
        timeout: 30000
      });

      return {
        success: true,
        data: response.data
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
   * Download file with cryptographic proof verification
   */
  async downloadFileWithProof(rootHash: string, filename?: string): Promise<DownloadResponse> {
    try {
      // This would need to implement the proof verification logic
      // For now, we'll use the regular download and add verification later
      const result = await this.downloadFile(rootHash, filename);
      
      if (result.success && result.data) {
        // TODO: Add proof verification logic here
        // The CLI --proof flag would be equivalent to additional verification
        console.log('Proof verification would be implemented here');
      }

      return result;
    } catch (error) {
      console.error('Verified download failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verified download failed'
      };
    }
  }

  /**
   * Write key-value pairs to 0G Storage KV store
   */
  async writeKV(streamId: number, keyValues: Record<string, string>): Promise<KVWriteResponse> {
    try {
      const keys = Object.keys(keyValues);
      const values = Object.values(keyValues);

      // This would make a request to your backend that executes:
      // 0g-storage-client kv-write --stream-id <streamId> --stream-keys <keys> --stream-values <values>
      const response = await this.makeKVWriteRequest(streamId, keys, values);

      return {
        success: true,
        transactionHash: response.transactionHash
      };
    } catch (error) {
      console.error('KV write failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'KV write failed'
      };
    }
  }

  /**
   * Read key-value pairs from 0G Storage KV store
   */
  async readKV(streamId: number, keys: string[]): Promise<KVReadResponse> {
    try {
      // This would make a request to a KV node endpoint
      const response = await this.makeKVReadRequest(streamId, keys);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('KV read failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'KV read failed'
      };
    }
  }

  /**
   * Get file by transaction sequence number
   */
  async getFileByTxSeq(txSeq: number, filename?: string): Promise<DownloadResponse> {
    try {
      const url = `${this.config.indexerUrl}/file?txSeq=${txSeq}${filename ? `&name=${filename}` : ''}`;
      
      const response = await axios.get(url, {
        responseType: 'blob',
        timeout: 30000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Get file by txSeq failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Get file failed'
      };
    }
  }

  /**
   * Upload receipt attachments (invoices, images, documents)
   */
  async uploadReceiptAttachment(file: File, receiptId: string): Promise<UploadResponse & { metadata?: FileMetadata }> {
    try {
      const uploadResult = await this.uploadFile(file);
      
      if (uploadResult.success && uploadResult.rootHash) {
        const metadata: FileMetadata = {
          name: file.name,
          size: file.size,
          type: file.type,
          rootHash: uploadResult.rootHash,
          uploadedAt: new Date(),
          transactionHash: uploadResult.transactionHash!
        };

        // Store metadata in KV store for easy retrieval
        await this.writeKV(1, {
          [`receipt:${receiptId}:attachment:${uploadResult.rootHash}`]: JSON.stringify(metadata)
        });

        return {
          ...uploadResult,
          metadata
        };
      }

      return uploadResult;
    } catch (error) {
      console.error('Receipt attachment upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Attachment upload failed'
      };
    }
  }

  /**
   * Get all attachments for a receipt
   */
  async getReceiptAttachments(receiptId: string): Promise<FileMetadata[]> {
    try {
      // This would query the KV store for all keys matching the receipt pattern
      // For now, return empty array as this requires backend implementation
      console.log(`Getting attachments for receipt: ${receiptId}`);
      return [];
    } catch (error) {
      console.error('Failed to get receipt attachments:', error);
      return [];
    }
  }

  // Private helper methods that would interact with backend or direct CLI
  private async makeUploadRequest(_formData: FormData, _filename: string) {
    // This would be implemented to call your backend API that executes the CLI command
    // or use a direct SDK if available
    
    // Mock response for now
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time
    
    return {
      rootHash: `0x${Math.random().toString(16).padStart(64, '0')}`,
      transactionHash: `0x${Math.random().toString(16).padStart(64, '0')}`
    };
  }

  private async makeKVWriteRequest(_streamId: number, _keys: string[], _values: string[]) {
    // Mock response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      transactionHash: `0x${Math.random().toString(16).padStart(64, '0')}`
    };
  }

  private async makeKVReadRequest(_streamId: number, keys: string[]) {
    // Mock response
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data: Record<string, string> = {};
    keys.forEach(key => {
      data[key] = `mock_value_for_${key}`;
    });
    
    return { data };
  }
}

// Default configuration for 0G testnet
export const DEFAULT_0G_CONFIG: Omit<ZeroGStorageConfig, 'privateKey'> = {
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  indexerUrl: 'https://indexer-storage-testnet-turbo.0g.ai',
  gasLimit: 3000000,
  gasPrice: 10000000000
};