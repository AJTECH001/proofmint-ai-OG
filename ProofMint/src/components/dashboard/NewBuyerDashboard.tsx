import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ProofMintService, Receipt } from "../../services/ProofMintService";
import { Receipt as ReceiptIcon, RefreshCw, AlertCircle, Smartphone, Gift, Recycle } from "lucide-react";

const BuyerDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nfcKeyHash, setNfcKeyHash] = useState<string>("");
  
  // NFC linking form
  const [showNfcForm, setShowNfcForm] = useState(false);
  const [nfcPubKey, setNfcPubKey] = useState("");
  const [linkingNfc, setLinkingNfc] = useState(false);

  const ZG_TESTNET_ID = 16601;
  const isCorrectNetwork = chainId === ZG_TESTNET_ID;

  const loadData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      
      const [buyerReceipts, nfcHash] = await Promise.all([
        ProofMintService.getBuyerReceipts(address),
        ProofMintService.getNFCKeyHash(address),
      ]);
      
      setReceipts(buyerReceipts);
      setNfcKeyHash(nfcHash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      console.error("Error loading buyer data:", err);
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

  const handleLinkNFC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nfcPubKey.trim()) return;

    try {
      setLinkingNfc(true);
      await ProofMintService.linkNFC(nfcPubKey);
      setNfcPubKey("");
      setShowNfcForm(false);
      alert("NFC key linked successfully!");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to link NFC key");
    } finally {
      setLinkingNfc(false);
    }
  };

  const stats = {
    total: receipts.length,
    paid: receipts.filter(r => r.isPaid).length,
    unpaid: receipts.filter(r => !r.isPaid).length,
    recycled: receipts.filter(r => r.isRecycled).length,
    recyclable: receipts.filter(r => r.isPaid && !r.isRecycled).length,
    totalSpent: receipts
      .filter(r => r.isPaid)
      .reduce((sum, r) => sum + Number(ProofMintService.formatAmount(r.amount)), 0),
  };

  const hasNfcLinked = nfcKeyHash && nfcKeyHash !== "0x0000000000000000000000000000000000000000000000000000000000000000";

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Buyer Dashboard</h2>
          <p className="mb-6 text-gray-600">Connect your wallet to view your receipts</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
              <p className="text-gray-600">Your receipts and rewards</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowNfcForm(!showNfcForm)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Smartphone className="w-4 h-4" />
                {hasNfcLinked ? "NFC Linked" : "Link NFC"}
              </button>
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

        {/* NFC Linking Form */}
        {showNfcForm && !hasNfcLinked && (
          <div className="mb-6 bg-white rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold mb-4">Link NFC Device</h2>
            <p className="text-gray-600 mb-4">
              Link your NFC device to enable contactless receipt verification
            </p>
            <form onSubmit={handleLinkNFC} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NFC Public Key
                </label>
                <input
                  type="text"
                  placeholder="Enter your NFC public key"
                  value={nfcPubKey}
                  onChange={(e) => setNfcPubKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={linkingNfc}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {linkingNfc ? "Linking..." : "Link NFC"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNfcForm(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* NFC Status */}
        {hasNfcLinked && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">NFC Device Linked</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Key Hash: {nfcKeyHash.slice(0, 10)}...{nfcKeyHash.slice(-8)}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
                    <ReceiptIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Paid</p>
                    <p className="text-2xl font-semibold">{stats.paid}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <ReceiptIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unpaid</p>
                    <p className="text-2xl font-semibold">{stats.unpaid}</p>
                  </div>
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

              <div className="bg-white rounded-lg p-6 shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <Gift className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-semibold">{stats.totalSpent.toFixed(3)} ETH</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recyclable Items Alert */}
            {stats.recyclable > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Recycle className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-800 font-medium">
                    You have {stats.recyclable} item(s) ready for recycling!
                  </span>
                </div>
                <p className="text-emerald-700 text-sm mt-1">
                  Contact a recycler to process your paid receipts and earn rewards.
                </p>
              </div>
            )}

            {/* Receipts Table */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">Your Purchase History</h2>
              {receipts.length === 0 ? (
                <div className="text-center py-8">
                  <ReceiptIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No receipts found</p>
                  <p className="text-sm text-gray-500 mt-2">Your purchase history will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Merchant</th>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Reward</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipts.map((receipt) => (
                        <tr key={receipt.id.toString()} className="border-t">
                          <td className="px-4 py-2 font-mono">#{receipt.id.toString()}</td>
                          <td className="px-4 py-2 font-mono">
                            {ProofMintService.formatAddress(receipt.merchant)}
                          </td>
                          <td className="px-4 py-2">{receipt.productType}</td>
                          <td className="px-4 py-2">
                            {ProofMintService.formatAmount(receipt.amount)} ETH
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1 flex-wrap">
                              {receipt.isPaid ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Paid</span>
                              ) : (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Unpaid</span>
                              )}
                              {receipt.isRecycled && (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded">Recycled</span>
                              )}
                              {receipt.isPaid && !receipt.isRecycled && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Recyclable</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            {ProofMintService.formatDate(receipt.timestamp)}
                          </td>
                          <td className="px-4 py-2">
                            {receipt.isRecycled ? (
                              <span className="text-green-600 font-medium">10 PMT</span>
                            ) : receipt.isPaid ? (
                              <span className="text-blue-600">Pending</span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
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

export default BuyerDashboard;