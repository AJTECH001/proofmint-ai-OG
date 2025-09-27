import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ProofMintService, Receipt } from "../../services/ProofMintService";
import { Recycle, RefreshCw, AlertCircle, Award, DollarSign, CheckCircle } from "lucide-react";

const RecyclerDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [recycledReceipts, setRecycledReceipts] = useState<Receipt[]>([]);
  const [availableReceipts, setAvailableReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ZG_TESTNET_ID = 16601;
  const isCorrectNetwork = chainId === ZG_TESTNET_ID;

  const loadData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      
      const [recyclerReceipts, allReceipts] = await Promise.all([
        ProofMintService.getRecyclerReceipts(address),
        ProofMintService.getAllReceipts(0, 100),
      ]);
      
      // Filter receipts that are paid but not recycled
      const available = allReceipts.filter(r => r.isPaid && !r.isRecycled);
      
      setRecycledReceipts(recyclerReceipts);
      setAvailableReceipts(available);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      console.error("Error loading recycler data:", err);
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

  const handleMarkRecycled = async (receiptId: bigint) => {
    try {
      await ProofMintService.markRecycled(receiptId);
      alert("Receipt marked as recycled successfully! Rewards have been distributed.");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark as recycled");
    }
  };

  const stats = {
    totalRecycled: recycledReceipts.length,
    availableForRecycling: availableReceipts.length,
    totalRewards: recycledReceipts.length * 10, // 10 tokens per recycled item
    totalValue: recycledReceipts.reduce((sum, r) => 
      sum + Number(ProofMintService.formatAmount(r.amount)), 0
    ),
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Recycler Dashboard</h2>
          <p className="mb-6 text-gray-600">Connect your wallet to access recycler functions</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Recycler Dashboard</h1>
              <p className="text-gray-600">Process recyclable items and earn rewards</p>
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
                  <div className="p-3 rounded-full bg-emerald-100">
                    <Recycle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Items Recycled</p>
                    <p className="text-2xl font-semibold">{stats.totalRecycled}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available Items</p>
                    <p className="text-2xl font-semibold">{stats.availableForRecycling}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rewards Earned</p>
                    <p className="text-2xl font-semibold">{stats.totalRewards} PMT</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-2xl font-semibold">{stats.totalValue.toFixed(3)} ETH</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Available for Recycling */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">Available for Recycling</h2>
              {availableReceipts.length === 0 ? (
                <div className="text-center py-8">
                  <Recycle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No items available for recycling</p>
                  <p className="text-sm text-gray-500 mt-2">Check back later for new recyclable items</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Merchant</th>
                        <th className="px-4 py-2 text-left">Buyer</th>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableReceipts.map((receipt) => (
                        <tr key={receipt.id.toString()} className="border-t">
                          <td className="px-4 py-2 font-mono">#{receipt.id.toString()}</td>
                          <td className="px-4 py-2 font-mono">
                            {ProofMintService.formatAddress(receipt.merchant)}
                          </td>
                          <td className="px-4 py-2 font-mono">
                            {ProofMintService.formatAddress(receipt.buyer)}
                          </td>
                          <td className="px-4 py-2">{receipt.productType}</td>
                          <td className="px-4 py-2">
                            {ProofMintService.formatAmount(receipt.amount)} ETH
                          </td>
                          <td className="px-4 py-2">
                            {ProofMintService.formatDate(receipt.timestamp)}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleMarkRecycled(receipt.id)}
                              className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
                            >
                              Mark Recycled
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recycled Items */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">Your Recycled Items</h2>
              {recycledReceipts.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recycled items yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start recycling items to earn rewards</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Merchant</th>
                        <th className="px-4 py-2 text-left">Buyer</th>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Recycled Date</th>
                        <th className="px-4 py-2 text-left">Reward</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recycledReceipts.map((receipt) => (
                        <tr key={receipt.id.toString()} className="border-t">
                          <td className="px-4 py-2 font-mono">#{receipt.id.toString()}</td>
                          <td className="px-4 py-2 font-mono">
                            {ProofMintService.formatAddress(receipt.merchant)}
                          </td>
                          <td className="px-4 py-2 font-mono">
                            {ProofMintService.formatAddress(receipt.buyer)}
                          </td>
                          <td className="px-4 py-2">{receipt.productType}</td>
                          <td className="px-4 py-2">
                            {ProofMintService.formatAmount(receipt.amount)} ETH
                          </td>
                          <td className="px-4 py-2">
                            {receipt.recycledAt > 0n ? 
                              ProofMintService.formatDate(receipt.recycledAt) : 
                              "N/A"
                            }
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-green-600 font-medium">10 PMT</span>
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

export default RecyclerDashboard;