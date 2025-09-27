import axios from 'axios';

// Enhanced types for 0G DA integration
export interface DABlobData {
  receiptId: string;
  metadata: {
    device: {
      type: string;
      brand: string;
      model: string;
      serialNumber?: string;
      imei?: string;
      macAddress?: string;
    };
    purchase: {
      date: string;
      price: number;
      currency: string;
      merchant: string;
      merchantAddress: string;
      location: string;
      paymentMethod: string;
      transactionHash?: string;
    };
    warranty: {
      duration: string;
      terms: string;
      provider: string;
      expirationDate: string;
      coverage: string[];
      claimProcess: string;
    };
    sustainability: {
      recyclingProgram: boolean;
      carbonFootprint: string;
      ecoRating: string;
      recyclabilityScore: number;
      materials: string[];
      disposalInstructions: string;
    };
    technical: {
      specifications: Record<string, any>;
      firmwareVersion?: string;
      accessories: string[];
      compatibility: string[];
    };
  };
  proofs: {
    purchaseProof: string;
    authenticityProof: string;
    ownershipChain: string[];
    verificationHash: string;
  };
  attachments: {
    images: string[];
    documents: string[];
    certificates: string[];
  };
  lifecycle: {
    status: 'active' | 'stolen' | 'misplaced' | 'recycled' | 'disposed';
    statusHistory: Array<{
      status: string;
      timestamp: string;
      reason?: string;
      location?: string;
    }>;
    transfers: Array<{
      from: string;
      to: string;
      timestamp: string;
      transactionHash: string;
    }>;
  };
  timestamps: {
    created: string;
    lastModified: string;
    lastAccessed: string;
  };
}

export interface DACommitment {
  commitment: string;
  blobHash: string;
  dataSize: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'finalized';
  batchId?: string;
  quorumId?: number;
}

export interface DANodeStatus {
  isConnected: boolean;
  nodeVersion: string;
  networkId: string;
  blockHeight: number;
  peerCount: number;
  syncStatus: 'synced' | 'syncing' | 'disconnected';
  encoderStatus: 'online' | 'offline';
  retrieverStatus: 'online' | 'offline';
}

export interface DASubmissionResult {
  success: boolean;
  commitment?: string;
  blobHash?: string;
  batchId?: string;
  error?: string;
  gasUsed?: number;
  cost?: string;
  estimatedFinalization?: string;
}

export interface DARetrievalResult {
  success: boolean;
  data?: DABlobData;
  error?: string;
  retrievalTime?: number;
  verified?: boolean;
  commitment?: string;
}

export interface DAAnalytics {
  totalSubmissions: number;
  totalRetrievals: number;
  averageSubmissionTime: number;
  averageRetrievalTime: number;
  successRate: number;
  totalCost: string;
  networkHealth: number;
  last24Hours: {
    submissions: number;
    retrievals: number;
    errors: number;
  };
}

export interface CostEstimate {
  cost: string;
  gasEstimate: number;
  dataSize: number;
}

export interface BatchSubmissionResult {
  success: boolean;
  results: DASubmissionResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export class ZeroGDAService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/da';
  }

  // Health check
  async healthCheck(): Promise<{ success: boolean; status?: DANodeStatus; error?: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('DA health check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  // Initialize DA service
  async initialize(customConfig?: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/initialize`, customConfig || {});
      return response.data;
    } catch (error) {
      console.error('DA initialization failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      };
    }
  }

  // Submit receipt data to DA
  async submitReceiptData(receiptData: DABlobData): Promise<DASubmissionResult> {
    try {
      const response = await axios.post(`${this.baseUrl}/submit`, receiptData);
      return response.data;
    } catch (error) {
      console.error('DA submission failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Submission failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Submission failed'
      };
    }
  }

  // Batch submit receipt data
  async batchSubmitReceiptData(receipts: DABlobData[]): Promise<BatchSubmissionResult> {
    try {
      const response = await axios.post(`${this.baseUrl}/submit-batch`, { receipts });
      return response.data;
    } catch (error) {
      console.error('DA batch submission failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          results: [],
          summary: { total: receipts.length, successful: 0, failed: receipts.length },
          error: error.response.data?.error || 'Batch submission failed'
        };
      }
      return {
        success: false,
        results: [],
        summary: { total: receipts.length, successful: 0, failed: receipts.length },
        error: error instanceof Error ? error.message : 'Batch submission failed'
      };
    }
  }

  // Retrieve receipt data from DA
  async getReceiptData(commitment: string): Promise<DARetrievalResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/retrieve/${commitment}`);
      return response.data;
    } catch (error) {
      console.error('DA retrieval failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Retrieval failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval failed'
      };
    }
  }

  // Verify data availability
  async verifyDataAvailability(commitment: string): Promise<{ success: boolean; available?: boolean; error?: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/verify/${commitment}`);
      return response.data;
    } catch (error) {
      console.error('DA verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  // Get blob status
  async getBlobStatus(commitment: string): Promise<{ success: boolean; status?: DACommitment; error?: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/status/${commitment}`);
      return response.data;
    } catch (error) {
      console.error('DA status check failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Status check failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  // Estimate cost for data submission
  async estimateCost(dataSize: number): Promise<{ success: boolean; cost?: string; gasEstimate?: number; error?: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/estimate-cost`, { dataSize });
      return response.data;
    } catch (error) {
      console.error('DA cost estimation failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Cost estimation failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cost estimation failed'
      };
    }
  }

  // Get analytics
  async getAnalytics(): Promise<{ success: boolean; analytics?: DAAnalytics; error?: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/analytics`);
      return response.data;
    } catch (error) {
      console.error('DA analytics failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analytics retrieval failed'
      };
    }
  }

  // Create DA-optimized receipt data
  async createReceiptData(
    receiptId: string,
    deviceInfo: any,
    purchaseInfo: any,
    additionalData?: any
  ): Promise<{ success: boolean; receiptData?: DABlobData; error?: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/create-receipt-data`, {
        receiptId,
        deviceInfo,
        purchaseInfo,
        additionalData
      });
      return response.data;
    } catch (error) {
      console.error('DA receipt data creation failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Receipt data creation failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Receipt data creation failed'
      };
    }
  }

  // Upload files and submit to DA
  async uploadAndSubmit(
    files: File[],
    receiptId: string,
    deviceInfo: any,
    purchaseInfo: any,
    additionalData?: any
  ): Promise<DASubmissionResult> {
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('receiptId', receiptId);
      formData.append('deviceInfo', JSON.stringify(deviceInfo));
      formData.append('purchaseInfo', JSON.stringify(purchaseInfo));
      if (additionalData) {
        formData.append('additionalData', JSON.stringify(additionalData));
      }

      const response = await axios.post(`${this.baseUrl}/upload-and-submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 2 minute timeout for file uploads
      });
      
      return response.data;
    } catch (error) {
      console.error('DA upload and submit failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Upload and submission failed'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload and submission failed'
      };
    }
  }

  // Search receipts
  async searchReceipts(query: {
    commitment?: string;
    receiptId?: string;
    status?: string;
  }): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, { params: query });
      return response.data;
    } catch (error) {
      console.error('DA search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  // Helper method to create DA receipt data locally
  static createDAReceiptData(
    receiptId: string,
    deviceInfo: any,
    purchaseInfo: any,
    additionalData?: any
  ): DABlobData {
    const now = new Date().toISOString();
    
    return {
      receiptId,
      metadata: {
        device: {
          type: deviceInfo.type || 'unknown',
          brand: deviceInfo.brand || 'unknown',
          model: deviceInfo.model || 'unknown',
          serialNumber: deviceInfo.serialNumber,
          imei: deviceInfo.imei,
          macAddress: deviceInfo.macAddress
        },
        purchase: {
          date: purchaseInfo.date || now,
          price: purchaseInfo.price || 0,
          currency: purchaseInfo.currency || 'USD',
          merchant: purchaseInfo.merchant || 'unknown',
          merchantAddress: purchaseInfo.merchantAddress || '0x0000000000000000000000000000000000000000',
          location: purchaseInfo.location || 'unknown',
          paymentMethod: purchaseInfo.paymentMethod || 'crypto',
          transactionHash: purchaseInfo.transactionHash
        },
        warranty: {
          duration: additionalData?.warranty?.duration || '1 year',
          terms: additionalData?.warranty?.terms || 'standard',
          provider: additionalData?.warranty?.provider || 'manufacturer',
          expirationDate: additionalData?.warranty?.expirationDate || 
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          coverage: additionalData?.warranty?.coverage || ['manufacturing defects'],
          claimProcess: additionalData?.warranty?.claimProcess || 'contact manufacturer'
        },
        sustainability: {
          recyclingProgram: additionalData?.sustainability?.recyclingProgram || false,
          carbonFootprint: additionalData?.sustainability?.carbonFootprint || '4.2kg CO2eq',
          ecoRating: additionalData?.sustainability?.ecoRating || 'A',
          recyclabilityScore: additionalData?.sustainability?.recyclabilityScore || 85,
          materials: additionalData?.sustainability?.materials || ['aluminum', 'glass', 'plastic'],
          disposalInstructions: additionalData?.sustainability?.disposalInstructions || 'Take to certified e-waste facility'
        },
        technical: {
          specifications: additionalData?.technical?.specifications || {},
          firmwareVersion: additionalData?.technical?.firmwareVersion,
          accessories: additionalData?.technical?.accessories || [],
          compatibility: additionalData?.technical?.compatibility || []
        }
      },
      proofs: {
        purchaseProof: additionalData?.proofs?.purchaseProof || '',
        authenticityProof: additionalData?.proofs?.authenticityProof || '',
        ownershipChain: additionalData?.proofs?.ownershipChain || [purchaseInfo.merchantAddress || '0x0000000000000000000000000000000000000000'],
        verificationHash: additionalData?.proofs?.verificationHash || `hash_${receiptId}_${Date.now()}`
      },
      attachments: {
        images: additionalData?.attachments?.images || [],
        documents: additionalData?.attachments?.documents || [],
        certificates: additionalData?.attachments?.certificates || []
      },
      lifecycle: {
        status: 'active',
        statusHistory: [
          {
            status: 'active',
            timestamp: now,
            reason: 'Initial purchase'
          }
        ],
        transfers: []
      },
      timestamps: {
        created: now,
        lastModified: now,
        lastAccessed: now
      }
    };
  }
}

// Singleton instance
export const zeroGDAService = new ZeroGDAService();