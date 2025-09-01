import React from 'react';
import { Receipt } from '../../types/contracts';
import { formatAddress, formatTokenAmount, formatTimestamp, formatReceiptId, formatIPFSHash } from '../../utils/formatters';

interface ReceiptCardProps {
  receipt: Receipt;
  onMarkPaid?: (receiptId: bigint) => void;
  onMarkRecycled?: (receiptId: bigint) => void;
  showActions?: boolean;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({
  receipt,
  onMarkPaid,
  onMarkRecycled,
  showActions = false,
}) => {
  const getStatusColor = () => {
    if (receipt.isRecycled) return 'bg-purple-100 text-purple-800';
    if (receipt.isPaid) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = () => {
    if (receipt.isRecycled) return 'Recycled';
    if (receipt.isPaid) return 'Paid';
    return 'Pending';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Receipt {formatReceiptId(receipt.id)}
          </h3>
          <p className="text-sm text-gray-500">
            {formatTimestamp(receipt.timestamp)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Merchant:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatAddress(receipt.merchant)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Buyer:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatAddress(receipt.buyer)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatTokenAmount(receipt.amount)} ETH
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">IPFS Hash:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatIPFSHash(receipt.ipfsCID)}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          {!receipt.isPaid && onMarkPaid && (
            <button
              onClick={() => onMarkPaid(receipt.id)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Mark as Paid
            </button>
          )}
          {receipt.isPaid && !receipt.isRecycled && onMarkRecycled && (
            <button
              onClick={() => onMarkRecycled(receipt.id)}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Mark as Recycled
            </button>
          )}
        </div>
      )}
    </div>
  );
};