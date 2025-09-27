import { ethers } from "ethers";
import { Role } from "./types";

// Replace with your deployed ProofMint contract address (not the deployer address)
export const contractAddress = "0x1061757434Be9060b2B00569c21A67FaD5C57123"; // 0G testnet deployment

// Updated ABI with actual ProofMint contract functions
export const contractABI = [
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isVerifiedMerchant",
    "inputs": [{ "name": "merchant", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isRecycler",
    "inputs": [{ "name": "recycler", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserReceipts",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMerchantReceipts",
    "inputs": [{ "name": "merchant", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getReceipt",
    "inputs": [{ "name": "receiptId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{
      "name": "",
      "type": "tuple",
      "internalType": "struct ProofMint.Receipt",
      "components": [
        { "name": "id", "type": "uint256", "internalType": "uint256" },
        { "name": "merchant", "type": "address", "internalType": "address" },
        { "name": "buyer", "type": "address", "internalType": "address" },
        { "name": "ipfsHash", "type": "string", "internalType": "string" },
        { "name": "timestamp", "type": "uint256", "internalType": "uint256" },
        { "name": "gadgetStatus", "type": "uint8", "internalType": "enum ProofMint.GadgetStatus" },
        { "name": "lastStatusUpdate", "type": "uint256", "internalType": "uint256" }
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "viewAllReceipts",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalStats",
    "inputs": [],
    "outputs": [{ "name": "totalReceipts", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "issueReceipt",
    "inputs": [
      { "name": "buyer", "type": "address", "internalType": "address" },
      { "name": "ipfsHash", "type": "string", "internalType": "string" }
    ],
    "outputs": [{ "name": "id", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "recycleGadget",
    "inputs": [{ "name": "receiptId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addMerchant",
    "inputs": [{ "name": "merchantAddr", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addRecycler",
    "inputs": [{ "name": "recycler", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;

export const getContract = (signer: ethers.Signer): ethers.Contract => {
  return new ethers.Contract(contractAddress, contractABI, signer);
};

export const checkRole = async (account: string): Promise<Role> => {
  try {
    if (!window.ethereum) {
      console.log("No ethereum provider found");
      return "";
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = getContract(signer);
    
    console.log(`Checking roles for account: ${account}`);
    
    // Check if user is the contract owner (admin)
    try {
      const owner = await contract.owner();
      console.log(`Contract owner: ${owner}`);
      console.log(`Account: ${account}`);
      
      if (owner.toLowerCase() === account.toLowerCase()) {
        console.log(`Account ${account} is the contract owner (admin)`);
        return "ADMIN_ROLE";
      }
    } catch (error) {
      console.error("Error checking owner:", error);
    }

    // Check if user is a verified merchant
    try {
      const isMerchant = await contract.isVerifiedMerchant(account);
      console.log(`Account ${account} is verified merchant: ${isMerchant}`);
      
      if (isMerchant) {
        console.log(`Account ${account} has merchant role`);
        return "MERCHANT_ROLE";
      }
    } catch (error) {
      console.error("Error checking merchant status:", error);
    }

    // Check if user is a recycler
    try {
      const isRecycler = await contract.isRecycler(account);
      console.log(`Account ${account} is recycler: ${isRecycler}`);
      
      if (isRecycler) {
        console.log(`Account ${account} has recycler role`);
        return "RECYCLER_ROLE";
      }
    } catch (error) {
      console.error("Error checking recycler status:", error);
    }
    
    console.log(`Account ${account} has no special roles - default user`);
    return "";
  } catch (error) {
    console.error("Error in checkRole:", error);
    return "";
  }
};

// For backward compatibility with ContractService
export const checkRoles = async (signer: ethers.Signer, account: string): Promise<Role[]> => {
  const contract = getContract(signer);
  const roles: Role[] = [];
  
  try {
    // Check if user is the contract owner (admin)
    const owner = await contract.owner();
    console.log(`🔍 Contract owner: ${owner}`);
    console.log(`🔍 Checking account: ${account}`);
    
    if (owner.toLowerCase() === account.toLowerCase()) {
      console.log(`✅ Account ${account} is the contract owner (admin)`);
      roles.push("ADMIN_ROLE");
      roles.push("DEFAULT_ADMIN_ROLE"); // Add both for compatibility
    }
  } catch (error) {
    console.error("Error checking owner:", error);
  }

  try {
    // Check if user is a verified merchant
    const isMerchant = await contract.isVerifiedMerchant(account);
    console.log(`🏪 Account ${account} is verified merchant: ${isMerchant}`);
    
    if (isMerchant) {
      roles.push("MERCHANT_ROLE");
    }
  } catch (error) {
    console.error("Error checking merchant status:", error);
  }

  try {
    // Check if user is a recycler
    const isRecycler = await contract.isRecycler(account);
    console.log(`♻️ Account ${account} is recycler: ${isRecycler}`);
    
    if (isRecycler) {
      roles.push("RECYCLER_ROLE");
    }
  } catch (error) {
    console.error("Error checking recycler status:", error);
  }
  
  if (roles.length === 0) {
    console.log(`Account ${account} has no roles`);
  } else {
    console.log(`Account ${account} has roles: ${roles.join(', ')}`);
  }
  
  return roles;
};