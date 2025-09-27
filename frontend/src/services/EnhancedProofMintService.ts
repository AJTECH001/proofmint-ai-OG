import { ethers } from 'ethers';
import { zeroGDAService, DABlobData } from './ZeroGDAService';

export interface EnhancedReceipt {
  id: string;
  tokenId: number;
  owner: string;
  deviceInfo: {
    type: string;
    brand: string;
    model: string;
    serialNumber?: string;
  };
  purchaseInfo: {
    date: string;
    price: number;
    currency: string;
    merchant: string;
    location: string;
  };
  warranties: {
    duration: string;
    terms: string;
    provider: string;
    expirationDate: string;
  };
  sustainability: {
    recyclingProgram: boolean;
    carbonOffset?: string;
    ecoRating?: string;
  };
  // 0G DA specific fields
  daCommitment?: string;
  fallbackURI?: string;
  dataSize?: number;
  storageMethod: 'on-chain' | '0g-da' | 'hybrid';
  verificationStatus: 'pending' | 'verified' | 'failed';
  
  // Enhanced tracking
  ownershipHistory: Array<{
    owner: string;
    timestamp: string;
    transactionHash: string;
  }>;
  serviceHistory: Array<{
    type: 'repair' | 'maintenance' | 'upgrade';
    provider: string;
    date: string;
    description: string;
    cost?: number;
  }>;
  attachments: {
    images: string[];
    documents: string[];
    certificates: string[];
  };
}

export interface ReceiptCreationOptions {
  useDA: boolean;
  includeFallback: boolean;
  enableRichData: boolean;
  compressionLevel: 'none' | 'standard' | 'maximum';
}

export class EnhancedProofMintService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  // Contract ABI with DA support
  private static readonly ENHANCED_ABI = [
    "function mint(address to, string memory uri) public returns (uint256)",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function tokenURI(uint256 tokenId) public view returns (string memory)",
    "function setDACommitment(uint256 tokenId, string memory commitment) external",
    "function getDACommitment(uint256 tokenId) external view returns (string memory)",
    "function setFallbackURI(uint256 tokenId, string memory uri) external",
    "function getFallbackURI(uint256 tokenId) external view returns (string memory)",
    "event ReceiptCreated(uint256 indexed tokenId, address indexed owner, string daCommitment)"
  ];

  async initialize(contractAddress: string, provider: ethers.Provider, signer?: ethers.Signer): Promise<void> {
    this.provider = provider;
    this.signer = signer || null;
    this.contract = new ethers.Contract(
      contractAddress,
      EnhancedProofMintService.ENHANCED_ABI,
      signer || provider
    );
  }

  async createEnhancedReceipt(
    receiptData: Partial<EnhancedReceipt>,
    options: ReceiptCreationOptions = {
      useDA: true,
      includeFallback: true,
      enableRichData: true,
      compressionLevel: 'standard'
    }
  ): Promise<{ success: boolean; tokenId?: number; commitment?: string; error?: string }> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Service not initialized or no signer available');
      }

      const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const enhancedReceipt: EnhancedReceipt = {
        id: receiptId,
        tokenId: 0,
        owner: await this.signer.getAddress(),
        deviceInfo: receiptData.deviceInfo || {
          type: 'unknown',
          brand: 'unknown', 
          model: 'unknown'
        },
        purchaseInfo: receiptData.purchaseInfo || {
          date: new Date().toISOString(),
          price: 0,
          currency: 'USD',
          merchant: 'unknown',
          location: 'unknown'
        },
        warranties: receiptData.warranties || {
          duration: '1 year',
          terms: 'standard',
          provider: 'manufacturer',
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        sustainability: receiptData.sustainability || {
          recyclingProgram: false
        },
        storageMethod: options.useDA ? '0g-da' : 'on-chain',
        verificationStatus: 'pending',
        ownershipHistory: [{
          owner: await this.signer.getAddress(),
          timestamp: new Date().toISOString(),
          transactionHash: ''
        }],
        serviceHistory: [],
        attachments: receiptData.attachments || {
          images: [],
          documents: [],
          certificates: []
        }
      };

      let daCommitment: string | undefined;
      let fallbackURI: string | undefined;

      // Store data in 0G DA if requested
      if (options.useDA) {
        const daData = this.convertToDABlobData(enhancedReceipt);
        const daResult = await zeroGDAService.submitReceiptData(daData);
        
        if (daResult.success) {
          daCommitment = daResult.commitment;
          enhancedReceipt.daCommitment = daCommitment;
          enhancedReceipt.dataSize = new TextEncoder().encode(JSON.stringify(daData)).length;
        } else {
          console.warn('0G DA submission failed, falling back to traditional storage:', daResult.error);
          enhancedReceipt.storageMethod = 'on-chain';
        }
      }

      // Create fallback URI if requested
      if (options.includeFallback) {
        fallbackURI = await this.createFallbackURI(enhancedReceipt);
        enhancedReceipt.fallbackURI = fallbackURI;
      }

      return {
        success: true,
        tokenId: Math.floor(Math.random() * 1000000), // Mock token ID
        commitment: daCommitment
      };

    } catch (error) {
      console.error('Enhanced receipt creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getEnhancedReceipt(tokenId: number): Promise<EnhancedReceipt | null> {
    try {
      if (!this.contract) {
        throw new Error('Service not initialized');
      }

      // Mock implementation for now
      return {
        id: `receipt_${tokenId}`,
        tokenId,
        owner: '0x1234...abcd',
        deviceInfo: { type: 'smartphone', brand: 'Apple', model: 'iPhone 15' },
        purchaseInfo: {
          date: '2024-01-15',
          price: 999,
          currency: 'USD',
          merchant: 'Apple Store',
          location: 'New York'
        },
        warranties: {
          duration: '1 year',
          terms: 'manufacturer',
          provider: 'Apple',
          expirationDate: '2025-01-15'
        },
        sustainability: { recyclingProgram: true },
        storageMethod: '0g-da',
        verificationStatus: 'verified',
        ownershipHistory: [],
        serviceHistory: [],
        attachments: { images: [], documents: [], certificates: [] }
      };

    } catch (error) {
      console.error('Failed to retrieve enhanced receipt:', error);
      return null;
    }
  }

  // Helper methods
  private convertToDABlobData(receipt: EnhancedReceipt): DABlobData {
    return {
      receiptId: receipt.id,
      metadata: {
        device: receipt.deviceInfo,
        purchase: receipt.purchaseInfo,
        warranty: receipt.warranties,
        sustainability: receipt.sustainability
      },
      proofs: {
        purchaseProof: '',
        authenticityProof: '',
        ownershipChain: receipt.ownershipHistory.map(h => h.owner)
      },
      attachments: receipt.attachments,
      timestamps: {
        created: receipt.ownershipHistory[0]?.timestamp || new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
  }

  private async createFallbackURI(receipt: EnhancedReceipt): Promise<string> {
    const basicData = {
      name: `${receipt.deviceInfo.brand} ${receipt.deviceInfo.model} Receipt`,
      description: `NFT Receipt for ${receipt.deviceInfo.brand} ${receipt.deviceInfo.model}`,
      attributes: [
        { trait_type: 'Device Type', value: receipt.deviceInfo.type },
        { trait_type: 'Brand', value: receipt.deviceInfo.brand },
        { trait_type: 'Model', value: receipt.deviceInfo.model },
        { trait_type: 'Purchase Date', value: receipt.purchaseInfo.date },
        { trait_type: 'Price', value: receipt.purchaseInfo.price },
        { trait_type: 'Currency', value: receipt.purchaseInfo.currency }
      ]
    };

    return `data:application/json;base64,${btoa(JSON.stringify(basicData))}`;
  }
}

export const enhancedProofMintService = new EnhancedProofMintService();