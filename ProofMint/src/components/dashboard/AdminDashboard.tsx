import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useProofMint } from "../../hooks/useProofMint";
import { useUserRoles } from "../../hooks/useContractQueries";
import { ReceiptList } from "../contracts/ReceiptList";
import { UserRoleBadge } from "../contracts/UserRoleBadge";
import { formatAddress } from "../../utils/formatters";
import { isAddress } from "viem";

const AdminDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  // Removed switchChain since we only support 0G network
  const { isAdmin } = useProofMint();
  const [merchants, setMerchants] = useState<string[]>([]);
  const [newMerchant, setNewMerchant] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // 0G Testnet chain ID
  const ZG_TESTNET_ID = 16601;

  // Validate address safely
  const accountAddress = address && isAddress(address) ? address : undefined;

  // Only call hook if address is valid
  const { data: userRoles, error: rolesError } = useUserRoles(accountAddress);

  // Check if user is on correct network
  const isCorrectNetwork = chainId === ZG_TESTNET_ID;

  useEffect(() => {
    if (chainId && chainId !== ZG_TESTNET_ID) {
      setNetworkError("This application only works on 0G Testnet. Please add 0G Testnet to your wallet.");
    } else {
      setNetworkError(null);
    }
  }, [chainId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !accountAddress || !isCorrectNetwork) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(null);
      
      try {
        const isAdminUser = await isAdmin();
        
        if (!isAdminUser && !userRoles?.hasAdminRole) {
          setLoading(false);
          return;
        }

        // Mock merchant data for now until contract methods are implemented
        const mockMerchants = ['0x742d35Cc6634C0532925a3b8D0Ac6bc4Cb4C0C'];
        setMerchants(mockMerchants);
        setReceipts([]);
      } catch (error) {
        console.error("Error fetching data:", error);
        setFetchError("Failed to fetch data from 0G network");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountAddress, isConnected, isCorrectNetwork]);

  const handleAddMerchant = async () => {
    if (!newMerchant || !isAddress(newMerchant)) {
      alert("Please enter a valid Ethereum address.");
      return;
    }

    try {
      // Mock add merchant functionality
      setMerchants(prev => [...new Set([...prev, newMerchant as `0x${string}`])]);
      setNewMerchant("");
      alert("Merchant added successfully on 0G network");
    } catch (error) {
      console.error("Error adding merchant:", error);
      alert("Failed to add merchant on 0G network");
    }
  };

  const handleAddNetworkToWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x40D9', // 16601 in hex
            chainName: '0G Testnet',
            nativeCurrency: {
              name: '0G',
              symbol: 'OG',
              decimals: 18,
            },
            rpcUrls: ['https://evmrpc-testnet.0g.ai'],
            blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
          }],
        });
      } catch (error) {
        console.error('Failed to add 0G network:', error);
        alert('Failed to add 0G network to wallet');
      }
    } else {
      alert('Please install a Web3 wallet like MetaMask');
    }
  };

  if (!isConnected || !accountAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="mb-2">Connect your wallet to the 0G Testnet</p>
        <p className="text-sm text-gray-500 mb-6">Network: 0G Testnet</p>
        <ConnectButton />
      </div>
    );
  }

  // Show network error if not on 0G testnet
  if (networkError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Unsupported Network</h1>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-orange-800 mb-4">{networkError}</p>
          <p className="text-sm text-gray-600 mb-4">
            Detected network: {chainId ? `Chain ID ${chainId}` : 'Unknown'}
            <br />
            Required: 0G Testnet only
          </p>
          <div className="space-y-2">
            <button
              onClick={handleAddNetworkToWallet}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Add 0G Testnet to Wallet
            </button>
            <p className="text-xs text-gray-500">
              After adding, manually switch to 0G Testnet in your wallet
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
          <span>Loading dashboard from 0G network...</span>
        </div>
      </div>
    );
  }

  if (!userRoles?.hasAdminRole) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You don't have admin privileges</p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left text-sm">
          <p className="text-gray-600">Network: 0G Testnet</p>
          <p className="text-gray-600">Address: {formatAddress(accountAddress)}</p>
          <p className="text-gray-600 mt-2">
            Roles: {JSON.stringify(userRoles)} | Error: {rolesError?.message || "None"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">0G Testnet</span>
          </div>
        </div>
        <div className="text-right">
          <UserRoleBadge address={accountAddress} />
          <p className="text-xs text-gray-500 mt-1">Chain ID: {chainId}</p>
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{fetchError}</p>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Add Merchant</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {showForm ? "Close" : "Add Merchant"}
          </button>
        </div>
        
        {showForm && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merchant Address
              </label>
              <input
                type="text"
                value={newMerchant}
                onChange={(e) => setNewMerchant(e.target.value)}
                placeholder="Enter merchant address (0x...)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleAddMerchant}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Add Merchant
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-6">
          Registered Merchants
        </h3>
        {merchants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No merchants registered yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {merchants.map(merchant => (
              <div key={merchant} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-semibold text-sm">M</span>
                  </div>
                  <span className="font-mono text-sm">{formatAddress(merchant)}</span>
                </div>
                <UserRoleBadge address={merchant as `0x${string}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-6">
          Receipts Overview
        </h3>
        <ReceiptList
          receipts={receipts}
          loading={loading}
          emptyMessage="No receipts found"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">0G Network Information</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Network: 0G Testnet</p>
          <p>• Chain ID: {ZG_TESTNET_ID}</p>
          <p>• RPC: evmrpc-testnet.0g.ai</p>
          <p>• Explorer: <a href="https://chainscan-galileo.0g.ai" target="_blank" rel="noopener noreferrer" className="underline">chainscan-galileo.0g.ai</a></p>
          <p>• Currency: OG</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;