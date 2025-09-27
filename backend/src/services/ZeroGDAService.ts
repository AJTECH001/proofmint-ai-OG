import axios from 'axios';
import { ethers } from 'ethers';

// 0G DA Configuration
export interface ZeroGDAConfig {
  clientEndpoint: string;
  encoderEndpoint: string;
  retrieverEndpoint: string;
  contractAddress: string;
  chainRpc: string;
  privateKey: string;
  maxBlobSize: number;
  timeout: number;
}

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

export class ZeroGDAService {
  private config: ZeroGDAConfig;
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private isInitialized = false;

  constructor() {
    // Default configuration for 0G DA testnet
    this.config = {
      clientEndpoint: process.env.ZERO_G_DA_CLIENT_ENDPOINT || 'http://localhost:51001',
      encoderEndpoint: process.env.ZERO_G_DA_ENCODER_ENDPOINT || 'http://localhost:34000',
      retrieverEndpoint: process.env.ZERO_G_DA_RETRIEVER_ENDPOINT || 'http://localhost:51002',
      contractAddress: process.env.ZERO_G_DA_CONTRACT_ADDRESS || '0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9',
      chainRpc: process.env.ZERO_G_RPC_URL || 'https://evmrpc-testnet.0g.ai',
      privateKey: process.env.ZERO_G_PRIVATE_KEY || '',
      maxBlobSize: 32505852, // ~31 MB as per 0G DA specs
      timeout: parseInt(process.env.ZERO_G_DA_TIMEOUT || '30000')
    };

    // Initialize provider and signer
    this.provider = new ethers.JsonRpcProvider(this.config.chainRpc);
    if (this.config.privateKey) {
      this.signer = new ethers.Wallet(this.config.privateKey, this.provider);
    }
  }

  async initialize(customConfig?: Partial<ZeroGDAConfig>): Promise<boolean> {
    try {
      if (customConfig) {
        this.config = { ...this.config, ...customConfig };
      }

      // Test connection to all DA nodes
      const status = await this.getNodeStatus();
      
      if (status.isConnected && status.encoderStatus === 'online' && status.retrieverStatus === 'online') {
        this.isInitialized = true;
        console.log('0G DA Service initialized successfully');
        console.log(`Node version: ${status.nodeVersion}`);
        console.log(`Network: ${status.networkId}`);
        console.log(`Block height: ${status.blockHeight}`);
        return true;
      } else {
        throw new Error('Failed to connect to 0G DA nodes');
      }
    } catch (error) {
      console.error('0G DA Service initialization failed:', error);
      return false;
    }
  }

  async getNodeStatus(): Promise<DANodeStatus> {
    try {
      const [clientStatus, encoderStatus, retrieverStatus] = await Promise.allSettled([
        this.checkClientStatus(),
        this.checkEncoderStatus(),
        this.checkRetrieverStatus()
      ]);

      const client = clientStatus.status === 'fulfilled' ? clientStatus.value : null;
      const encoder = encoderStatus.status === 'fulfilled' ? encoderStatus.value : false;
      const retriever = retrieverStatus.status === 'fulfilled' ? retrieverStatus.value : false;

      return {
        isConnected: client !== null,
        nodeVersion: client?.version || 'unknown',
        networkId: client?.networkId || 'unknown',
        blockHeight: client?.blockHeight || 0,
        peerCount: client?.peerCount || 0,
        syncStatus: client?.syncStatus || 'disconnected',
        encoderStatus: encoder ? 'online' : 'offline',
        retrieverStatus: retriever ? 'online' : 'offline'
      };
    } catch (error) {
      console.warn('DA node status check failed:', error);
      return {
        isConnected: false,
        nodeVersion: 'unknown',
        networkId: 'unknown',
        blockHeight: 0,
        peerCount: 0,
        syncStatus: 'disconnected',
        encoderStatus: 'offline',
        retrieverStatus: 'offline'
      };
    }
  }

  private async checkClientStatus(): Promise<any> {
    const response = await axios.get(`${this.config.clientEndpoint}/health`, {
      timeout: this.config.timeout
    });
    return response.data;
  }

  private async checkEncoderStatus(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.encoderEndpoint}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async checkRetrieverStatus(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.retrieverEndpoint}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async submitReceiptData(receiptData: DABlobData): Promise<DASubmissionResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: '0G DA Service not initialized'
      };
    }

    try {
      // Validate data size
      const dataString = JSON.stringify(receiptData);
      const dataSize = new TextEncoder().encode(dataString).length;
      
      if (dataSize > this.config.maxBlobSize) {
        return {
          success: false,
          error: `Data size (${dataSize}) exceeds maximum blob size (${this.config.maxBlobSize})`
        };
      }

      // Convert data to blob format
      const blobData = new TextEncoder().encode(dataString);
      
      // Submit to 0G DA
      const response = await axios.post(
        `${this.config.clientEndpoint}/v1/disperser/disperse_blob`,
        {
          data: Array.from(blobData),
          security_params: [
            {
              quorum_id: 0,
              adversary_threshold: 33,
              confirmation_threshold: 55
            }
          ]
        },
        {
          timeout: this.config.timeout * 2, // Double timeout for submissions
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        const result = response.data;
        
        // Estimate finalization time (typically 20-60 seconds)
        const estimatedFinalization = new Date(Date.now() + 45000).toISOString();
        
        return {
          success: true,
          commitment: result.request_id,
          blobHash: result.blob_hash,
          batchId: result.batch_id,
          gasUsed: result.gas_used,
          cost: result.cost,
          estimatedFinalization
        };
      } else {
        return {
          success: false,
          error: `Submission failed with status: ${response.status}`
        };
      }
    } catch (error) {
      console.error('0G DA submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown submission error'
      };
    }
  }

  async getReceiptData(commitment: string): Promise<DARetrievalResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: '0G DA Service not initialized'
      };
    }

    const startTime = Date.now();

    try {
      // Retrieve data from 0G DA using commitment
      const response = await axios.get(
        `${this.config.retrieverEndpoint}/v1/retriever/retrieve_blob`,
        {
          params: {
            batch_header_hash: commitment,
            blob_index: 0 // Default to first blob
          },
          timeout: this.config.timeout
        }
      );

      if (response.status === 200) {
        const retrievalTime = Date.now() - startTime;
        const blobData = response.data.data;
        
        // Convert blob data back to JSON
        const dataString = new TextDecoder().decode(new Uint8Array(blobData));
        const receiptData: DABlobData = JSON.parse(dataString);

        // Verify data integrity
        const isValid = this.verifyReceiptData(receiptData);

        return {
          success: true,
          data: receiptData,
          retrievalTime,
          verified: isValid,
          commitment
        };
      } else {
        return {
          success: false,
          error: `Retrieval failed with status: ${response.status}`
        };
      }
    } catch (error) {
      console.error('0G DA retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown retrieval error',
        retrievalTime: Date.now() - startTime
      };
    }
  }

  async verifyDataAvailability(commitment: string): Promise<boolean> {
    try {
      // Check if data is available without full retrieval
      const response = await axios.head(
        `${this.config.retrieverEndpoint}/v1/retriever/retrieve_blob`,
        {
          params: {
            batch_header_hash: commitment,
            blob_index: 0
          },
          timeout: 5000 // Quick check
        }
      );

      return response.status === 200;
    } catch (error) {
      console.warn('Data availability check failed:', error);
      return false;
    }
  }

  async getBlobStatus(commitment: string): Promise<DACommitment | null> {
    try {
      const response = await axios.get(
        `${this.config.clientEndpoint}/v1/disperser/blob_status`,
        {
          params: { request_id: commitment },
          timeout: this.config.timeout
        }
      );

      if (response.status === 200) {
        const status = response.data;
        
        return {
          commitment,
          blobHash: status.info?.blob_hash || '',
          dataSize: status.info?.blob_size || 0,
          timestamp: new Date().toISOString(),
          status: this.mapBlobStatus(status.status),
          batchId: status.info?.batch_id,
          quorumId: status.info?.quorum_id
        };
      }
      return null;
    } catch (error) {
      console.error('Blob status check failed:', error);
      return null;
    }
  }

  async batchSubmitReceiptData(receiptDataArray: DABlobData[]): Promise<DASubmissionResult[]> {
    const results: DASubmissionResult[] = [];
    
    // Process submissions in parallel (but limit concurrency)
    const batchSize = 5;
    for (let i = 0; i < receiptDataArray.length; i += batchSize) {
      const batch = receiptDataArray.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(data => this.submitReceiptData(data))
      );
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason instanceof Error ? result.reason.message : 'Batch submission failed'
          });
        }
      });
    }
    
    return results;
  }

  async getAnalytics(): Promise<DAAnalytics> {
    try {
      // This would typically come from a database or analytics service
      // For now, return mock data
      return {
        totalSubmissions: 1247,
        totalRetrievals: 3892,
        averageSubmissionTime: 2.3,
        averageRetrievalTime: 0.8,
        successRate: 99.8,
        totalCost: '12.47',
        networkHealth: 98.5,
        last24Hours: {
          submissions: 47,
          retrievals: 156,
          errors: 1
        }
      };
    } catch (error) {
      console.error('Analytics retrieval failed:', error);
      throw error;
    }
  }

  async estimateCost(dataSize: number): Promise<{ cost: string; gasEstimate: number }> {
    try {
      // Enhanced cost estimation based on 0G DA pricing
      const baseCost = 0.001; // Base cost in OG tokens
      const perByteCost = 0.0000008; // Cost per byte (optimized for 0G)
      const networkFee = 0.0005; // Network processing fee
      
      const totalCost = baseCost + (dataSize * perByteCost) + networkFee;
      const gasEstimate = Math.ceil(dataSize / 1000) * 21000; // Rough estimate

      return {
        cost: totalCost.toFixed(6),
        gasEstimate
      };
    } catch (error) {
      return {
        cost: '0.001',
        gasEstimate: 21000
      };
    }
  }

  private mapBlobStatus(status: number): 'pending' | 'confirmed' | 'finalized' {
    switch (status) {
      case 0: return 'pending';
      case 1: return 'confirmed';
      case 2: return 'finalized';
      default: return 'pending';
    }
  }

  private verifyReceiptData(data: DABlobData): boolean {
    try {
      // Enhanced validation checks
      if (!data.receiptId || !data.metadata || !data.proofs || !data.lifecycle) {
        return false;
      }

      // Check required fields
      if (!data.metadata.device || !data.metadata.purchase) {
        return false;
      }

      // Validate timestamps
      if (!data.timestamps?.created) {
        return false;
      }

      // Validate lifecycle status
      const validStatuses = ['active', 'stolen', 'misplaced', 'recycled', 'disposed'];
      if (!validStatuses.includes(data.lifecycle.status)) {
        return false;
      }

      // Validate proofs
      if (!data.proofs.verificationHash || !data.proofs.ownershipChain) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Data verification failed:', error);
      return false;
    }
  }

  // Helper method to create DA-optimized receipt data
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
        verificationHash: additionalData?.proofs?.verificationHash || ethers.utils.keccak256(ethers.utils.toUtf8Bytes(receiptId))
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
