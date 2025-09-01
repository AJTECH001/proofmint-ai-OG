import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useProofMint } from "../../hooks/useProofMint";
import { useUserRoles, useReceiptsByMerchant } from "../../hooks/useContractQueries";
import { IssueReceiptForm } from "../contracts/IssueReceiptForm";
import { ReceiptList } from "../contracts/ReceiptList";
import { UserRoleBadge } from "../contracts/UserRoleBadge";
import { TokenBalance } from "../contracts/TokenBalance";
import { KYCStatus } from "../contracts/KYCStatus";
import { formatAddress } from "../../utils/formatters";
import { isAddress } from "viem";

const MerchantDashboard: React.FC = () => {
  const { address } = useAccount();
  const { isAdmin } = useProofMint();
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReceipts: 0,
    paidReceipts: 0,
    pendingReceipts: 0,
    totalRevenue: BigInt(0)
  });

  // Validate address safely
  const accountAddress = address && isAddress(address) ? address : undefined;

  // Get user roles and receipts
  const { data: userRoles } = useUserRoles(accountAddress);
  const { data: merchantReceipts, isLoading: receiptsLoading, refetch: refetchReceipts } = useReceiptsByMerchant(accountAddress);

  // Calculate stats when receipts change
  useEffect(() => {
    if (merchantReceipts) {
      const totalReceipts = merchantReceipts.length;
      const paidReceipts = merchantReceipts.filter(r => r.isPaid).length;
      const pendingReceipts = merchantReceipts.filter(r => !r.isPaid).length;
      const totalRevenue = merchantReceipts.reduce((sum, r) => sum + r.amount, BigInt(0));
      
      setStats({
        totalReceipts,
        paidReceipts,
        pendingReceipts,
        totalRevenue
      });
    }
    setLoading(receiptsLoading);
  }, [merchantReceipts, receiptsLoading]);

  const handleReceiptIssued = (receiptId: bigint) => {
    setShowIssueForm(false);
    refetchReceipts(); // Refresh the receipts list
  };

  const handleTransfer = () => {
    // Handle token transfer
    console.log("Transfer tokens");
  };

  if (!accountAddress) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Merchant Dashboard</h1>
        <p>Please connect your wallet to access the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Issue receipts and manage your sales on 0G Network
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Merchant Address</div>
            <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
              {formatAddress(accountAddress)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserRoleBadge address={accountAddress} showAllRoles />
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">0G Testnet</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Token Balance */}
        <TokenBalance 
          address={accountAddress} 
          showTransferButton 
          onTransfer={handleTransfer}
        />

        {/* KYC Status */}
        <KYCStatus address={accountAddress} showVerifyButton />

        {/* Total Receipts */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Total Receipts
              </h3>
              <p className="text-sm text-gray-500">All time</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? "..." : stats.totalReceipts}
          </div>
          <div className="text-sm text-gray-500">
            {stats.paidReceipts} paid, {stats.pendingReceipts} pending
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Total Revenue
              </h3>
              <p className="text-sm text-gray-500">From all receipts</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? "..." : (Number(stats.totalRevenue) / 1e18).toFixed(4)}
          </div>
          <div className="text-sm text-gray-500">OG</div>
        </div>
      </div>

      {/* Issue Receipt Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Issue New Receipt</h2>
          <button
            onClick={() => setShowIssueForm(!showIssueForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {showIssueForm ? "Cancel" : "Issue Receipt"}
          </button>
        </div>

        {showIssueForm && (
          <IssueReceiptForm
            onSuccess={handleReceiptIssued}
            onCancel={() => setShowIssueForm(false)}
          />
        )}
      </div>

      {/* Receipts Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Issued Receipts</h2>
          <p className="text-gray-600 mt-1">Manage and track your issued receipts</p>
        </div>

        <div className="p-6">
          <ReceiptList
            receipts={merchantReceipts || []}
            loading={loading}
            showActions={true}
            emptyMessage="You haven't issued any receipts yet"
          />
        </div>
      </div>

      {/* Network Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">0G Network Information</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Network: 0G Testnet</p>
          <p>• Chain ID: 16601</p>
          <p>• All transactions are processed on the 0G blockchain</p>
          <p>• NFT receipts are minted on 0G for fast, low-cost transactions</p>
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;