import { ethers } from "ethers";
import { getContract } from "../utils/contract";

export interface Receipt {
  id: bigint;
  merchant: string;
  buyer: string;
  ipfsCID: string;
  productType: string;
  recycledBy: string;
  recycledAt: bigint;
  amount: bigint;
  timestamp: bigint;
  isPaid: boolean;
  isRecycled: boolean;
}

export interface ReceiptStats {
  total: number;
  paid: number;
  unpaid: number;
  recycled: number;
}

export class ProofMintService {
  private static async getSigner(): Promise<ethers.Signer> {
    if (!window.ethereum) {
      throw new Error("No ethereum provider found");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  }

  private static async getContract(): Promise<ethers.Contract> {
    const signer = await this.getSigner();
    return getContract(signer);
  }

  private static parseReceipt(id: bigint, receiptData: any): Receipt {
    const [merchant, buyer, ipfsCID, productType, recycledBy, recycledAt, packed] = receiptData;
    const flags = packed.flags;
    
    // Helper function to safely convert bytes to string
    const bytesToString = (bytes: string | Uint8Array): string => {
      try {
        if (typeof bytes === 'string') {
          // If it's already a hex string, convert it
          if (bytes.startsWith('0x')) {
            return ethers.toUtf8String(bytes);
          }
          return bytes;
        }
        return ethers.toUtf8String(bytes);
      } catch (error) {
        // If conversion fails, return the original hex or a placeholder
        return typeof bytes === 'string' ? bytes : 'Unknown';
      }
    };

    // Helper function to convert bytes32 to string
    const bytes32ToString = (bytes32: string): string => {
      try {
        // Remove null bytes and convert
        const cleaned = bytes32.replace(/\x00+$/, '');
        return ethers.toUtf8String(cleaned);
      } catch (error) {
        // If conversion fails, return a readable format
        return bytes32.slice(0, 10) + '...';
      }
    };
    
    return {
      id,
      merchant,
      buyer,
      ipfsCID: bytesToString(ipfsCID),
      productType: bytes32ToString(productType),
      recycledBy,
      recycledAt: BigInt(recycledAt),
      amount: packed.amount,
      timestamp: packed.timestamp,
      isPaid: (flags & 1) !== 0,
      isRecycled: (flags & 2) !== 0,
    };
  }

  // Admin functions
  static async addMerchant(merchantAddress: string): Promise<void> {
    const contract = await this.getContract();
    const tx = await contract.addMerchant(merchantAddress);
    await tx.wait();
  }

  static async addRecycler(recyclerAddress: string): Promise<void> {
    const contract = await this.getContract();
    const tx = await contract.addRecycler(recyclerAddress);
    await tx.wait();
  }

  static async getAllReceipts(start = 0, max = 50): Promise<Receipt[]> {
    const contract = await this.getContract();
    const receiptIds = await contract.adminAllReceipts(start, max);
    
    const receipts: Receipt[] = [];
    for (const id of receiptIds) {
      try {
        const receiptData = await contract.getReceipt(id);
        receipts.push(this.parseReceipt(id, receiptData));
      } catch (error) {
        console.error(`Error fetching receipt ${id}:`, error);
      }
    }
    
    return receipts;
  }

  static async getReceiptStats(): Promise<ReceiptStats> {
    const receipts = await this.getAllReceipts(0, 1000); // Get more receipts for stats
    
    return {
      total: receipts.length,
      paid: receipts.filter(r => r.isPaid).length,
      unpaid: receipts.filter(r => !r.isPaid).length,
      recycled: receipts.filter(r => r.isRecycled).length,
    };
  }

  // Merchant functions
  static async issueReceipt(
    buyer: string,
    ipfsCID: string,
    productType: string,
    amount: string
  ): Promise<bigint> {
    const contract = await this.getContract();
    
    const ipfsCIDBytes = ethers.toUtf8Bytes(ipfsCID);
    const productTypeBytes = ethers.id(productType); // Convert string to bytes32
    const amountBigInt = ethers.parseUnits(amount, 18); // Parse as 18-decimal token amount
    
    const tx = await contract.issueReceipt(buyer, ipfsCIDBytes, productTypeBytes, amountBigInt);
    const receipt = await tx.wait();
    
    // Find the ReceiptIssued event to get the receipt ID
    const event = receipt.logs.find((log: any) => {
      try {
        const parsedLog = contract.interface.parseLog(log);
        return parsedLog?.name === 'ReceiptIssued';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsedLog = contract.interface.parseLog(event);
      return parsedLog?.args.id || BigInt(0);
    }
    
    throw new Error("Receipt ID not found in transaction logs");
  }

  static async markPaid(receiptId: bigint): Promise<void> {
    const contract = await this.getContract();
    const tx = await contract.markPaid(receiptId);
    await tx.wait();
  }

  static async getMerchantReceipts(merchantAddress: string): Promise<Receipt[]> {
    const contract = await this.getContract();
    const receiptIds = await contract.receiptsByMerchant(merchantAddress);
    
    const receipts: Receipt[] = [];
    for (const id of receiptIds) {
      try {
        const receiptData = await contract.getReceipt(id);
        receipts.push(this.parseReceipt(id, receiptData));
      } catch (error) {
        console.error(`Error fetching receipt ${id}:`, error);
      }
    }
    
    return receipts;
  }

  // Buyer functions
  static async getBuyerReceipts(buyerAddress: string): Promise<Receipt[]> {
    const contract = await this.getContract();
    const receiptIds = await contract.receiptsByBuyer(buyerAddress);
    
    const receipts: Receipt[] = [];
    for (const id of receiptIds) {
      try {
        const receiptData = await contract.getReceipt(id);
        receipts.push(this.parseReceipt(id, receiptData));
      } catch (error) {
        console.error(`Error fetching receipt ${id}:`, error);
      }
    }
    
    return receipts;
  }

  static async linkNFC(nfcPubKey: string): Promise<void> {
    const contract = await this.getContract();
    const nfcBytes = ethers.toUtf8Bytes(nfcPubKey);
    const tx = await contract.linkNFC(nfcBytes);
    await tx.wait();
  }

  static async getNFCKeyHash(buyerAddress: string): Promise<string> {
    const contract = await this.getContract();
    return await contract.nfcKeyHashByBuyer(buyerAddress);
  }

  // Recycler functions
  static async markRecycled(receiptId: bigint): Promise<void> {
    const contract = await this.getContract();
    const tx = await contract.markRecycled(receiptId);
    await tx.wait();
  }

  static async getRecyclerReceipts(recyclerAddress: string): Promise<Receipt[]> {
    const contract = await this.getContract();
    const receiptIds = await contract.receiptsByRecycler(recyclerAddress);
    
    const receipts: Receipt[] = [];
    for (const id of receiptIds) {
      try {
        const receiptData = await contract.getReceipt(id);
        receipts.push(this.parseReceipt(id, receiptData));
      } catch (error) {
        console.error(`Error fetching receipt ${id}:`, error);
      }
    }
    
    return receipts;
  }

  // General functions
  static async getReceipt(receiptId: bigint): Promise<Receipt> {
    const contract = await this.getContract();
    const receiptData = await contract.getReceipt(receiptId);
    return this.parseReceipt(receiptId, receiptData);
  }

  static async getContractStats(): Promise<{
    totalReceipts: number;
    kycVerifier: string;
    rewardToken: string;
  }> {
    const contract = await this.getContract();
    
    const [nextReceiptId, kycVerifier, rewardToken] = await Promise.all([
      contract.nextReceiptId(),
      contract.kycVerifier(),
      contract.rewardToken(),
    ]);
    
    return {
      totalReceipts: Number(nextReceiptId),
      kycVerifier,
      rewardToken,
    };
  }

  // Helper functions
  static formatAmount(amount: bigint): string {
    return ethers.formatEther(amount);
  }

  static formatDate(timestamp: bigint): string {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  }

  static formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}