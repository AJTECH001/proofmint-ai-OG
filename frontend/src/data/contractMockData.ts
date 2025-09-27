// Mock data for contract integration testing

export const mockContractAddresses = {
  proofMint: '0x954Da409811bf70f7d5cDEC7392acd6B9aC7cF32' as const,
  paymentEscrow: '0x1234567890123456789012345678901234567890' as const,
  proofMintToken: '0x2345678901234567890123456789012345678901' as const,
  zkKycVerifier: '0x3456789012345678901234567890123456789012' as const,
  groth16Verifier: '0x4567890123456789012345678901234567890123' as const
};

export const mockReceipts = [
  {
    id: 1n,
    merchant: '0x742d35Cc6634C0532925a3b8D0Ac6bc4Cb4C0C' as const,
    buyer: '0x8ba1f109551bD432803012645Hac136c0C' as const,
    ipfsCID: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as const,
    amount: 1000000000000000000n, // 1 ETH in wei
    timestamp: 1703980800,
    isPaid: true,
    isRecycled: false
  },
  {
    id: 2n,
    merchant: '0x742d35Cc6634C0532925a3b8D0Ac6bc4Cb4C0C' as const,
    buyer: '0x9ca2f209661cE542904023756Iac247d1D' as const,
    ipfsCID: '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef1' as const,
    amount: 500000000000000000n, // 0.5 ETH in wei
    timestamp: 1703894400,
    isPaid: false,
    isRecycled: false
  }
];


export const mockUserRoles = {
  '0x742d35Cc6634C0532925a3b8D0Ac6bc4Cb4C0C': ['MERCHANT_ROLE'] as const,
  '0x8ba1f109551bD432803012645Hac136c0C': [] as const,
  '0x9ca2f209661cE542904023756Iac247d1D': [] as const,
  '0x1234567890123456789012345678901234567890': ['ADMIN_ROLE', 'UPGRADER_ROLE'] as const
};

export const mockTokenBalances = {
  '0x742d35Cc6634C0532925a3b8D0Ac6bc4Cb4C0C': 5000000000000000000000n, // 5000 tokens
  '0x8ba1f109551bD432803012645Hac136c0C': 1000000000000000000000n, // 1000 tokens
  '0x9ca2f209661cE542904023756Iac247d1D': 500000000000000000000n // 500 tokens
};

export const mockTransactionHistory = [
  {
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as const,
    blockNumber: 18500000n,
    gasUsed: 21000n,
    gasPrice: 20000000000n, // 20 Gwei
    status: 'SUCCESS' as const,
    timestamp: 1703980800,
    from: '0x742d35Cc6634C0532925a3b8D0Ac6bc4Cb4C0C' as const,
    to: '0x954Da409811bf70f7d5cDEC7392acd6B9aC7cF32' as const,
    value: 0n
  }
];

export const mockKYCStatus = {
  '0x742d35Cc6634C0532925a3b8D0Ac6bc4Cb4C0C': true,
  '0x8ba1f109551bD432803012645Hac136c0C': false,
  '0x9ca2f209661cE542904023756Iac247d1D': true
};