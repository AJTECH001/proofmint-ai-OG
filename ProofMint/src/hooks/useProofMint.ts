import { useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useContract } from './useContract';

type Receipt = {
  id: bigint;
  merchant: string;
  customer: string;
  amount: bigint;
  token: string;
  timestamp: bigint;
  status: number;
};

export function useProofMint() {
  const { provider, account, isConnected } = useWeb3();
  const { callView, sendTransaction } = useContract('ProofMint');

  const getReceipt = useCallback(
    async (receiptId: number): Promise<Receipt> => {
      if (!provider || !isConnected) throw new Error('Not connected');
      return callView(provider, 'getReceipt', [receiptId], account);
    },
    [callView, provider, isConnected, account]
  );

  const getUserReceipts = useCallback(
    async (userAddress: string): Promise<Receipt[]> => {
      if (!provider || !isConnected) throw new Error('Not connected');
      
      const count = await callView(provider, 'balanceOf', [userAddress], account);
      
      const receiptPromises = [];
      for (let i = 0; i < Number(count); i++) {
        receiptPromises.push(
          callView(provider, 'tokenOfOwnerByIndex', [userAddress, i], account)
            .then((tokenId) => getReceipt(Number(tokenId)))
        );
      }
      
      return Promise.all(receiptPromises);
    },
    [callView, getReceipt, provider, isConnected, account]
  );

  const issueReceipt = useCallback(
    async (
      merchant: string,
      customer: string,
      amount: bigint,
      token: string
    ) => {
      if (!provider || !account) throw new Error('Not connected');
      
      return sendTransaction(
        provider,
        'issueReceipt',
        [merchant, customer, amount, token],
        account
      );
    },
    [sendTransaction, provider, account]
  );

  const verifyReceipt = useCallback(
    async (receiptId: number) => {
      if (!provider || !account) throw new Error('Not connected');
      
      return sendTransaction(
        provider,
        'verifyReceipt',
        [receiptId],
        account
      );
    },
    [sendTransaction, provider, account]
  );

  const getRole = useCallback(
    async (role: string, address: string) => {
      if (!provider) throw new Error('Provider not available');
      
      return callView(provider, 'hasRole', [role, address], account);
    },
    [callView, provider, account]
  );

  const isAdmin = useCallback(async () => {
    if (!provider || !account) return false;
    
    try {
      const adminRole = await callView(provider, 'DEFAULT_ADMIN_ROLE', [], account);
      return getRole(adminRole, account);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }, [callView, getRole, provider, account]);

  return {
    getReceipt,
    getUserReceipts,
    issueReceipt,
    verifyReceipt,
    isAdmin,
    isConnected,
    account,
  };
}