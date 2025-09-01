import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ProofMintService, Receipt } from "../../services/ProofMintService";
import { Receipt as ReceiptIcon, Plus, RefreshCw, AlertCircle, DollarSign, CheckCircle } from "lucide-react";

const MerchantDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Issue receipt form
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issuingReceipt, setIssuingReceipt] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    buyer: "",
    ipfsCID: "",
    productType: "",
    amount: "",
  });

  const ZG_TESTNET_ID = 16601;
  const isCorrectNetwork = chainId === ZG_TESTNET_ID;

  const loadReceipts = async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      const merchantReceipts = await ProofMintService.getMerchantReceipts(address);
      setReceipts(merchantReceipts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load receipts");
      console.error("Error loading merchant receipts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork && address) {
      loadReceipts();
    } else {
      setLoading(false);
    }
  }, [isConnected, isCorrectNetwork, address]);

  const handleIssueReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptForm.buyer || !receiptForm.ipfsCID || !receiptForm.productType || !receiptForm.amount) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setIssuingReceipt(true);
      const receiptId = await ProofMintService.issueReceipt(
        receiptForm.buyer,
        receiptForm.ipfsCID,
        receiptForm.productType,
        receiptForm.amount
      );
      
      alert(`Receipt issued successfully! Receipt ID: ${receiptId}`);
      setReceiptForm({ buyer: "", ipfsCID: "", productType: "", amount: "" });
      setShowIssueForm(false);
      await loadReceipts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to issue receipt");
    } finally {
      setIssuingReceipt(false);
    }
  };

  const handleMarkPaid = async (receiptId: bigint) => {
    try {
      await ProofMintService.markPaid(receiptId);
      alert("Receipt marked as paid successfully!");
      await loadReceipts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark as paid");
    }
  };

  const stats = {
    total: receipts.length,
    paid: receipts.filter(r => r.isPaid).length,
    unpaid: receipts.filter(r => !r.isPaid).length,
    totalAmount: receipts.reduce((sum, r) => sum + Number(ProofMintService.formatAmount(r.amount)), 0),
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Merchant Dashboard</h2>
          <p className="mb-6 text-gray-600">Connect your wallet to access merchant functions</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
              <p className="text-gray-600">Manage your receipts and transactions</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowIssueForm(!showIssueForm)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                Issue Receipt
              </button>
              <button
                onClick={loadReceipts}
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

        {/* Issue Receipt Form */}
        {showIssueForm && (
          <div className="mb-6 bg-white rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold mb-4">Issue New Receipt</h2>
            <form onSubmit={handleIssueReceipt} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buyer Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={receiptForm.buyer}
                    onChange={(e) => setReceiptForm({ ...receiptForm, buyer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.1"
                    value={receiptForm.amount}
                    onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Type
                  </label>
                  <input
                    type="text"
                    placeholder="ELECTRONICS"
                    value={receiptForm.productType}
                    onChange={(e) => setReceiptForm({ ...receiptForm, productType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IPFS CID
                  </label>
                  <input
                    type="text"
                    placeholder="Qm..."
                    value={receiptForm.ipfsCID}
                    onChange={(e) => setReceiptForm({ ...receiptForm, ipfsCID: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={issuingReceipt}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {issuingReceipt ? "Issuing..." : "Issue Receipt"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowIssueForm(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
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
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unpaid</p>
                    <p className="text-2xl font-semibold">{stats.unpaid}</p>
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
                    <p className="text-2xl font-semibold">{stats.totalAmount.toFixed(3)} ETH</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipts Table */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">Your Receipts</h2>
              {receipts.length === 0 ? (
                <div className="text-center py-8">
                  <ReceiptIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No receipts found</p>
                  <p className="text-sm text-gray-500 mt-2">Issue your first receipt to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Buyer</th>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipts.map((receipt) => (
                        <tr key={receipt.id.toString()} className="border-t">
                          <td className="px-4 py-2 font-mono">#{receipt.id.toString()}</td>
                          <td className="px-4 py-2 font-mono">
                            {ProofMintService.formatAddress(receipt.buyer)}
                          </td>
                          <td className="px-4 py-2">{receipt.productType}</td>
                          <td className="px-4 py-2">
                            {ProofMintService.formatAmount(receipt.amount)} ETH
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              {receipt.isPaid ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Paid</span>
                              ) : (
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
                          <td className="px-4 py-2">
                            {!receipt.isPaid && (
                              <button
                                onClick={() => handleMarkPaid(receipt.id)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Mark Paid
                              </button>
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

export default MerchantDashboard;