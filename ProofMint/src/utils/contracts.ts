import { Contract, Provider, BrowserProvider, JsonRpcSigner } from 'ethers';
import ProofMintABI from '../abi/ProofMint.json';
import ProofMintTokenABI from '../abi/ProofMintToken.json';
import PaymentEscrowABI from '../abi/PaymentEscrow.json';
import ZKKYCVerifierABI from '../abi/ZKKYCVerifier.json';
import Groth16VerifierABI from '../abi/Groth16Verifier.json';

// Contract addresses (replace with your actual contract addresses)
const CONTRACT_ADDRESSES = {
  ProofMint: '0xC2f7CB02a329c236bAbb668d95c8980DBf5D65c3', 
  ProofMintToken: '0x7215c481d86114ae23FD8468491e36Ee7899cDA1', 
  PaymentEscrow: '0xd5A6Dd06fD49DeFd503978E4Cb42b19640B905B2', 
  ZKKYCVerifier: '0x8fc19740ce927d69ee8B37824419679d7257A545', 
  Groth16Verifier: '0xd7205e12028087f8Af0be22F839e1a179f1CeaA6', 
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
    case 'ProofMintToken':
      abi = ProofMintTokenABI;
      break;
    case 'PaymentEscrow':
      abi = PaymentEscrowABI;
      break;
    case 'ZKKYCVerifier':
      abi = ZKKYCVerifierABI;
      break;
    case 'Groth16Verifier':
      abi = Groth16VerifierABI;
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
