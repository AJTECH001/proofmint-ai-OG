import React, { useState } from 'react';
import { useIssueReceipt } from '../../hooks/useContractQueries';
import { TransactionStatus } from './TransactionStatus';
import { TransactionStatus as TxStatus } from '../../types/contracts';

interface IssueReceiptFormProps {
  onSuccess?: (receiptId: bigint) => void;
  onCancel?: () => void;
}

export const IssueReceiptForm: React.FC<IssueReceiptFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    buyer: '',
    ipfsCID: '',
    amount: '',
  });
  const [showStatus, setShowStatus] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>(TxStatus.PENDING);

  const issueReceiptMutation = useIssueReceipt();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.buyer || !formData.ipfsCID || !formData.amount) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setShowStatus(true);
      setTxStatus(TxStatus.PENDING);

      const result = await issueReceiptMutation.mutateAsync({
        buyer: formData.buyer as `0x${string}`,
        ipfsCID: formData.ipfsCID as `0x${string}`,
        amount: BigInt(parseFloat(formData.amount) * 1e18), // Convert to wei
      });

      if (result.success && result.receiptId) {
        setTxStatus(TxStatus.SUCCESS);
        setTimeout(() => {
          setShowStatus(false);
          onSuccess?.(result.receiptId!);
        }, 2000);
      } else {
        setTxStatus(TxStatus.FAILED);
      }
    } catch (error) {
      setTxStatus(TxStatus.FAILED);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (showStatus) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <TransactionStatus
          status={txStatus}
          message={txStatus === TxStatus.FAILED ? 'Failed to issue receipt' : undefined}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Issue New Receipt</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="buyer" className="block text-sm font-medium text-gray-700 mb-1">
            Buyer Address
          </label>
          <input
            type="text"
            id="buyer"
            value={formData.buyer}
            onChange={(e) => handleInputChange('buyer', e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div>
          <label htmlFor="ipfsCID" className="block text-sm font-medium text-gray-700 mb-1">
            IPFS CID
          </label>
          <input
            type="text"
            id="ipfsCID"
            value={formData.ipfsCID}
            onChange={(e) => handleInputChange('ipfsCID', e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (ETH)
          </label>
          <input
            type="number"
            id="amount"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="0.0"
            step="0.001"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={issueReceiptMutation.isPending}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {issueReceiptMutation.isPending ? 'Issuing...' : 'Issue Receipt'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};