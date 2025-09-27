import axios from 'axios';

export interface UploadResponse {
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
  filename?: string;
  size?: number;
  type?: string;
}

export interface DownloadResponse {
  success: boolean;
  data?: Blob;
  error?: string;
}

export interface KVWriteResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface KVReadResponse {
  success: boolean;
  data?: any;
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

export interface MultipleUploadResponse {
  success: boolean;
  uploads: UploadResponse[];
  total: number;
  successful: number;
  failed: number;
}

export interface BatchUploadResponse {
  success: boolean;
  results: UploadResponse[];
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  errors: string[];
}

export interface NodeSelectionResponse {
  success: boolean;
  nodes: any[];
  count: number;
  error?: string;
}

export interface StorageLayer {
  type: 'log' | 'kv';
  description: string;
  useCase: string;
}

export interface StorageLayersResponse {
  success: boolean;
  layers: StorageLayer[];
  count: number;
}

export interface BatchKVOperation {
  streamId: number;
  key: string;
  value: string;
  operation: 'set' | 'delete';
}

export interface BatchKVResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

export class ZeroGStorageService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001/api/storage') {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload a file to 0G Storage network
   */
  async uploadFile(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${this.baseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 second timeout for large files
      });

      return response.data;
    } catch (error) {
      console.error('Upload failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Upload failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload multiple files to 0G Storage network
   */
  async uploadMultipleFiles(files: File[]): Promise<MultipleUploadResponse> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post(`${this.baseUrl}/upload-multiple`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 2 minute timeout for multiple files
      });

      return response.data;
    } catch (error) {
      console.error('Multiple upload failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          uploads: [],
          total: 0,
          successful: 0,
          failed: files.length,
          error: error.response.data?.error || 'Multiple upload failed'
        } as any;
      }
      return {
        success: false,
        uploads: [],
        total: 0,
        successful: 0,
        failed: files.length,
        error: error instanceof Error ? error.message : 'Multiple upload failed'
      } as any;
    }
  }

  /**
   * Download a file from 0G Storage using root hash
   */
  async downloadFile(rootHash: string, filename?: string): Promise<DownloadResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/download/${rootHash}`, {
        params: filename ? { filename } : {},
        responseType: 'blob',
        timeout: 60000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Download failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Download failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Download file with cryptographic proof verification (same as downloadFile - verification handled by backend)
   */
  async downloadFileWithProof(rootHash: string, filename?: string): Promise<DownloadResponse> {
    // Backend handles proof verification by default
    return this.downloadFile(rootHash, filename);
  }

  /**
   * Write key-value pairs to 0G Storage KV store
   */
  async writeKV(streamId: number, key: string, value: string): Promise<KVWriteResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/kv`, {
        streamId,
        key,
        value
      });

      return response.data;
    } catch (error) {
      console.error('KV write failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'KV write failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'KV write failed'
      };
    }
  }

  /**
   * Read key-value pairs from 0G Storage KV store
   */
  async readKV(streamId: number, key: string): Promise<KVReadResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/kv/${streamId}/${key}`);
      return response.data;
    } catch (error) {
      console.error('KV read failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'KV read failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'KV read failed'
      };
    }
  }


  /**
   * Upload receipt attachments (invoices, images, documents)
   */
  async uploadReceiptAttachment(file: File, receiptId: string): Promise<UploadResponse & { metadata?: FileMetadata }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${this.baseUrl}/receipt/${receiptId}/attachment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      });

      return response.data;
    } catch (error) {
      console.error('Receipt attachment upload failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Attachment upload failed'
        };
      }
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
      const response = await axios.get(`${this.baseUrl}/receipt/${receiptId}/attachments`);
      return response.data.attachments || [];
    } catch (error) {
      console.error('Failed to get receipt attachments:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response error:', error.response.data);
      }
      return [];
    }
  }

  /**
   * Store receipt metadata
   */
  async storeReceiptMetadata(receiptId: string, metadata: any): Promise<KVWriteResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/receipt/${receiptId}/metadata`, metadata);
      return response.data;
    } catch (error) {
      console.error('Failed to store receipt metadata:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Failed to store metadata'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store metadata'
      };
    }
  }

  /**
   * Get receipt metadata
   */
  async getReceiptMetadata(receiptId: string): Promise<KVReadResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/receipt/${receiptId}/metadata`);
      return {
        success: true,
        data: response.data.metadata
      };
    } catch (error) {
      console.error('Failed to get receipt metadata:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Failed to get metadata'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get metadata'
      };
    }
  }

  /**
   * Select storage nodes for upload operations
   */
  async selectStorageNodes(segmentNumber?: number, expectedReplicas?: number, excludedNodes?: string[]): Promise<NodeSelectionResponse> {
    try {
      const params = new URLSearchParams();
      if (segmentNumber) params.append('segmentNumber', segmentNumber.toString());
      if (expectedReplicas) params.append('expectedReplicas', expectedReplicas.toString());
      if (excludedNodes) params.append('excludedNodes', excludedNodes.join(','));

      const response = await axios.get(`${this.baseUrl}/nodes/select`, {
        params,
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('Node selection failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          nodes: [],
          count: 0,
          error: error.response.data?.error || 'Node selection failed'
        };
      }
      return {
        success: false,
        nodes: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Node selection failed'
      };
    }
  }

  /**
   * Upload file with enhanced node selection and PoRA support
   */
  async uploadFileEnhanced(file: File, segmentNumber?: number, expectedReplicas?: number): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (segmentNumber) formData.append('segmentNumber', segmentNumber.toString());
      if (expectedReplicas) formData.append('expectedReplicas', expectedReplicas.toString());

      const response = await axios.post(`${this.baseUrl}/upload-enhanced`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 2 minute timeout for enhanced uploads
      });

      return response.data;
    } catch (error) {
      console.error('Enhanced upload failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Enhanced upload failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Enhanced upload failed'
      };
    }
  }

  /**
   * Batch upload multiple files with progress tracking
   */
  async batchUploadFiles(files: File[], segmentNumber?: number, expectedReplicas?: number): Promise<BatchUploadResponse> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      if (segmentNumber) formData.append('segmentNumber', segmentNumber.toString());
      if (expectedReplicas) formData.append('expectedReplicas', expectedReplicas.toString());

      const response = await axios.post(`${this.baseUrl}/upload-batch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000 // 5 minute timeout for batch uploads
      });

      return response.data;
    } catch (error) {
      console.error('Batch upload failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          results: [],
          totalFiles: files.length,
          successfulUploads: 0,
          failedUploads: files.length,
          errors: [error.response.data?.error || 'Batch upload failed']
        };
      }
      return {
        success: false,
        results: [],
        totalFiles: files.length,
        successfulUploads: 0,
        failedUploads: files.length,
        errors: [error instanceof Error ? error.message : 'Batch upload failed']
      };
    }
  }

  /**
   * Download file with enhanced verification
   */
  async downloadFileEnhanced(rootHash: string, filename?: string, withProof: boolean = true): Promise<DownloadResponse> {
    try {
      const params = new URLSearchParams();
      if (filename) params.append('filename', filename);
      params.append('withProof', withProof.toString());

      const response = await axios.get(`${this.baseUrl}/download-enhanced/${rootHash}`, {
        params,
        responseType: 'blob',
        timeout: 120000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Enhanced download failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Enhanced download failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Enhanced download failed'
      };
    }
  }

  /**
   * Upload to Log Layer (immutable storage)
   */
  async uploadToLogLayer(file: File, metadata?: any): Promise<UploadResponse & { metadata?: FileMetadata }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata) formData.append('metadata', JSON.stringify(metadata));

      const response = await axios.post(`${this.baseUrl}/log-layer/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000
      });

      return response.data;
    } catch (error) {
      console.error('Log layer upload failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Log layer upload failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Log layer upload failed'
      };
    }
  }

  /**
   * Batch KV operations
   */
  async batchKVOperations(operations: BatchKVOperation[]): Promise<BatchKVResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/kv/batch`, {
        operations
      }, {
        timeout: 60000
      });

      return response.data;
    } catch (error) {
      console.error('Batch KV operations failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Batch KV operations failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch KV operations failed'
      };
    }
  }

  /**
   * Get storage layers information
   */
  async getStorageLayers(): Promise<StorageLayersResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/layers`, {
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get storage layers:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          layers: [],
          count: 0,
          error: error.response.data?.error || 'Failed to get storage layers'
        } as any;
      }
      return {
        success: false,
        layers: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Failed to get storage layers'
      } as any;
    }
  }

  /**
   * Health check for 0G Storage service
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Health check failed',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

}

// Default service instance
export const zeroGStorageService = new ZeroGStorageService();