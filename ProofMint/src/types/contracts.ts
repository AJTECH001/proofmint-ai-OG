// Contract-related enums for ProofMint ecosystem

export enum ContractType {
  PROOF_MINT = 'PROOF_MINT',
  PAYMENT_ESCROW = 'PAYMENT_ESCROW', 
  PROOF_MINT_TOKEN = 'PROOF_MINT_TOKEN',
  ZK_KYC_VERIFIER = 'ZK_KYC_VERIFIER',
  GROTH16_VERIFIER = 'GROTH16_VERIFIER'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED', 
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS'
}

export enum UserRole {
  ADMIN = 'ADMIN_ROLE',
  MERCHANT = 'MERCHANT_ROLE',
  RECYCLER = 'RECYCLER_ROLE', 
  UPGRADER = 'UPGRADER_ROLE',
  VERIFIER = 'VERIFIER_ROLE'
}

export enum ReceiptStatus {
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  RECYCLED = 'RECYCLED'
}

export enum NetworkChain {
  ETHEREUM = 1,
  POLYGON = 137,
  BSC = 56,
  RONIN = 2020
}

// Contract interaction types
export interface ContractConfig {
  address: `0x${string}`;
  abi: readonly unknown[];
  chainId: number;
}

export interface Receipt {
  id: bigint;
  merchant: `0x${string}`;
  buyer: `0x${string}`;
  ipfsCID: `0x${string}`;
  amount: bigint;
  timestamp: number;
  isPaid: boolean;
  isRecycled: boolean;
}

export interface TransactionData {
  hash: `0x${string}`;
  blockNumber: bigint;
  gasUsed: bigint;
  gasPrice: bigint;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  timestamp: number;
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
}

export interface UserBalance {
  address: `0x${string}`;
  balance: bigint;
  formatted: string;
}

export interface ContractError {
  code: string;
  message: string;
  data?: unknown;
}

// Query response types
export interface ReceiptQueryResponse {
  receipts: Receipt[];
  total: number;
  hasMore: boolean;
}

export interface UserRoleResponse {
  address: `0x${string}`;
  roles: string[];
  hasAdminRole: boolean;
  hasMerchantRole: boolean;
  hasRecyclerRole: boolean;
  hasUpgraderRole: boolean;
  hasDefaultAdminRole: boolean;
}

export interface TokenInfoResponse {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}

// Props types for contract components
export interface ContractInteractionProps {
  contractAddress: `0x${string}`;
  userAddress?: `0x${string}`;
  onSuccess?: (result: unknown) => void;
  onError?: (error: ContractError) => void;
}

export interface ReceiptListProps extends ContractInteractionProps {
  filterByUser?: `0x${string}`;
  filterByStatus?: 'paid' | 'unpaid' | 'recycled';
  pageSize?: number;
}

export interface TransactionFormProps extends ContractInteractionProps {
  functionName: string;
  args?: unknown[];
  value?: bigint;
}