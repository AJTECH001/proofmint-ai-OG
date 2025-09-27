import React, { useState, useCallback } from 'react';
import { useIssueReceipt } from '../../hooks/useContractQueries';
import { useZeroGStorage } from '../../hooks/useZeroGStorage';
import { TransactionStatus } from './TransactionStatus';
import { FileUpload } from '../storage/FileUpload';
import { TransactionStatus as TxStatus, FileAttachment } from '../../types/contracts';
import { isAddress } from 'viem';
import { AlertCircle, Upload, Receipt, DollarSign } from 'lucide-react';

interface EnhancedIssueReceiptFormProps {
  onSuccess?: (receiptId: bigint, attachments?: FileAttachment[]) => void;
  onCancel?: () => void;
}

interface FormData {
  buyer: string;
  amount: string;
  description: string;
  category: 'electronics' | 'warranty' | 'service' | 'other';
  merchantNotes: string;
}

export const EnhancedIssueReceiptForm: React.FC<EnhancedIssueReceiptFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    buyer: '',
    amount: '',
    description: '',
    category: 'electronics',
    merchantNotes: '',
  });
  
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>(TxStatus.PENDING);
  const [currentStep, setCurrentStep] = useState<'form' | 'upload' | 'confirm'>('form');
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const issueReceiptMutation = useIssueReceipt();
  const { isConfigured: storageConfigured, error: storageError } = useZeroGStorage();

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.buyer.trim()) {
      newErrors.buyer = 'Buyer address is required';
    } else if (!isAddress(formData.buyer)) {
      newErrors.buyer = 'Invalid Ethereum address';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a valid positive number';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNext = () => {
    if (currentStep === 'form') {
      if (validateForm()) {
        setCurrentStep(storageConfigured ? 'upload' : 'confirm');
      }
    } else if (currentStep === 'upload') {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'upload') {
      setCurrentStep('form');
    } else if (currentStep === 'confirm') {
      setCurrentStep(storageConfigured ? 'upload' : 'form');
    }
  };

  const handleFileUpload = useCallback((result: { rootHash: string; metadata?: any }) => {
    if (result.metadata) {
      const attachment: FileAttachment = {
        id: result.rootHash,
        name: result.metadata.name,
        type: result.metadata.type,
        size: result.metadata.size,
        rootHash: result.rootHash,
        transactionHash: result.metadata.transactionHash,
        uploadedAt: result.metadata.uploadedAt,
        uploadedBy: '0x0000000000000000000000000000000000000000', // Would come from connected wallet
        isVerified: true
      };
      
      setAttachments(prev => [...prev, attachment]);
    }
  }, []);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setShowStatus(true);
      setTxStatus(TxStatus.PENDING);

      // Generate a mock IPFS CID for the main receipt data
      // In production, this would upload receipt metadata to IPFS or 0G Storage
      const receiptMetadata = {
        description: formData.description,
        category: formData.category,
        merchantNotes: formData.merchantNotes,
        attachments: attachments.map(a => a.rootHash),
        timestamp: Date.now()
      };

      // Mock IPFS CID - in production this would be real
      const mockCID = `0x${Buffer.from(JSON.stringify(receiptMetadata)).toString('hex').padStart(64, '0')}`;

      const result = await issueReceiptMutation.mutateAsync({
        buyer: formData.buyer as `0x${string}`,
        ipfsCID: mockCID as `0x${string}`,
        amount: BigInt(Math.floor(parseFloat(formData.amount) * 1e18)), // Convert to wei
      });

      if (result.success && result.receiptId) {
        setTxStatus(TxStatus.SUCCESS);
        setTimeout(() => {
          setShowStatus(false);
          onSuccess?.(result.receiptId!, attachments);
        }, 2000);
      } else {
        setTxStatus(TxStatus.FAILED);
      }
    } catch (error) {
      console.error('Receipt issuance failed:', error);
      setTxStatus(TxStatus.FAILED);
    }
  };

  const renderFormStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Receipt className="h-5 w-5 mr-2 text-green-600" />
          Receipt Details
        </h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buyer Address *
        </label>
        <input
          type="text"
          value={formData.buyer}
          onChange={(e) => handleInputChange('buyer', e.target.value)}
          placeholder="0x..."
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
            errors.buyer ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.buyer && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.buyer}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount (ETH) *
        </label>
        <div className="relative">
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.amount ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.amount}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="iPhone 15 Pro, Samsung Galaxy, etc."
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.description}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="electronics">Electronics</option>
          <option value="warranty">Warranty Service</option>
          <option value="service">Service/Repair</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Merchant Notes (Optional)
        </label>
        <textarea
          value={formData.merchantNotes}
          onChange={(e) => handleInputChange('merchantNotes', e.target.value)}
          placeholder="Additional notes, warranty terms, etc."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Upload className="h-5 w-5 mr-2 text-green-600" />
          Upload Receipt Documents
        </h3>
        <p className="text-gray-600 text-sm">
          Upload invoice, warranty documents, product images, or any other supporting files to 0G Storage
        </p>
      </div>

      {storageError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-yellow-800">Storage Warning</h4>
              <p className="text-sm text-yellow-700 mt-1">{storageError}</p>
              <p className="text-sm text-yellow-700 mt-1">You can still issue the receipt without file attachments.</p>
            </div>
          </div>
        </div>
      )}

      <FileUpload
        receiptId={`pending-${Date.now()}`}
        onUploadSuccess={handleFileUpload}
        maxFiles={5}
        showPreview={true}
      />

      {attachments.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>{attachments.length}</strong> file{attachments.length > 1 ? 's' : ''} ready to be associated with this receipt
          </p>
        </div>
      )}
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Confirm Receipt Details
        </h3>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Buyer</label>
            <p className="text-sm font-mono">{formData.buyer}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Amount</label>
            <p className="text-sm">{formData.amount} ETH</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Description</label>
            <p className="text-sm">{formData.description}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Category</label>
            <p className="text-sm capitalize">{formData.category}</p>
          </div>
        </div>

        {formData.merchantNotes && (
          <div>
            <label className="text-sm font-medium text-gray-500">Notes</label>
            <p className="text-sm">{formData.merchantNotes}</p>
          </div>
        )}

        {attachments.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-500">Attachments ({attachments.length})</label>
            <div className="mt-2 space-y-1">
              {attachments.map((file) => (
                <p key={file.id} className="text-sm text-green-600">
                  📎 {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        {/* Form Step */}
        <div className={`flex items-center ${currentStep === 'form' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
            currentStep === 'form' ? 'border-green-600 bg-green-50' : 'border-gray-300'
          }`}>
            1
          </div>
          <span className="ml-2 text-sm font-medium">Details</span>
        </div>

        <div className="w-8 h-0.5 bg-gray-300"></div>

        {/* Upload Step */}
        <div className={`flex items-center ${
          currentStep === 'upload' ? 'text-green-600' : 
          ['confirm'].includes(currentStep) ? 'text-green-600' : 'text-gray-400'
        }`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
            currentStep === 'upload' ? 'border-green-600 bg-green-50' : 
            ['confirm'].includes(currentStep) ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'
          }`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium">Upload</span>
        </div>

        <div className="w-8 h-0.5 bg-gray-300"></div>

        {/* Confirm Step */}
        <div className={`flex items-center ${currentStep === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
            currentStep === 'confirm' ? 'border-green-600 bg-green-50' : 'border-gray-300'
          }`}>
            3
          </div>
          <span className="ml-2 text-sm font-medium">Confirm</span>
        </div>
      </div>
    </div>
  );

  if (showStatus) {
    return (
      <div className="p-6">
        <TransactionStatus
          status={txStatus}
          message={
            txStatus === TxStatus.PENDING ? 'Issuing receipt...' :
            txStatus === TxStatus.SUCCESS ? 'Receipt issued successfully!' :
            'Failed to issue receipt'
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {renderStepIndicator()}

      {currentStep === 'form' && renderFormStep()}
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'confirm' && renderConfirmStep()}

      {/* Actions */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <div>
          {currentStep !== 'form' && (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          {currentStep === 'confirm' ? (
            <button
              onClick={handleSubmit}
              disabled={issueReceiptMutation.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {issueReceiptMutation.isPending ? 'Issuing...' : 'Issue Receipt'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};