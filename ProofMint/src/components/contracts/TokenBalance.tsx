import React from 'react';
import { useTokenBalance, useTokenInfo } from '../../hooks/useContractQueries';
import { formatTokenAmount } from '../../utils/formatters';

interface TokenBalanceProps {
  address: `0x${string}`;
  showTransferButton?: boolean;
  onTransfer?: () => void;
}

export const TokenBalance: React.FC<TokenBalanceProps> = ({
  address,
  showTransferButton = false,
  onTransfer,
}) => {
  const { data: balance, isLoading: balanceLoading, error: balanceError } = useTokenBalance(address);
  const { data: tokenInfo, isLoading: infoLoading } = useTokenInfo();

  if (balanceLoading || infoLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  if (balanceError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-red-800 font-medium">Error loading token balance</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {tokenInfo?.name || 'Token'} Balance
          </h3>
          <p className="text-sm text-gray-500">
            {tokenInfo?.symbol || 'TOKEN'}
          </p>
        </div>
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {balance ? formatTokenAmount(balance, tokenInfo?.decimals || 18) : '0'}
        </div>
        <div className="text-sm text-gray-500">
          {tokenInfo?.symbol || 'TOKEN'}
        </div>
      </div>

      {showTransferButton && onTransfer && (
        <button
          onClick={onTransfer}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Transfer Tokens
        </button>
      )}
    </div>
  );
};