import { ethers } from "ethers";
import { Role } from "./types";

// Replace with your deployed ProofMint contract address (not the deployer address)
export const contractAddress = "0x045962833e855095dbe8b061d0e7e929a3f5c55c"; // Actual deployed contract address

// Complete ABI from compiled ProofMint contract
export const contractABI = [
  // Role constants
  {
    "type": "function",
    "name": "ADMIN_ROLE",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "DEFAULT_ADMIN_ROLE",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MERCHANT_ROLE",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "RECYCLER_ROLE",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "UPGRADER_ROLE",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "view"
  },
  // Access control
  {
    "type": "function",
    "name": "hasRole",
    "inputs": [
      { "name": "role", "type": "bytes32", "internalType": "bytes32" },
      { "name": "account", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  // Admin functions
  {
    "type": "function",
    "name": "addMerchant",
    "inputs": [{ "name": "merchant", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addRecycler",
    "inputs": [{ "name": "recycler", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "adminAllReceipts",
    "inputs": [
      { "name": "start", "type": "uint256", "internalType": "uint256" },
      { "name": "max", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "ids", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  // Merchant functions
  {
    "type": "function",
    "name": "issueReceipt",
    "inputs": [
      { "name": "buyer", "type": "address", "internalType": "address" },
      { "name": "ipfsCID", "type": "bytes", "internalType": "bytes" },
      { "name": "productType", "type": "bytes32", "internalType": "bytes32" },
      { "name": "amount", "type": "uint128", "internalType": "uint128" }
    ],
    "outputs": [{ "name": "id", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "markPaid",
    "inputs": [{ "name": "receiptId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  // Recycler functions
  {
    "type": "function",
    "name": "markRecycled",
    "inputs": [{ "name": "receiptId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  // View functions
  {
    "type": "function",
    "name": "getReceipt",
    "inputs": [{ "name": "id", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      { "name": "merchant", "type": "address", "internalType": "address" },
      { "name": "buyer", "type": "address", "internalType": "address" },
      { "name": "ipfsCID", "type": "bytes", "internalType": "bytes" },
      { "name": "productType", "type": "bytes32", "internalType": "bytes32" },
      { "name": "recycledBy", "type": "address", "internalType": "address" },
      { "name": "recycledAt", "type": "uint64", "internalType": "uint64" },
      {
        "name": "packed",
        "type": "tuple",
        "internalType": "struct ReceiptCodec.Packed",
        "components": [
          { "name": "amount", "type": "uint128", "internalType": "uint128" },
          { "name": "timestamp", "type": "uint64", "internalType": "uint64" },
          { "name": "flags", "type": "uint8", "internalType": "uint8" },
          { "name": "_reserved", "type": "uint56", "internalType": "uint56" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "receiptsByMerchant",
    "inputs": [{ "name": "merchantAddr", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "receiptsByBuyer",
    "inputs": [{ "name": "buyerAddr", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "receiptsByRecycler",
    "inputs": [{ "name": "recyclerAddr", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "buyerOf",
    "inputs": [{ "name": "id", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "merchantOf",
    "inputs": [{ "name": "id", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isPaid",
    "inputs": [{ "name": "id", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  // Buyer functions
  {
    "type": "function",
    "name": "linkNFC",
    "inputs": [{ "name": "nfcPubKey", "type": "bytes", "internalType": "bytes" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "nfcKeyHashByBuyer",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "view"
  },
  // Contract state
  {
    "type": "function",
    "name": "nextReceiptId",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "kycVerifier",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "rewardToken",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "contract IERC20" }],
    "stateMutability": "view"
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
    
    const roles: { name: Role; getter: string }[] = [
      { name: "DEFAULT_ADMIN_ROLE", getter: "DEFAULT_ADMIN_ROLE" },
      { name: "ADMIN_ROLE", getter: "ADMIN_ROLE" },
      { name: "MERCHANT_ROLE", getter: "MERCHANT_ROLE" },
      { name: "RECYCLER_ROLE", getter: "RECYCLER_ROLE" },
      { name: "UPGRADER_ROLE", getter: "UPGRADER_ROLE" },
    ];

    // Check roles in priority order (DEFAULT_ADMIN_ROLE has highest priority)
    for (const role of roles) {
      try {
        const roleHash = await contract[role.getter]();
        console.log(`Checking role ${role.name} with hash ${roleHash} for account ${account}`);
        const hasRole = await contract.hasRole(roleHash, account);
        console.log(`Account ${account} has ${role.name}: ${hasRole}`);
        
        if (hasRole) {
          console.log(`Account ${account} has role ${role.name}`);
          return role.name;
        }
      } catch (error) {
        console.error(`Error checking role ${role.name}:`, error);
      }
    }
    
    console.log(`Account ${account} has no roles`);
    return "";
  } catch (error) {
    console.error("Error in checkRole:", error);
    return "";
  }
};

// For backward compatibility with ContractService
export const checkRoles = async (signer: ethers.Signer, account: string): Promise<Role[]> => {
  const contract = getContract(signer);
  const roles: { name: Role; getter: string }[] = [
    { name: "DEFAULT_ADMIN_ROLE", getter: "DEFAULT_ADMIN_ROLE" },
    { name: "ADMIN_ROLE", getter: "ADMIN_ROLE" },
    { name: "MERCHANT_ROLE", getter: "MERCHANT_ROLE" },
    { name: "RECYCLER_ROLE", getter: "RECYCLER_ROLE" },
    { name: "UPGRADER_ROLE", getter: "UPGRADER_ROLE" },
  ];

  const userRoles: Role[] = [];
  
  for (const role of roles) {
    try {
      const roleHash = await contract[role.getter]();
      console.log(`Checking role ${role.name} with hash ${roleHash}`);
      if (await contract.hasRole(roleHash, account)) {
        console.log(`Account ${account} has role ${role.name}`);
        userRoles.push(role.name);
      }
    } catch (error) {
      console.error(`Error checking role ${role.name}:`, error);
    }
  }
  
  if (userRoles.length === 0) {
    console.log(`Account ${account} has no roles`);
  } else {
    console.log(`Account ${account} has roles: ${userRoles.join(', ')}`);
  }
  
  return userRoles;
};