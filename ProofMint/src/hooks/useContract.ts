import { useCallback } from 'react';
import { BrowserProvider } from 'ethers'; // Updated import
import { getContract, getContractWithSigner, getReadOnlyContract } from '../utils/contracts';

type ContractName = 'ProofMint' | 'ProofMintToken' | 'PaymentEscrow' | 'ZKKYCVerifier' | 'Groth16Verifier';

export function useContract(contractName: ContractName, readOnly: boolean = false) {
  const getContractInstance = useCallback(
    async (provider: BrowserProvider, account?: string) => {
      if (readOnly || !account) {
        return getReadOnlyContract(contractName, provider);
      }
      return getContractWithSigner(contractName, provider, account);
    },
    [contractName, readOnly]
  );

  const callView = useCallback(
    async <T = any>(
      provider: BrowserProvider,
      functionName: string,
      args: any[] = [],
      account?: string
    ): Promise<T> => {
      const contract = await getContractInstance(provider, account);
      return contract[functionName](...args);
    },
    [getContractInstance]
  );

  const sendTransaction = useCallback(
    async (
      provider: BrowserProvider,
      functionName: string,
      args: any[] = [],
      account: string,
      options: any = {}
    ) => {
      if (readOnly) {
        throw new Error('Cannot send transaction in read-only mode');
      }

      const contract = await getContractWithSigner(contractName, provider, account);
      const tx = await contract[functionName](...args, options);
      return tx.wait();
    },
    [contractName, readOnly]
  );

  const estimateGas = useCallback(
    async (
      provider: BrowserProvider,
      functionName: string,
      args: any[] = [],
      account: string,
      options: any = {}
    ): Promise<bigint> => {
      const contract = await getContractWithSigner(contractName, provider, account);
      return contract.estimateGas[functionName](...args, options);
    },
    [contractName]
  );

  return {
    getContract: getContractInstance,
    callView,
    sendTransaction,
    estimateGas,
  };
}