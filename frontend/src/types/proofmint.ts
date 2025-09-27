// Comprehensive ProofMint contract types based on ABI
export interface ProofMintContract {
  // View functions
  BASIC_MONTHLY_PRICE(): Promise<bigint>;
  BASIC_MONTHLY_PRICE_ETH(): Promise<bigint>;
  BASIC_RECEIPT_LIMIT(): Promise<bigint>;
  ENTERPRISE_MONTHLY_PRICE(): Promise<bigint>;
  ENTERPRISE_MONTHLY_PRICE_ETH(): Promise<bigint>;
  GRACE_PERIOD(): Promise<bigint>;
  MONTHLY_DURATION(): Promise<bigint>;
  PREMIUM_MONTHLY_PRICE(): Promise<bigint>;
  PREMIUM_MONTHLY_PRICE_ETH(): Promise<bigint>;
  PREMIUM_RECEIPT_LIMIT(): Promise<bigint>;
  USDC(): Promise<string>;

  // User management
  balanceOf(owner: string): Promise<bigint>;
  buyerReceipts(buyer: string, index: bigint): Promise<bigint>;
  canIssueReceipts(merchant: string): Promise<boolean>;
  isRecycler(recycler: string): Promise<boolean>;
  isVerifiedMerchant(merchant: string): Promise<boolean>;

  // Receipt management
  getReceipt(receiptId: bigint): Promise<Receipt>;
  getReceiptStatus(receiptId: bigint): Promise<ReceiptStatus>;
  getMerchantReceipts(merchant: string): Promise<bigint[]>;
  getUserReceipts(user: string): Promise<bigint[]>;
  getnextReceiptId(): Promise<bigint>;
  nextReceiptId(): Promise<bigint>;

  // Subscription management
  getSubscription(merchant: string): Promise<Subscription>;
  getSubscriptionPricing(): Promise<SubscriptionPricing>;

  // Stats
  getTotalStats(): Promise<{ totalReceipts: bigint }>;

  // Contract info
  name(): Promise<string>;
  owner(): Promise<string>;
  paused(): Promise<boolean>;

  // Write functions
  addMerchant(merchantAddr: string): Promise<any>;
  addRecycler(recycler: string): Promise<any>;
  flagGadget(receiptId: bigint, status: GadgetStatus): Promise<any>;
  issueReceipt(buyer: string, ipfsHash: string): Promise<any>;
  pauseMerchantSubscription(merchant: string, shouldPause: boolean): Promise<any>;
  purchaseSubscription(tier: SubscriptionTier, durationMonths: bigint): Promise<any>;
  purchaseSubscriptionUSDC(tier: SubscriptionTier, durationMonths: bigint): Promise<any>;
  recycleGadget(receiptId: bigint): Promise<any>;
  removeMerchant(merchantAddr: string): Promise<any>;
  removeRecycler(recycler: string): Promise<any>;
  renewSubscription(durationMonths: bigint): Promise<any>;
}

// Enums
export enum SubscriptionTier {
  NONE = 0,
  BASIC = 1,
  PREMIUM = 2,
  ENTERPRISE = 3
}

export enum GadgetStatus {
  UNKNOWN = 0,
  SOLD = 1,
  USED = 2,
  BROKEN = 3,
  RECYCLED = 4
}

// Data structures
export interface Receipt {
  id: bigint;
  merchant: string;
  buyer: string;
  ipfsHash: string;
  timestamp: bigint;
  gadgetStatus: GadgetStatus;
  lastStatusUpdate: bigint;
}

export interface ReceiptStatus {
  status: GadgetStatus;
  owner: string;
  merchant: string;
  lastUpdate: bigint;
}

export interface Subscription {
  tier: SubscriptionTier;
  expiresAt: bigint;
  receiptsIssued: bigint;
  receiptsRemaining: bigint;
  isActive: boolean;
  isExpired: boolean;
}

export interface SubscriptionPricing {
  basicMonthly: bigint;
  premiumMonthly: bigint;
  enterpriseMonthly: bigint;
  yearlyDiscount: bigint;
}

// UI/UX types
export interface ReceiptFormData {
  buyer: string;
  ipfsHash: string;
  productDescription?: string;
  notes?: string;
}

export interface SubscriptionFormData {
  tier: SubscriptionTier;
  duration: number; // in months
  paymentMethod: 'ETH' | 'USDC';
}

export interface ReceiptDisplay extends Receipt {
  formattedTimestamp: string;
  statusColor: string;
  statusText: string;
  shortId: string;
  shortBuyer: string;
  shortMerchant: string;
}

export interface DashboardStats {
  totalReceipts: number;
  activeSubscriptions: number;
  monthlyRevenue: string;
  recycledGadgets: number;
}

// Event types
export interface ReceiptIssuedEvent {
  id: bigint;
  merchant: string;
  buyer: string;
  ipfsHash: string;
}

export interface GadgetStatusChangedEvent {
  receiptId: bigint;
  newStatus: GadgetStatus;
  updatedBy: string;
}

export interface SubscriptionPurchasedEvent {
  merchant: string;
  tier: SubscriptionTier;
  duration: bigint;
  expiresAt: bigint;
}

// API Response types
export interface ContractResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  transactionHash?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isDirty: boolean;
}

// Notification types
export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number;
}

// Chart data types for analytics
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsData {
  receiptsOverTime: ChartDataPoint[];
  subscriptionsByTier: ChartDataPoint[];
  revenueOverTime: ChartDataPoint[];
  gadgetStatusDistribution: ChartDataPoint[];
}