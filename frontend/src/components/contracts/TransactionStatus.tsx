import React from 'react';
import { TransactionStatus as TxStatus } from '../../types/contracts';
import { formatTransactionHash } from '../../utils/formatters';

interface TransactionStatusProps {
  status: TxStatus;
  hash?: `0x${string}`;
  message?: string;
  onRetry?: () => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  hash,
  message,
  onRetry,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case TxStatus.PENDING:
        return {
          color: 'bg-yellow-50 border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800',
          icon: (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          title: 'Transaction Pending',
          description: 'Your transaction is being processed...',
        };
      case TxStatus.SUCCESS:
      case TxStatus.CONFIRMED:
        return {
          color: 'bg-green-50 border-green-200',
          iconColor: 'text-green-600',
          textColor: 'text-green-800',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Transaction Successful',
          description: 'Your transaction has been confirmed on the blockchain.',
        };
      case TxStatus.FAILED:
        return {
          color: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          title: 'Transaction Failed',
          description: message || 'Your transaction could not be processed.',
        };
      default:
        return {
          color: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-800',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Transaction Status Unknown',
          description: 'Unable to determine transaction status.',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`rounded-xl p-4 border ${config.color}`}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${config.textColor}`}>
            {config.title}
          </h4>
          <p className={`text-sm mt-1 ${config.textColor} opacity-90`}>
            {config.description}
          </p>
          {hash && (
            <div className="mt-2">
              <span className={`text-xs ${config.textColor} opacity-75`}>
                Transaction Hash: {formatTransactionHash(hash)}
              </span>
            </div>
          )}
        </div>
        {status === TxStatus.FAILED && onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};