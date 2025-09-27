import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContractService } from "../services/ContractService";
import { UserRoleResponse } from "../types/contracts";
import { isAddress } from "viem"; // Fixed import

// Query keys
export const contractQueryKeys = {
  receipt: (id: bigint) => ["receipt", id.toString()],
  receiptsByBuyer: (buyer: string) => ["receipts", "buyer", buyer],
  receiptsByMerchant: (merchant: string) => ["receipts", "merchant", merchant],
  userRoles: (address: string) => ["userRoles", address],
  tokenBalance: (address: string) => ["tokenBalance", address],
  tokenInfo: () => ["tokenInfo"],
  kycStatus: (address: string) => ["kycStatus", address],
};

// Receipt queries
export const useReceiptById = (id: bigint) => {
  return useQuery({
    queryKey: contractQueryKeys.receipt(id),
    queryFn: () => ContractService.getReceiptById(id),
    enabled: id > 0n,
    staleTime: 30000,
  });
};

export const useReceiptsByBuyer = (buyer: `0x${string}`) => {
  return useQuery({
    queryKey: contractQueryKeys.receiptsByBuyer(buyer),
    queryFn: () => ContractService.getReceiptsByBuyer(buyer),
    enabled: !!buyer,
    staleTime: 30000,
  });
};

export const useReceiptsByMerchant = (merchant: `0x${string}`) => {
  return useQuery({
    queryKey: contractQueryKeys.receiptsByMerchant(merchant),
    queryFn: () => ContractService.getReceiptsByMerchant(merchant),
    enabled: !!merchant,
    staleTime: 30000,
  });
};

// User role queries - FIXED
export const useUserRoles = (address?: `0x${string}`) => {
  return useQuery<UserRoleResponse>({
    queryKey: contractQueryKeys.userRoles(address || ""),
    queryFn: () => {
      if (!address) throw new Error("Address is undefined");
      return ContractService.getUserRoles(address);
    },
    enabled: !!address && isAddress(address), // Using viem's isAddress
    staleTime: 5 * 60 * 1000,
  });
};

// Token queries
export const useTokenBalance = (address: `0x${string}`) => {
  return useQuery({
    queryKey: contractQueryKeys.tokenBalance(address),
    queryFn: () => ContractService.getTokenBalance(address),
    enabled: !!address,
    staleTime: 15000,
  });
};

export const useTokenInfo = () => {
  return useQuery({
    queryKey: contractQueryKeys.tokenInfo(),
    queryFn: () => ContractService.getTokenInfo(),
    staleTime: 300000,
  });
};

// KYC queries
export const useKYCStatus = (address: `0x${string}`) => {
  return useQuery({
    queryKey: contractQueryKeys.kycStatus(address),
    queryFn: () => ContractService.getKYCStatus(address),
    enabled: !!address,
    staleTime: 60000,
  });
};

// Mutations
export const useIssueReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ buyer, ipfsCID, amount }: { buyer: `0x${string}`; ipfsCID: `0x${string}`; amount: bigint }) =>
      ContractService.simulateIssueReceipt(buyer, ipfsCID, amount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.receiptsByBuyer(variables.buyer),
      });
      queryClient.invalidateQueries({
        queryKey: ["receipts"],
      });
    },
  });
};

export const useMarkPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ receiptId }: { receiptId: bigint }) => ContractService.simulateMarkPaid(receiptId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contractQueryKeys.receipt(variables.receiptId),
      });
      queryClient.invalidateQueries({
        queryKey: ["receipts"],
      });
    },
  });
};

export const useTokenTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ to, amount }: { to: `0x${string}`; amount: bigint }) => ContractService.simulateTokenTransfer(to, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tokenBalance"],
      });
    },
  });
};