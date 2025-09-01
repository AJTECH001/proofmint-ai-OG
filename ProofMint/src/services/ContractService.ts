import { ethers } from "ethers";
import { checkRoles, contractAddress, contractABI } from "../utils/contract"; // Adjust path to contract.ts
import { ContractType, Receipt, UserRoleResponse, TokenInfoResponse } from "../types/contracts";
import { mockContractAddresses, mockReceipts, mockTokenBalances, mockKYCStatus } from "../data/contractMockData";

// Import ABIs
import PaymentEscrowABI from "../abi/PaymentEscrow.json";
import ProofMintTokenABI from "../abi/ProofMintToken.json";
import ZKKYCVerifierABI from "../abi/ZKKYCVerifier.json";
import Groth16VerifierABI from "../abi/Groth16Verifier.json";

export class ContractService {
  // Get ethers contract instance
  static getEthersContract(contractType: ContractType, provider: ethers.Provider | ethers.Signer) {
    const config = {
      [ContractType.PROOF_MINT]: {
        address: contractAddress, // Use address from contract.ts
        abi: contractABI,
      },
      [ContractType.PAYMENT_ESCROW]: {
        address: mockContractAddresses.paymentEscrow,
        abi: PaymentEscrowABI,
      },
      [ContractType.PROOF_MINT_TOKEN]: {
        address: mockContractAddresses.proofMintToken,
        abi: ProofMintTokenABI,
      },
      [ContractType.ZK_KYC_VERIFIER]: {
        address: mockContractAddresses.zkKycVerifier,
        abi: ZKKYCVerifierABI,
      },
      [ContractType.GROTH16_VERIFIER]: {
        address: mockContractAddresses.groth16Verifier,
        abi: Groth16VerifierABI,
      },
    }[contractType];

    return new ethers.Contract(config.address, config.abi, provider);
  }

  // ProofMint contract methods
  static async getReceiptById(id: bigint): Promise<Receipt | null> {
    try {
      // For demo purposes, return mock data
      const mockReceipt = mockReceipts.find((r) => r.id === id);
      return mockReceipt || null;
    } catch (error) {
      console.error("Error fetching receipt:", error);
      return null;
    }
  }

  static async getReceiptsByBuyer(buyer: `0x${string}`): Promise<Receipt[]> {
    try {
      // For demo purposes, return mock data
      return mockReceipts.filter((r) => r.buyer.toLowerCase() === buyer.toLowerCase());
    } catch (error) {
      console.error("Error fetching receipts by buyer:", error);
      return [];
    }
  }

  static async getReceiptsByMerchant(merchant: `0x${string}`): Promise<Receipt[]> {
    try {
      // For demo purposes, return mock data
      return mockReceipts.filter((r) => r.merchant.toLowerCase() === merchant.toLowerCase());
    } catch (error) {
      console.error("Error fetching receipts by merchant:", error);
      return [];
    }
  }

  static async getUserRoles(address: `0x${string}`): Promise<UserRoleResponse> {
    try {
      if (!address || !ethers.isAddress(address)) {
        return {
          address,
          roles: [],
          hasAdminRole: false,
          hasMerchantRole: false,
          hasRecyclerRole: false,
          hasUpgraderRole: false,
          hasDefaultAdminRole: false,
        };
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get all roles for the address
      const userRoles = await checkRoles(signer, address);
      
      // Check for specific roles
      const hasAdminRole = userRoles.includes("ADMIN_ROLE");
      const hasMerchantRole = userRoles.includes("MERCHANT_ROLE");
      const hasRecyclerRole = userRoles.includes("RECYCLER_ROLE");
      const hasUpgraderRole = userRoles.includes("UPGRADER_ROLE");
      const hasDefaultAdminRole = userRoles.includes("DEFAULT_ADMIN_ROLE");

      return {
        address,
        roles: userRoles,
        hasAdminRole,
        hasMerchantRole,
        hasRecyclerRole,
        hasUpgraderRole,
        hasDefaultAdminRole,
      };
    } catch (error) {
      console.error("Error fetching user roles:", error);
      
      // For development/demo purposes, return mock admin role for certain addresses
      // In production, you'd want proper error handling and fallback mechanisms
      const isDemoAdmin = address.toLowerCase() === '0xa4280dd3f9e1f6bf1778837ac12447615e1d0317'.toLowerCase();
      
      return {
        address,
        roles: isDemoAdmin ? ["ADMIN_ROLE", "DEFAULT_ADMIN_ROLE"] : [],
        hasAdminRole: isDemoAdmin,
        hasMerchantRole: false,
        hasRecyclerRole: false,
        hasUpgraderRole: false,
        hasDefaultAdminRole: isDemoAdmin,
      };
    }
  }

  // Token contract methods
  static async getTokenBalance(address: `0x${string}`): Promise<bigint> {
    try {
      // For demo purposes, return mock data
      return (mockTokenBalances as Record<string, bigint>)[address] || 0n;
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return 0n;
    }
  }

  static async getTokenInfo(): Promise<TokenInfoResponse> {
    try {
      // For demo purposes, return mock data
      return {
        name: "ProofMint Token",
        symbol: "PMT",
        decimals: 18,
        totalSupply: 1000000000000000000000000n, // 1M tokens
      };
    } catch (error) {
      console.error("Error fetching token info:", error);
      return {
        name: "Unknown",
        symbol: "UNK",
        decimals: 18,
        totalSupply: 0n,
      };
    }
  }

  // KYC contract methods
  static async getKYCStatus(address: `0x${string}`): Promise<boolean> {
    try {
      // For demo purposes, return mock data
      return (mockKYCStatus as Record<string, boolean>)[address] || false;
    } catch (error) {
      console.error("Error fetching KYC status:", error);
      return false;
    }
  }

  // Transaction simulation methods
  static async simulateIssueReceipt(
    _buyer: `0x${string}`,
    _ipfsCID: `0x${string}`,
    _amount: bigint
  ): Promise<{ success: boolean; receiptId?: bigint; error?: string }> {
    try {
      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newReceiptId = BigInt(mockReceipts.length + 1);
      return {
        success: true,
        receiptId: newReceiptId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transaction failed",
      };
    }
  }

  static async simulateMarkPaid(_receiptId: bigint): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transaction failed",
      };
    }
  }

  static async simulateTokenTransfer(
    _to: `0x${string}`,
    _amount: bigint
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 1200));

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transaction failed",
      };
    }
  }
}