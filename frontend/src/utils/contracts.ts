import { Contract, Provider, BrowserProvider, JsonRpcSigner } from 'ethers';
import ProofMintABI from '../abi/ProofMint.json';

// Contract addresses for 0G testnet deployment
const CONTRACT_ADDRESSES = {
  ProofMint: '0x1061757434Be9060b2B00569c21A67FaD5C57123', 
} as const;

type ContractName = keyof typeof CONTRACT_ADDRESSES;

// Cache for contract instances
const contractCache: Record<string, Contract> = {};

/**
 * Initialize and get a contract instance
 * @param name - Name of the contract
 * @param signerOrProvider - Signer or provider
 * @returns Contract instance
 */
export function getContract(
  name: ContractName,
  signerOrProvider: JsonRpcSigner | Provider
): Contract {
  if (contractCache[name]) {
    return contractCache[name];
  }

  let abi: any[];
  
  switch (name) {
    case 'ProofMint':
      abi = ProofMintABI;
      break;
    default:
      throw new Error(`Unknown contract: ${name}`);
  }

  const contract = new Contract(CONTRACT_ADDRESSES[name], abi, signerOrProvider);
  contractCache[name] = contract;
  return contract;
}

/**
 * Get contract instance with connected signer
 * @param name - Name of the contract
 * @param provider - Web3Provider
 * @param account - Account address
 * @returns Contract instance with connected signer
 */
export async function getContractWithSigner(
  name: ContractName,
  provider: BrowserProvider,
  _account: string
): Promise<Contract> {
  const signer = await provider.getSigner();
  return getContract(name, signer);
}

/**
 * Get contract instance with read-only provider
 * @param name - Name of the contract
 * @param provider - Provider (can be read-only)
 * @returns Read-only contract instance
 */
export function getReadOnlyContract(
  name: ContractName,
  provider: Provider
): Contract {
  return getContract(name, provider);
}
