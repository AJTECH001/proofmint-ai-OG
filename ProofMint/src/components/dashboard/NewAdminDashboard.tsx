import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ProofMintService, Receipt, ReceiptStats } from "../../services/ProofMintService";
import { Receipt as ReceiptIcon, DollarSign, Recycle, Plus, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

const AdminDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [stats, setStats] = useState<ReceiptStats>({ total: 0, paid: 0, unpaid: 0, recycled: 0 });
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add merchant form
  const [showAddMerchant, setShowAddMerchant] = useState(false);
  const [newMerchantAddress, setNewMerchantAddress] = useState("");
  const [addingMerchant, setAddingMerchant] = useState(false);
  
  // Add recycler form
  const [showAddRecycler, setShowAddRecycler] = useState(false);
  const [newRecyclerAddress, setNewRecyclerAddress] = useState("");
  const [addingRecycler, setAddingRecycler] = useState(false);

  const [contractStats, setContractStats] = useState<{
    totalReceipts: number;
    kycVerifier: string;
    rewardToken: string;
  } | null>(null);

  const ZG_TESTNET_ID = 16601;
  const isCorrectNetwork = chainId === ZG_TESTNET_ID;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [receiptStats, allReceipts, contractInfo] = await Promise.all([
        ProofMintService.getReceiptStats(),
        ProofMintService.getAllReceipts(0, 20),
        ProofMintService.getContractStats(),
      ]);

      setStats(receiptStats);
      setReceipts(allReceipts);
      setContractStats(contractInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork && address) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isConnected, isCorrectNetwork, address]);

  const handleAddMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchantAddress.trim()) return;

    try {
      setAddingMerchant(true);
      await ProofMintService.addMerchant(newMerchantAddress);
      setNewMerchantAddress("");
      setShowAddMerchant(false);
      // Refresh data
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add merchant");
    } finally {
      setAddingMerchant(false);
    }
  };

  const handleAddRecycler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecyclerAddress.trim()) return;

    try {
      setAddingRecycler(true);
      await ProofMintService.addRecycler(newRecyclerAddress);
      setNewRecyclerAddress("");
      setShowAddRecycler(false);
      // Refresh data
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add recycler");
    } finally {
      setAddingRecycler(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
          <p className="mb-6 text-gray-600">Connect your wallet to access admin functions</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Wrong Network</h2>
          <p className="text-gray-600">Please switch to 0G Testnet (Chain ID: 16601)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage ProofMint system</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <ConnectButton />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <ReceiptIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                    <p className="text-2xl font-semibold">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Paid</p>
                    <p className="text-2xl font-semibold">{stats.paid}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow">
                <div className="p-3 rounded-full bg-yellow-100">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unpaid</p>
                  <p className="text-2xl font-semibold">{stats.unpaid}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-emerald-100">
                    <Recycle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Recycled</p>
                    <p className="text-2xl font-semibold">{stats.recycled}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Info */}
            {contractStats && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-lg font-semibold mb-4">Contract Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Receipts</p>
                    <p className="font-mono">{contractStats.totalReceipts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">KYC Verifier</p>
                    <p className="font-mono text-xs">{ProofMintService.formatAddress(contractStats.kycVerifier)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reward Token</p>
                    <p className="font-mono text-xs">{ProofMintService.formatAddress(contractStats.rewardToken)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add Merchant */}
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Merchants</h2>
                  <button
                    onClick={() => setShowAddMerchant(!showAddMerchant)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Merchant
                  </button>
                </div>

                {showAddMerchant && (
                  <form onSubmit={handleAddMerchant} className="mb-4 p-4 bg-gray-50 rounded">
                    <input
                      type="text"
                      placeholder="Merchant address (0x...)"
                      value={newMerchantAddress}
                      onChange={(e) => setNewMerchantAddress(e.target.value)}
                      className="w-full px-3 py-2 border rounded mb-3"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={addingMerchant}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {addingMerchant ? "Adding..." : "Add Merchant"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddMerchant(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                <p className="text-sm text-gray-600">Add new merchants to the system</p>
              </div>

              {/* Add Recycler */}
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Recyclers</h2>
                  <button
                    onClick={() => setShowAddRecycler(!showAddRecycler)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Recycler
                  </button>
                </div>

                {showAddRecycler && (
                  <form onSubmit={handleAddRecycler} className="mb-4 p-4 bg-gray-50 rounded">
                    <input
                      type="text"
                      placeholder="Recycler address (0x...)"
                      value={newRecyclerAddress}
                      onChange={(e) => setNewRecyclerAddress(e.target.value)}
                      className="w-full px-3 py-2 border rounded mb-3"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={addingRecycler}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {addingRecycler ? "Adding..." : "Add Recycler"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddRecycler(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                <p className="text-sm text-gray-600">Add new recyclers to the system</p>
              </div>
            </div>

            {/* Recent Receipts */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">Recent Receipts</h2>
              {receipts.length === 0 ? (
                <p className="text-gray-600">No receipts found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Merchant</th>
                        <th className="px-4 py-2 text-left">Buyer</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipts.map((receipt) => (
                        <tr key={receipt.id.toString()} className="border-t">
                          <td className="px-4 py-2 font-mono">#{receipt.id.toString()}</td>
                          <td className="px-4 py-2 font-mono">
                            {ProofMintService.formatAddress(receipt.merchant)}
                          </td>
                          <td className="px-4 py-2 font-mono">
                            {ProofMintService.formatAddress(receipt.buyer)}
                          </td>
                          <td className="px-4 py-2">
                            {ProofMintService.formatAmount(receipt.amount)} ETH
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              {receipt.isPaid && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Paid</span>
                              )}
                              {!receipt.isPaid && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Unpaid</span>
                              )}
                              {receipt.isRecycled && (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded">Recycled</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            {ProofMintService.formatDate(receipt.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;