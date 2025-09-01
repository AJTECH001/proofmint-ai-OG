import React, { useState } from 'react';
import { useReceiptsByBuyer, useReceiptsByMerchant, useTokenBalance, useUserRoles } from '../../hooks/useContractQueries';
import { ReceiptList } from './ReceiptList';
import { TokenBalance } from './TokenBalance';
import { UserRoleBadge } from './UserRoleBadge';
import { KYCStatus } from './KYCStatus';
import { TransactionStatus } from './TransactionStatus';
import { TransactionStatus as TxStatus } from '../../types/contracts';
import { formatAddress } from '../../utils/formatters';

interface ContractDashboardProps {
  userAddress: `0x${string}`;
}

export const ContractDashboard: React.FC<ContractDashboardProps> = ({
  userAddress,
}) => {
  const [activeTab, setActiveTab] = useState<'buyer' | 'merchant'>('buyer');
  const [showTransactionStatus, setShowTransactionStatus] = useState(false);
  
  const { data: userRoles } = useUserRoles(userAddress);
  const { data: buyerReceipts, isLoading: buyerLoading } = useReceiptsByBuyer(userAddress);
  const { data: merchantReceipts, isLoading: merchantLoading } = useReceiptsByMerchant(userAddress);

  const canViewMerchantTab = userRoles?.hasMerchantRole || userRoles?.hasAdminRole;

  const handleTransfer = () => {
    setShowTransactionStatus(true);
    // Simulate transaction
    setTimeout(() => {
      setShowTransactionStatus(false);
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contract Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your ProofMint contracts and transactions
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Connected Address</div>
            <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
              {formatAddress(userAddress)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserRoleBadge address={userAddress} showAllRoles />
        </div>
      </div>

      {/* Transaction Status */}
      {showTransactionStatus && (
        <div className="mb-6">
          <TransactionStatus
            status={TxStatus.PENDING}
            message="Processing token transfer..."
          />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <TokenBalance 
          address={userAddress} 
          showTransferButton 
          onTransfer={handleTransfer}
        />
        <KYCStatus address={userAddress} showVerifyButton />
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
            {(buyerReceipts?.length || 0) + (merchantReceipts?.length || 0)}
          </div>
          <div className="text-sm text-gray-500">
            {buyerReceipts?.length || 0} as buyer, {merchantReceipts?.length || 0} as merchant
          </div>
        </div>
      </div>

      {/* Receipts Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('buyer')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'buyer'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Purchases
              {buyerReceipts && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {buyerReceipts.length}
                </span>
              )}
            </button>
            {canViewMerchantTab && (
              <button
                onClick={() => setActiveTab('merchant')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'merchant'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Sales
                {merchantReceipts && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {merchantReceipts.length}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'buyer' && (
            <ReceiptList
              receipts={buyerReceipts || []}
              loading={buyerLoading}
              emptyMessage="You haven't made any purchases yet"
            />
          )}
          {activeTab === 'merchant' && canViewMerchantTab && (
            <ReceiptList
              receipts={merchantReceipts || []}
              loading={merchantLoading}
              showActions={true}
              emptyMessage="You haven't made any sales yet"
            />
          )}
        </div>
      </div>
    </div>
  );
};